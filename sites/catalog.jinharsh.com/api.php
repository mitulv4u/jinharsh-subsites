<?php
declare(strict_types=1);

date_default_timezone_set('Asia/Kolkata');

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

const GOOGLE_CLIENT_ID = '232694715908-2575cktv96o2l83tsi5oo4u3cs5g0anc.apps.googleusercontent.com';
const ALLOWED_DOMAIN   = 'jinharsh.com';
const ADMIN_EMAILS     = ['mitul.vasa@jinharsh.com', 'content@jinharsh.com', 'content@jinhars.com'];

$BASE_DIR = __DIR__;
$PDF_DIR  = $BASE_DIR . '/pdfs';
if (!is_dir($PDF_DIR))  @mkdir($PDF_DIR, 0755, true);

// Where the hub keeps its own records (settings and the sign-in key, visits, queries, the uploaded-catalogue list).
// hub/data is the place, but the website may not be allowed to create a folder inside hub/ (the deploy owns hub/):
// then nothing was saved, a new sign-in key was made on every request and every sign-in was refused. So: a place that
// already holds the records is kept (they never move); otherwise the first of these the website can write to is used.
// Each gets the same "no public access" lock below. Deploys never touch data/ or pdfs/, and hub-data sits outside hub/.
function hub_data_dir(string $base, string $pdfDir): string {
    $places = [$base . '/data', dirname($base) . '/hub-data', $pdfDir . '/_data'];
    foreach ($places as $dir) {
        if (@is_file($dir . '/config.json') && @is_writable($dir)) return $dir;
    }
    foreach ($places as $dir) {
        if (!@is_dir($dir)) @mkdir($dir, 0755, true);
        if (@is_dir($dir) && @is_writable($dir)) return $dir;
    }
    return $places[0];
}
$DATA_DIR = hub_data_dir($BASE_DIR, $PDF_DIR);

$htaccessPath = $DATA_DIR . '/.htaccess';
if (!file_exists($htaccessPath)) {
    @file_put_contents($htaccessPath, "Order allow,deny\nDeny from all\n<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n");
}

$CONFIG_FILE  = $DATA_DIR . '/config.json';
$EVENTS_FILE  = $DATA_DIR . '/events.jsonl';
$INQUIRY_FILE = $DATA_DIR . '/inquiries.jsonl';
$CUSTOM_CATS  = $DATA_DIR . '/custom-catalogs.json';
$GEO_CACHE    = $DATA_DIR . '/geo-cache.json';

function load_config(string $path): array {
    $defaults = [
        'exhibition_name' => 'JinHarsh Industrial Exhibition 2026',
        'start_date'      => date('Y-m-d'),
        'end_date'        => date('Y-m-d', strtotime('+3 days')),
        'passcode'        => 'jinharsh2026',
        'hmac_secret'     => bin2hex(random_bytes(24)),
    ];
    if (!file_exists($path)) {
        @file_put_contents($path, json_encode($defaults, JSON_PRETTY_PRINT));
        return $defaults;
    }
    $decoded = json_decode((string)@file_get_contents($path), true);
    $merged = is_array($decoded) ? array_merge($defaults, $decoded) : $defaults;
    if (empty($decoded['hmac_secret'])) {
        @file_put_contents($path, json_encode($merged, JSON_PRETTY_PRINT), LOCK_EX);
    }
    return $merged;
}

function sign_session(array $payload, string $secret): string {
    $b64 = rtrim(strtr(base64_encode(json_encode($payload)), '+/', '-_'), '=');
    $sig = hash_hmac('sha256', $b64, $secret);
    return $b64 . '.' . $sig;
}

function verify_session(string $token, string $secret): ?array {
    $parts = explode('.', $token, 2);
    if (count($parts) !== 2) return null;
    [$b64, $sig] = $parts;
    $expected = hash_hmac('sha256', $b64, $secret);
    if (!hash_equals($expected, $sig)) return null;
    $json = base64_decode(strtr($b64, '-_', '+/'));
    $data = json_decode((string)$json, true);
    if (!is_array($data) || ($data['exp'] ?? 0) < time()) return null;
    return $data;
}

