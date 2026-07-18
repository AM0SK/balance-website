-- ============================================================================
-- Balance — довідники. Виконати після schema.sql.
-- Значення збігаються з src/data/catalog.ts (до переходу на API — джерело правди там).
--
-- Щільності отримані діленням «ккал порції ÷ грами порції» зі скріншотів
-- реального застосунку. Через округлення в першоджерелі можливе розходження
-- у кілька відсотків — правити тут, без переливки сайту.
-- ============================================================================

SET NAMES utf8mb4;

INSERT INTO categories (`key`, letter, name, base_kcal, color_var, sort_order) VALUES
  ('A',  'А', 'Крупи та злаки',            240, '--chip-a',  1),
  ('B',  'Б', 'Білкові продукти',          400, '--chip-b',  2),
  ('V',  'В', 'Овочі та гриби',            120, '--chip-v',  3),
  ('G',  'Г', 'Жири та соуси',             128, '--chip-g',  4),
  ('D',  'Д', 'Молочні',                   160, '--chip-d',  5),
  ('E',  'Е', 'Фрукти та ягоди',           200, '--chip-e',  6),
  ('YE', 'Є', 'Горіхи та насіння',          60, '--chip-ye', 7),
  ('ZH', 'Ж', 'Солодощі, снеки, алкоголь', 425, '--chip-zh', 8)
ON DUPLICATE KEY UPDATE
  letter = VALUES(letter), name = VALUES(name),
  base_kcal = VALUES(base_kcal), color_var = VALUES(color_var),
  sort_order = VALUES(sort_order);

