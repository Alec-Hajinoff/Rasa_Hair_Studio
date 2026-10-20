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

$maxFileSize            = 2 * 1024 * 1024;
$imageAllowedTypes      = ['image/jpeg', 'image/png'];
$imageAllowedExtensions = ['jpg', 'jpeg', 'png'];

$stylistId      = isset($_POST['id']) ? (int) $_POST['id'] : 0;
$name           = trim((string) ($_POST['name'] ?? ''));
$biography      = trim((string) ($_POST['biography'] ?? ''));
$experience     = trim((string) ($_POST['experience'] ?? ''));
$qualifications = trim((string) ($_POST['qualifications'] ?? ''));
$isActive       = (isset($_POST['is_active']) && (string) $_POST['is_active'] === '1') ? 1 : 0;

$certTitles = $_POST['cert_titles'] ?? [];
if (! is_array($certTitles)) {
    $certTitles = [];
}

$certDeleteIds = $_POST['cert_delete_ids'] ?? [];
if (! is_array($certDeleteIds)) {
    $certDeleteIds = [];
}
$certDeleteIds = array_values(array_filter(array_map('intval', $certDeleteIds), fn($v) => $v > 0));

$removeProfileImage = isset($_POST['remove_profile_image']) && (string) $_POST['remove_profile_image'] === '1';

$errors = [];

if ($stylistId <= 0) {
    $errors[] = 'Invalid stylist id.';
}
if ($name === '') {
    $errors[] = 'Stylist name is required.';
} elseif (mb_strlen($name) > 255) {
    $errors[] = 'Stylist name exceeds 255 characters.';
}

foreach ($certTitles as $cid => $title) {
    if (! is_numeric($cid) || (int) $cid <= 0) {
        $errors[] = 'Invalid certificate id in title update.';
        break;
    }
    if (mb_strlen(trim((string) $title)) === 0) {
        $errors[] = 'Certificate titles cannot be empty.';
        break;
    }
    if (mb_strlen(trim((string) $title)) > 255) {
        $errors[] = 'Certificate title exceeds 255 characters.';
        break;
    }
}

