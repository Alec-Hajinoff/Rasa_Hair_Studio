<?php

require_once 'session_config.php';

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
header('Access-Control-Allow-Methods: POST, OPTIONS');
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

$user_role = $_SESSION['role'] ?? 'customer';

if (! in_array(strtolower($user_role), ['admin'], true)) {
    http_response_code(403);

    echo json_encode([
        'status'  => 'error',
        'message' => 'Forbidden: Admin permissions required.',
    ]);

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

$title   = trim($_POST['title'] ?? '');
$content = trim($_POST['content'] ?? '');

if ($title === '' || $content === '') {
    http_response_code(400);

    echo json_encode([
        'status'  => 'error',
        'message' => 'Blog title and content are required.',
    ]);

    exit;
}

if (mb_strlen($title, 'UTF-8') > 255) {
    http_response_code(400);

    echo json_encode([
        'status'  => 'error',
        'message' => 'Blog title must be 255 characters or fewer.',
    ]);

    exit;
}

$config = parse_ini_file(__DIR__ . '/../.env', false, INI_SCANNER_RAW);

if ($config === false) {
    error_log('admin_blog_entry.php: Failed to parse .env file');

    http_response_code(500);

    echo json_encode([
        'status'  => 'error',
        'message' => 'Server configuration error.',
    ]);

    exit;
}

$uploadRoot = $config['UPLOAD_ROOT'] ?? '';

$dbHost     = $config['DB_HOST'] ?? '';
$dbName     = $config['DB_NAME'] ?? '';
$dbUser     = $config['DB_USER'] ?? '';
$dbPassword = $config['DB_PASSWORD'] ?? '';

if (
    $uploadRoot === '' ||
    $dbHost === '' ||
    $dbName === '' ||
    $dbUser === ''
) {
    error_log('admin_blog_entry.php: Required settings are missing from .env');

    http_response_code(500);

    echo json_encode([
        'status'  => 'error',
        'message' => 'Server configuration error.',
    ]);

    exit;
}

$uploadRoot = rtrim($uploadRoot, '/\\');

$uploadDir       = $uploadRoot . '/Rasa_Hair_Studio/uploads/blog_images/';
$relativeWebPath = '/Rasa_Hair_Studio/uploads/blog_images/';
$maxFileSize     = 2 * 1024 * 1024;

$imagePath   = null;
$destination = null;
$pdo         = null;

try {

    $hasImage =
    isset($_FILES['image']) &&
        $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE;

    if ($hasImage) {

        $file = $_FILES['image'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new RuntimeException(
                'The featured image upload failed.'
            );
        }

        if ($file['size'] <= 0 || $file['size'] > $maxFileSize) {
            throw new RuntimeException(
                'The featured image must be 2MB or smaller.'
            );
        }

        if (! is_uploaded_file($file['tmp_name'])) {
            throw new RuntimeException(
                'Invalid uploaded image.'
            );
        }

        $finfo    = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);

        $allowedMimeTypes = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
        ];

        $extension = strtolower(
            pathinfo($file['name'], PATHINFO_EXTENSION)
        );

        if (
            ! isset($allowedMimeTypes[$mimeType]) ||
            ! in_array($extension, ['jpg', 'jpeg', 'png'], true)
        ) {
            throw new RuntimeException(
                'The featured image must be a JPG or PNG file.'
            );
        }

        if (
            ! is_dir($uploadDir) &&
            ! mkdir($uploadDir, 0755, true) &&
            ! is_dir($uploadDir)
        ) {
            throw new RuntimeException(
                'The image upload directory could not be created.'
            );
        }

        $safeExtension = $allowedMimeTypes[$mimeType];
        $fileName      = bin2hex(random_bytes(16)) . '.' . $safeExtension;

        $destination = $uploadDir . $fileName;

        if (! move_uploaded_file($file['tmp_name'], $destination)) {
            throw new RuntimeException(
                'The featured image could not be stored.'
            );
        }

        $imagePath = $relativeWebPath . $fileName;
    }

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
        INSERT INTO blog_posts
        (
            title,
            content,
            image_path,
            created_at,
            updated_at
        )
        VALUES
        (
            :title,
            :content,
            :image_path,
            NOW(),
            NOW()
        )
    ';

    $stmt = $pdo->prepare($sql);

    $stmt->bindValue(':title', $title, PDO::PARAM_STR);
    $stmt->bindValue(':content', $content, PDO::PARAM_STR);

    if ($imagePath === null) {
        $stmt->bindValue(':image_path', null, PDO::PARAM_NULL);
    } else {
        $stmt->bindValue(':image_path', $imagePath, PDO::PARAM_STR);
    }

    $stmt->execute();

    echo json_encode([
        'status'  => 'success',
        'message' => 'Blog post saved successfully.',
        'id'      => (int) $pdo->lastInsertId(),
    ]);

} catch (RuntimeException $e) {

    if ($destination !== null && is_file($destination)) {
        unlink($destination);
    }

    http_response_code(400);

    echo json_encode([
        'status'  => 'error',
        'message' => $e->getMessage(),
    ]);

} catch (Throwable $e) {

    if ($destination !== null && is_file($destination)) {
        unlink($destination);
    }

    error_log('admin_blog_entry.php: ' . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        'status'  => 'error',
        'message' => 'The blog post could not be saved.',
    ]);

} finally {

    $pdo = null;
}
