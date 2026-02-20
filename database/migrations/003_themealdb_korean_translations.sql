-- Migration 003: TheMealDB 레시피 한국어 번역 (ID 23190-23787)
-- 영어 레시피명, 조리방법, 설명을 한국어로 번역

BEGIN;

-- ============================================================
-- 1. 만개의레시피 (Korean recipes) cooking_method_en 벌크 번역
-- ============================================================

UPDATE recipes SET cooking_method_en = 'Boiling' WHERE source = '만개의레시피' AND cooking_method = '끓이기';
UPDATE recipes SET cooking_method_en = 'Stir-frying' WHERE source = '만개의레시피' AND cooking_method = '볶음';
UPDATE recipes SET cooking_method_en = 'Other' WHERE source = '만개의레시피' AND cooking_method = '기타';
UPDATE recipes SET cooking_method_en = 'Seasoned salad' WHERE source = '만개의레시피' AND cooking_method = '무침';
UPDATE recipes SET cooking_method_en = 'Grilling' WHERE source = '만개의레시피' AND cooking_method = '굽기';
UPDATE recipes SET cooking_method_en = 'Pan-frying' WHERE source = '만개의레시피' AND cooking_method = '부침';
UPDATE recipes SET cooking_method_en = 'Braising' WHERE source = '만개의레시피' AND cooking_method = '조림';
UPDATE recipes SET cooking_method_en = 'Steaming' WHERE source = '만개의레시피' AND cooking_method = '찜';
UPDATE recipes SET cooking_method_en = 'Mixing' WHERE source = '만개의레시피' AND cooking_method = '비빔';
UPDATE recipes SET cooking_method_en = 'Pickling' WHERE source = '만개의레시피' AND cooking_method = '절임';
UPDATE recipes SET cooking_method_en = 'Deep-frying' WHERE source = '만개의레시피' AND cooking_method = '튀김';
UPDATE recipes SET cooking_method_en = 'Boiling (simmering)' WHERE source = '만개의레시피' AND cooking_method = '삶기';
UPDATE recipes SET cooking_method_en = 'Blanching' WHERE source = '만개의레시피' AND cooking_method = '데치기';
UPDATE recipes SET cooking_method_en = 'Raw/Sashimi' WHERE source = '만개의레시피' AND cooking_method = '회';

-- ============================================================
-- 2. TheMealDB cooking_method 한국어 번역
--    (cooking_method_en 에는 이미 영어가 있으므로 cooking_method 컬럼을 한국어로 변경)
-- ============================================================

UPDATE recipes SET cooking_method = '소고기' WHERE source = 'themealdb' AND cooking_method_en = 'Beef';
UPDATE recipes SET cooking_method = '닭고기' WHERE source = 'themealdb' AND cooking_method_en = 'Chicken';
UPDATE recipes SET cooking_method = '디저트' WHERE source = 'themealdb' AND cooking_method_en = 'Dessert';
UPDATE recipes SET cooking_method = '양고기' WHERE source = 'themealdb' AND cooking_method_en = 'Lamb';
UPDATE recipes SET cooking_method = '기타' WHERE source = 'themealdb' AND cooking_method_en = 'Miscellaneous';
UPDATE recipes SET cooking_method = '파스타' WHERE source = 'themealdb' AND cooking_method_en = 'Pasta';
UPDATE recipes SET cooking_method = '돼지고기' WHERE source = 'themealdb' AND cooking_method_en = 'Pork';
UPDATE recipes SET cooking_method = '해산물' WHERE source = 'themealdb' AND cooking_method_en = 'Seafood';
UPDATE recipes SET cooking_method = '사이드' WHERE source = 'themealdb' AND cooking_method_en = 'Side';
UPDATE recipes SET cooking_method = '전채' WHERE source = 'themealdb' AND cooking_method_en = 'Starter';
UPDATE recipes SET cooking_method = '비건' WHERE source = 'themealdb' AND cooking_method_en = 'Vegan';
UPDATE recipes SET cooking_method = '채식' WHERE source = 'themealdb' AND cooking_method_en = 'Vegetarian';
UPDATE recipes SET cooking_method = '아침식사' WHERE source = 'themealdb' AND cooking_method_en = 'Breakfast';
UPDATE recipes SET cooking_method = '염소고기' WHERE source = 'themealdb' AND cooking_method_en = 'Goat';

-- ============================================================
-- 3. TheMealDB description 한국어 번역
--    "[Country] [Category] dish" 패턴을 REPLACE 벌크 업데이트
-- ============================================================

-- 먼저 "dish" 단어를 " 요리"로 치환하기 위해 카테고리+국가 조합을 처리
-- 국가별 번역 (REPLACE 체인)

-- Step 1: Country names in "[Country] [Category] dish" patterns
UPDATE recipes SET description = REPLACE(description, 'Algerian ', '알제리 ')
  WHERE source = 'themealdb' AND description LIKE '%Algerian %';
UPDATE recipes SET description = REPLACE(description, 'Argentinian ', '아르헨티나 ')
  WHERE source = 'themealdb' AND description LIKE '%Argentinian %';
UPDATE recipes SET description = REPLACE(description, 'Australian ', '호주 ')
  WHERE source = 'themealdb' AND description LIKE '%Australian %';
UPDATE recipes SET description = REPLACE(description, 'American ', '미국 ')
  WHERE source = 'themealdb' AND description LIKE '%American %';
UPDATE recipes SET description = REPLACE(description, 'British ', '영국 ')
  WHERE source = 'themealdb' AND description LIKE '%British %';
UPDATE recipes SET description = REPLACE(description, 'Canadian ', '캐나다 ')
  WHERE source = 'themealdb' AND description LIKE '%Canadian %';
UPDATE recipes SET description = REPLACE(description, 'Chinese ', '중국 ')
  WHERE source = 'themealdb' AND description LIKE '%Chinese %';
UPDATE recipes SET description = REPLACE(description, 'Croatian ', '크로아티아 ')
  WHERE source = 'themealdb' AND description LIKE '%Croatian %';
UPDATE recipes SET description = REPLACE(description, 'Dutch ', '네덜란드 ')
  WHERE source = 'themealdb' AND description LIKE '%Dutch %';
UPDATE recipes SET description = REPLACE(description, 'Egyptian ', '이집트 ')
  WHERE source = 'themealdb' AND description LIKE '%Egyptian %';
UPDATE recipes SET description = REPLACE(description, 'Filipino ', '필리핀 ')
  WHERE source = 'themealdb' AND description LIKE '%Filipino %';
UPDATE recipes SET description = REPLACE(description, 'French ', '프랑스 ')
  WHERE source = 'themealdb' AND description LIKE '%French %';
UPDATE recipes SET description = REPLACE(description, 'Greek ', '그리스 ')
  WHERE source = 'themealdb' AND description LIKE '%Greek %';
UPDATE recipes SET description = REPLACE(description, 'Indian ', '인도 ')
  WHERE source = 'themealdb' AND description LIKE '%Indian %';
UPDATE recipes SET description = REPLACE(description, 'Irish ', '아일랜드 ')
  WHERE source = 'themealdb' AND description LIKE '%Irish %';
UPDATE recipes SET description = REPLACE(description, 'Italian ', '이탈리아 ')
  WHERE source = 'themealdb' AND description LIKE '%Italian %';
UPDATE recipes SET description = REPLACE(description, 'Jamaican ', '자메이카 ')
  WHERE source = 'themealdb' AND description LIKE '%Jamaican %';
UPDATE recipes SET description = REPLACE(description, 'Japanese ', '일본 ')
  WHERE source = 'themealdb' AND description LIKE '%Japanese %';
UPDATE recipes SET description = REPLACE(description, 'Kenyan ', '케냐 ')
  WHERE source = 'themealdb' AND description LIKE '%Kenyan %';
UPDATE recipes SET description = REPLACE(description, 'Malaysian ', '말레이시아 ')
  WHERE source = 'themealdb' AND description LIKE '%Malaysian %';
UPDATE recipes SET description = REPLACE(description, 'Mexican ', '멕시코 ')
  WHERE source = 'themealdb' AND description LIKE '%Mexican %';
UPDATE recipes SET description = REPLACE(description, 'Moroccan ', '모로코 ')
  WHERE source = 'themealdb' AND description LIKE '%Moroccan %';
UPDATE recipes SET description = REPLACE(description, 'Norwegian ', '노르웨이 ')
  WHERE source = 'themealdb' AND description LIKE '%Norwegian %';
UPDATE recipes SET description = REPLACE(description, 'Polish ', '폴란드 ')
  WHERE source = 'themealdb' AND description LIKE '%Polish %';
UPDATE recipes SET description = REPLACE(description, 'Portuguese ', '포르투갈 ')
  WHERE source = 'themealdb' AND description LIKE '%Portuguese %';
UPDATE recipes SET description = REPLACE(description, 'Russian ', '러시아 ')
  WHERE source = 'themealdb' AND description LIKE '%Russian %';
UPDATE recipes SET description = REPLACE(description, 'Saudi Arabian ', '사우디아라비아 ')
  WHERE source = 'themealdb' AND description LIKE '%Saudi Arabian %';
UPDATE recipes SET description = REPLACE(description, 'Slovakian ', '슬로바키아 ')
  WHERE source = 'themealdb' AND description LIKE '%Slovakian %';
UPDATE recipes SET description = REPLACE(description, 'Spanish ', '스페인 ')
  WHERE source = 'themealdb' AND description LIKE '%Spanish %';
UPDATE recipes SET description = REPLACE(description, 'Syrian ', '시리아 ')
  WHERE source = 'themealdb' AND description LIKE '%Syrian %';
UPDATE recipes SET description = REPLACE(description, 'Thai ', '태국 ')
  WHERE source = 'themealdb' AND description LIKE '%Thai %';
UPDATE recipes SET description = REPLACE(description, 'Tunisian ', '튀니지 ')
  WHERE source = 'themealdb' AND description LIKE '%Tunisian %';
UPDATE recipes SET description = REPLACE(description, 'Turkish ', '튀르키예 ')
  WHERE source = 'themealdb' AND description LIKE '%Turkish %';
UPDATE recipes SET description = REPLACE(description, 'Ukrainian ', '우크라이나 ')
  WHERE source = 'themealdb' AND description LIKE '%Ukrainian %';
UPDATE recipes SET description = REPLACE(description, 'Uruguayan ', '우루과이 ')
  WHERE source = 'themealdb' AND description LIKE '%Uruguayan %';
UPDATE recipes SET description = REPLACE(description, 'Venezulan ', '베네수엘라 ')
  WHERE source = 'themealdb' AND description LIKE '%Venezulan %';
UPDATE recipes SET description = REPLACE(description, 'Vietnamese ', '베트남 ')
  WHERE source = 'themealdb' AND description LIKE '%Vietnamese %';

-- Step 2: Category dish patterns (after country replacement)
UPDATE recipes SET description = REPLACE(description, 'Beef dish', '소고기 요리')
  WHERE source = 'themealdb' AND description LIKE '%Beef dish%';
UPDATE recipes SET description = REPLACE(description, 'Chicken dish', '닭고기 요리')
  WHERE source = 'themealdb' AND description LIKE '%Chicken dish%';
UPDATE recipes SET description = REPLACE(description, 'Dessert dish', '디저트')
  WHERE source = 'themealdb' AND description LIKE '%Dessert dish%';
