# 심판/경기원 플랫폼 구축 스크래치패드 (subin-referee 브랜치)

## 🎯 프로젝트 비전
심판/경기원 관리 플랫폼. 시도/시군구 협회 수준까지 확장하며 관리 수수료 비즈니스 모델.
MyBDR의 독자 영역으로 구축 후 추후 통합/연동 예정.

## 📦 MVP 1차 범위 (A)
- 심판/경기원 등록
- 자격증 등록 및 관리 (CRUD)

**(2차 이후 범위 — 이번 작업 대상 아님)**
- 경기 배정 (기존 games/tournaments 연동)
- 앱 접근 권한 (JWT + Flutter API)
- 협회 조직도 (시도/시군구 계층)
- 관리 수수료 과금

## ⚠️ 절대 지켜야 할 제약 (PM이 모든 에이전트에게 선제 명령)
1. **기존 페이지 UI 수정 금지**
   - `src/app/(web)/**` 기존 페이지 건드리지 않음
   - `src/app/(admin)/**` 기존 페이지 건드리지 않음
   - `src/app/(site)/**` 건드리지 않음
2. **공통 컴포넌트 수정 금지** — 그대로 import만 함
3. **디자인 토큰 수정 금지** — `src/app/globals.css` 건드리지 않음
4. **기존 Prisma 모델 수정 최소화** — User 모델의 role 확장 정도만 허용

허용 범위:
- `prisma/schema.prisma`에 **새 모델 추가** (Referee, RefereeCertificate)
- `src/app/(referee)/referee/**` 신규 라우트 그룹
- `src/app/api/web/referees/**` 신규 API
- `src/app/api/web/referee-certificates/**` 신규 API

## 🏗️ 설계 방향 (샌드위치 구조)
```
┌─────────────────────────────────┐
│ 기존 mybdr 디자인 시스템 (공통) │ ← 절대 건드리지 않음, 재사용만
├─────────────────────────────────┤
│ (referee) 라우트 그룹           │ ← 독자 레이아웃 + 독자 사이드바
│ └ 기존 공통 컴포넌트 조립       │
├─────────────────────────────────┤
│ Prisma: referee_* 테이블 추가   │ ← 기존 스키마 유지
└─────────────────────────────────┘
```

### 예정 파일 구조
```
prisma/schema.prisma
  + model Referee
  + model RefereeCertificate

src/app/(referee)/
  ├ referee/
  │   ├ layout.tsx              ← 독자 레이아웃 (헤더/사이드바)
  │   ├ page.tsx                ← 대시보드
  │   ├ registry/
  │   │   ├ page.tsx            ← 심판 목록
  │   │   ├ new/page.tsx        ← 신규 등록
  │   │   └ [id]/page.tsx       ← 상세/수정
  │   └ certificates/
  │       ├ page.tsx            ← 자격증 목록
  │       └ [id]/page.tsx       ← 자격증 상세

src/app/api/web/referees/
  ├ route.ts                    ← GET(list) POST(create)
  └ [id]/route.ts               ← GET PUT DELETE

src/app/api/web/referee-certificates/
  ├ route.ts
  └ [id]/route.ts
```

### Prisma 모델 초안 (1차는 Referee + RefereeCertificate만)
```prisma
model Referee {
  id              Int       @id @default(autoincrement())
  user_id         Int       @unique
  license_number  String?   @unique
  level           String?   // 초급/중급/고급/국제
  region_sido     String?
  region_sigungu  String?
  status          String    @default("active")
  joined_at       DateTime  @default(now())
  user            User      @relation(fields: [user_id], references: [id])
  certificates    RefereeCertificate[]
  @@map("referees")
}

model RefereeCertificate {
  id              Int       @id @default(autoincrement())
  referee_id      Int
  cert_type       String    // 심판/경기원/기록원
  cert_grade      String    // 1급/2급/3급
  issued_at       DateTime
  expires_at      DateTime?
  issuer          String
  file_url        String?
  verified        Boolean   @default(false)
  referee         Referee   @relation(fields: [referee_id], references: [id])
  @@map("referee_certificates")
}
```

## 🔌 환경 세팅 TODO (worktree 첫 실행 시)
1. `.env` / `.env.local`을 원본 `C:/0. Programing/mybdr`에서 복사
2. `npm install` (node_modules 신규 설치)
3. Prisma 모델 추가 후 `npx prisma generate` (DB push는 개발 DB 확인 후)
4. dev 서버 띄울 때는 `next dev --port 3002` (포트 충돌 방지)

## 현재 작업
- **요청**: 심판/경기원 MVP 1차 (등록 + 자격증 CRUD)
- **상태**: 대기 (환경 세팅 → planner-architect 호출 예정)
- **현재 담당**: pm

## 기획설계 (planner-architect)

## ✅ 최종 확정 (2026-04-12, 사용자 승인) — developer는 이 섹션을 최우선으로 따를 것

아래 "🔄 갱신" 섹션의 초안 내용은 대부분 유효하지만, **다음 3가지는 최종 확정안으로 덮어쓰기**:

### 확정 1) 관리자-협회 연결 = 옵션 B (AssociationAdmin 매핑 테이블)
- **users 테이블 수정 0건 확정.** `managed_association_id` 컬럼 추가 **안 함**.
- `association_admins` 매핑 테이블로 해결 (모델 2번 AssociationAdmin 그대로).
- admin 식별: `User.admin_role = "association_admin"` AND `AssociationAdmin` 행 존재.

### 확정 2) Referee ↔ User 관계 = v1 (User에 `referee Referee?` 1줄 추가)
- **User 모델에 `referee Referee?` 1줄만 추가.** Prisma 양방향 관계 선언.
- 이 1줄은 Prisma 관계 메타데이터일 뿐 **`users` 테이블 스키마(컬럼/인덱스/FK)를 변경하지 않음.**
- `Referee.user_id`에는 `@relation(fields: [user_id], references: [id], onDelete: Cascade)` 선언 → **`referees` 테이블에 FK 제약 생성됨** (이건 새 테이블이라 OK).
- 결과: 앱 레벨이 아니라 DB 레벨에서 무결성 보장. "존재 안 하는 user_id로 Referee 생성" 불가.
- 기존 Referee 모델 코드의 `// user 쪽은 단방향 FK만` 주석은 무시하고 v1 방식으로 구현.

### 확정 3) RefereeAssignment의 경기 FK = `tournament_match_id` 단독
- **`game_id` 필드 제거.** 일반 경기(`games` 테이블, 픽업/친선)는 배정 대상이 아님 (사용자 결정).
- `tournament_match_id BigInt` (NOT NULL로 변경 가능). 공식 대회 경기만 배정 가능.
- `@@index([tournament_match_id])` 유지, `@@index([game_id])` 제거.
- CHECK 제약 관련 zod 로직 불필요 (필드가 하나뿐이라).
- KBL/WKBL 경기는 현재 `tournament_matches`에 들어가는 구조라면 그대로 커버 가능. 아니면 2차에서 별도 경기 모델 추가 논의.

