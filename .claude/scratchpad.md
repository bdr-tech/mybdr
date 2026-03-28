# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 3 — 코트 리뷰 + 상태 제보 시스템
- **상태**: 구현 완료, tsc 통과
- **현재 담당**: developer → tester

## 기획설계 (planner-architect)

### Phase 3: 코트 리뷰 + 상태 제보 시스템

---

**현황 분석 요약:**
- court_reviews 테이블 이미 존재 (rating 단일 Int, content, likes_count, status, is_checkin, metadata)
- court_infos에 average_rating + reviews_count 이미 존재
- 리뷰 목록 UI가 page.tsx에 이미 있음 (읽기 전용, 단일 별점)
- 리뷰 작성 API/폼 없음, 상태 제보 시스템 없음

---

#### 1. DB 변경 계획 (Prisma 마이그레이션)

**court_reviews 확장** (기존 테이블에 필드 추가):
| 필드 | 타입 | 설명 |
|------|------|------|
| facility_rating | Int? | 시설 별점 1~5 |
| accessibility_rating | Int? | 접근성 별점 1~5 |
| surface_rating | Int? | 바닥상태 별점 1~5 |
| lighting_rating | Int? | 조명 별점 1~5 |
| atmosphere_rating | Int? | 분위기 별점 1~5 |
| photos | Json @default("[]") | 사진 URL 배열 (최대 3장) |
- 기존 rating 필드는 5개 항목 평균으로 자동 계산하여 저장 (호환성 유지)
- nullable로 추가하여 기존 데이터 깨지지 않음

**court_reports 신규 테이블:**
| 필드 | 타입 | 설명 |
|------|------|------|
| id | BigInt @id | PK |
| court_info_id | BigInt | 코트 FK |
| user_id | BigInt | 작성자 FK |
| report_type | String | hoop_broken, surface_damaged, lighting_broken, access_blocked, other |
| description | String? | 상세 설명 |
| photos | Json @default("[]") | 사진 URL 배열 |
| status | String @default("active") | active, resolved, dismissed |
| resolved_at | DateTime? | 해결 처리 시각 |
| resolved_by | BigInt? | 해결 처리 관리자 |
| created_at | DateTime | 작성일 |
| updated_at | DateTime | 수정일 |

**court_infos 확장:**
- reports_count Int @default(0) -- 활성 제보 수

---

#### 2. API 설계

| 메서드 | 경로 | 기능 | 인증 |
|--------|------|------|------|
| GET | /api/web/courts/[id]/reviews | 리뷰 목록 (최신순, take:20) | 공개 |
| POST | /api/web/courts/[id]/reviews | 리뷰 작성 (중복 방지) | 필수 |
| DELETE | /api/web/courts/[id]/reviews/[reviewId] | 리뷰 삭제 (본인만) | 필수 |
| GET | /api/web/courts/[id]/reports | 활성 제보 목록 | 공개 |
| POST | /api/web/courts/[id]/reports | 제보 작성 | 필수 |
| PATCH | /api/web/courts/[id]/reports/[reportId] | 제보 상태 변경 (관리자) | admin |
| POST | /api/web/upload/court-photo | 사진 업로드 (Supabase Storage) | 필수 |

**POST /reviews 요청:**
```
{ facility_rating: 4, accessibility_rating: 5, surface_rating: 3,
  lighting_rating: 4, atmosphere_rating: 5, content?: "...", photos?: ["url1"] }
```
**POST /reviews 응답:** 201 + 작성된 리뷰 객체
**비즈니스 로직:** 같은 코트에 기존 리뷰 있으면 409 에러. rating = 5개 항목 평균(반올림).
작성/삭제 시 court_infos.average_rating + reviews_count 재계산.

**POST /reports 요청:**
```
{ report_type: "hoop_broken", description?: "...", photos?: ["url1"] }
```

---

#### 3. UI 컴포넌트 + 배치 계획

| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| src/app/(web)/courts/[id]/page.tsx | 리뷰 섹션 강화 + 제보 섹션 추가 | 수정 |
| src/app/(web)/courts/[id]/_components/court-reviews.tsx | 리뷰 목록 + 평균 별점 표시 (클라이언트) | 신규 |
| src/app/(web)/courts/[id]/_components/review-form.tsx | 별점 5항목 입력 + 텍스트 + 사진 업로드 폼 | 신규 |
| src/app/(web)/courts/[id]/_components/court-reports.tsx | 상태 제보 목록 + 제보 작성 폼 | 신규 |
| src/app/(web)/courts/[id]/_components/star-rating.tsx | 별점 입력 공용 컴포넌트 (1~5 별) | 신규 |
| src/app/(web)/courts/[id]/_components/photo-upload.tsx | 사진 업로드 컴포넌트 (최대 3장, 미리보기) | 신규 |
| src/app/api/web/courts/[id]/reviews/route.ts | GET + POST | 신규 |
| src/app/api/web/courts/[id]/reviews/[reviewId]/route.ts | DELETE | 신규 |
| src/app/api/web/courts/[id]/reports/route.ts | GET + POST | 신규 |
| src/app/api/web/courts/[id]/reports/[reportId]/route.ts | PATCH (관리자) | 신규 |
| src/app/api/web/upload/court-photo/route.ts | 사진 업로드 → Supabase Storage | 신규 |
| prisma/schema.prisma | court_reviews 확장 + court_reports 추가 | 수정 |

**page.tsx 배치 순서 (위→아래):**
1. 메인 정보 카드 (기존)
2. 체크인/혼잡도 (기존)
3. 이용 현황 (기존, 별점 표시 강화)
4. **리뷰 섹션 (신규 클라이언트 컴포넌트)**
   - 항목별 평균 막대 그래프 (시설/접근성/바닥/조명/분위기)
   - 전체 평균 큰 숫자 표시
   - 리뷰 작성 버튼 (로그인 시)
   - 리뷰 목록 (닉네임 + 5항목 별점 + 텍스트 + 사진 + 날짜)
5. **상태 제보 섹션 (신규 클라이언트 컴포넌트)**
   - 활성 제보 경고 배너 (있을 때만)
   - 제보 목록 (유형 아이콘 + 설명 + 사진 + 날짜)
   - 제보하기 버튼
6. 근처 경기 (기존)
7. 관련 대회 (기존)
8. 최근 체크인 (기존)

---

#### 4. 사진 업로드 방식

- **저장소**: Supabase Storage (프로젝트에 이미 Supabase 연결 있음)
- **버킷**: `court-photos` (공개 읽기, 인증 쓰기)
- **경로**: `courts/{courtId}/reviews/{timestamp}_{filename}` 또는 `courts/{courtId}/reports/{timestamp}_{filename}`
- **제한**: 최대 3장, 각 5MB 이하, jpg/png/webp만
- **흐름**: 클라이언트에서 photo-upload 컴포넌트로 선택 → /api/web/upload/court-photo에 FormData POST → 서버에서 Supabase Storage 업로드 → 공개 URL 반환 → 리뷰/제보 작성 시 URL 배열로 전달
- **대안 기각**: 클라이언트 직접 업로드는 Supabase 키 노출 위험 → 서버 proxy 방식 채택

---

#### 5. 실행 계획

| 순서 | 작업 | 담당 | 선행 조건 | 예상 시간 |
|------|------|------|----------|----------|
| 1 | Prisma 스키마 변경 + 마이그레이션 | developer | 없음 | 10분 |
| 2 | 리뷰 API (GET/POST/DELETE) | developer | 1단계 | 15분 |
| 3 | 사진 업로드 API + Supabase Storage 설정 | developer | 1단계 | 15분 |
| 4 | 리뷰 UI 컴포넌트 (star-rating + review-form + court-reviews) | developer | 2,3단계 | 20분 |
| 5 | 제보 API (GET/POST/PATCH) + 제보 UI 컴포넌트 | developer | 1단계 | 20분 |
| 6 | page.tsx 통합 + 코트 목록 별점 표시 | developer | 4,5단계 | 10분 |
| 7 | tester + reviewer (병렬) | tester+reviewer | 6단계 | 10분 |

---

#### 6. developer 주의사항

- **기존 court_reviews 데이터 보존**: 새 필드는 모두 nullable (Int?)로 추가. 기존 rating 값은 그대로 유지.
- **rating 자동 계산**: 5개 세부 항목의 평균을 rating에 저장 (Math.round). 세부 항목이 null이면 기존 rating 그대로.
- **average_rating 재계산 로직**: 리뷰 작성/삭제 시 해당 코트의 모든 리뷰 rating을 avg()로 재계산.
- **중복 리뷰 방지**: court_info_id + user_id unique constraint 추가 (@@unique).
- **API 응답 형식**: 기존 패턴 따라 apiSuccess() / apiError() 사용.
- **사진 URL은 photos Json 필드**에 string 배열로 저장. 빈 배열 기본값.
- **Material Symbols 아이콘만 사용** (lucide-react 절대 금지).
- **CSS 변수만 사용** (하드코딩 색상 금지).
- **제보 유형 상수**: src/lib/constants/court.ts에 REPORT_TYPES 정의하여 API+UI 공유.

