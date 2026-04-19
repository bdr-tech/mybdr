# 다음카페 지속 동기화 — 실행 계획 + Claude Code 프롬프트

> 작성: 2026-04-19  
> 기반: planner-architect 기획설계 (`.claude/scratchpad.md` 2026-04-18)  
> PM: Cowork (Claude) · 실행: Claude Code CLI · 런타임: Vercel Cron + GitHub Actions  
> 결과물: Phase 1·2·3 프롬프트 16종 + 결정 권장안 5건 + 저작권 메모 + UX 병행 일정

---

## 0. 한눈에 보기

| 구분 | 내용 |
|------|------|
| **목표** | 다음카페 3개 게시판(IVHA/Dilr/MptT) 신규 글을 30분 이내 `/games`에 자동 반영 |
| **기존 자산** | `cafe_posts` 테이블(0건 빈 상태), `cafe-game-parser.ts`(vitest 59/59), 외부 크롤러 데이터 112건 |
| **핵심 결정** | Vercel Cron(목록 HTTP) + GitHub Actions(Playwright 본문) 하이브리드 |
| **스키마 변경** | 사실상 없음 (`cafe_posts` 재활용 + `games.metadata` 키 2개 추가) |
| **저작권 처리** | 본문은 cafe_posts에 보존하되 `/games` 노출은 파싱 결과 + 원본 링크 |
| **총 공수** | Phase 1 (3h) + Phase 2 (5h) + Phase 3 (7h) = **약 15시간** |
| **기간** | UX 일정과 병행, 평일 저녁 1~2시간 → **약 2주** |

---

## 1. 5가지 결정사항 — 제 권장안

| # | 질문 | 권장 | 근거 |
|---|------|------|------|
| 1 | Phase 1 POC 즉시 착수? | ✅ **YES** | 2~3시간이면 끝, 모바일 HTML 파싱 가능 여부를 빨리 검증 가능. 안 되면 Playwright 위주로 재설계 필요해서 **조기 발견이 비용 절감** |
| 2 | 다음카페 로그인 쿠키 보유? | ✅ **있음 → Phase 2 풀 기능** | 본문 파싱 가능 → 라운드/주장/선수 등 9항목 자동 추출 가능. 사용자가 답변에서 "있음" 확인 |
| 3 | 동기화 주기 | ⏰ **30분** | 5분은 카페 서버에 부담·우리도 비용↑, 1시간은 사용자 체감 늦음. 30분이 sweet spot. **동시에 admin UI에 "지금 동기화" 수동 트리거** 두면 급할 때 해소 |
| 4 | 기존 외부 크롤러 처리 | 🔄 **새 시스템으로 대체 + 기존 112건 백필** | 9일간 멈췄으니 재개 가능성 낮음. 다만 기존 112건의 `cafe_source_id` 만 있고 `cafe_posts` 연결은 없음 → **새 시스템 가동 후 1회 역방향 백필**로 정합성 맞춤 |
| 5 | 에러 알림 채널 | 📨 **Phase 3에서 Slack Webhook (없으면 이메일)** | Slack은 무료 webhook이 가장 가벼움. 쿠키 만료·파싱 실패율 급증·Cron 미실행 3개 알림만 받기 시작 |

---

## 2. 저작권·약관 검토 메모

### 다음카페 약관 관련
- 다음카페 이용약관상 **회원이 게시한 콘텐츠의 저작권은 회원에게 귀속**(약관 8조 일반 패턴). 카페 운영자도 이를 변경할 권한 없음
- 우리가 본문을 무단 수집·전재하면 **저작권법 위반 + 약관 위반** 가능성

### 우리 시스템의 위험도 평가

