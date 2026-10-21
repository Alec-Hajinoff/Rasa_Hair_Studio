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
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
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

$pdo = null;

try {
    $pdo = new PDO('mysql:host=localhost;dbname=rasa_hair_studio', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    $sql = 'SELECT id, title, description, price_type, price, created_at, updated_at
            FROM services
            ORDER BY created_at DESC';

    $stmt     = $pdo->query($sql);
    $services = $stmt->fetchAll();

    foreach ($services as &$service) {
        $service['id']    = (int) $service['id'];
        $service['price'] = $service['price'] !== null
            ? (float) $service['price']
            : null;
    }
    unset($service);

    echo json_encode(['status' => 'success', 'services' => $services]);
} catch (PDOException $e) {

    file_put_contents('error_log.txt', $e->getMessage() . PHP_EOL, FILE_APPEND);
    echo json_encode(['status' => 'error', 'message' => 'Failed to load services.']);
} finally {
    $pdo = null;
}
