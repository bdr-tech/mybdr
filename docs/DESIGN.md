# BDR Platform Design System

## Overview

BDR Platform은 **Toss 스타일**의 모던하고 깔끔한 UI를 지향합니다. Tailwind CSS 4.0 기반으로 커스텀 디자인 시스템을 구축하였습니다.

---

## Color System

### Primary Colors (BDR Brand Red)
```css
--color-primary-50:  #FEF2F2;  /* 매우 연한 */
--color-primary-100: #FEE2E2;
--color-primary-200: #FECACA;
--color-primary-300: #FCA5A5;
--color-primary-400: #F87171;
--color-primary-500: #EF4444;  /* 기본 */
--color-primary-600: #DC2626;  /* 버튼, 강조 */
--color-primary-700: #B91C1C;
--color-primary-800: #991B1B;
--color-primary-900: #7F1D1D;  /* 매우 진한 */
```

### Secondary Colors (Orange)
```css
--color-secondary-50:  #FFF7ED;
--color-secondary-100: #FFEDD5;
--color-secondary-500: #F97316;
--color-secondary-600: #EA580C;
```

### Gray Colors (Toss-style)
```css
--color-gray-50:  #F9FAFB;  /* 배경 */
--color-gray-100: #F3F4F6;
--color-gray-200: #E5E7EB;  /* 테두리 */
--color-gray-300: #D1D5DB;
--color-gray-400: #9CA3AF;
--color-gray-500: #6B7280;  /* 보조 텍스트 */
--color-gray-600: #4B5563;
--color-gray-700: #374151;
--color-gray-800: #1F2937;
--color-gray-900: #111827;  /* 본문 텍스트 */
```

### Status Colors
```css
--color-success: #10B981;       /* 성공, 승인 */
--color-success-light: #D1FAE5;
--color-warning: #F59E0B;       /* 경고, 대기 */
--color-warning-light: #FEF3C7;
--color-error: #EF4444;         /* 오류, 거절 */
--color-error-light: #FEE2E2;
--color-info: #3B82F6;          /* 정보 */
--color-info-light: #DBEAFE;
```

---

## Typography

### Font Family
```css
--font-sans: "Pretendard Variable", Pretendard, -apple-system,
             BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue",
             "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR",
             "Malgun Gothic", sans-serif;
```

### Text Styles
| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `.text-display` | 36px | Bold | 페이지 제목 |
| `.text-headline` | 24px | Semibold | 섹션 제목 |
| `.text-title` | 20px | Semibold | 카드 제목 |
| `.text-subtitle` | 18px | Medium | 부제목 |
| `.text-body` | 16px | Normal | 본문 |
| `.text-caption` | 14px | Normal | 보조 텍스트 |
| `.text-muted` | - | - | 회색 텍스트 |

---

## Components

### Buttons

#### Primary Button
```html
<button class="btn-primary">버튼</button>
```
- 배경: `primary-600`
- 텍스트: white
- Hover: `primary-700`
- Active: `primary-800`

#### Secondary Button
```html
<button class="btn-secondary">버튼</button>
```
- 배경: `gray-100`
- 텍스트: `gray-700`
- Hover: `gray-200`

#### Outline Button
```html
<button class="btn-outline">버튼</button>
```
- 배경: white
- 테두리: `gray-200`
- Hover: `gray-50`

#### Ghost Button
```html
<button class="btn-ghost">버튼</button>
```
- 배경: transparent
- Hover: `gray-100`

#### Danger Button
```html
<button class="btn-danger">삭제</button>
```
- 배경: `error`
- 용도: 삭제, 취소 등 위험 동작

#### Button Sizes
```html
<button class="btn-primary btn-sm">Small</button>
<button class="btn-primary">Default</button>
<button class="btn-primary btn-lg">Large</button>
```

---

### Cards

#### Basic Card
```html
<div class="card">
  <!-- content -->
</div>
```
- 배경: white
- 모서리: `rounded-2xl` (16px)
- 그림자: `shadow-card`
- 패딩: `p-6`

#### Elevated Card
```html
<div class="card-elevated">
  <!-- content -->
</div>
```
- 더 강한 그림자

#### Interactive Card
```html
<div class="card-interactive">
  <!-- content -->
</div>
```
- Hover시 상승 효과
- 클릭 가능한 카드용

---

### Forms

#### Input
```html
<label class="form-label">라벨</label>
<input type="text" class="form-input" placeholder="placeholder">
<p class="form-hint">도움말 텍스트</p>
<p class="form-error">오류 메시지</p>
```

#### Select
```html
<select class="form-select">
  <option>옵션 1</option>
  <option>옵션 2</option>
</select>
```

#### Checkbox
```html
<input type="checkbox" class="form-checkbox">
```

#### Error State
```html
<input type="text" class="form-input-error">
```

---

### Badges