| 행동 | 위험 | 권장 처리 |
|------|------|-----------|
| 카페 글 본문을 `cafe_posts`에 원본 보존 | 🟡 중 | 내부 파싱·이력 추적용. **외부 노출 안 함** + 일정 기간 후 자동 삭제(예: 1년) 정책 명시 |
| 본문에서 추출한 사실 정보(시간·장소·참가비)를 `games`에 표시 | 🟢 낮음 | 사실 정보(facts)는 저작권 보호 대상 아님 |
| 원본 글 본문을 `/games` 페이지에 그대로 노출 | 🔴 높음 | **금지**. 현재 계획에 없음 |
| 작성자 닉네임 표기 | 🟢 낮음 | 카페에서 이미 공개 정보. 다만 **"문의: [원본 카페 글 →]"** 링크로 연결 필수 |
| 작성자 실명·전화번호 노출 | 🔴 높음 | 본문에 적혀 있어도 **파싱 단계에서 제외** |

### 권장 운영 정책

1. **본문 보존은 내부용** — `cafe_posts.content`는 admin/시스템 외 노출 X
2. **공개는 파싱 사실만** — 시간·장소·참가비·디비전·게임 유형
3. **원본 링크 필수** — `/games/[id]` 페이지에 "원본 보기" 버튼으로 다음카페 URL 연결
4. **삭제 요청 절차** — 카페 운영자/작성자가 요청 시 24시간 내 처리 (admin UI에 1-click 삭제)
5. **사전 고지(권장)** — 몽키즈 등 주요 카페 운영자에게 "회원분들 게시글이 BDR 통합 검색에 노출됩니다, 원본 링크 첨부됩니다" 안내 공지
6. **rate limit 자율 준수** — 30분 주기 + 요청 사이 3초 sleep + User-Agent 정상화. 카페 서버 부하 X
7. **개인정보** — 본문 파싱 시 정규식으로 휴대폰 번호 패턴 자동 마스킹(010-xxxx-xxxx)

이 메모는 `.claude/knowledge/decisions.md`에 "다음카페 동기화 운영 정책"으로 기록 권장.

---

## 3. UX 일정과의 병행 시간표

UX 일정은 **하루 4시간 (오전~오후)**, 카페 sync는 **저녁 1~2시간**으로 겹치지 않게 배치:

```
[일주일 시간 분배 예시]
오전 09:00 ~ 13:00   UX 작업 (Claude Code · subin 브랜치)
점심 13:00 ~ 14:00   휴식
오후 14:00 ~ 16:00   UX 마무리 + 검증 + 커밋
저녁 19:00 ~ 21:00   카페 sync (Claude Code · subin 브랜치 별 분리 커밋)
```

**중요** — 같은 subin 브랜치에서 두 워크스트림 작업하면 **PR 묶음을 명확히 분리**해야 충돌 적음:
- 커밋 메시지에 prefix: `ux:` / `cafe:`
- PR 묶음도 분리: UX는 PR #40~ / 카페는 PR #C1~

### 4주 병행 일정 (UX와 카페 동시 진행)