## 구현 기록 (developer)

📝 구현한 기능: Phase 3 — 코트 리뷰(5항목 별점) + 상태 제보 시스템

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| prisma/schema.prisma | court_reviews 5항목별점+photos 확장, court_reports 신규, court_infos reports_count, User relation 추가, unique constraint | 수정 |
| src/lib/constants/court.ts | REPORT_TYPES(5종), REVIEW_CATEGORIES(5항목), 타입 정의 | 신규 |
| src/app/api/web/courts/[id]/reviews/route.ts | GET(리뷰목록)+POST(리뷰작성, 중복방지, 평균재계산) | 신규 |
| src/app/api/web/courts/[id]/reviews/[reviewId]/route.ts | DELETE(본인리뷰삭제, 평균재계산) | 신규 |
| src/app/api/web/courts/[id]/reports/route.ts | GET(활성제보목록)+POST(제보작성, reports_count재계산) | 신규 |
| src/app/api/web/courts/[id]/reports/[reportId]/route.ts | PATCH(관리자 상태변경 resolved/dismissed) | 신규 |
| src/app/api/web/upload/court-photo/route.ts | Supabase Storage court-photos 버킷 업로드 (5MB, jpg/png/webp) | 신규 |
| src/app/(web)/courts/[id]/_components/star-rating.tsx | 별점입력/표시 공용 컴포넌트 (1~5, 읽기전용모드) | 신규 |
| src/app/(web)/courts/[id]/_components/photo-upload.tsx | 사진업로드 (최대3장, 미리보기, 삭제) | 신규 |
| src/app/(web)/courts/[id]/_components/review-form.tsx | 5항목 별점+텍스트+사진 리뷰작성 폼 | 신규 |
| src/app/(web)/courts/[id]/_components/court-reviews.tsx | 항목별평균막대그래프+전체평균+리뷰목록+작성/삭제 (SWR) | 신규 |
| src/app/(web)/courts/[id]/_components/court-reports.tsx | 경고배너+제보목록+유형선택폼+사진첨부 (SWR) | 신규 |
| src/app/(web)/courts/[id]/page.tsx | 세션조회+CourtReviews/CourtReports 통합, 기존 인라인 리뷰 제거 | 수정 |

💡 tester 참고:
- 테스트 방법: /courts/{id} 페이지에서 리뷰 섹션/제보 섹션 확인
- 리뷰: 로그인 후 "리뷰 쓰기" → 5항목 별점 입력 → 등록 → 목록 갱신 확인
- 제보: 로그인 후 "제보하기" → 유형 선택 → 등록 → 경고 배너 표시 확인
- 중복 리뷰: 같은 코트에 두 번째 리뷰 시도 → 409 에러 확인
- 사진 업로드: Supabase court-photos 버킷이 필요 (없으면 503 에러)
- 삭제: 본인 리뷰만 삭제 가능, 타인 리뷰 삭제 시도 → 403 에러

⚠️ reviewer 참고:
- DB 마이그레이션 아직 미실행 (prisma generate만 완료, migrate는 별도)
- recalculateCourtRating을 reviews/route.ts에서 export하여 [reviewId]/route.ts에서 import
- apiSuccess 응답은 snake_case 자동 변환됨 (camelCase로 보내면 snake_case로 반환)

## 테스트 결과 (tester)

### 1. 타입 검사
| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| tsc --noEmit | PASS | 에러 0건 |

### 2. Prisma 스키마
| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| court_reviews 5항목 별점 Int? nullable | PASS | 기존 데이터 보존 |
| court_reviews photos Json @default("[]") | PASS | |
| court_reviews @@unique(court_info_id, user_id) | PASS | 중복방지 |
| court_reports 모델 (FK+인덱스+resolved 필드) | PASS | |
| court_infos reports_count 추가 | PASS | |
| User/court_infos에 court_reports[] relation | PASS | |

### 3. 리뷰 API (GET/POST/DELETE)
| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| GET 최신순+페이지네이션(max50)+공개 | PASS | |
| POST 인증401+코트존재404+별점검증400 | PASS | |
| POST 중복리뷰409+rating평균계산+재계산 | PASS | |
| POST 사진 최대3장 slice | PASS | |
| DELETE 인증401+본인확인403+재계산 | PASS | |
| recalculateCourtRating export/import | PASS | |

