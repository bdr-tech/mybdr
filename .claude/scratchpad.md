# 작업 스크래치패드

## 현재 작업
- **요청**: 웹(PWA) 백그라운드 위치 기반 자동 체크인 기술 조사
- **상태**: 조사 완료
- **현재 담당**: planner-architect

### 기획설계 (planner-architect) -- 백그라운드 위치 기반 자동 체크인 기술 조사

목표: 웹(PWA)에서 사용자가 코트 근처에 도착하면 자동으로 체크인되는 기능이 가능한지 조사

---

#### 1. 웹 Background Geolocation API 현황 -- "불가능"

| 항목 | 결론 |
|------|------|
| 백그라운드 Geolocation | 불가. 탭/앱이 백그라운드로 가면 위치 추적 중단됨 |
| Service Worker에서 위치 접근 | 불가. Geolocation API는 SW에 노출되지 않음 (W3C 제안만 존재, 구현 없음) |
| PWA 설치 vs 브라우저 탭 차이 | 거의 동일. PWA 설치해도 백그라운드 위치 접근 불가 |
| watchPosition 백그라운드 동작 | Android Chrome에서 "이미 실행 중"이면 알림과 함께 계속 감시되나, iOS Safari는 즉시 중단 |
| iOS Safari | 백그라운드 위치 완전 차단. Background Sync도 미지원 |
| Android Chrome | 제한적 허용 (watchPosition이 이미 실행 중일 때만, 알림 표시) |

비유: 웹 앱은 "건물 안에서만 일할 수 있는 직원"과 같다. 건물(브라우저 탭) 밖으로 나가면(백그라운드) 아무것도 할 수 없다. 네이티브 앱은 "자유롭게 돌아다니는 직원"이라 밖에서도 일할 수 있다.

#### 2. Web Geofencing API -- "사실상 폐기"

| 항목 | 상태 |
|------|------|
| W3C Geofencing API 스펙 | Editor's Draft 단계에서 방치됨 (진행 없음) |
| 브라우저 구현 | 없음. Chrome, Safari, Firefox 모두 미구현 |
| 향후 전망 | 구현 가능성 극히 낮음 (개인정보 우려로 브라우저 벤더들이 소극적) |

비유: 지오펜싱은 "특정 구역에 들어오면 자동으로 울리는 알람"인데, 웹 브라우저에는 이 알람 시스템 자체가 설치되어 있지 않다.

#### 3. 대안 기술 비교표

| 방식 | 웹 지원 | iOS | Android | 백그라운드 | 구현 난이도 | 비용 |
|------|---------|-----|---------|-----------|-----------|------|
| (A) 포그라운드 위치 감지 | O | O | O | X | 낮음 | 무료 |
| (B) QR 코드 스캔 | O | O | O | 해당없음 | 매우 낮음 | 인쇄비만 |
| (C) NFC 태그 | 부분 | X (Safari 미지원) | O (Chrome만) | 해당없음 | 낮음 | 태그당 500원 |
| (D) URL 기반 (코트별 고유 링크) | O | O | O | 해당없음 | 매우 낮음 | 무료 |
| (E) BLE 비콘 | X (웹 불가) | 네이티브만 | 네이티브만 | 네이티브만 | 높음 | 비콘 3-5만원/개 |
| (F) Flutter 앱 백그라운드 GPS | 해당없음 | O | O | O | 높음 | 개발비 |

#### 4. 추천 방안 -- 단계별 로드맵

**[1단계] QR 코드 원탭 체크인 (가장 현실적, 1-2일)** <<<< 강력 추천
- 코트마다 고유 QR 코드 생성 (URL: /courts/{id}/checkin?auto=true)
- 사용자가 QR 스캔 -> 로그인 상태면 즉시 체크인 (버튼 1번 탭)
- 코트에 QR 스티커/현수막 부착
- 장점: iOS/Android 모두 100% 지원, 구현 매우 쉬움, 위치 위조 불가
- 단점: 물리적 QR 설치 필요, 사용자가 "스캔" 행동 필요

