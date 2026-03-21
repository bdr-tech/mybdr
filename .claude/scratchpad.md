# 📋 작업 스크래치패드

## ⚡ 효율화 규칙 (2026-03-21 적용)
1. **병렬 실행**: 독립적인 에이전트는 동시 실행 (tester+reviewer 병렬 등)
2. **스크래치패드 경량 모드**: 소규모 작업(1~2파일)은 작업 로그 한 줄만. 대규모(5+파일)만 섹션 기록
3. **확인 생략**: 명확한 요청은 바로 실행. 모호한 것만 확인 질문
4. **tester+reviewer 병렬**: 동시 실행 후 결과 취합. 소규모는 tester만
5. **커밋 간소화**: tester 통과 시 PM이 직접 커밋. 복잡한 git만 git-manager 호출

## 현재 작업
- **요청**: CSS 변수 전면 교체 설계 (Kinetic Pulse)
- **상태**: architect 설계 완료
- **현재 담당**: architect → developer 대기

## 설계 노트 (architect) - Phase 5-1 CSS 변수 전면 교체

### 1단계: 현재 CSS 변수 전수 조사 + 사용처

| 변수명 | 현재 값 (다크) | 사용 횟수 (globals.css 제외) | 위험도 |
|--------|---------------|---------------------------|--------|
| `--color-accent` | #F4A261 | **51회** / 18파일 | 최고 |
| `--color-text-secondary` | #A0A0A0 | **68회** / 19파일 | 최고 |
| `--color-text-primary` | #F5F5F5 | **64회** / 24파일 | 최고 |
| `--color-text-muted` | #666666 | **65회** / 19파일 | 최고 |
| `--color-border` | #2A2A2A | **52회** / 23파일 | 최고 |
| `--color-card` | #1A1A1A | **33회** / 18파일 | 높음 |
| `--color-primary` | #5B7FD6 | **27회** / 12파일 | 높음 |
| `--color-elevated` | #222222 | **16회** / 10파일 | 중간 |
| `--color-accent-hover` | #FABD82 | **18회** / 5파일 | 중간 |
| `--color-surface` | #1F1F1F | **7회** / 6파일 | 낮음 |
| `--shadow-card` | 0 4px 24px... | **7회** / 7파일 | 낮음 |
| `--shadow-elevated` | 0 8px 32px... | **5회** / 4파일 | 낮음 |
| `--color-border-subtle` | #1F1F1F | **2회** / 3파일 | 낮음 |
| `--radius-card` | 16px | **7회** / 7파일 | 낮음 |
| `--radius-pill` | 9999px | **1회** / 2파일 | 낮음 |
| `--radius-card-lg` | 24px | 0회 | 없음 |
| `--color-primary-hover` | #7B9AE8 | **4회** / 5파일 | 낮음 |
| `--color-primary-light` | rgba(91,127,214,0.15) | **4회** / 5파일 | 낮음 |
| `--color-accent-light` | rgba(244,162,97,0.15) | 0회 | 없음 |
| `--color-text-on-primary` | #FFFFFF | **2회** / 3파일 | 낮음 |
| `--color-success` | #4ADE80 | **6회** / 5파일 | 낮음 |
| `--color-error` | #F87171 | **4회** / 4파일 | 낮음 |
| `--color-warning` | #FBBF24 | **2회** / 3파일 | 낮음 |
| `--color-info` | #60A5FA | 0회 | 없음 |
| `--font-heading` | 'Barlow Condensed'... | **2회** / 3파일 | 낮음 |
| `--color-bg-primary` | #0D0D0D | **2회** / 3파일 | 낮음 |
| `--color-bg-secondary` | #141414 | **2회** / 3파일 | 낮음 |
| `--color-card-hover` | #222222 | 0회 | 없음 |
| `--color-text-tertiary` | #666666 | 0회 | 없음 |
| `--font-size-*` (6개) | 다양 | 0회 | 없음 |
| `--spacing-*` (3개) | 다양 | 0회 | 없음 |

### 2단계: 기존 → Kinetic Pulse 매핑 테이블

#### A. 변수명 유지 + 값만 변경 (안전 전략)

