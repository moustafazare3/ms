<?php
declare(strict_types=1);

require __DIR__ . '/_common.php';

invite_require_method('POST');

if (!empty($_POST['website'])) {
    invite_send_json(200, ['ok' => true]);
    exit;
}

$name = preg_replace('/\s+/u', ' ', trim((string) ($_POST['name'] ?? ''))) ?? '';
$status = (string) ($_POST['status'] ?? '');
$message = trim((string) ($_POST['message'] ?? ''));

if ($name === '' || mb_strlen($name) > 120) {
    invite_send_json(400, ['ok' => false, 'error' => 'اكتب الاسم']);
    exit;
}
if (!in_array($status, ['attending', 'declined'], true)) {
    invite_send_json(400, ['ok' => false, 'error' => 'اختر حالة الحضور']);
    exit;
}
if (mb_strlen($message) > 600) {
    $message = mb_substr($message, 0, 600);
}

$row = [
    'id' => bin2hex(random_bytes(8)),
    'name' => $name,
    'status' => $status,
    'message' => $message,
    'at' => (new DateTimeImmutable('now'))->format('Y-m-d\TH:i:sP'),
];

try {
    $rows = invite_load_rsvps();
    $rows[] = $row;
    invite_save_rsvps($rows);
} catch (Throwable) {
    invite_send_json(500, ['ok' => false, 'error' => 'تعذّر حفظ الرد']);
    exit;
}

invite_send_json(200, [
    'ok' => true,
    'message' => 'شكراً لكم — تم تسجيل ردكم.',
]);
