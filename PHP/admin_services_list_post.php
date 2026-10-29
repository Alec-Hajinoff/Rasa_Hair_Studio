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
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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

$input = json_decode(file_get_contents('php://input'), true);

if (! is_array($input)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON request.']);
    exit;
}

$action = $input['action'] ?? '';

if ($action !== 'delete') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid service action.']);
    exit;
}

if (! isset($input['id']) || ! filter_var($input['id'], FILTER_VALIDATE_INT) || (int) $input['id'] < 1) {
    echo json_encode(['status' => 'error', 'message' => 'A valid service ID is required.']);
    exit;
}

$id  = (int) $input['id'];
$pdo = null;

try {
    $pdo = new PDO('mysql:host=localhost;dbname=rasa_hair_studio', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    $delete = $pdo->prepare('DELETE FROM services WHERE id = :id');
    $delete->execute([':id' => $id]);

    if ($delete->rowCount() === 0) {
        echo json_encode(['status' => 'error', 'message' => 'Service not found.']);
        exit;
    }

    echo json_encode(['status' => 'success', 'message' => 'Service deleted successfully.']);
} catch (PDOException $e) {
    file_put_contents('error_log.txt', $e->getMessage() . PHP_EOL, FILE_APPEND);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to delete the service.',
    ]);
} finally {
    $pdo = null;
}
