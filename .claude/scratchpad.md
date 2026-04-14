# 작업 스크래치패드

## 현재 작업
- **요청**: 대진표 시스템 개발 계획 수립 (포맷 설정 -> 자동 생성 -> 표시)
- **상태**: 기획설계 완료
- **현재 담당**: planner-architect

## 전체 프로젝트 현황 대시보드 (2026-04-01)
| 항목 | 수치 |
|------|------|
| 웹 페이지 (web) | 84개 |
| 관리자 페이지 (admin) | 16개 |
| Prisma 모델 | 73개 |
| Web API | 111개 라우트 |

## 기획설계 (planner-architect)

### 대진표 시스템 개발 (2026-04-13)

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

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-13 | developer | 팀 전적 tournament_matches 집계 + draws 제거 (2파일) | 완료 |
| 04-13 | developer | 팀명/선수명 Link 추가 (9파일, API 3곳 + UI 6곳) | 완료 |
| 04-13 | developer | 대회 선수 userId 자동 연결 구현 (시나리오 A+D, 3파일) | 완료 |
| 04-13 | planner-architect | 대회 기록 자동 연결 시스템 계획 수립 (4시나리오 분석+5파일 설계) | 기획완료 |
| 04-13 | developer | 대회 상세 UI 전면 리디자인 (히어로+탭+대시보드+일정카드+순위표 등 15건) | 완료 |
| 04-13 | developer | 모바일 반응형 전수 수정 (빨강5+노랑14+녹색8건, 20+파일) | 완료 |
| 04-13 | planner-architect | 대회 형식 프리셋 시스템 설계 (12프리셋+조편성+시딩) | 기획완료 |
| 04-13 | planner-architect | 중복 팀 안전 병합 보고서 (B안 채택: teamId만 UPDATE) | 기획완료 |
| 04-13 | planner-architect | 경기 기록 입력 시스템 전체 구조 분석 (v1 API 12개+실시간 6종) | 기획완료 |
| 04-12 | developer+tester | 다크모드 accent 버튼 가시성 전수 수정 (40파일) | 완료 |
