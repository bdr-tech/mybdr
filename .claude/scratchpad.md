# 작업 스크래치패드

## 현재 작업
- **요청**: 전체 페이지 zoom 125% + 박스스코어 쿼터 필터 버튼 (API 쿼터별 집계)
- **상태**: developer 위임
- **현재 담당**: developer

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

### 라이브 페이지 zoom 125% + 박스스코어 쿼터 필터 버튼 (2026-04-15)

📝 구현한 기능:
- 라이브 박스스코어 페이지 전체 UI 1.25배 확대 (zoom: "1.25")
- 박스스코어 테이블에 쿼터 필터 버튼 (전체/1Q/2Q/3Q/4Q/OT) — 선택 쿼터만 노출, DNP 판정은 원본 유지
- API가 match_events를 항상(종료/진행 분기 무관) 조회해서 선수별 quarter_stats 필드 추가

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/app/api/live/[id]/route.ts | match_events 상시 조회 + playerId별 쿼터 집계 Map(quarterStatsByPlayer) 빌드 → 두 분기(진행/종료) 모두 row.quarter_stats 주입. PlayerRow 타입에 quarter_stats 추가 | 수정 |
| src/app/live/[id]/page.tsx | PlayerRow+QuarterStat 타입, zoom 1.25 3곳(error/loading/main), BoxScoreTable에 hasOT prop + quarterFilter state + applyQuarterFilter 헬퍼 + 팀명 헤더 옆 필터 버튼 그룹 | 수정 |

🔎 자체 검증:
- `npx tsc --noEmit` → exit=0, 에러 0건
- grep `zoom:` → 3곳 확인 (line 350/366/407 = error/loading/main)
- grep `quarterFilter|applyQuarterFilter|hasOT` → 정의 1 + 사용처 정상 (page.tsx)
- grep `quarterStatsByPlayer|quarter_stats|allEvents` → API에서 Map 구축 + 두 분기(진행 line 340, 종료 line 390) 주입 확인
- 쿼터 키: "1"=Q1, "5"=OT1. 기록 없는 쿼터는 Map에서 키 자체 생략 → 프론트가 0 객체로 치환 후 0%/- 표시
- DNP 판정은 원본 p.dnp로 유지 (쿼터 필터와 무관) — NBA 스타일 보존
- TOTAL 합계는 activePlayers.reduce 그대로 — 쿼터 필터 적용된 값으로 자동 재계산
- PtsTeamBar, DNP 셀 로직, 4/11~12 안내, 프린트 CSS 모두 미변경

💡 tester 참고:
- 테스트 방법: `/live/[id]` 페이지에서 박스스코어 팀명 옆 쿼터 버튼 클릭 → 해당 쿼터 스탯만 표시, TOTAL도 재계산됨
- 정상: "전체" 버튼은 기존 합계 그대로, 1Q~4Q 클릭 시 쿼터별 스탯, OT 버튼은 연장 있을 때만 노출
- 전체 UI가 125% 확대되어야 함 (헤더/스코어카드/박스스코어 포함)
- 주의: match_events 쿼터 필드가 null인 이벤트는 quarter=1로 간주 (기존 PBP 폴백과 동일 규칙)

⚠️ reviewer 참고:
- API: quarter_stats 집계에서 min/min_seconds/plus_minus는 이벤트만으로 계산 불가하므로 0 고정 (프론트가 0→"-" 표시)
- 종료 분기의 매칭 키는 `Number(player.id)` (= tournamentTeamPlayer.id), 진행 분기는 `row.id` (이미 tournamentTeamPlayer.id로 세팅됨)
- 기존 전체 집계(home_players/away_players)는 완전히 유지, 추가만 함

### 중앙 🔄 제거 + 글자 확대 + TeamLogo adaptive (2026-04-15)