**[2단계] 포그라운드 근접 감지 + 푸시 알림 (1주)**
- /courts 페이지 열려있을 때 watchPosition으로 위치 추적
- 코트 100m 이내 접근 시 슬라이드업 카드 "여기서 농구하세요?" (이미 Phase 2에 계획됨)
- Web Push로 "근처 코트 발견" 알림 (앱이 백그라운드여도 푸시는 가능)
- 장점: 앱 열려있으면 자동 감지, 푸시는 백그라운드에서도 도달
- 단점: 앱을 열고 있어야 위치 감지 가능

**[3단계] 코트별 고유 URL + NFC (선택, 1주)**
- 코트에 NFC 태그 부착 (Android Chrome 사용자용)
- NFC 탭 -> 코트 체크인 페이지로 즉시 이동
- 장점: 터치 한 번으로 체크인
- 단점: iOS Safari 미지원 (QR 코드와 병행 필수)

**[장기] Flutter 앱 전환 시 (6개월+)**
- 진짜 백그라운드 GPS + 지오펜싱 가능
- 코트 반경 진입 시 자동 체크인 (사용자 행동 불필요)
- 이것만이 "완전 자동" 체크인을 구현할 수 있는 유일한 방법

#### 5. 최종 결론

| 질문 | 답변 |
|------|------|
| 웹에서 백그라운드 자동 체크인 가능? | **불가능** (브라우저 기술 한계) |
| 가장 현실적인 대안? | **QR 코드 원탭 체크인** (1단계) |
| 반자동 체크인 가능? | **가능** -- 앱 열려있을 때 근접 감지 (2단계) |
| 완전 자동이 필요하면? | **Flutter 네이티브 앱만 가능** (장기) |

#### 6. 1단계 QR 체크인 구현 계획 (developer용)

| 순서 | 작업 | 담당 | 선행 조건 |
|------|------|------|----------|
| 1 | /courts/[id]/checkin?auto=true 쿼리 파라미터 처리 추가 | developer | 없음 |
| 2 | QR 코드 생성 유틸리티 (코트 ID -> QR 이미지) | developer | 없음 |
| 3 | 코트 상세 페이지에 "QR 코드 보기" 버튼 추가 (관리자용) | developer | 1, 2 |
| 4 | QR 스캔 -> 비로그인 시 로그인 유도 -> 체크인 플로우 | developer | 1 |
| 5 | tsc + 테스트 | tester | 1-4 |

주의사항:
- GPS 근접 검증은 QR 체크인에서 생략 가능 (QR 자체가 현장 증거)
- 기존 checkin API (/api/web/courts/[id]/checkin) 그대로 활용
- QR 라이브러리: qrcode (npm) 또는 서버사이드 생성

---

### 테스트 결과 (tester) -- 2026-03-29 GPS 거리 검증 + 중복 체크인 UI

#### 1. 타입 검사
| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| tsc --noEmit | PASS | 에러 0건 |

#### 2. API 검증 (route.ts)
| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| haversineDistanceM 수학 공식 | PASS | R=6371000m, toRad 변환, sin/cos/atan2 표준 Haversine |
| body에 lat/lng 없을 때 400 반환 | PASS | checkinLat/Lng == null 검사 -> 400 LOCATION_REQUIRED |
| 100m 초과 시 400 TOO_FAR | PASS | distanceM > MAX_CHECKIN_DISTANCE_M(100) -> 400 반환 |
| 409에 checked_in_court_id/name 포함 | PASS | extra 파라미터로 court_id + court_name 전달 |
| 코트 lat/lng DB 조회 | PASS | prisma select에 latitude, longitude 포함 |
| 코트 0,0 위경도 시 거리 검증 스킵 | PASS | courtLat !== 0 && courtLng !== 0 조건 |

