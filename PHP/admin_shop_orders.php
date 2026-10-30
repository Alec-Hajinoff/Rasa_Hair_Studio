<?php

require_once 'session_config.php';

$allowed_origins = [
    'http://localhost:5173',
    'https://rasalstudio.com',
    'https://www.rasalstudio.com',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? null;

if ($origin !== null && in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
} elseif ($origin === null) {

    // Allow same-origin and direct requests.

} else {
    header('HTTP/1.1 403 Forbidden');
    exit;
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

if (! isset($_SESSION['id'])) {
    http_response_code(401);

    echo json_encode([
        'status'  => 'error',
        'message' => 'Unauthorized access. Please log in.',
    ]);

    exit;
}

$user_role = $_SESSION['role'] ?? 'customer';

if (strtolower($user_role) !== 'admin') {
    http_response_code(403);

    echo json_encode([
        'status'  => 'error',
        'message' => 'Forbidden: Admin permissions required.',
    ]);

    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);

    echo json_encode([
        'status'  => 'error',
        'message' => 'Invalid request method.',
    ]);

    exit;
}

$config = parse_ini_file(__DIR__ . '/../.env', false, INI_SCANNER_RAW);

if ($config === false) {
    error_log('admin_shop_orders.php: Failed to parse .env file');

    http_response_code(500);

    echo json_encode([
        'status'  => 'error',
        'message' => 'Server configuration error.',
    ]);

    exit;
}

$dbHost     = $config['DB_HOST'] ?? '';
$dbName     = $config['DB_NAME'] ?? '';
$dbUser     = $config['DB_USER'] ?? '';
$dbPassword = $config['DB_PASSWORD'] ?? '';

if (
    $dbHost === '' ||
    $dbName === '' ||
    $dbUser === ''
) {
    error_log('admin_shop_orders.php: Database settings are missing from .env');

    http_response_code(500);

    echo json_encode([
        'status'  => 'error',
        'message' => 'Server configuration error.',
    ]);

    exit;
}

$pdo = null;

try {

    $pdo = new PDO(
        "mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4",
        $dbUser,
        $dbPassword,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );

    $stmt = $pdo->query(
        'SELECT
            t.id AS transaction_id,
            t.user_id,
            t.stripe_session_id,
            t.amount_total,
            t.shipping_amount,
            t.currency,
            t.payment_status,
            t.recipient_name,
            t.recipient_email,
            t.address_line1,
            t.address_line2,
            t.city,
            t.region,
            t.postcode,
            t.country,
            t.customer_order_email_sent_at,
            t.admin_order_email_sent_at,
            t.created_at AS transaction_created_at,
            ti.id AS item_id,
            ti.product_id,
            ti.product_name,
            ti.quantity,
            ti.unit_amount,
            ti.total_amount
         FROM transactions t
         LEFT JOIN transaction_items ti
             ON ti.transaction_id = t.id
         ORDER BY
             t.created_at DESC,
             t.id DESC,
             ti.id ASC'
    );

    $orders_by_id = [];

    while ($row = $stmt->fetch()) {

        $transaction_id = (int) $row['transaction_id'];

        if (! isset($orders_by_id[$transaction_id])) {

            $orders_by_id[$transaction_id] = [
                'id'                           => $transaction_id,
                'user_id'                      => $row['user_id'] === null ? null : (int) $row['user_id'],
                'stripe_session_id'            => $row['stripe_session_id'],
                'amount_total'                 => (int) $row['amount_total'],
                'shipping_amount'              => (int) $row['shipping_amount'],
                'currency'                     => $row['currency'],
                'payment_status'               => $row['payment_status'],
                'recipient_name'               => $row['recipient_name'],
                'recipient_email'              => $row['recipient_email'],
                'address_line1'                => $row['address_line1'],
                'address_line2'                => $row['address_line2'],
                'city'                         => $row['city'],
                'region'                       => $row['region'],
                'postcode'                     => $row['postcode'],
                'country'                      => $row['country'],
                'customer_order_email_sent_at' => $row['customer_order_email_sent_at'],
                'admin_order_email_sent_at'    => $row['admin_order_email_sent_at'],
                'created_at'                   => $row['transaction_created_at'],
                'items'                        => [],
            ];
        }

        if ($row['item_id'] !== null) {

            $orders_by_id[$transaction_id]['items'][] = [
                'id'           => (int) $row['item_id'],
                'product_id'   => $row['product_id'] === null
                    ? null
                    : (int) $row['product_id'],
                'product_name' => $row['product_name'],
                'quantity'     => (int) $row['quantity'],
                'unit_amount'  => (int) $row['unit_amount'],
                'total_amount' => (int) $row['total_amount'],
            ];
        }
    }

    echo json_encode([
        'status' => 'success',
        'orders' => array_values($orders_by_id),
    ]);

} catch (Throwable $e) {

    error_log(
        'admin_shop_orders.php: ' .
        $e->getMessage()
    );

    http_response_code(500);

    echo json_encode([
        'status'  => 'error',
        'message' => 'Shop orders could not be loaded.',
    ]);

} finally {

    $pdo = null;
}
