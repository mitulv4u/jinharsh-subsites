<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$raw  = file_get_contents('php://input');
$data = $raw ? json_decode($raw, true) : $_POST;
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid payload']);
    exit;
}

$name    = trim((string)($data['name'] ?? ''));
$email   = trim((string)($data['email'] ?? ''));
$phone   = trim((string)($data['phone'] ?? ''));
$company = trim((string)($data['company'] ?? ''));
$type    = trim((string)($data['inquiry_type'] ?? 'Website Inquiry'));
$message = trim((string)($data['message'] ?? ''));

if ($name === '' || $email === '' || $message === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Name, email, and message are required']);
    exit;
}

$to      = 'crm@jinharsh.com';
$subject = "[jinharsh.com] {$type} from {$name}" . ($company ? " ({$company})" : '');
$body    = "New inquiry from https://www.jinharsh.com\n\n"
         . "Name: {$name}\n"
         . "Company: {$company}\n"
         . "Email: {$email}\n"
         . "Phone: {$phone}\n"
         . "Type: {$type}\n\n"
         . "Message / RFQ Items:\n{$message}\n";

$headers = "From: JinHarsh Website <noreply@jinharsh.com>\r\n"
         . "Reply-To: {$email}\r\n"
         . "Content-Type: text/plain; charset=UTF-8\r\n";

$mailed = @mail($to, $subject, $body, $headers);

$odooPayload = json_encode([
    'name'             => $name,
    'email'            => $email,
    'phone'            => $phone,
    'company'          => $company,
    'message'          => "[{$type}] " . $message,
    'source_domain'    => 'jinharsh.com',
    'product_category' => $type,
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

echo json_encode(['ok' => true, 'mailed' => $mailed]);
