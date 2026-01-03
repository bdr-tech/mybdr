# BDR Platform - Claude Code Instructions

## Project Overview

BDR Platform은 **농구 동호회 및 대회 관리 플랫폼**입니다. Rails 8.0 + Tailwind CSS 4.0 기반의 모놀리식 아키텍처로, Toss 스타일의 모던 UI를 제공합니다.

---

## Key Documentation

- **[README.md](./README.md)** - 프로젝트 개요, 설치 방법
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - 시스템 아키텍처, 도메인 모델
- **[docs/DESIGN.md](./docs/DESIGN.md)** - 디자인 시스템, UI 컴포넌트

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | Ruby 3.3+, Rails 8.0 |
| Database | PostgreSQL (prod), SQLite (dev) |
| Frontend | Tailwind CSS 4.0, Stimulus |
| Auth | Session-based + OmniAuth (Google, Kakao) |
| Background | Solid Queue |
| Cache | Solid Cache |

---

## Project Structure

```
app/
├── controllers/
│   ├── admin/              # 슈퍼관리자 (/admin)
│   ├── tournament_admin/   # 대회관리 (/tournament_admin)
│   └── api/v1/            # REST API
├── models/
├── views/
│   ├── admin/
│   ├── tournament_admin/
│   └── shared/            # 공용 partials (_navbar, _footer, etc.)
└── assets/
    └── tailwind/
        └── application.css  # 디자인 시스템 정의

docs/
├── ARCHITECTURE.md
└── DESIGN.md
```

---

## Development Commands

```bash
# 서버 실행
bin/rails server
PORT=3000 bin/rails server

# 데이터베이스
bin/rails db:migrate
bin/rails db:seed

# Tailwind CSS 빌드
bin/rails tailwindcss:build
bin/rails tailwindcss:watch  # 개발시

# 테스트
bin/rails test
```

---

## Design System Quick Reference

### CSS Classes

**Buttons:**
- `btn-primary` - 빨간색 주요 버튼
- `btn-secondary` - 회색 보조 버튼
- `btn-outline` - 테두리 버튼
- `btn-ghost` - 투명 버튼
- `btn-danger` - 위험 동작 버튼
- `btn-sm`, `btn-lg` - 크기 조절

**Cards:**
- `card` - 기본 카드 (흰색, rounded-2xl, shadow)
- `card-elevated` - 강조 카드
- `card-interactive` - 클릭 가능 카드

**Forms:**
- `form-label` - 라벨
- `form-input` - 입력 필드
- `form-select` - 셀렉트박스
- `form-checkbox` - 체크박스
- `form-error` - 오류 메시지

**Badges:**
- `badge-{status}` - 상태별 뱃지
- 상태: `draft`, `published`, `pending`, `approved`, `rejected`, `cancelled`
- 결제: `unpaid`, `paid`, `refunded`
- 멤버십: `free`, `pro`, `pickup-host`, `tournament-admin`, `super-admin`

**Alerts:**
- `alert-info`, `alert-success`, `alert-warning`, `alert-error`

**Layout:**
- `container-app` - 메인 컨테이너 (max-w-7xl)
- `container-narrow` - 좁은 컨테이너 (max-w-2xl)

---

## Key Patterns

### Controller Organization
```ruby
# 일반 사용자: app/controllers/
# 대회 관리자: app/controllers/tournament_admin/
# 슈퍼 관리자: app/controllers/admin/
```

### View Conventions
```erb
<%# 페이지 제목 %>
<% content_for :title, "페이지 제목" %>

<%# 뒤로가기 링크 %>
<%= link_to back_path, class: "inline-flex items-center text-gray-600..." do %>
  <svg>...</svg> 목록으로
<% end %>

<%# 카드 레이아웃 %>
<div class="card p-6">
  ...
</div>
```

### Button Patterns
```erb
<%# 일반 링크 버튼 %>
<%= link_to "텍스트", path, class: "btn btn-primary" %>

<%# POST/DELETE 등 non-GET 요청 (Rails 7+ Turbo) %>
<%= button_to "삭제", path, method: :delete,
    data: { turbo_confirm: "정말 삭제하시겠습니까?" },
    class: "btn btn-danger" %>
```

