# 작업 스크래치패드

## 현재 작업
- **요청**: 대회 형식 프리셋 시스템 + 토너먼트 자동 구성 + 미달 팀 대응 로직 설계
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

### 대회 형식 프리셋 시스템 + 자동 구성 설계 (2026-04-13)

목표: 참가팀 수+조 수 입력만으로 조편성~토너먼트 트리까지 자동 생성하는 프리셋 시스템 설계

---

#### 1. 현재 시스템 분석

DB에 이미 있는 필드 (스키마 변경 없이 활용 가능):
- Tournament: format(VarChar), maxTeams(Int), min_teams(Int), settings(Json={})
- TournamentTeam: groupName(VarChar), seedNumber(Int), group_order(Int)
- TournamentMatch: group_name(VarChar), round_number(Int), bracket_position(Int), next_match_id, next_match_slot

현재 한계:
- bracket 생성 API(POST /api/web/tournaments/[id]/bracket)가 single_elimination만 지원
- format이 group_stage_knockout이어도 조별리그 경기 자동 생성 불가
- 조편성(groupName 배정)이 수동 — admin teams 페이지에서 직접 입력해야 함
- settings Json이 비어있음 — 조별 진출 수/와일드카드 등 저장할 곳은 있으나 미사용

---

#### 2. 프리셋 시스템 설계

##### 2-1. settings Json 구조 (Tournament.settings에 저장)

```typescript
// Tournament.settings에 저장될 대회 구성 설정
type TournamentSettings = {
  preset?: {                    // 프리셋 설정 (null이면 커스텀)
    totalTeams: number;         // 총 참가팀 수
    groupCount: number;         // 조 수
    teamsPerGroup: number;      // 조당 팀 수
    advancingPerGroup: number;  // 조별 진출 수 (각 조 N위까지)
    wildcards: number;          // 와일드카드 수 (조별 진출 외 추가)
    knockoutSize: number;       // 토너먼트 진출팀 수 (= groupCount * advancingPerGroup + wildcards)
    thirdPlaceMatch: boolean;   // 3/4위전 여부
  };
  groupDraw?: {                 // 조편성 결과 (자동 생성 후 저장)
    method: "random" | "seeded" | "manual";
    groups: Record<string, bigint[]>;  // { "A": [teamId1, teamId2], "B": [...] }
    drawnAt: string;            // ISO datetime
  };
};
```

##### 2-2. 프리셋 목록 (프론트에서 선택지로 제공)

| 총팀 | 조x팀 | 조별진출 | 와일드카드 | 토너먼트 | 3/4위전 | 비고 |
|------|--------|----------|-----------|----------|---------|------|
| 4 | - | - | - | 4강 | Y | 조별리그 없이 바로 토너먼트 |
| 6 | 2x3 | 2위까지 | 0 | 4강 | Y | |
| 8 | 2x4 | 2위까지 | 0 | 4강 | Y | 가장 흔한 형태 |
| 8 | 4x2 | 1위만 | 0 | 4강 | Y | 빠른 진행용 |
| 10 | 2x5 | 2위까지 | 0 | 4강 | Y | |
| 12 | 4x3 | 1위만 | 0 | 4강 | Y | |
| 12 | 4x3 | 2위까지 | 0 | 8강 | Y | 더 많은 경기 원할 때 |
| 16 | 4x4 | 2위까지 | 0 | 8강 | Y | 대형 대회 기본 |
| 20 | 4x5 | 2위까지 | 0 | 8강 | Y | |
| 24 | 4x6 | 2위까지 | 0 | 8강 | Y | |
| 24 | 8x3 | 1위만 | 0 | 8강 | Y | |
| 32 | 8x4 | 2위까지 | 0 | 16강 | N | |

커스텀도 가능: 관리자가 조 수/조당 팀 수/진출 수를 직접 입력

##### 2-3. 프리셋 자동 추천 알고리즘

