# MyBDR 플랫폼 리서치 문서

> 작성일: 2026-03-02
> 범위: 알림 시스템 / 대회 관리 / 팀 페이지
> 코드베이스: Next.js 15 + Prisma 6 + PostgreSQL

---

## 목차

1. [알림(Notification) 시스템](#1-알림notification-시스템)
2. [대회(Tournament) 관리 시스템](#2-대회tournament-관리-시스템)
3. [팀(Team) 페이지](#3-팀team-페이지)
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
  - 전반(1,2쿼터): 지역수비 불가
  - 후반(3,4쿼터): 수비 제한 없음

Phase 2: 상위 4팀 싱글 일리미네이션 (3-4위전 포함)

시상: 1위 100만원, 2위 80만원, 3위 50만원
```

### 2.4 대회 관리자 워크플로우 (생활체육 농구 최적화)

```
1. 대회 생성 ✅ (위저드 5단계)
   └── 이름, 형식, 부문, 날짜, 장소, 참가비, 규정

2. 참가 모집 (status: registration)
   ├── 팀 신청 수신 ✅
   ├── 신청팀 승인/거부 ✅
   ├── 시드 번호 배정 ✅
   └── 참가비 확인 ❌ (현재 수동)

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
┌─────────────────────────────────┐
│  1쿼터  ·  10:00   [⏸] [⏭]    │
├────────────────┬────────────────┤
│   Team A       │    Team B      │
│      32        │      28        │
├────────────────┼────────────────┤
│ [+2]  [+3]  [1] │ [+2]  [+3]  [1] │
│ [파울] [UNDO]   │ [파울] [UNDO]   │
├─────────────────────────────────┤
│  09:45  Team A +3               │
│  09:20  Team B +2               │
└─────────────────────────────────┘

[다음 쿼터]          [경기 종료]
```

**UX 원칙**:
1. **원터치 득점**: 팀 버튼 탭 → 2점/3점/자유투 즉시 기록
2. **UNDO 필수**: 오입력 즉시 취소 가능
3. **팀 단위 기록**: 선수 특정 없이 "+2" 만으로도 기록 가능 (빠른 진행)
4. **버튼 최소 48dp**: 심판이 한 손으로 조작 가능하게
5. **오프라인 지원**: 로컬 저장 후 동기화 (체육관 WiFi 불안정 대비)
6. **경기 종료 → 자동 대진표 업데이트**: 결과 확인 → 다음 경기 매칭 공지

---

## 3. 팀(Team) 페이지

### 3.1 NBA.com에서 취사선택

NBA.com은 프로 리그 전용 기능이 많아 생활체육에는 과도하다. 취사선택 기준:

#### ✅ 생활체육에도 유효한 패턴

| NBA 패턴 | 이유 |
|----------|------|
| 팀 컬러 풀 배너 (헤더) | 팀 정체성 즉각 전달 — `primaryColor` 필드 이미 존재 |
| 탭 네비게이션 (개요/로스터/경기기록/대회이력) | 정보 계층 정리 — 페이지 복잡도 줄임 |
| 최근 경기 가로 스크롤 카드 | 모바일 UX 좋음 — 공간 효율적 |
| 팀 컬러 기반 카드 그리드 (목록) | 팀 식별력 ↑, 시각적으로 풍부 |

#### ❌ 생활체육에는 불필요한 NBA 기능

| NBA 기능 | 제외 이유 |
|----------|---------|
| 리그 순위 비교 통계 바 (PPG 19th 115.0 등) | 플랫폼 전체 집계 데이터 없음, 과도한 복잡도 |
| Coaching Staff 섹션 | 생활체육 팀에 정식 코치진 없는 경우가 대부분 |
| Retired Numbers / Hall of Fame | 프로 구단 전용, 생활체육 무관 |
| All Time Records / Achievements | 역사 기록 시스템 불필요 |
| FOLLOW 버튼 | SNS 팔로우 개념 불필요 |
| Store / Tickets / SNS 링크 | 수익화 링크 불필요 |
| 선수 신장/체중/나이/출신교/평점 | 생활체육 선수는 이 정보 입력 안 함 |
| 5컬럼 팀 그리드 | 팀 수 규모상 2~3컬럼으로 충분 |
| 디비전 그루핑 | 생활체육에 리그 디비전 구조 없음 |

### 3.2 현재 팀 페이지 현황

#### 팀 목록 (`/teams`)

```
현재: 검색(이름) + 도시 필터, 테이블 레이아웃
  모바일: 팀명만 표시
  데스크탑: W-L-인원수 표시

개선 방향:
  → 카드 그리드 레이아웃 (팀 컬러 적용)
  → 카드에 전적 + 인원수 표시
  → 지역 필터 유지 (디비전 그루핑 X)
```

#### 팀 상세 (`/teams/[id]`)

```
현재 구현:
  ✅ 배너 영역 (팀 컬러 그라디언트)
  ✅ 팀 통계 카드 (승/패/무/승률/인원)
  ✅ 멤버 목록 (역할별 그루핑)
  ✅ 가입 버튼 (조건부 표시)

미구현:
  ❌ 탭 네비게이션 (개요/로스터/경기기록/대회이력)
  ❌ 경기 기록 탭
  ❌ 대회 이력 탭
  ❌ 팀 멤버 가입신청 처리 UI
```

### 3.3 팀 목록 — 카드 그리드 제안

```tsx
function TeamCard({ team }: { team: TeamWithStats }) {
  const accent =
    team.primaryColor !== "#FFFFFF" ? team.primaryColor : team.secondaryColor;
  const total = team.wins + team.losses;
  const winRate = total > 0 ? Math.round((team.wins / total) * 100) : 0;

  return (
    <Link href={`/teams/${team.uuid}`}>
      <div
        className="rounded-[16px] border border-[#E8ECF0] bg-white p-4
                   transition-all hover:shadow-md hover:border-transparent"
      >
        {/* 팀 로고 or 이니셜 */}
        <div
          className="mx-auto mb-3 h-16 w-16 rounded-full flex items-center
                     justify-center text-2xl font-bold text-white"
          style={{ backgroundColor: accent }}
        >
          {team.logoUrl ? (
            <img src={team.logoUrl} alt={team.name} className="h-full w-full rounded-full object-cover" />
          ) : (
            team.name[0]
          )}
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

// 목록 레이아웃 — 2~4컬럼으로 충분
<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
  {teams.map((team) => <TeamCard key={team.id.toString()} team={team} />)}
</div>
```

### 3.4 팀 상세 — 탭 구조 제안

```tsx
// URL: /teams/[id]?tab=roster
// 4개 탭으로 충분 — "통계" 별도 탭 불필요 (개요에 통합)
const TEAM_TABS = [
  { key: "overview",    label: "개요"      },
  { key: "roster",      label: "로스터"    },
  { key: "games",       label: "경기 기록" },
  { key: "tournaments", label: "대회 이력" },
] as const;
```

**개요 탭 레이아웃**:
```
[팀 컬러 풀 배너]
  [로고]  팀명
         서울 강남 · 창단 2019년
         팀장: 홍길동

[기본 통계 카드 4개]
   23승   8패   74%승률   2대회

[최근 경기 — 가로 스크롤 카드]
  W 72-58 vs 버닝버즈  UBL 4강  2026.02.15
  L 61-70 vs 타이거즈  일반경기  2026.02.08
  ...
```

> 리그 평균 대비 통계 비교는 미구현. 전체 플랫폼 집계 데이터가 충분히 쌓인 후 도입 검토.

**로스터 탭** (생활체육 기준 간소화):
```
포지션별 그루핑: PG → SG → SF → PF → C (선택 입력)

테이블 컬럼 (필수만):
  # | 선수명 | 포지션 | 역할(주장/멤버) | 가입일

→ 신장/체중/나이/출신교/평점 등 입력 부담 주는 항목 제외
→ 선수 클릭 시 별도 페이지 없이 인라인 정보로 충분
```

**경기 기록 탭**:
```
날짜 | 경기 종류(대회/일반) | 상대팀 | 승패 | 점수
2026.02.15  UBL 4강     vs 버닝버즈   W   72-58
2026.02.08  일반경기     vs 타이거즈   L   61-70
```

**대회 이력 탭**:
```
대회명 | 연도 | 부문 | 최종 성적
UBL 2025   2025   오픈부   준우승
BDR컵 2024  2024  일반부   8강
```

### 3.5 팀 통계 카드 (개요 탭용)

```tsx
// 리그 평균 비교 없이 팀 자체 수치만 표시
function TeamStatsGrid({ team }: { team: Team }) {
  const total = team.wins + team.losses + team.draws;
  const winRate = total > 0 ? Math.round((team.wins / total) * 100) : 0;

  return (
    <div className="grid grid-cols-4 gap-3">
      {[
        { label: "승",   value: team.wins,              color: "#0066FF" },
        { label: "패",   value: team.losses,            color: "#EF4444" },
        { label: "승률", value: `${winRate}%`,          color: "#F4A261" },
        { label: "대회", value: team.tournaments_count, color: "#10B981" },
      ].map(({ label, value, color }) => (
        <div key={label} className="rounded-[12px] bg-[#F5F7FA] p-3 text-center">
          <div className="text-2xl font-bold" style={{ color }}>{value}</div>
          <div className="mt-1 text-xs text-[#6B7280]">{label}</div>
        </div>
      ))}
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
| 팀 프로필 (로스터/전적/경기기록) | ❌ 단순 | ✅ 탭 구조 + 카드 그리드 |
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

## 6. 프로필 수정 (Profile Edit)

> **목적**: 픽업/게스트 경기 참가 시 필요한 개인 정보 + 환불 계좌 정보를 수집·관리하는 프로필 수정 페이지 설계.

### 6.1 현재 상태 분석

**현재 프로필 수정 가능 필드** (`src/app/(web)/profile/page.tsx`):

| 필드 | 타입 | 현재 UI |
|------|------|---------|
| `nickname` | String? | ✅ 수정 가능 |
| `position` | String? | ✅ 수정 가능 (PG/SG/SF/PF/C) |
| `height` | Int? | ✅ 수정 가능 (cm) |
| `city` | String? | ✅ 수정 가능 |
| `bio` | String? | ✅ 수정 가능 |

**Prisma 스키마에 존재하지만 UI 미노출 필드**:

| 필드 | 타입 | DB 컬럼 | 비고 |
|------|------|---------|------|
| `name` | String? | `name` | 실명 (Rails 레거시) |
| `birth_date` | Date? | `birth_date` | 나이 계산 기준 |
| `weight` | Int? | `weight` | 체중 (선택) |
| `district` | String? | `district` | 세부 지역 |
| `phone` | String? | `phone` | §0.2 마이그레이션에서 추가됨 |
| `bank_name` | String? | `bank_name` | 환불 계좌 은행명 |
| `bank_code` | String? | `bank_code` | 은행 코드 |
| `account_number` | String? | `account_number` | 계좌번호 ⚠️ 암호화 필수 |
| `account_holder` | String? | `account_holder` | 예금주명 |

---

### 6.2 픽업/게스트 경기용 필수 프로필 필드

경기 참가 신청 시 호스트에게 전달되는 신청자 정보 요건:

| 필드 | 표시명 | 필수 | 수집 이유 |
|------|--------|------|---------|
| `name` | 이름 | ✅ | 실명 식별 (노쇼 대응) |
| `birth_date` | 생년월일 | ✅ | 나이대 확인 (경기별 연령 제한 대응) |
| `height` | 키 | ✅ | 포지션/팀 밸런싱 |
| `position` | 포지션 | ✅ | 픽업 팀 구성 |
| `phone` | 전화번호 | ✅ | 노쇼 방지 연락 |
| `city` | 활동 지역 | ✅ | 지역 기반 매칭 |
| `weight` | 몸무게 | ➖ | 선택 (일부 경기 참고용) |
| `profile_image` | 프로필 사진 | ➖ | 선택 (완성도 지표) |

**나이 표시 방식**: `birth_date`로 현재 나이 계산 → 프로필 카드에 "25세" 형태로 표시.
직접 나이 입력 대신 생년월일을 저장하는 이유: 해마다 자동으로 나이가 갱신되어 데이터 정확도 유지.

```typescript
// 나이 계산 유틸리티 (KST 기준)
export function calcAge(birthDate: Date): number {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const birth = new Date(birthDate.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}
```

---

### 6.3 계좌 정보 수집 — 법적 검토 결과

> **근거법**: 개인정보보호법(PIPA), 개인정보의 안전성 확보조치 기준(개인정보보호위원회 고시 제2023-6호)

#### 법적 분류

계좌번호는 **일반 개인정보**로 분류된다.

| 분류 | 해당 정보 | 계좌번호 해당 여부 |
|------|----------|-----------------|
| 고유식별정보 (제24조) | 주민번호·여권번호·운전면허·외국인등록번호 | ❌ |
| 민감정보 (제23조) | 사상/신념·건강·성생활·생체인식 등 | ❌ |
| 일반 개인정보 | 이름·주소·전화번호·이메일·**계좌번호** | ✅ |

단, **저장 시 암호화는 2023년 9월부터 명시적 법적 의무**:

> 개인정보의 안전성 확보조치 기준 제7조 제2항 (2023.9.22 시행): 계좌번호는 신용카드번호와 함께 **안전한 암호 알고리즘으로 암호화하여 저장** 의무 대상에 신규 추가됨.

#### 수집 요건 (개인정보보호법 제15조·제16조)

1. **별도 동의**: 회원가입 동의와 분리된 환불 계좌 동의 필요
2. **수집 항목 명시**: 은행명·계좌번호·예금주명 3항목
3. **목적 명시**: "환불금 송금 처리"
4. **보유 기간 명시**: "환불 완료 후 파기 / 거래 기록은 5년 보관"
5. **최소 수집 원칙**: 주민번호·계좌 비밀번호 수집 절대 금지

동의 문구 예시:
```
[환불 계좌 정보 수집·이용 동의]
수집 항목: 은행명, 계좌번호, 예금주명
수집 목적: 참가비·게스트비·픽업비 환불금 송금
보유 기간: 환불 완료 후 즉시 파기
            (거래 기록은 전자상거래법에 따라 5년 보관)
□ 동의합니다 (필수)
```

#### 1원 인증(실명확인) 여부

개인정보보호법은 계좌 수집 시 실명확인을 **의무화하지 않는다**. 소규모 플랫폼의 표준 관행:
- 당근마켓·번개장터·소규모 스포츠 플랫폼: 계좌번호+은행+예금주명만 수집 후 직접 이체
- 계좌 불일치 시 은행 단계에서 반환되는 구조로 실무 처리
- **1원 인증은 선택 사항** — 향후 대규모 정산 기능 도입 시 추가 검토

#### 수집 최소 정보 (3가지)

| 항목 | 필드명 | 용도 |
|------|--------|------|
| 은행명 | `bank_name` | 이체 대상 은행 식별 |
| 계좌번호 | `account_number` | 이체 대상 계좌 |
| 예금주명 | `account_holder` | 수취인 확인 |

> 주민번호·계좌 비밀번호는 수집 금지 (과잉 수집 = 법 위반)

---

### 6.4 계좌 정보 보안 설계

```
[현재 스키마 상태]
users 테이블:
  bank_name       String?   -- 평문 저장 (허용)
  bank_code       String?   -- 평문 저장 (허용)
  account_number  String?   -- ⚠️ 암호화 필수 (법적 의무)
  account_holder  String?   -- 평문 저장 (허용)
```

**암호화 설계**:
- 알고리즘: AES-256-GCM (복호화 필요하므로 해시 불가)
- 키 관리: 환경변수 `ACCOUNT_ENCRYPTION_KEY` (Vercel 시크릿)
- 저장: `account_number` 컬럼에 `encrypted:` prefix + base64 인코딩 값 저장
- 표시: 마스킹 처리 (예: `123-****-789012` 형태로만 노출)

```typescript
// src/lib/security/account-crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const KEY = Buffer.from(process.env.ACCOUNT_ENCRYPTION_KEY!, "hex"); // 32 bytes

export function encryptAccount(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${Buffer.concat([iv, tag, encrypted]).toString("base64")}`;
}

export function decryptAccount(stored: string): string {
  const buf = Buffer.from(stored.replace("enc:", ""), "base64");
  const iv = buf.slice(0, 12);
  const tag = buf.slice(12, 28);
  const encrypted = buf.slice(28);
  const decipher = createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

export function maskAccount(plain: string): string {
  if (plain.length <= 4) return "****";
  return plain.slice(0, 3) + "-****-" + plain.slice(-4);
}
```

---

### 6.5 국내 은행 목록 (드롭다운 옵션)

```typescript
// src/lib/constants/banks.ts
export const BANKS = [
  // 시중은행
  { code: "004", name: "KB국민은행" },
  { code: "088", name: "신한은행" },
  { code: "020", name: "우리은행" },
  { code: "081", name: "KEB하나은행" },
  // 특수은행
  { code: "011", name: "NH농협은행" },
  { code: "003", name: "IBK기업은행" },
  { code: "071", name: "우체국" },
  // 인터넷전문은행
  { code: "090", name: "카카오뱅크" },
  { code: "089", name: "케이뱅크" },
  { code: "092", name: "토스뱅크" },
  // 지방은행
  { code: "032", name: "부산은행" },
  { code: "034", name: "광주은행" },
  { code: "037", name: "전북은행" },
  { code: "039", name: "경남은행" },
  { code: "035", name: "제주은행" },
  // 외국계
  { code: "023", name: "SC제일은행" },
  { code: "027", name: "한국씨티은행" },
  { code: "002", name: "KDB산업은행" },
] as const;
```

---

### 6.6 프로필 수정 페이지 설계

**파일 경로**:
```
src/app/(web)/profile/
├── page.tsx           ← 기존: 프로필 조회 (탭)
└── edit/
    └── page.tsx       ← 신규: 프로필 수정 (전용 페이지)

src/app/api/web/profile/
└── route.ts           ← 기존 PATCH 엔드포인트 확장
```

**수정 페이지 섹션 구성** (`/profile/edit`):

```
┌─────────────────────────────────┐
│  프로필 수정                     │
├─────────────────────────────────┤
│ 기본 정보                        │
│  이름 (실명)      [__________]   │
│  닉네임           [__________]   │
│  생년월일         [____년__월__일]│
│  전화번호         [__________]   │
│  활동 지역        [시/도 드롭다운]│
│  세부 지역        [구/군 드롭다운]│
├─────────────────────────────────┤
│ 경기 정보                        │
│  포지션    [PG][SG][SF][PF][C]   │
│  키 (cm)          [___]          │
│  몸무게 (kg)      [___] (선택)   │
│  자기소개         [textarea]     │
├─────────────────────────────────┤
│ 환불 계좌 정보                   │
│  [개인정보 수집·이용 동의 □]     │
│  은행 선택  [드롭다운]           │
│  계좌번호   [__________]         │
│  예금주명   [__________]         │
│  ℹ️ 참가비·게스트비 환불 시 사용  │
├─────────────────────────────────┤
│  [저장]          [취소]          │
└─────────────────────────────────┘
```

**API 확장** (`PATCH /api/web/profile`):
```typescript
// 기존 필드 외 추가 수정 대상
const profileSchema = z.object({
  nickname:       z.string().min(1).max(20).optional(),
  name:           z.string().min(1).max(30).optional(),
  birth_date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  phone:          z.string().regex(/^010-?\d{4}-?\d{4}$/).optional(),
  position:       z.enum(["PG","SG","SF","PF","C"]).optional(),
  height:         z.number().int().min(100).max(250).optional(),
  weight:         z.number().int().min(30).max(200).optional(),
  city:           z.string().max(20).optional(),
  district:       z.string().max(20).optional(),
  bio:            z.string().max(255).optional(),
  // 계좌 정보 (동의 시만 수집)
  bank_name:      z.string().optional(),
  bank_code:      z.string().optional(),
  account_number: z.string().optional(),  // → 저장 전 encryptAccount() 처리
  account_holder: z.string().max(20).optional(),
  account_consent: z.boolean().optional(), // 동의 여부 (서버에서 검증)
});
```

**트레이드오프**:
- ✅ 생년월일로 나이 자동 계산 → 매년 갱신 불필요
- ✅ 계좌 암호화 유틸리티 분리 → `src/lib/security/account-crypto.ts`
- ⚠️ `ACCOUNT_ENCRYPTION_KEY` 환경변수 Vercel 시크릿 등록 필수
- ⚠️ 기존 `account_number` 컬럼에 이미 평문 데이터가 있다면 마이그레이션 스크립트 필요
- ⚠️ 계좌 수집 동의 체크박스 미체크 시 API에서 계좌 필드 업데이트 거부

---

## 7. 홈 즐겨찾기 퀵 메뉴

> **목적**: 사용자가 홈 상단에 자주 쓰는 메뉴 4개를 직접 설정해 빠르게 접근 (토스뱅크 "자주 쓰는 메뉴" 패턴)

### 7.1 UX 레퍼런스 — 토스뱅크 자주 쓰는 메뉴

토스 앱 홈 상단 4개 퀵 액션 버튼 커스터마이징 구조:

```
[홈 화면 기본 상태]
 ┌──────────────────────────────┐
 │ 자주 쓰는 메뉴          [편집] │
 │ [🏀경기찾기][👥내팀][🏆대회][⚡픽업] │
 └──────────────────────────────┘

[편집 버튼 클릭 → 편집 모드]
 ┌──────────────────────────────┐
 │ 선택됨 (4/4)          [완료]  │
 │ [🏀경기찾기✕][👥내팀✕][🏆대회✕][⚡픽업✕] │
 ├──────────────────────────────┤
 │ 전체 메뉴                    │
 │ [📅내일정] [📊내기록] [💬커뮤니티] │
 │ [🥇랭킹]   [📍코트찾기] [🔔알림] │
 └──────────────────────────────┘
```

**핵심 UX 원칙**:
- 최대 4개 고정 (오버플로우 불가)
- 탭 선택으로 추가/제거 (드래그 불필요 — 4개 항목에서 DnD는 과잉 설계)
- 완료 버튼으로 즉시 저장 (낙관적 업데이트)
- 미로그인 시: 기본 4개 고정 표시 (편집 불가)

---

### 7.2 저장 방식 결정 — DB vs localStorage

| 항목 | localStorage | DB 저장 |
|------|-------------|---------|
| 기기 간 동기화 | ❌ | ✅ |
| Flutter 앱 연동 | ❌ | ✅ |
| 구현 복잡도 | 낮음 | 중간 |
| 오프라인 지원 | ✅ | ❌ |
| 서버 비용 | 없음 | 미미함 (4개 문자열) |

**권고: DB 저장 + localStorage 캐시 (낙관적 업데이트)**

로그인 필수 플랫폼이고 Flutter 앱(bdr_stat)과 동기화가 필요하므로 DB 저장이 적합하다.

---

### 7.3 DB 스키마 설계

기존 `users` 테이블에 컬럼 추가로 처리 (별도 테이블 불필요 — 데이터 크기 극소):

```sql
-- migration: add_quick_menu_to_users
ALTER TABLE users ADD COLUMN quick_menu_items TEXT[] DEFAULT ARRAY['find_game','my_team','tournaments','pickup'];
```

```prisma
// prisma/schema.prisma - users 모델에 추가
quickMenuItems  String[]  @default(["find_game","my_team","tournaments","pickup"]) @map("quick_menu_items")
```

별도 테이블 대신 users 컬럼을 선택하는 이유:
- 사용자당 1개만 존재 (1:1 관계)
- 4개 문자열 ID = 수십 바이트 수준
- JOIN 불필요 → 프로필 로드 시 함께 조회

---

### 7.4 전체 메뉴 후보 풀

| 메뉴 ID | 표시명 | 아이콘 | 링크 | 기본 포함 |
|---------|--------|--------|------|---------|
| `find_game` | 경기 찾기 | 🏀 | `/games` | ✅ |
| `my_team` | 내 팀 | 👥 | `/teams` | ✅ |
| `tournaments` | 대회 보기 | 🏆 | `/tournaments` | ✅ |
| `pickup` | 픽업 신청 | ⚡ | `/games?type=pickup` | ✅ |
| `my_schedule` | 내 일정 | 📅 | `/schedule` | - |
| `stats` | 내 기록 | 📊 | `/profile?tab=stats` | - |
| `community` | 커뮤니티 | 💬 | `/community` | - |
| `ranking` | 랭킹 | 🥇 | `/ranking` | - |
| `venue` | 코트 찾기 | 📍 | `/courts` | - |
| `notifications` | 알림 | 🔔 | `/notifications` | - |

---

### 7.5 구현 설계

**파일 경로**:
```
src/components/home/
└── quick-menu.tsx          ← 신규: 퀵 메뉴 컴포넌트 (Client Component)

src/app/(web)/
└── page.tsx                ← 기존 수정: QuickMenu 컴포넌트 삽입

src/app/api/web/user/
└── quick-menu/
    └── route.ts            ← 신규: GET + PUT 엔드포인트
```

**컴포넌트 API 연동**:
```typescript
// GET /api/web/user/quick-menu → { menu_items: string[] }
// PUT /api/web/user/quick-menu → body: { menu_items: string[] }

// 낙관적 업데이트 패턴
const handleSave = async (newItems: string[]) => {
  setItems(newItems);                                    // 즉시 UI 반영
  localStorage.setItem("quickMenu", JSON.stringify(newItems)); // 캐시
  await fetch("/api/web/user/quick-menu", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ menu_items: newItems }),
    credentials: "include",
  });
};
```

**홈 페이지 삽입 위치**:
```
[홈 페이지 레이아웃]
 ┌──────────────────┐
 │ 헤더 (sticky)     │
 ├──────────────────┤
 │ 퀵 메뉴 (4버튼)   │ ← QuickMenu 컴포넌트 삽입
 ├──────────────────┤
 │ 최근 경기         │
 ├──────────────────┤
 │ 진행 중 대회      │
 └──────────────────┘
```

**트레이드오프**:
- ✅ users 컬럼 추가 방식 → JOIN 없이 조회 가능, 마이그레이션 최소화
- ✅ 낙관적 업데이트 → 네트워크 지연 없이 즉시 반응
- ✅ 기본값 DB 설정 → 첫 로그인 시 별도 초기화 API 불필요
- ⚠️ `quick_menu_items` 컬럼 = DB 마이그레이션 필요
- ⚠️ 미로그인 사용자: localStorage 캐시만 사용, 서버 저장 없음
- ⚠️ 편집 모드는 Client Component 필요 (useState + 이벤트 처리)

---

---

## 8. bdr_stat ↔ mybdr 대회 연동 (Flutter 스탯 기록 시스템)

> **작성일**: 2026-03-05
> **범위**: Flutter bdr_stat 앱 → mybdr 대회 시스템 실시간 스탯 연동 설계
> **상태**: 리서치 완료, plan.md 작성 대기

### 8.1 프로젝트 목표

대회 진행 중 경기별 스탯을 Flutter 앱으로 실시간 기록하고, 대회 공개 사이트(rookie.mybdr.kr)에서 라이브 스코어보드로 표시한다.

```
[Flutter 기록원 앱] ──쓰기──▶ [Next.js /api/v1] ──▶ [Supabase DB]
                                                          │
[대회 사이트 웹] ◀──Realtime 구독──────────────────────────┘
[Flutter 앱]    ◀──Supabase SDK 직독──────────────────────┘
```

---

### 8.2 확정된 의사결정 (Q&A 결과)

| 항목 | 결정 | 근거 |
|------|------|------|
| 앱 사용자 역할 | 스탯 기록원 1명 | 시간관리자는 별도 기기로 독립 운영, 앱과 무관 |
| 기록원 자격 | mybdr 가입 회원 필수 | 기존 JWT 인증 재사용, 별도 임시계정 불필요 |
| 기록원 지정 단위 | 대회 단위 | 경기별 재지정 불필요, 대회 전체 기록 담당 |
| 지정 방식 | 회원 ID/이메일 검색 | 대회 주최자가 mybdr 관리 화면에서 직접 지정 |
| 스탯 저장 방식 | 이벤트 스트림 | match_events 테이블에 모든 액션 로그 저장 |
| MatchPlayerStat | 미사용 | events에서 실시간 집계, 별도 집계값 테이블 불필요 |
| 쓰기 경로 | Flutter → `/api/v1` | 인증/검증 서버에서 처리 |
| 읽기/실시간 | Supabase SDK 직접 구독 | 빠른 UI 반응, Realtime 채널 활용 |
| 공개 범위 | 완전 공개 | 대회 사이트(rookie.mybdr.kr) 누구나 조회 |
| 오프라인 대응 | 온라인 기본 + 로컬 큐 | 연결 끊김 시 로컬 큐 유지 → 복구 시 자동 flush |
| Undo | 마지막 이벤트 취소 | undone 플래그 방식, 이벤트 삭제 아님 |

---

### 8.3 시스템 전체 흐름

```
1. [대회 주최자 - mybdr 웹 관리 페이지]
   → 기록원 지정: 회원 검색 → tournament_recorders 테이블 저장

2. [기록원 - Flutter bdr_stat 앱]
   a. 로그인 → POST /api/v1/auth/login (기존 JWT)
   b. 담당 경기 목록 조회 → GET /api/v1/recorder/matches
   c. 경기 시작 버튼 → PATCH /api/v1/matches/{id}/status { status: "in_progress" }
   d. 스탯 이벤트 입력 → POST /api/v1/matches/{id}/events
   e. Undo → PATCH /api/v1/matches/{id}/events/{eventId}/undo
   f. 경기 종료 버튼 → PATCH /api/v1/matches/{id}/status { status: "completed" }
   g. (오프라인 시) 이벤트 로컬 큐 적재 → 연결 복구 시 자동 flush

3. [Supabase Realtime]
   → match_events INSERT/UPDATE 감지 → 웹/앱 구독자에게 broadcast

4. [대회 사이트 - rookie.mybdr.kr]
   → Supabase SDK로 match_events 구독 → 라이브 스코어보드 실시간 갱신
```

---

### 8.4 신규 DB 테이블 설계

#### `tournament_recorders` — 기록원 지정

```prisma
model tournament_recorders {
  id            BigInt     @id @default(autoincrement())
  tournamentId  String     @map("tournament_id")      // Tournament FK
  recorderId    BigInt     @map("recorder_id")        // User FK (mybdr 회원)
  assignedBy    BigInt     @map("assigned_by")        // 지정한 주최자 userId
  isActive      Boolean    @default(true) @map("is_active")
  createdAt     DateTime   @default(now()) @map("created_at")

  tournament    Tournament @relation(fields: [tournamentId], references: [id])
  recorder      users      @relation("recorder", fields: [recorderId], references: [id])

  @@unique([tournamentId, recorderId])
  @@index([tournamentId])
  @@map("tournament_recorders")
}
```

#### `match_events` — 이벤트 스트림 (핵심)

```prisma
model match_events {
  id           BigInt    @id @default(autoincrement())
  matchId      BigInt    @map("match_id")          // TournamentMatch FK
  tournamentId String    @map("tournament_id")     // 집계 쿼리 최적화용 역정규화
  teamId       BigInt?   @map("team_id")           // 어느 팀의 이벤트인지
  playerId     BigInt?   @map("player_id")         // 선수 특정 시 (선택)

  // 이벤트 종류
  // score_2, score_3, free_throw, rebound_off, rebound_def,
  // assist, steal, block, turnover, foul_personal, foul_technical,
  // timeout, quarter_start, quarter_end, game_start, game_end
  eventType    String    @map("event_type")

  value        Int?      // 득점 이벤트 시 점수값 (2, 3, 1)
  quarter      Int?      // 몇 쿼터 이벤트인지 (1~4, 5=OT)
  gameTime     String?   @map("game_time")         // "09:45" 형태 (표시용)

  undone       Boolean   @default(false)           // Undo 처리됨
  undoneAt     DateTime? @map("undone_at")
  undoneBy     BigInt?   @map("undone_by")         // Undo 실행한 recorder

  recordedBy   BigInt    @map("recorded_by")       // 기록원 userId
  createdAt    DateTime  @default(now()) @map("created_at")

  match        TournamentMatch @relation(fields: [matchId], references: [id])

  @@index([matchId, undone])           // 경기별 유효 이벤트 조회
  @@index([matchId, createdAt])        // 타임라인 순서 조회
  @@index([tournamentId, teamId])      // 팀 누적 통계 집계
  @@map("match_events")
}
```

---

### 8.5 실시간 집계 로직 (이벤트 → 스코어)

MatchPlayerStat 집계값 테이블 없이 match_events에서 직접 계산:

```typescript
// 경기 현재 스코어 계산
const score = await prisma.match_events.aggregate({
  where: {
    matchId: matchBigInt,
    teamId: teamBigInt,
    eventType: { in: ["score_2", "score_3", "free_throw"] },
    undone: false,
  },
  _sum: { value: true },
});
// score._sum.value → 현재 팀 득점

// 또는 Supabase SDK에서 클라이언트 실시간 집계
const events = supabase
  .channel(`match:${matchId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'match_events',
    filter: `match_id=eq.${matchId}`,
  }, (payload) => {
    // 이벤트 수신 시 로컬 상태 갱신
    updateScore(payload.new);
  })
  .subscribe();
```

---

### 8.6 신규 API 엔드포인트 (`/api/v1/`)

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | `/recorder/matches` | JWT + recorder role | 담당 대회의 경기 목록 |
| PATCH | `/matches/{matchId}/status` | JWT + recorder | 경기 시작/종료 상태 변경 |
| POST | `/matches/{matchId}/events` | JWT + recorder | 스탯 이벤트 입력 |
| PATCH | `/matches/{matchId}/events/{eventId}/undo` | JWT + recorder | 마지막 이벤트 취소 |
| GET | `/matches/{matchId}/events` | public | 이벤트 목록 + 집계 (스코어보드용) |

---

### 8.7 JWT 역할 확장

현재 JWT `role` 값: `player` | `team_admin` | `admin` | `super_admin`

추가 필요:
```typescript
// 토너먼트 스코프 recorder 역할
// 방식: JWT 페이로드에 recorder_tournament_ids 배열 추가
{
  sub: "123",
  role: "player",
  recorder_tournament_ids: ["abc123", "def456"]  // 기록원으로 지정된 대회 ID 목록
}
```

**검증 미들웨어**:
```typescript
// src/lib/auth/require-recorder.ts
export async function requireRecorder(req: NextRequest, tournamentId: string) {
  const session = await verifyToken(token);
  if (!session) return { error: 401 };

  // JWT 페이로드 또는 DB에서 기록원 권한 확인
  const isRecorder = await prisma.tournament_recorders.findFirst({
    where: { tournamentId, recorderId: BigInt(session.sub), isActive: true },
  });
  if (!isRecorder) return { error: 403 };
  return { session };
}
```

---

### 8.8 mybdr 웹 관리 화면 변경

**위치**: `/tournament-admin/tournaments/[id]` → "기록원 관리" 탭 추가

```
┌─────────────────────────────────┐
│ 기록원 관리                      │
├─────────────────────────────────┤
│ [회원 검색: 이메일 또는 ID]  [추가] │
├─────────────────────────────────┤
│ 현재 기록원                      │
│  홍길동 (hong@example.com)  [삭제] │
│  김철수 (kim@example.com)   [삭제] │
└─────────────────────────────────┘
```

**API**:
- `POST /api/web/tournaments/[id]/recorders` — 기록원 추가
- `DELETE /api/web/tournaments/[id]/recorders/[userId]` — 기록원 제거

---

### 8.9 오프라인 대응 (Flutter 앱)

```
[온라인 상태]
  이벤트 입력 → POST /api/v1/matches/{id}/events → 즉시 저장

[오프라인 감지]
  이벤트 입력 → 로컬 SQLite/Hive 큐에 적재
  상태 표시: "오프라인 저장됨 (3개 대기 중)"

[온라인 복구]
  큐 flush → POST /api/v1/matches/{id}/events/batch
  순서 보장: created_at 기준 오름차순 전송
  중복 방지: 이벤트에 클라이언트 UUID 포함 → 서버에서 idempotency 처리
```

---

### 8.10 Flutter 앱 화면 설계 (UX 가이드)

```
┌─────────────────────────────────┐
│  4강 · BDR컵 2026               │
│  Team A  vs  Team B             │
├──────────┬──────────────────────┤
│    32    │          28          │
│  Team A  │        Team B        │
├──────────┼──────────────────────┤
│ [+2] [+3] [FT] [RB] [파울]     │
│ [+2] [+3] [FT] [RB] [파울]     │
├─────────────────────────────────┤
│  09:45  Team A +3               │
│  09:20  Team B +2 (Undo)       │
│                                  │
│              [UNDO]             │
└─────────────────────────────────┘
│  [경기 시작]        [경기 종료]  │
└─────────────────────────────────┘
```

**UX 원칙**:
1. 팀 단위 기록 기본 (선수 특정 불필요 — 빠른 진행)
2. UNDO = 마지막 이벤트 1개만 취소 (단순)
3. 오프라인 상태 배너 표시 (상단 노란색)
4. 경기 시작/종료 버튼은 실수 방지를 위해 확인 다이얼로그 표시
5. 버튼 최소 48dp (한 손 조작)

---

### 8.11 현재 코드베이스와의 연결점

| 현재 파일 | 연결 방식 |
|----------|---------|
| `prisma/schema.prisma` | `match_events`, `tournament_recorders` 테이블 추가 |
| `src/app/api/v1/` | recorder 전용 엔드포인트 신규 추가 |
| `src/app/(web)/tournament-admin/` | 기록원 관리 탭 UI 추가 |
| `src/lib/auth/` | `requireRecorder()` 미들웨어 추가 |
| `TournamentMatch` | `match_events` relation 추가 |
| `src/app/_site/` | Supabase Realtime 구독 → 라이브 스코어보드 |

---

### 8.12 구현 우선순위

| 단계 | 작업 | 공수 |
|------|------|------|
| Phase 1 | DB 마이그레이션 (match_events, tournament_recorders) | 0.5일 |
| Phase 1 | JWT recorder role 확장 + requireRecorder 미들웨어 | 0.5일 |
| Phase 1 | POST /api/v1/matches/{id}/events 이벤트 입력 API | 1일 |
| Phase 1 | PATCH undo API + GET events API | 0.5일 |
| Phase 1 | GET /api/v1/recorder/matches | 0.5일 |
| Phase 2 | 대회 관리 화면 기록원 지정 UI | 1일 |
| Phase 2 | Supabase Realtime 구독 → 라이브 스코어보드 | 1.5일 |
| Phase 3 | 오프라인 큐 + batch sync API | 1.5일 |
| Phase 3 | PATCH status (경기 시작/종료) | 0.5일 |

---

*이 문서는 코드베이스 심층 분석(prisma/schema.prisma, 모든 API 라우트, 페이지 컴포넌트) +
외부 레퍼런스 직접 조사(sfinder.co.kr, m.cafe.daum.net/dongarry, NBA.com, Challonge) 결과를 종합했습니다.*
