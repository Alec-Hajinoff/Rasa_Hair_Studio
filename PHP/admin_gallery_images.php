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

if (! isset($_SESSION['id'])) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Unauthorized access. Please log in.',
    ]);
    exit;
}

$user_role = $_SESSION['role'] ?? 'customer';

if (! in_array(strtolower($user_role), ['admin'])) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Forbidden: Admin permissions required.',
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Invalid request method.',
    ]);
    exit;
}

if (
    ! isset($_FILES['images']) ||
    empty($_FILES['images']['name'][0])
) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'No images were uploaded.',
    ]);
    exit;
}

$config = parse_ini_file(__DIR__ . '/../.env', false, INI_SCANNER_RAW);

if ($config === false) {
    error_log('admin_gallery_images.php: Failed to parse .env file');

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
    error_log('admin_gallery_images.php: Required settings are missing from .env');

    echo json_encode([
        'status'  => 'error',
        'message' => 'Server configuration error.',
    ]);

    exit;
}

$uploadRoot = rtrim($uploadRoot, '/\\');

$uploadDir       = $uploadRoot . '/Rasa_Hair_Studio/uploads/image_gallery/';
$relativeWebPath = '/Rasa_Hair_Studio/uploads/image_gallery/';

$maxFileSize       = 2 * 1024 * 1024;
$allowedTypes      = ['image/jpeg', 'image/png'];
$allowedExtensions = ['jpg', 'jpeg', 'png'];

if (! is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$successes = [];
$errors    = [];

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

    $sql = '
        INSERT INTO gallery_images
        (
            title,
            image_path,
            created_at,
            updated_at
        )
        VALUES
        (
            :title,
            :image_path,
            NOW(),
            NOW()
        )
    ';

    $stmt = $pdo->prepare($sql);

    $fileCount = count($_FILES['images']['name']);

    for ($i = 0; $i < $fileCount; $i++) {

        $fileName    = $_FILES['images']['name'][$i];
        $fileTmpName = $_FILES['images']['tmp_name'][$i];
        $fileSize    = $_FILES['images']['size'][$i];
        $fileError   = $_FILES['images']['error'][$i];
        $fileType    = $_FILES['images']['type'][$i];

        $title = pathinfo($fileName, PATHINFO_FILENAME);
        $title = str_replace(['-', '_'], ' ', $title);
        $title = ucwords($title);

        if ($fileError !== UPLOAD_ERR_OK) {
            $errors[] = "Failed to upload $fileName. Error code: $fileError";
            continue;
        }

        if ($fileSize > $maxFileSize) {
            $errors[] = "$fileName exceeds the 2MB maximum file size.";
            continue;
        }

        $ext = strtolower(
            pathinfo($fileName, PATHINFO_EXTENSION)
        );

        if (
            ! in_array($ext, $allowedExtensions) ||
            ! in_array($fileType, $allowedTypes)
        ) {
            $errors[] =
                "$fileName is not a valid JPG or PNG file.";
            continue;
        }

        $destination = $uploadDir . $fileName;

        if (move_uploaded_file($fileTmpName, $destination)) {

            try {

                $stmt->execute([
                    ':title'      => $title,
                    ':image_path' => $relativeWebPath . $fileName,
                ]);

                $successes[] = $fileName;

            } catch (PDOException $e) {

                $errors[] =
                    "Database error while saving $fileName.";

                unlink($destination);
            }

        } else {

            $errors[] =
                "Failed to move $fileName to the upload directory.";
        }
    }

    $pdo->commit();

    if (count($successes) > 0 && count($errors) === 0) {

        echo json_encode([
            'status'  => 'success',
            'message' => count($successes) .
            ' image(s) uploaded successfully.',
        ]);

    } elseif (count($successes) > 0 && count($errors) > 0) {

        echo json_encode([
            'status'  => 'partial',
            'message' => count($successes) .
            ' image(s) uploaded successfully. The following failed: ' .
            implode(' ', $errors),
        ]);

    } else {

        echo json_encode([
            'status'  => 'error',
            'message' => 'Upload failed. ' .
            implode(' ', $errors),
        ]);
    }

} catch (PDOException $e) {

    if (isset($pdo) && $pdo->inTransaction()) {
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