```
입력: totalTeams (실제 참가 확정 팀 수)
출력: 추천 프리셋 목록 (최대 3개)

1) totalTeams <= 4 → "바로 토너먼트" 추천 (조별리그 생략)
2) totalTeams <= 8 → 2조x(teams/2) + 4강 추천
3) totalTeams <= 16 → 4조x(teams/4) + 8강 추천
4) totalTeams <= 32 → 8조x(teams/8) + 16강 추천

나누어 떨어지지 않으면 불균등 조편성 제안:
예) 10팀 → "2조(5팀씩)" 또는 "4조(3+3+2+2)"
```

---

#### 3. 조편성 자동 로직 설계

##### 3-1. 팀 배분 알고리즘 (균등 분배 + 나머지 분산)

```
입력: teams[] (시드순 정렬), groupCount
처리:
  base = floor(teams.length / groupCount)   // 기본 팀 수
  extra = teams.length % groupCount          // 나머지 (앞쪽 조에 +1)
  
  조 A: base+1팀 (extra > 0이면)
  조 B: base+1팀 (extra > 1이면)
  ...
  나머지 조: base팀
```

##### 3-2. 시드 배정 방식 (스네이크 드래프트)

시드가 있는 경우 스네이크 방식으로 분산:
```
4조 8팀 예시:
시드 1 → A조, 시드 2 → B조, 시드 3 → C조, 시드 4 → D조
시드 5 → D조, 시드 6 → C조, 시드 7 → B조, 시드 8 → A조
(지그재그로 배치하여 조간 균형)
```

시드가 없는 경우: 랜덤 셔플 후 동일 알고리즘 적용

##### 3-3. 조별리그 경기 자동 생성

각 조 내 풀리그(라운드 로빈):
```
N팀 조의 총 경기 수 = N*(N-1)/2
3팀 → 3경기, 4팀 → 6경기, 5팀 → 10경기, 6팀 → 15경기

TournamentMatch 생성 시:
- group_name = "A", "B", ...
- round_number = null (조별리그는 토너먼트 라운드가 아님)
- bracket_position = null
- match_number = 조 내 경기 순번
```

---

#### 4. 토너먼트 트리 자동 생성 로직

##### 4-1. 진출팀 → 라운드 수 계산

```
knockoutSize = groupCount * advancingPerGroup + wildcards
totalRounds = ceil(log2(knockoutSize))
slots = nextPow2(knockoutSize)  // 2의 거듭제곱으로 올림
byes = slots - knockoutSize      // 부전승 수
```

##### 4-2. 대진표 시딩 (교차 배치)

조 1위 vs 다른 조 2위가 만나도록 교차 배치:
```
8강 (4조 1~2위 진출) 예시:
A1 vs B2 | C1 vs D2 | B1 vs A2 | D1 vs C2

원칙:
- 같은 조 팀은 결승 전까지 만나지 않도록 배치
- 1위 팀은 반대쪽 브라켓의 2위 팀과 매칭
```

##### 4-3. 부전승(BYE) 처리

```
knockoutSize가 2의 거듭제곱이 아닐 때:
예) 6팀 진출 → 8강 토너먼트, 2팀 BYE
BYE는 상위 시드(조 1위)에 우선 배정

시드 순서: 각 조 1위 먼저 배정 → 나머지 진출팀
```

##### 4-4. 3/4위전

```
준결승 패자 2팀이 3/4위전 진행
TournamentMatch 생성 시:
- roundName = "3/4위전"
- round_number = totalRounds (결승과 같은 라운드)
- bracket_position = 별도 번호
```

---

#### 5. 참가팀 미달 대응 로직

##### 5-1. 자동 재배분

```
프리셋: 16팀(4조x4팀) → 실제 14팀 참가 시:
방법 1 (추천): 조 수 유지 + 불균등 분배
  → A(4팀), B(4팀), C(3팀), D(3팀) = 14팀
  
방법 2: 프리셋 변경 제안
  → "14팀이면 2조x7팀 + 4강은 어떠세요?" 제안

극단적 미달 (4팀 이하):
  → 조별리그 생략, 바로 토너먼트 제안
```

