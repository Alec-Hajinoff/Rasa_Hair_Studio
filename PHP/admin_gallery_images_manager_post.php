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
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON request.']);
    exit;
}

$action = $input['action'] ?? '';

if (! in_array($action, ['update', 'delete'], true)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid image action.']);
    exit;
}

if (
    ! isset($input['id']) ||
    filter_var($input['id'], FILTER_VALIDATE_INT) === false ||
    (int) $input['id'] < 1
) {
    echo json_encode(['status' => 'error', 'message' => 'A valid image ID is required.']);
    exit;
}

$id = (int) $input['id'];

$title = null;

if ($action === 'update') {
    if (! isset($input['title']) || ! is_string($input['title'])) {
        echo json_encode(['status' => 'error', 'message' => 'Image title is required.']);
        exit;
    }

    $title = trim($input['title']);

    if ($title === '') {
        echo json_encode(['status' => 'error', 'message' => 'Title cannot be empty.']);
        exit;
    }

    if (strlen($title) > 255) {
        echo json_encode(['status' => 'error', 'message' => 'Title must not exceed 255 characters.']);
        exit;
    }
}

$pdo = null;

try {
    $pdo = new PDO('mysql:host=localhost;dbname=rasa_hair_studio', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    if ($action === 'update') {

        $check = $pdo->prepare('SELECT id FROM gallery_images WHERE id = :id');
        $check->execute([':id' => $id]);

        if (! $check->fetch()) {
            echo json_encode(['status' => 'error', 'message' => 'Image not found.']);
            exit;
        }

        $stmt = $pdo->prepare(
            'UPDATE gallery_images
             SET title = :title, updated_at = NOW()
             WHERE id = :id'
        );
        $stmt->execute([
            ':title' => $title,
            ':id'    => $id,
        ]);

        echo json_encode(['status' => 'success', 'message' => 'Image title updated successfully.']);
        exit;
    }

    $pdo->beginTransaction();

    $find = $pdo->prepare('SELECT image_path FROM gallery_images WHERE id = :id');
    $find->execute([':id' => $id]);
    $image = $find->fetch();

    if (! $image) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => 'Image not found.']);
        exit;
    }

    $imagePath = $image['image_path'];

    $delete = $pdo->prepare('DELETE FROM gallery_images WHERE id = :id');
    $delete->execute([':id' => $id]);

    $references = $pdo->prepare(
        'SELECT COUNT(*) FROM gallery_images WHERE image_path = :image_path'
    );
    $references->execute([':image_path' => $imagePath]);
    $fileStillReferenced = (int) $references->fetchColumn() > 0;

    $pdo->commit();

    $fileCleanupSucceeded = true;

    if (! $fileStillReferenced) {
        $expectedWebPrefix = '/Rasa_Hair_Studio/uploads/image_gallery/';
        $uploadDirectory   = realpath(__DIR__ . '/../uploads/image_gallery');

        if (
            $uploadDirectory !== false &&
            is_string($imagePath) &&
            strncmp($imagePath, $expectedWebPrefix, strlen($expectedWebPrefix)) === 0
        ) {
            $fileName = substr($imagePath, strlen($expectedWebPrefix));

            if ($fileName !== '' && basename($fileName) === $fileName) {
                $candidatePath = $uploadDirectory . DIRECTORY_SEPARATOR . $fileName;
                $resolvedPath  = realpath($candidatePath);

                if (
                    $resolvedPath !== false &&
                    strcasecmp(dirname($resolvedPath), $uploadDirectory) === 0 &&
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
            'Could not remove unreferenced gallery image file: ' . $imagePath . PHP_EOL,
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

    file_put_contents('error_log.txt', $e->getMessage() . PHP_EOL, FILE_APPEND);
    echo json_encode(['status' => 'error', 'message' => 'Database error occurred.']);
} finally {
    $pdo = null;
}
