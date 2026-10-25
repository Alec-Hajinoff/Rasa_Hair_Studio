<?php

$allowed_origins = [
    'http://localhost:5173',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode([
        'status'  => 'error',
        'message' => 'Origin not allowed.',
    ]);
    exit;
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
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

    $stmt = $pdo->query(
        'SELECT id, name, description, price_gbp, image_path
         FROM products
         WHERE is_active = 1'
    );

    $products = array_map(
        static function (array $product): array {
            $product['id']        = (int) $product['id'];
            $product['price_gbp'] = (float) $product['price_gbp'];
            return $product;
        },
        $stmt->fetchAll()
    );

    echo json_encode([
        'status'   => 'success',
        'products' => $products,
    ]);
} catch (Throwable $e) {

    error_log('shop_get_products.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Products could not be loaded.',
    ]);
}