### 확정 사항 요약: DB 변경
- `CREATE TABLE 6건` (associations, association_admins, referees, referee_certificates, referee_assignments, referee_settlements)
- `ALTER TABLE 0건` ✅
- `schema.prisma` User 모델에 `referee Referee?` 1줄 추가 (DB 무영향)

### developer가 이 섹션만으로 놓치지 말아야 할 것
1. `npx prisma db push --dry-run` 결과에 `ALTER TABLE users`가 **단 한 줄이라도** 보이면 즉시 중단, PM에게 보고.
2. `RefereeAssignment.game_id` 필드를 실수로 만들지 말 것.
3. Referee 모델 `user` 관계는 반드시 `@relation` 선언할 것. User 모델엔 `referee Referee?`만.
4. AssociationAdmin은 반드시 생성할 것(옵션 A의 `managed_association_id` 컬럼은 만들지 말 것).

---

## 🔄 갱신 (2026-04-12, 결정사항 반영)

이전 초안(MVP 1차: Referee/RefereeCertificate 2모델, 자격증 파일 업로드, 공개 목록) 대비 **범위 확장 + 방침 변경**.

### 변경 요약
| # | 항목 | 이전 | 현재 |
|---|------|------|------|
| 1 | Association 모델 | 없음 | **신규 (계층형 self-relation, 20개 시드)** |
| 2 | 자격증 파일 업로드 | `file_url` 필드 | **완전 제거**. 교차검증(실명+생년월일+전화번호+자격증번호)으로 대체 |
| 3 | 검증 플래그 운영 | 관리자 수동 DB | **Excel 일괄 업로드 + 개별 검증 버튼 2-way** |
| 4 | 심판 공개 목록 | 있음 | **없음** (배정 페이지에서만 노출, 1차엔 배정 UI 없음 → `/referee/registry`는 본인/admin 컨텍스트만) |
| 5 | 이름 노출 | nickname | **User.name(실명)** 우선 |
| 6 | 배정/정산 | 2차 이후 | **조회 전용으로 1차 포함** (생성 로직은 2차) → `RefereeAssignment`, `RefereeSettlement` 2모델 추가 |
| 7 | User.role 확장 | `referee Referee?` 1줄 | **`admin_role`에 `"association_admin"` 추가 + `managed_association_id BigInt?` 컬럼 1개 추가** (ALTER 1건 발생) |

### 가장 중요: User 모델 현황 전수 확인 결과

**✅ 이미 있는 필드** (ALTER 불필요):
| 필드 | 타입 | 용도 |
|------|------|------|
| `name` | `String?` | **실명** (교차검증 + 표시) |
| `birth_date` | `DateTime? @db.Date` | 교차검증 |
| `phone` | `String?` | 교차검증 |
| `admin_role` | `String?` | 기존 `"super_admin"`/`"org_admin"`/`"content_admin"` 값 운용 중 → `"association_admin"` 값만 추가 (컬럼 변경 없음, 값만 추가) |

**❌ 없는 필드** (ALTER 필요):
| 필드 | 용도 |
|------|------|
| `managed_association_id BigInt?` | association_admin이 관리하는 단일 협회 ID. 없으면 admin이 어느 협회 소속인지 식별 불가 |

**⚠️ 판정**: **users 테이블에 ALTER TABLE 1건 발생** (`ADD COLUMN managed_association_id BIGINT NULL`). `role` 필드는 애초에 존재하지 않았고(isAdmin/admin_role/membershipType만 있음), 실명/생년월일/전화번호는 다 있어서 그건 안전. 그러나 `managed_association_id`는 반드시 새로 추가해야 하므로 **사용자 재승인 포인트**.

- 대안: User에 컬럼 추가 없이 별도 `AssociationAdmin(user_id, association_id)` 매핑 테이블 1개를 만들면 `users` 0수정 + 신규 테이블 1개로 해결 가능. 1:1 관계는 user_id unique로 강제.
- **권장**: 사용자에게 두 방식 제시 — (A) users ALTER 1컬럼 (단순, 조회 1번) / (B) 신규 매핑 테이블 (users 0수정, join 1회). **이전 "User 0줄 수정" 원칙과의 일관성을 위해 B 권장**.

### 경기 엔티티 실제 이름 확인

Prisma schema 확인 결과 경기 엔티티는 3종:
1. **`games`** (소문자, id BigInt) — 일반 경기/픽업
2. **`TournamentMatch`** (대회 매치, id BigInt, `@@map("tournament_matches")`) — 공식 대회 경기
3. **`pickup_games`** (픽업 게임, 별도 모델) — 코트 픽업

공식 심판 배정 대상은 주로 `TournamentMatch`. 1차에서는 **양쪽 다 배정 가능하도록 FK를 분리 설계**:
- `RefereeAssignment.tournament_match_id BigInt?` + `RefereeAssignment.game_id BigInt?` (둘 중 하나만 채움, CHECK 제약 또는 앱 레벨)
- Prisma 관계 선언: **한쪽도 선언하지 않음**. 순수 FK 컬럼으로만 둠 → 기존 `games`/`TournamentMatch` 모델 0수정
- 단점: Prisma Client의 nested include 불가 → 서버에서 `prisma.games.findUnique` / `prisma.tournamentMatch.findUnique` 별도 조회
- 1차엔 조회만 필요하므로 이 방식으로 충분

### 최종 Prisma 모델 6개 요약

**1) Association (신규)** — `@@map("associations")`
```prisma
model Association {
  id            BigInt   @id @default(autoincrement())
  parent_id     BigInt?  // self relation
  name          String   @db.VarChar           // "서울특별시농구협회"
  code          String   @unique @db.VarChar   // "KBA" / "SEO" / "KBL" / "WKBL"
  region_sido   String?  @db.VarChar           // "서울" (KBA/KBL/WKBL은 null)
  level         String   @db.VarChar           // "national" | "sido" | "pro_league"
  created_at    DateTime @default(now()) @db.Timestamp(6)
  updated_at    DateTime @updatedAt @db.Timestamp(6)

  parent        Association?  @relation("AssociationHierarchy", fields: [parent_id], references: [id], onDelete: NoAction)
  children      Association[] @relation("AssociationHierarchy")
  referees      Referee[]
  admins        AssociationAdmin[]

  @@index([parent_id])
  @@index([level])
  @@index([region_sido])
  @@map("associations")
}
```