$profileImageFile = $_FILES['profile_image'] ?? null;
if (is_array($profileImageFile) && ($profileImageFile['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    if ($profileImageFile['error'] === UPLOAD_ERR_INI_SIZE || $profileImageFile['error'] === UPLOAD_ERR_FORM_SIZE) {
        $errors[] = 'Profile image exceeds the server\'s upload limit. Files must be under 2MB.';
    } elseif ($profileImageFile['error'] !== UPLOAD_ERR_OK) {
        $errors[] = "Profile image failed to upload (error code {$profileImageFile['error']}).";
    } elseif ($profileImageFile['size'] > $maxFileSize) {
        $errors[] = 'Profile image exceeds the 2MB maximum file size.';
    } else {
        $ext = strtolower(pathinfo($profileImageFile['name'], PATHINFO_EXTENSION));
        if (! in_array($ext, $imageAllowedExtensions, true) || ! in_array($profileImageFile['type'], $imageAllowedTypes, true)) {
            $errors[] = 'Profile image is not an allowed file type.';
        }
    }
} else {
    $profileImageFile = null;
}

if (! empty($errors)) {
    echo json_encode(['status' => 'error', 'message' => implode(' ', $errors)]);
    exit;
}

if (! is_dir($imageUploadDir)) {
    mkdir($imageUploadDir, 0755, true);
}
if (! is_dir($certUploadDir)) {
    mkdir($certUploadDir, 0755, true);
}

$newImageAbsolute = null;
$filesToDelete    = [];

try {
    $pdo = new PDO('mysql:host=localhost;dbname=rasa_hair_studio', 'root', '', [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    $checkStmt = $pdo->prepare('SELECT id, profile_image_path FROM stylists WHERE id = :id');
    $checkStmt->execute([':id' => $stylistId]);
    $existing = $checkStmt->fetch();
    if (! $existing) {
        echo json_encode(['status' => 'error', 'message' => 'Stylist not found.']);
        exit;
    }

    $pdo->beginTransaction();

    $newProfileImagePath = $existing['profile_image_path'];

    if ($profileImageFile !== null) {

        $ext      = strtolower(pathinfo($profileImageFile['name'], PATHINFO_EXTENSION));
        $safeName = 'stylist_' . $stylistId . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
        $dest     = $imageUploadDir . $safeName;

        if (! move_uploaded_file($profileImageFile['tmp_name'], $dest)) {
            throw new RuntimeException('Failed to save profile image.');
        }
        $newImageAbsolute    = $dest;
        $newProfileImagePath = $imageRelativePath . $safeName;

        if (! empty($existing['profile_image_path'])) {
            $oldAbsolute     = 'C:/xampp/htdocs' . $existing['profile_image_path'];
            $filesToDelete[] = $oldAbsolute;
        }
    } elseif ($removeProfileImage && ! empty($existing['profile_image_path'])) {
        $newProfileImagePath = null;
        $filesToDelete[]     = 'C:/xampp/htdocs' . $existing['profile_image_path'];
    }

    $updateSql = 'UPDATE stylists
        SET name = :name,
            biography = :biography,
            experience = :experience,
            qualifications = :qualifications,
            is_active = :is_active,
            profile_image_path = :profile_image_path,
            updated_at = NOW()
        WHERE id = :id';
    $pdo->prepare($updateSql)->execute([
        ':name'               => $name,
        ':biography'          => $biography,
        ':experience'         => $experience,
        ':qualifications'     => $qualifications,
        ':is_active'          => $isActive,
        ':profile_image_path' => $newProfileImagePath,
        ':id'                 => $stylistId,
    ]);

    if (! empty($certDeleteIds)) {

        $in  = implode(',', array_fill(0, count($certDeleteIds), '?'));
        $sel = $pdo->prepare("SELECT id, file_path FROM stylist_certificates WHERE stylist_id = ? AND id IN ($in)");
        $sel->execute(array_merge([$stylistId], $certDeleteIds));
        $rowsToDelete = $sel->fetchAll();

        foreach ($rowsToDelete as $row) {
            if (! empty($row['file_path'])) {
                $filesToDelete[] = 'C:/xampp/htdocs' . $row['file_path'];
            }
        }

        if (! empty($rowsToDelete)) {
            $ids = array_column($rowsToDelete, 'id');
            $in2 = implode(',', array_fill(0, count($ids), '?'));
            $del = $pdo->prepare("DELETE FROM stylist_certificates WHERE stylist_id = ? AND id IN ($in2)");
            $del->execute(array_merge([$stylistId], $ids));
        }
    }

    foreach ($certTitles as $cid => $title) {
        $cid = (int) $cid;
        if ($cid <= 0) {
            continue;
        }

        if (in_array($cid, $certDeleteIds, true)) {
            continue;
        }
        $upd = $pdo->prepare(
            'UPDATE stylist_certificates SET title = :title, updated_at = NOW() WHERE id = :id AND stylist_id = :sid'
        );
        $upd->execute([
            ':title' => trim((string) $title),
            ':id'    => $cid,
            ':sid'   => $stylistId,
        ]);
    }

    $pdo->commit();

    foreach ($filesToDelete as $path) {
        if (is_file($path)) {
            @unlink($path);
        }
    }

    echo json_encode(['status' => 'success', 'message' => 'Stylist updated.']);

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    if ($newImageAbsolute !== null && is_file($newImageAbsolute)) {
        @unlink($newImageAbsolute);
    }
    file_put_contents('error_log.txt', $e->getMessage() . PHP_EOL, FILE_APPEND);
    echo json_encode(['status' => 'error', 'message' => 'Database error occurred.']);

} catch (RuntimeException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if ($newImageAbsolute !== null && is_file($newImageAbsolute)) {
        @unlink($newImageAbsolute);
    }
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);

} finally {
    $pdo = null;
}
