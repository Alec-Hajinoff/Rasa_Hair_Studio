<?php

require_once 'session_config.php';

$allowed_origins = [
    'http://localhost:5173',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('HTTP/1.1 403 Forbidden');
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
    echo json_encode([
        'status'  => 'error',
        'message' => 'Invalid request method.',
    ]);
    exit;
}

if (! isset($_SESSION['id'])) {
    echo json_encode([
        'status'  => 'unauthorized',
        'message' => 'Unauthorized access. Please log in.',
    ]);
    exit;
}

$user_role = $_SESSION['role'] ?? 'customer';

if (strtolower($user_role) !== 'admin') {
    echo json_encode([
        'status'  => 'forbidden',
        'message' => 'Forbidden: Admin permissions required.',
    ]);
    exit;
}

$config = parse_ini_file(__DIR__ . '/../.env', false, INI_SCANNER_RAW);

if ($config === false) {
    error_log('admin_services_list_get.php: Failed to parse .env file');

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
    error_log('admin_services_list_get.php: Database settings are missing from .env');

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

    $sql = '
        SELECT
            id,
            title,
            description,
            price_type,
            price,
            created_at,
            updated_at
        FROM services
        ORDER BY created_at DESC
    ';

    $stmt = $pdo->query($sql);

    $services = $stmt->fetchAll();

    foreach ($services as &$service) {

        $service['id'] = (int) $service['id'];

        $service['price'] = $service['price'] !== null
            ? (float) $service['price']
            : null;
    }

    unset($service);

    echo json_encode([
        'status'   => 'success',
        'services' => $services,
    ]);

} catch (PDOException $e) {

    file_put_contents(
        'error_log.txt',
        $e->getMessage() . PHP_EOL,
        FILE_APPEND
    );

    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to load services.',
    ]);

} finally {

    $pdo = null;
}
