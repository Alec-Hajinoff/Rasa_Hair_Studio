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

if (! isset($_SESSION['id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized access. Please log in.']);
    exit;
}

$user_role = $_SESSION['role'] ?? 'customer';

if (! in_array(strtolower($user_role), ['admin'])) {
    echo json_encode(['status' => 'error', 'message' => 'Forbidden: Admin permissions required.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
    exit;
}

$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > 0 && empty($_POST) && empty($_FILES)) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'The upload was rejected by the server before it could be processed. '
        . 'This usually means the total request size exceeds the server limit. '
        . 'Please reduce the number or size of files (each file must be under 2MB).',
    ]);
    exit;
}

$imageUploadDir    = 'C:/xampp/htdocs/Rasa_Hair_Studio/uploads/stylist_images/';
$imageRelativePath = '/Rasa_Hair_Studio/uploads/stylist_images/';
$certUploadDir     = 'C:/xampp/htdocs/Rasa_Hair_Studio/uploads/stylist_certificates/';
$certRelativePath  = '/Rasa_Hair_Studio/uploads/stylist_certificates/';

$maxFileSize = 2 * 1024 * 1024;

$imageAllowedTypes      = ['image/jpeg', 'image/png'];
$imageAllowedExtensions = ['jpg', 'jpeg', 'png'];

$certAllowedTypes      = ['image/jpeg', 'image/png', 'application/pdf'];
$certAllowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];

function flatten_files(array $files)
{
    if (! isset($files['name'])) {
        return [];
    }
    if (! is_array($files['name'])) {
        return [$files];
    }
    $flat = [];
    foreach ($files['name'] as $i => $n) {
        $flat[] = [
            'name'     => $n,
            'tmp_name' => $files['tmp_name'][$i] ?? '',
            'size'     => $files['size'][$i] ?? 0,
            'error'    => $files['error'][$i] ?? UPLOAD_ERR_NO_FILE,
            'type'     => $files['type'][$i] ?? '',
        ];
    }
    return $flat;
}

function validate_upload(array $file, array $allowedExts, array $allowedTypes, int $maxSize, string $label)
{
    if (! isset($file['error'])) {
        return "$label was not received by the server.";
    }

    if ($file['error'] === UPLOAD_ERR_INI_SIZE || $file['error'] === UPLOAD_ERR_FORM_SIZE) {
        return "$label exceeds the server's upload limit. Files must be under 2MB.";
    }

    if ($file['error'] === UPLOAD_ERR_NO_FILE || ($file['name'] ?? '') === '') {
        return null;
    }

    if ($file['error'] !== UPLOAD_ERR_OK) {
        return "$label failed to upload (error code {$file['error']}).";
    }

    if ($file['size'] > $maxSize) {
        return "$label exceeds the 2MB maximum file size.";
    }

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (! in_array($ext, $allowedExts, true) || ! in_array($file['type'], $allowedTypes, true)) {
        return "$label is not an allowed file type.";
    }

    return null;
}

$name           = trim((string) ($_POST['name'] ?? ''));
$biography      = trim((string) ($_POST['biography'] ?? ''));
$experience     = trim((string) ($_POST['experience'] ?? ''));
$qualifications = trim((string) ($_POST['qualifications'] ?? ''));

$errors = [];

if ($name === '') {
    $errors[] = 'Stylist name is required.';
} elseif (mb_strlen($name) > 255) {
    $errors[] = 'Stylist name exceeds 255 characters.';
}

