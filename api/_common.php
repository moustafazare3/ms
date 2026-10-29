<?php
declare(strict_types=1);

const INVITE_SESSION_HOURS = 12;
const INVITE_MAX_BODY = 100_000;

const INVITE_ADMINS = [
    '01208601044' => 'مصطفى',
    '01224506489' => 'سلمى',
];

function invite_root(): string
{
    return dirname(__DIR__);
}

function invite_data_file(): string
{
    return invite_root() . '/data/rsvps.json';
}

function invite_normalize_phone(?string $value): string
{
    $digits = preg_replace('/\D/', '', $value ?? '') ?? '';
    if (substr($digits, 0, 4) === '0020') {
        $digits = substr($digits, 4);
    } elseif (substr($digits, 0, 2) === '20' && strlen($digits) >= 12) {
        $digits = substr($digits, 2);
    }
    if (strlen($digits) === 10 && $digits[0] === '1') {
        $digits = '0' . $digits;
    }
    return $digits;
}

/** @return list<array<string, mixed>> */
function invite_load_rsvps(): array
{
    $file = invite_data_file();
    if (!is_file($file)) {
        return [];
    }
    $handle = fopen($file, 'rb');
    if ($handle === false) {
        return [];
    }
    try {
        if (!flock($handle, LOCK_SH)) {
            return [];
        }
        $raw = stream_get_contents($handle);
        flock($handle, LOCK_UN);
    } finally {
        fclose($handle);
    }
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/** @param list<array<string, mixed>> $rows */
function invite_save_rsvps(array $rows): void
{
    $file = invite_data_file();
    $dir = dirname($file);
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        throw new RuntimeException('Cannot create data directory');
    }
    $json = json_encode($rows, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    if ($json === false) {
        throw new RuntimeException('JSON encode failed');
    }
    $json .= "\n";
    $temporary = $file . '.tmp';
    $written = file_put_contents($temporary, $json, LOCK_EX);
    if ($written === false) {
        throw new RuntimeException('Cannot write RSVP data');
    }
    if (!rename($temporary, $file)) {
        @unlink($temporary);
        throw new RuntimeException('Cannot save RSVP data');
    }
}

function invite_ensure_data_file(): void
{
    $file = invite_data_file();
    if (is_file($file)) {
        return;
    }
    try {
        invite_save_rsvps([]);
    } catch (Throwable $e) {
        // Defer failure to the endpoint that writes; avoid fatal on include.
    }
}

/** mbstring-safe length (shared hosts sometimes lack mbstring). */
function invite_strlen(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function invite_substr(string $value, int $start, ?int $length = null): string
{
    if (function_exists('mb_substr')) {
        return $length === null
            ? mb_substr($value, $start, null, 'UTF-8')
            : mb_substr($value, $start, $length, 'UTF-8');
    }
    return $length === null ? substr($value, $start) : substr($value, $start, $length);
}

function invite_send_json(int $status, array $payload, ?bool $clearSessionCookie = null): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    if ($clearSessionCookie === true) {
        invite_clear_session_cookie();
    }
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
}

function invite_session_cookie_params(): array
{
    return [
        'lifetime' => INVITE_SESSION_HOURS * 3600,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (isset($_SERVER['SERVER_PORT']) && (string) $_SERVER['SERVER_PORT'] === '443'),
    ];
}

function invite_start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_name('contacts_session');
    session_set_cookie_params(invite_session_cookie_params());
    session_start();
}

function invite_clear_session_cookie(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_name('contacts_session');
        session_set_cookie_params(invite_session_cookie_params());
        session_start();
    }
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 3600,
            'path' => $params['path'] ?: '/',
            'domain' => $params['domain'] ?? '',
            'secure' => $params['secure'] ?? false,
            'httponly' => $params['httponly'] ?? true,
            'samesite' => $params['samesite'] ?? 'Lax',
        ]);
    }
    session_destroy();
}

/** @return array{name: string}|null */
function invite_admin_session(): ?array
{
    invite_start_session();
    $name = $_SESSION['admin_name'] ?? null;
    $expires = $_SESSION['expires'] ?? 0;
    if (!is_string($name) || $name === '' || !is_numeric($expires)) {
        return null;
    }
    if ((int) $expires <= time()) {
        invite_clear_session_cookie();
        return null;
    }
    return ['name' => $name];
}

function invite_login_admin(string $name): void
{
    invite_start_session();
    session_regenerate_id(true);
    $_SESSION['admin_name'] = $name;
    $_SESSION['expires'] = time() + INVITE_SESSION_HOURS * 3600;
}

function invite_require_method(string $method): void
{
    if (strtoupper($_SERVER['REQUEST_METHOD'] ?? '') !== strtoupper($method)) {
        http_response_code(405);
        exit;
    }
}

function invite_read_json_body(): array
{
    $length = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($length < 0 || $length > INVITE_MAX_BODY) {
        invite_send_json(413, ['ok' => false, 'error' => 'الطلب كبير']);
        exit;
    }
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $payload = json_decode($raw, true);
    return is_array($payload) ? $payload : [];
}

invite_ensure_data_file();
