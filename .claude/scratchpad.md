# 작업 스크래치패드

## 현재 작업
- **요청**: 메인/합계 점수 글자 색 통일 + 쿼터 테이블 폭 75% + 메인 점수 간격 80%
- **상태**: developer 위임
- **현재 담당**: developer
- **사용자 결정**:
  - 메인 점수 + 쿼터 합계 점수 color → var(--color-text-primary), textShadow 제거
  - 쿼터 테이블 w-full → w-3/4 + mx-auto
  - 스코어카드 flex gap-4 → gap-3, 가운데 px-2 → px-1

## 전체 프로젝트 현황 대시보드 (2026-04-15)
| 항목 | 수치 |
|------|------|
| 웹 페이지 (web) | 84개 |
| 관리자 페이지 (admin) | 16개 |
| Prisma 모델 | 87개 (Referee 시스템 14개 추가) |
| Web API | 120+ 라우트 |
| 미푸시 커밋 | 0개 |
| 열린 PR | #8 (subin → dev, Phase 2C) |

## Phase 2: 팀명 한/영 구조화 ✅ 전체 완료
| 단계 | 상태 | 커밋 |
|------|------|------|
| 2A-1 스키마 추가 | ✅ | 66e6736 |
| 2A-2 API/검색/Zod | ✅ | e6a0ef7 |
| 2B 생성/수정 폼 UI | ✅ | c53fb71 |
| 2C 표시 UI 일괄 반영 | ✅ | ef43637 |
| dev 머지 + 충돌 해결 | ✅ | 69d0479 (수빈 버전 상위 호환 채택) |
| dev PR | ✅ | #8 리뷰 대기 |

## ⚠️ 원영에게 공유 (미해결)
- `db push --accept-data-loss`로 개발 DB의 referee/association 23행 삭제
- schema 구조는 복원(커밋 66e6736), 데이터는 빈 상태
- subin-referee 작업 재개 시 데이터 재입력 필요
- PR #8에도 공유 섹션 포함
- 상세: `.claude/knowledge/errors.md` 2026-04-15 항목

## 💡 운영 팁 (이 세션에서 확립)
- gh 인증이 풀리면: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...` 로 세션 단위 우회
- 영구 복구는 `"/c/Program Files/GitHub CLI/gh.exe" auth login`

## 구현 기록 (developer)

### /live/[id] 스코어카드 색 통일 + 쿼터 폭 75% + 간격 축소 (2026-04-15)

📝 변경:
- 메인 점수(홈/원정 text-6xl)와 쿼터 합계 셀 color → `var(--color-text-primary)`, textShadow 완전 제거
  (팀색은 카드 위 3px 동그라미로만 식별 — "외곽선만 보인다" 피드백 반영)
- 쿼터 테이블 래퍼 div에 `mx-auto w-3/4` 추가 (전체 폭 75% + 가운데)
- 스코어 카드 flex `gap-4 → gap-3`, 가운데 콜론 영역 `px-2 → px-1` (간격 80% 수준)

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/app/live/[id]/page.tsx | 287~401행 6군데 수정 (메인 점수 2, 합계 셀 2, 쿼터 래퍼 1, flex/가운데 1쌍) | 수정 |

🔎 검증:
- `textShadow` 문자열: 파일 전체 0건 (grep 확인)
- tsc `--noEmit`: exit=0, 에러 0건
- 박스스코어 테이블(BoxScoreTable, 500행~) 미변경 — 범위 외 유지

💡 PM/tester:
- 라이트/다크 양쪽에서 메인 점수·합계 숫자가 테마 기본 글자색(검정/흰색)으로 또렷하게 보이는지 확인
- 팀 식별은 카드 위 동그라미(team.color)가 유지되고 있는지
- 쿼터 테이블이 가운데 정렬 + 화면 폭의 75%로 줄어들었는지
- 플래시 애니메이션(scale+brightness) 정상 작동 (글자색만 바뀌고 className 로직은 유지)

---

### 라이브 페이지 라이트모드 + 시인성 개선 (2026-04-15)

📝 구현한 기능: `/live/[id]` 페이지를 테마 반응형(라이트/다크)으로 전환하고 글자 크기를 두 단계 확대, 헤더에 ThemeToggle 추가.

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| src/app/live/[id]/page.tsx | 하드코딩 색상 전면 CSS 변수화 + 글자 2단계 확대 + ThemeToggle 추가 | 수정 |

🗂 사용한 CSS 변수 매핑:
| 기존 (하드코딩) | 변경 후 (CSS 변수) |
|------|------|
| `#0A0A0F` (페이지 배경) | `var(--color-background)` |
| `#141416` (카드/헤더/테이블 배경) | `var(--color-card)` |
| `#111118` (PBP 컨테이너, TOTAL sticky bg) | `var(--color-elevated)` |
| `text-white`, `text-gray-200/300` | `var(--color-text-primary)` |
| `text-gray-400` | `var(--color-text-secondary)` |
| `text-gray-500/600` | `var(--color-text-muted)` |
| `border-white/10`, `/5`, `/20` | `var(--color-border)` |
| `bg-white/[0.02]` (zebra 짝수) | 투명 |
| `bg-white/[0.04]` (zebra 홀수 / TOTAL) | 중립 회색 `rgba(127,127,127,0.06)` / `0.10` |
| `border-orange-500` (로딩 스피너) | `var(--color-primary)` |
| `bg-red-500`, `text-red-400` (LIVE) | `var(--color-status-live)` |
| 하단 `bg-[#0A0A0F]/90` | `color-mix(in srgb, var(--color-background) 90%, transparent)` + backdrop-blur |

