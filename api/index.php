<?php
declare(strict_types=1);

/**
 * Balance API — єдина точка входу.
 * Маршрути: /api/<resource>. Розкладку робить .htaccess.
 *
 * Хостинг — shared PHP 8.4 без Composer і без SSH, тому жодних залежностей:
 * тільки PDO і hash_hmac зі стандартної бібліотеки.
 */

require __DIR__ . '/lib/http.php';
require __DIR__ . '/lib/auth.php';

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    fail('Немає config.php — скопіюйте config.example.php і заповніть', 500);
}
$config = require $configPath;

// Помилки БД чи PHP не мають витікати назовні: у них бувають шляхи й запити.
set_exception_handler(static function (Throwable $e) use ($config): void {
    if (!empty($config['dev_mode'])) {
        fail($e->getMessage(), 500);
    }
    error_log('[balance] ' . $e->getMessage());
    fail('Внутрішня помилка сервера', 500);
});

header('Vary: Origin');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Те саме число, що DEFAULT у users.daily_kcal (schema.sql) і DEFAULT_DAILY_KCAL
// на фронтенді (src/lib/types.ts) — за ним Головна визначає, чи ліміт ще не задано.
const DEFAULT_DAILY_KCAL = 1766;

$pdo = connectDatabase($config['db']);

$user = authenticate($pdo, $config);
if ($user === null) {
    fail('Не авторизовано. Відкрийте застосунок через Telegram.', 401);
}
$userId = (int) $user['id'];

$path = trim((string) ($_GET['route'] ?? ''), '/');
$method = $_SERVER['REQUEST_METHOD'];

// Дату можна передати параметром, інакше — сьогодні за часом сервера.
$today = (new DateTimeImmutable('today'))->format('Y-m-d');

