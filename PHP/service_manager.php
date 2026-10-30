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

$user_id   = $_SESSION['id'];
$user_role = $_SESSION['role'] ?? 'customer';

if (! in_array(strtolower($user_role), ['admin'])) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Forbidden: Admin permissions required.',
    ]);
    exit;
}

$input = json_decode(
    file_get_contents('php://input'),
    true
);

if (
    ! isset($input['services']) ||
    ! is_array($input['services']) ||
    empty($input['services'])
) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Please provide at least one service.',
    ]);
    exit;
}

$config = parse_ini_file(__DIR__ . '/../.env', false, INI_SCANNER_RAW);

if ($config === false) {
    error_log('service_manager.php: Failed to parse .env file');

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
    error_log('service_manager.php: Database settings are missing from .env');

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

    $sql = '
        INSERT INTO services
        (
            title,
            description,
            price_type,
            price,
            created_at,
            updated_at
        )
        VALUES
        (
            :title,
            :description,
            :price_type,
            :price,
            NOW(),
            NOW()
        )
    ';

    $stmt = $pdo->prepare($sql);

    foreach ($input['services'] as $service) {

        $title = trim(
            $service['title'] ?? ''
        );

        $description = trim(
            $service['description'] ?? ''
        );

        $price_type = trim(
            $service['price_type'] ?? ''
        );

        $price = null;

        if (
            $price_type === 'fixed' ||
            $price_type === 'from'
        ) {
            $price =
            isset($service['price']) &&
            $service['price'] !== ''
                ? (float) $service['price']
                : null;
        }

        if (
            empty($title) ||
            empty($description) ||
            ! in_array(
                $price_type,
                ['fixed', 'from', 'consultation']
            )
        ) {
            $pdo->rollBack();

            echo json_encode([
                'status'  => 'error',
                'message' => 'Each service requires a valid title, description, and price type.',
            ]);

            exit;
        }

        if (
            ($price_type === 'fixed' || $price_type === 'from') &&
            ($price === null || $price < 0)
        ) {
            $pdo->rollBack();

            echo json_encode([
                'status'  => 'error',
                'message' => 'A valid price is required for fixed or from price types.',
            ]);

            exit;
        }

        $stmt->execute([
            ':title'       => $title,
            ':description' => $description,
            ':price_type'  => $price_type,
            ':price'       => $price,
        ]);
    }

    $pdo->commit();

    echo json_encode([
        'status'  => 'success',
        'message' => 'Services saved successfully.',
    ]);

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
        'message' => 'Failed to save salon services.',
    ]);

} finally {

    $pdo = null;
}
