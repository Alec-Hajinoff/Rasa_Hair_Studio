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

$name        = trim($_POST['name'] ?? '');
$description = trim($_POST['description'] ?? '');
$priceInput  = trim($_POST['price'] ?? '');

if ($name === '' || $priceInput === '') {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Product name and price are required.',
    ]);
    exit;
}

if (mb_strlen($name, 'UTF-8') > 255) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Product name must be 255 characters or fewer.',
    ]);
    exit;
}

if (! preg_match('/^\d{1,8}(?:\.\d{1,2})?$/', $priceInput)) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Enter a valid price with up to 2 decimal places.',
    ]);
    exit;
}

$price = number_format((float) $priceInput, 2, '.', '');

$config = parse_ini_file(__DIR__ . '/../.env', false, INI_SCANNER_RAW);
if ($config === false || empty($config['UPLOAD_ROOT'])) {
    error_log('admin_create_product.php: Failed to load UPLOAD_ROOT from .env');
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Server configuration error.',
    ]);
    exit;
}

$uploadRoot      = rtrim($config['UPLOAD_ROOT'], '/\\');
$uploadDir       = $uploadRoot . '/Rasa_Hair_Studio/uploads/product_images/';
$relativeWebPath = '/Rasa_Hair_Studio/uploads/product_images/';
$maxFileSize     = 2 * 1024 * 1024;

$imagePath   = null;
$destination = null;
$pdo         = null;

try {

    $hasImage = isset($_FILES['image'])
        && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE;

    if ($hasImage) {
        $file = $_FILES['image'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new RuntimeException('The product image upload failed.');
        }

        if ($file['size'] <= 0 || $file['size'] > $maxFileSize) {
            throw new RuntimeException('The product image must be 2MB or smaller.');
        }

        if (! is_uploaded_file($file['tmp_name'])) {
            throw new RuntimeException('Invalid uploaded image.');
        }

        $finfo    = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);

        $allowedMimeTypes = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
        ];
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

        if (
            ! isset($allowedMimeTypes[$mimeType]) ||
            ! in_array($extension, ['jpg', 'jpeg', 'png'], true)
        ) {
            throw new RuntimeException('The product image must be a JPG or PNG file.');
        }

        if (! is_dir($uploadDir) && ! mkdir($uploadDir, 0755, true) && ! is_dir($uploadDir)) {
            throw new RuntimeException('The product image directory could not be created.');
        }

        $safeExtension = $allowedMimeTypes[$mimeType];
        $fileName      = bin2hex(random_bytes(16)) . '.' . $safeExtension;
        $destination   = $uploadDir . $fileName;

        if (! move_uploaded_file($file['tmp_name'], $destination)) {
            throw new RuntimeException('The product image could not be stored.');
        }

        $imagePath = $relativeWebPath . $fileName;
    }

    $pdo = new PDO(
        'mysql:host=localhost;dbname=rasa_hair_studio',
        'root',
        '',
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );

    $sql = 'INSERT INTO products (name, description, price_gbp, image_path)
            VALUES (:name, :description, :price_gbp, :image_path)';
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':name', $name, PDO::PARAM_STR);

    if ($description === '') {
        $stmt->bindValue(':description', null, PDO::PARAM_NULL);
    } else {
        $stmt->bindValue(':description', $description, PDO::PARAM_STR);
    }

    $stmt->bindValue(':price_gbp', $price, PDO::PARAM_STR);

    if ($imagePath === null) {
        $stmt->bindValue(':image_path', null, PDO::PARAM_NULL);
    } else {
        $stmt->bindValue(':image_path', $imagePath, PDO::PARAM_STR);
    }

    $stmt->execute();

    echo json_encode([
        'status'  => 'success',
        'message' => 'Product saved successfully.',
        'id'      => (int) $pdo->lastInsertId(),
    ]);
} catch (RuntimeException $e) {

    if ($destination !== null && is_file($destination)) {
        unlink($destination);
    }

    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
} catch (Throwable $e) {

    if ($destination !== null && is_file($destination)) {
        unlink($destination);
    }

    error_log('admin_create_product.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'The product could not be saved.',
    ]);
} finally {
    $pdo = null;
}
