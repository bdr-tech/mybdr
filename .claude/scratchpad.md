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
- **요청**: D→C→B→A 순 — D✅ 12f71bf / C✅ e5071f0 / B✅ M7 1~3번 완료 (4번=프로필 활동 탭은 M4와 함께) / A 대기
- **상태**: 🟢 B 수정 완료, 커밋 대기
- **현재 담당**: pm

## 진행 현황표
| 영역 | 상태 |
|------|------|
| 브랜치 | subin |
| 미푸시 커밋 | 0 |
| main..dev | 0 ✅ (main이 dev 전체 포함) |
| subin..dev | 1 (squash 차이, 내용 동일 — 관례) |
| PR #47 (subin→dev) | 🟣 MERGED squash `ff02652` |
| PR #48 (dev→main) | 🟣 MERGED merge `8475e10` |
| 작업 트리 (다른 터미널) | 본 세션에서 건드리지 않음 |

## W3 옵션 C 완료 요약 (2026-04-20)
| 작업 | 계획 공수 | 실제 공수 | 결과 |
|------|----------|----------|------|
| M6 알림 분류 | 5h | ~3h | ✅ 5e56d0f push (보너스: 헤더 뱃지 사일런트 버그 정정) |
| M3 코트 지도 폴리시 | 10h | ~2h | ✅ 86f1736 push (80% 기구현 발견 → 폴리시만) |
| M5 온보딩 압축 | 5h | ~2h | ✅ 1e7ec68 + 17732ab push (3파일+verify L79 흐름 정렬) |
| **합계** | **20h** | **~7h** | **3배 절감** |

## 남은 과제
- **W4 M4 내 활동 통합 뷰** — `/profile/activity` 신규 (~8h 예상). M7 4번(프로필 활동 탭 신청 상태)은 여기서 같이 처리
- **W5+ L2/L3** — 분기 단위
- **Phase 3 다음카페 동기화 자동화** — 별도 세션에서 진행 (본 PM 금지 파일)
- **운영 DB 동기화** — 원영 협의

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
| 04-20 | pm | **W4 M7 팀 가입 신청자 화면** (1~3번) — GET/DELETE my-application API 신설, join-button.tsx 상태별 분기(none/pending/approved/rejected) + 환영 토스트 1회 + 신청 취소 + 재신청 + 거부 사유 노출 + 하드코딩 색상 CSS 변수화 | ✅ 커밋 대기 |
| 04-20 | pm | **W4 L1 용어 통일 + /help/glossary 신설** — 용어 9종 페이지 + Footer 도움말 + 비로그인 히어로 용어 사전 링크 + PC 사이드네비 "경기" 부제 + conventions.md 단일 소스 | ✅ e5071f0 |
| 04-20 | pm | **referee 알림 사일런트 버그 해소** (errors.md 6회차). `json?.data` → `json` 직접 접근 + 주석 가드 | ✅ 12f71bf |
| 04-20 | pm | **subin→dev→main 전체 push** (원영 협의). PR #47 subin→dev squash / PR #48 dev→main merge. 충돌 6개(scratchpad/settings/M5/카페 sync) --ours로 해결 | ✅ main 8475e10 / dev ff02652 |
| 04-20 | pm+developer | **Phase 2b 품질 보강 + 지속동기화 기반** — 마스킹 3중/script 제거/venue 제한/city 역매핑/MptT PRACTICE 강제/postedAt fallback/created_at=카페게시순 | ✅ 4826018 |
| 04-20 | pm+team | **M5 온보딩 압축** — auth redirect→/verify, /profile/complete 7→3필드 옵션카드, 흐름 정렬 + 후속 정비(타입/색상변수) | ✅ 1e7ec68 + 17732ab |
| 04-20 | pm+team | **M3 코트 지도 폴리시** — localStorage viewMode + 인포 ★평점/상세보기 + appkey env 외부화 | ✅ 86f1736 |
| 04-20 | pm+team | **M6 알림 분류** 6카테고리 + 카테고리별 mark-all-read + 더 보기 + 헤더 뱃지 사일런트 버그 정정 | ✅ 5e56d0f |
| 04-19 | dev+review | M2 데스크톱 sticky 신청 카드 도입 | ✅ 3405727 |
| 04-19 | developer | Phase 2b Step 1 — upsert.ts + sync-cafe --execute 통합 | ✅ 6d2617d |
| 04-19 | developer | M1 Day 8 설정/결제 탭 통합 허브 2개 + 기존 4페이지 redirect | ✅ 546a5c3 |
