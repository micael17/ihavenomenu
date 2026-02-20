#!/bin/bash
# DB 마이그레이션 스크립트
# 사용법: ./migrate.sh <기존DB경로> <새DB경로>
# 기존 DB에 새 컬럼 추가 후, 새 DB에서 데이터를 복사

set -e

EXISTING_DB="$1"
NEW_DB="$2"

if [ -z "$EXISTING_DB" ]; then
  echo "❌ 사용법: $0 <기존DB경로> [새DB경로]"
  exit 1
fi

if [ ! -f "$EXISTING_DB" ]; then
  echo "❌ DB 파일을 찾을 수 없습니다: $EXISTING_DB"
  exit 1
fi

echo "🗄️ DB 마이그레이션 시작: $EXISTING_DB"

# 1. 새 컬럼 추가 (이미 있으면 무시)
echo "📋 컬럼 추가 중..."
sqlite3 "$EXISTING_DB" "ALTER TABLE ingredients ADD COLUMN name_ko TEXT;" 2>/dev/null || echo "  - name_ko: 이미 존재"
sqlite3 "$EXISTING_DB" "ALTER TABLE ingredients ADD COLUMN name_en TEXT;" 2>/dev/null || echo "  - name_en: 이미 존재"
sqlite3 "$EXISTING_DB" "ALTER TABLE ingredients ADD COLUMN category_ko TEXT;" 2>/dev/null || echo "  - category_ko: 이미 존재"
sqlite3 "$EXISTING_DB" "ALTER TABLE ingredients ADD COLUMN category_en TEXT;" 2>/dev/null || echo "  - category_en: 이미 존재"

# 2. 인덱스 추가
echo "📋 인덱스 추가 중..."
sqlite3 "$EXISTING_DB" "CREATE INDEX IF NOT EXISTS idx_ingredients_name_ko ON ingredients(name_ko);"
sqlite3 "$EXISTING_DB" "CREATE INDEX IF NOT EXISTS idx_ingredients_name_en ON ingredients(name_en);"

# 3. 새 DB에서 다국어 데이터 복사 (새 DB가 제공된 경우)
if [ -n "$NEW_DB" ] && [ -f "$NEW_DB" ]; then
  echo "📥 새 DB에서 다국어 데이터 복사 중..."
  sqlite3 "$EXISTING_DB" <<SQL
ATTACH DATABASE '$NEW_DB' AS newdb;

UPDATE ingredients SET
  name_ko = (SELECT n.name_ko FROM newdb.ingredients n WHERE n.id = ingredients.id),
  name_en = (SELECT n.name_en FROM newdb.ingredients n WHERE n.id = ingredients.id),
  category_ko = (SELECT n.category_ko FROM newdb.ingredients n WHERE n.id = ingredients.id),
  category_en = (SELECT n.category_en FROM newdb.ingredients n WHERE n.id = ingredients.id)
WHERE EXISTS (SELECT 1 FROM newdb.ingredients n WHERE n.id = ingredients.id);

DETACH DATABASE newdb;
SQL
  echo "✅ 데이터 복사 완료"
else
  echo "⚠️ 새 DB 없음 - 컬럼만 추가됨 (데이터 없음)"
fi

# 4. 결과 확인
TOTAL=$(sqlite3 "$EXISTING_DB" "SELECT COUNT(*) FROM ingredients;")
WITH_KO=$(sqlite3 "$EXISTING_DB" "SELECT COUNT(*) FROM ingredients WHERE name_ko IS NOT NULL AND name_ko != '';")
WITH_EN=$(sqlite3 "$EXISTING_DB" "SELECT COUNT(*) FROM ingredients WHERE name_en IS NOT NULL AND name_en != '';")
echo "📊 결과: 전체 ${TOTAL}개 중 name_ko: ${WITH_KO}개, name_en: ${WITH_EN}개"
echo "✅ 마이그레이션 완료!"
