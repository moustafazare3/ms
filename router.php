<?php
/** Local dev only: php -S 127.0.0.1:8080 router.php */
declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$routes = [
    '/api/rsvp' => __DIR__ . '/api/rsvp.php',
    '/api/session' => __DIR__ . '/api/session.php',
    '/api/rsvps' => __DIR__ . '/api/rsvps.php',
    '/api/logout' => __DIR__ . '/api/logout.php',
];
if (isset($routes[$path])) {
    require $routes[$path];
    return true;
}
if (substr($path, 0, 5) === '/api/' || substr($path, 0, 6) === '/data/') {
    http_response_code(404);
    echo 'Not found';
    return true;
}
return false;
