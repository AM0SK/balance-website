<?php
declare(strict_types=1);

/**
 * Перевірка розгортання. Відкрити в браузері: https://balance.amosk.com.ua/api/check.php
 *
 * Показує, що на сервері не так: версія PHP, розширення, конфіг, підключення
 * до БД, наявність таблиць і довідників. Пароль і токен НЕ показуються.
 *
 * Після успішного запуску файл варто видалити з сервера.
 */

header('Content-Type: text/plain; charset=utf-8');

$ok = 0;
$bad = 0;

function line(string $name, bool $good, string $detail = ''): void
{
    global $ok, $bad;
    $good ? $ok++ : $bad++;
    printf("%s  %s%s\n", $good ? ' ok ' : 'FAIL', $name, $detail === '' ? '' : " — $detail");
}

echo "Balance — перевірка сервера\n";
echo str_repeat('=', 46) . "\n\n";

line('PHP 8.1+', PHP_VERSION_ID >= 80100, 'версія ' . PHP_VERSION);
line('розширення pdo_mysql', extension_loaded('pdo_mysql'));
line('розширення mbstring', extension_loaded('mbstring'));
line('функція hash_hmac', function_exists('hash_hmac'));

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    line('config.php існує', false, 'скопіюйте config.example.php у config.php');
    echo "\nБез конфігу далі перевіряти нема чого.\n";
    exit(1);
}
line('config.php існує', true);

$config = require $configPath;

$token = (string) ($config['telegram_bot_token'] ?? '');
line(
    'токен бота заповнено',
    $token !== '' && !str_contains($token, 'ЗАПОВНИТИ'),
    $token === '' ? 'порожній' : (str_contains($token, 'ЗАПОВНИТИ') ? 'лишилась заглушка' : 'довжина ' . strlen($token))
);

// Найнебезпечніша помилка розгортання: dev_mode пускає без авторизації.
line(
    'dev_mode вимкнено',
    empty($config['dev_mode']),
    empty($config['dev_mode']) ? '' : 'УВІМКНЕНО — будь-хто матиме доступ без Telegram!'
);

try {
    require __DIR__ . '/lib/http.php';
    $pdo = connectDatabase($config['db']);
    line('підключення до БД', true, (string) $config['db']['name']);
} catch (Throwable $e) {
    line('підключення до БД', false, $e->getMessage());
    echo "\nПеревірте host / name / user / password у config.php.\n";
    exit(1);
}

$expected = [
    'users' => null,
    'categories' => 8,
    'products' => 40,
    'consumption' => null,
    'workout_types' => 7,
    'workouts' => null,
    'steps' => null,
    'measurement_kinds' => 5,
    'measurements' => null,
];

foreach ($expected as $table => $minRows) {
    try {
        $count = (int) $pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
        if ($minRows === null) {
            line("таблиця $table", true, "$count рядків");
        } else {
            line("довідник $table", $count >= $minRows, "$count рядків, очікується $minRows");
        }
    } catch (Throwable $e) {
        line("таблиця $table", false, 'немає — виконайте schema.sql, потім seed.sql');
    }
}

echo "\n" . str_repeat('=', 46) . "\n";
printf("%d пройдено, %d провалено\n", $ok, $bad);
echo $bad === 0
    ? "\nСервер готовий. Видаліть check.php.\n"
    : "\nВиправте позначене FAIL і перезапустіть перевірку.\n";