UPDATE recipes SET description = REPLACE(description, 'Lamb dish', '양고기 요리')
  WHERE source = 'themealdb' AND description LIKE '%Lamb dish%';
UPDATE recipes SET description = REPLACE(description, 'Miscellaneous dish', '기타 요리')
  WHERE source = 'themealdb' AND description LIKE '%Miscellaneous dish%';
UPDATE recipes SET description = REPLACE(description, 'Pasta dish', '파스타 요리')
  WHERE source = 'themealdb' AND description LIKE '%Pasta dish%';
UPDATE recipes SET description = REPLACE(description, 'Pork dish', '돼지고기 요리')
  WHERE source = 'themealdb' AND description LIKE '%Pork dish%';
UPDATE recipes SET description = REPLACE(description, 'Seafood dish', '해산물 요리')
  WHERE source = 'themealdb' AND description LIKE '%Seafood dish%';
UPDATE recipes SET description = REPLACE(description, 'Side dish', '사이드 요리')
  WHERE source = 'themealdb' AND description LIKE '%Side dish%';
UPDATE recipes SET description = REPLACE(description, 'Starter dish', '전채 요리')
  WHERE source = 'themealdb' AND description LIKE '%Starter dish%';
UPDATE recipes SET description = REPLACE(description, 'Vegan dish', '비건 요리')
  WHERE source = 'themealdb' AND description LIKE '%Vegan dish%';
UPDATE recipes SET description = REPLACE(description, 'Vegetarian dish', '채식 요리')
  WHERE source = 'themealdb' AND description LIKE '%Vegetarian dish%';
UPDATE recipes SET description = REPLACE(description, 'Breakfast dish', '아침식사')
  WHERE source = 'themealdb' AND description LIKE '%Breakfast dish%';
UPDATE recipes SET description = REPLACE(description, 'Goat dish', '염소고기 요리')
  WHERE source = 'themealdb' AND description LIKE '%Goat dish%';

-- Step 3: Tag-based descriptions (individual tag translations)
-- 이 단계에서는 태그만으로 이루어진 description을 개별적으로 번역
-- 쉼표로 구분된 태그들을 한국어로 변환

-- 단독 태그 description
UPDATE recipes SET description = '수프' WHERE source = 'themealdb' AND description = 'Soup';
UPDATE recipes SET description = '파이' WHERE source = 'themealdb' AND description = 'Pie';
UPDATE recipes SET description = '고기' WHERE source = 'themealdb' AND description = 'Meat';
UPDATE recipes SET description = '커리' WHERE source = 'themealdb' AND description = 'Curry';
UPDATE recipes SET description = '스튜' WHERE source = 'themealdb' AND description = 'Stew';
UPDATE recipes SET description = '베이킹' WHERE source = 'themealdb' AND description = 'Baking';
UPDATE recipes SET description = '파스타' WHERE source = 'themealdb' AND description = 'Pasta';
UPDATE recipes SET description = '달콤' WHERE source = 'themealdb' AND description = 'Sweet';
UPDATE recipes SET description = '케이크' WHERE source = 'themealdb' AND description = 'Cake';
UPDATE recipes SET description = '푸딩' WHERE source = 'themealdb' AND description = 'Pudding';
UPDATE recipes SET description = '타르트' WHERE source = 'themealdb' AND description = 'Tart';
UPDATE recipes SET description = '매운' WHERE source = 'themealdb' AND description = 'Spicy';
UPDATE recipes SET description = '간식' WHERE source = 'themealdb' AND description = 'Snack';
UPDATE recipes SET description = '간식' WHERE source = 'themealdb' AND description = 'Treat';
UPDATE recipes SET description = '디저트' WHERE source = 'themealdb' AND description = 'Desert';
UPDATE recipes SET description = '과일' WHERE source = 'themealdb' AND description = 'Fruity';
UPDATE recipes SET description = '유제품' WHERE source = 'themealdb' AND description = 'Dairy';
UPDATE recipes SET description = '초콜릿' WHERE source = 'themealdb' AND description = 'Chocolate';
UPDATE recipes SET description = '아침식사' WHERE source = 'themealdb' AND description = 'Breakfast';
UPDATE recipes SET description = '바비큐' WHERE source = 'themealdb' AND description = 'BBQ';
UPDATE recipes SET description = '크리스마스' WHERE source = 'themealdb' AND description = 'Christmas';
UPDATE recipes SET description = '달걀' WHERE source = 'themealdb' AND description = 'Egg';
UPDATE recipes SET description = '생선' WHERE source = 'themealdb' AND description = 'Fish';
UPDATE recipes SET description = '해산물' WHERE source = 'themealdb' AND description = 'Seafood';
UPDATE recipes SET description = '조개류' WHERE source = 'themealdb' AND description = 'Shellfish';
UPDATE recipes SET description = '채식' WHERE source = 'themealdb' AND description = 'Vegetarian';
UPDATE recipes SET description = '비건' WHERE source = 'themealdb' AND description = 'Vegan';
UPDATE recipes SET description = '샐러드' WHERE source = 'themealdb' AND description = 'Salad';
UPDATE recipes SET description = '팬케이크' WHERE source = 'themealdb' AND description = 'Pancake';
UPDATE recipes SET description = '샌드위치' WHERE source = 'themealdb' AND description = 'Sandwich';
UPDATE recipes SET description = '케밥' WHERE source = 'themealdb' AND description = 'Kebab';
UPDATE recipes SET description = '캐서롤' WHERE source = 'themealdb' AND description = 'Casserole';
UPDATE recipes SET description = '번' WHERE source = 'themealdb' AND description = 'Bun';

