<?php
declare(strict_types=1);

/**
 * Перевірка авторизації Telegram Web App.
 *
 * Telegram передає у фронтенд рядок initData — набір полів плюс поле hash.
 * Підпис рахується так (документація Telegram Bot API, Web App):
 *   secret_key = HMAC_SHA256(key: "WebAppData", data: <bot_token>)
 *   hash       = HMAC_SHA256(key: secret_key, data: <data_check_string>)
 * де data_check_string — усі поля крім hash, відсортовані за іменем,
 * у вигляді "key=value", склеєні через \n.
 *
 * Без цієї перевірки будь-хто міг би підставити чужий telegram_id
 * і читати та писати чужі дані.
 */

/**
 * Розбирає й перевіряє initData. Повертає масив полів або null, якщо підпис невірний.
 *
 * @param string $initData Рядок з window.Telegram.WebApp.initData
 * @param string $botToken Токен від @BotFather
 * @param int    $maxAgeSeconds Скільки живе підпис. Захищає від повторного
 *                              використання перехопленого initData.
 */
function verifyTelegramInitData(
    string $initData,
    string $botToken,
    int $maxAgeSeconds = 86400
): ?array {
    if ($initData === '' || $botToken === '') {
        return null;
    }

    parse_str($initData, $fields);
    if (!isset($fields['hash']) || !is_string($fields['hash'])) {
        return null;
    }

    $providedHash = $fields['hash'];
    unset($fields['hash']);

    // Порядок полів має бути строго алфавітний — інакше підпис не зійдеться.
    ksort($fields);
    $pairs = [];
    foreach ($fields as $key => $value) {
        if (is_string($value)) {
            $pairs[] = $key . '=' . $value;
        }
    }
    $dataCheckString = implode("\n", $pairs);

    $secretKey = hash_hmac('sha256', $botToken, 'WebAppData', true);
    $expectedHash = hash_hmac('sha256', $dataCheckString, $secretKey);

    // hash_equals — порівняння за сталий час, щоб підпис не можна було підібрати.
    if (!hash_equals($expectedHash, $providedHash)) {
        return null;
    }

    // Протермінований підпис не приймаємо.
    $authDate = isset($fields['auth_date']) ? (int) $fields['auth_date'] : 0;
    if ($authDate <= 0 || (time() - $authDate) > $maxAgeSeconds) {
        return null;
    }

    return $fields;
}

/**
 * Дістає користувача з перевіреного initData і створює його, якщо це перший вхід.
 * Повертає рядок users або null, якщо авторизація не вдалася.
 */
function authenticate(PDO $pdo, array $config): ?array
{
    $initData = $_SERVER['HTTP_X_TELEGRAM_INIT_DATA'] ?? '';

    // Локальна розробка без Telegram. На бойовому сервері dev_mode = false.
    if ($initData === '' && !empty($config['dev_mode'])) {
        return findOrCreateUser($pdo, 0, 'Тестовий користувач', null);
    }

    $fields = verifyTelegramInitData($initData, (string) ($config['telegram_bot_token'] ?? ''));
    if ($fields === null) {
        return null;
    }

    $user = json_decode((string) ($fields['user'] ?? ''), true);
    if (!is_array($user) || !isset($user['id'])) {
        return null;
    }

    $name = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
    if ($name === '') {
        $name = (string) ($user['username'] ?? 'Профіль');
    }

    return findOrCreateUser($pdo, (int) $user['id'], $name, $user['photo_url'] ?? null);
}

function findOrCreateUser(PDO $pdo, int $telegramId, string $name, ?string $photoUrl): array
{
    $select = $pdo->prepare('SELECT * FROM users WHERE telegram_id = ?');
    $select->execute([$telegramId]);
    $user = $select->fetch();

    if ($user !== false) {
        return $user;
    }

    // Ім'я та фото з Telegram беруться лише при створенні: далі користувач
    // може змінити їх у Налаштуваннях, і перезаписувати їх не можна.
    $insert = $pdo->prepare(
        'INSERT INTO users (telegram_id, name, photo_url) VALUES (?, ?, ?)'
    );
    $insert->execute([$telegramId, $name, $photoUrl]);

    $select->execute([$telegramId]);
    return $select->fetch();
}
