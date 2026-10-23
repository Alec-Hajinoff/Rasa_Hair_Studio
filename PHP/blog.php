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

$pdo = null;

try {

    $pdo = new PDO('mysql:host=localhost;dbname=rasa_hair_studio', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    $stmt = $pdo->query(
        'SELECT id, title, content, image_path, created_at, updated_at
         FROM blog_posts
         ORDER BY created_at DESC, id DESC'
    );

    echo json_encode([
        'status' => 'success',
        'posts'  => $stmt->fetchAll(),
    ]);
} catch (Throwable $e) {

    error_log('blog.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Unable to load blog posts.',
    ]);
} finally {
    $pdo = null;
}
