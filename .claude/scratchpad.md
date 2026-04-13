# 작업 스크래치패드

## 현재 작업
- **요청**: 대회 기록 자동 연결 시스템 계획 수립
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

### 대회 기록 자동 연결 시스템 (2026-04-13)

목표: TournamentTeamPlayer.userId가 NULL인 선수를 자동으로 실제 유저와 연결하여 프로필에서 대회 기록이 보이게 하기

---

#### 1. 현재 선수 등록 흐름 분석

**경로 A: 웹 참가신청 (userId가 설정됨 -- 문제 없음)**
- 파일: /api/web/tournaments/[id]/join/route.ts (297행)
- 흐름: 팀 주장이 팀 멤버 중 선수를 선택 -> TeamMember.userId를 그대로 TournamentTeamPlayer.userId에 넣음
- 결과: userId가 항상 설정됨 (BigInt(p.userId))

**경로 B: Flutter 앱 현장 등록 (userId가 항상 NULL -- 문제의 원인)**
- 파일: /api/v1/tournaments/[id]/teams/[teamId]/players/route.ts (110~124행)
- 흐름: 기록원이 현장에서 선수 이름+등번호만 입력 -> userId: null, auto_registered: true
- 결과: userId가 항상 null. player_name만 있음

**경로 C: admin 팀 직접 등록 (선수 등록 없음)**
- 파일: /api/web/tournaments/[id]/teams/route.ts POST
- 흐름: admin이 팀만 등록 (TournamentTeam 생성). 선수(TournamentTeamPlayer) 미생성
- 결과: 선수 등록은 별도로 Flutter 앱에서 해야 함 -> 경로 B와 동일 문제

---

#### 2. 유저 프로필에서 대회 기록 조회 방식

**내 프로필**: src/lib/services/user.ts getProfile()
- tournamentTeamPlayer.findMany({ where: { userId } }) -> userId 기준 조회
- userId가 NULL이면 아무것도 안 나옴

**타인 프로필**: src/app/(web)/users/[id]/page.tsx
- matchPlayerStat.aggregate({ where: { tournamentTeamPlayer: { userId: BigInt(id) } } })
- 역시 userId 기준. NULL이면 스탯 0으로 표시됨

**랭킹**: /api/web/rankings/route.ts
- tournamentTeamPlayer를 userId 기준 groupBy -> userId NULL은 필터링됨

결론: userId가 NULL인 TournamentTeamPlayer의 모든 대회 기록(스탯, 승률, 랭킹)이 해당 유저에게 귀속되지 않음

---

#### 3. 기존 유사 시스템 분석

**merge-temp-member.ts**: 팀 가입 시 "사전 등록 계정"(닉네임 동일+미로그인 유저) 병합
- TeamMember 레벨에서만 동작. TournamentTeamPlayer와는 무관
- 패턴 참고 가능: 이름 매칭 + 트랜잭션 병합

**auto_registered 필드**: boolean, 현장 등록 여부 표시용. 자동 연결 로직은 없음

---

#### 4. 시나리오별 해결 방안

**시나리오 A: 현장 등록 시 자동 매칭 (가장 효과 큼)**
- 시점: Flutter 앱에서 선수 등록할 때 (POST /v1/tournaments/[id]/teams/[teamId]/players)
- 방법: player_name으로 같은 팀(TournamentTeam.teamId -> Team -> TeamMember)에서 이름 매칭
- 로직:
  1. TournamentTeam에서 teamId 조회
  2. TeamMember에서 teamId + (user.nickname = player_name OR user.name = player_name) 검색
  3. 정확히 1명 매칭되면 userId 자동 설정
  4. 0명 또는 2명 이상이면 userId = null 유지 (안전)
- 장점: 가장 자연스러운 시점. 대부분의 케이스를 커버
- 주의: unique 제약 (tournamentTeamId, userId) 위반 방지 -- 이미 같은 유저가 등록되어 있으면 skip

**시나리오 B: 회원가입/팀 가입 시 과거 기록 연결**
- 시점: 유저가 팀에 가입할 때 (POST /api/web/teams/[id]/join)
- 방법: 가입한 팀이 참가했던 모든 대회에서 userId NULL + player_name 매칭
- 로직:
  1. TeamMember 생성 후
  2. TournamentTeam에서 해당 teamId의 모든 대회 참가 기록 조회
  3. 각 TournamentTeamPlayer 중 userId NULL + player_name 매칭 -> userId 업데이트
