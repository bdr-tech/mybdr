# 작업 스크래치패드

## 현재 작업
- **요청**: `/games` 페이지 상단에 경기 유형 탭 (전체/픽업/게스트/연습경기) — PR #45에 추가 커밋
- **상태**: 🏗️ developer 구현 중
- **현재 담당**: developer
- **결정사항**:
  - 건수 뱃지 없이 시작 (1차)
  - 플로팅 패널 "유형" 필터 제거 (탭과 중복 방지)
  - PRACTICE 탭 포함 (Phase 2b로 데이터 늘어날 예정)
- **근거**: 현재 60건이 모두 GUEST로 보임 → 유형 구분 UI 노출 필요. API/상수/카드 분기 이미 완비, UI만 추가.

## 구현 기록 (developer)

### Phase 2b Step 4 — extract-fallbacks + upsert fallback 체인 (2026-04-19)

📝 구현: parseCafeGame 미추출 필드(scheduledAt/fee/guestCount/skillLevel/city/district)를 관대한 정규식으로 보완하는 **2단계 fallback** 레이어. parser는 절대 안 건드림.

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/lib/cafe-sync/extract-fallbacks.ts` | **신규** — `extractFallbacks(content, baseDate): ExtractedFallbacks` 순수 함수. scheduledAt(한글/콜론 두 포맷 + 저녁/오후 +12시 보정 + 연말 연도 넘김) / fee(게스트비용\|입장료\|참가비\|이용료 다 허용) / guestCount(**0은 null**) / skillLevel(초급=beginner, 중급·**중하**=intermediate, 중상=intermediate_advanced, 상급=advanced, 전체=all — **4단계 `SKILL_OPTIONS` 호환**) / city(17개 광역) / district(\[가-힣]{1,5}(시\|구) + 블랙리스트 "일시/동시/최소..." + 광역+"시" skip) | 신규 |
| `src/lib/cafe-sync/upsert.ts` | `insertGameFromCafe` 가 `parsed.X ?? extracted.X ?? 상수` 체인으로 6개 필드 계산. `skill_level` 컬럼 신규 반영(이전엔 schema default "all"에 맡겼음). `previewUpsert`도 동일 체인 + 각 필드 *Source 메타(parsed/extracted/fallback) 추가 반환 | 수정 |
| `scripts/sync-cafe.ts` | dry-run 로그 라인 2줄로 확장: 기존 `game_id/game_type/scheduled_at` 에 `(parsed\|extracted\|fallback)` 괄호 표기 + 신규 `fields:` 라인에 fee/max/skill/city/district 값·소스 동시 노출 | 수정 |

🔧 tsc: **PASS (exit 0, 에러 0)**
🔧 dry-run 스모크: **PASS** `npx tsx --env-file=.env --env-file=.env.local scripts/sync-cafe.ts --board=IVHA --limit=30 --with-body --article-limit=10`

**id=3916 (스펙 지정 케이스, 본문: "4월16일 목 저녁10시15분~12시45분 / 경기 시흥시 뒷방울길 / 4.게스트 모집 인원 : 00명 / 5.게스트비용 : 10,000원 / 실력: 중하")**:

| 필드 | 값 | 소스 | 스펙 예상 | ✓ |
|------|-----|------|-----------|---|
| scheduled_at | 2026-04-16T22:15 KST | extracted | 2026-04-16 22:15 | ✅ |
| fee | 10000 | extracted | 10000 | ✅ |
| guestCount(max) | 10 | fallback | null → 10 | ✅ |
| skill | intermediate | extracted | intermediate("중하") | ✅ |
| city | 경기 | extracted | 경기 | ✅ |
| district | 시흥시 | extracted | 시흥시 | ✅ |

💡 **설계 핵심**:
- **parser 분리 원칙**: `cafe-game-parser.ts` 는 "1. 라벨:" 공식 포맷만 신뢰하도록 그대로 두고, 라벨 없는 본문(예: "저녁 9 : 00") 은 extract-fallbacks 가 담당 → 기존 백필 스크립트/parser 테스트에 영향 0
- **4단계 skillLevel**: "중하" 를 DB에 넣어도 필터(`SKILL_OPTIONS` 4단계)가 못 걸러냄 → 일부러 intermediate 로 묶음 (decisions.md 후보)
- **scheduledAt 두 포맷 한 번에**: `{시}시{분}분` OR `{시} : {분}` 를 alternation(`|`) 으로 묶어 한 exec — 실측에서 3925번 "저녁 9 : 00" / 3916번 "저녁10시15분" 동시 커버
- **시간대 +12 보정**: "저녁/오후/밤" + 시각<13 → +12. "오전/낮" 또는 접두사 없음은 원본 유지(24h 표기 가정)
- **연말 연도 넘김**: 추출 월이 `baseDate.getMonth()+1` 보다 3개월+ 이르면 +1년 (예: 12월 크롤 + 본문 "3월" → 내년 3월)
- **guestCount=0 = null**: 실측 "4.게스트 모집 인원 : 00명" 패턴이 다수 → 0은 유효값으로 받지 않음. DB에서 "0명 모집" 이상한 UX 방지
- **district 블랙리스트**: "일시/동시/최소/상구..." 등 지명 아닌 시/구 끝 단어. 실제로 첫 try에서 3924번 글이 "일시:" 를 district 로 잡는 버그 있었고 블랙리스트로 수정 완료

💡 tester 참고:
- **재실행**: `npx tsx --env-file=.env --env-file=.env.local scripts/sync-cafe.ts --board=IVHA --limit=30 --with-body --article-limit=10`
- **핵심 확인**: 각 dry-run 라인 밑 `fields:` 한 줄에 6개 필드가 (parsed|extracted|fallback) 소스와 함께 노출되는지
- **IVHA 10건 기준 추출률**: scheduled_at 9/10 개선(parser 만으론 1/2 → 약 70%+로 상승), fee 10/10, city 9/10, district 9/10, skill 본문에 "실력" 있는 글만 (대부분 fallback="all")
- **주의할 입력**:
  - "00명" 같은 "0" 값 → null 반환 확인 (upsert 결과 max=10 fallback 이어야 정상)
  - 광역 시 자체(예: "서울시" 단독 글) → district 로 중복 채택되지 않아야 함 (city 에만 들어가야)
  - "오늘 4/16" 처럼 "월/일" 슬래시 포맷은 **현재 미지원** — 이건 parser 도 못 잡음. 다음 Step 에서 논의

⚠️ reviewer 참고:
- `extractFallbacks` 는 DB 의존성 0 / 사이드이펙트 0 / 외부 import 0 — 순수 함수 원칙. 단위 테스트 추가 용이
- `SKILL_MAP` 에 "중하 → intermediate" 묶은 결정이 논쟁적일 수 있음 (원본 정보 손실). 대안은 DB 키를 7단계로 늘리는 건데 UI/필터 전부 손대야 해서 기각. PR에 명시해 리뷰어 의견 받기
- `previewUpsert` 반환 타입이 확장(*Source 6개 필드 추가) — 기존 호출부(sync-cafe.ts)만 쓰므로 깨지지 않지만 외부에서 import 중이면 확인
- upsert.ts 의 `data.skill_level` 은 **신규로 채움** — 기존엔 Prisma schema default "all" 에 맡겼지만 이제 명시적으로 extracted 값 주입. 기존 112건은 영향 없음(이번 배치는 새 INSERT 만)

### Phase 2b Step 1 — upsert.ts + sync-cafe 통합 (2026-04-19)

📝 구현: 다음카페 Phase 2b 기반 레이어. `--execute` 차단 해제 + 운영 DB 2중 가드 + cafe_posts/games 원자 upsert + 20건+ 카운트다운. **코드 준비만** — 실제 --execute 실행은 PM이 별도 트리거.

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/lib/cafe-sync/upsert.ts` | **신규** — `upsertCafeSyncedGame(prisma, input)` 단일 진입점. `assertDevDatabase()` (식별자 `bwoorsgoijvlgutkrcvs` 미포함 시 throw) + `prisma.$transaction` 으로 `upsertCafePost` + `findExistingGameByCafeMetadata` + `insertGameFromCafe` 원자 처리. `previewUpsert()` dry-run용 헬퍼도 export | 신규 |
| `scripts/sync-cafe.ts` | `--execute` exit(1) 제거 → EXECUTE_MODE 분기. 2중 운영 DB 가드(진입 시). 20건+ 4초 카운트다운. 본문 fetch 뒤 `previewUpsert`(dry) 또는 `upsertCafeSyncedGame`(execute) 호출. 최종 요약에 upsert 집계(cafe_posts/games 각 inserted/dup/no-parse/failed) 추가. PrismaClient는 `--execute + --with-body` 일 때만 동적 import로 생성→disconnect | 수정 |
| `tmp/inspect-cafe-games.ts` | 삭제 (organizer_id/status/metadata 조사용 1회성) | 삭제 |

🔧 tsc: **PASS (exit 0)** — BigInt 리터럴(`1n` → `BigInt(1)`), Prisma composite key 접근자(`idx_cafe_posts_unique` → `cafe_code_board_id_dataid`) 2건 수정

🔧 dry-run 스모크: **PASS** `npx tsx --env-file=.env.local scripts/sync-cafe.ts --board=IVHA --limit=3 --with-body --article-limit=2`
- IVHA 3건 목록 + 본문 2건 파싱 + "upsert 예정" 미리보기 2건 정상 출력
- 예: `🔍 upsert 예정: game_id=PU-CAFE-3926 / game_type=1 / scheduled_at=2026-04-22T14:01:26.682Z / game insert=YES`
- DB 쓰기 0 재확인 — 최종 메시지 `💡 DB 쓰기 0 (--execute 미지정 → dry-run).`

💡 **설계 핵심**:
- **운영 DB 2중 가드**: sync-cafe.ts 진입 시(EXECUTE_MODE) + upsert.ts `assertDevDatabase()`(매 레코드). `DATABASE_URL`에 `bwoorsgoijvlgutkrcvs` 미포함이면 즉시 abort
- **game_id 포맷**: `{prefix}-CAFE-{dataid}` (PU/GU/PR) — 고정 규칙, 중복 시 unique constraint가 2차 방어
- **중복 체크**: `metadata->>'cafe_dataid' + metadata->>'cafe_board'` 로 games 조회 ($queryRaw, Prisma JSON path 직접 지원 없음). 기존 112건은 이 키 없음 → 항상 "새 INSERT" 판정. 112건 역방향 백필은 Phase 2b 후반 별도 승인
- **parsed 없을 때**: cafe_post만 저장, game 스킵 (`skipped_no_parse`) — 본문 파싱 실패해도 추적 단서는 남김
- **scheduled_at fallback**: `parsed.scheduledAt ?? crawledAt + 3일` (NOT NULL 회피 + 과거 필터 미노출)
- **description**: 본문을 2000자로 슬라이스 (긴 본문 차단)
- **gameType 우선순위**: `parsed.gameType` 우선, null이면 board fallback. 스모크에서 IVHA 게시판이지만 parsed=1(GUEST) 채택된 것이 설계 의도 일치 (본문 키워드 신뢰)
- **에러 처리**: upsert 실패는 throw 하지 않고 `CafeSyncResult.failed` 반환 → 30~60건 배치에서 1건 실패로 중단 안 됨. 단 운영 DB 가드 실패는 throw (전체 중단이 올바름)

💡 tester 참고:
- **dry-run 재확인**: `npx tsx --env-file=.env.local scripts/sync-cafe.ts --board=IVHA --limit=3 --with-body --article-limit=2` → "upsert 예정" 미리보기 + "DB 쓰기 0" 메시지
- **정상 동작**:
  - 미리보기 라인이 본문 출력 직후마다 나옴
  - game_id 포맷이 `{PU|GU|PR}-CAFE-{dataid}`
  - scheduled_at이 2026-04-22 같은 crawledAt+3일 (파싱 실패 시)
  - "💡 DB 쓰기 0 (--execute 미지정 → dry-run)." 문구 확인
- **주의**: 지금은 **--execute 실행 금지**. PM 승인 후 별도 트리거 예정

⚠️ reviewer 참고:
- `insertGameFromCafe`의 `metadata` 7키는 D1-B 스펙 (`cafe_comments: []` 빈 배열 포함 — Phase 2b에선 댓글 수집 없음, 스키마만 확보)
- `upsertCafePost`의 `cafe_code` 상수 `"dongarry"` 는 board-map.CAFE_CODE와 동기화 (DRY 깨지만 트랜잭션 콜백 안 import 체인 단축 의도, 주석에 명시)
- `description: content.slice(0, 2000)` — 평균 1108자 수준이므로 거의 안 잘리지만 방어적
- `CafeSyncResult.cafePost` 가 created/updated 구분 못 함 (Prisma upsert API 한계). 둘 다 "created"로 집계해서 "created(+updated)" 라벨로 표기
- 20건 카운트다운: `targets.length * min(articleLimit, limit)`으로 estimated. 실제로는 목록 실패/본문 실패로 더 적어질 수 있음