##### 5-2. 관리자 수동 오버라이드

- 시스템이 자동 제안 → 관리자가 확인/수정 → 확정
- 확정 후에도 팀 추가/제거 시 재배분 가능 (대진표 미생성 상태에서만)

##### 5-3. 경기 수 불균형 보정

불균등 조에서 팀당 경기 수가 다를 수 있음:
- 3팀 조: 팀당 2경기, 4팀 조: 팀당 3경기
- 순위 결정 시 승률(승수/경기수) 기준으로 비교 (이미 구현됨)

---

#### 6. DB 스키마 설계

**스키마 변경 불필요** — 기존 필드로 모두 커버 가능:

| 기존 필드 | 용도 | 비고 |
|----------|------|------|
| Tournament.settings (Json) | 프리셋 설정 전체 저장 | 현재 {} — 여기에 preset/groupDraw 저장 |
| Tournament.format (VarChar) | 대회 형식 | group_stage_knockout/single_elimination 등 |
| Tournament.maxTeams (Int) | 총 참가팀 수 | 프리셋의 totalTeams와 연동 |
| TournamentTeam.groupName (VarChar) | 조 이름 | "A", "B", ... |
| TournamentTeam.seedNumber (Int) | 시드 번호 | 조편성 시 사용 |
| TournamentTeam.group_order (Int) | 조 내 순서 | 스네이크 드래프트 순서 |
| TournamentMatch.group_name (VarChar) | 경기의 조 구분 | 조별리그 경기에 사용 |
| TournamentMatch.round_number (Int) | 라운드 번호 | 조별=null, 토너먼트=1,2,3... |

---

#### 7. 만들 위치와 구조

| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| src/lib/tournaments/preset.ts | 프리셋 목록 + 추천 알고리즘 + 팀 배분 + 경기 생성 유틸 | 신규 |
| src/lib/tournaments/group-draw.ts | 조편성 알고리즘 (스네이크 드래프트 + 랜덤) | 신규 |
| src/lib/tournaments/knockout-seeding.ts | 토너먼트 교차 시딩 + BYE 배정 | 신규 |
| src/app/api/web/tournaments/[id]/bracket/route.ts | format 분기: group_stage_knockout 시 조별+토너먼트 생성 | 수정 |
| src/app/api/web/tournaments/[id]/group-draw/route.ts | 조편성 API (POST: 자동 배정, GET: 현재 조편성) | 신규 |
| tournament-admin/.../wizard/page.tsx (new + [id]) | 프리셋 선택 UI + 조편성 UI 단계 추가 | 수정 |
| tournament-admin/.../[id]/bracket/page.tsx | format별 분기: 조별리그+토너먼트 or 토너먼트만 | 수정 |
| src/lib/tournaments/bracket-builder.ts | 조별리그 경기 그룹핑 지원 추가 | 수정 |

기존 코드 연결:
- bracket/route.ts의 POST가 현재 single_elimination만 생성 → format별 분기 추가
- bracket-builder.ts의 buildRoundGroups가 round_number 기준 → group_name 기준 추가
- tournament-admin teams 페이지의 groupName이 수동 입력 → 자동 배정 연동
- public-bracket API가 조별 경기 미반환 → groupMatches 추가 (이전 기획설계에서 계획됨)

---

#### 8. 실행 계획

