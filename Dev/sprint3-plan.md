# MyBDR Sprint 3 기획서

> PM: Dylan | 작성일: 2026-03-27
> 근거: subin 머지 완료 후 현행 분석 + plan.md 갭 분석
> 상태: **⛔ 사장 승인 대기**

---

## 1. 프로젝트 목적

**"subin 머지 후 안정화 + 핵심 미완 기능 마감 → 실사용 가능한 MVP 완성"**

### 성공 기준 (KPI)
- 알림 시스템: 대회/팀/경기 이벤트 시 유저에게 알림 도달률 100%
- 프로필 완성률: profile_completed = true 유저 비율 추적 가능
- 빌드 안정성: `next build` 에러 0, TypeScript strict 통과
- 페이지 로드: TTFB < 1s (warm), < 3s (cold)

---

## 2. 범위 정의

### In-Scope (이번 스프린트)

| # | 기능 | 근거 | 우선순위 |
|---|------|------|----------|
| S3-1 | 알림 시스템 완성 | plan.md §6, 현재 40% | **Must** |
| S3-2 | 알림 UI (알림 센터 페이지) | 알림 발송만 있고 확인 UI 없음 | **Must** |
| S3-3 | Flutter API 호환성 검증 + 수정 | §9.20.1 보호 5파일, bdr_stat 앱 영향 | **Must** |
| S3-4 | QA — 전체 페이지 스모크 테스트 | subin 머지 후 첫 QA | **Must** |
| S3-5 | 대회 참가 신청 플로우 E2E 검증 | 7단계 위자드 + join API + 알림 | **Should** |
| S3-6 | 프로필 온보딩 플로우 검증 | complete/page → preferences → 홈 | **Should** |
| S3-7 | 다크모드 전체 페이지 QA | attribute selector 방식 취약점 | **Could** |

**알림기능은 핵심 기술이어야하고, 프로필 정보에 있는 계좌정보와 승인/거절등의 트랜잭션을 주고받는 것이 되어야해.pwa 방식으로 앱을 깔면 push알림도 연동되도록 해야함**

### Out-of-Scope (이번 아님)

| 항목 | 사유 |
|------|------|
| OAuth 통합 (카카오/네이버/구글) | 별도 프로젝트로 분리 확정 |
| 결제/구독 시스템 | 비즈니스 모델 확정 후 |
| bdr_stat 웹 관리 UI (기록원 배정) | §8 전체가 별도 스프린트 |
| 이메일 알림 발송 | SMTP/서드파티 선정 필요, Phase 2 |

### Phase 2 후보

| 항목 | 비고 |
|------|------|
| OAuth 통합 | Sprint 4 후보 |
| 이메일 알림 (SendGrid/Resend) | 알림 시스템 완성 후 |
| 실시간 알림 (WebSocket/SSE) | Supabase Realtime 활용 가능 |
| bdr_stat 기록원 관리 UI | §8.4~§8.6 |

---

## 3. 요구사항 정의

### S3-1: 알림 시스템 완성

```
FR-301: 알림 발송 트리거 전체 연결
- 우선순위: Must
- 설명: 아래 이벤트 발생 시 대상 유저에게 알림 자동 생성
  ① 경기 신청 승인/거절 → 신청자
  ② 팀 가입 신청 → 팀 캡틴
  ③ 팀 가입 승인/거절 → 신청자
  ④ 대회 참가 신청 접수 → 주최자
  ⑤ 대회 참가 승인 → 신청 팀 대표
  ⑥ 경기 취소 → 양팀 전체 선수 (이미 구현)
- 인수 기준:
  Given 유저가 경기를 신청하고
  When 호스트가 승인 버튼을 누르면
  Then 신청자에게 "경기 신청이 승인되었습니다" 알림이 생성된다
- 비기능: 알림 생성 < 500ms, 벌크 알림 (경기 취소) < 2s
```

```
FR-302: 알림 읽음 처리
- 우선순위: Must
- 설명: 개별 알림 클릭 시 read_at 타임스탬프 기록, "모두 읽음" 일괄 처리
- 인수 기준:
  Given 읽지 않은 알림 5개가 있을 때
  When "모두 읽음" 버튼을 누르면
  Then 5개 알림 모두 read_at이 현재 시각으로 업데이트된다
```

