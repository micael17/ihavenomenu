"""
만개의레시피 CSV 파싱 스크립트
- CSV에서 요리/재료 데이터 추출
- SQLite DB에 저장
"""

import csv
import sqlite3
import re
import os
from pathlib import Path

# 프로젝트 경로
PROJECT_DIR = Path(__file__).parent.parent
DB_PATH = PROJECT_DIR / "database" / "momokdi.db"
SCHEMA_PATH = PROJECT_DIR / "database" / "schema.sql"

# CSV 파일 경로 (2024년 파일 - UTF-8)
CSV_PATH = Path("/Users/jihongkim/Downloads/TB_RECIPE_SEARCH_241226.csv")


def init_db():
    """DB 초기화 - 스키마 적용"""
    conn = sqlite3.connect(DB_PATH)

    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        schema = f.read()

    conn.executescript(schema)
    conn.commit()
    print(f"✅ DB 초기화 완료: {DB_PATH}")
    return conn


def parse_ingredients(ingredients_raw: str) -> list[dict]:
    """
    재료 문자열 파싱

    입력: "[재료] 떡국떡400g| 소고기100g [양념] 간장2T| 참기름1T"
    출력: [
        {"name": "떡국떡", "amount": "400g", "section": "재료"},
        {"name": "소고기", "amount": "100g", "section": "재료"},
        {"name": "간장", "amount": "2T", "section": "양념"},
        ...
    ]
    """
    if not ingredients_raw:
        return []

    results = []
    current_section = "재료"

    # 섹션 분리: [재료], [양념], [소스] 등
    # 패턴: [섹션명] 내용| 내용| ... [다음섹션] ...
    parts = re.split(r'\[([^\]]+)\]', ingredients_raw)

    for i, part in enumerate(parts):
        part = part.strip()
        if not part:
            continue

        # 홀수 인덱스는 섹션명
        if i % 2 == 1:
            current_section = part
            continue

        # 짝수 인덱스는 재료 목록
        items = part.split('|')
        for item in items:
            item = item.strip()
            if not item:
                continue

            # 재료명과 양 분리
            # 패턴: "떡국떡400g", "소고기 100g", "대파1/2대"
            parsed = parse_single_ingredient(item)
            if parsed:
                parsed["section"] = current_section
                results.append(parsed)

    return results


def parse_single_ingredient(item: str) -> dict | None:
    """
    단일 재료 파싱

    "떡국떡400g" → {"name": "떡국떡", "amount": "400g"}
    "대파 1/2대" → {"name": "대파", "amount": "1/2대"}
    "소금 약간" → {"name": "소금", "amount": "약간"}
    """
    item = item.strip()
    if not item:
        return None

    # 숫자/분수/단위가 시작되는 지점 찾기
    # 패턴: 숫자, 분수(1/2), 약간, 적당량, 조금 등
    match = re.search(r'[\d½⅓¼⅔¾]|약간|적당량|조금|적당히|소량|다량|충분히', item)

    if match:
        name = item[:match.start()].strip()
        amount = item[match.start():].strip()
    else:
        # 양 정보가 없는 경우
        name = item
        amount = None

    # 이름 정제
    name = name.strip()
    if not name:
        return None

    return {
        "name": name,
        "amount": amount
    }


def normalize_dish_name(name: str) -> str:
    """요리명 정규화"""
    if not name:
        return ""

    # 공백 정리
    name = name.strip()

    # 특수문자 제거
    name = re.sub(r'[~!@#$%^&*()_+=\[\]{}|\\:";\'<>?,./]', '', name)

    return name


def get_or_create_ingredient(conn: sqlite3.Connection, name: str, category: str = None) -> int:
    """재료 조회 또는 생성, ID 반환"""
    cursor = conn.cursor()

    # 기존 재료 조회
    cursor.execute("SELECT id FROM ingredients WHERE name = ?", (name,))
    row = cursor.fetchone()

    if row:
        return row[0]

    # 새 재료 생성
    cursor.execute(
        "INSERT INTO ingredients (name, category) VALUES (?, ?)",
        (name, category)
    )
    conn.commit()
    return cursor.lastrowid


def get_or_create_dish(conn: sqlite3.Connection, name: str, category: str = None,
                       image_url: str = None, description: str = None) -> int:
    """요리 조회 또는 생성, ID 반환"""
    cursor = conn.cursor()

    # 기존 요리 조회
    cursor.execute("SELECT id FROM dishes WHERE name = ?", (name,))
    row = cursor.fetchone()

    if row:
        return row[0]

    # 새 요리 생성
    cursor.execute(
        "INSERT INTO dishes (name, category, image_url, description) VALUES (?, ?, ?, ?)",
        (name, category, image_url, description)
    )
    conn.commit()
    return cursor.lastrowid


