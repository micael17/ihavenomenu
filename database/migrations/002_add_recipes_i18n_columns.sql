-- recipes 테이블 다국어(한/영) 지원 컬럼 추가
-- 번역 데이터는 별도 스크립트로 입력 예정

ALTER TABLE recipes ADD COLUMN title_en TEXT;
ALTER TABLE recipes ADD COLUMN description_en TEXT;
ALTER TABLE recipes ADD COLUMN ingredients_raw_en TEXT;
ALTER TABLE recipes ADD COLUMN cooking_steps_en TEXT;
ALTER TABLE recipes ADD COLUMN cooking_method_en TEXT;

CREATE INDEX IF NOT EXISTS idx_recipes_title_en ON recipes(title_en);
