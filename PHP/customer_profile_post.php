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
    echo json_encode([
        'status'  => 'error',
        'message' => 'Unauthorized access. Please log in.',
    ]);
    exit;
}

$user_id = $_SESSION['id'];

$input = json_decode(file_get_contents('php://input'), true);

$first_name = isset($input['first_name'])
    ? trim($input['first_name'])
    : null;

$surname = isset($input['surname'])
    ? trim($input['surname'])
    : null;

$phone = isset($input['phone'])
    ? trim($input['phone'])
    : null;

$config = parse_ini_file(__DIR__ . '/../.env', false, INI_SCANNER_RAW);

if ($config === false) {
    error_log('customer_profile_post.php: Failed to parse .env file');

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
    error_log('customer_profile_post.php: Database settings are missing from .env');

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

    $stmt = $pdo->prepare(
        'SELECT first_name, surname, phone
         FROM users
         WHERE id = :id'
    );

    $stmt->execute([
        ':id' => $user_id,
    ]);

    $currentUser = $stmt->fetch();

    if (! $currentUser) {

        echo json_encode([
            'status'  => 'error',
            'message' => 'User profile not found.',
        ]);

        exit;
    }

    $final_first_name =
    (
        $currentUser['first_name'] !== null &&
        ($first_name === '' || $first_name === null)
    )
        ? $currentUser['first_name']
        : ($first_name !== '' ? $first_name : null);

    $final_surname =
    (
        $currentUser['surname'] !== null &&
        ($surname === '' || $surname === null)
    )
        ? $currentUser['surname']
        : ($surname !== '' ? $surname : null);

    $final_phone =
    (
        $currentUser['phone'] !== null &&
        ($phone === '' || $phone === null)
    )
        ? $currentUser['phone']
        : ($phone !== '' ? $phone : null);

    $updateStmt = $pdo->prepare(
        '
        UPDATE users
        SET
            first_name = :first_name,
            surname = :surname,
            phone = :phone,
            updated_at = NOW()
        WHERE id = :id
        '
    );

    $updateStmt->execute([
        ':first_name' => $final_first_name,
        ':surname'    => $final_surname,
        ':phone'      => $final_phone,
        ':id'         => $user_id,
    ]);

    echo json_encode([
        'status'  => 'success',
        'message' => 'Profile updated successfully.',
        'user'    => [
            'first_name' => $final_first_name,
            'surname'    => $final_surname,
            'phone'      => $final_phone,
        ],
    ]);

} catch (PDOException $e) {

    file_put_contents(
        'error_log.txt',
        $e->getMessage() . PHP_EOL,
        FILE_APPEND
    );

    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to update profile.',
    ]);

} finally {

    $pdo = null;
}