| 순서 | 작업 | 담당 | 선행 조건 | 예상 시간 |
|------|------|------|----------|----------|
| 1 | preset.ts 신규: 프리셋 정의 + 추천 알고리즘 + 검증 | developer | 없음 | 15분 |
| 2 | group-draw.ts 신규: 스네이크 드래프트 + 조별리그 경기 생성 | developer | 없음 | 20분 |
| 3 | knockout-seeding.ts 신규: 교차 시딩 + BYE + 3/4위전 | developer | 없음 | 20분 |
| 4 | group-draw API 신규: POST(자동 조편성) + GET(조회) | developer | 1,2 | 15분 |
| 5 | bracket API 수정: format 분기 + 조별리그 경기 생성 연동 | developer | 2,3 | 20분 |
| 6 | wizard UI 수정: 프리셋 선택 + 조편성 단계 추가 | developer | 1,4 | 30분 |
| 7 | tester 검증 + reviewer | tester+reviewer (병렬) | 6 | 15분 |

Phase 1 (MVP): 순서 1~5 (프리셋 + 자동 조편성 + 조별리그 경기 생성 + 토너먼트 트리)
Phase 2 (UI): 순서 6 (wizard에서 프리셋 선택 + 조편성 확인/수정)
Phase 3 (확장): 와일드카드 로직 + 미달 팀 자동 재배분 제안 UI + 듀얼토너먼트/풀리그 지원

---

#### 9. developer 주의사항

- DB 스키마(prisma/schema.prisma) 변경 절대 금지 — 기존 필드만 활용
- Tournament.settings Json에 preset 객체를 저장 — 기존 {} 디폴트와 하위 호환
- 조별리그 경기는 group_name 설정 + round_number/bracket_position은 null
- 토너먼트 경기는 기존 방식 유지 (round_number/bracket_position 사용)
- 승패 집계는 tournament_teams.wins/losses 컬럼에 쓰지 말 것 (갱신 안 되는 문제 있음)
- 기존 single_elimination 생성 로직은 그대로 유지하고, format별 분기로 새 로직 추가
- FORMAT_OPTIONS 상수가 wizard에 인라인 정의됨 (new + [id] 두 곳) → 공통화 고려

## 구현 기록 (developer)

### 개요 탭 최근 경기 + 순위 섹션 삭제 (2026-04-13)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/tournaments/[id]/page.tsx | MatchesStandingsSkeleton, MatchesAndStandings 함수 삭제 + Suspense 블록 삭제 + 미사용 import(Suspense, Skeleton) 제거 | 수정 |

tester 참고:
- 테스트 방법: 대회 상세 페이지 개요 탭 확인
- 정상 동작: 대회 소개/장소/입금정보/디비전 현황은 그대로, 최근 경기+순위 미리보기만 사라짐
- tsc --noEmit 통과 확인 완료

### 일정 경기 카드 UI 리디자인 + 경기 상태 수정 (2026-04-13)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/tournaments/[id]/_components/schedule-timeline.tsx | 타임라인(시간+점/선) 제거, 시간을 카드 내부 상단으로 이동, 카드 전체 너비 확장 | 수정 |
| DB: tournament_matches id=98 | status live→completed 변경 (라이징이글스 66:52 경북소방본부) | DB수정 |

tester 참고:
- 테스트 방법: 대회 상세 > 일정 탭에서 카드 UI 확인
- 정상 동작: 시간|라운드명 코트 + 상태배지가 카드 상단에 표시, 하단에 팀/스코어
- 타임라인 점/선이 사라지고 카드가 화면 전체 너비로 표시되어야 함
- 4/11 라이징이글스 vs 경북소방본부 경기가 "종료" 배지로 표시되어야 함
- 팀 필터, 하이라이트, 날짜 헤더는 기존과 동일하게 동작

### KBL 순위 방식 적용 + 승률 표시 통일 + 공동 순위 (2026-04-13)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/api/web/tournaments/[id]/public-standings/route.ts | gamesPlayed/winRate 필드 추가 + 정렬을 KBL방식(승률→득실차→다득점)으로 변경 | 수정 |
| src/app/(web)/tournaments/[id]/_components/tournament-tabs.tsx | 공동순위 계산 + KBL 승률표시(.XXX) + 경기/득실차 컬럼 추가 | 수정 |

