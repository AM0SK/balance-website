-- ============================================================================
-- Balance — схема БД. MySQL 8.0 (Hostia).
-- Виконати один раз через phpMyAdmin, далі — seed.sql з довідниками.
--
-- Кодування utf8mb4: назви продуктів українською, а в майбутньому можливі емодзі.
-- ============================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ---------------------------------------------------------------------------
-- Користувачі. Один рядок = один Telegram-акаунт.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  telegram_id            BIGINT UNSIGNED NOT NULL,
  name                   VARCHAR(120) NOT NULL DEFAULT '',
  photo_url              VARCHAR(512) NULL,
  -- Денний ліміт калорій задає користувач; від нього рахуються бюджети категорій.
  daily_kcal             SMALLINT UNSIGNED NOT NULL DEFAULT 1766,
  steps_goal             MEDIUMINT UNSIGNED NOT NULL DEFAULT 12000,
  workouts_per_week_goal TINYINT UNSIGNED NOT NULL DEFAULT 3,
  created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_telegram (telegram_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Категорії обміну (А–Ж). base_kcal — денний бюджет категорії при 1766 ккал.
-- Продукти всередині категорії ділять цей бюджет між собою.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  `key`      VARCHAR(4) NOT NULL,
  letter     VARCHAR(2) NOT NULL,
  name       VARCHAR(80) NOT NULL,
  base_kcal  SMALLINT UNSIGNED NOT NULL,
  color_var  VARCHAR(32) NOT NULL,
  sort_order TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Продукти. Зберігається ЩІЛЬНІСТЬ (на 1 г або 1 шт), а не грамівка порції:
-- грамівка — похідна від бюджету категорії і змінюється протягом дня.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id               VARCHAR(32) NOT NULL,
  category_key     VARCHAR(4) NOT NULL,
  name             VARCHAR(120) NOT NULL,
  unit             ENUM('g','pcs') NOT NULL DEFAULT 'g',
  kcal_per_unit    DECIMAL(9,4) UNSIGNED NOT NULL,
  protein_per_unit DECIMAL(9,4) UNSIGNED NOT NULL,
  -- Власна стеля продукту в одиницях, якщо вона жорсткіша за бюджет категорії
  -- (алкоголь, гірчиця). NULL — стелі немає.
  max_units        DECIMAL(9,2) UNSIGNED NULL,
  sort_order       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active        TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_products_category (category_key, sort_order),
  CONSTRAINT fk_products_category FOREIGN KEY (category_key)
    REFERENCES categories(`key`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Спожите за день. Один рядок = один продукт за одну дату.
-- Унікальний ключ дає UPSERT замість дублікатів при повторному вводі.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consumption (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  product_id VARCHAR(32) NOT NULL,
  day        DATE NOT NULL,
  units      DECIMAL(9,2) UNSIGNED NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_consumption (user_id, product_id, day),
  KEY idx_consumption_day (user_id, day),
  CONSTRAINT fk_consumption_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_consumption_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Довідник типів тренувань. Ккал користувач вводить сам.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workout_types (
  id         VARCHAR(16) NOT NULL,
  name       VARCHAR(60) NOT NULL,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workouts (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  type_id     VARCHAR(16) NOT NULL,
  day         DATE NOT NULL,
  burned_kcal SMALLINT UNSIGNED NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_workouts_user_day (user_id, day),
  CONSTRAINT fk_workouts_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_workouts_type FOREIGN KEY (type_id)
    REFERENCES workout_types(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Кроки. Один запис на день — повторний ввід перезаписує.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS steps (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  day        DATE NOT NULL,
  steps      MEDIUMINT UNSIGNED NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_steps (user_id, day),
  CONSTRAINT fk_steps_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Заміри тіла. Вага живе тут само, як і обхвати.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS measurement_kinds (
  `key`      VARCHAR(16) NOT NULL,
  name       VARCHAR(60) NOT NULL,
  unit       VARCHAR(8) NOT NULL,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS measurements (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  kind_key   VARCHAR(16) NOT NULL,
  day        DATE NOT NULL,
  value      DECIMAL(6,2) UNSIGNED NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_measurements (user_id, kind_key, day),
  KEY idx_measurements_kind (user_id, kind_key, day),
  CONSTRAINT fk_measurements_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_measurements_kind FOREIGN KEY (kind_key)
    REFERENCES measurement_kinds(`key`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