| 기존 변수 | 기존 값 (다크) | 새 값 (Kinetic Pulse) | 변경 이유 |
|----------|--------------|---------------------|----------|
| `--color-background` | #0D0D0D | #131313 | surface 기본 |
| `--color-card` | #1A1A1A | #1C1B1B | surface_container_low |
| `--color-elevated` | #222222 | #353534 | surface_container_highest |
| `--color-surface` | #1F1F1F | #1C1B1B | surface_container_low (card와 통합) |
| `--color-primary` | #5B7FD6 (다크) / #1B3C87 (라이트) | #E31B23 | Electric Red로 전환 |
| `--color-primary-hover` | #7B9AE8 | #FF2D35 | 밝은 레드 |
| `--color-primary-light` | rgba(91,127,214,0.15) | rgba(227,27,35,0.15) | 레드 계열 반투명 |
| `--color-accent` | #F4A261 | #1B3C87 | Deep Navy (secondary로 전환) |
| `--color-accent-hover` | #FABD82 | #2A4F9E | 밝은 네이비 |
| `--color-accent-light` | rgba(244,162,97,0.15) | rgba(27,60,135,0.15) | 네이비 반투명 |
| `--color-text-primary` | #F5F5F5 | #E7BDB8 | on_surface_variant (순백 금지) |
| `--color-text-secondary` | #A0A0A0 | #A09C9B | 약간 따뜻한 회색 |
| `--color-text-muted` | #666666 | #5C5958 | 따뜻한 어두운 회색 |
| `--color-text-on-primary` | #FFFFFF | #FFFFFF | 유지 (버튼 위 텍스트) |
| `--color-border` | #2A2A2A | rgba(159,140,133,0.15) | Ghost Border (outline_variant 15%) |
| `--color-border-subtle` | #1F1F1F | rgba(159,140,133,0.08) | 더 약한 고스트 보더 |
| `--shadow-card` | 0 4px 24px rgba(0,0,0,0.4) | 0 4px 32px rgba(10,10,15,0.08) | Ambient Shadow |
| `--shadow-elevated` | 0 8px 32px rgba(0,0,0,0.5) | 0 8px 48px rgba(10,10,15,0.08) | Ambient Shadow |
| `--radius-card` | 16px | 0.5rem (8px) | 최소 라운딩 |
| `--radius-card-lg` | 24px | 0.75rem (12px) | 약간의 라운딩 |
| `--radius-pill` | 9999px | 0.25rem (4px) | 거의 직각 (버튼용) |
| `--font-heading` | 'Barlow Condensed'... | 'Space Grotesk', 'Pretendard', sans-serif | 헤드라인 폰트 교체 |

#### B. 새로 추가할 변수

| 새 변수 | 값 | 용도 |
|--------|-----|------|
| `--color-surface-bright` | #3B3A39 | 카드 호버 시 배경 |
| `--color-surface-lowest` | #0E0E0E | 입력 필드 배경 (recessed) |
| `--color-gradient-start` | #FFB4AC | CTA 그라디언트 시작 |
| `--color-gradient-end` | #E31B23 | CTA 그라디언트 끝 |
| `--color-tertiary` | #94CCFF | 텍스트 링크/삼차 강조 |
| `--color-glass-bg` | rgba(28,27,27,0.7) | 글래스모피즘 배경 |
| `--color-glass-blur` | 20px | 글래스모피즘 블러값 |

#### C. 제거 대상

| 변수 | 이유 |
|------|------|
| `--color-bg-primary` | `--color-background`와 중복 |
| `--color-bg-secondary` | `--color-card`로 통합 |
| `--color-card-hover` | `--color-surface-bright`로 대체 |
| `--color-text-tertiary` | `--color-text-muted`와 동일값 |
| `--font-size-*` (6개) | 사용처 0회, Tailwind 유틸리티로 충분 |
| `--spacing-*` (3개) | 사용처 0회, Tailwind 유틸리티로 충분 |

### 3단계: 리스크 최소화 전략

**핵심 전략: "값만 바꾸기 (Variable Value Swap)"**

비유로 설명하면: 건물의 방 이름표(변수명)는 그대로 두고, 방 안의 페인트 색(값)만 바꾸는 것.
방 이름표를 바꾸면 모든 안내판(50개 이상 파일)을 다 고쳐야 하지만,
페인트만 바꾸면 안내판은 그대로 두고 건물 느낌만 달라짐.

**구체적 전략:**