$profileImageFile = $_FILES['profile_image'] ?? null;
if (is_array($profileImageFile) && ($profileImageFile['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    $err = validate_upload(
        $profileImageFile,
        $imageAllowedExtensions,
        $imageAllowedTypes,
        $maxFileSize,
        'Profile image'
    );
    if ($err !== null) {
        $errors[] = $err;
    }
} else {
    $profileImageFile = null;
}

$validCerts = [];
$certInput  = $_FILES['certificates'] ?? null;

if (is_array($certInput)) {
    foreach (flatten_files($certInput) as $certFile) {
        if (($certFile['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE
            || ($certFile['name'] ?? '') === '') {
            continue;
        }
        $err = validate_upload(
            $certFile,
            $certAllowedExtensions,
            $certAllowedTypes,
            $maxFileSize,
            "Certificate '{$certFile['name']}'"
        );
        if ($err !== null) {
            $errors[] = $err;
            continue;
        }

        $title = pathinfo($certFile['name'], PATHINFO_FILENAME);
        $title = str_replace(['-', '_'], ' ', $title);
        $title = ucwords($title);

        $validCerts[] = ['title' => $title, 'file' => $certFile];
    }
}

$profileImageInvalid = false;
foreach ($errors as $e) {
    if (strpos($e, 'Profile image') === 0) {
        $profileImageInvalid = true;
        break;
    }
}
if ($profileImageInvalid) {
    echo json_encode(['status' => 'error', 'message' => implode(' ', $errors)]);
    exit;
}

if (! is_dir($imageUploadDir)) {
    mkdir($imageUploadDir, 0755, true);
}
if (! is_dir($certUploadDir)) {
    mkdir($certUploadDir, 0755, true);
}

$movedFiles = [];
$savedCerts = 0;

$saveErrors = [];

try {
    $pdo = new PDO('mysql:host=localhost;dbname=rasa_hair_studio', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    $pdo->beginTransaction();

    $profileImagePath = null;
    if ($profileImageFile !== null) {
        $ext      = strtolower(pathinfo($profileImageFile['name'], PATHINFO_EXTENSION));
        $safeName = 'stylist_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
        $dest     = $imageUploadDir . $safeName;

        if (! move_uploaded_file($profileImageFile['tmp_name'], $dest)) {
            throw new RuntimeException('Failed to save profile image.');
        }
        $movedFiles[]     = $dest;
        $profileImagePath = $imageRelativePath . $safeName;
    }

    $insertStylistSql = 'INSERT INTO stylists
        (name, profile_image_path, biography, experience, qualifications, created_at, updated_at)
        VALUES
        (:name, :profile_image_path, :biography, :experience, :qualifications, NOW(), NOW())';
    $pdo->prepare($insertStylistSql)->execute([
        ':name'               => $name,
        ':profile_image_path' => $profileImagePath,
        ':biography'          => $biography,
        ':experience'         => $experience,
        ':qualifications'     => $qualifications,
    ]);
    $stylistId = (int) $pdo->lastInsertId();

    if (! empty($validCerts)) {
        $insertCertSql = 'INSERT INTO stylist_certificates
            (stylist_id, title, file_path, created_at, updated_at)
            VALUES
            (:stylist_id, :title, :file_path, NOW(), NOW())';
        $certStmt = $pdo->prepare($insertCertSql);

        foreach ($validCerts as $cert) {
            $file     = $cert['file'];
            $ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $safeName = 'cert_' . $stylistId . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
            $dest     = $certUploadDir . $safeName;

            if (! move_uploaded_file($file['tmp_name'], $dest)) {
                $saveErrors[] = "Certificate '{$file['name']}': failed to save.";
                continue;
            }
            $movedFiles[] = $dest;

            try {
                $certStmt->execute([
                    ':stylist_id' => $stylistId,
                    ':title'      => $cert['title'],
                    ':file_path'  => $certRelativePath . $safeName,
                ]);
                $savedCerts++;
            } catch (PDOException $e) {
                $saveErrors[] = "Certificate '{$file['name']}': database error.";
                @unlink($dest);
                $movedFiles = array_values(array_filter($movedFiles, fn($f) => $f !== $dest));
            }
        }
    }

    $pdo->commit();

    if (! empty($saveErrors)) {
        echo json_encode([
            'status'             => 'partial',
            'message'            => "Stylist saved, $savedCerts certificate(s) uploaded. "
            . 'The following failed: ' . implode(' ', $saveErrors),
            'saved_certificates' => $savedCerts,
        ]);
    } else {
        echo json_encode([
            'status'             => 'success',
            'message'            => "Stylist saved, $savedCerts certificate(s) uploaded.",
            'saved_certificates' => $savedCerts,
        ]);
    }

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    foreach ($movedFiles as $f) {
        @unlink($f);
    }
    file_put_contents('error_log.txt', $e->getMessage() . PHP_EOL, FILE_APPEND);
    echo json_encode(['status' => 'error', 'message' => 'Database error occurred.']);

} catch (RuntimeException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    foreach ($movedFiles as $f) {
        @unlink($f);
    }
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);

} finally {
    $pdo = null;
}