### B2 — 유형 탭 건수 뱃지 (2026-04-19)

📝 구현: `/games` 상단 유형 탭에 `type 제외 현재 필터 상태` 기준 유형별 건수 뱃지 표시 (예: `게스트 42`)

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/app/api/web/games/route.ts` | `Prisma` 타입 import + `countWhere` 인라인 구성(type 제외 / q/city/prefer지역/skill/scheduledAt 반영) + `prisma.games.groupBy` 1회 추가 호출 + `typeCounts: { "0", "1", "2", all }` 응답 포함 (기존 games/cities 필드 불변) | 수정 |
| `src/app/(web)/games/_components/games-content.tsx` | `TypeCounts` 인터페이스 + `GamesApiResponse.type_counts` 옵셔널 필드 + `typeCounts` 상태 + `setTypeCounts(data.type_counts)` + `<GameTypeTabs counts={loading ? undefined : typeCounts} />` | 수정 |
| `src/app/(web)/games/_components/game-type-tabs.tsx` | `GameTypeTabsCounts` 인터페이스 export + `{ counts }` props + 탭 라벨 오른쪽에 숫자 span 렌더(활성: inherit+opacity-80 / 비활성: `var(--color-text-muted)`) + `tabular-nums` | 수정 |

🔧 tsc: **PASS (exit 0, 에러 0)**
🔧 curl 스모크: 서버 미기동 (승인대로 tsc 만 필수)

💡 **설계 선택**: `prisma.games.groupBy({ by: ["game_type"], _count: { _all: true } })` **1회** 채택
- **이유**: count 3번(0/1/2 각각)이면 DB 왕복 3회 + WHERE 복제 3회. groupBy 1회가 왕복/플래너 비용 모두 절감. 또한 향후 유형 확장(예: 3=TEAM_BATTLE) 시 자동 집계되는 확장성.
- **비교 대안**: `listGames` 에 `excludeTypeForCount: true` 플래그 추가해 서비스 레이어에서 통합 — "관련 없는 refactor 금지" 규칙에 따라 기각. route.ts 안에서만 처리.

💡 **typeCounts 동작**:
- `type_counts.all = 0 + 1 + 2 합산` (PM 스펙)
- 응답 키: 서버에서 `typeCounts` camelCase 반환 → `apiSuccess` 가 snake_case 변환 → 프론트 `data.type_counts` 로 수신 (conventions.md "apiSuccess snake_case 변환" 규칙 일관)
- 로딩 중엔 `counts={undefined}` → 탭은 계속 노출, 숫자만 숨김 (레이아웃 흔들림 방지)
- 건수 0도 표시 → 사용자가 "이 탭은 비어 있음" 즉시 인지

💡 tester 참고:
- **테스트 방법**: `/games` 접속 → 상단 4개 탭 라벨 오른쪽에 숫자 노출 확인
  - "전체 N" (N = 픽업+게스트+연습경기 합)
  - "픽업게임 N"
  - "게스트 N"
  - "연습경기 N"
- **정상 동작**:
  - 검색/도시/날짜/실력 필터를 걸어도 탭 뱃지 숫자가 "해당 조건 + 각 유형" 건수로 **실시간 갱신**
  - 예: `?q=농구 + city=서울` → 탭 "픽업게임 3 / 게스트 12 / 연습경기 1 / 전체 16" 같은 형태
  - "게스트" 탭 클릭 시 목록이 12건(±요일·시간대 후처리) 수준
  - 로딩 중(~1초)엔 탭만 보이고 숫자 없음
  - API 응답에 `type_counts` 없으면 숫자 숨김 (에러 회복 시에도 레이아웃 유지)
- **주의할 입력**:
  - `?type=1` 포함한 상태에서도 탭 숫자는 `type 제외` 기준(다른 유형 건수도 표시)으로 나오는지
  - `prefer=true` 상태에서 맞춤 지역/실력/유형이 적용된 건수인지
  - 요일/시간대 후처리 필터가 걸린 경우, 탭 숫자가 목록 건수보다 **살짝 많을 수 있음** (Prisma에서 DOW/HOUR 추출 불가 — 서버 WHERE 기준 count라 후처리 이전 집계). 방향성은 유지되므로 UX 영향 작음. 주석에 명시.

⚠️ reviewer 참고:
- **WHERE 중복 구성**: `listGames` 내부와 `route.ts` 의 `countWhere` 가 거의 동일 로직. 의도적으로 중복 허용(스펙 "3파일만 건드리기"). 향후 `buildGamesWhere(filters, { includeType: boolean })` 같은 추출 리팩토링 권장.
- **요일/시간대 후처리와 count 비일치**: 주석 57~59 라인에 명시. 정확도 필요 시 groupBy → 전체 row 조회 + JS 집계로 전환 가능하지만 현재 60건 상한 + 카드 UI 고려 시 허용 범위.
- **apiSuccess 변환 의존**: 서버 camelCase(typeCounts) → 프론트 snake_case(type_counts) 는 2026-04-17 errors.md "snake_case 5회차 재발" 교훈 반영. 프론트 접근자 `data.type_counts` 로 직통.
- **tabular-nums**: 숫자가 바뀔 때 탭 폭이 들쭉날쭉하지 않게 고정폭 숫자 적용 (한 자리 ↔ 두 자리 전환 시 시각적 안정).

#### 이전 구현 (유형 탭 최초 도입 — 2026-04-19 B1)

📝 구현: `/games` 페이지 상단 경기 유형 탭 (전체/픽업게임/게스트/연습경기)

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/app/(web)/games/_components/game-type-tabs.tsx` | 신규 클라이언트 컴포넌트. URL `?type` 조작, 활성 탭 배경은 `TYPE_BADGE[X].bg` 재사용. "전체"는 type delete. 모바일 가로 스크롤(`overflow-x-auto no-scrollbar` + `flex-shrink-0`/`whitespace-nowrap`) | 신규 |
| `src/app/(web)/games/_components/games-content.tsx` | `GameTypeTabs` import + `{loading ? ... : ...}` 분기 **바깥**에 탭 배치 (로딩 중에도 탭 유지) | 수정 |
| `src/app/(web)/games/games-filter.tsx` | `GAME_TYPES` 상수 제거, `filterConfigs`에서 type 항목 제거, `currentType`/activeCount에서 type 제외 (탭 전담) | 수정 |

🔧 tsc: PASS (에러 0)

💡 tester 참고:
- **테스트 방법**: `/games` 접속 → 상단 탭 4개 클릭하며 URL/목록 변화 확인
- **정상 동작**:
  - "전체" 클릭 시 `?type=` 삭제 → 전체 목록
  - "픽업게임" 클릭 시 `?type=0` 추가 → 픽업만 표시, 탭 배경 파랑(badge-blue)
  - "게스트" 클릭 시 `?type=1` → 초록(badge-green)
  - "연습경기" 클릭 시 `?type=2` → 황갈(badge-amber)
  - 검색어 입력 후 탭 전환 시 `?q=...`가 유지되어야 함
  - 플로팅 필터 패널 열어 "유형" 옵션이 사라졌는지 확인 (탭과 중복 방지)
  - 로딩 중(새로고침 직후 ~1초)에도 탭이 노출되어야 함
- **주의할 입력**: `?type=abc` 같이 유효하지 않은 값 → "전체" 탭 활성으로 fallback
- **모바일**: 좁은 화면에서 가로 스크롤 동작 확인, 탭 줄바꿈 없이 한 줄 유지

⚠️ reviewer 참고:
- 비활성 탭 hover 효과는 inline style로는 구현이 까다로워 일단 생략. 필요 시 globals.css에 `.game-type-tab-inactive:hover` 클래스 추가 고려
- 활성 "전체" 탭 배경은 `TYPE_BADGE`에 매핑이 없어 `var(--color-text-primary)` + `var(--color-card)`로 대비 확보 (다크/라이트 양쪽 자동)


### 🚀 다음 세션 — "오늘 작업 시작하자" 하면 PM이 할 일

**Step 1: 오늘 시작 체크리스트** (CLAUDE.md 루틴)
1. `git remote -v` — github.com/bdr-tech/mybdr 확인
2. `git fetch origin --prune` + main/dev/subin 차이
3. 현재 브랜치가 subin인지 확인 + `git pull origin subin`
4. `.env` 개발 DB + `.env.local` localhost:3001 확인
5. `.auth/cafe-state.json` 존재 + 유효 여부 (쿠키 만료 시 `npx tsx scripts/cafe-login.ts` 재실행)
6. Phase 2a 재검증: `npx tsx --env-file=.env.local scripts/sync-cafe.ts --board=IVHA --limit=3 --with-body --article-limit=2` — 본문 200 OK 확인

**Step 2: Phase 2b 착수 (경고 프로토콜 발동)**

| 작업 | 위험도 | 영향 |
|------|--------|------|
| `cafe_posts` 테이블 INSERT (3게시판 × 10~20건 = 30~60건) | 🔴 20건+ 경고 | 운영 DB 신규 레코드 (현재 0건 → 30~60건) |
| `games` 신규 INSERT (중복 없는 글) | 🔴 20건+ 경고 | 운영 DB 신규 레코드 |
| `games.metadata` 키 추가 (cafe_dataid/cafe_board/source_url) | 🟢 NULL→값만, 파괴적 X | 기존 112건 대상 UPDATE |
| 역방향 백필 (기존 112건 → cafe_posts 연결) | 🔴 UPDATE 112건 | Phase 2b 후반, 별도 승인 |

**Step 3: Phase 2b 구현 단계** (Coworker 계획 P2.3~P2.5 기반)
1. `src/lib/cafe-sync/upsert.ts` 신규 — cafe_posts + games upsert (트랜잭션)
2. `scripts/sync-cafe.ts`의 `--execute` 차단 해제 (현재 exit(1)) + 실제 DB 쓰기
3. IVHA 5건 **dry-run → 표본 승인 → --execute** (점진 확장)
4. 3게시판 통합 (30~60건)
5. 역방향 백필 (112건) — 별도 승인 단계

**Step 4: 저성공 필드 보강 (선택)**
- `parseCafeGame` 수정 금지 (vitest 59/59)
- `upsert.ts`에 fallback 정규식 추가 — 자유 양식 본문에서 scheduledAt/fee/city/district 추출
- 현재 실측: gameType 100% / guestCount 100% / venue 50% / 나머지 0%

### Phase 2a 완료 요약 (2026-04-19)
| 항목 | 결과 |
|------|------|
| storageState 쿠키 로드 | 43개 (HttpOnly `LSID`/`PROF`/`AUID` + 카카오 OAuth 포함) |
| 본문 HTTP | ✅ 200 × 2/2 (이전 403 × 4회 → 완전 해결) |
| parseCafeGame | 2/2 성공 |
| 마스킹 | ✅ `010-****-****` 동작 |
| DB 쓰기 | 0 (Phase 2a는 dry-run 전용) |