**2) AssociationAdmin (신규, 옵션 B)** — `@@map("association_admins")`
- User 0수정 원칙 유지용 매핑 테이블. 옵션 A 선택 시 이 모델 삭제하고 User에 `managed_association_id` 컬럼 추가.
```prisma
model AssociationAdmin {
  id             BigInt   @id @default(autoincrement())
  user_id        BigInt   @unique  // 1인 1협회
  association_id BigInt
  created_at     DateTime @default(now()) @db.Timestamp(6)

  association    Association @relation(fields: [association_id], references: [id], onDelete: Cascade)
  // user는 단방향 FK만 (User 모델 미수정)

  @@index([association_id])
  @@map("association_admins")
}
```
- **User.admin_role = "association_admin"** 이면서 **AssociationAdmin 행 존재** 두 조건 모두 충족 시 협회 관리자로 인식.

**3) Referee (신규, 이전 설계 확장)** — `@@map("referees")`
```prisma
model Referee {
  id              BigInt   @id @default(autoincrement())
  user_id         BigInt   @unique   // User.id FK (단방향)
  association_id  BigInt?             // 소속 협회 (20개 중 1)

  // 교차검증 결과 스냅샷 (User에서 복사해서 저장, 변경 감지에 사용)
  // 주의: 이 필드들은 검증 시점 값. User 변경돼도 여기는 안 바뀜 → 재검증 필요
  verified_name       String?  @db.VarChar  // 검증 통과 시 User.name 스냅샷
  verified_birth_date DateTime? @db.Date
  verified_phone      String?  @db.VarChar

  license_number  String?  @unique @db.VarChar
  level           String?  @db.VarChar    // beginner/intermediate/advanced/international
  role_type       String   @default("referee") @db.VarChar
  region_sido     String?  @db.VarChar
  region_sigungu  String?  @db.VarChar
  status          String   @default("active") @db.VarChar  // active/inactive/pending_review
  bio             String?
  joined_at       DateTime @default(now()) @db.Timestamp(6)
  created_at      DateTime @default(now()) @db.Timestamp(6)
  updated_at      DateTime @updatedAt @db.Timestamp(6)

  association     Association? @relation(fields: [association_id], references: [id], onDelete: SetNull)
  certificates    RefereeCertificate[]
  assignments     RefereeAssignment[]
  settlements     RefereeSettlement[]
  // user 쪽은 단방향 FK만 — User 모델 미수정

  @@index([user_id])
  @@index([association_id])
  @@index([level])
  @@index([region_sido, region_sigungu])
  @@index([status])
  @@map("referees")
}
```
- **User 관계**: `@relation` 선언하지 않음. `user_id BigInt` 컬럼만 두고 앱 레벨에서 FK처럼 사용. Prisma db push는 이 컬럼에 대해 FK 제약을 생성하지 **않음** → 무결성은 앱이 보장. 이게 "User 0줄 수정" 원칙의 대가.

**4) RefereeCertificate (신규, file_url 제거)** — `@@map("referee_certificates")`
```prisma
model RefereeCertificate {
  id          BigInt    @id @default(autoincrement())
  referee_id  BigInt
  cert_type   String    @db.VarChar  // referee/scorer/timer
  cert_grade  String    @db.VarChar  // 1급/2급/3급/국제
  issuer      String    @db.VarChar  // 발급 협회명 또는 code
  cert_number String?   @db.VarChar  // 자격증 번호 (교차검증 키)
  issued_at   DateTime  @db.Date
  expires_at  DateTime? @db.Date
  verified    Boolean   @default(false)
  verified_at DateTime? @db.Timestamp(6)
  verified_by_admin_id BigInt?  // 어느 admin이 검증했는지
  created_at  DateTime  @default(now()) @db.Timestamp(6)
  updated_at  DateTime  @updatedAt @db.Timestamp(6)

  referee     Referee   @relation(fields: [referee_id], references: [id], onDelete: Cascade)

  @@index([referee_id])
  @@index([cert_type, cert_grade])
  @@index([expires_at])
  @@index([cert_number])
  @@map("referee_certificates")
}
```

**5) RefereeAssignment (신규)** — `@@map("referee_assignments")`
```prisma
model RefereeAssignment {
  id                   BigInt   @id @default(autoincrement())
  referee_id           BigInt
  tournament_match_id  BigInt   // → tournament_matches.id (공식 대회 경기만 배정 대상)
  role                 String   @db.VarChar  // main/sub/recorder/timer
  status               String   @default("assigned") @db.VarChar  // assigned/confirmed/declined/cancelled/completed
  assigned_at          DateTime @default(now()) @db.Timestamp(6)
  memo                 String?
  created_at           DateTime @default(now()) @db.Timestamp(6)
  updated_at           DateTime @updatedAt @db.Timestamp(6)

  referee              Referee  @relation(fields: [referee_id], references: [id], onDelete: Cascade)
  settlement           RefereeSettlement?
  // tournament_match 쪽은 관계 선언 없음 — 기존 TournamentMatch 모델 미수정

  @@index([referee_id])
  @@index([tournament_match_id])
  @@index([status])
  @@map("referee_assignments")
}
```
- **확정**: 일반 `games` 배정 제외. `tournament_match_id`는 NOT NULL. 별도 CHECK 제약 불필요.

**6) RefereeSettlement (신규)** — `@@map("referee_settlements")`
```prisma
model RefereeSettlement {
  id             BigInt   @id @default(autoincrement())
  referee_id     BigInt
  assignment_id  BigInt   @unique  // 1 배정 = 1 정산
  amount         Int      // 원 단위
  status         String   @default("pending") @db.VarChar  // pending/paid/cancelled
  paid_at        DateTime? @db.Timestamp(6)
  memo           String?
  created_at     DateTime @default(now()) @db.Timestamp(6)
  updated_at     DateTime @updatedAt @db.Timestamp(6)

  referee        Referee           @relation(fields: [referee_id], references: [id], onDelete: Cascade)
  assignment     RefereeAssignment @relation(fields: [assignment_id], references: [id], onDelete: Cascade)

  @@index([referee_id])
  @@index([status])
  @@map("referee_settlements")
}
```

### ALTER TABLE 발생 여부 — **0건 (옵션 B 채택 시)**

- `users` 테이블: **ALTER 없음** (옵션 B — AssociationAdmin 매핑 테이블 사용).
- 옵션 A 선택 시: `users ADD COLUMN managed_association_id BIGINT NULL` 1건 발생.
- 실제 실행 SQL:
  - `CREATE TABLE associations` (+ self FK `parent_id → associations.id`)
  - `CREATE TABLE association_admins` (+ FK `association_id → associations.id`)
  - `CREATE TABLE referees` (+ FK `association_id → associations.id`, `user_id`는 FK 없이 컬럼만)
  - `CREATE TABLE referee_certificates` (+ FK `referee_id → referees.id`)
  - `CREATE TABLE referee_assignments` (+ FK `referee_id → referees.id`)
  - `CREATE TABLE referee_settlements` (+ FK `referee_id`, `assignment_id`)
