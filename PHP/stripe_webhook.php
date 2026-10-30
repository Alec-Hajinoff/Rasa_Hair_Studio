<?php

header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/shop_order_email_notifications.php';

function webhookRespond(int $statusCode, array $body): void
{
    http_response_code($statusCode);
    echo json_encode($body);
    exit;
}

function webhookLimitText(?string $value, int $maxLength): ?string
{
    if ($value === null || $value === '') {
        return null;
    }

    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $maxLength, 'UTF-8');
    }

    return substr($value, 0, $maxLength);
}

function stripeApiGet(string $url, string $stripeSecretKey): array
{
    $curl = curl_init($url);

    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPGET        => true,
        CURLOPT_USERPWD        => $stripeSecretKey . ':',
        CURLOPT_HTTPHEADER     => [
            'Accept: application/json',
        ],
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT        => 30,
    ]);

    $response  = curl_exec($curl);
    $curlError = curl_error($curl);
    $httpCode  = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    if ($response === false) {
        throw new RuntimeException('Stripe API request failed: ' . $curlError);
    }

    $data = json_decode($response, true);

    if (! is_array($data)) {
        throw new RuntimeException('Stripe API returned invalid JSON.');
    }

    if ($httpCode < 200 || $httpCode >= 300) {
        $stripeMessage = $data['error']['message'] ?? 'Unknown Stripe API error.';
        throw new RuntimeException('Stripe API error: ' . $stripeMessage);
    }

    return $data;
}

function stripeGetAllSessionLineItems(
    string $sessionId,
    string $stripeSecretKey
): array {
    $allItems      = [];
    $startingAfter = null;

    do {
        $query = [
            'limit'  => 100,
            'expand' => ['data.price.product'],
        ];

        if ($startingAfter !== null) {
            $query['starting_after'] = $startingAfter;
        }

        $url = 'https://api.stripe.com/v1/checkout/sessions/' .
        rawurlencode($sessionId) .
        '/line_items?' .
        http_build_query($query);

        $page      = stripeApiGet($url, $stripeSecretKey);
        $pageItems = $page['data'] ?? null;

        if (! is_array($pageItems)) {
            throw new RuntimeException('Stripe returned an invalid line-item list.');
        }

        foreach ($pageItems as $pageItem) {
            $allItems[] = $pageItem;
        }

        $hasMore = ($page['has_more'] ?? false) === true;

        if ($hasMore) {
            $lastItem      = end($pageItems);
            $startingAfter = is_array($lastItem)
                ? ($lastItem['id'] ?? null)
                : null;

            if (! is_string($startingAfter) || $startingAfter === '') {
                throw new RuntimeException(
                    'Stripe indicated more line items but supplied no pagination cursor.'
                );
            }
        }
    } while ($hasMore);

    return $allItems;
}

function verifyStripeSignature(
    string $payload,
    string $signatureHeader,
    string $webhookSecret
): bool {
    $timestamp  = null;
    $signatures = [];

    foreach (explode(',', $signatureHeader) as $part) {
        $pair = explode('=', trim($part), 2);

        if (count($pair) !== 2) {
            continue;
        }

        [$key, $value] = $pair;

        if ($key === 't' && ctype_digit($value)) {
            $timestamp = (int) $value;
        } elseif ($key === 'v1') {
            $signatures[] = $value;
        }
    }

    if ($timestamp === null || $signatures === []) {
        return false;
    }

    if (abs(time() - $timestamp) > 300) {
        return false;
    }

    $signedPayload     = $timestamp . '.' . $payload;
    $expectedSignature = hash_hmac(
        'sha256',
        $signedPayload,
        $webhookSecret
    );

    foreach ($signatures as $signature) {
        if (hash_equals($expectedSignature, $signature)) {
            return true;
        }
    }

    return false;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    webhookRespond(405, [
        'status'  => 'error',
        'message' => 'Invalid request method.',
    ]);
}

$payload = file_get_contents('php://input');