#### 3. UI 검증 (court-checkin.tsx)
| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| 5단계 상태 분기 | PASS | 체크인중/다른코트(SWR)/다른코트(409)/로딩/위치거부/100m초과/정상 |
| 위치 확인 중 로딩 UI | PASS | locationEnabled===null -> "위치 확인 중..." + 스피너 |
| 위치 비활성화 시 비활성+안내 | PASS | locationEnabled===false -> location_off 아이콘 + 안내 |
| 100m 초과 거리 표시+비활성 | PASS | distanceToCourtM>100 -> Xm/Xkm 표시 (1000m 기준 변환) |
| "보기" 버튼 경로 | PASS | router.push(/courts/${checkedInCourtId}) |
| "체크아웃" 버튼 DELETE API | PASS | fetch DELETE /api/web/courts/${checkedInCourtId}/checkin |
| 체크아웃 후 상태 초기화+mutate | PASS | setCheckedInCourtId(null) + setCheckedInCourtName(null) + mutate() |
| POST body에 latitude/longitude 포함 | PASS | JSON.stringify({ method, latitude: userLat, longitude: userLng }) |
| CSS 변수 사용 | PASS | 모든 색상 var(--color-*) 사용, 하드코딩 없음 |
| Material Symbols 아이콘 | PASS | span.material-symbols-outlined 형태 |

#### 4. response.ts 호환성
| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| extra 파라미터 optional | PASS | extra?: Record<string, unknown> -- 기존 호출 영향 없음 |
| extra 데이터 JSON 포함 | PASS | ...extra 스프레드로 응답 최상위에 병합 |
| 기존 apiError 호출 호환 | PASS | 40+ 기존 호출 모두 2-3개 인자만 사용, 4번째 인자 생략 |

#### 5. page.tsx
| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| courtLat/courtLng props 전달 | PASS | courtLat={lat} courtLng={lng} (line 308) |
| DB 쿼리에서 lat/lng select | PASS | include로 전체 필드 조회, court.latitude/longitude 접근 |

#### 6. 엣지 케이스
| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| 코트 위경도 0,0 처리 | PASS | API: 검증 스킵, UI: distanceToCourtM=0 -> 체크인 허용 |
| 코트 lat=0 lng!=0 또는 반대 | WARN | API는 둘 다 0일 때만 스킵, UI도 동일 -- 문제 없으나 주의 |
| 위치 권한 나중에 취소 | PASS | getCurrentPosition 1회 호출, 이후 취소해도 기존 값 유지 |
| 체크아웃 API 실패 시 에러 처리 | PASS | res.ok 확인 -> alert(err.error) -> finally에서 setLoading(false) |
| 409 후 체크아웃 성공 시 재체크인 | PASS | 상태 초기화 후 mutate -> 정상 체크인 버튼 표시 |

종합: 25개 PASS / 0개 FAIL / 1개 WARN

WARN 상세: 코트 위경도가 lat=0, lng!=0 (적도 어딘가) 같은 경우는 현실적으로 한국 코트에서 발생하지 않으므로 실질적 문제 없음

---

### 구현 기록 (developer) -- 2026-03-29 체크인 GPS 거리 검증

📝 구현한 기능: 체크인 시 GPS 거리 검증 (100m 이내) + 위치 기반 UI 상태 분기 + 409에 코트 정보 추가

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/lib/api/response.ts | apiError에 extra 파라미터 추가 (추가 데이터 포함 가능) | 수정 |
| src/app/api/web/courts/[id]/checkin/route.ts | Haversine 함수 + GPS 100m 거리 검증 + 409에 코트 ID/이름 포함 | 수정 |
| src/app/(web)/courts/[id]/_components/court-checkin.tsx | 위치 기반 5단계 UI 분기 + 다른 코트 체크아웃 + 거리 표시 | 수정 |
| src/app/(web)/courts/[id]/page.tsx | CourtCheckin에 courtLat, courtLng props 전달 | 수정 |