- **신규 CREATE TABLE 6건, ALTER 0건** — 운영 안전.
- `prisma db push --dry-run` 결과가 "ALTER users" 한 줄이라도 포함하면 **즉시 중단**하고 사용자 보고.

### Association 20개 시드 데이터

**방법 제안**: `prisma/seed.ts` 생성 + `package.json`에 `"prisma": { "seed": "tsx prisma/seed.ts" }` 추가. `npx prisma db seed` 로 실행. tsx는 이미 devDep에 있음(확인 필요), 없으면 `ts-node` 사용.

**20개 목록** (code는 ISO 3166-2:KR 코드 참조 + 커스텀):
| # | name | code | level | region_sido | parent |
|---|------|------|-------|-------------|--------|
| 1 | 대한민국농구협회 | KBA | national | null | null |
| 2 | 서울특별시농구협회 | KBA-11 | sido | 서울 | KBA |
| 3 | 부산광역시농구협회 | KBA-26 | sido | 부산 | KBA |
| 4 | 대구광역시농구협회 | KBA-27 | sido | 대구 | KBA |
| 5 | 인천광역시농구협회 | KBA-28 | sido | 인천 | KBA |
| 6 | 광주광역시농구협회 | KBA-29 | sido | 광주 | KBA |
| 7 | 대전광역시농구협회 | KBA-30 | sido | 대전 | KBA |
| 8 | 울산광역시농구협회 | KBA-31 | sido | 울산 | KBA |
| 9 | 세종특별자치시농구협회 | KBA-36 | sido | 세종 | KBA |
| 10 | 경기도농구협회 | KBA-41 | sido | 경기 | KBA |
| 11 | 강원특별자치도농구협회 | KBA-42 | sido | 강원 | KBA |
| 12 | 충청북도농구협회 | KBA-43 | sido | 충북 | KBA |
| 13 | 충청남도농구협회 | KBA-44 | sido | 충남 | KBA |
| 14 | 전북특별자치도농구협회 | KBA-45 | sido | 전북 | KBA |
| 15 | 전라남도농구협회 | KBA-46 | sido | 전남 | KBA |
| 16 | 경상북도농구협회 | KBA-47 | sido | 경북 | KBA |
| 17 | 경상남도농구협회 | KBA-48 | sido | 경남 | KBA |
| 18 | 제주특별자치도농구협회 | KBA-50 | sido | 제주 | KBA |
| 19 | 한국농구연맹 | KBL | pro_league | null | null |
| 20 | 한국여자농구연맹 | WKBL | pro_league | null | null |

- 17개 시도는 `src/lib/constants/regions.ts`의 `REGIONS` 키와 정확히 일치 → 재사용.
- KBL/WKBL은 KBA 산하가 아닌 **독립 pro_league** (`parent_id = null`).
- seed는 **idempotent**: `upsert`로 code unique 기준 업데이트.

### 라우트 트리 최종

```
src/app/(referee)/
└── referee/
    ├── layout.tsx                    ← 심판 플랫폼 셸 (로그인 가드 + 네비)
    ├── page.tsx                      ← [Server] 본인 대시보드 (내 Referee + 최근 배정 3 + 미정산 금액)
    ├── profile/
    │   ├── page.tsx                  ← [Server] 내 Referee 프로필 조회
    │   └── edit/page.tsx             ← [Client] 수정 (없으면 "등록하기" 분기)
    ├── certificates/
    │   ├── page.tsx                  ← [Client] 내 자격증 목록 + 추가 모달
    │   └── [id]/page.tsx             ← [Server] 자격증 상세
    ├── assignments/
    │   └── page.tsx                  ← [Client] 내 배정 기록 (필터: 상태/기간)
    ├── settlements/
    │   └── page.tsx                  ← [Client] 내 정산 기록 (필터: 상태/기간, 합계)
    └── admin/                        ← association_admin 전용, layout에서 권한 가드
        ├── layout.tsx                ← admin 권한 체크 (admin_role=association_admin AND AssociationAdmin 매핑 존재)
        ├── page.tsx                  ← [Server] 관리자 대시보드 (소속 협회 요약 + 통계)
        ├── members/
        │   ├── page.tsx              ← [Client] 소속 심판 목록 (검증 상태 필터)
        │   └── [id]/page.tsx         ← [Server] 심판 상세 + "검증" 토글 버튼
        └── bulk-verify/
            └── page.tsx              ← [Client] Excel 업로드 → 미리보기 → 확정 2단계
```

- **심판 공개 목록 없음**: `registry/` 경로 삭제. 대신 `profile/`(본인) + `admin/members/`(관리자).
- `assignments/` / `settlements/`는 본인 열람만. admin은 `admin/members/[id]` 상세에서 해당 심판의 배정/정산을 함께 표시.

### API 엔드포인트 최종안 (정확히 17개)

모두 `src/app/api/web/` 하위, `withWebAuth` + zod + prisma.

**Referee 본인 (4)**
1. `GET  /api/web/referees/me` — 내 Referee 프로필 조회
2. `POST /api/web/referees/me` — 신규 등록 (1인 1개)
3. `PUT  /api/web/referees/me` — 수정
4. `DELETE /api/web/referees/me` — 삭제

**Certificate 본인 (3)**
5. `GET  /api/web/referee-certificates` — 본인 자격증 목록 (mine=1 강제)
6. `POST /api/web/referee-certificates` — 추가
7. `PUT /api/web/referee-certificates/[id]` — 수정 (verified 수정 불가)
8. `DELETE /api/web/referee-certificates/[id]` — 삭제

**Association 공개 (1)**
9. `GET  /api/web/associations` — 20개 목록 (드롭다운용, 로그인 필수). 쿼리: `level`, `region_sido`.

**본인 배정/정산 조회 (2)**
10. `GET /api/web/referee-assignments?mine=1` — 내 배정 목록
11. `GET /api/web/referee-settlements?mine=1` — 내 정산 목록 (합계 포함)

**Admin 전용 (6)**
12. `GET  /api/web/admin/associations/members` — 내 협회 소속 심판 목록 (filter: verified, level)
13. `GET  /api/web/admin/associations/members/[id]` — 특정 심판 상세 + 자격증 + 배정/정산
14. `PATCH /api/web/admin/referee-certificates/[id]/verify` — 개별 검증 토글
15. `POST /api/web/admin/bulk-verify/preview` — Excel 파일 업로드 → 파싱 → 매칭 미리보기 (DB 미변경)
16. `POST /api/web/admin/bulk-verify/confirm` — 미리보기 결과 배열을 받아 일괄 `verified=true` 적용 (트랜잭션)
17. `GET  /api/web/admin/dashboard` — 내 협회 요약 통계 (심판 수, 검증율, 미정산액 등)

