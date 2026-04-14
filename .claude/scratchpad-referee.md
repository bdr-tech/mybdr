# 심판/경기원 플랫폼 구축 스크래치패드 (subin-referee 브랜치)

---

## 📌 현재 작업
- **요청**: 심판 배정 워크플로우 3차 — 현장 배정 풀 기반 마이그레이션 (RefereePicker + 경기 API 풀 조인 + 배정 API 5중 검증)
- **상태**: ✅ tester 전체 PASS (7/7) — PM 커밋 대기
- **현재 담당**: tester → (다음) PM 커밋

## 🧪 테스트 결과 (tester) — 배정워크플로우 3차 (2026-04-13)

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| Test 1: `npx tsc --noEmit` | ✅ 통과 | EXIT=0, 타입 에러 0건 |
| Test 2: RefereePicker 컴포넌트 | ✅ 통과 | "use client" + 검색 input + 실시간 필터(useMemo) + pools/excludeRefereeIds props + ⭐star(is_chief) + "이미 배정됨" 뱃지 비활성화 + ESC/외부클릭 닫기 모두 확인 |
| Test 3: 경기 목록 API 확장 | ✅ 통과 | `available_pools` 필드 포함. `prisma.dailyAssignmentPool.findMany`를 대회+협회 단위 1회 호출 후 `poolsByDate` Map으로 날짜별 그룹화(N+1 방지). 경기별 `toISOString().slice(0,10)`로 조회 |
| Test 4: POST /assignments 5중 검증 | ✅ 통과 | pool_id optional; (1) pool 존재 404 POOL_NOT_FOUND / (2) referee 일치 400 POOL_REFEREE_MISMATCH / (3) association IDOR 403 / (4) tournament 일치 400 POOL_TOURNAMENT_MISMATCH / (5) date UTC YYYY-MM-DD 일치 400 POOL_DATE_MISMATCH + MATCH_DATE_MISSING |
| Test 4b: PATCH /assignments/[id] 동일 검증 | ✅ 통과 | `loadOwnedAssignment`가 referee_id/tournament_match_id 반환. pool_id=null 시 해제 허용, undefined 시 미터치, BigInt 시 동일한 5중 검증 |
| Test 5: 배정 관리 페이지 리팩토링 | ✅ 통과 | 심판 select 드롭다운 제거 → `<RefereePicker pools={toPickerPools} excludeRefereeIds={getExcludeIds} />`. 경기 카드에 "선정 풀: N명·가용 M명" 뱃지. POST body에 `pool_id: pickedPool.id` 전달. 빈 풀 시 안내박스 + `/referee/admin/pools?tournament_id=...` 링크 + "배정 추가" 버튼 disabled |
| Test 6: 과도기 호환성 | ✅ 통과 | Prisma 스키마 `pool_id BigInt?` nullable. POST/PATCH 모두 pool_id 없으면 검증 스킵하고 정상 생성. 기존 pool_id=NULL 배정은 목록 API에 그대로 포함 |
| Test 7: 디자인 규칙 | ✅ 통과 | lucide-react import 없음(Material Symbols 사용). border-radius 4px 전 영역 일관. var(--color-*) 사용. `color: "var(--color-text-on-primary, #fff)"`는 CSS 변수 fallback 형태로 허용. `color-mix(... #22c55e ...)`는 기존 v2 4/4 커밋(995f9ca)부터 존재하던 confirmed 상태색이며 3차에서 신규 도입한 위반 아님 |

📊 종합: **7개 중 7개 통과 / 0개 실패**

🎯 핵심 검증 포인트:
- RefereePicker의 open 상태일 때만 `mousedown`/`keydown` 이벤트 바인딩 → 다른 모달/드롭다운 간섭 없음 (76행 useEffect)
- 매치 API가 풀을 대회+협회 단위 1회 쿼리 후 메모리 Map 그룹화 → 경기 N개마다 N+1 회피 (tournaments/[id]/matches/route.ts L121~172)
- POST/PATCH 5중 검증이 순서대로 단락 평가 → 권한 먼저(403), 그 다음 비즈니스(400) 순 UX 친화적
- UTC Date(@db.Date 자정 저장)와 scheduled_at(DateTime)을 `.toISOString().slice(0,10)`로 일관 비교 → 시차 무관
- 페이지 canAdd 계산: `poolTotal > 0 && poolRemaining > 0`로 "빈 풀" / "모두 배정됨" 분기 처리

⚠️ 참고(실패 아님):
- confirmed 상태 뱃지 배경의 `#22c55e`는 3차 변경분이 아닌 기존 995f9ca 커밋 코드 — 다른 페이지(documents/assignments/settlements)에서는 `var(--color-success, #22c55e)` 변수 fallback 형태로 통일되어 있음. 향후 리팩토링 시 함께 정리 권고(현재 작업 블로커 아님)

## 🧭 진행 현황표

### v2 (MVP 1차) — ✅ 완료
| # | 범위 | 상태 | 커밋 |
|---|------|------|------|
| 1/4 | Prisma 6모델 + 협회 20시드 + drift 복원 | ✅ | eb3ea55 |
| 2/4 | 본인 API 4개 + 본인 페이지 7개 + 독자 셸 | ✅ | e7e8d95 |
| 3/4 | 배정/정산 조회 API 2개 + 본인 열람 페이지 2개 | ✅ | 405c030 |
| 4/4 | Admin API 6개 + 페이지 5개 + Excel 일괄검증 | ✅ | 0510b01 |

### v3 (협회 주도 등록 + 매칭) — ✅ 완료
| 단계 | 범위 | 상태 |
|------|------|------|
| 1차 | DB 마이그레이션 + 매칭 엔진 + 암호화 유틸 | ✅ | 4aea61f |
| 2차 | 관리자 사전 등록 UI/API + 수동매칭 + 상태필터 | ✅ | 3b3ba18 |
| 3차 | 자동 매칭 훅 + 대시보드 안내 + 역할 관리 | ✅ | 39612a4 |

### v4 (심판 배정 워크플로우) — 🚧 진행 중
| 단계 | 범위 | 상태 |
|------|------|------|
| 1차 | 공고 게시 + 본인 신청 뼈대 (공고/신청/선정풀 스키마 + API 5개 + 페이지 2개) | ✅ 완료 |
| 2차 | 신청자 선정 + 일자별 풀 + 책임자 지정 (pools API 2개 + 상세/대시보드 페이지 2개) | ✅ 테스트 통과 |
| 3차 | 풀→경기 배정 자동화 + 기존 assignments 통합 | 대기 |

## 구현 기록 (developer) — 배정워크플로우 3차

📝 구현한 기능:
- 경기 배정 단계를 "공고→신청→일자별 선정풀→경기 배정" 최종 단계로 통합
- 심판 선택 드롭다운을 "협회 전체 심판" → "해당 경기 일자 선정 풀"로 제한
- 풀 id를 RefereeAssignment.pool_id에 저장해 선정→배정 추적 가능
- 빈 풀/모두 배정 상태에서는 일자별 운영 페이지로 안내 + 배정 추가 버튼 비활성화

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(referee)/referee/_components/referee-picker.tsx | 풀 기반 심판 선택 공통 컴포넌트 — 검색 input + 드롭다운 리스트 + is_chief ⭐ + 등급 뱃지 + "이미 배정됨" 비활성화 + ESC/외부클릭 닫기 | 신규 |
| src/app/api/web/referee-admin/tournaments/[id]/matches/route.ts | 각 경기 응답에 available_pools 추가 — tournament_id + association_id로 풀 일괄 조회 후 YYYY-MM-DD(UTC)로 날짜별 그룹화 → scheduled_at 동일 일자만 매칭 | 수정 |
| src/app/api/web/referee-admin/assignments/route.ts | POST: pool_id optional 스키마 추가 + 5중 검증(존재·referee 일치·association·tournament·date) + 생성 시 pool_id 저장 | 수정 |
| src/app/api/web/referee-admin/assignments/[id]/route.ts | PATCH: pool_id optional(null 해제 / BigInt 재배정) + POST와 동일한 5중 검증 로직 + loadOwnedAssignment가 referee_id/tournament_match_id까지 반환 | 수정 |
| src/app/(referee)/referee/admin/assignments/page.tsx | select → RefereePicker 교체 / MatchRow에 available_pools 반영 / 경기 카드에 "선정풀 N명·가용 M명" 뱃지 / 빈 풀이면 일자별 운영 링크 + 배정 추가 버튼 비활성화 / 모달도 풀 선택 기반 | 수정 |

💡 tester 참고:
- `npx tsc --noEmit` 에러 0건 확인 (EXIT=0)
- 스키마 변경 없음 — 기존 RefereeAssignment.pool_id(nullable) 그대로 활용
- 테스트 시나리오:
  1. `/referee/admin/assignments` → 대회 선택 → 경기 목록에 "선정풀 N명·가용 M명" 뱃지 노출
  2. 풀이 없는 경기: 안내 박스 + "일자별 운영 →" 링크 + "배정 추가" 버튼 비활성화
  3. 풀이 있는 경기: "배정 추가" 클릭 → RefereePicker 드롭다운에 선정된 심판만 나열
  4. RefereePicker 검색 input에 이름 타이핑 → 실시간 필터링
  5. 이미 배정된 심판: "이미 배정됨" 뱃지 + 클릭 비활성화
  6. 책임자(is_chief): ⭐ star 아이콘 표시
  7. ESC 키 / 바깥 클릭으로 드롭다운 닫기
  8. 선택 → 역할/메모 입력 → "배정 확정" → API에 pool_id 포함 전송 → 성공 시 목록 재조회
- 정상 동작 포인트:
  - pool_id 없는 기존 배정도 목록에 그대로 표시 (과도기 호환 OK)
  - 다른 협회 풀 ID로 POST 시 403 FORBIDDEN
  - pool의 referee_id와 body referee_id 불일치 시 400 POOL_REFEREE_MISMATCH
  - 경기 scheduled_at 날짜와 pool.date 불일치 시 400 POOL_DATE_MISMATCH
  - 경기 scheduled_at null인데 pool_id 보낸 경우 400 MATCH_DATE_MISSING
- 주의할 입력:
  - pool_id는 number/string BigInt 모두 허용
  - PATCH에서 pool_id=null은 풀 연결 해제(허용), undefined는 미터치

⚠️ reviewer 참고:
- **IDOR 방어**: POST/PATCH 둘 다 pool.association_id === admin.associationId 검증 후에만 통과
- **날짜 일치**: PostgreSQL @db.Date는 UTC 자정 저장, scheduled_at도 UTC 기준 toISOString().slice(0,10)로 비교 — 시차 무관
- **N+1 회피**: matches 응답에서 pool을 경기마다 쿼리하지 않고 대회·협회 단위로 1회 findMany 후 메모리 Map으로 날짜별 그룹화
- **RefereePicker 독립성**: 외부 클릭/ESC 감지를 useEffect 내부에서 open일 때만 바인딩 → 다른 컴포넌트의 이벤트 간섭 없음
- **과도기 호환**: pool_id optional 유지 — 기존 배정 데이터나 외부 스크립트의 POST도 계속 동작. 추후 "필수화"는 데이터 마이그레이션 후 진행 필요

## 구현 기록 (developer) — 배정워크플로우 2차

📝 구현한 기능:
- 공고 신청자 중 "이 날짜에 이 심판/경기원을 쓸게"로 확정하는 선정 워크플로우
- 일자·역할 단위로 책임자(is_chief) 1명 지정 (별표 토글)
- 대회별 일자별 풀 운영 대시보드 (여러 공고 가로질러 요약)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/api/web/referee-admin/pools/route.ts | POST(선정: association_id 강제 + Referee 소유 검증 + Application·Date 존재 검증 + P2002 중복 처리) / GET(풀 목록, tournament_id 필수, referee 이름·등급 조인) | 신규 |
| src/app/api/web/referee-admin/pools/[id]/route.ts | DELETE(경기배정 연결 있으면 409 ASSIGNMENT_EXISTS) / PATCH(is_chief=true 시 $transaction으로 기존 chief false 후 본인 true, memo 병행) | 신규 |
| src/app/(referee)/referee/admin/announcements/[id]/page.tsx | 공고 상세 — 일자 탭 + 좌(미선정 신청자)·우(선정 풀) 2열 / 책임자 토글 / 선정·취소 / 클라이언트 필터 | 신규 |
| src/app/(referee)/referee/admin/pools/page.tsx | 대회별 일자별 풀 대시보드 — 대회 검색/선택 → 일자×역할 그룹 카드(필요/선정/책임자/선정인원 일부) + 공고 상세 링크 | 신규 |
| src/app/(referee)/referee/admin/announcements/page.tsx | 테이블 관리열에 "상세" 링크 추가 (Link import) | 수정 |
| src/app/(referee)/referee/_components/referee-shell.tsx | NAV_ITEMS에 "일자별 운영"(calendar_today) 추가 | 수정 |

