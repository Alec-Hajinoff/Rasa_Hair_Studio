<?php

$allowed_origins = [
    'http://localhost:5173',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (! in_array($origin, $allowed_origins, true)) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode([
        'status'  => 'error',
        'message' => 'Origin not allowed.',
    ]);
    exit;
}

header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Invalid request method.',
    ]);
    exit;
}

require_once __DIR__ . '/session_config.php';

$checkoutUserId = isset($_SESSION['id'])
    ? (string) $_SESSION['id']
    : null;

$envPath = __DIR__ . '/../.env';

if (! is_file($envPath) || ! is_readable($envPath)) {
    error_log('shop_create_checkout_session.php: Project .env file is missing or unreadable.');
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Server configuration is unavailable.',
    ]);
    exit;
}

$envLines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

foreach ($envLines as $line) {
    $line = trim($line);

    if ($line === '' || str_starts_with($line, '#') || ! str_contains($line, '=')) {
        continue;
    }

    [$name, $value] = explode('=', $line, 2);
    $name           = trim($name);
    $value          = trim($value, " \t\n\r\0\x0B\"'");

    $_ENV[$name] = $value;
    putenv($name . '=' . $value);
}

$stripeSecretKey = $_ENV['STRIPE_SECRET_KEY'] ?? getenv('STRIPE_SECRET_KEY') ?: '';
$ngrokDomain     = rtrim(
    $_ENV['NGROK_DOMAIN'] ?? getenv('NGROK_DOMAIN') ?: '',
    '/',
);

if ($stripeSecretKey === '') {
    error_log('shop_create_checkout_session.php: STRIPE_SECRET_KEY is not configured.');
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Stripe is not configured on the server.',
    ]);
    exit;
}

if (! filter_var($ngrokDomain, FILTER_VALIDATE_URL)) {
    error_log('shop_create_checkout_session.php: NGROK_DOMAIN is missing or invalid.');
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'The checkout return URL is not configured on the server.',
    ]);
    exit;
}

$input          = json_decode(file_get_contents('php://input'), true);
$requestedItems = $input['items'] ?? null;

if (
    ! is_array($requestedItems) ||
    count($requestedItems) < 1 ||
    count($requestedItems) > 100
) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'The basket is empty or contains too many items.',
    ]);
    exit;
}

$quantitiesByProductId = [];

foreach ($requestedItems as $item) {
    $rawId       = $item['id'] ?? null;
    $rawQuantity = $item['quantity'] ?? null;

    if (
        filter_var($rawId, FILTER_VALIDATE_INT) === false ||
        (int) $rawId < 1 ||
        filter_var($rawQuantity, FILTER_VALIDATE_INT) === false ||
        (int) $rawQuantity < 1 ||
        (int) $rawQuantity > 99
    ) {
        http_response_code(400);
        echo json_encode([
            'status'  => 'error',
            'message' => 'The basket contains an invalid product or quantity.',
        ]);
        exit;
    }

    $productId = (int) $rawId;

    if (isset($quantitiesByProductId[$productId])) {
        http_response_code(400);
        echo json_encode([
            'status'  => 'error',
            'message' => 'The basket contains a duplicate product.',
        ]);
        exit;
    }

    $quantitiesByProductId[$productId] = (int) $rawQuantity;
}

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

    $productIds   = array_keys($quantitiesByProductId);
    $placeholders = implode(',', array_fill(0, count($productIds), '?'));

    $stmt = $pdo->prepare(
        "SELECT id, name, price_gbp
         FROM products
         WHERE is_active = 1 AND id IN ($placeholders)"
    );
    $stmt->execute($productIds);
    $products = $stmt->fetchAll();

    if (count($products) !== count($productIds)) {
        http_response_code(400);
        echo json_encode([
            'status'  => 'error',
            'message' => 'One or more basket products are unavailable.',
        ]);
        exit;
    }

    $lineItems = [];

    foreach ($products as $product) {
        $productId    = (int) $product['id'];
        $quantity     = $quantitiesByProductId[$productId];
        $priceInPence = (int) round(((float) $product['price_gbp']) * 100);

        if ($priceInPence < 1) {
            throw new RuntimeException('A product has an invalid price.');
        }

        $lineItems[] = [
            'price_data' => [
                'currency'     => 'gbp',
                'unit_amount'  => $priceInPence,
                'product_data' => [
                    'name'     => $product['name'],
                    'metadata' => [
                        'product_id' => (string) $productId,
                    ],
                ],
            ],
            'quantity'   => $quantity,
        ];
    }

    $checkoutData = [
        'mode'                        => 'payment',
        'success_url'                 =>
        $ngrokDomain .
        '/Rasa_Hair_Studio/PHP/success_redirect.php?session_id={CHECKOUT_SESSION_ID}',
        'cancel_url'                  =>
        $ngrokDomain .
        '/Rasa_Hair_Studio/PHP/cancel_redirect.php',
        'shipping_address_collection' => [
            'allowed_countries' => ['GB'],
        ],
        'line_items'                  => $lineItems,
    ];

    if ($checkoutUserId !== null && $checkoutUserId !== '') {
        $checkoutData['metadata'] = [
            'user_id' => $checkoutUserId,
        ];
    }

    $curl = curl_init('https://api.stripe.com/v1/checkout/sessions');
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query($checkoutData),
        CURLOPT_USERPWD        => $stripeSecretKey . ':',
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/x-www-form-urlencoded',
        ],
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT        => 30,
    ]);

    $stripeResponse = curl_exec($curl);
    $curlError      = curl_error($curl);
    $stripeHttpCode = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    if ($stripeResponse === false) {
        error_log('shop_create_checkout_session.php: Stripe request failed: ' . $curlError);
        http_response_code(502);
        echo json_encode([
            'status'  => 'error',
            'message' => 'Could not connect to the payment provider.',
        ]);
        exit;
    }

    $stripeData = json_decode($stripeResponse, true);

    if (
        $stripeHttpCode < 200 ||
        $stripeHttpCode >= 300 ||
        empty($stripeData['url'])
    ) {
        error_log(
            'shop_create_checkout_session.php: Stripe API error: ' .
            ($stripeData['error']['message'] ?? 'Unknown Stripe error.')
        );
        http_response_code(502);
        echo json_encode([
            'status'  => 'error',
            'message' =>
            $stripeData['error']['message'] ??
            'Stripe could not start checkout.',
        ]);
        exit;
    }

    echo json_encode([
        'status'     => 'success',
        'url'        => $stripeData['url'],
        'session_id' => $stripeData['id'],
    ]);
} catch (Throwable $e) {
    error_log('shop_create_checkout_session.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Checkout could not be started.',
    ]);
}