```
FR-303: 알림 만료 자동 정리
- 우선순위: Should
- 설명: 30일 이상 된 알림은 자동 삭제 (cron 또는 DB trigger)
- 비기능: 정리 작업은 일 1회, 5초 이내 완료
```

### S3-2: 알림 센터 UI

```
FR-304: 알림 목록 페이지 (/notifications)
- 우선순위: Must
- 설명: 전체 알림 목록, 읽음/안읽음 구분, 클릭 시 해당 리소스로 이동
- 인수 기준:
  Given 알림 목록 페이지에 접속하면
  When 안 읽은 알림 카드를 탭하면
  Then 알림이 읽음 처리되고 해당 리소스(경기/팀/대회)로 이동한다
- 관련 화면: /notifications (이미 페이지 존재, 기능 보강 필요)
```

```
FR-305: 헤더 알림 배지 실시간 카운트
- 우선순위: Must
- 설명: 헤더 BellIcon에 안 읽은 알림 수 표시 (이미 구현, 검증만)
- 인수 기준:
  Given 새 알림이 생성되면
  When 다른 페이지로 이동할 때
  Then 배지 숫자가 갱신된다
```

### S3-2.5: PWA 푸시 알림 (사장님 추가 요구)

```
FR-310: PWA 푸시 알림 권한 요청 + 구독 등록
- 우선순위: Must
- 설명: PWA 앱 설치 유저에게 Notification.requestPermission() 요청,
  승인 시 PushSubscription을 서버에 저장 (VAPID 키 기반)
- 인수 기준:
  Given 로그인 유저가 PWA 앱을 설치한 상태에서
  When "알림 받기" 버튼을 누르면
  Then 브라우저 권한 팝업 → 승인 → 구독 정보가 DB에 저장된다
- 비기능: VAPID 키 쌍 생성, 구독 정보 users 테이블에 저장
```

```
FR-311: 알림 생성 시 PWA 푸시 자동 발송
- 우선순위: Must
- 설명: createNotification() 호출 시, 해당 유저에게 push_subscription이 있으면
  Web Push API로 실시간 푸시 발송 (Service Worker에서 수신)
- 인수 기준:
  Given 유저가 푸시 알림을 허용한 상태에서
  When 경기 신청이 승인되면
  Then 브라우저/PWA 앱에 푸시 알림이 즉시 표시된다
- 비기능: 발송 실패 시 silent fail (구독 만료 시 자동 정리)
```

```
FR-312: 대회 참가비 계좌정보 알림
- 우선순위: Must
- 설명: 대회 참가 승인 시 알림에 계좌정보(은행/계좌번호/예금주) 포함,
  참가비 입금 안내 푸시 발송
- 인수 기준:
  Given 대회에 참가비가 설정되어 있고 팀이 참가 승인되면
  When 알림이 생성될 때
  Then 알림 content에 "참가비 X원 / 계좌: OO은행 XXXX / 예금주: OOO" 포함
```

### S3-3: Flutter API 호환성
**이건 미리 했던 내용이 있어서 수행이 되는걸 확인했으니 조금만 더 다듬으면 될듯.**
```
FR-306: bdr_stat 앱 API 응답 검증
- 우선순위: Must
- 설명: 보호 중인 5개 API 엔드포인트의 응답 형식이 Flutter 앱과 호환되는지 검증
  ① GET /api/v1/tournaments/[id]/full-data — game_rules, user_name, user_nickname, is_active
  ② GET /api/v1/matches/[id]/stats — quarterScores 포함 여부
  ③ POST /api/v1/tournaments/verify — game_rules select
  ④ 로그인 /api/v1/auth/login — JWT 페이로드
  ⑤ 매치 동기화 /api/v1/tournaments/[id]/matches/sync — postProcessStatus
- 인수 기준:
  Given bdr_stat 앱에서 대회 데이터를 요청하면
  When full-data API를 호출할 때
  Then game_rules, user_name, user_nickname, is_active 필드가 모두 포함된다
```

### S3-4: 전체 스모크 테스트

