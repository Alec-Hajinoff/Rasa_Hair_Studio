<?php

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$allowedOrigins = [
    'http://localhost:5173',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (! in_array($origin, $allowedOrigins, true)) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Origin not allowed.',
    ]);
    exit;
}

header("Access-Control-Allow-Origin: $origin");
header('Vary: Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    http_response_code(405);
    header('Allow: GET, OPTIONS');
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method.',
    ]);
    exit;
}

$envPath = __DIR__ . '/../.env';

if (! is_file($envPath) || ! is_readable($envPath)) {
    error_log('delivery_charge_get.php: Project .env file is missing or unreadable.');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server configuration is unavailable.',
    ]);
    exit;
}

$config = parse_ini_file($envPath, false, INI_SCANNER_RAW);

if ($config === false) {
    error_log('delivery_charge_get.php: Could not parse the project .env file.');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server configuration is unavailable.',
    ]);
    exit;
}

$deliveryChargeRaw = trim(
    (string) ($config['DELIVERY_CHARGE_GBP'] ?? '')
);

if (! preg_match('/^\d+(?:\.\d{1,2})?$/', $deliveryChargeRaw)) {
    error_log('delivery_charge_get.php: DELIVERY_CHARGE_GBP is missing or invalid.');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Delivery charge configuration is invalid.',
    ]);
    exit;
}

$parts     = explode('.', $deliveryChargeRaw, 2);
$pounds    = (int) $parts[0];
$penceText = $parts[1] ?? '';
$penceText = str_pad($penceText, 2, '0');
$pence     = (int) substr($penceText, 0, 2);

$deliveryChargePence = ($pounds * 100) + $pence;

$deliveryChargeGbp = number_format(
    $deliveryChargePence / 100,
    2,
    '.',
    ''
);

echo json_encode([
    'success'               => true,
    'delivery_charge_gbp'   => $deliveryChargeGbp,
    'delivery_charge_pence' => $deliveryChargePence,
]);
