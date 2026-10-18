<?php
require_once 'session_config.php';

$allowed_origins = [
    'http://localhost:5173',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('HTTP/1.1 403 Forbidden');
    exit;
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
    exit;
}

if (! isset($_SESSION['id'])) {
    echo json_encode(['status' => 'unauthorized', 'message' => 'Unauthorized access. Please log in.']);
    exit;
}

$user_role = $_SESSION['role'] ?? 'customer';

if (! in_array(strtolower($user_role), ['admin'])) {
    echo json_encode(['status' => 'forbidden', 'message' => 'Forbidden: Admin permissions required.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (! isset($input['id']) || ! is_numeric($input['id'])) {
    echo json_encode(['status' => 'error', 'message' => 'A valid service ID is required.']);
    exit;
}

$id          = (int) $input['id'];
$title       = trim($input['title'] ?? '');
$description = trim($input['description'] ?? '');
$price_type  = trim($input['price_type'] ?? '');
$is_active   = isset($input['is_active']) ? (int) (bool) $input['is_active'] : 1;

if (empty($title)) {
    echo json_encode(['status' => 'error', 'message' => 'Service title is required.']);
    exit;
}

if (strlen($title) > 255) {
    echo json_encode(['status' => 'error', 'message' => 'Service title must not exceed 255 characters.']);
    exit;
}

if (empty($description)) {
    echo json_encode(['status' => 'error', 'message' => 'Service description is required.']);
    exit;
}

if (! in_array($price_type, ['fixed', 'from', 'consultation'], true)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid price type.']);
    exit;
}

$price = null;
if ($price_type === 'fixed' || $price_type === 'from') {
    if (! isset($input['price']) || $input['price'] === '' || $input['price'] === null) {
        echo json_encode(['status' => 'error', 'message' => 'A valid price is required for fixed or from price types.']);
        exit;
    }
    if (! is_numeric($input['price']) || (float) $input['price'] < 0) {
        echo json_encode(['status' => 'error', 'message' => 'Price must be a non-negative number.']);
        exit;
    }
    $price = (float) $input['price'];
}

try {

    $pdo = new PDO('mysql:host=localhost;dbname=rasa_hair_studio', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    $check = $pdo->prepare('SELECT id FROM services WHERE id = :id');
    $check->execute([':id' => $id]);
    if (! $check->fetch()) {
        echo json_encode(['status' => 'error', 'message' => 'Service not found.']);
        exit;
    }

    $sql = 'UPDATE services
            SET title = :title,
                description = :description,
                price_type = :price_type,
                price = :price,
                is_active = :is_active,
                updated_at = NOW()
            WHERE id = :id';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':title'       => $title,
        ':description' => $description,
        ':price_type'  => $price_type,
        ':price'       => $price,
        ':is_active'   => $is_active,
        ':id'          => $id,
    ]);

    echo json_encode(['status' => 'success', 'message' => 'Service updated successfully.']);

} catch (PDOException $e) {
    file_put_contents('error_log.txt', $e->getMessage() . PHP_EOL, FILE_APPEND);
    echo json_encode(['status' => 'error', 'message' => 'Failed to update the service.']);
} finally {
    $pdo = null;
}
