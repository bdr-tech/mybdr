# 작업 스크래치패드

## 현재 작업
- **요청**: 코트 데이터 품질 대청소 (스키마 nullable + 정리 스크립트 + UI null 처리)
- **상태**: 구현 완료, tester 검증 대기
- **현재 담당**: developer

## 구현 기록 (developer)

### 코트 데이터 품질 대청소 구현

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| prisma/schema.prisma | is_free, has_lighting, has_restroom, has_parking, rental_available → Boolean? (nullable) | 수정 |
| scripts/cleanup-court-data.ts | 데이터 정리 스크립트 (추정필드 null화 + 중복 제거 + court_type 정리 + verified 정리) | 신규 |
| src/app/(web)/courts/_components/courts-content.tsx | CourtItem 인터페이스 nullable + 필터 === true + 카드 null 숨김 | 수정 |
| src/app/(web)/courts/[id]/page.tsx | 상세 뱃지 null 숨김 + data_source 출처 표시 + 미검증 안내 | 수정 |
| src/app/(admin)/admin/courts/admin-courts-content.tsx | isFree null → "미확인" 표시 | 수정 |

tester 참고:
- 테스트 방법: /courts 목록 페이지 + /courts/[id] 상세 페이지 확인
- 정상 동작: nullable 필드가 null이면 뱃지 자체가 안 보임 (빈 공간 아닌 완전 숨김)
- 필터 "무료" pill 클릭 시 is_free === true인 것만 나옴 (null은 제외)
- 상세 페이지에 "정보 출처: 카카오맵 (미검증)" 표시 확인
- cleanup 스크립트는 작성만 했고 실행은 안 함

reviewer 참고:
- Prisma index에 is_free가 있는데 nullable로 바꿔도 인덱스는 유지됨

## 테스트 결과 (tester)

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| tsc --noEmit 타입 검사 | 통과 | 에러 0건 |
| Prisma 스키마: 5개 필드 Boolean? | 통과 | is_free, has_lighting, has_restroom, has_parking, rental_available 모두 Boolean? 확인 |
| cleanup 스크립트: curated 제외 로직 | 통과 | NOT { data_source: "manual_curation" } 조건 정확 |
| cleanup 스크립트: 중복 제거 로직 | 통과 | kakao_place_id + 이름+주소 2단계, soft delete(status 변경), 사용이력 우선 보존 |
| cleanup 스크립트: null 초기화 필드 | 통과 | 13개 필드 null 초기화 (surface_type~nearest_station) |
| UI: is_free=null 뱃지 숨김 | 통과 | 목록(is_free !== null 체크) + 상세(동일) 모두 조건부 렌더링 |
| UI: surface_type=null 숨김 | 통과 | 상세 {court.surface_type && ...} 조건부 렌더링 |
| UI: hoops_count=null 숨김 | 통과 | 상세 {court.hoops_count != null && ...} 조건부 렌더링 |
| UI: court_type='unknown' 처리 | 통과 | 상세 "미분류" 레이블 + muted 색상 표시 |
| 필터: 무료 pill → is_free===true만 | 통과 | L178: c.is_free === true (null 제외됨) |
| 필터: 조명 pill → has_lighting===true만 | 통과 | L181: c.has_lighting === true |
| 기존 기능 영향: 체크인/리뷰/제보 | 통과 | API 코드에서 5개 필드 직접 참조 없음, 영향 없음 |
| data_source 출처 표시 | 통과 | 상세 페이지 하단에 출처+미검증 안내 표시 |
| admin: isFree null → "미확인" | 통과 | L220: 3항 분기 (null→미확인, true→무료, false→유료) |

종합: 14개 중 14개 통과 / 0개 실패

### 주의사항 (수정 불필요, 참고용)
- Prisma 스키마의 is_free 기본값이 @default(true)로 남아있음. 새 코트 삽입 시 자동으로 "무료"로 설정됨. cleanup 스크립트가 기존 데이터만 null화하므로 현재 동작에는 문제없으나, 향후 카카오 검색으로 새 코트 추가 시 is_free 기본값을 null로 변경하는 것이 더 정확할 수 있음.

## 전체 프로젝트 진행 현황

### 코트 로드맵 (남은 Phase)
| Phase | 내용 | 상태 |
|-------|------|------|
| 데이터 정리 | 스키마+UI nullable 처리 | 구현 완료 |
| 데이터 정리 | cleanup 스크립트 실행 + 카카오 재검증 | 대기 |
| 데이터 정리 | 유저 위키 시스템 | 대기 |
| Phase 5 | 픽업게임 모집 | 대기 |

---

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 03-29 | debugger | 코트 체크인 UI 버튼 미표시 버그: GET API에 courtName 추가 + UI 분기 통합 | 완료 |
| 03-29 | developer | 코트 데이터 대청소: schema nullable 5필드 + cleanup 스크립트 + UI null 처리 5파일 | 완료 |
| 03-29 | architect | 코트 데이터 품질 전수 조사 (672개 분석, 98% 추정 데이터 확인) | 완료 |
| 03-29 | developer+tester+reviewer | Phase 4 게이미피케이션 구현+검증 (28항목 전통과) | 완료 |
| 03-29 | developer+tester | Phase 3 리뷰+제보 시스템 구현+검증 (62항목 전통과) | 완료 |
| 03-29 | developer | 체크인 GPS 100m 검증 + 위치기반 5단계 UI + 원격 체크아웃 | 완료 |
| 03-29 | developer | 거리순 정렬 + 20km 반경 뷰 + 근접 감지 슬라이드업 | 완료 |
| 03-29 | developer | 카카오맵 SDK 연동 + 지도+목록 분할 뷰 | 완료 |
| 03-29 | developer | 코트 체크인/체크아웃 + 혼잡도 시스템 (Phase 2) | 완료 |
| 03-28 | developer | 코트확장: DB14필드+큐레이션15개+카카오검색131개+야외pill필터 | 완료 |
| 03-28 | developer | 홈 히어로 개편: MySummaryHero + YouTube 삭제 + SNS | 완료 |
