# 작업 스크래치패드

## 현재 작업
- **요청**: 대진표 Phase 2-4 구체 계획 (리그→4강 자동 + 그래픽 강화 + wizard 포맷 + 자동 조편성)
- **상태**: 기획설계 완료 (Phase 1 구현 완료 상태)
- **현재 담당**: planner-architect → developer 대기

## 전체 프로젝트 현황 대시보드 (2026-04-01)
| 항목 | 수치 |
|------|------|
| 웹 페이지 (web) | 84개 |
| 관리자 페이지 (admin) | 16개 |
| Prisma 모델 | 73개 |
| Web API | 111개 라우트 |

## 기획설계 (planner-architect)

### 대진표 Phase 2-4 개발 (2026-04-13)

🎯 목표: 리그→4강 자동 생성 + 토너먼트 그래픽 강화 + wizard 포맷 세부설정 + 포맷별 자동 조편성/경기생성

---

### 현재 코드 베이스 조사 결과

| 구분 | 파일/상태 | 핵심 내용 |
|------|----------|----------|
| wizard | src/app/(web)/tournament-admin/tournaments/new/wizard/page.tsx | FORMAT_OPTIONS 4종 선택 UI만 있음 → **포맷별 세부설정(조수/진출팀수/3-4위전) 없음**, body에 settings 전송 안 함 |
| API POST | src/app/api/web/tournaments/route.ts | format만 저장. settings는 createTournament에 안 넘김 |
| bracket API POST | src/app/api/web/tournaments/[id]/bracket/route.ts | single_elimination 전용. format 분기 없음 |
| update-standings.ts | advanceWinner(토너먼트 진출) + updateTeamStandings(wins/losses) 2개 함수 | **리그 완료 감지 로직 없음** — 4강 자동생성 훅 추가 필요 |
| 매치 완료 훅 | src/app/api/web/tournaments/[id]/matches/[matchId]/route.ts:145 | status==="completed"일 때 updateTeamStandings 호출 → **여기에 리그 완료 체크 추가 가능** |
| bracket-generator.ts | generateSingleEliminationBracket + computeNextMatchLinks (BYE 배정, 시드정렬) | 재사용 가능 |
| tournament-tabs.tsx | full_league_knockout 분기 완성 (LeagueStandings + hasKnockout ? BracketView : 안내카드) | **그대로 활용 — Phase 2A가 경기만 생성하면 자동으로 트리 노출됨** |
| Tournament.settings | Json? @default("{}") 존재 | **스키마 변경 불필요** — preset/groupDraw/knockoutConfig 모두 여기에 저장 |

---

### Phase 2A: 리그 종료 시 4강 자동 생성 (예상 40분)

📍 만들 위치와 구조:
| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| src/lib/tournaments/league-completion.ts | (1) 리그 경기 전부 완료 여부 체크, (2) 4강 진출팀 순위 계산, (3) 1vs4/2vs3 준결승+결승(+3/4위전) TournamentMatch 생성 | 신규 |
| src/app/api/web/tournaments/[id]/matches/[matchId]/route.ts | PATCH 내 updateTeamStandings 직후 full_league_knockout이면 checkAndGenerateKnockout() 호출 | 수정 |
| src/app/api/web/tournaments/[id]/generate-knockout/route.ts | admin 수동 트리거 POST (안전장치, 자동 실패 시 재시도용) | 신규 |

🔗 기존 코드 연결:
- LeagueStandings의 순위 정렬 로직(승률 → 득실차 → 다득점)을 **league-completion.ts에서 재사용**하기 위해 → `src/lib/tournaments/league-standings-calc.ts`로 추출 (LeagueStandings 컴포넌트도 이 유틸 사용)
- tournament-tabs.tsx는 rounds 있으면 자동으로 BracketView 표시 → 경기 생성 완료되면 UI 자동 반영 (수정 불필요)
- bracket-version.ts의 createBracketVersion 호출하여 버전 관리 일관성 유지

🔑 핵심 로직 (league-completion.ts):
```ts
async function checkAndGenerateKnockout(tournamentId: string) {
  // 1. tournament.format === 'full_league_knockout' 확인
  // 2. settings.knockoutConfig = { size: 4, thirdPlaceMatch: boolean } 읽기
  // 3. 리그 경기(group_name=null, round_number=null)가 전부 completed인지
  // 4. 이미 토너먼트 경기(round_number != null) 있으면 skip
  // 5. advisory lock으로 동시 생성 방지
  // 6. 순위 계산 → size=4면 1위/2위/3위/4위 추출
  // 7. TournamentMatch 3~4개 생성:
  //    - 준결승1: home=1위팀, away=4위팀, round_number=1, bracket_position=1, next_match_id=결승
  //    - 준결승2: home=2위팀, away=3위팀, round_number=1, bracket_position=2, next_match_id=결승
  //    - 결승: round_number=2, bracket_position=1
  //    - (옵션) 3/4위전: round_number=2, bracket_position=2 (독립, next_match_id=null)
}
```

⚠️ developer 주의사항:
- **동시성**: updateTeamStandings 완료 직후 호출이므로 여러 경기가 거의 동시에 completed → advisory lock 필수 + "이미 토너먼트 경기 있음" 체크 필수
- **트랜잭션 외부 호출**: PATCH 핸들러의 트랜잭션 밖에서 호출하되 실패해도 경기 상태 변경은 보존 (warning만 반환)
- size=8/16도 확장 고려하되 **MVP는 size=4만** (열혈농구단 요구사항)

---

### Phase 2B: 토너먼트 그래픽 강화 — 순위별 시드 표시 (예상 20분)