| 주차 | UX (오전·오후) | 카페 (저녁) |
|------|---------------|-------------|
| W1 (4/19~4/25) | Quick wins 12개 (PR #40~#43) | **Phase 1 POC** (Day 1~2 · 3h) + 결과 검토(Day 3) |
| W2 (4/26~5/2) | M1 프로필 네비 + M2 sticky 카드 | **Phase 2 통합 1차** — article-fetcher + upsert (Day 6~8 · 5h) |
| W3 (5/3~5/9) | M3 코트 지도 + M5 온보딩 + M6 알림 | **Phase 2 통합 2차** — 3개 게시판 + dry-run + 검증 (Day 11~12 · 3h) |
| W4 (5/10~5/16) | M4 활동 통합 + M7 팀 가입 + L1 라벨 | **Phase 3 자동화** — Cron + GH Actions + admin UI (Day 16~19 · 7h) |

W4 종료 시점에 두 워크스트림 모두 완료. W5+에 L2/L3 + 카페 안정화 모니터링.

---

## 4. Phase 1 POC — IVHA 게시판 1개 목록 10건 dry-run

### 시작 전 점검

```text
오늘 카페 작업 시작.
1. 현재 브랜치 subin 확인
2. dev fetch + 충돌 없는지
3. 환경: Node 버전 확인, prisma generate 최신 상태인지
4. .claude/knowledge/architecture.md / conventions.md 에서 카페 관련 항목 빠르게 훑기
5. 결과 요약 + "Phase 1 시작해도 될까요?" 승인
```

### P1.1 — board-map.ts 생성 (15분)

```text
Phase 1.1: 카페 board ↔ game_type ↔ prefix 매핑 상수 파일 생성.

파일: src/lib/cafe-sync/board-map.ts

내용:
- export const CAFE_BOARDS: 3개 게시판 정의
  - IVHA → game_type "PICKUP", prefix "PU", 한글 라벨 "픽업"
  - Dilr → game_type "GUEST", prefix "GU", 한글 라벨 "게스트 모집"
  - MptT → game_type "PRACTICE", prefix "PR", 한글 라벨 "연습 경기"
- export const CAFE_CODE = "dongarry" (몽키즈 카페 식별자, 추후 다른 카페 추가 대비)
- 타입 정의: CafeBoard { id, gameType, prefix, label, listUrl(): string, articleUrl(dataid): string }
- listUrl() 헬퍼: `https://m.cafe.daum.net/${CAFE_CODE}/${id}`
- articleUrl(dataid): `https://m.cafe.daum.net/${CAFE_CODE}/${id}/${dataid}`

검증: tsc 통과. 다른 파일에서 import해서 사용할 수 있어야 함.
주의: cafe-game-parser.ts는 건드리지 말 것 (vitest 59/59 보존).
```

### P1.2 — fetcher.ts 생성: 모바일 목록 HTML 파싱 (60분)

```text
Phase 1.2: 다음카페 모바일 목록 HTML에서 dataid + 메타 추출.

파일: src/lib/cafe-sync/fetcher.ts

요구사항:
1. fetchBoardList(board: CafeBoard, limit = 10): Promise<BoardItem[]>
   - User-Agent: 일반 모바일 브라우저 모방 (Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 ...))
   - timeout 10초
   - 응답이 200 아니면 throw
2. 응답 HTML에서 글 식별자(dataid), 제목, 작성자 닉네임, 작성 시각 추출
   - cheerio 또는 정규식 사용 (cheerio 설치 필요시 pnpm add cheerio)
   - 다음카페 모바일 HTML 구조는 변경 가능성 있으니, 셀렉터/정규식을 const로 선언 + 변경 시 한 곳만 수정 가능하게
3. 결과 타입:
   interface BoardItem {
     dataid: string;
     title: string;
     author: string;
     postedAt: Date | null;
     listUrl: string;
   }
4. 실패 시 어떤 부분에서 실패했는지 구분 가능한 에러 메시지

검증:
- 단순 단위 테스트는 mock HTML로 작성 (vitest)
- 실제 HTTP 호출은 다음 단계 sync-cafe.ts에서

주의:
- 카페 서버 부하 방지: 호출 직전 sleep 1~3초 옵션
- 응답이 비어있거나 HTML 구조 바뀌었을 때 명확한 에러
- conventions.md에 "카페 HTML 셀렉터 위치" 기록
```

### P1.3 — sync-cafe.ts 스크립트 (dry-run 기본) (45분)

```text
Phase 1.3: 수동 실행 스크립트 (Phase 1 dry-run 모드).

파일: scripts/sync-cafe.ts

요구사항:
1. 인자:
   --board=IVHA|Dilr|MptT|all (default all)
   --limit=N (default 10)
   --execute (default false. 없으면 dry-run, DB 쓰기 안 함)
2. dry-run 동작:
   - 지정 게시판 목록 fetch
   - 각 BoardItem 콘솔에 출력 (id, 제목, 작성자, 시각)
   - "이 글이 새 글이라면 DB에 추가될 것" 시뮬레이션 메시지
3. 운영 DB 가드:
   - DATABASE_URL이 운영 DB 패턴이면 (특정 호스트명 검사) 즉시 종료 + 경고
   - .env.local의 개발 DB만 허용
4. 로그 형식:
   [yyyy-MM-dd HH:mm:ss] [BOARD] [TITLE] (dataid=xxx, author=xxx)
5. 실행: tsx scripts/sync-cafe.ts --board=IVHA --limit=10

이 단계에서는 article-fetcher / upsert 미사용. 목록 파싱만.