💡 tester 참고:
- `npx tsc --noEmit` 에러 0건 확인
- 기존 스키마 변경 없음 — `db push` 불필요 (1차에서 4모델 + pool_id 이미 반영됨)
- 테스트 시나리오 (순서대로):
  1. 관리자로 `/referee/admin/announcements` → 공고 목록에서 "상세" 클릭
  2. `/referee/admin/announcements/[id]` 상단 일자 탭 클릭 → 해당 일자 신청자만 좌측에 표시
  3. 좌측 "선정" 버튼 → 즉시 좌측에서 사라지고 우측에 등장, 신청자 수에 반영
  4. 우측 별표 버튼 → 해당 일자·역할 책임자가 본인에게 이동 (기존 chief 자동 해제)
  5. 우측 "취소" 버튼 → 확인 후 선정 해제
  6. `/referee/admin/pools` → 대회 선택 → 일자×역할 카드 출현 + "공고 상세" 링크로 이동
- 정상 동작 확인 포인트:
  - 다른 협회 심판의 pool 생성 시 403 FORBIDDEN
  - 신청 안 한 심판을 선정 시 400 NOT_APPLIED
  - 같은 (tournament, date, referee, role) 중복 선정 시 409 DUPLICATE_POOL
  - 경기 배정이 이미 있는 pool 삭제 시 409 ASSIGNMENT_EXISTS
  - is_chief=true 시 기존 chief는 자동으로 false (화면 새로고침 없이 반영)
- 주의할 입력:
  - date는 YYYY-MM-DD 고정 (API가 UTC 자정으로 변환)
  - tournament_id는 UUID 문자열 (Tournament.id)
  - referee_id는 BigInt — 클라이언트는 number/string로 보내면 Zod가 변환

⚠️ reviewer 참고:
- **IDOR 포인트**:
  - POST: referee.association_id === admin.associationId 검증 후에만 생성, association_id는 세션 강제
  - GET: where에 항상 association_id: admin.associationId
  - PATCH/DELETE: existing.association_id === admin.associationId 검증
- **트랜잭션**: is_chief=true 설정 시 기존 chief updateMany + 본인 update를 `$transaction` 배열로 원자 처리 (route.ts [id] L130~146)
- **신청 존재 검증**: POST에서 `assignmentApplication.findFirst` with nested announcement(tournament+association+role_type) + dates.some(date) — 4중 조건으로 정확한 신청-선정 매칭 보장
- **참조 무결성**: pool DELETE는 `_count.assignments > 0`이면 거부 — RefereeAssignment.pool_id(SetNull)가 있지만, 명시적 거부로 운영 실수 방지
- **기존 코드 무수정 원칙 유지**:
  - /referee/admin/assignments (경기 배정) 페이지/API 미수정 — 3차에서 통합
  - announcements 페이지는 Link import + "상세" 버튼 1개만 추가
- **디자인 일관성**: var(--color-*), Material Symbols(star/star_border/chevron_right), border-radius 4px, 하드코딩 색상 없음

## 구현 기록 (developer) — 배정워크플로우 1차

📝 구현한 기능:
- 심판팀장/경기팀장이 "대회 일자별 필요 인원" 공고를 게시하고, 심판이 본인 가능 일자를 골라 신청 제출/취소하는 뼈대
- DB 모델 4개 신규(공고/신청/신청일자/일자별선정풀) + 기존 RefereeAssignment.pool_id nullable 확장
- 선정풀(DailyAssignmentPool)은 모델만 생성 — 2차에서 UI/API 추가

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| prisma/schema.prisma | AssignmentAnnouncement / AssignmentApplication / AssignmentApplicationDate / DailyAssignmentPool 4모델 추가, Association·Referee back-relation, RefereeAssignment.pool_id nullable | 수정 |
| src/app/api/web/referee-admin/announcements/route.ts | POST(공고 게시) + GET(목록) — assignment_manage 권한 + association_id IDOR 방지 + dates/required_count 키 검증 | 신규 |
| src/app/api/web/referee-admin/announcements/[id]/route.ts | GET(상세+신청자) / PATCH(수정) / DELETE(삭제) — 소유 협회 검증 | 신규 |
| src/app/api/web/referee-applications/announcements/route.ts | GET — 본인에게 열려있는 공고 목록 (협회+역할 필터 + already_applied 플래그) | 신규 |
| src/app/api/web/referee-applications/route.ts | POST(신청: Application+Date 트랜잭션) / GET(내 신청) — 공고 open/deadline/role/date 검증 + 중복 방지 | 신규 |
| src/app/api/web/referee-applications/[id]/route.ts | DELETE — 본인 신청 취소 (IDOR: referee_id 세션 기반 검증) | 신규 |
| src/app/(referee)/referee/admin/announcements/page.tsx | 공고 관리 페이지 — 테이블 + 게시 모달(대회검색/일자추가/필요인원/마감일) + 상태토글/삭제 | 신규 |
| src/app/(referee)/referee/applications/page.tsx | 내 신청 페이지 — 탭2개(열린공고/내 신청) + 신청 모달(일자체크+메모) + 취소 | 신규 |
| src/app/(referee)/referee/_components/referee-shell.tsx | NAV_ITEMS에 "배정 신청"(how_to_reg) + "공고 관리"(campaign) 추가 | 수정 |

💡 tester 참고:
- `npx prisma generate` 성공 (신규 4모델 Prisma Client 반영됨)
- `npx tsc --noEmit` 에러 0건 확인
- **db push 필요 — PM이 별도 실행**: 신규 테이블 4개 + referee_assignments.pool_id 컬럼 추가
- 테스트 계정: 관리자 로그인으로 `/referee/admin/announcements` 접근 → 공고 게시 → 다른 심판 계정으로 `/referee/applications` 신청 → 다시 관리자로 상세 조회
- role_type 매칭 로직: Referee.role_type="referee" → 공고 role_type="referee"만 보임 / scorer/timer → "game_official"만 보임
- 정상 동작:
  1. 관리자가 공고 게시 → 해당 협회 소속 심판만 본인 화면에서 공고 보임
  2. 같은 공고에 중복 신청 시 409 DUPLICATE_APPLICATION
  3. 공고 상태를 "마감"으로 바꾸면 신청 불가(400 NOT_OPEN)
  4. deadline 경과 시 400 DEADLINE_PASSED
  5. 공고에 없는 일자로 신청 시 400 INVALID_DATE
- 주의할 입력:
  - dates 배열이 UTC 자정 Date로 저장됨 → 클라이언트는 YYYY-MM-DD만 주고받음
  - required_count의 키는 dates와 1:1 매칭 (API가 검증)
  - datetime-local 입력은 로컬 TZ → API에서 ISO로 변환 필요(페이지가 처리함)

⚠️ reviewer 참고:
- **IDOR 포인트**:
  - announcements POST: body의 association_id 없이 세션에서 강제
  - applications POST: referee.association_id와 announcement.association_id 일치 검증
  - [id] 모든 메서드: existing.association_id === admin.associationId 검증
- **기존 코드 무수정 원칙 준수**:
  - /referee/admin/assignments 페이지/API 미수정
  - 기존 RefereeAssignment 스키마는 pool_id(nullable) 추가만 — 기존 배정 무결성 유지
- **role_type 버킷화** (referee-applications/announcements, applications POST):
  - Referee.role_type이 scorer/timer 등 다양한데, 공고는 "referee"|"game_official" 2분류
  - referee만 referee, 나머지는 모두 game_official로 판단 — 2차 이전에 PM 확인 필요
- **withWebAuth 3-인자 패턴**: referee-applications/[id]에서 handler 시그니처 `(req, routeCtx, ctx)` — certificates/[id]와 동일
- **Date[] 컬럼**: PostgreSQL native Date[] 타입. Prisma @db.Date 배열은 UTC 자정 저장

## 테스트 결과 (tester) — 배정워크플로우 2차 [2026-04-13]

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| T1. tsc --noEmit | ✅ 통과 | Exit 0, 에러 0건 |
| T2. pools POST 권한 | ✅ 통과 | route.ts L53-56: getAssociationAdmin + requirePermission("assignment_manage") |
| T2. pools POST IDOR (협회 일치) | ✅ 통과 | L72-85: Referee 조회 후 referee.association_id !== admin.associationId면 403 FORBIDDEN |
| T2. pools POST 신청 존재 검증 | ✅ 통과 | L91-112: Application + Announcement(tournament+association+role_type) + dates.some(date) 4중 조건, 없으면 400 NOT_APPLIED |
| T2. pools POST 중복 선정 방지 | ✅ 통과 | L142-147: P2002 catch → 409 DUPLICATE_POOL "이미 선정된 심판입니다." (unique 제약 기반) |
| T2. pools POST association_id 세션 강제 | ✅ 통과 | L118: create data에 admin.associationId 직접 주입 (클라 입력 무시) |
| T2. pools GET association_id 필터 | ✅ 통과 | L172-175: where에 association_id: admin.associationId 항상 포함 / tournament_id 필수(L164) |
| T2. pools [id] DELETE 배정 존재 시 거부 | ✅ 통과 | [id]/route.ts L75-81: _count.assignments > 0이면 409 ASSIGNMENT_EXISTS |
| T2. pools [id] DELETE IDOR | ✅ 통과 | L68-74: existing.association_id !== admin.associationId면 403 FORBIDDEN |
| T2. pools [id] PATCH is_chief 트랜잭션 | ✅ 통과 | L136-159: $transaction([updateMany(기존 chief false, NOT id), update(본인 chief true)]) — 같은 tournament_id+date+role_type 범위로 잠금 |
| T2. pools [id] PATCH IDOR | ✅ 통과 | L129-131: 다른 협회 수정 시 403 |
| T3. 공고 상세 "use client" | ✅ 통과 | announcements/[id]/page.tsx L1 |
| T3. 일자별 탭 구조 | ✅ 통과 | activeDate state(L93) + 탭 렌더 L402-440 + 탭 활성 시 패널 전환 L442 |
| T3. 신청자/풀 2열 | ✅ 통과 | 좌 미선정 신청자(L444-523) / 우 선정 풀(L525-) flexbox 2열 |
| T3. 선정/취소/책임자 토글 버튼 | ✅ 통과 | 선정(L516 "선정"), 취소 확인(L234 confirm), 책임자 토글(L597-614 star/star_border) |
| T3. 필요 인원 대비 선정 인원 표시 | ✅ 통과 | L182-188 selectedByDate + L434 `{selected}/{need} 선정` 탭 뱃지 + L539 우측 헤더 |
| T4. 공고 목록 "상세" 링크 | ✅ 통과 | announcements/page.tsx L411-421: Link href=`/referee/admin/announcements/${a.id}` 관리열에 추가 |
| T5. 일자별 운영 "use client" | ✅ 통과 | pools/page.tsx L1 |
| T5. 대회 선택 드롭다운/검색 | ✅ 통과 | 대회 검색 input(L251) + /api/web/referee-admin/tournaments(L79) 조회 + 결과 리스트(L286-) |
| T5. 일자별 카드 + 요약 | ✅ 통과 | date+role_type 그룹화(L152-179) + summary 4지표(L355-358 일자수/그룹/책임자/총선정) + 카드 렌더(L385-) |
| T6. 메뉴 "일자별 운영" | ✅ 통과 | referee-shell.tsx L38: { href:"/referee/admin/pools", label:"일자별 운영", icon:"calendar_today" } |
| T7. 회귀: assignments 미수정 | ✅ 통과 | git status에 /referee/admin/assignments 및 /api/web/referee-admin/assignments 파일 없음 |
| T7. 회귀: 1차 공고/신청 API 미수정 | ✅ 통과 | announcements/page.tsx는 Link import + "상세" 링크 1개만 추가(git diff 12줄), 1차 API 라우트(/api/web/referee-admin/announcements, /api/web/referee-applications) 수정 흔적 없음 |
| T7. 회귀: referee-shell 기존 메뉴 보존 | ✅ 통과 | git diff에서 기존 NAV_ITEMS 변경 없음, L38 한 줄만 추가 |

