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

## 🏁 Phase 진행 상황

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
