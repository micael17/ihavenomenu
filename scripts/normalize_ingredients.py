"""
재료 정규화 스크립트
- 기본 재료 정의
- 하위 재료를 상위 재료에 자동 매핑
"""

import sqlite3
from pathlib import Path

PROJECT_DIR = Path(__file__).parent.parent
DB_PATH = PROJECT_DIR / "database" / "momokdi.db"

# =============================================
# 기본 재료 정의 (사용자가 검색할 재료들)
# =============================================

BASE_INGREDIENTS = {
    # 육류
    "소고기": {
        "category": "육류",
        "keywords": ["소고기", "쇠고기", "한우", "육우", "불고기", "등심", "안심",
                     "양지", "차돌", "사태", "갈비", "우둔", "설도", "채끝", "립아이"]
    },
    "돼지고기": {
        "category": "육류",
        "keywords": ["돼지", "삼겹", "목살", "앞다리", "뒷다리", "갈비", "등갈비",
                     "안심", "등심", "항정살", "가브리살", "돈까스"]
    },
    "닭고기": {
        "category": "육류",
        "keywords": ["닭", "치킨", "닭가슴", "닭다리", "닭날개", "닭안심", "닭볶음탕"]
    },
    "오리고기": {
        "category": "육류",
        "keywords": ["오리", "훈제오리"]
    },
    "양고기": {
        "category": "육류",
        "keywords": ["양고기", "램", "양갈비"]
    },

    # 해물류
    "미역": {
        "category": "해물류",
        "keywords": ["미역", "건미역", "자른미역", "돌미역", "기장미역"]
    },
    "김": {
        "category": "해물류",
        "keywords": ["김", "김밥김", "조미김", "구운김", "파래김"]
    },
    "새우": {
        "category": "해물류",
        "keywords": ["새우", "대하", "중하", "칵테일새우", "젓새우", "건새우"]
    },
    "오징어": {
        "category": "해물류",
        "keywords": ["오징어", "마른오징어", "건오징어", "물오징어"]
    },
    "조개": {
        "category": "해물류",
        "keywords": ["조개", "바지락", "모시조개", "가리비", "홍합", "굴"]
    },
    "멸치": {
        "category": "해물류",
        "keywords": ["멸치", "국물멸치", "볶음멸치", "잔멸치", "중멸치"]
    },
    "참치": {
        "category": "해물류",
        "keywords": ["참치", "참치캔", "참치살"]
    },
    "고등어": {
        "category": "해물류",
        "keywords": ["고등어", "자반고등어"]
    },
    "연어": {
        "category": "해물류",
        "keywords": ["연어", "훈제연어", "연어살"]
    },
    "게": {
        "category": "해물류",
        "keywords": ["게", "꽃게", "대게", "킹크랩", "게살", "게맛살"]
    },

    # 채소류
    "양파": {
        "category": "채소류",
        "keywords": ["양파", "자색양파", "적양파"]
    },
    "대파": {
        "category": "채소류",
        "keywords": ["대파", "파", "쪽파", "실파"]
    },
    "마늘": {
        "category": "채소류",
        "keywords": ["마늘", "다진마늘", "편마늘", "통마늘", "마늘종"]
    },
    "생강": {
        "category": "채소류",
        "keywords": ["생강", "다진생강", "생강가루"]
    },
    "감자": {
        "category": "채소류",
        "keywords": ["감자", "알감자", "햇감자", "수미감자"]
    },
    "고구마": {
        "category": "채소류",
        "keywords": ["고구마", "호박고구마", "밤고구마"]
    },
    "당근": {
        "category": "채소류",
        "keywords": ["당근", "미니당근"]
    },
    "무": {
        "category": "채소류",
        "keywords": ["무", "총각무", "알타리무", "열무"]
    },
    "배추": {
        "category": "채소류",
        "keywords": ["배추", "알배추", "얼갈이배추", "봄배추"]
    },
    "시금치": {
        "category": "채소류",
        "keywords": ["시금치", "냉동시금치"]
    },
    "버섯": {
        "category": "채소류",
        "keywords": ["버섯", "표고", "새송이", "팽이", "느타리", "양송이", "목이버섯", "송이버섯"]
    },
    "고추": {
        "category": "채소류",
        "keywords": ["고추", "청양고추", "홍고추", "풋고추", "오이고추", "꽈리고추", "피망", "파프리카"]
    },
    "호박": {
        "category": "채소류",
        "keywords": ["호박", "애호박", "늙은호박", "단호박", "주키니"]
    },
    "오이": {
        "category": "채소류",
        "keywords": ["오이", "백오이", "취청오이"]
    },
    "콩나물": {
        "category": "채소류",
        "keywords": ["콩나물", "숙주", "숙주나물"]
    },
    "양배추": {
        "category": "채소류",
        "keywords": ["양배추", "적양배추"]
    },
    "브로콜리": {
        "category": "채소류",
        "keywords": ["브로콜리", "냉동브로콜리"]
    },
    "부추": {
        "category": "채소류",
        "keywords": ["부추", "쪽파"]
    },
    "미나리": {
        "category": "채소류",
        "keywords": ["미나리"]
    },
    "깻잎": {
        "category": "채소류",
        "keywords": ["깻잎", "깻순"]
    },
    "상추": {
        "category": "채소류",
        "keywords": ["상추", "양상추", "로메인", "청상추", "적상추"]
    },

    # 두부/콩류
    "두부": {
        "category": "콩/견과류",
        "keywords": ["두부", "순두부", "연두부", "부침두부", "찌개두부"]
    },
    "콩": {
        "category": "콩/견과류",
        "keywords": ["콩", "검은콩", "서리태", "강낭콩", "완두콩", "병아리콩"]
    },

    # 달걀/유제품
    "계란": {
        "category": "달걀/유제품",
        "keywords": ["계란", "달걀", "메추리알"]
    },
    "우유": {
        "category": "달걀/유제품",
        "keywords": ["우유", "저지방우유", "무지방우유"]
    },
    "치즈": {
        "category": "달걀/유제품",
        "keywords": ["치즈", "모짜렐라", "체다", "슬라이스치즈", "크림치즈", "파마산"]
    },
    "버터": {
        "category": "달걀/유제품",
        "keywords": ["버터", "무염버터", "가염버터"]
    },
    "생크림": {
        "category": "달걀/유제품",
        "keywords": ["생크림", "휘핑크림", "크림"]
    },

    # 곡류
    "쌀": {
        "category": "곡류",
        "keywords": ["쌀", "현미", "찹쌀", "흑미", "오곡"]
    },
    "밀가루": {
        "category": "곡류",
        "keywords": ["밀가루", "박력분", "중력분", "강력분"]
    },
    "면": {
        "category": "곡류",
        "keywords": ["면", "국수", "소면", "우동면", "스파게티", "파스타", "라면", "당면", "쌀국수"]
    },
    "떡": {
        "category": "곡류",
        "keywords": ["떡", "떡국떡", "가래떡", "떡볶이떡", "인절미", "송편"]
    },
    "빵": {
        "category": "곡류",
        "keywords": ["빵", "식빵", "바게트", "모닝빵"]
    },

    # 김치류
    "김치": {
        "category": "김치류",
        "keywords": ["김치", "배추김치", "묵은지", "신김치", "겉절이", "백김치"]
    },
    "깍두기": {
        "category": "김치류",
        "keywords": ["깍두기", "깍뚜기"]
    },

    # 양념류
    "간장": {
        "category": "양념류",
        "keywords": ["간장", "진간장", "국간장", "양조간장", "조림간장"]
    },
    "된장": {
        "category": "양념류",
        "keywords": ["된장", "재래된장", "청국장"]
    },
    "고추장": {
        "category": "양념류",
        "keywords": ["고추장", "태양초고추장"]
    },
    "고춧가루": {
        "category": "양념류",
        "keywords": ["고춧가루", "고추가루", "김치용고춧가루"]
    },
    "참기름": {
        "category": "양념류",
        "keywords": ["참기름", "들기름", "참깨"]
    },
    "설탕": {
        "category": "양념류",
        "keywords": ["설탕", "흑설탕", "황설탕", "백설탕"]
    },
    "소금": {
        "category": "양념류",
        "keywords": ["소금", "천일염", "꽃소금", "구운소금"]
    },
    "식초": {
        "category": "양념류",
        "keywords": ["식초", "현미식초", "사과식초", "발사믹"]
    },
    "올리브오일": {
        "category": "양념류",
        "keywords": ["올리브오일", "올리브유", "엑스트라버진"]
    },
    "굴소스": {
        "category": "양념류",
        "keywords": ["굴소스"]
    },
    "맛술": {
        "category": "양념류",
        "keywords": ["맛술", "미림", "미린", "청주", "요리술"]
    },
    "액젓": {
        "category": "양념류",
        "keywords": ["액젓", "까나리액젓", "멸치액젓", "참치액", "젓갈"]
    },
}