function get_client_ip(): string {
    foreach ([$_SERVER['HTTP_CF_CONNECTING_IP'] ?? '', $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '', $_SERVER['REMOTE_ADDR'] ?? ''] as $raw) {
        if (!$raw) continue;
        $first = trim(explode(',', $raw)[0]);
        if (filter_var($first, FILTER_VALIDATE_IP)) return $first;
    }
    return '0.0.0.0';
}

function lookup_geo(string $ip, string $cacheFile): array {
    if ($ip === '0.0.0.0' || !filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
        return ['city' => 'Local/Private', 'region' => '', 'country' => '', 'isp' => ''];
    }
    $cache = file_exists($cacheFile) ? (json_decode((string)@file_get_contents($cacheFile), true) ?: []) : [];
    if (isset($cache[$ip]) && is_array($cache[$ip])) return $cache[$ip];

    $ctx = stream_context_create(['http' => ['timeout' => 2]]);
    $resp = @file_get_contents("http://ip-api.com/json/{$ip}?fields=status,country,regionName,city,isp", false, $ctx);
    $geo = ['city' => 'Unknown', 'region' => '', 'country' => '', 'isp' => ''];
    if ($resp) {
        $data = json_decode($resp, true);
        if (is_array($data) && ($data['status'] ?? '') === 'success') {
            $geo = [
                'city'    => (string)($data['city'] ?? ''),
                'region'  => (string)($data['regionName'] ?? ''),
                'country' => (string)($data['country'] ?? ''),
                'isp'     => (string)($data['isp'] ?? ''),
            ];
            if (count($cache) > 5000) $cache = array_slice($cache, -2500, null, true);
            $cache[$ip] = $geo;
            @file_put_contents($cacheFile, json_encode($cache), LOCK_EX);
        }
    }
    return $geo;
}

function get_exhibition_phase(array $config): string {
    $today = date('Y-m-d');
    if ($today < ($config['start_date'] ?? $today)) return 'pre_exhibition';
    if ($today > ($config['end_date'] ?? $today)) return 'post_exhibition';
    return 'during_exhibition';
}

function read_json_body(): array {
    $raw = file_get_contents('php://input');
    $decoded = $raw ? json_decode($raw, true) : [];
    return is_array($decoded) ? $decoded : [];
}

