<?php
declare(strict_types=1);

require __DIR__ . '/_common.php';

invite_require_method('POST');

$payload = invite_read_json_body();
// Prefer JSON body; fall back to form fields if a proxy stripped JSON.
$rawPhone = '';
if (isset($payload['phone'])) {
    $rawPhone = (string) $payload['phone'];
} elseif (isset($_POST['phone'])) {
    $rawPhone = (string) $_POST['phone'];
}
$phone = invite_normalize_phone($rawPhone);
$name = INVITE_ADMINS[$phone] ?? null;

if ($name === null) {
    invite_send_json(401, ['ok' => false, 'error' => 'هذا الرقم غير مصرّح له']);
    exit;
}

invite_login_admin($name);
invite_send_json(200, ['ok' => true, 'name' => $name]);
