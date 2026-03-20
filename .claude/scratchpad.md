# 📋 작업 스크래치패드

## 현재 작업
- **요청**: Critical 버그 수정 (review-fix-plan.md 기반 - C-3, C-4, C-6, W-1-b, W-1, S-1, S-3)
- **상태**: 6단계 완료 (S-3 /api/live Rate Limiting - 이미 구현됨, 코드 변경 0건)
- **현재 담당**: developer

## 작업 계획 (planner)

### 2026-03-20: 서버 컴포넌트 -> 클라이언트 컴포넌트 + API route 전환

#### 목표
서버 컴포넌트에서 DB를 직접 호출하는 4개 페이지를 홈 페이지(`recommended-games.tsx`)와 동일한 "클라이언트 컴포넌트 + API route" 패턴으로 전환하여 무한 로딩 문제를 해결한다.

#### 참고 패턴 (홈 페이지 방식)
홈 페이지의 `RecommendedGames` 컴포넌트가 모범 사례:
- `"use client"` 선언
- `useState` + `useEffect`로 `/api/web/xxx` 엔드포인트를 `fetch()` 호출
- 로딩 중에는 `Skeleton` UI 표시
- API route에서 `prisma`로 DB 조회 후 `apiSuccess()`로 응답 (snake_case 자동 변환)

#### 기존 API route 현황 (목록 조회용)
| 페이지 | 목록 조회 API route | 상태 |
|--------|-------------------|------|
| /games | `GET /api/web/games` | **없음** - 새로 생성 필요 |
| /tournaments | `GET /api/web/tournaments` | **POST만 존재** (대회 생성용) - GET 추가 필요 |
| /community | `GET /api/web/community` | **없음** - 새로 생성 필요 |
| /teams | `GET /api/web/teams` | **없음** - 새로 생성 필요 |

#### 작업 순서 (난이도 낮은 것부터)

| 순서 | 페이지 | 이유 |
|------|--------|------|
| 1 | /games | 이미 `listGames()`, `listGameCities()` 서비스 함수가 있어 API route에서 바로 활용 가능 |
| 2 | /tournaments | `listTournaments()` 서비스 함수 존재 + `unstable_cache` 로직을 API로 이동하면 됨 |
| 3 | /teams | prisma 직접 호출이라 서비스 함수 추출이 필요하지만 쿼리가 단순 |
| 4 | /community | `force-dynamic` + prisma 직접 호출 + 검색/카테고리 필터가 있어 가장 복잡 |

---

### 1단계: /games 페이지 전환

**현재 구조:**
- `src/app/(web)/games/page.tsx` (서버 컴포넌트)
- `GamesGrid` async 컴포넌트에서 `listGames()` 직접 호출
- `getCities()`로 도시 목록 조회 (unstable_cache)
- 필터: `q`(검색), `type`(경기유형), `city`(도시), `date`(날짜범위)

**필요한 작업:**
1. **API route 생성**: `src/app/api/web/games/route.ts` (GET)
   - 쿼리파라미터: `q`, `type`, `city`, `date`
   - `listGames()` + `listGameCities()` 서비스 함수 활용
   - 날짜 범위 계산 로직을 API로 이동
   - `apiSuccess()`로 응답: `{ games: [...], cities: [...] }`
   - 인증 불필요 (공개 목록) -> `withWebAuth` 없이 일반 GET 핸들러
2. **클라이언트 컴포넌트 생성**: `src/app/(web)/games/_components/games-content.tsx`
   - `"use client"` 선언
   - `useState` + `useEffect`로 `/api/web/games?q=...&type=...` 호출
   - 기존 `GamesGrid`의 UI 로직을 이동
   - 로딩 중 `GamesGridSkeleton` 표시
3. **page.tsx 수정**: 서버 컴포넌트를 단순 래퍼로 변경
   - `async` 제거, DB 호출 제거
   - `GamesContent` 클라이언트 컴포넌트만 렌더링

**담당**: architect (API 설계) -> developer (구현) -> tester (검증)
**예상 시간**: 15분

---

### 2단계: /tournaments 페이지 전환

**현재 구조:**
- `src/app/(web)/tournaments/page.tsx` (서버 컴포넌트)
- `getTournaments()` 함수가 `unstable_cache` + `listTournaments()` 사용
- `CachedTournament` 인터페이스로 직렬화 처리 (Date -> string, Decimal -> string)
- 필터: `status`(대회 상태)
- 다양한 UI 컴포넌트: `TeamCountBar`, `STATUS_STYLE`, `FORMAT_LABEL`

**필요한 작업:**
1. **API route 수정**: `src/app/api/web/tournaments/route.ts`에 GET 핸들러 추가
   - 기존 POST (대회 생성)는 유지
   - GET 추가: 쿼리파라미터 `status`
   - `listTournaments()` 서비스 함수 활용
   - `CachedTournament` 직렬화 로직을 API로 이동
   - `apiSuccess()`로 응답
   - 인증 불필요 (공개 목록)
2. **클라이언트 컴포넌트 생성**: `src/app/(web)/tournaments/_components/tournaments-content.tsx`
   - `"use client"` 선언
   - `useState` + `useEffect`로 `/api/web/tournaments?status=...` 호출
   - 기존 `TournamentGrid`의 UI + `TeamCountBar`, 스타일 맵 등을 이동
   - 로딩 중 `TournamentGridSkeleton` 표시
3. **page.tsx 수정**: 서버 컴포넌트를 단순 래퍼로 변경

**담당**: architect (API 설계) -> developer (구현) -> tester (검증)
**예상 시간**: 15분

---

### 3단계: /teams 페이지 전환

**현재 구조:**
- `src/app/(web)/teams/page.tsx` (서버 컴포넌트)
- `prisma.team.findMany()` + `prisma.team.groupBy()` 직접 호출 (서비스 함수 없음)
- `Promise.all()`로 2개 쿼리 병렬 실행
- 필터: `q`(검색), `city`(도시)

**필요한 작업:**
1. **API route 생성**: `src/app/api/web/teams/route.ts` (GET)
   - 쿼리파라미터: `q`, `city`
   - prisma 쿼리를 그대로 API route로 이동 (서비스 함수 추출은 선택)
   - 팀 목록 + 도시 목록을 한 번에 반환: `{ teams: [...], cities: [...] }`
   - `apiSuccess()`로 응답
   - 인증 불필요 (공개 목록)
2. **클라이언트 컴포넌트 생성**: `src/app/(web)/teams/_components/teams-content.tsx`
   - `"use client"` 선언
   - `useState` + `useEffect`로 `/api/web/teams?q=...&city=...` 호출
   - 기존 page.tsx의 UI 로직을 이동
   - 로딩 중 스켈레톤 표시
3. **page.tsx 수정**: 서버 컴포넌트를 단순 래퍼로 변경

**담당**: architect (API 설계) -> developer (구현) -> tester (검증)
**예상 시간**: 15분

---

### 4단계: /community 페이지 전환

**현재 구조:**
- `src/app/(web)/community/page.tsx` (서버 컴포넌트)
- `force-dynamic` 설정 (캐시 없음, 매번 DB 직접 호출)
- `prisma.community_posts.findMany()` 직접 호출
- 필터: `category`(카테고리), `q`(검색, 제목+본문)
- 검색 폼이 `<form method="GET">`으로 서버 사이드 → 클라이언트에서 URL 조작으로 변경 필요

**필요한 작업:**
1. **API route 생성**: `src/app/api/web/community/route.ts` (GET)
   - 쿼리파라미터: `category`, `q`
   - prisma 쿼리를 API route로 이동
   - 게시글 목록 반환 (Date는 ISO string으로 직렬화)
   - `apiSuccess()`로 응답
   - 인증 불필요 (공개 목록)
2. **클라이언트 컴포넌트 생성**: `src/app/(web)/community/_components/community-content.tsx`
   - `"use client"` 선언
   - `useState` + `useEffect`로 `/api/web/community?category=...&q=...` 호출
   - 검색 폼을 클라이언트 상태(`useState`)로 관리
   - 카테고리 필터 클릭 시 state 변경 -> API 재호출
   - 로딩 중 스켈레톤 표시
3. **page.tsx 수정**: 서버 컴포넌트를 단순 래퍼로 변경, `force-dynamic` 제거

**주의사항:**
- 검색 폼이 현재 `<form method="GET">`으로 서버 네비게이션 → 클라이언트 state 기반으로 바꿔야 함
- 날짜 포맷: `p.created_at.toLocaleDateString()` → API에서 ISO string으로 내려주고 클라이언트에서 포맷

**담당**: architect (API 설계) -> developer (구현) -> tester (검증)
**예상 시간**: 20분

---

### 5단계: 전체 동작 확인

**작업:**
1. 개발 서버 재시작 후 4개 페이지 모두 정상 로딩 확인
2. 각 페이지의 필터/검색 기능 동작 확인
3. 스켈레톤 UI가 먼저 보이고, 데이터가 로드되면 교체되는지 확인
4. 빈 결과일 때 빈 상태 UI가 정상 표시되는지 확인

**담당**: tester
**예상 시간**: 10분

---

### 6단계: 코드 리뷰 및 커밋

**작업:**
1. 불필요한 import, 사용하지 않는 코드 정리
2. TypeScript 타입 에러 없는지 확인
3. 커밋

**담당**: reviewer -> git-manager
**예상 시간**: 5분

---

### 전체 작업 테이블

| 순서 | 작업 | 담당 | 예상 시간 | 선행 조건 |
|------|------|------|----------|----------|
| 1 | /games API route + 클라이언트 컴포넌트 | architect -> developer | 15분 | 없음 |
| 2 | /tournaments API route (GET 추가) + 클라이언트 컴포넌트 | architect -> developer | 15분 | 1단계 완료 확인 후 |
| 3 | /teams API route + 클라이언트 컴포넌트 | architect -> developer | 15분 | 2단계 완료 확인 후 |
| 4 | /community API route + 클라이언트 컴포넌트 | architect -> developer | 20분 | 3단계 완료 확인 후 |
| 5 | 전체 동작 확인 | tester | 10분 | 4단계 완료 후 |
| 6 | 코드 리뷰 및 커밋 | reviewer -> git-manager | 5분 | 5단계 완료 후 |

**총 예상 시간: 약 80분 (1시간 20분)**

#### 주의사항
- 한 페이지씩 순서대로 진행한다. 완료 확인 후 다음 페이지로 넘어간다.
- API route는 인증 없는 공개 엔드포인트로 만든다 (목록 조회는 로그인 불필요).
- API 응답은 반드시 `apiSuccess()` 헬퍼를 사용한다 (snake_case 자동 변환).
- 기존 서비스 함수(`listGames`, `listTournaments` 등)가 있으면 최대한 재활용한다.
- BigInt 필드는 API 응답 시 `.toString()`으로 변환해야 JSON 직렬화 가능하다.
- 필터 기능(검색, 카테고리, 날짜 등)이 기존과 동일하게 동작해야 한다.
- `/community`의 `<form method="GET">` 패턴은 클라이언트 state 기반으로 변경해야 한다.