검증:
- pnpm tsx scripts/sync-cafe.ts --board=IVHA --limit=10 실행
- 콘솔에 10개 글 정보 정상 출력
- 결과를 me에게 공유 (사진 또는 텍스트)
```

### P1.4 — 결과 검증 + 다음 단계 결정 (30분)

```text
Phase 1 결과 검증.

체크 항목:
1. 10건 모두 dataid + 제목 + 작성자 추출 성공?
2. 한글 깨짐 없음?
3. 시간 파싱 정확? (KST 기준)
4. 응답 시간 평균 몇 초?
5. 카페 서버에서 차단/속도제한 시그널 없음?

이 5개 통과 → Phase 2 진행 OK.
실패 항목 있으면 .claude/knowledge/lessons.md에 "카페 모바일 HTML [구체 이슈]" 기록 후 fetcher.ts 보강.

결과 요약을 .claude/scratchpad.md "현재 작업" 섹션에 1줄 + 작업 로그에 추가.
```

---

## 5. Phase 2 통합 — 본문 파싱 + games upsert

### P2.1 — article-fetcher.ts 생성: 쿠키 기반 본문 fetch (90분)

```text
Phase 2.1: 다음카페 글 상세 본문 fetcher (HTTP+쿠키 1차, Playwright 2차).

파일: src/lib/cafe-sync/article-fetcher.ts

요구사항:
1. fetchArticleHtml(board: CafeBoard, dataid: string, opts?): Promise<string>
   - opts.cookie: process.env.DAUM_CAFE_COOKIE 자동 사용
   - 응답이 403/401이면 명확한 에러 ("쿠키 만료 가능성")
   - timeout 10초
   - User-Agent 동일 패턴 유지
2. extractContent(html: string): { content: string; postedAt: Date }
   - 본문 영역 셀렉터 (개발 시 실제 응답 보고 결정)
   - 게시 시각 추출
3. 휴대폰 번호 마스킹 함수: 010-xxxx-xxxx 패턴을 010-****-**** 로
4. 환경변수: DAUM_CAFE_COOKIE (.env.local에 추가, gitignored)
5. cookie 상태 확인 함수: hasValidCookie(): boolean

검증:
- vitest로 mock html 단위 테스트
- 실제 호출은 sync-cafe.ts에서

주의:
- 운영 환경에서는 GitHub Actions secrets에 쿠키 등록
- 쿠키 노출 금지: 로그/에러 메시지에 절대 포함 X
- conventions.md에 "다음카페 인증 처리 패턴" 기록
```

### P2.2 — Playwright 폴백 환경 (60분)

```text
Phase 2.2: Playwright 기반 본문 fetcher (HTTP 실패 시 fallback).

파일: src/lib/cafe-sync/article-fetcher.ts 에 추가

요구사항:
1. pnpm add -D playwright (devDependency)
2. fetchArticleViaPlaywright(board, dataid, opts): Promise<string>
   - chromium headless 실행
   - 쿠키 주입
   - 글 상세 페이지 이동 → 본문 영역 대기 → HTML 추출
   - browser.close() 보장
3. fetchArticleHtml() 안에서 HTTP 실패 시 자동으로 Playwright 호출 (try/catch)
4. Playwright는 Vercel Edge에서 실행 불가 → 이 코드는 GitHub Actions에서만 호출
   - 코드는 같은 파일에 두되, 환경 분기 (process.env.RUNNING_IN_GH_ACTIONS)
5. 단위 테스트 mock으로 HTTP 분기만 검증

검증:
- 로컬에서 실제 글 1건 Playwright로 받아서 본문 추출 성공 확인
- 결과 본문이 cafe-game-parser.ts로 파싱 시 9항목 추출 OK인지 확인
```

### P2.3 — upsert.ts: cafe_posts + games upsert (90분)

```text
Phase 2.3: 카페 글을 cafe_posts + games로 upsert.

파일: src/lib/cafe-sync/upsert.ts

