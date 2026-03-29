---
agent: Dylan (01-기획) + Sophia (02-분석)
status: COMPLETE
version: 1.0
created: 2026-03-29
self-review: PASS
next-trigger: Marcus(03-아키텍트) 기술 설계 검토 요청
blocking-issues: 없음
human-gate: 없음 — 사장 승인 후 구현 착수 가능
---

# 현장 선수 등록 기능 기획서 (Plan: Onsite Player Registration)

> 작성일: 2026-03-29
> 대상 시스템: mybdr (Next.js 15 API) + bdr_stat (Flutter 앱)
> 작성자: Dylan (기획) + Sophia (요구사항 분석)

---

## 1. 프로젝트 목적 및 배경

**목적 (1문장)**: 대회 현장에서 기록원이 Flutter 앱을 통해 선수를 즉시 등록할 수 있도록 하여, 사전등록 미완료 선수로 인한 경기 기록 불가 문제를 해결한다.

### 1.1 문제 정의

현재 bdr_stat 앱은 `full-data` API로 내려받은 선수만 기록에 사용할 수 있다. 현장에서 다음 상황이 발생할 때 기록 불가 상태가 된다.

- 팀 감독이 경기 직전 새 선수를 투입
- 사전등록한 선수가 부상으로 교체됨
- 당일 합류 선수 (대체, 외부 선수)

### 1.2 성공 기준 (KPI)

| 번호 | 기준 | 측정 방법 |
|------|------|----------|
| KPI-1 | 현장 등록 소요 시간 60초 이내 (이름+등번호+포지션 입력 기준) | 사용자 테스트 측정 |
| KPI-2 | 네트워크 오프라인 상태에서도 로컬 임시 저장 후 동기화 성공률 100% | QA 테스트 |
| KPI-3 | 기존 full-data 다운로드 흐름에 영향 없음 (기존 기능 회귀 0건) | 회귀 테스트 |
| KPI-4 | 현장 등록 선수가 기록 화면에서 즉시 선택 가능 | 수동 QA |

---

## 2. 범위 정의

### 2.1 In-Scope

- **API (mybdr)**: `POST /api/v1/tournaments/:id/teams/:teamId/players` — 현장 선수 등록
- **API (mybdr)**: `GET /api/v1/tournaments/:id/teams/:teamId/players` — 등록 선수 목록 조회 (증분 동기화용)
- **Flutter (bdr_stat)**: starter_select_screen 내 "선수 추가" 진입점 제공
- **Flutter (bdr_stat)**: 이름/등번호/포지션 입력 바텀시트 UI
- **Flutter (bdr_stat)**: 오프라인 시 로컬 임시 저장 → 온라인 복구 시 자동 동기화
- **DB**: `TournamentTeamPlayer` 신규 레코드 생성 (userId nullable 처리 전제)
- **인증**: 기존 JWT / API Token 기반 recorder 권한 검증 재사용

### 2.2 Out-of-Scope

- 웹 관리화면에서 현장 등록 선수 승인/반려 기능 (웹 운영 도구는 별도 요청)
- 선수 계정(User) 자동 생성 (계정 없이 player_name만으로 등록)
- 선수 사진/프로필 등록
- 기존 사전등록 흐름 변경
- 현장 등록 선수 통계 집계 별도 분리 표시
- 대회 관리자 알림 (현장 등록 발생 시 push/알림)

### 2.3 Phase 2 후보

- 웹에서 현장 등록 선수 목록 조회 및 승인
- 현장 등록 선수에게 사후 계정 연결
- 현장 등록 제한 수(roster_max) 초과 시 경고/차단
- 현장 등록 선수 이력 관리

---

## 3. 이해관계자 및 사용자 페르소나

### 3.1 이해관계자 맵

| 이해관계자 | 영향도 | 관심도 | 기대사항 |
|-----------|------|------|---------|
| 대회 기록원 (1차 사용자) | 높음 | 높음 | 빠르고 직관적인 현장 등록 |
| 대회 주최자 | 높음 | 중간 | 등록 내역 추적 가능, 악용 방지 |
| 팀 감독/코치 | 중간 | 높음 | 경기 직전 선수 추가 가능 |
| 플랫폼 운영자 | 높음 | 낮음 | DB 무결성, 통계 오염 방지 |

### 3.2 주요 페르소나

**박기록 (기록원, 35세)**
- 비개발자, 스마트폰 능숙
- 경기 시작 5분 전 선수 추가 요청을 받음
- 네트워크 불안정한 실내 체육관에서 작업
- 목표: 경기 지연 없이 선수를 추가하고 즉시 기록 시작

