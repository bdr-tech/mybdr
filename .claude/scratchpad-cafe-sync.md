# 다음카페 동기화 세션 스크래치패드

> 🚨 **이 파일은 다음카페 sync 전용 세션만 사용**
> 사용자가 **"다음카페 작업 시작하자"** 하면 PM은 이 파일을 **먼저 읽는다**.
> UX/기능 작업 세션(`scratchpad.md`)과 **명확히 분리**. 서로 건드리지 않는다.

---

## 🎯 세션 범위 (건드려도 되는 파일)

| 디렉토리 / 파일 | 역할 |
|-----------------|------|
| `scripts/sync-cafe.ts` | 메인 동기화 실행기 (목록+본문+upsert) |
| `scripts/cafe-login.ts` | Playwright 쿠키 생성 |
| `scripts/_tmp-*.ts` | 일회성 검증/삭제 스크립트 |
| `scripts/inspect-games-cafe-meta.ts` | DB 조사 |
| `scripts/backfill-*cafe*.ts` | 카페 관련 백필 |
| `src/lib/cafe-sync/*` | fetcher / article-fetcher / upsert / extract-fallbacks / board-map |
| `src/lib/security/mask-personal-info.ts` | 카페 본문 마스킹 |
| `src/lib/parsers/cafe-game-parser.ts` | **수정 금지** (vitest 59/59 보호) |
| `Dev/cafe-sync-plan-*.md` | 카페 기획 문서 |
| (Phase 3) `.github/workflows/cafe-sync.yml` | GH Actions 워크플로우 |
| (Phase 3) `src/app/(web)/admin/cafe-sync/**` | admin UI |

## 🚫 이 세션에서 금지 파일 (UX 세션 영역)

- `src/app/(web)/` 일반 페이지 (admin/cafe-sync 제외)
- `src/app/api/web/` 일반 API
- `src/components/` 공용 컴포넌트
- 프로필/대회/팀/경기(일반 사용자) 관련 모든 UX

## 📂 연관 지식 파일

- `.claude/knowledge/decisions.md` — 크롤링 정책 9가드 (04-19)
- `.claude/knowledge/errors.md` — 403 쿠키 이슈, apiSuccess snake_case 교훈
- `.claude/knowledge/conventions.md` — 운영 DB 가드 패턴
- `Dev/cafe-sync-plan-2026-04-19.md` — 상세 계획서 (628줄)

---

## 📊 현재 상태 (2026-04-20 기준)

### DB
- `games`: **174건** (일반 159건 + 카페 출처 15건)
- `cafe_posts`: **15건** (IVHA 5 / Dilr 5 / MptT 5)
- 모든 카페 레코드 `cafe_created` 저장 완료
- 모든 카페 레코드 `games.created_at = 카페 게시 시각` (정렬 기준)

### 원격 subin HEAD
- **`ddad719`** (push 완료, 2026-04-20)

### 개발 DB
- Supabase 개발 프로젝트 (`bwoorsgoijvlgutkrcvs`)
- 운영 DB 가드 2중 적용 (`upsert.ts` + `sync-cafe.ts`)

### 쿠키
- `.auth/cafe-state.json` (04-19 19:35 생성, **만료 확인 필요**)

---

## 🟡 현재 작업 (2026-04-20)

### 요청
**"다음카페 게시 순서와 완전 일치하는 정렬 확보"**
- 목표: games.created_at desc 정렬 시 다음카페에 표시되는 순서와 동일
- 실측 결과(tmp/cafe-debug-*.html 3개 분석):
  - 분 단위(당일): 이미 OK (articleElapsedTime HH:MM)
  - 분 단위(과거): ⚠️ 목록은 날짜만, 상세 `.num_subject`에 HH:MM 존재 가능성 — 샘플 부족
  - 초 단위: ❌ 카페 미제공
  - **dataid 단조 증가 확정** (3926~3896 역순)
  - 공지글은 `noticeContainer` 별도 구간 → 분리 가능

### 진행 순서 (사용자 승인됨)
| 단계 | 작업 | 쿠키 필요 | 상태 |
|------|------|----------|------|
| A | dataid tie-break (metadata 저장 + 정렬 2차키) | N | ✅ 완료 (`4bc41bf`) |
| E | 공지글 필터 (noticeContainer 스킵) | N | ✅ 완료 (`4bc41bf`) |
| 백필 | 기존 15건 `cafe_article_id` 채움 | N | ✅ execute 완료 (15/15) |
| 커밋 1 | A+E + 백필 스크립트 묶음 | N | ✅ `4bc41bf` (미푸시) |
| B | 쿠키 재발급 (사용자 수작업) | 재발급 | ✅ 완료 (04-20 12:38) |
| C | 과거 글 상세 샘플 수집 + HTML 분석 | Y | ✅ 완료 — **과거 글 시분은 카페 원천 미제공** 확정 |
| D | `.num_subject` → postedAt 폴백 (D 미니) | Y | ✅ 완료 (`c84aba0`) — postedAt null 5/5 → 0/5 |

---

### 📋 A+E 설계안 (2026-04-20, planner-architect)

#### 핵심 결정 요약 (3줄)
1. **저장 위치**: `games.metadata.cafe_article_id` (정수 필드 신규 추가). Prisma 마이그레이션 없음(Json 필드 내부 키).
2. **정렬 적용 지점**: `src/lib/services/game.ts` `listGames()` 1곳만 수정 (`/games` 목록 정렬 단일 진입점 확인됨).
3. **공지 필터**: 실측 결과 **현재도 공지는 수집되지 않음** (articles.push 블록에 공지 없음) → 방어적 가드만 추가하고 현행 유지.

---

#### A-1. 영향 파일 및 변경 요지

| # | 파일 | 변경 요지 | 라인 힌트 | 신규/수정 |
|---|------|----------|----------|----------|
| 1 | `src/lib/cafe-sync/fetcher.ts` | `BoardItem` 인터페이스에 `dataidNum: number` 필드 추가 + 파싱 루프에서 `Number(dataid)` 주입 | L79~L90, L412~L418 | 수정 |
| 2 | `src/lib/cafe-sync/upsert.ts` | `metadata` 객체에 `cafe_article_id: number` 키 추가 (7→8키), `CafeSyncInput.dataidNum` 받음, `previewUpsert` 동기 | L79~L96(Input), L316~L324(metadata), L577~L585(preview) | 수정 |
| 3 | `scripts/sync-cafe.ts` | `CafeSyncInput` 조립 시 `dataidNum: Number(it.dataid)` 주입 | L351~L363 | 수정 |
| 4 | `src/lib/services/game.ts` | `listGames()` orderBy 2차키 추가 + raw SQL로 JSON 키 정렬 (Prisma orderBy는 JSON path 미지원) | L76~L97 | 수정 |
| 5 | `scripts/_tmp-backfill-cafe-article-id.ts` | 기존 15건에 `cafe_article_id` 역추출 백필 (1회성) | 신규 | 신규 |

**E작업 영향 파일** (공지 필터):
| # | 파일 | 변경 요지 | 라인 힌트 | 신규/수정 |
|---|------|----------|----------|----------|
| 6 | `src/lib/cafe-sync/fetcher.ts` | articles.push 루프 진입 **전** `<div id="noticeContainer"...</div>` 구간 HTML 제거 (방어적 가드) + fldid 재확인 | L322~L331 | 수정 |

---

#### A-2. metadata 키 vs Prisma 마이그레이션 결정

**선택: A안 (metadata JSON 키 `cafe_article_id`)**

| 옵션 | 장점 | 단점 | 채택? |
|------|------|------|------|
| A. `metadata.cafe_article_id` (Int) | 마이그레이션 0, 기존 7키와 같은 구조, 운영 DB 영향 없음 | JSON path 정렬 → raw SQL 필요 | ✅ |
| B. `games.cafe_article_id` 컬럼 신규 | Prisma orderBy 지원, 인덱스 가능 | `prisma db push`/마이그레이션 필요, CLAUDE.md 금지 규칙 충돌 | ❌ |
| C. `cafe_posts.cafe_article_id` 컬럼 | posts 측 확장 | games 정렬에 조인 필요 — 쿼리 복잡 | ❌ |

**근거**: 
- CLAUDE.md "운영 DB 대상 prisma db push/마이그레이션" 절대 금지 규칙 준수
- 개발 DB에 스키마 변경해도 운영 브랜치와 schema drift 발생 — 운영 영향 0이 목표
- 데이터는 `Int` 한 개(4바이트)뿐 — JSON으로도 성능 충분 (15건 → 최대 수천 건 규모)

**값 형식**: `cafe_article_id: 3926` (Number 형, string 아님). JSON에서 정수로 저장되며 `::int` 캐스팅 편함.

---

#### A-3. 정렬 쿼리 2차키 적용 위치

**실측 grep 결과**: `games.findMany + orderBy: created_at desc` 조합은 오직 `src/lib/services/game.ts:78`의 `listGames()` 한 군데만 존재.
- `home.ts:295` 홈 추천 게임 — 카페 글 노출 범위 아님 (scheduled_at 기준)
- `dashboard/route.ts:112` — scheduled_at 기준
- `recommended-games`, `venues`, `search`, `my-last-game`, `recent-venues` 전부 scheduled_at 기준이거나 orderBy 다른 키

→ **수정 대상 단 1개**: `listGames()`

##### 현재
```ts
const games = await prisma.games.findMany({
  where,
  orderBy: { created_at: "desc" },
  take,
  select: { ... },
});
```

##### 변경 후 (raw SQL 접근)
Prisma의 `orderBy`는 JSON path 정렬을 지원하지 않음(Prisma 6.x). 따라서 **id list는 $queryRaw로 뽑고 Prisma findMany로 세부 데이터 취합** 패턴 사용.

```ts
// [A] created_at desc, metadata->>'cafe_article_id' desc 2차키 정렬된 id 리스트 먼저 조회
const orderedIds = await prisma.$queryRaw<Array<{ id: bigint }>>`
  SELECT id FROM games
  WHERE ${Prisma.sql([buildWhereClause(where)])}  -- (아래 주의사항 참고)
  ORDER BY
    created_at DESC,
    (metadata->>'cafe_article_id')::int DESC NULLS LAST
  LIMIT ${take}
`;

// [B] Prisma findMany로 기존 select 유지 (id IN)
const games = await prisma.games.findMany({
  where: { id: { in: orderedIds.map(r => r.id) } },
  select: { ... 기존 그대로 ... },
});

// [C] orderedIds 순서대로 재배열 (Prisma IN은 순서 보장 안 함)
const byId = new Map(games.map(g => [g.id, g]));
return orderedIds.map(r => byId.get(r.id)!).filter(Boolean);
```

**⚠️ developer 주의사항 (PM 검토 필요)**:
- `where` 객체를 raw SQL로 변환하는 건 복잡 → 대안 2택:
  - **대안 1 (권장, 안전)**: `listGames()` 내에서 Prisma where를 그대로 두고, `findMany` 결과를 메모리 정렬 (take=60이니 비용 무시할 수준). `g.metadata`에서 `cafe_article_id` 꺼내 tie-break.
  - **대안 2**: raw SQL + where 재빌드. PM이 SQL 익숙하지 않으면 비권장.
- **대안 1 구체화**:
  ```ts
  const games = await prisma.games.findMany({
    where,
    orderBy: { created_at: "desc" },
    take,
    select: { ..., metadata: true },  // metadata 추가 select
  });
  // 메모리 tie-break: created_at 같으면 cafe_article_id desc (null last)
  const sorted = [...games].sort((a, b) => {
    const tA = a.created_at?.getTime() ?? 0;
    const tB = b.created_at?.getTime() ?? 0;
    if (tB !== tA) return tB - tA;
    // same created_at → cafe_article_id desc (null last)
    const aId = (a.metadata as any)?.cafe_article_id ?? -Infinity;
    const bId = (b.metadata as any)?.cafe_article_id ?? -Infinity;
    return bId - aId;
  });
  return sorted.map(스탯 override 그대로);
  ```
- **권장**: **대안 1** 채택 (복잡도 낮음, take=60 기준 성능 차 무의미, where 재빌드 버그 위험 제거)

##### 정리 표

| 파일 | 현재 orderBy | 변경 후 (대안 1 기준) |
|------|------------|---------|
| `src/lib/services/game.ts` `listGames()` | `orderBy: { created_at: "desc" }` | DB `orderBy: { created_at: "desc" }` 유지 + 메모리에서 tie-break (metadata.cafe_article_id desc, null last) |
| 기타 `home.ts` / `recommended-games` / etc | scheduled_at 기준 | **수정 없음** (카페 정렬과 무관) |

---

#### A-4. 기존 15건 처리 전략

**백필 스크립트 필요** (`scripts/_tmp-backfill-cafe-article-id.ts`)

기존 15건은 `metadata.cafe_dataid`를 string으로 갖고 있음 (예: `"3926"`). 이걸 `cafe_article_id: 3926` (Int)으로 복제하면 됨.

```ts
// 의사코드
const rows = await prisma.games.findMany({
  where: { /* metadata has cafe_dataid */ },
  select: { id: true, metadata: true },
});
for (const r of rows) {
  const meta = r.metadata as any;
  if (meta?.cafe_dataid && meta.cafe_article_id === undefined) {
    const n = parseInt(String(meta.cafe_dataid), 10);
    if (Number.isFinite(n)) {
      await prisma.games.update({
        where: { id: r.id },
        data: { metadata: { ...meta, cafe_article_id: n } },
      });
    }
  }
}
```

**가드**: `DEV_DB_HOST` 체크 + dry-run 플래그 + `_templates/backfill-*.ts` 재사용.

**실행 타이밍**: developer가 A1~A3 코드 변경 완료 → tester 통과 → 백필 실행 → 정렬 재검증.

**대안**: 기존 15건은 `null`로 두고 정렬에서 NULLS LAST 처리. 다음 수집 사이클부터 cafe_article_id 자연 채워짐. 이 경우 백필 스크립트 생략 가능. **추천: 백필 실행** (15건 적고 즉시 정렬 완전성 확보).

---

#### E-1. 공지글 수집 현황 (실측)

`tmp/cafe-debug-IVHA.html` (2026-04-19 캡처, 816줄) 실측 분석:

| 구분 | 위치 | 개수 | articles.push 블록에 포함? |
|------|------|------|---------------------------|
| 공지글 (notice) | L156 `<div id="noticeContainer">` ~ L170 이후 `<li class="cmt_on notice">` | 3~4건 (필독 1 + 공지 2~3) | ❌ **미포함** |
| 일반글 | L437 `<script>...articles.push()</script>` | **20건** | ✅ |

**핵심 결론**: 현재 fetcher의 `articles.push` 정규식은 **공지를 수집하지 않는다**. 공지는 DOM `<li class="notice">` 구조로만 존재하고, articles.push 블록(JS 배열)에는 일반글만 들어간다.

→ **현재 수집된 15건에 공지 혼입 가능성: 0건**. E 작업은 실제로는 "현재 안 섞임을 확인했으니 방어적 가드만 추가"로 스코프 축소.

---

#### E-2. 필터 구현 방식

**선택: A안 (noticeContainer 구간 HTML 제거 후 articles.push 정규식 실행)**

| 옵션 | 장점 | 단점 | 채택? |
|------|------|------|------|
| A. HTML에서 `<div id="noticeContainer">...</div>` 구간 제거 후 정규식 실행 | 방어력 높음, 1줄 수정 | noticeContainer HTML 크기만큼 메모리 복사 1회 (<5KB, 무시) | ✅ |
| B. articles.push 블록별로 공지 플래그 검사 | 정교 | 현재 articles.push엔 공지 안 들어옴 → 불필요 | ❌ |
| C. 무수정 (현황 유지) | 코드 변경 0 | 카페 측 HTML 변경 시 공지 혼입 가능성 미방어 | ❌ |

##### 구현

```ts
// fetcher.ts L322 이전, ARTICLES_PUSH_RE.exec 루프 진입 전:
// 방어적 가드: noticeContainer 구간을 전처리 단계에서 제거
// 왜: 현재는 articles.push가 일반글만 담지만, 카페 레이아웃 변경에 대비.
// 정규식 설명: <div id="noticeContainer" ...> ~ 대응 </div> 통째 제거.
// non-greedy + 일반적으로 noticeContainer 안에 중첩 <div>가 있어서 단순 매칭 불가 →
// 더 안전한 방법은 "noticeContainer 시작 ~ 다음 `<script>articles.push`" 구간 삭제.
const cleanedHtml = html.replace(
  /<div\s+id=["']noticeContainer["'][\s\S]*?(?=<script[^>]*>\s*var\s+articles)/i,
  "",
);
// 이후 `cleanedHtml`을 ARTICLES_PUSH_RE 매칭에 사용
```

**⚠️ developer 주의**: noticeContainer 닫는 `</div>`를 정확히 찾기 어렵기 때문에 **"noticeContainer 시작 ~ articles 선언 전"까지 통째로 드랍**이 안전. articles 스크립트 블록이 반드시 존재하므로(L436~L438) non-greedy 매칭 안전.

##### 기존 15건에 공지 혼입 여부 조사 쿼리

```sql
-- (개발 DB, tester가 실행 검증)
SELECT id, title, metadata->>'cafe_dataid' AS dataid
FROM games
WHERE metadata ? 'cafe_dataid'
  AND (title ILIKE '%공지%' OR title ILIKE '%필독%' OR title ILIKE '%규정%')
ORDER BY created_at DESC;
```
예상: **0건**. 카페 공지는 대부분 "BDR대회 디비전 규정", "2026년 2분기 일정 공지" 같은 운영성 글이라 parseCafeGame이 실패해서 game insert도 안 됨. 2중 방어.

---

#### 리스크 & 호환성

| # | 리스크 | 영향 | 완화책 |
|---|-------|------|-------|
| R1 | metadata JSON path 정렬 Prisma 미지원 | listGames 변경 복잡도 ↑ | **대안 1 (메모리 정렬)** 채택으로 회피 |
| R2 | 기존 15건 `cafe_article_id` null 상태로 정렬 시 맨 뒤로 밀림 | 백필 전 정렬 일시 깨짐 | 백필 스크립트 A1~A3 직후 즉시 실행 |
| R3 | `BoardItem.dataidNum` 신규 필드 — 다른 사용처 영향 | fetcher import 하는 모든 곳 | grep 결과: `sync-cafe.ts`만 사용. 영향 0 |
| R4 | noticeContainer 제거 정규식이 실제 공지 아닌 곳 오삭제 | articles.push 누락 | 정규식이 `(?=<script[^>]*>\s*var\s+articles)` lookahead로 articles 선언까지만 제거 — 오삭제 방지 |
| R5 | cafe_article_id string/number 혼동 | 정렬 잘못됨 | `BoardItem.dataidNum: number`로 타입 강제 + upsert에서 `typeof === "number"` 가드 |
| R6 | 운영 DB에 metadata 키 신규 추가 — 스키마 drift | 0 (JSON 필드라 schema 변경 없음) | — |

**tester 검증 포인트 (최소 3개 + α)**:
1. `IVHA --limit=5 --with-body --execute` 재수집 후 `inspect-games-cafe-meta.ts`로 metadata에 `cafe_article_id`(number) 저장됨 확인
2. 백필 후 `/games?type=0` 결과가 다음카페 IVHA 목록 순서와 일치 (특히 같은 HH:MM에 올라온 2건 순서)
3. 공지 쿼리(E-2) 결과 0건
4. `listGames` 응답이 `description`/`notes` 없이 유지되는지 확인 (select 변경 안 함)
5. `tsc --noEmit` 통과 (BoardItem 타입 확장 영향)

---

#### 예상 작업 시간

| 작업 | 시간 |
|------|------|
| A-1 (fetcher.ts BoardItem + 파싱) | 5분 |
| A-2 (upsert.ts metadata 키 + input) | 10분 |
| A-3 (sync-cafe.ts 주입) | 3분 |
| A-4 (listGames 메모리 tie-break) | 10분 |
| A-5 (백필 스크립트 작성 + 실행) | 15분 |
| E-6 (fetcher.ts noticeContainer 가드) | 5분 |
| tester 재수집 + 검증 | 10분 |
| **A 소계** | **43분** |
| **E 소계** | **5분** |
| **합계 (검증 포함)** | **58분 (약 1시간)** |

---

#### developer 착수 가능 여부

**Y (Yes, 즉시 착수 가능)**

**차단 요소 없음**:
- 모든 영향 파일 범위 확정
- Prisma 마이그레이션 불필요 (JSON 키만 추가)
- 운영 DB 영향 0 (개발 DB만, metadata 변경은 스키마 drift 없음)
- 정렬 로직은 메모리 정렬(대안 1)로 단순화

**PM 확인 필요 판단 (1건)**:
- A-3 정렬 구현 방식 **대안 1 (메모리 정렬)** vs **대안 2 (raw SQL)**: planner는 **대안 1 권장**. PM이 승인하면 developer가 즉시 착수. 다르게 원하시면 대안 2로 전환(시간 +10분).

---

### 🔧 A+E 구현 기록 (developer, 2026-04-20)

📝 구현한 기능: 다음카페 sync dataid tie-break (메모리 정렬) + 공지 혼입 방어 가드