요구사항:
1. upsertCafePost(board, item, content): Promise<{ cafePostId, gameId, action: "created"|"updated"|"skipped" }>
   - cafe_posts에 upsert (unique key: cafe_code + board_id + dataid)
   - parseCafeGame(content) 호출 (기존 파서 재사용, 변경 X)
   - 파싱 결과를 games 테이블에 upsert
     - games.metadata.cafe_source_id = `${board.prefix}-CAFE-${dataid}` (기존 형식 유지)
     - games.metadata.cafe_dataid = dataid
     - games.metadata.cafe_board = board.id
     - games.metadata.source_url = board.articleUrl(dataid)
   - 동일 cafe_source_id가 이미 있으면 update (덮어쓰기 정책 명확화: 사용자가 수정한 필드는 보존)
2. 트랜잭션: cafe_posts + games upsert를 하나의 prisma 트랜잭션으로
3. 파싱 실패 시:
   - cafe_posts에는 저장 (원본 보존)
   - games는 만들지 않음
   - parse_status: "failed" 필드에 기록
4. 운영 DB 가드: 위와 동일

검증:
- 단위 테스트: 정상 본문 / 파싱 실패 본문 / 중복 호출(idempotent) 3가지 케이스
- 통합 테스트는 Phase 2.5에서

주의:
- officialMatchWhere() 가드는 무관 (카페 글은 official match 아님)
- conventions.md에 "카페 글 upsert + games 연결 패턴" 기록
- decisions.md에 "사용자 수정 필드 보존 정책" 기록
```

### P2.4 — sync-cafe.ts 확장: --execute 모드 (60분)

```text
Phase 2.4: sync-cafe.ts에 --execute 플래그 + 본문 fetch + upsert 통합.

파일 수정: scripts/sync-cafe.ts

요구사항:
1. --execute 플래그 추가:
   - false (default): dry-run, fetch만
   - true: article-fetcher.ts로 본문 가져와서 upsert.ts 호출
2. 처리 흐름:
   - fetchBoardList → 각 BoardItem에 대해
   - fetchArticleHtml → extractContent → upsertCafePost
   - 결과 카운트 (created N / updated N / skipped N / failed N)
3. 호출 사이 sleep 3초 (카페 서버 보호)
4. 진행률 표시: [3/10] IVHA "픽업 5월 4일..." created
5. 실패 항목은 별도로 끝에 모아서 출력
6. 운영 DB 가드 유지

검증:
- 개발 DB에서 --board=IVHA --limit=3 --execute 실행
- cafe_posts 3건 + games 3건 정상 생성 확인
- 동일 명령 재실행 → 모두 skipped (idempotent 검증)
```

### P2.5 — 3개 게시판 통합 실행 + 백필 (90분)

```text
Phase 2.5: 3개 게시판 50건씩 통합 실행 + 기존 112건 역방향 백필.

작업:
1. pnpm tsx scripts/sync-cafe.ts --board=all --limit=50 --execute
   - IVHA, Dilr, MptT 각 50건 = 최대 150건 처리
   - 결과 카운트 보고
   - 실패 항목 분석 → fetcher 또는 parser 보강

2. 기존 112건 역방향 백필:
   - 신규 스크립트 또는 sync-cafe.ts에 --backfill-existing 모드 추가
   - games.metadata.cafe_source_id가 있고 cafe_posts 연결 없는 112건 대상
   - cafe-source-id에서 dataid 역추출 → 본문 fetch → cafe_posts 생성
   - games는 이미 있으니 metadata만 갱신 (cafe_dataid, cafe_board, source_url)
3. 검증:
   - cafe_posts 행 수 = 신규 처리 + 백필 = 약 250건
   - games.metadata 키 정합성 (모든 cafe 출처 게임에 source_url 있음)

검증 후 다음 작업:
- 결과를 .claude/scratchpad.md 작업 로그에 1줄
- 파싱 실패율이 90% 이상이 아니면 .claude/knowledge/lessons.md에 "Phase 2 파싱 실패 패턴" 기록
- 모두 OK면 Phase 3 진행 가능 표시
```

---

## 6. Phase 3 자동화 — Cron + GH Actions + admin UI

### P3.1 — Vercel Cron 엔드포인트 (60분)

```text
Phase 3.1: 30분 주기 Vercel Cron 엔드포인트.

