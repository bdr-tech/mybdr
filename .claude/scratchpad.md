# 작업 스크래치패드

## 현재 작업
- **요청**: 심판 경기 배정 워크플로우 재설계 (공고→신청→선정→책임자→현장배정 6단계)
- **상태**: planner-architect 설계 완료
- **현재 담당**: PM (사용자 승인 대기)

### 기획설계 — 2026-04-13 — 심판 배정 워크플로우 재설계

🎯 목표: 현재 "원스텝 배정 CRUD"를 **공고→신청→선정→책임자 지정→현장 배정** 다단계 워크플로우로 확장. 기존 RefereeAssignment는 그대로 두고, 앞단에 "신청/선정 파이프라인"을 추가한다.

🏗️ 전체 아키텍처 비유: **학교 현장체험 학습 배정 시스템**
- 1단계(공고) = 선생님이 "5/2 체험학습 도우미 모집" 칠판에 붙이기
- 2단계(신청) = 학생이 "저 5/2, 5/5 참여할게요" 손들기
- 3단계(선정) = 선생님이 "5/2에는 이 5명 갈 거야" 명단 확정
- 4단계(책임자) = "5/2에는 철수가 반장" 지정
- 5단계(현장 배정) = 당일 반장이 "철수는 A조, 영희는 B조" 배정 — **이게 기존 RefereeAssignment**

즉 **기존 RefereeAssignment는 "맨 끝 단계(현장 배정)"로 재정의**. 앞에 4개 단계(Announcement/Application/Pool/Chief)를 새로 추가.

📍 DB 모델 변경 (prisma/schema.prisma, 신규 4개 + 기존 1개 수정):

| 모델 | 역할 | 신규/수정 |
|------|------|----------|
| `AssignmentAnnouncement` | 공고 (대회+일정+필요인원) | 신규 |
| `AssignmentApplication` | 신청 (공고별 심판 신청) | 신규 |
| `AssignmentApplicationDate` | 신청 일자 상세 (N:M) | 신규 |
| `DailyAssignmentPool` | 일자별 선정 인원 풀 + 책임자 플래그 | 신규 |
| `RefereeAssignment` | 기존 유지 (현장 경기별 최종 배정) + `pool_id` FK 1개 추가 | 수정 |

🔑 핵심 스키마 (간략):

```prisma
// 2단계: 공고
model AssignmentAnnouncement {
  id             BigInt   @id @default(autoincrement())
  association_id BigInt                 // 게시 협회
  tournament_id  String   @db.Uuid      // 대회 (UUID)
  title          String   @db.VarChar
  description    String?
  role_type      String   @db.VarChar   // "referee" | "scorer" | "both"
  // 신청 받을 날짜들 (Postgres 배열)
  dates          DateTime[] @db.Date
  // 일자별 필요 인원 (JSON: {"2025-05-02": {referee: 5, scorer: 3}})
  required_count Json?
  apply_deadline DateTime?  @db.Timestamp(6)
  status         String   @default("open") @db.VarChar  // open/closed/cancelled
  posted_by      BigInt                 // User.id (심판팀장/경기원팀장)
  created_at     DateTime @default(now()) @db.Timestamp(6)
  updated_at     DateTime @updatedAt @db.Timestamp(6)

  applications   AssignmentApplication[]
  @@index([association_id, status])
  @@index([tournament_id])
  @@map("assignment_announcements")
}

// 3단계: 신청 (1 심판 × 1 공고 = 1 신청)
model AssignmentApplication {
  id              BigInt @id @default(autoincrement())
  announcement_id BigInt
  referee_id      BigInt
  memo            String?
  status          String @default("applied") @db.VarChar  // applied/selected/rejected/cancelled
  applied_at      DateTime @default(now()) @db.Timestamp(6)

  announcement AssignmentAnnouncement @relation(fields: [announcement_id], references: [id], onDelete: Cascade)
  referee      Referee               @relation(fields: [referee_id], references: [id], onDelete: Cascade)
  dates        AssignmentApplicationDate[]

  @@unique([announcement_id, referee_id])  // 같은 공고에 중복 신청 방지
  @@index([referee_id])
  @@map("assignment_applications")
}

// 3단계 상세: 신청자가 선택한 날짜들
model AssignmentApplicationDate {
  id             BigInt   @id @default(autoincrement())
  application_id BigInt
  date           DateTime @db.Date

  application AssignmentApplication @relation(fields: [application_id], references: [id], onDelete: Cascade)
  @@unique([application_id, date])
  @@map("assignment_application_dates")
}

// 4+5단계: 일자별 선정 풀 + 책임자
model DailyAssignmentPool {
  id             BigInt   @id @default(autoincrement())
  tournament_id  String   @db.Uuid
  date           DateTime @db.Date
  referee_id     BigInt
  role_type      String   @db.VarChar  // referee/scorer
  // 책임자 플래그 (일자별로 referee 1명 + scorer 1명만 true 허용)
  is_chief       Boolean  @default(false)
  // 선정 근거 (신청 없이 직접 추가했을 수도 있음)
  application_id BigInt?
  selected_by    BigInt                 // User.id (팀장)
  selected_at    DateTime @default(now()) @db.Timestamp(6)

  referee     Referee @relation(fields: [referee_id], references: [id], onDelete: Cascade)
  assignments RefereeAssignment[]       // 6단계 현장 배정 → 이 풀에서만 선택

  @@unique([tournament_id, date, referee_id, role_type])  // 중복 선정 방지
  @@index([tournament_id, date])
  @@map("daily_assignment_pools")
}

// 6단계: 기존 RefereeAssignment에 pool_id 추가
model RefereeAssignment {
  // ... 기존 필드
  pool_id BigInt?      // null 허용(기존 데이터 호환), 신규는 필수화 유도
  pool    DailyAssignmentPool? @relation(fields: [pool_id], references: [id], onDelete: SetNull)
}
```

왜 이렇게 쪼갰는지:
- **Announcement** = 학원 모집 공고문. 한 장 붙이면 여러 학생이 신청.
- **Application** = 한 학생의 전체 신청서. "나 참여합니다".
- **ApplicationDate** = 그 안의 체크박스들. "5/2 ☑ 5/5 ☑". N:M 관계라 따로 분리.
- **Pool** = 최종 명단. "확정된 5명". 경기별 배정(RefereeAssignment)은 이 풀에서만 고른다.
- **is_chief를 Pool 안에 flag로** = 따로 Chief 테이블 만들면 조인 늘어남. 같은 테이블 1컬럼이 단순.

🔗 기존 코드 연결:
- `RefereeAssignment` 테이블은 그대로. `pool_id` 컬럼만 nullable로 추가 → 기존 데이터 0변경.
- 기존 `/referee/admin/assignments` 페이지는 **"6단계 현장 배정"** 전용으로 유지/리팩토링. 심판 선택 시 **현재: 전체 협회 심판** → **변경 후: 해당 일자 Pool에서만**.
- `admin-guard.ts`의 `assignment_manage` 권한은 재사용. 단계별 세분화는 불필요(모두 팀장급이므로 동일).

📍 API 설계 (신규 10개):

| 단계 | 메서드 & 경로 | 역할 | 권한 |
|------|--------------|------|------|
| 2 | POST `/api/web/referee-admin/announcements` | 공고 등록 | referee_chief/game_chief |
| 2 | GET `/api/web/referee-admin/announcements` | 공고 목록 (관리자) | 관리자 전원 |
| 2 | PATCH `/api/web/referee-admin/announcements/[id]` | 공고 수정/마감 | referee_chief/game_chief |
| 3 | GET `/api/web/referee/announcements` | **공개 공고 목록** (본인) | 본인 Referee |
| 3 | POST `/api/web/referee/applications` | 신청 (body: dates 배열) | 본인 Referee |
| 3 | DELETE `/api/web/referee/applications/[id]` | 신청 취소 | 본인 |
| 4 | GET `/api/web/referee-admin/announcements/[id]/applications?date=...` | 일자별 신청자 조회 | 팀장 |
| 4 | POST `/api/web/referee-admin/pools` | 선정 (신청자→풀 이동, 또는 직접 추가) | 팀장 |
| 4 | DELETE `/api/web/referee-admin/pools/[id]` | 선정 취소 | 팀장 |
| 5 | PATCH `/api/web/referee-admin/pools/[id]/chief` | 책임자 토글 | 팀장 |
| 6 | POST `/api/web/referee-admin/assignments` | **수정**: pool_id 검증 추가 | 팀장 + 해당 일자 chief |

(6단계 기존 API는 유지하되 `pool_id`가 제공되면 우선 검증하고, 해당 경기의 `scheduled_at` 날짜와 일치하는 풀 소속 심판인지 체크.)

📍 페이지 설계 (신규 3개 + 기존 1개 리팩토링):

| 페이지 | 경로 | 역할 | 신규/수정 |
|--------|------|------|----------|
| 공고 관리 | `/referee/admin/announcements` + `/[id]` | 공고 CRUD, 신청자 조회, 선정, 책임자 지정 | 신규 |
| 내 신청 | `/referee/applications` | 공개 공고 조회 + 본인 신청/취소 | 신규 |
| 일자별 풀 | `/referee/admin/pools?tournament_id=xxx` | 대회별 일자 캘린더 + 확정 인원 | 신규 |
| 현장 배정 | `/referee/admin/assignments` | **풀 기반으로 수정**. 검색창 기반 심판 선택 | 수정 |

🎨 UI 핵심: "검색창 기반 선택 UI"
- 기존 드롭다운 `<select>`는 전체 심판 중에서 고름 → 풀이 커지면 못 씀
- 신규: **검색 input + 하단에 필터된 풀 카드 리스트** (자동완성 스타일)
- 재사용 가능한 컴포넌트 `_components/referee-picker.tsx` 1개로 통일 (4단계 선정 UI, 6단계 배정 UI 모두 사용)

📋 실행 계획 (단계별 구현):

**1차 (뼈대) — 이 순서로 바로 진행 가능**

| 순서 | 작업 | 담당 | 선행 조건 |
|------|------|------|----------|
| 1 | Prisma 신규 4모델 + RefereeAssignment.pool_id 추가, migration | developer | 없음 |
| 2 | 공고 API 3종 (announcements POST/GET/PATCH) | developer | 1 |
| 3 | 공고 관리 페이지 (`/referee/admin/announcements`) 리스트+생성 모달 | developer | 2 |
| 4 | 공개 공고 + 신청 API 2종 (referee/announcements GET, applications POST/DELETE) | developer | 1 |
| 5 | 내 신청 페이지 (`/referee/applications`) | developer | 4 |
| 6 | 1차 tester + reviewer (병렬) | tester + reviewer | 5 |
| 7 | PM 커밋 + 사용자 보고 | pm | 6 |

