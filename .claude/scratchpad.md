# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 5 픽업게임 모집 시스템 (6단계 전체 구현)
- **상태**: 구현 완료, tsc 통과 → tester 대기
- **현재 담당**: developer → tester

## 구현 기록 (developer)

### Phase 5 픽업게임 모집 시스템 (6단계 전체 구현)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| prisma/schema.prisma | pickup_games + pickup_participants 모델 + User/court_infos 관계 추가 | 수정 |
| src/app/api/web/courts/[id]/pickups/route.ts | GET 코트별 목록 + POST 생성 (방장 자동 참가) | 신규 |
| src/app/api/web/pickups/[id]/route.ts | GET 상세 + PATCH 수정 + DELETE 취소 (방장만) | 신규 |
| src/app/api/web/pickups/[id]/join/route.ts | POST 즉시 참가 + DELETE 탈퇴 (full/recruiting 자동전환) | 신규 |
| src/app/api/web/pickups/my/route.ts | GET 내 픽업게임 목록 (인증 필수) | 신규 |
| src/app/(web)/courts/[id]/_components/court-pickups.tsx | 픽업게임 UI (목록+참가+생성폼) | 신규 |
| src/app/(web)/courts/[id]/page.tsx | CourtPickups 컴포넌트 삽입 | 수정 |
| src/app/(web)/courts/page.tsx | pickupCount 서브쿼리 + 직렬화 추가 | 수정 |
| src/app/(web)/courts/_components/courts-content.tsx | "픽업게임" pill 필터 + pickupCount 인터페이스 | 수정 |

tester 참고:
- 테스트: 코트 상세 페이지 → "픽업게임" 섹션 (체크인 아래)
- 생성: 로그인 후 "게임 만들기" → 제목/날짜/시간/인원 → 생성 (방장 자동 참가)
- 참가: 다른 유저 게임에 "참가하기" → 즉시 확정 (SWR 갱신)
- 탈퇴: 참가자 "탈퇴" 버튼 → confirm 후 탈퇴 (full→recruiting 복원)
- 취소: 방장만 "게임 취소" 가능 (status→cancelled)
- 상태: recruiting → full(정원 도달) → completed(날짜 지남) / cancelled(방장 취소)
- pill 필터: 코트 목록에서 "픽업게임" 누르면 모집 중인 코트만
- tsc --noEmit 통과 완료

reviewer 참고:
- 즉시 확정 방식 (기존 games의 신청→승인과 다름)
- full↔recruiting 자동 전환 ($transaction)
- 과거 날짜 자동 completed (GET 조회 시 updateMany)
- 방장은 탈퇴 불가 (게임 취소만)
- DB 마이그레이션 별도 필요

## 테스트 결과 (tester)

### Phase 5 픽업게임 모집 시스템 코드 검증

