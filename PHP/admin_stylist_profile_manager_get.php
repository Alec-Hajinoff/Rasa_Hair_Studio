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
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

if (! isset($_SESSION['id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized access. Please log in.']);
    exit;
}

$user_role = $_SESSION['role'] ?? 'customer';

if (! in_array(strtolower($user_role), ['admin'])) {
    echo json_encode(['status' => 'error', 'message' => 'Forbidden: Admin permissions required.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=rasa_hair_studio', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    $stylistStmt = $pdo->prepare(
        'SELECT id, name, profile_image_path, biography, experience, qualifications, is_active, created_at, updated_at
         FROM stylists
         ORDER BY created_at DESC, id DESC'
    );
    $stylistStmt->execute();
    $stylists = $stylistStmt->fetchAll();

    $certStmt = $pdo->prepare(
        'SELECT id, stylist_id, title, file_path, created_at, updated_at
         FROM stylist_certificates
         WHERE stylist_id = :stylist_id
         ORDER BY created_at ASC, id ASC'
    );

    foreach ($stylists as &$stylist) {
        $certStmt->execute([':stylist_id' => $stylist['id']]);
        $stylist['certificates'] = $certStmt->fetchAll();
    }
    unset($stylist);

    echo json_encode(['status' => 'success', 'stylists' => $stylists]);

} catch (PDOException $e) {
    file_put_contents('error_log.txt', $e->getMessage() . PHP_EOL, FILE_APPEND);
    echo json_encode(['status' => 'error', 'message' => 'Database error occurred.']);
}