-- 복합 태그 description (쉼표 구분)
UPDATE recipes SET description = '커리, 순한' WHERE source = 'themealdb' AND description = 'Curry,Mild';
UPDATE recipes SET description = '파이, 고기' WHERE source = 'themealdb' AND description = 'Pie,Meat';
UPDATE recipes SET description = '고기, 파이' WHERE source = 'themealdb' AND description = 'Meat,Pie';
UPDATE recipes SET description = '수프, 스튜' WHERE source = 'themealdb' AND description = 'Soup,Stew';
UPDATE recipes SET description = '스튜, 수프' WHERE source = 'themealdb' AND description = 'Stew,Soup';
UPDATE recipes SET description = '고기, 스튜' WHERE source = 'themealdb' AND description = 'Meat,Stew';
UPDATE recipes SET description = '스튜, 고기' WHERE source = 'themealdb' AND description = 'Stew,Meat';
UPDATE recipes SET description = '커리, 매운' WHERE source = 'themealdb' AND description = 'Curry,Spicy';
UPDATE recipes SET description = '매운, 커리' WHERE source = 'themealdb' AND description = 'Spicy,Curry';
UPDATE recipes SET description = '케이크, 달콤' WHERE source = 'themealdb' AND description = 'Cake,Sweet';
UPDATE recipes SET description = '달콤, 케이크' WHERE source = 'themealdb' AND description = 'Sweet,Cake';
UPDATE recipes SET description = '달콤, 푸딩' WHERE source = 'themealdb' AND description = 'Sweet,Pudding';
UPDATE recipes SET description = '푸딩, 달콤' WHERE source = 'themealdb' AND description = 'Pudding,Sweet';
UPDATE recipes SET description = '달콤, 디저트' WHERE source = 'themealdb' AND description = 'Sweet,Desert';
UPDATE recipes SET description = '달콤, 베이킹' WHERE source = 'themealdb' AND description = 'Sweet,Baking';
UPDATE recipes SET description = '베이킹, 달콤' WHERE source = 'themealdb' AND description = 'Baking,Sweet';
UPDATE recipes SET description = '달콤, 과일' WHERE source = 'themealdb' AND description = 'Sweet,Fruity';
UPDATE recipes SET description = '과일, 달콤' WHERE source = 'themealdb' AND description = 'Fruity,Sweet';
UPDATE recipes SET description = '달콤, 초콜릿' WHERE source = 'themealdb' AND description = 'Sweet,Chocolate';
UPDATE recipes SET description = '초콜릿, 달콤' WHERE source = 'themealdb' AND description = 'Chocolate,Sweet';
UPDATE recipes SET description = '달콤, 간식' WHERE source = 'themealdb' AND description = 'Sweet,Snack';
UPDATE recipes SET description = '간식, 달콤' WHERE source = 'themealdb' AND description = 'Snack,Sweet';
UPDATE recipes SET description = '달콤, 카라멜' WHERE source = 'themealdb' AND description = 'Sweet,Caramel';
UPDATE recipes SET description = '카라멜, 달콤' WHERE source = 'themealdb' AND description = 'Caramel,Sweet';
UPDATE recipes SET description = '파이, 달콤' WHERE source = 'themealdb' AND description = 'Pie,Sweet';
UPDATE recipes SET description = '달콤, 파이' WHERE source = 'themealdb' AND description = 'Sweet,Pie';
UPDATE recipes SET description = '달콤, 타르트' WHERE source = 'themealdb' AND description = 'Sweet,Tart';
UPDATE recipes SET description = '타르트, 달콤' WHERE source = 'themealdb' AND description = 'Tart,Sweet';
UPDATE recipes SET description = '달콤, 크리스마스' WHERE source = 'themealdb' AND description = 'Sweet,Christmas';
UPDATE recipes SET description = '크리스마스, 달콤' WHERE source = 'themealdb' AND description = 'Christmas,Sweet';
UPDATE recipes SET description = '크리스마스, 푸딩' WHERE source = 'themealdb' AND description = 'Christmas,Pudding';
UPDATE recipes SET description = '크리스마스, 케이크' WHERE source = 'themealdb' AND description = 'Christmas,Cake';
UPDATE recipes SET description = '고기, 커리' WHERE source = 'themealdb' AND description = 'Meat,Curry';
UPDATE recipes SET description = '커리, 고기' WHERE source = 'themealdb' AND description = 'Curry,Meat';
UPDATE recipes SET description = '생선, 커리' WHERE source = 'themealdb' AND description = 'Fish,Curry';
UPDATE recipes SET description = '커리, 생선' WHERE source = 'themealdb' AND description = 'Curry,Fish';
UPDATE recipes SET description = '생선, 수프' WHERE source = 'themealdb' AND description = 'Fish,Soup';
UPDATE recipes SET description = '수프, 생선' WHERE source = 'themealdb' AND description = 'Soup,Fish';
UPDATE recipes SET description = '해산물, 커리' WHERE source = 'themealdb' AND description = 'Seafood,Curry';
UPDATE recipes SET description = '커리, 해산물' WHERE source = 'themealdb' AND description = 'Curry,Seafood';
UPDATE recipes SET description = '해산물, 수프' WHERE source = 'themealdb' AND description = 'Seafood,Soup';
UPDATE recipes SET description = '파스타, 고기' WHERE source = 'themealdb' AND description = 'Pasta,Meat';
UPDATE recipes SET description = '고기, 파스타' WHERE source = 'themealdb' AND description = 'Meat,Pasta';
UPDATE recipes SET description = '고기, 바비큐' WHERE source = 'themealdb' AND description = 'Meat,BBQ';
UPDATE recipes SET description = '바비큐, 고기' WHERE source = 'themealdb' AND description = 'BBQ,Meat';
UPDATE recipes SET description = '고기, 샌드위치' WHERE source = 'themealdb' AND description = 'Meat,Sandwich';
UPDATE recipes SET description = '샌드위치, 고기' WHERE source = 'themealdb' AND description = 'Sandwich,Meat';
UPDATE recipes SET description = '달걀, 아침식사' WHERE source = 'themealdb' AND description = 'Egg,Breakfast';
UPDATE recipes SET description = '아침식사, 달걀' WHERE source = 'themealdb' AND description = 'Breakfast,Egg';
UPDATE recipes SET description = '채식, 커리' WHERE source = 'themealdb' AND description = 'Vegetarian,Curry';
UPDATE recipes SET description = '커리, 채식' WHERE source = 'themealdb' AND description = 'Curry,Vegetarian';
UPDATE recipes SET description = '채식, 수프' WHERE source = 'themealdb' AND description = 'Vegetarian,Soup';
UPDATE recipes SET description = '수프, 채식' WHERE source = 'themealdb' AND description = 'Soup,Vegetarian';
UPDATE recipes SET description = '채식, 샐러드' WHERE source = 'themealdb' AND description = 'Vegetarian,Salad';
UPDATE recipes SET description = '샐러드, 채식' WHERE source = 'themealdb' AND description = 'Salad,Vegetarian';
UPDATE recipes SET description = '채식, 사이드' WHERE source = 'themealdb' AND description = 'Vegetarian,SideDish';
UPDATE recipes SET description = '비건, 커리' WHERE source = 'themealdb' AND description = 'Vegan,Curry';
UPDATE recipes SET description = '비건, 샐러드' WHERE source = 'themealdb' AND description = 'Vegan,Salad';
UPDATE recipes SET description = '짭짤한, 고기' WHERE source = 'themealdb' AND description = 'Savoury,Meat';
UPDATE recipes SET description = '짭짤한, 고기' WHERE source = 'themealdb' AND description = 'Savory,Meat';
UPDATE recipes SET description = '고기, 짭짤한' WHERE source = 'themealdb' AND description = 'Meat,Savoury';
UPDATE recipes SET description = '고기, 짭짤한' WHERE source = 'themealdb' AND description = 'Meat,Savory';
UPDATE recipes SET description = '기름진, 고기' WHERE source = 'themealdb' AND description = 'Greasy,Meat';
UPDATE recipes SET description = '고기, 기름진' WHERE source = 'themealdb' AND description = 'Meat,Greasy';
UPDATE recipes SET description = '든든한, 고기' WHERE source = 'themealdb' AND description = 'Heavy,Meat';
UPDATE recipes SET description = '고기, 든든한' WHERE source = 'themealdb' AND description = 'Meat,Heavy';
UPDATE recipes SET description = '가벼운, 샐러드' WHERE source = 'themealdb' AND description = 'Light,Salad';
UPDATE recipes SET description = '샐러드, 가벼운' WHERE source = 'themealdb' AND description = 'Salad,Light';
UPDATE recipes SET description = '신선한, 샐러드' WHERE source = 'themealdb' AND description = 'Fresh,Salad';
UPDATE recipes SET description = '매운, 고기' WHERE source = 'themealdb' AND description = 'Spicy,Meat';
UPDATE recipes SET description = '고기, 매운' WHERE source = 'themealdb' AND description = 'Meat,Spicy';
UPDATE recipes SET description = '매운, 생선' WHERE source = 'themealdb' AND description = 'Spicy,Fish';
UPDATE recipes SET description = '생선, 매운' WHERE source = 'themealdb' AND description = 'Fish,Spicy';
UPDATE recipes SET description = '간식, 아침식사' WHERE source = 'themealdb' AND description = 'Snack,Breakfast';
UPDATE recipes SET description = '아침식사, 간식' WHERE source = 'themealdb' AND description = 'Breakfast,Snack';
UPDATE recipes SET description = '길거리음식, 고기' WHERE source = 'themealdb' AND description = 'Streetfood,Meat';
UPDATE recipes SET description = '고기, 길거리음식' WHERE source = 'themealdb' AND description = 'Meat,Streetfood';
UPDATE recipes SET description = '길거리음식, 간편식' WHERE source = 'themealdb' AND description = 'Streetfood,Onthego';
UPDATE recipes SET description = '간편식, 길거리음식' WHERE source = 'themealdb' AND description = 'Onthego,Streetfood';
UPDATE recipes SET description = '칠리, 매운' WHERE source = 'themealdb' AND description = 'Chilli,Spicy';
UPDATE recipes SET description = '칠리, 순한' WHERE source = 'themealdb' AND description = 'Chilli,Mild';
UPDATE recipes SET description = '소시지, 고기' WHERE source = 'themealdb' AND description = 'Sausages,Meat';
UPDATE recipes SET description = '팬케이크, 달콤' WHERE source = 'themealdb' AND description = 'Pancake,Sweet';
UPDATE recipes SET description = '달콤, 팬케이크' WHERE source = 'themealdb' AND description = 'Sweet,Pancake';
UPDATE recipes SET description = '콩류, 채식' WHERE source = 'themealdb' AND description = 'Pulse,Vegetarian';
UPDATE recipes SET description = '채식, 콩류' WHERE source = 'themealdb' AND description = 'Vegetarian,Pulse';
UPDATE recipes SET description = '브런치, 달걀' WHERE source = 'themealdb' AND description = 'Brunch,Egg';
UPDATE recipes SET description = '달걀, 브런치' WHERE source = 'themealdb' AND description = 'Egg,Brunch';
UPDATE recipes SET description = '치즈, 달걀' WHERE source = 'themealdb' AND description = 'Cheesy,Egg';
UPDATE recipes SET description = '달걀, 치즈' WHERE source = 'themealdb' AND description = 'Egg,Cheesy';
UPDATE recipes SET description = '해장, 아침식사' WHERE source = 'themealdb' AND description = 'HangoverFood,Breakfast';
UPDATE recipes SET description = '아침식사, 해장' WHERE source = 'themealdb' AND description = 'Breakfast,HangoverFood';
UPDATE recipes SET description = '특선, 고기' WHERE source = 'themealdb' AND description = 'Speciality,Meat';
UPDATE recipes SET description = '고기, 특선' WHERE source = 'themealdb' AND description = 'Meat,Speciality';
UPDATE recipes SET description = '축하, 케이크' WHERE source = 'themealdb' AND description = 'Celebration,Cake';
UPDATE recipes SET description = '케이크, 축하' WHERE source = 'themealdb' AND description = 'Cake,Celebration';
UPDATE recipes SET description = '파티, 달콤' WHERE source = 'themealdb' AND description = 'Party,Sweet';
UPDATE recipes SET description = '달콤, 파티' WHERE source = 'themealdb' AND description = 'Sweet,Party';
UPDATE recipes SET description = '저칼로리, 채식' WHERE source = 'themealdb' AND description = 'LowCalorie,Vegetarian';
UPDATE recipes SET description = '글레이즈, 고기' WHERE source = 'themealdb' AND description = 'Glazed,Meat';
UPDATE recipes SET description = '고기, 글레이즈' WHERE source = 'themealdb' AND description = 'Meat,Glazed';
UPDATE recipes SET description = '저탄수화물, 고기' WHERE source = 'themealdb' AND description = 'LowCarbs,Meat';
UPDATE recipes SET description = '메인요리, 고기' WHERE source = 'themealdb' AND description = 'MainMeal,Meat';
UPDATE recipes SET description = '고기, 메인요리' WHERE source = 'themealdb' AND description = 'Meat,MainMeal';
UPDATE recipes SET description = '디너파티, 고기' WHERE source = 'themealdb' AND description = 'DinnerParty,Meat';
UPDATE recipes SET description = '데이트, 고기' WHERE source = 'themealdb' AND description = 'DateNight,Meat';
UPDATE recipes SET description = '저렴한, 고기' WHERE source = 'themealdb' AND description = 'Cheap,Meat';
UPDATE recipes SET description = '고급, 고기' WHERE source = 'themealdb' AND description = 'Expensive,Meat';
UPDATE recipes SET description = '강한맛, 고기' WHERE source = 'themealdb' AND description = 'StrongFlavor,Meat';
UPDATE recipes SET description = '따뜻한, 수프' WHERE source = 'themealdb' AND description = 'Warm,Soup';
UPDATE recipes SET description = '여름, 샐러드' WHERE source = 'themealdb' AND description = 'Summer,Salad';
UPDATE recipes SET description = '할로윈, 달콤' WHERE source = 'themealdb' AND description = 'Halloween,Sweet';
UPDATE recipes SET description = '견과류, 달콤' WHERE source = 'themealdb' AND description = 'Nutty,Sweet';
UPDATE recipes SET description = '달콤, 견과류' WHERE source = 'themealdb' AND description = 'Sweet,Nutty';
UPDATE recipes SET description = '시큼한, 달콤' WHERE source = 'themealdb' AND description = 'Sour,Sweet';
UPDATE recipes SET description = '달콤, 시큼한' WHERE source = 'themealdb' AND description = 'Sweet,Sour';
UPDATE recipes SET description = '고칼로리, 달콤' WHERE source = 'themealdb' AND description = 'Calorific,Sweet';
UPDATE recipes SET description = '고칼로리, 달콤' WHERE source = 'themealdb' AND description = 'UnHealthy,Sweet';
UPDATE recipes SET description = '주류, 달콤' WHERE source = 'themealdb' AND description = 'Alcoholic,Sweet';
UPDATE recipes SET description = '팔레오, 고기' WHERE source = 'themealdb' AND description = 'Paleo,Meat';
UPDATE recipes SET description = '키토, 고기' WHERE source = 'themealdb' AND description = 'Keto,Meat';
UPDATE recipes SET description = '고지방, 고기' WHERE source = 'themealdb' AND description = 'HighFat,Meat';