---

## 4. 요구사항 정의 (MoSCoW)

### 4.1 기능 요구사항

#### Must Have

| ID | 요구사항 | 완료 기준 |
|----|---------|---------|
| FR-101 | 기록원이 Flutter 앱에서 특정 팀에 선수를 현장 추가할 수 있다 | starter_select_screen에서 "선수 추가" 버튼 노출, 입력 완료 시 목록에 즉시 표시 |
| FR-102 | 선수 등록 시 필수 항목: 이름(player_name), 등번호(jersey_number) | 두 항목 미입력 시 저장 불가, 에러 메시지 표시 |
| FR-103 | 선수 계정(User) 없이 이름+등번호만으로 등록 가능 | userId null 허용, player_name 필드 사용 |
| FR-104 | 등번호 중복 시 에러 반환 (팀 내 유니크) | "이미 사용 중인 등번호입니다" 메시지 표시 |
| FR-105 | API 호출 성공 시 서버 DB에 TournamentTeamPlayer 레코드 생성 | DB에 is_active=true, player_name 저장 확인 |
| FR-106 | 오프라인 상태에서 현장 등록 시 로컬 SQLite에 임시 저장 | 네트워크 없어도 앱 내 선수 표시, 온라인 복구 시 자동 서버 sync |
| FR-107 | 현장 등록 선수는 즉시 선발/로스터 선택 화면에서 사용 가능 | 등록 후 starter_select_screen 재진입 없이 목록에 표시 |
| FR-108 | 인증: 기록원(recorder) 또는 주최자(organizer) 권한만 허용 | 일반 사용자 호출 시 403 반환 |

#### Should Have

| ID | 요구사항 | 완료 기준 |
|----|---------|---------|
| FR-109 | 포지션(position) 선택 필드 제공 (선택사항) | PG/SG/SF/PF/C 중 선택 가능, 미선택 허용 |
| FR-110 | 현장 등록 선수에 시각적 구분 마커 표시 (앱 내) | 목록에서 "현장등록" 뱃지 또는 아이콘으로 구분 |
| FR-111 | 등록 완료 후 haptic 피드백 제공 | 성공 시 진동 피드백 |
| FR-112 | 현장 등록 API에 rate limit 적용 | 분당 10건 초과 시 429 반환 (어뷰징 방지) |

#### Could Have

| ID | 요구사항 | 완료 기준 |
|----|---------|---------|
| FR-113 | 현장 등록 시 `auto_registered=true` 플래그 저장 (기존 필드 활용) | DB에서 자동등록 여부 추적 가능 |
| FR-114 | 현장 등록 선수 수 표시 (팀 로스터 현황) | 입력 화면에 "현재 N명 / 최대 M명" 표시 |

#### Won't Have (이번 스프린트 제외)

- 웹에서 현장 등록 선수 승인/반려
- 선수 사후 계정 연결
- 현장 등록 이력 감사 로그

### 4.2 비기능 요구사항

| ID | 요구사항 |
|----|---------|
| NFR-101 | API 응답 시간 300ms 이내 (p95) |
| NFR-102 | 오프라인 → 온라인 전환 후 동기화 대기 시간 5초 이내 자동 트리거 |
| NFR-103 | 입력 UI는 키보드 올라온 상태에서도 버튼이 visible해야 함 (56px 이상) |
| NFR-104 | 기존 full-data 다운로드 API 응답 구조 변경 없음 |

---

## 5. 기술 설계 방향 제안

### 5.1 DB 변경

**현재 제약사항 분석**:
```
TournamentTeamPlayer {
  userId      BigInt    @map("user_id")   // NOT NULL — 문제!
  player_name String?                     // 이미 존재
  auto_registered Boolean?                // 이미 존재
}
@@unique([tournamentTeamId, userId])       // userId가 NULL이면 unique 제약 충돌
```

**필요한 마이그레이션**:
```sql
-- 1. userId nullable 허용
ALTER TABLE tournament_team_players
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. userId null인 경우 unique 제약 조건 조정
-- (tournamentTeamId, userId) unique는 userId NOT NULL인 경우에만 의미 있음
-- PostgreSQL은 NULL 값에 대해 unique 제약이 여러 행 허용하므로 자동 해결됨
```

**Prisma 스키마 변경**:
```prisma
model TournamentTeamPlayer {
  userId    BigInt?   @map("user_id")   // nullable로 변경
  users     User?     @relation(...)    // optional로 변경
}
```

> [중요 가정]: userId nullable 허용이 기존 Rails 코드나 다른 API에 영향을 주지 않는지 Marcus(아키텍트)가 검증해야 한다.