#### Basic Badges
```html
<span class="badge-primary">Primary</span>
<span class="badge-secondary">Secondary</span>
<span class="badge-success">Success</span>
<span class="badge-warning">Warning</span>
<span class="badge-error">Error</span>
<span class="badge-info">Info</span>
```

#### Membership Badges
```html
<span class="badge-free">무료 회원</span>
<span class="badge-pro">프로 회원</span>
<span class="badge-pickup-host">픽업 호스트</span>
<span class="badge-tournament-admin">대회 관리자</span>
<span class="badge-super-admin">슈퍼 관리자</span>
```

#### Game Type Badges
```html
<span class="badge-pickup">픽업</span>
<span class="badge-guest_recruit">용병 모집</span>
<span class="badge-team_vs_team">팀전</span>
```

#### Status Badges
```html
<!-- 게시/공개 상태 -->
<span class="badge-draft">임시저장</span>
<span class="badge-published">공개</span>
<span class="badge-cancelled">취소</span>

<!-- 신청 상태 -->
<span class="badge-pending">대기중</span>
<span class="badge-approved">승인</span>
<span class="badge-rejected">거절</span>

<!-- 결제 상태 -->
<span class="badge-unpaid">미결제</span>
<span class="badge-paid">결제완료</span>
<span class="badge-refunded">환불</span>
```

---

### Alerts

```html
<div class="alert-info">정보 메시지</div>
<div class="alert-success">성공 메시지</div>
<div class="alert-warning">경고 메시지</div>
<div class="alert-error">오류 메시지</div>
```

---

### Avatars

```html
<div class="avatar-xs">A</div>  <!-- 24px -->
<div class="avatar-sm">A</div>  <!-- 32px -->
<div class="avatar-md">A</div>  <!-- 40px -->
<div class="avatar-lg">A</div>  <!-- 48px -->
<div class="avatar-xl">A</div>  <!-- 64px -->
```

---

### Dropdowns

```html
<div class="dropdown-menu">
  <a class="dropdown-item">메뉴 1</a>
  <a class="dropdown-item">메뉴 2</a>
  <a class="dropdown-item-danger">삭제</a>
</div>
```

---

### Tabs

```html
<div class="tabs">
  <button class="tab-active">탭 1</button>
  <button class="tab">탭 2</button>
  <button class="tab">탭 3</button>
</div>
```

---

### Empty State

```html
<div class="empty-state">
  <svg class="empty-state-icon">...</svg>
  <h3 class="empty-state-title">데이터가 없습니다</h3>
  <p class="empty-state-description">설명 텍스트</p>
</div>
```

---

### Stats Card

```html
<div class="stat-card">
  <p class="stat-label">총 사용자</p>
  <p class="stat-value">1,234</p>
  <p class="stat-change-positive">+12%</p>
</div>
```

---

## Layout

### Container
```html
<div class="container-app">     <!-- max-w-7xl -->
  ...
</div>

<div class="container-narrow">  <!-- max-w-2xl -->
  ...
</div>
```

### Page Header
```html
<div class="page-header">
  <h1 class="page-title">페이지 제목</h1>
  <p class="page-description">페이지 설명</p>
</div>
```

---

## Spacing

Tailwind 기본 spacing scale 사용:
- `p-4` = 16px
- `p-6` = 24px
- `gap-4` = 16px
- `mb-8` = 32px

---

## Border Radius

```css
--radius-sm:   0.25rem;  /* 4px */
--radius-md:   0.5rem;   /* 8px */
--radius-lg:   0.75rem;  /* 12px */
--radius-xl:   1rem;     /* 16px */
--radius-2xl:  1.5rem;   /* 24px - 카드 기본 */
--radius-full: 9999px;   /* 원형 */
```

---

## Shadows

```css
--shadow-soft:     /* 가벼운 그림자 */
--shadow-card:     /* 카드 기본 그림자 */
--shadow-elevated: /* 강조 그림자 */
--shadow-modal:    /* 모달 그림자 */
```

---

## Responsive Breakpoints

Tailwind 기본 breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

---

## Animation

### Transitions
```html
<div class="transition-base">  <!-- 200ms ease-in-out -->
  ...
</div>
```

### Loading States
```html
<!-- Spinner -->
<div class="spinner"></div>

<!-- Skeleton -->
<div class="skeleton h-4 w-24"></div>
```

---

## Icons

Heroicons (inline SVG) 사용:
- Outline 스타일 기본
- `w-5 h-5` 또는 `w-6 h-6` 크기

```html
<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="..."/>
</svg>
```

---

## Best Practices

### Do's
- 일관된 spacing 사용 (4, 6, 8 단위)
- 카드에는 항상 `rounded-2xl` 사용
- 버튼에는 `rounded-xl` 사용
- 적절한 그림자로 depth 표현
- 상태별 색상 일관성 유지

### Don'ts
- 과도한 그림자 사용 금지
- 너무 작은 텍스트 사용 금지 (최소 14px)
- 일관성 없는 모서리 radius 사용 금지
- Primary 색상 남용 금지