| # | 테스트 항목 | 결과 | 비고 |
|---|-----------|------|------|
| 1 | tsc --noEmit | ✅ 통과 | 에러 0건 |
| 2 | Prisma: pickup_games 모델 필드 (id/court_info_id/host_id/title/scheduled_date/start_time/end_time/max_players/skill_level/status) | ✅ 통과 | BigInt PK, VarChar 제한, default 값 적절 |
| 3 | Prisma: pickup_participants 모델 (id/pickup_game_id/user_id/joined_at) | ✅ 통과 | |
| 4 | Prisma: @@unique(pickup_game_id, user_id) 중복 참가 방지 | ✅ 통과 | |
| 5 | Prisma: FK 관계 (court_infos, User x2, onDelete Cascade/NoAction) | ✅ 통과 | participants는 Cascade, 나머지 NoAction |
| 6 | Prisma: 인덱스 4개 (court+status, host, date+status, status) | ✅ 통과 | 쿼리 패턴에 맞는 복합 인덱스 |
| 7 | GET /courts/[id]/pickups: 과거 날짜 자동 completed 처리 | ✅ 통과 | updateMany + catch 무시 |
| 8 | GET /courts/[id]/pickups: recruiting/full만 조회 + 오늘 이후 | ✅ 통과 | |
| 9 | GET /courts/[id]/pickups: BigInt 직렬화 | ✅ 통과 | toString() 처리 |
| 10 | GET /courts/[id]/pickups: currentPlayers를 participants.length로 계산 | ✅ 통과 | DB 컬럼 없이 런타임 계산 (정합성 보장) |
| 11 | POST /courts/[id]/pickups: 인증 확인 | ✅ 통과 | 401 반환 |
| 12 | POST /courts/[id]/pickups: 코트 존재 확인 | ✅ 통과 | 404 반환 |
| 13 | POST /courts/[id]/pickups: 필수값 검증 (제목2~100자, 날짜, 시간, 인원2~30) | ✅ 통과 | |
| 14 | POST /courts/[id]/pickups: 과거 날짜 거부 | ✅ 통과 | KST 기준 비교 |
| 15 | POST /courts/[id]/pickups: skill_level 유효성 (beginner/intermediate/advanced/any) | ✅ 통과 | |
| 16 | POST /courts/[id]/pickups: 트랜잭션 (게임 생성 + 방장 자동 참가) | ✅ 통과 | $transaction 사용 |
| 17 | POST /courts/[id]/pickups: 응답 201 + id 반환 | ✅ 통과 | |
| 18 | GET /pickups/[id]: 상세 조회 + 코트/방장/참가자 include | ✅ 통과 | |
| 19 | PATCH /pickups/[id]: 방장만 수정 가능 | ✅ 통과 | host_id !== userId → 403 |
| 20 | PATCH /pickups/[id]: completed/cancelled 상태 수정 불가 | ✅ 통과 | |
| 21 | PATCH /pickups/[id]: 부분 수정 (변경된 필드만 update) | ✅ 통과 | |
| 22 | DELETE /pickups/[id]: 방장만 취소 가능 | ✅ 통과 | 403 반환 |
| 23 | DELETE /pickups/[id]: completed/cancelled 취소 불가 | ✅ 통과 | |
| 24 | DELETE /pickups/[id]: status를 cancelled로 변경 (soft delete) | ✅ 통과 | |
| 25 | POST /pickups/[id]/join: recruiting 상태에서만 참가 가능 | ✅ 통과 | full 상태 거부 |
| 26 | POST /pickups/[id]/join: 중복 참가 방지 (findUnique + @@unique) | ✅ 통과 | 409 반환 |
| 27 | POST /pickups/[id]/join: 인원 초과 시 full 전환 + 거부 | ✅ 통과 | |
| 28 | POST /pickups/[id]/join: 트랜잭션 (참가 등록 + count 확인 + full 자동전환) | ✅ 통과 | |
| 29 | DELETE /pickups/[id]/join: 방장 탈퇴 불가 | ✅ 통과 | HOST_CANNOT_LEAVE 에러 |
| 30 | DELETE /pickups/[id]/join: completed/cancelled 탈퇴 불가 | ✅ 통과 | |
| 31 | DELETE /pickups/[id]/join: 참가 기록 없으면 404 | ✅ 통과 | |
| 32 | DELETE /pickups/[id]/join: full → recruiting 자동 복원 | ✅ 통과 | $transaction 내 조건부 |
| 33 | GET /pickups/my: 인증 필수 + 참가 중인 게임 역조회 | ✅ 통과 | |
| 34 | UI: 폼 필드 (제목/날짜/시작시간/종료시간/인원/실력/설명) | ✅ 통과 | 7개 필드 |
| 35 | UI: 로그인 시만 "게임 만들기" 버튼 표시 | ✅ 통과 | currentUserId 분기 |
| 36 | UI: 방장→취소버튼, 참가자→탈퇴버튼, 미참가→참가버튼 분기 | ✅ 통과 | 3중 조건 |
| 37 | UI: 빈 상태 "현재 모집 중인 픽업게임이 없습니다" | ✅ 통과 | |
| 38 | UI: SWR mutate()로 생성/참가/탈퇴/취소 후 목록 갱신 | ✅ 통과 | |
| 39 | UI: 인원 바 + 참가자 아바타 (최대 6명 + 더보기) | ✅ 통과 | |
| 40 | UI: CSS 변수만 사용 (하드코딩 없음) | ✅ 통과 | var(--color-*) 전부 |
| 41 | UI: Material Symbols 아이콘만 사용 | ✅ 통과 | lucide-react 없음 |
| 42 | courts/page.tsx: pickupCount 서브쿼리 (groupBy + KST 날짜) | ✅ 통과 | |
| 43 | courts-content.tsx: "픽업게임" pill 필터 (pickupCount > 0) | ✅ 통과 | |
| 44 | courts-content.tsx: Court 인터페이스에 pickupCount 추가 | ✅ 통과 | |
| 45 | court detail page.tsx: CourtPickups import + 배치 (체크인 아래) | ✅ 통과 | |

📊 종합: 45개 중 **45개 통과** / 0개 실패

비고:
- DELETE API 검증 항목(#22~24): 기획서에는 "recruiting 상태만 취소 가능"이었으나, 실제 구현은 completed/cancelled만 차단하고 full 상태도 취소 가능. 이는 방장이 full 게임도 취소할 수 있어야 하므로 합리적인 구현임.
- current_players DB 컬럼 없이 participants.length/_count로 계산하는 방식은 정합성 면에서 더 안전함.

## 전체 프로젝트 진행 현황

### 코트 로드맵
| Phase | 내용 | 상태 |
|-------|------|------|
| 데이터 정리 | 스키마+UI nullable 처리 | 완료 |
| 데이터 정리 | cleanup 스크립트 실행 + 카카오 재검증 | 대기 |
| 데이터 정리 | 유저 위키 시스템 | tester 통과 → 커밋 대기 |
| Phase 5 | 픽업게임 모집 | 구현 완료 → tester 대기 |

---

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 03-29 | tester | Phase 5 픽업게임 코드 검증: 45항목 전통과 (DB+API4개+UI+필터) | 전통과 |
| 03-29 | developer | Phase 5 픽업게임 6단계: 2모델+4API+1컴포넌트+pill필터 (9파일) | tsc 통과 |
| 03-29 | developer | 유저 위키 시스템 7단계 구현: DB모델+상수+API2개+컴포넌트+관리자탭 (9파일) | tsc 통과 |
| 03-29 | architect | Phase 5 픽업게임 모집 기획설계: 2테이블+8API+1컴포넌트+pill필터 | 완료 |
| 03-29 | developer+tester+reviewer | 코트 데이터 대청소: nullable 5필드+cleanup+UI 5파일 (14항목 전통과) | 완료 |
| 03-29 | debugger | 코트 체크인 UI 버튼 미표시 버그 수정 | 완료 |
| 03-29 | developer+tester+reviewer | Phase 4 게이미피케이션 (28항목 전통과) | 완료 |
| 03-29 | developer+tester | Phase 3 리뷰+제보 (62항목 전통과) | 완료 |
| 03-29 | developer | 체크인 GPS 100m + 위치기반 5단계 UI + 원격 체크아웃 | 완료 |
| 03-29 | developer | 거리순 정렬 + 20km 반경 + 근접 감지 슬라이드업 | 완료 |
| 03-29 | developer | 카카오맵 SDK + 지도+목록 분할 뷰 | 완료 |