1. **변수명은 절대 바꾸지 않는다**
   - `--color-accent`는 이름 그대로 유지 (값만 #F4A261 → #1B3C87)
   - 51회 사용되는 변수의 이름을 바꾸면 51군데를 수정해야 함 = 리스크 폭발

2. **globals.css 한 파일만 수정한다 (Phase 5-1)**
   - @theme 블록의 값만 교체
   - html.dark 블록의 값만 교체
   - 새 변수 7개 추가
   - 미사용 변수 12개 제거

3. **다크 모드 전용 전환**
   - @theme 블록(라이트)의 값도 다크 계열로 변경
   - html.dark 블록은 유지하되 값 통합
   - 추후 라이트 모드가 필요하면 그때 분리

4. **Dark Mode Override 블록 (117~206라인) 정리**
   - 하드코딩 색상 셀렉터(bg-[#FFFFFF] 등)는 Phase 5-2~5-3에서 컴포넌트 수정 시 함께 제거
   - Phase 5-1에서는 건드리지 않음 (안전)

5. **롤백 보험**
   - globals.css 수정 전 git commit으로 현재 상태 스냅샷
   - 문제 발생 시 `git checkout -- src/app/globals.css` 한 줄로 복구

### 4단계: 실행 순서

**Step 1: globals.css @theme 블록 값 교체** (신규/수정: 수정)
- 기존 변수 22개의 값을 Kinetic Pulse 값으로 변경
- 새 변수 7개 추가 (surface-bright, surface-lowest, gradient-*, tertiary, glass-*)
- 미사용 변수 12개 제거 (font-size-*, spacing-*, bg-*, card-hover, text-tertiary)

**Step 2: globals.css html.dark 블록 값 교체** (신규/수정: 수정)
- 다크 모드 변수 값을 Kinetic Pulse 다크 팔레트로 변경
- 라이트/다크 값이 동일한 경우 html.dark에서 제거하여 단순화

**Step 3: layout.tsx에 Space Grotesk 폰트 추가** (신규/수정: 수정)
- next/font/google에서 Space_Grotesk import
- className에 CSS 변수로 연결

**Step 4: tsc + 빌드 검증**
- 변수명을 바꾸지 않았으므로 빌드 에러 0건 예상
- 시각적 변화만 발생 (색상, 폰트, 라운딩)

### 5단계: 영향 범위 요약

| 위험도 | 변수 그룹 | 영향 파일 수 | 전략 |
|--------|----------|------------|------|
| 최고 | text-primary/secondary/muted, accent, border | 19~24파일 | 이름 유지, 값만 변경 |
| 높음 | card, primary | 12~18파일 | 이름 유지, 값만 변경 |
| 중간 | elevated, accent-hover | 5~10파일 | 이름 유지, 값만 변경 |
| 낮음 | 나머지 모든 변수 | 0~7파일 | 이름 유지, 값만 변경 |
| 없음 | font-size-*, spacing-*, bg-*, card-hover, text-tertiary | 0파일 | 안전 제거 |

📍 만들 위치와 구조:
| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| src/app/globals.css | CSS 변수 값 교체 + 신규 변수 추가 + 미사용 제거 | 수정 |
| src/app/layout.tsx | Space Grotesk 폰트 추가 | 수정 |

🔗 기존 코드 연결:
- globals.css의 변수를 사용하는 50+ 파일이 있지만, 변수명을 유지하므로 연결이 깨지지 않음
- layout.tsx의 font-heading 변수는 globals.css의 Typography 룰과 연결됨

⚠️ developer 주의사항:
1. 변수명을 절대 바꾸지 말 것 - 값만 교체
2. `--color-text-primary`를 #E7BDB8로 바꾸면 순백(#F5F5F5) 대신 따뜻한 베이지톤이 됨 - 의도된 변경
3. `--color-accent`가 오렌지 → 네이비로 바뀌므로, "accent = 눈에 띄는 강조색"이라는 의미가 달라짐. 시각적으로 이전 accent(오렌지) 자리에 네이비가 들어감
4. `--color-primary`가 네이비 → 레드로 바뀌므로, primary와 accent의 역할이 사실상 교차됨
5. Space Grotesk 폰트가 한글 미지원이므로 font-heading에 Pretendard를 fallback으로 반드시 포함
6. html.dark의 Dark Mode Override 블록(117~206라인)은 Phase 5-1에서 건드리지 말 것 (Phase 5-2에서 컴포넌트 수정 시 순차 제거)

---

## 작업 기록 (대규모 작업 시만 사용)

### Phase 5: Kinetic Pulse 디자인 시스템 전면 전환

---

#### 1. 디자인 시안 분석 (14개)

**v1 시안 (bdr_1 ~ bdr_8)**
| 시안 | 화면 | 핵심 컴포넌트 |
|------|------|--------------|
| bdr_1 | 선수 프로필 상세 (웹) | 선수 헤더, 레이더 차트, 시즌 평균, 트렌드 그래프, 경기 로그 테이블 |
| bdr_2 | 선수 스탯 모달/팝업 | 선수 사진+이름, 레이더 차트, 효율성 차트, CTA 버튼 |
| bdr_3 | 프로필 편집 (웹) | 사이드바 내비, 기본정보/경기정보/환불계좌 폼, 포지션 선택 |
| bdr_4 | 홈(모바일) | 라이브 스코어 배너, 퀵메뉴 4개, 게스트 모집, 주변 코트, 시즌 랭킹, 커뮤니티 핫글 |
| bdr_5 | 마이페이지 (웹) | 프로필 헤더+뱃지, 예약 탭, 활동 로그 타임라인 |
| bdr_6 | 홈(웹 축소) | 히어로 배너, 추천 매칭, 주변 코트 지도, 커뮤니티, 시즌 랭킹 |
| bdr_7 | 글로벌 랭킹 (웹) | 사이드바 내비, 헤드라인 타이틀, 선수/팀 랭킹 테이블, 추천 선수 카드, 팀 트렌드 |
| bdr_8 | 라이브 중계 (웹) | 스코어보드, 영상 플레이어, 쿼터 서머리, 라이브 선수 스탯, 실황 중계 |

**v2 시안 (bdr_v2_1 ~ bdr_v2_6)**
| 시안 | 화면 | 핵심 컴포넌트 |
|------|------|--------------|
| v2_1 | 선수 프로필 상세 (v2) | 사이드바, 선수 헤더+포지션, 퍼포먼스 인덱스, 시즌 스탯, 매치 히스토리 |
| v2_2 | 픽업 게임 상세 | 장소 사진, 매칭 정보 2컬럼, 지도, 게임 규칙, 참가자 목록 |
| v2_3 | 알림 센터/설정 | 사이드바 내비, 알림 피드, 알림 수신 토글 설정, 앱 다운로드 CTA |
| v2_4 | 코트 찾기/픽업 목록 | "THE KINETIC PULSE" 히어로, 코트 카드 그리드, 라이브 맵 |
| v2_5 | 스포츠 뉴스/라이브 홈 | 라이브 스코어 히어로, 최근 결과, 리그 테이블, 탑 뉴스, 트렌딩 |
| v2_6 | 대회 센터/토너먼트 | 대회 히어로 배너, 조별리그 순위, 결선 토너먼트 브래킷, 라이브 매치, 뉴스 |

---

#### 2. 현재 vs Kinetic Pulse 디자인 시스템 차이점

| 항목 | 현재 (Phase 4) | Kinetic Pulse (목표) |
|------|---------------|---------------------|
| 컨셉 | ESPN+WHOOP 믹스 | High-End Sport Editorial |
| Primary 색상 | #1B3C87 (Deep Navy) | #E31B23 (Electric Red) |
| Accent 색상 | #F4A261 (웜 오렌지) | #1B3C87 (Deep Navy → secondary로 전환) |
| 다크 배경 | #0D0D0D | #131313 (surface) |
| Surface 계층 | card(#1A1A1A), elevated(#222222) | surface_container_low(#1C1B1B), highest(#353534) |
| 헤드라인 폰트 | Barlow Condensed | Space Grotesk |
| 본문 폰트 | Pretendard | Pretendard (유지) |
| 보더 규칙 | CSS 변수 보더 사용 | "No-Line" 규칙: 보더 금지, 배경색 차이로 구분 |
| 버튼 라운딩 | pill(9999px) | 0.25rem (거의 직각) |
| 카드 라운딩 | 16px~24px | 최소화 |
| 그림자 | box-shadow | Tonal Layering (배경색 차이) + Ambient Shadow(blur 32~48px, 8%) |
| 글래스모피즘 | backdrop-blur 사용 | 반투명 배경 + blur(20px) 강화 |
| 텍스트 색상 | #F5F5F5 | on_surface_variant(#E7BDB8) — 순백 금지 |
| 라이트 모드 | 지원 | 다크 모드 전용 (라이트 모드 제거 가능) |

---

#### 3. 작업 계획

##### Phase 5-1: 디자인 토큰/CSS 변수 전면 교체
| 순서 | 작업 | 담당 | 예상 시간 | 선행 조건 |
|------|------|------|----------|----------|
| 1-1 | globals.css @theme 블록 전면 교체: 색상(Red/Navy/Surface 계층), 폰트(Space Grotesk), 간격, 그림자, 라운딩 변수 | developer | 10분 | 없음 |
| 1-2 | html.dark 블록 정리: Kinetic Pulse 다크 전용으로 변수 통합, 라이트 모드 오버라이드 제거 또는 분리 | developer | 5분 | 1-1 |
| 1-3 | layout.tsx에 Space Grotesk 웹폰트 추가 (next/font 또는 Google Fonts) | developer | 5분 | 없음 |
| 1-4 | 기존 "No-Line" 규칙 적용: globals.css의 border 관련 다크 모드 오버라이드 정리 | developer | 5분 | 1-1 |
| 1-5 | tsc + 빌드 검증 | tester | 5분 | 1-1~1-4 |

**영향 파일**: globals.css, layout.tsx (2~3개 파일)
**예상 총 시간**: 30분

##### Phase 5-2: 공통 컴포넌트 전환 (Header, Footer, Layout)
| 순서 | 작업 | 담당 | 예상 시간 | 선행 조건 |
|------|------|------|----------|----------|
| 2-1 | header.tsx: 글래스모피즘 내비, 새 색상 체계, Space Grotesk 로고 | developer | 10분 | Phase 5-1 |
| 2-2 | slide-menu.tsx: surface 계층 배경, No-Line 규칙 적용, 버튼 스타일 | developer | 5분 | 2-1 |
| 2-3 | bell-icon, user-dropdown, theme-toggle: 새 색상 적용 | developer | 5분 | 2-1 |
| 2-4 | UI 컴포넌트(Button 등): gradient fill, 0.25rem 라운딩 | developer | 10분 | Phase 5-1 |
| 2-5 | 검증 + 리뷰 | tester | 5분 | 2-1~2-4 |

**영향 파일**: header.tsx, slide-menu.tsx, bell-icon.tsx, user-dropdown.tsx, theme-toggle.tsx, button.tsx 등 (6~8개 파일)
**예상 총 시간**: 35분

##### Phase 5-3: 홈페이지 컴포넌트 전면 개편
| 순서 | 작업 | 담당 | 예상 시간 | 선행 조건 |
|------|------|------|----------|----------|
| 3-1 | hero-section.tsx: Kinetic Pulse 히어로 (시안 bdr_4/bdr_6 참고, 라이브 스코어 배너 + 대형 타이포) | developer | 10분 | Phase 5-2 |
| 3-2 | personal-hero.tsx: 로그인 히어로 재디자인 (시안 bdr_4 참고, 퍼포먼스 대시보드 스타일) | developer | 10분 | 3-1 |
| 3-3 | quick-menu.tsx: 아이콘 그리드 → 에디토리얼 카드 스타일 (surface_container_highest 배경) | developer | 10분 | Phase 5-1 |
| 3-4 | recommended-games.tsx: 카드 No-Line 규칙, surface 계층, 호버=surface_bright | developer | 10분 | Phase 5-1 |
| 3-5 | recommended-videos.tsx: 에디토리얼 레이아웃, 대형 썸네일 | developer | 10분 | Phase 5-1 |
| 3-6 | page.tsx: 섹션 간격 조정 (spacing 12~20 적용) | developer | 5분 | 3-1~3-5 |
| 3-7 | 전체 검증 + 리뷰 | tester+reviewer | 10분 | 3-6 |

**영향 파일**: hero-section.tsx, personal-hero.tsx, quick-menu.tsx, recommended-games.tsx, recommended-videos.tsx, page.tsx (6개 파일)
**예상 총 시간**: 65분

##### Phase 5-4 이후: 서브 페이지 순차 전환
| Phase | 대상 페이지 | 참고 시안 | 예상 파일 수 |
|-------|-----------|----------|-------------|
| 5-4 | 경기 목록/상세 (games/) | bdr_v2_2, bdr_8 | 5~8개 |
| 5-5 | 대회 목록/상세/브래킷 (tournaments/) | bdr_v2_6 | 8~10개 |
| 5-6 | 프로필/마이페이지 (profile/) | bdr_1, bdr_3, bdr_5 | 6~8개 |
| 5-7 | 랭킹/커뮤니티/팀 | bdr_7, bdr_v2_3 | 6~8개 |
| 5-8 | 코트/픽업 | bdr_v2_4 | 3~4개 |
| 5-9 | 로그인/회원가입/관리자 | - | 5~8개 |

---

#### 4. 총 요약

| 구분 | Phase 5-1 | Phase 5-2 | Phase 5-3 | Phase 5-4~5-9 |
|------|-----------|-----------|-----------|---------------|
| 범위 | CSS 변수/폰트 | 공통 컴포넌트 | 홈페이지 | 서브 페이지 |
| 파일 수 | 2~3개 | 6~8개 | 6개 | 33~46개 |
| 예상 시간 | 30분 | 35분 | 65분 | 추후 산정 |
| 의존 관계 | 없음 | 5-1 완료 후 | 5-2 완료 후 | 5-3 완료 후 순차 |

**총 예상 시간 (Phase 5-1~5-3)**: 약 130분 (2시간 10분)

**주의사항**:
- Phase 5-1에서 CSS 변수명을 변경하면 모든 컴포넌트에 영향 -> 기존 변수명 유지하고 값만 교체하는 전략 권장
- "No-Line" 규칙으로 border 제거 시 시각적 구분이 사라지므로 surface 계층 색상을 정확히 적용해야 함
- Space Grotesk 폰트는 한글 미지원 -> 한글은 Pretendard 유지 (dual-font 시스템)
- 라이트 모드를 완전 제거할지, 유지하되 Kinetic Pulse 스타일로 변환할지 결정 필요

## 작업 로그 (최근 10건만 유지)
| 일시 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 2026-03-21 | architect | Phase 5-1 CSS 변수 전면 교체 설계 (전수조사+매핑+리스크전략+실행순서) | 완료 |
| 2026-03-21 | developer | Phase 4-3 헤더+네비+슬라이드메뉴+풋터+레이아웃 CSS 변수 전환 | 완료 |
| 2026-03-21 | developer | Phase 4-4 홈 페이지 CSS 변수 전환 + 포인트컬러 웜 오렌지 | 완료 |
| 2026-03-21 | developer | Phase 4-5 경기/대회 목록 카드 CSS 변수 + WHOOP 호버 | 완료 |
| 2026-03-21 | developer | Phase 4-6 상세/프로필/로그인/커뮤니티/팀 14개 파일 CSS 변수 전환 | 완료 |
| 2026-03-21 | tester | Phase 4-7 최종 통합 테스트 (tsc + build + 코드변경 + CSS변수 확인) | 통과 12/12 |
| 2026-03-21 | reviewer | Phase 4 전체 최종 코드 리뷰 | 통과 - 필수수정 0건 |
| 2026-03-21 | developer | Phase 4-TW Tailwind 테마 유틸리티 전환 (6개 파일, 37건) | 완료 |
| 2026-03-21 | tester | Phase 4-TW 검증 (tsc + 빌드 + 테마유틸리티 확인) | 통과 10/10 |
| 2026-03-21 | git-manager | Phase 4-TW 커밋 - 711b740 | 완료 (push 미완료) |
| 2026-03-21 | pm | scratchpad 정리 (71,109 토큰 → 정리) + 미커밋 파일 처리 예정 | 완료 |
| 2026-03-21 | developer | bell-icon CSS변수+lucide전환, header 비로그인 숨김 | 완료 |
| 2026-03-21 | tester | bell-icon+header 수정 검증 (tsc+빌드+코드+CSS변수) | 통과 6/6 |
| 2026-03-22 | developer | 푸터 하단 고정 + 선호 버튼 DB prefer_filter 연동 | 완료 |
| 2026-03-22 | developer | 맞춤보기 토글 OFF 저장 버그 수정 (DB persist + context 리셋) | 완료 |
| 2026-03-21 | developer | Phase 5-1 CSS변수 Kinetic Pulse 전환 + Space Grotesk 폰트 | 완료 |
| 2026-03-21 | tester | Phase 5-1 검증 (tsc+빌드+CSS변수+폰트+하드코딩잔존) | 통과 7/7 |
| 2026-03-21 | developer | Phase 5-2 공통 컴포넌트(헤더/슬라이드메뉴/드롭다운) Kinetic Pulse 전환 | 완료 |
| 2026-03-21 | tester | Phase 5-2 검증 (tsc+빌드+하드코딩색상+기능보존) | 통과 12/12 |
| 2026-03-21 | developer | Phase 5-3 홈페이지 5개 컴포넌트 Kinetic Pulse 전면 개편 | 완료 |
| 2026-03-22 | tester | Phase 5-3 검증 (tsc+빌드+하드코딩색상+기능보존+import) | 통과 6/7 (경고 1건) |
| 2026-03-22 | developer | Phase 5-3b 홈페이지 bdr_6 레이아웃 완전 복제 (사이드바+하단네비+섹션 재배치) | 완료 |
| 2026-03-22 | tester | Phase 5-3b 검증 (tsc+빌드+레이아웃구조+링크+import+하드코딩) | 통과 8/8 |
| 2026-03-22 | developer | 히어로 2분할 레이아웃 + 유튜브 라이브/인기영상 + 광고 슬라이드 | 완료 |
| 2026-03-22 | developer | 헤더 기능 복구(선호/큰글씨/다크모드/벨/로고) + 강남구 제거 | 완료 |
| 2026-03-22 | developer | 용어 변경(선호→맞춤/관심) 6개 파일 + 온보딩 맞춤보기 토글 추가 + prefer_filter_enabled API 전달 | 완료 |
| 2026-03-22 | tester | 맞춤보기 토글 OFF 저장 버그 수정 검증 (tsc+빌드+스키마+API+폼 코드검증) | 통과 8/8 |
| 2026-03-22 | developer | CSS 변수 값 미세 조정 10건 (surface/text/border/radius 등 @theme 블록) | 완료 |
| 2026-03-22 | tester | CSS 변수 미세 조정 10건 검증 (tsc + 변수값 12개 + 변수명유지 + Override 미변경) | 통과 16/16 |

### 테스트 결과 (tester) — Phase 5-3

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| TypeScript 컴파일 (tsc --noEmit) | 통과 | 에러 0건 |
| Next.js 빌드 (next build) | 통과 | 성공 |
| 하드코딩 색상 — #FFFFFF (뱃지 텍스트) | 통과 | on-primary 용도, 항상 흰색이므로 허용 |
| 하드코딩 색상 — #FF0000 (YouTube 브랜드) | 통과 | YouTube 공식 브랜드 색상, 변수화 불필요 |
| 하드코딩 색상 — #002b76 (사이드 카드 그라디언트) | 경고 | recommended-games.tsx 168행, 197행. CSS 변수 미사용 |
| 기능 보존 (로그인분기/편집모드/API연동 4건) | 통과 | hero 분기, quick-menu 편집, games API, videos API 모두 유지 |
| import 정상 확인 (6개 파일) | 통과 | 깨진 import 없음 |

📊 종합: 7개 중 6개 통과 / 0개 실패 / 1개 경고

#### 경고 상세: #002b76 하드코딩

- 파일: `src/components/home/recommended-games.tsx`
- 위치: 168행, 197행
- 내용: `style={{ background: "linear-gradient(135deg, var(--color-accent), #002b76)" }}`
- 권장: `#002b76`를 CSS 변수(예: `var(--color-accent-dark)` 또는 기존 변수 활용)로 교체
- 심각도: 낮음 (기능에 영향 없음, 디자인 일관성 문제)

### 수정 요청

| 요청자 | 파일명 | 문제 설명 | 상태 |
|--------|--------|----------|------|
| tester | recommended-games.tsx | #002b76 하드코딩 2건 → CSS 변수로 교체 권장 (경고, 필수 아님) | 완료 (5-3b에서 코드 전면 교체) |

### 구현 기록 — Phase 5-3b 홈페이지 bdr_6 레이아웃 완전 복제

구현한 기능: bdr_6 디자인 시안과 동일한 레이아웃 구조 (좌측 사이드바 + 미니 헤더 + 하단 모바일 네비)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/layout.tsx | 기존 Header 제거, 사이드바+미니헤더+하단네비바 구현, "use client" 추가 | 수정 (전면 교체) |
| src/app/(web)/page.tsx | 섹션 순서 변경: Hero→QuickMenu→Games→Videos | 수정 |
| src/components/home/hero-section.tsx | bdr_6 히어로 복제: aspect-ratio, LIVE NOW 뱃지, 하단 좌측 콘텐츠 | 수정 |
| src/components/home/quick-menu.tsx | 서브텍스트(sub) 필드 추가, bdr_6 카드 스타일 적용 | 수정 |
| src/components/home/recommended-games.tsx | bdr_6 벤토 그리드: 큰 카드(게스트 모집 리스트)+사이드 카드(RECRUITING) | 수정 (전면 교체) |

tester 참고:
- 테스트 방법: 홈페이지(/) 접속 후 데스크탑/모바일 반응형 확인
- 정상 동작: 데스크탑에서 좌측 사이드바+우측 콘텐츠, 모바일에서 하단 5개 아이콘 네비
- 주의할 입력: 사이드바 네비 링크(/, /games, /tournaments, /community, /profile) 활성 표시 확인
- 기존 Header 컴포넌트(header.tsx)는 건드리지 않음 (다른 페이지에서 사용 가능)

reviewer 참고:
- layout.tsx에 "use client" 추가됨 (useState/useEffect/usePathname 사용으로 필수)
- 기존 Header import 제거 → layout 내부에서 사이드바/헤더/네비바 직접 구현
- recommended-games.tsx에서 기존 #002b76 하드코딩 제거 → CSS 변수(--color-secondary) 사용

### 테스트 결과 (tester) — Phase 5-3b

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| TypeScript 컴파일 (tsc --noEmit) | 통과 | 에러 0건, 출력 없음 |
| Next.js 빌드 (next build) | 통과 | 성공 |
| 데스크탑 사이드바 구조 | 통과 | hidden md:flex, w-64, fixed left-0 확인 |
| 모바일 하단 네비바 구조 | 통과 | md:hidden, fixed bottom-0, 5개 아이콘 확인 |
| 메인 콘텐츠 md:pl-64 | 통과 | main 태그에 md:pl-64 적용 확인 |
| 네비게이션 링크 연결 | 통과 | /, /games, /tournaments, /community, /profile 등 실제 라우트 연결 |
| import 정상 확인 (모든 의존 파일 존재) | 통과 | Footer, SWRProvider, PreferFilterProvider, PersonalHero, Skeleton, recommended-videos 모두 존재 |
| 하드코딩 색상 잔존 확인 | 통과 | 이전 #002b76 제거됨, CSS 변수(--color-secondary, --color-accent) 사용 |

종합: 8개 중 8개 통과 / 0개 실패

### 테스트 결과 (tester) — 히어로 2분할 레이아웃 + 유튜브 연동

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| TypeScript 컴파일 (tsc --noEmit) | 통과 | 에러 0건, 출력 없음 |
| Next.js 빌드 (next build) | 통과 | 빌드 성공 |
| 2분할 그리드 구조 (grid grid-cols-1 md:grid-cols-3) | 통과 | 172행: section에 적용, 좌측 md:col-span-2 + 우측 1칸 |
| 유튜브 API 호출 (/api/web/youtube/recommend) | 통과 | 92행: fetch 호출 확인, 라이브/인기 영상 분류 로직 정상 |
| 광고 슬라이드 하드코딩 데이터 (ADS 배열) | 통과 | 19-44행: 3개 광고 데이터 정의, CSS 변수 기반 그라디언트 |
| 자동 전환 (setInterval 5초) | 통과 | 145행: setInterval(nextSlide, 5000), 호버 시 정지 로직 포함 |
| personal-hero.tsx h-full 적용 | 통과 | 370행(스켈레톤), 378행(비로그인), 407행(로그인) 모두 h-full 확인 |
| 비로그인 시 로그인 유도 UI | 통과 | 375-402행: 로그인 버튼 + 안내 문구 표시 |
| import 정상 확인 | 통과 | PersonalHero, Link, Play, Flame 등 모두 정상 import |
| 유튜브 API 실패 시 graceful degradation | 통과 | 125-128행: catch 블록에서 광고 슬라이드만 표시 |

종합: 10개 중 10개 통과 / 0개 실패

### 구현 기록 — 히어로 높이 고정 + 우측 카드 전면 최적화 (2026-03-22)

구현한 기능: 히어로 2분할 레이아웃의 고정 높이 적용 + 우측 개인 카드 좁은 공간 전면 최적화

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/components/home/hero-section.tsx | aspect-ratio 제거, 고정 높이(280~440px) 적용, 좌측 h-full, 우측 모바일 200px/데스크탑 h-full | 수정 |
| src/components/home/personal-hero.tsx | 전체 슬라이드 컴포넌트 텍스트/아이콘/뱃지/버튼 축소, arrows 12px, dots h-1, flex-col+flex-1 구조, 비로그인 카드 축소 | 수정 |

tester 참고:
- 테스트 방법: 홈페이지(/) 접속 후 데스크탑/모바일 반응형 확인
- 정상 동작: 히어로 높이가 넓어지고(16:9 비율 없음), 우측 카드 텍스트가 잘리지 않음
- 주의할 입력: 로그인/비로그인 양쪽 모두 확인, 모바일에서 우측 카드 200px 고정 확인

reviewer 참고:
- 기존 기능(슬라이드, 자동 전환, 스와이프, API 연동) 전혀 변경하지 않음
- CSS만 수정 (클래스명, 크기 값)
- 컨테이너에 flex flex-col 추가하여 flex-1 슬라이드 영역이 정상 작동하도록 함

### 구현 기록 (developer) — CSS 변수 값 미세 조정 10건 (2026-03-22)

구현한 기능: globals.css @theme 블록의 CSS 변수 값 10건 미세 조정 (PM 디자인 검수 결과 반영)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/globals.css | CSS 변수 값 10건 변경 (@theme 블록만, Dark Mode Override 블록 미변경) | 수정 |

변경 상세:

| 변수명 | 변경 전 | 변경 후 |
|--------|--------|--------|
| --color-surface | #131313 | #1C1B1B |
| --color-accent-hover | #162F6B | #2A4F9E |
| --color-text-primary | #E7E2DE | #E7BDB8 |
| --color-text-secondary | #C4B8B4 | #A09C9B |
| --color-text-muted | #938F8C | #5C5958 |
| --color-border | rgba(147,143,140,0.15) | rgba(159,140,133,0.15) |
| --color-border-subtle | rgba(147,143,140,0.08) | rgba(159,140,133,0.08) |
| --color-surface-bright | #474746 | #3B3A39 |
| --color-glass-bg | rgba(19,19,19,0.7) | rgba(28,27,27,0.7) |
| --radius-card / --radius-card-lg / --radius-pill | 8px / 12px / 4px | 0.5rem / 0.75rem / 0.25rem |

tester 참고:
- 테스트 방법: 홈페이지(/) 접속 후 색상/보더/라운딩 시각적 확인
- 정상 동작: 텍스트가 따뜻한 베이지톤(#E7BDB8), 보더가 약간 따뜻한 톤, 카드 라운딩이 rem 단위
- html.dark 블록과 Dark Mode Override 블록은 건드리지 않음

reviewer 참고:
- 변수명 변경 없음 (값만 교체)
- @theme 블록만 수정, html.dark 블록(85~87행)은 미변경
- Dark Mode Override 블록(96~186행)은 미변경

### 테스트 결과 (tester) — CSS 변수 값 미세 조정 10건 (2026-03-22)

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| TypeScript 컴파일 (tsc --noEmit) | PASS | 에러 0건 |
| --color-surface = #1C1B1B | PASS | 18행 확인 |
| --color-accent-hover = #2A4F9E | PASS | 34행 확인 |
| --color-text-primary = #E7BDB8 | PASS | 40행 확인 |
| --color-text-secondary = #A09C9B | PASS | 41행 확인 |
| --color-text-muted = #5C5958 | PASS | 42행 확인 |
| --color-border = rgba(159,140,133,0.15) | PASS | 52행 확인 |
| --color-border-subtle = rgba(159,140,133,0.08) | PASS | 53행 확인 |
| --color-surface-bright = #3B3A39 | PASS | 24행 확인 |
| --color-glass-bg = rgba(28,27,27,0.7) | PASS | 78행 확인 |
| --radius-card = 0.5rem | PASS | 56행 확인 |
| --radius-card-lg = 0.75rem | PASS | 57행 확인 |
| --radius-pill = 0.25rem | PASS | 58행 확인 |
| 변수명 유지 (이름 변경 없음) | PASS | 12개 변수 모두 이름 유지 확인 |
| html.dark 블록 미변경 (85-87행) | PASS | color-scheme: dark만 포함 |
| Dark Mode Override 블록 미변경 (96-186행) | PASS | 하드코딩 셀렉터 그대로 유지 |

종합: 16개 중 16개 통과 / 0개 실패

## 완료된 대형 작업 요약
- **Phase 1**: 선호설정 시스템 (DB스키마 + API + 프로필 완성 흐름 + 필터링 + 토글)
- **Phase 2**: 선호 종별(divisions) 대회 필터 적용
- **Phase 3**: 대회탭 UI를 경기탭 스타일로 통일 + 종별 태그
- **Phase 4**: UI/UX 전체 개선 (ESPN+WHOOP 믹스, 디자인 토큰, CSS 변수 전환)
- 로컬 커밋 13개 완료, push 미완료
