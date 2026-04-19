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
| 현재 브랜치 | subin (origin/subin = 610dcf2, dev merge-back 완료) |
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
| 04-19 | pm | UX 세션: Dev/ 플래닝 3개 커밋 + Q12 조사(수정 불필요, W1 **12/12**) + dev merge-back 7충돌 해결 → PR #45 **MERGEABLE** | ✅ 610dcf2 push |
| 04-19 | pm | 오늘 세션 시작: 환경 체크 + Phase 2a 재검증(IVHA 본문 200×2/2) + 로컬 변경 커밋·푸시 | ✅ 3cd61c4 push |
| 04-19 | pm+developer | Phase 2a 완료: Playwright `cafe-login.ts` + storageState 쿠키 로드 → 본문 200 × 2/2 + parseCafeGame 2/2 + 마스킹 OK | ✅ 55d78c3 push |
| 04-19 | developer | Phase 2a 코드: mask-personal-info + article-fetcher + sync-cafe --with-body (vitest 19/19, 쿠키 미수 403) | ✅ 2890224 push |
| 04-19 | pm | PR #39 **dev 머지 완료** (squash, 75b653b) + 제목/본문 갱신 | ✅ merged |
| 04-19 | pm | Coworker 4파일 수습 + Vercel 빌드 복구 (c884ae0 NotificationBadge 누락 → ae8e452) | ✅ CI CLEAN |
| 04-19 | tester | MoreTabTooltip Playwright E2E 6/6 PASS | ✅ |
| 04-19 | pm+developer | 다음카페 Phase 1 POC — 3게시판 30건 실제 수집 (articles.push 정규식) | ✅ |
| 04-19 | pm | 크롤링 정책 리서치(9가드) + decisions.md 승격 | ✅ 조건부 진행 |
| 04-19 | general-purpose | 다음카페 크롤링 법적/기술 리스크 리서치 | ✅ 낮음~중간 |
