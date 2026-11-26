<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$raw  = file_get_contents('php://input');
$data = $raw ? json_decode($raw, true) : $_POST;
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid request']);
    exit;
}

$name    = trim((string)($data['name'] ?? ''));
$email   = trim((string)($data['email'] ?? ''));
$phone   = trim((string)($data['phone'] ?? ''));
$part    = trim((string)($data['part_number'] ?? ''));
$type    = trim((string)($data['inquiry_type'] ?? 'General'));
$message = trim((string)($data['message'] ?? ''));

if ($name === '' || $email === '' || $message === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Name, email, and message are required']);
    exit;
}

$to      = 'enquiry@general.tools';
$subject = "[general.tools] {$type} Inquiry from {$name}" . ($part ? " (Part: {$part})" : '');
$body    = "New inquiry from https://general.tools/contact.html\n\n"
         . "Name: {$name}\n"
         . "Email: {$email}\n"
         . "Phone: {$phone}\n"
         . "Part Number: {$part}\n"
         . "Inquiry Type: {$type}\n\n"
         . "Message:\n{$message}\n";

$headers = "From: General Tools <noreply@general.tools>\r\n"
         . "Reply-To: {$email}\r\n"
         . "Content-Type: text/plain; charset=UTF-8\r\n";

$sent = @mail($to, $subject, $body, $headers);

// Forward to central Odoo ERP API (best-effort)
$odooPayload = json_encode([
    'name'             => $name,
    'email'            => $email,
    'phone'            => $phone,
    'company'          => '',
    'message'          => ($part ? "[Part: {$part}] " : '') . "[{$type}] " . $message,
    'source_domain'    => 'general.tools',
    'product_category' => 'General Tools (' . $type . ')',
]);
$ctx = stream_context_create([
    'http' => [
        'method'        => 'POST',
        'header'        => "Content-Type: application/json\r\n",
        'content'       => $odooPayload,
        'timeout'       => 3,
        'ignore_errors' => true,
    ],
]);
@file_get_contents('https://api.jinharsh.com/inquiries', false, $ctx);

echo json_encode(['ok' => true, 'mailed' => $sent]);
