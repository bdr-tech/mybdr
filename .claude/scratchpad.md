# 작업 스크래치패드

## 현재 작업
- **요청**: "전국 최강전" 대회 등록을 위한 시스템 분석 + 실행 계획 수립
- **상태**: planner-architect 기획설계 완료
- **현재 담당**: planner-architect → PM 검토

## 기획설계 (planner-architect)

### "전국 최강전" 대회 등록 — 시스템 분석 + 실행 계획

---

#### 1. 기존 대회 시스템 분석 결과

**DB 모델 (엑셀 시트 비유)**:
- `tournaments` — 대회 기본정보 시트 (이름, 날짜, 장소, format, is_public 등)
- `tournament_teams` — 참가팀 시트 (팀별 승/패/무, 조이름, 시드번호, 유니폼색상)
- `tournament_matches` — 경기 시트 (홈/어웨이, 스코어, 라운드명, 날짜, 장소)
- `tournament_sites` — 대회 전용 웹사이트 시트 (서브도메인, 템플릿, 색상)
- `match_player_stats` — 선수 개인기록 시트 (득점, 리바운드, 어시스트 등)

**기존 대회 format 종류 (4가지)**:
- `group_stage_knockout` — 조별리그+토너먼트
- `dual_tournament` — 듀얼토너먼트
- `single_elimination` — 토너먼트(싱글 엘리미네이션)
- `full_league_knockout` — 풀리그+토너먼트

**대회 관리 흐름**:
1. tournament-admin/tournaments/new/wizard — 대회 생성 (3단계 위자드)
2. tournament-admin/tournaments/[id] — 대회 상세 관리
3. tournament-admin/tournaments/[id]/teams — 참가팀 관리
4. tournament-admin/tournaments/[id]/matches — 경기 관리
5. tournament-admin/tournaments/[id]/bracket — 대진표 관리
6. tournament-admin/tournaments/[id]/site — 전용 사이트 설정

**공개 페이지 구조**:
- tournaments/[id] — 대회 상세 (히어로+소개+사이드바)
- tournaments/[id]/schedule — 일정 타임라인
- tournaments/[id]/standings — 순위표
- tournaments/[id]/bracket — 대진표 (조별 순위표+트리)
- tournaments/[id]/teams — 참가팀 목록+선수 명단

---

#### 2. 가능/부족/신규 분류

**[OK] 기존 시스템으로 바로 가능한 것**:
- 대회 생성 (이름, 설명, 날짜, 비공개 설정 is_public=false)
- 8팀 등록 (tournament_teams에 팀별 색상 저장 가능)
- 경기 일정 등록 (tournament_matches에 scheduledAt, venue_name, round_name 등)
- 순위표 (tournament_teams의 wins/losses/draws로 자동 계산)
- 대진표 뷰 (bracket-view.tsx가 round 기반으로 렌더링)
- 쿼터별 스코어 기록 (quarter_scores JSON 필드)
- 선수 개인기록 (match_player_stats 전체 필드)
- 대회 전용 사이트 (tournament_sites + _site/ 페이지)
- Flutter 앱(bdr_stat)으로 실시간 기록 입력 (API v1 호환)

**[WARN] 기존 시스템을 약간 활용하면 되는 것**:
- 2트랙(방송경기+풀리그) 표현 → TournamentMatch의 `group_name` 필드 활용
  - 방송경기: group_name = "방송경기" (또는 "트랙A")
  - 풀리그: group_name = "풀리그" (또는 "트랙B")
  - schedule-timeline.tsx에서 group_name별 필터 UI가 있으면 자연스럽게 분리됨
- 각 트랙별 장소 → TournamentMatch의 `venue_name` 필드에 개별 입력
  - 방송경기: "화성시 종합경기타운 실내체육관"
  - 풀리그: "남양주 스포라운드 체육관"
- 라이징이글스(연예인팀) 특별 표시 → tournament_teams의 `category` 필드에 "special" 또는 notes 활용

**[MISSING] 현재 부족한 점 (방송 퀄리티 관점)**:
1. **schedule 페이지에 group_name 필터 없음** — 현재는 전체 경기를 날짜순으로만 나열. "방송경기"/"풀리그" 탭 전환 필요
2. **standings 페이지가 단순함** — 승/패/승률만 표시. 득실차(point_difference), 최근전적 등 미표시
3. **팀 카드에 팀 색상 미반영** — primaryColor를 배경/보더에 사용하지 않음
4. **대회 사이트(_site) UI가 기본적** — 방송 노출용으로는 디자인 보강 필요
5. **2트랙 구조 설명을 위한 대회 소개 커스텀 영역 없음** — description 필드가 텍스트만 지원