📍 만들 위치와 구조:
| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| src/app/(web)/tournaments/[id]/bracket/_components/match-card.tsx | "1위" "2위" 시드 뱃지 렌더링 추가 (팀 이름 앞) | 수정 |
| src/lib/tournaments/bracket-builder.ts | RoundGroup 타입에 seedLabel 필드 추가 검토 **→ NO: 수정 금지 원칙. 대신 public-bracket API에서 seedLabel 주입** | 금지 |
| src/app/api/web/tournaments/[id]/public-bracket/route.ts | full_league_knockout이고 round_number=1일 때 각 매치의 home/awayTeam에 seedRank (1~4) 메타 추가 | 수정 |

🔗 기존 코드 연결:
- BracketView/match-card는 기존 데스크톱 SVG + 모바일 탭 구조 그대로 유지
- `roundName`은 이미 bracket-generator에서 "4강"/"결승" 자동 생성 → 별도 표기 불필요
- 3/4위전은 `roundName = "3·4위전"` + `bracket_level`/`bracket_position`으로 구분

🔑 시드 표시 UX:
- 매치카드 팀 이름 앞에 작은 뱃지 `#1` `#4` 형식 (--color-accent 배경, 12px)
- Phase 2A에서 생성된 준결승 경기만 해당 (결승/3-4위전은 "승자 vs 승자")

⚠️ developer 주의사항:
- bracket-builder.ts **절대 수정 금지** (기존 토너먼트 시각화 깨짐) → public-bracket API 응답에만 seedRank 추가
- 기존 single_elimination 대회는 seedRank 없이 렌더링 (조건부)

---

### Phase 3: wizard 포맷별 세부설정 UI (예상 50분)

📍 만들 위치와 구조:
| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| src/components/tournament/format-settings-form.tsx | format 선택에 따라 조건부 필드 렌더링 (group_stage_knockout: 조수/조당팀수/조별진출수, single_elimination: 진출팀수 4/8/16, full_league_knockout: 4강여부/3-4위전, dual_tournament: 플래그만) | 신규 |
| src/app/(web)/tournament-admin/tournaments/new/wizard/page.tsx | Step 1에 FormatSettingsForm 추가, body.settings에 포맷별 config 전송 | 수정 |
| src/app/(web)/tournament-admin/tournaments/[id]/wizard/page.tsx | 기존 대회 수정 시에도 동일 UI + **대회 개시 전(status=registration_open 이전)만 수정 가능** 가드 | 수정 |
| src/app/api/web/tournaments/route.ts (POST) | body.settings 받아 createTournament에 전달 | 수정 |
| src/app/api/web/tournaments/[id]/route.ts (PUT) | settings 업데이트 허용 + status 체크 | 수정 |
| src/lib/services/tournament.ts (createTournament) | settings Json 필드 저장 | 수정 |

📋 settings JSON 스키마:
```json
{
  "formatConfig": {
    "group_stage_knockout": { "groupCount": 4, "teamsPerGroup": 4, "advancingPerGroup": 2, "knockoutSize": 8, "thirdPlaceMatch": false },
    "single_elimination":   { "knockoutSize": 16, "thirdPlaceMatch": false },
    "full_league_knockout": { "knockoutSize": 4, "thirdPlaceMatch": true },
    "dual_tournament":      { "bracketCount": 2 }
  }
}
```
저장 시 선택된 format의 config만 저장 (전체 저장 안 함).

🔑 대회 개시 전 수정 플로우:
- status가 `draft` 또는 `preparing` (접수시작 전)에만 수정 가능
- 이미 참가팀 승인되어 있으면 **경고만 표시** (설정 변경 가능하나 재조편성 필요 안내)
- 경기가 1개라도 생성돼 있으면 수정 막기 (DB 정합성)

⚠️ developer 주의사항:
- FORMAT_OPTIONS 4종 그대로 유지 (value 변경 금지 — DB 영향)
- Zod 스키마로 formatConfig 검증 (각 format별 허용 키 화이트리스트)

---

### Phase 4: 포맷별 자동 조편성/경기 생성 (예상 90분)

📍 만들 위치와 구조:
| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| src/lib/tournaments/league-generator.ts | 풀리그 경기쌍 생성(round-robin N*(N-1)/2, group_name=null, round_number=null) | 신규 |
| src/lib/tournaments/group-draw.ts | 스네이크 드래프트 조편성 + 조별 풀리그 경기 생성(group_name=A/B/C/D 설정) | 신규 |
| src/lib/tournaments/knockout-seeding.ts | 조별리그 결과 기반 교차시딩(조1위 vs 타조2위) + BYE 배정 + 3/4위전 옵션 | 신규 |
| src/app/api/web/tournaments/[id]/bracket/route.ts (POST) | format 분기: single_elimination은 기존 로직, 나머지 3종은 신규 유틸 호출 | 수정 |
| src/app/(web)/tournament-admin/tournaments/[id]/bracket/page.tsx | format별 UI: 조별이면 조편성 표시, 풀리그면 "리그 경기 생성" 버튼 | 수정 |

🔑 format별 생성 로직:

**full_league_knockout** (풀리그+토너먼트):
- POST 시: league-generator가 모든 팀의 round-robin 경기 생성 (group_name=null, round_number=null, scheduled)
- 리그 완료 후: Phase 2A의 league-completion이 자동으로 4강 경기 생성

**group_stage_knockout** (조별+토너먼트):
- POST 시: group-draw로 팀을 groupCount개 조로 배분 → 각 조 내 round-robin 경기 생성 (group_name="A"/"B"/..., round_number=null)
- 조별리그 완료 후: admin 페이지에서 "토너먼트 생성" 버튼 → knockout-seeding 호출 → 조1위 vs 타조2위 교차배치

**single_elimination** (순수 토너먼트):
- 기존 로직 그대로 유지 (bracket-generator.ts 활용)