tester 참고:
- 테스트 방법: 경기 결과가 있는 대회의 순위 탭 확인
- 정상 동작: 승률 기준 정렬, .XXX 형식 표시, 동률 팀은 같은 순위 번호
- 테이블 컬럼: #, 팀, 경기, 승, 패, 승률, 득실차(PC만)
- 승률 표시: 전승=1.000, 일반=.667, 0경기="-"
- 득실차 컬럼은 모바일에서 숨김 (sm:table-cell)

reviewer 참고:
- winRate는 서버에서 Math.round로 소수3자리 계산 (부동소수점 안전)
- 기존 응답 필드(wins/losses/draws/pointsFor/pointsAgainst/pointDifference) 유지 (하위호환)
- 공동순위: 승률+득실차+다득점 모두 같을 때만 동일 번호

### 공동순위 로직 분기: 진행 중 vs 종료 대회 (2026-04-13)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/api/web/tournaments/[id]/public-standings/route.ts | tournament.status 조회 추가 + 응답에 tournamentStatus 포함 | 수정 |
| src/app/(web)/tournaments/[id]/_components/tournament-tabs.tsx | 공동순위 판단을 대회 상태별 분기 (진행중=승률만, 종료=승률+득실차+다득점) | 수정 |

tester 참고:
- 테스트 방법: 진행 중 대회 순위 탭에서 승률이 같은 팀이 같은 순위 번호인지 확인
- 종료된 대회에서는 승률+득실차+다득점까지 같아야 공동순위
- 정렬 순서(승률>득실차>다득점)는 양쪽 모두 동일하게 유지됨

### 순위표 API - 경기 결과 직접 집계 방식 수정 (2026-04-13)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/api/web/tournaments/[id]/public-standings/route.ts | tournament_teams.wins/losses 읽기 → tournament_matches 경기 결과 집계로 변경 | 수정 |

tester 참고:
- 테스트 방법: 경기 결과가 입력된 대회의 순위 탭 확인
- 정상 동작: 완료된 경기의 스코어에 따라 승/패/무가 계산되어 표시
- 추가 필드: pointsFor, pointsAgainst, pointDifference가 응답에 포함
- 주의: 경기 status가 "completed"인 것만 승패 집계, "in_progress"는 득점만 반영

reviewer 참고:
- tournament_teams.wins/losses 컬럼은 더 이상 읽지 않음 (갱신 안 되는 문제 우회)
- Promise.all로 팀+경기 병렬 조회하여 DB 왕복 최소화
- 정렬: 승수 내림차순 → 패수 오름차순 → 득실차 내림차순

### 대회 탭 데이터 표시 버그 수정 (2026-04-13)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/lib/utils/case.ts | convertKeysToCamelCase() 함수 추가 (snake_case→camelCase 역변환) | 수정 |
| src/app/(web)/tournaments/[id]/_components/tournament-tabs.tsx | fetcher에 camelCase 변환 적용 + data?.data?.xxx → data?.xxx 수정 (4개 탭 전부) | 수정 |

tester 참고:
- 테스트 방법: 대회 상세 페이지에서 일정/순위/대진표/참가팀 탭 각각 클릭
- 정상 동작: 각 탭에서 데이터가 표시되어야 함 (기존에는 빈 화면)
- 주의: 데이터가 있는 대회에서 테스트 필요

reviewer 참고:
- case.ts에 convertKeysToCamelCase 추가 — convertKeysToSnakeCase의 역함수
- fetcher 레벨에서 일괄 변환하여 각 탭 컴포넌트가 기존 camelCase 키를 그대로 사용

### 모바일 UI 경미(녹색) 10건 일괄 수정

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| profile/basketball/page.tsx | 통계 숫자 text-2xl sm:text-3xl (3곳) + 커리어 gap-2 sm:gap-4 | 수정 |
| profile/page.tsx | 카테고리 그리드 gap-2 sm:gap-3 + 아이콘 h-8 w-8 sm:h-10 sm:w-10 + 텍스트 축소 | 수정 |
| profile/notification-settings/page.tsx | 토글 간격 gap-3 sm:gap-4 | 수정 |
| invite/page.tsx | 4개 섹션 패딩 축소 + CTA 버튼 3곳 px-6 py-3 sm:px-8 sm:py-3.5 | 수정 |
| courts/[id]/checkin/page.tsx | 제목 text-lg sm:text-xl | 수정 |
| pricing/page.tsx | 카드 그리드 gap-4 sm:gap-6 | 수정 |