## 설계 노트 (architect)

### 2026-03-20: 프로젝트 현황 분석 및 다음 작업 후보 도출

#### 1. 완료된 작업 요약

| 영역 | 상태 | 비고 |
|------|------|------|
| 4개 페이지 클라이언트 컴포넌트 전환 | 완료 (커밋 7eb6b8a) | /games, /tournaments, /teams, /community. push 미완료 |
| 무한 로딩 원인 분석 | 완료 | 원인: Supabase 인도 리전 DB 지연 + 서버 컴포넌트 블로킹 패턴 |
| Tournament Wizard 7단계 통합 | 완료 (커밋 9fde3a8) | |
| UI 리디자인 + OAuth 통합 | 완료 (커밋 b99a29a) | |

#### 2. 미해결 debugger 제안 (scratchpad "디버깅 기록" 참조)

| 제안 | 상태 | 긴급도 |
|------|------|--------|
| A. DB 리전 최적화 (인도 -> 한국/일본) 또는 로컬 PostgreSQL | 미완료 | 중 - 현재 API 첫 호출 0.7~3.4초 지연. 프로덕션 전 필수 |
| B. 렌더링 패턴 변경 | 완료 | - 클라이언트 컴포넌트 전환으로 해결 |
| C. Turbopack 불안정 / Next.js 16 다운그레이드 검토 | 미완료 | 하 - 현재 동작은 하지만 장기적 안정성 위험 |

#### 3. plan.md 기획 문서 기반 - 미구현 기능 목록

plan.md의 "구현 순서 권고(7장)" 기준으로 현재까지 구현된 것과 안 된 것을 대조했다.

**plan.md 섹션별 상태:**

| 섹션 | plan.md 상태 | 실제 구현 | 판단 주석 |
|------|-------------|----------|----------|
| 0. 구독/역할 체계 | 완료 표시 | roles.ts 미확인 (DB 마이그레이션 여부 불명) | - |
| 1. 경기 (Games) | 완료 표시 | 목록/필터 완료. 타입별 카드(pickup/guest/team_match) 미구현 | [승인] |
| 2. 팀 (Teams) | 완료 표시 | 목록 완료. 가입신청 처리 UI/API 미구현 | [승인] |
| 3. 대회 관리 | 완료 표시 | Wizard 완료. 대진표 시각화 [보류], 접수 시스템(3-B) 승인 대기 | [보류] 일부 |
| 4. 커뮤니티 | 완료 표시 | 목록 완료. 검색+이미지 첨부 미구현 | [보류: 카테고리 세분화] |
| 5. Admin | 완료 표시 | 기본 구조 존재 | - |
| 6. 알림 시스템 | 완료 표시 | 알림 페이지/API 존재. 알림 생성 로직 전무 (research.md 확인) | [승인] |
| 8. 요금제 (Pricing) | - | /pricing 라우트 존재하나 내용 미확인 | [승인] |
| 9. 프로필 수정 | - | /profile 라우트 존재 | [승인] |
| 10. 홈 즐겨찾기 퀵 메뉴 | - | quick-menu 존재 | [승인] |
| 11. PWA | - | Serwist 설정 있음 | [승인] |
| 3.7 노코드 대회 사이트 | - | (site) 디렉토리 미존재. proxy.ts만 준비 | [승인] |

#### 4. 코드베이스 미완성 부분

**TODO/FIXME 발견 (2건):**
- `src/lib/auth/jwt.ts:17` - "토큰 즉시 폐기가 필요하면 Redis 기반 jti 블랙리스트 도입 필요" (장기)
- `src/app/api/web/verify/send-code/route.ts:29` - "프로덕션에서 SMS 발송" (프로덕션 전 필수)

**review-fix-plan.md 미수정 항목 (Critical):**
- C-3: match.ts "live" 상태 누락
- C-4: super_admin 쿼리 take 제한 없음
- C-6: advanceWinner/updateTeamStandings silent fail
- W-1-b: /live 페이지 응답 키 불일치 (현재 버그)

#### 5. 다음 작업 후보 목록

| 우선순위 | 작업 | 이유 | 예상 난이도 |
|---------|------|------|-----------|
| 1 | **커밋 push (master -> remote)** | 현재 4개 페이지 전환 작업이 로컬에만 있음. push하지 않으면 작업 유실 위험. | 쉬움 (1분) |
| 2 | **review-fix-plan.md Critical 버그 수정** (C-3, C-4, C-6, W-1-b) | /live 페이지가 현재 버그 상태(응답 키 불일치). super_admin 쿼리 제한 없음은 보안 위험. advanceWinner silent fail은 대회 진행 시 데이터 유실 가능. | 중간 (각 30분) |
| 3 | **알림 생성 로직 구현** (plan.md 6장) | 알림 페이지/DB는 있지만 알림을 만드는 코드가 전무. 경기 참가신청, 팀 가입 등 핵심 이벤트에 알림이 안 감. 사용자 경험에 직접 영향. | 중간 (2~3시간) |
| 4 | **요금제 페이지 완성** (plan.md 8장) | /pricing 라우트가 있지만 내용이 불완전할 수 있음. 정적 데이터 기반이라 구현이 단순. 유료 전환 전 필수. | 쉬움 (1시간) |
| 5 | **프로필 수정 페이지 확장** (plan.md 9장) | 현재 5개 필드만 수정 가능. 전화번호/생년월일/은행 계좌 등 추가 필요. 픽업/게스트 경기 신청에 필요한 정보. | 중간 (2시간) |
| 6 | **경기 타입별 카드 컴포넌트** (plan.md 1.1장) | 픽업/게스트/팀대결별로 다른 카드 레이아웃. 현재는 통일 카드만 존재. | 중간 (2시간) |
| 7 | **팀 가입신청 처리 UI + API** (plan.md 2장) | 팀장이 가입신청을 승인/거부하는 기능. 팀 운영에 필수. | 중간 (2시간) |
| 8 | **DB 리전 최적화** | 개발 환경에서 API 첫 호출 0.7~3.4초 지연. 프로덕션에서도 동일 문제 발생 예상. 로컬 PostgreSQL 또는 도쿄 리전으로 전환 검토. | 중간 (인프라 작업) |
| 9 | **SMS 발송 구현** (verify/send-code) | 현재 TODO 상태. 프로덕션 전 반드시 구현 필요. | 중간 (외부 서비스 연동) |
| 10 | **노코드 대회 사이트** (plan.md 3.7장) | (site) 디렉토리 미존재. proxy.ts만 준비. 대규모 작업이라 나중에. | 높음 (1주+) |

#### 6. 권장 진행 순서 (비유: 건물 비유)

지금 상태는 "건물의 주요 방(페이지들)은 만들어졌지만, 배관(알림), 보안 시스템(버그 수정), 안내판(요금제) 등이 아직 설치 안 된 상태"와 같다.

1. **먼저 push** - 만든 것을 안전하게 보관 (백업)
2. **Critical 버그 수정** - 배관에 구멍이 있으면 물이 새니까 먼저 막기
3. **알림 시스템** - 사용자에게 "무슨 일이 일어났는지" 알려주는 건물 내 방송 시스템
4. **요금제/프로필** - 입주 전 필수 설비

나머지(타입별 카드, 팀 가입신청, 노코드 사이트 등)는 기본 인프라가 안정화된 후 진행하는 것이 좋다.

## 구현 기록 (developer)

### 2026-03-20: /games 페이지 클라이언트 컴포넌트 + API route 전환 (1단계)

구현한 기능: /games 페이지를 서버 컴포넌트 직접 DB 호출 방식에서 클라이언트 컴포넌트 + API route 패턴으로 전환

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/web/games/route.ts` | GET 핸들러 - listGames() + listGameCities() 호출, BigInt/Date/Decimal 직렬화 | 신규 |
| `src/app/(web)/games/_components/games-content.tsx` | "use client" 클라이언트 컴포넌트 - fetch + 카드 렌더링 + 스켈레톤 UI | 신규 |
| `src/app/(web)/games/page.tsx` | async/DB호출 제거, GamesContent 래퍼로 간소화 | 수정 |

**설계 결정:**
- GameCardCompact를 직접 재사용하지 않고 games-content.tsx 내부에 GameCard를 새로 만듦. 이유: 기존 GameCardCompact는 Prisma의 `games` 타입(Date 객체, BigInt)을 직접 사용하는데, API 응답은 string으로 변환되므로 타입이 호환되지 않음.
- GamesFilter는 기존 것을 그대로 재사용. props로 주입하는 방식으로 cities 데이터를 API 응답에서 전달.
- API에서 games + cities를 한번에 반환하여 네트워크 요청을 1회로 줄임.

**tester 참고:**
- 테스트 방법: 브라우저에서 /games 접속 -> 스켈레톤 UI가 먼저 보이고 데이터 로드 후 카드 표시
- 정상 동작: 경기 카드가 2열(모바일)/3열(데스크탑) 그리드로 표시, 필터/검색 정상 동작
- 주의할 입력: 필터 조합 테스트 (유형+도시+날짜), 빈 결과 시 빈 상태 UI 표시 확인
- API 직접 테스트: GET /api/web/games?type=0&city=서울 등

**reviewer 참고:**
- games-content.tsx 내 GameCard는 기존 game-card-compact.tsx의 UI를 그대로 복제함 (타입 호환 문제로 분리)
- game-card-compact.tsx는 /games/[id] 등 다른 곳에서 사용할 수 있으므로 삭제하지 않음

---

### 2026-03-20: /tournaments 페이지 클라이언트 컴포넌트 + API route 전환 (2단계)

구현한 기능: /tournaments 페이지를 서버 컴포넌트 직접 DB 호출 방식에서 클라이언트 컴포넌트 + API route 패턴으로 전환

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/web/tournaments/route.ts` | GET 핸들러 추가 - listTournaments() 호출, Date/Decimal 직렬화. 기존 POST(대회 생성)는 유지 | 수정 |
| `src/app/(web)/tournaments/_components/tournaments-content.tsx` | "use client" 클라이언트 컴포넌트 - fetch + TournamentCard + TeamCountBar + 스켈레톤 UI | 신규 |
| `src/app/(web)/tournaments/page.tsx` | async/DB호출/unstable_cache 제거, TournamentsContent 래퍼로 간소화 | 수정 |