**dual_tournament**: Phase 5로 미룸

🔑 스네이크 드래프트 (group-draw.ts):
```
시드 1 → A조 | 시드 2 → B조 | 시드 3 → C조 | 시드 4 → D조
시드 5 → D조 | 시드 6 → C조 | 시드 7 → B조 | 시드 8 → A조
시드 9 → A조 | ... (반복)
```

🔑 풀리그 경기쌍 (league-generator.ts):
- N팀 중 (i,j) i<j 모든 조합 → N*(N-1)/2 경기
- scheduledAt은 null (admin이 수동 배정), status=scheduled
- homeTeamId/awayTeamId는 시드 순서 균등 분배(라운드-로빈 알고리즘)

⚠️ developer 주의사항:
- 조별리그 경기: **group_name 설정, round_number/bracket_position은 NULL 유지** (기존 약속)
- 토너먼트 경기: round_number/bracket_position 설정, group_name은 NULL (기존 패턴)
- advisory lock + bracket version 관리 기존 패턴 동일 적용
- **MVP 최소 범위**: Phase 4에서 full_league_knockout + group_stage_knockout 2종만 (single은 기존 유지)

---

### 🚀 구현 순서 (의존관계 고려)

| 순서 | 작업 | 담당 | 선행 | 예상 |
|------|------|------|------|------|
| 1 | Phase 3 — wizard 포맷 세부설정 UI + settings 저장 (UI만, 생성 로직 없어도 저장은 가능) | developer | 없음 | 50분 |
| 2 | Phase 4a — league-generator.ts + bracket POST에 full_league_knockout 분기 | developer | 1 | 30분 |
| 3 | Phase 2A — league-completion.ts + matches PATCH 훅 + 수동 트리거 API | developer | 2 | 40분 |
| 4 | Phase 2B — public-bracket API seedRank + match-card 뱃지 | developer | 3 | 20분 |
| 5 | 통합 테스트 (full_league_knockout 전체 플로우 — 리그 생성→경기입력→자동4강) | tester | 4 | 15분 |
| 6 | Phase 4b — group-draw.ts + knockout-seeding.ts + group_stage_knockout 분기 | developer | 5 | 60분 |
| 7 | 최종 통합 검증 | tester + reviewer (병렬) | 6 | 15분 |

**MVP 권장**: 1→2→3→4→5까지 (full_league_knockout 완성). Phase 4b(조별리그)는 별도 iteration.

---

### ❓ 사용자 결정 필요 사항 (developer 진입 전 확인)

1. **4강 자동 생성 트리거**: A안(경기 completed 시 서버 hook 자동) 채택. admin 수동 트리거 API는 안전장치로 함께 제공. ✅
2. **3/4위전 기본값**: 열혈농구단 settings.knockoutConfig.thirdPlaceMatch → 사용자 선호 확인 필요
3. **리그 전체 생성 방식**: full_league_knockout 대회 생성 시 **자동 경기 생성**(POST bracket 버튼 클릭 시) vs **수동 입력**? 열혈농구단은 이미 31경기 수동 입력됨 → 향후 대회부터 자동 생성 적용 권장
4. **size=4 이외 4강 확장**: MVP는 4로 고정. 향후 size=8/16 지원 시 settings.knockoutConfig.size 활용

### 대진표 시스템 개발 (2026-04-13) — Phase 1 (참고용, 완료)

목표: 대회 관리자가 포맷 설정 -> 경기 자동 생성 -> 대진표/순위표 표시까지 완성

---

#### 0. 현재 상태 분석

**이미 있는 것:**
- wizard: format 4종 선택 UI (group_stage_knockout / dual_tournament / single_elimination / full_league_knockout)
- bracket admin 페이지: single_elimination 전용 대진표 생성/재생성/확정 (1라운드 팀 배치 편집)
- bracket API (POST): single_elimination만 생성 (format을 안 읽음)
- bracket-builder.ts: 시각화 유틸 (round_number 기준 그룹핑, SVG 좌표) -- 변경 불필요
- bracket-generator.ts: single_elimination 생성기 (BYE 배정, 시드 정렬)
- update-standings.ts: 경기 완료 시 wins/losses 갱신 + advanceWinner 진출 처리
- GroupStandings 컴포넌트: groupName이 있는 팀의 조별리그 순위표
- BracketView 컴포넌트: 토너먼트 트리 (데스크톱 SVG + 모바일 라운드탭)
- public-bracket API: 대시보드 통계 + groupTeams + rounds 반환

**열혈농구단 문제:**
- 8팀 풀리그 31경기, 7경기 완료
- TournamentMatch에 group_name/round_number/bracket_position 전부 NULL
- TournamentTeam에 groupName도 NULL
- tournament.format 값이 기본 single_elimination (또는 미설정)
- 결과: 조별 순위표도 안 나오고, 대진표 트리도 안 나옴 -> "대진표가 없습니다"

**핵심 문제: format에 따라 경기 생성 로직이 달라야 하는데, 현재는 single_elimination만 지원**

---

#### 1. 열혈농구단 즉시 해결 방안 (Phase 0)

열혈농구단은 이미 31경기가 수동으로 생성되어 있음. 대진표 시스템을 새로 구축하기 전에, 기존 경기를 바로 표시할 수 있는 방법이 필요.

**방법: "풀리그" format일 때 대진표 탭에서 순위표+경기목록 표시**

현재 bracket 페이지는 bracketOnlyMatches (round_number != null AND bracket_position != null)만 보여줌. 풀리그 경기는 이 필드가 NULL이라 아예 표시 안 됨.

format이 full_league_knockout이면:
- 순위표: 모든 참가팀의 경기결과 기반 승/패/득실차 집계 (이미 bracket 페이지에서 teamStats로 계산하는 로직 있음)
- 경기목록: group_name이 NULL인 경기도 "리그전 경기"로 표시

