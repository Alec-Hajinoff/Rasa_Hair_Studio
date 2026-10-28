<?php
require_once 'session_config.php';

$allowed_origins = ['http://localhost:5173'];
$origin          = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Origin not allowed.']);
    exit;
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Invalid request method.',
    ]);
    exit;
}

$pdo = null;

try {

    $pdo = new PDO(
        'mysql:host=localhost;dbname=rasa_hair_studio',
        'root',
        '',
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );

    $userCheck = $pdo->prepare(
        'SELECT id
         FROM users
         WHERE id = ? AND role_id = 4 AND is_deleted = 0'
    );
    $userCheck->execute([(int) $_SESSION['id']]);

    if (! $userCheck->fetch()) {
        http_response_code(403);
        echo json_encode([
            'status'  => 'error',
            'message' => 'Forbidden: Customer permissions required.',
        ]);
        exit;
    }

    $stmt = $pdo->prepare(
        'SELECT
            t.id AS transaction_id,
            t.user_id,
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
            t.created_at AS transaction_created_at,
            ti.id AS item_id,
            ti.product_id,
            ti.product_name,
            ti.quantity,
            ti.unit_amount,
            ti.total_amount
         FROM transactions t
         LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
         WHERE t.user_id = ?
         ORDER BY t.created_at DESC, t.id DESC, ti.id ASC'
    );
    $stmt->execute([(int) $_SESSION['id']]);

    $ordersById = [];

    while ($row = $stmt->fetch()) {
        $transactionId = (int) $row['transaction_id'];

        if (! isset($ordersById[$transactionId])) {
            $ordersById[$transactionId] = [
                'id'              => $transactionId,
                'amount_total'    => (int) $row['amount_total'],
                'shipping_amount' => (int) $row['shipping_amount'],
                'currency'        => $row['currency'],
                'payment_status'  => $row['payment_status'],
                'recipient_name'  => $row['recipient_name'],
                'recipient_email' => $row['recipient_email'],
                'address_line1'   => $row['address_line1'],
                'address_line2'   => $row['address_line2'],
                'city'            => $row['city'],
                'region'          => $row['region'],
                'postcode'        => $row['postcode'],
                'country'         => $row['country'],
                'created_at'      => $row['transaction_created_at'],
                'items'           => [],
            ];
        }

        if ($row['item_id'] !== null) {
            $ordersById[$transactionId]['items'][] = [
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
        'orders' => array_values($ordersById),
    ]);
} catch (Throwable $e) {
    error_log('customer_shop_orders.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Shop orders could not be loaded.',
    ]);
} finally {
    $pdo = null;
}