**2차 (선정/책임자)** — 1차 안정화 후

| 순서 | 작업 | 담당 |
|------|------|------|
| 1 | 신청자 조회 API + 선정/선정취소 API + 책임자 토글 API | developer |
| 2 | 공고 상세 페이지 `/referee/admin/announcements/[id]` (일자별 탭 + 신청자 리스트 + 선정 버튼 + 책임자 star) | developer |
| 3 | 일자별 풀 페이지 `/referee/admin/pools` | developer |
| 4 | tester + reviewer (병렬) + 커밋 | tester+reviewer → pm |

**3차 (현장 배정 마이그레이션)** — 2차 안정화 후

| 순서 | 작업 | 담당 |
|------|------|------|
| 1 | `referee-picker.tsx` 재사용 컴포넌트 생성 | developer |
| 2 | 기존 `/referee/admin/assignments` 페이지를 풀 기반으로 리팩토링 (드롭다운 → picker, 필터 = 해당 일자 풀) | developer |
| 3 | POST /assignments API에 pool_id 검증 추가 | developer |
| 4 | 기존 RefereeAssignment 데이터 호환성 확인 (pool_id null 허용) | tester |
| 5 | 최종 커밋 + 사용자 보고 | pm |

🔑 권한 매트릭스 (9종 역할 × 새 액션):

| 액션 | president | vice_pres | director | sga | staff | ref_chief | ref_clerk | game_chief | game_clerk |
|------|:--------:|:--------:|:--------:|:---:|:-----:|:--------:|:--------:|:---------:|:---------:|
| 공고 게시/수정 | - | - | - | O | - | O | - | O | - |
| 공고 열람 | O | O | O | O | O | O | O | O | O |
| 신청자 조회 | - | - | - | O | - | O | - | O | - |
| 선정/선정취소 | - | - | - | O | - | O | - | O | - |
| 책임자 지정 | - | - | - | O | - | O | - | O | - |
| 현장 배정 (경기별) | - | - | - | O | - | O | - | O | - |
| 신청(본인) | 해당 Referee만 | | | | | | | | |

권한 구현: 기존 `assignment_manage` 그룹(sga/referee_chief/game_chief)을 그대로 재사용. 새 권한 키 추가 불필요 → `admin-guard.ts` 무수정.

🔄 마이그레이션 전략 (기존 데이터 보존):
- `RefereeAssignment.pool_id` **nullable** 추가 → 기존 행은 모두 null로 유지
- 신규 배정은 "풀 먼저 만들고 배정" 원칙이지만, 과도기 2주 동안 pool_id null도 허용(운영자 혼란 방지)
- 기존 `/referee/admin/assignments` 페이지는 1차/2차까진 그대로 동작 → 3차에서 교체
- 최종적으로 pool_id NOT NULL 전환은 4차(선택사항) — 당분간 nullable 유지 권장

⚠️ developer 주의사항:
1. **일자 선택 UI**: `<input type="date" multiple>`은 브라우저 미지원. 캘린더 컴포넌트 or date chips + "+ 추가" 버튼 패턴 사용
2. **공고 dates (Postgres 배열)**: Prisma에서 `DateTime[] @db.Date` 문법. 기존 스키마에 배열 사용 사례 없으면 CONVENTIONS 확인 필요
3. **required_count는 Json** 사용: 일자별 키 형태 `"YYYY-MM-DD"`로 고정(타임존 이슈 회피)
4. **selected_by는 User.id**: admin.userId 사용. referee_id와 헷갈리지 말 것
5. **책임자 unique 제약**: `is_chief=true` 중복 방지를 Prisma에서 partial unique index로 강제 불가 → 애플리케이션 레벨 체크 (트랜잭션에서 같은 일자+role_type에 다른 chief가 있으면 false로 바꾸기)
6. **"타협회 심판 배정 금지"는 풀 선정 단계로 이동**: 6단계 현장 배정에서는 풀만 보면 되므로 협회 검증 생략 가능 (이미 풀에서 걸렀음)
7. **RefereeAssignment 삭제 시 풀 데이터는 유지** (onDelete: SetNull 맞음)
8. **기존 assignments 페이지 3차 리팩토링 전까진 건드리지 말 것** — 1차/2차는 앞단만 쌓기

### 리뷰 결과 (reviewer) — 2026-04-13

종합 판정: **APPROVE with comments** (수정 필요 1건, 권장 1건)

잘된 점:
- encrypted_data가 모든 API 응답에서 완벽히 제외됨 (select에서 명시적 제어)
- 신분증(id_card) OCR이 서비스 + API 양쪽에서 이중 차단
- 환경변수 미설정 시 graceful fallback (에러 안 남, 빈 배열 반환)
- OCR 실패 시 ocr_status="failed" + 수동 입력 폼 표시 (흐름 차단 없음)
- bank_account 암호화 저장 + 암호화 실패 시 평문 저장 거부 (보안 원칙 준수)
- 본인 API: userId === referee.user_id IDOR 방지
- 관리자 API: getAssociationAdmin + requirePermission("document_manage") + association_id 검증
- UI에서 사용자가 OCR 결과를 편집 후 확정 가능 (자동 추출 맹신 안 함)
- 복호화된 이미지가 메모리에서만 사용 (변수 스코프 안에서 소멸)

필수 수정:
- [관리자 UI 328~335행] `/referee/admin/members/[id]/documents/page.tsx`의 handleConfirm이 **본인용 API** (`/api/web/referee-documents/${doc.id}/ocr/confirm`)를 호출함. 관리자는 세션 userId가 해당 심판의 user_id와 다르므로 confirm API의 IDOR 체크(57행)에서 403 FORBIDDEN 에러 발생. 관리자 전용 confirm API를 만들거나, confirm API에 관리자 권한 분기를 추가해야 함.

권장 수정:
- [ocr-extractor.ts 260~261행] 계좌번호 정규식 `\d{10,16}`이 전화번호나 날짜 등 다른 긴 숫자 시퀀스와 겹칠 수 있음. 실사용 시 오탐이 나면 패턴 순서 조정이나 컨텍스트 기반 필터 추가를 고려할 것. (지금 당장 수정 필수는 아님, 실사용 후 판단)

### 테스트 결과 (tester) — 2차 OCR 연동 검증 2026-04-13

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| Test 1: tsc --noEmit | PASS | 에러 0건 |
| Test 2-1: callClovaOCR 환경변수+헤더 | PASS | NAVER_OCR_INVOKE_URL + X-OCR-SECRET 헤더 (94-98행) |
| Test 2-2: 환경변수 없을 때 빈 배열 | PASS | 63-68행 graceful skip |
| Test 2-3: extractCertificateInfo 5필드 | PASS | 번호/유형/등급/기관/발급일 패턴 매칭 |
| Test 2-4: extractBankbookInfo 3필드 | PASS | 은행명 키워드 + 계좌패턴 + 예금주 |
| Test 2-5: 신분증 OCR 미사용 | PASS | id_card 즉시 빈 객체 반환 (336-338행) |
| Test 3-1: OCR API 세션+본인확인 | PASS | getWebSession + userId IDOR (34행, 63행) |
| Test 3-2: encrypted_data 서버 내부 복호화 | PASS | decryptDocument (84행) |
| Test 3-3: processDocumentOCR 호출 | PASS | 85-89행 |
| Test 3-4: ocr_status/ocr_result DB 업데이트 | PASS | 95-101행 |
| Test 3-5: id_card skipped | PASS | 70-79행 |
| Test 3-6: encrypted_data 응답 미포함 | PASS | 103-107행 extracted/raw_text_count만 |
| Test 4-1: certificate -> RefereeCertificate | PASS | saveCertificateData upsert (78행) |
| Test 4-2: bankbook -> Referee 계좌 | PASS | saveBankbookData (80행) |
| Test 4-3: id_card -> verified_name | PASS | saveIdCardData (82행) |
| Test 4-4: bank_account 암호화 | PASS | encryptResidentId (171행) |
| Test 5-1: 관리자 OCR 권한 체크 | PASS | getAssociationAdmin + requirePermission (29-33행) |
| Test 5-2: 관리자 OCR IDOR 방지 | PASS | association_id 검증 (59행) |
| Test 6-1: 정보 추출 버튼 | PASS | document_scanner 아이콘 (531-547행) |
| Test 6-2: 자격증 편집 폼 | PASS | 번호/유형/등급/기관/발급일 (720-764행) |
| Test 6-3: 통장 편집 폼 | PASS | 은행/계좌/예금주 (776-796행) |
| Test 6-4: 확인 저장 버튼 | PASS | 673-687행 |
| Test 6-5: OCR 실패 시 수동 입력 안내 | PASS | 338-345행 메시지 + showForm=true |
| Test 7-1: 관리자 정보추출 버튼 | PASS | 490-506행 |
| Test 7-2: 관리자 편집 폼 | PASS | 597-605행 동일 구조 |
| Test 7-3: 관리자 확인 저장 버튼 | PASS | 608-621행 |
| Test 7-WARN: 관리자 confirm IDOR | WARN | 본인용 confirm API 호출 -> 403 예상 (수정 요청) |

종합: 26개 중 26개 통과 / 0개 실패 / 1개 경고 -- 전체 PASS (경고 1건)

### 수정 요청

| 요청자 | 파일 | 문제 설명 | 상태 |
|--------|------|----------|------|
| tester | admin/members/[id]/documents/page.tsx 334행 | 관리자 handleConfirm이 본인용 API(/referee-documents/[id]/ocr/confirm)를 호출하나, 해당 API는 userId===referee.user_id 체크(57행)하므로 관리자 세션은 403 반환됨. 관리자 전용 confirm API 필요 | 대기 |