📊 종합: 23개 중 23개 통과 / 0개 실패

**전체 PASS** — PM 커밋 승인 권장.

보조 확인 사항 (참고):
- unique 제약과 P2002 catch가 이중 방어 (DB 제약 + 애플리케이션 단의 NOT_APPLIED 선검증)
- POST에서 referee 존재 확인 → IDOR 체크 → 신청 매칭 → create 순서로 방어 단계가 논리적
- PATCH는 is_chief=true일 때만 $transaction, false/memo만일 때는 단일 update — 불필요 트랜잭션 회피 합리적
- 클라이언트 낙관적 UI(selecting Set으로 중복 클릭 방지 L95)
- Material Symbols(star/star_border/chevron_right/calendar_today) + border-radius 4px + var(--color-*) 일관
- 기존 배정(RefereeAssignment) 페이지/API 0 수정 — 3차 통합 전까지 회귀 리스크 없음

## 리뷰 결과 (reviewer) — 배정워크플로우 3차 [2026-04-13]

### 📊 종합 판정: **APPROVE** (통과) — 필수 수정 없음, 권장 사항 소수

### ✅ 잘된 점
- **5중 pool 검증이 명확·일관**: POST(route.ts L105-164), PATCH([id]/route.ts L122-189) 둘 다 (1)존재→(2)referee 일치→(3)association(IDOR)→(4)tournament→(5)date 순서로 동일하게 검사. 에러 코드도 `POOL_NOT_FOUND / POOL_REFEREE_MISMATCH / FORBIDDEN / POOL_TOURNAMENT_MISMATCH / MATCH_DATE_MISSING / POOL_DATE_MISMATCH`로 프론트가 분기 처리하기 좋음.
- **IDOR 방어 철저**: assignments GET은 `referee: { association_id }` 조인 필터로 전체 목록에도 우리 협회만 노출. PATCH/DELETE는 loadOwnedAssignment 공통 헬퍼로 중복 제거.
- **N+1 회피**: matches 라우트 L121-141 한 번의 `dailyAssignmentPool.findMany(tournament_id+association_id)`로 모든 풀 선조회 → Map으로 YYYY-MM-DD 그룹화. 경기 수와 무관하게 쿼리 2~3개(tournament + matches + assignments + pools = 4개)로 고정.
- **과도기 호환성 유지**: `pool_id` Zod optional, create data에 `pool_id ?? null`(L193), PATCH는 undefined면 미터치. 기존 pool_id 없는 배정도 무리 없이 공존.
- **날짜 비교 안전**: PostgreSQL @db.Date(UTC 자정) + `toISOString().slice(0,10)` 양측 동일 방식으로 YYYY-MM-DD 추출 → 타임존 드리프트 없음.
- **RefereePicker UX**: 검색/ESC/외부클릭 닫기, 책임자 ⭐ + 등급 뱃지, "이미 배정됨" 비활성화가 모두 한 파일에 정돈. excludedSet으로 O(1) 판정.
- **빈 풀 안내 명확**: 풀 0명 → `info` 아이콘 + "일자별 운영 →" 링크, 풀 있지만 모두 배정 → `check_circle` + 회색톤 안내. 배정 추가 버튼 `disabled` + title로 이유 노출.
- **디자인 컨벤션 준수**: 모든 색이 var(--color-*) + color-mix, 아이콘은 Material Symbols, border-radius 4, lucide-react 흔적 없음.
- **기존 기능 무회귀**: RefereeAssignment 스키마 변경 없음(pool_id 컬럼은 1차에서 이미 추가됨). assignments API 응답 필드는 추가만(`pool_id`), 삭제·변경 없음 → Flutter/기존 클라 영향 없음.

### 🔴 필수 수정
- **없음** (동작·안전·기존 호환 모두 문제 없음)

### 🟡 권장 수정 (다음 작업 또는 3차 마무리 시점에 검토)
- **assignments/[id]/route.ts L120-189 중복 로직 공통화**: POST(route.ts)와 PATCH의 5중 검증이 거의 그대로 중복. 공통 함수 `validatePoolAgainstMatch(pool_id, referee_id, match, associationId)` 하나로 뽑으면 앞으로 "풀 검증 규칙 변경" 시 한 곳만 고치면 됨. (현 시점엔 동작 OK라 필수 아님)
- **assignments GET 응답에 pool_id 포함 누락**: route.ts L260-275 select에 `pool_id: true`가 빠져 있어, 관리자 GET 결과만으로는 "풀 연동됐는지" 알 수 없음. matches 라우트 쪽 assignments에는 pool_id가 아예 없음. UI가 당장 쓰진 않지만, 일관성·추후 필터용으로 추가 권장.
- **matches 라우트 권한 주석 수정**: L20 주석 "모든 관리자 열람 가능 (배정 여부는 협회 무관 공개 정보)"인데, 실제로는 pool은 association_id로 필터(L123)됨. 주석이 약간 오해 소지. 현재 관리자라면 누구든 대회의 경기 자체는 봐도 되는 정책이면 그대로 두되, 주석을 "pool은 admin 협회로 필터"라고 명시하면 좋음.
- **RefereePicker placeholder "1차 렌더 race"**: useEffect(L60-65)에서 value→name 초기화하는데, `pools`가 비동기 늦게 오면 초기 input이 빈 값으로 한 번 렌더됨. 본 플로우에서는 모달 열 때 modalMatch 상태가 이미 pools를 들고 있어 문제 없지만, 다른 화면에서 재사용 시 깜빡임 가능. 필요할 때 `useRef(prevValue)`나 가드 추가 고려.
- **page.tsx "심판 #N" 뱃지 레벨**: matches 응답에서 level이 null일 때 `p.level ?? undefined`로 뱃지 숨김은 OK. 다만 가용/배정 숫자를 셀 때 `assignedRefIds.has(String(p.referee_id))`로 하고 있는데, 서로 다른 role_type이면 같은 심판이 두 역할로 풀에 올라올 수 있음. 지금은 referee_id 단위로 1명 카운트되니 이중 선정된 풀 1건은 보이지 않을 수도 있음. 운영 정책(한 사람 = 한 역할)이라면 현 로직 OK.

### 리뷰 관점별 체크
| 관점 | 결과 | 요약 |
|------|------|------|
| 보안 (pool 5중 검증) | ✅ | POST/PATCH 모두 동일 로직, IDOR 차단 |
| 과도기 호환성 (pool_id nullable) | ✅ | optional + null 저장 + undefined 미터치 |
| 성능 (N+1 회피) | ✅ | pools 1회 조회 + Map 그룹화 |
| UX (RefereePicker / 빈 풀) | ✅ | 검색/필터/뱃지/비활성화/안내 링크 |
| 코딩 컨벤션 | ✅ | apiSuccess/apiError, var(--color-*), Material Symbols |
| 기존 기능 회귀 | ✅ | 스키마 변경 無, 응답 필드 추가만 |

**커밋 승인 권장** — 권장 수정은 모두 다음 라운드에서 처리해도 무방.

## 테스트 결과 (tester) — 배정워크플로우 1차 [2026-04-13]

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| T1. tsc --noEmit | ✅ 통과 | Exit 0, 에러 0건 |
| T2. Prisma 신규 4모델 | ✅ 통과 | AssignmentAnnouncement(2385), AssignmentApplication(2413), AssignmentApplicationDate(2432), DailyAssignmentPool(2447) |
| T2. RefereeAssignment.pool_id nullable | ✅ 통과 | L2315 `pool_id BigInt?` + SetNull relation |
| T2. 기존 데이터 영향 없음 | ✅ 통과 | refereeAssignments count 정상 조회(0건) — 기존 테이블 ALTER 없음 |
| T3. 관리자 공고 POST/GET | ✅ 통과 | requirePermission("assignment_manage") + association_id 세션 강제 + dates/required_count 키 일치 검증 + Zod |
| T3. 관리자 공고 [id] GET/PATCH/DELETE | ✅ 통과 | association_id IDOR 검증 3개 메서드 모두, Cascade로 applications 동반 삭제 |
| T4. 본인 announcements GET | ✅ 통과 | Referee.association_id 필터 + role_type 버킷 매핑 + already_applied 플래그 |
| T4. 본인 applications POST | ✅ 통과 | getWebSession→referee 조회 + assoc 일치 + status/deadline/role/INVALID_DATE 검증 + 중복 409 |
| T4. 본인 applications [id] DELETE | ✅ 통과 | withWebAuth 3-인자 패턴, referee_id 세션 검증 |
| T5. 트랜잭션 원자성 | ✅ 통과 | prisma.$transaction 내 Application create + ApplicationDate createMany (route.ts L123) |
| T6. 공고 관리 페이지 | ✅ 통과 | 게시 모달(L441) / 일자 태그(L690) / 일자별 필요인원(L712) / 수정·삭제·마감·열기 버튼(L226,247,418) |
| T7. 내 신청 페이지 | ✅ 통과 | 2탭(open/mine) L69, 신청 모달 L465, 일자 체크박스 L545, 메모+취소 |
| T8. 메뉴 추가 | ✅ 통과 | referee-shell.tsx L31 "배정 신청"(how_to_reg) + L36 "공고 관리"(campaign) |
| T9. DB 상태 | ✅ 통과 | announcements=0, applications=0, pools=0, applicationDates=0, refereeAssignments=0 — 4신규 테이블 전부 push됨 |

📊 종합: 14개 중 14개 통과 / 0개 실패

**전체 PASS** — PM 커밋 승인 권장.

보조 확인 사항 (참고):
- withWebAuth 시그니처 일관: /referee-applications GET/POST는 (req, ctx) 2-인자, [id] DELETE는 (req, routeCtx, ctx) 3-인자 — 기존 certificates/[id] 패턴과 동일
- role_type 버킷화 로직: Referee.role_type === "referee" ? "referee" : "game_official" — 공고 GET과 POST에 동일 규칙 적용됨 (일관성 OK, developer가 남긴 주의사항대로 2차 이전 PM 정책 확인 필요)
- Date[] UTC 저장 + YYYY-MM-DD 왕복 변환 유틸(toUtcDate/toYmd) 양측 API 동일하게 사용 — 타임존 드리프트 위험 낮음

---

## 🎯 v3 설계 확정안 (2026-04-13)

### 핵심 구조 변경
- Referee.user_id → **nullable** (사전 등록 허용)
- AssociationAdmin → **role 필드 추가** (9종)
- 매칭 키: **이름 + 전화번호** (추후 확장 가능)
- 자기 등록: **1차 제외** (필요 시 추가)

### 협회 관리자 역할 (9종)
| 구분 | 역할 | 코드 |
|------|------|------|
| 임원 | 회장 | president |
| | 부회장 | vice_president |
| | 이사 | director |
| 실무 | 사무국장 | secretary_general |
| | 직원 | staff |
| | 심판팀장 | referee_chief |
| | 심판총무 | referee_clerk |
| | 경기팀장 | game_chief |
| | 경기총무 | game_clerk |

### 권한 매트릭스
- **임원 (회장/부회장/이사)**: 모든 기능 **열람만**
- **사무국장**: 전체 관리 + 관리자 추가/삭제 + 주민번호 열람
- **직원**: 기본 열람
- **심판팀장**: 심판 등록/수정/검증/배정/Excel
- **심판총무**: 심판 등록/수정/검증/Excel, 배정 열람
- **경기팀장**: 경기원 등록/수정/검증/배정/Excel
- **경기총무**: 경기원 등록/수정/검증/Excel, 배정 열람
- **정산 관리**: 사무국장만, 팀장급은 열람
- **주민번호**: 회장 + 사무국장만

### DB 변경 (1차)
| 모델 | 변경 | 내용 |
|------|------|------|
| AssociationAdmin | ADD COLUMN | role VARCHAR NOT NULL DEFAULT 'secretary_general' |
| AssociationAdmin | DROP CONSTRAINT | user_id unique 제거 → 1인 복수 협회 관리 가능성 대비 |
| Referee | ALTER COLUMN | user_id → nullable |
| Referee | ADD COLUMNS | registered_name, registered_phone, registered_birth_date, resident_id_enc, resident_id_last4, match_status, matched_at, registered_by_admin_id |

---

## 구현 기록 (developer) — v3 1차