### 5.2 API 설계

#### 신규 엔드포인트 1: 현장 선수 등록

```
POST /api/v1/tournaments/:tournamentId/teams/:tournamentTeamId/players
Authorization: Bearer {JWT} | API Token
```

**Request Body**:
```json
{
  "player_name": "김현장",       // required
  "jersey_number": 23,           // required, 0-99
  "position": "SG",              // optional: PG|SG|SF|PF|C
  "birth_date": "1995-03-15"     // optional
}
```

**Response (201)**:
```json
{
  "id": 12345,
  "tournament_team_id": 678,
  "user_id": null,
  "player_name": "김현장",
  "jersey_number": 23,
  "position": "SG",
  "is_active": true,
  "auto_registered": true,
  "is_starter": false
}
```

**에러 케이스**:
- 400: jersey_number 중복 → "이미 사용 중인 등번호입니다 (등번호: 23)"
- 400: player_name 누락 → "선수 이름을 입력하세요"
- 403: 기록원/주최자 권한 없음
- 429: rate limit 초과

#### 신규 엔드포인트 2: 팀 선수 목록 조회 (증분 동기화용)

```
GET /api/v1/tournaments/:tournamentId/teams/:tournamentTeamId/players
Authorization: Bearer {JWT} | API Token
Query: ?updated_after=2026-03-29T10:00:00Z  (선택사항, 증분 조회)
```

**Response (200)**:
```json
{
  "players": [
    {
      "id": 12345,
      "tournament_team_id": 678,
      "user_id": null,
      "player_name": "김현장",
      "user_name": "김현장",
      "jersey_number": 23,
      "position": "SG",
      "is_active": true,
      "auto_registered": true,
      "is_starter": false,
      "updated_at": "2026-03-29T14:30:00Z"
    }
  ]
}
```

### 5.3 Flutter 앱 변경

#### 진입점: starter_select_screen.dart

현재 starter_select_screen은 로컬 DB에서 선수 목록만 표시. 다음을 추가한다.

```
[선수 추가 +] 버튼 → BottomSheet 오픈
  ├── 이름 입력 (TextFormField, required)
  ├── 등번호 입력 (NumberField, 0-99, required)
  ├── 포지션 선택 (DropdownButton, optional)
  └── [등록] 버튼
       ├── 온라인: POST API → 응답 id를 로컬 DB에 저장 → 목록 갱신
       └── 오프라인: 로컬 DB에 임시 저장 (is_synced=false) → 동기화 큐 등록
```

#### 오프라인 처리 전략

기존 sync 인프라(51e6a1b 커밋: 자동 동기화 3종)를 활용한다.

```
1. 로컬 저장 시 id = -1 * timestamp (임시 음수 ID)
2. is_synced = false 컬럼 활용 (또는 신규 추가)
3. 네트워크 복구 감지 시 sync 큐에서 POST 재시도
4. 서버 응답 id로 로컬 임시 ID 교체
```

#### 로컬 DB 변경 (SQLite)

`player_stats_dao.dart` 또는 `tournament_dao.dart`에 연관된 players 테이블에 컬럼 추가:
- `is_onsite_registered INTEGER DEFAULT 0` — 현장 등록 여부
- `is_synced INTEGER DEFAULT 1` — 서버 동기화 여부 (0 = 로컬 미동기화)

### 5.4 인증 재사용 전략

기존 `requireRecorder` 미들웨어를 tournament-level로 확장하거나,
`withAuth` + 기록원 권한 검증 로직을 새 미들웨어로 분리한다.

```typescript
// 신규: requireTournamentRecorder(tournamentId)
// 기존 requireRecorder(matchId)와 다르게 match 없이 tournament 레벨에서 동작
```

---

## 6. WBS (작업분류체계)

### 레벨 1: 기능 영역

```
현장 선수 등록 기능
├── T1. API 서버 (mybdr)
├── T2. DB 마이그레이션
└── T3. Flutter 앱 (bdr_stat)
```

### 레벨 2-3: 세부 작업

#### T1. API 서버