---

#### 3. 데이터 등록 실행 계획

**등록 순서 (건물 짓는 순서와 같음)**:

| 순서 | 작업 | 방법 | 비유 |
|------|------|------|------|
| 1 | 8개 팀 생성 | teams 테이블에 팀 등록 (이미 존재하면 스킵) | "입주할 회사 등록" |
| 2 | 대회 생성 | tournaments 테이블에 "전국 최강전" 생성 | "건물(대회) 짓기" |
| 3 | 참가팀 등록 | tournament_teams에 8팀 연결 + 색상 설정 | "입주 계약" |
| 4 | 방송경기 9경기 등록 | tournament_matches에 트랙A 경기 생성 | "1층(방송경기) 일정표" |
| 5 | 풀리그 21경기 등록 | tournament_matches에 트랙B 경기 생성 | "2층(풀리그) 일정표" |
| 6 | 대회 사이트 생성 | tournament_sites + 서브도메인 설정 | "건물 간판 달기" |
| 7 | 선수 등록 | tournament_team_players에 선수 명단 | "직원 명부 등록" |

**대회 생성 시 핵심 설정값**:
```
name: "전국 최강전"
format: "full_league_knockout" (풀리그+토너먼트가 가장 유사)
is_public: false (비공개)
status: "준비중" → 경기 시작 시 "진행중"
maxTeams: 8
start_date: 2026-04-11
end_date: 2026-06-27
venue_name: "화성시 종합경기타운 / 남양주 스포라운드"
```

**2트랙 표현 전략**:
- group_name 필드를 트랙 구분자로 사용:
  - 방송경기 매치: group_name = "방송경기"
  - 풀리그 매치: group_name = "풀리그"
- round_name 필드로 세부 라운드 표시:
  - 방송경기: "예선 1경기", "예선 2경기"... "준결승 1", "준결승 2", "결승"
  - 풀리그: "1일차 G1", "1일차 G2"... "4일차 G6"

---

#### 4. 방송 퀄리티 보강 필요 UI 포인트

| 우선순위 | 영역 | 현재 상태 | 필요한 보강 | 예상 시간 |
|---------|------|----------|------------|----------|
| P0 | schedule 페이지 | 전체 경기 flat 목록 | 트랙별 탭 필터 (방송경기/풀리그) | 20분 |
| P0 | standings 페이지 | 승/패/승률만 | 득실차, 승점, 최근전적 추가 | 15분 |
| P1 | 팀 카드 | 흰색 이니셜만 | 팀 고유색상으로 카드 보더/배경 강조 | 10분 |
| P1 | 대회 히어로 | 기본 배너 | 대회 로고/배너 이미지 등록 필요 | 이미지 준비 |
| P2 | 대회 사이트 | 기본 템플릿 | 방송용 다크 테마 + 팀 색상 강조 | 30분 |
| P2 | 대진표 | 라운드 기반 트리 | 2트랙 병렬 표시 또는 탭 전환 | 20분 |

---

#### 5. 구체적 실행 계획

| 순서 | 작업 | 담당 | 선행 조건 | 예상 시간 |
|------|------|------|----------|----------|
| 1 | DB 시드 스크립트 작성 (대회+팀+경기 일괄 생성) | developer | 없음 | 15분 |
| 2 | schedule 페이지에 group_name 탭 필터 추가 | developer | 없음 | 20분 |
| 3 | standings 페이지에 득실차/승점 컬럼 추가 | developer | 없음 | 15분 |
| 4 | 팀 카드에 팀 색상 반영 | developer | 없음 | 10분 |
| 5 | 시드 스크립트 실행 + 동작 확인 | tester | 1 완료 | 5분 |
| 6 | UI 보강 확인 (schedule/standings/teams) | tester | 2~4 완료 | 10분 |
| 7 | 대회 사이트 설정 + 방송용 테마 적용 | developer | 5 완료 | 30분 |

(2~4는 독립 파일이므로 병렬 작업 가능)