이 방법의 장점: 기존 데이터 수정 불필요. format만 full_league_knockout으로 바꾸면 됨.

---

#### 2. Phase별 계획

**Phase 1: 풀리그 순위표 표시 (열혈농구단 즉시 적용)** -- 예상 30분

bracket 페이지에서 format을 읽고, 풀리그일 때 리그 순위표 + 경기 일정을 표시.

| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| src/app/(web)/tournaments/[id]/bracket/page.tsx | format 읽기 + 풀리그 분기 추가 | 수정 |
| src/app/api/web/tournaments/[id]/public-bracket/route.ts | format 반환 + 풀리그 경기 목록 반환 | 수정 |
| src/app/(web)/tournaments/[id]/bracket/_components/league-standings.tsx | 풀리그 전용 순위표 (경기결과 기반 집계) | 신규 |
| src/app/(web)/tournaments/[id]/bracket/_components/league-schedule.tsx | 풀리그 경기 일정/결과 목록 | 신규 |

핵심 로직:
- public-bracket API에서 tournament.format을 함께 반환
- format이 full_league_knockout이면 모든 경기(group_name NULL 포함)를 "리그전 경기"로 포함
- league-standings: bracket 페이지의 teamStats 계산 로직을 재사용하여 순위표 렌더링
- league-schedule: 경기를 날짜별/라운드별로 그룹핑하여 카드 형태로 표시

**Phase 2: 조편성 자동 배분 + 조별리그 경기 자동 생성** -- 예상 1시간

| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| src/lib/tournaments/group-draw.ts | 스네이크 드래프트 조편성 + 풀리그 경기쌍 생성 로직 | 신규 |
| src/lib/tournaments/league-generator.ts | 풀리그/조별리그 TournamentMatch 일괄 생성 | 신규 |
| src/app/api/web/tournaments/[id]/bracket/route.ts | POST에 format 분기 추가 (조별리그/풀리그/토너먼트) | 수정 |
| src/app/(web)/tournament-admin/tournaments/[id]/bracket/page.tsx | 조편성 UI 추가 (그룹별 팀 배치 + 수정) | 수정 |

핵심 로직:
- group-draw.ts: 시드 기반 스네이크 드래프트 (시드1->A조, 시드2->B조, 시드3->B조, 시드4->A조, ...)
- league-generator.ts: N팀 풀리그 경기쌍 생성 (round-robin: N*(N-1)/2 경기)
- bracket API POST: format 읽기 -> single_elimination이면 기존 로직, group_stage_knockout이면 조편성+조별리그 경기 생성, full_league_knockout이면 전체 풀리그 경기 생성
- 생성된 조별리그 경기: group_name 설정, round_number/bracket_position은 NULL (리그전이므로)
- admin bracket 페이지: 조편성 결과 표시 + 팀 이동 UI

**Phase 3: 토너먼트 대진표 자동 생성 (조별리그 후 이어서)** -- 예상 40분

| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| src/lib/tournaments/knockout-seeding.ts | 조별리그 결과 기반 교차 시딩 + BYE 배정 | 신규 |
| src/app/api/web/tournaments/[id]/bracket/route.ts | 조별리그 완료 후 토너먼트 생성 엔드포인트 추가 | 수정 |
| src/app/(web)/tournament-admin/tournaments/[id]/bracket/page.tsx | "토너먼트 생성" 버튼 (조별리그 완료 후 활성화) | 수정 |

핵심 로직:
- knockout-seeding.ts: 조1위 vs 타조2위 교차배치, 미달 팀 BYE 자동 배정
- 기존 bracket-generator.ts의 single_elimination 로직 재사용
- 3/4위전 옵션 (settings.thirdPlaceMatch)
- 조별리그 경기와 토너먼트 경기가 같은 대회 안에 공존 (group_name으로 구분)

**Phase 4: 대진표 탭 format별 조건부 렌더링** -- 예상 30분

| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| src/app/(web)/tournaments/[id]/bracket/page.tsx | format별 분기 렌더링 (리그/조별+토너먼트) | 수정 |
| src/app/api/web/tournaments/[id]/public-bracket/route.ts | 리그전 경기 목록 + 조별리그 경기 포함 | 수정 |

핵심 로직:
- group_stage_knockout: 조별리그 순위표(GroupStandings) + 토너먼트 트리(BracketView) 순서 표시
- full_league_knockout: 리그 순위표(LeagueStandings) + 리그 경기 일정(LeagueSchedule) + (리그 후 토너먼트가 있으면 BracketView)
- single_elimination: 기존 그대로 (BracketView만)
- dual_tournament: Phase 5에서 별도 처리 (우선순위 낮음)

---

#### 3. 기존 코드 연결

- bracket API POST의 기존 single_elimination 로직(advisory lock, version 관리, BYE 처리)은 유지. format 분기만 추가
- update-standings.ts의 advanceWinner는 토너먼트 경기(next_match_id 있는)에만 동작 -> 조별리그 경기에는 영향 없음 (안전)
- GroupStandings 컴포넌트는 groupName이 있는 팀에만 동작 -> 풀리그(groupName NULL)에는 별도 LeagueStandings 필요
- bracket-builder.ts는 round_number 기준 그룹핑이므로 조별리그 경기(round_number NULL)는 자동 제외 -> 기존 토너먼트 표시에 영향 없음
- wizard의 format 4종 선택은 이미 DB에 저장됨 -> 그대로 활용

---

#### 4. 실행 계획 (우선순위 순)