switch ("$method /$path") {
    // -----------------------------------------------------------------------
    // Усе потрібне для старту застосунку одним запитом: довідники + профіль
    // + дані користувача. Мобільна мережа — кожен зайвий roundtrip помітний.
    // -----------------------------------------------------------------------
    case 'GET /bootstrap':
        $day = isset($_GET['day']) ? requireDate($_GET, 'day') : $today;

        sendJson([
            'profile' => [
                'telegramId'          => (int) $user['telegram_id'],
                'name'                => $user['name'],
                'photoUrl'            => $user['photo_url'],
                'dailyKcal'           => (int) $user['daily_kcal'],
                'stepsGoal'           => (int) $user['steps_goal'],
                'workoutsPerWeekGoal' => (int) $user['workouts_per_week_goal'],
            ],
            'categories'       => fetchCategories($pdo),
            'products'         => fetchProducts($pdo),
            'workoutTypes'     => $pdo->query('SELECT id, name FROM workout_types ORDER BY sort_order')->fetchAll(),
            'measurementKinds' => $pdo->query('SELECT `key`, name, unit FROM measurement_kinds ORDER BY sort_order')->fetchAll(),
            'day'              => $day,
            'consumed'         => fetchConsumed($pdo, $userId, $day),
            'workouts'         => fetchWorkouts($pdo, $userId),
            'steps'            => fetchSteps($pdo, $userId),
            'measurements'     => fetchMeasurements($pdo, $userId),
        ]);

    // -----------------------------------------------------------------------
    case 'PATCH /profile':
        $body = jsonBody();
        $sets = [];
        $args = [];

        if (array_key_exists('name', $body)) {
            $sets[] = 'name = ?';
            $args[] = requireString($body, 'name', 120);
        }
        if (array_key_exists('photoUrl', $body)) {
            $url = $body['photoUrl'];
            if ($url !== null && !filter_var((string) $url, FILTER_VALIDATE_URL)) {
                fail('photoUrl має бути коректним посиланням або null');
            }
            $sets[] = 'photo_url = ?';
            $args[] = $url === null ? null : (string) $url;
        }
        if (array_key_exists('dailyKcal', $body)) {
            $sets[] = 'daily_kcal = ?';
            $args[] = (int) requireNumber($body, 'dailyKcal', 800, 5000);
        }
        if (array_key_exists('stepsGoal', $body)) {
            $sets[] = 'steps_goal = ?';
            $args[] = (int) requireNumber($body, 'stepsGoal', 1000, 100000);
        }
        if (array_key_exists('workoutsPerWeekGoal', $body)) {
            $sets[] = 'workouts_per_week_goal = ?';
            $args[] = (int) requireNumber($body, 'workoutsPerWeekGoal', 1, 14);
        }

        if ($sets === []) {
            fail('Нема чого оновлювати');
        }

        $args[] = $userId;
        $pdo->prepare('UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($args);
        sendJson(['ok' => true]);

    // -----------------------------------------------------------------------
    // Скільки продукту спожито за день. units = 0 прибирає запис.
    // -----------------------------------------------------------------------
    case 'PUT /consumption':
        $body = jsonBody();
        $productId = requireString($body, 'productId', 32);
        $day = isset($body['day']) ? requireDate($body, 'day') : $today;
        $units = requireNumber($body, 'units', 0, 100000);

        $exists = $pdo->prepare('SELECT 1 FROM products WHERE id = ? AND is_active = 1');
        $exists->execute([$productId]);
        if ($exists->fetchColumn() === false) {
            fail('Невідомий продукт');
        }

        if ($units <= 0) {
            $pdo->prepare('DELETE FROM consumption WHERE user_id = ? AND product_id = ? AND day = ?')
                ->execute([$userId, $productId, $day]);
        } else {
            // Аліас `new` замість застарілої VALUES(col): MySQL 8.0.20+
            // попереджає про неї, і в майбутніх версіях її приберуть.
            $pdo->prepare(
                'INSERT INTO consumption (user_id, product_id, day, units) VALUES (?, ?, ?, ?) AS new
                 ON DUPLICATE KEY UPDATE units = new.units'
            )->execute([$userId, $productId, $day, $units]);
        }

        sendJson(['ok' => true, 'consumed' => fetchConsumed($pdo, $userId, $day)]);

    // -----------------------------------------------------------------------
    case 'POST /workouts':
        $body = jsonBody();
        $typeId = requireString($body, 'typeId', 16);
        $day = requireDate($body, 'day');
        $kcal = (int) requireNumber($body, 'burnedKcal', 1, 20000);

        $exists = $pdo->prepare('SELECT 1 FROM workout_types WHERE id = ?');
        $exists->execute([$typeId]);
        if ($exists->fetchColumn() === false) {
            fail('Невідомий тип тренування');
        }

        $pdo->prepare('INSERT INTO workouts (user_id, type_id, day, burned_kcal) VALUES (?, ?, ?, ?)')
            ->execute([$userId, $typeId, $day, $kcal]);

        sendJson(['ok' => true, 'workouts' => fetchWorkouts($pdo, $userId)]);

    case 'DELETE /workouts':
        $id = (int) requireNumber($_GET, 'id', 1, PHP_INT_MAX);
        $pdo->prepare('DELETE FROM workouts WHERE id = ? AND user_id = ?')->execute([$id, $userId]);
        sendJson(['ok' => true, 'workouts' => fetchWorkouts($pdo, $userId)]);

    // -----------------------------------------------------------------------
    // Кроки за день перезаписуються, а не додаються другим записом.
    // -----------------------------------------------------------------------
    case 'PUT /steps':
        $body = jsonBody();
        $day = requireDate($body, 'day');
        $steps = (int) requireNumber($body, 'steps', 0, 300000);

        if ($steps <= 0) {
            $pdo->prepare('DELETE FROM steps WHERE user_id = ? AND day = ?')->execute([$userId, $day]);
        } else {
            $pdo->prepare(
                'INSERT INTO steps (user_id, day, steps) VALUES (?, ?, ?) AS new
                 ON DUPLICATE KEY UPDATE steps = new.steps'
            )->execute([$userId, $day, $steps]);
        }

        sendJson(['ok' => true, 'steps' => fetchSteps($pdo, $userId)]);

    // -----------------------------------------------------------------------
    case 'PUT /measurements':
        $body = jsonBody();
        $kind = requireString($body, 'key', 16);
        $day = requireDate($body, 'day');
        $value = requireNumber($body, 'value', 0.1, 500);

        $exists = $pdo->prepare('SELECT 1 FROM measurement_kinds WHERE `key` = ?');
        $exists->execute([$kind]);
        if ($exists->fetchColumn() === false) {
            fail('Невідомий тип заміру');
        }

        $pdo->prepare(
            'INSERT INTO measurements (user_id, kind_key, day, value) VALUES (?, ?, ?, ?) AS new
             ON DUPLICATE KEY UPDATE value = new.value'
        )->execute([$userId, $kind, $day, $value]);

        sendJson(['ok' => true, 'measurements' => fetchMeasurements($pdo, $userId)]);

    // -----------------------------------------------------------------------
    // Скидання прогресу: чистимо зібрану статистику й повертаємо денний ліміт
    // калорій до дефолту — Головна знову підказує його задати. Дані з Telegram
    // (id, ім'я, аватар) і решта цілей (кроки, тренування) лишаються — це не
    // «видалення акаунта».
    // -----------------------------------------------------------------------
    case 'POST /reset-progress':
        $pdo->beginTransaction();
        try {
            foreach (['consumption', 'workouts', 'steps', 'measurements'] as $table) {
                $pdo->prepare("DELETE FROM $table WHERE user_id = ?")->execute([$userId]);
            }
            $pdo->prepare('UPDATE users SET daily_kcal = ? WHERE id = ?')
                ->execute([DEFAULT_DAILY_KCAL, $userId]);
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        sendJson([
            'ok'           => true,
            'dailyKcal'    => DEFAULT_DAILY_KCAL,
            'consumed'     => fetchConsumed($pdo, $userId, $today),
            'workouts'     => fetchWorkouts($pdo, $userId),
            'steps'        => fetchSteps($pdo, $userId),
            'measurements' => fetchMeasurements($pdo, $userId),
        ]);

    // -----------------------------------------------------------------------
    default:
        fail('Невідомий маршрут: ' . $method . ' /' . $path, 404);
}

// ---------------------------------------------------------------------------
// Читання. Ключі — camelCase, щоб фронтенд не перекладав.
// ---------------------------------------------------------------------------

function fetchCategories(PDO $pdo): array
{
    $rows = $pdo->query(
        'SELECT `key`, letter, name, base_kcal, color_var FROM categories ORDER BY sort_order'
    )->fetchAll();

    return array_map(static fn(array $r): array => [
        'key'      => $r['key'],
        'letter'   => $r['letter'],
        'name'     => $r['name'],
        'baseKcal' => (int) $r['base_kcal'],
        'colorVar' => $r['color_var'],
    ], $rows);
}

function fetchProducts(PDO $pdo): array
{
    $rows = $pdo->query(
        'SELECT id, category_key, name, unit, kcal_per_unit, protein_per_unit, max_units
         FROM products WHERE is_active = 1
         ORDER BY category_key, sort_order'
    )->fetchAll();

    return array_map(static fn(array $r): array => [
        'id'             => $r['id'],
        'categoryKey'    => $r['category_key'],
        'name'           => $r['name'],
        'unit'           => $r['unit'],
        'kcalPerUnit'    => (float) $r['kcal_per_unit'],
        'proteinPerUnit' => (float) $r['protein_per_unit'],
        'maxUnits'       => $r['max_units'] === null ? null : (float) $r['max_units'],
    ], $rows);
}

/**
 * Мапа productId → units за одну дату.
 *
 * Повертається об'єктом, а не масивом, свідомо: порожній PHP-масив
 * json_encode серіалізує як [], і фронтенд, який чекає мапу, ламається.
 */
function fetchConsumed(PDO $pdo, int $userId, string $day): stdClass
{
    $stmt = $pdo->prepare('SELECT product_id, units FROM consumption WHERE user_id = ? AND day = ?');
    $stmt->execute([$userId, $day]);

    $result = new stdClass();
    foreach ($stmt->fetchAll() as $row) {
        $result->{$row['product_id']} = (float) $row['units'];
    }

    return $result;
}

function fetchWorkouts(PDO $pdo, int $userId, int $limit = 60): array
{
    $stmt = $pdo->prepare(
        'SELECT id, type_id, day, burned_kcal FROM workouts
         WHERE user_id = ? ORDER BY day DESC, id DESC LIMIT ?'
    );
    $stmt->execute([$userId, $limit]);

    return array_map(static fn(array $r): array => [
        'id'         => (string) $r['id'],
        'typeId'     => $r['type_id'],
        'date'       => $r['day'],
        'burnedKcal' => (int) $r['burned_kcal'],
    ], $stmt->fetchAll());
}

function fetchSteps(PDO $pdo, int $userId, int $limit = 60): array
{
    $stmt = $pdo->prepare(
        'SELECT id, day, steps FROM steps WHERE user_id = ? ORDER BY day DESC LIMIT ?'
    );
    $stmt->execute([$userId, $limit]);

    return array_map(static fn(array $r): array => [
        'id'    => (string) $r['id'],
        'date'  => $r['day'],
        'steps' => (int) $r['steps'],
    ], $stmt->fetchAll());
}

function fetchMeasurements(PDO $pdo, int $userId, int $limit = 200): array
{
    $stmt = $pdo->prepare(
        'SELECT id, kind_key, day, value FROM measurements
         WHERE user_id = ? ORDER BY day DESC LIMIT ?'
    );
    $stmt->execute([$userId, $limit]);

    return array_map(static fn(array $r): array => [
        'id'    => (string) $r['id'],
        'key'   => $r['kind_key'],
        'date'  => $r['day'],
        'value' => (float) $r['value'],
    ], $stmt->fetchAll());
}