def connect_db():
    """DB 연결"""
    return sqlite3.connect(DB_PATH)


def add_parent_column_if_not_exists(conn):
    """parent_id, is_base 컬럼이 없으면 추가"""
    cursor = conn.cursor()

    # 컬럼 존재 여부 확인
    cursor.execute("PRAGMA table_info(ingredients)")
    columns = [col[1] for col in cursor.fetchall()]

    if 'parent_id' not in columns:
        cursor.execute("ALTER TABLE ingredients ADD COLUMN parent_id INTEGER")
        print("✅ parent_id 컬럼 추가됨")

    if 'is_base' not in columns:
        cursor.execute("ALTER TABLE ingredients ADD COLUMN is_base BOOLEAN DEFAULT 0")
        print("✅ is_base 컬럼 추가됨")

    conn.commit()


def get_or_create_base_ingredient(conn, name: str, category: str) -> int:
    """기본 재료 조회 또는 생성"""
    cursor = conn.cursor()

    # 기존 재료 조회
    cursor.execute("SELECT id FROM ingredients WHERE name = ?", (name,))
    row = cursor.fetchone()

    if row:
        # is_base 플래그 업데이트
        cursor.execute("UPDATE ingredients SET is_base = 1, category = ? WHERE id = ?",
                       (category, row[0]))
        conn.commit()
        return row[0]

    # 새 기본 재료 생성
    cursor.execute(
        "INSERT INTO ingredients (name, category, is_base) VALUES (?, ?, 1)",
        (name, category)
    )
    conn.commit()
    return cursor.lastrowid