건너뛴 항목:
- #7 대회 일정: 이미 반응형 적용됨
- #8 Button 컴포넌트: 전역 영향 범위가 커서 건너뜀

tester 참고: CSS 클래스만 변경, 375px 뷰포트에서 각 페이지 여백/텍스트 크기 확인

## 테스트 결과 (tester)

### 대회 탭 데이터 표시 버그 수정 검증 (2026-04-13)

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| tsc --noEmit 타입 검증 | PASS | 에러 0건 |
| convertKeysToCamelCase 함수 존재 | PASS | case.ts 21~37행 |
| snake->camel 기본 변환 (team_name->teamName) | PASS | |
| snake->camel 중첩 객체/배열 변환 | PASS | group_teams 내부까지 재귀 변환 확인 |
| null/undefined 입력 처리 | PASS | 그대로 반환 |
| 빈 배열/객체 처리 | PASS | []/{}  그대로 반환 |
| 이미 camelCase 키 유지 | PASS | teamName -> teamName (변환 없음) |
| 기존 convertKeysToSnakeCase 미변경 | PASS | teamName->team_name 정상 동작 |
| 왕복 변환 (camel->snake->camel) 일치 | PASS | |
| fetcher에 convertKeysToCamelCase 적용 | PASS | diff 확인 |
| 일정 탭: data?.data?.matches -> data?.matches | PASS | diff 확인 |
| 순위 탭: data?.data?.teams -> data?.teams | PASS | diff 확인 |
| 대진표 탭: data?.data -> data | PASS | diff 확인 |
| 참가팀 탭: data?.data?.teams -> data?.teams | PASS | diff 확인 |
| 하위 컴포넌트 props 키 미변경 | PASS | teamName/groupName 등 camelCase 유지 |
| API 라우트 4개 미변경 | PASS | git diff 빈 결과 |
| API 응답 코드 (400 Invalid ID) | PASS | 4개 API 모두 정상 |

총평: 17개 중 17개 통과 / 0개 실패

## 리뷰 결과 (reviewer)
(아직 없음)

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-13 | developer | 모바일 🟢 경미 8건 일괄: 여백/텍스트/아이콘 미세조정 (6파일) | ✅ 완료 |
| 04-13 | developer | 모바일 🟡 배치2: 색상피커/모달/gap/텍스트 6건 (5파일) | ✅ 완료 |
| 04-13 | developer | 모바일 🟡 배치1: gap/패딩/텍스트/CSS변수 8건 (8파일) | ✅ 완료 |
| 04-13 | developer | 모바일 🔴 3-4/5: 대회 순위표 스크롤 + 팀 관리 탭 (2파일) | ✅ 완료 |
| 04-13 | developer+tester | 모바일 추가: 탭 아이콘 삭제 + 통계 카드 축소 + 푸터 컴팩트 (3파일) | ✅ 완료 |
| 04-13 | developer+tester | 모바일 🔴 2/5: 팀 상세 히어로/탭/버튼 반응형 (3파일) | ✅ 완료 |
| 04-13 | developer+tester | 모바일 🔴 1/5: 하단 탭 네비 조정 (layout.tsx) | ✅ 완료 |
| 04-12 | developer+tester | Phase 3b: 가시성 버그 3건 수정 (6파일) | ✅ 완료 |
| 04-12 | pm | 새 PC 세팅 | 완료 |
| 04-12 | developer+tester | 다크모드 accent 버튼 가시성 전수 수정 (40파일) | 완료 |