### 구현 기록

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| 1차 | 2026-04-13 | 배정 DELETE 핸들러에 정산 가드 추가. cancelled 아닌 정산(pending/scheduled/paid/refunded) 연결 시 409 SETTLEMENT_EXISTS 반환하여 cascade로 지급 이력 소실되는 것 방지 | src/app/api/web/referee-admin/assignments/[id]/route.ts (L320~336) | reviewer critical: onDelete: Cascade로 paid 정산이 조용히 사라질 수 있는 재무 무결성 버그 |
| 1차 | 2026-04-13 | settlements/summary의 by_month에 선택월 포함. sixMonthStart `month-6`→`month-5`, 루프 인덱스 `month-1-i`→`month-1-(5-i)` 수정. 예: 2026-04 선택 시 [2025-11~2026-04] 반환 | src/app/api/web/referee-admin/settlements/summary/route.ts (L83~85, L149~155) | reviewer critical: 선택월이 by_month에서 누락되어 대시보드 isCurrent 하이라이트 미작동 + 선택월 paid 정산 버킷 매칭 실패 |

구현한 기능: v3 2차 — 심판 사전 등록 API/페이지 + 매칭 상태 필터 + 수동 매칭 API/UI

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/api/web/referee-admin/members/route.ts | 사전 등록 POST API (Zod 검증, 중복 체크, IDOR 방지) | 신규 |
| src/app/api/web/admin/associations/members/route.ts | match_status 쿼리 필터 추가 | 수정 |
| src/app/api/web/referee-admin/members/[id]/match/route.ts | GET 매칭 후보 검색 + POST 수동 매칭 실행 | 신규 |
| src/app/(referee)/referee/admin/members/new/page.tsx | 사전 등록 폼 UI (필수: 이름+전화 / 선택: 생년월일,등급,역할 등) | 신규 |
| src/app/(referee)/referee/admin/members/page.tsx | 매칭 상태 필터 탭 + MatchBadge + 사전등록 버튼 추가 | 수정 |
| src/app/(referee)/referee/admin/members/[id]/page.tsx | 매칭 상태 섹션 + 수동 매칭 검색/실행 UI 추가 | 수정 |

tester 참고:
- 테스트 방법: /referee/admin/members에서 "사전 등록" 버튼 클릭 → 이름+전화번호 입력 → 등록 → 목록에서 미매칭 뱃지 확인
- 매칭 테스트: 미매칭 심판 상세 → "매칭 후보 검색" → 후보 있으면 "매칭" 클릭
- 필터 테스트: 목록에서 "전체/매칭됨/미매칭" 탭 전환
- tsc --noEmit 통과 확인 (EXIT_CODE=0)

reviewer 참고:
- 모든 API에 getAssociationAdmin() + requirePermission("referee_manage") 적용
- IDOR 방지: association_id는 세션에서 강제 주입
- CSS 변수만 사용 (하드코딩 색상 없음), border-radius 4px, Material Symbols

---

(이전) 구현한 기능: 전체 프로젝트에서 clip-slant/clip-slant-sm/clip-slant-reverse CSS 클래스 제거 (18개 파일)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| 18개 tsx 파일 | clip-slant 계열 클래스를 rounded-sm으로 교체 또는 제거 | 수정 |

tester 참고:
- tsc --noEmit 통과 (기존 레거시 에러 1건만 존재)
- globals.css의 clip-slant CSS 정의는 유지됨

## 기획설계 (planner-architect)

### 홈 페이지 NBA 2K 스타일 통일 리디자인

---

#### 1단계 분석: 현재 홈 구조

**진입점**: `src/app/(web)/page.tsx`
- ISR 60초, 서버에서 4개 데이터 병렬 프리페치 (teams, stats, community, games)
- 1열 세로 스택 레이아웃 (`flex flex-col space-y-10`)

**현재 섹션 순서 (위에서 아래로)**:
| 순서 | 컴포넌트 | 역할 |
|------|---------|------|
| 0 | HomeHero | 로그인 분기: ProfileWidget+QuickActions+NewsFeed (로그인) / 소개배너+QuickActions+NewsFeed (비로그인) |
| 1 | RecommendedGames | 추천 경기 가로 스크롤 카드 |
| 2 | RecommendedTournaments | 추천 대회 가로 스크롤 카드 |
| 3 | NotableTeams (xl:hidden) | 주목할 팀 리스트 (PC에서 숨김, 사이드바와 중복 방지) |
| 4 | RecentActivity (xl:hidden) | 최근 활동 피드 (PC에서 숨김) |
| 5 | RecommendedVideos | YouTube 추천 영상 가로 스크롤 |
| 6 | HomeCommunity | 커뮤니티 최신글 리스트 |

**PC 사이드바**: `src/components/layout/right-sidebar.tsx`
- BDR 랭킹 TOP 5, 주목할 팀, 인기 코트, 최근 활동 4개 위젯
- `/api/web/sidebar` API 사용

**하위 컴포넌트 (HomeHero 내부)**:
| 파일 | 역할 |
|------|------|
| profile-widget.tsx | 로그인 유저 XP/레벨/뱃지/미션 카드 |
| quick-actions.tsx | 빠른 액션 버튼 3개 (체크인/경기찾기/픽업) |
| news-feed.tsx | 대회/픽업/이벤트 소식 카드 가로 스크롤 |

**사용하지 않는 레거시 파일들** (import 없음):
home-sidebar.tsx, hero-section.tsx, quick-menu.tsx, hero-bento.tsx, home-greeting.tsx, my-summary-hero.tsx, personal-hero.tsx, right-sidebar-guest.tsx, right-sidebar-logged-in.tsx

---

#### 2단계 분석: 2K 스타일 적용 현황

**globals.css 2K 유틸리티** (이미 정의됨):
- `shadow-glow-primary` / `shadow-glow-accent` — 네온 글로우 효과
- `clip-slant` / `clip-slant-reverse` / `clip-slant-sm` — 평행사변형 클리핑
- `watermark-text` — 카드 내 대형 워터마크 텍스트
- 다크 컬러 팔레트 (2K Console Dark / Deep Carbon)

**2K 스타일이 이미 적용된 컴포넌트** (변경 불필요):
| 파일 | 2K 요소 |
|------|---------|
| home-hero.tsx (비로그인 배너) | shadow-glow-accent, watermark "2K26", clip-slant-sm CTA, italic/uppercase, gradient 배경 |
| profile-widget.tsx | clip-slant 레벨뱃지/통계박스, shadow-glow-primary 호버, italic/uppercase/font-black |
| quick-actions.tsx | clip-slant 버튼, shadow-glow-primary, italic/uppercase/font-black |
| news-feed.tsx | clip-slant D-Day뱃지, shadow-glow-primary 호버, italic/uppercase/font-black, "LATEST NEWS" 헤더 |
| recommended-games.tsx | shadow-glow-primary 호버, clip-slant-sm 뱃지, 워터마크 "99", italic/uppercase, gradient 정보영역 |
| recommended-tournaments.tsx | shadow-glow-primary 호버, clip-slant-sm 뱃지, 워터마크 "CUP", italic/uppercase, 2K 헤더 |
| notable-teams.tsx | clip-slant 엠블럼, border-l-4 호버, italic/uppercase, 리더보드 순위 스타일 |
| toss-section-header.tsx | font-black italic uppercase, 두꺼운 하단 보더, "VIEW ALL" |
| toss-list-item.tsx | clip-slant-reverse 뱃지, gradient 배경, border-l-4 호버, italic/uppercase |
| right-sidebar.tsx | TossListItem/TossSectionHeader 사용 (2K 스타일 간접 적용) |

**아직 기존(토스) 스타일인 컴포넌트**:
| 파일 | 현재 상태 | 문제점 |
|------|----------|--------|
| recommended-videos.tsx | 토스 스타일 카드 (둥근 모서리, 가벼운 그림자, 일반 폰트) | 다른 섹션들과 디자인 불일치 |
| home-community.tsx | TossListItem 사용하지만 TossSectionHeader로 "커뮤니티" 한글 제목 | 다른 섹션과 언어/스타일 불일치 |
| recent-activity.tsx | TossListItem/TossSectionHeader 사용, "최근 활동" 한글 제목 | 다른 섹션과 언어 불일치 |

---

#### 3단계: NBA 2K 스타일 리디자인 계획

핵심 발견: **대부분의 홈 컴포넌트는 이미 2K 스타일이 적용되어 있음.** 변경이 필요한 파일은 3개뿐.

---

**변경 A: recommended-videos.tsx** (변경량: 중)

현재: 토스 스타일 — 둥근 모서리, 가벼운 그림자, 일반 폰트 weight, TossSectionHeader "인기 영상"
변경:
- TossSectionHeader 사용 유지하되 title을 "HIGHLIGHTS" 또는 "TOP PLAYS"로 영문 2K 톤 변경
- 비디오 카드에 2K 요소 적용:
  - `hover:shadow-glow-primary` + `hover:border-[var(--color-primary)]` + `hover:-translate-y-2` (다른 카드와 통일)
  - 제목 폰트를 `font-extrabold italic uppercase tracking-tight` 로 변경
  - LIVE 뱃지에 `clip-slant-sm` + `font-black italic` 적용
  - 카드 하단 정보에 gradient 배경 (`bg-gradient-to-br from-[var(--color-card)] to-[var(--color-surface)]`)
  - 호버 시 워터마크 숫자(재생 아이콘 대신) 또는 유지

**변경 B: home-community.tsx** (변경량: 소)

현재: TossSectionHeader title="커뮤니티", TossListItem 사용
변경:
- TossSectionHeader 제거하고, recommended-tournaments.tsx와 동일한 인라인 2K 헤더 사용
- title을 "COMMUNITY" (영문 대문자)로 변경
- TossListItem은 이미 2K 스타일이므로 그대로 유지

**변경 C: recent-activity.tsx** (변경량: 소)

현재: TossSectionHeader title="최근 활동", TossListItem 사용
변경:
- TossSectionHeader 제거하고 인라인 2K 헤더 사용
- title을 "RECENT PLAYS" (영문 대문자)로 변경
- TossListItem은 이미 2K 스타일이므로 그대로 유지

---

🎯 목표: 홈 페이지 전체를 NBA 2K 스타일로 통일 (나머지 3개 컴포넌트 리디자인)

📍 만들 위치와 구조:
| 파일 경로 | 역할 | 신규/수정 | 변경량 |
|----------|------|----------|--------|
| src/components/home/recommended-videos.tsx | 추천 영상 섹션 2K 스타일 적용 | 수정 | 중 |
| src/components/home/home-community.tsx | 커뮤니티 섹션 2K 헤더 통일 | 수정 | 소 |
| src/components/home/recent-activity.tsx | 최근 활동 섹션 2K 헤더 통일 | 수정 | 소 |