구현한 기능: DB 스키마 확장 + 매칭 서비스 + 주민번호 암호화 + 권한 시스템

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| prisma/schema.prisma | AssociationAdmin에 role 필드 추가, Referee에 8개 사전등록 필드 추가 + user_id nullable | 수정 |
| src/lib/services/referee-matching.ts | findMatchingUser, findUnmatchedReferee, executeMatch (트랜잭션) | 신규 |
| src/lib/security/encryption.ts | AES-256-GCM 암호화/복호화, 마스킹, last4 추출 | 신규 |
| src/lib/auth/admin-guard.ts | AdminGuardResult에 role 추가, PERMISSIONS 매트릭스, hasPermission, requirePermission, isExecutive | 수정 |
| src/app/api/web/admin/associations/members/route.ts | user_id null 대응 (filter + fallback to registered_ 필드) | 수정 |
| src/app/api/web/admin/associations/members/[id]/route.ts | user_id null일 때 User 조회 스킵, registered_ 필드 fallback | 수정 |
| src/app/api/web/admin/bulk-verify/preview/route.ts | user_id null 대응 (사전등록 심판도 Excel 매칭 가능) | 수정 |

tester 참고:
- prisma generate 성공 확인됨
- tsc --noEmit 에러 0건
- db push는 아직 안 함 (PM이 dry-run 확인 후 별도 진행)
- .env에 RESIDENT_ID_ENCRYPTION_KEY 추가 필요 (64자 hex)
- 개발서버는 prisma generate 위해 종료함 (재시작 필요: npm run dev)

reviewer 참고:
- Referee.user_id nullable 변경으로 인한 영향 범위: members API 2개 + bulk-verify 1개
- 본인 API (referees/me, referee-certificates 등)는 세션 기반 user_id 검색이라 영향 없음
- admin-guard.ts의 requirePermission()은 apiError import 순환 방지를 위해 Response 직접 생성

#### 수정 이력 (되돌림 루프 1회차)
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| 1차 | 04-13 | Zod에 resident_id 추가 + 암호화(encryptResidentId/extractLast4) + 자동매칭(findMatchingUser/executeMatch) 호출 | members/route.ts | tester 요청: 주민번호 암호화+자동매칭 누락 |
| 1차 | 04-13 | 주민번호 입력 필드 추가 (type:password, 하이픈 자동삽입, 보안안내문구) + fetch body에 resident_id 포함 | members/new/page.tsx | tester 요청: 주민번호 입력 필드 누락 |
| 1차 | 04-13 | GET/POST 핸들러에 /^\d+$/ 검증 추가 — 비숫자 입력 시 400 반환 | members/[id]/match/route.ts | reviewer 요청: BigInt 입력값 검증 없음 |

---

## 구현 기록 (developer) — 경기 배정

구현한 기능: 심판 경기 배정 CRUD — DB unique 제약 + 대회 검색 API 2개 + 배정 CRUD API 2개 + 3단계 드릴다운 관리 페이지 + 사이드바 메뉴 추가

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| prisma/schema.prisma | RefereeAssignment에 @@unique([referee_id, tournament_match_id]) 추가 | 수정 |
| src/app/api/web/referee-admin/tournaments/route.ts | GET: 대회 검색 API (q/status/page/limit, 모든 관리자 열람) | 신규 |
| src/app/api/web/referee-admin/tournaments/[id]/matches/route.ts | GET: 대회 경기 목록 + 배정 현황 (homeTeam→Team 조인, 배정은 수동 조인) | 신규 |
| src/app/api/web/referee-admin/assignments/route.ts | POST: 배정 생성(assignment_manage 권한) / GET: 배정 목록 조회 | 신규 |
| src/app/api/web/referee-admin/assignments/[id]/route.ts | PATCH: role/status/memo 수정 / DELETE: 삭제 (IDOR 협회 검증) | 신규 |
| src/app/(referee)/referee/admin/assignments/page.tsx | 3단계 드릴다운 UI (대회 선택 → 경기 목록 → 배정 추가 모달) | 신규 |
| src/app/(referee)/referee/_components/referee-shell.tsx | NAV_ITEMS에 "배정 관리"(/referee/admin/assignments, event_available) 추가 | 수정 |

tester 참고:
- 테스트 방법:
  1. `npx prisma generate` 완료됨 (schema 변경 반영)
  2. `npx tsc --noEmit` 에러 0건 확인됨
  3. 개발서버 재시작 필요 (`npm run dev`, 포트 3001) — prisma generate 과정에서 기존 dev 서버 종료함 (PID 11632)
  4. `/referee/admin/assignments` 접속 → 대회 검색 → 대회 클릭 → 경기 목록 표시 → "배정 추가" 클릭 → 모달에서 심판/역할 선택 → 확정
- 정상 동작:
  - 검색 인풋에 타이핑하면 300ms 디바운스 후 대회 필터
  - 경기 행마다 "주심 N / 부심 N / 기록원 N / 타이머 N" 요약 표시
  - 우리 협회 배정만 "확정"/"삭제" 액션 노출, 타 협회는 "타협회" 뱃지만
  - 중복 배정 시도 → 409 "이미 해당 경기에 배정된 심판입니다."
- 주의할 입력:
  - 타 협회 심판 ID로 POST → 403 "다른 협회 소속 심판은 배정할 수 없습니다."
  - 존재하지 않는 tournament_match_id → 404
  - role 값이 main/sub/recorder/timer 외 → 422 Zod
  - DB 실제 반영은 PM이 db push를 별도 수행 필요 (unique 제약 추가분)

reviewer 참고:
- BigInt 직렬화: 프론트에서는 id를 string|number로 union 타입 처리 (JSON.stringify가 BigInt → string)
- 관계 설계: RefereeAssignment 쪽엔 tournament_match 관계 선언이 없으므로(기존 TournamentMatch 미수정 원칙) matches 라우트에서 수동 `findMany({ where: { tournament_match_id: { in: [...] } } })` 조인함
- IDOR 2중 검증: 생성 시 referee.association_id 확인 / 수정·삭제 시 loadOwnedAssignment() 헬퍼로 소속 확인
- TournamentTeam → Team 조인: `homeTeam: { select: { team: { select: { name: true } } } }` 패턴으로 팀명만 추출

---

## 테스트 결과 (tester) — v3 1차

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| Test 1: tsc --noEmit | PASS | 소스 코드 에러 0건 |
| Test 2: Prisma validate | PASS | 스키마 유효 |
| Test 3: 매칭 서비스 로직 | PASS | prisma 싱글톤 import 정상, 이름+전화번호 검색, $transaction 사용, matched_at 설정 |
| Test 4: 암호화 유틸 | PASS | 암호화-복호화 일치, 마스킹 901215-1******, last4 4567 |
| Test 5: admin-guard 권한 | PASS | PERMISSIONS 10개 그룹, 역할 배정 설계와 일치, isExecutive 정상 |
| Test 6: Referee user_id nullable 영향 | PASS | members 2개 API + bulk-verify null 대응 완료, 본인 API 영향 없음 |
| Test 7: DB 컬럼 확인 | PASS | association_admins.role 존재, referees 8개 신규 컬럼 모두 존재, user_id nullable 확인 |

종합: 7개 중 7개 통과 / 0개 실패 -- 전체 PASS

참고: scratchpad에 "db push 아직 안 함"으로 기록되어 있으나, 실제 DB에는 이미 반영 완료 상태

---

## 테스트 결과 (tester) — 심판 경기 배정 기능

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| Test 1: tsc --noEmit | PASS | 소스 코드 타입 에러 0건 |
| Test 2: Prisma validate + @@unique | PASS | schema.prisma 2311줄 `@@unique([referee_id, tournament_match_id])` 확인, `npx prisma validate` 성공 |
| Test 3: 대회 검색 API | PASS | getAssociationAdmin 권한체크(L26-29), q/status/page/limit 파싱(L33-40), items 배열+total/page/limit 응답(L73-85) |
| Test 4: 경기 목록 API | PASS | TournamentMatch.findMany + homeTeam.team.name 경로(L74-79), RefereeAssignment 수동조인(L86-107), tournamentId 필터 |
| Test 5: 배정 CRUD API | PASS | POST requirePermission('assignment_manage')(L50), IDOR referee.association_id 검증(L75-81), 409 친절한 중복 에러(L102-108), PATCH/DELETE loadOwnedAssignment IDOR(L32-48) |
| Test 6: 배정 관리 페이지 | PASS | "use client"(L1), 3단계 드릴다운(searchQ/matches/modalMatch), 배정 추가 모달(openModal L181, 버튼 L562), 타협회 뱃지(L597-607) |
| Test 7: 메뉴 추가 | PASS | referee-shell.tsx L32: href `/referee/admin/assignments`, label "배정 관리", icon `event_available` |

종합: 7개 중 7개 통과 / 0개 실패 -- 전체 PASS

참고:
- admin-guard.ts L63: `assignment_manage: ["secretary_general", "referee_chief", "game_chief"]` 권한 매트릭스 확인
- POST 중복체크 이중 보호: 사전조회 findUnique(L93-108) + Prisma P2002 코드 방어(L132-140)
- 심판명 표출 fallback: user.name → user.nickname → registered_name → `심판 #id` (matches/route.ts L123-128, assignments/route.ts L202-209)
- 모달에서 이미 배정된 심판 제외 필터 존재 (page.tsx L295)

---

## 리뷰 결과 (reviewer) — v3 1차

종합 판정: **APPROVE with comments** (critical 0건, warning 2건)

잘된 점:
- 암호화(AES-256-GCM) 구현이 교과서적으로 정확함 — IV 12바이트 랜덤, authTag 16바이트, 키 환경변수 분리
- 매칭 서비스의 executeMatch가 $transaction으로 원자적 처리, 이중 매칭 방지 로직 완비
- user_id nullable 변경의 영향 범위를 정확히 파악하고, 3개 API만 수정 + 본인 API는 영향 없음 확인
- 권한 매트릭스(PERMISSIONS)가 설계 확정안과 100% 일치
- bulk-verify에서 사전 등록 심판도 registered_ 필드로 Excel 매칭 가능하게 확장한 것이 좋음
- 주민번호가 API 응답에 평문으로 노출되는 곳 없음 (resident_id_enc/last4 필드는 API 응답에 미포함)

[WARNING] 권장 수정 2건:
1. [prisma/schema.prisma:2236] resident_id_enc에 @db 타입 제한 없음 — 현재 String?(무제한 text). AES-256-GCM으로 13자리 주민번호 암호화 시 base64 출력은 약 60~80자. @db.VarChar(128) 정도로 제한 권장. DB 레벨에서 의도치 않은 대용량 데이터 삽입 방지.
2. [src/lib/services/referee-matching.ts:49-51] 동명이인 + 같은 전화번호 시 findMany → find로 첫 번째만 반환. 확률은 낮지만 이론상 가능. 현재 1차 범위에서는 이름+전화번호 조합이 고유하다고 가정하고 있으므로 OK이나, 2차에서 birth_date를 추가 매칭 키로 검토 권장.

[INFO] 참고 사항:
- match_status에 Prisma enum 대신 String을 쓴 것은 합리적 (enum 변경 시 마이그레이션 필요, String이 유연)
- requirePermission()에서 apiError 대신 Response 직접 생성한 것은 import 순환 방지 목적이므로 수용
- admin-guard import 순환 없음 확인 (admin-guard → web-session + prisma만 의존)

---

## ⚠️ 미해결 이슈 (v2 잔재) — 모두 해결됨
1. ~~로그인 후 /referee 복귀 미동작~~ → bdr_redirect 쿠키 방식으로 해결
2. ~~하드코딩 #fff 9곳~~ → var(--color-text-on-primary, #fff) 대체
3. ~~Reviewer 권장수정 + nit 6건~~ → 배열 검증, P2002 구분, 200+null, 에러 중복, 로깅, Date 방어

## 구현 기록 (developer) — B코스 품질 개선 (3가지 일괄)