### Flash Messages
```erb
<%# shared/_flash.html.erb 에서 자동 처리 %>
redirect_to path, notice: "성공 메시지"
redirect_to path, alert: "오류 메시지"
```

---

## Important Models

| Model | Description |
|-------|-------------|
| `User` | 사용자 (membership, is_admin) |
| `Game` | 픽업 게임 |
| `GameApplication` | 경기 참가 신청 |
| `Team` | 팀 |
| `Tournament` | 대회 |
| `TournamentSite` | 대회 전용 사이트 |
| `CommunityPost` | 커뮤니티 게시글 |
| `Notification` | 알림 |

---

## Route Namespaces

| Path | Namespace | Purpose |
|------|-----------|---------|
| `/` | root | 일반 사용자 |
| `/admin/*` | Admin:: | 슈퍼관리자 |
| `/tournament_admin/*` | TournamentAdmin:: | 대회관리자 |
| `/api/v1/*` | Api::V1:: | REST API |

---

## Common Issues & Solutions

### Rails 7+ POST/DELETE 요청
```erb
<%# 잘못된 방법 (GET으로 전송됨) %>
<%= link_to "삭제", path, method: :delete %>

<%# 올바른 방법 %>
<%= button_to "삭제", path, method: :delete %>
```

### Turbo Confirm Dialog
```erb
<%= button_to "삭제", path,
    method: :delete,
    data: { turbo_confirm: "정말 삭제하시겠습니까?" } %>
```

### Form with Category-specific Fields
```erb
<%# 카테고리 선택에 따라 필드 표시/숨김 %>
<div data-controller="category-fields">
  <%= f.select :category, options,
      data: { action: "change->category-fields#toggle" } %>

  <div id="specific-fields" class="hidden"
       data-category-fields-target="specificFields">
    ...
  </div>
</div>
```

---

## Korean Text References

| 한글 | English | Usage |
|------|---------|-------|
| 경기 | Game | 픽업 게임 |
| 대회 | Tournament | 토너먼트 |
| 팀 | Team | - |
| 신청 | Application | 참가 신청 |
| 승인 | Approve | - |
| 거절 | Reject | - |
| 취소 | Cancel | - |
| 결제 | Payment | - |
| 알림 | Notification | - |
| 커뮤니티 | Community | - |

---

## Test Accounts (After Seeding)

| Role | Email | Password |
|------|-------|----------|
| 슈퍼관리자 | admin@bdr.com | password123! |
| 대회관리자 | tournament@bdr.com | password123! |
| 픽업호스트 | pickup@bdr.com | password123! |
| 일반유저 | user@bdr.com | password123! |

---

## Deployment Workflow (Kamal)

**중요: Kamal은 git에 커밋된 코드만 배포합니다!**

### 배포 순서

```bash
# 1. 로컬 서버에서 먼저 테스트
bin/rails server

# 2. 브라우저에서 변경사항 확인
# http://localhost:3000

# 3. 테스트 통과 확인
bin/rails test

# 4. 변경사항 커밋
git add .
git commit -m "변경 내용 설명"

# 5. 프로덕션 배포
kamal deploy
```

### 주의사항

- **커밋 전 반드시 로컬에서 테스트**
- 커밋되지 않은 변경사항은 배포되지 않음
- 배포 실패 시 `kamal lock release`로 락 해제

### 서버 접속 (SSH 비밀번호 방식)

```bash
# sshpass 필요 (brew install hudochenkov/sshpass/sshpass)
sshpass -p '비밀번호' ssh root@157.245.196.193

# Docker 컨테이너 확인
docker ps

# Rails 콘솔
kamal app exec -i 'bin/rails console'

# 로그 확인
kamal app logs -f
```

---

## Best Practices

1. **View 작성시** - 기존 뷰 파일의 패턴 참고
2. **버튼 액션** - GET 외에는 항상 `button_to` 사용
3. **디자인** - `docs/DESIGN.md` 컴포넌트 클래스 활용
4. **한글 텍스트** - 기존 파일의 용어 일관성 유지
5. **에러 처리** - flash 메시지로 사용자 피드백
6. **배포 전** - 반드시 로컬 서버에서 테스트 후 커밋
