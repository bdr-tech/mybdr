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

*이 계획서는 Dev/research.md + 코드베이스 직접 분석 결과를 종합했습니다.*
*판단 미기입 항목(`<!-- [판단 주입] -->`)은 구현 전 의견 추가 필요.*
