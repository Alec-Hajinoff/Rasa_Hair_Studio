<?php

$envPath = __DIR__ . '/../.env';

if (! is_file($envPath) || ! is_readable($envPath)) {
    error_log('cancel_redirect.php: Project .env file is missing or unreadable.');
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    exit('The redirect destination is not configured.');
}

$config = parse_ini_file($envPath, false, INI_SCANNER_RAW);

if ($config === false) {
    error_log('cancel_redirect.php: Could not parse the project .env file.');
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    exit('The redirect destination is not configured.');
}

$frontendBaseUrl = rtrim(trim($config['FRONTEND_BASE_URL'] ?? ''), '/');
$frontendScheme  = parse_url($frontendBaseUrl, PHP_URL_SCHEME);

if (
    ! filter_var($frontendBaseUrl, FILTER_VALIDATE_URL) ||
    ! in_array(strtolower((string) $frontendScheme), ['http', 'https'], true)
) {
    error_log('cancel_redirect.php: FRONTEND_BASE_URL is missing or invalid.');
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    exit('The redirect destination is not configured.');
}

header('Location: ' . $frontendBaseUrl . '/Shop', true, 302);
exit;