-- 3-tag combinations
UPDATE recipes SET description = '달콤, 베이킹, 케이크' WHERE source = 'themealdb' AND description = 'Sweet,Baking,Cake';
UPDATE recipes SET description = '달콤, 초콜릿, 케이크' WHERE source = 'themealdb' AND description = 'Sweet,Chocolate,Cake';
UPDATE recipes SET description = '달콤, 초콜릿, 푸딩' WHERE source = 'themealdb' AND description = 'Sweet,Chocolate,Pudding';
UPDATE recipes SET description = '달콤, 과일, 푸딩' WHERE source = 'themealdb' AND description = 'Sweet,Fruity,Pudding';
UPDATE recipes SET description = '달콤, 과일, 케이크' WHERE source = 'themealdb' AND description = 'Sweet,Fruity,Cake';
UPDATE recipes SET description = '달콤, 베이킹, 타르트' WHERE source = 'themealdb' AND description = 'Sweet,Baking,Tart';
UPDATE recipes SET description = '달콤, 간식, 초콜릿' WHERE source = 'themealdb' AND description = 'Sweet,Snack,Chocolate';
UPDATE recipes SET description = '달콤, 간식, 간식' WHERE source = 'themealdb' AND description = 'Sweet,Snack,Treat';
UPDATE recipes SET description = '달콤, 카라멜, 푸딩' WHERE source = 'themealdb' AND description = 'Sweet,Caramel,Pudding';
UPDATE recipes SET description = '달콤, 카라멜, 케이크' WHERE source = 'themealdb' AND description = 'Sweet,Caramel,Cake';
UPDATE recipes SET description = '크리스마스, 달콤, 케이크' WHERE source = 'themealdb' AND description = 'Christmas,Sweet,Cake';
UPDATE recipes SET description = '크리스마스, 달콤, 푸딩' WHERE source = 'themealdb' AND description = 'Christmas,Sweet,Pudding';
UPDATE recipes SET description = '커리, 순한, 고기' WHERE source = 'themealdb' AND description = 'Curry,Mild,Meat';
UPDATE recipes SET description = '커리, 매운, 고기' WHERE source = 'themealdb' AND description = 'Curry,Spicy,Meat';
UPDATE recipes SET description = '매운, 고기, 커리' WHERE source = 'themealdb' AND description = 'Spicy,Meat,Curry';
UPDATE recipes SET description = '고기, 스튜, 수프' WHERE source = 'themealdb' AND description = 'Meat,Stew,Soup';
UPDATE recipes SET description = '고기, 파이, 베이킹' WHERE source = 'themealdb' AND description = 'Meat,Pie,Baking';
UPDATE recipes SET description = '파이, 고기, 베이킹' WHERE source = 'themealdb' AND description = 'Pie,Meat,Baking';
UPDATE recipes SET description = '고기, 바비큐, 매운' WHERE source = 'themealdb' AND description = 'Meat,BBQ,Spicy';
UPDATE recipes SET description = '해산물, 생선, 수프' WHERE source = 'themealdb' AND description = 'Seafood,Fish,Soup';
UPDATE recipes SET description = '해산물, 생선, 커리' WHERE source = 'themealdb' AND description = 'Seafood,Fish,Curry';
UPDATE recipes SET description = '채식, 수프, 콩류' WHERE source = 'themealdb' AND description = 'Vegetarian,Soup,Pulse';
UPDATE recipes SET description = '채식, 커리, 콩류' WHERE source = 'themealdb' AND description = 'Vegetarian,Curry,Pulse';
UPDATE recipes SET description = '채식, 샐러드, 가벼운' WHERE source = 'themealdb' AND description = 'Vegetarian,Salad,Light';

-- ============================================================
-- 4. TheMealDB title 한국어 번역 (전체 598개 레시피)
-- ============================================================

-- Beef (23190-23268)
UPDATE recipes SET title = '알제리식 케프타 (미트볼)' WHERE id = 23190;
UPDATE recipes SET title = '아레파 파베욘' WHERE id = 23191;
UPDATE recipes SET title = '아레파 펠루아' WHERE id = 23192;
UPDATE recipes SET title = '아사도' WHERE id = 23193;
UPDATE recipes SET title = '호주식 버거' WHERE id = 23194;
UPDATE recipes SET title = '소고기 브로콜리 볶음' WHERE id = 23195;
UPDATE recipes SET title = '소고기 머스타드 파이' WHERE id = 23196;
UPDATE recipes SET title = '소고기 굴 파이' WHERE id = 23197;
UPDATE recipes SET title = '비프 아사도' WHERE id = 23198;
UPDATE recipes SET title = '소고기 반미 볼과 스리라차 마요, 당근, 피클 오이' WHERE id = 23199;
UPDATE recipes SET title = '뵈프 부르기뇽' WHERE id = 23200;
UPDATE recipes SET title = '소고기 브리스킷 팟 로스트' WHERE id = 23201;
UPDATE recipes SET title = '비프 칼데레타' WHERE id = 23202;
UPDATE recipes SET title = '소고기 만두 스튜' WHERE id = 23203;
UPDATE recipes SET title = '소고기 엠파나다' WHERE id = 23204;
UPDATE recipes SET title = '소고기 로메인' WHERE id = 23205;
UPDATE recipes SET title = '비프 만디' WHERE id = 23206;
UPDATE recipes SET title = '비프 메차도' WHERE id = 23207;
UPDATE recipes SET title = '소고기 쌀국수 (퍼)' WHERE id = 23208;
UPDATE recipes SET title = '비프 렌당' WHERE id = 23209;
UPDATE recipes SET title = '비프 스트로가노프' WHERE id = 23210;
UPDATE recipes SET title = '소고기 선데이 로스트' WHERE id = 23211;
UPDATE recipes SET title = '비프 웰링턴' WHERE id = 23212;
UPDATE recipes SET title = '빅맥' WHERE id = 23213;
UPDATE recipes SET title = '비고스 (폴란드식 사냥꾼 스튜)' WHERE id = 23214;
UPDATE recipes SET title = '비스텍' WHERE id = 23215;
UPDATE recipes SET title = '비터발렌 (네덜란드식 미트볼)' WHERE id = 23216;
UPDATE recipes SET title = '보르시' WHERE id = 23217;
UPDATE recipes SET title = '소고기 칠리 찜' WHERE id = 23218;
UPDATE recipes SET title = '브룬 랍스카우스 (노르웨이식 소고기 채소 스튜)' WHERE id = 23219;
UPDATE recipes SET title = '카르보나다 크리오야' WHERE id = 23220;
UPDATE recipes SET title = '체바피 소시지' WHERE id = 23221;
UPDATE recipes SET title = '치비토 샌드위치' WHERE id = 23222;
UPDATE recipes SET title = '치비토 우루과요' WHERE id = 23223;
UPDATE recipes SET title = '클래식 투르티에르' WHERE id = 23224;
UPDATE recipes SET title = '콘비프와 양배추' WHERE id = 23225;
UPDATE recipes SET title = '콘비프와 양배추 – 자메이카 스타일' WHERE id = 23226;
UPDATE recipes SET title = '콘비프 해시' WHERE id = 23227;
UPDATE recipes SET title = '크로아티아식 콩 스튜' WHERE id = 23228;
UPDATE recipes SET title = '크로아티아식 양고기 페카' WHERE id = 23229;
UPDATE recipes SET title = '컴벌랜드 파이' WHERE id = 23230;
UPDATE recipes SET title = '취한 면 (팟끼마오)' WHERE id = 23231;
UPDATE recipes SET title = '이집트식 파테' WHERE id = 23232;
UPDATE recipes SET title = '엠파나다' WHERE id = 23233;
UPDATE recipes SET title = '고웡키 (양배추 롤)' WHERE id = 23234;
UPDATE recipes SET title = '아이리시 스튜' WHERE id = 23235;
UPDATE recipes SET title = '자메이카식 소고기 패티' WHERE id = 23236;
UPDATE recipes SET title = '직스 디너' WHERE id = 23237;
UPDATE recipes SET title = '카르보나데르 (저지방 소고기 패티)와 카라멜 양파' WHERE id = 23238;
UPDATE recipes SET title = '케냐식 소고기 커리' WHERE id = 23239;
UPDATE recipes SET title = '레몬그라스 소고기 스튜와 면' WHERE id = 23240;
UPDATE recipes SET title = '마파두부' WHERE id = 23241;
UPDATE recipes SET title = '마사만 소고기 커리' WHERE id = 23242;
UPDATE recipes SET title = '마탐브레 알라 피자' WHERE id = 23243;
UPDATE recipes SET title = '밀라네사' WHERE id = 23244;
UPDATE recipes SET title = '다진 소고기 파이' WHERE id = 23245;
UPDATE recipes SET title = '미니 칠리 소고기 파이' WHERE id = 23246;
UPDATE recipes SET title = '몬트리올 훈제 고기' WHERE id = 23247;
UPDATE recipes SET title = '무사카' WHERE id = 23248;
UPDATE recipes SET title = '물루키야' WHERE id = 23249;
UPDATE recipes SET title = '소꼬리와 잠두콩' WHERE id = 23250;
UPDATE recipes SET title = '파슈테치키 (폴란드식 패스티)' WHERE id = 23251;
UPDATE recipes SET title = '파테 시누아' WHERE id = 23252;
UPDATE recipes SET title = '포르투갈식 프레고와 그린 피리피리' WHERE id = 23253;
UPDATE recipes SET title = '붉은 완두콩 수프' WHERE id = 23254;
UPDATE recipes SET title = '로티 존' WHERE id = 23255;
UPDATE recipes SET title = '샤와르마 척 로스트 랩' WHERE id = 23256;
UPDATE recipes SET title = '간장 미트로프와 와사비 매시드 포테이토, 구운 당근' WHERE id = 23257;
UPDATE recipes SET title = '스파게티 볼로네제' WHERE id = 23258;
UPDATE recipes SET title = '스테이크와 베트남식 면 샐러드' WHERE id = 23259;
UPDATE recipes SET title = '스테이크 앤 키드니 파이' WHERE id = 23260;
UPDATE recipes SET title = '스테이크 다이앤' WHERE id = 23261;
UPDATE recipes SET title = '사천식 소고기' WHERE id = 23262;
UPDATE recipes SET title = '태국식 소고기 볶음' WHERE id = 23263;
UPDATE recipes SET title = '전통 크로아티아식 굴라시' WHERE id = 23264;
UPDATE recipes SET title = '터키식 라흐마준' WHERE id = 23265;
UPDATE recipes SET title = '채소 셰퍼드 파이' WHERE id = 23266;
UPDATE recipes SET title = '베네수엘라식 산코초' WHERE id = 23267;
UPDATE recipes SET title = '베네수엘라식 찢은 소고기' WHERE id = 23268;