| 순서 | 작업 | 담당 | 선행 조건 | 예상 시간 |
|------|------|------|----------|----------|
| 1 | Phase 1: 풀리그 순위표/경기목록 표시 + 열혈농구단 format 변경 | developer | 없음 | 30분 |
| 2 | Phase 1 검증 | tester | 1 | 10분 |
| 3 | Phase 2: group-draw.ts + league-generator.ts + bracket API format 분기 | developer | 2 | 40분 |
| 4 | Phase 2: admin bracket 페이지 조편성 UI | developer | 3 | 20분 |
| 5 | Phase 3: knockout-seeding.ts + 조별리그 후 토너먼트 생성 | developer | 4 | 40분 |
| 6 | Phase 4: 공개 bracket 페이지 format별 조건부 렌더링 | developer | 5 | 30분 |
| 7 | 전체 통합 검증 | tester + reviewer (병렬) | 6 | 15분 |

Phase 1(열혈농구단 즉시 해결)을 먼저 독립적으로 완료한 뒤, Phase 2~4를 순차 진행.

---

#### 5. developer 주의사항

- DB 스키마 변경 없음 -- Tournament.settings(Json), TournamentTeam.groupName/seedNumber, TournamentMatch.group_name 모두 이미 존재
- bracket-builder.ts 절대 수정 금지 (기존 토너먼트 시각화 깨짐)
- 조별리그 경기: group_name 설정, round_number/bracket_position은 NULL 유지 (리그전이므로)
- 토너먼트 경기: round_number/bracket_position 설정, group_name은 NULL (기존 패턴)
- format이 설정 안 된 기존 대회는 single_elimination으로 폴백 (하위 호환)
- Flutter 앱(bdr_stat)이 사용하는 v1 API는 절대 변경 금지
- 열혈농구단 대회의 format을 full_league_knockout으로 PATCH하는 것은 admin wizard에서 수동으로 진행 (코드로 직접 DB 변경하지 않음)
- 풀리그 순위표에서 승/패는 TournamentTeam.wins/losses가 아닌 경기 결과 실시간 집계 사용 (이미 bracket 페이지에 teamStats 로직 있음)
- advisory lock + bracket version 관리 패턴은 조별리그/풀리그 생성에도 동일 적용

## 구현 기록 (developer)

### Phase 1: 풀리그 대진표 표시 (2026-04-13)

구현한 기능: 대진표 탭에서 tournament.format이 풀리그(round_robin/full_league/full_league_knockout)일 때 리그 순위표 + 경기 일정 목록을 조건부 렌더링. 기존 single_elimination 동작은 완전히 유지.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/api/web/tournaments/[id]/public-bracket/route.ts | format/status/leagueTeams/leagueMatches 응답 추가 (teamStats 재사용) | 수정 |
| src/app/(web)/tournaments/[id]/bracket/_components/league-standings.tsx | 리그 순위표 (공동순위+KBL 승률 포맷) | 신규 |
| src/app/(web)/tournaments/[id]/bracket/_components/league-schedule.tsx | 경기 일정 (날짜별 그룹핑+LIVE 뱃지+승패 강조) | 신규 |
| src/app/(web)/tournaments/[id]/_components/tournament-tabs.tsx | BracketTabContent에 format 분기 추가 | 수정 |
| DB (tournaments) | 열혈농구단 format을 full_league_knockout으로 UPDATE | 데이터 |

tester 참고:
- 테스트 URL: /tournaments/d83e8b83-66d3-4f2f-ac41-3b594dbc38f6 → 대진표 탭
- 정상: 8팀 리그 순위표(상위 3팀 빨간 막대) + 날짜별 경기 카드(31경기, 7완료) 표시
- 기존 단일 토너먼트 대회 샘플도 열어서 기존 BracketView가 깨지지 않았는지 확인 필요
- 풀리그인데 경기가 0개인 경우: "아직 생성된 경기가 없습니다" 표시
- 순위 정렬: 승률 → 득실차 → 다득점

reviewer 참고:
- teamStats는 public-bracket route에서 원래 hotTeam 계산용으로 집계하던 것을 재사용 (중복 계산 없음)
- leagueMatches 정렬 시 scheduledAt=null은 맨 뒤로
- LeagueSchedule은 /live/[matchId]로 링크 (scoreboard로 이동)
- 기존 분기(groupTeams/rounds)는 isLeague=false 경로로 그대로 유지

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| 1차 | 04-13 | 대진표 탭에서 LeagueSchedule 제거 + 4강 토너먼트 트리 영역 추가 (hasKnockout ? BracketView : 안내 카드), hasLeagueData 조건을 leagueTeams만으로 완화, LeagueMatch import 제거 | tournament-tabs.tsx | PM 요청: 경기 일정은 "일정" 탭에 이미 있으므로 대진표 탭은 "조편성(리그 순위)+4강 트리" 역할로 변경 |

### Phase 3: admin wizard 포맷 세부설정 UI + settings 저장 (2026-04-13)

구현한 기능: 대회 생성/수정 wizard의 "경기 설정" 섹션에 포맷별 조건부 세부설정 UI(조 수/토너먼트 진출팀/3-4위전/경기 자동생성) 추가. Tournament.settings.bracket JSON에 저장. 기존 contact_phone 등 settings 다른 키 머지 보존.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/components/tournament/bracket-settings-form.tsx | 포맷별 조건부 UI(조별리그/토너먼트/공통) + 요약 + disabled prop | 신규 |
| src/app/(web)/tournament-admin/tournaments/new/wizard/page.tsx | BracketSettingsForm 삽입 + bracketSettings state + POST body.settings.bracket | 수정 |
| src/app/(web)/tournament-admin/tournaments/[id]/wizard/page.tsx | 동일 컴포넌트 삽입 + 로드 시 settings.bracket 복원 + rawSettings 머지 + status in_progress/completed 시 disabled | 수정 |
| src/app/api/web/tournaments/route.ts (POST) | body.settings 받아 createTournament에 전달 | 수정 |
| src/lib/services/tournament.ts | CreateTournamentInput.settings 추가 + Prisma.InputJsonValue 캐스팅하여 저장 | 수정 |

