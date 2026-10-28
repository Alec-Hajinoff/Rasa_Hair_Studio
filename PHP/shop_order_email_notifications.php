<?php

require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;

function shopOrderFormatMoney(int $amountMinor, string $currency): string
{
    $currency = strtoupper($currency);
    $amount   = number_format($amountMinor / 100, 2, '.', '');

    if ($currency === 'GBP') {
        return '£' . $amount;
    }

    return $currency . ' ' . $amount;
}

function sendShopOrderEmailNotifications(
    PDO $pdo,
    int $transactionId,
    array $config
): void {
    $mailUsername = trim((string) ($config['MAIL_USERNAME'] ?? ''));
    $mailPassword = trim((string) ($config['MAIL_PASSWORD'] ?? ''));

    if ($mailUsername === '' || $mailPassword === '') {
        throw new RuntimeException(
            'Email notification credentials are missing from .env.'
        );
    }

    $transactionQuery = $pdo->prepare(
        'SELECT
            id,
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
            country,
            customer_order_email_sent_at,
            admin_order_email_sent_at
         FROM transactions
         WHERE id = ?
         LIMIT 1'
    );
    $transactionQuery->execute([$transactionId]);
    $transaction = $transactionQuery->fetch(PDO::FETCH_ASSOC);

    if (! $transaction) {
        throw new RuntimeException(
            'Could not find the transaction for email notification.'
        );
    }

    if ($transaction['payment_status'] !== 'paid') {
        return;
    }

    $itemsQuery = $pdo->prepare(
        'SELECT product_name, quantity, unit_amount, total_amount
         FROM transaction_items
         WHERE transaction_id = ?
         ORDER BY id ASC'
    );
    $itemsQuery->execute([$transactionId]);
    $items = $itemsQuery->fetchAll(PDO::FETCH_ASSOC);

    if ($items === []) {
        throw new RuntimeException(
            'No transaction items were found for the email notification.'
        );
    }

    $currency       = (string) $transaction['currency'];
    $sessionId      = (string) $transaction['stripe_session_id'];
    $customerEmail  = trim((string) ($transaction['recipient_email'] ?? ''));
    $customerName   = trim((string) ($transaction['recipient_name'] ?? ''));
    $orderReference = (string) $transaction['id'];

    $createMailer = static function () use ($mailUsername, $mailPassword): PHPMailer {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = $mailUsername;
        $mail->Password   = $mailPassword;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;
        $mail->SMTPDebug  = SMTP::DEBUG_OFF;
        $mail->CharSet    = 'UTF-8';
        $mail->setFrom($mailUsername, 'Rasa Hair Studio');
        $mail->isHTML(false);

        return $mail;
    };

    if ($transaction['customer_order_email_sent_at'] === null) {
        if (
            $customerEmail === '' ||
            filter_var($customerEmail, FILTER_VALIDATE_EMAIL) === false
        ) {
            throw new RuntimeException(
                'The transaction does not have a valid customer email address.'
            );
        }

        $customerGreeting = $customerName !== ''
            ? 'Hello ' . $customerName . ','
            : 'Hello,';

        $customerMail = $createMailer();
        $customerMail->addAddress($customerEmail);
        $customerMail->Subject = 'We have received your order - Rasa Hair Studio';
        $customerMail->Body    =
        $customerGreeting . "\n\n" .
        "We have received your order and your payment has been confirmed.\n" .
        "We will be in touch with an update.\n\n" .
        'Order reference: ' . $orderReference . "\n" .
        'Order total: ' .
        shopOrderFormatMoney((int) $transaction['amount_total'], $currency) .
            "\n\n" .
            "Thank you,\n" .
            "Rasa Hair Studio";

        $customerMail->send();

        $markCustomerEmailSent = $pdo->prepare(
            'UPDATE transactions
             SET customer_order_email_sent_at = CURRENT_TIMESTAMP
             WHERE id = ?
               AND customer_order_email_sent_at IS NULL'
        );
        $markCustomerEmailSent->execute([$transactionId]);

        $transaction['customer_order_email_sent_at'] = date('Y-m-d H:i:s');
    }

    if ($transaction['admin_order_email_sent_at'] === null) {
        $adminQuery = $pdo->prepare(
            'SELECT email
             FROM users
             WHERE role_id = 2
               AND is_deleted = 0
               AND email IS NOT NULL
               AND email <> ""
             ORDER BY id ASC'
        );
        $adminQuery->execute();
        $adminEmails = $adminQuery->fetchAll(PDO::FETCH_COLUMN);

        $adminEmails = array_values(array_unique(array_filter(
            array_map('trim', $adminEmails),
            static fn($email) =>
            $email !== '' &&
            filter_var($email, FILTER_VALIDATE_EMAIL) !== false
        )));

        if ($adminEmails === []) {
            throw new RuntimeException(
                'No valid active admin email addresses were found.'
            );
        }

        $itemLines = [];

        foreach ($items as $item) {
            $itemLines[] =
            $item['product_name'] .
            ' — quantity ' . (int) $item['quantity'] .
            ', unit ' .
            shopOrderFormatMoney((int) $item['unit_amount'], $currency) .
            ', line total ' .
            shopOrderFormatMoney((int) $item['total_amount'], $currency);
        }

        $addressParts = array_filter([
            $transaction['address_line1'] ?? null,
            $transaction['address_line2'] ?? null,
            $transaction['city'] ?? null,
            $transaction['region'] ?? null,
            $transaction['postcode'] ?? null,
            $transaction['country'] ?? null,
        ], static fn($part) => $part !== null && trim((string) $part) !== '');

        $adminBody =
        "A paid shop order has been received.\n\n" .
        'Order reference: ' . $orderReference . "\n" .
        'Stripe Checkout Session: ' . $sessionId . "\n" .
        'Customer: ' . ($customerName !== '' ? $customerName : 'Not provided') . "\n" .
        'Customer email: ' . ($customerEmail !== '' ? $customerEmail : 'Not provided') . "\n" .
        'Order total: ' .
        shopOrderFormatMoney((int) $transaction['amount_total'], $currency) .
        "\n" .
        'Delivery: ' .
        shopOrderFormatMoney((int) $transaction['shipping_amount'], $currency) .
        "\n\n" .
        "Delivery address:\n" .
        (count($addressParts) > 0
                ? implode("\n", $addressParts)
                : 'Not provided') .
        "\n\n" .
        "Products:\n" .
        implode("\n", $itemLines);

        $adminMail = $createMailer();
        $adminMail->addAddress($adminEmails[0]);

        foreach (array_slice($adminEmails, 1) as $adminEmail) {
            $adminMail->addBCC($adminEmail);
        }

        $adminMail->Subject = 'New paid shop order - Rasa Hair Studio';
        $adminMail->Body    = $adminBody;
        $adminMail->send();

        $markAdminEmailSent = $pdo->prepare(
            'UPDATE transactions
             SET admin_order_email_sent_at = CURRENT_TIMESTAMP
             WHERE id = ?
               AND admin_order_email_sent_at IS NULL'
        );
        $markAdminEmailSent->execute([$transactionId]);
    }
}