-- Chicken (23269-23334)
UPDATE recipes SET title = '15분 치킨 할루미 버거' WHERE id = 23269;
UPDATE recipes SET title = '아얌 퍼칙' WHERE id = 23270;
UPDATE recipes SET title = '브라운 스튜 치킨' WHERE id = 23271;
UPDATE recipes SET title = '칙필레 샌드위치' WHERE id = 23272;
UPDATE recipes SET title = '치킨 초리소 밥솥 요리' WHERE id = 23273;
UPDATE recipes SET title = '치킨 버섯 핫팟' WHERE id = 23274;
UPDATE recipes SET title = '치킨 알프레도 프리마베라' WHERE id = 23275;
UPDATE recipes SET title = '치킨 바스케이즈' WHERE id = 23276;
UPDATE recipes SET title = '닭죽' WHERE id = 23277;
UPDATE recipes SET title = '치킨 쿠스쿠스' WHERE id = 23278;
UPDATE recipes SET title = '치킨 엔칠라다 캐서롤' WHERE id = 23279;
UPDATE recipes SET title = '치킨 파히타 맥앤치즈' WHERE id = 23280;
UPDATE recipes SET title = '치킨 볶음밥' WHERE id = 23281;
UPDATE recipes SET title = '치킨 햄 리크 파이' WHERE id = 23282;
UPDATE recipes SET title = '치킨 한디' WHERE id = 23283;
UPDATE recipes SET title = '치킨 가라아게' WHERE id = 23284;
UPDATE recipes SET title = '치킨 만디' WHERE id = 23285;
UPDATE recipes SET title = '치킨 마렝고' WHERE id = 23286;
UPDATE recipes SET title = '치킨 파르망티에' WHERE id = 23287;
UPDATE recipes SET title = '치킨 퀴노아 그리스 샐러드' WHERE id = 23288;
UPDATE recipes SET title = '치킨 샤와르마와 수제 마늘 허브 요거트 소스' WHERE id = 23289;
UPDATE recipes SET title = '쿠민, 레몬, 마늘 닭날개' WHERE id = 23290;
UPDATE recipes SET title = '사프란, 건포도, 잣 치킨' WHERE id = 23291;
UPDATE recipes SET title = '중국식 오렌지 치킨' WHERE id = 23292;
UPDATE recipes SET title = '꼬끄 오 뱅' WHERE id = 23293;
UPDATE recipes SET title = '슬로우쿠커 치킨 베이크드 타코' WHERE id = 23294;
UPDATE recipes SET title = '간편 스페인식 치킨' WHERE id = 23295;
UPDATE recipes SET title = '프렌치 어니언 치킨과 구운 당근, 매시드 포테이토' WHERE id = 23296;
UPDATE recipes SET title = '제너럴 초 치킨' WHERE id = 23297;
UPDATE recipes SET title = '허니 발사믹 치킨과 바삭한 브로콜리, 감자' WHERE id = 23298;
UPDATE recipes SET title = '자메이카 커리 치킨' WHERE id = 23299;
UPDATE recipes SET title = '저크 치킨과 밥, 완두콩' WHERE id = 23300;
UPDATE recipes SET title = '캅세' WHERE id = 23301;
UPDATE recipes SET title = '카츠 치킨 커리' WHERE id = 23302;
UPDATE recipes SET title = '켄터키 프라이드 치킨' WHERE id = 23303;
UPDATE recipes SET title = '궁보계정 (쿵파오 치킨)' WHERE id = 23304;
UPDATE recipes SET title = '견과류 치킨 커리' WHERE id = 23305;
UPDATE recipes SET title = '팟시유' WHERE id = 23306;
UPDATE recipes SET title = '빠낭 치킨 커리' WHERE id = 23307;
UPDATE recipes SET title = '피리피리 치킨과 코울슬로' WHERE id = 23308;
UPDATE recipes SET title = '폴로 엔 페피토리아' WHERE id = 23309;
UPDATE recipes SET title = '치킨 감자 그라탕' WHERE id = 23310;
UPDATE recipes SET title = '알제리식 로스트 치킨' WHERE id = 23311;
UPDATE recipes SET title = '래피 파이' WHERE id = 23312;
UPDATE recipes SET title = '레드 커리 치킨 케밥' WHERE id = 23313;
UPDATE recipes SET title = '크리미 호두 소스 로스트 치킨' WHERE id = 23314;
UPDATE recipes SET title = '로솔 (폴란드식 치킨 수프)' WHERE id = 23315;
UPDATE recipes SET title = '샤와르마' WHERE id = 23316;
UPDATE recipes SET title = '스모키 치킨 꼬치' WHERE id = 23317;
UPDATE recipes SET title = '스페인식 콩 요리와 치킨, 초리소' WHERE id = 23318;
UPDATE recipes SET title = '스페인식 치킨' WHERE id = 23319;
UPDATE recipes SET title = '스페인식 치킨 파이' WHERE id = 23320;
UPDATE recipes SET title = '양념 스모키 바비큐 치킨' WHERE id = 23321;
UPDATE recipes SET title = '스티키 치킨' WHERE id = 23322;
UPDATE recipes SET title = '고추 바질 닭고기 볶음' WHERE id = 23323;
UPDATE recipes SET title = '탕수계 (새콤달콤 치킨)' WHERE id = 23324;
UPDATE recipes SET title = '당근 고구마 치킨 타진' WHERE id = 23325;
UPDATE recipes SET title = '탄두리 치킨' WHERE id = 23326;
UPDATE recipes SET title = '데리야키 치킨 캐서롤' WHERE id = 23327;
UPDATE recipes SET title = '태국식 치킨 케이크와 스위트 칠리 소스' WHERE id = 23328;
UPDATE recipes SET title = '태국식 닭 다리' WHERE id = 23329;
UPDATE recipes SET title = '태국식 그린 치킨 수프' WHERE id = 23330;
UPDATE recipes SET title = '태국식 그린 커리' WHERE id = 23331;
UPDATE recipes SET title = '톰카가이' WHERE id = 23332;
UPDATE recipes SET title = '베네수엘라식 코코넛 치킨' WHERE id = 23333;
UPDATE recipes SET title = '베트남식 치킨 샐러드' WHERE id = 23334;

-- Dessert (23335-23455)
UPDATE recipes SET title = '에블레스키버' WHERE id = 23335;
UPDATE recipes SET title = '알파호레스' WHERE id = 23336;
UPDATE recipes SET title = '안작 비스킷' WHERE id = 23337;
UPDATE recipes SET title = '아팜 발릭' WHERE id = 23338;
UPDATE recipes SET title = '사과 블랙베리 크럼블' WHERE id = 23339;
UPDATE recipes SET title = '사과 케이크' WHERE id = 23340;
UPDATE recipes SET title = '사과 프란지판 타르트' WHERE id = 23341;
UPDATE recipes SET title = '살구 터키시 딜라이트 메스' WHERE id = 23342;
UPDATE recipes SET title = '정통 노르웨이식 크란세카케' WHERE id = 23343;
UPDATE recipes SET title = '베이크웰 타르트' WHERE id = 23344;
UPDATE recipes SET title = '바클라바와 양념 견과류, 리코타, 초콜릿' WHERE id = 23345;
UPDATE recipes SET title = '바나나 팬케이크' WHERE id = 23346;
UPDATE recipes SET title = '바텐버그 케이크' WHERE id = 23347;
UPDATE recipes SET title = '비버테일' WHERE id = 23348;
UPDATE recipes SET title = '비트 팬케이크' WHERE id = 23349;
UPDATE recipes SET title = '블랙베리 풀' WHERE id = 23350;
UPDATE recipes SET title = '블루베리 레몬 프리앙' WHERE id = 23351;
UPDATE recipes SET title = '빵 버터 푸딩' WHERE id = 23352;
UPDATE recipes SET title = '부디노 디 리코타' WHERE id = 23353;
UPDATE recipes SET title = '캐나다식 버터 타르트' WHERE id = 23354;
UPDATE recipes SET title = '카리브해 타마린드 볼' WHERE id = 23355;
UPDATE recipes SET title = '당근 케이크' WHERE id = 23356;
UPDATE recipes SET title = '캐슈넛 고리바 비스킷' WHERE id = 23357;
UPDATE recipes SET title = '첼시 번' WHERE id = 23358;
UPDATE recipes SET title = '시농 사과 타르트' WHERE id = 23359;
UPDATE recipes SET title = '초코칩 피칸 파이' WHERE id = 23360;
UPDATE recipes SET title = '초콜릿 알파호레스' WHERE id = 23361;
UPDATE recipes SET title = '초콜릿 아보카도 무스' WHERE id = 23362;
UPDATE recipes SET title = '초콜릿 카라멜 크리스피' WHERE id = 23363;
UPDATE recipes SET title = '초콜릿 츄러스와 솔티드 카라멜 소스' WHERE id = 23364;
UPDATE recipes SET title = '초콜릿 코코넛 스퀘어' WHERE id = 23365;
UPDATE recipes SET title = '초콜릿 엠파나다' WHERE id = 23366;
UPDATE recipes SET title = '초콜릿 가또' WHERE id = 23367;
UPDATE recipes SET title = '초콜릿 라즈베리 브라우니' WHERE id = 23368;
UPDATE recipes SET title = '초콜릿 수플레' WHERE id = 23369;
UPDATE recipes SET title = '크리스마스 케이크' WHERE id = 23370;
UPDATE recipes SET title = '크리스마스 푸딩 플랩잭' WHERE id = 23371;
UPDATE recipes SET title = '크리스마스 푸딩 트라이플' WHERE id = 23372;
UPDATE recipes SET title = '츄러스' WHERE id = 23373;
UPDATE recipes SET title = '시나몬 번' WHERE id = 23374;
UPDATE recipes SET title = '클래식 크리스마스 푸딩' WHERE id = 23375;
UPDATE recipes SET title = '코른 드 가젤 (가젤 혼)' WHERE id = 23376;
UPDATE recipes SET title = '크레마 카탈라나' WHERE id = 23377;
UPDATE recipes SET title = '대추 스퀘어' WHERE id = 23378;
UPDATE recipes SET title = '둘세 데 레체' WHERE id = 23379;
UPDATE recipes SET title = '던디 케이크' WHERE id = 23380;
UPDATE recipes SET title = '네덜란드식 스트룹와플' WHERE id = 23381;
UPDATE recipes SET title = '지리아트 (알제리식 아몬드 타르트)' WHERE id = 23382;
UPDATE recipes SET title = '에클스 케이크' WHERE id = 23383;
UPDATE recipes SET title = '엔사이마다' WHERE id = 23384;
UPDATE recipes SET title = '이튼 메스' WHERE id = 23385;
UPDATE recipes SET title = '피기 더프' WHERE id = 23386;
UPDATE recipes SET title = '플란' WHERE id = 23387;
UPDATE recipes SET title = '플래퍼 파이' WHERE id = 23388;
UPDATE recipes SET title = '퓌르스테카게 – 노르웨이 왕자 케이크' WHERE id = 23389;
UPDATE recipes SET title = '게불드 스페쿨라스' WHERE id = 23390;
UPDATE recipes SET title = '그레이프 넛 아이스크림' WHERE id = 23391;
UPDATE recipes SET title = '꿀 요거트 치즈케이크' WHERE id = 23392;
UPDATE recipes SET title = '핫 초콜릿 퍼지' WHERE id = 23393;
UPDATE recipes SET title = '잼 잼 쿠키' WHERE id = 23394;
UPDATE recipes SET title = '잼 롤리폴리' WHERE id = 23395;
UPDATE recipes SET title = '자메이카식 바나나 프리터' WHERE id = 23396;
UPDATE recipes SET title = '자메이카식 스파이스 번' WHERE id = 23397;
UPDATE recipes SET title = '자메이카식 고구마 푸딩' WHERE id = 23398;
UPDATE recipes SET title = '키 라임 파이' WHERE id = 23399;
UPDATE recipes SET title = '크나페' WHERE id = 23400;
UPDATE recipes SET title = '크리스피 크림 도넛' WHERE id = 23401;
UPDATE recipes SET title = '크베피오르 케이크 (세상에서 제일 맛있는 케이크)' WHERE id = 23402;
UPDATE recipes SET title = '래밍턴' WHERE id = 23403;
UPDATE recipes SET title = '마데이라 케이크' WHERE id = 23404;
UPDATE recipes SET title = '마물 (이드 비스킷)' WHERE id = 23405;
UPDATE recipes SET title = '마자리너 – 스칸디나비아식 아몬드 타르틀렛' WHERE id = 23406;
UPDATE recipes SET title = '민스 파이' WHERE id = 23407;
UPDATE recipes SET title = '미니 번트 케이크' WHERE id = 23408;
UPDATE recipes SET title = '나나이모 바' WHERE id = 23409;
UPDATE recipes SET title = '뉴욕 치즈케이크' WHERE id = 23410;
UPDATE recipes SET title = '노젓기 럼 건포도 아이스크림' WHERE id = 23411;
UPDATE recipes SET title = '노르웨이식 크룸카케' WHERE id = 23412;
UPDATE recipes SET title = '팬케이크' WHERE id = 23413;
UPDATE recipes SET title = '파킨 케이크' WHERE id = 23414;
UPDATE recipes SET title = '패션프루트 무스' WHERE id = 23415;
UPDATE recipes SET title = '복숭아 블루베리 그런트' WHERE id = 23416;
UPDATE recipes SET title = '피넛버터 치즈케이크' WHERE id = 23417;
UPDATE recipes SET title = '피넛버터 쿠키' WHERE id = 23418;
UPDATE recipes SET title = '배 타르트 타탱' WHERE id = 23419;
UPDATE recipes SET title = '피에르니크 (폴란드식 진저브레드)' WHERE id = 23420;
UPDATE recipes SET title = '피스타치오 케이크' WHERE id = 23421;
UPDATE recipes SET title = '피스타치오 쿠나파 초콜릿 케이크와 컵케이크' WHERE id = 23422;
UPDATE recipes SET title = '폴란드식 초콜릿 호두 케이크' WHERE id = 23423;
UPDATE recipes SET title = '폴란드식 도넛 (퐁치키)' WHERE id = 23424;
UPDATE recipes SET title = '폴란드식 팬케이크 (날레시니키)' WHERE id = 23425;
UPDATE recipes SET title = '포르투갈식 커스터드 타르트' WHERE id = 23426;
UPDATE recipes SET title = '포스트레 차하' WHERE id = 23427;
UPDATE recipes SET title = '푸딩 쇼뫼르' WHERE id = 23428;
UPDATE recipes SET title = '펌프킨 파이' WHERE id = 23429;
UPDATE recipes SET title = '라즈베리 무스' WHERE id = 23430;
UPDATE recipes SET title = '록 케이크' WHERE id = 23431;
UPDATE recipes SET title = '로키 로드 퍼지' WHERE id = 23432;
UPDATE recipes SET title = '로갈리키 (폴란드식 크루아상 쿠키)' WHERE id = 23433;
UPDATE recipes SET title = '솔티드 카라멜 치즈케이크' WHERE id = 23434;
UPDATE recipes SET title = '사스카툰 파이' WHERE id = 23435;
UPDATE recipes SET title = '세리 무카 쿠이' WHERE id = 23436;
UPDATE recipes SET title = '스페인식 무화과 아몬드 볼' WHERE id = 23437;
UPDATE recipes SET title = '스포티드 딕' WHERE id = 23438;
UPDATE recipes SET title = '스티키 토피 푸딩' WHERE id = 23439;
UPDATE recipes SET title = '궁극의 스티키 토피 푸딩' WHERE id = 23440;
UPDATE recipes SET title = '딸기 로마노프' WHERE id = 23441;
UPDATE recipes SET title = '딸기 루바브 파이' WHERE id = 23442;
UPDATE recipes SET title = '슈가 파이' WHERE id = 23443;
UPDATE recipes SET title = '노르웨이식 아몬드 성공 케이크' WHERE id = 23444;
UPDATE recipes SET title = '슐란체 스 마콤' WHERE id = 23445;
UPDATE recipes SET title = '여름 푸딩' WHERE id = 23446;
UPDATE recipes SET title = '톨 스콜레볼레르' WHERE id = 23447;
UPDATE recipes SET title = '타르트 타탱' WHERE id = 23448;
UPDATE recipes SET title = '팀비츠' WHERE id = 23449;
UPDATE recipes SET title = '트리클 타르트' WHERE id = 23450;
UPDATE recipes SET title = '튀니지식 오렌지 케이크' WHERE id = 23451;
UPDATE recipes SET title = '바닐라 알파호레스' WHERE id = 23452;
UPDATE recipes SET title = '호두 롤 구쥬바라' WHERE id = 23453;
UPDATE recipes SET title = '호두, 대추, 꿀 케이크' WHERE id = 23454;
UPDATE recipes SET title = '화이트 초콜릿 크렘 브륄레' WHERE id = 23455;