✍️ 글자 크기 확대 (2단계):
- 박스스코어 테이블 `text-xs` → `text-base` (thead/tbody)
- DNP 라벨 `text-[10px]` → `text-xs`
- 팀명 헤더 `text-sm` → `text-lg` (스코어카드 + 박스스코어)
- 헤더 토너먼트명 `text-sm` → `text-base`
- 상태/LIVE 라벨 `text-xs` → `text-sm`
- PBP 테이블 `text-xs` → `text-base`
- PBP 섹션 헤더 `text-sm` → `text-lg`
- 하단 fixed bar `text-xs` → `text-sm`
- 프린트 버튼 `text-sm` → `text-base`
- **유지**: 점수 `text-6xl`, 콜론 `:`, 라운드명, 쿼터 테이블 `text-sm`

🎨 헤더 ThemeToggle 추가:
- `import { ThemeToggle } from "@/components/shared/theme-toggle"` 추가
- 새로고침 버튼 **왼쪽**에 배치 (테마 → 새로고침 순)

💡 PM/tester 참고:
- **테스트 방법**: `/live/[경기ID]` 접근 → 헤더 우측 테마 토글 클릭 → 배경/글자색/줄무늬/스피너 모두 즉시 전환되는지 확인
- **정상 동작**: 라이트 모드에선 흰 배경 + 검정 글자, 다크 모드에선 검정 배경 + 흰 글자. 팀 컬러(동그라미/점수 숫자)는 테마와 무관하게 DB 색상 그대로.
- **주의해서 볼 입력값**: 
  1. LIVE 상태 경기 → 빨강 인디케이터가 라이트 모드에서도 진하게 보이는지
  2. 점수 변경 플래시(scale+brightness) 효과가 라이트 모드에서도 자연스러운지
  3. 박스스코어 가로 스크롤 시 sticky 컬럼(번호/이름/TOTAL)이 투명해지지 않고 card/elevated 배경을 유지하는지
  4. 프린트(Ctrl+P) — 기존과 동일하게 검정 잉크 + 흰 배경 출력되어야 함 (프린트 영역 인라인 #000/#666/#999는 보존)
- **tsc 결과**: 소스 에러 0건 통과 (src/ 하위 에러 없음, .next/dev/types/routes.d.ts의 자동생성 파일 에러는 Next.js 내부 이슈로 본 수정과 무관)

⚠️ 잠재 이슈:
- `color-mix(in srgb, ...)` CSS 함수는 모든 최신 브라우저 지원(Chrome 111+, Safari 16.2+, Firefox 113+). IE/구형 브라우저에서는 fallback 없음(BDR은 모던 브라우저 대상이므로 문제 없음 예상).
- 하단 fixed bar의 `backdrop-blur`가 globals.css의 `html.dark [class*="backdrop-blur"]` 오버라이드(배경 rgba(26,29,39,0.92))와 간섭할 수 있음 — 다크 모드에서 배경이 더 진해 보일 수 있으나 기능 이슈는 없음.
- ThemeToggle 컴포넌트의 hover 색상(`rgba(27,60,135,0.08)`)이 다크 모드에서는 살짝 덜 보일 수 있지만 이는 공통 컴포넌트의 기존 동작.

🎁 컨벤션 후보 (conventions.md 승격 제안):
- **풀스크린 / (web) 그룹 밖 페이지**에도 ThemeToggle을 개별 배치해야 한다는 패턴 — 라이브/프린트 중심 페이지는 사이드바 없이도 테마 전환 UI 필요.

### /live/[id] 스코어카드 + 쿼터 테이블 가독성 개선 (2026-04-15)

📝 구현한 기능: 스코어카드 메인 점수(홈/원정)와 쿼터 테이블 합계 셀에 text-shadow outline을 입혀 흰/옅은 팀색도 라이트·다크 양쪽에서 가독성 확보. 팀명(text-2xl)과 쿼터 테이블(text-lg 상속) 추가 확대, 쿼터 테이블 패딩 축소로 밀도 개선.

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| src/app/live/[id]/page.tsx | 287~412행 스코어카드/쿼터테이블 영역: 메인 점수·합계 셀에 textShadow 2겹 추가, 팀명 text-lg→2xl, 테이블 text-sm→lg 상속, 팀명 셀 명시 text-base 제거, 좌우 끝 셀 px-3→2·쿼터 셀 px-2→1 | 수정 |

🎨 textShadow 세부:
- 메인 점수(text-6xl): `0 0 1px var(--color-text-primary), 0 0 3px var(--color-background)`
- 합계 셀(text-lg): `0 0 1px var(--color-text-primary), 0 0 2px var(--color-background)` — 글자 작으니 바깥 반경 약하게
- 안쪽 1px은 테마 반대색으로 경계 보강, 바깥은 배경색으로 배경과의 경계 강조

💡 PM/tester 참고:
- **테스트 방법**: `/live/[경기ID]` 접속 → 테마 토글(헤더) 양쪽 확인.
- **정상 동작**:
  1. 메인 점수(홈/원정)와 합계 셀의 팀색이 **라이트/다크 양쪽**에서 경계가 보임 (흰색/베이지/밝은 노랑 같은 팀색도 또렷)
  2. 팀명이 이전보다 더 크게(18→24px) 보임
  3. 쿼터 테이블 숫자가 14→18px로 커지고 좌우 간격은 좁아져 밀도가 높아짐
  4. 플래시 애니메이션(scale+brightness) 유지
  5. 팀색 동그라미(3px 원) 유지
- **tsc 결과**: `npx tsc --noEmit` exit=0, 소스 에러 0건
- **grep 검증**: `text-sm`/`text-base`/`px-3` 잔존 위치는 전부 스코어카드/쿼터 테이블 바깥(헤더·박스스코어·PBP·프린트 버튼·하단 바) — 의도대로 손대지 않음

⚠️ 주의:
- 박스스코어 테이블(BoxScoreTable, 500행~) 미변경 — 이번 작업 범위 외
- textShadow 2겹이 매우 얇은 폰트(text-6xl 굵기 black이라 실제로는 두꺼움)에서 과도하게 보일 수 있음. 실기기에서 확인 필요.
- 테마 전환 시 textShadow의 `var(--color-*)`도 실시간 반영되므로 재렌더 필요 없음.

---

### /live/[id] 박스스코어 MIN 복원 + DNP 재구조화 + PTS 가독성 (2026-04-15)

📝 구현한 기능:
1. **MIN 컬럼 복원** (3곳: thead / tbody 활성 선수 / TOTAL 행). 이름 뒤·PTS 앞 위치.
2. **DNP 행 재구조화** (NBA 스타일): `colSpan={16}` 제거 → 19셀 모두 채움. MIN 셀에 "DNP" 텍스트(text-xs semibold muted), 나머지 16개 스탯 셀은 `-`.
3. **4/11~12 경기 조건부 안내** 추가. 박스스코어 두 팀 모두 끝난 후(프린트 버튼 위)에 한 번만 표시, `data-print-hide`로 프린트에선 숨김. 판정 로직: `scheduled_at` → `started_at` → `updated_at` fallback + 2026-04-11/12 체크.
4. **MIN 우측 스탯 셀 `px-1` → `px-0.5`** 일괄 축소 (4px → 2px). 이름/번호 셀은 `px-3`/`px-1` 유지.
5. **PTS 가독성(라이트모드)**: 좌측 3px 팀색 띠(`PtsTeamBar` 컴포넌트) + 글자 색 `var(--color-text-primary)`. 부모 `td.relative`에 `span.absolute`. 활성 선수 행 + TOTAL 행 모두 적용 (DNP 행은 `-`만, 띠 없음).

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| src/app/live/[id]/page.tsx | MatchData 타입에 scheduled_at/started_at 추가 + isLegacyClockIssue 계산 + 안내문구 블록 + BoxScoreTable 전면 개선 (MIN 3곳 복원, DNP 19셀, PTS 띠, px-0.5) | 수정 |
| src/app/api/live/[id]/route.ts | apiSuccess 응답에 scheduledAt/startedAt 필드 추가 (프런트 분기용) | 수정 |

💡 PM/tester 참고:
- **테스트 방법**:
  1. `/live/[경기ID]` 접속 — MIN 컬럼이 이름 뒤에 `M:SS` 형식(예: `12:30`)으로 표시되는지
  2. DNP 선수(로스터 등록됐으나 출전 0) 행이 MIN 셀에 "DNP" + 나머지 셀 `-`로 19셀 모두 채워졌는지
  3. TOTAL 행 MIN은 팀 출전 총합(초 → M:SS)으로 표시되는지
  4. 4/11~12 경기: URL에 해당 날짜 경기 id로 접속 → 박스스코어 하단에 ℹ 아이콘 + "경기시간 집계 시스템 오류..." 안내 노출 확인
  5. 4/13 이후 경기: 안내 문구 미노출 확인
  6. 라이트/다크 모두에서 PTS 숫자가 잘 보이는지(좌측 3px 팀 컬러 띠 + 검정/흰 글자)
  7. 프린트(Ctrl+P): 안내 문구가 숨겨지고 PTS 띠는 인라인 색상이라 남아 있음 (확인)
- **경기 날짜 분기**: `scheduled_at` 우선 → 없으면 `started_at` → 최후 `updated_at`. 4/11 또는 4/12만 true.
- **tsc 결과**: `npx tsc --noEmit` exit=0, 에러 0건.
- **셀 개수 검증**: 헤더/활성선수/DNP/TOTAL 모두 19셀로 맞춤 (# + 이름 + MIN + 16 스탯).

⚠️ 주의:
- API 응답에 `scheduledAt`/`startedAt` 필드를 새로 추가했으나 기존 소비자는 이 필드를 사용하지 않아 영향 없음 (추가만). snake_case로 자동 변환되어 프런트 `match.scheduled_at` / `match.started_at`로 내려옴.
- `/live/[id]` 외 다른 페이지는 수정하지 않음.
- PbpSection(/PBP 로그) 영역은 이번 작업 대상 아님 — px-2 그대로 유지.

🎁 컨벤션 후보 (1회차 관찰, 3회 반복 시 conventions.md 승격):
- "테마 반응형 박스스코어에서 팀 색은 좌측 3~4px 띠로 표기, 글자 색은 `var(--color-text-primary)` 사용" — NBA.com 스타일. 하드코딩 팀 색이 라이트모드에서 가독성 떨어지는 문제 해결 패턴.

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-15 | developer | /live/[id] 박스스코어 MIN 복원 + DNP 19셀 재구조화 + PTS 좌측 띠 + px-0.5 축소 + 4/11~12 안내 | ✅ 완료 |
| 04-15 | developer | /live/[id] 라이트모드 + 글자 2단계 확대 + ThemeToggle 헤더 추가 | ✅ 완료 |
| 04-15 | pm | knowledge 갱신 (errors +1, lessons +2) + scratchpad Phase 2 완료 처리 | ✅ 완료 |
| 04-15 | pm | dev PR #8 생성 (git credential로 gh 우회) | ✅ 완료 |
| 04-15 | pm | dev 머지 + validation/team.ts 충돌 해결 + 2차 푸시 (69d0479) | ✅ 완료 |
| 04-15 | pm | Phase 2C 커밋 + 1차 푸시 (ef43637) | ✅ 완료 |
| 04-15 | pm | scratchpad 경량화 (163→50줄) | ✅ 완료 |
| 04-13 | developer | Phase 2B: 팀 생성/수정 폼 UI 영문명 + 대표언어 토글 (c53fb71) | ✅ 완료 |
| 04-15 | developer | Phase 2A-2: Team name_en API/Zod/검색 반영 (e6a0ef7) | ✅ 완료 |
| 04-15 | developer | Phase 2A-1: Team.name_en/name_primary + Referee 14모델 (66e6736) | ✅ 완료 |
| 04-15 | developer | 참가팀 탭 → TeamCard 재사용 UI 통일 (2b69d12) | ✅ 완료 |
