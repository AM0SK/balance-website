<?php
declare(strict_types=1);

/**
 * Підключення до БД. Помилки — винятками, рядки — асоціативними масивами.
 *
 * dsn можна задати явно — цим користується димовий тест, щоб підняти API
 * на SQLite у пам'яті. У бойовому конфігу його немає, і збирається MySQL-DSN.
 */
function connectDatabase(array $db): PDO
{
    $dsn = $db['dsn']
        ?? sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $db['host'], $db['name']);

    return new PDO($dsn, $db['user'] ?? null, $db['password'] ?? null, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        // Справжні підготовлені запити, а не емуляція: інакше числа приїжджають
        // рядками і типи в JSON пливуть.
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
}

function sendJson(mixed $data, int $status = 200): never
{
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    /*
     * json_encode повертає false, наприклад, на битому UTF-8 з бази.
     * Раніше це давало 200 з порожнім тілом — найгірший результат:
     * клієнт вважає запит успішним і падає на null.
     * Тепер це чесна 500 із назвою розділу, що не закодувався.
     */
    if ($json === false) {
        $reason = json_last_error_msg();
        $broken = [];
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                if (json_encode($value, JSON_UNESCAPED_UNICODE) === false) {
                    $broken[] = $key;
                }
            }
        }

        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'error'  => 'Не вдалося закодувати відповідь: ' . $reason,
            'broken' => $broken,
        ], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
        exit;
    }

    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo $json;
    exit;
}

function fail(string $message, int $status = 400): never
{
    sendJson(['error' => $message], $status);
}

/** Тіло запиту як масив. Порожнє тіло — порожній масив, а не помилка. */
function jsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        fail('Тіло запиту не є коректним JSON');
    }

    return $data;
}

/** Дата у форматі YYYY-MM-DD. Будь-що інше — помилка, а не мовчазний підмін. */
function requireDate(array $body, string $field): string
{
    $value = (string) ($body[$field] ?? '');
    $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $value);

    if ($parsed === false || $parsed->format('Y-m-d') !== $value) {
        fail("Поле $field має бути датою у форматі YYYY-MM-DD");
    }

    return $value;
}

/** Число в заданих межах. */
function requireNumber(array $body, string $field, float $min, float $max): float
{
    if (!isset($body[$field]) || !is_numeric($body[$field])) {
        fail("Поле $field має бути числом");
    }

    $value = (float) $body[$field];
    if ($value < $min || $value > $max) {
        fail("Поле $field має бути в межах від $min до $max");
    }

    return $value;
}

/**
 * Довжина рядка в символах.
 *
 * mbstring на Hostia є, але покладатись на це не варто: без нього кожен запис
 * із текстовим полем падав би з 500. Запасний варіант рахує символи UTF-8
 * регуляркою — для перевірки довжини цього досить.
 */
function stringLength(string $value): int
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($value, 'UTF-8');
    }

    return (int) preg_match_all('/./us', $value);
}

function requireString(array $body, string $field, int $maxLength): string
{
    $value = trim((string) ($body[$field] ?? ''));
    if ($value === '') {
        fail("Поле $field не може бути порожнім");
    }
    if (stringLength($value) > $maxLength) {
        fail("Поле $field довше за $maxLength символів");
    }

    return $value;
}