INSERT INTO products (id, category_key, name, unit, kcal_per_unit, protein_per_unit, max_units, sort_order) VALUES
  -- А · крупи та злаки
  ('a-beans',      'A', 'Бобові',                  'g',   3.1070, 0.2000, NULL,  1),
  ('a-grain',      'A', 'Будь-яка крупа',          'g',   3.3070, 0.1000, NULL,  2),
  ('a-potato',     'A', 'Картопля',                'g',   0.7710, 0.0200, NULL,  3),
  ('a-corn',       'A', 'Кукурудза свіжа',         'g',   0.8610, 0.0330, NULL,  4),
  ('a-lavash',     'A', 'Лаваш',                   'g',   2.4000, 0.0800, NULL,  5),
  ('a-pasta',      'A', 'Макарони т.с.',           'g',   3.4000, 0.1200, NULL,  6),
  ('a-rice',       'A', 'Рис (не шліфований)',     'g',   3.3070, 0.0750, NULL,  7),
  ('a-crispbread', 'A', 'Хлібці',                  'g',   3.2000, 0.1000, NULL,  8),
  ('a-flour',      'A', 'Цільнозернове борошно',   'g',   3.2000, 0.1110, NULL,  9),
  ('a-bread',      'A', 'Цільнозерновий хліб',     'g',   2.5050, 0.0890, NULL, 10),

  -- Б · білкові продукти
  ('b-poultry',    'B', 'Куряче або індиче філе',  'g',   1.1010, 0.2200, NULL,  1),
  ('b-seafood',    'B', 'Морепродукти',            'g',   1.0000, 0.2000, NULL,  2),
  ('b-liver',      'B', 'Печінка',                 'g',   1.3000, 0.1800, NULL,  3),
  ('b-fish-fat',   'B', 'Риба (від 5% жиру)',      'g',   1.7020, 0.1800, NULL,  4),
  ('b-fish-lean',  'B', 'Риба (до 5% жиру)',       'g',   1.1010, 0.2000, NULL,  5),
  ('b-veal',       'B', 'Телятина',                'g',   1.7020, 0.2000, NULL,  6),
  ('b-eggs',       'B', 'Яйця (цілі)',             'pcs', 78.5000, 6.2500, NULL, 7),

  -- В · овочі та гриби
  ('v-mushrooms',  'V', 'Гриби',                          'g', 0.2000, 0.0350, NULL, 1),
  ('v-veg',        'V', 'Овочі (квашені також і зелень)', 'g', 0.2000, 0.0150, NULL, 2),

  -- Г · жири та соуси
  ('g-avocado',    'G', 'Авокадо',        'g', 1.6000, 0.0200, NULL,   1),
  ('g-oil',        'G', 'Будь-яка олія',  'g', 9.0000, 0.0000, NULL,   2),
  ('g-mustard',    'G', 'Гірчиця',        'g', 0.6500, 0.0500, 100.00, 3),
  ('g-ketchup',    'G', 'Кетчуп',         'g', 1.0000, 0.0100, NULL,   4),
  ('g-mayo',       'G', 'Майонез',        'g', 6.0000, 0.0100, NULL,   5),
  ('g-olives',     'G', 'Оливки',         'g', 1.1550, 0.0100, NULL,   6),

  -- Д · молочні
  ('d-kefir',      'D', 'Кефір 1%',                    'g', 0.4440, 0.0310, NULL, 1),
  ('d-poultry',    'D', 'Куряче або індиче філе',      'g', 1.1000, 0.2200, NULL, 2),
  ('d-milk',       'D', 'Молоко 1%',                   'g', 0.4440, 0.0310, NULL, 3),
  ('d-yogurt',     'D', 'Несолодкий йогурт 1% жиру',   'g', 0.4560, 0.0320, NULL, 4),
  ('d-cottage',    'D', 'Сир кисломолочний нежирний',  'g', 0.8000, 0.1800, NULL, 5),
  ('d-cheese',     'D', 'Сири м''які, тверді, плавлені','g', 3.5000, 0.2000, NULL, 6),
  ('d-sourcream',  'D', 'Сметана 15%',                 'g', 1.5050, 0.0800, NULL, 7),

  -- Е · фрукти та ягоди
  ('e-banana',     'E', 'Банани, виноград, хурма', 'g', 0.9520, 0.0100, NULL, 1),
  ('e-fruit',      'E', 'Фрукти та ягоди',         'g', 0.5000, 0.0100, NULL, 2),

  -- Є · горіхи та насіння
  ('ye-nuts',      'YE', 'Будь-які горіхи', 'g', 6.0000, 0.2000, NULL, 1),
  ('ye-seeds',     'YE', 'Насіння',         'g', 6.0000, 0.2000, NULL, 2),

  -- Ж · солодощі, снеки, алкоголь
  ('zh-banana',    'ZH', 'Банани, виноград, хурма',    'g', 0.9510, 0.0100, NULL,   1),
  ('zh-anything',  'ZH', 'Будь-що (солодощі, снеки)',  'g', 5.0000, 0.0510, NULL,   2),
  ('zh-spirits',   'ZH', 'Міцні алкогольні напої',     'g', 2.2000, 0.0000,  50.00, 3),
  ('zh-beer',      'ZH', 'Пиво',                       'g', 0.4290, 0.0000, 240.00, 4),
  ('zh-wine',      'ZH', 'Сухе вино',                  'g', 0.6930, 0.0000, 150.00, 5),
  ('zh-fruit',     'ZH', 'Фрукти та ягоди',            'g', 0.5000, 0.0100, NULL,   6)
ON DUPLICATE KEY UPDATE
  category_key = VALUES(category_key), name = VALUES(name), unit = VALUES(unit),
  kcal_per_unit = VALUES(kcal_per_unit), protein_per_unit = VALUES(protein_per_unit),
  max_units = VALUES(max_units), sort_order = VALUES(sort_order);

INSERT INTO workout_types (id, name, sort_order) VALUES
  ('gym',   'Тренування в залі', 1),
  ('run',   'Пробіжка',          2),
  ('walk',  'Ходьба',            3),
  ('bike',  'Велосипед',         4),
  ('swim',  'Плавання',          5),
  ('yoga',  'Йога',              6),
  ('other', 'Інше',              7)
ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order);

INSERT INTO measurement_kinds (`key`, name, unit, sort_order) VALUES
  ('weight', 'Вага',            'кг', 1),
  ('arm',    'Обхват плеча',    'см', 2),
  ('chest',  'Обхват грудей',   'см', 3),
  ('waist',  'Обхват талії',    'см', 4),
  ('hips',   'Обхват стегон',   'см', 5)
ON DUPLICATE KEY UPDATE name = VALUES(name), unit = VALUES(unit), sort_order = VALUES(sort_order);