**권한 규칙**:
- 1~11: 로그인 필수. 본인 리소스만 접근 (서버에서 `ctx.userId` 강제).
- 12~17: **association_admin 가드 미들웨어** — `ctx.user.admin_role === "association_admin"` AND `AssociationAdmin` 행 존재. 조회는 항상 `association_id = adminAssociationId` 조건 강제 (IDOR 방지).
- 14번 검증 토글: admin이 **자기 협회 소속 심판의 자격증에만** 토글 가능 (referee.association_id === adminAssociationId 체크).

### Excel 업로드 UX 플로우

**컬럼 표준** (Excel 1행 = 헤더):
```
협회코드 | 실명 | 생년월일(YYYY-MM-DD) | 전화번호 | 자격증종류 | 자격증등급 | 자격증번호 | 발급일 | 갱신일(선택)
```
- 예: `KBA-11 | 홍길동 | 1990-03-15 | 01012345678 | referee | 1급 | CERT-2024-0001 | 2024-01-10 | 2027-01-10`

**1단계 — 파싱 + 미리보기 (`POST /admin/bulk-verify/preview`)**
- multipart/form-data로 `.xlsx` 받음
- `xlsx` 라이브러리로 SheetJS 파싱 → JSON 배열
- 각 행에 대해:
  1. `협회코드`가 admin의 소속 협회와 일치하는지 (불일치 → 거부)
  2. `실명 + 생년월일 + 전화번호`로 User 조회 → 매칭되는 유저의 Referee 찾기
  3. 그 Referee의 RefereeCertificate 중 `cert_type + cert_number` 일치하는 것 찾기
  4. 결과: `matched` / `partial_match` / `no_match` / `already_verified`
- **DB 변경 없음**. 응답에 행별 결과 + 매칭된 certificate_id 배열 포함.
- 클라이언트는 미리보기 테이블로 표시 + "확정" 버튼 활성화.

**2단계 — 확정 (`POST /admin/bulk-verify/confirm`)**
- 요청 body: `{ certificate_ids: number[] }` (미리보기 응답에서 받은 것)
- 서버는 `prisma.$transaction`으로 해당 certificate들의 `verified=true` + `verified_at=now()` + `verified_by_admin_id` 일괄 업데이트
- 각 certificate가 admin의 소속 협회 소속인지 재검증 (TOCTOU 방지)
- 응답: 업데이트 건수 + 실패 건 리스트

**에러 처리**:
- 파일 크기 > 5MB 거부
- 행 수 > 500 거부 (1회 배치 제한)
- 헤더 불일치 시 400 + 예상 헤더 반환
- 파싱 실패 행은 건너뛰고 결과에 포함

### 구현 순서 (커밋 단위 4개)

| 커밋 | 범위 | 담당 | tester 검증 포인트 |
|------|------|------|------------------|
| **Commit 1** | Prisma 모델 6개 추가 + `prisma/seed.ts` 작성 + package.json seed 스크립트 등록 + **dry-run 확인** (CREATE 6건만 / ALTER 0건) + 실제 push + seed 실행 | developer | DB에 6 테이블 + Association 20행 존재 / users 테이블 변경 없음 |
| **Commit 2** | Association API(9) + Referee 본인 API(1~4) + Certificate 본인 API(5~8) + 본인 프로필/자격증 페이지 + 셸 레이아웃 | developer | curl로 전체 CRUD 통과 / 로그인 가드 작동 / 본인 외 접근 403 |
| **Commit 3** | Assignment/Settlement 모델 기반 조회 API(10~11) + 본인 배정/정산 페이지 + 테스트용 시드 데이터 수동 insert 가이드 | developer | 목록 정렬/필터/합계 정상 |
| **Commit 4** | Admin API(12~17) + admin 레이아웃 권한 가드 + admin/members 페이지 + bulk-verify Excel 업로드 UX 2단계 + 개별 검증 토글 | developer | 권한 격리 (다른 협회 접근 차단), Excel 파싱 정상, 트랜잭션 무결성 |

각 커밋은 `tester` 검증 후 PM이 자동 커밋. Commit 4는 reviewer 병렬 권장 (권한 체크 다층이라 누락 가능).

### 공통 컴포넌트 재사용 (이전 설계 유지)
- CSS 변수, Material Symbols, apiSuccess/apiError, withWebAuth, zod 스키마 패턴
- 기존 (web)/(admin)/(site) layout은 import하지 않음
- `_components/` 내 referee 전용 작은 컴포넌트 자체 구현

### 리스크 / 잔여 결정 필요 사항

| # | 질문 | 제안 |
|---|------|------|
| Q1 | **옵션 A vs B**: users에 `managed_association_id` 컬럼 추가(ALTER 1건) vs AssociationAdmin 매핑 테이블(users 0수정, 테이블 +1) | **B 권장** (이전 원칙 일관성, 운영 안전) |
| Q2 | `Referee.user_id`에 Prisma `@relation` 선언 생략으로 FK 제약 없는 것 허용? | **허용** (User 0수정 원칙 우선). 앱 레벨에서 무결성 보장. 대안은 User 1줄 추가(이전 결정). 사용자가 "User 어떤 수정도 절대 금지"라면 현 설계, "관계 선언 1줄은 OK"이면 이전 방식 |
| Q3 | 경기 엔티티 FK 2개(`tournament_match_id`/`game_id`) 중 어느 쪽 우선인가? | 둘 다 허용. 1차 테스트 데이터는 `tournament_match_id`로 넣기 (공식 경기 시나리오) |
| Q4 | seed 실행 도구 tsx/ts-node | `tsx` 존재 여부 확인 후 결정. 둘 다 없으면 developer가 plain JS seed 작성 |
| Q5 | Excel 파일 저장 여부 | **저장 안 함**. 파싱 후 즉시 폐기. 개인정보 보관 최소화 |
| Q6 | 교차검증 실패 시 사용자 피드백 | 심판 본인에게는 "협회에 검증을 요청하세요" 안내. 관리자에게는 "실명/생년월일/전화번호 불일치" 표시 |
| Q7 | admin이 소속 협회 외 심판을 "등록"할 수 있나? | **불가**. 1차에는 등록은 본인만. admin은 검증만. |

---

