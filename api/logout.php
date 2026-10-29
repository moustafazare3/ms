<?php
declare(strict_types=1);

require __DIR__ . '/_common.php';

invite_require_method('POST');

invite_send_json(200, ['ok' => true], true);