```
FR-307: 주요 페이지 접근성 검증
- 우선순위: Must
- 설명: subin 머지 후 모든 주요 경로가 200 응답 + 렌더 에러 없음 확인
- 대상 페이지:
  홈, 경기목록, 경기상세, 경기생성, 팀목록, 팀상세, 대회목록, 대회상세,
  대진표, 커뮤니티, 프로필, 프로필편집, 알림, 랭킹, Admin 대시보드
- 인수 기준:
  Given 비로그인 상태에서
  When 각 공개 페이지에 접속하면
  Then HTTP 200 + 콘솔 에러 없음 + 레이아웃 깨짐 없음
```

### S3-5: 대회 참가 플로우 E2E

```
FR-308: 대회 참가 신청 → 알림 → 관리 전체 플로우
- 우선순위: Should
- 설명:
  ① 대회 상세 → "참가 신청" 버튼
  ② join 위자드 4단계 (팀→부→로스터→확인)
  ③ API 호출 → TournamentTeam + Players 생성
  ④ 주최자에게 알림 발송
  ⑤ tournament-admin에서 승인/거절
- 인수 기준:
  Given 모집 중인 대회가 있을 때
  When 팀 대표가 참가 신청을 완료하면
  Then TournamentTeam이 pending 상태로 생성되고 주최자에게 알림이 간다
```

### S3-6: 프로필 온보딩 플로우

```
FR-309: 신규 가입 → 프로필 완성 → 선호 설정 플로우
- 우선순위: Should
- 설명:
  ① /signup → 가입
  ② /profile/complete → 필수 정보 입력 (이름/전화/지역/포지션)
  ③ /profile/complete/preferences → 관심 종별/경기유형 설정
  ④ 완료 시 profile_completed = true 자동 세팅
- 인수 기준:
  Given 신규 유저가 프로필 완성 페이지에서 모든 필수 필드를 입력하면
  When "완료" 버튼을 누르면
  Then DB profile_completed = true 되고 선호 설정 페이지로 이동한다
```

---

## 4. WBS (작업 분해)

### S3-1: 알림 시스템 (3일)

| ID | 작업 | 의존성 | 예상 | 담당 |
|----|------|--------|------|------|
| W-301 | 알림 트리거 매핑 정리 (어떤 이벤트→어떤 알림) | - | 0.5d | Dylan |
| W-302 | createNotification 헬퍼 검증 + 누락 트리거 연결 | W-301 | 1d | Ethan |
| W-303 | 경기 신청 승인/거절 알림 연결 | W-302 | 0.5d | Ethan |
| W-304 | 팀 가입 승인/거절 알림 연결 | W-302 | 0.5d | Ethan |
| W-305 | 대회 참가 신청/승인 알림 연결 | W-302 | 0.5d | Ethan |

### S3-2: 알림 UI (2일)

| ID | 작업 | 의존성 | 예상 | 담당 |
|----|------|--------|------|------|
| W-306 | /notifications 페이지 기능 보강 (읽음처리, 리소스 링크) | W-302 | 1d | Ethan |
| W-307 | "모두 읽음" API + UI | W-306 | 0.5d | Ethan |
| W-308 | 알림 만료 cron (30일) | W-302 | 0.5d | Ethan |

### S3-2.5: PWA 푸시 알림 (3일)

| ID | 작업 | 의존성 | 예상 | 담당 |
|----|------|--------|------|------|
| W-320 | VAPID 키 생성 + 환경변수 설정 | - | 0.5d | Ethan |
| W-321 | push_subscription 컬럼 추가 (users 테이블) + API (POST /api/web/push/subscribe) | W-320 | 0.5d | Ethan |
| W-322 | Service Worker push 이벤트 핸들러 (sw.ts) | W-320 | 0.5d | Ethan |
| W-323 | 프론트 "알림 받기" UI + Notification.requestPermission() | W-321 | 0.5d | Ethan |
| W-324 | createNotification()에서 Web Push 자동 발송 연동 | W-321, W-322 | 0.5d | Ethan |
| W-325 | 대회 승인 알림에 계좌정보 포함 | W-305, W-324 | 0.5d | Ethan |

### S3-3: Flutter 호환 (1일)

| ID | 작업 | 의존성 | 예상 | 담당 |
|----|------|--------|------|------|
| W-309 | 5개 보호 API 응답 스냅샷 테스트 작성 | - | 0.5d | Ethan |
| W-310 | bdr_stat 앱 실제 연동 테스트 | W-309 | 0.5d | Ethan |

### S3-4: QA (2일)

