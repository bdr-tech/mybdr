# MyBDR 구현 계획서 (상세)

> 작성일: 2026-03-02
> 근거: Dev/research.md + 코드베이스 분석
> 상태: **⛔ 아직 구현하지마** — 판단 주석 작성 후 명시적 승인 필요

---

## 판단 주입 가이드

각 태스크에 아래 형식으로 주석을 달아주세요:
- `<!-- [승인] -->` — 그대로 진행
- `<!-- [수정: ...] -->` — 내용 수정 후 진행
- `<!-- [보류] -->` — 이번 사이클 스킵

---

## 목차

1. [구독/역할 체계](#0-구독역할-체계-횡단-관심사)
2. [경기 (Games)](#1-경기-games)
3. [팀 (Teams)](#2-팀-teams)
4. [대회 관리 (Tournaments)](#3-대회-관리-tournaments)
5. [커뮤니티 (Community)](#4-커뮤니티-community)
6. [Admin](#5-admin)
7. [알림 시스템](#6-알림-시스템)
8. [구현 순서 권고](#7-구현-순서-권고)
9. [bdr_stat 스탯 기록 연동](#8-bdr_stat-스탯-기록-연동)

---

## 0. 구독/역할 체계 (횡단 관심사) ✅ 완료

> **모든 기능의 권한 체계가 여기에 의존함. 가장 먼저 설계 확정 필요.**
> **DB 작업 시 Supabase MCP 이용 필수.**

### 0.1 현재 vs 목표 역할 체계

**현재 스키마** (`prisma/schema.prisma` · `users` 모델):
```prisma
membershipType Int @default(0)   // 0=free, 1=basic, 2=premium
isAdmin        Boolean @default(false)
subscription_status  String @default("inactive")
subscription_started_at DateTime?
subscription_expires_at DateTime?
```

**목표 역할 체계** (낮은 → 높은 순):

| 역할 | membershipType | 월 구독료 | 현재 상태 | 주요 권한 |
|------|---------------|---------|---------|---------|
| 일반유저 | 0 | 무료 | 무료 | 게임 참가, 팀 가입, 커뮤니티 |
| 픽업 호스트 | 1 | ₩50,000/월 | - | 픽업게임 개설 |
| 팀장 | 2 | ₩3,900/월 | 무료(프로모션) | 팀 생성/관리 + 픽업게임 개설 |
| 대회관리자 | 3 | ₩199,000/월 | 무료(프로모션) | 대회 생성/관리 + 팀장 권한 전체 |
| 슈퍼관리자 | - | - | isAdmin=true | 전지전능, 최대 4명 |

> **권한 포함 관계**: 상위 티어는 하위 티어 권한 모두 포함.
> 팀장(2) = 픽업호스트(1) 권한 포함. 대회관리자(3) = 팀장(2) 권한 전체 포함.
> 픽업 호스트 ₩50,000/월은 BDR카페 기존 운영 금액 기준.

### 0.2 DB 마이그레이션 계획

> **Supabase MCP 사용 필수**

**변경 사항**: `membershipType` 값 재매핑 + 슈퍼관리자 초기 설정

```sql
-- migration: rename_membership_types
-- 기존 data 보정: 1(basic)→2(팀장), 2(premium)→3(대회관리자)
UPDATE users SET membership_type = 3 WHERE membership_type = 2;
UPDATE users SET membership_type = 2 WHERE membership_type = 1;

-- 슈퍼관리자 초기 지정 (추가는 admin 페이지에서 관리, 최대 4명)
UPDATE users SET is_admin = true WHERE email = 'bdr.wonyoung@gmail.com';

-- users 테이블에 전화번호 컬럼 추가 (§1.5 참고)
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- 프로필 완성 안내 1일 1회 DB 판단 (§1.3 참고)
ALTER TABLE users ADD COLUMN profile_reminder_shown_at TIMESTAMP;
```

**Prisma 스키마 변경** (`prisma/schema.prisma`):
```prisma
model User {
  // 기존 유지 + 주석 업데이트
  membershipType Int @default(0) @map("membership_type")
  // 0=일반유저(free)
  // 1=픽업호스트(pickup_host, ₩50,000/월)
  // 2=팀장(team_leader, ₩3,900/월, 현재 프로모션 무료)
  // 3=대회관리자(tournament_admin, ₩199,000/월, 현재 프로모션 무료)
  // isAdmin=true → 슈퍼관리자 (최대 4명, admin 페이지에서 관리)

  phone                   String?   @db.VarChar(20)            // 신규: 전화번호 (신청자 노쇼 대응)
  profileReminderShownAt  DateTime? @map("profile_reminder_shown_at")  // 신규: 1일 1회 안내 기록
}
```

**파일 경로**: `src/lib/auth/roles.ts` (신규 — 권한 상수 중앙화)

```typescript
// src/lib/auth/roles.ts
export const MEMBERSHIP = {
  FREE: 0,
  PICKUP_HOST: 1,
  TEAM_LEADER: 2,
  TOURNAMENT_ADMIN: 3,
} as const;

export const MEMBERSHIP_LABELS: Record<number, string> = {
  0: "일반유저",
  1: "픽업호스트",
  2: "팀장",
  3: "대회관리자",
};

export const MEMBERSHIP_PRICES: Record<number, string> = {
  0: "무료",
  1: "₩50,000/월",
  2: "₩3,900/월",
  3: "₩199,000/월",
};

export type MembershipType = typeof MEMBERSHIP[keyof typeof MEMBERSHIP];

export const MAX_SUPER_ADMINS = 4;

export function canHostPickup(mt: number): boolean { return mt >= MEMBERSHIP.PICKUP_HOST; }
export function canCreateTeam(mt: number): boolean { return mt >= MEMBERSHIP.TEAM_LEADER; }
export function canManageTournament(mt: number): boolean { return mt >= MEMBERSHIP.TOURNAMENT_ADMIN; }
```

**트레이드오프**:
- ✅ 기존 스키마 컬럼 재활용, DB 마이그레이션 최소화
- ⚠️ membershipType 숫자 값 재매핑 → `grep -r "membershipType" src/` 로 영향 범위 전수 확인 필수
- ✅ 픽업 호스트 가격 ₩50,000 확정 → 결제 시스템 연동 전까지 수동 승인

---

## 1. 경기 (Games) ✅ 완료

> **전체 원칙**: 신규/수정 구현 시 현재 개발된 코드를 분석한 후 **기존 코드 영향도를 최소화**하여 진행.
> 기존 `page.tsx` 직접 수정보다 신규 컴포넌트 추가 → 점진적 교체 방식 우선.

> ⚠️ **용어 통일**: "용병" → **"게스트"** (문서 전체 + 코드 전체 적용. "용병" 단어 사용 금지)

### 1.1 경기 목록 — 동적 필터 페이지

**현재**: `src/app/(web)/games/page.tsx` — 타입/도시/날짜 필터 + 테이블/카드 렌더링
**목표**: 게임 타입별로 레이아웃이 다르게 변동되는 동적 페이지

**접근 방식**:

게임 타입(픽업/게스트/팀대결)에 따라 카드 컴포넌트 자체를 교체하는 방식.
`searchParams.type` 변경 시 서버에서 다른 쿼리 + 다른 컴포넌트 렌더링.
**기존 `page.tsx` 로직은 최대한 유지**, 카드 컴포넌트만 신규 추가.

```
/games                   → 전체 목록 (탭: 전체 / 픽업 / 게스트 모집 / 팀대결)
/games?type=pickup       → 픽업 게임만 (픽업 카드 레이아웃)
/games?type=guest        → 게스트 모집만 (게스트 카드 레이아웃)
/games?type=team_match   → 팀 대결만 (팀 대결 카드 레이아웃)
```

**파일 경로**:
```
src/app/(web)/games/
├── page.tsx                    ← 기존 수정 (최소): gameType 분기만 추가
├── _components/                ← 신규 디렉토리 (기존 파일 건드리지 않음)
│   ├── pickup-game-card.tsx    ← 신규
│   ├── guest-game-card.tsx     ← 신규 (기존 "용병" → "게스트")
│   └── team-match-card.tsx     ← 신규
└── games-filter.tsx            ← 기존 수정 (최소): 탭 UI 추가
```

**코드 스니펫** (`page.tsx` 핵심 분기 — 기존 쿼리 로직 그대로 유지):
```typescript
// 기존 fetchGames() 함수 유지, 타입 분기만 추가
{games.map((game) => {
  if (game.game_type === 0) return <PickupGameCard key={String(game.id)} game={game} />;
  if (game.game_type === 1) return <GuestGameCard key={String(game.id)} game={game} />;
  if (game.game_type === 2) return <TeamMatchCard key={String(game.id)} game={game} />;
})}
```

**트레이드오프**:
- ✅ Server Component → SEO, 초기 렌더 빠름
- ✅ 기존 코드 영향 최소 — 카드 컴포넌트만 신규 추가
- ⚠️ 탭 클릭 시 페이지 전체 재요청 → `<Suspense>` + `loading.tsx` 로 UX 보완 필요

---

### 1.2 경기 상세 — 동적 서브 페이지

<!-- [승인] -->

**현재**: `src/app/(web)/games/[id]/page.tsx` — 단일 레이아웃
**목표**: 게임 타입 + 상태에 따라 다른 UI 섹션 동적 표시

**접근 방식**:

게임 상태(status)와 타입(game_type)을 조합해 섹션을 조건부 렌더링.

| game_type | 표시 섹션 |
|-----------|----------|
| 0 픽업 | 일시/장소/모집인원/참가비/담당자 연락처/신청하기 |
| 1 게스트 | 팀 정보/포지션/스킬레벨/신청하기 |
| 2 팀대결 | 홈팀/어웨이팀/일시/장소/점수(완료시) |

| status | UI 변화 |
|--------|---------|
| 0 임시 | 주최자에게만 보임, "모집 시작" 버튼 |
| 1 모집중 | "신청하기" 버튼 활성화 |
| 2 확정 | "신청 마감" 표시, 참가자 명단 |
| 3 완료 | 결과/점수 표시, 신청 불가 |
| 4 취소 | "취소된 경기" 배너 |

**파일 경로**:
```
src/app/(web)/games/[id]/
├── page.tsx              ← 기존 수정: 타입/상태별 분기 + 프로필 안내 배너
├── apply-button.tsx      ← 기존 수정: 프로필 완성도 체크 추가
├── _sections/            ← 신규
│   ├── pickup-detail.tsx
│   ├── guest-detail.tsx  (기존 "mercenary" → "guest")
│   └── team-match-detail.tsx
└── _modals/              ← 신규
    └── profile-incomplete-modal.tsx
```

**트레이드오프**:
- ✅ 각 게임 타입의 UI가 독립적 → 유지보수 쉬움
- ✅ 기존 `page.tsx` 변경 최소화

---

### 1.3 참가신청 플로우 — 프로필 완성도 체크

**현재**: `apply-button.tsx` → `POST /api/web/games/[id]/apply` (단순 신청)
**목표**: 프로필 미완성 시 **페이지 로드 시점**에 1일 1회 안내 + 신청 시 미완성이면 모달 표시

**접근 방식**:

```
[경기 상세 페이지 로드 시 — 서버사이드 판단]
  ↓
user.profile_completed === false?
  ├── YES → profile_reminder_shown_at == TODAY? (DB 판단)
  │     ├── 오늘 이미 표시됨 → 안내 없음
  │     └── 오늘 미표시 → 페이지 상단 안내 배너 렌더링
  │           "프로필을 완성하면 경기 신청이 더 편리해요. [지금 완성하기]"
  │           → 클라이언트에서 PATCH /api/web/me/profile-reminder 호출 (DB 업데이트)
  └── NO → 안내 없음

[신청 버튼 클릭 시 — 별개 체크]
  ↓
profile_completed === false → 신청 불가 모달 표시 (프로필 완성 요구)
profile_completed === true  → 바로 신청 처리
```

**DB 판단 로직** (`page.tsx` — 서버사이드):
```typescript
// src/app/(web)/games/[id]/page.tsx
const today = new Date();
today.setHours(0, 0, 0, 0);  // KST 기준 오늘 0시

const showProfileBanner =
  !user.profile_completed &&
  (!user.profile_reminder_shown_at || user.profile_reminder_shown_at < today);
```

**안내 기록 API** (신규):
```typescript
// src/app/api/web/me/profile-reminder/route.ts
// PATCH → profile_reminder_shown_at = NOW()
// 클라이언트 배너 렌더 직후 호출 (fire-and-forget)
await prisma.users.update({
  where: { id: BigInt(session.userId) },
  data: { profileReminderShownAt: new Date() },
});
```

**신청 시 모달** (`apply-button.tsx`):
```typescript
const handleApply = () => {
  if (!user.profile_completed) {
    setShowModal(true);   // "프로필을 완성해야 신청할 수 있습니다"
    return;
  }
  applyToGame(game.id);
};
```

**프로필 완성 기준** (`src/lib/profile/completion.ts` 신규):

| 필드 | 필수 | 이유 |
|------|------|------|
| `name` | ✅ | 식별 |
| `nickname` | ✅ | 표시명 |
| `phone` | ✅ | **노쇼 방지 연락 수단** (신규 추가) |
| `position` | ✅ | 게임 포지션 |
| `city` | ✅ | 지역 기반 매칭 |
| `district` | ✅ | 지역 기반 매칭 |
| `profile_image` | - | 선택 (완성도 % 계산에만 포함) |

> 전화번호(`phone`)는 노쇼 방지 목적으로 **필수 수집**.
> `users` 테이블에 `phone VARCHAR(20)` 컬럼 추가 필요 (§0.2 마이그레이션 포함).

**트레이드오프**:
- ✅ 신청 버튼 클릭 전에 안내 → UX 자연스러움
- ✅ DB `profile_reminder_shown_at` → 서버 렌더에서 판단 가능
- ⚠️ `profile_completed` 필드 동기화: 프로필 저장 API에서 `checkProfileCompletion()` 결과로 `profile_completed` 동시 업데이트 필수
- ⚠️ 프로필 완성 필수 필드 목록 → 위 표 기준으로 확정 후 `checkProfileCompletion()` 구현

---

### 1.4 경기 만들기 — 타입별 폼

**현재**: `src/app/(web)/games/new/page.tsx` — 단일 폼 (타입 선택)
**목표**: 게임 타입 선택 → 타입별 전용 폼 렌더링.
**픽업 게임은 유료 계정만 생성 가능** (접근은 누구나, 생성 폼 진입 시 권한 체크).

**접근 방식**:
```
/games/new 페이지: 누구나 접근 가능 (로그인만)
  Step 1: 게임 유형 선택
    ├── 픽업 🏀
    │   └── membership_type < 1이면 → 업그레이드 모달 표시 (페이지 이동 X)
    │   └── membership_type >= 1이면 → 픽업 폼으로 진입
    ├── 게스트 모집 🤝 → 누구나 생성 가능
    └── 팀 대결 ⚔️
        └── membership_type < 2이면 → 업그레이드 모달 표시
```

**파일 경로**:
```
src/app/(web)/games/new/
├── page.tsx              ← 기존 수정 (최소): 타입 선택 + 클라이언트 권한 체크
├── _forms/               ← 신규
│   ├── pickup-form.tsx
│   ├── guest-form.tsx    (기존 "mercenary-form" → "guest-form")
│   └── team-match-form.tsx
```

**픽업 게임 폼 필드** (`pickup-form.tsx`):

| 필드 | 타입 | 필수 | DB 컬럼 | 비고 |
|------|------|------|---------|------|
| 픽업 게임명 | text | ✅ | `title` | - |
| 일시 (시작) | datetime | ✅ | `start_time` | KST |
| 일시 (종료) | datetime | ✅ | `end_time` | KST |
| 장소 | address (카카오) | ✅ | `location` / `latitude` / `longitude` | 기존 카카오 주소 컴포넌트 재사용 |
| 모집 인원 | number | ✅ | `max_players` | 최소 2명 |
| 참가 비용 설명 | text | ✅ | `entry_fee_note` | "음료 지참" or "5,000원" — **신규 컬럼** |
| 참가 비용 (숫자) | number | - | `entry_fee` | 0이면 무료/음료 |
| 담당자 연락처 | tel | ✅ | `contact_phone` | **신규 컬럼** |
| 스킬 레벨 | select | - | `skill_level` | 기존 값 재사용 |
| 공개 여부 | checkbox | - | `is_public` | 기본 공개 |

**신규 컬럼 추가 원칙**:
> `contact_phone`, `entry_fee_note` 외 추가 컬럼 필요 여부는 **3회 검토 후 결정**.
> 기존 컬럼 재사용 방법 먼저 탐색. 불가능한 경우에만 신규 추가.

**DB 변경** (`games` 테이블):
```sql
-- migration: add_pickup_fields_to_games
ALTER TABLE games ADD COLUMN contact_phone VARCHAR(20);
ALTER TABLE games ADD COLUMN entry_fee_note VARCHAR(100);
```

```prisma
// prisma/schema.prisma - games 모델에 추가
contact_phone  String? @db.VarChar(20)  @map("contact_phone")
entryFeeNote   String? @db.VarChar(100) @map("entry_fee_note")
```

**권한 체크** (클라이언트사이드 모달 방식):
```typescript
// page.tsx → 권한 정보를 서버에서 내려줌
const permissions = {
  canCreatePickup:    canHostPickup(user.membershipType),
  canCreateTeamMatch: canCreateTeam(user.membershipType),
};

// 클라이언트: 픽업 선택 시 권한 없으면 업그레이드 모달
const handleTypeSelect = (type: GameType) => {
  if (type === "pickup" && !permissions.canCreatePickup) {
    setShowUpgradeModal("pickup_hosting");
    return;
  }
  setSelectedType(type);
};
```

**트레이드오프**:
- ✅ 타입별 폼 분리 → 각 유형의 필드 독립적 관리
- ✅ 페이지 접근은 누구나 → 유입 차단 없음
- ⚠️ 카카오 주소 검색 컴포넌트 현재 위치 확인 후 재사용 (`src/components/` 검색)
- ⚠️ API (`POST /api/web/games`) 서버사이드에서도 권한 체크 필수 (클라이언트 우회 방지)

---

### 1.5 참가신청 시 전달되는 프로필 정보

픽업 게임 신청 시 호스트에게 전달되는 신청자 프로필:

| 정보 | DB 필드 | 필수 | 전달 방식 |
|------|---------|------|----------|
| 이름 | `users.name` | ✅ | 알림 metadata |
| 닉네임 | `users.nickname` | ✅ | 알림 metadata |
| **전화번호** | **`users.phone`** | ✅ | 알림 metadata (노쇼 대응) |
| 포지션 | `users.position` | ✅ | 알림 metadata |
| 지역 | `users.city` + `district` | ✅ | 알림 metadata |
| 프로필 사진 | `users.profile_image` | - | 알림 metadata |

> `users.phone` 컬럼 신규 추가 필요 (§0.2 마이그레이션 포함).
> 노쇼 방지 및 긴급 연락을 위해 **전화번호 필수 수집**.

**알림 메타데이터** (`/api/web/games/[id]/apply/route.ts`):
```typescript
await createNotification({
  userId: game.organizer_id,
  notificationType: NOTIFICATION_TYPES.GAME_APPLICATION_RECEIVED,
  title: `새 참가 신청`,
  content: `${applicant.nickname}님이 "${game.title}"에 참가 신청했습니다.`,
  actionUrl: `/games/${game.uuid}/applicants`,
  metadata: {
    applicant: {
      id: applicant.id.toString(),
      name: applicant.name,
      nickname: applicant.nickname,
      phone: applicant.phone,        // 신규
      position: applicant.position,
      city: applicant.city,
      district: applicant.district,
      profile_image: applicant.profile_image,
    },
  },
});
```

---

## 2. 팀 (Teams) ✅ 완료

### 2.1 팀 목록 — 카드 그리드

<!-- [승인] -->

**현재**: 테이블 레이아웃
**목표**: 팀 컬러 기반 카드 그리드 (`research.md § 3.3` 그대로)

**파일 경로**:
```
src/app/(web)/teams/
├── page.tsx                ← 수정: 쿼리 + 카드 그리드
└── _components/
    └── team-card.tsx       ← 신규
```

**코드 스니펫**: `research.md § 3.3` 참조 (TeamCard + `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`)

**트레이드오프**:
- ✅ 팀 컬러 적용 → 시각적 차별화
- ⚠️ `primaryColor = "#FFFFFF"` 팀 대비책 필요 (secondaryColor fallback → 그것도 흰색이면 기본 `#0066FF`)

---

### 2.2 팀 상세 — 탭 구조

**현재**: 단일 페이지 (배너 + 통계 + 멤버)
**목표**: 4탭 (개요 / 로스터 / 경기기록 / 대회이력) — **스키마 매핑 철저히 확인 후 구현**

**파일 경로**:
```
src/app/(web)/teams/[id]/
├── page.tsx                    ← 수정: searchParams.tab 분기
├── _tabs/
│   ├── overview-tab.tsx        ← 신규
│   ├── roster-tab.tsx          ← 신규
│   ├── games-tab.tsx           ← 신규
│   └── tournaments-tab.tsx     ← 신규
└── join-button.tsx             ← 기존 유지
```

**탭별 데이터 소스 매핑** (스키마 기반):

#### 개요 탭 (`overview-tab.tsx`)
```
teams 테이블:
  - name, city, primary_color, secondary_color, logo_url
  - wins, losses, draws
  - created_at (창단년도)

team_members WHERE role='leader' → users.nickname (팀장명)

최근 경기 (가로 스크롤):
  - games WHERE organizer_id IN (team 멤버 user_ids) [일반경기]
  - tournament_matches WHERE home_team_id = team.id OR away_team_id = team.id [대회경기]
  → 합쳐서 최신순 5개
```

#### 로스터 탭 (`roster-tab.tsx`)
```
team_members JOIN users WHERE team_members.team_id = team.id
  정렬: role='leader' 먼저, 나머지 joined_at(created_at) ASC

표시 컬럼:
  - users.profile_image (아바타)
  - users.nickname (이름)
  - users.position (포지션) → 없으면 "-"
  - team_members.role → "팀장" / "멤버"
  - team_members.created_at (가입일)

포지션 그루핑: PG → SG → SF → PF → C → 미설정
```

#### 경기기록 탭 (`games-tab.tsx`)
```
[일반 경기]
games WHERE organizer_id IN (팀 멤버 user_ids)
  표시: date, title, result(W/L), score

[대회 경기]
tournament_matches WHERE home_team_id = team.id OR away_team_id = team.id
JOIN tournament_matches.home_score, away_score
  표시: date, tournament.title, round_name, result(W/L), score

→ 두 종류 합쳐 날짜순 정렬
```

#### 대회이력 탭 (`tournaments-tab.tsx`)
```
tournament_teams WHERE team_id = team.id
JOIN tournaments (name, start_date, divisions)
JOIN (해당 대회 team의 최종 match → 결과로 성적 도출)

표시: 대회명 | 연도 | 부문 | 최종 성적
```

> ⚠️ 경기기록/대회이력 탭의 쿼리가 복잡함 → 각 탭을 `<Suspense>` 로 감싸 탭별 독립 로딩
> ⚠️ "최종 성적" 산출 로직 = 해당 팀의 마지막 `tournament_matches` 결과 → 추가 스키마 확인 필요

---

### 2.3 팀 만들기 — 유료 계정 전용

**현재**: 누구나 팀 생성 가능
**목표**: `membership_type >= 2` (팀장 이상)만 팀 생성 가능
**무료 프로모션 기간 = admin 페이지에서 개별 유저 `membershipType` 수동 관리**

**접근 방식**:
```typescript
// src/app/(web)/teams/new/page.tsx (서버사이드)
const user = await prisma.users.findUnique({
  where: { id: BigInt(session.userId) },
  select: { membershipType: true },
});
if (!canCreateTeam(user?.membershipType ?? 0)) {
  redirect("/upgrade?reason=team_creation");
}
```

**`/upgrade` 페이지** (신규):
```
src/app/(web)/upgrade/page.tsx
- searchParams.reason: "team_creation" | "pickup_hosting" | "tournament_management"
- 각 reason에 맞는 플랜 설명 + 구독 CTA
- 현재는 "관리자에게 문의" 버튼 (결제 시스템 미구현)
```

**admin 연동** (무료 프로모션 관리):
- `admin/users/page.tsx` → 개별 유저 `membershipType` 드롭다운 변경 가능
- 프로모션 대상 유저 = admin에서 `membershipType`을 2(팀장) 또는 3(대회관리자)으로 수동 설정
- 프로모션 종료 시 = admin에서 `membershipType` 다시 0으로 일괄 리셋 (별도 버튼)

**트레이드오프**:
- ✅ 서버사이드 redirect → 클라이언트 우회 불가
- ✅ admin에서 수동 관리 → 결제 시스템 없이도 프로모션 운영 가능
- ⚠️ API (`POST /api/web/teams`) 서버사이드에서도 권한 체크 필수

---

### 2.4 팀 가입신청 처리 UI (팀장)

<!-- [승인] -->

**현재**: 팀장이 가입신청을 처리할 UI 없음
**목표**: 팀장 전용 멤버 관리 페이지

**파일 경로**:
```
src/app/(web)/teams/[id]/manage/
└── page.tsx        ← 신규: 가입신청 목록 + 승인/거부

src/app/api/web/teams/[id]/members/
└── route.ts        ← 신규: GET(신청목록) + PATCH(승인/거부)
```

**API 설계**:
```typescript
// PATCH /api/web/teams/[id]/members
// body: { memberId: string, action: "approve" | "reject" }
// 권한: team_members WHERE role='leader' AND user_id = session.userId AND team_id = params.id
// IDOR 체크 필수
```

**트레이드오프**:
- ✅ 별도 manage 페이지 → 팀 상세와 역할 분리 명확
- ⚠️ IDOR 방지: `team.leader_id === session.userId` 검증 필수

---

## 3. 대회 관리 (Tournaments) ✅ 완료

### 3.1 대진표 자동 생성 (싱글 일리미네이션)

**현재**: `/bracket` 페이지 placeholder
**목표**: **편집 가능한 초안 브라켓** 생성 — 생성 후 관리자가 팀 위치 수동 수정 가능
**이유**: 각 팀의 사정(이동 거리, 시간 제약 등)을 반영하기 위해 수정 필수

**버전 관리 정책**:
- 대진표 생성 = 새 버전으로 저장 (덮어쓰기 X)
- **최대 3회** 생성 가능
- 3회 초과 시 → 슈퍼관리자에게 승인 요청 알림 발송, 승인 후 추가 생성 가능

**파일 경로**:
```
src/lib/tournaments/
├── bracket-generator.ts     ← 신규 (research.md § 2.3 알고리즘)
└── bracket-version.ts       ← 신규 (버전 관리 로직)

src/app/api/web/tournaments/[id]/bracket/
└── route.ts                 ← 신규 (POST: 생성, GET: 현재 버전 조회)

src/app/(web)/tournament-admin/tournaments/[id]/bracket/
└── page.tsx                 ← 신규: 생성 버튼 + 팀 위치 수정 UI + 버전 히스토리
```

**버전 관리 DB** — `tournament_bracket_versions` 테이블 신규:
```sql
-- migration: create_tournament_bracket_versions
CREATE TABLE tournament_bracket_versions (
  id               BIGSERIAL PRIMARY KEY,
  tournament_id    BIGINT NOT NULL REFERENCES tournaments(id),
  version_number   INT NOT NULL,              -- 1, 2, 3
  created_at       TIMESTAMP NOT NULL,
  created_by       BIGINT REFERENCES users(id),
  approved_by      BIGINT REFERENCES users(id),  -- 슈퍼관리자 승인 (4회+)
  is_active        BOOLEAN DEFAULT false       -- 현재 적용 버전
);
```

**버전 체크 로직** (`bracket-version.ts`):
```typescript
export async function canCreateNewBracket(tournamentId: bigint): Promise<{
  canCreate: boolean;
  needsApproval: boolean;
  currentVersion: number;
}> {
  const count = await prisma.tournament_bracket_versions.count({
    where: { tournament_id: tournamentId },
  });
  return {
    canCreate: true,              // 항상 생성 시도 가능 (UI에서 버튼 표시)
    needsApproval: count >= 3,    // 3회 이상이면 슈퍼관리자 승인 필요
    currentVersion: count,
  };
}
```

**수정 가능한 초안 UI** (관리자 bracket 페이지):
- 생성된 1라운드 경기의 홈팀/어웨이팀 드롭다운으로 팀 위치 변경
- "확정" 버튼 클릭 시 해당 버전을 `is_active = true` 로 설정
- 수정 가능한 경기 = `status: "scheduled"` 인 경기만

**핵심 로직**: `research.md § 2.3` 참조 + `linkNextMatches()` 함수

**트레이드오프**:
- ✅ 스키마에 `next_match_id`, `bracket_level`, `bracket_position` 이미 존재 → 최소 DB 변경
- ⚠️ `tournament_bracket_versions` 신규 테이블 = DB 마이그레이션 필요
- ⚠️ 슈퍼관리자 승인 요청 = 알림 시스템(§6) 연동 필요

---

### 3.2 대진표 시각화

<!-- [보류] -->

> **보류 이유**: 풀리그 / 토너먼트 / 듀얼토너먼트 등 다양한 방식이 있어 시각화 형태 확정 필요.
> 브라켓 생성(§3.1) 이후 방식 확정 후 재논의.

---

### 3.3 팀 자기등록 흐름

<!-- [보류] -->

**현재**: 관리자만 팀 등록 가능
**목표**: 팀장이 직접 대회에 참가신청 가능

**파일 경로**:
```
src/app/(web)/tournaments/[id]/page.tsx          ← 수정: "팀 참가신청" 버튼 추가
src/app/api/web/tournaments/[id]/teams/route.ts  ← 수정: 팀장 POST 허용
```

**권한 확장**:
```typescript
// 기존: organizerId === session.userId
// 변경: 대회 주최자 OR 팀의 leader
const isTeamLeader = await prisma.team_members.findFirst({
  where: { user_id: BigInt(session.userId), role: "leader", team_id: BigInt(teamId) },
});
if (!isTournamentOrganizer && !isTeamLeader) return apiError("FORBIDDEN", 403);
```

**트레이드오프**:
- ⚠️ `auto_approve_teams` 플래그 반드시 체크 — false면 pending, true면 즉시 approved

---

### 3.4 경기 완료 → 전적 자동 갱신

<!-- [승인] — DB 스키마 판단 최우선으로 진행 -->

**파일 경로**:
```
src/app/api/v1/tournaments/[id]/matches/batch-sync/route.ts  ← 수정
src/lib/tournaments/update-standings.ts                      ← 신규
```

**승자 진출 로직** (`update-standings.ts`):
```typescript
export async function advanceWinner(matchId: bigint) {
  const match = await prisma.tournament_matches.findUnique({
    where: { id: matchId },
  });
  // ⚠️ winner_id 컬럼 존재 여부 사전 확인 필수
  if (!match?.next_match_id || !match.winner_id) return;

  const nextMatch = await prisma.tournament_matches.findUnique({
    where: { id: match.next_match_id },
  });
  const slot = nextMatch?.home_team_id ? "away_team_id" : "home_team_id";
  await prisma.tournament_matches.update({
    where: { id: match.next_match_id },
    data: { [slot]: match.winner_id },
  });
}
```

> **구현 전 확인**: `tournament_matches.winner_id` 컬럼 존재 여부 Supabase MCP로 스키마 조회 필수.

**트레이드오프**:
- ⚠️ 더블 일리미네이션은 `next_match_slot: "loser"` 분기 추가 필요 → Phase 3

---

### 3.5 대회 D-Day 카운트다운 + 알림

**기능**:
1. 대회 목록/상세 페이지에 D-Day 표시
2. 참가 팀장에게 D-3일 / D-1일 사이트 내 알림 발송

**D-Day 계산** (서버사이드, KST 기준):
```typescript
function getDDay(startDate: Date): string {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const start = new Date(startDate.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const diff = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "진행중";
  if (diff === 0) return "D-Day";
  return `D-${diff}`;
}
```

**알림 연동** — 대회 D-3 / D-1 알림:
```typescript
// notification type 추가 (types.ts)
TOURNAMENT_DDAY_REMINDER: "tournament.dday.reminder"  // "대회 D-3일 전입니다"

// 트리거 방식: Vercel Cron (vercel.json)
// "/api/cron/tournament-reminders" → 매일 KST 09:00 실행
// → D-3, D-1인 대회 조회 → 참가 팀장 user_id 목록 → createNotification() 일괄
```

**파일 경로** (알림 트리거):
```
src/app/api/cron/tournament-reminders/route.ts  ← 신규
vercel.json                                      ← cron 설정 추가
```

**트레이드오프**:
- ✅ Vercel Cron → 별도 인프라 없이 스케줄 실행 가능
- ⚠️ Vercel Cron 무료 티어: 1일 1회 제한 → 충분 (09시 1회 실행)
- ⚠️ Cron 설정 전까지는 수동 발송 또는 미구현 상태 유지

---

### 3.6 시리즈 체계 (Series) — 컴맹 + 모바일 친화 UX

<!-- [승인] Must 항목 전체 구현. Should/Nice 는 Must 완료 후 별도 판단. -->

> **2026-03-04 Dylan 분석 기반**
> **벤치마크**: sfinder.co.kr — "누구나 쉽게 스포츠 대회를 개최하고 참가"
> **핵심 요구**: 1회 → 2회 → 3회 … 시리즈로 묶어서 페이지 생성, 컴맹도 핸드폰만으로 관리 가능

---

#### DB 현황 (이미 구축됨 — 별도 마이그레이션 불필요)

| 모델 | 핵심 필드 | 비고 |
|------|----------|------|
| `tournament_series` | id, uuid, name, slug, organizer_id, logo_url, settings, tournaments_count | ✅ 기존 |
| `Tournament` | series_id (BigInt? FK), edition_number (Int?) | ✅ 기존 |

> 인프라 완비. 프론트엔드 UX만 구현하면 됨.

---

#### 3.6.1 시리즈 구조 개념

```
시리즈 (tournament_series)
  └── 1회 (Tournament, edition_number=1, series_id=FK)
  └── 2회 (Tournament, edition_number=2, series_id=FK)
  └── 3회 (Tournament, edition_number=3, series_id=FK)
```

독립 대회 (series_id=NULL)도 그대로 지원 — 기존 wizard 그대로 사용.

---

#### 3.6.2 주최자 UX 흐름 — "컴맹 5분 룰"

목표: 처음 접속한 비개발자도 5분 안에 대회 페이지 공개 가능.

| 단계 | 액션 | 소요시간 | 입력 수 |
|------|------|---------|--------|
| 1 | 시리즈 이름 입력 | 10초 | 1개 필드 |
| 2 | 1회 날짜 + 장소 + 팀 수 | 30초 | 3개 필드 |
| 3 | "공개" 버튼 탭 | 1초 | 0 |
| 4 | 신청 팀 승인 (탭) | 5초/팀 | 1탭 |
| 5 | 경기 결과 입력 (스코어) | 10초/경기 | 2개 숫자 |

---

#### 3.6.3 신규 페이지 구조

**주최자 관리 (tournament-admin)**:
```
/tournament-admin/series/                     ← 기존 stub 교체: 시리즈 목록
/tournament-admin/series/new                  ← 신규: 시리즈 생성 (초간단)
/tournament-admin/series/[id]                 ← 신규: 시리즈 대시보드 (회차 목록)
/tournament-admin/series/[id]/add-edition     ← 신규: 회차 추가 (3필드 폼)
```

**공개 페이지 (사용자 열람)**:
```
/series/[slug]                                ← 신규: 시리즈 공개 허브
/series/[slug]/[editionNumber]                ← 신규: 특정 회차 → /tournaments/[id] 리다이렉트
```

---

#### 3.6.4 페이지별 상세 명세

**① `/tournament-admin/series` — 시리즈 목록** (기존 stub 교체)
- 내 시리즈 카드 목록 (이름, 회차 수, 최신 회차 상태)
- "새 시리즈 만들기" CTA
- 대시보드에도 "내 시리즈" 섹션 링크 추가

**② `/tournament-admin/series/new` — 시리즈 생성**
- 필수: 시리즈 이름 (1개 필드)
- 선택: 한 줄 설명
- slug 자동 생성 (이름 기반, 수동 수정 가능)
- 생성 후 → `/tournament-admin/series/[id]` (대시보드) 이동

**③ `/tournament-admin/series/[id]` — 시리즈 대시보드**
- 헤더: 시리즈 이름, 누적 참가팀 수, 총 회차 수
- 회차 카드 목록 (1회 ~ N회, 날짜 / 팀 수 / 상태 배지)
  - 클릭 → `/tournament-admin/tournaments/[tournamentId]`
- 하단 고정 버튼(모바일): "다음 회차 추가"
- 공개 링크 복사 버튼: `/series/[slug]`

**④ `/tournament-admin/series/[id]/add-edition` — 회차 추가**
- 단 3개 필드:
  - 날짜 (date picker, KST)
  - 장소 (텍스트, 자유 입력)
  - 최대 팀 수 (숫자 스피너, 기본 8)
- 생성 시 자동 처리:
  - `edition_number` = 기존 회차 수 + 1
  - `name` = `${시리즈명} ${edition_number}회`
  - `format` = "single_elimination" (기본값)
  - `status` = "registration_open"
  - `series_id` = 해당 시리즈 FK
  - `tournaments_count` 1 증가
- 생성 후 → 시리즈 대시보드로 복귀 (성공 토스트)

**⑤ `/series/[slug]` — 공개 시리즈 허브**
- 상단: 시리즈 이름, 설명, 총 회차 수 / 누적 참가팀 수
- 회차 타임라인 (최신 → 과거 순):
  - 진행 예정: 날짜 / 장소 / 모집 현황 / "신청하기" 버튼
  - 완료: 우승팀 / 일자 / "결과 보기" 링크
- ISR revalidate 30초

**⑥ `/series/[slug]/[editionNumber]` — 회차 리다이렉트**
- `tournament_series` slug → `tournament` edition_number 조회
- `redirect(/tournaments/[tournamentId])`
- 404 처리: "해당 회차를 찾을 수 없습니다"

---

#### 3.6.5 API 설계

```
POST   /api/web/series                      ← 시리즈 생성
GET    /api/web/series/[id]                 ← 시리즈 상세 (회차 목록 포함)
POST   /api/web/series/[id]/editions        ← 회차 추가 (Tournament 생성 + series_id/edition_number 연결)
GET    /api/web/series/slug/[slug]          ← 공개 페이지용 (slug로 조회)
```

**회차 추가 핵심 로직**:
```typescript
// edition_number 자동 채번
const count = await prisma.tournament.count({ where: { series_id: BigInt(seriesId) } });
const editionNumber = count + 1;

await prisma.$transaction([
  prisma.tournament.create({
    data: {
      series_id: BigInt(seriesId),
      edition_number: editionNumber,
      name: `${series.name} ${editionNumber}회`,
      startDate: new Date(startDate),
      venue_name: venueName,
      maxTeams: maxTeams,
      status: "registration_open",
      format: "single_elimination",
      organizerId: BigInt(session.sub),
      // uuid 자동 (dbgenerated)
    }
  }),
  prisma.tournament_series.update({
    where: { id: BigInt(seriesId) },
    data: { tournaments_count: { increment: 1 } }
  })
]);
```

> ⚠️ 시리즈 소유자(organizer_id) 검증 필수 — IDOR 방지

---

#### 3.6.6 모바일 최적화 요구사항

- 모든 인터랙션 엄지손가락 한 손 조작 가능 (FAB 버튼 우하단 고정)
- 팀 승인/거절: 탭 or 스와이프 제스처 (최소 터치 타겟 44px)
- 경기 스코어 입력: 숫자 필드 자동 `inputMode="numeric"` (모바일 키패드 자동 활성화)
- 완료 피드백: 즉각적인 토스트 메시지
- 네트워크 불안정 고려: 경기 당일 오프라인 가능성 → 낙관적 업데이트 + 재시도

---

#### 3.6.7 구현 우선순위

| 우선순위 | 항목 | 비고 |
|---------|------|------|
| 🔴 Must | `series/new` — 시리즈 생성 | 핵심 진입점 |
| 🔴 Must | `series/[id]` — 대시보드 | 회차 관리 허브 |
| 🔴 Must | `series/[id]/add-edition` — 회차 추가 | 3필드 폼 |
| 🔴 Must | `/series/[slug]` — 공개 허브 페이지 | 사용자 노출 |
| 🟡 Should | `/series/[slug]/[editionNumber]` — 리다이렉트 | 공유 링크 편의 |
| 🟡 Should | 대시보드 `시리즈` 섹션 추가 | UX 진입점 |
| 🟡 Should | `series` 목록 페이지 교체 (stub → real) | 기존 stub |
| 🟢 Nice | OpenGraph 카드 자동 생성 (`/api/og/series`) | SNS 공유 |
| 🟢 Nice | 자동 slug 영문 변환 (slugify 라이브러리) | UX 편의 |

---

#### 3.6.8 트레이드오프

| 항목 | 비고 |
|------|------|
| ✅ DB 이미 완비 | 추가 마이그레이션 불필요 |
| ✅ 독립 대회 / 시리즈 혼용 가능 | series_id=NULL이면 독립 대회 |
| ✅ 기존 wizard와 공존 | 시리즈 회차용 간단 폼 + 독립 대회용 기존 wizard |
| ⚠️ slug 생성 | 한글 → 영문 slug 변환 (slugify) 또는 수동 입력 |
| ⚠️ `/series/[slug]` 라우트 신규 | `src/app/(web)/series/` 디렉토리 추가 |
| ⚠️ `tournaments_count` 동기화 | 회차 삭제/취소 시 감소 처리 필요 |

---

## 4. 커뮤니티 (Community) ✅ 완료

### 4.1 현황

**현재 구현**:
- `src/app/(web)/community/page.tsx` — 목록 (카테고리 필터)
- `src/app/(web)/community/[id]/page.tsx` — 상세 + 댓글
- `src/app/(web)/community/new/page.tsx` — 작성

**현재 카테고리**:

| key | 설명 | BDR 다음카페 대응 |
|-----|------|----------------|
| general | 자유 | 게스트구인, 연습경기, 자유 |
| info | 정보 | 공지, 규정 |
| review | 후기 | 대회/경기 후기 |
| marketplace | 장터 | 농구화/의류/용품거래 |

<!-- [보류: 카테고리 세분화 여부 — general을 게스트구인/연습경기/자유로 분리할지?] -->

### 4.2 개선 방향

| 기능 | 우선순위 | 비고 |
|------|--------|------|
| 게시글 검색 | 🔴 높음 | 현재 검색 없음 |
| 이미지 첨부 | 🟡 중간 | Vercel Blob 또는 외부 스토리지 |
| 좋아요/공감 | 🟢 낮음 | `post_likes` 테이블 신규 필요 |

**파일 경로** (검색 추가):
```
src/app/(web)/community/page.tsx  ← 수정: searchParams.q 검색 쿼리 추가
```

**트레이드오프**:
- ⚠️ 이미지 첨부 → Vercel Blob(무료 제한) vs Cloudinary vs S3

---

## 5. Admin ✅ 완료

### 5.1 슈퍼관리자 체계 변경

**현재**: `session.role === "super_admin"` → `isAdmin=true` AND 이메일 하드코딩
**변경**: `isAdmin=true`인 **모든 유저가 슈퍼관리자** — admin 페이지에서 최대 4명 관리

**접근 방식**:
- `isAdmin=true` → 슈퍼관리자 (이메일 무관)
- `bdr.wonyoung@gmail.com`은 DB 마이그레이션에서 초기 설정 (1명)
- 추가 슈퍼관리자 = admin 페이지 `/admin/users`에서 isAdmin 토글로 관리
- 최대 4명 제한 → API에서 강제

**슈퍼관리자 role 결정** (`src/lib/auth/web-session.ts` 수정):
```typescript
function determineRole(user: { isAdmin: boolean; membershipType: number }) {
  if (user.isAdmin) return "super_admin";   // isAdmin=true인 모든 유저
  if (user.membershipType >= MEMBERSHIP.TOURNAMENT_ADMIN) return "tournament_admin";
  return "user";
}
```

**최대 4명 제한** (admin API):
```typescript
// PATCH /api/web/admin/users/[id] (isAdmin = true 설정 시)
const currentSuperAdmins = await prisma.users.count({ where: { isAdmin: true } });
if (currentSuperAdmins >= MAX_SUPER_ADMINS) {
  return apiError("SUPER_ADMIN_LIMIT", 400, `슈퍼관리자는 최대 ${MAX_SUPER_ADMINS}명까지 가능합니다.`);
}
```

**트레이드오프**:
- ✅ DB `isAdmin` 기반 → 코드 수정 없이 admin 페이지에서 유연하게 관리
- ✅ 이메일 하드코딩 제거 → 계정 변경에도 대응 가능
- ⚠️ admin 페이지에 isAdmin 토글 UI 추가 필요 (`admin/users/page.tsx` 수정)

---

### 5.2 구독 플랜 관리 + 프로모션 관리

**목표 플랜 테이블**:

| 플랜명 | membershipType | 정가 | 현재 상태 |
|--------|---------------|------|---------|
| 일반 (Free) | 0 | 무료 | - |
| 픽업 호스트 | 1 | ₩50,000/월 | 미판매 (수동 지급) |
| 팀장 | 2 | ₩3,900/월 | 프로모션 무료 |
| 대회관리자 | 3 | ₩199,000/월 | 프로모션 무료 |

**"프로모션 무료" 구현 방법**:

> 한시적 1회성 프로모션 — 기간 미확정. 관리가 쉬운 방법 우선.

**권고 방식: 옵션 A — `subscription_expires_at = NULL`**
- `membershipType > 0` + `subscription_expires_at = NULL` → 무기한 무료 (프로모션)
- 프로모션 종료 결정 시: admin 페이지에서 "프로모션 종료" 버튼 → 해당 티어 전체 `subscription_expires_at = NOW()` 일괄 업데이트
- 이후 결제 안 된 유저 = 만료 → `membershipType = 0` 자동 강등

**admin 프로모션 관리 UI** (`admin/plans/page.tsx` 수정):
```
[팀장 티어] 현재: 프로모션 무료 (해당 유저 수: 42명)
  [프로모션 종료] 버튼 → 확인 모달 → 일괄 만료 처리
```

**트레이드오프**:
- ✅ DB 컬럼 추가 없음 — 기존 `subscription_expires_at` 재활용
- ✅ admin UI 버튼 1개로 전체 프로모션 종료 가능
- ⚠️ Toss Payments 빌링 연동 전까지 만료 후 재구독은 수동 처리

---

### 5.3 admin 페이지 변경 사항 요약 (최소 변경)

| 페이지 | 변경 내용 |
|--------|---------|
| `users/page.tsx` | membershipType 레이블 업데이트 + **isAdmin 토글 추가** |
| `plans/page.tsx` | 플랜 정보 업데이트 + **프로모션 종료 버튼 추가** |
| `payments/page.tsx` | 유지 |
| `tournaments`, `analytics`, `settings`, `logs` | 변경 없음 |

**`users/page.tsx` 레이블 수정**:
```typescript
// 변경
const membershipLabels = {
  0: "일반유저",
  1: "픽업호스트",
  2: "팀장",
  3: "대회관리자",
};
```

---

## 6. 알림 시스템 ✅ 완료

### 6.1 알림 생성 헬퍼

**파일 경로**:
```
src/lib/notifications/
├── create.ts    ← 신규: createNotification() 헬퍼
└── types.ts     ← 신규: NOTIFICATION_TYPES 상수
```

**코드**: `research.md § 1.5 Phase 1` 참조

**연동 포인트** (우선순위):
1. `POST /api/web/games/[id]/apply` — 참가신청 (호스트에게)
2. `PATCH /api/web/games/[id]/apply` — 승인/거부 (신청자에게)
3. `PATCH /api/web/teams/[id]/members` — 가입신청 승인/거부
4. `POST /api/cron/tournament-reminders` — D-3/D-1 대회 알림 (§3.5)
5. 슈퍼관리자 브라켓 승인 요청 (§3.1)

### 6.2 헤더 알림 아이콘 + 뱃지

<!-- [승인] -->

**위치**: 헤더 오른쪽 영역에서 **유저 프로필 아이콘 왼쪽**에 벨 아이콘 배치

```
헤더 레이아웃:
  [로고] [네비게이션] ... [🔔 벨+뱃지] [👤 프로필]
```

**파일 경로**: `src/components/shared/header.tsx` ← 수정

```typescript
// 헤더 Server Component에서 unread count 조회
const unreadCount = session
  ? await prisma.notifications.count({
      where: { user_id: BigInt(session.userId), status: "unread" },
    })
  : 0;
```

---

## 8. 요금제 페이지 (Pricing)

<!-- [승인] -->

### 8.1 개요

**목표**: 멤버십 티어별 가격/기능을 한눈에 보여주는 공개 페이지
**URL**: `/pricing`
**접근 권한**: 누구나 (로그인 불필요)
**현재 상태**: 팀장·대회관리자 티어는 프로모션 무료 중 → 배지로 표시

### 8.2 네비게이션 추가

| 위치 | 변경 내용 |
|------|---------|
| 데스크탑 상단 nav | `desktopNavItems`에 `{ href: "/pricing", label: "요금제" }` 추가 |
| 모바일 슬라이드 메뉴 | `etc` 섹션에 `{ href: "/pricing", label: "요금제", icon: "💳" }` 추가 |
| 모바일 하단 탭 | 변경 없음 (5개 슬롯 고정) |

**파일 경로**:
```
src/components/shared/header.tsx      ← desktopNavItems 배열에 요금제 추가
src/components/shared/slide-menu.tsx  ← etc 섹션에 요금제 추가
```

### 8.3 페이지 구성

**파일 경로**:
```
src/app/(web)/pricing/page.tsx  ← 신규 (Server Component, 정적 데이터)
```

**티어 카드 4개**:

| 티어 | membershipType | 가격 | 상태 | 주요 기능 |
|------|---------------|------|------|---------|
| 일반 | 0 | 무료 | - | 경기 참가, 팀 가입, 커뮤니티 |
| 픽업 호스트 | 1 | ₩50,000/월 | 출시 예정 | 픽업게임 개설 + 일반 기능 전체 |
| 팀장 | 2 | ₩3,900/월 | 🎉 프로모션 무료 | 팀 생성/관리 + 픽업호스트 기능 전체 |
| 대회관리자 | 3 | ₩199,000/월 | 🎉 프로모션 무료 | 대회 생성/관리 + 팀장 기능 전체 |

**레이아웃**:
- 상단: 헤더 타이틀 + 프로모션 안내 배너
- 본문: 4열 카드 그리드 (모바일 1열 → 데스크탑 4열)
- 각 카드: 티어명 / 가격 / 프로모션 배지(해당 시) / 기능 목록 / CTA 버튼
- CTA: 결제 시스템 미구현 → "문의하기" (`mailto:` 링크 또는 커뮤니티 링크)
- 하단: FAQ 간략 섹션 (2~3개)

**트레이드오프**:
- ✅ Server Component + 정적 데이터 → 빠른 초기 렌더, SEO 유리
- ✅ DB 의존 없음 → roles.ts 상수 재활용
- ⚠️ 프로모션 상태 하드코딩 → 향후 DB 연동 시 수정 필요
- ⚠️ CTA가 "문의하기"로 임시 처리 → Toss Payments 연동 후 교체

---

## 9. 프로필 수정 (Profile Edit)

<!-- [승인] 은행 코드: 외부 API 불필요 → 정적 banks.ts 상수에서 자동 설정 (금융결제원 표준 코드 체계, 매우 안정적). 사용자는 은행명만 선택, bank_code는 드롭다운 value로 함께 전송. -->

> **근거**: Dev/research.md §6 심층 분석 결과

### 9.1 현황 및 목표

**현재 수정 가능 필드**: nickname / position / height / city / bio (5개)

**목표**: 픽업·게스트 경기 신청에 필요한 정보 + 환불 계좌 정보를 한 페이지에서 수정

**전용 수정 페이지** 방식 채택 이유:
- 현재 `/profile` 페이지는 조회+탭 중심 → 편집 모달이 점점 무거워지는 구조
- 모바일에서 긴 폼은 전용 페이지가 UX 우수
- SEO 불필요 → 로그인 필수 → `force-dynamic` 서버 컴포넌트 적합

---

### 9.2 수정 대상 필드 전체

#### 기본 정보

| 필드 | DB 컬럼 | 타입 | 필수 | 비고 |
|------|---------|------|------|------|
| 이름 (실명) | `name` | String | ✅ | 노쇼 대응 식별 |
| 닉네임 | `nickname` | String | ✅ | 표시명 |
| **생년월일** | `birth_date` | Date | ✅ | 나이 직접 입력 X → 자동 계산 |
| **전화번호** | `phone` | String | ✅ | 010-XXXX-XXXX 형식 |
| 활동 지역 | `city` | String | ✅ | 시/도 |
| 세부 지역 | `district` | String | - | 구/군 |

> **나이 표시 원칙**: `birth_date` 저장 → 나이 자동 계산 유틸리티로 표시.
> 직접 나이 입력 금지 — 매년 갱신 불필요.
> ```typescript
> // src/lib/utils/age.ts
> export function calcAge(birthDate: Date): number {
>   const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
>   let age = now.getFullYear() - birthDate.getFullYear();
>   const m = now.getMonth() - birthDate.getMonth();
>   if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
>   return age;
> }
> ```

#### 경기 정보

| 필드 | DB 컬럼 | 타입 | 필수 | 비고 |
|------|---------|------|------|------|
| 포지션 | `position` | Enum | ✅ | PG/SG/SF/PF/C |
| **키 (cm)** | `height` | Int | ✅ | 100~250 |
| 몸무게 (kg) | `weight` | Int | - | 선택 사항 |
| 자기소개 | `bio` | String | - | 최대 255자 |

#### 환불 계좌 정보

| 필드 | DB 컬럼 | 타입 | 암호화 | 비고 |
|------|---------|------|--------|------|
| 은행명 | `bank_name` | String | - | 드롭다운 선택 |
| 은행 코드 | `bank_code` | String | - | 드롭다운 선택 시 자동 설정 (사용자 직접 입력 없음, 향후 Toss Payments 연동용) |
| **계좌번호** | `account_number` | String | **✅ 필수** | AES-256-GCM |
| 예금주명 | `account_holder` | String | - | 최대 20자 |

---

### 9.3 계좌 수집 법적 근거 요약

> 상세 분석: Dev/research.md §6.3 참조

- 계좌번호 = **일반 개인정보** (민감정보·고유식별정보 아님)
- **암호화 의무**: 개인정보보호위원회 고시 제2023-6호(2023.9.22) — `account_number` AES-256 저장 법적 의무
- 수집 목적: "참가비·게스트비·픽업비 환불금 송금"
- 수집 근거: 환불 계좌 입력 시 **별도 체크박스 동의** (회원가입 동의와 분리)
- 최소 수집: 은행명·계좌번호·예금주명 3가지 (주민번호·계좌 비밀번호 절대 금지)
- 보유 기간: 환불 완료 후 파기 원칙 / 거래 기록은 전자상거래법 5년 보관
- 1원 인증(실명확인): **법적 의무 아님** — 현재 단계에서는 미구현, 향후 대규모 정산 시 추가 검토

---

### 9.4 암호화 설계

```
환경변수: ACCOUNT_ENCRYPTION_KEY (32 bytes hex, Vercel 시크릿 등록 필수)
알고리즘: AES-256-GCM (복호화 필요 → 해시 불가)
저장 형식: "enc:" + base64(iv(12) + authTag(16) + ciphertext)
노출 형식: "123-****-9012" 마스킹 표시

파일: src/lib/security/account-crypto.ts (신규)
  - encryptAccount(plain: string): string
  - decryptAccount(stored: string): string
  - maskAccount(plain: string): string
```

---

### 9.5 UI 와이어프레임

```
/profile/edit

┌─────────────────────────────────┐
│ ← 뒤로      프로필 수정           │
├─────────────────────────────────┤
│ 기본 정보                        │
│  이름          [            ]   │
│  닉네임        [            ]   │
│  생년월일      [YYYY-MM-DD  ]   │
│  전화번호      [010-    -   ]   │
│  활동 지역     [시/도▼] [구/군▼] │
├─────────────────────────────────┤
│ 경기 정보                        │
│  포지션   [PG][SG][SF][PF][C]   │
│  키 (cm)  [   ]  몸무게 [   ]   │
│  자기소개  [                ]   │
│           [                ]   │
├─────────────────────────────────┤
│ 환불 계좌 정보                   │
│  □ 개인정보 수집·이용 동의 (필수) │
│    은행    [드롭다운▼         ]  │
│    계좌번호 [              ]    │
│    예금주명 [              ]    │
│  ℹ 참가비·게스트비 환불 시 사용   │
│  ℹ 계좌번호는 암호화 저장됩니다   │
├─────────────────────────────────┤
│  [        저 장        ]        │
└─────────────────────────────────┘
```

---

### 9.6 파일 경로 및 API

```
src/app/(web)/profile/
├── page.tsx            ← 기존: 상단에 "프로필 수정" 버튼 링크 추가
└── edit/
    └── page.tsx        ← 신규: 전용 수정 페이지 (Client Component)

src/app/api/web/profile/
└── route.ts            ← 기존 PATCH 엔드포인트 확장
                           (birth_date / phone / weight / district /
                            bank_name / bank_code / account_number / account_holder 추가)

src/lib/security/
└── account-crypto.ts   ← 신규: AES-256-GCM 암호화/복호화/마스킹

src/lib/constants/
└── banks.ts            ← 신규: 은행 목록 + 금융결제원 표준 코드 (20개)
                                 드롭다운 { label: "KB국민은행", value: "004" } 형식
                                 외부 API 불필요 — 금융결제원 코드 체계는 안정적

src/lib/utils/
└── age.ts              ← 신규: calcAge() 유틸리티
```

**Zod 스키마 확장** (`src/lib/validation/profile.ts` 신규):
```typescript
export const profileEditSchema = z.object({
  name:            z.string().min(1).max(30).optional(),
  nickname:        z.string().min(1).max(20).optional(),
  birth_date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  phone:           z.string().regex(/^010-?\d{4}-?\d{4}$/).optional(),
  position:        z.enum(["PG","SG","SF","PF","C"]).optional(),
  height:          z.number().int().min(100).max(250).optional(),
  weight:          z.number().int().min(30).max(200).optional(),
  city:            z.string().max(20).optional(),
  district:        z.string().max(20).optional(),
  bio:             z.string().max(255).optional(),
  bank_name:       z.string().max(20).optional(),
  bank_code:       z.string().max(10).optional(),   // 드롭다운 value에서 자동 전송 (사용자 직접 입력 없음)
  account_number:  z.string().max(30).optional(),  // 저장 전 encryptAccount()
  account_holder:  z.string().max(20).optional(),
  account_consent: z.boolean().optional(),
});
```

**트레이드오프**:
- ✅ 전용 수정 페이지 → 모달 비대화 방지, 모바일 UX 개선
- ✅ 계좌 암호화 유틸리티 분리 → 재사용 가능
- ⚠️ `ACCOUNT_ENCRYPTION_KEY` Vercel 시크릿 등록 필수 (없으면 빌드 오류 방지용 fallback 처리 필요)
- ⚠️ 기존 `account_number` 컬럼 평문 데이터 → 마이그레이션 스크립트로 암호화 일괄 처리 필요
- ⚠️ 계좌 동의 미체크 시 API에서 계좌 필드 업데이트 거부 (서버사이드 강제)

---

## 10. 홈 즐겨찾기 퀵 메뉴

<!-- [승인] 퀵 메뉴는 최초 설정 후에도 언제든지 [편집] 버튼으로 변경 가능. 편집 버튼 항상 노출 유지. -->

> **근거**: Dev/research.md §7 심층 분석 결과 (토스뱅크 자주 쓰는 메뉴 패턴)

### 10.1 개요

홈 상단에 사용자가 직접 4개 메뉴를 선택·배치하는 퀵 액션 영역.
토스뱅크 "자주 쓰는 메뉴"와 동일한 UX 패턴.

**미로그인**: 기본 4개 고정 표시 (편집 불가)
**로그인**: DB에 저장된 4개 표시 + [편집] 버튼

---

### 10.2 저장 방식 결정

**DB 저장 + localStorage 캐시(낙관적 업데이트)**

| 항목 | localStorage | DB 저장 |
|------|-------------|---------|
| 기기 간 동기화 | ❌ | ✅ |
| Flutter 앱 연동 | ❌ | ✅ |
| 구현 복잡도 | 낮음 | 중간 |

→ 로그인 필수 플랫폼 + Flutter 앱 동기화 필요 → DB 저장 채택

---

### 10.3 DB 스키마

`users` 테이블 컬럼 추가 (별도 테이블 불필요 — 사용자당 1개, 수십 바이트 수준):

```sql
-- migration: add_quick_menu_to_users
ALTER TABLE users
  ADD COLUMN quick_menu_items TEXT[]
  DEFAULT ARRAY['find_game','my_team','tournaments','pickup'];
```

```prisma
// prisma/schema.prisma - users 모델에 추가
quickMenuItems  String[]  @default(["find_game","my_team","tournaments","pickup"])
                          @map("quick_menu_items")
```

---

### 10.4 전체 메뉴 후보 풀 (10개)

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

### 10.5 UX 흐름

```
[홈 기본 상태]
┌──────────────────────────────────┐
│ 자주 쓰는 메뉴              [편집] │
│ [🏀경기찾기][👥내팀][🏆대회][⚡픽업] │
└──────────────────────────────────┘

[편집 버튼 클릭]
┌──────────────────────────────────┐
│ 메뉴 편집 (4개 선택)       [완료]  │
│ 현재 선택:                        │
│ [🏀경기찾기 ✕][👥내팀 ✕][🏆대회 ✕][⚡픽업 ✕] │
├──────────────────────────────────┤
│ 전체 메뉴                         │
│ [📅내일정]  [📊내기록]  [💬커뮤니티]│
│ [🥇랭킹]    [📍코트찾기] [🔔알림]  │
└──────────────────────────────────┘
```

**편집 방식**: 탭 선택 (추가/제거) — DnD는 4개 항목에서 오버스펙
**편집 접근**: [편집] 버튼은 홈 화면에 **항상 표시** → 최초 설정 후에도 언제든지 재편집 가능
**저장 방식**: 완료 버튼 클릭 시 낙관적 업데이트 (즉시 UI 반영 + 백그라운드 API 저장)

---

### 10.6 파일 경로 및 API

```
src/components/home/
└── quick-menu.tsx              ← 신규: Client Component
                                   - 기본 상태: 4개 버튼 그리드
                                   - 편집 모드: 전체 후보 풀 + 선택 UI
                                   - 낙관적 업데이트 패턴

src/app/(web)/page.tsx          ← 기존 수정: QuickMenu 컴포넌트 삽입 (홈 상단)

src/app/api/web/user/
└── quick-menu/
    └── route.ts                ← 신규: GET + PUT
                                   GET → { menu_items: string[] }
                                   PUT body: { menu_items: string[] } (max 4)
```

**홈 삽입 위치**:
```
[홈 페이지 레이아웃]
 헤더 (sticky)
 ─────────────
 퀵 메뉴 (4버튼 + 편집)   ← 여기 
 ─────────────
 최근 경기
 ─────────────
 진행 중 대회
```

**트레이드오프**:
- ✅ `users` 컬럼 추가 → JOIN 없이 프로필 로드 시 함께 조회
- ✅ 낙관적 업데이트 → 네트워크 지연 없이 즉시 반응
- ✅ 기본값 DB 설정 → 첫 로그인 시 별도 초기화 API 불필요
- ⚠️ DB 마이그레이션 필요 (`quick_menu_items` 컬럼 추가)
- ⚠️ 미로그인 사용자 → localStorage 캐시만 사용, 서버 저장 없음

---

## 11. PWA (Progressive Web App)

<!-- [승인] 아이콘: 초기 구현은 임시 placeholder 사용, 최종 디자인은 추후 교체. PWA 설정은 먼저 완성. -->

> **근거**: Next.js 15 공식 문서(2026.02.27 업데이트) + research.md 연계

### 11.1 목표

BDR 앱을 iOS/Android 홈 화면에 설치 가능한 **앱 수준 웹앱**으로 전환.
별도 앱스토어 배포 없이 "홈 화면에 추가" 방식으로 네이티브 앱 경험 제공.

**기대 효과**:
- 홈 화면 아이콘 → 앱처럼 실행 (상단 주소창 없음, 풀스크린)
- 오프라인 기본 페이지 표시
- iOS 16.4+ / Android 에서 푸시 알림 수신 (웹 푸시, 별도 앱 불필요)
- 설치 후 재방문율 향상

---

### 11.2 라이브러리 선택

| 옵션 | 상태 | 결론 |
|------|------|------|
| `shadowwalker/next-pwa` | ❌ 유지보수 중단 (2024년 이후 업데이트 없음) | 사용 금지 |
| `@ducanh2912/next-pwa` | 보통 유지 (serwist의 전신) | 차선 |
| **`@serwist/next`** | ✅ 활발히 유지, Next.js 15 공식 문서 권장 | **채택** |
| manual `public/sw.js` | 의존성 없음 (푸시 전용 목적에 적합) | 푸시만 필요 시 대안 |

**채택: `@serwist/next` v9.x + `serwist` v9.x**

> ⚠️ **Turbopack 주의**: `@serwist/next`는 webpack 기반 — `next dev --turbopack` 사용 시 충돌.
> 개발 환경에서는 SW를 비활성화(`disable: process.env.NODE_ENV === "development"`)하거나
> Turbopack 없이 `next dev`로 실행.

---

### 11.3 Web App Manifest

```typescript
// src/app/manifest.ts (신규 — Next.js Route Handler)
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyBDR - 농구 토너먼트",
    short_name: "MyBDR",
    description: "농구 리그 & 토너먼트 플랫폼",
    start_url: "/",
    display: "standalone",          // 주소창 없는 앱 모드
    orientation: "portrait",
    background_color: "#F5F7FA",    // 스플래시 배경
    theme_color: "#0066FF",         // 상태바 색상
    categories: ["sports"],
    icons: [
      { src: "/icons/icon-192x192.png",    sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512x512.png",    sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-192x192.png",sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512x512.png",sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "경기 일정", url: "/games",       icons: [{ src: "/icons/shortcut-96.png", sizes: "96x96" }] },
      { name: "토너먼트",  url: "/tournaments", icons: [{ src: "/icons/shortcut-96.png", sizes: "96x96" }] },
    ],
  };
}
```

**Maskable 아이콘**: 안드로이드 어댑티브 아이콘 대응 — 콘텐츠를 중앙 80% 안에 배치.
[maskable.app/editor](https://maskable.app/editor) 로 검증 후 적용.

---

### 11.4 `app/layout.tsx` 수정

```typescript
import type { Metadata, Viewport } from "next";

// viewport는 metadata와 분리 (Next.js 15 권장)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",     // iOS safe area 활성화 필수
  themeColor: "#0066FF",
};

export const metadata: Metadata = {
  // 기존 유지 + 추가:
  appleWebApp: {
    capable: true,              // <meta name="apple-mobile-web-app-capable">
    statusBarStyle: "default",  // iOS 상태바 스타일
    title: "MyBDR",
  },
  formatDetection: { telephone: false },
};
```

---

### 11.5 Service Worker 캐시 전략

```
앱 쉘 프리캐시 (Serwist 자동):
  /_next/static/**  → Cache First (1년, 해시 불변)
  /                 → Network First
  /games, /tournaments, /teams → Network First

런타임 캐시 전략:
  /api/web/auth/**       → Network Only  (보안 — 절대 캐시 금지)
  /api/v1/games/live/**  → Network Only  (실시간 점수 — 캐시 금지)
  /api/v1/**             → Network First (10초 타임아웃 → 캐시 폴백)
  /api/web/**            → Network First (10초 타임아웃 → 캐시 폴백)
  *.{png,jpg,webp}       → Cache First   (7일 TTL)

오프라인 폴백:
  /~offline              → 오프라인 안내 페이지 (신규 생성 필요)
```

---

### 11.6 iOS 대응

**지원 현황**:
| 기능 | iOS 버전 | 비고 |
|------|---------|------|
| 홈 화면 추가 | 전 버전 | Safari "공유 → 홈 화면에 추가" |
| 푸시 알림 | **16.4+** (홈 화면 설치 필수) | 미지원 시 인앱 알림으로 대체 |
| `beforeinstallprompt` | ❌ 미지원 | 수동 안내 배너 필요 |
| 백그라운드 싱크 | ❌ 미지원 | - |

**설치 안내 배너** (iOS Safari 감지 시 표시):
```
"더 편리하게 사용하려면:
 Safari → 공유 버튼 → 홈 화면에 추가"
```

**safe area 처리** — 기존 모바일 바텀 내비에 추가:
```tsx
// 현재: style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }} ← 이미 적용됨 ✅
```

> ⚠️ `viewportFit: "cover"` 설정 시 safe area inset이 실제로 활성화됨 → layout.tsx 수정 후 바텀 내비 검증 필요

---

### 11.7 파일 경로 및 설치 작업

```
신규 생성:
  src/app/manifest.ts          ← Web App Manifest Route Handler
  src/app/sw.ts                ← Serwist Service Worker 소스
  src/app/(web)/~offline/
  └── page.tsx                 ← 오프라인 폴백 페이지
  public/icons/                ← 초기: 임시 placeholder 아이콘으로 PWA 설정 먼저 완성
    icon-192x192.png           ← 초기: #0066FF 단색 배경 + "BDR" 텍스트 (SVG → PNG)
    icon-512x512.png
    maskable-192x192.png
    maskable-512x512.png
    apple-touch-icon.png       (180x180)
                               ※ 최종 아이콘: Aria 디자인 완료 후 동일 경로로 교체

기존 수정:
  next.config.ts               ← withSerwist() 래퍼 + SW 헤더 추가
  app/layout.tsx               ← viewport 분리 + appleWebApp 메타태그
  .gitignore                   ← public/sw.js, public/swe-worker-*.js 추가

패키지 설치:
  npm i @serwist/next
  npm i -D serwist
```

**`next.config.ts` 변경**:
```typescript
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",  // 개발 환경 비활성화
});

export default withSerwist(nextConfig);
```

**Vercel 배포 헤더** (`next.config.ts` headers 추가):
```typescript
{
  source: "/sw.js",
  headers: [
    { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
    { key: "Content-Type", value: "application/javascript; charset=utf-8" },
  ],
},
```

**트레이드오프**:
- ✅ 앱스토어 없이 iOS/Android 설치 경험 제공
- ✅ 기존 코드 영향 최소 — manifest.ts + sw.ts 신규 추가 방식
- ✅ 오프라인 폴백으로 기본 UX 보장
- ⚠️ 초기 구현은 임시 placeholder 아이콘 사용 → 최종 디자인(Aria) 완료 후 같은 경로로 교체
- ⚠️ iOS는 "홈 화면에 추가" 수동 안내 필요 (자동 설치 프롬프트 없음)
- ⚠️ `@serwist/next`는 webpack 빌드 전용 — Turbopack 개발 서버와 충돌 주의
- ⚠️ 기존 CSP `unsafe-inline` 임시 설정이 SW 동작에 영향 없음 (SW는 별도 컨텍스트)

---

## 7. 구현 순서 권고

```
[즉시 — 이번 주]
1. roles.ts 생성 (권한 상수 중앙화)
2. DB 마이그레이션 (membershipType 재매핑, phone, profile_reminder_shown_at)
3. 알림 헬퍼 + 타입 상수
4. 헤더 알림 벨 아이콘 + 뱃지 (프로필 왼쪽)
5. 프로필 미완성 1일 1회 안내 배너 (경기 상세 페이지)

[2주 차]
6. 경기 목록 — 타입별 카드 컴포넌트 (게스트 포함, 기존 코드 영향 최소화)
7. 경기 상세 — 타입/상태별 동적 섹션
8. 픽업 게임 폼 + 생성 권한 체크
9. 팀 목록 카드 그리드
10. 팀 상세 탭 (스키마 매핑 확인 후)

[3주 차]
11. 팀 가입신청 처리 UI + API
12. 대진표 초안 생성 (버전 관리 포함)
13. 팀 자기등록 흐름 (대회)

[4주 차]
14. 경기 완료 → 전적 자동 갱신 (스키마 확인 우선)
15. D-Day 표시 + Vercel Cron 알림
16. admin 변경사항 (레이블, isAdmin 토글, 프로모션 관리)

[이후]
17. /upgrade 페이지 + 플랜 안내
18. Toss Payments 자동결제 연동
19. 커뮤니티 검색 + 이미지 첨부
20. 실시간 알림 (30초 폴링)
21. 대진표 시각화 (보류 해제 후)
```

---

## §3.7 노코드 대회 사이트 템플릿

<!-- [승인] Must 항목 전체 구현. 팔레트 색상 8종 + 템플릿 3종(클래식/다크/미니멀) 1단계 완성 후 Should 판단. -->

### 현황 (분석 완료)
- `site_templates` DB: 5개 레코드 있음 (slug: classic-tournament, minimal-white, the-process 등)
- `tournament_sites` DB: 생성은 되지만 `site_template_id = null` (템플릿 미연결)
- `src/app/(site)/` 디렉토리: **존재하지 않음** → 서브도메인 접속 시 404
- `proxy.ts`: 서브도메인 → `/_site`로 rewrite 구현됨 (라우팅 준비 완료)
- 로컬 테스트: `localhost:3000?_sub=rookie` 로 서브도메인 시뮬레이션 가능

### 핵심 원칙 (노코드/컴맹 친화)

> **주최자가 입력할 것 = 0개**
> 대회명·날짜·장소·팀·대진표는 DB에서 자동 반영

```
관리자 3스텝:
① 템플릿 고르기 (카드 탭 한 번)
② 색깔 고르기 (팔레트 8종에서 탭)
③ 공개하기 (스위치 ON)
```

### 사이트 페이지 구성 (자동 렌더링)

| 페이지 | slug | 자동 반영 | 주최자 입력 |
|--------|------|----------|------------|
| 홈 | `/` | 대회명·날짜·장소·신청 CTA | 없음 |
| 팀 목록 | `/teams` | DB 자동 | 없음 |
| 대진표 | `/bracket` | DB 자동 | 없음 |
| 공지사항 | `/notice` | — | 텍스트 입력 1개 (선택) |

각 페이지 ON/OFF 토글로 표시 여부 조절.

### 템플릿 3종 (Must — 1단계)

| slug | 이름 | 분위기 | 대상 |
|------|------|--------|------|
| `classic` | 클래식 | 흰 배경·파랑·깔끔 | 일반 대회 |
| `dark` | 다크 | 검정 배경·강렬 | 경쟁 대회 |
| `minimal` | 미니멀 | 텍스트 중심·심플 | 소규모·친선 |

### 색상 팔레트 (8종 — 헥스 코드 입력 불필요)

```
🔵 토스 블루 #0066FF  🔴 레드 #EF4444
🟠 오렌지 #F4A261     🟢 그린 #22C55E
⚫ 다크 #1F2937        🟣 퍼플 #8B5CF6
⚪ 화이트 #F5F7FA      🟡 골드 #FBBF24
```

### 아키텍처

```
src/app/_site/
  layout.tsx                  ← 서브도메인 공통 헤더/푸터 (proxy.ts rewrite 대상)
  [[...path]]/page.tsx        ← 라우팅 허브: subdomain → tournament_site → 템플릿 분기

src/components/site-templates/
  classic/                    ← 클래식 템플릿 컴포넌트
    home.tsx / teams.tsx / bracket.tsx / notice.tsx
  dark/                       ← 다크 템플릿
  minimal/                    ← 미니멀 템플릿

src/app/(web)/tournament-admin/tournaments/[id]/site/
  page.tsx                    ← 기존 사이트 관리 → 3스텝 위자드로 개편
```

### 관리자 UI 흐름 (3스텝 위자드)

```
[Step 1 — 템플릿]
  큰 카드 3개 (썸네일 + 이름)
  선택된 카드에 체크 표시

[Step 2 — 꾸미기]
  색상 팔레트 8개 (원형 버튼)
  로고 이미지 업로드 (선택)
  사이트 이름 (기본값: 대회명 자동 입력)
  → 우측에 실시간 미니 미리보기

[Step 3 — 공개]
  "사이트 미리보기" 버튼 (새 탭, ?_sub= 파라미터)
  공개 ON/OFF 스위치
  URL 표시: rookie.mybdr.kr
```

### 구현 태스크

**Must (1단계)**
- [ ] T1: `src/app/_site/layout.tsx` + `[[...path]]/page.tsx` 생성 (서브도메인 매핑)
- [ ] T2: `classic` 템플릿 4개 페이지 컴포넌트
- [ ] T3: 관리자 사이트 관리 페이지 → 3스텝 위자드 개편
- [ ] T4: `tournament_sites.site_template_id` 저장 API 연결

**Should (2단계)**
- [ ] T5: `dark` / `minimal` 템플릿
- [ ] T6: 페이지별 ON/OFF 토글 (`site_pages` 활용)
- [ ] T7: 공지사항 텍스트 편집

**Nice (3단계)**
- [ ] T8: 로고/배너 이미지 업로드
- [ ] T9: 방문자 수 통계 표시

### 트레이드오프
- ✅ 주최자 입력 0 — 대회 정보 자동 렌더링
- ✅ 코드 기반 템플릿 → 빠른 구현, 안정적 성능
- ✅ 팔레트 방식 → 잘못된 색상 조합 방지
- ✅ 모바일 우선 (주최자·관람자 모두 폰 사용)
- ⚠️ 새 템플릿 추가 시 코드 변경 필요 (섹션 빌더 방식 대비 유연성 낮음)
- ⚠️ 로컬 테스트는 `?_sub=` 파라미터 필수 (DNS 없음)

---

## §8. bdr_stat 스탯 기록 연동

> **목적**: Flutter bdr_stat 앱으로 대회 경기 스탯을 실시간 기록 → 대회 사이트 라이브 스코어보드 표시
> **근거**: Dev/research.md §8
> **상태**: ⛔ 아직 구현하지마 — 판단 주석 작성 후 승인 필요

---

### §8.1 DB 마이그레이션

> **Supabase MCP 사용 필수**

<!--[승인] -->

**신규 테이블 2개**:

```sql
-- migration: add_tournament_recorders
CREATE TABLE tournament_recorders (
  id            BIGSERIAL PRIMARY KEY,
  tournament_id VARCHAR NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  recorder_id   BIGINT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by   BIGINT  NOT NULL REFERENCES users(id),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tournament_id, recorder_id)
);
CREATE INDEX idx_tournament_recorders_tournament ON tournament_recorders(tournament_id);

-- migration: add_match_events
CREATE TABLE match_events (
  id            BIGSERIAL PRIMARY KEY,
  match_id      BIGINT  NOT NULL REFERENCES tournament_matches(id) ON DELETE CASCADE,
  tournament_id VARCHAR NOT NULL,                -- 집계 최적화용 역정규화
  team_id       BIGINT  REFERENCES tournament_teams(id),
  player_id     BIGINT  REFERENCES tournament_team_players(id),

  -- event_type 허용값:
  -- score_2, score_3, free_throw
  -- rebound_off, rebound_def, assist, steal, block, turnover
  -- foul_personal, foul_technical, timeout
  -- quarter_start, quarter_end, game_start, game_end
  event_type    VARCHAR NOT NULL,
  value         INT,               -- 득점 이벤트: 2/3/1
  quarter       INT,               -- 1~4, 5=연장
  game_time     VARCHAR(10),       -- "09:45" 표시용

  undone        BOOLEAN NOT NULL DEFAULT false,
  undone_at     TIMESTAMPTZ,
  undone_by     BIGINT REFERENCES users(id),
  recorded_by   BIGINT  NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_match_events_match_undone   ON match_events(match_id, undone);
CREATE INDEX idx_match_events_match_time     ON match_events(match_id, created_at);
CREATE INDEX idx_match_events_tournament_team ON match_events(tournament_id, team_id);
```

**Prisma 스키마 추가**:

```prisma
// prisma/schema.prisma

model tournament_recorders {
  id           BigInt     @id @default(autoincrement())
  tournamentId String     @map("tournament_id")
  recorderId   BigInt     @map("recorder_id")
  assignedBy   BigInt     @map("assigned_by")
  isActive     Boolean    @default(true) @map("is_active")
  createdAt    DateTime   @default(now()) @map("created_at")

  tournament   Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  recorder     users      @relation("TournamentRecorder", fields: [recorderId], references: [id], onDelete: Cascade)
  assigner     users      @relation("TournamentRecorderAssigner", fields: [assignedBy], references: [id])

  @@unique([tournamentId, recorderId])
  @@index([tournamentId])
  @@map("tournament_recorders")
}

model match_events {
  id           BigInt          @id @default(autoincrement())
  matchId      BigInt          @map("match_id")
  tournamentId String          @map("tournament_id")
  teamId       BigInt?         @map("team_id")
  playerId     BigInt?         @map("player_id")
  eventType    String          @map("event_type")
  value        Int?
  quarter      Int?
  gameTime     String?         @map("game_time")
  undone       Boolean         @default(false)
  undoneAt     DateTime?       @map("undone_at")
  undoneBy     BigInt?         @map("undone_by")
  recordedBy   BigInt          @map("recorded_by")
  createdAt    DateTime        @default(now()) @map("created_at")

  match        TournamentMatch @relation(fields: [matchId], references: [id], onDelete: Cascade)

  @@index([matchId, undone])
  @@index([matchId, createdAt])
  @@index([tournamentId, teamId])
  @@map("match_events")
}
```

**TournamentMatch 모델 relation 추가**:
```prisma
// TournamentMatch 모델에 추가
matchEvents  match_events[]
```

**Tournament 모델 relation 추가**:
```prisma
// Tournament 모델에 추가
recorders    tournament_recorders[]
```

---

### §8.2 JWT recorder role 확장

<!-- [승인] -->

**파일**: `src/lib/auth/jwt.ts` (기존 수정)

```typescript
// JWT 페이로드 타입 확장
export interface JWTPayload {
  sub: string;          // userId
  role: string;         // 기존 role
  recorder_tournament_ids?: string[];  // 신규: 기록원으로 지정된 대회 ID 배열
  iat: number;
  exp: number;
}
```

**파일**: `src/lib/auth/require-recorder.ts` (신규)

```typescript
// 기록원 권한 검증 미들웨어
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";
import { cookies } from "next/headers";

export async function requireRecorder(tournamentId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;
  if (!token) return { error: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }) };

  const session = await verifyToken(token);
  if (!session) return { error: NextResponse.json({ error: "세션이 만료되었습니다." }, { status: 401 }) };

  // super_admin은 모든 대회 기록 가능
  if (session.role === "super_admin") return { session };

  const rec = await prisma.tournament_recorders.findFirst({
    where: { tournamentId, recorderId: BigInt(session.sub), isActive: true },
  });
  if (!rec) return { error: NextResponse.json({ error: "기록원 권한이 없습니다." }, { status: 403 }) };

  return { session };
}
```

---

### §8.3 신규 API 엔드포인트 (`/api/v1/`)

<!-- [승인] -->

#### T1. 기록원 담당 경기 목록

**파일**: `src/app/api/v1/recorder/matches/route.ts` (신규)

```
GET /api/v1/recorder/matches
Authorization: Bearer {JWT}

Response:
{
  "matches": [
    {
      "id": "123",
      "tournament_id": "abc",
      "tournament_name": "BDR컵 2026",
      "round_name": "4강",
      "status": "scheduled",
      "scheduled_at": "2026-03-10T10:00:00Z",
      "home_team": { "id": "1", "name": "Team A" },
      "away_team": { "id": "2", "name": "Team B" },
      "home_score": 0,
      "away_score": 0
    }
  ]
}
```

구현:
- JWT 검증 → recorder_tournament_ids OR DB에서 tournament_recorders 조회
- 해당 대회들의 TournamentMatch 목록 반환 (오늘 이후 + in_progress 포함)

---

#### T2. 경기 상태 변경 (시작/종료)

**파일**: `src/app/api/v1/matches/[matchId]/status/route.ts` (신규)

```
PATCH /api/v1/matches/{matchId}/status
Authorization: Bearer {JWT}
Body: { "status": "in_progress" | "completed", "winner_team_id"?: "123" }

Validation:
- status: "in_progress" 시 → 기존 VALID_TRANSITIONS 준수
- status: "completed" 시 → winner_team_id 필수
```

---

#### T3. 스탯 이벤트 입력

**파일**: `src/app/api/v1/matches/[matchId]/events/route.ts` (신규)

```
POST /api/v1/matches/{matchId}/events
Authorization: Bearer {JWT}
Body:
{
  "event_type": "score_3",
  "team_id": "1",
  "player_id": null,      // 선택
  "value": 3,
  "quarter": 2,
  "game_time": "05:32",
  "client_event_id": "uuid-v4"  // 오프라인 중복 방지용 idempotency key
}

Response: { "event": { "id": "456", ... } }

Validation:
- eventType: 허용 목록 검증
- value: score 이벤트 시 2/3/1만 허용
- quarter: 1~5
- team_id: 해당 match에 속한 팀인지 IDOR 검증
```

**오프라인 중복 방지**: `client_event_id` 기반 upsert 처리

---

#### T4. 이벤트 Undo

**파일**: `src/app/api/v1/matches/[matchId]/events/[eventId]/undo/route.ts` (신규)

```
PATCH /api/v1/matches/{matchId}/events/{eventId}/undo
Authorization: Bearer {JWT}

Response: { "event": { "id": "456", "undone": true, "undone_at": "..." } }

Validation:
- 이미 undone인 이벤트 재시도 → 400
- 다른 기록원의 이벤트 undo → 403 (본인 것만)
```

---

#### T5. 이벤트 목록 조회 (스코어보드용)

**파일**: `src/app/api/v1/matches/[matchId]/events/route.ts` — GET 추가

```
GET /api/v1/matches/{matchId}/events
인증 불필요 (완전 공개)

Response:
{
  "match": { "id": "123", "status": "in_progress", ... },
  "home_score": 32,
  "away_score": 28,
  "home_score_by_quarter": [8, 12, 7, 5],
  "away_score_by_quarter": [6, 10, 8, 4],
  "events": [
    { "id": "1", "event_type": "score_3", "team_id": "1", "quarter": 2, "game_time": "05:32", "undone": false, "created_at": "..." }
  ]
}
```

---

#### T6. 오프라인 일괄 동기화

**파일**: `src/app/api/v1/matches/[matchId]/events/batch/route.ts` (신규)

```
POST /api/v1/matches/{matchId}/events/batch
Authorization: Bearer {JWT}
Body: { "events": [ ...이벤트 배열... ] }

- client_event_id 기반 중복 제거
- created_at 순서로 저장
- 결과: { "created": 5, "skipped": 1 }
```

---

### §8.4 기록원 관리 API (웹)

<!-- [승인 ] -->

**파일**: `src/app/api/web/tournaments/[id]/recorders/route.ts` (신규)

```
GET    /api/web/tournaments/{id}/recorders   → 현재 기록원 목록
POST   /api/web/tournaments/{id}/recorders   → 기록원 추가 { "email_or_id": "..." }
DELETE /api/web/tournaments/{id}/recorders/[userId] → 기록원 제거
```

인증: `requireTournamentAdmin(id)` (기존 미들웨어)

---

### §8.5 mybdr 웹 관리 UI — 기록원 관리 탭

<!-- [승인 ] -->

**파일**: `src/app/(web)/tournament-admin/tournaments/[id]/recorders/page.tsx` (신규)

```
[기록원 관리]
┌─────────────────────────────────────┐
│ 기록원 추가                          │
│ [이메일 또는 회원 ID 입력]  [추가]   │
├─────────────────────────────────────┤
│ 현재 기록원 (2명)                    │
│                                     │
│  👤 홍길동 (hong@example.com)  [삭제] │
│  👤 김철수 (kim@example.com)   [삭제] │
└─────────────────────────────────────┘
```

**탭 추가**: `/tournament-admin/tournaments/[id]` 레이아웃의 사이드 메뉴에 "기록원 관리" 항목 추가

---

### §8.6 대회 사이트 라이브 스코어보드

<!-- [승인 ] -->

**파일**: `src/components/site-templates/classic/live-scoreboard.tsx` (신규)

```typescript
// Supabase Realtime 구독 → 라이브 스코어
"use client";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export function LiveScoreboard({ matchId, initialScore }: Props) {
  const [homeScore, setHomeScore] = useState(initialScore.home);
  const [awayScore, setAwayScore] = useState(initialScore.away);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel(`match:${matchId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "match_events",
        filter: `match_id=eq.${matchId}`,
      }, (payload) => {
        if (payload.new.undone) return;
        if (["score_2", "score_3", "free_throw"].includes(payload.new.event_type)) {
          if (payload.new.team_id === homeTeamId) {
            setHomeScore((s) => s + (payload.new.value ?? 0));
          } else {
            setAwayScore((s) => s + (payload.new.value ?? 0));
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchId]);

  return (
    <div className="flex items-center justify-center gap-8 text-4xl font-bold">
      <span>{homeScore}</span>
      <span className="text-[#9CA3AF]">:</span>
      <span>{awayScore}</span>
    </div>
  );
}
```

---

### §8.7 구현 태스크 체크리스트

#### Phase 1 — 핵심 파이프라인 (Must)

- [ ] T1: DB 마이그레이션 (`match_events`, `tournament_recorders`) + Prisma 스키마
- [ ] T2: `requireRecorder()` 미들웨어 (`src/lib/auth/require-recorder.ts`)
- [ ] T3: `POST /api/v1/matches/{id}/events` — 이벤트 입력
- [ ] T4: `PATCH /api/v1/matches/{id}/events/{eventId}/undo` — Undo
- [ ] T5: `GET /api/v1/matches/{id}/events` — 스코어보드 데이터
- [ ] T6: `GET /api/v1/recorder/matches` — 담당 경기 목록
- [ ] T7: `PATCH /api/v1/matches/{id}/status` — 경기 시작/종료

#### Phase 2 — 관리·실시간 (Should)

- [ ] T8: `GET/POST/DELETE /api/web/tournaments/{id}/recorders` — 기록원 관리 API
- [ ] T9: 기록원 관리 UI 페이지 (`/tournament-admin/[id]/recorders`)
- [ ] T10: `LiveScoreboard` 컴포넌트 (Supabase Realtime)
- [ ] T11: 대회 사이트 경기 목록 페이지에 스코어보드 통합

#### Phase 3 — 오프라인·완성도 (Nice)

- [ ] T12: `POST /api/v1/matches/{id}/events/batch` — 오프라인 일괄 동기화
- [ ] T13: `client_event_id` 기반 idempotency 처리 (중복 방지)
- [ ] T14: JWT `recorder_tournament_ids` 자동 갱신 (기록원 지정 시 토큰 갱신 트리거)

---

### §8.8 트레이드오프

- ✅ 이벤트 스트림 방식 → Undo, 타임라인 재현, 감사 로그 모두 가능
- ✅ Supabase Realtime → 웹소켓 서버 별도 구현 불필요, Vercel 제약 없음
- ✅ 쓰기 /api/v1 경유 → 인증/검증/IDOR 방어 서버에서 일관 처리
- ✅ MatchPlayerStat 미사용 → 스키마 단순화, 중복 집계 오류 위험 제거
- ⚠️ 집계 실시간 계산 → 이벤트 수 많아질수록 쿼리 비용 증가 (향후 집계 캐싱 검토)
- ⚠️ Supabase Realtime 공개 구독 → RLS 설정 필요 (읽기 전용 public 정책)
- ⚠️ 오프라인 큐 구현은 Flutter 앱 측 작업 (Next.js 범위 외)
- ⚠️ `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` 환경변수 추가 필요

---

*이 계획서는 Dev/research.md + 코드베이스 직접 분석 결과를 종합했습니다.*
*판단 미기입 항목(`<!-- [판단 주입] -->`)은 구현 전 의견 추가 필요.*

---

# 9. Subin 머지 계획 (전체)

> 작성일: 2026-03-23 (2차 정밀 분석 반영)
> 근거: `cobby8/my-bdr-subin` (master) vs `bdr-tech/mybdr` 전체 diff
> 상태: **⛔ 아직 구현하지마** — 판단 주석 작성 후 명시적 승인 필요
> 참고: OAuth 시스템(카카오/네이버/구글)은 **별도 프로젝트**로 분리
> Prisma 스키마: ✅ 두 레포 100% 동일 (1548줄, diff 0) — 마이그레이션 불필요

---

## §9.0 변경 요약

| Phase | 카테고리 | 신규 | 수정 | 난이도 | 유형 |
|-------|---------|------|------|--------|------|
| 1 | 컬러 시스템 교체 | 0 | ~80 | 낮음 | 디자인 |
| 2 | UI 컴포넌트 + 반응형 개선 | 1 | ~90 | 낮음 | 디자인 |
| 3 | 다크모드 + 텍스트 크기 토글 | 2 | 3 | 중간 | 기능+디자인 |
| 4 | 프로필 시스템 전면 개편 | 14 | 1 | **높음** | 기능 |
| 5 | 유저 공개 프로필 | 4 | 1 | 중간 | 기능 |
| 6 | Admin 시스템 재구조화 | 13 | 2 | **높음** | 기능 |
| 7 | 홈페이지 리디자인 + 사이드바 | 8 | 1 | 중간 | 기능+디자인 |
| 8 | 게임 위자드 + 목록 개편 | 5 | 6 | 중간 | 기능+디자인 |
| 9 | 대회 상세 + 참가 신청 | 7 | 2 | 중간 | 기능 |
| 10 | 팀/대회/커뮤니티 목록 개편 | 3 | ~10 | 중간 | 기능+디자인 |
| 11 | 선호 필터 + 지역/부 시스템 | 5 | 0 | 중간 | 기능 |
| 12 | 신규 API 엔드포인트 | 9 | 4 | 중간 | 기능 |
| 13 | 인증/미들웨어/서비스 변경 | 0 | 6 | **높음** | 핵심로직 |
| 14 | next.config + 메타데이터 | 1 | 2 | 낮음 | 설정 |
| — | ~~OAuth 시스템~~ | ~~8~~ | ~~3~~ | ~~높음~~ | ~~별도 프로젝트~~ |

**총계**: 신규 ~72개 파일 + 수정 ~120개 파일 (OAuth 제외)

---

## §9.1 Phase 1 — 컬러 시스템 교체

<!-- 전부 교체: mybdr에 엎어씌워 -->

### 변경 내용

전체 앱 컬러 팔레트 교체. ~200개 하드코딩 인스턴스.

| 요소 | 현재 (mybdr) | 변경 (subin) |
|------|-------------|-------------|
| Primary | `#0066FF` (Toss Blue) | `#1B3C87` (Navy) |
| Primary hover | `#0052CC` | `#142D6B` |
| Accent | `#F4A261` (Warm Orange) | `#E31B23` (Red) |
| Accent hover | — | `#C8101E` |
| Success | `#4ADE80` | `#16A34A` |
| Error | `#EF4444` | `#DC2626` |
| Warning | `#FBBF24` | `#D97706` |
| Info | `#60A5FA` | `#2563EB` |
| Background | `#F5F7FA` | `#F5F6FA` |
| Elevated | `#EEF2FF` | `#EDF0F8` |

### 구현 방법

1. `globals.css`의 CSS 변수값 업데이트
2. 컴포넌트 내 하드코딩된 hex값 → CSS 변수 참조로 리팩토링 (권장)
3. `rgba(0,102,255,...)` 등 투명도 변형도 치환 대상
4. site-templates의 동적 primaryColor/secondaryColor는 건드리지 않음

---

## §9.2 Phase 2 — UI 컴포넌트 + 반응형 개선

<!-- 전부 교체: mybdr에 엎어씌워 -->

### §9.2.1 Button (`src/components/ui/button.tsx`)
- 신규 `cta` variant (빨간색 `#E31B23`)
- `loading` prop + 스피너 애니메이션
- `active:scale-[0.97]` press effect
- 포커스 링 navy로 변경

### §9.2.2 Card (`src/components/ui/card.tsx`)
- 반응형 패딩: `p-5` → `p-4 sm:p-5`

### §9.2.3 Header (`src/components/shared/header.tsx`)
- 로고: 텍스트 "BDR" → `<img src="/images/logo.png">` (87px)
- 높이: `h-14` → `h-20`
- `profile_image` Next/Image 지원
- 모바일 하단 내비: active indicator → 빨간 top-line 바, 아이콘 22→24px
- ThemeToggle 항상 표시 (Phase 3 연결)

### §9.2.4 UserDropdown / SlideMenu / QuickMenu
- UserDropdown: 프로필 이미지 + 아바타+이름 나란히
- SlideMenu: 브랜드 orange→red, 로그인 blue→navy
- QuickMenu: 라벨 축약, "알림" 제거 (10→9개)

### §9.2.5 전체 페이지 반응형 (일괄)
- Heading: `text-2xl` → `text-xl sm:text-2xl`
- Card 패딩: `p-5` → `p-4 sm:p-5`
- 필터 터치: `min-h-[44px]`

### §9.2.6 메타데이터 / SEO / 에셋
- `layout.tsx`: `metadataBase`, OpenGraph, Twitter card
- `public/images/logo.png` 추가 필요

---

## §9.3 Phase 3 — 다크모드 + 텍스트 크기 토글

<!-- 전부 교체: mybdr에 엎어씌워 -->

### 신규 파일
| 파일 | 설명 |
|------|------|
| `src/components/shared/theme-toggle.tsx` | Sun/Moon 토글, localStorage 기반 |
| `src/components/shared/text-size-toggle.tsx` | 텍스트 크기 토글, `html.large-text` 클래스 + localStorage |

### 수정 파일
| 파일 | 변경 |
|------|------|
| `globals.css` | `html.dark` CSS 변수 오버라이드 블록 |
| `layout.tsx` | flash-free 인라인 스크립트, `suppressHydrationWarning` |
| `header.tsx` | `<ThemeToggle />` 삽입 |

### ⚠️ 다크모드 구현 방식 주의
subin은 `html.dark [class*="bg-[#FFFFFF]"]` + `!important`로 오버라이드함 (취약).
**권장**: Phase 1에서 CSS 변수 통합 후, 변수 오버라이드만으로 다크모드 처리.

---

## §9.4 Phase 4 — 프로필 시스템 전면 개편 ⭐

<!-- 전부 교체: mybdr에 엎어씌워 -->

### 신규 파일 (14개)

**프로필 컴포넌트** (`src/app/(web)/profile/_components/`):
| 파일 | 설명 |
|------|------|
| `profile-header.tsx` | 아바타, **티어 배지** (ROOKIE/BRONZE/SILVER/GOLD/PLATINUM), 포지션, 도시, 총경기+승률 |
| `radar-chart.tsx` | SVG 레이더 차트 (라이브러리 없음, 6축/5축 지원) |
| `ability-section.tsx` | 2열: 레이더 차트 + 6개 프로그레스 바 (스탯 정규화 0-100) |
| `stat-bars.tsx` | PPG/RPG/APG 3카드 스탯 |
| `current-team-card.tsx` | 현재 소속팀 카드 (역할, 팀컬러) |
| `recent-games-section.tsx` | 최근 5경기 리스트 |
| `activity-ring.tsx` | 월별 도전 위젯 (conic-gradient, Bronze/Silver/Gold 마일스톤) |
| `player-info-section.tsx` | 포지션/키/도시 + 바이오 |
| `teams-section.tsx` | 소속팀 목록 |
| `tournaments-section.tsx` | 참가 대회 목록 |
| `section-wrapper.tsx` | 재사용 카드 래퍼 |

**온보딩 플로우** (신규):
| 파일 | 설명 |
|------|------|
| `profile/complete/page.tsx` | **온보딩 페이지** — 이름, 전화, RegionPicker, 포지션, 키/몸무게, AI 바이오 생성, `profile_completed: true` |
| `profile/complete/preferences/page.tsx` | 온보딩 선호 설정 (PreferenceForm, "onboarding" 모드) |
| `profile/preferences/page.tsx` | 일반 선호 설정 (PreferenceForm, "settings" 모드) |

### 수정 파일
| 파일 | 변경 |
|------|------|
| `profile/page.tsx` | **완전 재작성** — 탭 기반 → 컴포넌트 기반. SWR로 `/api/web/profile` + `/api/web/profile/stats` 호출 |

### 의존성
- `/api/web/profile/stats` API (Phase 12)
- `/api/web/profile/generate-bio` API (Phase 12) — **GEMINI_API_KEY 필요**
- RegionPicker (Phase 11)
- PreferenceForm (Phase 11)

---

## §9.5 Phase 5 — 유저 공개 프로필

<!-- 전부 교체: mybdr에 엎어씌워 -->

### 신규 파일 (4개)
`src/app/(web)/users/[id]/_components/`:
| 파일 | 설명 |
|------|------|
| `action-buttons.tsx` | "메시지 보내기" + "팔로우" (준비중 alert) |
| `user-radar-section.tsx` | 5축 펜타곤 레이더 (SHOOTING/PACE/PASSING/DEFENSE/DRIBBLE) |
| `user-recent-games.tsx` | 최근 5경기 테이블 (PTS/AST/REB) |
| `user-stats-section.tsx` | 4카드 평균 스탯 + 프로그레스 바 |

### 수정 파일
| 파일 | 변경 |
|------|------|
| `users/[id]/page.tsx` | **완전 재작성** — `Promise.all` 3쿼리 (유저정보 + 커리어 평균 aggregate + 최근5경기). 2열 헤더 + 티어배지 + MVP 하이라이트 |

---

## §9.6 Phase 6 — Admin 시스템 재구조화 ⭐

<!-- 전부 교체: mybdr에 엎어씌워 -->

### 핵심 변경: Route Group 이동
- **현재**: `src/app/(web)/admin/` (web 레이아웃 공유)
- **변경**: `src/app/(admin)/admin/` (독립 route group + 전용 레이아웃)

### 신규 파일 (13개)
| 파일 | 설명 |
|------|------|
| `(admin)/admin/layout.tsx` | 서버컴포넌트, `getWebSession()` + `super_admin` 체크, `AdminSidebar` + `lg:ml-64` |
| `(admin)/admin/page.tsx` | 대시보드 — 유저/대회/경기/팀 수 `Promise.all` 쿼리 |
| `(admin)/admin/users/page.tsx` | 유저 목록 (50/page, 검색, 슈퍼어드민 수) |
| `(admin)/admin/users/admin-users-table.tsx` | 클릭→모달, 탭(info/edit), 역할변경, 상태토글, **위험 작업**(강퇴/영구삭제) |
| `(admin)/admin/users/admin-user-actions.tsx` | 인라인 confirm/cancel |
| `(admin)/admin/settings/page.tsx` | 유지보수 모드 토글 + 캐시 클리어 |
| `(admin)/admin/payments/page.tsx` | 결제 목록 + 통계 (총건수/결제완료/총액) |
| `(admin)/admin/plans/page.tsx` | 요금제 CRUD, 프로모션 관리 |
| `(admin)/admin/logs/page.tsx` | 활동 로그 (날짜 그룹, KST, 마크다운 내보내기, severity) |
| `(admin)/admin/suggestions/page.tsx` | 건의사항 목록 |
| `(admin)/admin/tournaments/page.tsx` | 대회 관리 (상태 전이, 운영자 정보) |
| `(admin)/admin/analytics/page.tsx` | 월별 가입 차트 (bar chart, raw SQL 6개월) |
| `(admin)/admin/loading.tsx` | 스켈레톤 |

### 수정 파일
| 파일 | 변경 |
|------|------|
| `components/admin/sidebar.tsx` | 이모지→Material Symbols 아이콘, 흰배경→다크(#111111), "BDR SPORTS" + red Admin 배지 |
| `actions/admin-users.ts` | 서버 액션 추가 (역할변경, 상태변경, 어드민토글, 강퇴, 삭제) |

### ⚠️ 주의사항
- 기존 `(web)/admin/` 페이지와 **중복** — 기존 것 삭제 필요
- 서버 액션(`admin-users.ts`)이 확장됨 — mybdr 현재 버전과 diff 확인 필요

---

## §9.7 Phase 7 — 홈페이지 리디자인 + 사이드바

<!-- 전부 교체: mybdr에 엎어씌워 -->

### 신규 파일 (8개)
| 파일 | 설명 |
|------|------|
| `components/home/hero-section.tsx` | 로그인/비로그인 분기 히어로 |
| `components/home/personal-hero.tsx` | 5슬라이드 캐러셀 (391줄) |
| `components/home/hero-bento.tsx` | YouTube 슬라이더 (자동5초, LIVE감지, autoplay) |
| `components/home/recommended-games.tsx` | 스마트 추천 그리드 |
| `components/home/recommended-videos.tsx` | YouTube 추천 비디오 4카드 |
| `components/home/notable-teams.tsx` | 주목할 팀 Top 4 |
| `components/home/right-sidebar-logged-in.tsx` | 로그인 우측 사이드바 (오늘경기/내스탯/랭킹/커뮤니티) |
| `components/home/right-sidebar-guest.tsx` | 비로그인 우측 사이드바 (CTA/기능소개/경기/성장/랭킹/커뮤니티) |

### 수정 파일
| 파일 | 변경 |
|------|------|
| `(web)/page.tsx` | 202줄→~20줄. `<HeroSection />` + `<QuickMenu />` + `<RecommendedGames />` + Right Sidebar |

### 사이드바 API 의존성
- `right-sidebar-logged-in.tsx`: `/api/web/profile/stats`, `/api/web/teams`, `/api/web/community` 호출
- `right-sidebar-guest.tsx`: 동일 API들 (Promise.allSettled + fallback)
- `hero-bento.tsx` / `recommended-videos.tsx`: `/api/web/youtube/recommend` — **YOUTUBE_API_KEY 필요**

---

## §9.8 Phase 8 — 게임 위자드 + 목록 개편

<!-- 전부 교체: mybdr에 엎어씌워 -->

### 신규 파일 (5개)
| 파일 | 설명 |
|------|------|
| `games/_components/game-card-compact.tsx` | 3카드 → 1통합 카드 (유형별 보더 색, 진행률 바, 실력배지) |
| `games/_components/games-content.tsx` | 게임 목록 컨텐츠 래퍼 |
| `games/[id]/_components/participants-grid.tsx` | 참가자 그리드 |
| `games/[id]/_components/host-card.tsx` | 호스트 정보 카드 |
| `games/[id]/_components/price-card.tsx` | 참가비 카드 |
| `games/[id]/_components/hero-banner.tsx` | 경기 상세 히어로 배너 |

### 수정 파일 (6개)
| 파일 | 변경 |
|------|------|
| `game-wizard.tsx` | 4단계→3단계, endTime 필드 |
| `step-type.tsx` | 라벨 축약, 3열 그리드, 선택시 자동 다음단계 |
| `step-when-where.tsx` | TimePicker, 프리셋 저장, 실력 셀렉터(7단계), AdvancedSettings |
| `games/page.tsx` | 3카드→GameCardCompact, `grid-cols-2` (모바일 항상 2열), 원형 아이콘 버튼 |
| `games-filter.tsx` | 접이식 패널, Search/X, "전체 해제", outside-click-to-close |
| `games/[id]/page.tsx` | 프로필 완료 체크 `profile_completed` → `getMissingFields()` 실시간 검증 |

---

## §9.9 Phase 9 — 대회 상세 + 참가 신청

<!-- 전부 교체: mybdr에 엎어씌워 -->

### 신규 파일 (7개)
| 파일 | 설명 |
|------|------|
| `tournaments/[id]/join/page.tsx` | **4단계 참가 위자드** (팀선택→부/카테고리→로스터/유니폼→확인). 부별 상한, 대기, 등번호 검증 |
| `tournaments/[id]/_components/tournament-hero.tsx` | 풀폭 히어로 (그라데이션, 상태/형식 배지) |
| `tournaments/[id]/_components/tournament-sidebar.tsx` | 참가비, 부별 진행률 바, Google Calendar, D-day 카운트다운, 입금 정보 |
| `tournaments/[id]/_components/tournament-about.tsx` | 설명 파서 (keyvalue/numbered/bullets/prizes/sponsors 섹션) |
| `tournaments/[id]/bracket/_components/group-standings.tsx` | 조별 순위표 |
| `tournaments/[id]/bracket/_components/finals-sidebar.tsx` | 결승 사이드바 |
| `tournaments/[id]/bracket/_components/tournament-dashboard-header.tsx` | 대회 대시보드 헤더 |

### 수정 파일
| 파일 | 변경 |
|------|------|
| `tournaments/[id]/page.tsx` | 상세 페이지 확장 (hero + sidebar + about 컴포넌트 적용) |
| `tournaments/[id]/bracket/page.tsx` | 대진표 페이지 확장 |

### 대회 관리 컴포넌트 (신규 3개)
| 파일 | 설명 |
|------|------|
| `components/tournament/registration-settings-form.tsx` | 접수 설정 폼 |
| `components/tournament/team-settings-form.tsx` | 팀 설정 폼 |
| `components/tournament/schedule-form.tsx` | 일정 설정 폼 |

---

## §9.10 Phase 10 — 팀/대회/커뮤니티 목록 개편

<!-- 전부 교체: mybdr에 엎어씌워 -->

### 신규 파일
| 파일 | 설명 |
|------|------|
| `teams/_components/teams-content.tsx` | 팀 목록 컨텐츠 래퍼 |
| `tournaments/_components/tournaments-content.tsx` | 대회 목록 컨텐츠 래퍼 |
| `community/_components/community-content.tsx` | 커뮤니티 목록 래퍼 |
| `community/_components/community-sidebar.tsx` | 커뮤니티 사이드바 |
| `community/[id]/_components/share-button.tsx` | 공유 버튼 |
| `community/[id]/_components/post-detail-sidebar.tsx` | 게시글 상세 사이드바 |

### 주요 수정 패턴 (팀/대회/커뮤니티 공통)
- 서버→클라이언트 전환 (SWR 데이터 페칭)
- 선호 필터 연동 (Phase 11)
- 목록 페이지 레이아웃 변경 (사이드바 추가)
- 필터 UI 개편

---

## §9.11 Phase 11 — 선호 필터 + 지역/부 시스템

<!-- 전부 교체: mybdr에 엎어씌워 -->

### 신규 파일 (5개)
| 파일 | 설명 |
|------|------|
| `src/contexts/prefer-filter-context.tsx` | 전역 선호 필터 Context (페이지 변경 시 DB 기본값 리셋, 로그인 인식) |
| `src/components/shared/preference-form.tsx` | 공유 선호 설정 폼 (부/경기유형/게시판 카테고리 멀티셀렉트, 칩 UI) |
| `src/components/shared/region-picker.tsx` | 다중 지역 선택 (최대 3개, 시도→구군 캐스케이딩, **Geolocation + Nominatim 역지오코딩**) |
| `src/lib/constants/regions.ts` | 한국 전체 시도→구군 매핑 (17개 시도) |
| `src/lib/constants/divisions.ts` | BDR 부 시스템 (D3-D8, i/U/S/W시리즈), 카테고리/성별 필터 유틸 |

### 의존 관계
- Phase 4 (프로필 온보딩)에서 RegionPicker, PreferenceForm 사용
- Phase 10 (목록 페이지)에서 PreferFilterContext 사용
- Phase 12 (`/api/web/preferences`) 에서 선호도 저장/조회

---

## §9.12 Phase 12 — 신규 API 엔드포인트

<!-- 전부 교체: mybdr에 엎어씌워 -->

### 신규 API (9개)
| 엔드포인트 | 메서드 | 설명 | 환경변수 |
|-----------|--------|------|---------|
| `/api/web/dashboard` | GET | 대시보드 병렬 쿼리 (다음경기/스탯/팀/대회/추천) | — |
| `/api/web/recommended-games` | GET | 스마트 추천 (패턴 스코어링/도시 폴백/최신) | — |
| `/api/web/profile/stats` | GET | 플레이어 통계 (커리어 avg + 시즌 하이 + 승률) | — |
| `/api/web/profile/generate-bio` | POST | **AI 바이오 생성** (Gemini 2.5 Flash) | `GEMINI_API_KEY` |
| `/api/web/youtube/recommend` | GET | YouTube 추천 (BDR 채널, 스코어링, 5-30분 캐시) | `YOUTUBE_API_KEY`, `BDR_YOUTUBE_UPLOADS_PLAYLIST_ID` |
| `/api/web/preferences` | GET/PATCH | 선호 설정 (부/게시판/경기유형) | — |
| `/api/web/teams` | GET | 공개 팀 목록 (검색/도시/승수 정렬, BigInt 직렬화) | — |
| `/api/web/check-duplicate` | GET | 이메일/닉네임 중복 확인 | — |
| `/api/web/community` | GET | 커뮤니티 목록 (카테고리/검색/선호필터) | — |
| `/api/web/games` | GET | 경기 목록 (검색/유형/도시/날짜/선호필터) | — |
| `/api/web/tournaments/[id]/join` | GET/POST | **대회 참가 신청** (부 상한, 대기, 트랜잭션, 알림) | — |

### 수정된 기존 API (4개)
| 엔드포인트 | 변경 |
|-----------|------|
| `/api/web/me` | `profile_image`/`profile_image_url` DB 조회 추가 |
| `/api/web/profile` | 응답 필드 옵셔널화 (`teams?`, `recent_games?`) |
| `/api/v1/matches/[id]/stats` | 기능 변경 확인 필요 |
| `/api/web/tournaments/[id]/matches/[matchId]` | 기능 변경 확인 필요 |

### DB 컬럼 의존성 (선호 필터)
subin의 preferences API가 참조하는 컬럼 — 스키마 확인 결과:
- ✅ `users.preferred_divisions` (JSON) — 존재 + GIN 인덱스
- ✅ `users.preferred_board_categories` (JSON) — 존재
- ✅ `users.profile_completed` (Boolean) — 존재 + 인덱스
- ❌ `users.preferred_game_types` (JSON) — **미존재, 마이그레이션 필요**
- ❌ `users.prefer_filter_enabled` (Boolean) — **미존재, 마이그레이션 필요**
- ❌ `users.onboarding_step` (Integer) — **미존재, 마이그레이션 필요**

→ Phase 11/12 착수 전 Prisma 마이그레이션 3건 추가 필수.

---

## §9.13 Phase 13 — 인증/미들웨어/서비스 변경 ⭐

<!-- 전부 교체: mybdr에 엎어씌워 -->

### §9.13.1 `src/app/actions/auth.ts` (충돌 위험: 높음)

| 항목 | 현재 (mybdr) | 변경 (subin) |
|------|-------------|-------------|
| 쿠키 secure | `secure: true` 항상 | `secure: isProduction` (dev에서 false) |
| 가입 검증 | 기본만 | passwordConfirm, 닉네임 2-20자, 비번 복잡도(문자+숫자+특수문자), 닉네임 중복체크(대소문자 무관) |
| 가입 후 리다이렉트 | `/` | `/profile/complete` (온보딩) |
| devLoginAction | 없음 | 추가 (첫 active 유저로 자동로그인, dev 전용) |

### §9.13.2 `src/proxy.ts` (충돌 위험: 높음)

- `processRequest()` 헬퍼 함수 **제거** → 인라인으로 전환
- 이유: "Next.js 16 proxy에서 blocking 이슈"
- API v1 토큰 체크는 인라인으로 이동

### §9.13.3 `src/lib/services/user.ts`

추가된 함수:
- `getPlayerStats()` — matchPlayerStat aggregate (커리어 평균 + 시즌 하이 + **승률 계산**)
- `getMonthlyGames()` — 이번 달 승인된 game_applications 카운트
- `PROFILE_DETAIL_SELECT`에 `createdAt` 추가

### §9.13.4 `src/lib/services/game.ts`
- 게임 목록/도시 목록 함수 변경 확인 필요

### §9.13.5 `src/lib/services/tournament.ts`
- 대회 서비스 변경 확인 필요

### §9.13.6 `src/lib/profile/completion.ts`
- 프로필 완료도 체크 로직 변경

---

## §9.14 Phase 14 — next.config + 메타데이터

<!-- 전부 교체: mybdr에 엎어씌워 / 단 oauth관련 내용은 보류 -->

### next.config.ts 변경
| 항목 | 현재 | 변경 |
|------|------|------|
| CSP style-src | `self unsafe-inline` | + `https://fonts.googleapis.com` |
| CSP font-src | `self data:` | + `https://fonts.gstatic.com` |
| CSP frame-src | 카카오 우편번호만 | + `accounts.google.com`, `nid.naver.com`, `kauth.kakao.com`, YouTube |
| images.remotePatterns | 없음 | kakaocdn, pstatic, googleusercontent 추가 |

⚠️ frame-src의 OAuth 관련 도메인은 OAuth 별도 프로젝트와 겹침 — YouTube만 먼저 적용 가능

---

## §9.15 예상 문제점 및 대응

### 🔴 높음

| 문제 | 설명 | 대응 |
|------|------|------|
| auth.ts 행동 변경 | 쿠키 보안, 가입 플로우, 리다이렉트가 모두 바뀜 | 항목별 선택 적용. devLoginAction은 dev 환경 전용 확인 |
| proxy.ts 구조 변경 | processRequest 제거. mybdr도 수정했을 수 있음 | 양쪽 diff 비교 후 subin 방식 채택 여부 판단 |
| Admin route group 이동 | `(web)/admin/` → `(admin)/admin/` — 기존 페이지와 중복 | 기존 `(web)/admin/` 삭제 후 subin 구조 적용 |
| 프로필 페이지 완전 재작성 | 기존 탭 UI 전부 폐기 | subin 버전 채택, 컴포넌트 14개 일괄 복사 |
| users/[id] 완전 재작성 | 새 쿼리 3개 + 컴포넌트 4개 | subin 버전 채택 |

### 🟡 중간

| 문제 | 설명 | 대응 |
|------|------|------|
| 선호 필터 DB 컬럼 | 5개 중 3개 누락 확인 (`preferred_game_types`, `prefer_filter_enabled`, `onboarding_step`) | **마이그레이션 3건 추가 필수** (Phase 11 전) |
| 환경변수 3개 필요 | `GEMINI_API_KEY`, `YOUTUBE_API_KEY`, `BDR_YOUTUBE_UPLOADS_PLAYLIST_ID` | 없으면 해당 기능 비활성화 (fallback 존재) |
| (web)/layout.tsx 변경 | 사이드바/선호필터 Context 추가됨 | mybdr 현재 레이아웃과 수동 머지 |
| 대회 참가 API 의존성 | `createNotification`, `NOTIFICATION_TYPES` import | mybdr 알림 시스템과 호환 확인 |

### 🟢 낮음 (해결됨)

| 문제 | 상태 |
|------|------|
| Prisma 스키마 불일치 | ✅ 100% 동일 확인 |
| 로고 에셋 | subin에서 복사 |
| package.json | mybdr 기준 유지 |

---

## §9.16 실행 순서 권고

```
Phase 1 (컬러) ──→ Phase 2 (UI/반응형) ──→ Phase 3 (다크모드)
      │
      ├──→ Phase 11 (선호필터/지역/부) ──→ Phase 12 (API) ──→ Phase 14 (config)
      │
      ├──→ Phase 13 (auth/proxy/서비스) ← 가장 먼저 검토, 가장 신중하게
      │
      ├──→ Phase 4 (프로필) ──→ Phase 5 (유저 프로필)
      │
      ├──→ Phase 6 (Admin) ← 독립 작업 가능
      │
      ├──→ Phase 7 (홈) ──→ Phase 8 (게임)
      │
      └──→ Phase 9 (대회) ──→ Phase 10 (목록 개편)
```

### 추천 실행 그룹

**Group A (기반)**: Phase 1 → 2 → 3 → 14 (컬러/UI/다크모드/config)
**Group B (핵심 로직)**: Phase 13 (auth/proxy) — 가장 먼저 리뷰, 가장 신중하게
**Group C (시스템)**: Phase 11 → 12 (선호필터 + API)
**Group D (페이지)**: Phase 4 → 5 → 7 → 8 → 9 → 10 (프로필/홈/게임/대회/목록)
**Group E (Admin)**: Phase 6 — 독립 진행 가능

각 Phase 완료 후 `next build` 검증 필수.

---

## §9.17 제외 항목 (별도 프로젝트)

| 항목 | 파일 수 | 사유 |
|------|---------|------|
| OAuth 시스템 (카카오/네이버/구글) | 8 신규 + 3 수정 | NextAuth v5와 인증 체계 충돌 |
| `/verify` 전화번호 인증 | 3 신규 | OAuth 의존 |
| Dev 로그인 액션 | 1 수정 | OAuth 의존 (단, Phase 13에서 별도 검토 가능) |
| OAuth용 CSP frame-src | — | YouTube는 Phase 14에서 적용, OAuth 도메인은 별도 |

### 필요 환경변수 총정리
| 변수 | 용도 | 필수 |
|------|------|------|
| `GEMINI_API_KEY` | AI 바이오 생성 (Phase 4) | 선택 (없으면 기능 비활성) |
| `YOUTUBE_API_KEY` | YouTube 추천 (Phase 7) | 선택 (없으면 더미 데이터) |
| `BDR_YOUTUBE_UPLOADS_PLAYLIST_ID` | YouTube 채널 ID | 선택 |
| `PRISMA_LOG` | Prisma 쿼리 로깅 (Phase 13) | 선택 (dev에서만) |

---

## §9.18 3차 정밀 검수 — 추가 발견 사항

> 작성일: 2026-03-23
> 전수 파일 비교 (subin 336파일 vs mybdr 261파일, 공통 248파일 중 diff 있는 127파일 전체 분석)

### §9.18.1 🔴 핵심 발견: FIBA 게임 규칙 ↔ 대회 접수 설정 교체

**mybdr에만 있고 subin이 삭제한 파일 2개**:
- `src/lib/constants/game-rules-defaults.ts` — FIBA 게임 규칙 상수 (쿼터 타이밍, 샷클락, 파울, 타임아웃, 득점)
- `src/lib/validation/game-rules.ts` — 게임 규칙 Zod 스키마

**subin이 이걸 대체한 내용**:
- 대회 위자드 Step 3: 게임 규칙 편집 → **접수 설정** (카테고리, 부별 상한/참가비, 계좌정보, 대기명단)
- `tournament.ts` 서비스: `game_rules` → registration 설정 (categories, div_caps, div_fees, bank 정보)
- `tournament.ts` validation: `gameRulesSchema` → registration 설정 스키마
- `/api/web/tournaments/[id]` PATCH: `game_rules` 필드 → registration 설정 필드

⚠️ **판단 필요**: FIBA 규칙 시스템을 버릴 것인가, 접수 설정과 공존시킬 것인가?

<!-- 전부 교체: mybdr에 엎어씌워 -->

### §9.18.2 🔴 (web)/layout.tsx 완전 재작성

| 항목 | 현재 mybdr | subin |
|------|-----------|-------|
| 줄 수 | ~19줄 | ~399줄 |
| 네비게이션 | Header 컴포넌트만 import | **전체 인라인**: 데스크탑 사이드바 + 모바일 하단바 + FAB |
| 아이콘 | Lucide React | Material Symbols Outlined (폰트) |
| Context | 없음 | `PreferFilterProvider` 래핑 |
| 슬라이드메뉴 | Header 내부 | layout에서 직접 렌더 |
| ThemeToggle | 없음 | 사이드바 하단 |
| TextSizeToggle | 없음 | 사이드바 하단 |

이건 Header 컴포넌트를 사실상 대체하는 수준. **기존 Header와의 관계 정리 필요**.

<!-- 전부 교체: mybdr에 엎어씌워 -->

### §9.18.3 대회 관리 위자드 대폭 변경

**기존 위자드** (`tournament-admin/tournaments/new/wizard/page.tsx`):
- 5단계: 템플릿 → 정보 → URL → 디자인 → 미리보기

**subin 위자드**:
- 7단계: 템플릿 → 정보 → **일정** → **접수설정** → **팀설정** → 디자인 → 미리보기
- 공유 컴포넌트 3개: `ScheduleForm`, `RegistrationSettingsForm`, `TeamSettingsForm`
- `autoCalcMaxTeams` 로직 (부별 상한 합계 자동 계산)
- 부별 참가비, 계좌정보, 대기명단 설정

**수정 위자드** (`tournaments/[id]/wizard/page.tsx`) 도 동일 구조로 변경됨.

<!-- 전부 교체: mybdr에 엎어씌워 -->

### §9.18.4 알림 시스템 확장

subin이 추가한 알림 발송 로직:
| 위치 | 트리거 | 수신자 |
|------|--------|--------|
| `/api/v1/matches/[id]/status` | 경기 취소 시 | 양팀 전체 선수 (bulk) |
| `/api/web/tournaments/[id]/matches/[matchId]` | 경기 취소 시 | 양팀 전체 선수 (bulk) |
| `/api/web/teams/[id]/join` | 팀 가입 신청 시 | 팀 캡틴 |
| `lib/notifications/types.ts` | — | `TOURNAMENT_JOIN_SUBMITTED`, `TOURNAMENT_JOIN_RECEIVED` 타입 추가 |

<!-- 전부 교체: mybdr에 엎어씌워 -->

### §9.18.5 로그인 페이지 이메일 로그인 추가

- 현재 mybdr: OAuth 전용 (Kakao/Google 버튼)
- subin: OAuth + **이메일/비밀번호 로그인 모달** (`loginAction` 서버 액션), body scroll lock

※ OAuth는 별도 프로젝트이지만, 이메일 로그인은 독립 기능으로 적용 가능

<!-- 전부 교체: mybdr에 엎어씌워 -->

### §9.18.6 커뮤니티/팀 목록 → 클라이언트 컴포넌트 전환

| 페이지 | 현재 mybdr | subin |
|--------|-----------|-------|
| `community/page.tsx` | 서버 컴포넌트 (직접 Prisma 쿼리) | `<Suspense>` + `<CommunityContent>` 클라이언트 |
| `teams/page.tsx` | 서버 컴포넌트 (직접 Prisma 쿼리) | `<Suspense>` + `<TeamsContent>` 클라이언트 |
| `tournaments/page.tsx` | 서버 컴포넌트 | `<Suspense>` + `<TournamentsContent>` 클라이언트 |

**이유**: 선호 필터 Context 연동 + SWR 클라이언트 데이터 페칭. 서버→클라이언트 아키텍처 전환.

### §9.18.7 팀 상세 기능 추가

| 항목 | 변경 |
|------|------|
| `teams/[id]/page.tsx` | `computeDivision` 함수 (GOLD/ROOKIE 배지), Material Symbols 아이콘 탭 |
| `overview-tab.tsx` | 사전 계산된 `team` prop (중복 DB쿼리 제거), `topMembers` 쿼리 |
| `games-tab.tsx` | 경기 행 클릭 가능 (Link 추가) |
| `join-button.tsx` | **Web Share API** 공유 버튼 + 대전 신청 플레이스홀더 |
| `teams-filter.tsx` | **정렬 옵션** (랭킹/최신/승률), `totalCount` prop, 탭 스타일 UI |

### §9.18.8 API 기능 변경 상세

| API | 변경 |
|-----|------|
| `/api/web/me` | DB 쿼리 추가 (`profile_image`, `prefer_filter_enabled` 반환) |
| `/api/web/tournaments` | **GET 핸들러 추가** (공개 대회 목록 + 선호 필터) |
| `/api/v1/matches/[id]/stats` | 간소화: match/quarterScores 쿼리 제거, 스탯만 반환 |
| `/api/v1/tournaments/[id]/matches/sync` | `Promise.allSettled` 병렬화 + `postProcessStatus` 응답 |
| `actions/admin-users.ts` | **`forceWithdrawUserAction`** 추가 (개인정보 익명화 + 탈퇴 처리) |
| `actions/teams.ts` | `crypto.randomUUID()` → `node:crypto`, 멤버 상태 `"active"` → `"approved"` |

### §9.18.9 기반 인프라 변경

| 파일 | 변경 |
|------|------|
| `lib/db/prisma.ts` | 쿼리 로깅 `PRISMA_LOG=true` 환경변수 제어 (기본 off) |
| `lib/admin/log.ts` | `"critical"` severity 추가 |
| `lib/profile/completion.ts` | `district` 필수 제거 (city만 필요) |
| `app/layout.tsx` | Space Grotesk + Pretendard CDN + Material Symbols 폰트 추가 |
| `app/manifest.ts` | 디자인 변경만 |
| `globals.css` | 전체 CSS 변수 시스템 재설계 (다크모드 기본 cool gray + BDR Red) |

### §9.18.10 "디자인만" 확인된 파일 (기능 변경 없음)

다음 파일들은 컬러/반응형/레이아웃만 변경, 로직 변경 없음 확인:
- tournament-admin: matches, site, bracket, [id]/page, tournaments/page, layout, loading, templates, series/*
- privacy, terms, signup
- community: comment-form, loading, new
- teams: manage, team-card, new-team-form, loading, tournaments-tab, roster-tab (minor)
- pricing (page, checkout, success, fail), upgrade, notifications
- courts/[id], offline
- site-templates/classic.tsx
- manifest.ts

---

## §9.19 최종 전수 통계

### 파일 수
| 구분 | 수 |
|------|-----|
| subin 전체 src 파일 | 336 |
| mybdr 전체 src 파일 | 261 |
| subin에만 있는 신규 파일 | **88** |
| mybdr에만 있는 파일 (subin 삭제/이동) | **13** |
| 공통 파일 중 diff 있는 파일 | **127** |
| 공통 파일 중 동일 | 121 |

### 삭제된 파일 정리
| 파일 | 사유 |
|------|------|
| `(web)/admin/*.tsx` (11개) | `(admin)/admin/`으로 이동 |
| `lib/constants/game-rules-defaults.ts` | 접수 설정으로 교체 |
| `lib/validation/game-rules.ts` | 접수 설정 스키마로 교체 |

### 변경 분류 최종
| 분류 | 파일 수 |
|------|---------|
| 기능 변경 (로직/API/쿼리) | ~45 |
| 디자인만 (컬러/반응형/레이아웃) | ~82 |
| 완전 재작성 | ~8 |
| OAuth (별도 프로젝트) | ~11 |

### 판단 필요 항목 요약
1. ⭐ FIBA 게임 규칙 삭제 vs 접수 설정 공존 (§9.18.1)
2. ⭐ (web)/layout.tsx 완전 재작성 + Header 관계 (§9.18.2)
3. ⭐ 대회 위자드 5단계→7단계 (§9.18.3)
4. 이메일 로그인 (OAuth와 별개로 적용 가능) (§9.18.5)
5. 서버→클라이언트 아키텍처 전환 (§9.18.6)
6. `/api/v1/matches/[id]/stats` 간소화 — Flutter 앱 호환성 (§9.18.8)

---

## §9.20 4차 최종 검수 — byte-level 전수조사 결과

> 작성일: 2026-03-23
> 방법: 공통 248파일 전체 `diff -u` → 컬러/반응형 필터링 후 기능변경만 추출 (11,412줄 분석)

### §9.20.1 3차에서 누락된 기능 변경

#### 🔴 Flutter API 호환성 (mybdr이 subin보다 앞서 있는 부분)

<!-- Flutter API 관련 부분 : 보류 -->

mybdr에는 있지만 subin에는 **없는** 최근 변경사항 (mybdr이 subin 포크 이후 추가한 것):

| 파일 | mybdr 추가분 | 영향 |
|------|-------------|------|
| `/api/v1/tournaments/[id]/full-data` | `game_rules` 필드 반환 추가 | ⚠️ Flutter bdr_stat 앱이 game_rules에 의존 |
| `/api/v1/tournaments/[id]/full-data` | `user_name`: `name ?? nickname` 으로 확장, `user_nickname` 별도 반환, `is_active: true` 추가 | ⚠️ Flutter 앱 선수 표시 로직에 영향 |
| `/api/v1/tournaments/verify` | `game_rules: true` select 추가 | Flutter verify 응답에 game_rules 포함 |
| `lib/constants/tournament-status.ts` | `in_progress` 키 삭제 (mybdr), subin에는 아직 있음 | subin 버전 적용 시 중복 키 주의 |

**⚠️ 핵심**: subin 버전으로 덮어쓰면 mybdr이 최근 추가한 Flutter API 필드들(`game_rules`, `user_name` 확장, `user_nickname`, `is_active`)이 **사라짐**. 반드시 수동 머지 필요.

<!-- 전부 교체: mybdr에 엎어씌워 -->

#### 🟡 SlideMenu 네비 구조 변경

| 항목 | mybdr | subin |
|------|-------|-------|
| 메뉴 구조 | Rails `_full_menu.html.erb` 복제, `menuSections` 객체 (boards/etc) | `menuItems` 배열, Material Symbols 아이콘 |
| import | 없음 | `usePathname`, `ThemeToggle`, `TextSizeToggle` 추가 |
| 게시판 | 카테고리별 링크 (자유/정보/후기/장터) | 단순 "커뮤니티" 1개 |

#### 🟡 커뮤니티 상세 페이지 기능 추가

`community/[id]/page.tsx`: subin이 `PostDetailSidebar`, `ShareButton`, `formatRelativeTime`, `Metadata` generation, 카테고리 breadcrumbs 추가

#### 🟡 게임 상세 섹션 UI 리팩토링

`pickup-detail.tsx`, `guest-detail.tsx`, `team-match-detail.tsx`:
- mybdr: 테이블 레이아웃 (`InfoRow` 컴포넌트 + `<tr>/<th>/<td>`)
- subin: 카드 레이아웃 (시설안내/경기규칙 분리, CSS 변수 스타일링)
- subin 주석: "데이터 로직 100% 유지, UI만 변경" — 실제로 `rules` 파싱 로직이 추가됨

#### 🟡 프로필 완료 체크 변경

`apply-button.tsx`:
- mybdr: `if (!profileCompleted)` — DB `profile_completed` 플래그 기반
- subin: `if (missingFields.length > 0)` — 실시간 `getMissingFields()` 기반

`/api/web/profile/route.ts`:
- subin: `createdAt` 추출하여 `created_at` ISO 문자열로 반환 (프로필 헤더 가입일 표시용)
- mybdr: `createdAt` 미추출

#### 🟢 대진표 페이지 확장

`tournaments/[id]/bracket/page.tsx`:
- subin: 추가 import (`TournamentDashboardHeader`, `GroupStandings`, `FinalsSidebar`)
- subin: 추가 쿼리 (대회 venue/entry_fee, tournamentTeam 전체 조회 + 순위 정렬)
- subin: 2열 레이아웃 (좌: 조별리그 순위 + 대진표, 우: 사이드바)

#### 🟢 디자인만 확인 (기능 변경 없음)

아래 파일들은 4차에서도 컬러/CSS변수/레이아웃만 변경 확인:
- `_site/*` (layout, page, registration, results, schedule, teams) — CSS 변수 migration만
- `community/comment-form.tsx` — textarea→div 구조 변경, 서버 액션 동일
- `community/loading.tsx` — 2열 레이아웃 스켈레톤 (5→8 카드)
- `community/new/page.tsx` — 디자인만
- `courts/*` — 디자인만
- `game cards` (guest/pickup/team-match) — 디자인만
- `pricing/*` — 이모지→텍스트 약어 (🏀→"TM", ⛹️→"PU")
- `site-templates/classic.tsx` — CSS 변수 migration + 주석 추가
- `Footer.tsx` — 디자인만

### §9.20.2 설정 파일 최종 확인

#### next.config.ts (Phase 14 보완)

| 항목 | subin 추가 | 적용 여부 |
|------|-----------|----------|
| `style-src` | + `https://fonts.googleapis.com` | ✅ 폰트 CDN 사용 시 필수 |
| `font-src` | + `https://fonts.gstatic.com` | ✅ 폰트 CDN 사용 시 필수 |
| `frame-src` | + `accounts.google.com`, `nid.naver.com`, `kauth.kakao.com`, YouTube | ⚠️ OAuth는 별도, YouTube만 적용 |
| `images.remotePatterns` | kakaocdn, pstatic, googleusercontent | ⚠️ OAuth 프로필 이미지용 — 별도 프로젝트와 겹침 |

#### package.json

- 이름: `mybdr-dev` → mybdr 유지
- 포트: `3001` → mybdr 기본(3000) 유지
- **의존성 차이 없음** (동일 패키지)

### §9.20.3 최종 머지 시 "mybdr 우선" 보호 목록

subin으로 덮어쓰면 안 되는 mybdr 최근 변경분:(중요))

| 파일 | mybdr 보호 내용 | 사유 |
|------|----------------|------|
| `/api/v1/tournaments/[id]/full-data` | `game_rules`, `user_name` 확장, `user_nickname`, `is_active` | Flutter 앱 호환 |
| `/api/v1/tournaments/verify` | `game_rules: true` | Flutter 앱 호환 |
| `lib/constants/tournament-status.ts` | `in_progress` 키 삭제 | mybdr이 정리한 것, subin은 중복 보유 |
| `lib/constants/game-rules-defaults.ts` | 파일 전체 | FIBA 규칙 시스템 (판단 후 결정) |
| `lib/validation/game-rules.ts` | 파일 전체 | FIBA 규칙 검증 (판단 후 결정) |

---

## §9.21 최종 판단 필요 항목 (전체)

| # | 항목 | 심각도 | 섹션 |
|---|------|--------|------|
| 1 | FIBA 게임 규칙 삭제 vs 접수 설정 공존 | 🔴 | §9.18.1 |
| 2 | `(web)/layout.tsx` 완전 재작성 + Header 관계 정리 | 🔴 | §9.18.2 |
| 3 | 대회 위자드 5단계→7단계 | 🔴 | §9.18.3 |
| 4 | Flutter API 필드 보호 (`game_rules`, `user_name` 확장 등) | 🔴 | §9.20.1 |
| 5 | `/api/v1/matches/[id]/stats` 간소화 — Flutter 앱 호환 | 🟡 | §9.18.8 |
| 6 | 이메일 로그인 (OAuth와 별개 적용 가능) | 🟡 | §9.18.5 |
| 7 | 서버→클라이언트 아키텍처 전환 (커뮤니티/팀/대회) | 🟡 | §9.18.6 |
| 8 | SlideMenu 네비 구조 변경 | 🟡 | §9.20.1 |
| 9 | 프로필 완료 체크: DB 플래그 vs 실시간 검증 | 🟡 | §9.20.1 |
| 10 | images.remotePatterns (OAuth 프로필 이미지) | 🟢 | §9.20.2 |
