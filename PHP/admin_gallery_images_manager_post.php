<?php

require_once 'session_config.php';

$allowed_origins = [
    'http://localhost:5173',
    'https://rasalstudio.com',
    'https://www.rasalstudio.com',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? null;

if ($origin !== null && in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
} elseif ($origin === null) {

    // Allow same-origin and direct requests.

} else {
    header('HTTP/1.1 403 Forbidden');
    exit;
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Invalid request method.',
    ]);
    exit;
}

if (! isset($_SESSION['id'])) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Unauthorized access. Please log in.',
    ]);
    exit;
}

$user_role = $_SESSION['role'] ?? 'customer';

if (strtolower($user_role) !== 'admin') {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Forbidden: Admin permissions required.',
    ]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (! is_array($input)) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Invalid JSON request.',
    ]);
    exit;
}

$action = $input['action'] ?? '';

if ($action !== 'delete') {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Invalid image action.',
    ]);
    exit;
}

if (
    ! isset($input['id']) ||
    filter_var($input['id'], FILTER_VALIDATE_INT) === false ||
    (int) $input['id'] < 1
) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'A valid image ID is required.',
    ]);
    exit;
}

$id = (int) $input['id'];

$config = parse_ini_file(__DIR__ . '/../.env', false, INI_SCANNER_RAW);

if ($config === false) {
    error_log('admin_gallery_images_manager_post.php: Failed to parse .env file');

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
    error_log('admin_gallery_images_manager_post.php: Database settings are missing from .env');

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

    $pdo->beginTransaction();

    $find = $pdo->prepare(
        'SELECT image_path FROM gallery_images WHERE id = :id'
    );

    $find->execute([
        ':id' => $id,
    ]);

    $image = $find->fetch();

    if (! $image) {
        $pdo->rollBack();

        echo json_encode([
            'status'  => 'error',
            'message' => 'Image not found.',
        ]);

        exit;
    }

    $imagePath = $image['image_path'];

    $delete = $pdo->prepare(
        'DELETE FROM gallery_images WHERE id = :id'
    );

    $delete->execute([
        ':id' => $id,
    ]);

    $references = $pdo->prepare(
        'SELECT COUNT(*) FROM gallery_images WHERE image_path = :image_path'
    );

    $references->execute([
        ':image_path' => $imagePath,
    ]);

    $fileStillReferenced =
    (int) $references->fetchColumn() > 0;

    $pdo->commit();

    $fileCleanupSucceeded = true;

    if (! $fileStillReferenced) {

        $expectedWebPrefix = '/Rasa_Hair_Studio/uploads/image_gallery/';

        $uploadDirectory =
            realpath(__DIR__ . '/../uploads/image_gallery');

        if (
            $uploadDirectory !== false &&
            is_string($imagePath) &&
            strncmp(
                $imagePath,
                $expectedWebPrefix,
                strlen($expectedWebPrefix)
            ) === 0
        ) {

            $fileName = substr(
                $imagePath,
                strlen($expectedWebPrefix)
            );

            if (
                $fileName !== '' &&
                basename($fileName) === $fileName
            ) {

                $candidatePath =
                    $uploadDirectory .
                    DIRECTORY_SEPARATOR .
                    $fileName;

                $resolvedPath = realpath($candidatePath);

                if (
                    $resolvedPath !== false &&
                    strcasecmp(
                        dirname($resolvedPath),
                        $uploadDirectory
                    ) === 0 &&
                    is_file($resolvedPath) &&
                    ! unlink($resolvedPath)
                ) {
                    $fileCleanupSucceeded = false;
                }
            }
        }
    }

    if (! $fileCleanupSucceeded) {

        file_put_contents(
            'error_log.txt',
            'Could not remove unreferenced gallery image file: '
            . $imagePath
            . PHP_EOL,
            FILE_APPEND
        );
    }

    echo json_encode([
        'status'       => 'success',
        'message'      => 'Image deleted from the gallery.',
        'file_cleanup' => $fileCleanupSucceeded ? 'complete' : 'failed',
    ]);

} catch (PDOException $e) {

    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    file_put_contents(
        'error_log.txt',
        $e->getMessage() . PHP_EOL,
        FILE_APPEND
    );

    echo json_encode([
        'status'  => 'error',
        'message' => 'Database error occurred.',
    ]);

} finally {

    $pdo = null;
}