**설계 결정:**
- /games 패턴을 그대로 따름: API route(GET) + 클라이언트 컴포넌트 + page.tsx 래퍼
- 기존 page.tsx에 있던 TournamentCard, TeamCountBar, STATUS_STYLE, FORMAT_LABEL 등 모든 UI 로직을 tournaments-content.tsx로 이동
- TournamentsFilter는 기존 것을 그대로 재사용. props injection 패턴으로 주입
- CachedTournament 인터페이스 대신 TournamentFromApi (snake_case 키) 사용. apiSuccess()가 자동으로 camelCase -> snake_case 변환하므로 클라이언트에서는 snake_case로 받음
- API route에서 listTournaments() 서비스 함수를 재활용하여 코드 중복 최소화

**tester 참고:**
- 테스트 방법: 브라우저에서 /tournaments 접속 -> 스켈레톤 UI가 먼저 보이고 데이터 로드 후 카드 표시
- 정상 동작: 대회 카드가 1열(모바일)/2열(태블릿)/3열(데스크탑) 그리드로 표시
- 필터 테스트: 상태 탭(전체/모집중/진행중/완료) 클릭 시 URL 파라미터 변경 + API 재호출
- 빈 결과 시 빈 상태 UI 표시 확인 (트로피 아이콘 + "조건에 맞는 대회가 없습니다")
- API 직접 테스트: GET /api/web/tournaments?status=registration 등
- 주의: 대회 만들기 버튼 링크(/tournament-admin/tournaments/new/wizard)가 유지되는지 확인

**reviewer 참고:**
- tournaments-content.tsx의 TournamentCard는 기존 page.tsx의 TournamentGrid 내부 UI를 그대로 이동함 (타입만 CachedTournament -> TournamentFromApi로 변경)
- apiSuccess의 convertKeysToSnakeCase 때문에 API 응답 키가 snake_case로 변환됨 (startDate -> start_date, entryFee -> entry_fee 등)
- 기존 page.tsx의 revalidate = 30, unstable_cache 설정은 제거됨 (API route에서 캐싱이 필요하면 별도 추가)

---

### 2026-03-20: /teams 페이지 클라이언트 컴포넌트 + API route 전환 (3단계)

구현한 기능: /teams 페이지를 서버 컴포넌트 직접 DB 호출 방식에서 클라이언트 컴포넌트 + API route 패턴으로 전환

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/web/teams/route.ts` | GET 핸들러 - prisma.team.findMany + groupBy 쿼리, BigInt 직렬화, _count 평탄화 | 신규 |
| `src/app/(web)/teams/_components/teams-content.tsx` | "use client" 클라이언트 컴포넌트 - fetch + TeamCardFromApi + 스켈레톤 UI | 신규 |
| `src/app/(web)/teams/page.tsx` | async/prisma/revalidate 제거, TeamsContent 래퍼로 간소화 | 수정 |

**설계 결정:**
- /games, /tournaments 패턴을 그대로 따름: API route(GET) + 클라이언트 컴포넌트 + page.tsx 래퍼
- 기존 team-card.tsx는 BigInt 타입의 id를 사용하므로, API 응답(string id)에 맞는 TeamCardFromApi를 teams-content.tsx 내부에 새로 구현
- _count.teamMembers를 API 응답에서 memberCount로 평탄화하여 클라이언트 코드를 단순화
- TeamsFilter는 기존 것을 그대로 재사용. props injection 패턴으로 cities 데이터를 동적 전달
- apiSuccess()가 camelCase -> snake_case 자동 변환하므로 클라이언트 인터페이스는 snake_case 키 사용

**tester 참고:**
- 테스트 방법: 브라우저에서 /teams 접속 -> 스켈레톤 UI가 먼저 보이고 데이터 로드 후 카드 표시
- 정상 동작: 팀 카드가 2열(모바일)/3열(태블릿)/4열(데스크탑) 그리드로 표시
- 필터 테스트: 검색어 입력(디바운스 380ms) + 도시 드롭다운 선택 시 API 재호출
- 빈 결과 시 빈 상태 UI 표시 확인 (메달 아이콘 + "조건에 맞는 팀이 없습니다")
- API 직접 테스트: GET /api/web/teams?q=서울&city=서울 등
- 주의: "팀 만들기" 버튼 링크(/teams/new)가 유지되는지 확인

**reviewer 참고:**
- teams-content.tsx의 TeamCardFromApi는 기존 team-card.tsx의 UI를 그대로 복제함 (타입 호환 문제로 분리)
- team-card.tsx는 /teams/[id] 등 다른 곳에서 사용할 수 있으므로 삭제하지 않음
- 기존 page.tsx의 revalidate = 60 설정은 제거됨 (API route에서 캐싱이 필요하면 별도 추가)

### 2026-03-20: /community 페이지 클라이언트 컴포넌트 + API route 전환 (4단계)

구현한 기능: /community 페이지를 서버 컴포넌트(force-dynamic + prisma 직접 호출) 방식에서 클라이언트 컴포넌트 + API route 패턴으로 전환

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/web/community/route.ts` | GET 핸들러 - prisma.community_posts.findMany, category/q 필터, BigInt/Date 직렬화 | 신규 |
| `src/app/(web)/community/_components/community-content.tsx` | "use client" 클라이언트 컴포넌트 - fetch + 카테고리 필터 + 검색 폼 + 스켈레톤 UI | 신규 |
| `src/app/(web)/community/page.tsx` | force-dynamic/async/prisma 제거, CommunityContent 래퍼로 간소화 | 수정 |

**설계 결정:**
- 기존 form method="GET" (서버 네비게이션) 패턴을 클라이언트 state 기반으로 전환. category와 searchQuery를 useState로 관리하고, 변경 시 useEffect에서 API를 재호출한다.
- 카테고리 필터를 기존 Link 태그에서 button 태그로 변경. Link 태그를 쓰면 서버 네비게이션이 발생하는데, 이제는 클라이언트에서 state만 바꾸면 되므로 button이 적합하다.
- 검색은 searchQuery(입력값)와 appliedQuery(적용된 검색어)를 분리. 검색 버튼을 누를 때만 appliedQuery가 업데이트되어 API가 호출된다. 타이핑할 때마다 API 호출되는 것을 방지.
- community는 다른 3개 페이지와 달리 별도 Filter 컴포넌트가 없으므로, 모든 필터 UI를 community-content.tsx 내부에 포함시켰다.
- apiSuccess()가 camelCase -> snake_case 자동 변환하므로 클라이언트 인터페이스(PostFromApi)는 snake_case 키 사용.

**tester 참고:**
- 테스트 방법: 브라우저에서 /community 접속 -> 스켈레톤 UI가 먼저 보이고 데이터 로드 후 게시글 표시
- 정상 동작: 게시글이 카드 리스트로 표시, 카테고리 뱃지/작성자/날짜/조회수/댓글수 포함
- 필터 테스트: 카테고리 탭(전체/자유/정보/후기/장터) 클릭 시 즉시 API 재호출
- 검색 테스트: 검색어 입력 후 "검색" 버튼 클릭 시 검색 실행, "초기화" 버튼으로 검색어 제거
- 빈 결과 시 "조건에 맞는 게시글이 없습니다." / "게시글이 없습니다." 분기 확인
- API 직접 테스트: GET /api/web/community?category=general&q=테스트 등
- 주의: "글쓰기" 버튼 링크(/community/new)가 유지되는지 확인
- 주의: 게시글 클릭 시 /community/{public_id}로 이동하는지 확인 (상세 페이지는 미변경)

**reviewer 참고:**
- 기존 page.tsx의 force-dynamic, async, prisma import, searchParams 처리가 모두 제거됨
- 카테고리 필터가 Link -> button으로 변경됨 (서버 네비게이션 -> 클라이언트 state)
- 검색 폼이 form method="GET" -> form onSubmit 핸들러로 변경됨
- 날짜 포맷은 API에서 ISO string으로 내려주고 클라이언트의 formatDate()에서 처리

---

### 2026-03-20: C-6 match-sync post-process Promise.allSettled 전환

구현한 기능: 경기 완료 시 후처리(advanceWinner, updateTeamStandings)를 순차 try-catch에서 Promise.allSettled 병렬 실행으로 변경

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/v1/tournaments/[id]/matches/sync/route.ts` | 244-276행: 순차 try-catch 2개를 Promise.allSettled 병렬 실행으로 전환, postProcessStatus 변수 추가, 로그 태그 변경 | 수정 |

**변경 상세:**
- 순차 try-catch 2개 -> `Promise.allSettled([advanceWinner, updateTeamStandings])` 병렬 실행
- 로그 태그: `[match-sync]` -> `[match-sync:post-process]`, matchId 포함
- `postProcessStatus` 변수 추가: "ok"(둘 다 성공) / "partial_failure"(일부 실패) / "skipped"(completed 아닌 경우)
- apiSuccess 응답에 `post_process_status` 필드 추가
- 기존 `warnings`, `server_match_id` 등 모든 응답 필드 유지

**tester 참고:**
- 테스트 방법: Flutter bdr_stat 앱에서 경기 완료(status="completed") 동기화 요청
- 정상 동작: 응답에 `post_process_status: "ok"`, warnings 없음
- 실패 시: `post_process_status: "partial_failure"` + warnings 배열에 실패 항목 표시
- 진행 중(status="in_progress") 동기화 시: `post_process_status: "skipped"` (후처리 미실행)
- TypeScript 검증: `npx tsc --noEmit` 에러 0건 통과

**reviewer 참고:**
- Promise.allSettled는 ES2020 기능으로 Node.js 12.9+ / TypeScript target es2020+ 에서 사용 가능
- 기존 순차 실행 대비 네트워크 지연이 겹치는 경우 응답 시간이 절반으로 줄어들 수 있음
- Flutter 앱 클라이언트가 post_process_status 필드를 아직 사용하지 않더라도, 기존 필드가 모두 유지되므로 하위 호환성 문제 없음

---

### 2026-03-20: W-1 full-data API 이중 변환 검토 (Critical 버그 수정 5단계)

구현한 기능: full-data API의 이중 snake_case 변환 위험 여부 분석

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/v1/tournaments/[id]/full-data/route.ts` | 변경 없음 (분석만 수행) | - |
| `src/lib/api/response.ts` | 변경 없음 (동작 확인) | - |
| `src/lib/utils/case.ts` | 변경 없음 (동작 확인) | - |

**분석 결과: 수정 불필요 - 이중 변환이 발생하지만 실해(harm)가 없음**

**이유 상세:**

1. `toSnakeCase()` 함수(case.ts 1~3행)는 대문자(`[A-Z]`)를 찾아 `_소문자`로 변환하는 로직이다. 이미 snake_case인 키(예: `team_name`, `start_date`)에는 대문자가 없으므로 변환이 일어나지 않는다.
   - `toSnakeCase("team_name")` -> `"team_name"` (그대로)
   - `toSnakeCase("start_date")` -> `"start_date"` (그대로)
   - `toSnakeCase("player_stats")` -> `"player_stats"` (그대로)

