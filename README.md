# I Have No Menu

내가 가진 재료로 만들 수 있는 요리를 찾아주는 서비스

## 기능

- 카테고리별 재료 선택
- 재료 계층 구조 검색 (예: "소고기" 선택 시 "다진소고기" 등 하위 재료도 매칭)
- 요리 검색 결과 (일치 재료 많은 순 정렬)
- 요리 상세 보기 (필요한 재료, 레시피)
- YouTube 레시피 영상 연동
- 크리에이터 레시피 등록 및 공유

## 기술 스택

- **Frontend**: Nuxt 3, Vue 3, TailwindCSS
- **Backend**: Nitro (Nuxt Server)
- **Database**: SQLite (better-sqlite3)
- **Data**: 만개의레시피 공공데이터

## 설치 및 실행

```bash
# 의존성 설치
cd web
pnpm install

# 개발 서버 실행
pnpm dev
```

## 환경 변수

```bash
# web/.env
YOUTUBE_API_KEY=your_youtube_api_key  # YouTube 영상 표시용 (선택)
```

## 데이터베이스

- `database/ihavenomenu.db`: SQLite 데이터베이스
- `database/schema.sql`: 스키마 정의
- `scripts/parse_csv.py`: CSV 파싱 스크립트
- `scripts/normalize_ingredients.py`: 재료 정규화 스크립트

## 프로젝트 구조

```
ihavenomenu/
├── database/
│   ├── ihavenomenu.db      # SQLite DB
│   └── schema.sql          # 스키마
├── scripts/
│   ├── parse_csv.py        # CSV 파싱
│   └── normalize_ingredients.py  # 재료 정규화
└── web/                    # Nuxt 3 프로젝트
    ├── app/                # Vue 컴포넌트
    ├── server/api/         # API 엔드포인트
    └── ...
```
