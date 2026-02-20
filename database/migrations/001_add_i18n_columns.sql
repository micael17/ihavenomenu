-- 재료 테이블에 다국어 컬럼 추가
-- SQLite는 ALTER TABLE ADD COLUMN IF NOT EXISTS를 지원하지 않으므로
-- 이미 존재하면 에러가 나지만, 스크립트에서 무시 처리

ALTER TABLE ingredients ADD COLUMN name_ko TEXT;
ALTER TABLE ingredients ADD COLUMN name_en TEXT;
ALTER TABLE ingredients ADD COLUMN category_ko TEXT;
ALTER TABLE ingredients ADD COLUMN category_en TEXT;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_ingredients_name_ko ON ingredients(name_ko);
CREATE INDEX IF NOT EXISTS idx_ingredients_name_en ON ingredients(name_en);