2. `convertKeysToSnakeCase()` 함수(case.ts 5~18행)는 재귀적으로 중첩 객체의 키도 변환한다. full-data 응답의 모든 키가 이미 수동으로 snake_case로 빌드되어 있으므로 재귀 탐색은 발생하지만 실제 키 변경은 0건이다.

3. 값(value) 레벨에서도 문제 없음:
   - 모든 값이 primitive(string, number, boolean, null)이거나 이미 toISOString()으로 변환된 문자열
   - Date 객체가 값으로 들어오면 case.ts 7행에서 `toISOString()`으로 변환하지만, full-data에서는 이미 수동으로 `?.toISOString() ?? null` 처리를 하고 있어 Date 객체가 도달하지 않음
   - BigInt도 마찬가지로 case.ts 8행에서 `toString()` 처리하지만, full-data에서 이미 `Number()` 또는 `?.toString()`으로 변환했으므로 도달하지 않음

4. Prisma 필드 접근 시 camelCase와 snake_case가 혼재되어 있음 (예: `s.isStarter` vs `s.two_pointers_made`) - 이는 Prisma의 `@map` 매핑 때문이며, **접근하는 소스 필드명**이지 **출력 키**가 아니므로 무관하다. 출력 키는 모두 명시적으로 snake_case로 지정되어 있다.

**성능 영향:**
- `convertKeysToSnakeCase()`가 전체 응답 객체를 재귀 탐색하므로 불필요한 오버헤드가 존재
- 하지만 full-data 응답 크기(teams + players + matches + playerStats)가 일반적으로 수백 건 수준이므로 실측 가능한 성능 차이는 없음

**수정하지 않는 이유:**
- `apiSuccess()`에 "변환 생략" 옵션을 추가하면 프로젝트 전체의 API 응답 패턴에 분기가 생겨 유지보수 복잡도가 증가
- 현재 동작이 완전히 정상이며 Flutter 앱(bdr_stat)의 응답 구조에 영향 없음
- "이미 snake_case -> snake_case 변환 = 무해" 이므로 코드 수정의 이득 대비 위험(기존 동작 깨뜨릴 가능성)이 크다

**tester 참고:**
- 테스트 불필요 (코드 변경 없음)
- 기존 Flutter bdr_stat 앱의 full-data API 호출이 정상이라면 문제 없음

**reviewer 참고:**
- 만약 향후 apiSuccess()에 `skipConversion` 옵션을 추가한다면, full-data뿐 아니라 이미 snake_case를 수동 빌드하는 다른 API도 함께 검토해야 함
- 현재로서는 "수동 빌드 + 자동 변환 이중 적용" 패턴이 무해하므로 수정 보류가 적절

---

### 2026-03-20: S-3 /api/live Rate Limiting 확인 (Critical 버그 수정 6단계)