-- Lamb (23456-23483)
UPDATE recipes SET title = '아다나 케밥' WHERE id = 23456;
UPDATE recipes SET title = '칠리 생강 양갈비' WHERE id = 23457;
UPDATE recipes SET title = '초르바 함라 벨 프리크 (알제리식 양고기 토마토 프리케 수프)' WHERE id = 23458;
UPDATE recipes SET title = '포리콜 (노르웨이 국민 요리)' WHERE id = 23459;
UPDATE recipes SET title = '핫 쿠민 양고기 랩과 바삭한 슬로, 매운 마요' WHERE id = 23460;
UPDATE recipes SET title = '이맘 바이을디와 바비큐 양고기, 차치키' WHERE id = 23461;
UPDATE recipes SET title = '캅살론' WHERE id = 23462;
UPDATE recipes SET title = '켈레야 자라' WHERE id = 23463;
UPDATE recipes SET title = '코프타 버거' WHERE id = 23464;
UPDATE recipes SET title = '양고기 살구 미트볼' WHERE id = 23465;
UPDATE recipes SET title = '양고기 레몬 수블라키' WHERE id = 23466;
UPDATE recipes SET title = '양고기 감자 파이' WHERE id = 23467;
UPDATE recipes SET title = '양고기 비리야니' WHERE id = 23468;
UPDATE recipes SET title = '양고기 필라프 (플로프)' WHERE id = 23469;
UPDATE recipes SET title = '양고기 로간 조시' WHERE id = 23470;
UPDATE recipes SET title = '양고기 타진' WHERE id = 23471;
UPDATE recipes SET title = '양고기 토마토와 달콤한 향신료' WHERE id = 23472;
UPDATE recipes SET title = '양고기 차치키 버거' WHERE id = 23473;
UPDATE recipes SET title = '랭커셔 핫팟' WHERE id = 23474;
UPDATE recipes SET title = '맥싱스 스카치 파이' WHERE id = 23475;
UPDATE recipes SET title = '리가토니와 펜넬 소시지 소스' WHERE id = 23476;
UPDATE recipes SET title = '시나몬, 펜넬, 시트러스 슬로우 로스트 양고기' WHERE id = 23477;
UPDATE recipes SET title = '스페인식 슬로우쿡 양 어깨살과 콩' WHERE id = 23478;
UPDATE recipes SET title = '양고기 속을 채운 토마토' WHERE id = 23479;
UPDATE recipes SET title = '튀니지식 양고기 수프' WHERE id = 23480;
UPDATE recipes SET title = '터키식 양고기 필라프' WHERE id = 23481;
UPDATE recipes SET title = '터키식 양고기' WHERE id = 23482;
UPDATE recipes SET title = '베트남식 양고기 정강이와 고구마' WHERE id = 23483;

-- Miscellaneous (23484-23507)
UPDATE recipes SET title = '콩 소시지 핫팟' WHERE id = 23484;
UPDATE recipes SET title = '자메이카식 칼랄루' WHERE id = 23485;
UPDATE recipes SET title = '샤크슈카' WHERE id = 23486;
UPDATE recipes SET title = '오리 콩피' WHERE id = 23487;
UPDATE recipes SET title = '프렌치 렌틸콩과 마늘, 타임' WHERE id = 23488;
UPDATE recipes SET title = '프렌치 오믈렛' WHERE id = 23489;
UPDATE recipes SET title = '로크로' WHERE id = 23490;
UPDATE recipes SET title = '미가스' WHERE id = 23491;
UPDATE recipes SET title = '무타빡' WHERE id = 23492;
UPDATE recipes SET title = '오소부코 알라 밀라네제' WHERE id = 23493;
UPDATE recipes SET title = '피자 익스프레스 마르게리타' WHERE id = 23494;
UPDATE recipes SET title = '푸틴' WHERE id = 23495;
UPDATE recipes SET title = '보라색 브로콜리 튀김과 느억참' WHERE id = 23496;
UPDATE recipes SET title = '삶은 달걀 라멘' WHERE id = 23497;
UPDATE recipes SET title = '샥슈카' WHERE id = 23498;
UPDATE recipes SET title = '샥슈카 페타 치즈' WHERE id = 23499;
UPDATE recipes SET title = '스페인식 미트볼과 조개, 초리소, 오징어' WHERE id = 23500;
UPDATE recipes SET title = '시리아식 빵' WHERE id = 23501;
UPDATE recipes SET title = '시리아식 고기밥' WHERE id = 23502;
UPDATE recipes SET title = '세 가지 치즈 수플레' WHERE id = 23503;
UPDATE recipes SET title = '칠면조 반미' WHERE id = 23504;
UPDATE recipes SET title = '칠면조 미트로프' WHERE id = 23505;
UPDATE recipes SET title = '터키식 밥 (버미셀리 라이스)' WHERE id = 23506;
UPDATE recipes SET title = '요크셔 푸딩' WHERE id = 23507;

-- Pasta (23508-23517)
UPDATE recipes SET title = '칠리 새우 링귀네' WHERE id = 23508;
UPDATE recipes SET title = '페투치네 알프레도' WHERE id = 23509;
UPDATE recipes SET title = '페투치네 알프레도' WHERE id = 23510;
UPDATE recipes SET title = '구운 맥앤치즈 샌드위치' WHERE id = 23511;
UPDATE recipes SET title = '라자냐 샌드위치' WHERE id = 23512;
UPDATE recipes SET title = '라자냐' WHERE id = 23513;
UPDATE recipes SET title = '필차드 푸타네스카' WHERE id = 23514;
UPDATE recipes SET title = '스파게티 알라 카르보나라' WHERE id = 23515;
UPDATE recipes SET title = '시리아식 스파게티' WHERE id = 23516;
UPDATE recipes SET title = '베네치아식 오리 라구' WHERE id = 23517;