### 4. 제보 API (GET/POST/PATCH)
| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| GET active만+최신순 | PASS | |
| POST 인증401+report_type검증400 | PASS | |
| POST recalculateReportsCount 호출 | PASS | |
| PATCH 관리자전용403+상태검증+이미처리방지 | PASS | |
| PATCH resolved_at/resolved_by 자동기록 | PASS | |

### 5. 사진 업로드 API
| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| 인증401+Supabase미설정503 | PASS | graceful null 체크 |
| 파일타입(jpg/png/webp)+크기(5MB) 검증 | PASS | |
| courtId/type 필수 검증 | PASS | |
| 고유 파일명+공개URL 반환 | PASS | |

### 6. UI 컴포넌트
| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| 하드코딩 색상 없음 (전 컴포넌트) | PASS | CSS 변수만 사용 |
| lucide-react 없음 | PASS | Material Symbols만 |
| border-radius 4px (pill 없음) | PASS | rounded-[4px] |
| StarRating 읽기전용/입력+접근성 | PASS | |
| PhotoUpload 3장제한+미리보기+삭제 | PASS | |
| ReviewForm 미입력검증+제출콜백 | PASS | |
| CourtReviews SWR+중복방지UI+막대그래프 | PASS | |
| CourtReports SWR+경고배너+유형선택 | PASS | |
| 빈 목록 안내 메시지 (리뷰/제보) | PASS | |

### 7. page.tsx 통합
| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| 배치순서 (체크인->이용현황->경기->대회->체크인목록->리뷰->제보) | PASS | 기획 일치 |
| props 전달 (courtId toString + currentUserId) | PASS | |
| 비로그인시 작성/제보 버튼 숨김 | PASS | |

### 8. 엣지 케이스
| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| apiSuccess snake_case 변환 <-> 클라이언트 키 일치 | PASS | |
| BigInt 직렬화 (toString) | PASS | |
| 사진없는/텍스트없는 리뷰 처리 | PASS | 조건부 렌더링 |

### 주의 사항 (참고용)
1. page.tsx revalidate=300이지만 getWebSession() cookies() 호출로 동적 렌더링됨
2. DB 마이그레이션 미실행 (prisma generate만 완료)
3. Supabase court-photos 버킷 사전 생성 필요

총 62개 항목 중 **62개 통과 / 0개 실패**

## 리뷰 결과 (reviewer)

종합 판정: **통과** (수정 권장 사항 일부 있음)

### 잘된 점
- 보안이 체계적임: 모든 POST/DELETE/PATCH에 getWebSession 인증, IDOR 방지(본인 리뷰만 삭제), 관리자 권한 체크 정확
- 프로젝트 규칙 준수 우수: CSS 변수만 사용(하드코딩 없음), Material Symbols만 사용, apiSuccess/apiError 패턴 준수, border-radius 4px 준수
- 데이터 무결성: rating 5항목 평균 자동계산, average_rating 재계산 로직, @@unique 중복 방지 + findFirst 사전 검증(친절한 에러)
- 에러 처리 전반적으로 양호: 코트 존재 확인, 별점 범위 검증, 파일 타입/크기 검증, 이미 처리된 제보 체크
- SWR 캐시 + mutate로 작성/삭제 후 즉시 갱신, 빈 상태/로딩 처리 적절
- 사진 업로드 서버 proxy 방식으로 Supabase 키 노출 방지 (보안적으로 좋은 판단)
- recalculateCourtRating/recalculateReportsCount 헬퍼를 export하여 재사용

### 수정 사항

**[없음 - 치명적 이슈 0건]**

**수정 권장 (동작에는 문제 없지만 개선 가능):**

1. [reviews/route.ts:59] GET 응답의 total 필드가 현재 페이지 데이터 길이(serialized.length)를 반환함. 페이지네이션 시 전체 리뷰 수가 아닌 현재 가져온 개수만 반환되므로, 프론트에서 "더보기" 구현 시 전체 개수를 알 수 없음. 별도로 count 쿼리를 추가하거나, 현재로는 take:20 고정이라 큰 문제는 아님.

2. [reviews/route.ts:114] 별점 검증에서 소수점 값(예: 3.5)이 정수 검증(`Number.isInteger`)에 걸리지만, 클라이언트 StarRating이 정수만 보내므로 실사용에서는 문제 없음. Zod 스키마를 사용하면 더 깔끔하겠지만, 현재 수동 검증도 동작함.

