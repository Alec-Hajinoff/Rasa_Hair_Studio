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

$requestData = json_decode(file_get_contents('php://input'), true);

if (! is_array($requestData)) {
    http_response_code(400);

    echo json_encode([
        'status'  => 'error',
        'message' => 'A valid JSON request is required.',
    ]);

    exit;
}

$action = $requestData['action'] ?? 'delete';

if (! in_array($action, ['delete', 'set_status'], true)) {
    http_response_code(400);

    echo json_encode([
        'status'  => 'error',
        'message' => 'A valid product action is required.',
    ]);

    exit;
}

$productId = filter_var(
    $requestData['id'] ?? null,
    FILTER_VALIDATE_INT
);

if ($productId === false || $productId === null || $productId <= 0) {
    http_response_code(400);

    echo json_encode([
        'status'  => 'error',
        'message' => 'A valid product ID is required.',
    ]);

    exit;
}

$config = parse_ini_file(__DIR__ . '/../.env', false, INI_SCANNER_RAW);

if ($config === false) {
    error_log('admin_manage_products_post.php: Failed to parse .env file');

    http_response_code(500);

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

$uploadRoot = $config['UPLOAD_ROOT'] ?? '';

if (
    $dbHost === '' ||
    $dbName === '' ||
    $dbUser === ''
) {
    error_log('admin_manage_products_post.php: Database settings are missing from .env');

    http_response_code(500);

    echo json_encode([
        'status'  => 'error',
        'message' => 'Server configuration error.',
    ]);

    exit;
}

if ($action === 'set_status') {

    $isActive = $requestData['is_active'] ?? null;

    if (! in_array($isActive, [0, 1, '0', '1'], true)) {
        http_response_code(400);

        echo json_encode([
            'status'  => 'error',
            'message' => 'A valid stock status is required.',
        ]);

        exit;
    }

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

        $update = $pdo->prepare(
            'UPDATE products SET is_active = :is_active WHERE id = :id'
        );

        $update->bindValue(
            ':is_active',
            (int) $isActive,
            PDO::PARAM_INT
        );

        $update->bindValue(
            ':id',
            $productId,
            PDO::PARAM_INT
        );

        $update->execute();

        if ($update->rowCount() === 0) {

            $check = $pdo->prepare(
                'SELECT id FROM products WHERE id = :id'
            );

            $check->bindValue(
                ':id',
                $productId,
                PDO::PARAM_INT
            );

            $check->execute();

            if (! $check->fetch()) {
                http_response_code(404);

                echo json_encode([
                    'status'  => 'error',
                    'message' => 'Product not found.',
                ]);

                exit;
            }
        }

        echo json_encode([
            'status'    => 'success',
            'message'   => ((int) $isActive === 1)
                ? 'Product marked as in stock.'
                : 'Product marked as out of stock.',
            'is_active' => (int) $isActive,
        ]);

    } catch (Throwable $e) {

        error_log(
            'admin_manage_products_post.php status update: ' .
            $e->getMessage()
        );

        http_response_code(500);

        echo json_encode([
            'status'  => 'error',
            'message' => 'The product stock status could not be updated.',
        ]);

    } finally {

        $pdo = null;
    }

    exit;
}

if ($uploadRoot === '') {
    error_log('admin_manage_products_post.php: UPLOAD_ROOT is missing from .env');

    http_response_code(500);

    echo json_encode([
        'status'  => 'error',
        'message' => 'Server configuration error.',
    ]);

    exit;
}

$uploadRoot = rtrim($uploadRoot, '/\\');
$uploadDir  = $uploadRoot . '/Rasa_Hair_Studio/uploads/product_images/';
$webPrefix  = '/Rasa_Hair_Studio/uploads/product_images/';

$pdo                  = null;
$originalPath         = null;
$stagedPath           = null;
$transactionCommitted = false;

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

    $select = $pdo->prepare(
        'SELECT image_path FROM products WHERE id = :id FOR UPDATE'
    );

    $select->bindValue(':id', $productId, PDO::PARAM_INT);
    $select->execute();

    $product = $select->fetch();

    if (! $product) {

        $pdo->rollBack();

        http_response_code(404);

        echo json_encode([
            'status'  => 'error',
            'message' => 'Product not found.',
        ]);

        exit;
    }

    $imagePath = $product['image_path'];

    if ($imagePath !== null && $imagePath !== '') {

        if (strpos($imagePath, $webPrefix) !== 0) {
            throw new RuntimeException(
                'The product image path is invalid.'
            );
        }

        $fileName = substr(
            $imagePath,
            strlen($webPrefix)
        );

        if (
            $fileName === '' ||
            basename($fileName) !== $fileName
        ) {
            throw new RuntimeException(
                'The product image path is invalid.'
            );
        }

        $resolvedUploadDir = realpath($uploadDir);

        if ($resolvedUploadDir !== false) {

            $candidatePath =
                $resolvedUploadDir .
                DIRECTORY_SEPARATOR .
                $fileName;

            $resolvedFile = realpath($candidatePath);

            if (
                $resolvedFile !== false &&
                dirname($resolvedFile) === $resolvedUploadDir &&
                is_file($resolvedFile)
            ) {

                $originalPath = $resolvedFile;

                $stagedPath =
                $resolvedUploadDir .
                DIRECTORY_SEPARATOR .
                '.deleting-' .
                bin2hex(random_bytes(16));

                if (! rename($originalPath, $stagedPath)) {

                    throw new RuntimeException(
                        'The product image could not be staged for deletion.'
                    );
                }
            }
        }
    }

    $delete = $pdo->prepare(
        'DELETE FROM products WHERE id = :id'
    );

    $delete->bindValue(
        ':id',
        $productId,
        PDO::PARAM_INT
    );

    $delete->execute();

    $pdo->commit();

    $transactionCommitted = true;

    if (
        $stagedPath !== null &&
        is_file($stagedPath) &&
        ! unlink($stagedPath)
    ) {
        error_log(
            'admin_manage_products_post.php: Could not remove staged image ' .
            $stagedPath
        );
    }

    echo json_encode([
        'status'  => 'success',
        'message' => 'Product deleted successfully.',
    ]);

} catch (Throwable $e) {

    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    if (
        ! $transactionCommitted &&
        $stagedPath !== null &&
        $originalPath !== null &&
        is_file($stagedPath) &&
        ! file_exists($originalPath)
    ) {
        rename($stagedPath, $originalPath);
    }

    error_log(
        'admin_manage_products_post.php: ' .
        $e->getMessage()
    );

    http_response_code(500);

    echo json_encode([
        'status'  => 'error',
        'message' => 'The product could not be deleted.',
    ]);

} finally {

    $pdo = null;
}