📝 변경:
- 중앙 정보: 🔄 새로고침 버튼 제거 (3초 폴링 자동 갱신으로 수동 버튼 불필요, onClick={fetchMatch}는 이 버튼뿐이었음)
- 글자 확대: 상태라벨 text-sm→text-xl(highlight)/text-lg, 일시 text-xs→text-base, 장소 text-xs→text-base + max-w-[140px]→[220px], 래퍼 gap-1→gap-2
- TeamLogo 플레이스홀더: 팀색 brightness(ITU-R BT.601 luma) 기반 adaptive
  * brightness > 0.5: 검정 글자(#1a1a1a) / 아니면 흰 글자(#ffffff)
  * brightness > 0.9 || < 0.1: var(--color-border) 2px 테두리 + box-sizing:border-box (극단 명도 → 테마 배경 동화 방지)
- 헬퍼 3개 추가(getTeamInitials 아래): hexToRgb, getColorBrightness, getTeamBadgeStyle
- 로고 있는 img 경로는 건드리지 않음 (요청대로 플레이스홀더 한정)

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/app/live/[id]/page.tsx | 헬퍼 3개 + TeamLogo 플레이스홀더 adaptive 로직 + 중앙 블록 글자 확대 + 🔄 제거 | 수정 |

🔎 자체 검증:
- `npx tsc --noEmit` → exit=0, 에러 0건
- grep `fetchMatch` → 정의 1 + polling 2 + 주석 1, onClick 사용처 0 (버튼 완전 제거 확인)
- grep `getTeamBadgeStyle|getColorBrightness|hexToRgb` → 정의 3 + 내부 호출 2 + TeamLogo 사용 1

💡 PM/tester:
- **TeamLogo 테스트 케이스** (팀색 변경 없이 DB team.color 기준):
  * 흰색 `#FFFFFF` (brightness=1.0): 글자 검정 + 2px 테두리 (라이트 모드에서 배지 구분)
  * 검정 `#000000` (brightness=0): 글자 흰색 + 2px 테두리 (다크 모드에서 배지 구분)
  * BDR Red `#E31B23` (brightness≈0.26): 글자 흰색 + 테두리 없음
  * 연두 `#ADFF2F` (brightness≈0.84): 글자 검정 + 테두리 없음
- **중앙 정보 블록**:
  * 🔄 버튼 사라짐, 점수는 3초마다 여전히 자동 갱신
  * 상태라벨(경기 중/N쿼터/하프타임 등)이 text-xl로 또렷해짐
  * 일시/장소도 text-base로 확대, 장소 긴 이름은 max-w-[220px]까지 한 줄 표시
- **기존 동작 유지**: 점수 플래시, 쿼터 테이블, 박스스코어 모두 영향 없음

⚠️ reviewer:
- `getColorBrightness` 파싱 실패 시 0.5 반환 → fg=흰색, needsBorder=false로 안전하게 fallback
- "3자리 hex(#FFF)" 입력도 지원하지만 프로젝트 DB는 6자리 저장이라 실질 경로는 6자리
- 테두리 2px은 `box-sizing: border-box`로 48/56/64/72 원형 전체 크기 유지 (레이아웃 깨짐 없음)

---

### /live/[id] 중앙 정보 상태기반 + 폭 75% (2026-04-15)

📝 변경:
- 가운데 정보 블록: [N쿼터/경기전/중/종료 라벨] + [일시 YYYY.MM.DD HH:MM] + [장소] + [🔄]
- 라운드명(round_name) 제거 (정보 밀도 낮음)
- 헬퍼 추가: getCenterStatusLabel (상태→라벨+색 highlight bool), formatMatchDateTime (ISO→YYYY.MM.DD HH:MM)
- 스코어카드 + 쿼터 테이블을 mx-auto w-full sm:w-3/4로 감싸 데스크톱에서 75%폭 중앙 집중 (모바일 100%)
- 박스스코어(BoxScoreTable, 500행~)는 래퍼 밖이라 폭 영향 없음

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/app/live/[id]/page.tsx | getQuarterLabel 아래 헬퍼 2개 + 중앙 블록 재작성(라운드명 제거) + 75% 래퍼 open/close 2곳 | 수정 |

🔎 자체 검증:
- `npx tsc --noEmit` → exit=0, 에러 0건
- grep `round_name` → 타입 정의 + 프린트 영역만 잔존 (중앙 블록에서 제거 확인)
- grep `mx-auto w-full sm:w-3/4` → 1건(래퍼)
- grep `getCenterStatusLabel|formatMatchDateTime` → 정의 2 + 사용 2

💡 PM/tester:
- **테스트**: `/live/[경기ID]` 접속
  1. status=live + current_quarter=3 → 중앙 상단 "3쿼터" 빨강+bold
  2. current_quarter=5 → "연장1" 빨강+bold
  3. status=live + current_quarter null/0 → "경기 중" 빨강
  4. status=halftime → "하프타임" 빨강+bold
  5. status=warmup → "워밍업" muted
  6. status=scheduled → "경기 전" muted
  7. status=finished/completed → "경기 종료" muted
  8. scheduled_at 있으면 그 시각, 없으면 started_at, 둘 다 없으면 일시 줄 숨김 (포맷 "2026.04.15 19:00")
  9. venue_name 있으면 노출, 없으면 숨김
  10. 640px 이상(sm:) 폭 75% + 중앙 / 640px 미만 폭 100%
  11. 라운드명은 스코어카드에서 사라졌지만 프린트 헤더(데이터 손실 방지 목적)엔 유지

⚠️ reviewer:
- 중앙 블록 너비 변동은 `min-w-[80px]` 고정 없이 현재 구조 유지 (라벨 최대 4자라 점프 크지 않을 것으로 판단)
- `formatMatchDateTime`는 브라우저 로컬 타임. 한국 사용자 대상이고 서버-브라우저 모두 KST 기준이라 큰 문제 없음 (SSR 불일치 피하려고 클라이언트 useState 후 렌더)

---

### 티빙 이미지 매칭 재조정 — 5단 레이아웃 + 쿼터 강조 (2026-04-15)

📝 변경:
- 스코어카드: `[로고+팀명+점수]` 2열(flex-1) 세로 → `[로고+팀명][점수][중앙][점수][로고+팀명]` 5단 독립 가로 배치
- 홈팀 팀명 앞에 Material Symbols `home` 아이콘 (16px, muted 색)
- 팀명 크기 `text-lg sm:text-2xl` → `text-sm sm:text-base`로 축소 (로고/점수 대비 약화)
- 쿼터 테이블 래퍼 `mx-auto w-3/4` 제거 → 전체 폭 100%로 롤백
- 쿼터 헤더/셀 진행 상태 분기: `isLive`이고 `current_quarter`가 있을 때만
  - 진행 쿼터(idx === current_quarter-1): `var(--color-info)` 파랑 + font-semibold
  - 미도래(idx > current_quarter-1): muted 회색 + 셀 값 `-`로 치환 + 헤더 opacity-60
  - 지나간 쿼터: 기본색 (text-primary / text-muted) 유지
- 종료 경기(`isLive === false`) 또는 `current_quarter === null`: 모든 쿼터 실제값 + 기본색 (강조/회색 미적용)

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| src/app/live/[id]/page.tsx | 스코어카드 335~430행 5단 구조 재작성 + 쿼터 테이블 444~555행 진행/미도래 판정 로직 삽입 (thead + home/away tbody 3군데) | 수정 |

🔎 자체 검증:
- `npx tsc --noEmit` → exit=0, 에러 0건
- grep `mx-auto w-3/4` → 주석 1건만 (실제 className에서는 제거됨 확인)
- grep `material-symbols-outlined` → 356행(home 아이콘) + 600/616행(기존 info/print) 기대대로
- grep `current_quarter` → 판정 로직 3군데(459/486/519행) 정상 삽입
- 5단 요소 independent flex children: `flex-shrink-0` 2개(좌/우 팀 영역) + 가변 2개(점수 p 태그) + 가변 1개(중앙) → 반응형 줄어듦

💡 PM/tester 참고:
- **테스트 방법**: `/live/[경기ID]` 접속
  1. 라이브 경기(status=live, current_quarter=3) → 쿼터 테이블에서 Q3 헤더/셀이 **파란색 + bold**, Q4 헤더는 **회색+opacity60**, Q4 셀 값 **"-"** 표시
  2. 라이브 경기 current_quarter=4 (OT 없음) → Q4만 파랑, Q1~Q3 기본색
  3. 종료 경기(finished) → 모든 쿼터 실제값 + 기본색 (강조/회색 미적용)
  4. 홈팀 팀명 앞에 🏠 아이콘 노출, 원정팀은 아이콘 없음
  5. 점수가 팀 영역 바깥으로 분리되어 **가운데 큼직하게** 나란히 배치되는지
  6. 모바일(375~) 가로 밀리지 않음 / 태블릿(640+) 로고 56→72px로 커짐
  7. 긴 팀명은 `max-w-[120px] sm:max-w-[160px]` + truncate
- **정상 동작**: 이미지의 티빙 중계 화면처럼 `[로고+팀명][점수][쿼터/경기장][점수][로고+팀명]` 5단 가로 레이아웃
- **tsc 결과**: exit=0

⚠️ reviewer 참고:
- 쿼터 판정 로직을 3번 반복 기술(thead, home tr, away tr)했음. 헬퍼로 추출할 수도 있으나 **가독성 우선** + map 콜백 내부 지역변수라 각 위치의 분기 의도가 명확해 중복 유지함.
- 홈 아이콘은 Material Symbols home. `color`는 muted로 팀명보다 약하게.
- 점수 p 태그에 `flex-shrink`를 걸지 않아 모바일 text-5xl(48px)에서는 자체 폭 차지함 — 실기기에서 `flex-shrink-0` 필요 여부 확인 권장.

---

### 티빙 스타일 Phase 1 — 스코어카드 리디자인 (2026-04-15)

📝 변경:
- API route: 팀 로고 url + venue_name + current_quarter 응답에 추가
- MatchData 타입 확장 (logo_url / venue_name / current_quarter)
- 스코어카드: 팀색 점(3px) 제거 → 큰 원형 팀 로고(모바일 56 / sm:72)로 교체
- 로고 없으면 팀색 원 + 팀명 이니셜 (TeamLogo + getTeamInitials 헬퍼)
- 중앙 영역 재구성: [N쿼터(빨강 isLive 한정)] / [라운드명 muted] / [경기장명 muted] / [🔄 원형 버튼]
- 헤더 새로고침 제거 (스코어카드 중앙으로 이동)
- 쿼터 테이블 + 박스스코어 미변경 (Phase 2에서 처리)

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/app/api/live/[id]/route.ts | team select에 logoUrl + tournament select에 venue_name + currentQuarter용 play_by_plays.findFirst + 응답 4필드 추가 | 수정 |
| src/app/live/[id]/page.tsx | MatchData 확장 + TeamLogo/getTeamInitials 헬퍼 추가 + 스코어카드 좌/중/우 레이아웃 교체 + 헤더 새로고침 제거 | 수정 |

⚠️ PM 가이드 정정:
- `tournament_teams` 테이블엔 `logo_url` 컬럼이 **없음** (line 292는 다른 모델). teams.logoUrl 단일 소스만 사용 (fallback 불필요)
- 라운드명(round_name)을 가운데 영역에 살려둠 — 기존 정보 손실 방지

🔎 자체 검증:
- `npx tsc --noEmit` → exit=0 (에러 0건)
- grep `w-3 h-3 rounded-full mx-auto` → 0건 (구 팀색 점 완전 제거)
- grep `onClick={fetchMatch}` → 1건 (가운데 새 버튼만, 헤더 중복 제거 확인)
- API 응답 신규 필드 4개(logoUrl×2 / venueName / currentQuarter) grep 확인

💡 PM/tester:
- 테스트: `/live/[경기ID]` 접속
  1. 로고 있는 팀: 원형 로고 이미지 표시
  2. 로고 없는 팀: 팀색 원 + 이니셜("DB", "BE" 등)
  3. venue_name 있는 경기: 가운데에 경기장명 노출 / 없으면 숨김
  4. status=live/in_progress + PBP 있는 경기: "3쿼터" 빨강 표시
  5. status=finished/scheduled: 쿼터 미표시 (current_quarter는 살아있어도 isLive false면 숨김)
  6. 모바일(<640px): 로고 56px, 점수 text-5xl / sm 이상: 로고 72px, 점수 text-6xl
  7. 헤더 우측에 새로고침 버튼이 사라지고 ThemeToggle만 있는지
  8. 가운데 둥근 새로고침 버튼 클릭 시 데이터 갱신 동작
  9. 라이트/다크 양쪽 가독성

⚠️ 추가 주의:
- API 응답 필드 4개 추가만 (기존 필드 미변경) → Flutter/타 페이지 영향 없음 예상
- TeamLogo의 흰색 글자가 옅은 팀색(노랑/베이지)에서 가독성 떨어질 수 있음 → 후속 Phase에서 contrast 기반 adaptive
- play_by_plays.findFirst 추가 쿼리 1회 발생 (3초 폴링이라 부담은 작음, idx_pbp_match_quarter 인덱스 활용)

---

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
| 04-15 | developer | /live/[id] 티빙 이미지 매칭 재조정 — 5단 가로 레이아웃 + 🏠 + 쿼터 100% + 진행쿼터 파랑/미도래 회색"-" | ✅ 완료 |
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