### 0. 사전 조사 요약 (읽기 전용)
- `User.id = BigInt` → Referee FK는 BigInt 필수
- `withWebAuth` 패턴: 쿠키 JWT → `ctx.userId: bigint`
- `apiSuccess()` 자동 snake_case 변환 (코드에선 camelCase 사용)
- `src/app/(web)/layout.tsx`는 거대한 "use client" 파일 — **그대로 import 불가**, referee 전용 독자 레이아웃을 **새로 쓰되 globals.css/CSS 변수만 공유**
- 기존 표준 API 예시: `src/app/api/web/preferences/route.ts` (withWebAuth + zod + prisma)

### 1. User 모델 수정 여부 → **최소 1줄 추가 (DB 스키마 변경 0)**
- **결정**: User 모델에 `referee Referee?` back-relation **1줄만** 추가. 그 외 필드/속성/인덱스 전부 보존.
- **이유**: Prisma는 양방향 관계 선언을 요구한다. Referee 쪽에서 `@relation(fields:[user_id], references:[id])`을 선언하면 User 모델에도 반대편 필드가 있어야 검증을 통과한다.
- **DB 영향**: **없음**. back-relation은 Prisma-level 선언이므로 `prisma db push` 실행 시 `users` 테이블에 ALTER TABLE이 발생하지 않는다. 실제 SQL은 `CREATE TABLE referees` + `CREATE TABLE referee_certificates` + FK 제약 2건뿐.
- **검증 절차**: developer는 `prisma db push --dry-run`을 먼저 실행해 `users` 테이블 변경 여부를 반드시 확인. CREATE TABLE 2건만 나오면 실제 push.

### 2. Prisma 모델 확정안

**User 모델 수정 (back-relation 1줄 추가)**:
```prisma
model User {
  // ... 기존 전부 유지 ...
  // 심판 플랫폼 (MVP 1차): 1:1 단방향 (Referee 쪽이 소유)
  referee    Referee?
  // ... 기존 @@index/@@map 유지 ...
}
```
- 이 1줄은 Prisma Client용 선언이며, `users` 테이블에 ALTER를 발생시키지 않는다.
- 추가 위치: User 모델의 `partner_members` 다음 줄, `@@unique` 시작 전.

**신규 모델**:
```prisma
// ===== 심판/경기원 플랫폼 =====

model Referee {
  id             BigInt   @id @default(autoincrement())
  user_id        BigInt   @unique
  license_number String?  @unique @db.VarChar
  // 등급: beginner / intermediate / advanced / international
  level          String?  @db.VarChar
  // 역할 태그: "referee" | "scorer" | "timer" (콤마 구분 문자열, 1차는 단일값)
  role_type      String   @default("referee") @db.VarChar
  region_sido    String?  @db.VarChar
  region_sigungu String?  @db.VarChar
  // 상태: active / inactive / pending_review
  status         String   @default("active") @db.VarChar
  bio            String?
  joined_at      DateTime @default(now()) @db.Timestamp(6)
  created_at     DateTime @default(now()) @db.Timestamp(6)
  updated_at     DateTime @updatedAt @db.Timestamp(6)

  user           User                 @relation(fields: [user_id], references: [id], onDelete: Cascade)
  certificates   RefereeCertificate[]

  @@index([user_id])
  @@index([level])
  @@index([region_sido, region_sigungu])
  @@index([status])
  @@map("referees")
}

model RefereeCertificate {
  id          BigInt    @id @default(autoincrement())
  referee_id  BigInt
  // 종류: referee(심판) / scorer(경기원) / timer(기록원)
  cert_type   String    @db.VarChar
  // 등급: 1급/2급/3급/국제
  cert_grade  String    @db.VarChar
  issuer      String    @db.VarChar
  issued_at   DateTime  @db.Date
  expires_at  DateTime? @db.Date
  file_url    String?   @db.VarChar
  verified    Boolean   @default(false)
  created_at  DateTime  @default(now()) @db.Timestamp(6)
  updated_at  DateTime  @updatedAt @db.Timestamp(6)

  referee     Referee   @relation(fields: [referee_id], references: [id], onDelete: Cascade)

  @@index([referee_id])
  @@index([cert_type, cert_grade])
  @@index([expires_at])
  @@map("referee_certificates")
}
```

**변경점 (초안 대비)**:
- `id` 타입: Int → **BigInt** (User와 일관, mybdr 전체 컨벤션)
- `role_type` 추가 (심판/경기원/기록원 1차 구분값)
- `bio` 추가 (대시보드/상세 카드용 자기소개)
- `RefereeCertificate.onDelete: Cascade` 추가 (Referee 삭제 시 자격증 동반 삭제)
- 인덱스 명시 (지역 검색, 상태 필터, 만료일 조회 대비)
- `@db.Date`/`@db.Timestamp(6)` 기존 mybdr 컨벤션 준수
- User ↔ Referee 관계는 **단방향만** 선언 (User 모델 0줄 수정)

**충돌 검증**:
- 테이블명 `referees`, `referee_certificates` — 기존 schema.prisma에 동명 테이블 **없음** (grep 확인 필요 but 명백히 신규)
- `prisma db push` 시 **CREATE TABLE 2건만 발생**, 기존 테이블 DROP/ALTER 없음

### 3. 라우트 구조 확정

```
src/app/(referee)/
├── layout.tsx                        ← (referee) 그룹 레이아웃, globals.css만 공유
└── referee/
    ├── layout.tsx                    ← 심판 플랫폼 전용 셸 (상단 헤더 + 사이드 네비)
    ├── page.tsx                      ← [Server] 대시보드
    ├── registry/
    │   ├── page.tsx                  ← [Client] 심판 목록 (검색/필터/페이지네이션)
    │   ├── new/
    │   │   └── page.tsx              ← [Client] 신규 등록 폼
    │   └── [id]/
    │       ├── page.tsx              ← [Server] 상세
    │       └── edit/
    │           └── page.tsx          ← [Client] 수정 폼
    └── certificates/
        ├── page.tsx                  ← [Client] 내 자격증 목록 + 추가 모달
        └── [id]/
            └── page.tsx              ← [Server] 자격증 상세
```

**각 페이지 역할**:
| 경로 | 유형 | 데이터 출처 | 내용 |
|------|------|-----------|------|
| `/referee` | Server | `getWebSession` + prisma findUnique | 내 심판 카드(없으면 "등록하기" CTA) / 내 자격증 개수 / 지역·등급 요약 / 만료 임박 자격증 경고 |
| `/referee/registry` | Client (SWR) | `GET /api/web/referees?q=&sido=&level=` | 심판 목록 카드 그리드 + 검색·지역·등급 필터 |
| `/referee/registry/new` | Client | `POST /api/web/referees` | 신규 등록 폼 (본인 1개만) |
| `/referee/registry/[id]` | Server | prisma 직접 쿼리 | 심판 상세 + 자격증 리스트 + (본인이면) 수정/삭제 버튼 |
| `/referee/registry/[id]/edit` | Client | `PUT /api/web/referees/[id]` | 본인만 접근 가능 (서버에서 세션 체크 후 redirect) |
| `/referee/certificates` | Client (SWR) | `GET /api/web/referee-certificates?mine=1` | 내 자격증 목록 + 추가 모달 |
| `/referee/certificates/[id]` | Server | prisma 직접 쿼리 | 자격증 상세 + 수정/삭제 버튼 |