저장 스키마:
```ts
settings: {
  contact_phone?: string;
  bracket?: {
    knockoutSize: number;        // 토너먼트 진출팀 수 (2~64, 비제곱 허용)
    bronzeMatch: boolean;        // 3/4위전 여부
    groupCount: number;          // 조 수 (조별리그 전용)
    advancePerGroup: number;     // 조별 진출 수 (1~3)
    autoGenerateMatches: boolean;// 경기 자동생성 활성화
  }
}
```

tester 참고:
- 테스트 URL (생성): /tournament-admin/tournaments/new/wizard
- 테스트 URL (수정): /tournament-admin/tournaments/{id}/wizard
- 정상 동작:
  - 대회 방식 select를 바꾸면 아래 세부설정 섹션이 즉시 변한다
    - "토너먼트" / "듀얼토너먼트": knockoutSize + 3/4위전 + 자동생성
    - "조별리그+토너먼트": 조 수 + 조별 팀 수(자동) + 조별 진출 수 + knockoutSize + 3/4위전 + 자동생성
    - "풀리그+토너먼트": knockoutSize + 3/4위전 + 자동생성
  - 요약 카드에 "풀리그 8팀 → 4강 토너먼트 + 3/4위전" 같은 문장이 표시
  - 생성 후 수정 wizard 재진입 시 저장된 값이 복원됨
  - 수정 wizard에서 status가 "진행중"/"종료"이면 모든 입력이 disabled + 안내 문구 노출
- 주의할 입력:
  - knockoutSize 0/음수 (min=2로 막혀 있음, 서버 추가 검증은 향후)
  - 조 수 0 (min=1)
  - 조 수 × 조별 팀 수가 참가팀 수와 맞지 않을 때 → 요약 카드에 자동 계산값만 표시 (오류 X)
  - contact_phone을 입력한 뒤 bracket을 바꿔 저장 → 전화번호 유지되는지 확인

reviewer 참고:
- API PATCH는 기존 DB settings와 머지(이미 있던 로직). edit wizard도 클라이언트에서 rawSettings 보존하여 이중 안전장치
- POST는 createTournament에 settings 그대로 전달. Prisma Json 타입 호환을 위해 JSON.parse(JSON.stringify(...)) round-trip 후 Prisma.InputJsonValue 캐스팅
- BracketSettingsForm은 순수 presentational — 상위의 onChange로 한 필드씩 업데이트
- format 변경 시 useEffect로 bracketSettings.format 동기화 (조건부 렌더링 즉시 반영)
- Zod updateTournamentSchema.settings는 이미 z.record(z.string(), z.unknown()).optional() → 통과

### Phase 4a: 풀리그 경기 자동 생성 (2026-04-13)

구현한 기능: 대회 format 이 풀리그 계열(round_robin / full_league / full_league_knockout)일 때 admin bracket 페이지의 생성 버튼이 `N*(N-1)/2` 개의 라운드 로빈 경기를 createMany 로 일괄 생성. 기존 single_elimination 로직은 완전 보존.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/lib/tournaments/league-generator.ts | `generateRoundRobinMatches(id, {clear})` + `deleteAllLeagueMatches` + `isLeagueFormat` 유틸. advisory lock + createMany + matches_count 캐시 업데이트 + TEAMS_INSUFFICIENT/ALREADY_EXISTS 에러코드 | 신규 |
| src/app/api/web/tournaments/[id]/bracket/route.ts | POST 핸들러에 format 분기 추가(풀리그면 generateRoundRobinMatches 호출 후 조기 반환, 아니면 기존 single_elimination 트랜잭션). GET 응답에 `format` 필드 추가. matches orderBy 에 `match_number` 추가 | 수정 |
| src/app/(web)/tournament-admin/tournaments/[id]/bracket/page.tsx | `isLeagueFormat` 로컬 헬퍼 + 페이지 타이틀/버튼 라벨/빈 상태 문구 분기. 풀리그는 "1라운드 팀 배치 편집" 섹션 숨김. 예상 경기 수(n*(n-1)/2) 안내 | 수정 |

설계 결정:
- 기존 `bracket-generator.ts` 와 별도 파일로 분리 (single_elimination 로직과 서로 간섭 없도록)
- createMany 1회 호출로 성능 확보 (8팀 28경기, 32팀이면 496경기)
- bracket_version 기록은 single_elimination 과 동일하게 호출 → 버전 관리/승인 흐름 일관성 유지
- 시드 순서대로 (i,j) i<j 조합 → 시드 앞선 팀이 homeTeam 으로 고정 (시각적 일관성)
- `clear=true` 로 재생성 지원 (기존 bracket API 와 동일 패턴)

tester 참고:
- 테스트 URL: /tournament-admin/tournaments/{id}/bracket
- 사전 조건: 해당 대회의 format 이 round_robin / full_league / full_league_knockout 중 하나 + 승인된 팀 2팀 이상
- 정상 동작:
  - 버튼 라벨: "경기 자동 생성" (풀리그 포맷일 때)
  - 8팀이면 28경기, 4팀이면 6경기 생성
  - 생성된 경기는 status=scheduled, homeScore=0, awayScore=0, scheduledAt=null, round_number=null, bracket_position=null
  - 빈 상태 카드에 "생성 시 N경기가 만들어집니다" 안내
  - 재생성 버튼은 clear=true 로 요청 → 기존 경기 삭제 후 재생성