구현한 기능: 로그인 redirect 복귀 + 하드코딩 #fff 제거 + Reviewer nit 수정

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/api/auth/login/route.ts | redirect 쿼리 파라미터 → bdr_redirect 쿠키 저장 (5분 TTL) | 수정 |
| src/lib/auth/oauth.ts | handleOAuthLogin에서 bdr_redirect 쿠키 읽고 해당 경로로 복귀 | 수정 |
| src/app/actions/auth.ts | loginAction에 redirect FormData 파라미터 지원 | 수정 |
| src/app/(web)/login/page.tsx | redirect 쿼리 읽기 + OAuth/이메일 로그인에 전달 | 수정 |
| src/app/(referee)/referee/_components/empty-state.tsx | #fff → var(--color-text-on-primary, #fff) | 수정 |
| src/app/(referee)/referee/certificates/page.tsx | #fff 4곳 → CSS 변수 + 에러+empty UI 중복 방지 | 수정 |
| src/app/(referee)/referee/certificates/[id]/page.tsx | #fff 2곳 → CSS 변수 + verified_at Date 방어 | 수정 |
| src/app/(referee)/referee/profile/edit/page.tsx | #fff 2곳 → CSS 변수 | 수정 |
| src/app/api/web/admin/bulk-verify/confirm/route.ts | certificate_ids 배열 원소 정수 검증 추가 | 수정 |
| src/app/api/web/referees/me/route.ts | GET: 404→200+null, POST: P2002 에러 user_id/license 구분 | 수정 |
| src/app/api/web/associations/route.ts | catch에 error 로깅 추가 | 수정 |

tester 참고:
- tsc --noEmit 에러 0건
- 로그인 redirect 테스트: /referee 접근 → /login?redirect=/referee 이동 → 로그인 후 /referee 복귀 확인
- OAuth: bdr_redirect 쿠키 5분 TTL, 이메일: hidden input으로 redirect 전달
- 보안: redirect 경로는 /로 시작 + //로 시작하지 않는 것만 허용 (외부 URL 차단)
- referees/me GET이 404→200으로 변경됨: 기존 프런트 코드는 res.ok + has_referee 체크이므로 호환됨

## 🛑 절대 지킬 원칙
1. 기존 (web)/(admin)/(site) 수정 금지
2. prisma db push/migrate reset 금지 — dry-run 먼저
3. main 브랜치 직접 push 금지
4. lucide-react 금지, Material Symbols만
5. 하드코딩 색상 금지
6. 포트 3002 고정
7. 주민번호 평문 저장/노출 절대 금지

---

## 작업 로그 (최근 10건)
| 날짜 | 에이전트 | 작업 | 결과 |
|------|---------|------|------|
| 04-12 | developer | Commit 1/4: Prisma 6모델 + 협회 20시드 | ✅ eb3ea55 |
| 04-12 | developer | Commit 2/4: 본인 API 4개 + 페이지 7개 + 셸 | ✅ e7e8d95 |
| 04-12 | tester+reviewer | Commit 2/4 검증 (warning 2건, nit 6건) | ✅ APPROVE |
| 04-12 | developer | Commit 3/4: 배정/정산 API 2개 + 페이지 2개 | ✅ 405c030 |
| 04-12 | developer | Commit 4/4: Admin API 6개 + 페이지 5개 | ✅ 0510b01 |
| 04-12 | reviewer | Commit 4/4 검증 (critical 0, warning 2) | ✅ APPROVE |
| 04-13 | pm | 원격 커밋 2개 pull (Commit 3/4 + 4/4) | ✅ fast-forward |
| 04-13 | architect | 분리형+도메인/DB 공유 아키텍처 확정 | ✅ decisions.md |
| 04-13 | architect | v3 협회 주도 등록+매칭 시스템 설계 | ✅ 설계 확정 |
| 04-13 | pm | 협회 역할 9종 + 권한 매트릭스 확정 | ✅ 사용자 승인 |
| 04-13 | developer | v3 1차: 스키마+매칭+암호화+권한+API수정 (7파일) | ✅ tsc 통과 |
| 04-13 | reviewer | v3 1차 리뷰: critical 0, warning 2 (VarChar 제한+동명이인) | ✅ APPROVE |
| 04-13 | tester | v3 2차: API 3개 + 페이지 3개 검증 (7개 중 5통과/2실패) | ❌ 수정 필요 |
| 04-13 | developer | 메인사이트 심판 바로가기: me API is_referee + PC사이드바 + 모바일슬라이드 | ✅ tsc 통과 |
| 04-13 | developer | 서류 1차: Prisma모델+sharp+암호화+API4개+페이지2개+셸+상세링크 (13파일) | ✅ tsc 통과 |
| 04-13 | developer | 경기 배정: 스키마unique+tournaments/matches/assignments API 4개+3단계드릴다운 페이지+셸 (7파일) | ✅ tsc 통과 |
| 04-13 | reviewer | 경기 배정 리뷰: critical 0, warning 3, nit 2 | ✅ APPROVE w/ comments |
| 04-13 | developer | v4 배정워크플로우 1차: 스키마4모델+pool_id / 관리자 API 2개 / 본인 API 3개 / 페이지 2개 / 셸 2메뉴 (9파일) | ✅ tsc 통과 |
| 04-13 | developer | v4 배정워크플로우 2차: pools API 2개(POST/GET, PATCH/DELETE) + 공고상세+풀대시보드 페이지 2개 + 공고목록 상세링크 + 셸 "일자별 운영" 메뉴 (6파일) | ✅ tsc 통과 |
| 04-13 | reviewer | v4 배정워크플로우 2차 리뷰 (6파일) | ✅ APPROVE w/ comments (critical 0, warning 3, nit 3) |

---

## 구현 기록 (developer) — 서류 1차

구현한 기능: 정산 서류 관리 — DB 모델 + 이미지 최적화/암호화 + 본인 업로드 API/UI + 관리자 대리 업로드

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| prisma/schema.prisma | RefereeDocument 모델 신규 + Referee에 bank_name/bank_account/bank_holder 3필드 + documents relation | 수정 |
| src/lib/services/image-processor.ts | sharp 리사이즈(1500px)+그레이스케일+JPEG70% + MIME/크기/매직바이트 검증 | 신규 |
| src/lib/security/document-encryption.ts | AES-256-GCM 서류 전용 암호화/복호화 (DOCUMENT_ENCRYPTION_KEY 별도 키) | 신규 |
| src/lib/auth/admin-guard.ts | Permission 타입에 document_manage/document_print 추가, PERMISSIONS에 역할 매핑 | 수정 |
| src/app/api/web/referee-documents/route.ts | GET(내 서류 목록) + POST(업로드, multipart/form-data, upsert) | 신규 |
| src/app/api/web/referee-documents/[id]/route.ts | DELETE(본인 서류 삭제, IDOR 방지) | 신규 |
| src/app/api/web/referee-admin/documents/route.ts | GET(심판 서류 목록) + POST(관리자 대리 업로드, IDOR 방지) | 신규 |
| src/app/(referee)/referee/documents/page.tsx | 본인용 3종 서류 카드(업로드/교체/삭제), 보안 안내 배너 | 신규 |
| src/app/(referee)/referee/admin/members/[id]/documents/page.tsx | 관리자 대리 업로드 3종 카드 | 신규 |
| src/app/(referee)/referee/_components/referee-shell.tsx | NAV_ITEMS에 "서류" 항목 추가 (자격증 아래) | 수정 |
| src/app/(referee)/referee/admin/members/[id]/page.tsx | "정산 서류" 섹션 + "서류 관리" 링크 추가 | 수정 |
| package.json / package-lock.json | sharp 패키지 설치 | 수정 |

tester 참고:
- tsc --noEmit 에러 0건 확인
- prisma generate 성공 (db push는 아직 안 함 — PM이 별도 진행)
- .env에 DOCUMENT_ENCRYPTION_KEY 추가 필요 (64자 hex, node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 로 생성)
- sharp는 Vercel에서 기본 지원됨 (별도 설정 불필요)
- 개발서버는 prisma generate 위해 종료함 (재시작 필요: npm run dev)
- encrypted_data는 모든 API 응답에서 select로 제외됨
- 이미지 미리보기/썸네일은 어디에도 없음 (텍스트 상태만 표시)

reviewer 참고:
- 서류 암호화 키(DOCUMENT_ENCRYPTION_KEY)는 주민번호 키(RESIDENT_ID_ENCRYPTION_KEY)와 분리 (키 격리 원칙)
- 본인 DELETE API: referee.user_id === session.userId 체크로 IDOR 방지
- 관리자 API: referee.association_id === admin.associationId 체크로 IDOR 방지
- Prisma Json 필드 null 대입: Prisma.DbNull 사용 (TypeScript 호환)
- PDF는 sharp로 처리 불가하므로 optimizeDocumentImage에서 원본 그대로 반환

---

## 테스트 결과 (tester) -- 서류 1차

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| Test 1: tsc --noEmit | PASS | 소스 코드 에러 0건 |
| Test 2: Prisma validate + 모델 확인 | PASS | RefereeDocument 8필드 정상, @@unique([referee_id, doc_type]) 확인, Referee에 bank_name/bank_account/bank_holder + documents relation 확인 |
| Test 3: DB 상태 | PASS | referee_documents 테이블 존재, count=0 (정상) |
| Test 4: image-processor.ts | PASS | sharp import, resize 1500px+grayscale+jpeg quality 70, MIME 체크(jpeg/png/pdf), 10MB 제한, 매직 바이트 검증(FF D8 FF/89 50 4E 47/%PDF) |
| Test 5: document-encryption.ts | PASS | DOCUMENT_ENCRYPTION_KEY 사용, AES-256-GCM, IV 12바이트+authTag 16바이트, encryptDocument/decryptDocument 존재, RESIDENT_ID_ENCRYPTION_KEY와 별도 키 (키 격리 확인) |
| Test 6: 본인 API | PASS | GET: 세션 확인+encrypted_data select 제외, POST: formData+validateImageFile+optimizeDocumentImage+encryptDocument+upsert, DELETE: /^\d+$/ 검증+referee.user_id===userId IDOR 방지 |
| Test 7: 관리자 API | PASS | getAssociationAdmin+requirePermission('document_manage'), IDOR: referee.association_id===admin.associationId, encrypted_data select 제외, BigInt 입력값 /^\d+$/ 검증 |
| Test 8: 본인 페이지 | PASS | "use client", 3종 카드(certificate/id_card/bankbook), 이미지 미리보기 없음(텍스트 상태만), accept="image/jpeg,image/png,application/pdf", 보안 안내 배너("AES-256 암호화") |
| Test 9: admin-guard 권한 | PASS | document_manage: secretary_general+staff, document_print: secretary_general만 |
| Test 10: referee-shell 메뉴 | PASS | "서류" 항목, 아이콘 description, href /referee/documents (자격증 아래 배치) |

종합: 10개 중 10개 통과 / 0개 실패 -- 전체 PASS

---

## 리뷰 결과 (reviewer) — 경기 배정 (2026-04-13)

종합 판정: **APPROVE with comments** (critical 0건, warning 3건, nit 2건)

### 잘된 점
- 중복 방지 3중 방어: DB @@unique + POST 사전 findUnique + catch에서 P2002 구분 — 교과서적 구현
- IDOR 방지 철저: POST는 referee.association_id 확인, PATCH/DELETE는 loadOwnedAssignment() 헬퍼로 일관성 있게 검증
- 권한 계층 분리: 생성/수정/삭제는 assignment_manage(팀장급), 열람은 모든 관리자 — 설계 의도 정확히 반영
- Zod enum으로 role/status 값을 화이트리스트 검증 (main/sub/recorder/timer) — 잘못된 값 주입 차단
- BigInt 입력 안전 변환: union(number|string).transform(BigInt) 패턴 깔끔함
- GET 배정 목록 API도 where.referee.association_id 조건 필수 적용 → 크로스 협회 IDOR 방지
- matches 라우트의 수동 조인(tournament_match_id in [...]) 설계가 "기존 TournamentMatch 미수정" 원칙과 정확히 일치
- 기존 본인 배정 API(/api/web/referee-assignments)와 TournamentMatch 모델 모두 무수정 — 회귀 위험 0
- 페이지 3단계 드릴다운이 자연스럽고, "타협회" 뱃지로 배정 투명성 확보하면서 액션은 숨김 → UX 합리적
- CSS 변수 + Material Symbols 컨벤션 100% 준수 (배정 추가/삭제/확정 버튼 모두)

### [WARNING] 권장 수정 3건
1. **[assignments/route.ts:67-90] 중복 배정 사전 체크가 트랜잭션 밖** — findUnique(dup) → create() 사이 경쟁 조건 이론상 가능. 두 관리자가 동시에 같은 심판을 같은 경기에 배정하면 둘 다 null 확인 후 create 시도 → 한쪽은 P2002로 실패 (catch에서 409로 변환되므로 치명적이진 않음). DB unique + P2002 폴백이 있으므로 동작엔 문제 없으나, 사전 findUnique는 "친절한 에러"용이라는 점을 주석으로 명시 권장.