| ID | 작업 | 의존성 | 예상 | 담당 |
|----|------|--------|------|------|
| W-311 | 주요 20개 페이지 스모크 테스트 (200 + 에러 없음) | - | 0.5d | Nora |
| W-312 | 대회 참가 E2E 테스트 | W-305 | 0.5d | Nora |
| W-313 | 프로필 온보딩 E2E 테스트 | - | 0.5d | Nora |
| W-314 | 다크모드 주요 페이지 시각 검수 | - | 0.5d | Nora |

### 총 예상: 11일 (2주 스프린트 + 버퍼 3일)

---

## 5. 마일스톤

| 날짜 | 마일스톤 | 산출물 |
|------|---------|--------|
| D+1 | 기획 승인 | 이 문서 승인 |
| D+3 | 알림 시스템 완성 | 6개 트리거 연결 + 읽음 처리 |
| D+5 | 알림 UI 완성 | /notifications 보강 + 모두읽음 + cron |
| D+8 | PWA 푸시 완성 | VAPID + 구독 + 자동 발송 + 계좌정보 |
| D+10 | Flutter 검증 + QA | API 테스트 + 전체 스모크 + E2E |
| D+11 | 릴리스 | 최종 검수 + 배포 승인 |

---

## 6. 리스크 레지스터

```
RISK-301: subin 머지 후 숨은 런타임 에러
- 확률: 3 / 영향: 4 / 점수: 12
- 트리거: 특정 페이지 접속 시 500 에러 또는 빈 화면
- 대응: 완화 — W-311 스모크 테스트로 사전 발견
- 소유자: Nora
```

```
RISK-302: Flutter 앱 호환 깨짐
- 확률: 2 / 영향: 5 / 점수: 10
- 트리거: bdr_stat 앱에서 대회 데이터 로드 실패
- 대응: 완화 — W-309/W-310으로 사전 검증, 5개 보호 파일 유지
- 소유자: Ethan
```

```
RISK-303: 알림 벌크 발송 성능
- 확률: 2 / 영향: 3 / 점수: 6
- 트리거: 대회 경기 취소 시 100명+ 알림 → 타임아웃
- 대응: 완화 — createMany 사용, 필요 시 배치 처리
- 소유자: Ethan
```

```
RISK-304: 다크모드 !important 셀렉터 깨짐
- 확률: 4 / 영향: 2 / 점수: 8
- 트리거: 새 컴포넌트에서 다크모드 미적용
- 대응: 수용 — 이번 스프린트는 시각 검수만, 근본 수정은 Phase 2
- 소유자: Nora
```

```
RISK-305: Vercel 콜드 스타트 TTFB 3s+
- 확률: 3 / 영향: 2 / 점수: 6
- 트리거: 트래픽 적은 시간대 첫 방문
- 대응: 수용 — 무료 플랜 한계, Pro 플랜 전환 시 해결
- 소유자: -
```

---

## 7. RTM (요구사항 추적 매트릭스)

| FR | 작업 | API | 화면 | TC |
|----|------|-----|------|----|
| FR-301 | W-302~305 | POST /api/web/notifications (내부) | - | TC-301 |
| FR-302 | W-306~307 | PATCH /api/web/notifications/[id]/read | /notifications | TC-302 |
| FR-303 | W-308 | /api/cron/notification-cleanup | - | TC-303 |
| FR-304 | W-306 | GET /api/web/notifications | /notifications | TC-304 |
| FR-305 | W-306 | GET /api/web/notifications (unreadCount) | Header BellIcon | TC-305 |
| FR-306 | W-309~310 | /api/v1/* (5개) | bdr_stat 앱 | TC-306 |
| FR-307 | W-311 | 전체 | 20개 페이지 | TC-307 |
| FR-308 | W-312 | /api/web/tournaments/[id]/join | /tournaments/[id]/join | TC-308 |
| FR-309 | W-313 | PATCH /api/web/profile | /profile/complete | TC-309 |

---

## 🛑 사장님 승인 요청

1. **범위(In/Out)** 동의하시나요? 응 . 내용 추가한것도 잇어 확인해서 진행해. 
2. **우선순위** 조정 필요한 항목 있나요? 없어 전부다 할거야. 
3. 승인되면 W-301(알림 트리거 매핑)부터 시작합니다.
