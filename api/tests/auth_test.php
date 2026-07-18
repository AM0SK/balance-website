<?php
declare(strict_types=1);

/**
 * Тести перевірки підпису Telegram. Запуск: php api/tests/auth_test.php
 *
 * Без Composer і PHPUnit — хостинг shared, зайві залежності тут ні до чого.
 * Ця логіка вартує тестів: помилка в ній означає, що чужий підпис пройде
 * і сторонній отримає доступ до чужих даних.
 */

require __DIR__ . '/../lib/auth.php';

const TOKEN = '123456:TEST-BOT-TOKEN';

$passed = 0;
$failed = 0;

function check(string $name, bool $condition): void
{
    global $passed, $failed;
    if ($condition) {
        $passed++;
        echo "  ok  $name\n";
    } else {
        $failed++;
        echo "FAIL  $name\n";
    }
}

/** Збирає коректно підписаний initData так само, як це робить Telegram. */
function signInitData(array $fields, string $token): string
{
    ksort($fields);
    $pairs = [];
    foreach ($fields as $k => $v) {
        $pairs[] = "$k=$v";
    }
    $secretKey = hash_hmac('sha256', $token, 'WebAppData', true);
    $hash = hash_hmac('sha256', implode("\n", $pairs), $secretKey);

    return http_build_query($fields + ['hash' => $hash]);
}

$user = json_encode(['id' => 42, 'first_name' => 'Олена'], JSON_UNESCAPED_UNICODE);
$validFields = ['auth_date' => (string) time(), 'query_id' => 'AAA', 'user' => $user];

// --- Коректний підпис проходить ------------------------------------------
$result = verifyTelegramInitData(signInitData($validFields, TOKEN), TOKEN);
check('коректний підпис приймається', $result !== null);
check('поля повертаються', $result !== null && $result['query_id'] === 'AAA');

// --- Підробки відхиляються ------------------------------------------------
check(
    'підпис від іншого токена відхиляється',
    verifyTelegramInitData(signInitData($validFields, 'ІНШИЙ-ТОКЕН'), TOKEN) === null
);

$tampered = signInitData($validFields, TOKEN);
$tampered = str_replace('id%22%3A42', 'id%22%3A99', $tampered);
check('змінений user_id ламає підпис', verifyTelegramInitData($tampered, TOKEN) === null);

check('порожній initData відхиляється', verifyTelegramInitData('', TOKEN) === null);
check('порожній токен відхиляється', verifyTelegramInitData(signInitData($validFields, TOKEN), '') === null);

check(
    'initData без hash відхиляється',
    verifyTelegramInitData(http_build_query($validFields), TOKEN) === null
);

// --- Протермінований підпис ------------------------------------------------
$old = ['auth_date' => (string) (time() - 90000), 'user' => $user];
check(
    'протермінований підпис відхиляється',
    verifyTelegramInitData(signInitData($old, TOKEN), TOKEN) === null
);
check(
    'той самий підпис у межах строку приймається',
    verifyTelegramInitData(signInitData($old, TOKEN), TOKEN, 100000) !== null
);

// --- auth_date обов'язковий ------------------------------------------------
check(
    'відсутній auth_date відхиляється',
    verifyTelegramInitData(signInitData(['user' => $user], TOKEN), TOKEN) === null
);

echo "\n$passed пройдено, $failed провалено\n";
exit($failed === 0 ? 0 : 1);
