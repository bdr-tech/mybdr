# 작업 스크래치패드

## ⚠️ 세션 분리 원칙 (필수, 2026-04-20 합의)
- **본 세션** = `(web)`/`(api/web)`/`(referee)` 등 일반 UX/기능 작업
- **다른 세션 (병행)** = 다음카페 sync 작업 — 항상 별도 터미널에서 동시 진행
- **본 세션 PM 금지 파일** (카페 sync, 절대 수정 X):
  - `scripts/sync-cafe.ts`, `scripts/cafe-login.ts`, `scripts/_tmp-*`, `scripts/backfill-*cafe*.ts`
  - `src/lib/cafe-sync/*` (article-fetcher, upsert, extract-fallbacks, mask-personal-info, board-map 등)
  - `Dev/cafe-sync-plan-*.md` (카페 세션 전용 기획 문서)
- **카페 commit이 origin/subin에 누적되어도 fast-forward로 자연 통합** (이번 PR #46에 카페 Phase 2b Step 4까지 자연 합쳐짐)
- **푸시 전 `git fetch` 권장** (양 세션 push 충돌 방지)

## 현재 작업
- **요청**: F→E→A 순 — F✅ PR#46 머지(2b3b5ea) / E 후속 정비 커밋 대기 / A 휴식
- **상태**: 🧹 E1+E2 정비 완료, 커밋 대기
- **현재 담당**: pm

## 진행 현황표
| 영역 | 상태 |
|------|------|
| 브랜치 | subin |
| 미푸시 커밋 | M5 1건 예정 |
| origin/subin vs HEAD | fast-forward 가능 |
| PR #46 | 🟢 OPEN · MERGEABLE · CLEAN (M5 push 후 갱신) |
| 작업 트리 (다른 터미널) | M cafe-sync 2건 + ?? _tmp 4건 (건드리지 않음) |

## W3 옵션 C 완료 요약 (2026-04-20)
| 작업 | 계획 공수 | 실제 공수 | 결과 |
|------|----------|----------|------|
| M6 알림 분류 | 5h | ~3h | ✅ 5e56d0f push (보너스: 헤더 뱃지 사일런트 버그 정정) |
| M3 코트 지도 폴리시 | 10h | ~2h | ✅ 86f1736 push (80% 기구현 발견 → 폴리시만) |
| M5 온보딩 압축 | 5h | ~2h | ✅ 커밋 대기 (3파일+verify L79 추가 흐름 정렬) |
| **합계** | **20h** | **~7h** | **3배 절감** |

## 남은 과제
- **W4 M4 내 활동 통합 뷰** — `/profile/activity` 신규 (~8h 예상, 실제 더 적을 수도)
- **W4 M7 팀 가입 신청자 화면** — ~5h
- **W4 L1 라벨 정리** — ~4h
- **W5+ L2/L3** — 분기 단위
- **Phase 3 다음카페 동기화 자동화** — GH Actions 30분 cron (`.github/workflows/cafe-sync.yml`) + 쿠키 갱신 스크립트 + Slack webhook + admin UI 수동 트리거. 숙제: Pagination(각 게시판 20건 상한 극복) / 시분 정확도(목록+상세 결합) / city 추출률 개선. 예상 5~6h
- **운영 DB 동기화** — 원영 협의
- **referee 알림 사일런트 버그** — `notification-bell.tsx` L86 (errors.md 6회차)
- **M5 후속 정비** — prefill any → minimal interface, `text-red-500` → `var(--color-error)` (전 화면 일괄)

## 기획설계 (planner-architect)
(직전: M5 — 작업 로그 압축됨)

## 구현 기록 (developer)
(직전: M5 — 작업 로그 압축됨)

## 테스트 결과 (tester)
(직전: M5 — 블록 0/권장 1, 작업 로그 압축됨)

## 리뷰 결과 (reviewer)
(직전: M5 — 블록 0/권장 3, 작업 로그 압축됨)

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## 운영 팁
- **gh 인증 풀림**: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...`
- **tsx 환경변수**: `npx tsx --env-file=.env.local scripts/xxx.ts` (Node 22)
- **포트 죽이기**: `netstat -ano | findstr :<포트>` → `taskkill //f //pid <PID>` (node.exe 통째 금지)
- **신규 API 필드**: 추가 전 curl 1회로 raw 응답 확인 (snake_case 6회 재발)
- **공식 기록 쿼리**: `officialMatchWhere()` 유틸 필수

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-20 | pm+developer | **Phase 2b 품질 보강 + 지속동기화 기반** — 마스킹 3중/script 제거/venue 제한/city 역매핑/MptT PRACTICE 강제/postedAt fallback/created_at=카페게시순. 카페 출처 118건 초기화 + 3게시판 각 5건 재수집. Phase 3 = GH Actions 주력 확정 | ✅ 4826018 |
| 04-20 | pm+team | **M5 온보딩 압축** — auth redirect→/verify, /profile/complete 7→3필드 옵션카드, verify→/profile/complete 흐름 정렬 (A+B 둘 다 적용) | ✅ 커밋 대기 |
| 04-20 | pm+team | **M3 코트 지도 폴리시** — localStorage viewMode + 인포 ★평점/상세보기 + appkey env 외부화 + 빈 상태 필터초기화 | ✅ 86f1736 push |
| 04-20 | pm+team | **M6 알림 분류** 6카테고리 + 카테고리별 mark-all-read + 더 보기 + layout 헤더 뱃지 사일런트 버그 동시 정정 | ✅ 5e56d0f push |
| 04-19 | dev+review | M2 데스크톱 sticky 신청 카드 도입 | ✅ 3405727 |
| 04-19 | developer | Phase 2b Step 1 — upsert.ts + sync-cafe --execute 통합 | ✅ 6d2617d |
| 04-19 | developer | M1 Day 8 설정/결제 탭 통합 허브 2개 + 기존 4페이지 redirect | ✅ 546a5c3 |
| 04-19 | developer | `/games` 경기 유형 탭 건수 뱃지 (route.ts groupBy 1회) | ✅ 1e7b642 |
| 04-19 | developer | `/games` 경기 유형 탭 추가 (전체/픽업/게스트/연습경기) | ✅ 1082124 |
| 04-19 | developer | M1 Day 7 /profile 통합 대시보드 + apiSuccess 가드 승격 | ✅ e259d56 |
| 04-19 | pm | UX 세션: W1 12/12 + dev merge-back 7충돌 해결 → PR #45 MERGEABLE | ✅ 610dcf2 |