| Task ID | 작업명 | 담당 | 입력 조건 | 완료 기준 | 예상 일수 |
|---------|------|------|---------|---------|--------|
| T1-1 | 기록원 권한 미들웨어 (tournament-level) 구현 | Ethan | T2 완료 | `requireTournamentRecorder(req, tournamentId)` 구현, JWT/API Token 양쪽 동작, 테스트 통과 | 1일 |
| T1-2 | POST 선수 등록 API 구현 | Ethan | T1-1 완료, T2 완료 | 201 정상 응답, 400 중복등번호, 403 권한, 429 rate limit 모두 통과 | 1일 |
| T1-3 | GET 선수 목록 조회 API 구현 (증분) | Ethan | T1-1 완료 | 200 응답, `updated_after` 파라미터 동작, 기존 full-data 응답 무변경 확인 | 1일 |
| T1-4 | Zod 검증 스키마 작성 | Ethan | T1-2 착수 전 | `playerRegistrationSchema` 정의, 필수/선택 필드 명확, 등번호 범위 0-99 | 0.5일 |
| T1-5 | API 테스트 (단위/통합) | Nora | T1-2, T1-3 완료 | 정상 케이스 3건, 에러 케이스 6건 이상 커버 | 1일 |

#### T2. DB 마이그레이션

| Task ID | 작업명 | 담당 | 입력 조건 | 완료 기준 | 예상 일수 |
|---------|------|------|---------|---------|--------|
| T2-1 | schema.prisma 변경 (userId nullable) | Ethan | 사전 영향 분석 완료 | `userId BigInt?`, `users User?` 로 변경, 기존 관계 정상 동작 | 0.5일 |
| T2-2 | Prisma 마이그레이션 파일 생성 | Ethan | T2-1 완료 | `prisma migrate dev` 성공, 스테이징 DB 적용 확인 | 0.5일 |
| T2-3 | 기존 데이터 무결성 검증 | Ethan/Nora | T2-2 완료 | 기존 TournamentTeamPlayer 레코드 userId 모두 정상, full-data API 응답 동일 | 0.5일 |

#### T3. Flutter 앱

| Task ID | 작업명 | 담당 | 입력 조건 | 완료 기준 | 예상 일수 |
|---------|------|------|---------|---------|--------|
| T3-1 | 로컬 DB 스키마 변경 (is_onsite_registered, is_synced 컬럼 추가) | Kai | - | 마이그레이션 코드 작성, 기존 데이터 정상 유지 | 0.5일 |
| T3-2 | OnsitePlayerRegistrationBottomSheet 위젯 구현 | Kai | T3-1 완료 | 이름/등번호 입력, 포지션 드롭다운, 등록 버튼, 로딩/에러 상태 처리 | 1일 |
| T3-3 | PlayerRegistrationBloc/Provider 구현 | Kai | T3-1 완료 | 온라인 등록 (API 호출 → 로컬 저장), 오프라인 등록 (로컬 임시 저장 → sync 큐 등록) | 1일 |
| T3-4 | starter_select_screen에 "선수 추가" 버튼 및 진입점 연결 | Kai | T3-2, T3-3 완료 | 버튼 64px 이상, 등록 완료 시 목록 즉시 갱신, 현장등록 뱃지 표시 | 1일 |
| T3-5 | 오프라인 sync 로직 구현 (기존 sync 인프라 활용) | Kai | T3-3 완료 | 네트워크 복구 후 5초 이내 자동 POST, 임시 ID → 실제 ID 교체, 실패 시 재시도 | 1일 |
| T3-6 | 앱 QA (온라인/오프라인 시나리오) | Nora | T3-2~T3-5 완료 | KPI-1 (60초), KPI-2 (100% sync), KPI-4 확인 | 1일 |

### 총 예상 기간

| 영역 | 병렬 가능 여부 | 예상 기간 |
|-----|------------|--------|
| T2 (DB) | 선행 필요 | 1.5일 |
| T1 (API) | T2 이후 병렬 가능 | 2일 |
| T3 (Flutter) | T2 이후 T1과 병렬 가능 | 4일 |
| QA | 모두 완료 후 | 1일 |
| **총합** | 병렬 실행 시 | **약 5~6일** |

---

## 7. 리스크 레지스터