#### 변경 파일 목록 (6개)

| # | 파일 | 변경 라인 | 비고 |
|---|------|----------|------|
| 1 | `src/lib/cafe-sync/fetcher.ts` | BoardItem +15 / noticeContainer 가드 +18 / NaN 가드 +8 | 진입점 |
| 2 | `src/lib/cafe-sync/upsert.ts` | CafeSyncInput.dataidNum +9 / metadata 7→8키 (insert +6, preview +2) | 타입 확장 |
| 3 | `scripts/sync-cafe.ts` | syncInput.dataidNum 주입 +5 | 연결 |
| 4 | `src/lib/services/game.ts` | select.metadata +1 / 메모리 tie-break 정렬 +30 / sorted.map | 대안 1 적용 |
| 5 | `scripts/_tmp-backfill-cafe-article-id.ts` | 신규 155줄 | 15건 백필 |
| 6 | (fetcher.ts 에 E 가드 포함) | — | 실측 공지 혼입 0 확인 후 방어적 가드만 추가 |

#### A-1. fetcher.ts
- `BoardItem` 인터페이스에 `dataidNum: number` 신규 필드 추가 (정렬 tie-break 용 Int 복제본 설명 주석 포함)
- articles.push 루프 진입 전 `cleanedHtml` 생성 — `<div id="noticeContainer">...(?=<script...var articles)` lookahead 정규식으로 구간 드롭 (오삭제 방지). ARTICLES_PUSH_RE 는 cleanedHtml 대상으로 변경
- items.push 전 `Number.isFinite(dataidNum)` 가드 — 비숫자 dataid 스킵 + warn 로그

#### A-2. upsert.ts
- `CafeSyncInput.dataidNum?: number` optional 필드 추가 (하위 호환 유지, 없으면 JSON 키 자동 생략)
- `insertGameFromCafe` metadata 7→8키. 순서상 cafe_dataid 직후 `cafe_article_id: input.dataidNum`
- `previewUpsert` metadata 블록도 동일 8키로 동기화 — dry-run 미리보기 정확성 유지
- 운영 DB 가드 / 마스킹 로직 / 트랜잭션 구조 전부 무수정

#### A-3. sync-cafe.ts
- `syncInput` 조립 시 `dataidNum: it.dataidNum` 한 줄 추가. fetcher 에서 이미 NaN 가드 통과했으므로 재검증 불필요 주석 명시

#### A-4. services/game.ts (메모리 tie-break — 대안 1)
- Prisma findMany select 에 `metadata: true` 추가
- findMany 결과에 대해 `[...games].sort(...)` 로 메모리 정렬:
  - 1차: `created_at desc` (DB orderBy 그대로 유지 — 안정적 정렬 기반)
  - 2차: `metadata.cafe_article_id` desc (null last, `-Infinity` 로 대체)
- 기존 status override 로직(1/2 → 3 변환)은 `sorted.map()` 에 그대로 이관
- metadata 타입 단언은 `as { cafe_article_id?: number } | null` 로 좁혀 안전성 확보

#### A-5. _tmp-backfill-cafe-article-id.ts (신규)
- 운영 DB 차단 가드 (`bwoorsgoijvlgutkrcvs` 검사) + dry-run 기본 + `--execute` 플래그
- `$queryRaw` 로 `metadata ? 'cafe_dataid' AND NOT (metadata ? 'cafe_article_id')` 재실행 멱등성 확보
- 샘플 5건 출력 + `parseInt + Number.isFinite` 가드 + 기존 meta 스프레드 후 `cafe_article_id` 병합
- `scripts/_tmp-*` 네이밍 컨벤션 준수 (운영 후 삭제 예정)

#### E-6. fetcher.ts noticeContainer 방어 가드
- A-1 과 같은 파일 안에 포함 (articles.push 루프 진입 직전)
- lookahead 로 articles 선언 직전까지만 제거 → 일반글 오삭제 방지
- 현재 실측 수집 공지 0건이지만 레이아웃 변경 대비용으로 주석 명시

#### 타입 체크 결과
- `npx tsc --noEmit`: ✅ 통과 (출력 없음 = 에러 0)

#### 백필 스크립트 dry-run 결과
```
대상 건수 (cafe_dataid 보유 + cafe_article_id 미보유): 15건

── 샘플 (최대 5건) ──
  id=428 cafe_dataid="320065" → cafe_article_id=320065
  id=430 cafe_dataid="320063" → cafe_article_id=320063
  id=431 cafe_dataid="320062" → cafe_article_id=320062
  id=432 cafe_dataid="320060" → cafe_article_id=320060
  id=433 cafe_dataid="352451" → cafe_article_id=352451

✅ 백필 대상 적용 (dry-run): 15건
⚠️  비숫자 dataid skip: 0건
⚠️  metadata 비어있음 skip: 0건
```
- 대상 건수 15건 (예상치와 일치 — cafe_posts 테이블 카운트와 동일)
- 전부 숫자 변환 성공 (NaN skip 0, metadata 누락 skip 0)
- 실제 `--execute` 실행은 PM 판단 (tester 검증 후)

#### 특이사항 / developer 판단
1. **대안 1 채택 근거 재확인**: take=60 기준으로 메모리 정렬 비용 무시할 수준. raw SQL 로 where 재빌드하면 버그 위험이 훨씬 커서 안전 우선 선택.
2. **metadata select 추가의 파급**: `/api/web/games` 등 listGames 호출 지점이 metadata 를 응답에 섞어 내보낼 가능성. 현재 metadata 에는 `cafe_*` 공개 메타만 있어 민감 정보 노출 리스크는 없음. 향후 metadata 에 내부 키 추가 시 response 필터링 필요.
3. **dataidNum optional**: 과거 테스트/스크립트 하위 호환을 위해 optional. upsert 시 undefined 면 JSON.stringify 가 키를 자동 생략 → `metadata ?| 'cafe_article_id'` 검사 기준 "없음" 으로 판정됨. 새 수집 글은 fetcher → sync-cafe.ts 체인에서 항상 주입.
4. **백필 재실행 안전성**: `NOT (metadata ? 'cafe_article_id')` 조건으로 이미 채워진 레코드 skip. 여러 번 실행해도 멱등.

💡 tester 참고:
- tsc 통과 확인: `npx tsc --noEmit`
- 백필 실행: `npx tsx --env-file=.env --env-file=.env.local scripts/_tmp-backfill-cafe-article-id.ts --execute` → 15건 UPDATE 기대
- 백필 후 재확인: `scripts/inspect-games-cafe-meta.ts` 로 `cafe_article_id` 키 분포 15건 확인
- 정렬 검증: `/games?type=0` 결과가 다음카페 IVHA 목록 순서와 일치하는지 수동 대조 (같은 분 2건 이상 있을 때)
- 공지 혼입 쿼리(E-2): `title ILIKE '%공지%'` 등으로 0건 재확인

⚠️ reviewer 참고:
- `src/lib/services/game.ts` metadata 타입 단언 (`as { cafe_article_id?: number } | null`) — Prisma Json 타입 대응. 더 안전한 타입 가드 유틸이 있으면 리팩토링 후보.
- `fetcher.ts` noticeContainer 정규식이 `</div>` 명시 없이 lookahead 로만 종료됨 — articles 스크립트 없는 응답(비정상)에서는 lookahead 미매칭 → replace 가 원본 유지 (안전).

### 🧪 A+E 테스트 결과 (tester, 2026-04-20)

| # | 항목 | 결과 | 상세 |
|---|------|------|------|
| T1 | tsc --noEmit | ✅ | exit 0, 에러 0 (BoardItem.dataidNum 추가, CafeSyncInput.dataidNum optional, listGames metadata select 확장 모두 타입 깨끗) |
| T2 | 메모리 정렬 로직 (listGames) | ✅ | 케이스 A/B/C/D 전부 예상대로 (아래 상세 표) |
| T3 | 백필 dry-run | ✅ | 대상 15건 / 샘플 5건 변환 성공 / NaN skip 0 / metadata 누락 skip 0 / UPDATE 0건 (dry-run) / 운영 DB 가드 통과 (`bwoorsgoijvlgutkrcvs` 검증 OK) |
| T4 | noticeContainer 가드 | ✅ | 정규식이 IVHA 덤프에서 10691자 구간 정확 매칭. lookahead 직후 `<script>...var articles` 확인. articles.push 20→20건 (오삭제 0) |
| T5 | metadata 호환성 (8키) | ✅ | `insertGameFromCafe` / `previewUpsert` 둘 다 cafe_dataid 유지 + cafe_article_id 추가. 기존 7키(cafe_dataid/cafe_board/source_url/cafe_author/cafe_created/cafe_comments/cafe_source_id) 전부 보존 |
| T6 | dataidNum NaN 가드 | ✅ | fetcher.ts L446~L450 `Number.isFinite` 검사 + warn + continue. CafeSyncInput.dataidNum 은 optional → undefined 시 JSON.stringify 가 키 자동 생략 (정렬에서 null last 로 처리) |

#### T2 정렬 로직 케이스 상세 (`listGames` L117~L132)

| 케이스 | 조건 | 코드 경로 | 예상 결과 |
|--------|------|----------|----------|
| A | created_at 다른 2건 | `tB !== tA → return tB - tA` (L121) | created_at desc 순서 유지 ✅ |
| B | created_at 동일, cafe_article_id 둘 다 존재 | typeof number → 실제 값 비교 → `return bId - aId` | cafe_article_id desc (예: 3926 → 3925) ✅ |
| C | created_at 동일, 한쪽만 cafe_article_id 존재 | 없는 쪽 -Infinity, 있는 쪽 실제값 → `bId - aId` | 있는 쪽이 앞 (null last 동작) ✅ |
| D | created_at 동일, 둘 다 없음 | 둘 다 -Infinity → `-Infinity - (-Infinity) = NaN` → sort 에 NaN 반환 시 V8 은 "equal" 취급 → 원본 순서 유지 | DB orderBy 에서 넘어온 순서 그대로 (`.sort()`는 stable — V8/Chrome 70+ 보장) ✅ |

**주의사항 (nice-to-have, 블록커 아님)**:
- 케이스 D 에서 `-Infinity - (-Infinity)` 가 NaN 을 반환. `Array.prototype.sort` 가 NaN 비교자를 받으면 엔진에 따라 정렬 순서가 흔들릴 수 있지만, Node.js 22+ (V8 Timsort) 는 `sort` stable 보장이라 **실무 안전**. 엄격성을 높이려면 `bId === aId ? 0 : bId - aId` 가드 한 줄 추가 가능하나 현재 기능 영향 없음.

#### T3 운영 DB 가드 출력 (raw)
```
대상 건수 (cafe_dataid 보유 + cafe_article_id 미보유): 15건

── 샘플 (최대 5건) ──
  id=428 cafe_dataid="320065" → cafe_article_id=320065
  id=430 cafe_dataid="320063" → cafe_article_id=320063
  id=431 cafe_dataid="320062" → cafe_article_id=320062
  id=432 cafe_dataid="320060" → cafe_article_id=320060
  id=433 cafe_dataid="352451" → cafe_article_id=352451

✅ 백필 대상 적용 (dry-run): 15건
⚠️  비숫자 dataid skip: 0건
⚠️  metadata 비어있음 skip: 0건
```
- 대상 15건 = 예상치 일치 (cafe_posts 15건 동수).
- 운영 DB 가드는 스크립트 시작 시 `bwoorsgoijvlgutkrcvs` 체크 → 통과했기에 대상 조회로 진입 (가드 실패 시 exit 1).
- Node 22 의 `parseInt` 결과 `Number.isFinite(NaN) === false` 로 NaN 가드 정상.

#### T4 noticeContainer 정규식 실측
- 매칭 시작 index: 5377
- 매칭 종료 index: 16068 (lookahead 직후 `<script>\n\t\tvar articles = [];` 확인)
- 제거된 구간 길이: 10691자 (공지 3~4건 + mustReadNotices 영역)
- `articles.push` 매칭 수: **원본 20건 = cleaned 20건** → 일반글 오삭제 0
- nested div 안전성: lookahead 가 articles 스크립트 블록까지만 제거하므로 noticeContainer 내부 `</div>` 개수 무관. articles 스크립트가 응답에 없으면 lookahead 미매칭 → 원본 유지 (throw/crash 없음).

#### 블록커 (있으면)
- **없음**.