function append_jsonl(string $file, array $record): void {
    @file_put_contents($file, json_encode($record, JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);
}

function read_jsonl(string $file, int $limit = 1000): array {
    if (!file_exists($file)) return [];
    $lines = @file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (!is_array($lines)) return [];
    $lines = array_reverse($lines);
    if ($limit > 0) $lines = array_slice($lines, 0, $limit);
    $out = [];
    foreach ($lines as $line) {
        $item = json_decode($line, true);
        if (is_array($item)) $out[] = $item;
    }
    return $out;
}

function require_auth(array $config, string $minRole = 'uploader'): array {
    $token = $_SERVER['HTTP_X_TEAM_TOKEN'] ?? $_GET['token'] ?? $_POST['token'] ?? '';
    if ($token !== '') {
        $session = verify_session($token, (string)$config['hmac_secret']);
        if ($session) {
            $role = $session['role'] ?? 'uploader';
            if ($minRole === 'admin' && $role !== 'admin') {
                http_response_code(403);
                echo json_encode(['ok' => false, 'error' => 'Only content@jinharsh.com and mitul.vasa@jinharsh.com have permission to remove or change settings.']);
                exit;
            }
            return $session;
        }
    }

    $provided = $_SERVER['HTTP_X_TEAM_PASSCODE'] ?? $_GET['passcode'] ?? $_POST['passcode'] ?? '';
    if ($provided !== '' && hash_equals((string)$config['passcode'], (string)$provided)) {
        return ['email' => 'team-passcode@jinharsh.com', 'name' => 'JinHarsh Team', 'role' => 'admin'];
    }

    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Authentication required']);
    exit;
}

function load_custom_catalogs(string $file): array {
    if (!file_exists($file)) return [];
    $data = json_decode((string)@file_get_contents($file), true);
    return is_array($data) ? $data : [];
}

function format_bytes(int $bytes): string {
    if ($bytes >= 1048576) return round($bytes / 1048576, 1) . ' MB PDF';
    if ($bytes >= 1024) return round($bytes / 1024) . ' KB PDF';
    return $bytes . ' B PDF';
}

$config = load_config($CONFIG_FILE);
$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'catalogs': {
        $base = [];
        $baseFile = $BASE_DIR . '/catalogs.json';
        if (file_exists($baseFile)) {
            $decoded = json_decode((string)@file_get_contents($baseFile), true);
            if (is_array($decoded)) $base = $decoded;
        }
        $custom = load_custom_catalogs($CUSTOM_CATS);
        echo json_encode(array_merge(array_reverse($custom), $base), JSON_UNESCAPED_SLASHES);
        break;
    }

    case 'track': {
        $body  = read_json_body();
        $ip    = get_client_ip();
        $geo   = lookup_geo($ip, $GEO_CACHE);
        $phase = get_exhibition_phase($config);

        $event = [
            'id'            => bin2hex(random_bytes(6)),
            'timestamp_ist' => date('Y-m-d H:i:s'),
            'date'          => date('Y-m-d'),
            'hour_ist'      => (int)date('G'),
            'phase'         => $phase,
            'type'          => substr((string)($body['type'] ?? 'visit'), 0, 32),
            'catalog_id'    => substr((string)($body['catalog_id'] ?? ''), 0, 120),
            'catalog_title' => substr((string)($body['catalog_title'] ?? ''), 0, 200),
            'brand'         => substr((string)($body['brand'] ?? ''), 0, 100),
            'email'         => substr((string)($body['email'] ?? ''), 0, 160),
            'name'          => substr((string)($body['name'] ?? ''), 0, 120),
            'company'       => substr((string)($body['company'] ?? ''), 0, 160),
            'source'        => substr((string)($body['source'] ?? ''), 0, 250),
            'referrer'      => substr((string)($body['referrer'] ?? ''), 0, 300),
            'page_url'      => substr((string)($body['page_url'] ?? ''), 0, 300),
            'device'        => substr((string)($body['device'] ?? ''), 0, 40),
            'ip'            => $ip,
            'city'          => $geo['city'],
            'region'        => $geo['region'],
            'country'       => $geo['country'],
            'isp'           => $geo['isp'],
        ];
        append_jsonl($EVENTS_FILE, $event);
        echo json_encode(['ok' => true, 'phase' => $phase, 'city' => $geo['city']]);
        break;
    }

    case 'inquiry': {
        $body  = read_json_body();
        $ip    = get_client_ip();
        $geo   = lookup_geo($ip, $GEO_CACHE);
        $phase = get_exhibition_phase($config);

        $name    = trim((string)($body['name'] ?? ''));
        $email   = trim((string)($body['email'] ?? ''));
        $phone   = trim((string)($body['phone'] ?? ''));
        $company = trim((string)($body['company'] ?? ''));
        $message = trim((string)($body['message'] ?? ''));

        if ($name === '' || ($email === '' && $phone === '')) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Name and email or phone are required']);
            exit;
        }

        $record = [
            'id'            => bin2hex(random_bytes(6)),
            'timestamp_ist' => date('Y-m-d H:i:s'),
            'phase'         => $phase,
            'name'          => $name,
            'email'         => $email,
            'phone'         => $phone,
            'company'       => $company,
            'message'       => $message,
            'catalog_id'    => (string)($body['catalog_id'] ?? ''),
            'catalog_title' => (string)($body['catalog_title'] ?? ''),
            'brand'         => (string)($body['brand'] ?? ''),
            'source'        => (string)($body['source'] ?? ''),
            'ip'            => $ip,
            'city'          => $geo['city'],
            'region'        => $geo['region'],
            'country'       => $geo['country'],
        ];
        append_jsonl($INQUIRY_FILE, $record);

        append_jsonl($EVENTS_FILE, [
            'id'            => bin2hex(random_bytes(6)),
            'timestamp_ist' => $record['timestamp_ist'],
            'date'          => date('Y-m-d'),
            'hour_ist'      => (int)date('G'),
            'phase'         => $phase,
            'type'          => 'query',
            'catalog_id'    => $record['catalog_id'],
            'catalog_title' => $record['catalog_title'],
            'brand'         => $record['brand'],
            'email'         => $email,
            'name'          => $name,
            'company'       => $company,
            'source'        => $record['source'],
            'referrer'      => '',
            'page_url'      => '',
            'device'        => (string)($body['device'] ?? ''),
            'ip'            => $ip,
            'city'          => $geo['city'],
            'region'        => $geo['region'],
            'country'       => $geo['country'],
            'isp'           => $geo['isp'],
        ]);

        $odooPayload = json_encode([
            'name'             => $name,
            'email'            => $email,
            'phone'            => $phone,
            'company'          => $company,
            'message'          => ($record['catalog_title'] ? "[Catalog: {$record['catalog_title']}] " : '') . $message,
            'source_domain'    => 'catalog.jinharsh.com',
            'product_category' => $record['brand'] ?: 'Exhibition Catalog Hub',
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

        echo json_encode(['ok' => true, 'record' => $record]);
        break;
    }

    case 'google_auth': {
        $body = read_json_body();
        $idToken = trim((string)($body['credential'] ?? ''));
        if ($idToken === '') {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Missing Google credential']);
            exit;
        }
        $ctx = stream_context_create(['http' => ['timeout' => 5, 'ignore_errors' => true]]);
        $resp = @file_get_contents('https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($idToken), false, $ctx);
        $info = $resp ? json_decode($resp, true) : null;

        if (!is_array($info) || ($info['aud'] ?? '') !== GOOGLE_CLIENT_ID) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => 'Invalid Google token']);
            exit;
        }
        $email = strtolower(trim((string)($info['email'] ?? '')));
        $verified = ($info['email_verified'] ?? '') === 'true' || ($info['email_verified'] ?? false) === true;
        if (!$verified || $email === '') {
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => 'Google email is not verified']);
            exit;
        }

        $domain = substr(strrchr($email, '@') ?: '', 1);
        $isAdmin = in_array($email, ADMIN_EMAILS, true);
        if ($domain !== ALLOWED_DOMAIN && !$isAdmin) {
            http_response_code(403);
            echo json_encode(['ok' => false, 'error' => "Only @" . ALLOWED_DOMAIN . " accounts are allowed."]);
            exit;
        }

        $role = $isAdmin ? 'admin' : 'uploader';
        $user = [
            'email' => $email,
            'name'  => (string)($info['name'] ?? $email),
            'role'  => $role,
            'exp'   => time() + 86400 * 7,
        ];
        $token = sign_session($user, (string)$config['hmac_secret']);
        echo json_encode(['ok' => true, 'token' => $token, 'user' => $user]);
        break;
    }

    case 'auth': {
        $body = read_json_body();
        $pass = (string)($body['passcode'] ?? '');
        if (hash_equals((string)$config['passcode'], $pass)) {
            $user = [
                'email' => 'team-passcode@jinharsh.com',
                'name'  => 'JinHarsh Team',
                'role'  => 'admin',
                'exp'   => time() + 86400 * 7,
            ];
            $token = sign_session($user, (string)$config['hmac_secret']);
            echo json_encode(['ok' => true, 'token' => $token, 'user' => $user]);
        } else {
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => 'Incorrect passcode']);
        }
        break;
    }

    case 'analytics': {
        $user      = require_auth($config, 'uploader');
        $events    = read_jsonl($EVENTS_FILE, 1500);
        $inquiries = read_jsonl($INQUIRY_FILE, 1000);
        $custom    = load_custom_catalogs($CUSTOM_CATS);

        $visits = 0; $postVisits = 0; $duringVisits = 0; $downloads = 0;
        $cities = []; $emails = [];

        foreach ($events as $ev) {
            $t = $ev['type'] ?? '';
            $p = $ev['phase'] ?? '';
            if ($t === 'visit') {
                $visits++;
                if ($p === 'post_exhibition') $postVisits++;
                if ($p === 'during_exhibition') $duringVisits++;
            } elseif ($t === 'download') {
                $downloads++;
            }
            $c = trim((string)($ev['city'] ?? ''));
            if ($c && $c !== 'Unknown' && $c !== 'Local/Private') $cities[$c] = ($cities[$c] ?? 0) + 1;
            $em = trim((string)($ev['email'] ?? ''));
            if ($em) $emails[$em] = true;
        }
        arsort($cities);

        $safeConfig = $config;
        unset($safeConfig['passcode'], $safeConfig['hmac_secret']);

        echo json_encode([
            'ok'            => true,
            'user'          => $user,
            'config'        => $safeConfig,
            'current_phase' => get_exhibition_phase($config),
            'summary'       => [
                'total_visits'             => $visits,
                'during_exhibition_visits' => $duringVisits,
                'post_exhibition_visits'   => $postVisits,
                'total_downloads'          => $downloads,
                'total_inquiries'          => count($inquiries),
                'known_email_visitors'     => count($emails),
                'top_cities'               => array_slice($cities, 0, 8, true),
            ],
            'events'          => $events,
            'inquiries'       => $inquiries,
            'custom_catalogs' => array_reverse($custom),
        ], JSON_UNESCAPED_SLASHES);
        break;
    }

    case 'save_config': {
        require_auth($config, 'admin');
        $body = read_json_body();
        if (!empty($body['exhibition_name'])) $config['exhibition_name'] = trim((string)$body['exhibition_name']);
        if (!empty($body['start_date']))      $config['start_date'] = trim((string)$body['start_date']);
        if (!empty($body['end_date']))        $config['end_date'] = trim((string)$body['end_date']);
        if (!empty($body['new_passcode']))    $config['passcode'] = trim((string)$body['new_passcode']);
        @file_put_contents($CONFIG_FILE, json_encode($config, JSON_PRETTY_PRINT), LOCK_EX);
        echo json_encode(['ok' => true, 'current_phase' => get_exhibition_phase($config)]);
        break;
    }

    case 'upload_catalog': {
        $user = require_auth($config, 'uploader');
        if (empty($_FILES['pdf']) || $_FILES['pdf']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Please select a valid PDF file.']);
            exit;
        }

        $file = $_FILES['pdf'];
        $ext = strtolower(pathinfo((string)$file['name'], PATHINFO_EXTENSION));
        $head = @file_get_contents($file['tmp_name'], false, null, 0, 5);
        if ($ext !== 'pdf' || $head !== '%PDF-') {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Only valid PDF files are supported.']);
            exit;
        }

        $title       = trim((string)($_POST['title'] ?? ''));
        $brand       = trim((string)($_POST['brand'] ?? 'JinHarsh'));
        $category    = trim((string)($_POST['category'] ?? 'Industrial Catalog'));
        $badge       = trim((string)($_POST['badge'] ?? 'New 2026'));
        $description = trim((string)($_POST['description'] ?? ''));

        if ($title === '') {
            $title = ucwords(str_replace(['_', '-'], ' ', pathinfo((string)$file['name'], PATHINFO_FILENAME)));
        }

        $baseSlug = trim((string)preg_replace('/[^a-z0-9]+/', '-', strtolower($title)), '-') ?: ('catalog-' . time());
        $custom = load_custom_catalogs($CUSTOM_CATS);
        $existingIds = array_column($custom, 'id');
        $slug = $baseSlug;
        $i = 2;
        while (in_array($slug, $existingIds, true) || file_exists($PDF_DIR . '/' . $slug . '.pdf')) {
            $slug = $baseSlug . '-' . $i++;
        }

        $destPath = $PDF_DIR . '/' . $slug . '.pdf';
        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'Failed to save PDF on server.']);
            exit;
        }

        $entry = [
            'id'          => $slug,
            'brand'       => $brand ?: 'JinHarsh',
            'category'    => $category ?: 'Industrial Catalog',
            'title'       => $title,
            'description' => $description ?: "Official {$brand} technical catalog & product specifications supplied by JinHarsh Industrial Solutions.",
            'pdfUrl'      => "/hub/pdfs/{$slug}.pdf",
            'badge'       => $badge ?: 'New 2026',
            'pages'       => format_bytes((int)$file['size']),
            'uploaded_at' => date('Y-m-d H:i:s'),
            'uploaded_by' => trim((string)($_POST['uploaded_by'] ?? '')) ?: ($user['email'] ?? 'Team'),
            'is_custom'   => true,
        ];

        $custom[] = $entry;
        @file_put_contents($CUSTOM_CATS, json_encode($custom, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);

        echo json_encode(['ok' => true, 'catalog' => $entry], JSON_UNESCAPED_SLASHES);
        break;
    }

    case 'delete_catalog': {
        require_auth($config, 'admin');
        $body = read_json_body();
        $id = (string)($body['id'] ?? '');
        $custom = load_custom_catalogs($CUSTOM_CATS);
        $updated = [];
        foreach ($custom as $item) {
            if (($item['id'] ?? '') === $id) {
                $pdfPath = $PDF_DIR . '/' . basename((string)($item['pdfUrl'] ?? ''));
                if (is_file($pdfPath)) @unlink($pdfPath);
                continue;
            }
            $updated[] = $item;
        }
        @file_put_contents($CUSTOM_CATS, json_encode($updated, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);
        echo json_encode(['ok' => true]);
        break;
    }

    case 'export_csv': {
        require_auth($config, 'uploader');
        $type = $_GET['type'] ?? 'events';
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="jinharsh-' . $type . '-' . date('Ymd-His') . '.csv"');
        $out = fopen('php://output', 'w');

        if ($type === 'inquiries') {
            fputcsv($out, ['Timestamp (IST)', 'Phase', 'Name', 'Email', 'Phone', 'Company', 'Catalog', 'Brand', 'City', 'Region', 'Country', 'Message']);
            foreach (read_jsonl($INQUIRY_FILE, 5000) as $r) {
                fputcsv($out, [
                    $r['timestamp_ist'] ?? '', $r['phase'] ?? '', $r['name'] ?? '', $r['email'] ?? '',
                    $r['phone'] ?? '', $r['company'] ?? '', $r['catalog_title'] ?? '', $r['brand'] ?? '',
                    $r['city'] ?? '', $r['region'] ?? '', $r['country'] ?? '', $r['message'] ?? '',
                ]);
            }
        } else {
            fputcsv($out, ['Timestamp (IST)', 'Phase', 'Event Type', 'City', 'Region', 'Country', 'Email', 'Name', 'Company', 'Catalog', 'Brand', 'Source/UTM', 'Referrer', 'Device', 'IP']);
            foreach (read_jsonl($EVENTS_FILE, 5000) as $r) {
                fputcsv($out, [
                    $r['timestamp_ist'] ?? '', $r['phase'] ?? '', $r['type'] ?? '', $r['city'] ?? '',
                    $r['region'] ?? '', $r['country'] ?? '', $r['email'] ?? '', $r['name'] ?? '',
                    $r['company'] ?? '', $r['catalog_title'] ?? '', $r['brand'] ?? '', $r['source'] ?? '',
                    $r['referrer'] ?? '', $r['device'] ?? '', $r['ip'] ?? '',
                ]);
            }
        }
        fclose($out);
        exit;
    }

    case 'health': {
        // can the hub save its records (sign-in, visits, queries, uploads)? Only yes/no and which place, nothing else.
        echo json_encode([
            'ok'     => true,
            'saving' => @is_writable($DATA_DIR) && @is_file($CONFIG_FILE),
            'place'  => basename(dirname($DATA_DIR)) . '/' . basename($DATA_DIR),
        ]);
        break;
    }

    default:
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Unknown action']);
}