def normalize_ingredients(conn):
    """재료 정규화 - 하위 재료를 상위 재료에 매핑"""
    cursor = conn.cursor()

    total_mapped = 0

    for base_name, config in BASE_INGREDIENTS.items():
        category = config["category"]
        keywords = config["keywords"]

        # 기본 재료 생성/조회
        base_id = get_or_create_base_ingredient(conn, base_name, category)

        # 키워드로 하위 재료 찾아서 매핑
        for keyword in keywords:
            # 자기 자신은 제외
            if keyword == base_name:
                continue

            # 키워드를 포함하는 재료 찾기
            cursor.execute("""
                UPDATE ingredients
                SET parent_id = ?, category = ?
                WHERE name LIKE ?
                  AND name != ?
                  AND (parent_id IS NULL OR parent_id = 0)
            """, (base_id, category, f"%{keyword}%", base_name))

            mapped = cursor.rowcount
            total_mapped += mapped

    conn.commit()
    return total_mapped


def print_stats(conn):
    """통계 출력"""
    cursor = conn.cursor()

    # 기본 재료 수
    cursor.execute("SELECT COUNT(*) FROM ingredients WHERE is_base = 1")
    base_count = cursor.fetchone()[0]

    # 매핑된 재료 수
    cursor.execute("SELECT COUNT(*) FROM ingredients WHERE parent_id IS NOT NULL")
    mapped_count = cursor.fetchone()[0]

    # 매핑 안 된 재료 수
    cursor.execute("SELECT COUNT(*) FROM ingredients WHERE parent_id IS NULL AND is_base = 0")
    unmapped_count = cursor.fetchone()[0]

    # 전체 재료 수
    cursor.execute("SELECT COUNT(*) FROM ingredients")
    total_count = cursor.fetchone()[0]

    print(f"\n📊 정규화 통계:")
    print(f"  - 기본 재료: {base_count}개")
    print(f"  - 매핑된 재료: {mapped_count}개")
    print(f"  - 미매핑 재료: {unmapped_count}개")
    print(f"  - 전체 재료: {total_count}개")
    print(f"  - 매핑률: {(base_count + mapped_count) / total_count * 100:.1f}%")


def show_examples(conn):
    """매핑 예시 출력"""
    cursor = conn.cursor()

    print(f"\n📋 매핑 예시:")

    # 몇 가지 기본 재료에 대해 하위 재료 표시
    for base_name in ["소고기", "미역", "감자", "돼지고기", "두부"]:
        cursor.execute("""
            SELECT i.name
            FROM ingredients i
            JOIN ingredients p ON i.parent_id = p.id
            WHERE p.name = ?
            LIMIT 5
        """, (base_name,))

        children = [row[0] for row in cursor.fetchall()]
        if children:
            print(f"  {base_name} → {', '.join(children)}")


def show_unmapped_samples(conn, limit=20):
    """매핑 안 된 재료 샘플 출력"""
    cursor = conn.cursor()

    cursor.execute("""
        SELECT name, category
        FROM ingredients
        WHERE parent_id IS NULL AND is_base = 0
        ORDER BY RANDOM()
        LIMIT ?
    """, (limit,))

    rows = cursor.fetchall()

    print(f"\n⚠️ 미매핑 재료 샘플 ({limit}개):")
    for name, category in rows:
        print(f"  - {name} ({category or '분류없음'})")


def main():
    print("🔧 재료 정규화 시작\n")

    conn = connect_db()

    # 컬럼 추가
    add_parent_column_if_not_exists(conn)

    # 정규화 실행
    mapped = normalize_ingredients(conn)
    print(f"✅ {mapped}개 재료 매핑 완료")

    # 통계 출력
    print_stats(conn)

    # 예시 출력
    show_examples(conn)

    # 미매핑 샘플 출력
    show_unmapped_samples(conn)

    conn.close()
    print("\n🎉 완료!")


if __name__ == "__main__":
    main()
