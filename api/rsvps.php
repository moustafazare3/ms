<?php
declare(strict_types=1);

require __DIR__ . '/_common.php';

invite_require_method('GET');

$session = invite_admin_session();
if ($session === null) {
    invite_send_json(401, ['ok' => false, 'error' => 'أدخل رقم الموبايل']);
    exit;
}

$rows = invite_load_rsvps();
$rows = array_reverse($rows);
$attending = 0;
foreach ($rows as $row) {
    if (($row['status'] ?? '') === 'attending') {
        $attending++;
    }
}

invite_send_json(200, [
    'ok' => true,
    'name' => $session['name'],
    'total' => count($rows),
    'attending' => $attending,
    'declined' => count($rows) - $attending,
    'replies' => $rows,
]);