💡 tester 참고:
- 테스트 방법: /courts/[id] 상세 페이지에서 체크인 버튼 확인
- 위치 확인 중: "위치 확인 중..." 로딩 표시 (짧은 시간)
- 위치 거부: "위치 서비스를 활성화해주세요" 비활성 상태
- 100m 초과: "코트에서 Xm/Xkm 떨어져 있어요" 비활성 상태 (개발자 도구 위치 오버라이드로 테스트)
- 100m 이내: 기존처럼 "농구 시작! 체크인" 버튼 활성화
- 다른 코트 체크인 중 (409): 코트 이름 표시 + "체크인 중인 농구장 보기" + "체크아웃" 버튼
- 코트 위경도가 0,0인 경우: 거리 검증 스킵 (어디서든 체크인 가능)

⚠️ reviewer 참고:
- apiError 헬퍼에 optional extra 파라미터 추가 (기존 호출에 영향 없음)
- API에서 latitude/longitude 없으면 400 반환 (기존 body.lat/lng → body.latitude/longitude로 변경)
- Haversine 공식은 API와 UI 양쪽에 존재 (서버: 보안 검증, 클라이언트: UX 표시)

---

### 이전 구현 기록 (거리 계산 + 근접 감지)

📝 구현한 기능: 거리 계산 + 거리순 정렬 + 거리 표시 + 100m 근접 감지 슬라이드업

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/components/shared/kakao-map.tsx | 현위치 줌 레벨 5→7 (약 20km 반경) | 수정 |
| src/app/(web)/courts/_components/courts-content.tsx | Haversine 거리 계산 + 거리순 정렬 + 카드에 거리 표시 + 근접 감지 슬라이드업 | 수정 |

💡 tester 참고:
- 테스트 방법: /courts 페이지 접속 -> 위치 권한 허용 -> 목록이 가까운 순으로 정렬 확인
- 거리 표시: CourtListCard에 "near_me 1.2km" 형태, MiniCourtCard에도 동일
- 근접 감지: 코트 100m 이내 접근 시 하단에 "근처 농구장 발견!" 슬라이드업 카드
  - 체크인 버튼 → /courts/[id] 상세 페이지로 이동
  - 닫기 버튼 → 30분간 재표시 안됨 (sessionStorage)
- 위치 거부 시: 기존과 동일하게 야외우선+검증우선+평점순 정렬
- 주의: 실제 코트 근처에서 테스트하기 어려우므로, 개발자 도구에서 위치 오버라이드로 테스트 권장

⚠️ reviewer 참고:
- API/데이터 패칭 변경 없음
- Haversine 공식은 외부 라이브러리 없이 순수 계산 함수로 구현
- watchPosition은 페이지 unmount 시 clearWatch로 정리 (배터리 절약)
- sessionStorage 키: bdr_proximity_dismissed (30분 TTL)

---

#### 이전 구현 기록 (카카오맵 연동)

📝 구현한 기능: 카카오맵 JS SDK 연동 + /courts 지도+목록 분할 뷰

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/courts/layout.tsx | 카카오맵 SDK Script 로드 (courts 하위에서만) | 신규 |
| src/components/shared/kakao-map.tsx | KakaoMap 공통 컴포넌트 (마커+클러스터+현위치+인포윈도우) | 신규 |
| src/app/(web)/courts/_components/courts-content.tsx | 지도+목록 분할 레이아웃으로 전면 재설계 | 수정 |
| src/app/globals.css | slide-up 애니메이션 추가 (모바일 미니카드용) | 수정 |

💡 tester 참고:
- 테스트 방법: /courts 페이지 접속 -> 지도 표시 확인, 마커 클릭 시 우측 목록 하이라이트 확인
- PC: 좌측 60% 지도 + 우측 40% 스크롤 목록
- 모바일: 상단 [지도]/[목록] 토글, 지도에서 마커 클릭 시 하단 미니카드
- 필터: 전체/야외/실내 탭 + 지역 드롭다운 + 무료/조명/풀코트/사람있는곳 pill
- 현위치 버튼: 좌하단, 위치 권한 허용 시 현위치로 이동
- 정상 동작: 지도에 마커 표시, 클러스터링, 마커 클릭 시 인포윈도우+목록 하이라이트
- 주의: NEXT_PUBLIC_KAKAO_JS_KEY 환경변수 필요 (.env에 이미 있음)

