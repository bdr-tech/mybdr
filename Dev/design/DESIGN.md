# BDR 디자인 시스템 통합 문서

> BDR (Basketball Daily Routine) 프로젝트의 디자인 시스템 명세.
> 방향: **쿨 그레이 + BDR Red**, 다크 모드 기본.

---

## 1. 디자인 시스템 개요

BDR은 농구 대회 플랫폼으로, 시각적 정체성은 **BDR Red(#E31B23)**와 **쿨 그레이 중성색**으로 구성된다.

- **다크 모드가 기본값**이다. 라이트 모드는 CSS 변수 오버라이드로 전환한다.
- 모든 중성색(neutral)은 **쿨 그레이**(R=G=B 또는 차이 2 이내)를 사용한다.
- **핑크, 살몬, 로즈, 코랄, 따뜻한 베이지 계열 색상은 절대 금지**한다.

---

## 2. 색상 체계

### 2-1. 브랜드 색상 (다크/라이트 동일)

| 역할 | 변수명 | 값 | 용도 |
|------|--------|-----|------|
| Primary (기본 강조) | `--color-primary` | `#E31B23` | 주요 버튼, 활성 아이콘, CTA |
| Primary Hover | `--color-primary-hover` | `#FF3B3B` | Primary 호버 시 밝은 레드 |
| Primary Light | `--color-primary-light` | `rgba(227,27,35,0.15)` | 반투명 레드 배경 |
| Accent / Secondary (보조) | `--color-accent` | `#1B3C87` | 보조 버튼, 브랜딩, 데이터 시각화 |
| Accent Hover | `--color-accent-hover` | `#2A4F9E` | 네이비 호버 |
| Accent Light | `--color-accent-light` | `rgba(27,60,135,0.15)` | 네이비 반투명 배경 |
| Tertiary / Info | `--color-tertiary` | `#0079B9` | 링크, 정보성 뱃지, 삼차 액션 |

### 2-2. 다크 모드 (기본값, @theme 블록)

**배경/표면 계층:**

| 역할 | 변수명 | 값 |
|------|--------|-----|
| 페이지 배경 | `--color-background` | `#131313` |
| 섹션/영역 배경 | `--color-surface` | `#1A1A1A` |
| 카드 배경 | `--color-card` | `#2A2A2A` |
| 떠있는 요소 (모달 등) | `--color-elevated` | `#3A3A3A` |
| 입력 필드 배경 | `--color-surface-lowest` | `#0E0E0E` |
| 카드 호버 | `--color-surface-bright` | `#444444` |

**텍스트:**

| 역할 | 변수명 | 값 |
|------|--------|-----|
| 헤드라인 | `--color-text-primary` | `#E0E0E0` |
| 본문 | `--color-text-secondary` | `#B0B0B0` |
| 캡션/힌트 | `--color-text-muted` | `#888888` |
| 비활성 | `--color-text-disabled` | `#555555` |
| 브랜드 버튼 위 | `--color-text-on-primary` | `#FFFFFF` |

**테두리:**

| 역할 | 변수명 | 값 |
|------|--------|-----|
| 기본 고스트 보더 | `--color-border` | `rgba(255,255,255,0.08)` |
| 미세한 구분선 | `--color-border-subtle` | `rgba(255,255,255,0.04)` |

### 2-3. 라이트 모드 (html.light 오버라이드)

**배경/표면 계층:**

| 역할 | 변수명 | 값 |
|------|--------|-----|
| 페이지 배경 | `--color-background` | `#F8F8F8` |
| 섹션/영역 배경 | `--color-surface` | `#F2F2F2` |
| 카드 배경 | `--color-card` | `#FFFFFF` |
| 떠있는 요소 | `--color-elevated` | `#E8E8E8` |
| 입력 필드 배경 | `--color-surface-lowest` | `#FFFFFF` |
| 카드 호버 | `--color-surface-bright` | `#EEEEEE` |

**텍스트:**

| 역할 | 변수명 | 값 |
|------|--------|-----|
| 헤드라인 | `--color-text-primary` | `#131313` |
| 본문 | `--color-text-secondary` | `#555555` |
| 캡션/힌트 | `--color-text-muted` | `#888888` |
| 비활성 | `--color-text-disabled` | `#AAAAAA` |

**테두리:**

| 역할 | 변수명 | 값 |
|------|--------|-----|
| 기본 보더 | `--color-border` | `#D0D0D0` |
| 미세한 구분선 | `--color-border-subtle` | `#E0E0E0` |

### 2-4. 상태 색상

| 상태 | 변수명 | 값 |
|------|--------|-----|
| 성공 | `--color-success` | `#10B981` |
| 에러 | `--color-error` | `#EF4444` |
| 에러 배경 | `--color-error-light` | `rgba(227,27,35,0.15)` |
| 경고 | `--color-warning` | `#F59E0B` |
| 정보 | `--color-info` | `#0079B9` |

### 2-5. 금지 색상

다음 색상 범위는 **모든 요소(버튼, 아이콘, 텍스트, 배경, 테두리, 그림자, 그라디언트, 호버 상태)에서 절대 사용 금지**:

- 핑크, 살몬, 로즈, 코랄, 피치
- 따뜻한 흰색, 크림색, 따뜻한 베이지
- 금지 hex 범위: `#FF8xxx`, `#FFAxxx`, `#FFBxxx`, `#E7Bxxx`, `#E8Axxx`, `#F0Dxxx`, `#FFF0xx`, `#FFF5xx`, `#FAExxx`, `#FCExxx`
- 빨강(#E31B23)의 밝은 변형을 만들 때 핑크로 빠지면 안 된다. 투명도를 줄여서 처리한다.

### 2-6. 색상 변형 규칙

| 원색 | 밝게 | 어둡게 |
|------|------|--------|
| Red `#E31B23` | `rgba(227,27,35, 0.15)` | `#C41820`, `#9E1019` |
| Navy `#1B3C87` | `rgba(27,60,135, 0.15)` | `#142D66`, `#0E1F48` |
| Blue `#0079B9` | `rgba(0,121,185, 0.15)` | `#005F91`, `#004A72` |
| Neutral 전체 | 순수 그레이 축 유지 | R값이 G, B를 2 이상 초과 금지 |

---

## 3. 타이포그래피

### 3-1. 폰트 패밀리

| 용도 | 폰트 | CSS 변수 | 로드 방식 |
|------|------|----------|----------|
| 영문 제목 (Display, Headline) | Space Grotesk | `--font-heading` | Next.js `next/font/google` (400, 500, 700) |
| 한글 본문 전체 | Pretendard | `--font-sans` | CDN (jsdelivr, v1.3.8) |
| 기존 호환용 (일부 사용처) | Quicksand | - | Google Fonts CDN |

- `h1`, `h2`, `h3`, `.text-xl` 이상은 자동으로 `--font-heading` (Space Grotesk) 적용
- 그 외 모든 본문은 `--font-sans` (Pretendard) 적용

### 3-2. 크기 체계

| 레벨 | 폰트 | 굵기 | 크기 | 자간 |
|------|------|------|------|------|
| Display | Space Grotesk | Bold | 3.5rem | -2% |
| Headline | Space Grotesk | Medium | 1.75rem | -1% |
| Title | Pretendard | SemiBold | 1.375rem | 0 |
| Body | Pretendard | Regular | 1rem | 0 |
| Label | Pretendard | Medium | 0.75rem | 0 |

### 3-3. 큰글씨 모드

`html.large-text` 클래스 추가 시 전체 폰트가 120%로 확대된다:

| 클래스 | 기본 | 큰글씨 모드 |
|--------|------|------------|
| `text-xs` | 0.75rem | 0.9rem |
| `text-sm` | 0.875rem | 1.05rem |
| `text-base` | 1rem | 1.2rem |
| `text-lg` | 1.125rem | 1.35rem |
| `text-xl` | 1.25rem | 1.5rem |
| `text-2xl` | 1.5rem | 1.8rem |

---

## 4. 아이콘

### 4-1. 라이브러리

- **사용**: Material Symbols Outlined (Google Fonts CDN)
- **금지**: lucide-react (완전 제거됨)

### 4-2. 기본 설정

```css
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
```

### 4-3. 활성 상태

활성(선택된) 아이콘은 FILL 1로 채운다:

```tsx
style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
```

### 4-4. 크기 매핑

| 용도 | Tailwind 클래스 | 사용처 |
|------|----------------|--------|
| 사이드바/네비 | `text-xl` (1.25rem) | 사이드바 메뉴, 헤더 아이콘 |
| 모바일 하단 탭 | `text-2xl` (1.5rem) | 하단 네비바 |
| FAB 버튼 | `text-3xl` (1.875rem) | 플로팅 액션 버튼 |
| 설정 메뉴 | `text-lg` (1.125rem) | Settings, Logout 링크 |

---

## 5. 레이아웃 구조

### 5-1. 반응형 기준점

- **브레이크포인트**: `lg` = 1024px
- lg 이상: 데스크탑 레이아웃
- lg 미만: 모바일 레이아웃

### 5-2. 데스크탑 (lg 이상)

```
+------------------+-------------------------------------------+
|                  |  상단 우측: 다크모드 + 글씨크기 + 검색     |
|  사이드바 w-64   |  + 알림 + 프로필                           |
|  (fixed left)    +-------------------------------------------+
|                  |                                             |
|  - BDR 로고      |  메인 콘텐츠                                |
|  - 6개 메뉴      |  (max-w-7xl, p-6 lg:p-10)                  |
|  - 플레이어 카드  |                                             |
|  - Upgrade Pro   |                                             |
|  - Settings      |                                             |
|  - Logout        +-------------------------------------------+
|                  |  푸터                                       |
+------------------+-------------------------------------------+
```

- 사이드바: `w-64` (16rem), `sidebar-scaled` (0.96배 축소로 내부 공간 확보)
- 메인 영역: `lg:ml-64` (사이드바 폭만큼 왼쪽 여백)
- 콘텐츠 최대폭: `max-w-7xl` (80rem)
- 패딩: `lg:pt-20 lg:pb-12 lg:p-10`

### 5-3. 모바일 (lg 미만)

```
+-------------------------------------------+
| 헤더 h-16 (fixed top)                     |
| BDR 로고 | 다크모드+글씨+검색+알림         |
+-------------------------------------------+
|                                           |
|  메인 콘텐츠                               |
|  (pt-20, pb-20)                           |
|                                           |
|                              [FAB h-14]   |
+-------------------------------------------+
| 하단 네비 h-16 (fixed bottom)             |
| 홈 | 경기 | 대회 | 팀 | 더보기            |
+-------------------------------------------+
```

- 상단 헤더: `h-16` (4rem), fixed, z-50
- 하단 네비바: `h-16` (4rem), fixed, z-50, 5개 탭
- FAB (플로팅 버튼): `h-14 w-14`, bottom 5rem, right 1.5rem, z-100
- 콘텐츠 패딩: `pt-20 pb-20` (헤더+네비 겹침 방지)
- "더보기" 탭: SlideMenu 컴포넌트를 열어 추가 메뉴 표시

---

## 6. 컴포넌트 스타일

### 6-1. 버튼

| 속성 | 값 | 비고 |
|------|-----|------|
| border-radius | `4px` (`--radius-button`) | pill(9999px) 절대 금지 |
| Primary | `bg-primary`, 텍스트 `#FFFFFF` | hover: `bg-primary-hover` |
| Secondary | `bg-accent`, 텍스트 `#FFFFFF` | hover: `bg-accent-hover` |
| Outlined | `transparent` bg, `#E31B23` border 1.5px | |
| Ghost | `transparent` bg, `#E0E0E0` 텍스트 | |

### 6-2. 카드

| 속성 | 다크 | 라이트 |
|------|------|--------|
| 배경 | `--color-card` (#2A2A2A) | `--color-card` (#FFFFFF) |
| 테두리 | `--color-border` | `--color-border` |
| 라운딩 | `rounded-lg` (8px, `--radius-card`) | 동일 |
| 그림자 | `0 2px 8px rgba(0,0,0,0.2)` | `0 2px 8px rgba(0,0,0,0.06)` |
| 호버 배경 | `--color-card-hover` (#333333) | `--color-card-hover` (#F0F0F0) |

### 6-3. 호버/인터랙션

- 버튼 누르기: `active:scale-95` (눌림 효과)
- FAB 누르기: `active:scale-90`
- 모바일 하단 탭 활성: `scale-110` + Primary 색상
- 터치 최적화: `touch-action: manipulation`, `-webkit-tap-highlight-color: transparent`

### 6-4. 그림자

| 레벨 | 변수명 | 다크 | 라이트 |
|------|--------|------|--------|
| 카드 | `--shadow-card` | `0 2px 8px rgba(0,0,0,0.2)` | `0 2px 8px rgba(0,0,0,0.06)` |
| 떠있는 요소 | `--shadow-elevated` | `0 4px 16px rgba(0,0,0,0.3)` | `0 4px 16px rgba(0,0,0,0.1)` |
| 모바일 네비 | 인라인 | `0 -4px 12px rgba(0,0,0,0.5)` | 동일 |

### 6-5. 가로 스크롤

수평 스크롤 영역에서 스크롤바를 숨긴다:

```css
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

또는 `.scrollbar-hide` 클래스도 동일한 역할.

---

## 7. 테마 전환

### 7-1. 구조

- `html.dark`: 다크 모드 (기본값). `@theme` 블록의 값이 곧 다크 값.
- `html.light`: 라이트 모드. CSS 변수를 오버라이드.
- 브랜드 색상(primary, accent, tertiary)은 다크/라이트 모드에서 동일하게 유지.

### 7-2. 초기화 (FOUC 방지)

`<head>` 안의 인라인 스크립트가 페이지 로드 전에 실행:

1. `localStorage.getItem('theme')` 확인
2. 없으면 시스템 설정(`prefers-color-scheme: dark`) 따름
3. `html` 태그에 `dark` 또는 `light` 클래스 추가
4. `large-text` 설정도 동시에 복원

### 7-3. 글래스모피즘 (반투명 효과)

| 변수 | 다크 | 라이트 |
|------|------|--------|
| `--color-glass-bg` | `rgba(26,26,26,0.7)` | `rgba(255,255,255,0.7)` |
| `--color-glass-blur` | `20px` | 동일 |

### 7-4. 그라디언트

| 변수 | 값 | 용도 |
|------|-----|------|
| `--color-gradient-start` | `#E31B23` | CTA 그라디언트 시작 (Red) |
| `--color-gradient-end` | `#1B3C87` | CTA 그라디언트 끝 (Navy) |

---

## 8. YouTube 히어로 영역

홈 페이지 상단에 YouTube 영상을 자동으로 표시하는 히어로 섹션:

- **인기 영상 2개**: 채널의 최근 150개 영상 중 조회수가 가장 높은 영상 (쇼츠 제외, 1분 이상)
- **라이브 영상 2개**: 현재 라이브 중인 영상 (있을 경우)
- **쇼츠 제외**: 1분 미만 영상은 인기 영상에서 자동 필터링
- **자동 슬라이드**: 히어로 카드가 자동으로 순환
- **캐시**: 30분 TTL로 YouTube API 쿼터 절약

---

## 9. CSS 변수 레퍼런스

> `src/app/globals.css` 기준. `@theme` 블록 = 다크 기본값, `html.light` = 라이트 오버라이드.

### 9-1. 배경/표면

| 변수 | 다크 (기본) | 라이트 |
|------|------------|--------|
| `--color-background` | `#131313` | `#F8F8F8` |
| `--color-surface` | `#1A1A1A` | `#F2F2F2` |
| `--color-card` | `#2A2A2A` | `#FFFFFF` |
| `--color-elevated` | `#3A3A3A` | `#E8E8E8` |
| `--color-surface-lowest` | `#0E0E0E` | `#FFFFFF` |
| `--color-surface-low` | `#1A1A1A` | `#F2F2F2` |
| `--color-surface-high` | `#3A3A3A` | `#E8E8E8` |
| `--color-surface-bright` | `#444444` | `#EEEEEE` |

### 9-2. 브랜드/강조

| 변수 | 값 |
|------|-----|
| `--color-primary` | `#E31B23` |
| `--color-primary-hover` | `#FF3B3B` |
| `--color-primary-light` | `rgba(227,27,35,0.15)` |
| `--color-on-primary` | `#FFFFFF` |
| `--color-accent` | `#1B3C87` |
| `--color-accent-hover` | `#2A4F9E` |
| `--color-accent-light` | `rgba(27,60,135,0.15)` |
| `--color-secondary` | `#1B3C87` |
| `--color-tertiary` | `#0079B9` |

### 9-3. 텍스트

| 변수 | 다크 (기본) | 라이트 |
|------|------------|--------|
| `--color-text-primary` | `#E0E0E0` | `#131313` |
| `--color-text-secondary` | `#B0B0B0` | `#555555` |
| `--color-text-muted` | `#888888` | `#888888` |
| `--color-text-disabled` | `#555555` | `#AAAAAA` |
| `--color-text-on-primary` | `#FFFFFF` | (동일) |

### 9-4. 상태

| 변수 | 값 |
|------|-----|
| `--color-success` | `#10B981` |
| `--color-error` | `#EF4444` |
| `--color-error-light` | `rgba(227,27,35,0.15)` |
| `--color-error-hover` | `#DC2626` |
| `--color-warning` | `#F59E0B` |
| `--color-info` | `#0079B9` |

### 9-5. 테두리

| 변수 | 다크 (기본) | 라이트 |
|------|------------|--------|
| `--color-border` | `rgba(255,255,255,0.08)` | `#D0D0D0` |
| `--color-border-subtle` | `rgba(255,255,255,0.04)` | `#E0E0E0` |

### 9-6. 라운딩/그림자/폰트

| 변수 | 값 |
|------|-----|
| `--radius-card` | `0.5rem` (8px) |
| `--radius-card-lg` | `0.75rem` (12px) |
| `--radius-pill` | `0.25rem` (4px, pill 아님) |
| `--radius-button` | `4px` |
| `--shadow-card` | 다크: `0 2px 8px rgba(0,0,0,0.2)` / 라이트: `0 2px 8px rgba(0,0,0,0.06)` |
| `--shadow-elevated` | 다크: `0 4px 16px rgba(0,0,0,0.3)` / 라이트: `0 4px 16px rgba(0,0,0,0.1)` |
| `--font-sans` | `'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif` |
| `--font-heading` | `'Space Grotesk', 'Pretendard', sans-serif` |

### 9-7. 호환/기타

| 변수 | 다크 (기본) | 라이트 |
|------|------------|--------|
| `--color-bg-primary` | `#131313` | `#F8F8F8` |
| `--color-bg-secondary` | `#1A1A1A` | `#F2F2F2` |
| `--color-bg-card` | `#2A2A2A` | `#FFFFFF` |
| `--color-bg-hover` | `#333333` | `#EEEEEE` |
| `--color-card-hover` | `#333333` | `#F0F0F0` |
| `--color-gradient-start` | `#E31B23` | (동일) |
| `--color-gradient-end` | `#1B3C87` | (동일) |
| `--color-glass-bg` | `rgba(26,26,26,0.7)` | `rgba(255,255,255,0.7)` |
| `--color-glass-blur` | `20px` | (동일) |