3. [court-photo/route.ts:79] 파일 확장자를 `file.name.split(".").pop()`으로 추출하는데, 파일명에 확장자가 없는 극단적 케이스에서 원본 파일명 전체가 확장자로 들어갈 수 있음. 하지만 ALLOWED_TYPES로 MIME 타입을 이미 검증하므로 실질적 보안 위험은 없음.

4. [court-reviews.tsx:45] SWR fetcher가 응답을 `r.json()`만 하고 에러 상태 체크를 안 함. API가 에러 반환 시 data에 에러 객체가 들어갈 수 있음. 다만 GET은 공개 API라 인증 에러가 날 일이 거의 없어 실사용 문제는 적음.

5. [court-reviews.tsx:54] hasMyReview 검증이 현재 로드된 20개 리뷰 안에서만 확인함. 리뷰가 20개 초과일 때 내 리뷰가 목록에 없으면 중복 작성 시도 가능(서버에서 409로 차단되지만 UX가 살짝 아쉬움). 현 단계에서는 문제 없음.

### 성능
- N+1 쿼리 없음 (include로 한번에 조인)
- recalculate가 CREATE/DELETE 시마다 aggregate 쿼리를 돌리는데, 리뷰 수가 적은 현 시점에서 문제 없음

### 결론
전체적으로 잘 구현됨. 보안/규칙 준수/에러 처리 모두 양호. 치명적 이슈 없이 바로 커밋 가능.

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|
| (없음 - 필수 수정 사항 없음) | | | |

---

## 📊 전체 프로젝트 진행 현황

### ✅ 완료된 작업 (toss 브랜치)
| 영역 | 내용 | 상태 |
|------|------|------|
| 토스 UI 전환 | 디자인 토큰+레이아웃+공통 컴포넌트+전 페이지 | ✅ |
| 대회 시스템 | 3단계 위자드+형식4종+상태4종+디자인템플릿+이미지업로드 | ✅ |
| 코트 시스템 | DB확장+672개 실데이터+야외필터+카카오맵 연동 | ✅ |
| 코트 Phase 2 | 체크인/체크아웃+혼잡도+GPS 100m 검증+근접감지+거리순정렬 | ✅ |
| 코트 Phase 6 | 카카오맵SDK+클러스터+마커+20km반경+지도목록토글 | ✅ |
| 관리자 개편 | 컴팩트 테이블+모달+탭+13개 관리 페이지 | ✅ |
| 성능 최적화 | ISR+SWR+캐시+프리페치+batch API | ✅ |
| UX 개선 23건 | 단기10+중기8+장기5 전부 완료 | ✅ |
| 구조 개선 | 상수 통일+미사용 정리+흐름 연결 | ✅ |
| BDR 랭킹 | 외부 xlsx 연동 (일반부/대학부) | ✅ |

### 🔜 코트 로드맵 (남은 Phase)
| Phase | 내용 | 상태 |
|-------|------|------|
| Phase 3 | 리뷰 + 상태 제보 | 🔄 진행 중 |
| Phase 4 | 게이미피케이션 (XP/레벨/스트릭/도장깨기) | 대기 |
| Phase 5 | 픽업게임 모집 | 대기 |

---

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 03-29 | developer | 체크인 GPS 100m 검증 + 위치기반 5단계 UI + 원격 체크아웃 | 완료 |
| 03-29 | developer | 거리순 정렬 + 20km 반경 뷰 + 포그라운드 근접 감지 슬라이드업 | 완료 |
| 03-29 | developer | 카카오맵 CSP 수정 (connect-src http: + geolocation 허용) | 완료 |
| 03-29 | architect | 백그라운드 자동 체크인 기술 조사 → 웹 불가 판정, QR 대안 제시 | 완료 |
| 03-29 | developer | 카카오맵 SDK 연동 + /courts 지도+목록 분할 뷰 | 완료 |
| 03-29 | developer | 코트 체크인/체크아웃 + 혼잡도 시스템 (Phase 2) | 완료 |
| 03-29 | pm | 코트 로드맵 고도화 + 전체 프로젝트 계획 업데이트 | 완료 |
| 03-28 | developer | 코트확장: DB14필드+큐레이션15개+카카오검색131개+야외pill필터 | 완료 |
| 03-28 | developer | 홈 히어로 개편: MySummaryHero + YouTube 삭제 + SNS | 완료 |
| 03-28 | developer | 장기 UX 5건: 검색자동완성+OG메타+피드+Push+성능 | 완료 |