⚠️ reviewer 참고:
- API/데이터 패칭 코드 전혀 변경 없음 (page.tsx 그대로)
- KakaoMap 컴포넌트는 shared에 배치하여 향후 재사용 가능
- SDK 폴링: kakao.maps가 아직 안 로드됐을 때 500ms 간격 최대 20회 재시도
- window.kakao 타입은 any로 선언 (카카오 공식 타입 패키지 없음)

---

#### 이전 구현 기록 (코트 Phase 2)

📝 구현한 기능: 코트 체크인/체크아웃 + 혼잡도 시스템

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| prisma/schema.prisma | court_sessions 모델 추가 + User/court_infos relation | 수정 |
| src/app/api/web/courts/[id]/checkin/route.ts | GET(현황)/POST(체크인)/DELETE(체크아웃) API | 신규 |
| src/app/(web)/courts/[id]/_components/court-checkin.tsx | 체크인UI+혼잡도 표시 (useSWR 30초) | 신규 |
| src/app/(web)/courts/[id]/page.tsx | CourtCheckin 컴포넌트 삽입 | 수정 |
| src/app/(web)/courts/page.tsx | 활성 세션 수 쿼리 + courts에 전달 | 수정 |
| src/app/(web)/courts/_components/courts-content.tsx | 목록 카드에 혼잡도 뱃지 추가 | 수정 |

💡 tester 참고:
- 테스트 방법: /courts 목록에서 혼잡도 뱃지 확인, /courts/[id] 상세에서 체크인 버튼 클릭
- 정상 동작: 로그인 후 체크인 -> 경과시간 표시 -> 체크아웃 -> XP 알림
- 주의할 입력: 이미 체크인 중일 때 다른 코트 체크인 시도 (409 에러 확인)

⚠️ reviewer 참고:
- court_sessions는 기존 court_checkins와 별도 모델 (기존 체크인 데이터 유지)
- 3시간 자동 만료: API 호출 시 cutoff 시간 체크로 구현 (Cron 불필요)

---

## 📊 전체 프로젝트 진행 현황

### ✅ 완료된 작업 (toss 브랜치)
| 영역 | 내용 | 상태 |
|------|------|------|
| 토스 UI 전환 | 디자인 토큰+레이아웃+공통 컴포넌트+전 페이지 | ✅ |
| 대회 시스템 | 3단계 위자드+형식4종+상태4종+디자인템플릿+이미지업로드 | ✅ |
| 코트 시스템 | DB확장+672개 실데이터+야외필터+카카오연동 | ✅ |
| 관리자 개편 | 컴팩트 테이블+모달+탭+13개 관리 페이지 | ✅ |
| 성능 최적화 | ISR+SWR+캐시+프리페치+batch API | ✅ |
| UX 개선 23건 | 단기10+중기8+장기5 전부 완료 | ✅ |
| 구조 개선 | 상수 통일+미사용 정리+흐름 연결 | ✅ |
| BDR 랭킹 | 외부 xlsx 연동 (일반부/대학부) | ✅ |

### 🔜 코트 시스템 로드맵 (다음 작업)

**Phase 2: 체크인 + 혼잡도 (1주)**
| # | 작업 | 시간 | 핵심 |
|---|------|------|------|
| 1 | DB: court_sessions 테이블 생성 | 30분 | 체크인/아웃/세션시간/XP |
| 2 | 체크인 API: /api/web/courts/[id]/checkin | 1시간 | 수동+GPS근접 체크인 |
| 3 | 체크아웃 API + 3시간 자동 만료 | 1시간 | Vercel Cron |
| 4 | 코트 상세에 체크인 버튼 + 현재 인원 | 2시간 | "🏀 농구 시작!" |
| 5 | 코트 목록에 혼잡도 표시 | 1시간 | 🔥활발/😊적당/😴한적 |
| 6 | GPS 근접 감지 슬라이드업 카드 | 2시간 | 100m이내 자동 유도 |

