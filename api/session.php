<?php
declare(strict_types=1);

require __DIR__ . '/_common.php';

invite_require_method('POST');

$payload = invite_read_json_body();
$phone = invite_normalize_phone(isset($payload['phone']) ? (string) $payload['phone'] : '');
$name = INVITE_ADMINS[$phone] ?? null;

if ($name === null) {
    invite_send_json(401, ['ok' => false, 'error' => 'هذا الرقم غير مصرّح له']);
    exit;
}

invite_login_admin($name);
invite_send_json(200, ['ok' => true, 'name' => $name]);