파일: src/app/api/cron/cafe-sync/route.ts

요구사항:
1. GET /api/cron/cafe-sync
   - Vercel Cron 인증: Authorization 헤더 또는 query secret 검증
   - 환경변수 CRON_SECRET 활용
2. 동작:
   - HTTP 모드만 실행 (Playwright X — Vercel Edge 미지원)
   - 3개 게시판 모두 limit=20 (최근 20건만)
   - article-fetcher.ts의 HTTP 모드 사용 (DAUM_CAFE_COOKIE 환경변수)
   - 쿠키 만료 시 fetch 자동 실패 → cafe_posts에 parse_status="cookie_expired" 기록
   - GitHub Actions가 다음 실행 때 본문 마저 채우도록 위임
3. 응답: { processed, created, updated, failed, errors[] }
4. 실행 시간 제한 30초 (Vercel 무료 플랜)

vercel.json에 cron 추가:
{
  "crons": [
    {
      "path": "/api/cron/cafe-sync",
      "schedule": "*/30 * * * *"
    }
  ]
}

검증:
- 로컬에서 curl GET /api/cron/cafe-sync?secret=xxx 정상 응답
- Vercel preview에서 수동 실행 한 번
- conventions.md에 "Vercel Cron 엔드포인트 패턴" 기록
```

### P3.2 — GitHub Actions Workflow (Playwright 본문) (90분)

```text
Phase 3.2: GitHub Actions로 Playwright 본문 수집 워크플로우.

파일: .github/workflows/cafe-sync-deep.yml

요구사항:
1. Trigger:
   - schedule: '0 */2 * * *' (2시간 주기, Vercel Cron이 30분 주기 가벼운 작업 + 이건 무거운 본문 보강)
   - workflow_dispatch: 수동 실행 가능
2. Job:
   - ubuntu-latest
   - Node 20
   - pnpm install + playwright install --with-deps chromium
   - secrets.DAUM_CAFE_COOKIE 환경변수로 주입
   - secrets.DATABASE_URL_DEV 환경변수 주입 (운영 DB 절대 X)
   - tsx scripts/sync-cafe.ts --board=all --limit=50 --execute --use-playwright
3. sync-cafe.ts에 --use-playwright 플래그 추가:
   - 강제로 Playwright 모드 (HTTP 실패 안 거치고 바로)
4. 실패 시 Slack webhook 알림 (P3.5에서 구현, 지금은 메모만)
5. 실행 결과를 GH Actions Job Summary에 표시 (created N / failed N)

검증:
- 수동으로 workflow_dispatch 1회 실행
- Job 로그에서 본문 수집 성공률 확인
- cafe_posts에 parse_status="cookie_expired" 였던 글들이 success로 갱신되는지 확인

주의:
- secrets는 절대 로그에 노출 X
- pnpm install 결과 캐싱으로 빌드 단축
```

### P3.3 — Secret 등록 가이드 (15분)

```text
Phase 3.3: 환경변수/Secret 등록 가이드.

수행 작업 (수빈님 직접 + Claude Code 안내):

1. 로컬 .env.local 에 추가 (gitignored 확인):
   DAUM_CAFE_COOKIE="(쿠키 문자열)"
   CRON_SECRET="(난수 32자, openssl rand -hex 16 으로 생성)"

2. Vercel 환경변수 (Production / Preview / Development 각각):
   DAUM_CAFE_COOKIE
   CRON_SECRET
   - 배포 환경별 분리 권장. Production은 별도 쿠키 (만료 시 단계적 갱신)

3. GitHub Repository Secrets:
   DAUM_CAFE_COOKIE (Production용 쿠키)
   DATABASE_URL_DEV (개발 DB URL — 운영 DB 절대 X)

4. 문서화:
   - .claude/knowledge/decisions.md "다음카페 쿠키 관리 정책" 기록
   - 쿠키 만료 시 갱신 절차 (몇 단계인지, 누가)
   - 쿠키는 절대 git에 커밋 X (.gitignore 검증)