-- Pork (23518-23563)
UPDATE recipes SET title = '버블 앤 스퀵' WHERE id = 23518;
UPDATE recipes SET title = '아로스 알 오르노 (구운 밥)' WHERE id = 23519;
UPDATE recipes SET title = '바비큐 돼지고기 번' WHERE id = 23520;
UPDATE recipes SET title = 'BBQ 돼지고기 슬로피 조' WHERE id = 23521;
UPDATE recipes SET title = '비고스 (사냥꾼 스튜)' WHERE id = 23522;
UPDATE recipes SET title = '복스티 아침식사' WHERE id = 23523;
UPDATE recipes SET title = '브린조베 할루슈키' WHERE id = 23524;
UPDATE recipes SET title = '카사바 피자' WHERE id = 23525;
UPDATE recipes SET title = '병아리콩, 초리소, 시금치 스튜' WHERE id = 23526;
UPDATE recipes SET title = '초리빤' WHERE id = 23527;
UPDATE recipes SET title = '초리소 병아리콩 수프' WHERE id = 23528;
UPDATE recipes SET title = '초리소 반숙란 샐러드' WHERE id = 23529;
UPDATE recipes SET title = '초리소 토마토 샐러드' WHERE id = 23530;
UPDATE recipes SET title = '초리소, 감자, 치즈 오믈렛' WHERE id = 23531;
UPDATE recipes SET title = '사이다와 졸인 돼지고기' WHERE id = 23532;
UPDATE recipes SET title = '바삭한 소시지와 채소' WHERE id = 23533;
UPDATE recipes SET title = '파시르키' WHERE id = 23534;
UPDATE recipes SET title = '햄 크로켓' WHERE id = 23535;
UPDATE recipes SET title = '햄 혹 콜캐논' WHERE id = 23536;
UPDATE recipes SET title = '산라탕' WHERE id = 23537;
UPDATE recipes SET title = '하몬 야생 마늘 크로켓' WHERE id = 23538;
UPDATE recipes SET title = '일본식 가쓰동' WHERE id = 23539;
UPDATE recipes SET title = '돼지고기 사우어크라우트 굴라시' WHERE id = 23540;
UPDATE recipes SET title = '돼지고기 카술레' WHERE id = 23541;
UPDATE recipes SET title = '돼지갈비 보르시' WHERE id = 23542;
UPDATE recipes SET title = '포르투갈식 바비큐 돼지고기' WHERE id = 23543;
UPDATE recipes SET title = '라스페발레르 (노르웨이식 감자 만두)' WHERE id = 23544;
UPDATE recipes SET title = '라이스페이퍼 만두' WHERE id = 23545;
UPDATE recipes SET title = '로즈메리 적양배추 찜과 카바노스' WHERE id = 23546;
UPDATE recipes SET title = '스킬렛 사과 돼지고기 찹과 구운 고구마, 주키니' WHERE id = 23547;
UPDATE recipes SET title = '레몬, 마늘, 세이지 슬로우 로스트 햄' WHERE id = 23548;
UPDATE recipes SET title = '스페인식 스파게티' WHERE id = 23549;
UPDATE recipes SET title = '스페인식 토마토 빵과 하몬 세라노' WHERE id = 23550;
UPDATE recipes SET title = '스탐폿' WHERE id = 23551;
UPDATE recipes SET title = '탕수육' WHERE id = 23552;
UPDATE recipes SET title = '태국식 돼지고기 땅콩 커리' WHERE id = 23553;
UPDATE recipes SET title = '토드 인 더 홀' WHERE id = 23554;
UPDATE recipes SET title = '돈카츠' WHERE id = 23555;
UPDATE recipes SET title = '토르타 데 피암브레' WHERE id = 23556;
UPDATE recipes SET title = '투르티에르' WHERE id = 23557;
UPDATE recipes SET title = '베트남식 숯불 돼지고기 (분팃느엉)' WHERE id = 23558;
UPDATE recipes SET title = '베트남식 돼지고기 샐러드' WHERE id = 23559;
UPDATE recipes SET title = '베트남식 카라멜 돼지고기' WHERE id = 23560;
UPDATE recipes SET title = '따뜻한 구운 아스파라거스 샐러드' WHERE id = 23561;
UPDATE recipes SET title = '완탕' WHERE id = 23562;
UPDATE recipes SET title = '자피에칸키' WHERE id = 23563;

-- Seafood (23564-23633)
UPDATE recipes SET title = '새우 오징어 밥' WHERE id = 23564;
UPDATE recipes SET title = '구운 연어와 펜넬, 토마토' WHERE id = 23565;
UPDATE recipes SET title = '뱅뱅 새우 샐러드' WHERE id = 23566;
UPDATE recipes SET title = '바라문디와 모로코 향신료' WHERE id = 23567;
UPDATE recipes SET title = '케이준 양념 생선 타코' WHERE id = 23568;
UPDATE recipes SET title = '조개, 초리소, 흰콩 스튜' WHERE id = 23569;
UPDATE recipes SET title = '에그 푸영' WHERE id = 23570;
UPDATE recipes SET title = '에스코비치 피시' WHERE id = 23571;
UPDATE recipes SET title = '생선 포포스' WHERE id = 23572;
UPDATE recipes SET title = '생선 파이' WHERE id = 23573;
UPDATE recipes SET title = '생선 수프 (우하)' WHERE id = 23574;
UPDATE recipes SET title = '생선 스튜와 루이유' WHERE id = 23575;
UPDATE recipes SET title = '크리미 노르웨이식 생선 수프' WHERE id = 23576;
UPDATE recipes SET title = '오징어 튀김' WHERE id = 23577;
UPDATE recipes SET title = '감바스 알 아히요' WHERE id = 23578;
UPDATE recipes SET title = '가리데스 사가나키' WHERE id = 23579;
UPDATE recipes SET title = '마늘 새우와 셰리' WHERE id = 23580;
UPDATE recipes SET title = '구운 포르투갈식 정어리' WHERE id = 23581;
UPDATE recipes SET title = '허니 데리야키 연어' WHERE id = 23582;
UPDATE recipes SET title = '자메이카식 커리 새우' WHERE id = 23583;
UPDATE recipes SET title = '자메이카식 페퍼 새우' WHERE id = 23584;
UPDATE recipes SET title = '케저리' WHERE id = 23585;
UPDATE recipes SET title = '궁보 새우' WHERE id = 23586;
UPDATE recipes SET title = '락사 킹프론 국수' WHERE id = 23587;
UPDATE recipes SET title = '지중해식 파스타 샐러드' WHERE id = 23588;
UPDATE recipes SET title = '미 고렝 마막' WHERE id = 23589;
UPDATE recipes SET title = '배추와 건새우' WHERE id = 23590;
UPDATE recipes SET title = '나시 르막' WHERE id = 23591;
UPDATE recipes SET title = '면 볼 샐러드' WHERE id = 23592;
UPDATE recipes SET title = '팟타이' WHERE id = 23593;
UPDATE recipes SET title = '빠에야' WHERE id = 23594;
UPDATE recipes SET title = '팬프라이 헤이크와 흰콩, 초리소 브로스' WHERE id = 23595;
UPDATE recipes SET title = '포르투갈식 생선 스튜' WHERE id = 23596;
UPDATE recipes SET title = '새우 면 샐러드와 바삭한 샬롯' WHERE id = 23597;
UPDATE recipes SET title = '새우 볶음' WHERE id = 23598;
UPDATE recipes SET title = '새우와 로메스코 소스' WHERE id = 23599;
UPDATE recipes SET title = '간편 소금후추 오징어' WHERE id = 23600;
UPDATE recipes SET title = '레차도 마살라 생선' WHERE id = 23601;
UPDATE recipes SET title = '연어 아보카도 샐러드' WHERE id = 23602;
UPDATE recipes SET title = '연어 면 수프' WHERE id = 23603;
UPDATE recipes SET title = '연어 면 랩' WHERE id = 23604;
UPDATE recipes SET title = '연어 새우 리소토' WHERE id = 23605;
UPDATE recipes SET title = '소금후추 오징어' WHERE id = 23606;
UPDATE recipes SET title = '소금 대구 토르티야' WHERE id = 23607;
UPDATE recipes SET title = '소금 생선과 아키' WHERE id = 23608;
UPDATE recipes SET title = '생강, 고추, 파를 곁들인 농어' WHERE id = 23609;
UPDATE recipes SET title = '해산물 피데우아' WHERE id = 23610;
UPDATE recipes SET title = '해산물 밥' WHERE id = 23611;
UPDATE recipes SET title = '새우 차우펀' WHERE id = 23612;
UPDATE recipes SET title = '새우와 완두콩' WHERE id = 23613;
UPDATE recipes SET title = '싱가포르 새우 면' WHERE id = 23614;
UPDATE recipes SET title = '폴란드식 청어 (실레즈)' WHERE id = 23615;
UPDATE recipes SET title = '스페인식 새우 밥 원팟' WHERE id = 23616;
UPDATE recipes SET title = '스페인식 해산물 밥' WHERE id = 23617;
UPDATE recipes SET title = '매운 태국식 새우 국수' WHERE id = 23618;
UPDATE recipes SET title = '파 새우 엠파나다' WHERE id = 23619;
UPDATE recipes SET title = '오징어, 병아리콩, 초리소 샐러드' WHERE id = 23620;
UPDATE recipes SET title = '초밥' WHERE id = 23621;
UPDATE recipes SET title = '태국식 커리 국수 수프' WHERE id = 23622;
UPDATE recipes SET title = '태국식 새우 완두콩 볶음밥' WHERE id = 23623;
UPDATE recipes SET title = '태국식 새우 커리' WHERE id = 23624;
UPDATE recipes SET title = '태국식 생선 브로스와 채소' WHERE id = 23625;
UPDATE recipes SET title = '태국식 찐 생선' WHERE id = 23626;
UPDATE recipes SET title = '세 가지 생선 파이' WHERE id = 23627;
UPDATE recipes SET title = '새우 똠양꿍' WHERE id = 23628;
UPDATE recipes SET title = '새우 똠양꿍' WHERE id = 23629;
UPDATE recipes SET title = '참치 달걀 브릭' WHERE id = 23630;
UPDATE recipes SET title = '참치 니수아즈' WHERE id = 23631;
UPDATE recipes SET title = '베트남식 카라멜 송어' WHERE id = 23632;
UPDATE recipes SET title = '베트남식 새우 스파이럴 롤' WHERE id = 23633;

-- Side (23634-23675)
UPDATE recipes SET title = '에어프라이어 에그롤' WHERE id = 23634;
UPDATE recipes SET title = '알제리식 부즈겐 베르베르 빵과 구운 고추 소스' WHERE id = 23635;
UPDATE recipes SET title = '알제리식 당근' WHERE id = 23636;
UPDATE recipes SET title = '바바 가누시' WHERE id = 23637;
UPDATE recipes SET title = '블리니 팬케이크' WHERE id = 23638;
UPDATE recipes SET title = '불랑제르 감자' WHERE id = 23639;
UPDATE recipes SET title = '프로슈토 브리오슈에 싼 브리 치즈' WHERE id = 23640;
UPDATE recipes SET title = '부렉' WHERE id = 23641;
UPDATE recipes SET title = '자즉' WHERE id = 23642;
UPDATE recipes SET title = '칼랄루와 소금 생선' WHERE id = 23643;
UPDATE recipes SET title = '할라빵' WHERE id = 23644;
UPDATE recipes SET title = '치즈 부렉' WHERE id = 23645;
UPDATE recipes SET title = '초르바' WHERE id = 23646;
UPDATE recipes SET title = '파이나' WHERE id = 23647;
UPDATE recipes SET title = '펜넬 도피누아즈' WHERE id = 23648;
UPDATE recipes SET title = '페테르 메샬테트' WHERE id = 23649;
UPDATE recipes SET title = '프렌치 어니언 수프' WHERE id = 23650;
UPDATE recipes SET title = '신선한 정어리' WHERE id = 23651;
UPDATE recipes SET title = '그리들 플랫브레드' WHERE id = 23652;
UPDATE recipes SET title = '후무스' WHERE id = 23653;
UPDATE recipes SET title = '자메이카식 삶은 만두' WHERE id = 23654;
UPDATE recipes SET title = '자메이카 페스티벌 (달콤한 만두)' WHERE id = 23655;
UPDATE recipes SET title = '자메이카식 튀긴 만두' WHERE id = 23656;
UPDATE recipes SET title = '자메이카식 찐 양배추' WHERE id = 23657;
UPDATE recipes SET title = '일본식 고항 밥' WHERE id = 23658;
UPDATE recipes SET title = '알제리식 세몰리나 빵' WHERE id = 23659;
UPDATE recipes SET title = '쿰피르' WHERE id = 23660;
UPDATE recipes SET title = '버섯 메밀 수프' WHERE id = 23661;
UPDATE recipes SET title = '머스타드 챔프' WHERE id = 23662;
UPDATE recipes SET title = '노르웨이식 감자 레프세' WHERE id = 23663;
UPDATE recipes SET title = '피에로기 (폴란드식 만두)' WHERE id = 23664;
UPDATE recipes SET title = '폴란드식 패티 (코틀레티)' WHERE id = 23665;
UPDATE recipes SET title = '새우 펜넬 비스크' WHERE id = 23666;
UPDATE recipes SET title = '호밀빵' WHERE id = 23667;
UPDATE recipes SET title = '참깨 오이 샐러드' WHERE id = 23668;
UPDATE recipes SET title = '샤와르마 빵' WHERE id = 23669;
UPDATE recipes SET title = '훈제 가지 퓌레' WHERE id = 23670;
UPDATE recipes SET title = '스네르트 (네덜란드식 완두콩 수프)' WHERE id = 23671;
UPDATE recipes SET title = '완두콩 수프' WHERE id = 23672;
UPDATE recipes SET title = '베네수엘라식 아레파' WHERE id = 23673;
UPDATE recipes SET title = '베네수엘라식 턴오버' WHERE id = 23674;
UPDATE recipes SET title = '제미아코베 플라츠키' WHERE id = 23675;