- 에러 케이스:
  - 승인팀 1팀 이하 → "2팀 이상 승인되어야 풀리그 경기를 생성할 수 있습니다" (400)
  - 이미 경기 존재 + clear=false → "이미 경기가 존재합니다" (409)
  - 무료 생성 횟수 초과 (3회) → 기존 버전 승인 플로우 작동 (403)
- 회귀 확인: single_elimination 대회에서 기존 "대진표 생성" 버튼이 이전과 동일하게 트리 생성하는지 (기존 로직 미변경)
- 수동 경기 입력: 기존 /tournament-admin/tournaments/{id}/matches 페이지에서 CRUD 가능 (별도 추가 없음)

reviewer 참고:
- advisory lock: `pg_advisory_xact_lock(hashtext(id)::bigint)` 로 동일 대회 동시 생성 race 방지 (기존 bracket/route.ts 패턴 그대로)
- 에러코드 패턴은 single_elimination 과 동일: TEAMS_INSUFFICIENT / ALREADY_EXISTS 를 Object.assign 으로 붙여서 catch 에서 분기
- 트랜잭션 timeout 30초 (32팀 496경기도 여유)
- BigInt 필드(homeTeamId/awayTeamId)는 Prisma 가 teams[i].id 를 그대로 받음 (createMany 타입도 Prisma.TournamentMatchCreateManyInput 사용)

#### 회귀 영향 범위
- 영향 없음: src/lib/tournaments/bracket-generator.ts, bracket-builder.ts, match-transitions.ts, update-standings.ts
- 수정 영향: bracket GET 응답에 `format` 필드 추가 → 클라이언트는 optional 로 받으므로 기존 호출부 무영향

### Phase 2A: 리그 종료 시 토너먼트 자동 생성 (2026-04-13)

구현한 기능: full_league_knockout 대회의 리그 경기가 모두 완료되면 settings.bracket.knockoutSize/bronzeMatch 설정에 따라 토너먼트 경기를 자동 생성. 2의 제곱이 아닌 knockoutSize(6,12 등)에 대해 부전승(BYE) 처리 포함. 순위는 승률→득실차→다득점 기준. admin 수동 트리거 API도 함께 제공.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/lib/tournaments/tournament-seeding.ts | calculateLeagueRanking / buildKnockoutBracket(BYE 처리) / generateKnockoutMatches / isLeagueComplete 4개 함수 | 신규 |
| src/app/api/web/tournaments/[id]/matches/[matchId]/route.ts | updateTeamStandings 직후 full_league_knockout + isLeagueComplete + 중복없음일 때 동적 import로 generateKnockoutMatches 호출. 실패해도 사용자 응답은 성공 보존 | 수정 |
| src/app/api/web/tournaments/[id]/bracket/knockout/route.ts | POST 수동 트리거 — requireTournamentAdmin + format 검증 + settings.bracket 읽어 generateKnockoutMatches 호출 | 신규 |

설계 결정:
- **순위 계산**: 리그 경기(round_number=null)만 집계 / 득실점은 live+completed 모두 / 승패는 completed만. 동점은 연장으로 해결되므로 무시
- **BYE 알고리즘**: bracketSize = 다음 2의 제곱. byeCount = bracketSize-size. 표준 시드 매칭 1↔bracketSize에서 양쪽 모두 실팀인 경우만 1라운드 경기 생성. 부전승 팀은 admin이 수동 배정(2라운드 경기는 빈 슬롯으로 생성)
- **라운드 이름**: 결승/준결승/8강/16강/32강 자동 명명 (2^(totalRounds-roundNumber+1) 기준)
- **3/4위전**: bronzeMatch=true 시 결승과 동일 라운드에 bracket_position=99 로 생성(결승과 구분)
- **match_number**: 리그 경기 최댓값+1 부터 이어 번호 부여
- **중복 방지**: generateKnockoutMatches 진입 시 round_number != null 경기 존재 여부 확인 후 throw. 자동 훅에서도 별도 카운트 체크(이중 안전)
- **동적 import**: 자동 훅은 경기 완료의 엣지 케이스이므로 `await import()`로 번들 분리

tester 참고:
- 테스트 URL: /tournament-admin/tournaments/{id}/bracket (bracket 페이지에 수동 트리거 버튼은 admin UI 미존재 — API 직접 호출로 테스트)
- 시나리오 1 (자동): full_league_knockout 대회에서 마지막 리그 경기를 PATCH로 completed 변경 → tournament_matches에 round_number != null 경기 생성 확인
- 시나리오 2 (수동): POST /api/web/tournaments/{id}/bracket/knockout → {"generated": N} 응답
- 시나리오 3 (knockoutSize=4): 4강→결승 총 3경기(3/4위전 옵션 시 4경기). 1-4위 배치 확인
- 시나리오 4 (knockoutSize=6): 1,2위 부전승 / 3-6, 4-5 1라운드 2경기 + 2라운드 빈 슬롯 2개 + 결승 빈 슬롯 1개. 부전승 팀은 admin이 수동 배정 필요
- 시나리오 5 (knockoutSize=8): 1-8, 2-7, 3-6, 4-5 1라운드 4경기 + 2라운드 2경기 + 결승 1경기
- 에러 케이스:
  - 이미 토너먼트 경기 있음 → 400 "이미 N건의 토너먼트 경기가 존재합니다"
  - 팀 < 2 → 400 "토너먼트 생성에 필요한 팀이 부족합니다"
  - format이 full_league_knockout 아님 → 400 (수동 API만)
  - 비 admin 접근 → 401/403 (requireTournamentAdmin)
- 회귀 확인:
  - single_elimination 대회 경기 완료 시 기존 동작(updateTeamStandings만)에 영향 없는지
  - round_robin / full_league 포맷(full_league_knockout 아닌 리그 포맷)은 자동 생성 트리거 안 함 확인

