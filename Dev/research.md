# MyBDR 플랫폼 리서치 문서

> 작성일: 2026-03-02
> 범위: 알림 시스템 / 대회 관리 / 팀 페이지
> 코드베이스: Next.js 15 + Prisma 6 + PostgreSQL

---

## 목차

1. [알림(Notification) 시스템](#1-알림notification-시스템)
2. [대회(Tournament) 관리 시스템](#2-대회tournament-관리-시스템)
3. [팀(Team) 페이지 - NBA.com 참고](#3-팀team-페이지---nbacom-참고)
4. [레퍼런스 사이트 분석](#4-레퍼런스-사이트-분석)
5. [구현 우선순위 요약](#5-구현-우선순위-요약)

---

## 1. 알림(Notification) 시스템

### 1.1 현재 DB 스키마

`prisma/schema.prisma`에 `notifications` 테이블이 완전히 정의되어 있음.

```prisma
model notifications {
  id                BigInt    @id @default(autoincrement())
  user_id           BigInt                        -- 수신자
  notifiable_type   String?   @db.VarChar         -- 폴리모픽: "Game" | "TournamentTeam" | "TeamJoinRequest"
  notifiable_id     BigInt?                       -- 대상 리소스 ID
  notification_type String    @db.VarChar         -- 타입 키
  status            String    @default("unread")  -- "unread" | "read"
  title             String    @db.VarChar
  content           String?
  action_url        String?   @db.VarChar         -- 딥링크 경로
  action_type       String?   @db.VarChar
  metadata          Json?     @default("{}")      -- 추가 컨텍스트 JSON
  read_at           DateTime?
  sent_at           DateTime?
  expired_at        DateTime?
  created_at        DateTime
  updated_at        DateTime

  @@index([user_id, created_at])   -- 최신순 조회 최적화
  @@index([user_id, status])       -- 읽지 않은 수 카운트 최적화
  @@index([user_id, notification_type])
  @@index([notifiable_type, notifiable_id])
}
```

**인덱스 설계**: `user_id + status` 복합 인덱스 덕분에 "읽지 않은 알림 수" 쿼리 O(log n).

### 1.2 현재 프론트엔드 UI

**위치**: `src/app/(web)/notifications/page.tsx`

- Server Component, `force-dynamic` (항상 최신 데이터)
- 최근 30개 조회, 최신순 정렬
- 읽지 않은 알림: 파란 왼쪽 보더 + 진한 배경
- `action_url`이 있으면 클릭 시 해당 경로로 이동
- 빈 상태: 🔔 이모지 + "새로운 알림이 없습니다"

### 1.3 현재 누락된 것들

#### ❌ 알림 생성 로직 전무

아래 이벤트에서 알림을 생성하는 코드가 **코드베이스 어디에도 없음**:

| 이벤트 | API 경로 | 알림 수신자 | 현황 |
|--------|----------|------------|------|
| 경기 참가신청 | `POST /api/web/games/[id]/apply` | 경기 주최자 | ❌ |
| 참가신청 승인/거부 | `PATCH /api/web/games/[id]/apply` | 신청자 | ❌ |
| 대회 팀 등록 | `POST /api/web/tournaments/[id]/teams` | 팀장 | ❌ |
| 대회 팀 승인/거부 | `PATCH /api/web/tournaments/[id]/teams/[id]` | 팀장 | ❌ |
| 팀 가입 신청 | `POST /api/web/teams/[id]/join` | 팀장 | ❌ |
| 팀 가입 처리 | (API 없음) | 신청자 | ❌ |
| 경기 시작/종료 | 점수 입력 시 | 참가자 | ❌ |

#### ❌ 실시간 알림 없음

WebSocket, SSE(Server-Sent Events), 폴링 인프라 모두 없음.
→ 사용자가 `/notifications` 페이지에 직접 방문해야만 확인 가능.

#### ❌ 외부 알림 없음

이메일(SendGrid/Resend 등), 푸시(Firebase FCM), SMS 미구현.

### 1.4 알림 타입 정의 (제안)

```typescript
// src/lib/notifications/types.ts
export const NOTIFICATION_TYPES = {
  // 경기(Game)
  GAME_APPLICATION_RECEIVED:  "game.application.received",   // 주최자: 신청 접수
  GAME_APPLICATION_APPROVED:  "game.application.approved",   // 신청자: 승인됨
  GAME_APPLICATION_REJECTED:  "game.application.rejected",   // 신청자: 거부됨
  GAME_APPLICATION_CANCELLED: "game.application.cancelled",  // 주최자: 취소됨
  GAME_STARTING_SOON:         "game.starting.soon",           // 참가자: D-1일/D-3시간

  // 대회(Tournament)
  TOURNAMENT_TEAM_APPLIED:    "tournament.team.applied",      // 주최자: 팀 신청 옴
  TOURNAMENT_TEAM_APPROVED:   "tournament.team.approved",     // 팀장: 승인됨
  TOURNAMENT_TEAM_REJECTED:   "tournament.team.rejected",     // 팀장: 거부됨
  TOURNAMENT_MATCH_SCHEDULED: "tournament.match.scheduled",   // 팀원: 경기 일정 확정
  TOURNAMENT_MATCH_STARTED:   "tournament.match.started",     // 팀원: 경기 시작

  // 팀(Team)
  TEAM_JOIN_REQUEST:          "team.join.request",            // 팀장: 가입 신청 도착
  TEAM_JOIN_APPROVED:         "team.join.approved",           // 신청자: 가입 승인
  TEAM_JOIN_REJECTED:         "team.join.rejected",           // 신청자: 가입 거부
} as const;
```

### 1.5 구현 가이드

#### Phase 1 — 인앱 알림 생성 헬퍼 (즉시 구현 가능)

```typescript
// src/lib/notifications/create.ts
import { prisma } from "@/lib/db/prisma";

export async function createNotification(params: {
  userId: bigint;
  notificationType: string;
  title: string;
  content?: string;
  actionUrl?: string;
  notifiableType?: string;
  notifiableId?: bigint;
  metadata?: Record<string, unknown>;
}) {
  return prisma.notifications.create({
    data: {
      user_id: params.userId,
      notification_type: params.notificationType,
      title: params.title,
      content: params.content,
      action_url: params.actionUrl,
      notifiable_type: params.notifiableType,
      notifiable_id: params.notifiableId,
      metadata: params.metadata ?? {},
      status: "unread",
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
}
```

사용 예시 (`/api/web/games/[id]/apply/route.ts` 참가신청 완료 후):

```typescript
await createNotification({
  userId: game.organizer_id,
  notificationType: NOTIFICATION_TYPES.GAME_APPLICATION_RECEIVED,
  title: "새 참가 신청",
  content: `${applicantNickname}님이 "${game.title}" 경기에 참가 신청했습니다.`,
  actionUrl: `/games/${id}`,
  notifiableType: "GameApplication",
  notifiableId: application.id,
});
```

#### Phase 2 — 헤더 알림 뱃지

```typescript
// layout에서 (Server Component)
const unreadCount = await prisma.notifications.count({
  where: { user_id: userId, status: "unread" },
});
// 헤더 벨 아이콘 옆에 뱃지로 표시
```

#### Phase 3 — 실시간 알림

**Vercel 환경 권고**: WebSocket보다 **30~60초 클라이언트 폴링** 방식이 현실적.
Vercel 함수 타임아웃(25초) 때문에 SSE 영구 스트림도 불안정.

```typescript
// 클라이언트 폴링 방식
// src/hooks/use-notification-poll.ts
export function useNotificationPoll(intervalMs = 30000) {
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    const poll = async () => {
      const res = await fetch("/api/web/notifications/unread-count");
      const { count } = await res.json();
      setUnreadCount(count);
    };
    poll();
    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return unreadCount;
}
```

#### Phase 4 — 외부 알림 (향후)

Flutter 앱 → Firebase FCM, 웹 → Web Push API.
`users` 테이블에 `fcm_token`, `web_push_subscription` 컬럼 추가 필요.

---

## 2. 대회(Tournament) 관리 시스템

### 2.1 현재 DB 스키마 요약

#### 핵심 모델 관계

```
Tournament
  ├── TournamentAdminMember[]   (대회 운영진)
  ├── TournamentTeam[]          (참가 팀)
  │     ├── TournamentTeamPlayer[]   (선수 로스터 + 통계)
  │     ├── homeMatches / awayMatches TournamentMatch[]
  ├── TournamentMatch[]         (경기 일정/결과)
  │     ├── MatchPlayerStat[]   (선수별 경기 통계)
  │     └── play_by_plays[]     (플레이 기록)
  └── TournamentSite            (공개 사이트 서브도메인)
```

#### Tournament 주요 필드

| 필드 | 타입 | 값 |
|------|------|-----|
| `format` | String | `single_elimination` \| `double_elimination` \| `round_robin` \| `group_stage` \| `swiss` |
| `status` | String | `draft` → `registration` → `active` → `completed` \| `cancelled` |
| `divisions` | Json | 부문 배열 (예: `["오픈부", "마스터부"]`) |
| `auto_approve_teams` | Boolean | 팀 자동 승인 여부 |
| `entry_fee` | Decimal | 참가비 |
| `bank_name/account/holder` | String | 계좌이체 정보 |
| `primary_color/secondary_color` | String | 대회 브랜드 색상 |
| `prize_distribution` | Json | 시상 분배 정보 |

#### TournamentMatch 핵심 필드

| 필드 | 설명 |
|------|------|
| `bracket_position` | 대진표 내 위치 (1-indexed) |
| `bracket_level` | 라운드 깊이 (0=결승, 1=4강, 2=8강 ...) |
| `next_match_id` | 승자가 이동할 다음 경기 FK |
| `next_match_slot` | `"winner"` \| `"loser"` (더블 일리미네이션) |
| `quarterScores` | JSON `{home:{q1,q2,q3,q4,ot:[]}, away:{...}}` |
| `roundName` | 표시용 이름 ("4강", "결승" 등) |

### 2.2 현재 구현 현황

#### ✅ 구현 완료

| 기능 | 경로 |
|------|------|
| 대회 생성 5단계 위저드 | `POST /api/web/tournaments` |
| 대회 목록/상세 | `/tournaments`, `/tournaments/[id]` |
| 팀 승인/거부/시드 배정 | `/tournament-admin/[id]/teams` |
| 경기 수동 점수 입력 | `/tournament-admin/[id]/matches` |
| 순위표 (W-L 기반) | `/tournaments/[id]/standings` |
| Flutter 점수 배치 동기화 | `POST /api/v1/tournaments/[id]/matches/batch-sync` |

#### ❌ 미구현 (중요도 순)

| 기능 | 우선순위 |
|------|--------|
| 대진표 자동 생성 | 🔴 최우선 — `/bracket` 페이지가 placeholder |
| 팀 자기등록 흐름 | 🔴 높음 — 현재 관리자만 팀 등록 가능 |
| 참가비 결제 자동화 | 🟡 중간 — 계좌이체 정보 필드는 있음 |
| 대진표 시각화 | 🟡 중간 — 데이터 모델은 완비됨 |
| 경기 완료 시 전적 자동 갱신 | 🟡 중간 |
| 대회 공개 사이트 | 🟢 낮음 — TournamentSite 스키마 존재 |

### 2.3 대진표 자동 생성 알고리즘

#### 싱글 일리미네이션 (Single Elimination)

생활체육 농구 단기 대회(1일)에 가장 적합.

**핵심 원리**:
- 다음 2의 거듭제곱으로 올림 → Bye 수 계산
- 상위 시드에 Bye 배정 (1라운드 면제)
- 1시드와 2시드는 반대 구역 → 결승에서만 만남

```
Bye 공식:
  totalSlots = ceil(팀수 → 2의 거듭제곱)
  byeCount = totalSlots - 팀수

예: 10팀 → 16슬롯, 6개 Bye → 시드 1~6위가 1라운드 면제

시드 배치 패턴 (8팀):
  1 vs 8  /  4 vs 5
  2 vs 7  /  3 vs 6
  → 1시드와 2시드는 결승에서만 조우
```

**구현 코드**:

```typescript
// src/lib/tournaments/bracket-generator.ts

interface BracketTeam {
  id: bigint;
  seedNumber: number | null;
}

export function generateSingleEliminationBracket(
  teams: BracketTeam[],
  tournamentId: string
) {
  const n = teams.length;
  const totalSlots = Math.pow(2, Math.ceil(Math.log2(n)));
  const rounds = Math.ceil(Math.log2(totalSlots));
  const byeCount = totalSlots - n;

  // 시드 순서 정렬 (null은 마지막)
  const sorted = [...teams].sort((a, b) => {
    if (a.seedNumber === null) return 1;
    if (b.seedNumber === null) return -1;
    return a.seedNumber - b.seedNumber;
  });

  // 상위 byeCount 팀에 Bye 부여
  const byeTeamIds = new Set(sorted.slice(0, byeCount).map((t) => t.id));

  // 대진 쌍 생성: (1 vs totalSlots), (2 vs totalSlots-1), ...
  const pairs: [number, number][] = [];
  for (let i = 0; i < totalSlots / 2; i++) {
    pairs.push([i + 1, totalSlots - i]);
  }

  const matchesToCreate = [];

  // 1라운드
  for (let i = 0; i < pairs.length; i++) {
    const [seedA, seedB] = pairs[i];
    const teamA = sorted[seedA - 1] ?? null;
    const teamB = sorted[seedB - 1] ?? null;

    const isBye = teamA && byeTeamIds.has(teamA.id);
    matchesToCreate.push({
      homeTeamId: teamA?.id ?? null,
      awayTeamId: isBye ? null : (teamB?.id ?? null),
      status: isBye ? "bye" : "scheduled",
      bracketPosition: i + 1,
      bracketLevel: rounds - 1,
      roundName: `${totalSlots}강`,
      roundNumber: 1,
      matchNumber: i + 1,
      tournamentId,
    });
  }

  // 이후 라운드 (TBD 슬롯 생성)
  for (let round = 2; round <= rounds; round++) {
    const matchCount = totalSlots / Math.pow(2, round);
    for (let i = 0; i < matchCount; i++) {
      matchesToCreate.push({
        homeTeamId: null,
        awayTeamId: null,
        status: "scheduled",
        bracketPosition: i + 1,
        bracketLevel: rounds - round,
        roundName: getRoundName(round, rounds),
        roundNumber: round,
        matchNumber: i + 1,
        tournamentId,
      });
    }
  }

  // next_match_id 연결: 각 1라운드 경기의 승자 → 다음 라운드 경기
  // i번째 경기 → Math.floor(i/2) 번째 다음라운드 경기
  return matchesToCreate;
}

function getRoundName(round: number, totalRounds: number): string {
  const depth = totalRounds - round + 1;
  if (depth === 1) return "결승";
  if (depth === 2) return "4강";
  if (depth === 3) return "8강";
  if (depth === 4) return "16강";
  return `${Math.pow(2, depth)}강`;
}
```

#### 더블 일리미네이션 (Double Elimination)

2패 탈락. 공정성 높음. `next_match_slot` 필드가 이미 스키마에 있어 구현 준비됨.

```
Winners Bracket → 패배 시 Losers Bracket으로 이동 (next_match_slot: "loser")
Losers Bracket → 패배 시 탈락
Grand Final = WB 우승 vs LB 우승
Bracket Reset: WB 우승팀이 패배 시 재경기
```

**생활 농구 적합**: 중요 오픈 대회 (2일 이상).

#### 라운드 로빈 (Round Robin / 풀리그)

모든 팀이 서로 1번씩 대결. UBL 채택 방식의 예선 단계.

```
경기 수: N*(N-1)/2 (8팀 = 28경기, 6팀 = 15경기)

순위 결정:
  1차: 승점 (승3/무1/패0)
  2차: 득실차
  3차: 다득점
  4차: 직접 대결

대진 생성 알고리즘 (원형 회전법):
  짝수팀: 한 팀 고정, 나머지 시계방향 회전 (라운드마다)
  홀수팀: 가상팀 Bye 추가 후 짝수 처리
```

#### 스위스 방식 (Swiss System)

```
특성:
  - 동점자끼리 매칭, 리매치 없음
  - 권장 라운드 수: ceil(log2(팀수))
  - 8팀 → 3라운드, 16팀 → 4라운드

순위: 총 승점 → 버흘홀츠 점수(상대방 승점 합) → 직접 대결

생활 농구 적합: 정기 시즌 리그 (매주 1라운드씩)
```

#### UBL 방식 (그룹 스테이지 + 녹아웃)

```
Phase 1: 풀리그 (라운드 로빈)
  - 전반(1,2쿼터)
  - 후반(3,4쿼터)

Phase 2: 상위 4팀 싱글 일리미네이션 (3-4위전 포함)

시상: 1위 100만원, 2위 80만원, 3위 50만원(상금은 대회별로 상이할수 있으므로 대회관리자가 수정할수 있도록 함)
```

### 2.4 대회 관리자 워크플로우 (생활체육 농구 최적화)

```
1. 대회 생성 ✅ (위저드 5단계)
   └── 이름, 형식, 부문, 날짜, 장소, 참가비, 규정

2. 참가 모집 (status: registration)
   ├── 팀 신청 수신 ✅
   ├── 신청팀 승인/거부 ✅
   ├── 시드 번호 배정 ✅
   └── 참가비 확인 ❌ (현재 수동) > 토스 페이먼츠 입금확인 구현 가능확인(대회관리자용 관리자 페이지에서 확인여부)

3. 대진표 생성 (status: active)
   ├── 자동 대진표 생성 버튼 ❌
   ├── 시드 기반 배치 확인 ❌
   └── 경기 일정 자동 배분 ❌

4. 대회 진행
   ├── bdr_stat 앱에서 실시간 점수 입력 ✅ (Flutter)
   ├── batch-sync API ✅
   └── 경기 완료 → 자동 승자 다음 라운드 진출 ❌

5. 통계 집계
   ├── MatchPlayerStat 테이블 ✅ (스키마)
   ├── play_by_plays 테이블 ✅ (스키마)
   └── 개인 통계 자동 집계 ❌
```

#### 참가비 결제 흐름 (계좌이체 기반 권고)

```
1. 팀장이 참가신청 → TournamentTeam status: "pending", payment_status: "unpaid"
2. 관리자 페이지에서 계좌 정보 표시 (bank_name, bank_account, bank_holder 필드)
3. 팀장이 입금 완료 후 입금자명 기재
4. 관리자가 확인 → payment_status: "paid" 수동 변경
5. 자동으로 status: "approved" 전환 (또는 별도 승인)
6. 팀장에게 승인 알림 발송

향후: Toss Payments 가상계좌 발급 → 자동 입금 확인
```

### 2.5 bdr_stat 앱 연동 (점수 기록 UX)

#### 현재 Flutter API 엔드포인트

```
POST /api/v1/tournaments/verify           -- 대회 관리자 인증
GET  /api/v1/tournaments/[id]/full-data   -- 대회 전체 데이터 (앱 초기 로딩)
POST /api/v1/tournaments/[id]/matches/batch-sync  -- 경기 결과 일괄 동기화
```

#### 경기 기록 화면 권고 설계

```
bdr_stat 앱의 구현내용을 참고할것. 
로그 기능 "중요하게" 구현해야함.
```

**UX 원칙**:
1. **원터치 득점**: 팀 버튼 탭 → 2점/3점/자유투 즉시 기록
2. **UNDO 필수**: 오입력 즉시 취소 가능
3. **팀 단위 기록**: 선수 특정 없이 "+2" 만으로도 기록 가능 (빠른 진행)
4. **버튼 최소 48dp**: 심판이 한 손으로 조작 가능하게
5. **오프라인 지원**: 로컬 저장 후 동기화 (체육관 WiFi 및 셀룰러 데이터 연결 불안정 대비)
6. **경기 종료 → 자동 대진표 업데이트**: 결과 확인 → 다음 경기 매칭 공지

---

## 3. 팀(Team) 페이지 - NBA.com 참고

### 3.1 NBA.com 팀 페이지 실측 분석

#### 팀 목록 페이지 (`/teams`)

**실제 레이아웃**:
```
[H1] ALL TEAMS

[동호회 디비전 그리드. (D3~D6, 여성부, 대학부, 중장년부 등)]
D-League   |   Womam    |   Location
────────────────────────────────────────

...
```

**카드 디자인 특성**:
- 소형 원형 팀 로고 (40px) + 팀명 인라인
- 디비전명: 전부 대문자, 라벨 스타일
- 링크 4개(Profile/Stats/Schedule/Tickets)를 small colored 텍스트로 배열
- 배경: 흰색, 정보 밀도 낮음 — 스캔에 최적화

#### 팀 상세 페이지 (`/teams/[slug]`)

**헤더 영역 (팀 컬러 배경)**:
```
[풀 위드 배너 — 팀 고유 컬러 (#007A33 셀틱스 그린)]
  [팀 배경 패턴]   [대형 팀 로고]   BOSTON CELTICS
                                   40 - 20 | 2nd in Eastern
                                   [FOLLOW 버튼]
  ─────────────────────────────────────────────────
  통계 비교 바 (리그 순위 + 수치):
  PPG 19th 115.0 | RPG 6th 46.1 | APG 29th 24.4 | OPPG 1st 107.4
```

**탭 네비게이션**:
```
Profile | Schedule | Stats        [팀 공식사이트 | Store | Tickets | SNS]
```

**Profile 탭 섹션 순서**:

| 섹션 | 내용 |
|------|------|
| UPCOMING GAMES | 가로 스크롤 경기 카드 (중계방송 포함) |
| ROSTER | 선수 테이블 (번호/포지션/신장/체중/나이/경력/출신교) |
| ACHIEVEMENTS | 우승 연도 목록, 디비전 우승 |
| BACKGROUND | 창단연도/도시/홈 경기장/GM/감독 |

**디자인 토큰 (측정값)**:
```
헤더 배경: 팀 primaryColor (셀틱스 = #007A33)
텍스트 on 헤더: 흰색 (#FFFFFF)
통계 랭킹: 대문자 + 굵은 폰트
바디 배경: #FFFFFF
섹션 헤더: 진한 회색, 대문자 레이블 스타일
링크 색: #0060A9 (NBA 파랑)
섹션 간 여백: ~48px
```

**모바일 반응형**:
- 헤더 배너: 세로 스택으로 재배열
- 통계 바: 가로 스크롤 유지
- UPCOMING GAMES: 가로 스크롤 카드 패턴 (★ 좋은 모바일 UX)
- 로스터 테이블: 가로 스크롤

### 3.2 현재 팀 페이지 현황

#### 팀 목록 (`/teams`)

```
현재: 검색(이름) + 도시 필터, 테이블 레이아웃
  모바일: 팀명만 표시
  데스크탑: W-L-인원수 표시

NBA.com 참고 개선:
  → 카드 그리드 레이아웃 (팀 컬러 호버)
  → 전적 + 빠른 통계 카드에 표시
  → 도시 그루핑 (NBA 디비전처럼)
```

#### 팀 상세 (`/teams/[id]`)

```
현재 구현:
  ✅ 배너 영역 (팀 컬러 그라디언트)
  ✅ 팀 통계 카드 (승/패/무/승률/인원)
  ✅ 멤버 목록 (역할별 그루핑)
  ✅ 가입 버튼 (조건부 표시)

미구현:
  ❌ 탭 네비게이션 (개요/로스터/경기기록/대회이력/통계)
  ❌ 경기 기록 탭
  ❌ 대회 이력 탭
  ❌ 개인 통계 탭
  ❌ 팀 멤버 가입신청 처리 UI
```

### 3.3 팀 목록 — 카드 그리드 제안

```tsx
// 팀 카드 컴포넌트
function TeamCard({ team }: { team: TeamWithStats }) {
  const accent =
    team.primaryColor !== "#FFFFFF" ? team.primaryColor : team.secondaryColor;
  const total = team.wins + team.losses;
  const winRate = total > 0 ? Math.round((team.wins / total) * 100) : 0;

  return (
    <Link href={`/teams/${team.uuid}`}>
      <div className="group rounded-[16px] border border-[#E8ECF0] bg-white p-4 transition-all hover:shadow-md hover:border-transparent"
           style={{ "--accent": accent } as React.CSSProperties}>

        {/* 팀 로고 or 이니셜 */}
        <div className="mx-auto mb-3 h-16 w-16 rounded-full flex items-center
                        justify-center text-2xl font-bold text-white"
             style={{ backgroundColor: accent }}>
          {team.logoUrl
            ? <img src={team.logoUrl} alt={team.name} className="h-full w-full rounded-full object-cover" />
            : team.name[0]}
        </div>

        <h3 className="text-center text-sm font-semibold text-[#111827] truncate">
          {team.name}
        </h3>
        {team.city && (
          <p className="mt-0.5 text-center text-xs text-[#6B7280]">{team.city}</p>
        )}

        {/* 전적 */}
        <div className="mt-2 flex justify-center items-center gap-2 text-xs">
          <span className="font-bold text-[#0066FF]">{team.wins}승</span>
          <span className="text-[#9CA3AF]">·</span>
          <span className="text-[#6B7280]">{team.losses}패</span>
          {total > 0 && (
            <>
              <span className="text-[#9CA3AF]">·</span>
              <span style={{ color: accent }}>{winRate}%</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

// 목록 레이아웃
<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
  {teams.map((team) => <TeamCard key={team.id.toString()} team={team} />)}
</div>
```

### 3.4 팀 상세 — 탭 구조 제안

```tsx
// URL: /teams/[id]?tab=roster
const TEAM_TABS = [
  { key: "overview",     label: "개요"      },
  { key: "roster",       label: "로스터"    },
  { key: "games",        label: "경기 기록" },
  { key: "tournaments",  label: "대회 이력" },
  { key: "stats",        label: "통계"      },
] as const;
```

**개요 탭 레이아웃** (NBA.com 참고):
```
[팀 컬러 풀 배너]
  [로고]  팀명
         서울 강남 · 창단 2019년
         팀장: 홍길동 👑

[통계 4개 카드]
   23승   8패   74%승률   2대회

[통계 비교 바] (리그 평균 대비)
  득점   18.3점   리그평균 15.2점  ▲
  실점   14.1점   리그평균 15.8점  ▼

[최근 경기 — 가로 스크롤 카드]
  W 72-58 vs 버닝버즈  UBL 4강  2026.02.15
  L 61-70 vs 타이거즈  일반경기  2026.02.08
```

**로스터 탭** (NBA 스타일):
```
포지션별 그루핑: PG → SG → SF → PF → C → 감독/코치

테이블 컬럼:
  # | 선수명 | 포지션 | 역할 | 가입일 | 출전 | 평점

선수 행 클릭 → 선수 프로필 모달 또는 개인 페이지
```

### 3.5 팀 통계 카드 (NBA 통계 바 스타일)

```tsx
function StatsCompareBar({ label, value, leagueAvg, unit = "" }: {
  label: string; value: number; leagueAvg: number; unit?: string
}) {
  const isAbove = value >= leagueAvg;
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#E8ECF0] last:border-0">
      <span className="text-sm text-[#6B7280]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[#111827]">
          {value}{unit}
        </span>
        <span className="text-xs text-[#9CA3AF]">
          리그평균 {leagueAvg}{unit}
        </span>
        <span className={`text-xs font-bold ${isAbove ? "text-[#10B981]" : "text-[#EF4444]"}`}>
          {isAbove ? "▲" : "▼"}
        </span>
      </div>
    </div>
  );
}
```

---

## 4. 레퍼런스 사이트 분석

### 4.1 sfinder.co.kr (스파인더) — 실측 분석

**서비스 성격**: 국내 생활체육 대회 전문 통합 관리 플랫폼. 농구, 러닝, 수영, 풋살, 탁구, 배드민턴, 테니스 등 다종목.

#### 동호회 페이지 구조 (`/club/UBL`)

```
[헤더] 로고 | LOGIN | JOIN | 메뉴

[동호회 정보 카드]
  - UBL 농구공 로고 이미지
  - 이름: UBL_무제한부 농구리그(UBL)
  - 설명: "2024 시즌 소통 공간"
  - "동호회 가입하기" CTA 버튼

[통계 카드 3종]
  ① 총 대회 참여횟수: 1회
  ② 총 회원 수: 33명 (남 31, 여 2)
  ③ 나이대별 회원 수: 막대그래프 (10~60대)

[게시판]
  - 공지 게시판
  - 사진 게시판
```

#### 대회 상세 페이지 구조 (`/contest/contest_info/332`)

```
[대회명] 2024 무제한부 농구 리그 UBL
[대회 포스터 이미지]

[기본 정보]
  대회일시: 2024.09.05(목) ~ 2024.10.10(목)
  대회장소: 중경고등학교 농구장
  접수기간: 2024.07.28 ~ 2024.08.09 (선착순마감)
  환불기간: 2024.07.28 ~ 2024.08.09

[액션 버튼]
  [대회장소(카카오맵)] [참가접수] [대회문의] [스크랩]

[탭] 개최정보 / 대회후기

[아코디언 섹션들]
  ▼ 대회개요
  ▼ 참가그룹: 팀전 - 성인부, 남녀구분없음
  ▼ 참가자격: 농구를 좋아하는 누구나 (선수출신 제한 없음)
  ▼ 대회종목: 무제한부 (1~99위)
  ▼ 참가비용: 600,000원 (팀 단위)
  ▼ 종목 유의사항: 유니폼 번호 통일 필수, 명단 변경 불가
  ▼ 대회운영: 팀 대항 풀리그 → 상위 4팀 토너먼트, FIBA룰
  ▼ 시상내역: 1위 100만원, 2위 80만원, 3위 50만원
  ▼ 환불규정

[하단 고정 버튼]
  [참가접수] [대회문의]
```

#### sfinder 결제 플로우

```
참가접수 버튼 클릭
→ 팝업: 참가그룹 선택
→ 팀 정보 입력 (팀명, 대표자, 팀원 명단)
→ 결제 (카드/계좌이체/카카오페이)
→ 완료 → 마이페이지 > 참가대회에서 환불 신청 가능
```

#### mybdr vs sfinder 비교

| 항목 | sfinder | mybdr 목표 |
|------|---------|-----------|
| 농구 특화 통계 | ❌ 없음 | ✅ 쿼터 점수, 개인 통계 |
| 모바일 점수 입력 | ❌ | ✅ bdr_stat Flutter 앱 |
| 팀 프로필 (로스터/전적) | ❌ 단순 | ✅ NBA.com 스타일 |
| 실시간 알림 | ❌ | ✅ 인앱 알림 (예정) |
| Flutter API | ❌ | ✅ 100% 호환 |
| D-Day 카운트다운 | ✅ | ❌ 미구현 |
| 동호회 나이대 분포 | ✅ | ❌ 미구현 |
| 카카오맵 연동 | ✅ (대회 장소) | ✅ (경기 주소 입력) |

### 4.2 다음카페 [BDR]동아리농구방 — 분석

**규모**: 회원 74,435명 — 국내 최대 생활체육 농구 커뮤니티.

#### 실제 UI 구조

```
[헤더]
  다음카페 로고 + "[BDR]동아리농구방" 타이틀
  배너 슬라이드:
    ► BDR랭킹 사이트 (https://bdrranking-d.netlify.app/)
    ► 구글 캘린더 (경기 일정)
    ► STIZ (농구용품)  ► 몰텐코리아  ► 점프볼

[탭] 게시판 | 최신글 | 이미지

[상단 필독 공지] BDR대회 디비전 규정

[최신글 피드]
  제목 (볼드) | 게시판명 | 작성자 | 작성시간 | 조회수
  댓글수 뱃지
```

#### 게시판 카테고리

- **게스트 구인** (가장 활발) — 즉석 게스트 모집
- **구인/구팀** — 팀원, 팀 찾기
- **연습경기** — 팀간 스크리미지 주선
- **정회원 신청** — 카페 가입 심사
- **농구화/의류/용품거래** — 중고거래

#### 게시글 포맷 패턴

```
[지역] 날짜/요일 시간대 + 내용

예:
"[구로,금천,광명,부천] 매주 화요일 금요일 팀원 모집(즐농모임, 6시 오픈)"
"[관악구] 3월 7일 토요일 12:00~15:00 팀 농구사랑에서 초청합니다"
"마감 [강남] 2월 28일 금요일 오후 7시 게스트 2~3명 구합니다"
```

#### 커뮤니티 Pain Point → mybdr 해결책

| 커뮤니티 불편함 | mybdr 해결책 |
|---------------|-------------|
| 경기 모집 글 여러 카페에 분산 | `/games` 통합 목록 + 지역 필터 |
| 참가 여부 확인 어려움 (댓글) | 정식 참가신청 + 승인 알림 |
| 구글 캘린더 외부 의존 | 인앱 경기 일정 관리 |
| 외부 BDR랭킹 사이트 별도 운영 | 플랫폼 내 팀/개인 랭킹 시스템 |
| 대진표 사진 공유로 전달 | 대진표 URL 공유 (공개 사이트) |
| 점수 기록 종이 → 사진 | bdr_stat 앱 실시간 입력 |
| 팀원 관리 카카오톡 의존 | 팀 멤버 관리 + 가입신청 플로우 |
| 연간 전적 추적 불가 | 팀/개인 누적 통계 |

### 4.3 Challonge — 대진표 시스템 표준

**규모**: 15년 운영, 3,600만+ 대진표 생성, 120만+ 활성 커뮤니티.

#### 지원 포맷

| 포맷 | 생활 농구 적합성 |
|------|----------------|
| 싱글 일리미네이션 | ✅ 단기 주말 대회 (1일) |
| 더블 일리미네이션 | ✅ 공정한 오픈 대회 (2일↑) |
| 라운드 로빈 | ✅ 리그전, 소규모 예선 |
| 스위스 | ✅ 정기 시즌 리그 |
| 그룹 스테이지 + 녹아웃 | ✅ UBL 방식 (가장 복잡) |

#### 핵심 기능

- 자동 대진표 생성 + 시딩
- 참가 등록 페이지 (커스터마이즈 필드 추가)
- 실시간 결과 입력 → 자동 다음 라운드 생성
- **임베드 코드**: 외부 사이트에 대진표 삽입 가능
- REST API: 외부 앱 연동
- 대기자 목록 관리
- 조기등록/일반등록 차별 가격 설정

#### 가격 구조

| 플랜 | 가격 | 주요 기능 |
|------|------|---------|
| Free | $0 | 256명, Stripe 결제($0.75/주문 수수료) |
| Premier | $6.99/월 | 512명, 광고 없음, Stripe 수수료 면제 |

**mybdr 참고**: 결제는 Toss Payments 연동 (Stripe 대신).

---

## 5. 구현 우선순위 요약

### 즉시 구현 (~1주)

| # | 기능 | 예상 공수 | 비고 |
|---|------|---------|------|
| 1 | 알림 생성 헬퍼 + 경기신청 알림 | 0.5일 | `createNotification()` 함수 |
| 2 | 헤더 알림 뱃지 (읽지 않은 수) | 0.5일 | 서버 쿼리 + 뱃지 UI |
| 3 | 팀 목록 카드 그리드 레이아웃 | 1일 | 현재 테이블 → 카드 |
| 4 | 팀 상세 탭 네비게이션 | 1일 | searchParams 기반 |
| 5 | 팀 멤버 가입신청 처리 UI | 1일 | 팀장 승인/거부 페이지 |

### 핵심 기능 (2~4주)

| # | 기능 | 예상 공수 |
|---|------|---------|
| 1 | 대진표 자동 생성 (싱글 일리미네이션) | 3일 |
| 2 | 대진표 시각화 컴포넌트 | 3일 |
| 3 | 팀 자기등록 흐름 | 2일 |
| 4 | 경기 완료 시 팀 전적 자동 업데이트 | 1일 |
| 5 | 팀 경기기록/대회이력 탭 | 2일 |
| 6 | 대회 D-Day 카운트다운 표시 | 0.5일 |

### 향후 기능 (1개월+)

| # | 기능 | 비고 |
|---|------|------|
| 1 | 실시간 알림 (30초 폴링 방식) | Vercel 제약 고려 |
| 2 | 참가비 결제 자동화 | Toss Payments 가상계좌 |
| 3 | 더블 일리미네이션 대진표 | 스키마 이미 준비됨 |
| 4 | 라운드 로빈 대진표 | UBL 방식 지원 |
| 5 | 개인 통계 집계 서비스 | 배치 잡 필요 |
| 6 | 대회 공개 사이트 (서브도메인) | TournamentSite 스키마 있음 |
| 7 | 팀 나이대/지역 분포 통계 | sfinder 참고 |

---

*이 문서는 코드베이스 심층 분석(prisma/schema.prisma, 모든 API 라우트, 페이지 컴포넌트) +
외부 레퍼런스 직접 조사(sfinder.co.kr, m.cafe.daum.net/dongarry, NBA.com, Challonge) 결과를 종합했습니다.*