| ID | 리스크 | 발생 가능성 | 영향도 | 위험도 | 대응 전략 |
|----|-------|-----------|------|------|---------|
| R-01 | userId nullable 변경이 기존 Rails 코드 또는 다른 API에 영향 | 중 | 높음 | 높음 | Marcus가 전체 userId 참조 지점 사전 분석. 영향 없을 경우에만 진행. [가정: Rails 앱은 이미 레거시로 읽기 전용 운영 중] |
| R-02 | 오프라인 → 온라인 sync 중 등번호 중복 충돌 | 중 | 중간 | 중 | 서버에서 409 Conflict 응답 시 앱이 사용자에게 등번호 재입력 요청 UI 제공 |
| R-03 | 현장 등록 악용 (로스터 무제한 추가) | 낮음 | 중간 | 중 | API rate limit (분당 10건) + roster_max 체크 (Phase 2에서 강화) |
| R-04 | 앱에서 임시 ID(음수)와 실제 ID 충돌로 데이터 불일치 | 낮음 | 높음 | 중 | ID 생성 방식을 UUID string으로 변경 (timestamp 기반 대신) |
| R-05 | full-data API 기존 player 응답에 현장 등록 선수 포함 여부 혼선 | 중 | 중간 | 중 | full-data는 변경 없이 현재 등록 선수 모두 포함. 증분 API(T1-3)로 추가분 보완 |
| R-06 | 기록원 권한 없는 사용자가 앱에서 선수 추가 버튼을 볼 수 있음 | 낮음 | 낮음 | 낮음 | API는 403으로 차단. 앱 UI에서도 recorder 역할일 때만 버튼 노출 |

---

## 8. 커뮤니케이션 계획

| 시점 | 내용 | 대상 |
|-----|------|------|
| 기획 완료 | 이 문서 승인 요청 | 사장 |
| T2 완료 | DB 마이그레이션 스테이징 적용 보고 | 사장 |
| T1+T3 완료 | 기능 데모 (온라인/오프라인 시나리오) | 사장 |
| 릴리스 전 | Nora Go/No-Go 판정 | 사장 |

---

## 9. 사전 결정 사항 (Decision Log)

| 번호 | 결정 | 근거 |
|-----|------|------|
| D-01 | 선수 계정(User) 미생성, player_name 필드만 활용 | User 생성은 이메일 검증, 중복 체크 등 복잡도가 높음. 기존 TournamentTeamPlayer의 player_name 필드가 이미 존재하여 최소 변경으로 해결 가능. |
| D-02 | 등록 API를 match 레벨이 아닌 tournament/team 레벨로 설계 | 현장 등록은 특정 경기와 무관하게 팀 단위로 이루어짐. starter_select_screen에서 어느 경기이든 팀에 선수를 추가하는 개념. |
| D-03 | 기존 auto_registered 컬럼 활용 (신규 컬럼 미추가) | 현장 등록 = 자동/임시 등록의 의미이므로 auto_registered=true로 구분 가능. DB 마이그레이션 최소화. |
| D-04 | 오프라인 sync에 기존 sync 인프라(51e6a1b) 재사용 | 신규 sync 로직 추가 시 복잡도 증가. 기존 영구 큐 + 네트워크 복구 감지 활용이 일관성 측면에서 유리. |

---

## 10. 가정 사항 (Assumptions)

- `[가정]` Rails 앱은 현재 읽기 전용으로만 운영 중이며, userId nullable 변경으로 인한 Rails 코드 영향 없음. Marcus 검증 필요.
- `[가정]` bdr_stat 앱의 기존 sync 큐 구조가 선수 등록 POST 요청도 처리 가능한 범용 구조임. Kai 확인 필요.
- `[가정]` starter_select_screen은 tournamentTeamId 정보를 이미 보유하고 있음 (API 호출에 필요).
- `[가정]` 대회 roster_max 제한을 이번 스프린트에서 강제하지 않음 (Phase 2).

---

## 11. 자체 검증 체크리스트

### 기획 명확성
- [x] 프로젝트 목적이 1문장으로 명확한가
- [x] In-Scope / Out-of-Scope가 구체적인가
- [x] 성공 기준이 측정 가능한가 (KPI-1: 60초, KPI-2: 100%, KPI-3: 0건 회귀)

### WBS 완결성
- [x] WBS가 3레벨 이상으로 분해되었는가
- [x] Leaf node가 3일 이내, 독립 실행 가능한가
- [x] 각 태스크에 담당 에이전트와 완료 기준이 명시되었는가

### 리스크 및 가정
- [x] 리스크 6개 식별 (발생 가능성 + 영향도 평가)
- [x] 불확실한 가정이 [가정] 태그로 명시되었는가
- [x] 기술 스택과의 정합성이 확인되었는가 (기존 API/미들웨어 재사용)

### 다음 에이전트 준비
- [x] Marcus(03)가 기술 설계를 시작하기에 추가 질문 0개 목표 달성 여부:
  - 필요한 DB 변경 명시됨
  - API 엔드포인트 설계 방향 제시됨
  - 인증 재사용 전략 명시됨
  - Flutter sync 전략 명시됨

---

**다음 단계**: Marcus(03-아키텍트)에게 기술 설계 검토 및 API 명세 구체화 요청.
특히 R-01 (userId nullable 영향 분석)을 최우선으로 검토 요청.