reviewer 참고:
- 자동 훅 실패해도 경기 상태 변경 응답은 200 유지 (try-catch로 감쌈, console.error만)
- settings 타입은 `Record<string, unknown>` 캐스팅 후 키별 `as number | undefined` 추출 (Prisma Json 안전 파싱 패턴)
- calculateLeagueRanking의 stats record는 BigInt.toString() 키로 운영 (Record<string, ...>)
- createMany 1회 호출로 모든 라운드 경기 일괄 생성 (트랜잭션 불필요 — 단일 쿼리)
- 동적 import는 Next.js App Router에서 번들 분리에 유효. 훅 성능 영향 최소

#### 회귀 영향 범위
- 영향 없음: src/lib/tournaments/update-standings.ts, bracket-generator.ts, league-generator.ts
- 수정 영향: matches PATCH 핸들러에 훅 1블록 추가. status=completed 경로에만 동작 → 다른 PATCH 시나리오에 영향 없음

### Phase 2B: 토너먼트 카드 시드 뱃지 표시 (2026-04-13)

구현한 기능: 토너먼트 대진 카드(준결승/결승 등)에 "#1", "#4" 시드 번호 뱃지를 팀명 앞에 표시. 리그 순위(1위=#1)를 시드로 사용. 기존 MatchCard 크기/레이아웃 영향 없이 inline 뱃지만 추가.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/lib/tournaments/tournament-seeding.ts | generateKnockoutMatches에서 ranking 계산 직후 TournamentTeam.seedNumber를 rank로 업데이트 | 수정 |
| src/lib/tournaments/bracket-builder.ts | TeamSlot/DbMatch 타입에 seedNumber 필드 추가 + toTeamSlot에서 전파 | 수정 |
| src/app/api/web/tournaments/[id]/public-bracket/route.ts | homeTeam/awayTeam include를 select로 전환 + seedNumber 명시 포함 | 수정 |
| src/app/(web)/tournaments/[id]/bracket/_components/match-card.tsx | TeamRow(데스크톱)와 MobileMatchCard 홈/어웨이팀 렌더링부에 #N 뱃지 추가 | 수정 |

시드 뱃지 UX:
- 데스크톱(TeamRow): text-[9px], rounded, px-1, flex-shrink-0 — 팀명 truncate 우선
- 모바일(MobileMatchCard): text-[11px], rounded, px-1.5 py-0.5 — 공간 여유 있음
- 색상: bg=var(--color-surface), text=var(--color-text-muted) — 팀명 대비 시각 위계 낮춤
- null safety: team.seedNumber != null 조건부 렌더링 (시드 미배정 팀 호환)

tester 참고:
- 테스트 URL: /tournaments/d83e8b83-66d3-4f2f-ac41-3b594dbc38f6 → 대진표 탭
- 정상 동작: 4강 생성된 토너먼트에서 각 매치카드 팀명 앞에 "#1" "#4" 뱃지 표시
- 단, 열혈농구단은 이미 4강이 생성되어 있어서 기존 TournamentTeam.seedNumber가 null일 수 있음 → 재생성하지 않으면 뱃지 안 나옴 (정상 동작)
- 신규 대회에서 generate-knockout API 호출 시 seedNumber 자동 저장 확인
- 시드 없는 팀(리그 미참여 또는 seedNumber=null): 뱃지 없이 팀명만 표시 → 정상
- 모바일 라운드탭에서도 뱃지 표시 확인

reviewer 참고:
- bracket-builder.ts DbMatch 타입 확장: include: { team: ... } 쿼리(bracket/page.tsx:40)와 호환 — Prisma include는 모든 스칼라(seedNumber 포함) 자동 조회
- public-bracket route의 matches 변수는 leagueMatches 섹션에서도 재사용: m.homeTeam?.teamId, m.homeTeam?.team?.name은 select 전환 후에도 그대로 접근 가능
- seedNumber는 TournamentTeam DB에 원래 있던 필드(schema.prisma:355) — DB 마이그레이션 불필요
- tsc --noEmit 통과 확인

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-13 | developer | Phase 2B 토너먼트 카드 시드 뱃지 표시 (seeding seedNumber 저장 + bracket-builder 타입확장 + public-bracket select + match-card UI, 4파일, tsc 통과) | 완료 |
| 04-13 | developer | Phase 2A 리그 종료 시 토너먼트 자동 생성 (tournament-seeding + matches 훅 + 수동 API, 3파일, tsc 통과) | 완료 |
| 04-13 | developer | Phase 4a 풀리그 경기 자동 생성 (league-generator + bracket API 분기 + admin UI 분기, 3파일, tsc 통과) | 완료 |
| 04-13 | developer | Phase 3 wizard 포맷 세부설정 UI + settings.bracket 저장 (5파일, tsc 통과) | 완료 |
| 04-13 | planner-architect | 대진표 Phase 2-4 구체 계획 (리그→4강 자동 + wizard 세부설정 + 조편성) | 기획완료 |
| 04-13 | developer | 팀 전적 tournament_matches 집계 + draws 제거 (2파일) | 완료 |
| 04-13 | developer | 팀명/선수명 Link 추가 (9파일, API 3곳 + UI 6곳) | 완료 |
| 04-13 | developer | 대회 선수 userId 자동 연결 구현 (시나리오 A+D, 3파일) | 완료 |
| 04-13 | planner-architect | 대회 기록 자동 연결 시스템 계획 수립 (4시나리오 분석+5파일 설계) | 기획완료 |
| 04-13 | developer | 대회 상세 UI 전면 리디자인 (히어로+탭+대시보드+일정카드+순위표 등 15건) | 완료 |