검증:
- vercel env ls 로 등록 확인
- gh secret list 로 등록 확인
```

### P3.4 — admin UI 페이지 (90분)

```text
Phase 3.4: admin 카페 동기화 모니터링 + 수동 트리거 페이지.

파일: src/app/(admin)/admin/cafe-sync/page.tsx
관련: API 신규 — /api/admin/cafe-sync/{trigger, status}

요구사항:
1. 페이지 구성:
   - 상단 카드: 마지막 동기화 시각, 다음 예정 시각, 30일간 처리 카운트
   - 게시판별 통계 테이블 (IVHA/Dilr/MptT 각 신규/업데이트/실패)
   - 최근 50건 처리 로그 (시각, 게시판, dataid, 결과, 에러 메시지)
   - "지금 동기화" 버튼 (수동 트리거)
   - "본문 재파싱" 버튼 (특정 cafe_post 재처리)
2. 권한: super_admin만 (CLAUDE.md의 admin 권한 패턴 준수)
3. API:
   - GET /api/admin/cafe-sync/status: 통계 응답
   - POST /api/admin/cafe-sync/trigger: 수동 동기화 시작 (백그라운드)
4. 디자인: 기존 admin UI 패턴 따름 (컴팩트 테이블 + 플로팅 모달)

검증:
- /admin/cafe-sync 접근 (super_admin 계정)
- 수동 동기화 1회 → 로그 즉시 갱신 확인
- 권한 없는 계정으로 접근 시 403
```

### P3.5 — 실패 알림 (Slack Webhook) (60분)

```text
Phase 3.5: 동기화 실패 시 Slack 알림.

요구사항:
1. Slack Incoming Webhook URL 등록
   - 환경변수 SLACK_CAFE_SYNC_WEBHOOK
   - GitHub Secrets에도 동일
2. 알림 트리거 조건:
   - 쿠키 만료 (HTTP 401/403 연속 5건)
   - 파싱 실패율이 30% 초과
   - Cron 미실행 (마지막 동기화가 1시간 이상 전)
3. 알림 메시지:
   - 제목: "🚨 MyBDR 카페 동기화 이상"
   - 본문: 어떤 게시판, 어떤 종류 실패, 마지막 성공 시각
   - 액션 링크: /admin/cafe-sync 페이지
4. 구현 위치:
   - src/lib/cafe-sync/notifier.ts
   - 트리거: api/cron/cafe-sync/route.ts + GH Actions workflow + admin trigger 모두에서 호출

5. Cron 미실행 감지:
   - 별도 Vercel Cron 1일 1회 (/api/cron/cafe-sync-healthcheck)
   - 마지막 동기화 timestamp 검사 → 1시간 이상 전이면 알림

검증:
- 일부러 잘못된 쿠키로 강제 실패 → Slack 알림 도착 확인
- decisions.md에 "카페 동기화 알림 임계값" 기록
```

### P3.6 — 통합 검증 + 운영 가이드 작성 (60분)

```text
Phase 3 마무리: 통합 검증 + 운영 가이드.

체크 항목:
1. Vercel Cron 30분 주기 정상 (3회 실행 확인)
2. GH Actions 2시간 주기 정상 (1회 실행 확인)
3. cookie 만료 → Slack 알림 → 갱신 → 정상 복귀 시나리오 검증
4. admin UI 모든 기능 정상
5. 운영 DB 영향 없음 (개발 DB만 사용)

운영 가이드 신규 문서:
- 위치: Dev/cafe-sync-ops-guide.md
- 내용:
  - 쿠키 갱신 절차 (단계별)
  - 알림 채널 점검 주기
  - 파싱 실패율 추세 보기
  - 새 게시판 추가 방법
  - 카페 운영자 협의 시 답변 템플릿

마지막:
- .claude/knowledge/architecture.md "다음카페 동기화 시스템" 기록
- .claude/knowledge/decisions.md "Vercel + GH Actions 하이브리드" 결정 기록
- .claude/scratchpad.md 카페 sync 항목 정리