**developer 주의사항**:
- 시드 스크립트는 prisma db seed 또는 독립 ts 스크립트로 작성 (기존 데이터 영향 없도록)
- 방송경기의 라이징이글스는 항상 homeTeam으로 고정
- 풀리그 21경기 대진은 제공된 대진표 기반으로 정확히 입력
- tournament_matches의 venue_name을 트랙별로 다르게 설정
- is_public=false이므로 대회 목록에는 안 보이고, 직접 URL로만 접근 가능

---

## 구현 기록 (developer)

### prisma/seed-tournament.ts 작성

📝 구현한 기능: "전국 최강전" 대회 시드 스크립트 — 대회+팀+경기 일괄 생성

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| prisma/seed-tournament.ts | 대회 1건 + 팀 8개 upsert + 방송경기 9경기 + 풀리그 21경기 등록 | 신규 |

💡 tester 참고:
- 실행 방법: `npx tsx prisma/seed-tournament.ts`
- 실행 전 ORGANIZER_ID (23행)를 실제 유저 ID로 변경 필요
- 정상 동작: 콘솔에 각 단계별 [OK] 메시지 출력, 마지막에 "시드 완료" + 대회 ID 표시
- 방송경기 9경기 (예선7 + 준결승 + 결승), 풀리그 21경기 = 총 30경기 생성
- 중복 실행 시: 팀은 upsert로 안전하지만 대회/경기는 중복 생성됨 (주의)

⚠️ reviewer 참고:
- Team의 uuid에 @default가 없어서 randomUUID()로 직접 생성
- 준결승/결승은 homeTeamId/awayTeamId를 null로 등록 (대진 미정)
- KST→UTC 변환은 +09:00 오프셋 방식 사용

### 대회 페이지 UI 보강 — standings 득실차/승점 + 팀 카드 색상

📝 구현한 기능: 순위표에 무/득점/실점/득실차/승점 컬럼 추가 + 팀 카드/순위표에 팀 고유색상 반영

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/tournaments/[id]/standings/page.tsx | 5개 컬럼 추가(무,득점,실점,득실차,승점), 승점 기준 정렬, 팀 색상 인디케이터, 모바일 가로스크롤 | 수정 |
| src/app/(web)/tournaments/[id]/teams/page.tsx | 팀 카드 좌측 4px 보더에 팀 고유색상 적용 | 수정 |
| src/components/ui/card.tsx | Card 컴포넌트에 style prop 추가 (팀 색상 보더 지원) | 수정 |

💡 tester 참고:
- 테스트 방법: /tournaments/[대회ID]/standings, /tournaments/[대회ID]/teams 페이지 확인
- 정상 동작: 순위표에 #, 팀, 승, 패, 무, 승률, 득점, 실점, 득실차, 승점 10개 컬럼 표시
- 득실차 양수=초록, 음수=빨강 색상 적용 확인
- 팀 카드 좌측에 팀 고유색상 4px 보더 표시 확인
- 순위표 팀명 옆에 팀 색상 작은 바(인디케이터) 표시 확인
- 승점 계산: 승리 2점, 패배 1점, 무승부 1점

⚠️ reviewer 참고:
- 승점 필드가 DB에 없어서 서버사이드에서 계산 후 정렬
- Card 컴포넌트 style prop 추가는 기존 사용처에 영향 없음 (optional)

---

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-05 | developer | 대회 상세 사이드바→히어로 통합 + 1열 전체 너비 (3파일) | 완료 — tsc 통과 |
| 04-05 | developer | standings 득실차/승점 + 팀 카드 색상 UI 보강 (3파일) | 완료 — tsc 통과 |
| 04-05 | developer | seed-tournament.ts 작성 (대회+8팀+30경기) | 완료 — tsc 통과, 실행 대기 |
| 04-05 | planner-architect | "전국 최강전" 대회 등록 시스템 분석 + 실행 계획 | 완료 — 7단계 실행 계획 수립, P0 UI 보강 2건 식별 |
| 04-05 | developer | 전체 프로젝트 clip-slant CSS 클래스 제거 (18파일) | 완료 (tsc 통과) |
| 04-05 | developer | 홈 프로필 위젯+뉴스피드+퀵액션 컴팩트 축소 | 완료 |
| 04-05 | developer | 홈 전체 italic 일괄 제거 (26파일) | 완료 |
| 04-05 | developer | 슬라이드 메뉴 하단 유틸리티 삭제 | 완료 |
| 04-05 | developer | 프로필 아코디언→직접이동 메뉴 변경 | 완료 |
| 04-05 | developer | 프로필 페이지 아바타 세로→가로 레이아웃 | 완료 |