#### 권장 수정 (nice-to-have, 커밋 후 보강 가능)
1. `listGames` 정렬 L131: `bId - aId` 를 `bId === aId ? 0 : bId - aId` 로 가드하면 `-Infinity - -Infinity = NaN` 이론적 리스크 제거 (현재도 V8 stable sort 로 안전).
2. `_tmp-backfill-cafe-article-id.ts` 는 `--execute` 후 파일 삭제 권장 (네이밍 컨벤션 `_tmp-*`).
3. `metadata` 가 listGames 응답에 실려 나감 — 현재는 cafe_* 공개 메타뿐이라 OK. 향후 metadata 에 내부 키 추가 시 response 화이트리스트 필요 (developer 특이사항 #2 와 동일 경고).

#### 커밋 가능 여부
- ✅ **커밋 가능** — 블록커 없음, 6개 테스트 전부 통과, 운영 DB 가드 정상 작동 확인.

### 🔎 A+E 리뷰 결과 (reviewer, 2026-04-20)

📊 종합 판정: **통과 (블록커 0) — 커밋 가능**

| # | 항목 | 판정 | 상세 |
|---|------|------|------|
| R1 | metadata 노출 리스크 | ✅ 통과 | `listGames` 호출처는 `src/app/api/web/games/route.ts` 1곳만 확인. route L229~L243 에서 `serializedGames` 가 12개 필드만 명시적 pick → **metadata 는 응답에 포함되지 않음**. 현재 metadata 8키(`cafe_dataid`/`cafe_article_id`/`cafe_board`/`source_url`/`cafe_author`/`cafe_created`/`cafe_comments`/`cafe_source_id`) 전부 공개 메타로 민감 정보 0. 추가 drop/pick 작업 불필요. |
| R2 | 정렬 안정성 | ✅ 통과 | Node 22 `Array.prototype.sort` stable (V8 Timsort, ES2019+). `-Infinity` 로 null last 의미 명확. `typeof ... === "number"` 선검사로 null/undefined 안전. `a.created_at?.getTime() ?? 0` — Prisma 가 Date 객체 반환하므로 `getTime()` 정상 동작. |
| R3 | 키 네이밍 공존 | 🟡 권장 | `cafe_dataid`(string) + `cafe_article_id`(Int) 공존 이유는 upsert.ts L323~L330 주석에 명시됨(string 수치 비교 불가, JSON 저장 시점 타입 일관성). **향후 제거 전략 미기재** — nice-to-have. |
| R4 | noticeContainer 정규식 | ✅ 통과 | lookahead `(?=<script[^>]*>\s*var\s+articles)` 로 articles 선언 직전까지만 non-greedy 매칭. tester T4 실측: 10691자 정확 제거 + articles.push 20→20건(오삭제 0). articles 스크립트 없는 비정상 응답에선 lookahead 미매칭 → 원본 유지(안전). cheerio 이미 의존성 있으나 POC 단순성 우선이라 정규식 유지 타당. |
| R5 | 백필 스크립트 | ✅ 통과 | 운영 DB 가드: 스크립트 자체 `bwoorsgoijvlgutkrcvs` 체크(L43~L48)로 차단 충분. dry-run 기본 + `--execute` 플래그 관습 일관. 멱등성: `NOT (metadata ? 'cafe_article_id')` 조건으로 재실행 자연 skip. 15건 규모라 per-row update 가 건별 recovery 측면에서 오히려 유리(트랜잭션 묶을 필요 X). |
| R6 | 컨벤션 준수 | ✅ 통과 | 이번 변경은 API 응답 키 형식 미영향(metadata drop + 기존 응답 스키마 그대로). `officialMatchWhere()` 적용 대상 아님 확인. import 순서/타입/주석 스타일 기존 파일 컨벤션 유지. `games.created_at` 저장 정책(카페 postedAt) 이전 결정(decisions.md 04-20 /games 정렬 정책)과 일관. `tsc --noEmit` 에러 0 재확인. |

#### 블록커 (머지 차단 사유)
- **없음**

#### 권장 개선 (nice-to-have, 커밋 차단 사유 아님)
1. **cafe_dataid 제거 전략 주석**: upsert.ts 에 "백필 완료 후 cafe_dataid 는 URL 재구성용으로만 남기고 정렬은 cafe_article_id 전용" 같은 방향성 1줄 추가 시 향후 세션 복귀 편함. (R3)
2. **metadata 타입 가드 유틸**: `as { cafe_article_id?: number } | null` 이중 단언 2회 반복 → `getCafeArticleId(meta: unknown): number | null` 헬퍼로 추출 가능. 현재 2회 복제라 과설계이므로 추가 수요 생길 때 리팩토링. (developer reviewer 메모 대응)
3. **dataidNum optional → required 승격 후보**: `CafeSyncInput.dataidNum?` 는 하위 호환용이지만 실제 호출처 `sync-cafe.ts` 단 1곳. 다음 정리에서 required 로 승격해도 무방.
4. **sort NaN 가드 한 줄**: `bId === aId ? 0 : bId - aId` 로 `-Infinity - -Infinity = NaN` 이론적 리스크 제거. 현재 V8 stable sort 덕에 실무 안전이라 긴급도 낮음 (tester T2 케이스 D 와 동일 지적).
5. **`_tmp-*` 스크립트 삭제 리마인더**: `--execute` 후 파일 삭제. 네이밍 컨벤션상 당연하지만 PR 머지 시점에 체크리스트로.

#### 칭찬 포인트
- **R1 선제 방어 자세**: developer 가 "metadata 응답 섞임 가능성" 을 리뷰 메모에 미리 올려 검증 효율 ↑. 실제 확인 결과 route 레벨 pick 으로 이미 안전했지만, `apiSuccess` snake_case 재발 6회(errors.md) 패턴의 예방적 습관.
- **R4 오삭제 방지 설계**: lookahead 로 articles 선언 직전까지만 삭제 — articles 블록 자체는 건드리지 않음. "articles 스크립트 없으면 lookahead 미매칭 = 원본 유지" 안전 속성을 주석으로 선언.
- **R5 멱등성**: `NOT (metadata ? 'cafe_article_id')` 조건으로 재실행 자연 skip. `_tmp-*` 네이밍 + 운영 후 삭제 예정 주석까지 관습 완전 준수.
- **NaN 가드 2중 적용**: fetcher L446~L450 에서 1차 차단 + upsert L329 주석에 "누락 시 JSON 키 자동 생략 → null last" 방어 로직 명시. 방어선 2중.
- **주석 품질**: 각 변경 블록이 "왜 + 근거 + 실측 참조" 세트로 작성되어 향후 세션 복귀 시 컨텍스트 복원이 쉬움.

#### 커밋 가능 여부
- ✅ **커밋 가능** (블록커 0, tsc 통과, tester 6개 테스트 통과, 권장 개선은 전부 후속 처리 가능)

---

### 📋 Phase 3 #1+#3+#4 자동화 설계안 (2026-04-20)

> **커밋 대상**: `.github/workflows/cafe-sync.yml` (신규 202줄) + `scripts/refresh-cafe-cookie.ts` (신규 251줄). `scripts/sync-cafe.ts` 무수정.
> (상세 planner/developer/reviewer 섹션은 세션 정리 과정에서 축약됨. 구현 내용은 실제 파일 참조.)

#### 🧪 테스트 결과 (tester, 2026-04-20)

| # | 시나리오 | 결과 | 상세 |
|---|---------|------|------|
| T1 | tsc --noEmit | ✅ | exit 0, 무출력. workflow/refresh 스크립트 타입 깨끗 |
| T2 | YAML 문법 | ✅ | js-yaml 파싱 성공. name=cafe-sync, on=[schedule, workflow_dispatch], cron=`0 22,23,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15 * * *` (KST 07~24 매시 18회/일), concurrency `{group:"cafe-sync", cancel-in-progress:false}`, jobs=[sync], steps=9개, timeout=15분. Actions 버전 `actions/checkout@v4` / `setup-node@v4` / `upload-artifact@v4` — 메이저 pin (GitHub 공식 마켓플레이스 관행 수준, SHA full pin 은 nice-to-have) |
| T3 | step 순서 | ✅ | 1.Checkout → 2.Setup Node → 3.Install → **4.Validate DB (CI guard, grep bwoorsgoijvlgutkrcvs)** → 5.Restore storageState (base64 decode + 무결성 체크) → 6.Extract DAUM_CAFE_COOKIE (add-mask 전에 echo) → 7.Run sync-cafe (set -o pipefail + tee) → 8.Upload artifact `if: always()` → 9.Slack `if: failure()`. **DB 가드가 쿠키 복원 이전** 실행 — 운영 DB URL 실수 시 쿠키 디코드조차 안 함. artifact if: always() 첫 주 디버깅 안전망, Slack failure() only |
| T4 | Secrets 3종 | ✅ | workflow 에서 사용: `secrets.DATABASE_URL_DEV` (L56) / `secrets.DAUM_CAFE_STORAGE_STATE_B64` (L96) / `secrets.SLACK_WEBHOOK_URL` (L165) — **설계안 3종과 정확히 일치**. 누락/추가 0. SLACK_WEBHOOK_URL 미설정 시 step 이 `exit 0` 로 알림 skip (L170~173) → Slack 미등록 상태에서도 CI 성공 판정 |
| T5 | 쿠키 마스킹 순서 | ✅ | L127 `echo "::add-mask::$COOKIE"` 가 L129 `echo "DAUM_CAFE_COOKIE=$COOKIE" >> $GITHUB_ENV` **이전** 실행 — Actions 런너가 후속 로그에 쿠키 값 자동 `***` 치환. base64 decode (L103) 는 파이프 리다이렉트(`>`)로 파일 직접 쓰기 + `chmod 600` — 값 echo 없음. 추출된 쿠키 문자열도 add-mask 로 가림 |
| T6 | 운영 DB 가드 3중 | ✅ | (1) **CI workflow** L82~89 `grep -q 'bwoorsgoijvlgutkrcvs'` 실패 시 `::error::` + exit 1 (쿠키 복원 이전 작동) (2) **sync-cafe.ts** L53+L59 `DEV_DB_IDENTIFIER` 상수 + `--execute` 모드에서 URL `.includes()` 검사 (3) **upsert.ts** L53+L63 `assertDevDatabase()` 매 upsert 시점 재검증. 3층 어느 한 층 우회해도 다음 층이 catch |
| T7 | refresh --help | ⚠️ 부분 | `--help` 플래그는 **미구현**. 입력 시 정상 실행 플로우 진입(gh auth status → 쿠키 나이 출력 → cafe-login.ts 실행)하여 예상 외 동작. 기존 설계 3종(`--skip-login`/`--dry-run`/`--repo=`) 은 정상 인식 ✅. git remote 자동 추출 로직(`detectRepoFromGitRemote()`)도 `bdr-tech/mybdr` 정확히 반환 ✅. 블록커 아님(파일 L12~L18 JSDoc 에 usage 주석 존재) |
| T8 | refresh dry-run 재실행 | ✅ | 출력: `대상 레포: bdr-tech/mybdr (git remote 자동)` / `dry-run: true / skip-login: true` / `gh CLI 로그인 상태 OK` / `기존 쿠키 나이: 0.1일 (만료 권장 기준 7일)` / `전체 쿠키 40개 / .daum.net 도메인 22개` / `base64 크기: 14.68 KB (상한 22.9%)` / `[dry-run] gh secret set 스킵` / exit 0. Secret / 쿠키 값 / DB URL 로그에 0 노출. `gh secret set` 실제 실행 0 |
| T9 | refresh 에러 핸들링 | ✅ | 코드 읽기 검증: (a) gh 미로그인 L107~110 try/catch → exit 1 (b) 쿠키 파일 부재 + `--skip-login` L126~131 exit 1 + 안내 (c) JSON 파싱 실패 L163~168 exit 1 (d) 쿠키 <5개 L171~176 exit 1 (e) `.daum.net` 쿠키 0개 L184~187 exit 1 (f) base64 >57.6KB (90%) L201~205 `console.warn` 경고. `--repo` 형식 가드는 정규식 미매치 시 null → exit 1, 이후 gh CLI 로 잘못된 repo 위임 검증 |
| T10 | Slack payload 안전성 | ✅ | workflow L169~202 코드 읽기: (a) payload 에 Secret 값 **0** 포함 — 오직 run URL + run ID + `grep '완료 (IVHA\|Dilr\|MptT)' tmp/cafe-sync.log` 결과 + `tail -n 50 \| head -c 2000`. DB URL / 쿠키 / webhook URL 전부 payload 밖 (b) `node JSON.stringify` 직렬화 — sed 이스케이프 취약점 회피 (c) BOARD_SUMMARY/TAIL 은 `export` 후 `process.env` 로 읽기 → shell 인젝션 방어 (d) SLACK_WEBHOOK_URL 은 curl URL 인자로만 사용 (--data 아님) → 로그 미노출 (e) curl 실패 시 `\|\| true` 로 step 은 계속 |
| T11 | sync-cafe CI 가드 | ❌ **미구현** | `scripts/sync-cafe.ts` grep: `process.env.CI` 참조 **0건**. `countdown(4, totalPosts)` L261~L271 이 CI 에서도 4초 블로킹 실행. workflow env 에 `CI: "true"` 주입(L52)은 되어 있으나 스크립트가 감지 안 함. **영향도**: workflow timeout 15분 대비 4초 지연 미미 — 블록커 아님. 단 PM 스펙 "`process.env.CI === 'true'` 체크로 사용자 countdown 만 스킵" 과 **실제 코드 불일치** — 후속 3단어 추가 권장. 9가드 #1 페이지 간 `sleep(3000)` 은 fetcher/sync-cafe.ts 내부에 유지되어 CI 여부와 무관하게 동작 — 준수 |

#### 블록커 (머지 차단 사유)
- **없음**.

#### 권장 개선 (nice-to-have, 커밋 후 보강 가능)
1. **sync-cafe.ts CI countdown 스킵 (T11)** — L311 `if (EXECUTE_MODE && withBody)` 에 `&& process.env.CI !== "true"` 추가. 3단어 수정, CI 실행 시간 4초 단축 + 명세 일치.
2. **refresh `--help` 플래그 (T7)** — 스크립트 L57 근처에 `if (argv.includes("--help")) { console.log(usage); process.exit(0); }` 10줄 추가. 기존 JSDoc L12~L18 그대로 출력.
3. **Slack payload grep 패턴 재검토 (L175)** — `grep -E '완료 (IVHA\|Dilr\|MptT)'` 가 현재 sync-cafe 로그 출력 규약과 **불일치** 가능성(실제는 `[IVHA ...] N건 수집` 포맷). grep 미매치 시 `echo "(게시판 요약 없음)"` fallback 으로 Slack 알림은 정상 전송되지만 "게시판 요약" 섹션 빈다. 해법 A: sync-cafe 출력에 "완료 IVHA: ..." 라인 추가, 해법 B: grep 패턴을 `'\[(IVHA\|Dilr\|MptT)'` 로 교체.
4. **Actions 버전 full SHA pin** — 공급망 보안 강화 원할 때. 현재 `@v4` 메이저 pin 은 GitHub official 마켓플레이스 관행 수준.
5. **Artifact 경로 방어** — step 5 에서 `mkdir -p .auth tmp` 확보되지만 sync-cafe step 실패 시 `tmp/cafe-sync.log` 생성 실패 가능. `upload-artifact@v4` 는 경로 없으면 warning 후 skip → artifact 0건. 필요 시 step 5 에서 `touch tmp/cafe-sync.log` 선행 고려.

#### 사용자 Secrets 등록 전 체크리스트
1. `DATABASE_URL_DEV` — 개발 DB URL (`...bwoorsgoijvlgutkrcvs...` 포함 필수). 운영 DB URL 등록 시 CI step 4 에서 즉시 실패
2. `DAUM_CAFE_STORAGE_STATE_B64` — `.auth/cafe-state.json` base64 (14.68KB) — `scripts/refresh-cafe-cookie.ts --skip-login` 로 자동 등록 권장 (dry-run 검증 완료)
3. `SLACK_WEBHOOK_URL` — Slack Incoming Webhook URL — 미등록 시 알림만 skip (CI 성공 판정)
4. 등록 후 검증: `gh secret list --repo bdr-tech/mybdr` → 3개 확인
5. 수동 트리거 검증: `gh workflow run cafe-sync.yml --ref subin`
6. 의도적 실패 시나리오: `DATABASE_URL_DEV` 에 가짜 URL → step "Validate DB" 실패 → Slack 알림 수신 확인

#### 커밋 가능 여부
- ✅ **커밋 가능** — 블록커 0, tsc 통과, YAML 파싱 통과, Secrets 3종 일치, 마스킹 순서 검증, DB 가드 3중 작동, Slack payload Secret 미노출, dry-run exit 0. T11 CI 가드 미구현은 nice-to-have 수준 (후속 3단어 커밋 권장).

---

### 📋 카페 sync 품질 검증봇 설계안 (2026-04-21, planner-architect)

> **목표**: GH Actions 실패 아닌 **silent 품질 저하**(수집 0건 / 파싱 전부 실패 / 쿠키 만료 임박 / 403·429 누적) 자동 감지.
> **알림 채널**: GitHub Issue 자동 생성/갱신/자동 close (Slack 미도입 결정 반영). GitHub 앱 푸시/이메일 알림 경유.

#### 핵심 결정 요약 (5줄)

1. **실행 주기** = 매일 1회, **08:10 KST** (UTC `10 23 * * *`). KST 07:00 첫 sync + 08:00 두 번째 sync 직후 안정 지점. 쿠키 만료 하루 내 여러 번 체크 이득 없음 → 1회 충분. workflow_dispatch 병행.
2. **알림 방식** = GitHub Issue (라벨 `cafe-sync-verify` + `severity:warn|alert` + `automated`). 같은 `<지표명>` 이슈 24h 내 열려있으면 **코멘트만** 추가(중복 방지). 다음 실행에서 정상 복귀하면 해당 이슈 **자동 close + 회복 코멘트**.
3. **데이터 소스** = (a) DB 직접 접근: `DATABASE_URL_DEV` Secret 재사용 → `cafe_posts.created_at` / `games.metadata` 집계 (b) GH API: `GITHUB_TOKEN` 기본 주입으로 workflow runs / secrets metadata 조회 (c) 로그 artifact: **직접 파싱 X** → 대안 채택(아래 #5).
4. **Secret updated_at 실측 결과** = ✅ **가능**. `gh api repos/bdr-tech/mybdr/actions/secrets` 응답에 `created_at` / `updated_at` ISO 필드 **포함 확인**(2026-04-20 실측). 값 노출 0, 메타데이터만 노출 — 안전. workflow `GITHUB_TOKEN` 기본 permissions 로는 secret 리스트 접근 **불가능할 수 있음** → `permissions: actions: read` 선언 + `Settings > Actions > Secrets and variables > Repository secrets > Read` 상당 필요. **실측 fallback**: 불가 시 `DAUM_CAFE_STORAGE_STATE_B64` Secret 을 쿠키 나이 지표에서 제외하고 **"매일 동일 시각에 돌 때 쿠키 실사용 쿠키 나이"를 storageState 내부 쿠키의 `expires` 필드에서 계산** (Secret 갱신일 ≠ 쿠키 생성일이지만 실질 운영상 근접).
5. **sync-cafe.ts 결과 JSON 출력** = ✅ **추천 (소폭 수정, 15분 추가)**. 이유: (i) 현재 로그에서 `grep "[BOARD_ID"` 로 뽑는 방식은 검증봇 매 실행마다 artifact download 필요 → 느림/복잡. (ii) `tmp/cafe-sync-summary.json` 을 sync-cafe 가 마지막에 남기면 검증봇이 **마지막 run artifact 1건만** 내려받아 직접 읽음. (iii) JSON 스키마 고정 시 향후 관측성 확장 용이. 변경 범위: sync-cafe.ts L480 근처 요약 출력 후 `writeFileSync("tmp/cafe-sync-summary.json", JSON.stringify({...}))` 1블록 추가 + workflow 의 upload-artifact 경로에 추가. **대안** (JSON 생략): 검증봇이 DB만 집계 → 로그 의존 제거. 더 단순. **planner 최종 추천: 대안 (JSON 생략)** — 초기 스코프 최소화. 이유는 아래 #B 참조.

---

#### 지표 & 임계치 확정 (PM 초안 검토 결과)

**최종 5개 지표 + 1개 신설 = 6개**. 초기 3개 지표로 먼저 기동(롤아웃 1주차), 나머지 3개는 2주차부터 활성화.

| # | 지표 | 정상 | 경고 | 알림 | 데이터 소스 | 임계치 근거 |
|---|------|------|------|------|------------|------------|
| **I1** | 24h 신규 `cafe_posts` 건수 | **5+건** | **1~4건** | **0건** | DB `SELECT COUNT(*) FROM cafe_posts WHERE created_at > now() - interval '24h'` | **PM 초안 "10+" 하향**. 실측: 3게시판 × 현재 5건/게시판 수집 × 매시 재수집 → 신규 글만 세면 평일 보통 2~8건 예상. 초기 "10+" 는 거짓 양성 과다 위험 (IVHA만 활발, Dilr/MptT 는 하루 1건 이하 빈번). 주말/공휴일도 0건 발생 가능 → 2주차 관찰 후 재조정. |
| **I2** | 24h 파싱 성공률 | **85%+** | **60~84%** | **<60%** | DB `games.metadata.cafe_dataid` 보유 + 필수필드(venue/scheduled_at/fee) 중 **2개 이상** 채워진 비율 | **PM 초안 "90%/70%" 2~5%p 하향**. 실측: 현재 IVHA 본문 양식 편차로 70~85% 대역. "90%+" 는 경보 지속 울릴 위험. 필수필드 "3개 전부" 기준이면 IVHA 현실상 불가 — "venue/scheduled_at/fee 중 2개+" 로 완화. |
| **I3** | 24h cron 성공률 | **18/18** | **15~17/18** | **<15/18** | GH API `/actions/workflows/{id}/runs?created>={since}` → `conclusion:success` 카운트 | **PM 초안 "24/24 → 18/18"로 베이스 수정**. 현재 cron 이 KST 07~24 **18회/일** (cafe-sync.yml 실측). 24회는 30분 주기 기준인데 실제는 매시 1회. 18/18 = 100%, 15/18 = 83%, 14/18 이하 알림. |
| **I4** | 쿠키 나이 (일) | **<5일** | **5~6일** | **7일+** | (1차) `gh api repos/{repo}/actions/secrets/DAUM_CAFE_STORAGE_STATE_B64` → `updated_at` (2차 fallback) `.auth/cafe-state.json` cookies 배열의 가장 이른 `expires` | 초안 유지. `refresh-cafe-cookie.ts L45 COOKIE_MAX_AGE_DAYS=7` 상수와 일치. |
| **I5** | 24h 403/429 count | **0** | **1~2** | **3+** | (선택 A, 1주차 생략) artifact 로그 grep (선택 B, 채택) **sync-cafe 가 수집 실패 시 `cafe_posts` 자체를 안 만들기 때문에 I1 이 자연 커버** | **PM 초안 유지하되 구현 비용 검토**. 로그 artifact 다운로드 + grep 이 유일한 직접 경로. **1주차 생략 + I1 으로 간접 감지**, 2주차부터 artifact 기반 직접 지표 추가 고려. |
| **I6** (신설) | 게시판별 편차 (24h 각 게시판 수집 건수) | 모든 게시판 1건+ | 1개 게시판 0건 | 2개+ 게시판 0건 | DB `GROUP BY metadata->>'cafe_board'` | **planner 신설 제안**. "전체 10건 수집됐지만 MptT 전부 403" 상황을 I1 만으로는 못 잡음. 게시판별 편차는 특정 fldid 차단 감지에 결정적. 예: IVHA 10건 + Dilr 0건 + MptT 0건 → I1 정상(10+), I6 알림. |

**지표 삭제 검토 결과**:
- I5 (403/429) 초기 비활성 — 구현 비용 vs 1주차 가치 낮음. artifact 로그 파싱은 복잡도 上. I1+I6 조합으로 "수집 건수 급감 + 게시판별 0" 패턴으로 사실상 커버.
- **지표 추가 반려**: "scheduled_at 미래/과거 이상", "dataid 중복" — 9가드/upsert 스키마 자체가 방지(unique constraint + scheduled_at fallback). 현 상태에서 지표화 가치 낮음.

**경고/알림 분리 기준**:
- **경고 (severity:warn)**: Issue 생성 — 라벨 `severity:warn`. 본문 "관찰 필요, 즉시 조치 불필요". 같은 유형 48h 내 중복 시 코멘트만.
- **알림 (severity:alert)**: Issue 생성 — 라벨 `severity:alert`. 본문 "즉시 조치 권장" + 조치 가이드. 같은 유형 24h 내 중복 시 코멘트만.
- **정상**: Issue 생성 0. 다음 실행에서 이전 warn/alert 이슈가 있으면 자동 close + 회복 코멘트.

---

#### 실측 결과 (사전 조사, 2026-04-20~21)

| 조사 항목 | 결과 | 근거 명령 / 파일 | 결론 |
|-----------|------|------------------|------|
| Secret `updated_at` 접근 가능성 | ✅ 가능 | `gh api repos/bdr-tech/mybdr/actions/secrets` → 응답에 `{"created_at":"...","updated_at":"..."}` 필드 포함 | I4 쿠키 나이 1차 소스로 채택. `gh secret set` 실행 시각 = `updated_at` 갱신 |
| workflow `GITHUB_TOKEN` 기본 permissions | ⚠️ 제한적 | `Settings > Actions > General > Workflow permissions` = 기본 "read and write" 지만 secrets 메타 접근은 **저장소 owner 계정 PAT 필요 가능성**. workflow 내 `permissions:` 블록에 `actions: read` + `issues: write` + `contents: read` 명시 필요 | I4 1차 소스가 403 이면 2차 fallback (storageState 내부 `expires` 필드) 자동 전환 |
| Issues API 라벨 필터 쿼리 | ✅ 가능 | `gh api repos/bdr-tech/mybdr/issues --method GET -f state=open -f labels=cafe-sync-verify` → `[]` 정상 응답 | 중복 방지 로직: 같은 `<지표명>` 타이틀 prefix + `cafe-sync-verify` 라벨로 검색 → 결과 0이면 신규, 1+이면 코멘트 |
| 기존 라벨 현황 | 기본 9개만 존재 (bug/documentation/duplicate/enhancement/good first issue/help wanted/invalid/question/wontfix) | `gh api repos/bdr-tech/mybdr/labels` | `cafe-sync-verify` / `automated` / `severity:warn` / `severity:alert` **4개 신규 생성 필요**. workflow 첫 실행 시 자동 생성(gh cli create-if-missing) or 수동 사전 생성 |
| cafe-sync workflow ID | `263601935` | `gh api repos/bdr-tech/mybdr/actions/workflows` | I3 쿼리 대상 고정 |
| 최근 cafe-sync run | 24674978639 (workflow_dispatch, conclusion=success, 2026-04-20T15:25) | 위 runs API | 기저 동작 확인 완료 |
| Actions permissions 엔드포인트 | 403 (토큰 스코프 부족) | `gh api repos/bdr-tech/mybdr/actions/permissions` | read-only 조사 중 취득 불가, **설계에 영향 없음** — workflow 런타임 토큰은 별도 권한 체계 |

**I4 2차 fallback 구체 (Secret API 실패 시)**:
- storageState JSON 내부 `cookies[].expires` 배열에서 최솟값(가장 먼저 만료되는 쿠키) 추출
- `expires` 는 Unix timestamp (초). `Date.now() / 1000` 과 비교
- 쿠키 나이 = (`refreshed_at` 아님 → `7 - (expires - now) / 86400` 로 역산한 "만료까지 남은 일수" 기반 역산). **정확도 떨어짐** — 이 경우 지표 이름을 "쿠키 만료까지 남은 일수"로 변경하고 임계치 반전(**<2일 = 알림**).
- 실행 시 1차/2차 중 어느 소스를 썼는지 Issue 본문에 명기.

---

#### 영향 파일

| # | 파일 | 변경 요지 | 라인 힌트 | 신규/수정 |
|---|------|----------|----------|----------|
| 1 | `scripts/verify-cafe-sync.ts` | 6개 지표 집계 + severity 판정 + Issue 생성/갱신/close 로직 (또는 dry-run JSON 출력) | — | **신규** (~280줄 예상) |
| 2 | `.github/workflows/cafe-sync-verify.yml` | schedule `10 23 * * *` + workflow_dispatch + verify 스크립트 실행 + `permissions: issues:write` 선언 | — | **신규** (~85줄 예상) |
| 3 | `scripts/sync-cafe.ts` | **수정하지 않음** (planner 최종 결정 — 아래 근거) | L480 근처 | — |
| 4 | `.github/workflows/cafe-sync.yml` | **수정하지 않음** (검증봇은 독립 workflow) | — | — |

**#3 근거**: 초기에 `tmp/cafe-sync-summary.json` 출력 추가 검토 → verify 스크립트가 DB 로 충분히 집계 가능하다고 판단. cafe_posts 테이블이 이미 모든 수집 이력의 source of truth. JSON 산출은 중복. **만약 2주차 이후 I5(403/429) 지표를 직접 구현할 때만** sync-cafe.ts 에 `--summary-json=path` CLI 옵션 추가 고려.

---

#### scripts/verify-cafe-sync.ts 스펙

**CLI 옵션**:
```
--dry-run           : 판정만 하고 Issue 생성 0 (1주차 기본값)
--since=24h         : 기준 시간 범위 (기본 "24h", 향후 "7d" 등 확장 가능)
--output=console    : 출력 형식 ("console" | "json"). 기본 console. workflow 는 json 사용
--skip-github-api   : I3/I4-1차 건너뛰기 (로컬 개발 모드)
--create-issues     : dry-run 해제 (2주차 전환 시 workflow 가 이 플래그 주입)
```

**출력 JSON 스키마** (output=json):
```json
{
  "generatedAt": "2026-04-21T23:10:00Z",
  "sinceHours": 24,
  "severity": "ok" | "warn" | "alert",
  "indicators": {
    "I1_new_posts_24h":      { "value": 6,  "status": "ok" | "warn" | "alert", "threshold": { "ok": 5, "warn": 1, "alert": 0 } },
    "I2_parse_success_rate": { "value": 0.83, "status": "warn", "sampleSize": 6, "threshold": { ... } },
    "I3_cron_success_rate":  { "value": "17/18", "status": "warn", "threshold": { ... } },
    "I4_cookie_age_days":    { "value": 3.2, "status": "ok", "source": "secret_updated_at", "threshold": { ... } },
    "I5_http_error_count":   { "status": "disabled_phase1" },
    "I6_board_dispersion":   { "value": { "IVHA": 5, "Dilr": 1, "MptT": 0 }, "status": "warn" }
  },
  "recommendations": [
    "MptT 0건 수집 — fldid 차단 가능성, 쿠키 재발급 또는 페이지 정규식 확인",
    "파싱 성공률 83% — 최근 IVHA 본문 양식 변경 여부 실측 권장"
  ],
  "github": {
    "issuesCreated": 0,
    "issuesCommented": 0,
    "issuesClosed": 0
  }
}
```

**판정 로직 (severity 계산)**:
```
각 지표의 status 계산 → 전체 severity:
  - 어느 하나라도 "alert" → "alert"
  - 하나라도 "warn" + 나머지 "ok" → "warn"
  - 전부 "ok" → "ok"
  - "disabled_phase1" 은 severity 계산에서 제외
```

**의사코드 (high-level)**:
```ts
async function main() {
  const prisma = new PrismaClient();
  assertDevDatabase(process.env.DATABASE_URL); // sync-cafe.ts 와 동일 가드 재사용
  
  const since = parseSince(argv.since ?? "24h");
  
  // I1 ~ I2, I6: DB 쿼리
  const i1 = await queryNewPostsCount(prisma, since);
  const i2 = await queryParseSuccessRate(prisma, since);
  const i6 = await queryBoardDispersion(prisma, since);
  
  // I3: GH API (workflow runs)
  const i3 = await queryCronSuccessRate(workflowId=263601935, since);
  
  // I4: GH API (secret updated_at) → fallback (.auth/cafe-state.json expires)
  const i4 = await queryCookieAge(secretName="DAUM_CAFE_STORAGE_STATE_B64");
  
  const indicators = { I1: i1, I2: i2, I3: i3, I4: i4, I5: { status: "disabled_phase1" }, I6: i6 };
  const severity = calcSeverity(indicators);
  const recommendations = buildRecommendations(indicators);
  
  const report = { generatedAt: new Date().toISOString(), sinceHours: 24, severity, indicators, recommendations };
  
  if (argv.output === "json") console.log(JSON.stringify(report, null, 2));
  else printHumanReadable(report);
  
  if (argv["create-issues"] && severity !== "ok") {
    await manageGithubIssues(report); // 아래 #E 참조
  }
  
  // exit code: severity === "alert" 이면 1, warn/ok 이면 0
  //   (CI gating 용. dry-run 기간 동안에도 workflow 가 "verify 결과 alert 인데도 녹색"으로 보이지 않게.)
  process.exit(severity === "alert" ? 1 : 0);
}
```

**DB 쿼리 (예시)**:
```sql
-- I1
SELECT COUNT(*) FROM cafe_posts WHERE created_at > now() - interval '24 hours';

-- I2
WITH recent AS (
  SELECT id, metadata FROM games
  WHERE metadata ? 'cafe_dataid'
    AND created_at > now() - interval '24 hours'
)
SELECT 
  COUNT(*) FILTER (WHERE venue_name IS NOT NULL) AS has_venue,
  COUNT(*) FILTER (WHERE scheduled_at IS NOT NULL) AS has_scheduled,
  COUNT(*) FILTER (WHERE fee_per_person IS NOT NULL AND fee_per_person > 0) AS has_fee,
  COUNT(*) AS total
FROM games WHERE metadata ? 'cafe_dataid' AND created_at > now() - interval '24 hours';
-- 파싱 성공 = (has_venue + has_scheduled + has_fee) >= 2 per row
-- 실제는 per-row filter 로 조건 세분화

-- I6
SELECT metadata->>'cafe_board' AS board, COUNT(*) AS cnt
FROM games
WHERE metadata ? 'cafe_dataid' AND created_at > now() - interval '24 hours'
GROUP BY metadata->>'cafe_board';
```

**GH API 호출 (gh CLI)**:
```bash
# I3: cron 성공률
gh api "repos/bdr-tech/mybdr/actions/workflows/263601935/runs?created>=2026-04-20T23:00:00Z&per_page=100" \
  --jq '.workflow_runs[] | {conclusion, created_at}'

# I4-1차: Secret updated_at
gh api "repos/bdr-tech/mybdr/actions/secrets/DAUM_CAFE_STORAGE_STATE_B64" \
  --jq '.updated_at'
# → 403 이면 fallback 전환
```

**운영 DB 가드 (sync-cafe 와 동일 관습)**:
- `assertDevDatabase(process.env.DATABASE_URL)` 스크립트 최상단 실행
- 읽기 전용이지만 일관성 유지
- `inspect-games-cafe-meta.ts` L20~L29 패턴 복사

---

#### .github/workflows/cafe-sync-verify.yml 스펙

```yaml
name: cafe-sync-verify

on:
  schedule:
    # KST 08:10 = UTC 23:10 (전일)
    # 첫 cron(07:00)과 08:00 sync 양쪽 직후 안정 지점
    - cron: "10 23 * * *"
  workflow_dispatch:
    inputs:
      dry_run:
        description: "Issue 생성 없이 판정만 (true/false)"
        required: false
        default: "true"

permissions:
  issues: write      # 이슈 생성/갱신/close
  contents: read     # checkout
  actions: read      # workflow runs / secrets metadata 조회

concurrency:
  group: cafe-sync-verify
  cancel-in-progress: false

jobs:
  verify:
    name: "카페 sync 품질 검증"
    runs-on: ubuntu-latest
    timeout-minutes: 5   # DB + API 호출만 — 5분 넉넉
    
    env:
      TZ: "Asia/Seoul"
      DATABASE_URL: ${{ secrets.DATABASE_URL_DEV }}
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}   # gh CLI 에서 자동 인식
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"
      
      - name: Install dependencies
        run: npm ci
      
      # cafe-sync.yml 과 동일 가드 재사용
      - name: Validate DB is development (CI guard)
        run: |
          if [ -z "$DATABASE_URL" ]; then
            echo "::error::DATABASE_URL secret 미설정"; exit 1; fi
          if echo "$DATABASE_URL" | grep -q 'bwoorsgoijvlgutkrcvs'; then
            echo "dev DB identifier confirmed"
          else
            echo "::error::DATABASE_URL 이 개발 DB 아님"; exit 1; fi
      
      - name: Run verify script
        id: verify
        shell: bash
        run: |
          set -o pipefail
          # dry_run 입력값(workflow_dispatch) 또는 기본 dry-run (1주차)
          DRY_RUN_FLAG="${{ github.event.inputs.dry_run || 'true' }}"
          if [ "$DRY_RUN_FLAG" = "true" ]; then
            EXTRA_ARGS=""
          else
            EXTRA_ARGS="--create-issues"
          fi
          npx tsx scripts/verify-cafe-sync.ts \
            --since=24h \
            --output=json \
            $EXTRA_ARGS \
            | tee tmp/verify-report.json
      
      - name: Upload verify report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: cafe-sync-verify-report-${{ github.run_id }}
          path: tmp/verify-report.json
          retention-days: 14
```

**Secret 재사용 현황**:
- `DATABASE_URL_DEV` ← 기존 cafe-sync.yml 과 **동일 Secret** 재사용. 추가 등록 0.
- `GITHUB_TOKEN` ← workflow 자동 주입. gh CLI 가 `GH_TOKEN` env 를 자동 인식.
- `DAUM_CAFE_STORAGE_STATE_B64` ← 검증봇은 **쿠키를 직접 사용하지 않음**. `gh api .../actions/secrets/DAUM_CAFE_STORAGE_STATE_B64` 로 `updated_at` 메타만 조회 — 값 0 노출.
- `SLACK_WEBHOOK_URL` ← **미사용** (Slack 미도입 결정).

---

#### GitHub Issue 템플릿 예시

**경고 이슈 (severity:warn)**:
- **제목**: `[cafe-sync-verify] 게시판별 편차 감지 — MptT 0건 (2026-04-21)`
- **라벨**: `cafe-sync-verify` + `severity:warn` + `automated`
- **본문**:
  ```markdown
  ## 📊 지표 요약
  
  | # | 지표 | 값 | 상태 |
  |---|------|-----|------|
  | I1 | 24h 신규 수집 | 6건 | ✅ ok |
  | I2 | 파싱 성공률 | 83% (5/6) | ✅ ok |
  | I3 | cron 성공률 | 18/18 | ✅ ok |
  | I4 | 쿠키 나이 | 3.2일 (source: secret_updated_at) | ✅ ok |
  | I6 | 게시판별 편차 | IVHA:5 / Dilr:1 / **MptT:0** | ⚠️ warn |
  
  ## 🔧 추천 조치
  
  1. MptT 게시판만 0건 — fldid `MptT` 차단 또는 HTML 구조 변경 가능성
  2. 최근 `gh run list --workflow=cafe-sync --limit=5` 의 로그 artifact 에서 MptT 섹션 확인
  3. 로컬 재현: `npx tsx --env-file=.env --env-file=.env.local scripts/sync-cafe.ts --board=MptT --with-body --article-limit=3`
  
  ## 🔗 참조
  
  - 이번 verify 실행: <RUN_URL>
  - 최근 cafe-sync 실행: <LATEST_SYNC_RUN_URL>
  - scratchpad: `.claude/scratchpad-cafe-sync.md` "📋 카페 sync 품질 검증봇"
  
  ---
  <!-- bot:cafe-sync-verify indicator:I6 date:2026-04-21 -->
  ```

**알림 이슈 (severity:alert)** — 쿠키 만료:
- **제목**: `[cafe-sync-verify] 쿠키 만료 임박 — 7.2일 경과 (2026-04-21)`
- **라벨**: `cafe-sync-verify` + `severity:alert` + `automated`
- **본문**: 
  ```markdown
  ## 🚨 즉시 조치 필요
  
  쿠키 나이 7.2일 (임계치 7일 초과). 다음 24h 내 403 대량 발생 예상.
  
  ## 🔧 조치 절차
  
  ```bash
  # 로컬에서 실행
  npx tsx scripts/refresh-cafe-cookie.ts
  # → Playwright headed 창에서 로그인 → Enter → gh secret set 자동
  ```
  
  ## 📊 전체 지표
  (테이블 생략 — 경고 이슈와 동일 구조)
  
  ## 🔗 참조
  (생략)
  
  <!-- bot:cafe-sync-verify indicator:I4 date:2026-04-21 -->
  ```

**중복 방지 (마커 기반)**:
- Issue 본문 하단 HTML 주석 `<!-- bot:cafe-sync-verify indicator:I{N} date:YYYY-MM-DD -->` 마커 삽입
- 다음 실행 시 `gh issue list --label cafe-sync-verify --state open` 조회 → 본문에 `indicator:I{N}` 포함된 이슈 탐색
- 존재 + 같은 severity → **코멘트만 추가** ("2회차 감지 2026-04-22 08:10 — 값: X")
- 존재 + severity 변경 (warn → alert 승격) → 라벨 교체 + 코멘트

**자동 close 조건**:
- 이번 실행에서 해당 지표 `status: "ok"` + 직전 실행에 해당 지표 이슈 open 상태
- 실행 순서: (1) 각 지표별 open 이슈 조회 → (2) 이번 값이 ok 면 `gh issue close {number} --comment "✅ 자동 회복 2026-04-22 08:10 — 값: Y"` → (3) `severity:resolved` 라벨 선택 추가

---

#### 롤아웃 계획 (3단계)

| 단계 | 기간 | 동작 | 목적 |
|------|------|------|------|
| **1주차** | D+0 ~ D+7 | workflow `dry_run=true` 고정. Issue 생성 0. verify-report.json artifact 만 업로드. 사용자가 매일 artifact 열어 severity/지표 확인 | 거짓 양성 빈도 측정. 임계치 현실성 검증 |
| **2주차** | D+8 ~ D+14 | workflow_dispatch 로 `dry_run=false` 테스트 → Issue 정상 생성/close 확인 후 **schedule cron 에서도 dry_run=false 전환** (workflow 파일 수정 1줄) | 실제 알림 경로 가동 |
| **1개월+** | D+30~ | 1주차 관찰 데이터 기반 임계치 재조정 (I1/I2 특히). I5(403/429) artifact 로그 파싱 추가 여부 판단 | 튜닝 + 지표 확장 |

**1주차 → 2주차 전환 기준**: 7일 동안 거짓 양성 2건 이하. 2건 초과 시 임계치 재조정 후 1주차 1회 더 반복.

---

#### 리스크 & 완화

| # | 리스크 | 영향 | 완화책 |
|---|-------|------|-------|
| **R1** | 거짓 양성 (첫 주 이슈 과다 또는 dry-run 경보 과다) | 사용자 피로 → 알림 무시 습관 | 1주차 dry-run 고정 → 임계치 현실 검증 후 활성화. I1 임계치 초안 "10+" → "5+" 하향 반영 |
| **R2** | GH API rate limit (Issues API 5000/h, Actions 1000/h) | 자동 close 대량 시 순간 초과 가능성 | 검증봇은 하루 1회 실행 — 최대 6지표 × 6 API 호출 = 36 req/일. 안전 마진 넘침 |
| **R3** | Secret updated_at API 미제공 대안 | I4 지표 소스 상실 | storageState `cookies[].expires` fallback 구현됨. 임계치 반전(`<2일 만료 전 = alert`) + 이슈 본문에 "source: storage_state_expires" 명기 |
| **R4** | workflow `GITHUB_TOKEN` 권한 부족 (Issues/Actions read) | 이슈 생성 실패 | `permissions:` 블록에 `issues: write` + `actions: read` 명시. 첫 workflow_dispatch 테스트에서 403 확인되면 Settings > Actions > Workflow permissions 수동 조정 |
| **R5** | DB 연결 실패 (개발 DB 일시 중단) | I1/I2/I6 모두 오작동 | Prisma 에러 catch → 모든 DB 지표 `status: "unknown"` 로 분류. severity 계산에서 unknown 은 ok 로 취급(경보 과다 방지). 대신 본문에 "DB 접근 실패" 플래그 |
| **R6** | 검증봇 자체가 하루 조용히 실패 | 알림 채널 자체가 죽음 | verify workflow 도 `if: failure()` Slack step 추가 검토 → **사용자 결정: Slack 미도입** → GitHub Actions 실패는 이메일 기본 알림 경로로 통보됨 (개인 계정 설정). Issue 생성 자체 의도적 메타 이슈 (verify 봇이 1일 이상 실행 안 됐으면 별도 경보) 는 2주차 이후 고려 |
| **R7** | Issue 본문 크기 제한 (65536자) | 장기간 코멘트 누적 시 초과 | 지표 1개당 본문 <1KB 예상. 코멘트는 50건 이후 자동 close 하고 새 이슈 생성(본문에 "재생성 사유: 코멘트 누적" 명기) |
| **R8** | 라벨 4종(`cafe-sync-verify` 등) 사전 생성 누락 | gh issue create 시 라벨 오류 | verify 스크립트 기동 시 `gh label list` 조회 → 누락 시 `gh label create` 자동 실행 (idempotent). 또는 workflow 파일에 first-run 전용 step 삽입 |

---

#### 예상 구현 시간

| 작업 | 시간 |
|------|------|
| `verify-cafe-sync.ts` 골격 (argv parse + assertDevDatabase + output JSON 구조) | 25분 |
| I1/I2/I6 DB 쿼리 + 집계 로직 | 30분 |
| I3 GH API workflow runs 집계 | 15분 |
| I4 Secret updated_at 조회 + fallback (storageState expires) | 25분 |
| Severity 판정 + recommendations 생성 로직 | 15분 |
| `manageGithubIssues()` — 조회/생성/코멘트/close + 라벨 자동 생성 | 45분 |
| `.github/workflows/cafe-sync-verify.yml` | 15분 |
| 로컬 dry-run 검증 (`--output=json`, `--skip-github-api`) | 15분 |
| workflow_dispatch 실제 실행 검증 (dry_run=true) | 15분 |
| 라벨 4종 수동 생성 or 스크립트 자동 생성 검증 | 10분 |
| **합계 (검증 포함)** | **약 3시간 30분 (3.5h)** |

---

#### developer 착수 가능 여부

**Y (착수 가능)** — 차단 요소 없음.

**확인 완료**:
- Secret updated_at API 실측 통과 (2026-04-20 응답 확인)
- Issues API 라벨 필터 쿼리 통과
- DB 쿼리 패턴 확정 (cafe_posts/games.metadata 기존 스키마 재사용, 변경 0)
- workflow YAML 구조 확정 (cafe-sync.yml 관습 재사용)
- sync-cafe.ts / cafe-sync.yml 수정 **0** (독립 workflow 로 격리)

**PM 판단 필요 사항 (2건, 둘 다 nice-to-have 범주)**:

1. **I5(403/429) 초기 비활성 결정 확인** — planner 는 "1주차 I1/I6 조합으로 간접 감지 + 2주차 직접 지표 추가" 추천. PM 이 "I5 도 1주차 포함 원함" 이면 artifact 로그 파싱 로직 추가 (구현 시간 +45분).
2. **sync-cafe.ts `tmp/cafe-sync-summary.json` 출력 추가 여부** — planner 는 DB 집계로 충분하다고 판단하여 sync-cafe.ts 무수정 권장. PM 이 향후 관측성 확장 우선이면 JSON 출력 추가 (구현 시간 +20분).

**⚠️ developer 주의사항**:
- verify 스크립트는 **읽기 전용**. 쓰기(`gh issue create/close`)는 GH API 쪽만, DB 쓰기 0.
- `assertDevDatabase()` 가드 필수 — 운영 DB 실수 차단 관습 유지.
- `gh` CLI 호출은 `execSync`/`spawnSync` 래핑 시 stderr 로그 마스킹 (Secret 값 노출 없음 재확인).
- 라벨 자동 생성 시 color 규약: `cafe-sync-verify` = `#0E8A16` (초록) / `severity:warn` = `#FBCA04` (노랑) / `severity:alert` = `#D93F0B` (빨강) / `automated` = `#C5DEF5` (파랑).
- 1주차 `dry_run=true` 기본값 유지 중요. workflow 파일에 `default: "true"` 하드코딩.

---

### 🔧 검증봇 구현 기록 (developer, 2026-04-21)

📝 구현한 기능: 다음카페 sync 품질 검증봇 (독립 workflow + TS 스크립트). 6개 지표(I1/I2/I3/I4/I6 활성 + I5 placeholder) 집계 → severity 판정 → GitHub Issue 자동 관리. 1주차 dry-run 고정, 2주차 workflow_dispatch로 --execute-issues=true 전환 가능.

#### 변경 파일

| # | 파일 | 라인수 | 신규/수정 | 비고 |
|---|------|--------|----------|------|
| 1 | `scripts/verify-cafe-sync.ts` | 897 | 신규 | 6지표 집계 + 판정 + 리포트 + Issue 관리 |
| 2 | `.github/workflows/cafe-sync-verify.yml` | 141 | 신규 | schedule KST 08:10 + workflow_dispatch |

**무수정 확인**: `scripts/sync-cafe.ts`, `.github/workflows/cafe-sync.yml`, `scripts/refresh-cafe-cookie.ts`, `src/lib/cafe/upsert.ts`, `src/lib/parsers/cafe-game-parser.ts` — 전부 건드리지 않음 (planner 결정).

#### scripts/verify-cafe-sync.ts

**CLI 옵션** (모두 구현):
- `--since=24h` / `--since=48h` / `--since=7d` — 기준 기간, 기본 24h
- `--dry-run` / `--execute-issues` — 기본 dry-run (1주차 안전)
- `--output=console` / `--output=json` — 기본 console, workflow 에서 console 사용 (+artifact로 json 저장)
- `--skip-github-api` — 로컬 모드 (gh 미설치 환경)
- `--repo=owner/name` — 없으면 `git remote` 자동 추출

**6개 지표 구현 상태**:

| 지표 | 구현 | 소스 | 임계치 (ok/warn/alert) |
|------|-----|------|----------------------|
| I1 신규 수집 | ✅ | `cafe_posts` COUNT (24h) | ≥5 / 1~4 / 0 |
| I2 파싱 성공률 | ✅ | `games` metadata.cafe_dataid + 필수 2개+ (venue/scheduled_at/fee) | ≥0.85 / 0.6~0.84 / <0.6. 24h내 0건이면 `unknown` (I1 참조) |
| I3 cron 성공률 | ✅ | `gh api /actions/workflows/263601935/runs` + `event=schedule` 필터 | ≥18 / ≥15 / <15 (24h 기준) |
| I4 쿠키 나이 | ✅ | 1차: `gh api /actions/secrets/DAUM_CAFE_STORAGE_STATE_B64` → updated_at. Fallback: storageState cookies[].expires 최솟값 (의미 반전 — `<2일 남음` = alert) | <5일 / 5~6일 / ≥7일 (1차 기준) |
| I5 403/429 | ⏸️ | `{ status: "disabled_phase1" }` placeholder | 2주차 재검토 |
| I6 게시판 편차 | ✅ | `games` GROUP BY metadata.cafe_board. IVHA/Dilr/MptT 3개 기대 | 3/3 / 2/3 / ≤1 |

**JSON 스키마** (`tmp/verify-report-<ISO>.json`):
```json
{
  "run_at": "2026-04-20T15:53:19.050Z",
  "since_hours": 24,
  "since_raw": "24h",
  "severity": "ok" | "warn" | "alert" | "unknown",
  "repo": "bdr-tech/mybdr",
  "dry_run": true,
  "indicators": { "I1_new_posts": {...}, ... },
  "recommendations": [...],
  "github_run_url": null | "https://github.com/.../runs/..."
}
```

**severity 판정**: `disabled_phase1` / `unknown` 은 계산에서 제외. 하나라도 `alert` → 전체 alert / 하나라도 `warn` → warn / 전부 ok → ok / effective 지표 0개면 unknown.

**Issue 관리 로직** (--execute-issues 모드만):
1. `ensureLabels()` — 4개 라벨(`cafe-sync-verify` / `automated` / `severity:warn` / `severity:alert`) 없으면 자동 생성
2. severity=ok → 열린 verify 이슈(`<!-- bot:cafe-sync-verify` 마커 포함)에 "자동 회복" 코멘트 + close
3. severity=warn/alert → 같은 severity 라벨 열린 이슈 존재 시 코멘트만, 없으면 신규 생성
4. Issue 제목: `[cafe-sync-verify] severity=<level> · <YYYY-MM-DD>`
5. Issue 본문: 지표 요약 테이블 + 추천 조치 리스트 + 참조 링크 + HTML 주석 마커

**안전장치**:
- `assertDevDatabase()` — `DATABASE_URL` 에 `bwoorsgoijvlgutkrcvs` 포함 필수 (운영 DB 차단)
- `ghExec()` — stderr 만 로그, args 자체 미노출 (Secret 값 안전)
- 기본값 dry-run (--execute-issues 명시 필요)
- Prisma $disconnect 모든 경로에서 호출
- exit code: severity=alert → 1, 그 외 → 0 (CI 가시성)

**Windows 호환**:
- `spawnSync("gh", args, { shell: true })` — Windows `?` `&` `>` 특수문자 포함 URL 쿼리스트링 **자동 쿼터링** (isWin 분기). 리눅스 CI 는 shell:false + args 배열 직접 전달.

#### .github/workflows/cafe-sync-verify.yml

**주요 step**:
1. Checkout
2. Setup Node.js 22 + npm cache
3. `npm ci`
4. `npx prisma generate` (postinstall 실패 대비)
5. CI 운영 DB 가드 (`bwoorsgoijvlgutkrcvs` 식별자 검증)
6. Run verify — `--since=${SINCE}h` + dry-run/execute 분기
7. Upload artifact (verify-report-*.json + verify.log, 30일 보관, if:always)

**permissions**:
- `contents: read` — checkout
- `issues: write` — Issue 생성/코멘트/close
- `actions: read` — workflow_runs + secrets metadata

**기본값**:
- schedule cron `10 23 * * *` (KST 08:10)
- schedule 실행 시 **항상 dry-run** (1주차 안전)
- workflow_dispatch 로만 `execute_issues=true` 입력 가능 (기본 false)

**concurrency**: `cancel-in-progress: false` (설계 R6 관측성 보존)

#### 타입 체크

- `npx tsc --noEmit` → exit 0 (최종 편집 후 2회 통과)

#### 로컬 dry-run 검증 결과 (2026-04-20 15:53 KST, Windows)

```
전체 severity: ALERT
지표:
  ✅ I1_new_posts           23         [ok]          (cafe_posts 24h 23건)
  ❓ I2_parse_rate          (n/a)      [unknown]     (24h 내 카페 games 0건 — I1 참조)
  ❓ I3_cron_success        0/0        [unknown]     (24h 내 schedule 실행 0회 — workflow 아직 cron 미도달)
  ✅ I4_cookie_age_days     0          [ok]          (Secret updated_at=2026-04-20T15:00:50Z, source=secret_updated_at)
  ⏸️ I5_http_error_count    (n/a)      [disabled_phase1]
  🚨 I6_board_coverage      0/3        [alert]       (IVHA:0/Dilr:0/MptT:0)
```

**판정 정확성 검증**:
- I1 `23건` → `ok` (임계치 ≥5 통과) ✅
- I4 `0.0일` → `ok` (Secret updated_at 실측 2026-04-20T15:00:50Z, 약 0일 경과 — 계산 정상)
- I6 `0/3` → `alert` (3개 게시판 전부 0건, activeCount=0 → ≤1 alert 판정 정상)
- 전체 severity: I6=alert 하나라도 있어 `alert` ✅ (설계 판정 로직 일치)
- exit code 1 (alert 시 1 반환) ✅

**I2/I6 현재 상태 설명** (버그 아님):
- 현재 개발 DB 의 24h 내 `games` 테이블에 `cafe_dataid` 있는 행은 0건 (cafe_posts 는 23건 수집돼 있으나 `--execute` 미실행으로 games 반영 안 됨)
- sync-cafe 가 `--execute` 로 games 에 upsert 하기 시작하면 I2/I6 수치 정상화 예정
- 본 verify 봇은 이 상황 자체를 "게시판별 0건 = alert"로 바르게 감지. 1주차 artifact 관찰의 주요 관찰 포인트.

**Secret updated_at 실측**:
```
$ gh api repos/bdr-tech/mybdr/actions/secrets/DAUM_CAFE_STORAGE_STATE_B64 --jq '{updated_at, created_at}'
{"created_at":"2026-04-20T15:00:50Z","updated_at":"2026-04-20T15:00:50Z"}
```
- 1차 소스 (Secret updated_at) 접근 **성공** — fallback storageState expires 로직은 실행되지 않음
- 설계안 실측값 그대로 재확인

**JSON 출력** (artifact 업로드 스키마 정상):
- `run_at` / `since_hours` / `severity` / `repo` / `dry_run` / `indicators` / `recommendations` / `github_run_url` 8 필드 전부 기대대로 출력

**YAML 파싱 검증**:
```
$ node -e "const y=require('js-yaml'); const d=y.load(require('fs').readFileSync(...)); console.log(...)"
✅ YAML 파싱 OK
name: cafe-sync-verify
triggers: [ 'schedule', 'workflow_dispatch' ]
steps: 7개 전부 정상 인식
```

#### 특이사항

1. **Windows 특수문자 이스케이프 우회** — spawnSync + shell:true 조합에서 Windows cmd 가 `&` `?` `>` 를 해석함. URL 쿼리스트링 포함 인자를 **자동 더블쿼터** 로 감싸는 분기 추가. 리눅스 CI(ubuntu-latest)는 shell:false 로 args 배열 직접 전달하여 이스케이프 불필요.
2. **I3 schedule 필터** — `event=schedule` 로 필터링해서 수동 workflow_dispatch 실행은 cron 성공률에서 **제외**. 현재 cafe-sync 가 schedule cron 한 번도 안 도는 상태(0/0) → `unknown` 처리. 수일 내 cron 도달하면 자연스럽게 값이 채워짐.
3. **I6 현재 alert** — 설계대로 동작. sync-cafe 가 `--execute` 로 games 에 upsert 하기 시작해야 I6 정상화. 1주차 artifact 관찰 시 이 점 고려 필요.
4. **Prisma raw query parameter binding** — `NOW() - ($1 || ' hours')::interval` 로 파라미터 안전 바인딩. SQL injection 방지.
5. **라벨 자동 생성 idempotent** — 이미 존재 시 gh label create 는 실패하지만 무시(경고만). 설계안 R8 완화책 구현.
6. **DB 연결 실패 대비** — main() try/catch 에서 prisma.$disconnect 이후 exit 2 (DB 에러와 지표 alert 구분).

#### 사용자 다음 단계

1. **커밋 + 푸시** (tester 검증 후):
   ```bash
   git add scripts/verify-cafe-sync.ts .github/workflows/cafe-sync-verify.yml
   git commit -m "feat(cafe-verify): 다음카페 sync 품질 검증봇 (6지표 + 자동 이슈 관리)"
   git push origin subin
   ```
2. **첫 자동 실행 확인** — KST 08:10 (매일) schedule cron. artifact `cafe-sync-verify-<run_id>` 다운로드 → `verify-report-*.json` 확인
3. **1주일 관찰** — 거짓 양성 빈도 / 임계치 현실성 / 지표 값 실제 분포
4. **2주차 전환 테스트** — Actions 탭 `cafe-sync-verify` → Run workflow → `execute_issues=true` 체크 → 수동 실행. 실제 Issue 생성 / 코멘트 / close 동작 검증
5. **2주차 schedule 전환** — 관찰 결과 양호 시 workflow 파일의 Run verify step 분기에서 `FLAGS="--execute-issues"` 로 schedule도 전환 (1줄 변경)

#### tester 참고

- **테스트 방법**: 로컬에서 `npx tsx --env-file=.env --env-file=.env.local scripts/verify-cafe-sync.ts --since=24h --dry-run` 실행
- **정상 동작**: 지표 6개 출력 + severity 판정 + 리포트 파일 저장 + dry-run 명시. **절대 Issue 생성 안 됨** (gh issue list 로 확인)
- **경계 케이스 테스트**:
  - `--since=7d` (장기 집계) — 값만 바뀌어야 함, 로직은 동일
  - `--output=json` — 순수 JSON stdout (jq 파싱 가능)
  - `--skip-github-api` — I3/I4 모두 unknown, I1/I2/I6 만 집계
  - `DATABASE_URL` 에 `bwoorsgoijvlgutkrcvs` 제외 → 즉시 exit 1 (가드 동작)

#### reviewer 참고

- **보안 집중 점검**:
  - `ghExec()` Secret 값 로그 누설 여부 (args 는 미노출 기대)
  - DB 쿼리 SQL injection 방지 ($1 바인딩)
  - 운영 DB 가드 우회 여부
- **로직 집중 점검**:
  - `calcOverallSeverity()` — unknown/disabled_phase1 처리
  - `thresholdStatus()` 는 정의만 있고 실제 사용처 없음 (직접 분기로 대체함). 제거 후보
  - Issue 관리 로직 중복 방지 (마커 기반 탐색)
- **확장성**: I5 활성화 시 artifact 로그 파싱 추가 지점은 `queryI5Placeholder()` 함수 — 교체만 하면 됨

### 🔎 검증봇 리뷰 결과 (reviewer, 2026-04-21)

| # | 영역 | 판정 | 상세 |
|---|------|------|------|
| R1 | Secret/DB URL 노출 방지 | ✅ 통과 | `ghExec()` 실패 시 stderr 첫 줄만 로깅(L167) + args 자체는 로그 X. artifact JSON(`verify-report-*.json`)은 지표 값/임계치만 — DATABASE_URL / gh token / secret body 전혀 포함 X. I4 쿠키 지표는 `updated_at` ISO 문자열만 저장 (값 X). 파일 L390 에서 `source: "secret_updated_at"` 메타만 노출. `buildIssueBody()` / `saveReport()` 에도 민감정보 경로 없음 |
| R2 | 운영 DB 가드 3중 | ✅ 통과 | (1) workflow L88-99 `grep -q 'bwoorsgoijvlgutkrcvs'` 가드 — `cafe-sync.yml` L84 와 동일 패턴 재사용 (2) TS `assertDevDatabase()` L121-131 런타임 가드 (3) PrismaClient 생성 전 `main()` L817 에서 먼저 호출. cafe-sync 와 완전 동일한 3중 |
| R3 | severity 판정 엄밀성 | 🟡 경미 | **경계 처리 정확**: `rate >= 0.85` → 85.0% = ok (L283), `success >= 18` → 18/18 = ok (L357), `ageDays < 5` → 정확히 5일 = warn (L385). **unknown 처리 정확**: `calcOverallSeverity()` L493-501 이 disabled_phase1/unknown 을 effective 에서 filter out, effective 가 비면 "unknown" 반환. **권장**: `thresholdStatus()` L200-210 은 정의만 되어있고 실제 사용처 0 (각 지표가 직접 삼항 분기) — dead code, 제거 권장 (developer 메모 L1196 에도 명시) |
| R4 | GH API 호출 품질 | 🟡 경미 | **긍정**: `?event=schedule` 필터는 API 파라미터 대신 client-side filter (L343) — `workflow_runs?created=...` API 는 event 파라미터 지원하므로 서버 필터로 최적화 가능. **페이지네이션**: `per_page=100` 고정 L316 — 24h 내 18 run 이므로 1페이지 충분, 실용상 OK. **에러 핸들링**: 401/403/rate limit 구분 없이 "권한 부족 or 네트워크" 로 unknown 반환 (L323) — 원본 stderr 1줄은 L168 로 콘솔에 남음. 치명 X 하지만 재시도 0. `ensureLabels()` 는 `?per_page=100` + `--paginate` 로 라벨 100개+ 대응 |
| R5 | Issue 관리 안전성 | 🔴 **블록커** | **중복 방지 마커**: `ISSUE_MARKER_PREFIX = "<!-- bot:cafe-sync-verify"` L58 — 본문 includes 로 탐색(L708), 정확. **close 멱등성**: severity=ok 시 열린 verify 이슈 전부 close, 회복 코멘트 포함 — 이미 close 된 이슈는 `gh issue close` 가 실패하지만 `r !== null` 체크로 카운트 제외, 로그만 남음. 안전. **🚨 인자 쿼터링 버그**: `ensureLabels()` L656/L660 / `close --comment` L721 / `create --title` L782 가 인자값을 `"..."` 로 수동 쿼터링. Windows(shell:true) 분기 L151 가 이미 자동 쿼터링하므로 **이중 쿼터**, Linux CI(shell:false) 에서는 shell 없이 직접 spawn 되므로 **리터럴 `"` 가 gh 인자값에 박힘** → 라벨명이 `"cafe-sync-verify"` (쿼터 포함) 로 생성되거나 제목이 `"[cafe-sync-verify] severity=...` 로 앞뒤 쿼터 포함됨. **영향**: 2주차 `--execute-issues` 전환 시 Linux CI 에서 라벨/이슈/코멘트가 모두 기형으로 생성 |
| R6 | 1주차 dry-run 안전장치 | ✅ 통과 | **기본 dry-run 3중**: (1) `argv.includes("--dry-run") \|\| !argv.includes("--execute-issues")` L87 → 플래그 2개 모두 없으면 dry-run (2) workflow input `execute_issues` default `false` L31 (3) workflow step L114 에서 workflow_dispatch + execute_issues=true 조건 일치 시에만 `--execute-issues`, schedule 은 **무조건** `--dry-run`. 사용자 실수 방어 우수. **dry-run JSON 생성**: L873 `saveReport()` 는 dry_run 여부 무관하게 항상 실행 → artifact 로 관찰 가능. 설계안 요구 충족 |
| R7 | Prisma 쿼리 품질 | ✅ 통과 | **$queryRawUnsafe + 파라미터 바인딩**: `($1 \|\| ' hours')::interval` L220/L264/L466 — 파라미터는 `String(sinceHours)` 로 바인딩, interval 문자열 조작은 서버 측 cast. SQL 인젝션 차단. **metadata JSONB**: `metadata ? 'cafe_dataid'` / `metadata->>'cafe_board'` — PostgreSQL JSONB 연산자 안전 사용. **N+1 없음**: I2 는 단일 aggregate 쿼리, I6 는 GROUP BY 단일 쿼리. **병렬 집계**: `Promise.all([i1, i2, i6])` L832 — DB 왕복 최소화 |
| R8 | 테스트 용이성 | 🟡 권장 | **시간 의존성**: `Date.now()` 가 `queryI4CookieAge()` L382/L415 에 직접 박힘 — 모킹 어려움. `runAt = new Date().toISOString()` L824 도 main 내부. 현재는 실제 cron 환경에서만 돌리므로 영향 X, 단위 테스트 추가 시 리팩토링 필요. **지표 함수 분리**: 각 지표 함수가 prisma/argv/env 에 의존 — 프로덕션 적합하나 단위 테스트 환경 주입 포인트 없음. 1주차 관찰 결과에 따른 임계치 튜닝은 상수(L225/L283/L357/L385) 수정으로 대응 가능 |
| R9 | 컨벤션 준수 | ✅ 통过 | **카페는 공식기록 아님** → `officialMatchWhere` 무관. **백엔드 스크립트** → `apiSuccess` 미들웨어 영향 없음. **snake_case DB / camelCase TS**: `metadata.cafe_dataid` / `metadata.cafe_board` (DB snake) ↔ `sinceHours` / `ghAvailable` (TS camel) ↔ `VerifyReport` 필드는 artifact JSON 용이라 snake_case 의도적 선택 (L563-573). **import 순서**: prisma → node:child_process → node:fs → node:path, 외부→표준 순 OK. **주석 스타일**: 이유(왜) → 방법(어떻게) 순서로 블록 주석 우수 (L217/L240/L311 등) |
| R10 | 하위 호환성 | ✅ 통과 | **무수정 파일 확인**: `scripts/sync-cafe.ts` / `scripts/cafe-login.ts` / `src/lib/cafe-sync/*` / `.github/workflows/cafe-sync.yml` / `prisma/schema.prisma` / 기존 Secret(DATABASE_URL_DEV, DAUM_CAFE_STORAGE_STATE_B64) 전부 **무수정**. **신규 파일 2개만 추가**: verify-cafe-sync.ts + cafe-sync-verify.yml. Secret 추가 0 (기존 2종 + GITHUB_TOKEN 자동 재사용). 카페 세션 분리 원칙(conventions.md 2026-04-20) 준수 |

#### 🔴 블록커 (있으면)

- **R5 인자 수동 쿼터링 버그** (Linux CI 기형 출력) — 2주차 `--execute-issues` 활성화 전 반드시 수정.
  - **영향 파일**: `scripts/verify-cafe-sync.ts`
  - **영향 라인**:
    1. L656 `\`"${label.name}"\`` → `label.name`
    2. L660 `\`"${label.description}"\`` → `label.description`
    3. L721 `\`"${comment.replace(/"/g, '\\\\"')}"\`` → `comment` (쿼터링/escape 모두 제거 — spawnSync 가 인자 배열을 그대로 전달)
    4. L782 `\`"${title.replace(/"/g, '\\\\"')}"\`` → `title`
  - **근거**: Linux(shell:false)에서 `spawnSync` 는 args 배열을 그대로 실행 파일에 전달 → 쿼터는 shell 이 해석하는 것이지 exec 에서는 리터럴 문자. Windows 분기(L151-158)는 shell:true 일 때만 자동 쿼터링 처리하므로, **호출부에서 사전 쿼터링하면 Windows 에선 이중 쿼터(`""..""`), Linux 에선 값에 `"` 리터럴 박힘**.
  - **수정 패턴**: `ghExec()` 호출 시 인자값은 **항상 raw string** 전달. 쿼터링은 `ghExec()` 내부 Windows 분기가 책임.
  - **검증 방법**: 수정 후 로컬(Windows)에서 `--execute-issues` 스모크 + Linux(Actions workflow_dispatch) 에서 `execute_issues=true` 실제 이슈 1건 생성 확인 → 제목/라벨/본문에 리터럴 `"` 없는지.

#### 🟡 권장 개선 (nice-to-have)

- **R3 dead code**: `thresholdStatus()` L200-210 미사용. 제거 또는 각 지표 판정에 실제 사용하도록 리팩토링.
- **R4 GH API 최적화**: `workflow_runs?event=schedule` 서버 필터 사용 시 client-side `filter((r) => r.event === "schedule")` 제거 가능 (현재도 동작하지만 1회 왕복에서 불필요한 run 데이터 수신).
- **R4 rate limit 가시성**: `ghExec()` 실패 시 stderr 에 `API rate limit exceeded` 포함 여부 별도 감지 → 지표 note 에 명시하면 운영 디버깅 편의 향상. (1주차 관찰 결과에 따라 결정)
- **R8 시간 모킹**: 단위 테스트 도입 시 `Date.now()` 를 함수 파라미터로 빼거나 `getNow()` 헬퍼 도입 검토.
- **호환 개선**: tmp/ 디렉토리 고정 경로 대신 `os.tmpdir()` + `fs.mkdtempSync` 로 충돌 방지 (concurrency: cafe-sync-verify 가 단일이라 실용상 OK).

#### 👍 칭찬 포인트

1. **운영 DB 가드 3중** — `cafe-sync.yml` 패턴을 정확히 계승. 사고 재발 예방.
2. **Secret 보안 설계** — ghExec 실패 시 args 로깅 X, artifact JSON 에 민감정보 0.
3. **기본 dry-run 3중 방어** — 1주차 사용자 안전 최우선 관철.
4. **병렬 DB 집계 + 순차 GH API** — 비용/속도 균형.
5. **기존 파일 무수정** — 카페 세션 분리 원칙 정확히 준수. 신규 파일 2개만.
6. **Prisma raw 파라미터 바인딩** — SQL 인젝션 방어 철저.
7. **주석 품질** — 지표별 "이유 → 방법" 순서, CLAUDE.md 규칙 준수.
8. **Windows/Linux 호환 설계 의도** — ghExec 내부 플랫폼 분기(단, 블록커 R5 가 이 의도를 상회함).
9. **artifact 항상 업로드** (`if: always()`) — 실패 시에도 디버깅 가능.

#### 커밋 가능 여부

- ❌ **블록커 R5 수정 전 커밋 금지** (1주차 dry-run 만 돌리면 manageGithubIssues 호출 안 되므로 발현 X → 임시 커밋은 가능하지만, 2주차 전환 전 필수 수정. 사용자 선택: (a) 지금 커밋 후 2주차 전에 hotfix / (b) 블록커 해소 후 커밋. 권장: **(b) 지금 수정 후 커밋** — 897줄짜리 신규 파일을 두 번 터치하지 말고 한 번에 올림)

---

### 🧪 검증봇 테스트 결과 (tester, 2026-04-21)

| # | 시나리오 | 결과 | 상세 |
|---|---------|------|------|
| T1 | tsc --noEmit | ✅ 통과 | exit 0. 타입 에러 0. 신규 파일 2개 포함 전체 프로젝트 컴파일 성공 |
| T2 | YAML 문법 + cron | ✅ 통과 | js-yaml 파싱 OK. `name: cafe-sync-verify`, triggers=[schedule,workflow_dispatch], cron=`"10 23 * * *"` (UTC 23:10 = KST 08:10). 5필드 정상, steps 7개 인식 |
| T3 | dry-run 재실행 | ✅ 통과 | **exit=1** (alert 판정 정확) / severity=**alert** (I6=alert 주도) / JSON 파일 `tmp/verify-report-2026-04-20T16-10-02.json` 생성 / Secret/DB URL 출력 0건 (grep `postgres://`/`eyJ`/`token=` 0매치) / `gh issue list --label cafe-sync-verify --state open` = `[]` (신규 이슈 0건, dry-run 보호 확인) |
| T4 | 6지표 코드 경로 | ✅ 통과 | I1: `cafe_posts COUNT` 24h 값 23 ok. I2: `games.metadata ? 'cafe_dataid'` + (venue/scheduled/fee) 2개+ FILTER. I3: `workflow_runs?created=%3E%3D<ISO>` + `event === "schedule"` client filter (L343) — schedule 트리거만 집계. I4: `gh api /actions/secrets/DAUM_CAFE_STORAGE_STATE_B64` → updated_at (1차, 실측 `2026-04-20T15:00:50Z`) + fallback `storageState cookies[].expires` (L401-431, 의미 반전). I5: placeholder 반환 (`status: disabled_phase1`). I6: `GROUP BY metadata->>'cafe_board'` + expected 3개 보드(IVHA/Dilr/MptT) |
| T5 | severity 판정 | ✅ 통과 | `calcOverallSeverity()` L493-501: `disabled_phase1`/`unknown`은 **filter out**하고 effective만 집계. 하나라도 alert → alert (실측 검증 ✅) / 하나라도 warn → warn / effective 길이=0 → unknown / 전부 ok → ok. 경계값: `>= 0.85`=ok, `>= 18`=ok, `< 5일`=ok 등 설계와 일치 |
| T6 | 운영 DB 가드 | ✅ 통과 | TS 가드: `assertDevDatabase()` L121-131 `bwoorsgoijvlgutkrcvs` 미포함 시 `exit(1)`. 실측: `DATABASE_URL=postgresql://...@prod.com/db` 로 주입 시 "❌ 개발 DB 아님" + exit=1 확인. YAML 가드: L88-99 `grep -q 'bwoorsgoijvlgutkrcvs'` 스텝 (cafe-sync.yml 동일 패턴 재사용). Prisma가 `.env`를 자동 로드하는 특성 때문에 unset DATABASE_URL 만으로는 중단 안 되지만, `.env` 내용이 개발 DB URL이므로 의도대로 통과 |
| T7 | Issue 관리 로직 | 🟡 부분 통과 | **로직 정확**: 마커(`<!-- bot:cafe-sync-verify`) 기반 탐색(L708), severity=ok → close + 회복 코멘트, severity=warn/alert → 같은 라벨 이슈 있으면 코멘트 없으면 생성. 라벨: base+automated+severity 3개. 제목: `[cafe-sync-verify] severity=<level> · YYYY-MM-DD`. **⚠️ 설계안과 차이**: 설계안은 "24h 이내 open 이슈"만 중복 체크, 현재 구현은 "모든 열린 verify 이슈" 대상 — 실용상 더 안전하나 엄밀히 불일치. **🔴 reviewer R5 블록커 재확인**: L656/660/721/782 에서 인자값을 `"..."` 리터럴 쿼터링 → Linux spawnSync(shell:false)에서 쿼터가 값에 박혀 라벨/제목/코멘트 기형 생성. **2주차 전환 전 필수 수정**. 1주차 dry-run 동안은 `manageGithubIssues()` 미호출이라 발현 X |
| T8 | workflow inputs | ✅ 통과 | `execute_issues` (boolean, default **false**) + `since_hours` (string, default **"24"**). schedule 트리거는 `github.event_name != "workflow_dispatch"` 분기로 **항상 `--dry-run`** 고정 (L114 조건 이중 체크: event_name + execute_issues 둘 다 참일 때만 execute) |
| T9 | permissions 최소 | ✅ 통과 | 정확히 3개: `contents: read` / `issues: write` / `actions: read`. 설계안과 완전 일치. 과권한 0 |
| T10 | 기존 파일 무수정 | ✅ 통과 | `git status --short scripts/sync-cafe.ts .github/workflows/cafe-sync.yml scripts/refresh-cafe-cookie.ts src/lib/cafe/upsert.ts src/lib/parsers/cafe-game-parser.ts` → **출력 없음** (5/5 무수정). 신규 `scripts/verify-cafe-sync.ts` + `.github/workflows/cafe-sync-verify.yml` 만 untracked 상태 |

**종합**: 10개 시나리오 중 9개 완전 통과 / 1개(T7) 부분 통과(R5 블록커 내재 — 2주차 전환 전 수정 필수).

#### 블록커

1. **R5 인자 이중 쿼터링 버그** (reviewer 이미 기록, tester 재확인) — `ghExec()` 호출부 L656/L660/L721/L782 의 수동 `"..."` 쿼터링 제거 필요. Linux CI spawnSync(shell:false) 가 `"` 를 값에 리터럴로 박아 넣어 2주차 `--execute-issues` 전환 시 라벨/제목/코멘트 기형 생성 예정.
   - **현재 영향**: **없음** (1주차 dry-run 고정 — `manageGithubIssues()` 미호출)
   - **2주차 전 필수**: 수정 후 Linux CI workflow_dispatch 에서 `execute_issues=true` 1회 스모크

#### 권장 개선 (nice-to-have)

- **dead code 제거**: `thresholdStatus()` L200-210 정의만 있고 미사용 (developer/reviewer 둘 다 언급). 제거 권장.
- **I6 추천 조치 표현 개선**: 현재 "IVHA/Dilr/MptT 게시판 0건" 으로 `/`로 join — 가독성 낮음. "IVHA, Dilr, MptT 게시판 모두 0건" 같이 자연어로.
- **GH API 서버 필터 사용**: `workflow_runs?event=schedule` 쿼리 파라미터 추가하면 client-side filter 제거 가능 (round-trip 데이터 축소).
- **I4 fallback 실측 관찰**: `--skip-github-api` 모드 실행 시 storageState 가 `-0.8일 남음` = **이미 만료된 쿠키**로 해석돼 alert 판정. 현재 로컬 .auth 상태가 만료 근접 — 1주차 cron 관찰 중 I4 실제 값 분포 확인 포인트.

#### 1주차 dry-run 관찰 포인트

1. **I6 alert 해소 시점** — sync-cafe 가 `--execute` 로 games upsert 하기 시작한 이후부터 I6 값이 3/3 로 정상화될 것. 3일 이내 정상화 안 되면 fldid 실차단 의심 → 수동 sync 재현.
2. **I3 cron 성공률** — 현재 `0/0` unknown. cafe-sync schedule cron 이 18회/일 실행되기 시작하면 값이 채워짐. schedule 만 집계하므로 workflow_dispatch 수동 실행은 반영 X (의도대로).
3. **I2 파싱 성공률** — 24h 내 games 건수가 늘어날수록 통계적으로 안정. 초기 3~5일은 샘플 수 부족으로 변동 큼 예상.
4. **I4 쿠키 나이** — Secret updated_at 1차 소스가 안정. 매주 쿠키 재발급 리듬에 맞게 `<5일` 유지되는지 주기 검증.
5. **artifact retention 30일** — 1주차 종료 시점(D+7) 에 7개 JSON 리포트 비교로 임계치 재튜닝 근거 확보.
6. **false positive 집계** — reviewer R5 수정 전이라도 dry-run 은 안전. 일별 severity/지표값만 트래킹.

#### 커밋 가능 여부

- 🟡 **조건부 가능** — 1주차는 schedule 실행 시 **항상 dry-run**이라 R5 블록커가 발현하지 않음. 설계안 "1주차 dry-run 고정 후 2주차 활성화" 롤아웃 계획 자체에 완충 구간이 내장돼 있음.
- **옵션 A (권장)**: **지금 R5 수정 후 커밋** — reviewer 의견과 동일. 897줄짜리 신규 파일을 한 번에 완성품으로 올림. 수정 범위 작음 (4줄만 `"..."` 제거).
- **옵션 B**: 지금 그대로 커밋 + 2주차 전환 전 hotfix PR. 1주차 관찰은 방해 0. 단, 2주차 전환 날짜에 맞춰 미리 수정 PR 준비 필요 → 잊을 위험.

---

### 📋 7게시판 확장 + 전체 이전 설계안 (2026-04-21, planner-architect)

> **목표**: 기존 3 경기 게시판(IVHA/Dilr/MptT → `games`) 에 **신규 4 일반 게시판**(N54V 자유 / IVd2 익명 / E7hL BDR칼럼 / bWL 구인구팀) → `community_posts` 파이프라인을 추가한다. 우선 이전 대상은 **E7hL + bWL**. 자유/익명은 규모 검증 후 후속.
>
> **세션 범위 재확인**: `src/lib/cafe-sync/*`, `scripts/sync-cafe.ts`, 신규 `scripts/backfill-cafe-community.ts`, 기존 `.github/workflows/cafe-sync*.yml`. UX 파일(`src/app/(web)/*`, `src/components/*`) 건드리지 않음. `cafe-game-parser.ts` 무수정.

---

#### 핵심 결정 요약 (7줄)

1. **게시판 분기 = `target` 필드**: `CafeBoard.target: "games" | "community_posts"` 추가. sync-cafe.ts 가 board 순회마다 target 기준 분기. games 경로는 완전 무변경.
2. **grpid 실측 ✅**: 4 신규 게시판(E7hL/bWL/N54V/IVd2) 모두 `grpid=IGaj` 동일 확인(curl HEAD + HTML grep) → Phase 3 #6 `fetchBoardListApi()` 도 같은 GRP_CODE 재사용 가능. SSR 구조(`articles.push({dataid,fldid,title,writerNickname,articleElapsedTime,bbsDepth})`)도 완전 동일 → **fetcher.ts 파싱 로직 100% 재사용**.
3. **카페 봇 유저 = seed 1회 + 시작 시 캐시**: `scripts/seed-cafe-bot-user.ts` 신규(멱등 upsert). sync-cafe/backfill 시작 시 `findUnique(email="cafe-bot@mybdr.local")` 1회 조회 후 `BigInt` 캐시. 없으면 즉시 abort(가드).
4. **중복 방지 = `images.cafe_source_id` GIN-like 검색**: Prisma 스키마 변경 0. `images->>'cafe_source_id' = 'PU-CAFE-E7hL-2881'` 패턴 `$queryRaw` 로 `findExistingCommunityPostByCafeSourceId()` 조회. cafe_source_id 에 **board id 포함**(게시판 간 dataid 중복 방지).
5. **익명게시판 = `author_nickname = "익명"` 고정**: `board.anonymousAuthor: true` 플래그로 강제. `images.cafe_author` 에도 원본 저장 **안 함**(PM Q3 "의도 존중"). 단 `images.cafe_dataid`/`source_url` 은 관리 목적으로 저장.
6. **1차 이전 = E7hL + bWL만**: `scripts/backfill-cafe-community.ts --board=E7hL|bWL|both --max-pages=N --list-only|--with-body --execute` CLI. `fetchBoardListApi` 재사용 → 페이지별 목록 수집 후 `article-fetcher.ts` 로 본문 가져와 `upsertCommunityPost()` 호출. 로컬 수동 실행(GH Actions 15분 타임아웃 위험).
7. **cron = cafe-sync.yml `--board=all` 의미 재정의**: 기존 3게시판 → 7게시판으로 확장. 단 `--board=games`(경기 3) / `--board=community`(일반 4) / `--board=all`(7게) 분기 CLI 추가(관측성). 별도 workflow 분리 불필요.

---

#### 실측 검증 (사전 조사, 2026-04-21)

| 조사 항목 | 결과 | 근거 | 결론 |
|---|---|---|---|
| 4 신규 게시판 HTTP 접근성 | ✅ 전부 200 | `curl -I m.cafe.daum.net/dongarry/{E7hL,bWL,N54V,IVd2}` → 200 / 27~32KB | 로그인 쿠키 없이도 목록 접근 (3게시판과 동일) |
| 각 게시판 grpid | **전부 `IGaj`** | HTML L245~L271 `...bbs_list?grpid=IGaj&fldid=<X>` | `fetchBoardListApi()` GRP_CODE 상수 재사용 |
| articles.push 블록 구조 | 3게시판과 동일 | E7hL/IVd2 샘플 각각 확인. dataid/fldid/title/writerNickname/articleElapsedTime/bbsDepth/thumbnailImageUrl 필드 전부 존재 | `fetcher.ts` 파싱 로직 무수정 |
| IVd2(익명) 작성자 필드 | **`writerNickname: ""`** (빈 문자열) | 실측 L446 `writerNickname: ""` | PM Q3 "익명 고정"과 일치 — fetcher 에서 빈값 통과 + upsert 에서 board.anonymousAuthor 로 `"익명"` 강제 |
| E7hL(BDR칼럼) 작성자 필드 | **실제 닉네임** ("운영진" 등) | L468 `writerNickname: "운영진"` | 원본 닉네임 저장(author_nickname 에) |
| 게시글 건수(1페이지) | E7hL 13건 / bWL 13건 / N54V 13건 / IVd2 13건 | articles.push 매칭 수 | 3게시판(보통 20건)보다 적음 — community_posts 이전 규모 E7hL 2881번글이 최신이라 적어도 수백~수천건 누적 가능성 |
| community_posts 스키마 | 확인 완료 | schema.prisma L794~L828 | `user_id(BigInt, NOT NULL FK→User)` / `title(VARCHAR)` / `content(Text nullable)` / `category(default "general")` / `author_nickname(VARCHAR 255)` / `images(Json)` 모두 존재. 신규 컬럼 불필요 |
| User 모델 필수 필드 | `email`+`passwordDigest` | schema.prisma L13~L14 모두 NOT NULL | 카페 봇 생성 시 dummy password hash 필요(bcrypt 랜덤) |
| `preferred_board_categories` | Json 배열, default `[]` | schema.prisma L58 | 신규 category `anonymous` 추가 시 기존 유저 영향 0 (빈 배열) |
| `categoryLabelMap` 사용처 | 3곳 (community-sidebar, post-detail-sidebar, community/[id]/page.tsx) | grep 결과 | UX 세션이 3곳 전부 `anonymous: "익명게시판"` 키 추가 필요. 본 세션 건드리지 않음 |

**⚠️ 미실측 중요 항목 (developer 1차 실행 때 확정 필요)**:
- E7hL/bWL 전체 글 수 (dataid 최대값 대비) — backfill 규모 결정
- common-articles API 가 4 신규 게시판에서도 `nextPage`/`articles` 응답 동일한지 — **단, Phase 3 #6 `fetchBoardListApi()` 자체가 아직 미구현**(scripts/sync-cafe.ts 에 `--max-pages` 파싱 로직 없음, workflow 에서 넘겨도 무시됨). → **사전 의존성**: Phase 3 #6 구현이 backfill 보다 선행 필요할 수 있음. 다만 1차 이전만이라면 `fetchBoardList` 20건 상한 × 여러 회 반복으로 대체 가능(임시).

---

#### 영향 파일

| # | 파일 | 변경 요지 | 라인 힌트 | 신규/수정 |
|---|---|---|---|---|
| 1 | `src/lib/cafe-sync/board-map.ts` | `CafeBoard` 인터페이스 확장(`target`/`category`/`anonymousAuthor`) + 7게시판 배열 + GRP_CODE 상수 | L31~L65 전반 | 수정 |
| 2 | `src/lib/cafe-sync/upsert.ts` | `upsertCommunityPost()` + `findExistingCommunityPostByCafeSourceId()` + `resolveCafeBotUserId()` + `previewCommunityUpsert()` 신규. 기존 `upsertCafeSyncedGame()` 무변경 | 파일 끝에 ~280줄 추가 | 수정 |
| 3 | `src/lib/cafe-sync/fetcher.ts` | **무수정** (파싱 로직 재사용, 4게시판 같은 SSR 구조 실측 확인) | — | — |
| 4 | `src/lib/cafe-sync/article-fetcher.ts` | **무수정** — 단 `parseCafeGame()` 호출은 games 경로만. community 경로는 `content` + `postedAt` 만 뽑아 반환하는 경량 경로 필요 → 플래그 `parseGame: boolean` 추가 or 신규 얇은 래퍼 `fetchArticleContent()` 분리 | L413~L593 부분 or 신규 export | 수정 (최소 20줄) |
| 5 | `scripts/sync-cafe.ts` | board.target 분기 로직 + community 경로 본문 fetch/upsert 호출 + CLI `--board=games\|community\|all` 분기 (기존 `--board=all` 의미 7게시판으로 확장) + dry-run 미리보기 확장 | L302~L423 메인 루프 + parseBoardArg L78 | 수정 |
| 6 | `scripts/seed-cafe-bot-user.ts` | 카페 봇 유저 멱등 upsert (email="cafe-bot@mybdr.local", passwordDigest=bcrypt(랜덤), status="active", isAdmin=false). dry-run 기본 + `--execute` | 신규 ~90줄 | **신규** |
| 7 | `scripts/backfill-cafe-community.ts` | 1차 이전 스크립트. `--board=E7hL\|bWL\|both` / `--max-pages=N` / `--list-only\|--with-body` / `--execute` / `--limit-per-page=50` | 신규 ~250줄 | **신규** |
| 8 | `.github/workflows/cafe-sync.yml` | CLI `--board=all` 유지 (7게시판 자동 포함) + `article-limit` 기본값 조정 여부 선택 | L143 인자 불변 | (선택) 수정 |
| 9 | `prisma/schema.prisma` | **무수정** (스키마 변경 0) | — | — |

**합계**: 신규 2 + 수정 3~4 + 무수정 2. **Prisma 마이그레이션 0. 운영 DB 영향 0**.

---

#### Q1~Q4 PM 결정 반영 상태

| # | PM 결정 | 본 설계 반영 지점 |
|---|---|---|
| Q1 시스템 유저 | "카페 봇" 신규 1명 생성 (모든 카페 글 user_id 고정) | `scripts/seed-cafe-bot-user.ts` + `resolveCafeBotUserId()` 런타임 캐시 |
| Q2 대회후기 → BDR칼럼 | category key `review` 유지, 라벨은 UX 세션 | `board.category = "review"` (E7hL). 본 세션은 DB 키만. UX 라벨 매핑은 건드리지 않음 |
| Q3 익명 닉네임 | `author_nickname = "익명"` 고정, 원본 저장 X | `board.anonymousAuthor = true` (IVd2) → upsert 에서 `"익명"` 강제, `images.cafe_author` 키 **저장 생략** |
| Q4 이전 우선순위 | 1차 E7hL+bWL, 2차 N54V+IVd2 | backfill 스크립트 `--board=E7hL\|bWL\|both` (기본 `both`). N54V/IVd2 는 cron 에서 신규 글만 포착 → 2차에서 별도 backfill |

---

#### 🅰️ board-map.ts 확장 스펙

```ts
// ─── 상수 추가 ─────────────────────────────────────────────────────────────
/** grpid (4 신규 게시판 실측 결과 전부 IGaj 동일) */
export const GRP_CODE = "IGaj";

// ─── 인터페이스 확장 ────────────────────────────────────────────────────
export interface CafeBoard {
  id: "IVHA" | "Dilr" | "MptT" | "N54V" | "IVd2" | "E7hL" | "bWL";
  /** 저장 대상 테이블 */
  target: "games" | "community_posts";
  /** 표시용 한글 라벨 */
  label: string;
  /** 게시판 식별 접두사 (cafe_source_id 생성 시) */
  prefix: string;

  // ─── games 경로 전용 ─────────────────────────────────
  /** games.game_type (target="games" 일 때만) */
  gameType?: "PICKUP" | "GUEST" | "PRACTICE";

  // ─── community_posts 경로 전용 ───────────────────────
  /** community_posts.category (target="community_posts" 일 때만) */
  category?: "general" | "anonymous" | "review" | "recruit";
  /** true 이면 author_nickname 에 "익명" 강제, images.cafe_author 생략 */
  anonymousAuthor?: boolean;
}

// ─── 7게시판 배열 ───────────────────────────────────────
export const CAFE_BOARDS: CafeBoard[] = [
  // 기존 3 경기 (games) — 순서 유지
  { id: "IVHA", target: "games", gameType: "PICKUP",   prefix: "PU", label: "픽업게임" },
  { id: "Dilr", target: "games", gameType: "GUEST",    prefix: "GU", label: "게스트 모집" },
  { id: "MptT", target: "games", gameType: "PRACTICE", prefix: "PR", label: "연습 경기" },
  // 신규 4 일반 (community_posts)
  { id: "E7hL", target: "community_posts", category: "review",    prefix: "BC", label: "BDR칼럼" },       // BDR Column
  { id: "bWL",  target: "community_posts", category: "recruit",   prefix: "RC", label: "구인구팀" },     // Recruit
  { id: "N54V", target: "community_posts", category: "general",   prefix: "GN", label: "자유게시판" },   // General
  { id: "IVd2", target: "community_posts", category: "anonymous", prefix: "AN", label: "익명게시판",     // Anonymous
    anonymousAuthor: true },
];
```

**⚠️ developer 주의**:
- 신규 category key `"anonymous"` 는 DB 에 존재하지 않는 값. community_posts.category 는 VarChar 라 제약 없어 자유롭게 INSERT 가능. 다만 UX 세션이 `categoryLabelMap` 에 추가 안 하면 "기타"로 표시됨(현행 방어 로직).
- `prefix` 는 cafe_source_id 재조립에 쓰임(`${prefix}-CAFE-${board}-${dataid}`). 신규 4개는 접두사 중복 없게 BC/RC/GN/AN 선택.
- 기존 `getBoardById()` 는 7개 모두 대응하도록 자동 동작.

---

#### 🅱️ 카페 봇 유저 생성 방법 확정

**결정**: **A안 (seed 스크립트 1회 실행) + 런타임 캐시**.

| 방법 | 장점 | 단점 | 채택 |
|---|---|---|---|
| A. `scripts/seed-cafe-bot-user.ts` 1회 실행 | 관찰 가능, 실수 방지, 재실행 멱등 | 사용자 명시 실행 필요 | ✅ |
| B. 수동 SQL INSERT | 빠름 | 재현 어려움, 가드 없음 | ❌ |
| C. sync/backfill 최초 실행 시 자동 upsert | 설치 간편 | 운영 DB 실수 실행 시 봇 유저가 운영 DB 에도 생김, 추적 어려움 | ❌ |

**User 필드 맵**(schema 확인 완료):

| 필드 | 값 | 이유 |
|---|---|---|
| `email` | `"cafe-bot@mybdr.local"` | `.local` TLD → 실제 수신 불가 (스팸/복구 오동작 방지). unique 제약 통과 |
| `passwordDigest` | `bcrypt.hash(randomUUID(), 10)` | NOT NULL 제약. 값은 영원히 쓰이지 않음 (로그인 차단) |
| `name` | `"카페 봇"` | 관리자 UI 표시용 |
| `nickname` | `"카페 봇"` | 공개 표시용 |
| `status` | `"active"` | 글 작성 가능 상태 유지(community_posts FK 사용). **비활성화 시 FK 조회 실패 risk 없음 — status 는 select 제약이라기보다 UI 플래그** |
| `isAdmin` | `false` | 관리자 권한 금지 |
| `bio` | `"다음카페(BDR 동아리)에서 자동 동기화된 게시글의 게시자 계정입니다."` | 사용자가 프로필 진입 시 목적 설명 |
| `profile_image_url` | `null` | 초기 null, 추후 UX 세션이 카페 로고 세팅 가능 |
| `membershipType` | `0` | 무료 기본 |
| 기타 nullable 필드 | 전부 생략(null/default) | 최소 풋프린트 |

**가드 설계 (abort 시나리오)**:

1. `seed-cafe-bot-user.ts` 시작 시 `assertDevDatabase()` (기존 관습 재사용).
2. `upsert({ where:{email}, update:{}, create:{...} })` — update 블록 비움(email 기반 재실행 시 no-op).
3. sync-cafe/backfill 시작 시 `findUnique({ where: { email: "cafe-bot@mybdr.local" }, select: { id: true } })` → null 이면 **즉시 throw**: `"카페 봇 유저 미존재 — scripts/seed-cafe-bot-user.ts --execute 먼저 실행"`.
4. 조회 결과 `id: BigInt` 를 **모듈 레벨 let 변수**에 캐시 (sync-cafe.ts 생존 기간 내 1회 조회로 충분).

---

#### 🅲 upsertCommunityPost 스펙

**위치**: `src/lib/cafe-sync/upsert.ts` 끝에 추가. `upsertCafeSyncedGame()` 과 대칭적 구조.

**입력 타입**:

```ts
export interface CafeCommunityInput {
  /** CAFE_BOARDS 엘리먼트 (target="community_posts") */
  board: CafeBoard;
  /** 카페 글 dataid (string 원본) */
  dataid: string;
  /** dataid Int 변환본 — 정렬/디버깅 용 */
  dataidNum: number;
  /** 제목 (마스킹 전 원본. upsert 내부에서 maskPersonalInfo 적용) */
  title: string;
  /** 본문 (호출자가 마스킹했거나 원본. upsert 2차 방어 마스킹) */
  content: string;
  /** 카페 원본 닉네임. board.anonymousAuthor=true 면 무시되고 "익명" 사용 */
  author: string;
  /** 게시 시각. null 이면 crawledAt fallback */
  postedAt: Date | null;
  /** 크롤 시각 */
  crawledAt: Date;
  /** (선택) 목록 썸네일 URL. images 배열 첫 요소로 저장 가능 */
  thumbnailUrl?: string | null;
  /** (선택) 게시글 headCont(말머리) — 예: "이슈"/"공지". images 메타에만 저장, 필수 아님 */
  headCont?: string | null;
}
```

**중복 방지 쿼리**:

```ts
async function findExistingCommunityPostByCafeSourceId(
  tx: Prisma.TransactionClient,
  cafeSourceId: string,
): Promise<bigint | null> {
  // images 는 Json, top-level ->> 로 문자열 뽑음. cafe_source_id 는 board id 포함된 고유값.
  const rows = await tx.$queryRaw<Array<{ id: bigint }>>`
    SELECT id FROM community_posts
    WHERE images->>'cafe_source_id' = ${cafeSourceId}
    LIMIT 1
  `;
  return rows.length > 0 ? rows[0].id : null;
}
```

- **성능**: community_posts 현재 규모 수백~수천 row. Full scan 허용 수준. **GIN index 선택 사항** (스키마 변경 = 운영 DB 영향, 현재 절대 금지 — 향후 N54V/IVd2 규모 시 재검토).
- **대안 기각**: `cafe_source_id` 전용 컬럼 추가 → 운영 DB 마이그레이션 필요 → CLAUDE.md 금지 규칙 위반.

**저장 매핑표**:

| 필드 | 값 | 비고 |
|---|---|---|
| `user_id` | 카페 봇 user.id (캐시) | 가드로 존재 필수 |
| `title` | `maskPersonalInfo(input.title)` | 제목에도 마스킹 1차 적용(제목에 전화 노출 경우 방어) |
| `content` | `maskPersonalInfo(input.content).slice(0, 30000)` | text 컬럼이라 길이 제한 없지만 비정상 대용량 가드 |
| `category` | `input.board.category` | "general"/"anonymous"/"review"/"recruit" |
| `status` | `"published"` | schema default 준수 |
| `author_nickname` | `board.anonymousAuthor ? "익명" : input.author \|\| "(닉네임 없음)"` | IVd2 는 원본 빈 문자열인데 "익명" 으로 치환 |
| `images` (Json) | 아래 객체 | 이미지 배열이 아니라 **메타 객체** (기존 커뮤니티 글은 배열인 경우 있음 — 카페 글만 객체 혼재) |
| `view_count` | `0` | 카페 조회수를 DB로 가져올 필요 낮음. viewCount 필드는 목록에 있으나 저장 생략 |
| `comments_count` | `0` | 실 댓글 수집 별도 과제. 가짜 카운트는 혼란 |
| `likes_count` | `0` | — |
| `created_at` | `input.postedAt ?? input.crawledAt` | games 경로와 동일 정책 |
| `updated_at` | `new Date()` | — |
| `public_id` | 자동 생성(uuid default) | schema dbgenerated |

**images 객체 스키마** (**배열이 아니라 객체** — 기존 커뮤니티 이미지 배열 구조와 다름, 타입 경계 명확):

```ts
const images = {
  // 카페 출처 식별
  cafe_source_id: `${board.prefix}-CAFE-${board.id}-${dataid}`,  // 예: "BC-CAFE-E7hL-2881"
  cafe_board: board.id,                                            // "E7hL"
  cafe_dataid: dataid,                                             // "2881"
  cafe_article_id: dataidNum,                                      // 2881 (Int)
  source_url: articleUrl(board, dataid),                           // https://m.cafe.daum.net/dongarry/E7hL/2881

  // 선택 메타
  cafe_head_cont: headCont || null,                                // "이슈" 등 말머리 (선택)
  cafe_thumbnail: thumbnailUrl || null,                            // 목록 썸네일 (선택)

  // 조건부 — 익명 아닌 경우만
  ...(board.anonymousAuthor ? {} : { cafe_author: input.author || null }),

  // cafe_created: postedAt ISO (games 경로와 동일)
  cafe_created: input.postedAt ? input.postedAt.toISOString() : null,

  // cafe_comments: Phase 2b 관습대로 빈 배열 (별도 수집 시 채움)
  cafe_comments: [],
} as const;
```

- **⚠️ 기존 커뮤니티 images 호환**: `community_posts.images` 는 현재 배열(`["url1","url2"]`) 또는 null 인 레코드만 존재. 우리 카페 출처는 **객체**로 저장 → 응답 직렬화 지점에서 `Array.isArray(images)` 분기 필요. 본 세션 범위 밖(UX 세션이 community API/렌더링에서 처리). **developer 는 이 분기 차이를 주석으로 명시**.
- **대안 기각**: images 를 배열로 유지하고 `[{cafe_source_id:...}, ...urls]` 혼합 → 배열 첫 요소만 카페 메타로 쓰는 해킹 — 검색 쿼리(`images->>'cafe_source_id'`) 동작 불가.

**메인 함수 시그니처**:

```ts
export async function upsertCommunityPostFromCafe(
  prisma: PrismaClient,
  cafeBotUserId: bigint,
  input: CafeCommunityInput,
): Promise<CafeCommunityResult> {
  assertDevDatabase();

  // 1차 방어 마스킹 (content + title 둘 다)
  const safeContent = maskPersonalInfo(input.content);
  const safeTitle = maskPersonalInfo(input.title);

  try {
    return await prisma.$transaction(async (tx) => {
      const cafeSourceId = `${input.board.prefix}-CAFE-${input.board.id}-${input.dataid}`;

      // 중복 체크
      const existingId = await findExistingCommunityPostByCafeSourceId(tx, cafeSourceId);
      if (existingId !== null) {
        return { communityPost: "skipped_duplicate", communityPostId: existingId };
      }

      // INSERT (images 객체는 Prisma.InputJsonValue 캐스트)
      const row = await tx.community_posts.create({
        data: {
          user_id: cafeBotUserId,
          title: safeTitle,
          content: safeContent.slice(0, 30_000),
          category: input.board.category!,
          author_nickname: input.board.anonymousAuthor ? "익명" : (input.author || "(닉네임 없음)"),
          status: "published",
          images: buildCafeImagesMeta(input, cafeSourceId) as unknown as Prisma.InputJsonValue,
          created_at: input.postedAt ?? input.crawledAt,
          updated_at: new Date(),
        },
      });

      return { communityPost: "inserted", communityPostId: row.id };
    });
  } catch (err) {
    return { communityPost: "failed", communityPostId: null, error: String(err) };
  }
}

export interface CafeCommunityResult {
  communityPost: "inserted" | "skipped_duplicate" | "failed";
  communityPostId: bigint | null;
  error?: string;
}
```

**previewCommunityUpsert(input)** 는 DB 접근 0 으로 `{ cafeSourceId, category, authorNickname, willInsert, images }` 반환. dry-run 로그용.

---

#### 🅳 sync-cafe.ts 분기 상세

**CLI 옵션 확장**:

```
--board=<X>     : IVHA | Dilr | MptT | N54V | IVd2 | E7hL | bWL
                  | games        (3 경기)
                  | community    (4 일반)
                  | all          (7 전부, 기본)
```

**메인 루프 변경** (기존 L302~L423):

```ts
// (a) 봇 유저 조회 (community 포함 시에만)
let cafeBotUserId: bigint | null = null;
const hasCommunityTarget = targets.some(b => b.target === "community_posts");
if (EXECUTE_MODE && withBody && hasCommunityTarget && prisma) {
  cafeBotUserId = await resolveCafeBotUserId(prisma);  // null 이면 throw
}

// (b) board 순회 — 기존과 동일 + 분기 추가
for (const board of targets) {
  // 목록 fetch 공통
  const items = await fetchBoardList(board, limit, { debug });
  printBoardResult(board, items);

  if (!withBody || items.length === 0) continue;

  const targetItems = items.slice(0, articleLimit);

  for (let i = 0; i < targetItems.length; i++) {
    const it = targetItems[i];
    const r = await fetchArticle(board, it.dataid, { debug });

    if (!r.content) continue;

    const maskedContent = maskPersonalInfo(r.content);

    // ─── 분기 ──────────────────────────────
    if (board.target === "games") {
      // 기존 로직 (무변경)
      const syncInput: CafeSyncInput = { board, dataid: r.dataid, dataidNum: it.dataidNum, ... };
      if (EXECUTE_MODE && prisma) await upsertCafeSyncedGame(prisma, syncInput);
      else console.log(previewUpsert(syncInput));
    } else {
      // 신규 community 경로
      const commInput: CafeCommunityInput = {
        board,
        dataid: r.dataid,
        dataidNum: it.dataidNum,
        title: it.title,
        content: maskedContent,
        author: it.author,
        postedAt: r.postedAt ?? it.postedAt,
        crawledAt: new Date(),
        thumbnailUrl: it.thumbnailUrl ?? null,  // fetcher 가 이미 thumbnailImageUrl 추출하면
        headCont: null,  // 선택
      };
      if (EXECUTE_MODE && prisma && cafeBotUserId) {
        await upsertCommunityPostFromCafe(prisma, cafeBotUserId, commInput);
      } else {
        console.log(previewCommunityUpsert(commInput));
      }
    }
  }
}
```

**본문 파싱 차이**:
- games 경로: `parseCafeGame(content, postedAt)` 호출 → `r.parsed` 생성 → upsert 가 venue/scheduled_at 등 뽑음
- community 경로: **`parseCafeGame` 호출 스킵**. 본문 원본 + postedAt 만 필요. 현재 `fetchArticle()` 은 항상 parseCafeGame 호출하므로 작은 최적화: 플래그 `skipGameParse: boolean` 추가, community 보드에서 true 지정 → parseCafeGame 미호출 & 본문/postedAt 만 반환. **(선택 최적화, 없어도 기능 동작)**
- **기각 대안**: parseCafeGame 결과를 무시 — 현재 방식. 파싱 비용은 regex 수십개 수준이라 무시 가능. 최적화 선택사항.

---

#### 🅴 backfill-cafe-community.ts 스펙

**CLI**:

```
--board=E7hL | bWL | both           기본 both
--max-pages=N                        1~20 (기본 3. 초기 안전)
--limit-per-page=50                  20(HTML SSR) or 50(API)
--list-only                          목록만 수집(본문 fetch 0, 중복 후보 출력)
--with-body                          본문 fetch + upsert (기본 --list-only)
--execute                            실제 DB 쓰기 (없으면 dry-run preview)
--start-page=N                       중단 재개용 (기본 1)
```

**실행 플로우**:

1. `assertDevDatabase()` + 카페 봇 유저 존재 가드 (community 쓰기 시)
2. `--board=both` 면 E7hL → bWL 순차 (안전하게 1개씩)
3. board별 페이지 루프:
   - 페이지 1: `fetchBoardList(board, 20)` (기존 HTML SSR)
   - 페이지 2+: `fetchBoardListApi(board, pageN, cursor)` (Phase 3 #6 필요 — **미구현 시 페이지 1만 수집 + 경고 출력**)
   - 종료 조건: articles:[] / maxPages 도달 / dataid 중복(기존 수집본과 겹침) / 403·429 3연속
4. 목록 합치기 → dataid desc 정렬(중복 제거)
5. `--list-only` 면 dataid/title 테이블만 출력, 종료
6. `--with-body` 면 각 dataid 순회:
   - `fetchArticle(board, dataid, { skipGameParse: true })` → content + postedAt
   - `upsertCommunityPostFromCafe()` 또는 preview
   - 3초 sleep (9가드 #1, article-fetcher 내부가 이미 처리)
7. 최종 집계: inserted / skipped_dup / failed / 페이지별 수집 수

**예상 건수** (미실측, backfill 실행 시 확정):
- E7hL 최대 dataid=2881 관측 → 누적 2881건 가능성
- bWL 확인 필요

**연속 실패 3회 시**: 중단 + `--start-page=N` 안내 로그 (사용자 재개 가능)

**실행 권장**:
- **로컬 수동** (GH Actions 15분 timeout 넘을 가능성). 수백 건이면 본문 fetch 만 1건 3초 × 500건 = 25분
- 1차 시도 `--max-pages=3 --with-body --execute` 로 60건 미만 smoke → OK 시 `--max-pages=20` 확장

---

#### 🅵 자동화 (cron) 영향

**선택**: **기존 cafe-sync.yml 수정 최소** (CLI 인자 그대로).

- 현재 workflow: `--board=all --with-body --article-limit=5 --max-pages=2`
- `--board=all` 확장 후 7게시판 전부 매시 순회 — 1게시판당 fetchBoardList(3초 sleep × limit 10회) + fetchArticle(3초 sleep × articleLimit 5회) = 약 45초/게시판 × 7 = **약 5분/실행**
- 15분 timeout 여유 충분
- **관측성 우려**: 로그 볼륨 2배+. artifact size 만 증가 — 허용 가능
- **대안 검토 결과**: 별도 `cafe-sync-community.yml` 분리 → 관심사 분리 장점 있으나 봇 유저/DB 가드/Secret 중복. **1차 도입에선 통합 유지**. 일반 게시판 실패율이 높으면 3주차에 분리 고려.

**필요 변경 (선택)**:
- `--article-limit=5` 기본값 유지 (매시 게시판당 최근 5건만 갱신). 신규 글 커버 충분.
- Slack 알림 grep 패턴 재검토 (기존 `[IVHA|Dilr|MptT]` → 7게시판 확장). nice-to-have.

---

#### 🅶 UX 세션 핸드오프 목록

본 세션 이후 UX 세션(원영/별도 세션)이 처리할 작업:

| # | 파일 | 변경 | 참조 |
|---|---|---|---|
| 1 | `src/app/(web)/community/_components/community-sidebar.tsx` | L21 `review: "대회후기"` → `"BDR칼럼"` + `anonymous: "익명게시판"` 키 추가 | PM Q2 |
| 2 | `src/app/(web)/community/_components/community-content.tsx` | L36 `review: { label: "대회후기" ... }` → `"BDR칼럼"` + `anonymous` 엔트리 추가 | PM Q2 |
| 3 | `src/app/(web)/community/[id]/page.tsx` | L55 `review: "대회후기"` → `"BDR칼럼"` + `anonymous` | — |
| 4 | `src/app/(web)/community/[id]/_components/post-detail-sidebar.tsx` | L9 동일 | — |
| 5 | 커뮤니티 탭 UI | "익명게시판" 탭 추가 (사이드바 네비) | PM Q3 |
| 6 | 카페 출처 상세 UI | 원본 링크 표시 + 카페 봇 유저 프로필 처리 + `images` 객체형 렌더링 분기(배열 vs 객체) | 신규 |
| 7 | 카페 봇 유저 프로필 페이지 | 카페 글 목록 탭 or 전용 페이지 | 선택 |
| 8 | 글쓰기 폼 category 옵션 | `new/page.tsx` + `[id]/edit/page.tsx` 에 anonymous/review 라벨 반영 | 선택 |

본 세션은 **DB 쪽 키만 세팅**. 라벨/UI는 전부 UX 세션. `categoryLabelMap` 3곳에 키 없으면 fallback 으로 "기타" 표시 (기존 코드 방어 로직).

---

#### 실행 로드맵 (3단계)

| 단계 | 작업 | 예상 시간 | 실행 |
|---|---|---|---|
| **Stage A** (본 세션) | 파이프라인 구현 — board-map 확장 + seed-cafe-bot-user + upsertCommunityPost + sync-cafe 분기 + backfill 스크립트 골격 + tsc/smoke | **3~4h** | developer |
| **Stage B** | 카페 봇 유저 seed 실행(1회) + E7hL `--max-pages=3 --with-body --execute` (smoke) + 관측 | **15~30분** | 사용자 수동 |
| **Stage C** | E7hL + bWL `--max-pages=20 --with-body --execute` 본 이전 | **1~2h** (본문 fetch 500~1000건 × 3초) | 사용자 수동, 로컬 |
| **Stage D** (후속) | N54V + IVd2 — 2주차 이후 PM 재결정 | 2차 backfill 또는 cron 자연 수집 | — |

**Stage A 세부** (developer 작업 단위):

| 순서 | 작업 | 담당 | 선행 |
|---|---|---|---|
| 1 | board-map.ts 인터페이스/상수/배열 확장 | developer | — |
| 2 | scripts/seed-cafe-bot-user.ts 신규 | developer | 1 |
| 3 | upsert.ts 에 upsertCommunityPostFromCafe + resolveCafeBotUserId + previewCommunityUpsert 추가 | developer | 1 |
| 4 | article-fetcher.ts 에 skipGameParse 플래그(선택) | developer | — |
| 5 | sync-cafe.ts 분기 로직 + CLI 확장 | developer | 3 |
| 6 | scripts/backfill-cafe-community.ts 신규 | developer | 3,5 |
| 7 | tester + reviewer 병렬 | tester+reviewer | 1~6 |

최대 7단계. reviewer/tester 병렬 실행 가능.

---

#### 리스크 & 완화

| # | 리스크 | 영향 | 완화 |
|---|---|---|---|
| R1 | Phase 3 #6 `fetchBoardListApi` 미구현 → backfill 시 1페이지 20건 상한 | E7hL 전체 글 수집 불가, 최근 20건만 | 1차 smoke 단계에서 1페이지 OK 확인 후 Phase 3 #6 구현과 연계. 또는 backfill 스크립트 내부에서 임시 구현(공통 함수 분리) |
| R2 | community_posts.images 객체형 저장이 기존 응답 직렬화에서 배열 가정과 충돌 | 커뮤니티 목록/상세 UI 깨짐 | **본 세션은 INSERT 만 담당, UX 세션 렌더링 분기**. Stage B 이전 전에 UX 세션에서 방어 로직 먼저 배포 필요 (의존성 기록) |
| R3 | 카페 봇 user_id FK 제약 실수 | INSERT 실패 | seed 실행 + 가드 2중 (런타임 findUnique null 시 abort) |
| R4 | 익명게시판 원본 닉네임 `""` 빈 문자열 저장 실수 | 개인정보 침해 가능성 없음, 단 "익명" 고정 실패 | `board.anonymousAuthor` 플래그 단일 소스 — upsert + preview 둘 다 같은 플래그 읽음 |
| R5 | cafe_source_id 중복 검사 full-table scan (수천~수만 row 미래) | 느림 | 1차에선 허용 (수천 scale). GIN index는 운영 DB 변경 금지로 보류. 필요 시 app-level cache(LRU) 도입 |
| R6 | dataid 중복 (게시판 간 같은 dataid) | 같은 `BC-CAFE-E7hL-3` vs `RC-CAFE-bWL-3` 충돌? | **cafe_source_id 에 board 포함** → 안전 |
| R7 | Slack 알림 grep 패턴 불일치 (IVHA/Dilr/MptT만 매칭) | 7게시판 알림 요약 누락 | cafe-sync.yml L175 grep 패턴 확장 (nice-to-have) |
| R8 | backfill 로컬 수동 중단 시 재개 복잡 | 운영 귀찮음 | `--start-page=N` + dataid 중복 자동 스킵(upsert skipped_duplicate)으로 재실행 안전 |
| R9 | `writerNickname: ""` 인 글이 IVd2 외에 있을 경우 author_nickname `"(닉네임 없음)"` 로 저장됨 | 실사용자 닉네임 누락 | board.anonymousAuthor=false 인 보드에서 빈 문자열 fetcher 에서 그대로 내려옴. IVd2 외에는 실측 공란 0건 확인 필요 |
| R10 | `parseCafeGame` 을 community 본문에 호출해도 crash 는 안 나지만 metadata hint 가 이상해질 수 있음 | 현재 games 경로와 공유 안 함 — 영향 0 | community 는 parsed 필드 자체 저장 안 함. 부작용 없음 |

---

#### tester 검증 포인트 (Stage A 완료 시)

1. tsc --noEmit 통과 (전체 프로젝트)
2. `seed-cafe-bot-user.ts --dry-run` → 카페 봇 User 생성 예정 미리보기 1건
3. `seed-cafe-bot-user.ts --execute` → 1건 INSERT (멱등 재실행 시 no-op)
4. sync-cafe `--board=E7hL --limit=2 --with-body --execute` 로 2건 inserted 확인
5. `/api/web/community?category=review` 응답에 카페 출처 글 포함 확인 (원영 UX 세션 배포 후 대등 검증)
6. 중복 재수집 시 skipped_duplicate 정상 동작 (`--execute` 2회)
7. IVd2 smoke — `--board=IVd2 --limit=1 --with-body --execute` 로 author_nickname = "익명" 저장 확인
8. community_posts.images 객체 구조 JSON 검증 (`SELECT images FROM community_posts WHERE images->>'cafe_source_id' LIKE 'BC-CAFE-%' LIMIT 1`)

---

#### 예상 작업 시간

| 단계 | 작업 | 시간 |
|---|---|---|
| A1 | board-map.ts 확장 | 15분 |
| A2 | seed-cafe-bot-user.ts | 30분 |
| A3 | upsert.ts 추가 (타입+함수+preview) | 60분 |
| A4 | article-fetcher.ts skipGameParse (선택) | 15분 |
| A5 | sync-cafe.ts 분기 + CLI 확장 | 45분 |
| A6 | backfill-cafe-community.ts | 60분 |
| A7 | tester+reviewer 병렬 검증 | 30분 |
| **Stage A 합계** | | **약 4h** |
| Stage B | E7hL smoke 실행 + 관측 | 30분 |
| Stage C | E7hL + bWL 본 이전 | 1~2h |
| **총계 (Stage A~C)** | | **약 6~7h** |

---

#### developer 착수 가능 여부

**Y (즉시 착수 가능)** — 차단 요소 없음.

**확인 완료**:
- 4 신규 게시판 HTTP 200 + grpid=IGaj 동일 실측
- articles.push SSR 구조 3게시판과 동일 실측 (fetcher.ts 무수정)
- community_posts/User 스키마 재확인 (신규 컬럼 불필요)
- Prisma 마이그레이션 0, 운영 DB 영향 0
- UX 세션과 경계 명확 (DB 쓰기 vs 라벨/렌더링)

**PM 판단 필요 (2건, nice-to-have)**:
1. **images 객체 vs 배열 구조** — planner 권장: 객체. UX 세션이 배열/객체 분기 처리 전제. PM 이 "배열 혼합형" 원하면 설계 변경(권장X).
2. **1차 Stage C 실행 시점** — Stage A 완료 즉시 실행 vs UX 세션 community API/렌더링 방어 배포 이후. planner 권장: **UX 세션 방어 배포 이후**. 그 전엔 dry-run + `--list-only` 로 수집 규모만 확인.

**⚠️ developer 주의**:
- `src/lib/parsers/cafe-game-parser.ts` 절대 수정 금지 (vitest 59/59 보호)
- `scratchpad.md` (본 세션 아님) 건드리지 않음
- UX 파일(`src/app/(web)/community/*`) 건드리지 않음
- `prisma/schema.prisma` 건드리지 않음
- 카페 봇 user_id 캐싱 실패 시 sync-cafe 즉시 abort (모호하게 0 이나 NaN 넣지 말 것)

---

| Phase | 단계 | 상태 | 핵심 커밋 |
|-------|------|------|-----------|
| 1 | 3게시판 목록 POC (30건 수집) | ✅ 완료 | PR #39 |
| 2a | 본문 fetch + 마스킹 (dry-run) | ✅ 완료 | `2890224` / `55d78c3` |
| 2b Step 1 | upsert.ts + `--execute` 통합 | ✅ 완료 | `546a5c3` |
| 2b Step 4 | extract-fallbacks (6필드 재추출) | ✅ 완료 | `6d2dac5` |
| 2b 품질 보강 | 마스킹 3중 + script 제거 + venue/시간 | ✅ 완료 | `2af6719` |
| 2b 지속동기화 기반 | postedAt fallback + created_at 덮어쓰기 + MptT 강제 + DISTRICT_TO_CITY | ✅ 완료 | `4826018` |
| 3 | GH Actions 자동화 | ⏳ **대기** | — |

---

## 🧭 Phase 3 체크리스트 (다음 세션에서 할 일)

| # | 작업 | 예상 | 비고 |
|---|------|------|------|
| 1 | `.github/workflows/cafe-sync.yml` 작성 | 30분 | 30분 cron + Playwright + secrets |
| 2 | GitHub Secrets 등록 | 15분 | `DAUM_CAFE_STORAGE_STATE_B64` / `DATABASE_URL_DEV` / `SLACK_WEBHOOK` |
| 3 | 쿠키 자동 갱신 스크립트 (`scripts/refresh-cookie.ts`) | 30분 | 로컬 재로그인 → base64 encode → `gh secret set` |
| 4 | Slack/Discord 실패 알림 | 15분 | `if: failure()` + webhook |
| 5 | `/admin/cafe-sync` 페이지 | 90분 | 수동 트리거(gh api) + 수집 통계 + 쿠키 만료 경고 |
| 6 | **Pagination** (20건 상한 극복) | 45분 | Daum 카페 모바일 목록 URL 분석 + `?page=N` 또는 커서 |
| 7 | **시분 정확도** (목록+상세 결합) | 45분 | BoardItem.postedAt 날짜 + `.num_subject` 시분 결합 |
| 8 | **city 추출률** 개선 | 30분 | DISTRICT_TO_CITY 확장 + 광역 표기 변형 |
| 9 | 전체 수집 테스트 | 실행 시간만 | 각 게시판 100건+ |
| **합계** | — | **~5~6시간** | 집중 2~3세션 권장 |

---

## 🚀 세션 시작 시 체크리스트 ("다음카페 작업 시작하자" 트리거)

```
1. git fetch origin --prune + 원격 subin 동기화
2. .auth/cafe-state.json 존재 + 만료 여부 확인
3. 만료 시: npx tsx scripts/cafe-login.ts 재실행
4. Phase 2a 재검증 스모크:
   npx tsx --env-file=.env --env-file=.env.local scripts/sync-cafe.ts \
     --board=IVHA --limit=3 --with-body --article-limit=2
   → 본문 200 OK × 2/2 + upsert 예정 미리보기 확인
5. DB 상태 확인:
   npx tsx --env-file=.env --env-file=.env.local scripts/inspect-games-cafe-meta.ts
6. 이 파일의 Phase 진행 상황 확인 → 다음 작업 선택
7. 본 세션의 scratchpad.md 는 건드리지 않음 (UX 세션 전용)
```

---

## 🎛️ 주요 결정 이력

### D1 — 신규 INSERT metadata 키 포맷 (2026-04-19)
**B 선택**: `cafe_dataid` / `cafe_board` / `source_url` 분리 키 + `cafe_source_id` 구 호환 병기.

### D2 — cafe_source_id 누락 9건 처리 (2026-04-19)
**A 선택**: 스킵 → **이후 카페 출처 전부 DELETE로 자연 해소**.

### D3 — 역방향 백필 매칭 (2026-04-19)
**A 선택**: 정규식 매칭 → **이후 DELETE로 미실행**.

### 카페 출처 DB 초기화 (2026-04-20)
**카페 출처 118건 DELETE + cafe_posts 15건 DELETE**. 일반 159건 보존. 사용자 승인.
근거: 외부 크롤러 데이터와 Phase 2b 데이터 혼재 해소 + 깨끗한 재시작.

### PRACTICE 게시판 board 강제 (2026-04-20)
**MptT는 `board.gameType` 값 고정**. parser가 "게스트 모집" 키워드로 GUEST 오분류 방어.
IVHA/Dilr는 혼재 글 많으므로 parser 재분류 유지.

### /games 정렬 정책 (2026-04-20)
**`games.created_at = 카페 게시 시각(postedAt)` 저장** → `orderBy: created_at desc` 자연스러운 카페 최신 순.
일반 게임은 이 코드 경로 안 타므로 영향 없음.

### Phase 3 아키텍처 — GitHub Actions 주력 + Coworker 보조 (2026-04-20)
- **GH Actions (30분 cron)**: Playwright + Secrets + 자동 로그/알림. 비용 0.
- **Claude Coworker (옵션)**: 실패율 임계치 시 정규식 보강/디버깅. 비용 절약.
- **비추천**: Coworker 주력 (결정적 로직이라 AI 판단 불필요, 매 30분 토큰 낭비)

---

## 💡 운영 팁 (카페 sync 전용)

- **tsx 실행**: `--env-file=.env --env-file=.env.local` (둘 다 지정 필수. DATABASE_URL은 `.env`만 있음)
- **쿠키 갱신**: `npx tsx scripts/cafe-login.ts` (브라우저 headed → 로그인 → Enter)
- **storageState 경로 override**: 환경변수 `DAUM_CAFE_STORAGE_STATE=/path/to.json`
- **한 페이지 상한**: **20건** (Daum 카페 HTML articles.push 블록 수)
- **운영 DB 가드**: `DATABASE_URL`에 `bwoorsgoijvlgutkrcvs` 포함 여부 검사 (upsert.ts + sync-cafe.ts 2중)
- **개발 서버 재시작**: `netstat -ano | findstr :3001` → `taskkill //f //pid <PID>` (node.exe 통째 금지)
- **임시 스크립트 네이밍**: `scripts/_tmp-*.ts` (검증/삭제 후 즉시 삭제)

---

## ⚠️ 알려진 한계 (Phase 3에서 해결)

| # | 한계 | 현재 실측 | 목표 |
|---|------|-----------|------|
| 1 | **Pagination 없음** | 각 게시판 최근 20건만 접근 | 전체 수집 (카페 페이지 전 순회) |
| 2 | **시분 정확도** | 당일 글만 시분 정확, 과거 글은 날짜만(시분 0:00) | 전체 시분 정확 |
| 3 | **city 추출률** | 13% (역매핑 적용 후) | 80%+ |
| 4 | **venue 추출** | 73% (주소성 거부 후) | 85%+ |
| 5 | **parseCafeGame 정확도** | IVHA 낮고 Dilr/MptT 높음 (본문 양식 차이) | 유지 (parser 수정 금지) |

---

## 📜 작업 로그 (카페 sync 전용, 최근 10건)

| 날짜 | 작업 | 커밋 |
|------|------|------|
| 04-21 | **7게시판 확장 + 전체 이전 설계안 (planner-architect)** — 신규 4게시판 grpid=IGaj 실측 ✅ + articles.push 구조 동일 ✅ + IVd2 writerNickname="" 실측. 영향 파일 5 수정 + 2 신규 + Prisma 마이그레이션 0. 카페 봇 유저 seed + upsertCommunityPostFromCafe + images 객체형(cafe_source_id 에 board 포함) + sync-cafe board.target 분기 + backfill-cafe-community 스크립트 + Q1~Q4 PM 결정 전부 반영. Stage A 4h / B 30분 / C 1~2h. developer 착수 가능 | (설계만) |
| 04-21 | **game_type 오분류 수정** — 3게시판 전면 board 강제 + `buildMetadataHints()` 헬퍼 export + mixed_type_hint/parser_game_type 키 기록 + IVHA 7건 백필 (1→0) + smoke 통과. 검증 쿼리 3게시판 × game_type 혼재 0건, vitest upsert 4/4 + parser 59/59 유지 | `4fd75e4` + `013bef6` |
| 04-21 | **검증봇 복구 (Revert #3)** — 터미널 병행 작업 중 생긴 분리 커밋 531879a 를 revert. verify-cafe-sync.ts + cafe-sync-verify.yml 복구, scratchpad 검증봇 기록 복원 | (revert 예정) |
| 04-21 | **품질 검증봇 리뷰 (reviewer)** — R1~R10 완료. 블록커 1개(R5 Linux CI 인자 수동 쿼터링 → 라벨/이슈/코멘트 기형) + 권장 4개. 1주차 dry-run 동안은 발현 X 이므로 2주차 전환 전 반드시 수정. 판정: 커밋 가능 여부 ❌(블록커 해소 권장) | (리뷰만) |
| 04-21 | **품질 검증봇 tester 검증 (10/10 시나리오)** — T1 tsc=0 / T2 YAML+cron OK / T3 dry-run severity=alert exit=1 JSON 생성 Secret 누설 0 gh issue 생성 0 / T4~T6 통과 / T7 로직 정확하나 **R5 블록커 재확인**(Linux spawnSync 이중 쿼터, 2주차 전환 전 수정 필수) / T8~T10 통과. 커밋 조건부 가능 — R5 수정 후 커밋 권장 | (미커밋) |
| 04-21 | **품질 검증봇 구현 (developer)** — `scripts/verify-cafe-sync.ts` (897줄) + `.github/workflows/cafe-sync-verify.yml` (141줄) 신규. 6지표(I1~I6) 집계 + severity 판정 + GH Issue 자동 관리 + Windows/Linux 호환. tsc 통과, dry-run 로컬 검증 완료 (I1=23 ok / I4=0d ok / I6=0/3 alert → 전체 alert, 판정 정상). sync-cafe.ts / cafe-sync.yml 무수정. 1주차 schedule 기본 dry-run, 2주차 workflow_dispatch 로 --execute-issues 테스트 | (미커밋) |
| 04-21 | **품질 검증봇 설계안 (planner-architect)** — 6개 지표(I1~I6) 확정 + 임계치 튜닝 근거 + GitHub Issue API 연동 세부. Secret `updated_at` 접근 가능성 실측 ✅. sync-cafe.ts/cafe-sync.yml 무수정. 신규 파일 2개(`scripts/verify-cafe-sync.ts` + `.github/workflows/cafe-sync-verify.yml`). 1주차 dry-run → 2주차 이슈 활성화 롤아웃. 구현 예상 3.5h. developer 착수 가능 | (설계만) |
| 04-20 | **D 미니 (extractPostedAt .num_subject 폴백)** — 상세 HTML 유일 시간 소스(.num_subject)를 4번째 fallback으로 추가. 과거 글 시분은 카페 원천 미제공 실측 확정(5/5 YY.MM.DD). postedAt null 5/5 → 0/5. tsc OK, 스모크 5/5 200 | `c84aba0` |
| 04-20 | **A+E 완료 (카페 게시 순서 tie-break)** — metadata.cafe_article_id(Int) 저장 + listGames 메모리 정렬(created_at desc → cafe_article_id desc null last) + noticeContainer 방어 가드 + 기존 15건 백필 execute 완료. tester T1~T6 / reviewer R1~R6 전부 통과, 블록커 0 | `4bc41bf` |
| 04-20 | **Phase 2b 지속동기화 기반** — postedAt fallback / created_at=카페게시순 / MptT PRACTICE 강제 / DISTRICT_TO_CITY 역매핑. 카페 출처 118건 초기화 + 3게시판 각 5건 재수집 | `4826018` |
| 04-20 | **Phase 2b 품질 종합 보강** — 마스킹 3중 방어 + script 제거 + venue 20자 제한 + 시간 정규식 확장 | `2af6719` |
| 04-19 | **Phase 2b Step 4 (extract-fallbacks)** — 본문 재추출 (scheduledAt/fee/venue/city/district/skillLevel) | `6d2dac5` |
| 04-19 | **Phase 2b Step 1** — upsert.ts 신규 + sync-cafe `--execute` 통합 + 운영 DB 2중 가드 | `546a5c3` |
| 04-19 | **Phase 2a 완료** — Playwright `cafe-login.ts` + storageState 쿠키 로드 → 본문 200 × 2/2 | `55d78c3` |
| 04-19 | **Phase 2a 코드** — mask-personal-info + article-fetcher + sync-cafe `--with-body` | `2890224` |
| 04-19 | **cafe-sync 계획 문서** (`Dev/cafe-sync-plan-2026-04-19.md`, 628줄) | `3cd61c4` |
| 04-19 | **Phase 1 POC** — 3게시판 30건 실제 수집 (articles.push 정규식) | PR #39 |
| 04-19 | 다음카페 크롤링 법적/기술 리스크 리서치 (9가드 decisions 승격) | — |

---

## 🔗 관련 PR

- **PR #39** (머지됨, 2026-04-19) — Phase 1 POC 포함
- **PR #45** (머지됨, 2026-04-19) — Phase 1 + 2a + Step 1 통합
- **PR #46** (OPEN, 작업 중) — UX 세션 주도, 카페 커밋들이 fast-forward로 자연 합류