PR #C3 생성 → dev 머지 후 운영 배포.
```

---

## 7. 매주 진행률 점검

매주 일요일 오전 9시(KST)에 자동으로 다음 항목 점검 (Cowork schedule 활용):

```
- 이번주 카페 sync Phase 진행 (P1.x 또는 P2.x 또는 P3.x 중 어디까지)
- 카페 sync 운영 지표:
  - 30분 지연율 (지난 7일 평균)
  - 파싱 성공률 (지난 7일)
  - 쿠키 만료 알림 횟수
- UX 일정 진행 (W1~W4 중 어느 작업까지 완료)
- 차단 이슈 (있으면 우선순위 높음)
- 다음주 우선순위 1~3개 추천
```

이 점검은 별도 schedule 작업으로 등록되어 있어요(다음 섹션 참조).

---

## 8. PR 묶음 가이드

| PR | 묶음 | 포함 |
|----|------|------|
| #C1 | Phase 1 | board-map.ts + fetcher.ts + sync-cafe.ts (dry-run) |
| #C2 | Phase 2 | article-fetcher.ts + upsert.ts + sync-cafe.ts(--execute) + 통합 실행 |
| #C3 | Phase 3 | api/cron + vercel.json + GH Actions workflow + admin UI + Slack |

PR 본문 템플릿:
```
## 변경 요약
[Phase X — 무엇을 했는지]

## 영향 파일
[파일 목록]

## 운영 영향
- 운영 DB: [영향 없음 / Phase X에서 cafe_posts 테이블 활성화]
- 비밀: [환경변수 추가 필요 시 명시]
- Cron: [추가/수정/삭제]

## 테스트 방법
1. [재현 단계]
2. [예상 결과]

## 롤백 계획
- [문제 발생 시 어떻게 되돌리는지]
```

---

## 9. 위험 + 대응

| 위험 | 가능성 | 대응 |
|------|--------|------|
| 카페 모바일 HTML 구조 변경 | 중 | 셀렉터/정규식 한 곳에 모음 + 단위 테스트 + 실패 시 Slack 알림 |
| 쿠키 만료 (다음카페는 비교적 길지만) | 중 | 알림 → 1시간 내 갱신 절차 명문화 |
| 카페에서 차단 (rate limit) | 낮음 | 30분 + sleep 3초 + UA 정상화. 만약 차단 시 7일 휴식 |
| 약관 위반 우려 | 낮음 | 본문 외부 노출 X + 원본 링크 + 작성자 삭제 요청 절차 |
| Vercel Cron + GH Actions 동시 실행 충돌 | 낮음 | upsert가 idempotent (unique key 기반) → 충돌해도 데이터 깨짐 X |
| 파싱 성공률 저하 (90% 미만) | 중 | failed_post 추적 + 패턴 분석 → cafe-game-parser.ts 보강 (기존 파서 보호 지켜야 vitest 안 깨짐) |

---

## 10. 마무리

이 워크스트림의 PM 역할은 제가 들고 있어요. 진행 단계마다 다음을 부탁드릴 수 있어요:

- **각 Phase 시작 전**: 위 프롬프트를 그대로 Claude Code에 복붙
- **Phase 완료 후**: 결과(콘솔 출력·에러·캡처)를 저에게 공유 → 검증 + 다음 단계 안내
- **차단 발생 시**: 에러 메시지·로그 그대로 붙여주시면 함께 분석
- **매주 일요일**: 자동 점검 리포트가 도착할 예정 (8번 섹션 schedule)

다음 행동:
1. **오늘 저녁** — Phase 1.1 (board-map.ts) → 1.2 (fetcher.ts) 까지 (1.5h 예상)
2. **내일 저녁** — Phase 1.3 (sync-cafe.ts dry-run) + 1.4 (검증) (1.5h)
3. **수~목 저녁** — Phase 2 시작 (P2.1 ~ P2.3, 약 4h 분산)
4. **금~일 저녁** — Phase 2 마무리 (P2.4 ~ P2.5, 약 2.5h)
5. **W3 저녁** — 검증 안정화 + Phase 3 준비
6. **W4 저녁** — Phase 3 자동화 (7h 분산)

진행하다 막히면 그 시점에 저에게 다시 오세요. 결과나 에러 그대로 붙여주시면 됩니다.
