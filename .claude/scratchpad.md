# 작업 스크래치패드

## 현재 작업
- **요청**: 모바일 UI 전수조사 → 🔴5 + 🟡15 + 🟢8 = 28건 수정 완료
- **상태**: ✅ 전체 완료 (커밋+푸시 완료)
- **현재 담당**: pm

## 전체 프로젝트 현황 대시보드 (2026-04-01)
| 항목 | 수치 |
|------|------|
| 웹 페이지 (web) | 84개 |
| 관리자 페이지 (admin) | 16개 |
| Prisma 모델 | 73개 |
| Web API | 111개 라우트 |

## 기획설계 (planner-architect)

### 음성인식 경기 기록 입력 - 기술 조사 보고서 (2026-04-13)
- 상세 보고서는 PM에게 텍스트로 전달 완료
- 핵심: Web Speech API(무료) + 규칙 기반 파싱(MVP) → 기존 events API 연동
- 난이도: 중 / MVP 2~3주 / 풀버전 5~7주
- 리스크: 경기장 소음, 브라우저 호환성(Chrome 필수), 한국어 농구 용어 인식률

## 구현 기록 (developer)

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