if ($payload === false || $payload === '' || strlen($payload) > 1_000_000) {
    webhookRespond(400, [
        'status'  => 'error',
        'message' => 'The webhook request body is missing or too large.',
    ]);
}

$envPath = __DIR__ . '/../.env';

if (! is_file($envPath) || ! is_readable($envPath)) {
    error_log('stripe_webhook.php: Project .env file is missing or unreadable.');
    webhookRespond(500, [
        'status'  => 'error',
        'message' => 'Server configuration is unavailable.',
    ]);
}

$config = parse_ini_file($envPath, false, INI_SCANNER_RAW);

if (! is_array($config)) {
    error_log('stripe_webhook.php: Could not parse the project .env file.');
    webhookRespond(500, [
        'status'  => 'error',
        'message' => 'Server configuration is unavailable.',
    ]);
}

$stripeSecretKey = trim(
    (string) ($config['STRIPE_SECRET_KEY'] ?? ''),
    " \t\n\r\0\x0B\"'"
);

$stripeWebhookSecret = trim(
    (string) ($config['STRIPE_WEBHOOK_SECRET'] ?? ''),
    " \t\n\r\0\x0B\"'"
);

if ($stripeSecretKey === '' || $stripeWebhookSecret === '') {
    error_log(
        'stripe_webhook.php: STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is not configured.'
    );
    webhookRespond(500, [
        'status'  => 'error',
        'message' => 'Stripe webhook configuration is unavailable.',
    ]);
}

$dbHost     = trim((string) ($config['DB_HOST'] ?? ''));
$dbName     = trim((string) ($config['DB_NAME'] ?? ''));
$dbUser     = trim((string) ($config['DB_USER'] ?? ''));
$dbPassword = (string) ($config['DB_PASSWORD'] ?? '');

if (
    $dbHost === '' ||
    $dbName === '' ||
    $dbUser === ''
) {
    error_log(
        'stripe_webhook.php: Database settings are missing from .env.'
    );

    webhookRespond(500, [
        'status'  => 'error',
        'message' => 'Server configuration is unavailable.',
    ]);
}

$signatureHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

if (
    $signatureHeader === '' ||
    ! verifyStripeSignature($payload, $signatureHeader, $stripeWebhookSecret)
) {
    error_log('stripe_webhook.php: Stripe webhook signature verification failed.');
    webhookRespond(400, [
        'status'  => 'error',
        'message' => 'Invalid webhook signature.',
    ]);
}

$event = json_decode($payload, true);

if (! is_array($event) || ! is_string($event['type'] ?? null)) {
    webhookRespond(400, [
        'status'  => 'error',
        'message' => 'Invalid Stripe event payload.',
    ]);
}

$eventType = $event['type'];

$supportedEvents = [
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
];

if (! in_array($eventType, $supportedEvents, true)) {
    webhookRespond(200, [
        'status'  => 'ignored',
        'message' => 'Event type is not handled by this endpoint.',
    ]);
}

$session = $event['data']['object'] ?? null;

if (
    ! is_array($session) ||
    ($session['object'] ?? '') !== 'checkout.session' ||
    ! is_string($session['id'] ?? null) ||
    ($session['mode'] ?? '') !== 'payment'
) {
    error_log('stripe_webhook.php: Supported event did not contain a payment Checkout Session.');
    webhookRespond(400, [
        'status'  => 'error',
        'message' => 'Invalid Checkout Session event.',
    ]);
}

$sessionId     = $session['id'];
$paymentStatus = $session['payment_status'] ?? null;

if (! in_array($paymentStatus, ['paid', 'unpaid', 'no_payment_required'], true)) {
    error_log('stripe_webhook.php: Checkout Session had an unsupported payment_status.');
    webhookRespond(400, [
        'status'  => 'error',
        'message' => 'Checkout Session payment status is invalid.',
    ]);
}

$amountTotal = $session['amount_total'] ?? null;
$currency    = $session['currency'] ?? null;