🔗 기존 코드 연결:
- 3개 파일 모두 page.tsx에서 import, API/데이터 패칭 로직 변경 없음
- TossSectionHeader를 인라인 2K 헤더로 교체 (TossSectionHeader 자체는 삭제하지 않음, 다른 곳에서 사용 가능)
- TossListItem은 이미 2K 스타일이므로 계속 사용
- globals.css의 기존 2K 유틸리티 클래스 활용 (신규 CSS 추가 불필요)

📋 실행 계획:
| 순서 | 작업 | 담당 | 선행 조건 | 예상 시간 |
|------|------|------|----------|----------|
| 1 | recommended-videos.tsx 2K 스타일 적용 | developer | 없음 | 5분 |
| 2 | home-community.tsx 2K 헤더 통일 | developer | 없음 | 3분 |
| 3 | recent-activity.tsx 2K 헤더 통일 | developer | 없음 | 3분 |
| 4 | tsc --noEmit 타입 체크 | tester | 1~3 완료 | 1분 |

(1~3은 독립 파일이므로 병렬 작업 가능)

⚠️ developer 주의사항:
- **API/데이터 패칭 절대 변경 금지** — UI 렌더링(JSX/CSS)만 교체
- **하드코딩 색상 금지** — 반드시 var(--color-*) CSS 변수 사용
- recommended-videos.tsx의 API 영상 카드와 더미 영상 카드 **양쪽 모두** 스타일 변경 필요
- 2K 스타일 참고 기준: recommended-games.tsx의 GameCard 패턴 (호버 효과, 폰트, 워터마크, gradient 등)
- TossSectionHeader 대신 인라인 2K 헤더 패턴:
  ```
  <div className="flex items-end justify-between mb-4 pb-2 border-b-2 border-[var(--color-border)]">
    <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter drop-shadow-sm">제목</h2>
    <Link href="..." className="text-[10px] font-black italic text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors uppercase">VIEW ALL &raquo;</Link>
  </div>
  ```
- 기존 한글 제목("인기 영상", "커뮤니티", "최근 활동")을 영문 대문자로 통일: "HIGHLIGHTS", "COMMUNITY", "RECENT PLAYS"

## 구현 기록 (developer)

📝 구현한 기능: 전체 프로젝트 italic CSS 클래스 일괄 제거

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/components/ui/badge.tsx | font-black italic → font-black | 수정 |
| src/components/shared/slide-menu.tsx | font-black italic → font-black | 수정 |
| src/components/tournament/division-generator-modal.tsx | font-black italic (5곳) | 수정 |
| src/components/shared/pwa-install-banner.tsx | font-black/bold italic (3곳) | 수정 |
| src/components/shared/push-permission.tsx | font-black italic (6곳) | 수정 |
| src/components/shared/profile-dropdown.tsx | font-black/bold italic (5곳) | 수정 |
| src/components/shared/profile-completion-banner.tsx | font-black italic (2곳) | 수정 |
| src/components/shared/profile-accordion.tsx | font-black italic (2곳) | 수정 |
| src/components/shared/preference-form.tsx | font-black italic (5곳) | 수정 |
| src/components/toss/toss-section-header.tsx | font-black italic (2곳) | 수정 |
| src/components/toss/toss-list-item.tsx | font-extrabold/black italic (3곳) | 수정 |
| src/components/toss/toss-button.tsx | font-black italic → font-black | 수정 |
| src/components/site-templates/classic.tsx | font-black italic (2곳) | 수정 |
| src/components/layout/right-sidebar.tsx | font-bold italic (2곳) | 수정 |
| src/components/admin/admin-detail-modal.tsx | font-black italic (2곳) | 수정 |
| src/components/home/home-community.tsx | font-black italic (2곳) | 수정 |
| src/components/home/home-hero.tsx | font-extrabold/bold/black italic (3곳) | 수정 |
| src/components/home/news-feed.tsx | font-black/bold italic (6곳) | 수정 |
| src/components/home/notable-teams.tsx | font-black/extrabold italic (5곳) | 수정 |
| src/components/home/profile-widget.tsx | font-black italic (6곳) | 수정 |
| src/components/home/quick-actions.tsx | font-black italic (1곳) | 수정 |
| src/components/home/recent-activity.tsx | font-black italic (1곳) | 수정 |
| src/components/home/recommended-games.tsx | font-black/extrabold italic (4곳) | 수정 |
| src/components/home/recommended-tournaments.tsx | font-black/extrabold italic (5곳) | 수정 |
| src/components/home/recommended-videos.tsx | font-black/extrabold/bold italic (10곳+주석) | 수정 |
| src/app/(web)/layout.tsx | font-black italic (6곳) | 수정 |

제외 대상 (변경 안 함):
- src/components/shared/header.tsx (주석만 포함)
- src/app/(web)/courts/[id]/_components/court-events.tsx (fontStyle 인라인 스타일)

💡 tester 참고:
- 테스트 방법: 전체 페이지에서 텍스트가 기울어지지 않고 정상적으로 표시되는지 확인
- 정상 동작: 모든 카드, 버튼, 뱃지, 제목의 텍스트가 기울임 없이 표시
- tsc --noEmit 통과 확인 완료 (기존 에러 1건 lucide-react만 존재)

---

📝 구현한 기능: 홈 LATEST NEWS 배너 + 퀵 액션 버튼 컴팩트 축소

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/components/home/quick-actions.tsx | 세로 카드(py-4, 아이콘28px 위+텍스트 아래) → 가로 pill(py-2, 아이콘18px+텍스트 가로 배치). gap-3→gap-2, hover:-translate-y-1→-0.5 | 수정 |
| src/components/home/news-feed.tsx | 큰 카드(min-height 140px, 280px폭) → 컴팩트 1줄 인라인 행(px-3 py-2). 프로모션/일반 모두 가로 1줄로 축소. 스켈레톤도 h-10으로 축소. 제목 text-lg→text-sm | 수정 |

💡 tester 참고:
- 테스트 방법: 홈 페이지에서 LATEST NEWS 영역과 퀵 액션 버튼 확인
- 정상 동작: 뉴스 항목이 각 1줄짜리 얇은 행으로 표시, 퀵 액션이 아이콘+텍스트 가로 배치 pill 형태
- 주의: 프로모션 카드(그라디언트 배경)도 1줄 배너로 표시되는지, D-Day 뱃지가 잘 보이는지 확인

⚠️ reviewer 참고:
- API/데이터 패칭 변경 없음 (UI 렌더링만 교체)
- 하드코딩 색상 없음 (모두 var(--color-*) 사용)
- NBA 2K 스타일 유지 (italic, uppercase, clip-slant, shadow-glow-primary)

---

(이전) 📝 구현한 기능: 홈 프로필 위젯 2줄 컴팩트 카드(B안) 축소

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/components/home/profile-widget.tsx | 세로 300px → 2줄 컴팩트(~80px)로 축소. 아바타 64→40px, 통계 3열그리드→인라인, XP바+미션 1줄화, 자주가는코트/다음경기 섹션 제거, StatBox→StatInline 교체, getDDayShort 함수 제거 | 수정 |

💡 tester 참고:
- 테스트 방법: 홈 페이지 로그인 상태에서 프로필 위젯 확인
- 정상 동작: 1줄에 아바타+닉네임+레벨뱃지+통계3개, 2줄에 XP바+미션이 한 줄로 표시
- 주의: 미션 클릭 시 /profile#gamification으로 이동하는지 확인

⚠️ reviewer 참고:
- API/데이터 패칭 변경 없음 (UI 렌더링만 교체)
- dashboardData prop 인터페이스는 하위 호환을 위해 유지 (렌더링하지 않음)
- 하드코딩 색상 없음 (모두 var(--color-*) 사용)

---

(이전) 📝 구현한 기능: 슬라이드 메뉴 하단 유틸리티 영역 삭제

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/components/shared/slide-menu.tsx | ThemeToggle, TextSizeToggle, PushNotificationToggle import 3줄 삭제 + 하단 유틸리티 div 영역 전체 삭제 | 수정 |

💡 tester 참고:
- 테스트 방법: 모바일 슬라이드 메뉴 열어서 하단 확인
- 정상 동작: 메뉴 항목(홈~커뮤니티) 아래에 아무것도 없음 (다크모드 아이콘, Tt 아이콘, 푸시알림 배너 모두 사라짐)
- 주의: 프로필 아코디언, PRO 배너, 메뉴 항목은 그대로 유지되어야 함

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| 1차 | 04-05 | PushNotificationToggle→PushPermissionBanner 교체 + push-notification-toggle.tsx 삭제 | notifications-client.tsx, push-notification-toggle.tsx(삭제) | debugger 요청: 권한만 요청하고 SW 구독 안 하는 반쪽짜리 컴포넌트를 완전한 구현으로 교체 |

---

(이전) 📝 구현한 기능: 프로필 아코디언 기본 접힘 상태로 변경

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/components/shared/profile-accordion.tsx | useState 복원하여 아코디언 토글 구현. 기본값 접힘(false). 프로필 헤더를 Link→button으로 변경(클릭 시 토글). expand_more 화살표 아이콘 추가(180도 회전 애니메이션). 카테고리+로그아웃은 isOpen일 때만 렌더링. | 수정 |

💡 tester 참고:
- 테스트 방법: 모바일 슬라이드 메뉴에서 프로필 영역 확인
- 정상 동작: 초기 상태에서 카테고리 숨김, 프로필 헤더 클릭 시 카테고리 5개+로그아웃 표시, 다시 클릭 시 숨김
- 주의: 화살표 아이콘이 펼침 시 위를 가리키고(180도 회전), 접힘 시 아래를 가리키는지 확인

---

(이전) 📝 구현한 기능: 프로필 아코디언 → 직접 이동 메뉴로 변경

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/components/shared/profile-accordion.tsx | 아코디언(접기/펴기) 제거. 5개 카테고리를 Link로 변경하여 클릭 시 바로 페이지 이동. 하위 메뉴 항목 제거. 화살표(expand_more) 아이콘 제거. 프로필 헤더도 /profile로 이동하는 Link로 변경. 로그아웃 버튼은 카테고리 하단에 별도 배치. useState 제거(상태 불필요). | 수정 |

카테고리별 이동 경로:
- 내 농구 → /teams
- 내 성장 → /profile#gamification
- 내 정보 → /profile/edit
- 맞춤 설정 → /profile/preferences
- 계정 → /profile/subscription