**Phase 3: 리뷰 + 상태 제보 (1주)**
| # | 작업 | 시간 |
|---|------|------|
| 1 | DB: court_reviews 테이블 | 30분 |
| 2 | 리뷰 작성 폼 (별점5항목+텍스트+사진) | 3시간 |
| 3 | 코트 상세에 리뷰 목록 표시 | 2시간 |
| 4 | 코트 평균 별점 자동 계산 | 1시간 |
| 5 | 상태 제보 ("골대 파손" 등 긴급 정보) | 2시간 |

**Phase 4: 게이미피케이션 (1주)**
| # | 작업 | 시간 |
|---|------|------|
| 1 | XP + 레벨 시스템 (10레벨, 칭호) | 3시간 |
| 2 | 연속 출석 스트릭 (7일 보너스) | 2시간 |
| 3 | 코트 도장깨기 (서울30곳 수집) | 3시간 |
| 4 | 세션 완료 카드 (오늘의 농구 요약) | 2시간 |
| 5 | 코트별 체크인 랭킹 TOP 10 | 2시간 |

**Phase 5: 픽업게임 모집 (2주)**
| # | 작업 | 시간 |
|---|------|------|
| 1 | DB: pickup_games + participants 테이블 | 1시간 |
| 2 | 코트 상세에 픽업게임 모집 섹션 | 3시간 |
| 3 | 픽업게임 생성 폼 (제목/시간/인원/실력) | 3시간 |
| 4 | 참가/취소 API | 2시간 |
| 5 | 즐겨찾기 코트 새 픽업게임 알림 | 3시간 |

**Phase 6: 카카오맵 인터랙티브 지도 (1주)**
| # | 작업 | 시간 |
|---|------|------|
| 1 | 카카오맵 JS SDK 연동 | 3시간 |
| 2 | 커스텀 마커 (혼잡도 색상) | 3시간 |
| 3 | 마커 클릭 → 코트 미니카드 | 2시간 |
| 4 | 현위치 기반 반경 검색 | 2시간 |
| 5 | 지도 ↔ 목록 토글 (모바일) | 2시간 |

### 🔮 장기 로드맵

| 영역 | 작업 | 시기 |
|------|------|------|
| **코트 앰배서더** | 코트별 관리자 지정, 정보 업데이트 권한 | 2개월 |
| **주간 운동 리포트** | 월요일 푸시 알림 (운동 시간/코트/스트릭) | 2개월 |
| **코트 3x3 이벤트** | 야외 코트 마이크로 대회 시스템 | 3개월 |
| **GPS 밀집도 히트맵** | 실시간 코트 혼잡도 지도 시각화 | 3개월 |
| **대관 광고 모델** | 민간 체육관 유료 상단 노출 | 6개월 |
| **Flutter 앱** | 진짜 백그라운드 GPS + 네이티브 푸시 | 6개월+ |

---

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 03-29 | pm | 코트 로드맵 고도화 + 전체 프로젝트 계획 업데이트 | 완료 |
| 03-28 | developer | 코트확장: DB14필드+큐레이션15개+카카오검색131개+야외pill필터 | 완료 |
| 03-28 | developer | 코트 실데이터: Google Places 528개 수집 | 완료 |
| 03-28 | developer | 홈 히어로 개편: MySummaryHero + YouTube 삭제 + SNS | 완료 |
| 03-28 | developer | 장기 UX 5건: 검색자동완성+OG메타+피드+Push+성능 | 완료 |
| 03-28 | developer | 중기 UX 8건: 프로필유도+플로팅CTA+알림탭+배지 | 완료 |
| 03-28 | developer | 단기 UX 10건: 토스트+검색+히어로+빈상태CTA 등 | 완료 |
| 03-28 | developer | 프로젝트 정리: logout+고립페이지+미사용삭제+흐름연결 | 완료 |
| 03-28 | developer | 대회 상태 4종 전체 통일 + Zod 검증 수정 | 완료 |
| 03-28 | developer | admin UI 전면 개편: 모달+탭+8페이지 (17파일) | 완료 |