## 전체 프로젝트 현황
| 항목 | 값 |
|------|-----|
| 현재 브랜치 | subin (origin/subin = 2fc8369, 유형 탭 추가 완료) |
| dev 상태 | 75b653b (PR #39 머지됨, 04-19) |
| 미푸시 커밋 | 0 |
| 진행 중 PR | **#45 OPEN — MERGEABLE ✅** (W1 12/12 + M1 1차 + Phase 1~2a + 플래닝 문서) |
| `.auth/cafe-state.json` | 존재 (04-19 19:35 생성, gitignored) |

## 남은 과제
- **다음카페 Phase 2b** — upsert + --execute 활성화 + 3게시판 통합 + 역방향 백필 (decisions.md 2026-04-19 참조)
- **다음카페 Phase 3** — Vercel Cron + GH Actions(Playwright) + admin UI + 알림
- **운영 DB 동기화** — 백필/병합/endDate/권한/파서 147건+66건 운영 반영 (원영 협의)
- **원영 영역 공식 기록 가드** — public-bracket API, _site/*.tsx

## 운영 팁
- **gh 인증 풀림**: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...`
- **gh pr edit 스코프 부족 시**: `gh api -X PATCH repos/OWNER/REPO/pulls/N -f title=...`
- **tsx 환경변수**: `npx tsx --env-file=.env.local scripts/xxx.ts` (Node 22)
- **쿠키 세션 갱신**: `npx tsx scripts/cafe-login.ts` (브라우저 headed → 로그인 → Enter)
- **storageState 경로 override**: `DAUM_CAFE_STORAGE_STATE=/path/to.json`
- **포트 죽이기**: `netstat -ano | findstr :<포트>` → `taskkill //f //pid <PID>` (node.exe 통째 금지)
- **커밋 전 파일 diff 확인**: Coworker 공유 파일은 **내 변경만** 들어갔는지 점검 (c884ae0 NotificationBadge 누락 사고 교훈)
- **공식 기록 쿼리**: `officialMatchWhere()` 유틸 필수

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-19 | developer | B2 — `/games` 유형 탭 건수 뱃지 (route.ts groupBy 1회 + games-content typeCounts 상태 + game-type-tabs counts props) | ✅ tsc PASS, 미커밋 |
| 04-19 | pm+developer | `/games` 경기 유형 탭 추가 (전체/픽업/게스트/연습경기, URL `?type` 기반, TYPE_BADGE 재사용) + 플로팅 패널 type 필터 제거 | ✅ 2fc8369 push, PR #45 포함 |
| 04-19 | pm | UX 세션: Dev/ 플래닝 3개 커밋 + Q12 조사(수정 불필요, W1 **12/12**) + dev merge-back 7충돌 해결 → PR #45 **MERGEABLE** | ✅ 610dcf2 push |
| 04-19 | pm | 오늘 세션 시작: 환경 체크 + Phase 2a 재검증(IVHA 본문 200×2/2) + 로컬 변경 커밋·푸시 | ✅ 3cd61c4 push |
| 04-19 | pm+developer | Phase 2a 완료: Playwright `cafe-login.ts` + storageState 쿠키 로드 → 본문 200 × 2/2 + parseCafeGame 2/2 + 마스킹 OK | ✅ 55d78c3 push |
| 04-19 | developer | Phase 2a 코드: mask-personal-info + article-fetcher + sync-cafe --with-body (vitest 19/19, 쿠키 미수 403) | ✅ 2890224 push |
| 04-19 | pm | PR #39 **dev 머지 완료** (squash, 75b653b) + 제목/본문 갱신 | ✅ merged |
| 04-19 | pm | Coworker 4파일 수습 + Vercel 빌드 복구 (c884ae0 NotificationBadge 누락 → ae8e452) | ✅ CI CLEAN |
| 04-19 | tester | MoreTabTooltip Playwright E2E 6/6 PASS | ✅ |
| 04-19 | pm+developer | 다음카페 Phase 1 POC — 3게시판 30건 실제 수집 (articles.push 정규식) | ✅ |
| 04-19 | pm | 크롤링 정책 리서치(9가드) + decisions.md 승격 | ✅ 조건부 진행 |

## 구현 기록 — M1 Day 7 (developer)

📝 구현: /profile 허브를 4카드 허브에서 통합 대시보드(히어로 + 4그룹 카드)로 재구성

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/lib/services/user.ts` | `getProfile()` 에 `followersCount`/`followingCount`/`nextGameApp` 3개 쿼리 Promise.all 병렬 추가 (`follows.count` × 2 + 다음 경기 `findFirst`) | 수정 |
| `src/app/api/web/profile/route.ts` | GET 응답에 `followersCount`/`followingCount`/`nextGame` 필드 추가 (backward compatible, 기존 필드 불변) | 수정 |
| `src/app/(web)/profile/_components/profile-hero.tsx` | 히어로 컴포넌트 (아바타 108/144 + Lv 배지 + 포지션/지역/신장 + "프로필 편집" 버튼 + 미니 통계 4칸 경기수/팔로워/승률/팔로잉 + bio) | 신규 |
| `src/app/(web)/profile/_components/basic-info-card.tsx` | 기본 정보 카드 (닉네임/이메일/전화·마스킹/생년월일 + 우상단 "수정" 링크) | 신규 |
| `src/app/(web)/profile/_components/teams-tournaments-card.tsx` | 팀/대회 요약 카드 (소속팀 N개 / 참가 대회 N회 / 다음 경기 D-N, KST 기준 D-Day 계산) | 신규 |
| `src/app/(web)/profile/_components/refund-account-card.tsx` | 환불 계좌 카드 (은행+마스킹 번호+예금주 or "등록된 계좌 없음") | 신규 |
| `src/app/(web)/profile/_components/danger-zone-card.tsx` | 위험 영역 카드 (error tint border + /profile/edit#danger 링크) | 신규 |
| `src/app/(web)/profile/page.tsx` | 기존 4카드 허브 완전 제거 → 히어로 + 4카드 2열 그리드 + 로그아웃. useSWR 3개(`/api/web/profile`+`/profile/gamification`+`/profile/stats`) 유지 | 수정 |
| `src/components/profile/profile-side-nav.tsx` | "내 정보" href `/profile/edit` → `/profile`, matchPaths=["/profile","/profile/edit"], `exactOnly: true` 플래그 추가로 하위 경로 오매칭 방지 | 수정 |

🔧 tsc: **PASS (에러 0)**

💡 tester 참고:
- **테스트 방법**: `/profile` 접속 → 히어로(아바타·Lv배지·미니통계4·편집버튼) + 4카드(기본정보·팀대회·환불계좌·위험영역) + 로그아웃 확인
- **사이드 네비 활성 검증**:
  - `/profile` 상태 → "내 정보" 활성
  - `/profile/edit` 상태 → "내 정보" 활성 (수정 페이지도 같은 메뉴 그룹)
  - `/profile/basketball` 상태 → "내 농구"만 활성 (내 정보 비활성이어야 정상) ← exactOnly 플래그가 제대로 작동하는지 핵심 확인
  - `/profile/preferences` → "설정"만 활성
- **정상 동작**:
  - 팔로워/팔로잉 숫자가 0 이상으로 노출
  - 다음 경기 있으면 "D-N · 경기제목", 없으면 "예정된 경기 없음"
  - 전화번호가 010-XXXX-XXXX 패턴이면 "010-****-****" 마스킹
  - 계좌 없으면 "등록된 계좌가 없어요", 있으면 은행명+마스킹번호+예금주
  - /profile/edit 이동 후 브라우저 뒤로 → /profile 대시보드 복귀 정상
  - "회원 탈퇴" 클릭 → /profile/edit#danger (기존 탈퇴 모달 위치로 앵커 이동)
- **주의할 입력**:
  - 비로그인 상태 접근 → "로그인이 필요합니다" 안내 (기존 분기 유지)
  - 데이터 없는 신규 가입자(teams=0, tournaments=0, nextGame=null, followers=0): 0/"예정된 경기 없음" 표시되어야지 렌더 크래시 X
  - 프로필 이미지 없는 유저: 이니셜 fallback 표시

⚠️ reviewer 참고:
- **네비 `exactOnly` 플래그 신규 도입**: 기존에는 startsWith 로 하위 경로까지 광역 매칭했는데, `/profile` 이 matchPaths 에 들어가면 /profile/basketball 같은 하위 전부가 동시 활성되는 버그가 생겨서 플래그로 제어. "내 정보" 만 exactOnly=true, 나머지는 기존 동작 유지.
- **히어로 아바타 사이즈**: 지시는 "모바일 108 / PC 144" 이나 Tailwind responsive breakpoint 로 부드럽게 처리하기 위해 outer div 는 108px 고정 + inner md: w-36 h-36 -m-1 으로 확장. 이미지 `width={144}` 고정 + `object-cover` 라 시각 결과는 스펙과 동일.
- **API backward compatible**: 기존 `user/teams/recentGames/tournaments` 4개 응답은 그대로. 신규 3개(`followersCount`/`followingCount`/`nextGame`) 만 추가 → 다른 화면(`profile-header` 등)이 이 API 를 공유해도 영향 0.
- **Prisma 스키마 0변경**: `follows.count` + `game_applications.findFirst` 만 추가 사용. 운영 DB 안전.
- **웹 세션 유지**: `/api/web/profile` 는 `withWebAuth` 라 비로그인 401, 로그인 정상 — 프론트 분기 그대로.

### 수정 이력 (1회차) — tester 블록 1건 + 권장 2건 + 경미 1건

| 파일 | 수정 내용 |
|------|----------|
| `src/app/(web)/profile/page.tsx` | ProfileData 인터페이스 + 접근자 snake_case 통일: `followersCount→followers_count`, `followingCount→following_count`, `nextGame→next_game`. 상단 주석 동반 수정. 로그인 버튼 `text-white → text-[var(--color-on-primary)]` |
| `src/app/(web)/profile/edit/page.tsx` | 회원 탈퇴 `<div>` 에 `id="danger"` 추가 (DangerZoneCard `#danger` 앵커 대상) |
| `src/app/(web)/profile/_components/profile-hero.tsx` | 배경 장식 `rgba(227, 27, 35, 0.05)` → `color-mix(in srgb, var(--color-primary) 5%, transparent)` |
| `src/components/profile/profile-side-nav.tsx` | 모바일 활성 chip `text-white → text-[var(--color-on-primary)]` |

🔧 tsc: **PASS** (exit 0, 에러 0)
🔧 grep 재검증: `followersCount|followingCount|nextGame` camelCase 접근 **0건** (JSX prop 이름은 컴포넌트 계약상 유지 OK, 우변 profile.* 는 모두 snake_case)
🔧 `rgba(227` hero 파일 **0건** (radar-chart / profile-header 는 이번 범위 밖)
🔧 `text-white` page.tsx / profile-side-nav.tsx 실제 className **0건** (주석으로만 남음)
🔧 `id="danger"` edit/page.tsx:518 **추가 확인**

💡 tester 재검증 요청: 
- 블록 이슈 해소 확인 — `/profile` Network 탭 응답 `followers_count/following_count/next_game` 키가 히어로·카드에 실제 렌더링되는지
- `/profile/edit#danger` 앵커 스크롤이 탈퇴 섹션으로 정확히 이동하는지
- 라이트모드에서 모바일 chip / 로그인 버튼의 글자 가시성 정상인지

⚠️ 이번 라운드 범위 외 (후속 과제):
- reviewer 5번 (Card 공통 껍데기 추출)
- reviewer 6번 (`/users/[id]` 히어로 공통화)
- reviewer 7, 8, 9번 (인덱스·DST 보강·error fallback 제거)

## 리뷰 결과 — M1 Day 7 (reviewer)

### 종합 평가
🟡 **경미한 개선점** — 블록 이슈 없음. 머지 가능. 컨벤션 준수·API 설계·네비 로직 모두 견고. `text-white` 고정 색상 2곳 + 성능 미세 보강(useSWR 3회 → 1회 통합 가능) 정도만 권장 수준으로 남김.

### 카테고리별
| 카테고리 | 등급 | 비고 |
|----------|------|------|
| 컨벤션 준수 | 🟢 | `var(--color-*)` 일관 사용, Material Symbols만, 4px radius, camelCase/kebab-case/PascalCase 모두 OK. 단 `text-white` 2건(아래 권장) |
| 재사용성 | 🟡 | 카드 공통 껍데기가 `BasicInfoCard` 내부 `Card` 로만 존재 → 3개 카드에서 반복. `/users/[id]` 히어로와 아바타 블록 중복 (이번 범위 밖이라 TODO만 권장) |
| API 안전성 | 🟢 | Promise.all 7병렬, follows/nextGame `.catch(()=>폴백)`, 기존 응답 불변(backward compatible), try/catch로 500 보호 |
| 네비 로직 | 🟢 | `exactOnly` 플래그 신설은 깔끔하고 주석도 충실. 기존 5항목 동작 변화 없음(회귀 리스크 낮음) |
| 접근성 | 🟡 | `alt={displayName}` 있음, `aria-label="프로필 메뉴"` 있음. 단 히어로 배경 장식 div에 `aria-hidden` 없음(사소), 카드에 `<section>` 사용 OK |
| 성능 | 🟡 | useSWR 3개 병렬이라 체감 OK. 다만 `/api/web/profile` 한 번으로 통합 가능한 구조라 장기 최적화 여지. nextGame `findFirst` 는 `game_applications.user_id` + `games.scheduled_at` 인덱스가 있어 쿼리 적절 |
| 디자인 일관성 | 🟢 | `/users/[id]` 히어로 톤과 동일한 BDR Red 블러·아바타 테두리·미니통계 카드 스타일 |

### 개선 권장 (block 아님)

1. **`src/components/profile/profile-side-nav.tsx:167`** — 모바일 활성 chip `text-white` 고정.
   - 왜: conventions.md "테마 반응형 배경 위 텍스트는 `--color-on-*` 변수 사용, text-white 금지". 현재 primary 배경(라이트/다크 동일 red이라 다행히 가시성 문제 없지만) 원칙상 `text-[var(--color-on-primary)]` 권장.
   - 수정 전: `"bg-[var(--color-primary)] text-white"`
   - 수정 후: `"bg-[var(--color-primary)] text-[var(--color-on-primary)]"`

2. **`src/app/(web)/profile/page.tsx:145`** — 로그인 버튼 `text-white` 고정.
   - 왜: 위와 동일. 본 PR에서 신규 작성한 블록이므로 같은 수정 권장.

3. **`src/app/(web)/profile/_components/basic-info-card.tsx:73-111`** — `Card` 컴포넌트가 BasicInfoCard 내부 private. RefundAccountCard/TeamsTournamentsCard도 동일 `<section>+헤더(제목+수정링크)+본문` 패턴 반복 → 공통 컴포넌트 `_components/profile-card.tsx`로 추출하면 3파일 각각 ~15줄씩 감소. 이번 스코프 밖이어도 TODO 주석 권장.

4. **`src/app/(web)/profile/_components/profile-hero.tsx:88-91`** — 배경 장식 div에 `aria-hidden="true"` 누락. 스크린리더가 빈 div를 의미 없이 읽지 않도록 권장.

5. **`src/app/(web)/profile/_components/profile-hero.tsx:90`** — `rgba(227, 27, 35, 0.05)` 하드코딩 (BDR Red). `/users/[id]` 히어로가 같은 값을 쓰므로 이미 일관성은 유지되지만, 가능하면 `color-mix(in srgb, var(--color-primary) 5%, transparent)` 로 치환해 브랜드 리프레시 시 한 곳만 고치면 되는 구조가 이상적.

6. **`src/app/(web)/profile/_components/profile-hero.tsx` vs `/users/[id]/page.tsx`** — 히어로 블록(아바타 + 이름 + 메타 + 바이오)이 시각적으로 거의 동일. 중복 65% 수준. 본인/타인에서 각각 다른 점(편집 vs 팔로우/티어 배지)을 props로 분기하는 공통 `UserHero` 컴포넌트를 향후 뽑아도 좋음. 지금은 파일 맨 위 주석에 "TODO: /users/[id] 히어로와 공통 추출 고려" 정도 남기기만 해도 충분.

7. **`src/lib/services/user.ts:129-148`** — `nextGameApp` 쿼리가 활성 유저(신청 이력 수백 건)에서 index scan + 정렬이 살짝 커질 여지. 현재도 OK지만, `@@index([user_id, game_id])` 같은 복합 인덱스가 향후 필요해질 수 있음(지금은 운영 DB 스키마 변경 금지이므로 기록만).

8. **`src/app/(web)/profile/_components/teams-tournaments-card.tsx:40-55`** — KST 변환이 수동. `Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul' })` 기반으로 바꾸면 DST/timezone 엣지 케이스 보호. 현재 로직도 틀리진 않음.

9. **`src/app/(web)/profile/_components/danger-zone-card.tsx:23, 31, 37, 55, 56`** — `var(--color-error, #EF4444)` fallback을 5번 반복. 하드코딩 금지 원칙상 fallback 자체는 OK이지만 globals.css에 `--color-error` 정의 여부 확인 후 fallback 제거 가능.

### 수정 요청 (block)
**수정 요청 없음.** 블록 이슈 0건. 위 9개는 모두 머지 후 리팩토링/후속 개선 사항.

### 칭찬할 점
- **backward compatible API 설계**: 기존 4개 응답 필드 불변 + 신규 3개만 추가 → `profile-header` 등 다른 소비자 영향 0. 배포 안전성 ★
- **exactOnly 플래그의 정확한 문제 인식**: `/profile` 을 matchPaths에 넣으면 startsWith 때문에 하위 전체가 동시 활성되는 걸 미리 발견하고, 기존 5항목 동작은 건드리지 않게 플래그로 격리. 주석에 "왜" 설명 충실.
- **풍부한 주석**: 각 파일 상단 "왜/어떻게" 블록 주석, 복잡 로직(마스킹/D-day/exactOnly)에 인라인 주석. 바이브 코더가 3개월 뒤 돌아와도 의도 파악 쉬움.
- **폴백 전략**: `follows.count().catch(()=>0)` + `findFirst().catch(()=>null)` + `stats?.winRate != null ? "X%" : "-%"` + 이니셜 fallback. 부분 실패해도 허브가 무너지지 않는 구조.
- **Prisma 스키마 0변경**: 운영 DB 접근 안전 규칙 완벽 준수. 추가 테이블/컬럼 없이 기존 인프라만 사용.
- **컨벤션 섹션 활용**: Lv 배지에서 `--color-on-primary` 변수 사용(conventions.md 2026-04-12 규칙 준수), 플레이스홀더 `-` hyphen 사용, 4px radius, Material Symbols만, kebab-case 파일명 — 체크리스트 전반 통과.

### 작업 로그 제안 (PM이 기록)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-19 | reviewer | M1 Day 7 정적 리뷰 (9파일) — 블록 0건, 권장 9건(text-white 2건/Card 추출/TODO) | 🟢 통과 |

## 테스트 결과 — M1 Day 7 (tester)

| 검증 항목 | 결과 |
|-----------|------|
| tsc --noEmit | ✅ PASS (exit 0, 에러 0) |
| API 신규 필드 3개 반환 코드 존재 | ✅ OK (`route.ts:65-67` + `user.ts:75-149`) |
| Promise.all 7병렬 + `.catch()` 폴백 | ✅ OK |
| `nextGame` 미래 필터 `scheduled_at > now` | ✅ OK (`user.ts:132`) |
| API backward compat (기존 필드 유지) | ✅ OK (user/teams/recentGames/tournaments 불변) |
| D-N KST 계산 | ✅ OK (UTC+9 shift → Date.UTC 자정 기준 round diff) |
| #danger 앵커 존재 | 🚨 **누락** (`edit/page.tsx:518` 탈퇴 div에 `id="danger"` 없음) |
| exactOnly 네비 로직 | ✅ OK (`profile-side-nav.tsx:91-96`) |
| `/profile/basketball`에서 "내 정보" 비활성 | ✅ OK (로직 추적 검증) |
| `/profile/edit`에서 "내 정보" 활성 | ✅ OK |
| `/profile`에서 "내 정보" 활성 | ✅ OK |
| 하드코딩 색상 (신규 5파일) | ⚠️ 1건 (profile-hero.tsx:90 BDR Red rgba — 경미) |
| Material Symbols 아이콘 | ✅ OK |
| 4px border-radius | ✅ OK (4카드 전부) |
| 페이지 useSWR 3개 유지 | ✅ OK |
| 로그아웃 버튼 유지 | ✅ OK |
| **신규 3필드 실제 전달** | 🚨 **블록** (아래 이슈 1 — apiSuccess snake_case 변환 vs 프론트 camelCase 접근) |

📊 종합: 17개 중 14개 통과, 2개 실패, 1개 경미

### 🚨 발견된 이슈

#### 1. [블록 🔴] API 응답 snake_case 변환 vs 프론트 camelCase 접근 — 신규 3필드가 런타임에 **전부 undefined**
- **파일**: `src/app/(web)/profile/page.tsx:174-189`
- **증상**: 히어로의 팔로워/팔로잉 숫자 항상 **0**, TeamsTournamentsCard의 "다음 경기" 항상 **"예정된 경기 없음"** (서버에 실제 데이터가 있어도)
- **원인**:
  1. `apiSuccess()` (`src/lib/api/response.ts:5`)가 응답을 `convertKeysToSnakeCase()`로 자동 변환 → 서버 `{ followersCount, followingCount, nextGame }` → 클라이언트 `{ followers_count, following_count, next_game }`
  2. 글로벌 SWR fetcher (`src/components/providers/swr-provider.tsx:7`)는 **역변환 미적용** (`(url) => fetch(url).then(r=>r.json())` 만)
  3. `profile.followersCount` → undefined → `?? 0` 폴백 → 항상 0
- **교차 검증**: 같은 응답의 `profile.user.birth_date`, `profile.user.has_account` 등 기존 필드는 page.tsx에서 **snake_case로 접근** 중이라 정상 작동 → 신규 3필드만 camelCase로 쓴 것이 원인
- **심각도**: 🔴 기능 무효 (허브 대시보드 신규 기능 3개 전부 가짜 값 표시)
- **재현**: `/profile` 접속 → DevTools Network `/api/web/profile` 응답 body → `followers_count` 있고 `followersCount` 없음
- **errors.md 이력**: 2026-04-17 "apiSuccess 미들웨어 놓치고 컴포넌트 인터페이스 거꾸로 변환" — **재발 5회차**
- **권장 수정** (최소): `page.tsx` 에서 3곳 접근을 snake_case로:
  ```
  followersCount={profile.followers_count ?? 0}
  followingCount={profile.following_count ?? 0}
  nextGame={profile.next_game ?? null}
  ```
  + `ProfileData` 인터페이스의 `followersCount?`, `followingCount?`, `nextGame?` 키도 snake_case로 (기존 필드와 통일)

#### 2. [권장 🟠] `/profile/edit` 페이지에 `id="danger"` 앵커 누락
- **파일**: `src/app/(web)/profile/edit/page.tsx:518` (회원 탈퇴 영역 div)
- **증상**: DangerZoneCard "회원 탈퇴" 클릭 → `/profile/edit#danger` 이동하지만 해당 id 앵커가 없어 스크롤이 맨 위에 멈춤 → 사용자가 수동으로 탈퇴 섹션을 찾아야 함
- **검증**: `grep "danger"` 결과 edit/page.tsx에 0건 (탈퇴 관련 텍스트만 있고 id/name 없음)
- **심각도**: 🟠 UX 저하 (기능 동작하지만 네비 의도 미달)
- **권장 수정**: `edit/page.tsx:518` `<div className="mt-8 ..."` 에 `id="danger"` 1줄 추가

#### 3. [경미 🟡] ProfileHero 배경 장식 BDR Red 하드코딩
- **파일**: `src/app/(web)/profile/_components/profile-hero.tsx:90`
- **내용**: `rgba(227, 27, 35, 0.05)` — BDR Red `#E31B23` 하드코딩 (CLAUDE.md 금지 규칙)
- **참고**: 기존 profile-header.tsx:69 도 동일 패턴 → 관행상 허용 가능하나 엄격히는 위반
- **권장 수정** (선택): `color-mix(in srgb, var(--color-primary) 5%, transparent)`

### 수정 요청

| 대상 파일 | 문제 | 권장 수정 | 우선순위 |
|----------|------|----------|----------|
| `src/app/(web)/profile/page.tsx` | 신규 3필드 camelCase 접근으로 런타임 undefined (팔로워/팔로잉 0, 다음경기 null) | 3곳 `.followersCount/.followingCount/.nextGame` → `.followers_count/.following_count/.next_game` + 인터페이스 동일 적용 | 🔴 블록 |
| `src/app/(web)/profile/edit/page.tsx` | 회원 탈퇴 div에 `id="danger"` 누락 | line 518 div에 `id="danger"` 추가 | 🟠 권장 |
| `src/app/(web)/profile/_components/profile-hero.tsx` | BDR Red rgba 하드코딩 (line 90) | `color-mix(in srgb, var(--color-primary) 5%, transparent)` 교체 | 🟡 선택 |

### 회귀 검증 스팟 (수정 후)
- `/profile` Network 탭 응답에 `followers_count/following_count/next_game` 키 존재 → 히어로에서 실제 숫자·TeamsTournamentsCard 다음 경기 D-N 노출
- "회원 탈퇴" 클릭 → edit 페이지의 탈퇴 섹션으로 스크롤 이동
- `/profile/basketball` → 좌측 "내 정보" 비활성 확인 (reviewer도 로직 OK 평가)
- `/profile/edit` → "내 정보" 활성
- 비로그인 → "로그인이 필요합니다" fallback 유지

## 테스트 결과 — M1 Day 7 재검증 (tester, 1회차 후)

| 검증 항목 | 이전 결과 | 수정 후 결과 |
|----------|-----------|-------------|
| tsc --noEmit | ✅ PASS | ✅ PASS (exit 0, 에러 0) |
| snake_case 이슈 재발 5회차 | 🔴 블록 | ✅ **해소** (profile.followersCount/nextGame 접근 0건, snake_case 3건 확인) |
| #danger 앵커 | 🟠 누락 | ✅ **존재** (edit/page.tsx:518 탈퇴 div에 `id="danger"` 추가 확인) |
| rgba 하드코딩 (profile-hero) | 🟡 1건 | ✅ **0건** (line 93 `color-mix(in srgb, var(--color-primary) 5%, transparent)` 적용) |
| text-white 하드코딩 (page.tsx) | 🟡 1건 | ✅ **0건** (line 149 `text-[var(--color-on-primary)]`) |
| text-white 하드코딩 (profile-side-nav) | 🟡 1건 | ✅ **0건** (line 168 `text-[var(--color-on-primary)]`) |
| ProfileData 인터페이스 snake_case | 🔴 불일치 | ✅ **일치** (`followers_count` / `following_count` / `next_game` 정의) |
| NextGameSummary 내부 필드 | - | ✅ OK (`scheduled_at`, `title`, `venue_name` 모두 snake_case) |
| teams-tournaments-card 내부 접근 | - | ✅ OK (`nextGame.scheduled_at`, `nextGame.title` — prop명은 계약 유지, 내부 키는 snake) |
| 서버-클라이언트 스키마 일관성 | - | ✅ OK (route.ts: camelCase 반환 → apiSuccess snake 변환 → page.tsx: snake 접근) |
| 이전 OK 항목 회귀 (Promise.all 7병렬/폴백/KST D-N/exactOnly) | ✅ | ✅ **회귀 없음** (user.ts/route.ts/profile-side-nav 로직 파트 불변) |

📊 종합: 11개 중 11개 통과, 0개 실패

### 종합 평가
🟢 **PASS — 머지 가능**

블록 1건(snake_case 5회차 재발) + 권장 1건(#danger 앵커) + 경미 2건(text-white 2건, rgba 1건) **전부 해소됨.** developer가 4파일을 최소 범위로 정확히 수정. 서버는 불변(backward compatible 유지), 프론트만 `apiSuccess` 스내이크 변환에 맞춰 접근자 3곳 + 인터페이스 3필드 통일.

### 발견된 새 이슈
- **없음.** 이번 수정에서 새로 유입된 회귀 없음. 이전 "OK"였던 항목(Promise.all 7병렬, `.catch()` 폴백, KST D-N 계산, exactOnly 네비, backward compat API)도 모두 그대로.

### 수정 요청
- **없음.** reviewer 9개 중 후속 처리 대상 5~9번(Card 공통화, `/users/[id]` 히어로 공통화, 인덱스 보강, DST 보강, error fallback 제거)은 이번 스코프 밖 — 별도 이슈로.

### 커밋 준비도 평가
- **커밋 가능 여부**: ✅ **예**
- **CI 예상**: ✅ **통과** (tsc PASS, lint 규약 위반 0건, 운영 DB 스키마 변경 0)
- **커밋 권장 메시지 예시**: `fix(profile): M1 Day 7 snake_case 접근 + #danger 앵커 + 테마 색상 변수 통일`
- **수정 파일 4종**:
  1. `src/app/(web)/profile/page.tsx` — ProfileData 인터페이스 3필드 snake_case + 접근자 3곳 + 로그인 버튼 `text-[var(--color-on-primary)]`
  2. `src/app/(web)/profile/edit/page.tsx` — 탈퇴 div에 `id="danger"` 추가
  3. `src/app/(web)/profile/_components/profile-hero.tsx` — rgba → color-mix
  4. `src/components/profile/profile-side-nav.tsx` — 모바일 chip `text-[var(--color-on-primary)]`

## 구현 기록 — M1 Day 8 (developer)

📝 구현: 설정·결제 페이지 통합 — `/profile/preferences` + `/profile/notification-settings` → `/profile/settings` (탭 2) / `/profile/subscription` + `/profile/payments` → `/profile/billing` (탭 2) + 구 경로 4개 redirect + 링크 교체 5곳

### 설계 결정 (PM 6개 전부 승인)
| # | 결정 | 적용 |
|---|------|------|
| 1 | 탭 컴포넌트 inline (후속 공용화) | `TabButton` 함수가 settings/billing 각 파일 내부 |
| 2 | 탭 전환 `router.replace + { scroll: false }` | 히스토리 누적·스크롤 점프 방지 |
| 3 | 비활성 탭 조건부 렌더 | `{activeTab === 'X' && <Section />}` → API 호출 절약 |
| 4 | 기존 4 페이지 파일 존치 | redirect-only로 rewrite (서버 컴포넌트 `redirect()`) |
| 5 | 탭 스타일 `border-b-2` 절제형 | 활성=primary border + text, 비활성=transparent + muted |
| 6 | 개별 헤더 제거 + 허브 단일 헤더 | "설정"/"결제" h1 허브 한 곳만 |

### 파일 변경 (11개: 신규 2 + 수정 9)
| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/app/(web)/profile/settings/page.tsx` | 설정 허브. PreferenceForm import + NotificationsSection 내부 서브 컴포넌트. URL `?tab=preferences\|notifications` 관리, `router.replace({scroll:false})`, 비활성 탭 조건부 렌더 | 신규 |
| `src/app/(web)/profile/billing/page.tsx` | 결제 허브. SubscriptionSection / PaymentsSection 각 useSWR로 조건부 렌더 → 비활성 탭 API 호출 안 됨. 해지/환불 모달 이식 | 신규 |
| `src/app/(web)/profile/preferences/page.tsx` | 전체 rewrite → `redirect("/profile/settings?tab=preferences")` | 수정 |
| `src/app/(web)/profile/notification-settings/page.tsx` | 전체 rewrite → `redirect("/profile/settings?tab=notifications")` | 수정 |
| `src/app/(web)/profile/subscription/page.tsx` | 전체 rewrite → `redirect("/profile/billing?tab=subscription")` | 수정 |
| `src/app/(web)/profile/payments/page.tsx` | 전체 rewrite → `redirect("/profile/billing?tab=payments")` | 수정 |
| `src/components/profile/profile-side-nav.tsx` | "설정" href `/profile/preferences → /profile/settings` + matchPaths 신/구 3경로. "결제" href `/profile/subscription → /profile/billing` + matchPaths 신/구 3경로 | 수정 |
| `src/components/shared/profile-accordion.tsx` | "맞춤 설정" → `/profile/settings`, "계정" → `/profile/billing` | 수정 |
| `src/components/shared/profile-dropdown.tsx` | "맞춤 설정" → `/profile/settings`, "계정" → `/profile/billing` | 수정 |
| `src/app/(web)/pricing/success/page.tsx` | "결제 내역" `/profile/payments → /profile/billing?tab=payments` | 수정 |
| `src/app/(web)/profile/edit/page.tsx` | "맞춤 설정 관리" `/profile/preferences → /profile/settings?tab=preferences` | 수정 |

### redirect 매핑 (외부 링크/북마크 호환)
| 구 경로 | 신 경로 |
|---------|---------|
| `/profile/preferences` | `/profile/settings?tab=preferences` |
| `/profile/notification-settings` | `/profile/settings?tab=notifications` |
| `/profile/subscription` | `/profile/billing?tab=subscription` |
| `/profile/payments` | `/profile/billing?tab=payments` |

### profile-side-nav matchPaths (구+신 양쪽 — PM 재확인 포인트 반영)
- **설정**: `/profile/settings` + `/profile/preferences` + `/profile/notification-settings` (redirect 찰나에도 활성 유지)
- **결제**: `/profile/billing` + `/profile/subscription` + `/profile/payments` (동일 이유)

### tsc 결과
- Day 8 스코프 (11개 파일) 에러 **0건** ✅ (grep 필터 검증)
- 전체 프로젝트 에러 1건 — `src/app/(web)/games/_components/games-content.tsx:340` (`counts` prop) → **Day 8 스코프 밖**, 이전 세션의 미완료 변경 (GameTypeTabs counts prop 미정의). 이번 커밋에 **편승 금지**, 별도 이슈

### 링크 교체 재검증 (grep)
- `src/` 전체에서 `href=["']/profile/(preferences|notification-settings|subscription|payments)["']` 매치 **0건** ✅
- 5곳 누락 없이 모두 교체됨

💡 tester 참고:
- **핵심 3가지 테스트**
  1. `/profile/settings` → 탭 2개 토글 시 URL `?tab=preferences` ↔ `?tab=notifications` **replace** (히스토리 누적 X, 뒤로가기가 이전 탭 아닌 이전 페이지로)
  2. `/profile/billing` → 탭 2개 동일 패턴. DevTools Network에서 **활성 탭 API만** 호출 (비활성 탭은 호출 안됨)
  3. 구 경로 4개 즉시 redirect: 주소창이 신 경로로 갱신되는지
- **네비 활성 상태**
  - 신 경로 → 좌측 네비 "설정" / "결제" 활성
  - 구 경로 진입 찰나 → matchPaths에 구 경로 포함이라 활성 유지
  - 쿼리 변경 시 활성 탭 스타일(border-b-2 primary) 따라가는지
- **링크 교체 5곳**
  - 헤더 프로필 드롭다운 "맞춤 설정" → `/profile/settings`, "계정" → `/profile/billing`
  - 슬라이드 메뉴 ProfileAccordion 동일
  - `/profile/edit` 하단 "맞춤 설정 관리" → `/profile/settings?tab=preferences`
  - `/pricing/success` 하단 "결제 내역" → `/profile/billing?tab=payments`
- **기능 보존**
  - 맞춤 설정: PreferenceForm settings 모드 저장
  - 알림 설정: 토글 5개 PATCH 낙관적 업데이트 + 롤백
  - 구독: 해지 모달 + DELETE
  - 결제 내역: 페이지네이션 + 환불 모달 + 영수증 링크
- **주의할 입력**: `?tab=foo` → 기본 탭 fallback. 비로그인 → 기존 API 401 그대로

⚠️ reviewer 참고:
- **TabButton 중복** settings/billing 22줄씩 — PM 결정(1번)으로 의도적 inline. 후속 공용화 예정
- **이식 원칙**: 기존 "뒤로가기(← /profile)" + h1 제거, 나머지 UI/로직 100% 그대로
- **text-white → --color-on-primary 승격**: 이식 과정에서 3버튼 고정색 제거 (Day 7 컨벤션 적용)
- **redirect() 서버 컴포넌트**: 구 4페이지 `"use client"` 제거 → SSR 단계 즉시 이동 → 깜빡임 없음
- **운영 DB 0변경**
- **Day 8 범위 밖 tsc 에러 1건** (`games-content.tsx`): 이전 세션 미완료 → 편승 금지

### 커밋 권장 메시지
`feat(profile): M1 Day 8 설정/결제 페이지 통합 — /profile/settings + /profile/billing 허브 탭화`

## 테스트 결과 — M1 Day 8 (tester)

| 검증 항목 | 결과 |
|----------|------|
| tsc Day 8 스코프 (11파일) | ✅ PASS (에러 0) |
| tsc 전체 | ✅ PASS (exit 0, 에러 0) — 이전 우려됐던 games-content.tsx:340 이슈 현재 없음 |
| redirect-only 4개 파일 (preferences/notification-settings/subscription/payments) | ✅ OK (모두 서버 컴포넌트 `redirect()` 사용) |
| next.config.ts redirects 4개 | ⚠️ 미적용 — 구현은 page.tsx의 `redirect()` 만 사용 (PM 검증 지시와 실제 구현 불일치, 아래 이슈 1 참조) |
| /profile/settings 탭 2개 | ✅ OK (preferences/notifications, VALID_TABS fallback, ?tab=foo → preferences) |
| /profile/billing 탭 2개 | ✅ OK (subscription/payments, useSWR 조건부 렌더로 비활성 탭 API 호출 절약) |
| matchPaths 신+구 경로 모두 포함 | ✅ OK (설정=3경로, 결제=3경로, exactOnly 없음 → startsWith 매칭) |
| 링크 교체 5곳 누락 | ✅ 0건 (`href=/profile/(preferences\|notification-settings\|subscription\|payments)` 매치 0건) |
| router.replace + { scroll: false } | ✅ OK (settings line 92, billing line 40) |
| 탭 컴포넌트 role/aria | ✅ OK (role=tablist/tab/tabpanel, aria-selected, aria-controls, aria-labelledby) |
| 개별 페이지 헤더 제거 | ✅ OK (settings/billing 각각 h1 "설정"/"결제" 단일 헤더만) |
| 이식된 섹션 UI/로직 보존 | ✅ OK (PreferenceForm settings 모드 + 알림 토글 5개 + 구독 해지 모달 + 결제 페이지네이션 + 환불 모달 + 영수증 링크) |
| apiSuccess snake_case 재점검 | ✅ OK (신규 API 없음, 기존 인터페이스 snake_case 유지 — SubscriptionItem/PaymentItem 모두 snake) |
| text-white 하드코딩 | ✅ 0건 (`--color-on-primary, #FFFFFF` fallback 사용) |
| 운영 DB 스키마 변경 | ✅ 0건 |

📊 종합: 14개 중 13개 PASS, 1개 경미 (아래 이슈 1 — PM 검증 지시와 실제 구현 방식 차이, 블록 아님)

### 발견된 이슈

#### 1. [경미 🟡] next.config.ts redirects 4개 미추가 — 실제 구현은 page.tsx `redirect()` 방식
- **PM 검증 지시**: "next.config.ts redirects 4개 모두 존재 + permanent: true"
- **실제 구현**: 4개 레거시 경로 `page.tsx` 파일을 서버 컴포넌트로 rewrite, `redirect("/profile/xxx?tab=xxx")` 호출
- **next.config.ts 상태**: Day 8 관련 redirect 엔트리 **0건** (기존 /tournaments/*, /tournament-series, /upgrade 만 존재)
- **영향**: 두 방식 모두 redirect 효과는 동일하나 차이점 존재
  - `next.config.ts` = 308(permanent) + 요청을 Next 라우터에 도달하기 전 가로챔 (약간 더 빠름, SEO 신호 명확)
  - `page.tsx redirect()` = 307(temporary 기본) + 서버 렌더 단계 → 일반 리다이렉트
- **현재 개발자 구현 기록**의 설계 결정 4번: "기존 4 페이지 파일 존치 → redirect-only로 rewrite (서버 컴포넌트 redirect())" — **의도적 선택**으로 기록됨
- **판단**: 동작은 정상. SEO/속도 미세 차이만 존재. PM이 `next.config.ts`를 원했다면 `permanent: true` 옵션을 써서 308 보장하는 걸 권장하나 이번 범위에서는 현 방식도 합리적

#### 2. [참고 🔵] next.config.ts `redirect()` 옵션 누락 없음 확인
- `page.tsx` 의 `redirect()` (Next.js App Router) 는 기본 307(temporary). 영구 이동 표시 원하면 `redirect(url, "replace")` + `RedirectType.permanent` 사용해야 함. 현재는 기본값.
- 바이브 코더 관점: 북마크/외부 링크 호환은 둘 다 동작. SEO 신호만 차이. 블록 아님.

### 수정 요청

**없음.** (블록 이슈 0건. 경미 이슈 1건도 설계 선택으로 합리적.)

만약 PM이 "next.config.ts에도 redirect를 넣어두고 page.tsx는 유지"를 원한다면:

| 대상 파일 | 권장 수정 | 우선순위 |
|----------|----------|----------|
| `next.config.ts` (`async redirects` 블록) | 4개 엔트리 추가 (`/profile/preferences → /profile/settings?tab=preferences`, 등) + `permanent: true` | 🟡 선택 (현재 동작 OK) |

단 이 경우 주의: `next.config.ts` redirects 가 먼저 적용되므로 `page.tsx` 의 `redirect()` 는 **도달하지 않게 된다** → page.tsx 파일은 죽은 코드가 됨 (혹은 다음 단계에서 제거 가능). 현재처럼 page.tsx 방식 단독 사용도 합리적.

### 탭 UX 검증 (정적 분석 기반)

| 항목 | 확인 | 근거 |
|------|------|------|
| 뒤로가기 스택 누적 없음 | ✅ | `router.replace(..., { scroll: false })` — push 아님 |
| 스크롤 점프 없음 | ✅ | `{ scroll: false }` 옵션 |
| 탭 이동 시 데이터 리셋 | ✅ | 각 섹션 `useSWR` 독립 (subscription/payments는 조건부 렌더로 마운트·언마운트 시 자체 캐시) |
| 무효 `?tab` 값 처리 | ✅ | `VALID_TABS` 포함 안 되면 기본 탭 fallback (settings → preferences, billing → subscription) |
| 활성 탭 스타일 | ✅ | `border-b-2 solid var(--color-primary)` + `color: var(--color-primary)` / 비활성 `transparent + text-secondary` |

### 회귀 검증 스팟 (dev 서버 기동 시 확인 권장)
- `/profile/preferences` 접속 → 즉시 `/profile/settings?tab=preferences` 로 주소창 갱신
- `/profile/notification-settings` → `/profile/settings?tab=notifications`
- `/profile/subscription` → `/profile/billing?tab=subscription`
- `/profile/payments` → `/profile/billing?tab=payments`
- `/profile/settings?tab=foo` → 기본 탭(preferences) 활성, URL 은 그대로 foo (fallback은 활성만 적용, URL 정규화 안 함 — 주의)
- 구 경로 진입 찰나 좌측 네비 "설정"/"결제" 활성 유지 (matchPaths 덕분)
- DevTools Network → 구독 탭 활성 시 `/api/web/profile/payments` 호출 안 됨 / 결제 탭 활성 시 `/api/web/profile/subscription` 호출 안 됨

### 커밋 준비도

- **커밋 가능 여부**: ✅ **예** (블록 0건)
- **CI 예상**: ✅ **통과** (tsc exit 0, 링크 누락 0건, 운영 DB 변경 0)
- **PM 판단 포인트**: next.config.ts redirects 추가 여부만 결정하면 됨 (현재 구현으로도 정상 동작)
- **권장 커밋 메시지** (developer 기록 그대로): `feat(profile): M1 Day 8 설정/결제 페이지 통합 — /profile/settings + /profile/billing 허브 탭화`

## 리뷰 결과 — M1 Day 8 (reviewer)

### 종합 평가
🟢 **통과 — 머지 가능** (블록 이슈 0건)

Day 8 스코프 11파일 전부 컨벤션 준수. 핵심 설계(redirect-only 재작성 / 구·신 matchPaths 이중 활성 / 조건부 렌더로 비활성 탭 API 절약 / replace+scroll:false) 모두 정석. 링크 교체 5곳 재검증 매치 0건. 탭 UI 3종 공존(`game-type-tabs` 강조형 / `tournament-tabs` segmented / settings·billing 절제형)은 맥락이 달라 타당. 권장 6건은 전부 후속 리팩토링/접근성 수준.

### 카테고리별
| 카테고리 | 등급 | 비고 |
|----------|------|------|
| 컨벤션 준수 | 🟢 | `var(--color-*)` 일관, Material Symbols만, 4px radius, kebab/PascalCase. 신규 고정색 하드코딩 0건 |
| 탭 UI 일관성 | 🟢 | settings/billing 두 허브 탭이 TabButton 22줄 완전 동일 복제 → 시각 언어 일치. 게임 탭(강조형) vs 허브 탭(절제형) 구분 타당 |
| URL 상태 관리 | 🟢 | `useSearchParams` + `router.replace({scroll:false})` 정석. `VALID_TABS` 화이트리스트 fallback OK. 로컬 state 중복 0 |
| 조건부 렌더 | 🟢 | `activeTab === 'X' && <Section/>` 패턴으로 비활성 탭 완전 언마운트 → API 호출 절약 (billing 탭 활성 시 구독 API X, 반대도 성립) |
| redirect-only 재작성 | 🟢 | Next.js App Router 표준 `redirect()` from `next/navigation`. 서버 컴포넌트(use client 제거) → SSR 단계 즉시 이동(깜빡임 X) |
| 네비 matchPaths | 🟢 | 구·신 경로 둘 다 포함 → redirect 찰나에도 활성 유지. exactOnly 미적용(설정/결제는 startsWith 필요)이라 Day 7 "내 정보"(exactOnly=true)와 역할 구분 명확 |
| 링크 교체 | 🟢 | grep 재검증: `href=.../profile/(preferences\|...)` **0건**. 5곳 누락 없음 |
| 접근성 | 🟡 | 탭 `role="tab" / aria-selected / aria-controls` OK. `role="tablist" / "tabpanel" / aria-labelledby` 존재. 단 모달 ESC 키 미지원(기존 코드 이식, 회귀 아님) |
| 성능 | 🟢 | useSWR 중복 0, `revalidateOnFocus: false` 유지, 비활성 탭 마운트 X |
| 회귀 가능성 | 🟢 | 해지·환불 모달 state/props 완전 보존, PreferenceForm `mode="settings"` 계약 유지. API 경로 0변경 |

### 재확인 포인트 (PM 요청 사항 검증)

**1. next.config.ts "이중 가드" 여부 — PM 메모 정정 필요**
- PM 지시: "next.config.ts의 redirects도 있는데 page.tsx도 redirect → 이중 가드"
- 실제: **next.config.ts에는 Day 8 관련 redirect 엔트리 0건**. 오직 page.tsx의 서버 컴포넌트 `redirect()`만 존재 (tester 이슈 1과 일치).
- 판단: **이중 가드 아님, 단일 가드(page.tsx)**. 현 설계 적정. page.tsx 방식이 쿼리 파라미터 동적 구성에 더 유리. 기각/추가 둘 다 괜찮은 선택이나 현재 구현도 합리적.

**2. 링크 교체 5곳 vs Explore 6곳 차이**
- grep 재검증: `href=["']/profile/(preferences|notification-settings|subscription|payments)["']` 매치 **0건** → 교체 누락 0.
- developer "5곳" = 파일 수 기준(profile-side-nav / profile-accordion / profile-dropdown / pricing-success / profile-edit). 일부 파일에는 href가 2개(설정+결제) 존재 → 실제 href 교체 포인트는 8건.
- Explore "6곳" 언급은 문자열(주석/로그) 포함 카운트였을 가능성. 활성 Link JSX 기준 교체 완료.

**3. pricing/success 링크 query 파라미터 포함 여부**
- `pricing/success/page.tsx:219` — `href="/profile/billing?tab=payments"` ✅ 포함
- `profile/edit/page.tsx:501` — `href="/profile/settings?tab=preferences"` ✅ 포함
- 다른 3곳(profile-side-nav/accordion/dropdown)은 허브 루트(`/profile/settings`, `/profile/billing`)로 이동 → 기본 탭(preferences/subscription) 적용 → 의도한 UX와 일치.

**4. 탭 상태가 URL에만 있는지**
- settings: `rawTab = searchParams.get("tab")` → `activeTab` 파생 (로컬 state 없음) ✅
- billing: 동일 패턴 ✅
- 로컬 `useState` 탭 변수 0건 확인

**5. 비활성 탭 마운트 여부 점검**
- settings: `{activeTab === "preferences" && <div>...PreferenceForm</div>}` + `{activeTab === "notifications" && <NotificationsSection/>}` → **완전 언마운트**
- billing: 동일. NotificationsSection의 `useState<Settings>` 로컬 상태는 탭 전환 시 리셋됨 (마운트 시 `fetch` 재수행하므로 UX OK)
- 폼 입력 중 탭 전환 시 입력 손실 가능성: PreferenceForm은 settings 모드라 내부적으로 API 저장 방식이면 일시 손실 가능. 다만 **허브 탭 간 이동이 드물고** 원본 페이지들도 독립 페이지였던 걸 고려하면 UX 회귀 아님.

### 개선 권장 (block 아님)

1. **`src/app/(web)/profile/settings/page.tsx:309`** — 알림 토글 knob `bg-white` 고정색
   - 맥락: notification-settings 이식한 원본 그대로. 스위치 knob은 iOS/Android 관습상 흰색이 기본이라 가시성 문제 없음. 엄격한 conventions.md 준수 차원에서 `bg-[var(--color-on-primary)]` 교체 권장. 후속 과제.

2. **`src/app/(web)/profile/billing/page.tsx:250, 425, 749`** — `var(--color-on-primary, #FFFFFF)` fallback 3곳
   - globals.css에 `--color-on-primary: #FFFFFF` 이미 정의됨 → fallback 불필요. 무해하지만 `var(--color-on-primary)` 단순화 가능. (Day 7 리뷰에서도 유사 지적)

3. **billing 모달 ESC 키 미지원** (해지 모달 362-437, 환불 모달 693-760)
   - 백드롭 클릭 O / 취소 버튼 O / **ESC 미구현**. conventions.md 2026-04-19 "플로팅 UI 3종 닫기 필수"
   - 원본 subscription/payments에서도 미구현이었음 → Day 8 회귀 아님. 기존 미준수 순차 정비 대상. 향후 shadcn Dialog로 교체 시 자동 해결.

4. **TabButton 22줄 완전 중복** (settings/page.tsx:159-190 + billing/page.tsx:103-134)
   - PM 결정 #1로 의도적 inline 복제. 3번째 탭 허브 생길 때 `src/components/shared/tab-button.tsx` 승격 고려.

5. **`games-content.tsx:340` tsc 에러** (Day 8 스코프 밖)
   - developer 보고의 이전 세션 미완료 잔존. 현재 game-type-tabs.tsx는 `counts` prop 인터페이스를 export함. 실제 에러가 여전히 있는지는 별도 확인 필요. tester 보고에 "tsc 전체 PASS (에러 0)"이라 **이미 해소됐을 가능성 높음**.
   - **block 아님** (PM 지시대로 언급만).

6. **URL fallback 시 사용자 교정 미발생** — 잘못된 `?tab=xxx` 접근 시 `activeTab`은 "preferences"/"subscription"로 내부 폴백되지만 URL은 `?tab=xxx` 유지.
   - 공유 URL이 invalid일 때 혼란 가능. `useEffect`로 `rawTab && !VALID_TABS.includes(rawTab)` 시 `router.replace`로 URL 교정 권장. 사소한 UX 개선.

### 수정 요청 (block)
**없음.** 6건 전부 후속 처리 가능한 권장 수준. 커밋·머지 진행 가능.

### 칭찬할 점
- **redirect 4파일의 기술적 정확성**: 서버 컴포넌트 + `next/navigation`의 `redirect()` = 3xx 응답 단계에서 즉시 이동 → 클라이언트 JS 파싱·렌더 사이클 없음 → **깜빡임 0**. 최소 코드로 최대 효과.
- **비활성 탭 조건부 렌더 → API 호출 절약**: `{activeTab === 'X' && <Section/>}` + 각 섹션이 useSWR을 내부 보유하는 구조 → 탭 전환 전까지 해당 API 호출이 일어나지 않음. 초기 TTI 단축 + 네트워크 절약.
- **네비 matchPaths 이중 활성**: 구 경로 `/profile/preferences`가 redirect 내기 전 찰나에도 "설정" 메뉴 활성 유지 → 사용자 체감 부드러움. 외부 링크/북마크에서 들어와도 네비 깨지지 않음.
- **URL replace + scroll:false**: 탭 전환이 히스토리에 쌓이지 않아 "뒤로가기"가 직관적(이전 탭이 아닌 이전 페이지로). 스크롤 점프 없음.
- **접근성 완비**: 탭 `role`/`aria-selected`/`aria-controls`/`tabpanel`/`aria-labelledby` 모두 구현. 스크린리더 정확 인지 가능.
- **운영 DB 0변경 + API 경로 0변경**: 기존 `/api/web/profile/subscription` 등 엔드포인트 그대로. 백엔드 회귀 가능성 0.
- **해지·환불 모달 이식 충실**: state + props + 낙관적 업데이트 + SWR mutate + alert 메시지까지 1:1 보존. UX 계약 완전 유지.
- **Day 7 컨벤션 계승**: text-white → `var(--color-on-primary)` 이식 중 자연스러운 정화. 일관된 원칙 적용.
- **주석 품질**: 각 파일 상단 "왜/어떻게" 블록, 결정 근거 주석 풍부. 바이브 코더가 3개월 후 돌아와도 의도 파악 쉬움.

### 작업 로그 제안 (PM이 기록)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-19 | reviewer | M1 Day 8 정적 리뷰 (11파일) — 블록 0건, 권장 6건(bg-white 1/fallback 3/ESC 1/URL 교정 1/TabButton 중복 1) | 🟢 통과 |

---

## 구현 기록 — M2 sticky 카드 (developer)

📝 구현: `/tournaments/[id]` 데스크톱(lg+) 우측 sticky 신청 카드

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/components/tournaments/registration-sticky-card.tsx | 신규 (서버 컴포넌트, Link만) | 신규 |
| src/app/(web)/tournaments/[id]/page.tsx | import 추가 + 메인 컨테이너를 `lg:grid lg:grid-cols-[1fr_320px] lg:gap-6`로 2열 전환, `<main min-w-0>` + `<aside hidden lg:block>` 래핑, `<div className="sticky top-20">` 안에 카드 배치 | 수정 |

상태 분기 (6+가지):
| 상태 | UI |
|------|----|
| 비로그인 | "로그인 후 신청" → `/login?next=/tournaments/[id]/join` BDR Red 활성 |
| 로그인 + 접수중 + 미신청 | "신청하기 →" BDR Red 활성, 클릭 시 `/tournaments/[id]/join` |
| 로그인 + 접수중 + 신청완료 | 버튼 활성 + 하단 success 배지 "N건 신청 완료 — 내 신청 보기" → `/profile/basketball#my-tournaments` |
| 접수 예정(upcoming/draft) | 버튼 비활성 `surface-bright` + "준비중" |
| 진행중(in_progress/live) | 버튼 비활성 + "진행중" |
| 종료(completed/cancelled) | 버튼 비활성 + "종료" |
| 잔여석 0 | 잔여석 라인 옆 빨강 "마감" 배지 |
| D-day 0~7 | D-day 값이 BDR Red로 강조 (마감 임박) |

구현 포인트:
- **서버 컴포넌트**: `"use client"` 없음. 인터랙티브는 Next.js `<Link>` / disabled `<button>`만 사용.
- **데이터 재패칭 0**: page.tsx의 기존 변수(`tournament.*`, `divisionCounts`, `isRegistrationOpen`, `myApplicationsCount`, `session`)를 그대로 props 주입.
- **모바일 영향 0**: 2열 그리드는 `lg:` 접두로만 적용. `<aside>`는 `hidden lg:block`. 하단 플로팅 CTA(L387~ `lg:hidden`) 그대로.
- **min-w-0**: `<main>`에 필수. 내부 테이블/가로스크롤이 grid를 밀어 aside 차지 폭을 침범하는 것 방지.
- **금액 포맷**: `formatFee()` 유틸로 entryFee / divFees 조합 한 군데 처리. min===max 단일값, 다르면 범위, 0은 "무료", 둘 다 null은 "미정".
- **D-day**: `Math.ceil((end - now) / 86400000)`. 양수 → "D-N", 0 → "오늘 마감", 음수 → "마감". 7일 이내(0~7)만 BDR Red.
- **잔여석 fallback**: divCaps 비었으면 `totalCap=null` → `"{signupCount}팀"` 단순 표기(상위 maxTeams까지 내려가진 않음 — page에서 divCaps 없으면 사실상 디비전 UI 자체가 비어서 signupCount 집계만 유효).
- **색상 100% 변수**: `var(--color-card)`, `var(--color-border)`, `var(--color-primary)`, `var(--color-on-primary)`, `var(--color-surface-bright)`, `var(--color-text-muted)`, `var(--color-text-primary)`, `var(--color-success)`. 하드코딩 0. `text-white` 0.
- **아이콘**: Material Symbols Outlined `check_circle`만 사용 (success 배지).
- **border-radius**: `rounded`(4px) — 버튼 컨벤션 준수.

🔧 tsc: PASS (에러 0)

💡 tester 참고:
- 테스트 URL: `/tournaments/[id]` (lg ≥ 1024px에서 우측 카드 확인, < 1024px에선 기존 UI 그대로)
- 6가지 상태 시뮬레이션:
  1. 로그아웃 → 버튼 "로그인 후 신청"
  2. 로그인 + 접수중 대회 (미신청) → "신청하기 →"
  3. 로그인 + 접수중 + 이미 신청된 대회 → 버튼 활성 + 하단 success 배지
  4. `status=upcoming/draft` → 비활성 버튼 "준비중"
  5. `status=in_progress/live` → 비활성 버튼 "진행중"
  6. `status=completed` → 비활성 버튼 "종료"
- 추가: 정원 꽉 찬 대회 → 잔여석 옆 빨강 "마감" 배지. `registration_end_at`이 오늘~7일 이내 → D-day BDR Red 강조. divFees 여러 값 다를 때 "min원 ~ max원" 범위 표기.
- 4탭 전환(개요/일정/순위/대진) 시 sticky 유지되는지 (TournamentTabs는 useState 기반이라 aside는 리마운트 안 됨)
- 모바일(< lg) 하단 플로팅 CTA는 접수중일 때만 노출 — 기존 동작 그대로여야 함

⚠️ reviewer 참고:
- **디렉토리 명명 불일치**: 기존 `src/components/tournament/` (단수) vs 이번에 만든 `src/components/tournaments/` (복수). PM 지시문이 `tournaments`였음. 후속 통일 필요 시 단일 PR로 이관 추천.
- **tournament.status가 null 허용**: 스키마상 nullable이라 props에는 `status: string`으로 받되 page.tsx에서 `tournament.status ?? ""` 전달. 빈 문자열 시 TOURNAMENT_STATUS_LABEL에서 fallback이 status 자체(빈 문자열)로 내려감 — 실무상 발생 거의 없음. 필요 시 상수에 빈 키 처리 추가 권장.
- **tournamentName prop 수신하지만 미사용**: 추후 aria-label/툴팁 용도 대비. `void _tournamentName`로 미사용 경고 회피 중. 불필요하면 제거 가능.
- **success 배지 on-color**: `var(--color-on-primary)`를 success 배경 위에도 재사용. 현재 프로젝트는 on-primary=#FFFFFF인데, 만약 `--color-on-success` 변수를 따로 도입하게 되면 교체 필요.

## 테스트 결과 — M2 sticky 카드 (tester)

| 검증 항목 | 결과 |
|----------|------|
| tsc --noEmit | PASS (에러 0줄) |
| 6가지 상태 분기 | OK (비로그인/접수중/접수중+신청완료/준비중/진행중/종료 모두 코드상 정확) |
| D-day 로직 | OK (`Math.ceil`, >0 → D-N, 0 → "오늘 마감", <0 → "마감", 0~7 강조) |
| 잔여석 계산 | OK (divCaps 합계 > 0 → 표기, =0 → null fallback → signupCount 단일 표기) |
| 참가비 포맷 | OK (무료/단일값/범위/미정 4분기, toLocaleString('ko-KR') 적용) |
| lg 브레이크포인트 | OK (`lg:grid lg:grid-cols-[1fr_320px] lg:gap-6`, `hidden lg:block`, `sticky top-20`) |
| 모바일 CTA 변경 없음 | OK (`lg:hidden fixed bottom-16` 블록 L417-428 유지, 기존 Link/아이콘/스타일 보존) |
| tournament/tournaments 디렉토리 | 불일치 (단수 9파일 기존 관례 vs 복수 1파일 신규) |
| snake→camel 매핑 | OK (`registration_end_at→registrationEndAt`, `entry_fee→entryFee`, `div_fees→divFees`, `div_caps→divCaps` 오타 없음) |
| Decimal 변환 안전 | OK (`tournament.entry_fee ? Number(...) : null` — null/falsy 가드로 NaN 방지) |
| "use client" 없음 (서버) | OK (파일 최상단 import만, Link/disabled button만 인터랙션) |

### 종합 평가
🟢 **PASS** — 블록 이슈 0건. 구현 정확성 · 타입 안전성 · 컨벤션 준수 모두 통과.

### 세부 정적 검증

**1. 6상태 분기 코드 매칭 (registration-sticky-card.tsx L184-221)**
- L184 `!isLoggedIn` → `/login?next=/tournaments/${id}/join` Red 활성 ✅
- L196 `isRegistrationOpen` → `/tournaments/${id}/join` Red 활성 ✅ (신청 완료 여부와 무관하게 "신청하기 →" 유지, 추가 신청 가능 UX)
- L208 else → `disabled` surface-bright + `statusLabel` ✅
- L225 `myApplicationsCount > 0` → 하단 success 배지 Link 조건부 렌더 ✅
- page.tsx의 `isRegistrationOpen` (L164-168) = `regStatuses.includes(status)` + 기간 조건 → `upcoming/draft`는 regStatuses에 없어 false → disabled "준비중" ✅
- `in_progress/live/ongoing/group_stage` → false → "진행중" ✅
- `completed/cancelled` → false → "종료" ✅

**2. D-day 로직 (L33-37, L78-89)**
- KST는 서버/클라 모두 `new Date()` 그대로 사용 — Vercel은 UTC이지만 **밀리초 차이(절대값)**를 쓰므로 타임존 무관 (`getTime()`끼리 빼기) ✅
- `Math.ceil` → 마감 2시간 전이어도 daysLeft=1 (아직 안 지남) → "D-1" 표시. 지나친 초 단위는 음수 → "마감" ✅
- dDayEmphasis: `>= 0 && <= 7` → 7일째까지 강조 (스펙 일치) ✅

**3. 잔여석 (L95-100)**
- `divCaps ?? {}` → `Object.values` → 합계. 빈 객체면 0 → `totalCapFromDivCaps > 0 ? ... : null` → null이면 "{N}팀" 단순 표기 ✅
- divCaps null인 케이스는 자연스럽게 fallback (maxTeams는 이 카드에서 쓰지 않음 — 지시문의 "maxTeams fallback"은 현재 구현에선 단순 "N팀"으로 처리됨)
- `isFull = remaining <= 0` → 빨강 "마감" 배지 렌더 ✅

**4. 참가비 포맷 (L45-61)**
- divFees 여러 개, min=max=0 → "무료" ✅
- divFees 여러 개, min===max → 단일값 `${n}원` ✅
- divFees 여러 개, min!==max → 범위 ✅
- divFees 비었고 entryFee=0 → "무료" ✅
- divFees 비었고 entryFee=양수 → `${n}원` ✅
- 둘 다 null → "미정" ✅
- `toLocaleString("ko-KR")` 정상 사용 ✅

**5. 레이아웃 (page.tsx L368-409)**
- L368: `lg:grid lg:grid-cols-[1fr_320px] lg:gap-6` ✅ (1024px 이상만 2열)
- L371: `<main className="min-w-0">` ✅ (grid 자식 축소 허용 — tournament-tabs 내부 스크롤 테이블이 aside 밀어내는 현상 방지)
- L393: `<aside className="hidden lg:block">` ✅ (모바일 완전 숨김)
- L394: `<div className="sticky top-20">` ✅ (상단 네비 h-16 + 여유 공간)

**6. 모바일 CTA 무변경 (page.tsx L417-428)**
- `fixed bottom-16 left-0 right-0 z-40 px-4 pb-2 lg:hidden` — 모든 스타일 보존 ✅
- `isRegistrationOpen &&` 조건부, `edit_square` 아이콘, `var(--color-primary)` 배경 — 기존 그대로 ✅

**7. snake→camel props 매핑 (page.tsx L395-407)**
| DB 필드 (snake) | props (camel) | 변환 |
|---|---|---|
| `registration_end_at` | `registrationEndAt` | 직접 전달 (Date\|null) ✅ |
| `entry_fee` | `entryFee` | `Number(...) : null` Decimal→number ✅ |
| `div_fees` | `divFees` | `as Record<string, number> \| null` 캐스팅 ✅ |
| `div_caps` | `divCaps` | 동일 ✅ |
| `status` | `status` | `?? ""` null 가드 (상수 fallback은 빈 문자열로 키 없음 → `status`(=빈 문자열) 반환, UI상 버튼 라벨 공란 가능) ⚠️ 에지 케이스 |

**8. apiSuccess 가드 (errors.md 재발 5회 건)**
- 이 경로는 **page.tsx(서버 컴포넌트)에서 Prisma 직접 조회 → RegistrationStickyCard(서버 컴포넌트)로 직접 전달** → apiSuccess/convertKeysToSnakeCase 완전 우회 ✅
- 따라서 "API 응답 camelCase 혼동" 버그 재발 여지 없음. props 인터페이스는 TS 내부 컨벤션(camelCase)대로 안전하게 정의 ✅

**9. 서버 컴포넌트 확인**
- `"use client"` 없음 ✅
- import: `next/link` + 상수만 — 모두 서버 컴포넌트 호환 ✅
- 인터랙티브 요소: `<Link>`(자동 클라이언트 라우팅)와 `disabled <button>`만 — `onClick`/`useState`/`useEffect` 0 ✅

### 발견된 이슈

| 심각도 | 위치 | 내용 |
|---|---|---|
| 🟡 Minor | `src/components/tournaments/` (복수) | 기존 관례는 `src/components/tournament/` (단수, 9파일). PM 지시문이 `tournaments`(복수)라 의도된 분기이지만, `tournament/` 하위 9파일과 일관성 깨짐. 후속 통일(둘 중 하나로 합치기) 권장하나 block 아님. |
| 🟢 Info | `registration-sticky-card.tsx:76` `void _tournamentName` | 현재 미사용. 추후 aria-label용 예약. 향후 구현하거나 제거 결정 필요. block 아님. |
| 🟢 Info | `status=""` (null fallback) 엣지 케이스 | `tournament.status ?? ""` → `TOURNAMENT_STATUS_LABEL[""]`는 undefined → `?? status`로 `""` 반환 → disabled 버튼 라벨 공란. 실데이터에 status=null인 대회가 거의 없어 실무 영향 낮음. 필요 시 상수에 `"": "상태 없음"` 추가. block 아님. |
| 🟢 Info | `registration_closed` 상태 라벨 | 상수에서 "접수중"으로 매핑되는데 `registration_start_at/end_at` 기간 조건이 false이면 disabled 버튼에 "접수중" 표기. 실제로는 "마감"이 더 정확하나, page.tsx `isRegistrationOpen` 계산은 정확하므로 UX만 라벨 혼동. 현재 구현 유지 가능. |

### 수정 요청

| 대상 파일 | 문제 | 권장 수정 | 우선순위 |
|----------|------|----------|---------|
| `src/components/{tournament,tournaments}/` | 단수·복수 디렉토리 혼재 (9:1) | 후속 PR에서 `tournaments`로 통일 또는 `tournament`로 원복 중 택일 | 낮음 (후속) |

### 커밋 준비도
- **커밋 가능 여부**: ✅ 예
- **CI 예상**: ✅ 통과 (tsc 0에러, 신규 파일 add 필수 — errors.md 2026-04-15 "Vercel 빌드 누락" 사례 참고)
- **권장 커밋 메시지**: `feat(tournaments): M2 데스크톱 sticky 신청 카드 도입`
- **주의**: 신규 파일 `src/components/tournaments/registration-sticky-card.tsx`가 `git status`에 `??`로 뜨는지 확인 후 `git add`에 반드시 포함할 것.

## 리뷰 결과 — M2 sticky 카드 (reviewer)

### 종합 평가
🟢 **통과 — 머지 가능** (블록 0건)

신규 컴포넌트 1개 + 부모 레이아웃 2열 전환. 컨벤션 거의 완벽, 서버 컴포넌트 유지, 반응형/sticky/의미론적 마크업 모두 정석. 블록 이슈 없고 권장 5건은 전부 후속 과제 수준. tester 결과와 독립 검증 일치.

### 카테고리별
| 카테고리 | 등급 | 비고 |
|----------|------|------|
| 컨벤션 (색상/아이콘/radius) | 🟢 | `var(--color-*)` 8종 사용, 하드코딩 0, `text-white` 0, Material Symbols `check_circle`만, `rounded`(4px) 준수 |
| 파일명 | 🟢 | kebab-case `registration-sticky-card.tsx` 정확 |
| 디렉토리 위치 | 🟡 | `tournaments/`(복수) — PM 지시문 일치. 단수 `tournament/`(9파일)와의 혼재는 이번 작업이 새로 만든 문제 아님 (tester도 동일 지적) |
| 컴포넌트 재사용 | 🟡 | tournament-hero.tsx L176~198 "신청 완료" 배지와 98% 중복 → 공통화 여지 (non-block) |
| 레이아웃/반응형 | 🟢 | `lg:grid-cols-[1fr_320px]` + `<main min-w-0>` + `<aside hidden lg:block>` 구성 정확. 모바일 하단 CTA(`lg:hidden`) 공존 OK. `min-w-0` 주석 "필수"로 명시까지 |
| sticky 동작 | 🟢 | `sticky top-20` — 기존 `tournament-sidebar.tsx`(L70) / `profile-side-nav.tsx`(L122)와 동일 값. 프로젝트 내 top-20 표준 일관. price-card는 top-24지만 다른 맥락 |
| 접근성 | 🟡 | `<dl>/<dt>/<dd>` 의미론적 마크업 좋음. disabled 버튼 `disabled` 속성 정확. 단 Material Symbols `aria-hidden` 누락 (장식 아이콘) |
| 성능 | 🟢 | `"use client"` 없음 → 서버 컴포넌트 유지. 클라이언트 번들 증가 0. DB 쿼리 추가 0 (page.tsx 기존 변수 재사용) |
| 타입 안전성 | 🟢 | Decimal → Number 변환 page.tsx에서 `entry_fee ? Number(...) : null` 안전. Json 캐스팅은 page.tsx L172~173에서 `(x ?? {}) as Record<string, number>`로 방어됨 |
| 날짜/시간 | 🟢 | 서버 컴포넌트 → 서버 시계 기준 일관. `getTime()` 차이 사용이라 타임존 무관. `Math.ceil`이 "오늘 마감"(daysLeft===0) 스펙과 정확 일치 |
| 디자인 일관성 | 🟢 | Q8 success 배지와 색/아이콘/문구 톤 동일 (`--color-success` + `check_circle` + "N건 신청 완료 — 내 신청 보기") |
| DB/API 영향 | 🟢 | 운영 DB 변경 0, API 경로 0변경, Prisma 쿼리 추가 0 |

### 개선 권장 (non-block)

1. **`registration-sticky-card.tsx:234` — Material Symbols `aria-hidden` 누락**
   - `<span className="material-symbols-outlined text-sm">check_circle</span>`는 장식 아이콘. 스크린리더가 "check_circle" 문자열을 읽지 않도록 `aria-hidden="true"` 권장.
   - page.tsx 모바일 CTA(L424 `edit_square`)도 같은 문제 있음 → 기존 코드, 이번 작업 회귀 아님. 향후 접근성 정비 라운드에서 일괄 처리.

2. **`registration-sticky-card.tsx:225~239` vs `tournament-hero.tsx:176~198` — "신청 완료" 배지 구조 중복**
   - 두 곳 모두: `--color-success` 배경 + `check_circle` + 동일 문구 + `/profile/basketball#my-tournaments` 링크.
   - 차이점: `text-white`(hero) vs `var(--color-on-primary)`(sticky-card) — **이번 신규 쪽이 더 정석 (hero는 구버전 잔재)**. 그리고 `mt-3 inline-flex`(hero) vs `mt-1 inline-flex w-full`(sticky-card).
   - **공통화 제안**: `<AppliedBadge count={...} variant="inline|block" />`로 `src/components/tournaments/applied-badge.tsx` 분리. 그때 hero 쪽 `text-white`도 `var(--color-on-primary)`로 정화.
   - **block 아님**: 지금 중복 수준으로도 동작 OK. 3번째 사용처 생길 때 추출.

3. **`registration-sticky-card.tsx:76` — `void _tournamentName` 미사용 prop**
   - 미래 aria-label 대비로 수신하지만 현재 0 사용. YAGNI 관점에서 제거하거나, 지금 당장 카드 루트 `<div>`에 `aria-labelledby`/`aria-label` 붙여 활용 권장.

4. **`registration-sticky-card.tsx:88` — 7일 강조 경계 재검토 여지**
   - `daysLeft >= 0 && daysLeft <= 7` — 지시문 스펙이 "7일 이내"면 현 구현 정확. "마감 임박"을 D-3로 좁히고 싶으면 튜닝 가능. 스펙 확인만 필요, 블록 아님.

5. **`--color-on-success` 토큰 부재** — conventions.md 2026-04-12 규칙과 부분 충돌
   - "테마 반응형 배경 위 텍스트는 `--color-on-*` 변수 사용" 규칙에 엄밀히 따르면 `--color-success` 배경 위는 `--color-on-success`가 맞음. 현재는 `--color-on-primary` 재사용(둘 다 현재 `#FFFFFF`라 가시적 문제 없음).
   - 토큰 설계 이슈라 이 카드 하나만 고칠 수 없음. globals.css `--color-on-success: #FFFFFF` 추가 → tournament-hero.tsx + 이 카드 동시 교체가 올바른 접근. 별도 토큰 정비 PR로 분리.

### 수정 요청 (block)
**없음.** 5건 전부 후속 처리 가능한 권장 수준. 커밋·머지 진행 가능.

### 칭찬할 점
- **서버 컴포넌트 유지**: 인터랙션 0 (`<Link>` + disabled `<button>`만) → `"use client"` 없이 SSR. 상태 분기 6가지 전부 props 기반으로 서버에서 결정 — 정석.
- **`<main min-w-0>` 디테일**: grid 자식이 내부 가로스크롤 테이블 등으로 튕기며 aside를 밀어내는 함정을 정확히 예방. 이 디테일 놓쳤으면 탭 콘텐츠가 320px aside를 침범했을 것. 주석도 "필수"로 명시.
- **모바일 하단 CTA 공존 설계**: `<aside hidden lg:block>` + 모바일 플로팅(`lg:hidden`) 완전 분리. 두 CTA 동시 노출 구간 없음. 반응형 경계 깔끔.
- **6가지 상태 분기 명확**: 비로그인 / 접수중(미신청) / 접수중(신청완료) / 준비중 / 진행중 / 종료 + 잔여 0 배지 + D-day 강조. 각 분기가 독립적이고 UX 의미가 뚜렷.
- **데이터 재패칭 0**: page.tsx 기존 변수(`divisionCounts`, `myApplicationsCount`, `isRegistrationOpen`, `session`) 그대로 주입. DB 쿼리 추가 0건. 성능 영향 0.
- **`formatFee()` 유틸 분리**: entryFee × divFees 조합 로직 한 군데 집약. min===max 단일값 표기 센스 좋음 ("10,000원 ~ 10,000원" 중복 회피).
- **semantic HTML**: `<dl>/<dt>/<dd>` — 정보 쌍(마감/잔여석/참가비) 표현에 정확한 마크업. 접근성 선택 훌륭.
- **색상 100% 변수**: 8종 `var(--color-*)` 사용. `text-white` 0건. conventions.md 2026-04-12 "테마 반응형 배경 위 on-* 변수" 규칙 완벽 준수 (hero 구버전은 여전히 `text-white` 사용 중 — 이번 신규 코드가 더 정석).
- **스펙 주석**: `Math.ceil` 선택 근거, `min-w-0` 필수 이유, sticky top-20 계산 근거까지 주석 풍부. 바이브 코더가 3개월 후 돌아와도 의도 파악 쉬움.
- **sticky top-20 일관성**: 기존 `tournament-sidebar.tsx`, `profile-side-nav.tsx`와 동일 값 — 프로젝트 전체 sticky top 표준 통일 중.

### tester와의 검증 일치도
- 🟢 컨벤션/서버 컴포넌트/타입 안전/6상태 분기: 일치
- 🟢 디렉토리 혼재 문제: 양쪽 다 🟡로 동일 판단 (block 아님)
- 🟡 tester가 놓친 점: Material Symbols `aria-hidden` 누락, "신청 완료" 배지 중복, `--color-on-success` 토큰 부재 (reviewer가 보완 지적)
- 🟢 tester 특화: `registration_closed` 라벨 혼동 엣지 지적 (reviewer도 동의)

### 작업 로그 제안 (PM이 기록)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-19 | reviewer | M2 sticky 카드 정적 리뷰 (2파일) — 블록 0, 권장 5건(aria-hidden/배지공통화/미사용prop/7일경계/on-success토큰) | 🟢 통과 |

