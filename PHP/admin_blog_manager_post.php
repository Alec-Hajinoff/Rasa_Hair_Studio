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
    echo json_encode(['status' => 'error', 'message' => 'Origin not allowed.']);
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
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized access. Please log in.']);
    exit;
}

$user_role = $_SESSION['role'] ?? 'customer';

if (! in_array(strtolower($user_role), ['admin'], true)) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden: Admin permissions required.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
    exit;
}

$requestData = json_decode(file_get_contents('php://input'), true);
$postId      = filter_var($requestData['id'] ?? null, FILTER_VALIDATE_INT);

if ($postId === false || $postId === null || $postId < 1) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'A valid blog post ID is required.']);
    exit;
}

$pdo = null;

try {

    $pdo = new PDO('mysql:host=localhost;dbname=rasa_hair_studio', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    $selectStmt = $pdo->prepare(
        'SELECT image_path FROM blog_posts WHERE id = :id'
    );
    $selectStmt->execute([':id' => $postId]);
    $post = $selectStmt->fetch();

    if (! $post) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Blog post not found.']);
        exit;
    }

    $deleteStmt = $pdo->prepare('DELETE FROM blog_posts WHERE id = :id');
    $deleteStmt->execute([':id' => $postId]);

    $imageDeleted = true;
    $imagePath    = $post['image_path'] ?? null;

    if ($imagePath !== null && $imagePath !== '') {
        $pathPattern = '#^/Rasa_Hair_Studio/uploads/blog_images/([a-f0-9]{32})\.(jpg|png)$#i';

        if (preg_match($pathPattern, $imagePath, $matches) !== 1) {
            $imageDeleted = false;
            error_log(
                'admin_blog_manager_post.php: Unexpected image_path for blog post ID ' . $postId
            );
        } else {
            $uploadDir         = 'C:/xampp/htdocs/Rasa_Hair_Studio/uploads/blog_images/';
            $uploadDirRealPath = realpath($uploadDir);

            if ($uploadDirRealPath === false) {

                $imageDeleted = false;
                error_log(
                    'admin_blog_manager_post.php: Blog image directory does not exist: ' . $uploadDir
                );
            } else {

                $fileName          = $matches[1] . '.' . strtolower($matches[2]);
                $imageFile         = $uploadDirRealPath . DIRECTORY_SEPARATOR . $fileName;
                $imageFileRealPath = realpath($imageFile);

                if ($imageFileRealPath === false) {
                    $imageDeleted = true;
                } else {
                    $resolvedDir        = strtolower(str_replace('\\', '/', rtrim($uploadDirRealPath, '\\/')));
                    $resolvedFile       = strtolower(str_replace('\\', '/', $imageFileRealPath));
                    $expectedFilePrefix = $resolvedDir . '/';

                    if (
                        strpos($resolvedFile, $expectedFilePrefix) !== 0 ||
                        ! is_file($imageFileRealPath)
                    ) {
                        $imageDeleted = false;
                        error_log(
                            'admin_blog_manager_post.php: Resolved image is outside the blog image directory for post ID ' . $postId
                        );
                    } elseif (! unlink($imageFileRealPath)) {

                        $imageDeleted = false;
                        error_log(
                            'admin_blog_manager_post.php: unlink failed for ' . $imageFileRealPath
                        );
                    }
                }
            }
        }
    }

    if ($imageDeleted) {
        echo json_encode([
            'status'        => 'success',
            'message'       => 'Blog post and featured image deleted successfully.',
            'image_deleted' => true,
        ]);
    } else {
        echo json_encode([
            'status'        => 'success',
            'message'       => 'Blog post deleted, but its featured image could not be removed. Check the PHP error log and upload folder permissions.',
            'image_deleted' => false,
        ]);
    }
} catch (Throwable $e) {

    error_log('admin_blog_manager_post.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'The blog post could not be deleted.']);
} finally {
    $pdo = null;
}
