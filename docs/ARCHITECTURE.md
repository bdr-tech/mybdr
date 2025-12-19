# BDR Platform Architecture

## Overview

BDR Platform은 농구 동호회 및 대회 관리를 위한 종합 플랫폼입니다. Rails 8.0 기반의 모놀리식 아키텍처로 구현되어 있으며, Toss 스타일의 모던 UI를 제공합니다.

## Technology Stack

### Backend
- **Ruby**: 3.3+
- **Rails**: 8.0
- **Database**: PostgreSQL 14+ (SQLite for development)
- **Background Jobs**: Solid Queue
- **Cache**: Solid Cache
- **Authentication**: Custom session-based + OmniAuth (Google, Kakao)

### Frontend
- **CSS Framework**: Tailwind CSS 4.0
- **JavaScript**: Importmap + Stimulus
- **Font**: Pretendard Variable
- **Icons**: Heroicons (inline SVG)

### Infrastructure
- **File Storage**: Active Storage (AWS S3 for production)
- **Payment**: 토스페이먼츠 (TossPayments)
- **Email**: Action Mailer

---

## Application Structure

```
bdr_platform/
├── app/
│   ├── controllers/
│   │   ├── admin/                 # 슈퍼관리자 (전체 시스템)
│   │   ├── tournament_admin/      # 대회관리자 (대회별)
│   │   ├── api/v1/               # REST API
│   │   └── concerns/
│   ├── models/
│   │   └── concerns/
│   ├── views/
│   │   ├── admin/                # 관리자 뷰
│   │   ├── tournament_admin/     # 대회관리 뷰
│   │   ├── layouts/              # 레이아웃
│   │   └── shared/               # 공용 partial
│   ├── services/                 # 비즈니스 로직
│   ├── helpers/
│   └── javascript/
│       └── controllers/          # Stimulus controllers
├── config/
│   ├── routes.rb                 # 라우팅 설정
│   └── initializers/
├── db/
│   ├── migrate/                  # 마이그레이션
│   └── seeds.rb                  # 시드 데이터
└── test/
```

---

## Domain Models

### Core Entities

```
User
├── has_many :games (as organizer)
├── has_many :game_applications
├── has_many :teams (as leader)
├── has_many :team_memberships
├── has_many :tournaments (as organizer)
├── has_many :notifications
└── has_many :community_posts

Game (픽업 게임)
├── belongs_to :organizer (User)
├── has_many :game_applications
├── belongs_to :game_template (optional)
└── has_many :notifications

Team
├── belongs_to :leader (User)
├── has_many :team_members
├── has_many :team_join_requests
└── has_many :tournament_teams

Tournament (대회)
├── belongs_to :organizer (User)
├── belongs_to :series (TournamentSeries, optional)
├── has_many :tournament_teams
├── has_many :tournament_matches
├── has_one :tournament_site
└── has_many :tournament_admin_members

TournamentSite (대회 전용 사이트)
├── belongs_to :tournament
├── has_many :site_pages
└── has_many :site_sections (through pages)

CommunityPost (커뮤니티 게시글)
├── belongs_to :author (User)
├── belongs_to :team (optional)
├── has_many :comments
└── categories: free, info, review, team_recruit, court_info, trade
```

### Supporting Entities

```
GameApplication     - 경기 참가 신청
GameTemplate        - 경기 템플릿 (재사용)
TeamMember          - 팀 멤버
TeamJoinRequest     - 팀 가입 신청
TournamentTeam      - 대회 참가팀
TournamentMatch     - 대회 경기
MatchPlayerStat     - 선수 스탯
Payment             - 결제 정보
Notification        - 알림
Court/CourtInfo     - 농구장 정보
Suggestion          - 건의사항
AdminLog            - 관리자 활동 로그
SystemSetting       - 시스템 설정
```

---

## User Roles & Permissions

### Membership Levels
| Level | Code | Description |
|-------|------|-------------|
| 무료 회원 | `free` | 기본 기능 사용 |
| 프로 회원 | `pro` | 프리미엄 기능 |
| 픽업 호스트 | `pickup_host` | 경기 주최 권한 |
| 대회 관리자 | `tournament_admin` | 대회 관리 권한 |
| 슈퍼 관리자 | `super_admin` | 전체 시스템 관리 |

