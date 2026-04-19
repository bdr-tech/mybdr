# 작업 스크래치패드

## 현재 작업
- **요청**: W3 옵션 C — M6 알림 분류 + 일괄 읽음 ✅ **완료, 커밋 대기**
- **상태**: ✅ tester+reviewer 통과 (블록 0), 정화 4건 적용 완료
- **다음 후보**: M3 코트 지도 뷰 (~10h) 또는 M5 온보딩 압축 (~5h)
- **PR**: #46 OPEN에 누적 (옵션 B 합의대로)
- **참고 문서**: `Dev/ux-implementation-plan-2026-04-19.md` L602~629

## 진행 현황표
| 영역 | 상태 |
|------|------|
| 브랜치 | subin (origin/subin = 동기화) |
| 미푸시 커밋 | M6 커밋 1건 예정 |
| dev 미반영 | 5건 (PR #46) + M6 1건 |
| PR #46 | 🟢 OPEN · MERGEABLE · CLEAN · Vercel SUCCESS |
| dev → main | 2건 미반영 (원영) |
| 작업 트리 (다른 터미널) | M cafe-sync 4건 + ?? extract-fallbacks.ts (건드리지 않음) |

## 남은 과제 (대기열)
- **W3 M3 코트 지도** — 카카오맵 SDK + 클러스터링 + 토글, ~10h
- **W3 M5 온보딩 압축** — signup→verify→홈 직진, ~5h
- **W4 M4/M7/L1** — 5/10~5/16 분량
- **다음카페 Phase 2b/3** — 다른 터미널 진행 중
- **운영 DB 동기화** — 원영 협의
- **referee 알림 사일런트 버그** — `notification-bell.tsx` L86 `json?.data` (errors.md 6회차)

## 기획설계 (planner-architect)
(직전 작업: M6 — 작업 로그 압축됨)

## 구현 기록 (developer)
(직전 작업: M6 — 작업 로그 압축됨)

## 테스트 결과 (tester)
(직전 작업: M6 — 작업 로그 압축됨)

## 리뷰 결과 (reviewer)
(직전 작업: M6 — 작업 로그 압축됨)

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## 운영 팁
- **gh 인증 풀림**: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...`
- **gh pr edit 스코프 부족**: `gh api -X PATCH repos/OWNER/REPO/pulls/N -f title=...`
- **tsx 환경변수**: `npx tsx --env-file=.env.local scripts/xxx.ts` (Node 22)
- **카페 쿠키 세션 갱신**: `npx tsx scripts/cafe-login.ts` (브라우저 headed → 로그인 → Enter)
- **포트 죽이기**: `netstat -ano | findstr :<포트>` → `taskkill //f //pid <PID>` (node.exe 통째 금지)
- **공식 기록 쿼리**: `officialMatchWhere()` 유틸 필수
- **신규 API 필드**: 추가 전 curl 1회로 raw 응답 확인 (snake_case 변환 6회 재발)

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-20 | pm+team | **M6 알림 분류 6카테고리 탭 + 카테고리별 mark-all-read + 더 보기** (1신규+5수정, DB 0변경, 보너스: layout.tsx 헤더 뱃지 사일런트 버그 동시 정정) | ✅ 커밋 대기 |
| 04-19 | dev+review | M2 데스크톱 sticky 신청 카드 도입 (서버 컴포넌트, 6상태 분기, --color-* 100%) | ✅ 3405727 |
| 04-19 | developer | Phase 2b Step 1 — upsert.ts + sync-cafe --execute 통합 (코드 준비, 미실행) | ✅ 6d2617d |
| 04-19 | developer | M1 Day 8 설정/결제 탭 통합 허브 2개 + 기존 4페이지 redirect | ✅ 546a5c3 |
| 04-19 | developer | `/games` 경기 유형 탭 건수 뱃지 (route.ts groupBy 1회) | ✅ 1e7b642 |
| 04-19 | developer | `/games` 경기 유형 탭 추가 (전체/픽업/게스트/연습경기, URL `?type`) | ✅ 1082124 |
| 04-19 | developer | M1 Day 7 /profile 통합 대시보드 (히어로 + 4그룹 카드) + apiSuccess 가드 승격 | ✅ e259d56 |
| 04-19 | pm | UX 세션: 플래닝 3커밋 + W1 12/12 + dev merge-back 7충돌 해결 → PR #45 MERGEABLE | ✅ 610dcf2 |
| 04-19 | pm+developer | Phase 2a 완료: Playwright cafe-login + storageState → 본문 200×2/2 + 마스킹 OK | ✅ 55d78c3 |
| 04-19 | pm | PR #39/#45 dev 머지 완료 (squash) | ✅ |