if (
    ! is_int($amountTotal) ||
    $amountTotal < 0 ||
    ! is_string($currency) ||
    ! preg_match('/^[a-zA-Z]{3}$/', $currency)
) {
    error_log('stripe_webhook.php: Checkout Session amount or currency is invalid.');
    webhookRespond(400, [
        'status'  => 'error',
        'message' => 'Checkout Session amount or currency is invalid.',
    ]);
}

$shippingCost   = $session['shipping_cost'] ?? [];
$shippingAmount = is_array($shippingCost)
    ? ($shippingCost['amount_total'] ?? 0)
    : 0;

if (! is_int($shippingAmount) || $shippingAmount < 0) {
    error_log('stripe_webhook.php: Checkout Session shipping amount is invalid.');
    webhookRespond(400, [
        'status'  => 'error',
        'message' => 'Checkout Session shipping amount is invalid.',
    ]);
}

$shippingDetails =
$session['collected_information']['shipping_details'] ?? $session['shipping_details'] ?? [];

$shippingAddress = $shippingDetails['address'] ?? [];
$customerDetails = $session['customer_details'] ?? [];

$recipientName = webhookLimitText(
    isset($shippingDetails['name']) ? (string) $shippingDetails['name'] : null,
    255
);

$recipientEmail = webhookLimitText(
    isset($customerDetails['email'])
        ? (string) $customerDetails['email']
        : (isset($session['customer_email'])
            ? (string) $session['customer_email']
            : null),
    512
);

$addressLine1 = webhookLimitText(
    isset($shippingAddress['line1']) ? (string) $shippingAddress['line1'] : null,
    255
);

$addressLine2 = webhookLimitText(
    isset($shippingAddress['line2']) ? (string) $shippingAddress['line2'] : null,
    255
);

$city = webhookLimitText(
    isset($shippingAddress['city']) ? (string) $shippingAddress['city'] : null,
    100
);

$region = webhookLimitText(
    isset($shippingAddress['state']) ? (string) $shippingAddress['state'] : null,
    100
);

$postcode = webhookLimitText(
    isset($shippingAddress['postal_code'])
        ? (string) $shippingAddress['postal_code']
        : null,
    32
);

$country = isset($shippingAddress['country'])
    ? strtoupper((string) $shippingAddress['country'])
    : null;

if ($country !== null && ! preg_match('/^[A-Z]{2}$/', $country)) {
    $country = null;
}

$metadataUserId = $session['metadata']['user_id'] ?? null;
$userId         = null;

