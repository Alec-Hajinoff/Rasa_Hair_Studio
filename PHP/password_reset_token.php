<?php

require_once 'session_config.php';
require_once __DIR__ . '/../vendor/autoload.php';

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

$config = parse_ini_file(__DIR__ . '/../.env', false, INI_SCANNER_RAW);

if ($config === false) {
    error_log('password_reset_token.php: Failed to parse .env file');

    echo json_encode([
        'valid'   => false,
        'message' => 'Server configuration error',
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
    error_log('password_reset_token.php: Database settings are missing from .env');

    echo json_encode([
        'valid'   => false,
        'message' => 'Server configuration error',
    ]);

    exit;
}

try {

    $conn = new PDO(
        "mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4",
        $dbUser,
        $dbPassword
    );

    $conn->setAttribute(
        PDO::ATTR_ERRMODE,
        PDO::ERRMODE_EXCEPTION
    );

    $conn->setAttribute(
        PDO::ATTR_EMULATE_PREPARES,
        false
    );

} catch (PDOException $e) {

    error_log(
        'password_reset_token.php: Connection failed: ' .
        $e->getMessage()
    );

    echo json_encode([
        'valid'   => false,
        'message' => 'Database connection failed',
    ]);

    exit;
}

$input = json_decode(
    file_get_contents('php://input'),
    true
);

if ($input === null) {

    echo json_encode([
        'valid'   => false,
        'message' => 'Invalid request format',
    ]);

    exit;
}

$token = $input['token'] ?? '';

if (empty($token)) {

    echo json_encode([
        'valid'   => false,
        'message' => 'Token is required',
    ]);

    exit;
}

try {

    $sql = '
        SELECT id
        FROM users
        WHERE password_reset_token = :token
        AND password_token_expires_at > NOW()
        LIMIT 1
    ';

    $stmt = $conn->prepare($sql);

    $stmt->bindParam(':token', $token);

    $stmt->execute();

    if ($stmt->rowCount() > 0) {

        echo json_encode([
            'valid' => true,
        ]);

    } else {

        echo json_encode([
            'valid'   => false,
            'message' => 'This link may have expired or been used already. For your security, password reset links only work once and for a limited time.',
        ]);
    }

} catch (Exception $e) {

    error_log(
        'password_reset_token.php: Database Error: ' .
        $e->getMessage()
    );

    echo json_encode([
        'valid'   => false,
        'message' => 'An error occurred while verifying the token.',
    ]);

} finally {

    $conn = null;
}
