<?php

$envPath = __DIR__ . '/../.env';

if (! is_file($envPath) || ! is_readable($envPath)) {
    error_log('success_redirect.php: Project .env file is missing or unreadable.');
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    exit('Checkout could not be verified.');
}

$config = parse_ini_file($envPath, false, INI_SCANNER_RAW);

if ($config === false) {
    error_log('success_redirect.php: Could not parse the project .env file.');
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    exit('Checkout could not be verified.');
}

$stripeSecretKey = trim($config['STRIPE_SECRET_KEY'] ?? '');
$frontendBaseUrl = rtrim(trim($config['FRONTEND_BASE_URL'] ?? ''), '/');
$frontendScheme  = parse_url($frontendBaseUrl, PHP_URL_SCHEME);

if ($stripeSecretKey === '') {
    error_log('success_redirect.php: STRIPE_SECRET_KEY is not configured.');
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    exit('Checkout could not be verified.');
}

if (
    ! filter_var($frontendBaseUrl, FILTER_VALIDATE_URL) ||
    ! in_array(strtolower((string) $frontendScheme), ['http', 'https'], true)
) {
    error_log('success_redirect.php: FRONTEND_BASE_URL is missing or invalid.');
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    exit('The redirect destination is not configured.');
}

$sessionId = trim($_GET['session_id'] ?? '');

if (! preg_match('/^cs_(test|live)_[A-Za-z0-9]+$/', $sessionId)) {
    error_log('success_redirect.php: Missing or invalid Checkout Session ID.');
    header('Location: ' . $frontendBaseUrl . '/Basket', true, 302);
    exit;
}

$curl = curl_init(
    'https://api.stripe.com/v1/checkout/sessions/' . rawurlencode($sessionId)
);
curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPGET        => true,
    CURLOPT_USERPWD        => $stripeSecretKey . ':',
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT        => 30,
]);

$stripeResponse = curl_exec($curl);
$curlError      = curl_error($curl);
$stripeHttpCode = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

if ($stripeResponse === false) {
    error_log('success_redirect.php: Stripe verification request failed: ' . $curlError);
    http_response_code(502);
    header('Content-Type: text/plain; charset=UTF-8');
    exit('Checkout could not be verified.');
}

$session = json_decode($stripeResponse, true);

if (
    $stripeHttpCode >= 200 &&
    $stripeHttpCode < 300 &&
    ($session['id'] ?? '') === $sessionId &&
    ($session['mode'] ?? '') === 'payment' &&
    ($session['payment_status'] ?? '') === 'paid'
) {
    header(
        'Location: ' .
        $frontendBaseUrl .
        '/OrderSuccess?session_id=' .
        rawurlencode($sessionId),
        true,
        302
    );
    exit;
}

error_log(
    'success_redirect.php: Stripe session was not confirmed as paid. Session: ' .
    $sessionId
);
header('Location: ' . $frontendBaseUrl . '/Basket', true, 302);
exit;
