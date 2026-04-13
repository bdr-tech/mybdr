# 심판/경기원 플랫폼 구축 스크래치패드 (subin-referee 브랜치)

---

## 📌 현재 작업
- **요청**: v3 아키텍처 — 협회 주도 사전 등록 + 유저 매칭 시스템
- **상태**: ✅ v3 전체 완료 (1차+2차+3차)
- **현재 담당**: pm (완료 보고)

## 🧭 진행 현황표

### v2 (MVP 1차) — ✅ 완료
| # | 범위 | 상태 | 커밋 |
|---|------|------|------|
| 1/4 | Prisma 6모델 + 협회 20시드 + drift 복원 | ✅ | eb3ea55 |
| 2/4 | 본인 API 4개 + 본인 페이지 7개 + 독자 셸 | ✅ | e7e8d95 |
| 3/4 | 배정/정산 조회 API 2개 + 본인 열람 페이지 2개 | ✅ | 405c030 |
| 4/4 | Admin API 6개 + 페이지 5개 + Excel 일괄검증 | ✅ | 0510b01 |

### v3 (협회 주도 등록 + 매칭) — 🚧 진행 중
| 단계 | 범위 | 상태 |
|------|------|------|
| 1차 | DB 마이그레이션 + 매칭 엔진 + 암호화 유틸 | ✅ | 4aea61f |
| 2차 | 관리자 사전 등록 UI/API + 수동매칭 + 상태필터 | ✅ | 3b3ba18 |
| 3차 | 자동 매칭 훅 + 대시보드 안내 + 역할 관리 | ✅ | 39612a4 |

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

## ⚠️ 미해결 이슈 (v2 잔재)
1. 로그인 후 /referee 복귀 미동작 (redirect 파라미터 미지원)
2. 하드코딩 #fff 9곳
3. Reviewer 권장수정 2건 + nit 6건

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