**레이아웃 조립 방식**:
- `(referee)/layout.tsx` — 최소 래퍼. `<html>`/`<body>`는 **루트 layout이 담당**하므로 여기선 `children`만 반환 (혹은 생략)
- `(referee)/referee/layout.tsx` — 심판 플랫폼의 독자 셸
  - 상단: BDR 로고(Link to /) + "심판 플랫폼" 타이틀 + 다크/라이트 토글
  - 좌측 사이드 네비(lg+): 대시보드 / 심판 목록 / 자격증 / (나중에) 경기 배정
  - 하단 탭(mobile): 대시보드 / 목록 / 자격증
  - 로그인 체크: `getWebSession()` → null이면 `/login?next=/referee`로 redirect
  - **기존 (web) 사이드바/검색창/슬라이드메뉴는 import 안 함** (복잡도 회피 + 독립성 확보)

**디자인 원칙**:
- 기존 CSS 변수(`var(--color-*)`)만 사용, 하드코딩 색상 0
- Material Symbols 아이콘
- 버튼 radius 4px, 기존 컨벤션 준수

### 4. API 엔드포인트 스펙

모두 `src/app/api/web/` 하위 신규, `withWebAuth` + zod + prisma.

#### 4-1. `GET /api/web/referees`
- **쿼리**: `q` (이름/지역 검색), `sido`, `sigungu`, `level`, `status`, `page`, `take` (기본 20)
- **권한**: 로그인 필수 (목록은 누구나 볼 수 있음)
- **응답**: `{ items: Referee[], total, page, take }` — User join으로 nickname/profile_image 포함
- **보안**: 페이지네이션 강제 (take max 50)

#### 4-2. `POST /api/web/referees`
- **Zod**:
  ```ts
  {
    license_number?: string (max 50),
    level?: enum("beginner","intermediate","advanced","international"),
    role_type: enum("referee","scorer","timer"),
    region_sido?: string (max 20),
    region_sigungu?: string (max 30),
    bio?: string (max 500),
  }
  ```
- **권한**: 로그인 필수
- **로직**: `ctx.userId`로 이미 Referee 있는지 체크 → 있으면 409, 없으면 생성
- **IDOR**: user_id는 서버에서 `ctx.userId` 강제 주입 (요청 body에서 받지 않음)

#### 4-3. `GET /api/web/referees/[id]`
- **권한**: 로그인 필수 (공개 프로필)
- **응답**: Referee + certificates + user(nickname, profile_image)
- **id 타입**: URL은 문자열, 서버에서 BigInt 변환 시 try/catch

#### 4-4. `PUT /api/web/referees/[id]`
- **Zod**: POST와 동일 (모든 필드 optional)
- **권한**: `referee.user_id === ctx.userId` 검증 (IDOR 방지). 아니면 403
- **바디에 user_id 포함돼도 무시**

#### 4-5. `DELETE /api/web/referees/[id]`
- **권한**: 본인만 (`referee.user_id === ctx.userId`)
- **동작**: cascade로 자격증 동반 삭제

#### 4-6. `GET /api/web/referee-certificates`
- **쿼리**: `referee_id` (필수 아님) / `mine=1` (본인 꺼만)
- **권한**: 로그인 필수
- **응답**: `{ items: Certificate[] }`

#### 4-7. `POST /api/web/referee-certificates`
- **Zod**:
  ```ts
  {
    cert_type: enum("referee","scorer","timer"),
    cert_grade: string (max 20),
    issuer: string (max 100),
    issued_at: string (ISO date),
    expires_at?: string (ISO date),
    file_url?: string (URL 형식, max 500),
  }
  ```
- **권한**: 로그인 + 본인의 Referee 존재해야 함 (없으면 400 "먼저 심판 등록 필요")
- **IDOR**: 서버에서 `ctx.userId` → Referee 조회 → `referee_id` 강제 주입

#### 4-8. `GET /api/web/referee-certificates/[id]`
- **권한**: 로그인 필수
- **응답**: Certificate + referee(user_id, level)

#### 4-9. `PUT /api/web/referee-certificates/[id]`
- **권한**: `certificate.referee.user_id === ctx.userId` 검증
- **verified**: 본인이 PUT해도 강제 false (관리자 영역 확장 시 별도 엔드포인트)

#### 4-10. `DELETE /api/web/referee-certificates/[id]`
- **권한**: 본인만

**공통 규칙**:
- 응답은 `apiSuccess()` → snake_case 자동 변환 → 클라이언트에서 `data.items` 직접 접근 (래핑 없음)
- BigInt → `String(bigintValue)` 변환 후 응답 (JSON.stringify가 BigInt 지원 안 함)

### 5. 공통 컴포넌트 재사용 목록

**재사용 (import만, 수정 금지)**:
- `src/components/ui/*` — 기존 Button/Card/Badge/Skeleton이 있다면 재사용
- `src/components/shared/theme-toggle.tsx` — 다크/라이트 토글
- `src/lib/utils/case.ts` — snake_case 유틸
- CSS 변수(`var(--color-*)`) 전부

**재사용 안 함 (referee 안에서 자체 구현)**:
- 기존 (web) layout의 거대한 헤더/사이드바/슬라이드메뉴 — 복잡도 높고 alarm/검색/광고 로직이 얽혀 있어 referee에는 과함. 간결한 자체 셸 작성.
- 기존 ProfileDropdown — 일반 사용자 메뉴 기반. referee 셸에서는 "내 심판 프로필 가기" 단순 Link로 대체.

**referee 내부 신규 작은 컴포넌트**:
| 파일 | 역할 |
|------|------|
| `src/app/(referee)/referee/_components/referee-shell.tsx` | 셸 레이아웃 (헤더+사이드+본문 슬롯) |
| `src/app/(referee)/referee/_components/referee-card.tsx` | 심판 목록 카드 |
| `src/app/(referee)/referee/_components/referee-form.tsx` | 등록/수정 공통 폼 (Client) |
| `src/app/(referee)/referee/_components/certificate-card.tsx` | 자격증 카드 |
| `src/app/(referee)/referee/_components/certificate-form.tsx` | 자격증 추가/수정 폼 (Client) |
| `src/app/(referee)/referee/_components/empty-state.tsx` | "심판 등록 먼저 해주세요" CTA |

### 6. 구현 순서 (developer에게 넘길 단계)