-- Starter (23676-23681)
UPDATE recipes SET title = '아호 블랑코' WHERE id = 23676;
UPDATE recipes SET title = '브로콜리 스틸턴 수프' WHERE id = 23677;
UPDATE recipes SET title = '클램 차우더' WHERE id = 23678;
UPDATE recipes SET title = '크림치즈 타르트' WHERE id = 23679;
UPDATE recipes SET title = '크리미 토마토 수프' WHERE id = 23680;
UPDATE recipes SET title = '간편 가스파초' WHERE id = 23681;

-- Vegan (23682-23688)
UPDATE recipes SET title = '시리아식 올리브유 강낭콩' WHERE id = 23682;
UPDATE recipes SET title = '파드론 고추' WHERE id = 23683;
UPDATE recipes SET title = '붉은 양파 피클' WHERE id = 23684;
UPDATE recipes SET title = '구운 펜넬 가지 빠에야' WHERE id = 23685;
UPDATE recipes SET title = '비건 반미' WHERE id = 23686;
UPDATE recipes SET title = '비건 초콜릿 케이크' WHERE id = 23687;
UPDATE recipes SET title = '비건 라자냐' WHERE id = 23688;

-- Vegetarian (23689-23770)
UPDATE recipes SET title = '에어프라이어 파타타스 브라바스' WHERE id = 23689;
UPDATE recipes SET title = '알제리식 피망 샐러드' WHERE id = 23690;
UPDATE recipes SET title = '가지 후무스 그릴' WHERE id = 23691;
UPDATE recipes SET title = '가지 쿠스쿠스 샐러드' WHERE id = 23692;
UPDATE recipes SET title = '아보카도 딥과 햇감자' WHERE id = 23693;
UPDATE recipes SET title = '바인간 바르타' WHERE id = 23694;
UPDATE recipes SET title = '비트 적양배추 사우어크라우트' WHERE id = 23695;
UPDATE recipes SET title = '비트 라트케' WHERE id = 23696;
UPDATE recipes SET title = '비트 수프 (보르시)' WHERE id = 23697;
UPDATE recipes SET title = '양배추 롤 찜' WHERE id = 23698;
UPDATE recipes SET title = '양배추 수프 (시)' WHERE id = 23699;
UPDATE recipes SET title = '병아리콩 파히타' WHERE id = 23700;
UPDATE recipes SET title = '중국식 토마토 달걀 볶음' WHERE id = 23701;
UPDATE recipes SET title = '알제리식 감자 스튜' WHERE id = 23702;
UPDATE recipes SET title = '바삭한 가지' WHERE id = 23703;
UPDATE recipes SET title = '오이 펜넬 샐러드' WHERE id = 23704;
UPDATE recipes SET title = '달 프라이' WHERE id = 23705;
UPDATE recipes SET title = '달걀국' WHERE id = 23706;
UPDATE recipes SET title = '가지 아도보' WHERE id = 23707;
UPDATE recipes SET title = '에즈메' WHERE id = 23708;
UPDATE recipes SET title = '팔라펠' WHERE id = 23709;
UPDATE recipes SET title = '팔라펠 피타 샌드위치와 타히니 소스' WHERE id = 23710;
UPDATE recipes SET title = '플라미쉬' WHERE id = 23711;
UPDATE recipes SET title = '풀 메다메스' WHERE id = 23712;
UPDATE recipes SET title = '기간테스 플라키' WHERE id = 23713;
UPDATE recipes SET title = '참깨 드레싱 그릴 가지' WHERE id = 23714;
UPDATE recipes SET title = '매운 병아리콩과 호두 소스 구운 가지' WHERE id = 23715;
UPDATE recipes SET title = '코코넛 밀크 구운 가지' WHERE id = 23716;
UPDATE recipes SET title = '호지 포지' WHERE id = 23717;
UPDATE recipes SET title = '자메이카식 인스턴트팟 밥과 콩' WHERE id = 23718;
UPDATE recipes SET title = '자메이카식 밥과 완두콩' WHERE id = 23719;
UPDATE recipes SET title = '카프테지' WHERE id = 23720;
UPDATE recipes SET title = '강낭콩 커리' WHERE id = 23721;
UPDATE recipes SET title = '코샤리' WHERE id = 23722;
UPDATE recipes SET title = '레블레비 수프' WHERE id = 23723;
UPDATE recipes SET title = '마타르 파니르' WHERE id = 23724;
UPDATE recipes SET title = '당밀 베이크드 빈즈' WHERE id = 23725;
UPDATE recipes SET title = '모로코식 당근 수프' WHERE id = 23726;
UPDATE recipes SET title = '버섯 밤 로톨로' WHERE id = 23727;
UPDATE recipes SET title = '북유럽식 스뫼레브뢰와 아스파라거스, 고추냉이 크림' WHERE id = 23728;
UPDATE recipes SET title = '파타타스 브라바스' WHERE id = 23729;
UPDATE recipes SET title = '피스토 콘 우에보스' WHERE id = 23730;
UPDATE recipes SET title = '석류 샐러드' WHERE id = 23731;
UPDATE recipes SET title = '감자 샐러드 (올리비에 샐러드)' WHERE id = 23732;
UPDATE recipes SET title = '프로방스식 오믈렛 케이크' WHERE id = 23733;
UPDATE recipes SET title = '라타투이' WHERE id = 23734;
UPDATE recipes SET title = '리볼리타' WHERE id = 23735;
UPDATE recipes SET title = '구운 가지와 염소 치즈, 구운 플랫브레드' WHERE id = 23736;
UPDATE recipes SET title = '구운 가지와 타히니, 잣, 렌틸콩' WHERE id = 23737;
UPDATE recipes SET title = '사우어크라우트 피에로기' WHERE id = 23738;
UPDATE recipes SET title = '사우어크라우트 피에로기' WHERE id = 23739;
UPDATE recipes SET title = '샥슈카' WHERE id = 23740;
UPDATE recipes SET title = '사천식 가지' WHERE id = 23741;
UPDATE recipes SET title = '사천식 강낭콩 볶음' WHERE id = 23742;
UPDATE recipes SET title = '연두부와 참깨 간장 소스' WHERE id = 23743;
UPDATE recipes SET title = '스모키 렌틸콩 칠리와 호박' WHERE id = 23744;
UPDATE recipes SET title = '스페인식 토르티야' WHERE id = 23745;
UPDATE recipes SET title = '양념 토르티야' WHERE id = 23746;
UPDATE recipes SET title = '매운 아라비아타 펜네' WHERE id = 23747;
UPDATE recipes SET title = '매운 북아프리카식 감자 샐러드' WHERE id = 23748;
UPDATE recipes SET title = '시금치 리코타 카넬로니' WHERE id = 23749;
UPDATE recipes SET title = '호박 링귀네' WHERE id = 23750;
UPDATE recipes SET title = '하리사 가지와 병아리콩, 쿠민 요거트' WHERE id = 23751;
UPDATE recipes SET title = '퀴노아 검은콩 속 채운 피망' WHERE id = 23752;
UPDATE recipes SET title = '수쿠마 위키' WHERE id = 23753;
UPDATE recipes SET title = '여름 피스투' WHERE id = 23754;
UPDATE recipes SET title = '고구마 샐러드' WHERE id = 23755;
UPDATE recipes SET title = '타히니 렌틸콩' WHERE id = 23756;
UPDATE recipes SET title = '타미야' WHERE id = 23757;
UPDATE recipes SET title = '새콤한 양배추 슬로' WHERE id = 23758;
UPDATE recipes SET title = '새콤한 당근, 양배추, 양파 샐러드' WHERE id = 23759;
UPDATE recipes SET title = '태국식 코코넛 채소 브로스' WHERE id = 23760;
UPDATE recipes SET title = '태국식 호박 수프' WHERE id = 23761;
UPDATE recipes SET title = '태국식 쌀국수 샐러드' WHERE id = 23762;
UPDATE recipes SET title = '두부, 채소, 캐슈넛 볶음' WHERE id = 23763;
UPDATE recipes SET title = '토르탕 탈롱' WHERE id = 23764;
UPDATE recipes SET title = '채식 캐서롤' WHERE id = 23765;
UPDATE recipes SET title = '채식 칠리' WHERE id = 23766;
UPDATE recipes SET title = '채식 샥슈카' WHERE id = 23767;
UPDATE recipes SET title = '베트남식 채소 쌈' WHERE id = 23768;
UPDATE recipes SET title = '베트남식 채소 핫팟' WHERE id = 23769;
UPDATE recipes SET title = '야키 우동' WHERE id = 23770;

-- Breakfast (23771-23785)
UPDATE recipes SET title = '빵 오믈렛' WHERE id = 23771;
UPDATE recipes SET title = '아침 감자' WHERE id = 23772;
UPDATE recipes SET title = '네덜란드식 포퍼치스 (미니 팬케이크)' WHERE id = 23773;
UPDATE recipes SET title = '잉글리시 브렉퍼스트' WHERE id = 23774;
UPDATE recipes SET title = '과일 크림치즈 아침 페이스트리' WHERE id = 23775;
UPDATE recipes SET title = '풀 잉글리시 브렉퍼스트' WHERE id = 23776;
UPDATE recipes SET title = '수제 만다지' WHERE id = 23777;
UPDATE recipes SET title = '자메이카식 옥수수 죽' WHERE id = 23778;
UPDATE recipes SET title = '오트밀 팬케이크' WHERE id = 23779;
UPDATE recipes SET title = '노르웨이식 사워크림 죽' WHERE id = 23780;
UPDATE recipes SET title = '연어알 에그 베네딕트' WHERE id = 23781;
UPDATE recipes SET title = '훈제 해덕 케저리' WHERE id = 23782;
UPDATE recipes SET title = '토리하스와 셰리' WHERE id = 23783;
UPDATE recipes SET title = '케냐식 옥수수가루 (우갈리)' WHERE id = 23784;
UPDATE recipes SET title = '예멘식 라흐사 (엘리트 샥슈카)' WHERE id = 23785;

-- Goat (23786-23787)
UPDATE recipes SET title = '자메이카식 커리 염소고기' WHERE id = 23786;
UPDATE recipes SET title = '구운 염소고기 (음부지 초마)' WHERE id = 23787;

COMMIT;