def link_dish_ingredient(conn: sqlite3.Connection, dish_id: int, ingredient_id: int,
                         is_main: bool = False, amount: str = None):
    """요리-재료 연결"""
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id, is_main, amount)
            VALUES (?, ?, ?, ?)
        """, (dish_id, ingredient_id, is_main, amount))
        conn.commit()
    except sqlite3.IntegrityError:
        pass  # 이미 존재하는 연결


def save_recipe(conn: sqlite3.Connection, dish_id: int, row: dict):
    """원본 레시피 저장"""
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO recipes (
            dish_id, title, source, source_id, description,
            ingredients_raw, cooking_method, cooking_time,
            servings, difficulty, image_url, view_count, recommend_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        dish_id,
        row.get('RCP_TTL', ''),           # 제목
        '만개의레시피',                    # 출처
        row.get('RCP_SNO', ''),           # 원본 ID
        row.get('CKG_IPDC', ''),          # 설명
        row.get('CKG_MTRL_CN', ''),       # 원본 재료
        row.get('CKG_MTH_ACTO_NM', ''),   # 조리방법
        row.get('CKG_TIME_NM', ''),       # 조리시간
        row.get('CKG_INBUN_NM', ''),      # 인분
        row.get('CKG_DODF_NM', ''),       # 난이도
        row.get('RCP_IMG_URL', ''),       # 이미지
        int(row.get('INQ_CNT', 0) or 0),  # 조회수
        int(row.get('RCMM_CNT', 0) or 0)  # 추천수
    ))
    conn.commit()


def process_csv(conn: sqlite3.Connection, csv_path: Path):
    """CSV 파일 처리"""
    print(f"📂 CSV 파일 읽는 중: {csv_path}")

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        total = 0
        dishes_count = 0
        ingredients_count = 0

        for row in reader:
            total += 1

            # 요리명 추출
            dish_name = normalize_dish_name(row.get('CKG_NM', ''))
            if not dish_name:
                continue

            # 요리 생성/조회
            dish_id = get_or_create_dish(
                conn,
                name=dish_name,
                category=row.get('CKG_KND_ACTO_NM', ''),
                image_url=row.get('RCP_IMG_URL', ''),
                description=row.get('CKG_IPDC', '')
            )
            dishes_count += 1

            # 재료 파싱
            ingredients_raw = row.get('CKG_MTRL_CN', '')
            ingredients = parse_ingredients(ingredients_raw)

            # 주재료 카테고리
            main_category = row.get('CKG_MTRL_ACTO_NM', '')

            for i, ing in enumerate(ingredients):
                # 재료 생성/조회
                ingredient_id = get_or_create_ingredient(
                    conn,
                    name=ing['name'],
                    category=main_category if i < 3 else None  # 처음 3개는 주재료 카테고리
                )
                ingredients_count += 1

                # 요리-재료 연결
                # 섹션이 "재료"이고 처음 3개면 주재료로 표시
                is_main = ing.get('section') == '재료' and i < 3
                link_dish_ingredient(
                    conn, dish_id, ingredient_id,
                    is_main=is_main,
                    amount=ing.get('amount')
                )

            # 원본 레시피 저장
            save_recipe(conn, dish_id, row)

            # 진행 상황 출력
            if total % 1000 == 0:
                print(f"  처리 중... {total}개")

    print(f"\n✅ 처리 완료!")
    print(f"  - 총 레시피: {total}개")
    print(f"  - 요리: {dishes_count}개")
    print(f"  - 재료 연결: {ingredients_count}개")


def print_stats(conn: sqlite3.Connection):
    """DB 통계 출력"""
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM dishes")
    dishes = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM ingredients")
    ingredients = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM dish_ingredients")
    links = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM recipes")
    recipes = cursor.fetchone()[0]

    print(f"\n📊 DB 통계:")
    print(f"  - 요리: {dishes}개")
    print(f"  - 재료: {ingredients}개")
    print(f"  - 요리-재료 연결: {links}개")
    print(f"  - 레시피: {recipes}개")


def main():
    print("🍳 모목디 CSV 파싱 시작\n")

    # DB 초기화
    conn = init_db()

    # CSV 처리
    if CSV_PATH.exists():
        process_csv(conn, CSV_PATH)
    else:
        print(f"❌ CSV 파일을 찾을 수 없습니다: {CSV_PATH}")
        return

    # 통계 출력
    print_stats(conn)

    conn.close()
    print("\n🎉 완료!")


if __name__ == "__main__":
    main()