- 장점: 나중에 가입한 유저도 과거 기록 연결
- 주의: merge-temp-member.ts와 동일 위치에서 실행하면 좋음

**시나리오 C: admin 수동 연결 (관리 도구)**
- 시점: tournament-admin에서 선수 목록 볼 때
- 방법: userId NULL인 선수 옆에 "유저 검색/연결" 버튼 제공
- 로직: 선수 이름으로 User 검색 -> 선택 -> PATCH로 userId 업데이트
- 구현: teams/[teamId]/players API에 PATCH 추가
- 장점: 이름이 다르거나 자동 매칭 실패한 경우 수동 해결

**시나리오 D: 배치 자동 연결 (일괄 정리)**
- 시점: 수동 실행 또는 cron
- 방법: userId NULL인 모든 TournamentTeamPlayer를 스캔, 팀 멤버와 이름 매칭
- 로직: 시나리오 A와 동일하나 전체 대상
- 장점: 기존 NULL 데이터 한번에 정리
- 구현: admin API 또는 스크립트

---

#### 5. 만들 위치와 구조

| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| src/lib/tournaments/link-player-user.ts | 이름 매칭 + userId 연결 핵심 로직 | 신규 |
| src/app/api/v1/tournaments/[id]/teams/[teamId]/players/route.ts | 현장 등록 시 자동 매칭 호출 (시나리오 A) | 수정 |
| src/app/api/web/teams/[id]/join/route.ts (또는 관련 action) | 팀 가입 시 과거 기록 연결 (시나리오 B) | 수정 |
| src/app/api/web/tournaments/[id]/teams/[teamId]/players/route.ts | admin 선수 userId 수동 연결 PATCH + 배치 연결 POST (시나리오 C+D) | 신규 |

기존 코드 연결:
- link-player-user.ts는 merge-temp-member.ts와 유사한 패턴 (이름 매칭 + 안전 체크)
- v1 players API의 handlePost 함수 내부에서 create 후 link 시도
- teams join API/action에서 TeamMember 생성 후 link 시도
- 프로필/랭킹 쿼리는 수정 불필요 (userId가 채워지면 자동으로 표시됨)

---

#### 6. 실행 계획

| 순서 | 작업 | 담당 | 선행 조건 | 예상 시간 |
|------|------|------|----------|----------|
| 1 | link-player-user.ts 신규: 이름 매칭 + userId 연결 함수 | developer | 없음 | 15분 |
| 2 | v1 players API 수정: 현장 등록 시 자동 매칭 (시나리오 A) | developer | 1 | 10분 |
| 3 | teams join 수정: 팀 가입 시 과거 기록 연결 (시나리오 B) | developer | 1 | 10분 |
| 4 | admin players API 신규: 수동 연결 + 배치 연결 (시나리오 C+D) | developer | 1 | 15분 |
| 5 | tester 검증 | tester | 2,3,4 | 10분 |

우선순위: 시나리오 A(현장등록) > D(배치정리) > B(팀가입) > C(admin UI)

---

#### 7. developer 주의사항

- DB 스키마 변경 없음 -- TournamentTeamPlayer.userId는 이미 nullable BigInt
- unique 제약 @@unique([tournamentTeamId, userId]) 주의 -- 같은 대회팀에 같은 유저 중복 등록 방지
- 이름 매칭은 정확 일치만 (유사 매칭은 오매칭 위험). nickname OR name 둘 다 체크
- 매칭 후보가 2명 이상이면 연결하지 않음 (안전)
- Flutter API(v1)는 응답 형식 변경 금지 -- userId 필드만 null에서 값으로 바뀌는 것은 하위 호환
- link 실패가 선수 등록 자체를 실패시키면 안 됨 (try-catch로 감싸기)

## 구현 기록 (developer)

### 대회 선수 userId 자동 연결 시스템 (2026-04-13)