if (
    is_string($metadataUserId) &&
    ctype_digit($metadataUserId) &&
    (int) $metadataUserId > 0
) {
    $userId = (int) $metadataUserId;
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

    if ($userId !== null) {
        $userCheck = $pdo->prepare('SELECT id FROM users WHERE id = ?');
        $userCheck->execute([$userId]);

        if (! $userCheck->fetch()) {
            $userId = null;
        }
    }

    $lineItems = stripeGetAllSessionLineItems($sessionId, $stripeSecretKey);

    if ($lineItems === []) {
        throw new RuntimeException('Stripe returned no line items for the Checkout Session.');
    }

    $preparedItems = [];

    foreach ($lineItems as $lineItem) {
        $quantity    = $lineItem['quantity'] ?? null;
        $unitAmount  = $lineItem['price']['unit_amount'] ?? null;
        $totalAmount = $lineItem['amount_total'] ?? null;

        if (
            ! is_int($quantity) ||
            $quantity < 1 ||
            ! is_int($unitAmount) ||
            $unitAmount < 0 ||
            ! is_int($totalAmount) ||
            $totalAmount < 0
        ) {
            throw new RuntimeException('Stripe returned an invalid line item.');
        }

        $productName = $lineItem['description'] ?? 'Product';

        $stripeProduct   = $lineItem['price']['product'] ?? null;
        $productMetadata = is_array($stripeProduct)
            ? ($stripeProduct['metadata'] ?? [])
            : [];

        $rawProductId = is_array($productMetadata)
            ? ($productMetadata['product_id'] ?? null)
            : null;

        $productId = (
            is_string($rawProductId) &&
            ctype_digit($rawProductId) &&
            (int) $rawProductId > 0
        )
            ? (int) $rawProductId
            : null;

        $preparedItems[] = [
            'product_id'   => $productId,
            'product_name' => webhookLimitText((string) $productName, 255) ?? 'Product',
            'quantity'     => $quantity,
            'unit_amount'  => $unitAmount,
            'total_amount' => $totalAmount,
        ];
    }

    $pdo->beginTransaction();

    $insertTransaction = $pdo->prepare(
        'INSERT IGNORE INTO transactions (
            user_id,
            stripe_session_id,
            amount_total,
            shipping_amount,
            currency,
            payment_status,
            recipient_name,
            recipient_email,
            address_line1,
            address_line2,
            city,
            region,
            postcode,
            country
        ) VALUES (
            :user_id,
            :stripe_session_id,
            :amount_total,
            :shipping_amount,
            :currency,
            :payment_status,
            :recipient_name,
            :recipient_email,
            :address_line1,
            :address_line2,
            :city,
            :region,
            :postcode,
            :country
        )'
    );

    $insertTransaction->execute([
        ':user_id'           => $userId,
        ':stripe_session_id' => $sessionId,
        ':amount_total'      => $amountTotal,
        ':shipping_amount'   => $shippingAmount,
        ':currency'          => strtoupper($currency),
        ':payment_status'    => $paymentStatus,
        ':recipient_name'    => $recipientName,
        ':recipient_email'   => $recipientEmail,
        ':address_line1'     => $addressLine1,
        ':address_line2'     => $addressLine2,
        ':city'              => $city,
        ':region'            => $region,
        ':postcode'          => $postcode,
        ':country'           => $country,
    ]);

    $isNewTransaction = $insertTransaction->rowCount() === 1;

    $findTransaction = $pdo->prepare(
        'SELECT id
         FROM transactions
         WHERE stripe_session_id = ?
         FOR UPDATE'
    );
    $findTransaction->execute([$sessionId]);
    $transaction = $findTransaction->fetch();

    if (! $transaction) {
        throw new RuntimeException('Could not find the stored transaction.');
    }

    $transactionId = (int) $transaction['id'];

    if ($isNewTransaction) {
        $productExists = $pdo->prepare('SELECT id FROM products WHERE id = ?');

        $insertItem = $pdo->prepare(
            'INSERT INTO transaction_items (
                transaction_id,
                product_id,
                product_name,
                quantity,
                unit_amount,
                total_amount
            ) VALUES (
                :transaction_id,
                :product_id,
                :product_name,
                :quantity,
                :unit_amount,
                :total_amount
            )'
        );

        foreach ($preparedItems as $item) {
            $productId = $item['product_id'];

            if ($productId !== null) {
                $productExists->execute([$productId]);

                if (! $productExists->fetch()) {
                    $productId = null;
                }
            }

            $insertItem->execute([
                ':transaction_id' => $transactionId,
                ':product_id'     => $productId,
                ':product_name'   => $item['product_name'],
                ':quantity'       => $item['quantity'],
                ':unit_amount'    => $item['unit_amount'],
                ':total_amount'   => $item['total_amount'],
            ]);
        }
    } else {

        $updateTransaction = $pdo->prepare(
            "UPDATE transactions
             SET shipping_amount = :shipping_amount,
                 payment_status = CASE
                     WHEN payment_status = 'paid' THEN 'paid'
                     ELSE :payment_status
                 END
             WHERE id = :id"
        );
        $updateTransaction->execute([
            ':shipping_amount' => $shippingAmount,
            ':payment_status'  => $paymentStatus,
            ':id'              => $transactionId,
        ]);
    }

    $pdo->commit();

    if ($paymentStatus === 'paid') {
        sendShopOrderEmailNotifications($pdo, $transactionId, $config);
    }

    webhookRespond(200, [
        'status'            => 'success',
        'stripe_session_id' => $sessionId,
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('stripe_webhook.php: ' . $e->getMessage());

    webhookRespond(500, [
        'status'  => 'error',
        'message' => 'The Stripe event could not be processed.',
    ]);
}
