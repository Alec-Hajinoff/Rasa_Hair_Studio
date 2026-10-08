<?php

if (php_sapi_name() !== 'cli' && ! isset($_SERVER['REMOTE_ADDR'])) {
    exit('Access denied.');
}

require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;

$config = parse_ini_file(__DIR__ . '/../.env', false, INI_SCANNER_RAW);
if ($config === false) {
    error_log('Appointment Reminders Error: Failed to parse .env file');
    exit('Server configuration error');
}

$mailUsername = $config['MAIL_USERNAME'] ?? '';
$mailPassword = $config['MAIL_PASSWORD'] ?? '';

if (empty($mailUsername) || empty($mailPassword)) {
    error_log('Appointment Reminders Error: Gmail credentials not found in .env file');
    exit('Server configuration error');
}

$servername     = '127.0.0.1';
$username       = 'root';
$passwordServer = '';
$dbname         = 'loveday_auto';

try {

    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $passwordServer, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    error_log('Appointment Reminders Database Connection Failed: ' . $e->getMessage());
    exit('Database connection failed');
}

try {

    $stmt = $conn->prepare('
        SELECT
            a.id AS appointment_id,
            a.vehicle_reg,
            a.notes,
            u.first_name,
            u.surname,
            u.email,
            s.date,
            s.start_time,
            s.end_time,
            srv.name AS service_name
        FROM appointments a
        JOIN users u ON a.user_id = u.id
        JOIN availability_slots s ON a.slot_id = s.id
        LEFT JOIN services srv ON a.service_id = srv.id
        WHERE a.reminder_sent = 0
          AND TIMESTAMP(s.date, s.start_time) BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
    ');
    $stmt->execute();
    $appointments = $stmt->fetchAll();

    if (empty($appointments)) {
        exit('No appointment reminders due at this time.');
    }

    $reminderCount = 0;

    foreach ($appointments as $appointment) {
        $appointmentId = $appointment['appointment_id'];
        $customerEmail = $appointment['email'];
        $customerName  = trim($appointment['first_name'] . ' ' . $appointment['surname']);
        $serviceName   = $appointment['service_name'] ?? 'General Appointment';
        $vehicleReg    = $appointment['vehicle_reg'] ?? 'Not Provided';

        $formattedDate  = date('d/m/Y', strtotime($appointment['date']));
        $formattedStart = date('H:i', strtotime($appointment['start_time']));
        $formattedEnd   = date('H:i', strtotime($appointment['end_time']));

        $mail = new PHPMailer(true);

        try {
            $mail->SMTPDebug = SMTP::DEBUG_OFF;
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = $mailUsername;
            $mail->Password   = $mailPassword;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = 587;

            $mail->setFrom($mailUsername, 'Loveday Auto Repairs');
            $mail->addAddress($customerEmail, $customerName);

            $mail->isHTML(false);
            $mail->Subject = 'Reminder: Your upcoming appointment with Loveday Auto Repairs';
            $mail->Body    = "Dear " . ($appointment['first_name'] ?: 'Customer') . ",\n\n"
                . "This is a reminder that you have an upcoming appointment booked with Loveday Auto Repairs.\n\n"
                . "--- APPOINTMENT DETAILS ---\n"
                . "Date: {$formattedDate}\n"
                . "Time: {$formattedStart} - {$formattedEnd}\n"
                . "Service: {$serviceName}\n"
                . "Vehicle Registration: {$vehicleReg}\n\n"
                . "If you need to reschedule or have any questions, please contact us.\n\n"
                . "We look forward to seeing you.\n\n"
                . "Kind regards,\n"
                . "Loveday Auto Repairs Team";

            $mail->send();

            $updateStmt = $conn->prepare('UPDATE appointments SET reminder_sent = 1, updated_at = NOW() WHERE id = ?');
            $updateStmt->execute([$appointmentId]);

            $reminderCount++;

        } catch (Exception $e) {
            error_log("Failed to send reminder email for Appointment ID {$appointmentId}: " . $e->getMessage());
        }
    }

    echo "Successfully sent {$reminderCount} appointment reminder(s).";

} catch (PDOException $e) {
    error_log('Appointment Reminders Execution Error: ' . $e->getMessage());
    exit('An error occurred while processing reminders.');
} finally {
    $conn = null;
}