구현한 기능: 현장 등록 시 자동 매칭 (시나리오 A) + 배치 일괄 연결 API (시나리오 D)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/lib/tournaments/link-player-user.ts | 이름 매칭 핵심 유틸 (linkPlayersToUsers, findUserIdByName) | 신규 |
| src/app/api/v1/tournaments/[id]/teams/[teamId]/players/route.ts | 현장 등록 시 findUserIdByName 호출하여 userId 자동 설정 | 수정 |
| src/app/api/web/tournaments/[id]/link-players/route.ts | 배치 연결 API (POST, 대회 관리자 권한) | 신규 |

tester 참고:
- 테스트 방법: v1 players POST에서 기존 팀 멤버 이름으로 선수 등록 시 userId 자동 연결 확인
- 정상 동작: 팀 멤버 닉네임/이름 일치 시 userId 설정, 불일치 시 null (기존 동작)
- 주의: unique 제약 (tournamentTeamId, userId) -- 같은 유저 중복 등록 시 null 유지
- 배치 API: POST /api/web/tournaments/[id]/link-players (대회 관리자 쿠키 인증)

reviewer 참고:
- 매칭 후보 2명 이상이면 안전하게 null 반환 (동명이인 방지)
- findUserIdByName에서 unique 제약 위반 사전 체크
- v1 API 응답 형식 유지 (user_id 필드가 null -> 값으로 바뀌는 것은 하위 호환)

### 팀명/선수명 Link 추가 (2026-04-13)

구현한 기능: 대회 상세 페이지 12곳에 팀/선수 프로필 페이지 Link 추가 (schedule-timeline은 카드 전체가 Link라 건너뜀)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/api/web/tournaments/[id]/public-standings/route.ts | teamId 필드 추가 | 수정 |
| src/app/api/web/tournaments/[id]/public-teams/route.ts | teamId + players.userId 필드 추가 | 수정 |
| src/app/api/web/tournaments/[id]/public-bracket/route.ts | groupTeams에 teamId 필드 추가 | 수정 |
| src/app/(web)/tournaments/[id]/_components/tournament-tabs.tsx | 순위표 팀명 + 참가팀 팀명/선수명에 Link 추가 | 수정 |
| src/app/(web)/tournaments/[id]/bracket/_components/group-standings.tsx | 조별리그 팀명에 Link 추가 | 수정 |
| src/app/(web)/tournaments/[id]/bracket/_components/match-card.tsx | MatchCard + MobileMatchCard 팀명에 Link 추가 | 수정 |
| src/app/(web)/tournaments/[id]/bracket/page.tsx | groupTeams에 teamId 필드 추가 | 수정 |
| src/app/(web)/tournaments/[id]/standings/page.tsx | 서버 컴포넌트 팀명에 Link 추가 | 수정 |
| src/app/(web)/tournaments/[id]/teams/page.tsx | 서버 컴포넌트 팀명/선수명에 Link 추가 | 수정 |

tester 참고:
- 테스트 방법: 대회 상세 페이지에서 팀명 클릭 시 /teams/{teamId}로 이동, 선수명 클릭 시 /users/{userId}로 이동 확인
- 정상 동작: 팀명 hover시 underline 표시, 클릭 시 해당 페이지로 이동
- 주의: userId가 null인 선수는 Link 없이 텍스트만 표시됨 (정상)
- schedule-timeline은 경기 카드 전체가 Link로 감싸져 있어 건너뜀 (중첩 Link 방지)

### 팀 전적 tournament_matches 집계 + draws 제거 (2026-04-13)

구현한 기능: 팀 상세 페이지에서 Team.wins/losses 대신 tournament_matches 스코어에서 실제 승/패 집계, draws(무승부) 관련 로직 전부 제거

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/teams/[id]/page.tsx | TournamentTeam + TournamentMatch에서 승/패 집계, draws 제거 | 수정 |
| src/app/(web)/teams/[id]/_tabs/overview-tab.tsx | OverviewTabProps에서 draws 제거, 전적 텍스트/계산에서 draws 제거 | 수정 |

tester 참고:
- 테스트 방법: 대회 경기 기록이 있는 팀 상세 페이지에서 전적이 표시되는지 확인
- 정상 동작: tournament_matches에서 completed/live 경기의 스코어 비교로 승/패 표시
- 주의: Team.wins/losses가 아닌 실제 경기 결과 기반이므로, 대회 경기가 없는 팀은 0승 0패로 표시

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
| 04-12 | pm | 새 PC 세팅 + 작업 인수인계 | 완료 |