2. **[tournaments/[id]/matches/route.ts:87-107] 타 협회 심판의 실명이 응답에 포함됨** — 의도적 설계(UI에서 "타협회" 뱃지)는 이해하지만, referee.user.name/nickname까지 노출됨. 타 협회 심판의 실명 공개가 개인정보 정책상 적절한지 운영자 확인 필요. 현재 연락처/주민번호는 미포함이라 최소한의 보호는 됨. 불가 시 타 협회는 "타협회 심판" 또는 닉네임만으로 마스킹 권장.

3. **[assignments/page.tsx:162] 심판 드롭다운이 limit=100 고정 호출** — 100명 초과 협회에서는 일부 심판이 드롭다운에서 누락. 현재 대부분 협회가 100명 이하라 실무 영향은 적지만, 장기적으로 type-ahead 검색 UI로 확장 권장.

### [NIT] 참고 사항 2건
1. **[assignments/route.ts:161, 43] where 타입이 Record<string, unknown>** — Prisma.RefereeAssignmentWhereInput / Prisma.TournamentWhereInput 타입으로 바꾸면 IDE 자동완성/타입 안전성 향상. 동작엔 문제 없음.
2. **[assignments/page.tsx:555, 805] "#fff" 하드코딩** — B코스 품질 개선에서 정립한 var(--color-text-on-primary, #fff) 패턴으로 통일 권장. 기존 페이지는 CSS 변수 쓰는데 새 페이지만 #fff 남아있음.

### 회귀 검토
- prisma/schema.prisma 변경: RefereeAssignment에 @@unique 추가뿐 — 기존 컬럼/관계 불변 ✅
- 기존 TournamentMatch 모델 무수정 확인 ✅
- 기존 본인 배정 API(/api/web/referee-assignments) 무영향 — 세션 기반 referee_id 조회 + 독립 라우트 ✅
- NAV_ITEMS 추가만 하고 기존 항목 수정 없음 ✅

### 수정 요청 (developer 맡김)
없음 — 모두 권장/nit 수준. 현재 상태로 동작·보안상 문제 없음. 추후 여유 시 #fff 통일 + Prisma.WhereInput 타입 적용 + 타 협회 심판명 마스킹 정책 확정 정도 고려.

---

## 테스트 결과 (tester) -- v3 2차

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| Test 1: tsc --noEmit | PASS | 소스 코드 에러 0건 |
| Test 2: 사전 등록 API | FAIL | encryptResidentId/extractLast4 호출 없음, findMatchingUser 자동 매칭 호출 없음, Zod 스키마에 resident_id 필드 없음 |
| Test 3: 매칭 API | PASS | GET: 이름+전화번호로 후보 검색, POST: executeMatch 호출, 이미 매칭 시 409 에러, IDOR 방지(association_id 비교), 권한 체크 정상 |
| Test 4: 기존 목록 API 수정 | PASS | match_status 파라미터 처리 정상, "matched"/"unmatched" 필터, 빈 값이면 전체 반환, 기존 verified/level 필터 유지 |
| Test 5: 신규 페이지 (new) | FAIL | "use client" 선언 있음, fetch POST 호출 정상, 클라이언트 빈값 검증 있음. 그러나 주민번호 입력 필드 누락 (테스트 지시에서 요구) |
| Test 6: 기존 페이지 수정 | PASS | members/page.tsx: 매칭 상태 필터 탭 3개(전체/매칭됨/미매칭), MatchBadge/VerificationBadge 컴포넌트, "사전 등록" 버튼 Link. members/[id]/page.tsx: 매칭 상태 섹션, 미매칭시 수동 매칭 검색+실행 UI, loadData 새로고침 |
| Test 7: 디자인 규칙 | PASS | 하드코딩 색상은 CSS 변수 fallback으로만 사용(#fff/#000 텍스트 + var() fallback), Material Symbols 사용, lucide-react 없음, pill(9999px) 없음, borderRadius 4 통일 |

종합: 7개 중 5개 통과 / 2개 실패

### 수정 요청

| 요청자 | 파일 | 문제 설명 | 상태 |
|--------|------|----------|------|
| tester | src/app/api/web/referee-admin/members/route.ts | (1) Zod 스키마에 resident_id(주민번호) 필드 없음 (2) encryptResidentId/extractLast4 암호화 처리 없음 (3) findMatchingUser 자동 매칭 시도 없음 -- DB에 resident_id_enc, resident_id_last4 컬럼이 있고, 1차에서 암호화 유틸+매칭 서비스를 만들었는데 사전 등록 API에서 사용하지 않음 | 완료 |
| tester | src/app/(referee)/referee/admin/members/new/page.tsx | 주민번호 입력 필드 누락 -- 테스트 지시에서 "입력 필드: 이름*, 전화*, 생년월일, 주민번호, 자격증번호, 급수, 구분" 요구 | 완료 |
| reviewer | src/app/api/web/referee-admin/members/[id]/match/route.ts | BigInt(id) 변환에 유효성 검증 없음 — 비숫자 입력 시 500 에러 | 완료 |

---

## 리뷰 결과 (reviewer) — v3 2차

종합 판정: **APPROVE with comments** (critical 1건, warning 2건)

잘된 점:
- 모든 API에 getAssociationAdmin() + requirePermission() 이중 인증/인가 적용. IDOR 방지를 위해 association_id를 세션에서 강제 주입하는 패턴이 일관됨
- match API(GET/POST)에서 심판의 association_id와 관리자 세션을 비교하는 IDOR 체크가 정확함
- 매칭 실행 시 이중 매칭 방지(이미 매칭된 심판 거부 + 이미 다른 심판에 연결된 유저 거부)가 트랜잭션 내에서 처리됨
- 전화번호 정규화(숫자만 추출 비교)를 중복 체크/매칭 검색 양쪽에 일관 적용
- UI에서 CSS 변수 사용. Material Symbols 아이콘 사용. 반응형 (데스크톱 테이블/모바일 카드) 패턴 유지
- members/page.tsx의 매칭 상태 필터 추가가 기존 검증/등급 필터와 공존하며 기존 기능을 깨뜨리지 않음
- members/[id]/page.tsx의 기존 자격증 검증 토글, 배정/정산 표시 기능이 그대로 유지됨
- associations/members/route.ts의 match_status 필터가 기존 where 조건에 안전하게 추가됨 (AND 조건)

필수 수정 (1건):
- [match/route.ts:38,124] BigInt(id) 변환에 유효성 검증 없음. id에 "abc" 같은 비숫자를 넣으면 SyntaxError throw -> 500 에러 반환. /^\d+$/ 체크 또는 try-catch로 400/422 반환 권장

권장 수정 (2건):
1. [referee-admin/members/route.ts:85-98] 중복 체크에서 findFirst로 같은 이름인 심판 1건만 가져온 뒤 전화번호 비교. 같은 이름이지만 다른 전화번호인 심판이 먼저 발견되면 실제 중복을 놓칠 수 있음. findMany로 이름 일치 전체를 가져와서 any() 비교 또는 DB unique constraint 권장
2. [new/page.tsx:404 등] 제출 버튼 color: "#fff" 하드코딩. 프로젝트 전역 관행이므로 즉시 수정 필수는 아니나 통일 권장

참고:
- tester가 지적한 주민번호/자동매칭 누락 건은 reviewer 관점에서도 확인됨. 설계 문서에 resident_id_enc 컬럼이 있고 1차에서 암호화 유틸을 만들었으나 2차 API/UI에서 미사용. PM 판단 필요 (의도적 단계 분리인지 누락인지)

---

## 구현 기록 (developer) -- v3 3차

구현한 기능: 로그인 시 자동 매칭 훅 + 대시보드 안내 배너 + 관리자 역할 관리 (API 2개 + 페이지 1개 + 셸 수정)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/lib/auth/oauth.ts | tryAutoMatch() 함수 추가 + handleOAuthLogin()에서 리다이렉트 전 매칭 호출 | 수정 |
| src/app/actions/auth.ts | tryAutoMatch() 함수 추가 + loginAction()에서 쿠키 설정 후 매칭 호출 | 수정 |
| src/app/(referee)/referee/page.tsx | match_status=matched일 때 협회명 포함 안내 배너 표시 | 수정 |
| src/app/api/web/referee-admin/settings/route.ts | GET(관리자 목록) + POST(관리자 추가, admin_manage 권한) | 신규 |
| src/app/api/web/referee-admin/settings/[id]/route.ts | PATCH(역할 변경) + DELETE(관리자 삭제), 자기 보호 + IDOR 방지 | 신규 |
| src/app/(referee)/referee/admin/settings/page.tsx | 관리자 목록 테이블 + 역할 뱃지 + 추가/변경/삭제 UI + 권한별 분기 | 신규 |
| src/app/(referee)/referee/_components/referee-shell.tsx | NAV_ITEMS에 "설정" 메뉴 추가 (icon: settings, href: /referee/admin/settings) | 수정 |

tester 참고:
- tsc --noEmit 에러 0건 확인
- 자동 매칭: OAuth 로그인(handleOAuthLogin) + 이메일 로그인(loginAction) 양쪽에 삽입, try-catch로 매칭 실패 시 로그인에 영향 없음
- 대시보드: match_status=matched + association 존재 시에만 배너 표시, 그 외는 기존 동작 동일
- 설정 API: GET은 모든 관리자 열람 가능, POST/PATCH/DELETE는 admin_manage(secretary_general만), 자기 자신 변경/삭제 불가
- 설정 페이지: 데스크톱 테이블 + 모바일 카드 반응형, 역할 인라인 편집(select+저장)
- 셸: 사이드바에 "설정" 항목 추가됨 (관리자 메뉴 아래)

reviewer 참고:
- oauth.ts/auth.ts 수정은 import 추가 + tryAutoMatch 함수 정의 + 1줄 호출뿐. 기존 인증 흐름에 영향 없음
- settings API에서 POST/DELETE는 $transaction으로 AssociationAdmin + User.admin_role 동시 처리
- settings/[id] API에서 id 파라미터는 /^\d+$/ 정규식으로 검증 (BigInt 변환 전)
- 페이지에서 canManage 판정은 클라이언트에서 역할로 판정 (서버 API가 403으로 최종 방어)

---

## 테스트 결과 (tester) -- v3 3차

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| Test 1: tsc --noEmit | PASS | 소스 코드 에러 0건 |
| Test 2: 자동 매칭 훅 (oauth.ts + auth.ts) | PASS | tryAutoMatch 함수 정의됨, findUnmatchedReferee+executeMatch import 정상, try-catch로 감싸여 매칭 실패 시 로그인 무영향, 기존 로그인 흐름 구조 유지 |
| Test 3: 대시보드 안내 배너 | PASS | match_status==="matched" && association 조건 체크 정상, 협회명(association.name) 표시, 모든 색상 var(--color-*) CSS 변수 사용 |
| Test 4: 관리자 설정 API 보안 | PASS | GET: getAssociationAdmin() 호출, POST: requirePermission('admin_manage') 호출, PATCH/DELETE: requirePermission('admin_manage') 호출, 자기 자신 변경/삭제 방지(user_id===admin.userId), association_id 세션 강제, [id] parseAdminId /^\d+$/ 검증 |
| Test 5: 관리자 설정 페이지 | PASS | 9종 역할 한국어 매핑 완비(ROLE_LABELS), canManage=false시 수정/삭제 버튼 미표시+관리 컬럼 자체 미렌더링, 추가 폼 인라인 표시(showAddForm), 역할 인라인 편집(select+저장/취소) |
| Test 6: referee-shell 메뉴 | PASS | NAV_ITEMS에 { href: "/referee/admin/settings", label: "설정", icon: "settings" } 추가됨 |
| Test 7: 디자인 규칙 | PASS | 하드코딩 색상 없음(모두 CSS 변수 + fallback), Material Symbols 사용, lucide-react 없음, borderRadius 4 통일 |

종합: 7개 중 7개 통과 / 0개 실패 -- 전체 PASS

---

## 리뷰 결과 (reviewer) -- v3 3차

종합 판정: **APPROVE with comments** (critical 0건, warning 2건)

잘된 점:
- 자동 매칭 훅(tryAutoMatch)이 try-catch로 완벽히 격리됨. 매칭 실패/DB 에러 모두 인증 흐름에 영향 없음
- oauth.ts/auth.ts 수정이 최소한 — import 1줄 + 함수 정의 + 호출 1줄만 추가. 기존 로그인 로직 변경 없음
- settings/[id] API의 parseAdminId()로 BigInt 변환 전 /^\d+$/ 검증 — 2차 리뷰 지적 패턴 정확 적용
- 모든 settings API에 getAssociationAdmin() + requirePermission() 이중 인증/인가 일관 적용
- IDOR 방지: PATCH/DELETE에서 target.association_id !== admin.associationId 체크 정확
- 자기 자신 보호: PATCH/DELETE 양쪽에 target.user_id === admin.userId 체크 존재
- POST/DELETE에서 $transaction으로 AssociationAdmin + User.admin_role 동시 처리 — 정합성 보장
- referee/page.tsx: 기존 EmptyState/프로필카드/빠른링크 모두 유지, 매칭 배너만 조건부 추가
- 역할 한국어 매핑(ROLE_LABELS) 9종 모두 포함 확인
- referee-shell.tsx: NAV_ITEMS에 1항목 추가만으로 기존 메뉴 영향 없음

[WARNING] 권장 수정 2건:
1. [settings/[id]/route.ts:148-154] DELETE에서 User.admin_role을 null로 무조건 초기화. 현재 user_id unique 제약으로 1인 1협회만 가능하므로 당장 문제없으나, 설계에 "unique 제거 -> 복수 협회 가능성 대비" 언급 있음. 향후 확장 시 "다른 AssociationAdmin 존재 여부 확인" 추가 필요.
2. [settings/page.tsx:101-104] canManage가 클라이언트에서 role==="secretary_general" 하드코딩. 서버 API 403 방어로 보안 문제 아니나, admin_manage 역할 확장 시 불일치 가능. API 응답에 can_manage 필드 포함 권장.

[INFO] 참고:
- tryAutoMatch에서 user.name이 null이면 즉시 return — 이름 없는 유저는 매칭 미시도. 의도된 동작 (프로필 완성 후 다음 로그인에서 매칭)
- auth.ts의 tryAutoMatch는 loginAction() try-catch 내에서 호출되나, 자체 try-catch가 있으므로 예외 전파 없음 — 이중 안전
- 설정 페이지 유저 추가가 "ID 숫자 입력" 방식 — UX 개선 여지 있으나 1차 범위에서 OK

---

## 리뷰 결과 (reviewer) — 서류 1차

종합 판정: **APPROVE** (critical 0건, warning 1건)

잘된 점:
- **encrypted_data 유출 완벽 차단**: 4개 API 전부 Prisma select에서 encrypted_data를 명시적으로 제외. findMany/upsert 반환값 모두 메타데이터만 포함
- **암호화 구현 견고함**: AES-256-GCM + 12바이트 랜덤 IV + authTag 검증. DOCUMENT_ENCRYPTION_KEY가 RESIDENT_ID_ENCRYPTION_KEY와 완전 분리 (키 격리 원칙). 키 미설정/길이 불일치 시 명확한 에러
- **파일 검증 순서 정확**: validateImageFile(MIME+크기+매직바이트) -> optimizeDocumentImage(sharp) -> encryptDocument(AES). 검증이 sharp 처리보다 먼저 수행되어 악성 파일이 sharp에 도달하지 않음
- **매직 바이트 검증**: JPEG(FF D8 FF), PNG(89 50 4E 47), PDF(%PDF) 시그니처로 Content-Type 위조 방지
- **접근 제어 완벽**: 본인 API는 Referee.user_id=session.userId 검증, 관리자 API는 getAssociationAdmin()+requirePermission('document_manage')+referee.association_id=admin.associationId IDOR 방지
- **DELETE의 IDOR 방지**: document.referee.user_id !== userId 비교로 타인 서류 삭제 차단. id 파라미터 /^\d+$/ 정규식 검증도 적용됨
- **프론트엔드 이미지 미노출**: 두 페이지 모두 텍스트 상태(등록완료/미등록)만 표시. createObjectURL/blob/img src 태그 전무. 보안 안내 배너로 사용자에게 암호화 저장 안내
- **PDF 예외 처리**: sharp가 PDF를 처리하지 못하므로 optimizeDocumentImage에서 원본 그대로 반환. 올바른 판단
- **upsert 패턴**: 같은 doc_type 재업로드 시 교체+OCR 결과 초기화(Prisma.DbNull). @@unique([referee_id, doc_type]) 제약과 일치
- **관리자 페이지에 삭제 버튼 미제공**: 관리자는 대리 업로드/교체만 가능, 삭제는 본인만. 적절한 권한 분리
- **admin-guard 권한 추가**: document_manage/document_print 2개 Permission 추가가 기존 권한 매트릭스에 영향 없음 (추가만, 기존 수정 없음)
- **디자인 규칙 준수**: CSS 변수 사용, Material Symbols 아이콘, borderRadius 4, 하드코딩 색상 없음 (#fff 버튼 텍스트 제외)

[WARNING] 권장 수정 1건:
1. [referee/documents/page.tsx:62-64, admin/members/[id]/documents/page.tsx:68-70] API 응답 파싱에서 `res.json()`을 바로 `setDocuments(json)`으로 저장. apiSuccess()가 배열을 직접 반환하므로 현재는 동작하지만, 향후 API 응답 구조가 `{ data: [...] }` 형태로 바뀌면 깨질 수 있음. `json.data ?? json` 같은 방어 코드 권장 (즉시 수정 불필요, 참고 수준)

[INFO] 참고:
- decryptDocument() 함수가 정의되어 있으나 현재 어디서도 import/사용되지 않음. OCR 또는 인쇄 기능에서 사용할 예정으로 보임 — 미사용 자체는 문제 아님
- Referee 모델에 bank_name/bank_account/bank_holder 3필드 추가. 기존 API에서 select를 명시하는 패턴이므로 새 필드가 자동으로 노출될 위험 없음
- sharp 패키지가 Vercel에서 기본 지원되므로 배포 환경 호환성 문제 없음

---

## 구현 기록 (developer) — 서류 2차 OCR

구현한 기능: Naver Clova OCR 연동 — 자격증/통장 자동 추출 + 편집 확정 폼 + 관리자 OCR

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/lib/services/ocr-extractor.ts | Clova OCR 호출 + 자격증/통장/신분증별 필드 추출 + 은행명 매칭 상수 | 신규 |
| src/app/api/web/referee-documents/[id]/ocr/route.ts | 본인용 OCR 실행 API (복호화+OCR+DB업데이트, id_card skipped) | 신규 |
| src/app/api/web/referee-documents/[id]/ocr/confirm/route.ts | OCR 결과 확정 API (certificate→RefereeCertificate upsert, bankbook→Referee 계좌 암호화 저장, id_card→verified_name) | 신규 |
| src/app/api/web/referee-admin/documents/[id]/ocr/route.ts | 관리자용 OCR 실행 API (document_manage 권한 + IDOR 방지) | 신규 |
| src/app/(referee)/referee/documents/page.tsx | OCR "정보 추출" 버튼 + 편집 폼(자격증/통장/신분증별) + "확인 저장" + "직접 입력" 폼 | 수정 |
| src/app/(referee)/referee/admin/members/[id]/documents/page.tsx | 관리자용 OCR + 편집 폼 (관리자 OCR API 호출 + confirm API 호출) | 수정 |

tester 참고:
- tsc --noEmit 에러 0건 확인
- NAVER_OCR_INVOKE_URL, NAVER_OCR_SECRET_KEY 환경변수 없으면 OCR 건너뛰고 수동 입력 폼만 표시 (에러 안 남)
- id_card는 OCR 절대 안 함 (ocr_status = "skipped", 빈 객체 반환)
- encrypted_data는 모든 API 응답에서 제외됨 (서버 내부 복호화용으로만 사용)
- OCR 실패해도 수동 입력 폼은 표시됨
- bank_account 암호화: encryptResidentId() 패턴 재사용 (RESIDENT_ID_ENCRYPTION_KEY 필요)
- 자격증 확정 시 RefereeCertificate upsert (같은 referee_id + cert_type이면 업데이트)

reviewer 참고:
- OCR API에서 encrypted_data를 select에 포함하지만, 복호화 후 processDocumentOCR()에만 전달하고 응답에는 절대 포함 안 함
- confirm API에서 bank_account 암호화 실패 시 (키 미설정) 평문 저장 안 하고 skip — 보안 원칙 유지
- Prisma Json 필드 타입 호환: `ocrResult as unknown as Prisma.InputJsonValue` 캐스팅 사용
- 관리자 OCR confirm은 본인용 confirm API를 호출함 (관리자가 confirm 시 서류 소유자 검증은 서류→referee→user_id로 수행)

---

## 구현 기록 (developer) — 서류 3차 PDF

구현한 기능: 정산 PDF 출력 (사무국장 전용, 워터마크+추적코드)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/lib/services/settlement-pdf.ts | pdfkit 기반 PDF 생성 — 표지(심판정보)+서류3장(이미지)+워터마크+추적코드+푸터 | 신규 |
| src/app/api/web/referee-admin/documents/print/route.ts | POST API — document_print 권한(사무국장만)+IDOR방지+encrypted_data복호화+PDF스트리밍응답+접근로그 | 신규 |
| src/app/(referee)/referee/admin/members/[id]/documents/page.tsx | "정산 서류 PDF 출력" 버튼 추가 — 사무국장에게만 표시, 3종 모두 등록 시 활성화, blob 다운로드 트리거 | 수정 |
| package.json / package-lock.json | pdfkit + @types/pdfkit 패키지 설치 | 수정 |

tester 참고:
- tsc --noEmit 에러 0건 확인
- PDF는 서버에 저장되지 않음 (일회성 생성, Response로 직접 반환)
- PDF 한글: 기본 Helvetica 폰트 사용 (한글 미지원). 영문/숫자만 표시, 이미지에 한글 포함
- 워터마크: "mybdr SETTLEMENT ONLY" 대각선 반투명(opacity 0.06) 반복 배치
- 추적 코드: PRINT-{adminUserId}-{timestamp}-{random4} 형식, 표지+각 페이지 푸터에 표시
- encrypted_data는 API 내부에서만 복호화하여 PDF에 삽입, 응답에 노출 안 됨
- 사무국장 역할 판단: settings API 호출하여 items에서 current_user_id 매칭으로 role 추출
- DOCUMENT_ENCRYPTION_KEY 환경변수 필요 (서류 복호화용)

reviewer 참고:
- decryptDocument()가 처음으로 실제 사용됨 (1차 리뷰에서 "미사용" 언급했던 함수)
- Buffer -> Uint8Array 변환: new Response() 생성자에 Buffer 직접 전달 불가, Uint8Array로 감싸서 해결
- 접근 로그: console.log로 기록 (추후 DB audit_log 테이블로 전환 예정)
- Content-Disposition: attachment로 강제 다운로드 (inline 미사용)
- Cache-Control: no-store로 민감 문서 캐싱 방지

---

## 리뷰 결과 (reviewer) — 배정 워크플로우 1차

종합 판정: **APPROVE with comments** (필수 수정 0건, 권장 수정 4건)

잘된 점:
- **IDOR 방지 3중 방어**가 매우 견고함. POST/PATCH/DELETE 모두 `existing.association_id === admin.associationId` 검증 + body의 association_id는 무시하고 세션에서 강제 주입(announcements/route.ts L106). 신청 측도 `ann.association_id !== referee.association_id` 교차 검증(applications/route.ts L80-82).
- **중복 신청 방지 이중 보호**: 사전 findUnique 체크(L109-120) + P2002 catch(L147-151) + DB @@unique 제약 — 3중.
- **트랜잭션 원자성**: Application + ApplicationDate 생성이 `prisma.$transaction`으로 묶임(applications/route.ts L123-141). createMany 하나라도 실패하면 Application도 롤백.
- **pool_id nullable 확장이 안전함**: 기존 RefereeAssignment 레코드는 pool_id=null로 존재 가능 + onDelete:SetNull이라 pool 삭제 시 기존 배정 보존. 기존 /admin/assignments 페이지 쿼리에 전혀 영향 없음(select 절에 pool_id 미포함).
- **타임존 처리 일관됨**: 서버/클라이언트 모두 `YYYY-MM-DD` 문자열을 UTC 자정 Date로 변환(`T00:00:00.000Z`) + `toISOString().slice(0,10)`로 역변환. PostgreSQL Date 컬럼과 호환.
- **dates ↔ required_count 키 매칭 검증**(L80-90) — 클라이언트 실수 방어.
- **역할 버킷화 명시적 주석**: Referee.role_type(referee/scorer/timer 등) → 공고의 이분법(referee/game_official) 매핑 규칙을 코드 주석 + scratchpad에 명시.
- **Zod 입력 검증**: regex(`^\d{4}-\d{2}-\d{2}$`), min/max 길이, record key/value 타입 모두 체크.
- **디자인 컨벤션 준수**: 모든 색상 var(--color-*) / border-radius 4px / Material Symbols 사용 / 하드코딩 색상은 모달 오버레이 `rgba(0,0,0,0.6)` 하나뿐(허용 가능).
- **DailyAssignmentPool 확장성**: `is_chief` 필드가 이미 2차의 "책임자 지정"을 수용, `@@unique([tournament_id, date, referee_id, role_type])`이 동일 날짜 동일 심판 중복 선정 방지, `RefereeAssignment.pool_id` 연결 준비 완료 — 2차 설계 자연 확장 가능.

필수 수정: 없음

권장 수정:

🟡 announcements/route.ts POST (L80-90):
- 현재 `required_count` 키가 `dates`에 있는지만 검증. 반대 방향(`dates`에 있지만 `required_count`에 없는 일자)은 미검증.
- 영향: 클라이언트가 일자만 추가하고 인원 입력을 누락하면 DB에 저장된 후 해당 일자 정원이 `undefined` → UI에서 `0명`으로 표시됨.
- 프론트가 기본값 1을 자동 주입하므로 현재 동작은 정상이나, 방어적 API를 위해 역방향 체크(없으면 0으로 채우기 or 400) 추가를 권장.

🟡 applications/announcements/route.ts GET (L48-53):
- `deadline`이 지난 공고도 `status=open`이면 목록에 노출됨. POST 단계에서 `DEADLINE_PASSED`로 막고 있어 기능적 문제는 없지만 UX상 "이미 지난 공고"가 열린 공고에 섞임.
- 2차에서 `where`에 `OR: [{ deadline: null }, { deadline: { gt: new Date() } }]` 추가 검토.

🟡 announcements/[id] GET (L120-133):
- 신청자 목록 노출 시 `referee_phone`에 `user?.phone ?? registered_phone` 그대로 포함. 현재는 협회 관리자만 접근하므로 문제 없지만, 심판 연락처는 민감 정보에 가까움. 마스킹(010-****-1234) 또는 "연락처 보기" 버튼 + 별도 권한 체크 단계를 2차에서 고려.

🟡 applications/route.ts POST 일자 검증(L97-106):
- `ann.dates.map((d) => toYmd(d))`는 Prisma Date 컬럼(UTC 자정)을 UTC 기준 `toISOString().slice(0,10)`으로 포매팅해 일관성 OK. 다만 `ann.dates`가 Prisma에서 Date[] 타입으로 오는지(JS Date) 확인됨 — 현재 로직은 정확함. 단, `d`가 `Date` 객체임을 타입으로 보이게 주석 보강하면 이후 리팩토링 시 안전.

기타 관찰 사항:
- `withWebAuth` 3-인자 시그니처가 프로젝트 기존 패턴(certificates/[id])과 동일. OK.
- announcements/[id] PATCH에서 `status: "cancelled"`로 변경해도 기존 신청(applications)은 유지됨 — 1차 의도된 동작. 2차에서 취소 공고의 신청 노출 규칙 확정 필요.
- 공고 게시 페이지에 "대회 상태" 필터나 지난 대회 구분이 없음. tournaments 검색 API가 모든 상태를 반환하는지 확인 필요(별도 API라 리뷰 범위 밖).
- BigInt 직렬화 — Prisma 응답이 Next.js route handler에서 자동 직렬화되는지 확인됨(이전 커밋 패턴과 동일). 프론트 타입이 `string | number` union이라 안전.

2차 구현 시 체크리스트:
- [ ] 공고 `status="cancelled"` 시 본인 화면에 이미 낸 신청을 "공고 취소" 표시
- [ ] 이미 DailyAssignmentPool에 선정된 신청은 본인 취소 차단 (applications/[id] DELETE)
- [ ] Pool 생성 API에서 `@@unique` 제약 덕분에 중복 선정 자동 방지 확인

---

## 리뷰 결과 (reviewer) — 배정 워크플로우 2차 (2026-04-13)

종합 판정: **APPROVE with comments** (필수 수정 0건, 권장 수정 3건, nit 3건)

### 잘된 점
- **IDOR 3중 방어 견고함**: pools/route.ts POST는 (1) referee.association_id === admin.associationId 직접 검증, (2) matchedApp을 `announcement.association_id: admin.associationId` 조건으로 찾아 "다른 협회 공고로 신청한 타협회 심판"까지 차단, (3) 생성 시 body 무시하고 세션 associationId 강제 주입. DELETE/PATCH도 existing.association_id 일치 검증 후 동작.
- **신청 존재성 검증이 정확함**(L91-105): 단순히 referee가 협회 소속인지만 보는 게 아니라, "해당 tournament+association+role_type 공고에 해당 일자로 신청한 Application이 실제 있는지"까지 확인. 신청 없이 선정 불가 → 워크플로우 무결성 보장.
- **중복 선정 3중 방어**: (1) DB @@unique([tournament_id, date, referee_id, role_type]), (2) P2002 catch → 409 DUPLICATE_POOL 친절 메시지, (3) 프론트 `selectedRefereeIds` Set으로 이미 선정된 심판은 "미선정 신청자" 목록에서 자동 제외 → 선정 버튼 자체가 안 보임. 3중.
- **책임자(is_chief) 원자 교체**: PATCH L136-159가 `$transaction([updateMany(기존 chief 해제), update(본인 chief 지정)])`로 묶임. 동시에 두 명이 chief가 되는 경합 없음. `NOT: {id}`로 본인 제외해 자기 해제 루프 방지.
- **cascade 방지**: DELETE L75-81이 `_count.assignments > 0`이면 409 ASSIGNMENT_EXISTS. RefereeAssignment.pool_id는 onDelete:SetNull이라 그냥 삭제해도 DB 무결성은 유지되지만, 이미 경기에 배정된 심판을 풀에서 빼면 "경기에 붙었는데 풀에는 없는" 이상 상태 발생 → 사전 차단한 게 맞음.
- **권한 분리 적절**: POST/PATCH/DELETE는 `requirePermission("assignment_manage")`(사무국장/심판팀장/경기팀장만), GET은 `getAssociationAdmin()` 통과만으로 열람 허용. 1차 announcements와 동일한 정책.
- **날짜 처리 일관성**: 1차와 동일한 `toUtcDate(ymd)` = `new Date(\`${ymd}T00:00:00.000Z\`)` + `toIsoString().slice(0,10)` 왕복. PostgreSQL @db.Date(UTC 자정 저장) + Prisma Date[] 입출력과 호환.
- **클라이언트 UX 세밀함**:
  - 선정 중 버튼 `selecting: Set<string>`으로 중복 클릭 방지(announcements/[id] L194-226).
  - 일자 탭 버튼에 `선정/필요` 카운트 실시간 표시.
  - 선정 취소 시 `confirm()` 한 단계 거침.
  - chief 토글 버튼과 취소 버튼이 시각적으로 분리됨(star/star_border 아이콘 + 테두리 색).
- **기존 기능 무영향**: assignments 페이지·API 미수정, 1차 announcements/applications 기능 무수정. 셸에 메뉴 1개만 추가(L38).
- **디자인 컨벤션 준수**: 모든 색상 `var(--color-*)`, border-radius 4px, Material Symbols 사용, lucide-react 없음, 하드코딩 `#ffffff`는 primary 위의 텍스트에만 제한적으로 사용(OK).

### 필수 수정
없음.

### 권장 수정

🟡 **pools/route.ts POST — Announcement status 검증 누락** (L91-105)
- 현재는 Application이 존재하는지만 확인. 해당 공고가 `cancelled` 상태여도 선정이 가능.
- 영향: 취소된 공고의 신청자를 선정할 수 있는 엣지 케이스. 운영상 혼란 여지.
- 수정: `matchedApp` 조회 시 `announcement: { ..., status: { not: "cancelled" } }` 조건 추가하거나, 별도로 `announcement.status`를 확인해 400 반환.

🟡 **pools/route.ts GET — 대용량 응답 페이지네이션 부재** (L179-208)
- tournament_id 하나로 `findMany`가 전체 풀을 반환. 대회가 10일 × 20명 × 2역할이면 400건 이상. 공고 대시보드 성능 저하 가능.
- 수정: limit/offset 또는 커서 기반 페이지네이션 추가. 현 스케일에서 당장 문제는 없으므로 2차 마무리 시점에 고려.

🟡 **pools/[id] PATCH — memo만 바꿀 때 is_chief 분기 불일치 처리** (L161-172)
- `is_chief === undefined && memo !== undefined`는 정상 단순 업데이트 분기로 들어가 OK.
- 그러나 `is_chief === true && memo === undefined` 케이스는 transaction 분기에서 `...(memo !== undefined ? { memo } : {})`로 memo 미터치 → OK.
- 혼재 시 약간 읽기 어려움. 향후 is_chief=true 전용 함수로 분리 리팩토링 권장(동작은 정확함).

### Nit (선택 개선)

🔵 **pools/route.ts L35-37 `toYmd` 함수 미사용**: import된 헬퍼지만 GET 응답은 Prisma Date를 그대로 직렬화(ISO 문자열). 죽은 코드. 제거하거나 GET 응답에서 실제 사용(예: `date: toYmd(p.date)`)으로 정리.

🔵 **announcements/[id] page.tsx `loadDetail` useCallback 의존성 함정** (L99-127):
- 의존성에 `activeDate`가 들어가 있는데, 같은 effect에서 `setActiveDate`를 호출. 재로드 시 `activeDate`가 이미 설정되어 있으면 `!activeDate` 조건을 건너뜀 → 의도대로 동작.
- 그러나 `loadDetail` 재실행 시 `activeDate` 변경이 함수 재생성을 유발 → `useEffect(() => loadDetail(), [loadDetail])`로 불필요한 재호출 가능성. 현재 공고 데이터가 캐시되지 않고 매번 fetch됨.
- 실사용에서 느껴지는 문제는 없으나, `activeDate` 의존성을 제거하고 초기 활성 일자는 별도 effect(`useEffect(() => { if (detail && !activeDate && detail.dates.length) setActiveDate(toYmd(detail.dates[0])); }, [detail, activeDate])`)로 분리하는 편이 안전.

🔵 **pools 대시보드 `needFor` 합산 로직** (admin/pools/page.tsx L183-193):
- 같은 대회·같은 일자·같은 role_type에 공고가 2개 이상이면 `required_count[ymd]`를 단순 합산. 의도한 동작이라면 OK. 그러나 "주의: 동일 조합 공고는 사실상 하나만 허용" 같은 운영 규칙이 있다면 주석으로 명시하거나 UI에서 "공고 N개 합산" 표기 권장.

### 기타 관찰
- **신청자 목록에 phone 노출**(announcements/[id] page.tsx): 1차 리뷰에서 권장한 마스킹/권한 분리는 이번에도 미적용. 관리자 전용 화면이라 차단되지만 2차에서 재검토.
- **BigInt 직렬화**: `referee_id`가 `string | number` union 타입으로 프론트에서 처리. POST body에서도 `z.union([number, string]).transform(BigInt)`로 방어적 변환. OK.
- **풀 재로드 전략**: 선정/취소/chief 토글 후 `loadPools()` 전체 재호출. 네트워크 왕복 1회 추가되지만, 동시성 충돌·stale state 방지에 유리. 현 스케일에서 적절한 선택.
- **pools 대시보드 `searchTournaments`가 대회 상태 필터 없음**: 종료된 대회도 포함될 수 있음. 1차 리뷰에서 지적한 내용과 동일 — tournaments API 레벨에서 해결 필요.

### 3차 구현 시 체크리스트
- [ ] Pool → RefereeAssignment로 내려가는 경기별 배정 UI (pool_id FK 활용)
- [ ] 공고 status=cancelled 시 pools POST 차단 (위 권장 수정 적용)
- [ ] "책임자" 지정 자동 배정 전략(예: 첫 경기 주심 우선 할당)
- [ ] 연락처 마스킹 + 별도 권한(contact_view 등) 도입