| 순서 | 작업 | 담당 | 선행 | 예상 시간 |
|-----|------|------|------|----------|
| 1 | Prisma에 Referee/RefereeCertificate 모델 추가 + `prisma format` + `prisma generate` | developer | 없음 | 10분 |
| 2 | 개발 DB에 `prisma db push --skip-generate` → **기존 테이블 변경 없는지 dry-run 먼저 (--dry-run)**, 통과 시 실제 push | developer | 1 | 10분 |
| 3 | `/api/web/referees` GET+POST route | developer | 2 | 20분 |
| 4 | `/api/web/referees/[id]` GET+PUT+DELETE | developer | 3 | 20분 |
| 5 | `/api/web/referee-certificates` GET+POST + `[id]` GET+PUT+DELETE | developer | 4 | 25분 |
| 6 | `(referee)/referee/layout.tsx` + 대시보드 page.tsx | developer | 2 | 25분 |
| 7 | registry(목록/new/상세/edit) + certificates(목록/상세) | developer | 3,4,5,6 | 60분 |

**테스트 순서**:
- 3~5 완료 후 **tester**가 API 레벨 스모크 테스트 (curl 또는 Thunder)
- 6~7 완료 후 **tester**가 UI 수동 테스트 + **reviewer** 병렬

### 7. 리스크 / 미결 사항 (사용자 결정 필요)

| # | 항목 | 질문 | 제안 기본값 |
|---|------|------|-----------|
| Q1 | **한 유저가 여러 Referee 프로필?** | 한 사람이 "심판+경기원"을 둘 다 등록 가능해야 하나, 아니면 role_type만 다르게 1개 프로필? | **1인 1 Referee 프로필, role_type은 단일값.** 복수 역할은 certificates에서 type별로 구분하면 충분. |
| Q2 | **자격증 파일 업로드** | file_url은 외부 URL 저장인지, 실제 파일 업로드(Vercel Blob/S3)인지? | **1차는 file_url만** (외부 이미지/PDF 링크). 파일 업로드는 2차. |
| Q3 | **verified 플래그 운영** | 자격증 verified=true는 누가 승인? | **1차는 수동 관리자만** (DB 직접), 별도 admin UI 없음. verified 필터만 구현. |
| Q4 | **검색 범위** | 목록에서 비회원도 열람 가능하게? | **로그인 필수** (플랫폼 내부 MVP). 추후 공개 확장. |
| Q5 | **User 이름/프로필 이미지 노출** | 목록에서 User.nickname/profile_image를 보여도 되나 (개인정보)? | **nickname만 노출, profile_image는 include.** bio도 표시. |
| Q6 | **region 드롭다운 데이터** | 시도/시군구 리스트는 어디서? | **기존 코드에 region 상수 있는지 먼저 탐색** (탐색 못 함 — 사용자 확인 요청). 없으면 단순 문자열 input으로 1차 출시. |
| Q7 | **경기 배정 연동 시점** | 2차 범위라 했으나 Referee 모델에 `available_for_games: boolean` 같은 플래그 미리 넣을지? | **넣지 않음.** 2차에서 확장 (YAGNI). |
| Q8 | **layout 재활용 vs 자체** | (web) 레이아웃을 래핑해서 "심판 플랫폼" 서브 헤더를 추가? | **자체 레이아웃** (복잡도/의존성 분리). 사용자 확인 요망. |

---


## 구현 기록 (developer)

### Commit 1 (2026-04-12) — Prisma 모델 6개 + 협회 시드 + drift 복원

**변경 파일:**
- `prisma/schema.prisma` — User: `referee Referee?` 1줄 + `gender String? @db.VarChar` (drift 복원) + 신규 모델 6개 (Association, AssociationAdmin, Referee, RefereeCertificate, RefereeAssignment, RefereeSettlement)
- `prisma/seed.js` — 신규 (Association 20 upsert: KBA + 시도협회 17 + KBL/WKBL)
- `package.json` — `"prisma": { "seed": "node prisma/seed.js" }`

**⚠️ 발견된 DB drift (복원 처리):**
- `users.gender` (character varying, nullable, default null) → schema에 `gender String? @db.VarChar` 추가로 복원
- 다른 drift 없음 ✅

**최종 dry-run SQL 요약:**
- CREATE TABLE: 6건 (associations, association_admins, referees, referee_certificates, referee_assignments, referee_settlements)
- CREATE INDEX: 22건 (UNIQUE 4 + 일반 18)
- ADD CONSTRAINT (신규 FK): 8건
- ALTER TABLE "users": 0건 ✅
- 기존 테이블 ALTER/DROP: 0건 ✅

**db push 결과:** 성공 (Supabase dev, 1.63s, "Your database is now in sync")
**seed 결과:** Association rows: 20 (KBA id=1 / 시도협회 17 / KBL / WKBL)
**tsc --noEmit:** 0 errors

**PM 공유 메모:** Prisma schema drift(users.gender 누락)가 있었음. errors.md 기록 필요. 향후 누가 User 모델을 만질 때 `birth_date` 아래 gender 1줄이 있다는 점에 주의.

💡 tester 참고:
- DB 상태 확인: `node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.association.count().then(c=>{console.log(c);p.\$disconnect()})"` → 20
- 계층 확인: level='national'인 KBA(id=1) 1건, level='sido' 17건, level='national'(KBL/WKBL) 2건 = 총 20
- parent_id: KBL/WKBL은 parent_id=null (KBA 산하 아님), 시도협회 17개는 parent_id=1 (KBA)

⚠️ reviewer 참고:
- drift 복원 라인(`gender String? @db.VarChar`)이 PM 범위 내 1줄 추가인지 재확인
- schema.prisma의 Referee ↔ User 1:1 관계(`referee Referee?`)가 정상인지
- seed.js 스크립트가 idempotent한지 (upsert 기반이므로 재실행 안전)

## 테스트 결과 (tester)
(아직 없음)

## 작업 로그
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 2026-04-12 | planner-architect | 심판 플랫폼 MVP 재설계 v2 (협회 계층 + 배정/정산 + Excel 검증) | 완료 — 6모델/17API/CREATE 6건/ALTER 0건 확정, Q1(옵션 B) Q2(User 0수정) 사용자 승인 대기 |
| 2026-04-12 | pm | 사용자 최종 확정 반영 (Q1=B, Q2=v1, game_id 제거) | scratchpad "✅ 최종 확정" 블록 추가 + decisions.md 3건 기록, developer 호출 준비 완료 |
| 2026-04-12 | developer | Commit 1: Prisma 6모델 + 협회 20시드 + users.gender drift 복원 | CREATE 6/ALTER 0, db push·seed 성공, tsc 0 errors, errors.md 기록 완료 |