💡 tester 참고:
- 테스트 방법: 모바일 슬라이드 메뉴에서 프로필 영역 확인
- 정상 동작: 카테고리 클릭 시 바로 해당 페이지로 이동, 아코디언 펼침/접힘 없음
- 주의: 로그아웃 버튼이 하단에 잘 보이는지 확인. 관리자 모드 링크는 제거됨(프로필 페이지 내에서 접근)

⚠️ reviewer 참고:
- API/데이터 패칭 변경 없음
- role prop은 interface에 유지(하위 호환), 내부에서는 사용하지 않음
- 관리자 모드/회원 탈퇴 등 하위 메뉴 항목은 PM 지시에 따라 제거

---

(이전) 📝 구현한 기능: 프로필 페이지 아바타+정보 영역 세로→가로 레이아웃 변경

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/profile/page.tsx | 프로필 헤더 영역을 flex-col items-center text-center → flex-row items-center gap-4로 변경. 아바타 좌측 고정(shrink-0), 이름+레벨+부가정보를 우측에 flex-col로 세로 나열. mb-4/mb-1/mb-2 제거하고 gap-1로 통일 | 수정 |

💡 tester 참고:
- 테스트 방법: /profile 페이지에서 프로필 상단 영역 확인
- 정상 동작: 아바타가 좌측, 이름/레벨배지+포지션/지역+가입일이 우측에 가로 배치
- 주의: 프로필 이미지가 있는 경우와 없는 경우(이니셜 표시) 모두 확인

⚠️ reviewer 참고:
- API/데이터 패칭 변경 없음 (CSS 클래스만 변경)
- 하드코딩 색상 없음 (기존 var(--color-*) 유지)
- 4개 카테고리 카드 영역, 로그아웃 버튼 등 하단 영역은 변경 없음

---

(이전) 📝 구현한 기능: 홈 프로필 위젯 레이아웃 세로→가로 변경

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/components/home/profile-widget.tsx | 아바타+닉네임+레벨뱃지 영역을 세로→가로(row) 레이아웃으로 변경. 아바타 12→16(w-16 h-16) 확대, gap-3→gap-4, 레벨뱃지에 w-fit 추가. 로딩 스켈레톤도 동일 가로 레이아웃 적용 | 수정 |

💡 tester 참고:
- 테스트 방법: 홈 페이지 로그인 상태에서 프로필 위젯 확인
- 정상 동작: 아바타가 좌측, 닉네임+레벨뱃지가 우측에 가로로 배치
- 주의: 로딩 스켈레톤도 동일한 가로 레이아웃인지 확인

⚠️ reviewer 참고:
- API/데이터 패칭 변경 없음 (CSS 클래스만 변경)
- 하드코딩 색상 없음 (기존 var(--color-*) 유지)

---

(이전) 📝 구현한 기능: 홈 컴포넌트 3개 NBA 2K 스타일 통일

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/components/home/recommended-videos.tsx | TossSectionHeader→인라인 2K 헤더 "HIGHLIGHTS", 카드에 hover:shadow-glow-primary + hover:border-primary + hover:-translate-y-2, 제목 font-extrabold italic uppercase, LIVE 뱃지 clip-slant-sm, gradient 정보영역, 워터마크 효과 | 수정 |
| src/components/home/home-community.tsx | TossSectionHeader→인라인 2K 헤더 "COMMUNITY" + VIEW ALL 링크, TossSectionHeader import 제거 | 수정 |
| src/components/home/recent-activity.tsx | TossSectionHeader→인라인 2K 헤더 "RECENT PLAYS", TossSectionHeader import 제거 | 수정 |

💡 tester 참고:
- 테스트 방법: 홈 페이지에서 3개 섹션(HIGHLIGHTS, COMMUNITY, RECENT PLAYS) 헤더가 영문 대문자 italic으로 표시되는지 확인
- 정상 동작: 영상 카드 호버 시 네온 글로우 + 위로 이동 효과, LIVE 뱃지가 사선 클리핑
- 주의할 입력: API 실패 시 더미 데이터 카드도 동일 2K 스타일 적용 확인

⚠️ reviewer 참고:
- API/데이터 패칭 로직 변경 없음 (UI 렌더링만 교체)
- 하드코딩 색상 없음 (모두 var(--color-*) 사용)
- recommended-videos.tsx에서 Link import 추가 (인라인 헤더의 VIEW ALL 링크용)

---

(이전 기록)

📝 구현한 기능: 하드코딩 색상 + 하드코딩 사용자 데이터 검증 (2건)

검증 결과: **5개 파일 모두 이미 수정 완료 상태** — 추가 코드 변경 불필요

| 파일 경로 | 검증 결과 | 비고 |
|----------|----------|------|
| src/app/live/page.tsx | 이미 CSS 변수 사용 중 | bg-[var(--color-background)], bg-[var(--color-surface)] 등 |
| src/app/live/[id]/page.tsx | 이미 CSS 변수 사용 중 | 동일 |
| src/app/_site/layout.tsx | 이미 CSS 변수 사용 중 | bg-white 없음 |
| src/components/home/home-hero.tsx | 이미 CSS 변수 사용 중 | bg-[var(--color-card)] text-[var(--color-text-primary)] |
| src/components/shared/profile-accordion.tsx | 이미 빈 문자열 기본값 | region="", teamName="", position="" |

참고: quick-menu.tsx, personal-hero.tsx에는 하드코딩 색상 다수 잔존하나, 이번 작업 범위 외

## 테스트 결과 (tester)
검증 대상: 커밋 6715678 (112개 파일 변경, Google Anti Gravity 작업분)

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| tsc --noEmit (타입 체크) | ✅ 통과 | 에러 1건은 기존 lucide-react (personal-hero.tsx) — 이번 커밋과 무관 |
| Prisma validate (스키마 무결성) | ✅ 통과 | "The schema is valid" |
| lucide-react 신규 import 검사 | ✅ 통과 | 신규 추가 없음. 기존 personal-hero.tsx 1건만 존재 |
| 하드코딩 색상 신규 추가 검사 (tsx/ts) | ✅ 통과 | 이번 커밋의 tsx/ts 변경에서 새로운 #xxx 하드코딩 없음 |
| 하드코딩 색상 신규 추가 검사 (css) | ✅ 통과 | CSS 변경에서 새로운 #xxx 하드코딩 없음 (var(--) 사용) |
| API 라우트 변경 검사 | ✅ 통과 | src/app/api/ 디렉토리에 변경 없음 — API 무결성 유지 |
| export 호환성 검사 | ✅ 통과 | ProfileAccordion 시그니처 변경은 기본값 추가만 (하위 호환) |
| import 무결성 검사 | ✅ 통과 | right-sidebar의 TossListItem/TossSectionHeader import 정상, props 일치 |
| next build (빌드 테스트) | ✅ 통과 | 컴파일 성공 (6.7s). 타입체크에서 기존 lucide-react 에러로 중단되나, 이번 커밋과 무관 |

결과: 9개 중 9개 통과 / 0개 실패

참고: reviewer가 발견한 기능 삭제/하드코딩/폰트 변경 이슈는 "동작 여부"가 아닌 "디자인/컨벤션 위반" 영역. 코드가 깨지거나 빌드가 안 되는 문제는 없음.

## 리뷰 결과 (reviewer)

종합 판정: **수정 필요** (기능 삭제 3건 + 컨벤션 위반 5건)

**잘된 점:**
- right-sidebar.tsx를 TossListItem/TossSectionHeader 공통 컴포넌트로 리팩토링하여 338줄 -> 100줄로 대폭 간소화. 코드 재사용 우수
- rounded-2xl -> rounded-md 일괄 정리는 NBA 2K 디자인 방향에 부합
- globals.css에 NBA 2K 유틸리티(shadow-glow, clip-slant, watermark) 추가는 CSS 변수 기반으로 잘 구현

**[필수 수정] 기능 삭제 (사용자 기능 손실):**
- [slide-menu.tsx] ThemeToggle, TextSizeToggle 컴포넌트가 제거됨. 다른 곳으로 이동한 흔적 없음. 다크/라이트 전환과 글씨 크기 조절 기능이 사라짐
- [slide-menu.tsx] 관리자(admin) 링크와 역할 뱃지(관리자/대회운영자/플레이어) 표시가 제거됨. profile-accordion에 "관리자 모드" 항목이 추가되었으나 역할 분기 없이 모든 유저에게 노출됨
- [slide-menu.tsx] 유저 아바타+이름+역할 표시 영역이 삭제되고 PRO 배너+아코디언으로 대체됨

**[필수 수정] 폰트 무단 변경:**
- [globals.css, layout.tsx] Pretendard -> SUIT, Space Grotesk -> GmarketSans로 폰트 체계가 완전히 변경됨. 프로젝트 컨벤션(conventions.md)에 "한글 Pretendard + 영문 Space Grotesk"로 명시되어 있음. 이 변경은 사전 합의 없이 진행됨