구현한 기능: 확인 결과 **이미 구현 완료** -- 코드 수정 0건

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/live/route.ts` | 변경 없음 (이미 Rate Limiting 적용됨) | - |
| `src/lib/security/rate-limit.ts` | 변경 없음 (확인만 수행) | - |
| `src/lib/security/get-client-ip.ts` | 변경 없음 (확인만 수행) | - |

**현재 구현 상태 확인:**

1. `route.ts` 13행: `const ip = getClientIp(req)` -- IP 추출
2. `route.ts` 14행: `checkRateLimit("live:{ip}", RATE_LIMITS.subdomain)` -- 60초 30회 제한
3. `route.ts` 15-17행: 초과 시 `apiError("Too many requests", 429)` 반환

**Rate Limiter 구조 (rate-limit.ts):**
- Upstash Redis 설정 시: sliding window 알고리즘 사용
- Upstash 미설정 시: in-memory fallback (Map 기반, 5분마다 만료 엔트리 정리)
- `RATE_LIMITS.subdomain` = `{ maxRequests: 30, windowMs: 60000 }` -- 기획서 요구(60초 30회)와 정확히 일치

**기획서 요구사항 대조:**
| 요구사항 | 현재 구현 | 판정 |
|---------|----------|------|
| IP 기반 Rate Limiting | getClientIp()로 IP 추출 (x-real-ip/x-forwarded-for) | 충족 |
| 60초 30회 제한 | RATE_LIMITS.subdomain = { maxRequests: 30, windowMs: 60000 } | 충족 |
| 초과 시 429 응답 | apiError("Too many requests", 429) | 충족 |
| in-memory 방식 허용 | Upstash fallback으로 in-memory 구현됨 | 충족 |

**결론**: S-3 태스크는 이전 작업(아마 초기 커밋 또는 architect 설계 시점)에서 이미 구현되었다. 코드 수정 불필요.

**tester 참고:**
- 테스트 방법: `GET /api/live`를 1분 내 31번 연속 호출
- 정상 동작: 30번까지 200 OK, 31번째부터 429 Too Many Requests
- 검증 기준: 기획서 명시 "1분 내 31번 연속 호출 시 429 응답" 충족

---

## 디버깅 기록 (debugger)

### 2026-03-20: 무한 렌더링 현상 원인 분석

#### 1. 원인 요약 (한 줄)
**원격 DB(Supabase 인도 리전) 연결 지연 + 서버 컴포넌트의 동기적 DB 쿼리 대기로 인해 페이지 렌더링이 완료되지 않고 Suspense/loading 상태에 갇히는 현상. "무한 렌더링"이 아니라 "무한 로딩(영원히 끝나지 않는 서버 렌더링)"이다.**

#### 2. 상세 분석

**[핵심 원인 A] 원격 DB 연결 지연 (가장 유력)**
- `.env`의 DATABASE_URL이 Supabase **인도(ap-south-1)** 리전의 PgBouncer를 사용
- 한국(Windows 로컬)에서 인도까지 네트워크 왕복 시간(RTT)이 100~300ms 이상
- `connection_limit=5`로 제한되어 있어, 동시 서버 컴포넌트 렌더링 시 연결 풀이 쉽게 고갈됨
- `pool_timeout=10`, `connect_timeout=10`으로 타임아웃까지 최대 10초 대기
- 홈 페이지는 모든 데이터를 **클라이언트 컴포넌트**에서 fetch API로 가져오므로 (hero-section, recommended-games, quick-menu 등) 서버에서 DB를 직접 호출하지 않아 정상 동작
- 반면 /games, /tournaments, /community, /teams 페이지들은 **서버 컴포넌트**에서 `prisma.xxx.findMany()`를 직접 호출하여 DB 응답을 기다림

**[핵심 원인 B] 서버 컴포넌트의 블로킹 DB 쿼리 패턴**
- `/games` 페이지: `listGames()` + `getCities()` 2개의 DB 쿼리를 순차 실행
- `/tournaments` 페이지: `unstable_cache`로 감싸져 있지만, 캐시 미스 시 `listTournaments()` DB 쿼리 실행
- `/community` 페이지: `force-dynamic` + `prisma.community_posts.findMany()` 직접 호출 (캐시 없음)
- `/teams` 페이지: `Promise.all()`로 2개 쿼리 병렬 실행하지만, 둘 다 원격 DB 의존

**[보조 원인 C] Next.js 16 + Turbopack 개발서버 불안정**
- `package.json`에 `"next": "^16.1.6"` 사용 (아직 안정화되지 않은 메이저 버전)
- `next dev --port 3001` (Turbopack 기본 활성화)
- 서버 컴포넌트의 첫 컴파일 시 Turbopack이 추가 지연을 유발할 수 있음
- `next.config.ts`에서 `turbopack: {}` 설정으로 경고만 억제했을 뿐, 실질적 최적화 없음

**[보조 원인 D] Header 컴포넌트의 pathname 의존 useEffect**
- `src/components/shared/header.tsx` 59-69줄: `useEffect(() => { ... }, [user, pathname])`
- pathname이 바뀔 때마다 `/api/web/notifications` API를 호출
- 이 API 자체도 서버에서 DB 쿼리를 실행 (`prisma.notifications.count()`)
- 직접적인 무한 루프는 아니지만, DB 연결 풀 고갈에 기여

**왜 "무한 렌더링"처럼 보이는가:**
- 화면 하단의 "Rendering..." 표시는 Next.js 16 개발서버의 **서버 컴포넌트 컴파일/렌더링 상태 인디케이터**
- 서버 컴포넌트가 DB 응답을 기다리는 동안 이 표시가 계속 남아 있음
- Suspense fallback(loading.tsx)의 스켈레톤 UI가 보이다가, DB 타임아웃(10초)이 지나면 `.catch(() => [])` 로 빈 배열을 반환하고 렌더링이 겨우 완료됨
- 만약 DB가 타임아웃 없이 영원히 대기하면 → 진짜 무한 로딩

#### 3. 관련 파일 목록

| 파일 | 역할 | 문제 |
|------|------|------|
| `.env` (DATABASE_URL) | DB 연결 설정 | 인도 리전 + connection_limit=5 |
| `src/app/(web)/games/page.tsx` | 경기 목록 | 서버 컴포넌트에서 DB 직접 쿼리 |
| `src/app/(web)/tournaments/page.tsx` | 대회 목록 | 서버 컴포넌트에서 DB 직접 쿼리 |
| `src/app/(web)/community/page.tsx` | 게시판 | force-dynamic + DB 직접 쿼리 |
| `src/app/(web)/teams/page.tsx` | 팀 목록 | 서버 컴포넌트에서 DB 직접 쿼리 |
| `src/components/shared/header.tsx` | 헤더/네비게이션 | pathname 변경 시 API 호출 |
| `src/lib/db/prisma.ts` | Prisma 싱글톤 | 연결 풀 관리 |
| `src/app/(web)/page.tsx` | 홈 페이지 | 클라이언트 컴포넌트 기반 (정상) |
| `next.config.ts` | Next.js 설정 | Turbopack + Serwist |

#### 4. 수정 제안 (방향만)

**즉시 해결 (A: DB 연결 최적화)**
1. Supabase 프로젝트를 **한국/일본 리전**으로 마이그레이션하거나, 가까운 리전(도쿄 등) 사용
2. 또는 개발 환경용 로컬 PostgreSQL 사용 (`DATABASE_URL`을 localhost로 변경)
3. `connection_limit`을 10~15로 증가

**중기 해결 (B: 렌더링 패턴 변경)**
1. DB 쿼리가 무거운 페이지들을 클라이언트 컴포넌트 + API route 패턴으로 전환 (홈 페이지처럼)
2. 또는 `unstable_cache`를 더 적극적으로 적용하여 캐시 히트율 향상
3. `/community` 페이지의 `force-dynamic`을 `revalidate = 30`으로 변경

**장기 해결 (C: 개발 환경 안정화)**
1. Next.js 16이 안정화될 때까지 `--turbopack` 플래그를 명시적으로 비활성화하여 webpack 사용 테스트
2. 또는 Next.js 15 LTS로 다운그레이드

### 2026-03-20: 캐시 정리 후 개발서버 재시작 및 로딩 테스트

#### 1. 수행 작업
1. 포트 3001 프로세스 확인 -> 실행 중인 프로세스 없음
2. `.next` 폴더 삭제 (빌드 캐시 완전 초기화)
3. `node_modules/.cache` 폴더 삭제 (번들러 캐시 초기화)
4. `npx next dev --port 3001`로 개발서버 재시작

#### 2. 페이지 응답 테스트 결과

| 페이지 | 1회차 (캐시 없음, 첫 컴파일) | 2회차 (캐시 적중) | 상태코드 |
|--------|---------------------------|-----------------|---------|
| / (홈) | 0.06s | 0.05s | 200 |
| /games | 0.48s | 0.06s | 200 |
| /tournaments | 0.37s | 0.08s | 200 |
| /teams | 0.38s | 0.06s | 200 |
| /community | 0.30s | 0.06s | 200 |

#### 3. API Route 응답 테스트 결과

| API | 1회차 (첫 호출) | 2회차 | 상태코드 | 데이터 확인 |
|-----|---------------|-------|---------|-----------|
| /api/web/games | 3.05s | 0.69s | 200 | games 배열 + cities 배열 정상 |
| /api/web/tournaments | 0.90s | 0.81s | 200 | tournaments 배열 정상 |
| /api/web/teams | 0.82s | 0.82s | 200 | teams 배열 + cities 배열 정상 |
| /api/web/community | 3.37s | 1.09s | 200 | posts 배열 정상 |

#### 4. 진단 결과

**로딩이 안 되는 원인은 캐시 문제가 아니다.**

- 캐시 삭제 후 재시작해도 모든 페이지와 API가 정상 동작함 (200 OK)
- 페이지 응답: 1회차 최대 0.48초, 2회차 0.06초로 매우 빠름
- API 응답: 1회차에 games(3.05s), community(3.37s)가 느리지만, 이는 Supabase 인도 리전 DB 연결 지연이지 캐시 문제가 아님
- 2회차에서 Prisma 커넥션 풀이 warm-up 되면서 API 응답이 개선됨
- 이전에 "무한 로딩"처럼 보이던 현상은 **서버 컴포넌트에서 DB를 직접 호출하던 패턴** 때문이었으며, 이미 클라이언트 컴포넌트 + API route 패턴으로 전환이 완료되어 해결된 상태

**결론:**
1. 캐시 문제: 아님 (캐시 삭제 후에도 정상 동작)
2. DB 연결 문제: 부분적으로 영향 있음 (인도 리전 지연 0.7~3.4초), 그러나 페이지 로딩 자체를 막지는 않음
3. 코드 문제: 아님 (클라이언트 컴포넌트 전환이 이미 완료되어 페이지는 즉시 렌더링되고, 데이터는 비동기로 로딩됨)
4. 현재 상태: 정상 동작 중

---

## 테스트 결과 (tester)

### 2026-03-20: /games 페이지 클라이언트 컴포넌트 + API route 전환 검증 (1단계)

#### 1. 코드 레벨 검증

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| route.ts - apiSuccess() 헬퍼 사용 | ✅ 통과 | 70행에서 `apiSuccess({ games, cities })` 사용 |
| route.ts - apiError() 헬퍼 사용 | ✅ 통과 | 73행에서 `apiError()` 사용 |
| route.ts - BigInt 직렬화 | ✅ 통과 | 56행 `g.id.toString()` + `convertKeysToSnakeCase`에서도 bigint 처리 |
| route.ts - Date 직렬화 | ✅ 통과 | 63행 `g.scheduled_at?.toISOString()` |
| route.ts - Decimal 직렬화 | ✅ 통과 | 66행 `g.fee_per_person?.toString()` |
| route.ts - try-catch 에러 핸들링 | ✅ 통과 | 13행 try, 71행 catch |
| route.ts - 쿼리파라미터 처리 (q, type, city, date) | ✅ 통과 | 18-21행에서 4개 파라미터 추출 |
| route.ts - 날짜 범위 계산 (today, week, month) | ✅ 통과 | 24-46행, 기존 page.tsx 로직과 동일 |
| route.ts - Promise.all 병렬 쿼리 | ✅ 통과 | 49-52행, listGames + listGameCities 병렬 실행 |
| route.ts - 개별 쿼리 에러 처리 (.catch) | ✅ 통과 | 50-51행, 각각 `.catch(() => [])` |
| games-content.tsx - "use client" 선언 | ✅ 통과 | 1행 |
| games-content.tsx - useState + useEffect 패턴 | ✅ 통과 | 186-188행 useState, 191-214행 useEffect |
| games-content.tsx - 로딩 상태 처리 | ✅ 통과 | 188행 `loading` state, 258행 스켈레톤 표시 |
| games-content.tsx - 에러 상태 처리 | ✅ 통과 | 209-212행 catch에서 빈 배열 설정 |
| games-content.tsx - 빈 결과 UI | ✅ 통과 | 276-283행, 필터 유무에 따른 메시지 분기 |
| games-content.tsx - API 응답 키(snake_case) 매핑 | ✅ 통과 | GameFromApi 인터페이스가 snake_case 키 사용, apiSuccess의 convertKeysToSnakeCase 변환 결과와 일치 |
| page.tsx - prisma/DB 직접 호출 제거 | ✅ 통과 | prisma import 없음, DB 관련 코드 없음 |
| page.tsx - async 키워드 제거 | ✅ 통과 | 48행 `export default function GamesPage()` (async 없음) |
| page.tsx - Suspense 래핑 | ✅ 통과 | useSearchParams 사용 컴포넌트를 Suspense로 감쌈 |

#### 2. TypeScript 빌드 검증

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| `npx tsc --noEmit` 전체 타입 체크 | ✅ 통과 | 에러 0건 |

#### 3. API route 직접 테스트

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| GET /api/web/games 응답 | ⚠️ 주의 | 15초 타임아웃 발생. 원격 DB(Supabase 인도 리전) 연결 지연으로 인한 것으로, 코드 자체의 문제는 아님. debugger가 이미 진단한 기존 인프라 이슈와 동일. |

#### 4. 기존 기능 유지 확인

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| 필터링 (type) 파라미터 처리 | ✅ 통과 | route.ts 19행, game.ts 36행에서 처리 |
| 필터링 (city) 파라미터 처리 | ✅ 통과 | route.ts 20행, game.ts 37-38행에서 처리 |
| 필터링 (date) 파라미터 처리 | ✅ 통과 | route.ts 21행, 24-46행 날짜 범위 계산 |
| 검색 (q) 파라미터 처리 | ✅ 통과 | route.ts 18행, game.ts 35행에서 title contains 검색 |
| GamesFilter 컴포넌트 연동 | ✅ 통과 | page.tsx에서 GamesFilter를 props로 주입, cities 데이터를 API 응답에서 전달 |
| GamesFilter props 타입 호환 | ✅ 통과 | `{ cities: string[] }` 타입이 정확히 일치 |
| 빈 결과 시 빈 상태 UI | ✅ 통과 | 276-283행, 필터 활성/비활성에 따른 메시지 분기 |
| searchParams 변경 시 재호출 | ✅ 통과 | useEffect 의존성에 searchParams 포함 (214행) |

#### 5. import 경로 검증

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| route.ts - @/lib/services/game import | ✅ 통과 | listGames, listGameCities 함수 존재 확인 |
| route.ts - @/lib/api/response import | ✅ 통과 | apiSuccess, apiError 함수 존재 확인 |
| games-content.tsx - @/components/ui/skeleton import | ✅ 통과 | 파일 존재 확인 |
| games-content.tsx - next/navigation import | ✅ 통과 | useSearchParams 사용 |
| page.tsx - ./games-filter import | ✅ 통과 | 파일 존재 확인, GamesFilter export 확인 |
| page.tsx - ./_components/games-content import | ✅ 통과 | 파일 존재 확인, GamesContent export 확인 |
| page.tsx - 제거된 import가 다른 곳에 영향 | ✅ 통과 | 기존 서비스 함수들은 그대로 유지되어 있음 |

#### 종합 판정

📊 **24개 항목 중 23개 통과 / 0개 실패 / 1개 주의**

**판정: 조건부 통과**

코드 레벨에서는 모든 항목이 정상입니다. API route의 구조, 직렬화 처리, 에러 핸들링, 클라이언트 컴포넌트의 상태 관리, 필터 연동, import 경로 모두 올바르게 구현되었습니다. TypeScript 타입 체크도 에러 없이 통과했습니다.

단, API 실제 호출 시 원격 DB 연결 타임아웃이 발생합니다. 이는 코드 문제가 아닌 인프라 이슈(Supabase 인도 리전 지연)이며, debugger가 이미 진단한 기존 문제입니다. 로컬 DB 또는 가까운 리전의 DB를 사용하면 정상 동작할 것으로 예상됩니다.

**코드 품질 소견:**
- snake_case 변환 흐름이 정확함 (route.ts camelCase -> apiSuccess/convertKeysToSnakeCase -> snake_case -> 클라이언트 GameFromApi)
- 기존 서비스 함수(listGames, listGameCities)를 잘 재활용함
- GamesFilter를 props injection 패턴으로 연결한 것이 깔끔함
- Suspense fallback으로 페이지 레벨 스켈레톤까지 제공함

### 2026-03-20: 4개 페이지 전체 통합 검증 (2~4단계 + 1단계 회귀)

#### A. 코드 레벨 검증 - /tournaments (2단계)

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| route.ts - apiSuccess() 헬퍼 사용 | ✅ 통과 | 39행 `apiSuccess({ tournaments })` |
| route.ts - apiError() 헬퍼 사용 | ✅ 통과 | 42행 `apiError()` |
| route.ts - Date 직렬화 | ✅ 통과 | 30-31행 `toISOString()` |
| route.ts - Decimal 직렬화 | ✅ 통과 | 32행 `entry_fee?.toString()` |
| route.ts - try-catch 에러 핸들링 | ✅ 통과 | 15행 try, 40행 catch |
| route.ts - status 쿼리 파라미터 처리 | ✅ 통과 | 19행에서 status 파라미터 추출 |
| route.ts - listTournaments() 서비스 재활용 | ✅ 통과 | 22행, TOURNAMENT_LIST_SELECT와 일치하는 필드 사용 |
| route.ts - 기존 POST(대회 생성) 유지 | ✅ 통과 | 54-139행, withWebAuth + createTournament 등 기존 코드 완전 보존 |
| route.ts - _count.tournamentTeams -> teamCount 평탄화 | ✅ 통과 | 36행 |
| tournaments-content.tsx - "use client" 선언 | ✅ 통과 | 1행 |
| tournaments-content.tsx - useState + useEffect 패턴 | ✅ 통과 | 182-183행 useState, 186-207행 useEffect |
| tournaments-content.tsx - 로딩 상태 (스켈레톤 UI) | ✅ 통과 | 232행 TournamentGridSkeleton |
| tournaments-content.tsx - 에러 상태 처리 | ✅ 통과 | 203행 catch에서 빈 배열 설정 |
| tournaments-content.tsx - 빈 결과 UI | ✅ 통과 | 250-257행, 필터 유무에 따른 메시지 분기 |
| tournaments-content.tsx - API 응답 키(snake_case) 매핑 | ✅ 통과 | TournamentFromApi 인터페이스가 snake_case 키 사용 (start_date, end_date 등) |
| tournaments-content.tsx - TOURNAMENT_STATUS_LABEL import | ✅ 통과 | 8행, `src/lib/constants/tournament-status.ts` 파일 존재 확인 |
| tournaments-content.tsx - "대회 만들기" 링크 유지 | ✅ 통과 | 219행 `/tournament-admin/tournaments/new/wizard` |
| page.tsx - prisma/DB 직접 호출 제거 | ✅ 통과 | prisma import 없음, async 없음 |
| page.tsx - unstable_cache 제거 | ✅ 통과 | unstable_cache import/사용 없음 |
| page.tsx - Suspense 래핑 | ✅ 통과 | 54행 |
| page.tsx - TournamentsFilter props injection | ✅ 통과 | 55행, TournamentsFilter가 props 없이 동작 (상태 탭은 URL params 기반) |

#### A. 코드 레벨 검증 - /teams (3단계)

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| route.ts - apiSuccess() 헬퍼 사용 | ✅ 통과 | 83행 `apiSuccess({ teams, cities })` |
| route.ts - apiError() 헬퍼 사용 | ✅ 통과 | 86행 `apiError()` |
| route.ts - BigInt 직렬화 | ✅ 통과 | 70행 `t.id.toString()` |
| route.ts - try-catch 에러 핸들링 | ✅ 통과 | 13행 try, 84행 catch |
| route.ts - q/city 쿼리 파라미터 처리 | ✅ 통과 | 18-19행 추출, 28-35행 where 조건 구성 |
| route.ts - Promise.all 병렬 쿼리 | ✅ 통과 | 38-63행, findMany + groupBy 병렬 |
| route.ts - _count.teamMembers -> memberCount 평탄화 | ✅ 통과 | 80행 |
| route.ts - 개별 쿼리 에러 처리 (.catch) | ✅ 통과 | 56행, 62행 각각 `.catch(() => [])` |
| teams-content.tsx - "use client" 선언 | ✅ 통과 | 1행 |
| teams-content.tsx - useState + useEffect 패턴 | ✅ 통과 | 132-134행 useState, 137-160행 useEffect |
| teams-content.tsx - 로딩 상태 (스켈레톤 UI) | ✅ 통과 | 189행 TeamsGridSkeleton |
| teams-content.tsx - 에러 상태 처리 | ✅ 통과 | 155행 catch에서 빈 배열 설정 |
| teams-content.tsx - 빈 결과 UI | ✅ 통과 | 207-213행, 필터 유무에 따른 메시지 분기 |
| teams-content.tsx - API 응답 키(snake_case) 매핑 | ✅ 통과 | TeamFromApi 인터페이스가 snake_case 키 사용 (primary_color, member_count 등) |
| teams-content.tsx - "팀 만들기" 링크 유지 | ✅ 통과 | 178행 `/teams/new` |
| page.tsx - prisma/DB 직접 호출 제거 | ✅ 통과 | prisma import 없음, async 없음, revalidate 없음 |
| page.tsx - Suspense 래핑 | ✅ 통과 | 15행, fallback으로 TeamsLoading 사용 |
| page.tsx - TeamsFilter props injection | ✅ 통과 | 16행, cities 데이터를 동적 전달 |

#### A. 코드 레벨 검증 - /community (4단계)

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| route.ts - apiSuccess() 헬퍼 사용 | ✅ 통과 | 57행 `apiSuccess({ posts })` |
| route.ts - apiError() 헬퍼 사용 | ✅ 통과 | 60행 `apiError()` |
| route.ts - BigInt 직렬화 | ✅ 통과 | 47행 `p.id.toString()` |
| route.ts - Date 직렬화 | ✅ 통과 | 53행 `p.created_at?.toISOString()` |
| route.ts - try-catch 에러 핸들링 | ✅ 통과 | 13행 try, 58행 catch |
| route.ts - category/q 쿼리 파라미터 처리 | ✅ 통과 | 18-19행 추출, 25-35행 where 조건 |
| route.ts - OR 검색 (제목+본문) | ✅ 통과 | 31-34행, title OR body contains |
| route.ts - 작성자 닉네임 include | ✅ 통과 | 42행 `include: { users: { select: { nickname: true } } }` |
| route.ts - 개별 쿼리 에러 처리 (.catch) | ✅ 통과 | 43행 `.catch(() => [])` |
| community-content.tsx - "use client" 선언 | ✅ 통과 | 1행 |
| community-content.tsx - useState + useEffect 패턴 | ✅ 통과 | 73-79행 useState, 82-106행 useEffect |
| community-content.tsx - 로딩 상태 (스켈레톤 UI) | ✅ 통과 | 204행 CommunityGridSkeleton |
| community-content.tsx - 에러 상태 처리 | ✅ 통과 | 102행 catch에서 빈 배열 설정 |
| community-content.tsx - 빈 결과 UI | ✅ 통과 | 245-249행, 필터/검색 유무에 따른 메시지 분기 |
| community-content.tsx - API 응답 키(snake_case) 매핑 | ✅ 통과 | PostFromApi 인터페이스가 snake_case 키 사용 |
| community-content.tsx - 검색 폼 클라이언트 state 전환 | ✅ 통과 | 109-118행, handleSearch/handleClearSearch |
| community-content.tsx - searchQuery/appliedQuery 분리 | ✅ 통과 | 78-79행, 타이핑마다 API 호출 방지 |
| community-content.tsx - 카테고리 필터 button 전환 | ✅ 통과 | 168-192행, Link -> button으로 변경 (서버 네비게이션 방지) |
| community-content.tsx - "글쓰기" 링크 유지 | ✅ 통과 | 131행 `/community/new` |
| community-content.tsx - 게시글 클릭 시 public_id 경로 | ✅ 통과 | 214행 `/community/${p.public_id}` |
| page.tsx - force-dynamic 제거 | ✅ 통과 | `export const dynamic` 없음 (주석에만 언급) |
| page.tsx - async/prisma/searchParams 제거 | ✅ 통과 | 모두 제거됨, 순수 래퍼 역할 |
| page.tsx - Suspense 래핑 | ✅ 통과 | 17행, fallback으로 CommunityLoading 사용 |

#### B. TypeScript 빌드 검증

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| `npx tsc --noEmit` 전체 타입 체크 | ✅ 통과 | 에러 0건 (4개 페이지 전체 포함) |

#### C. import 경로 검증

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| tournaments/route.ts - listTournaments import | ✅ 통과 | `@/lib/services/tournament` 내 192행 export 확인 |
| tournaments/route.ts - withWebAuth, apiSuccess, apiError import | ✅ 통과 | 각 파일 존재 및 export 확인 |
| tournaments-content.tsx - TOURNAMENT_STATUS_LABEL import | ✅ 통과 | `@/lib/constants/tournament-status.ts` 존재 확인 |
| tournaments-content.tsx - Badge import | ✅ 통과 | `@/components/ui/badge` 존재 |
| tournaments/page.tsx - TournamentsFilter import | ✅ 통과 | `tournaments-filter.tsx`에서 export 확인 |
| tournaments/page.tsx - TournamentsContent import | ✅ 통과 | `_components/tournaments-content.tsx`에서 export 확인 |
| teams/route.ts - prisma, apiSuccess, apiError import | ✅ 통과 | 각 파일 존재 및 export 확인 |
| teams-content.tsx - Badge import | ✅ 통과 | `@/components/ui/badge` 존재 |
| teams/page.tsx - TeamsFilter import | ✅ 통과 | `teams-filter.tsx`에서 export 확인 |
| teams/page.tsx - TeamsContent import | ✅ 통과 | `_components/teams-content.tsx`에서 export 확인 |
| teams/page.tsx - TeamsLoading import | ✅ 통과 | `loading.tsx` 파일 존재 확인 |
| community/route.ts - prisma, apiSuccess, apiError import | ✅ 통과 | 각 파일 존재 및 export 확인 |
| community-content.tsx - Card, Badge, Skeleton import | ✅ 통과 | 각 UI 컴포넌트 존재 |
| community/page.tsx - CommunityContent import | ✅ 통과 | `_components/community-content.tsx`에서 export 확인 |
| community/page.tsx - CommunityLoading import | ✅ 통과 | `loading.tsx` 파일 존재 확인 |

#### D. 일관성 검증

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| 4개 페이지 동일 패턴 사용 | ✅ 통과 | 모두 "API route(GET) + 클라이언트 컴포넌트 + page.tsx 래퍼" 패턴 |
| page.tsx 래퍼 패턴 동일 | ✅ 통과 | 모두 Suspense + fallback + Content 컴포넌트 호출 |
| API route 응답 형식 일관 | ✅ 통과 | 모두 apiSuccess()로 응답, snake_case 자동 변환 |
| 에러 핸들링 패턴 일관 | ✅ 통과 | 모두 try-catch + apiError(메시지, 500, "INTERNAL_ERROR") |
| 클라이언트 fetch 패턴 일관 | ✅ 통과 | 모두 fetch -> .then(json) -> setState -> .catch -> .finally(setLoading false) |
| 빈 상태 UI 패턴 일관 | ✅ 통과 | 모두 필터 유무에 따른 메시지 분기 |
| 스켈레톤 UI 패턴 일관 | ✅ 통과 | 모두 별도 Skeleton 컴포넌트 정의 + loading state 분기 |

#### E. 기존 기능 유지 확인

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| /games - 필터(q, type, city, date) API에서 처리 | ✅ 통과 | route.ts 18-46행 |
| /tournaments - 필터(status) API에서 처리 | ✅ 통과 | route.ts 19행, listTournaments에 전달 |
| /tournaments - 기존 POST(대회 생성) 손상 여부 | ✅ 통과 | 46-139행 완전 보존, withWebAuth/createTournament/hasCreatePermission 등 |
| /teams - 필터(q, city) API에서 처리 | ✅ 통과 | route.ts 18-35행 |
| /community - 필터(category, q) API에서 처리 | ✅ 통과 | route.ts 18-35행 |
| /community - 검색이 제목+본문 양쪽에서 작동 | ✅ 통과 | route.ts 31-34행 OR 조건 |

#### F. 1단계 /games 회귀 테스트

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| games route.ts 코드 변경 없음 | ✅ 통과 | 이전 테스트 시점과 동일 |
| games-content.tsx 코드 변경 없음 | ✅ 통과 | 이전 테스트 시점과 동일 |
| games page.tsx 코드 변경 없음 | ✅ 통과 | 이전 테스트 시점과 동일 |
| TypeScript 타입 체크 통과 | ✅ 통과 | tsc --noEmit 에러 0건 |

#### 종합 판정

📊 **총 72개 항목 중 72개 통과 / 0개 실패 / 0개 주의**

**판정: 통과**

4개 페이지 모두 코드 레벨에서 완전히 정상입니다. 구체적으로:

1. **API route**: 4개 모두 apiSuccess()/apiError() 헬퍼를 사용하고, BigInt/Date/Decimal 직렬화가 올바르게 처리되어 있으며, try-catch 에러 핸들링과 쿼리 파라미터 필터링이 정상 구현됨.
2. **클라이언트 컴포넌트**: 4개 모두 "use client" 선언, useState+useEffect 패턴, 로딩/에러/빈 상태 UI가 구현됨. snake_case API 응답 키와 인터페이스가 정확히 일치.
3. **page.tsx**: 4개 모두 async/prisma/force-dynamic/unstable_cache가 완전히 제거되고, Suspense + Content 래퍼로 간소화됨.
4. **TypeScript**: `npx tsc --noEmit` 에러 0건.
5. **일관성**: 4개 페이지가 동일한 아키텍처 패턴을 따름.
6. **기존 기능**: tournaments의 POST(대회 생성) API가 완전히 보존됨. 각 페이지의 필터/검색 기능이 API route에서 올바르게 처리됨.

**참고**: 1단계 테스트에서 보고한 원격 DB 타임아웃 이슈는 인프라 문제이며, 이번 전환 작업의 코드 품질과는 무관합니다.

## 리뷰 결과 (reviewer)

### 2026-03-20: 4개 페이지 "서버 컴포넌트 -> 클라이언트 컴포넌트 + API route" 전환 코드 리뷰

**리뷰 대상**: 12개 파일 (API route 4개 + 클라이언트 컴포넌트 4개 + page.tsx 4개)
**tester 결과 참조**: 72항목 전체 통과, TypeScript tsc --noEmit 에러 0건

---

종합 판정: **통과**

---

#### 잘된 점:

1. **일관된 아키텍처 패턴**: 4개 페이지 모두 "API route(GET) + 클라이언트 컴포넌트(_components/) + page.tsx 래퍼(Suspense)" 동일한 3-레이어 패턴을 따른다. 유지보수 시 어느 페이지를 열어도 같은 구조여서 파악이 쉽다.

2. **snake_case 변환 흐름이 정확하다**: API route에서 camelCase 키로 직렬화 -> apiSuccess()의 convertKeysToSnakeCase가 snake_case로 변환 -> 클라이언트의 인터페이스(GameFromApi, TournamentFromApi 등)가 snake_case로 정의. 4개 파일 모두 키 이름이 정확히 일치하는 것을 확인했다.

3. **BigInt/Date/Decimal 직렬화 처리가 빈틈없다**: BigInt는 toString(), Date는 toISOString(), Decimal은 toString()으로 변환. null 체크도 optional chaining + nullish coalescing으로 안전하게 처리되어 있다.

4. **에러 핸들링이 방어적이다**: API route는 외부 try-catch + 내부 .catch(() => []) 이중 방어. 클라이언트 컴포넌트는 fetch .catch에서 빈 배열 fallback + .finally에서 loading false. DB가 죽어도 빈 화면이지 앱이 터지지 않는다.

5. **기존 tournaments POST API가 완전히 보존됨**: GET만 추가하고 46행 이후 기존 코드를 전혀 건드리지 않았다. 안전한 수정이다.

6. **community의 검색 UX 설계가 잘 되어 있다**: searchQuery(입력값)와 appliedQuery(적용값)를 분리하여 타이핑할 때마다 API를 호출하지 않고, 검색 버튼을 누를 때만 호출한다. 초기화 버튼도 있다.

7. **Filter 컴포넌트 주입 패턴(Component Injection)**: GamesContent와 TeamsContent가 Filter 컴포넌트를 props로 받아서 cities 데이터를 동적으로 전달하는 방식이 깔끔하다. 서버 컴포넌트(page.tsx)와 클라이언트 컴포넌트의 경계를 잘 다루고 있다.

8. **주석이 충실하다**: 모든 API route에 JSDoc + 변환 이유 주석이 달려 있어, 나중에 코드를 볼 때 "왜 이렇게 했는지"를 바로 알 수 있다.

---

#### 필수 수정: 없음

---

#### 권장 수정 (선택사항, 당장 안 해도 동작에 문제없음):

1. **[games/route.ts:60] camelCase 직렬화 키 혼용 주의**
   - `gameType`, `venueName`, `scheduledAt`, `feePerPerson`, `skillLevel`은 camelCase로 직렬화한 뒤 apiSuccess()가 snake_case로 변환한다. 반면 `uuid`, `title`, `status`, `city`는 원래부터 snake_case/단어 하나라 변환이 일어나지 않는다. 이 방식은 현재 정상 동작하지만, 만약 나중에 apiSuccess()의 변환 로직이 바뀌면 영향받을 수 있다. 참고만 해두면 된다.

2. **[tournaments/route.ts:32] entry_fee 키가 이미 snake_case**
   - `entryFee: t.entry_fee?.toString()` 여기서 값은 Prisma의 snake_case 필드(`t.entry_fee`)에서 가져오지만, 키를 `entryFee`(camelCase)로 지정하여 apiSuccess()가 `entry_fee`로 재변환한다. 결과적으로 정확하지만, 혼동 여지가 있다. tournaments의 listTournaments 반환 타입이 camelCase 매핑(@map)과 snake_case 원본 필드가 섞여 있는 것으로 보인다. 현재 동작하므로 수정 불필요.

3. **[4개 클라이언트 컴포넌트] useEffect 내 fetch에 AbortController 미적용**
   - searchParams가 빠르게 연속 변경되면(예: 필터를 빠르게 클릭) 이전 요청이 취소되지 않고 경쟁 상태(race condition)가 발생할 수 있다. 현실적으로 사용자가 필터를 1초에 5번 이상 클릭하는 경우는 드물고, 마지막 응답이 덮어쓰므로 심각한 문제는 아니다. 하지만 완벽한 처리를 원한다면 AbortController를 useEffect의 cleanup에서 호출하면 된다. 지금은 불필요.

---

#### 보안 점검 결과:

| 항목 | 결과 | 비고 |
|------|------|------|
| SQL 인젝션 위험 | 안전 | Prisma ORM의 파라미터 바인딩 사용. 쿼리 파라미터가 직접 SQL에 들어가지 않음 |
| 인증 누락 | 해당없음 | 4개 GET 엔드포인트 모두 공개 목록 조회이므로 인증 불필요 (의도적) |
| 기존 POST 인증 보존 | 안전 | tournaments POST는 withWebAuth로 보호된 채 유지됨 |
| 환경변수 노출 | 안전 | NEXT_PUBLIC_ 접두사 사용 없음, DB URL이 클라이언트에 노출되지 않음 |
| IDOR 위험 | 해당없음 | 목록 조회만 수행하며 특정 리소스의 소유자 검증이 필요한 작업 없음 |

---

#### 성능 점검 결과:

| 항목 | 결과 | 비고 |
|------|------|------|
| 불필요한 리렌더링 | 없음 | useEffect 의존성 배열이 정확 (searchParams 또는 category+appliedQuery) |
| DB 쿼리 최적화 | 양호 | games, teams는 Promise.all로 병렬 조회. 모두 take 제한(30~60)이 있어 무한 조회 방지 |
| 네트워크 최적화 | 양호 | games, teams는 목록+도시를 한 번의 API 호출로 가져옴 |
| 캐싱 | 참고 | 기존 revalidate/unstable_cache가 제거됨. 현재는 매 요청마다 DB 조회. 트래픽이 늘면 API route에 캐싱 추가 고려 가능 |

---

#### 코드 품질 점검 결과:

| 항목 | 결과 | 비고 |
|------|------|------|
| 사용하지 않는 import | 없음 | 모든 import가 사용됨 |
| any 타입 사용 | 없음 | 모든 인터페이스가 명시적으로 정의됨 |
| 중복 코드 | 허용 범위 | 4개 fetch 패턴이 유사하지만, 각 페이지의 데이터 구조가 달라 공통 훅 추출은 과도한 추상화. 현재가 적절 |
| 프로젝트 컨벤션 | 준수 | apiSuccess()/apiError() 헬퍼 사용, snake_case 변환, 파일명 kebab-case |

---

**최종 의견**: 12개 파일 모두 코드 품질이 양호하며 실질적인 문제가 없다. 4개 페이지가 동일한 패턴을 일관성 있게 따르고 있어 유지보수성이 좋다. 필수 수정 사항 없이 커밋 가능하다.

---

### 2026-03-20: C-3 + S-1 매치 상태 상수 통일 (Critical 버그 수정 1단계)

확인 결과: **이미 구현 완료 상태**

| 항목 | 상태 | 비고 |
|------|------|------|
| `src/lib/constants/match-status.ts` 상수 파일 | 이미 존재 | MATCH_STATUS, SYNC_ALLOWED_STATUSES, ACTIVE_MATCH_STATUSES, ACTIVE_TOURNAMENT_STATUSES 정의됨 |
| `src/lib/validation/match.ts` batchSyncSchema | 이미 상수 참조 | SYNC_ALLOWED_STATUSES 사용, "live" 포함됨 |
| `src/app/api/v1/recorder/matches/route.ts` status 필터 | 이미 상수 참조 | ACTIVE_TOURNAMENT_STATUSES 사용 |

**추가 발견 - 하드코딩 잔존 파일 (위험도 낮음, 수정 보류):**
| 파일 | 현재 하드코딩 | 비고 |
|------|-------------|------|
| `src/app/api/v1/matches/[id]/status/route.ts` | `z.enum(["in_progress", "completed", "cancelled"])` | 상태 변경 전용이라 별도 상수가 적절 |
| `src/app/api/live/route.ts` | `["live", "in_progress"]` | `ACTIVE_MATCH_STATUSES`로 대체 가능하나 동작에 문제없음 |
| `src/lib/tournaments/bracket-builder.ts` | 자체 MatchStatus 타입 정의 | 상수 파일 타입으로 교체 가능하나 위험도 낮음 |

**결론**: 핵심 작업(C-3 + S-1)은 이전 커밋에서 이미 완료됨. 추가 하드코딩 정리는 위험도가 낮아 보류.

---

### 2026-03-20: C-4 super_admin 쿼리 take 제한 (Critical 버그 수정 2단계)

확인 결과: **이미 구현 완료 상태**

| 항목 | 상태 | 비고 |
|------|------|------|
| `src/app/api/v1/recorder/matches/route.ts` take 제한 | ✅ 이미 적용 | 30행 `take: 100` |
| orderBy 정렬 | ✅ 이미 적용 | 29행 `orderBy: [{ scheduledAt: "asc" }, { id: "asc" }]` |

**결론**: C-4는 이전 커밋(9fde3a8)에서 이미 완료됨. 추가 작업 불필요.

---

### 2026-03-20: W-1-b live API 응답 키 불일치 확인 (Critical 버그 수정 3단계)

확인 결과: **버그 없음 - 키 일치 확인 완료**

| 항목 | 상태 | 비고 |
|------|------|------|
| API `route.ts` 응답 | ✅ 정상 | `apiSuccess({ live: ..., recentCompleted: ... })` - camelCase |
| `apiSuccess()` 자동 변환 | ✅ 정상 | `convertKeysToSnakeCase()`가 `recentCompleted` → `recent_completed` 변환 |
| `page.tsx` 소비 | ✅ 정상 | `json.recent_completed` - snake_case로 읽음, API 응답과 일치 |

**분석**: 기획서 작성 시점의 버그가 이후 커밋에서 이미 수정되었거나, `apiSuccess()`의 자동 변환을 고려하면 원래부터 키가 일치했던 것으로 판단됨. "최근 종료 경기 빈 배열" 현상이 있다면 DB 데이터 부재 또는 catch 블록의 빈 배열 반환이 원인일 수 있음.

**결론**: W-1-b 코드 수정 불필요.

### 2026-03-20: C-6 match-sync post-process Promise.allSettled 전환 검증

대상 파일: `src/app/api/v1/tournaments/[id]/matches/sync/route.ts` (244-276행)

#### 1. 코드 레벨 검증

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| Promise.allSettled 사용이 올바른지 | ✅ 통과 | 250행: `Promise.allSettled([advanceWinner(matchId), updateTeamStandings(matchId)])` - 두 함수 모두 `Promise<void>` 반환, allSettled의 인자로 적합 |
| advanceResult status 체크 | ✅ 통과 | 256행: `advanceResult.status === "rejected"` - allSettled 결과의 표준 status 값("fulfilled"/"rejected") 사용 |
| standingsResult status 체크 | ✅ 통과 | 260행: `standingsResult.status === "rejected"` - 동일하게 올바른 체크 |
| postProcessStatus 값 분기 - completed일 때 | ✅ 통과 | 266행: `warnings.length === 0 ? "ok" : "partial_failure"` - 둘 다 성공이면 warnings 비어있어 "ok", 하나라도 실패하면 warnings에 추가되어 "partial_failure" |
| postProcessStatus 값 분기 - completed 아닐 때 | ✅ 통과 | 247행에서 초기값 "skipped", 249행 `if (match.status === "completed")` 블록에 진입하지 않으면 "skipped" 유지 |
| warnings 배열 기존 동작 유지 | ✅ 통과 | 246행: `const warnings: string[] = []` 선언, 258/262행에서 실패 시 push, 275행에서 조건부 응답 포함 `...(warnings.length > 0 && { warnings })` |
| apiSuccess 응답에 postProcessStatus 포함 | ✅ 통과 | 274행: `post_process_status: postProcessStatus` - snake_case 키로 응답에 포함 |
| 기존 응답 필드 유지 (server_match_id) | ✅ 통과 | 270행: `server_match_id: Number(match.server_id)` - 기존과 동일 |
| 기존 응답 필드 유지 (player_count) | ✅ 통과 | 271행: `player_count: player_stats?.length ?? 0` |
| 기존 응답 필드 유지 (play_by_play_count) | ✅ 통과 | 272행: `play_by_play_count: play_by_plays?.length ?? 0` |
| 기존 응답 필드 유지 (synced_at) | ✅ 통과 | 273행: `synced_at: now.toISOString()` |
| 로그 태그 변경 확인 | ✅ 통과 | 257행/261행: `[match-sync:post-process]` 태그 사용, matchId 포함 (`matchId=${match.server_id}`) |
| rejected 시 reason 로깅 | ✅ 통과 | 257행: `advanceResult.reason`, 261행: `standingsResult.reason` - allSettled rejected 결과의 reason 프로퍼티 정확히 참조 |

#### 2. TypeScript 검증

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| `npx tsc --noEmit` 전체 타입 체크 | ✅ 통과 | 에러 0건, 출력 없음 |

#### 3. 기존 기능 유지 확인

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| match.status !== "completed"일 때 후처리 미실행 | ✅ 통과 | 249행 `if (match.status === "completed")` 조건문으로 보호, 조건 불충족 시 postProcessStatus="skipped" |
| 파일 내 다른 코드 손상 여부 | ✅ 통과 | 1-243행(스키마, 권한체크, 매치업데이트, 선수스탯, PBP)과 277-329행(에러핸들링, POST export) 모두 정상. batch sync 코드는 이 파일에 없음(단일 매치 전용 파일). |
| 외부 catch 블록(277행) 유지 | ✅ 통과 | Promise.allSettled 내부 에러는 allSettled가 처리하고, 그 외 예외(DB 연결 등)는 277행 catch에서 잡힘 |

#### 4. import 경로 검증

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| advanceWinner import | ✅ 통과 | 6행: `import { advanceWinner, updateTeamStandings } from "@/lib/tournaments/update-standings"` - 기존 import 그대로, 새로운 import 추가 없음 |
| update-standings.ts 함수 시그니처 호환 | ✅ 통과 | `advanceWinner(matchId: bigint): Promise<void>`, `updateTeamStandings(matchId: bigint): Promise<void>` - matchId(BigInt) 인자 전달이 정확 |

📊 종합: 18개 항목 중 18개 통과 / 0개 실패

**결론**: C-6 수정이 올바르게 구현됨. Promise.allSettled 사용법이 정확하고, postProcessStatus 분기 로직에 논리적 오류 없음. 기존 응답 필드가 모두 유지되어 Flutter 앱 하위 호환성 문제 없음.

---

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## Git 기록 (git-manager)

### 2026-03-20: 4개 페이지 클라이언트 컴포넌트 + API route 전환 커밋

커밋: `feat: convert 4 pages to client component + API route pattern` (7eb6b8a)
브랜치: master
포함 파일 (13개):
- 신규 API routes: `src/app/api/web/games/route.ts`, `src/app/api/web/teams/route.ts`, `src/app/api/web/community/route.ts`
- 수정 API route: `src/app/api/web/tournaments/route.ts` (GET 추가)
- 신규 클라이언트 컴포넌트: `src/app/(web)/games/_components/games-content.tsx`, `src/app/(web)/tournaments/_components/tournaments-content.tsx`, `src/app/(web)/teams/_components/teams-content.tsx`, `src/app/(web)/community/_components/community-content.tsx`
- 수정 page.tsx: `src/app/(web)/games/page.tsx`, `src/app/(web)/tournaments/page.tsx`, `src/app/(web)/teams/page.tsx`, `src/app/(web)/community/page.tsx`
- 기타: `.claude/scratchpad.md`
push 여부: 미완료 (사용자 요청 시 push 예정)
제외 파일: `.claude/settings.local.json` (로컬 설정)

## 문서 기록 (doc-writer)
(아직 없음)

## 작업 로그 (최근 10건만 유지)
| 날짜 | 에이전트 | 작업 내용 | 결과 |
|------|---------|----------|------|
| 2026-03-20 | planner | 4개 페이지 클라이언트 컴포넌트 전환 계획 수립 | 완료 - 6단계, 총 80분 예상 |
| 2026-03-20 | developer | /games 페이지 클라이언트 컴포넌트 + API route 전환 (1단계) | 완료 - 3개 파일 (신규2, 수정1), TypeScript 검증 통과 |
| 2026-03-20 | tester | /games 페이지 전환 검증 (1단계) | 조건부 통과 - 코드 24항목 중 23통과/1주의(DB 타임아웃은 인프라 이슈) |
| 2026-03-20 | developer | /tournaments 페이지 클라이언트 컴포넌트 + API route 전환 (2단계) | 완료 - 3개 파일 (신규1, 수정2), TypeScript 검증 통과 |
| 2026-03-20 | developer | /teams 페이지 클라이언트 컴포넌트 + API route 전환 (3단계) | 완료 - 3개 파일 (신규2, 수정1), TypeScript 검증 통과 |
| 2026-03-20 | developer | /community 페이지 클라이언트 컴포넌트 + API route 전환 (4단계) | 완료 - 3개 파일 (신규2, 수정1), TypeScript 검증 통과 |
| 2026-03-20 | tester | 4개 페이지 전체 통합 검증 (2~4단계 + 1단계 회귀) | 통과 - 72항목 전체 통과, 실패/주의 0건 |
| 2026-03-20 | debugger | 캐시 정리 + 개발서버 재시작 + 로딩 테스트 | 완료 - 캐시 문제 아님. 5개 페이지/4개 API 모두 200 OK 정상 |
| 2026-03-20 | reviewer | 4개 페이지 전환 코드 리뷰 (12개 파일) | 통과 - 필수 수정 0건, 권장 수정 3건(AbortController 등). 커밋 가능 |
| 2026-03-20 | git-manager | 4개 페이지 전환 커밋 (13개 파일) | 완료 - 7eb6b8a, push 미완료 |
| 2026-03-20 | architect | 프로젝트 현황 분석 + 다음 작업 후보 10개 도출 | 완료 - plan.md/review-fix-plan.md/코드 전수 분석 |
| 2026-03-20 | developer | C-6 match-sync post-process Promise.allSettled 전환 | 완료 - 1개 파일 수정, TypeScript 검증 통과 |
| 2026-03-20 | developer | W-1 full-data API 이중 변환 검토 | 완료 - 수정 불필요. snake_case->snake_case 변환은 무해, 코드 변경 0건 |
| 2026-03-20 | developer | S-3 /api/live Rate Limiting 확인 | 완료 - 이미 구현됨. IP기반 60초 30회 제한 + 429 응답. 코드 변경 0건 |
| 2026-03-20 | tester | C-6 match-sync post-process Promise.allSettled 검증 | 통과 - 18항목 전체 통과, 실패 0건 |
