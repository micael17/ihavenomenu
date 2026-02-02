-- =============================================
-- 모목디 (뭐먹지) DB 스키마 (SQLite)
-- =============================================

-- 재료 테이블
CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,           -- 재료명 (예: 미역, 소고기)
    category TEXT,                        -- 분류 (예: 해물류, 육류, 채소류)
    parent_id INTEGER,                    -- 상위 재료 (예: 다진소고기 → 소고기)
    is_base BOOLEAN DEFAULT 0,            -- 기본 재료 여부 (검색용)
    aliases TEXT,                         -- 다른 이름들 JSON (예: ["쇠고기", "한우"])
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES ingredients(id) ON DELETE SET NULL
);

-- 요리 테이블
CREATE TABLE IF NOT EXISTS dishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                   -- 요리명 (예: 미역국)
    category TEXT,                        -- 분류 (예: 국/탕, 반찬, 메인)
    image_url TEXT,                       -- 대표 이미지
    description TEXT,                     -- 요리 설명
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 요리-재료 매핑 테이블 (핵심!)
CREATE TABLE IF NOT EXISTS dish_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dish_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    is_main BOOLEAN DEFAULT 0,            -- 주재료 여부
    is_optional BOOLEAN DEFAULT 0,        -- 선택 재료 여부
    amount TEXT,                          -- 양 (예: 100g, 1개)
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
    UNIQUE(dish_id, ingredient_id)
);

-- 레시피 테이블 (원본 저장 - 나중에 벡터화용)
CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dish_id INTEGER,                      -- 연결된 요리
    title TEXT NOT NULL,                  -- 레시피 제목
    source TEXT,                          -- 출처 (예: 만개의레시피)
    source_id TEXT,                       -- 원본 ID
    description TEXT,                     -- 요리 소개
    ingredients_raw TEXT,                 -- 원본 재료 텍스트
    cooking_steps TEXT,                   -- 조리 순서 (JSON 배열)
    cooking_method TEXT,                  -- 조리방법 (끓이기, 볶음 등)
    cooking_time TEXT,                    -- 조리시간
    servings TEXT,                        -- 인분
    difficulty TEXT,                      -- 난이도
    image_url TEXT,                       -- 이미지 URL
    view_count INTEGER DEFAULT 0,         -- 조회수
    recommend_count INTEGER DEFAULT 0,    -- 추천수
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE SET NULL
);

-- =============================================
-- 인덱스 (검색 성능 향상)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);
CREATE INDEX IF NOT EXISTS idx_ingredients_parent ON ingredients(parent_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_base ON ingredients(is_base);
CREATE INDEX IF NOT EXISTS idx_dishes_name ON dishes(name);
CREATE INDEX IF NOT EXISTS idx_dishes_category ON dishes(category);
CREATE INDEX IF NOT EXISTS idx_dish_ingredients_dish ON dish_ingredients(dish_id);
CREATE INDEX IF NOT EXISTS idx_dish_ingredients_ingredient ON dish_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_recipes_dish ON recipes(dish_id);

-- =============================================
-- 재료로 요리 검색하는 뷰
-- =============================================

CREATE VIEW IF NOT EXISTS v_dish_with_ingredients AS
SELECT
    d.id AS dish_id,
    d.name AS dish_name,
    d.category AS dish_category,
    d.image_url,
    d.description,
    GROUP_CONCAT(i.name, '|') AS ingredients,
    COUNT(CASE WHEN di.is_main = 1 THEN 1 END) AS main_ingredient_count,
    COUNT(i.id) AS total_ingredient_count
FROM dishes d
LEFT JOIN dish_ingredients di ON d.id = di.dish_id
LEFT JOIN ingredients i ON di.ingredient_id = i.id
GROUP BY d.id;