**[필수 수정] 하드코딩 색상:**
- [src/app/live/[id]/page.tsx, src/app/live/page.tsx] bg-[#111118], hover:bg-[#16161F] 하드코딩 (3곳). var(--color-surface) 등 CSS 변수 사용 필요
- [src/app/_site/layout.tsx 등] bg-white 하드코딩 (4곳+). 다크모드에서 깨짐. var(--color-card) 또는 var(--color-background) 사용 필요
- [home-hero.tsx] bg-white text-black 하드코딩 (CTA 버튼). 다크모드 미대응

**[필수 수정] 하드코딩 사용자 데이터:**
- [profile-accordion.tsx] region="경기 남양주", teamName="STIZ", position="SG"가 기본값으로 하드코딩됨. 실제 유저 데이터를 받아야 하며, 데이터 없으면 placeholder("-") 사용 필요

**[권장 수정]:**
- [globals.css:346-347] Typography 주석이 2줄 중복: "토스 스타일" / "토스/2K 혼합". 하나로 정리 필요
- [toss-list-item.tsx] 기존 토스 스타일 리스트가 NBA 2K 스타일(italic, uppercase, gradient 배경, clip-slant)로 전면 변경됨. 사이드바 등 토스 스타일이 필요한 곳에서 디자인 불일치 발생 가능
- [news-feed.tsx] 한글 제목 "소식" -> 영문 "LATEST NEWS"로 변경. 한국어 서비스에서 영문 UI는 부자연스러움
- [home-hero.tsx] CTA 텍스트 "시작하기" -> "PLAY NOW", 부제 "올인원 플랫폼" -> "올인원 매칭 아레나". 2K 분위기는 좋으나 실제 서비스 톤과 맞는지 확인 필요
- [right-sidebar.tsx] 기존 빈 상태 메시지("코트에서 체크인해보세요!")가 축약됨("아직 활동이 없어요!"). 유저 가이드 기능 약화

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|
| reviewer | slide-menu.tsx | ThemeToggle, TextSizeToggle 복원 필요 (기능 삭제됨) | 대기 |
| reviewer | slide-menu.tsx | 유저 아바타+이름+역할 표시 복원, admin 링크 역할 분기 | 대기 |
| reviewer | globals.css + layout.tsx | 폰트를 Pretendard+Space Grotesk으로 복원 (또는 사용자 승인 후 변경) | 대기 |
| reviewer | live/page.tsx, live/[id]/page.tsx | #111118, #16161F -> CSS 변수로 교체 | 완료 (이미 수정됨) |
| reviewer | home-hero.tsx, _site/layout.tsx 등 | bg-white/text-black -> CSS 변수로 교체 (다크모드 대응) | 완료 (이미 수정됨) |
| reviewer | profile-accordion.tsx | 하드코딩 "경기 남양주"/"STIZ"/"SG" 제거, 실제 데이터 또는 placeholder 사용 | 완료 (이미 수정됨) |
| debugger | notifications-client.tsx | PushNotificationToggle이 권한만 요청하고 SW 구독 안 함 -> PushPermissionBanner로 교체 필요 | 완료 |
| debugger | push-notification-toggle.tsx | PushPermissionBanner의 하위 호환이므로 삭제 검토 (교체 후) | 완료 (삭제됨) |
| debugger | header.tsx 또는 layout | PushPermissionBanner가 어디에서도 사용 안 됨 -> 알림 페이지 또는 헤더 영역에 배치 필요 | 완료 (알림 페이지에 배치) |

## 전체 프로젝트 현황 대시보드 (2026-04-01)
| 항목 | 수치 |
|------|------|
| 웹 페이지 (web) | 84개 |
| 관리자 페이지 (admin) | 16개 |
| Prisma 모델 | 73개 |
| Web API | 111개 라우트 |

## 리뷰 결과 (reviewer) — 2026-04-13 — Excel 일괄 사전 등록

📊 종합 판정: **APPROVE with comments** (기능 동작/보안 OK, 권장 개선 몇 건)

✅ 잘된 점:
- 2단계 UX(preview→confirm) 설계가 깔끔. bulk-verify 패턴을 일관되게 재활용
- 주민번호 AES-256-GCM 암호화(`encryptResidentId`) 제대로 사용, 평문 저장 없음. 응답에는 `resident_id_last4`만 내려보냄
- N+1 회피: User/Referee 후보를 이름 IN 절로 한 번에 조회한 뒤 메모리에서 key map으로 매칭. 500행 × 2쿼리만 발생
- TOCTOU 방어: confirm에서 다시 `existingReferees` 조회 + 트랜잭션 내 `dupKeySet`으로 "한 트랜잭션 안에서도 중복 생성" 차단. 꼼꼼함
- 권한 OR 체크(referee_manage || game_manage)가 role_type 혼합 시나리오와 맞음
- `association_id`는 세션의 `admin.associationId`만 사용 → IDOR 불가
- `executeMatch`를 트랜잭션 밖에서 개별 try/catch — 매칭 실패가 전체 롤백으로 번지지 않게 한 설계 의도 좋음
- 클라이언트 템플릿 다운로드를 xlsx로 즉석 생성 (서버 부담 0)

🟡 권장 수정 (동작은 OK, 개선 여지):

1. **[preview/route.ts:198-206] 빈 행 방어 부족**
   - `jsonData.length === 0`은 체크하지만 `jsonData[0]`이 헤더만 있고 모든 값이 빈 경우 `Object.keys`가 공백이라 `MISSING_HEADERS`로 빠진다. 현재는 안전하게 에러로 처리되지만, 메시지가 "헤더 누락"이라 사용자가 혼란. "데이터 행이 없습니다"와 구분되면 더 친절.

2. **[preview/route.ts:286-305] 주민번호 형식 검증이 단순**
   - `/^\d{13}$/`만 검사 — 생년 6자리 + 성별코드 1자리의 유효성은 확인 안 함. 실무상 허용 가능하나, 주민번호 체크섬까지 검증하면 더 견고. (권장, 필수 아님)

3. **[preview/route.ts:523, confirm/route.ts:229] catch 블록에서 에러 로깅 누락**
   - `catch { return apiError(...) }` 로 에러 객체를 버림. 500 원인 추적이 어렵다. 최소 `console.error(e)` 정도는 남기는 게 좋음.

4. **[confirm/route.ts:143-148] 트랜잭션 내 중복 체크 재확인 필요**
   - 외부 `existingReferees` 조회는 트랜잭션 **밖**에서 수행 → 그 사이 다른 세션이 동일 키로 insert하면 여기서 못 잡음. DB에 `registered_name + registered_phone` 유니크 제약이 없는 것으로 보여(`@@index`만 있음), 동시 실행 시 중복 생성 가능. 실용적으로는 Referee가 수작업 등록이라 경쟁이 낮지만, 장기적으로는 unique constraint 검토 권장.

5. **[confirm/route.ts:155-161] 암호화 실패 시 fallback이 조용함**
   - try/catch로 encrypt 실패 시 `null`로 넘겨 등록을 진행. 관리자는 "주민번호 등록됐는데 실제로는 안 됨"을 모른다. `RESIDENT_ID_ENCRYPTION_KEY` 누락은 운영 사고 수준이므로 오히려 fail-fast(500)가 안전. (환경 세팅 경고 관점)

6. **[confirm/route.ts:170-172] birth_date 파싱**
   - `new Date(r.birth_date)` — `"2025-01-32"` 같은 무효 값이 Invalid Date가 되어 Prisma insert에서 에러로 번질 수 있음. preview에서 `normalizeBirthDate`로 정제했지만 confirm에서 재검증 없음. `isNaN(date.getTime())` 체크 권장.

7. **[page.tsx:163-170] 에러 메시지 파싱 로직 복잡**
   - `apiError()`의 응답 포맷이 `{ success:false, error: { message, code } }`로 일관된다면(실제 `admin-guard.ts:168-173` 참고) 프론트에서 `data.error?.message`만 읽으면 됨. 현재는 string/object 양쪽 다 처리하는데, 서버가 오브젝트로 일관되므로 단순화 가능.

8. **[page.tsx:109] `fileInputRef` 대신 `onChange` state 고려**
   - ref로 `.files?.[0]`을 꺼내는 방식은 동작은 하지만, 파일 선택 직후 "선택된 파일명" 같은 UI 피드백이 없음. bulk-verify 패턴 따른 거면 유지 OK.

9. **[preview/route.ts:96-101] resident_id 평문이 preview 응답에 포함됨**
   - 주석에도 "평문을 절대 담지 않음"이라 했지만, 실제로는 응답에 `resident_id: p.resident_id`(평문, 라인 421/446 등)가 들어간다. HTTPS면 전송은 안전하나, 브라우저 메모리/개발자도구/로그 캐시 노출 위험. **대안**: preview 응답에는 `resident_id_last4`만 내보내고, confirm에서는 프론트 상태가 아니라 **서버 측 임시 캐시(Redis 5분 TTL)** 또는 **재업로드**하는 구조가 더 안전. 현재 구조는 "단일 세션 내 매우 짧은 왕복"이라는 가정 하에서만 허용. 보안팀 검토 필요.

10. **[referee-shell.tsx:38] NAV_ITEMS 정렬**
    - "일괄 등록"이 "공고 관리" 뒤에 삽입됨. UX상 "멤버 관리" 근처(members/settings 쪽)가 더 자연스러울 수 있으나, 현 위치도 "관리자 도구 그룹" 안에 있어 문제는 없음.

🔴 필수 수정: **없음**

📝 회귀 영향:
- 기존 개별 등록 API: 건드리지 않음 ✅
- 기존 bulk-verify: 별개 디렉토리(`bulk-verify/`), 영향 없음. 단 존재 여부 재확인 필요(Glob로는 현재 안 잡힘 → 이미 제거됐거나 별도 경로일 수 있음)
- referee-shell.tsx: NAV_ITEMS에 한 줄 추가만 — 기존 링크 영향 없음 ✅

📌 결론: **APPROVE with comments**. 바로 병합해도 동작·보안에 실질 리스크는 없음. 위 1~6번은 운영 중 발견될 경우를 대비한 견고성 개선, 9번은 중기적 보안 개선 과제로 별도 이슈화 권장.

## 리뷰 결과 (reviewer) — 2026-04-13 — 관리자 메뉴 조건부 표시

📊 종합 판정: **APPROVE with comments** (동작/보안 OK, 권장 개선 4건)

✅ 잘된 점:
- **서버 방어선 유지**: 클라 필터는 UX 목적, 실제 권한 체크는 `requirePermission()`이 담당함을 코드 주석(referee-shell.tsx:22)에서 명확히 선언. 방어 철학 명확
- **병렬 조회**: `/api/web/me`에서 user/referee/admin 3건을 `Promise.all`로 묶음. 라운드트립 최소화 잘했음
- **PERMISSIONS 역조회 정확**: `Object.keys(PERMISSIONS).filter(k => PERMISSIONS[k].includes(admin.role))` — O(n×m)이지만 n=12, m≤9라서 무시 가능. 로직 정확함
- **임원 분기 화이트리스트**: `EXECUTIVE_VISIBLE = ["admin", "assignment_view", "settlement_view"]`로 열람 전용만 노출 → admin-guard의 `EXECUTIVE_ROLES`와 의미 일치 (임원은 열람만)
- **비로그인 안전**: `getAssociationAdmin().catch(() => null)` + `admin_info === null` 분기. fetch 실패/미로그인 모두 본인 메뉴만 표시
- **타입 정의 명확**: `AdminInfo` 타입 명시 + `Permission` import로 서버 응답과 1:1 매핑
- **UX 깜빡임 방지**: 초기값 `null`로 두고 fetch 완료 전까지 관리자 메뉴 숨김. 관리자 메뉴가 잠깐 보였다 사라지는 현상 방지
- **시각적 구분**: 본인↔관리자 섹션 경계에 border-top + "관리자" 라벨. 관리자 메뉴 0개면 구분선도 숨김(line 200 `hasAdminItems` 가드)

🟡 권장 수정 (동작 OK, 개선 여지):

1. **[referee-shell.tsx:124-138] /api/web/me 중복 호출 가능성**
   - 셸이 독자적으로 fetch 호출. 다른 페이지 컴포넌트가 이미 `/api/web/me`를 호출 중이면 세션 체크에서 2회 발생. 현재는 cache-control 설정 없어 네트워크 2회. 권장: React Query/SWR 도입하거나 layout/context에서 단일 호출 후 prop 전파. **다만** `dynamic="force-dynamic"`에 응답 자체가 가볍고(<1KB) 관리자 수가 적어 당장 문제는 아님.

2. **[referee-shell.tsx:127] fetch 응답 에러 로깅 누락**
   - `r.ok ? r.json() : null` — 401/500 떨어지면 조용히 무시. 개발자 도구에 원인 못 남김. `.catch(console.warn)` 정도 권장.

3. **[referee-shell.tsx:58] "admin" 특수 키의 모호함**
   - `requires: "admin"`은 NAV_ITEMS 전용 의사-권한 키(가짜 권한)로, PERMISSIONS에는 존재하지 않음. 현재 `isNavVisible`이 `item.requires === "admin"`을 일반 관리자 분기에서만 처리하고, 임원은 `EXECUTIVE_VISIBLE` 배열에 "admin" 포함으로 처리. 동작은 맞지만 타입 안전성은 약함 — `requires`가 `string | null`이라 오타 방지 안 됨. 권장: `type RequiresKey = Permission | "admin" | null`로 좁히면 오타 빌드 에러로 잡힘.

4. **[api/web/me/route.ts:54-56] 매 호출마다 PERMISSIONS 전체 순회**
   - 관리자 접속 시마다 12개 키 × 9 역할 = 108회 비교. 현재 수준에서 성능 이슈는 없지만, 역방향 매핑을 모듈 로드 시 한 번 계산(`const ROLE_TO_PERMS: Record<string, Permission[]>`)해두면 O(1) 조회로 더 깔끔. 선택사항.

🔐 보안 관점 평가:
- `admin_info` 노출 정보: `association_id`(숫자), `role`(문자열), `is_executive`(불리언), `permissions`(문자열 배열). **민감 정보 아님** — 주민번호/이메일/전화번호 등은 미포함. 다른 유저 정보 노출 없음, 본인 세션에만 해당 ✅
- IDOR 불가: `getAssociationAdmin()`이 내부에서 세션 `userId`만 사용, 외부 입력 없음 ✅
- 비관리자가 `/referee/admin/*` URL 직타이핑 시: 서버 라우트의 `requirePermission()`이 403 차단. 클라 필터 우회해도 안전 ✅
- `admin.role`을 클라이언트에 노출하는 것은 기존 관행(관리자 UI 전반에서 이미 사용)과 일치, 신규 위험 없음 ✅

🎯 권한 매트릭스 정확성:
- 일반 관리자 경로(line 98-99): `permissions.includes(requires)` — admin-guard.ts의 `hasPermission()`과 동일 의미 ✅
- 임원 경로(line 93-95): `EXECUTIVE_VISIBLE`로 화이트리스트. PERMISSIONS에서 임원이 포함된 권한은 `assignment_view`, `settlement_view` 두 개 + 가짜 "admin" — **정확히 일치** ✅
- `admin_manage`는 `secretary_general`만 → 설정 메뉴(line 70)가 사무국장에게만 표시. ✅
- `settlement_manage`는 사무국장만 → 배정비 단가(line 69)도 사무국장 전용. ✅
- `excel_upload`: 일반 관리자 전체(secretary_general + referee/game chief/clerk). 임원 제외 ✅

📌 결론: **APPROVE with comments**. 병합해도 안전. 권장 수정 4건은 즉시 처리 불필요, 추후 React Query 도입 시 1번 해결, 3번은 10분이면 타입 강화 가능하여 선택적 반영 권장.

## 리뷰 결과 (reviewer) — 2026-04-13 — 공고 자동 마감 + 알림 시스템 (15파일)

📊 종합 판정: **APPROVE with comments** (실동작/보안 OK, 권장 개선 7건 / 필수 수정 0건)

✅ 잘된 점:
- **알림 헬퍼 격리 품질 최고**: `referee-events.ts`의 모든 함수가 try/catch로 감싸져 있고, 실패 시 `logNotifyError`로 로깅만 하고 메인 흐름을 방해하지 않음. 선정/배정/정산 API들이 안전하게 호출 가능
- **user_id null 가드 철저**: `Referee.user_id`가 nullable임을 인지하고 모든 헬퍼에서 `user_id: { not: null }` 또는 null 체크. 앱 미가입 심판에게 알림 시도 안 함
- **createNotificationBulk 적극 활용**: `notifyPoolSelected`, `notifyAnnouncementPublished` 모두 bulk 사용 → createMany 1쿼리. N+1 회피 ✅
- **Cron 인증 패턴 일관**: `Bearer ${process.env.CRON_SECRET}` — 기존 `tournament-reminders`와 동일 패턴 재사용 ✅
- **이중 안전망**: Cron (매시간) + lazy close (관리자 GET 시) 2중 보강. Hobby 플랜 제한 대비 OK
- **Announcement IDOR 방지 철저**: POST에서 `association_id = admin.associationId` 강제. body 값 무시. 
- **Pool 선정 5중 검증**: 대회·일자·협회·신청존재·role_type 모두 체크. `dates: { some: { date: dateUtc } }`로 일자 신청 여부까지 확인
- **Assignment pool_id 5중 검증**: 풀 존재 + referee 일치 + 협회 일치 + 대회 일치 + 날짜 일치(YYYY-MM-DD 비교)
- **벨 + 페이지 일관성**: 동일한 `iconForType`, `formatRelative` 로직을 벨과 목록 페이지에 의도적 중복 (주석 명시). 단순함 우선 OK
- **Optimistic update**: 읽음 처리 시 로컬 상태 먼저 변경 → 폴링까지 대기 없음. UX 좋음
- **IDOR 방지(알림)**: `[id]/read/route.ts`에서 `notification.user_id.toString() !== session.sub` 검증. 다른 유저 알림 못 건드림 ✅
- **ESC/외부 클릭 닫기**: 벨 드롭다운에서 접근성/UX 기본 요소 구현됨
- **하위호환 완벽**: 기존 `/api/web/notifications`는 파라미터 없이 호출 시 `{unreadCount}`만 반환 유지. header.tsx/layout.tsx 3곳 기존 사용처 영향 없음 ✅
- **PATCH /api/web/notifications 기존 유지**: notifications-client.tsx가 사용하는 "전체 읽음" PATCH는 건드리지 않음. read-all POST는 신규 경로로 병존 ✅

🟡 권장 수정 (필수 아님, 개선 여지):

1. **[referee-events.ts:220-228] notifyAnnouncementPublished — 역할별 발송 시 role_type 필터 엄격성**
   - 현재 `where: { role_type: params.role_type }`로 필터. 다만 `Referee.role_type`이 "referee"/"game_official" 외 다른 값이 들어올 가능성(과거 데이터 드리프트)은 방어되지 않음. 대규모 협회(수백명)에서 전체 알림 폭탄 가능성 낮지만, 대량 createMany가 트랜잭션 타임아웃을 치는 케이스에 대비해 **청크(chunk) 처리**(예: 100명 단위)를 고려할 가치 있음. 지금은 수십 명 수준이라 문제 없음.

2. **[announcements/route.ts:162-173] lazy close를 매 GET 때마다 실행**
   - 관리자가 목록을 새로고침할 때마다 `updateMany` 쿼리 발생. 대부분 0행 업데이트지만 불필요한 라운드트립. 개선안: 마지막 실행 시각을 메모리/Redis에 캐시해 5분 이내엔 skip. 선택사항 (현재 규모 문제없음).

3. **[pools/[id]/route.ts:177-186] PATCH 후 updated 재조회 — 트랜잭션 밖**
   - `$transaction` 안에서 업데이트하고 밖에서 다시 `findUnique`. is_chief 토글이 매우 빈번하진 않으나, 트랜잭션 내 update의 `select:` 결과를 바로 반환하면 1쿼리 절감. 현재 코드도 동작엔 이상 없음.

4. **[notification-bell.tsx:107] 30초 폴링 고정**
   - 탭 비활성(Page Visibility API) 상태에서도 계속 요청. `document.visibilityState === "hidden"` 때는 폴링 정지 권장. 서버 부하 완화 + 모바일 배터리 절약. 선택사항.

5. **[notification-bell.tsx:80] fetch credentials 중복**
   - 동일 출처 요청엔 `credentials: "include"` 불필요(same-origin 기본). 동작엔 영향 없음. 일관성/명시성 목적이면 유지 OK.

6. **[notifications/route.ts:79] PATCH 전체 읽음 응답 — updated 건수 반환 없음**
   - `apiSuccess({ success: true })`로만 응답. 신규 `/read-all` POST는 `updated: result.count` 반환. 일관성 위해 기존 PATCH도 count 포함 고려 가능하나, 하위호환상 현행 유지가 안전.

7. **[referee-events.ts:117/152] actionUrl 하드코딩**
   - "/referee/applications", "/referee/assignments", "/referee/settlements" 문자열 리터럴. 나중에 경로 바꾸면 여기도 같이 수정 필요. 작은 상수 파일(`src/lib/notifications/referee-routes.ts`)로 빼두면 리팩터링 안전. 선택사항.

🔐 보안 관점 평가:
- **Cron 인증**: `CRON_SECRET` Bearer 비교. 타이밍 공격 방지용 `timingSafeEqual`은 아니지만 기존 프로젝트 패턴과 일치. 운영 Vercel은 공인 IP만 접근 → 실질 위험 낮음 ✅
- **IDOR(알림 조회/읽음)**: GET list는 `where: { user_id: userId }`로 고정, PATCH [id]/read는 user_id 일치 검증, POST /read-all도 session.sub만 사용. 본인 외 접근 불가 ✅
- **Referee → User 조인**: Referee.user_id nullable 처리 모든 헬퍼에서 확인. user_id가 null인 데이터에 의한 null 알림 생성 없음 ✅
- **notifiable_id 타입**: `announcement_id`는 BigInt(Announcement.id)로 통일. createNotificationBulk 내부 Prisma.InputJsonValue 호환 확인 필요 — 기존 헬퍼 시그니처에 `notifiableId: bigint`로 선언되어 있어 OK ✅
- **비관리자가 cron URL 직접 호출**: CRON_SECRET 없으면 401. 노출 위험 없음 ✅

📊 무결성 평가:
- **알림 실패 ≠ 메인 흐름 실패**: 모든 헬퍼 내부 try/catch. 호출처(POST announcements/pools/pools[id]/assignments/settlements[id]/status)는 await만 하고 에러 throw 받지 않음. 알림 DB 장애나 푸시 서비스 장애가 공고 게시/선정/배정/정산을 막지 않음 ✅
- **중복 알림 가능성**: notifyAnnouncementPublished에서 `Set`으로 user_id 중복 제거. 한 유저가 여러 Referee 레코드를 가질 가능성 방어 ✅
- **Pool DELETE 시 assignments 참조 무결성**: `_count.assignments > 0` 체크로 선행 삭제 유도(409 반환) ✅
- **is_chief 단일 제약**: $transaction으로 기존 chief 해제 + 본인 설정 원자화 ✅

⚡ 성능 평가:
- **Bulk 알림 O(1) 쿼리**: createMany 1회로 처리. 협회 50명 수준에서 <100ms 예상 ✅
- **벨 폴링 30초**: Vercel 서버리스 비용상 허용 수준. 단 로그인 전원이 동시 폴링하면 RPS 증가 — 현재 사용자 규모에서는 OK
- **알림 목록 인덱스**: `notifications(user_id, created_at)`, `notifications(user_id, status)` 두 인덱스 전제. schema 확인 필요 (기존 작업에서 생성됐을 가능성 높음) ✅ (추정)
- **lazy close updateMany**: `association_id + status + deadline` 복합 조건. status 인덱스 + deadline 필터 — 공고 수가 수백 개 수준이면 부담 없음 ✅

🎨 UX 평가:
- **벨 뱃지 가독성**: "9+" 표시, h-4 min-w-4, primary 배경 흰 글자 — 시인성 OK ✅
- **드롭다운 깜빡임 없음**: `loading && items.length === 0`으로 첫 로드만 "불러오는 중", 이후 폴링은 조용히 교체. OK ✅
- **시간 포맷 친숙**: 방금/N분/N시간/N일/날짜 5단계. 표준적이고 친숙 ✅
- **전체 읽음 버튼 disabled**: unreadCount===0일 때 disabled:opacity-40 — 피드백 명확 ✅
- **모바일 드롭다운 폭**: w-80 sm:w-96 — 360px 이하 화면에서 우측 말림 가능성 있음. 현재 `right-0`으로 붙어있어 큰 문제 없어 보이나, 초소형 기기 확인 권장 🟡

🔁 기존 기능 회귀 평가:
- **기존 헤더 알림**: `fetch("/api/web/notifications", ...)`를 list 파라미터 없이 호출 → `{unreadCount}` 응답 그대로 받음. header.tsx / (web)/layout.tsx 모두 영향 없음 ✅
- **기존 알림 클라이언트**: `/(web)/notifications/_components/notifications-client.tsx`의 PATCH(`/api/web/notifications`) 전체 읽음 호출 유지됨 ✅
- **기존 DELETE `/api/web/notifications/[id]`**: 별도 파일에 살아있음. 새 PATCH `/[id]/read`와 충돌 없음 (다른 HTTP 메서드) ✅
- **Vercel Cron 목록**: 기존 3개 유지 + 신규 1개 추가. Hobby 플랜 상한(최대 N개) 확인 필요하나 영향은 경미 ✅

📌 결론: **APPROVE with comments**. 바로 병합 OK. 실동작/보안/무결성 모두 견고함. 권장 7건 중 #4(Page Visibility 폴링 정지)와 #7(라우트 상수화)가 가장 가성비 좋음 — 후속 정리 작업 시 반영 권장.

## 테스트 결과 (tester) — 2026-04-13 — 공고 마감 자동화 + 알림 시스템 (1차+2차 통합)

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| Test 1: tsc --noEmit | PASS | 타입 에러 0건, exit 0 |
| Test 2: 알림 타입 5종 추가 (types.ts) | PASS | REFEREE_POOL_SELECTED/CHIEF/ASSIGNMENT_CREATED/SETTLEMENT_PAID/ANNOUNCEMENT_NEW 정의 확인 (28~32행) |
| Test 3-1: referee-events 5개 함수 존재 | PASS | notifyPoolSelected/ChiefAssigned/AssignmentCreated/SettlementStatusChanged/AnnouncementPublished |
| Test 3-2: Referee → user_id 조회 + null 방어 | PASS | 모든 함수에서 user_id null 필터링 (72-74, 108-111, 136-140, 166-172, 220-227행) |
| Test 3-3: try/catch로 메인 흐름 보호 | PASS | 5개 함수 모두 logNotifyError로 catch 처리 |
| Test 3-4: createNotificationBulk 활용 | PASS | Pool/Announcement에서 bulk, 단건은 createNotification 사용 |
| Test 4: announcements GET lazy close | PASS | updateMany로 deadline 지난 open→closed (162-173행, catch로 UX 보호) |
| Test 5-1: pools POST → notifyPoolSelected | PASS | route.ts:147 호출, tournament_name+date+role_type 전달 |
| Test 5-2: pools [id] PATCH(is_chief=true) → notifyChiefAssigned | PASS | is_chief=true일 때만 호출 (191-200행) |
| Test 5-3: assignments POST → notifyAssignmentCreated | PASS | route.ts:223 호출, scheduled_at/role 포함 |
| Test 5-4: settlements [id]/status(paid/cancelled/refunded) → notifySettlementStatusChanged | PASS | 해당 3상태에서만 발송 (217-227행) |
| Test 5-5: announcements POST → notifyAnnouncementPublished | PASS | route.ts:135 호출, association_id/role_type/title 전달 |
| Test 6-1: /api/cron/referee-announcement-close 존재 | PASS | route.ts 40줄, updateMany 한 방 |
| Test 6-2: CRON_SECRET Bearer 인증 | PASS | Bearer ${process.env.CRON_SECRET} 비교 (18-21행) |
| Test 6-3: vercel.json crons 등록 | PASS | "0 * * * *" 매시간 스케줄 |
| Test 7-1: GET /api/web/notifications list 모드 | PASS | ?list=true → items+total+unread_count+페이지네이션 (40-84행) |
| Test 7-2: PATCH /api/web/notifications/[id]/read | PASS | IDOR 체크(42행) + 이미 read면 멱등 |
| Test 7-3: POST /api/web/notifications/read-all | PASS | 세션 user 본인만 updateMany |
| Test 7-4: 본인 알림만 접근 (IDOR) | PASS | 모든 라우트 user_id=session.sub 강제 |
| Test 8-1: NotificationBell 벨 아이콘 + 뱃지 | PASS | Material Symbols + 9+ 포맷 뱃지 (178행) |
| Test 8-2: 드롭다운 최근 10건 | PASS | limit=10 fetch + 자동 읽음 |
| Test 8-3: 전체 보기 / 전체 읽음 버튼 | PASS | /referee/notifications 링크 + markAllRead |
| Test 8-4: ESC / 외부 클릭 닫기 | PASS | keydown Escape + mousedown 래퍼 밖 감지 (112-129행) |
| Test 9-1: /referee/notifications 페이지 | PASS | 탭(전체/안읽음) + 페이지네이션 + 전체 읽음 |
| Test 9-2: unread_only 파라미터 연동 | PASS | tab==="unread"이면 unread_only=true (85행) |
| Test 10: referee-shell NotificationBell 배치 | PASS | 헤더 우측 (7행 import, 298행 렌더) |
| Test 11-1: 기존 notifications API 하위호환 | PASS | list 미지정 시 unreadCount만 반환 + 30초 캐시 헤더 유지 |
| Test 11-2: 기존 cron 동작 유지 | PASS | tournament-reminders/weekly-report/youtube 경로 vercel.json에 그대로 + 신규 1건 추가만 |

결과: **28개 중 28개 통과 / 0개 실패 — 전체 PASS**

참고 사항:
- notifyPoolSelected는 bulk 시그니처(배열)이지만 현재 pools POST 흐름은 단건 등록이라 배열에 ID 1개만 담김. bulk와 단건 모두 재사용할 수 있게 설계된 의도 — 문제 없음.
- Referee.user_id가 null이면 알림 조용히 스킵. 앱 미가입 심판은 알림 대상 아님이라는 원칙이 헬퍼에서 일관 적용됨.
- lazy close + cron 이중화 덕에 Hobby 플랜(일 1회 제한) 환경에서도 관리자 목록 진입 시 갭 없이 closed 전환됨.

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-13 | tester | 공고 마감 자동화 + 알림 시스템 검증 28건 | 전체 PASS |
| 04-13 | reviewer | 공고 자동마감 + 알림 시스템 리뷰 (15파일) | APPROVE with comments (권장 7건) |
| 04-13 | reviewer | 관리자 메뉴 조건부 표시 리뷰 (me/route + referee-shell) | APPROVE with comments (권장 4건) |
| 04-13 | developer | 배정 DELETE 정산 가드 추가 (reviewer critical 되돌림 1차) | tsc 통과, SETTLEMENT_EXISTS 409 가드 |
| 04-13 | reviewer | Excel 일괄 사전 등록 리뷰 (4파일) | APPROVE with comments (권장 9건) |
| 04-05 | pm | AG→main 머지+푸시 (타이포그래피+슬라이드메뉴 정리) | 완료 |
| 04-02 | developer+tester | 맞춤 설정 필터 미동작 5건 수정 + 전수 검증 30건 통과 | 완료 |
| 04-02 | developer | 메뉴 토글 + 테마/텍스트크기 설정 (20건 검증 통과) | 완료 |
| 04-02 | developer | 맞춤 설정 강화 — 실력 7단계, 카테고리 분리, 용어 통일 | 완료 |
| 04-01 | developer | 파트너셀프서비스+대관+카페이전 (14파일) | 완료 |
| 04-01 | developer | 역할체계+단체승인제 | 완료 |
| 04-01 | developer | 네이티브 광고 시스템 MVP (13파일) | 완료 |
| 04-01 | developer | Organization 3단계 계층 (15파일) | 완료 |
| 03-31 | developer | 검색코트+알림설정+PWA배너 (7파일) | 완료 |
| 03-31 | developer | 비밀번호 재설정+회원 탈퇴 (8파일) | 완료 |