### Admin Hierarchy
```
SuperAdmin (Admin namespace)
└── 전체 시스템 관리
    ├── 사용자 관리
    ├── 대회 승인/관리
    ├── 결제 관리
    ├── 시스템 설정
    └── 관리자 로그

TournamentAdmin (TournamentAdmin namespace)
└── 특정 대회 관리
    ├── 대회 생성/수정
    ├── 참가팀 관리
    ├── 경기 일정 관리
    ├── 대회 사이트 관리
    └── 관리자 권한 부여
```

---

## Key Features

### 1. Game Management (경기 관리)
- 픽업 게임 생성/관리
- 참가 신청/승인 시스템
- 참가비 결제 연동
- 경기 템플릿 저장/재사용
- 반복 경기 설정

### 2. Team Management (팀 관리)
- 팀 생성/관리
- 팀원 초대 (코드 기반)
- 가입 신청/승인 시스템
- 팀 히스토리 기록

### 3. Tournament System (대회 시스템)
- 대회 생성 마법사
- 대진표 자동 생성
  - Single Elimination
  - Double Elimination
  - Round Robin
  - Swiss System
- 실시간 스코어 기록
- 선수 통계 관리
- 대회 시리즈 관리

### 4. Tournament Site Builder
- 대회별 전용 웹사이트
- 서브도메인 지원 (`subdomain.bdr.com`)
- 드래그앤드롭 페이지/섹션 편집
- 다양한 템플릿 제공
- 실시간 미리보기

### 5. Community (커뮤니티)
- 카테고리별 게시판
  - 자유 게시판
  - 정보 공유
  - 후기
  - 팀원 모집
  - 농구장 정보
  - 중고 장터
- 댓글 시스템
- 카테고리별 특수 필드

### 6. Notification System (알림)
- 실시간 알림
- 타입별 알림 처리
- 만료 시간 설정
- 읽음 상태 관리

---

## Route Structure

```ruby
# Public Routes
/                           # 홈
/login, /logout, /signup    # 인증
/games                      # 경기
/teams                      # 팀
/tournaments                # 대회
/community                  # 커뮤니티

# Tournament Admin Routes
/tournament_admin/          # 대회관리 대시보드
/tournament_admin/tournaments/:id/wizard  # 대회 생성 마법사

# Super Admin Routes
/admin/                     # 관리자 대시보드
/admin/users                # 사용자 관리
/admin/tournaments          # 대회 관리
/admin/payments             # 결제 관리
/admin/suggestions          # 건의사항
/admin/system_settings      # 시스템 설정

# API Routes
/api/v1/site_templates      # 사이트 템플릿 API
/api/v1/subdomain/check     # 서브도메인 확인
```

---

## Authentication Flow

### Session-based Auth
```
1. User submits email/password
2. SessionsController#create validates credentials
3. Session created with user_id
4. ApplicationController#current_user reads session
```

### OAuth Flow (Google/Kakao)
```
1. User clicks OAuth button
2. Redirect to /auth/:provider
3. OmniAuth handles OAuth flow
4. Callback to /auth/:provider/callback
5. OmniAuthCallbacksController finds/creates user
6. Session created
```

---

## Database Conventions

### UUID Primary Keys
모든 주요 모델은 UUID를 primary key로 사용:
```ruby
create_table :games, id: :uuid do |t|
  # ...
end
```

### Soft Delete
주요 모델은 soft delete 지원:
```ruby
scope :active, -> { where(deleted_at: nil) }
```

### Enum Pattern
상태 관리는 Rails enum 사용:
```ruby
enum :status, { draft: 0, published: 1, cancelled: 2 }
```

---

## Background Jobs

Solid Queue를 사용한 백그라운드 작업:
- 알림 발송
- 이메일 발송
- 대회 상태 업데이트
- 통계 계산

---

## Caching Strategy

Solid Cache를 사용한 캐싱:
- Fragment caching for views
- Russian doll caching
- Counter caching for statistics

---

## File Upload

Active Storage 사용:
- 개발: Local storage
- 프로덕션: AWS S3

---

## Testing Strategy

```bash
# 전체 테스트
bin/rails test

# 모델 테스트
bin/rails test test/models

# 컨트롤러 테스트
bin/rails test test/controllers

# 특정 파일
bin/rails test test/models/user_test.rb
```

---

## Deployment

### Environment Variables
필수 환경변수:
- `DATABASE_URL`
- `SECRET_KEY_BASE`
- `RAILS_MASTER_KEY`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET`

### Docker
```bash
docker build -t bdr_platform .
docker run -p 3000:3000 bdr_platform
```
