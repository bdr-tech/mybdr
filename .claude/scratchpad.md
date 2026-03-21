# 작업 스크래치패드

## 효율화 규칙 (2026-03-21 적용)
1. **병렬 실행**: 독립적인 에이전트는 동시 실행 (tester+reviewer 병렬 등)
2. **스크래치패드 경량 모드**: 소규모 작업(1~2파일)은 작업 로그 한 줄만. 대규모(5+파일)만 섹션 기록
3. **확인 생략**: 명확한 요청은 바로 실행. 모호한 것만 확인 질문
4. **tester+reviewer 병렬**: 동시 실행 후 결과 취합. 소규모는 tester만
5. **커밋 간소화**: tester 통과 시 PM이 직접 커밋. 복잡한 git만 git-manager 호출

## 현재 작업
- **요청**: 마이페이지(/profile) Kinetic Pulse 디자인 전환
- **상태**: planner 계획 수립 완료 -> developer 대기
- **현재 담당**: planner 완료

## 작업 계획 (planner) - 마이페이지 Kinetic Pulse 전환

### 목표
마이페이지(/profile) 하위 파일들의 하드코딩 색상을 CSS 변수로 교체하여 다크모드 자동 대응

### 전수조사 결과

**이미 CSS 변수 전환 완료 (수정 불필요 - 11개 파일)**
- `page.tsx` (메인) - style 속성으로 CSS 변수 적용 완료
- `_components/activity-ring.tsx` - CSS 변수 적용 완료 (티어 색상 #FFD700/#C0C0C0/#CD7F32는 의미론적 색상이므로 유지)
- `_components/player-info-section.tsx` - CSS 변수 적용 완료
- `_components/recent-games-section.tsx` - CSS 변수 적용 완료
- `_components/section-wrapper.tsx` - CSS 변수 적용 완료
- `_components/stat-bars.tsx` - CSS 변수 적용 완료 (스탯 색상 #E31B23/#F4A261/#1B3C87/#16A34A/#7C3AED는 의미론적이므로 유지)
- `_components/teams-section.tsx` - CSS 변수 적용 완료
- `_components/tournaments-section.tsx` - CSS 변수 적용 완료
- `complete/preferences/page.tsx` - CSS 변수 적용 완료
- `preferences/page.tsx` - CSS 변수 적용 완료

**하드코딩 잔존 (수정 필요 - 4개 파일)**

### 대상 파일 (4개)

| 파일 경로 | 역할 | 하드코딩 색상 수 |
|----------|------|----------------|
| `profile/loading.tsx` | 스켈레톤 로딩 UI | 8건 |
| `profile/edit/page.tsx` | 프로필 수정 폼 | 약 40건 |
| `profile/complete/page.tsx` | 온보딩 프로필 완성 폼 | 약 35건 |
| `_components/profile-header.tsx` | 프로필 헤더 (아바타) | 3건 |

### 하드코딩 색상 -> CSS 변수 매핑 (파일별 상세)

#### profile/loading.tsx (스켈레톤) - 8건

| 현재 하드코딩 | 용도 | 변환 대상 |
|-------------|------|----------|
| `border-[#E8ECF0]` x4 | 카드 보더 | `border-[var(--color-border)]` |
| `bg-[#FFFFFF]` x4 | 카드 배경 | `bg-[var(--color-card)]` |

#### _components/profile-header.tsx - 3건

| 현재 하드코딩 | 용도 | 변환 대상 |
|-------------|------|----------|
| `ring-[#F4A261]/40` | 프로필 이미지 링 | `ring-[var(--color-accent)]/40` -> style 속성으로 변환 |
| `bg-[#1B3C87]` | 기본 아바타 배경 | style `backgroundColor: 'var(--color-accent)'` |
| `ring-[#1B3C87]/30` | 기본 아바타 링 | style 속성으로 변환 |

#### profile/edit/page.tsx (프로필 수정) - 약 40건

**핵심: inp/lbl/section 변수 3개에 대부분 집중됨**

| 현재 하드코딩 | 용도 | 변환 대상 |
|-------------|------|----------|
| `border-[#E8ECF0]` | 입력필드/섹션 보더 | `var(--color-border)` |
| `bg-[#FFFFFF]` | 입력필드/섹션 배경 | `var(--color-card)` |
| `text-[#111827]` | 입력필드 텍스트/섹션 제목 | `var(--color-text-primary)` |
| `placeholder:text-[#9CA3AF]` | 플레이스홀더 | `var(--color-text-secondary)` |
| `focus:border-[#1B3C87]` | 포커스 보더 | `var(--color-accent)` |
| `focus:ring-[#1B3C87]/20` | 포커스 링 | `var(--color-accent)` |
| `text-[#6B7280]` | 라벨 텍스트 | `var(--color-text-muted)` |
| `text-[#9CA3AF]` | 보조 텍스트 | `var(--color-text-secondary)` |
| `hover:bg-[#EEF2FF]` | 뒤로가기 호버 | `var(--color-surface-bright)` |
| `bg-[rgba(239,68,68,0.1)]` | 에러 배경 | 유지 또는 error 변수 |
| `text-[#EF4444]` | 에러 텍스트 | `var(--color-error)` 또는 유지 |
| `bg-[rgba(0,102,255,0.1)]` | 성공 배경 | 유지 또는 accent 변수 |
| `text-[#1B3C87]` | 성공/accent 텍스트 | `var(--color-accent)` |
| `border-[#1B3C87]` | 선택된 포지션 보더 | `var(--color-accent)` |
| `bg-[rgba(27,60,135,0.12)]` | 선택된 포지션 배경 | accent 투명 |
| `text-[#7C3AED]` | AI 버튼 텍스트 | 의미론적 색상 유지 |
| `border-[#7C3AED]/30` | AI 버튼 보더 | 의미론적 색상 유지 |
| `hover:bg-[#7C3AED]/10` | AI 버튼 호버 | 의미론적 색상 유지 |
| `bg-[#EEF2FF]` | 등록 계좌 안내 배경 | `var(--color-surface-bright)` |
| `text-[#374151]` | 동의 텍스트 | `var(--color-text-primary)` |
| `text-[#EF4444]` (필수) | 필수 표시 | 유지 |
| `accent-[#1B3C87]` | 체크박스 색상 | `var(--color-accent)` |
| `border-[#E5E7EB]` | 맞춤설정 카드 보더 | `var(--color-border)` |
| `bg-[#F9FAFB]` | 맞춤설정 카드 배경 | `var(--color-surface)` |
| `bg-[#1B3C87]` | 저장/맞춤설정 버튼 | `var(--color-accent)` |
| `hover:bg-[#142D6B]` | 버튼 호버 | `var(--color-accent-hover)` |

#### profile/complete/page.tsx (온보딩) - 약 35건

edit/page.tsx와 거의 동일 패턴 (inp/lbl 변수 공유). 추가 항목:

| 현재 하드코딩 | 용도 | 변환 대상 |
|-------------|------|----------|
| `text-[#E31B23]` | 환영 아이콘 | `var(--color-primary)` |
| `shadow-[0_4px_24px_rgba(0,0,0,0.07)]` | 카드 그림자 | `var(--shadow-card)` |
| `border-emerald-400` | 인증완료 보더 | `var(--color-success)` |
| `text-emerald-500` | 인증완료 텍스트 | `var(--color-success)` |
| `bg-[#E31B23]` | 인증 확인 버튼 | `var(--color-primary)` |
| `hover:bg-[#C8101E]` | 인증 확인 호버 | primary hover |
| `text-red-500` / `bg-red-500/10` | 에러 표시 | 유지 또는 error 변수 |
| `hover:bg-[#F5F7FA]` | "나중에" 버튼 호버 | `var(--color-surface)` |

### 실행 계획

| 순서 | 작업 | 담당 | 예상 시간 | 선행 조건 |
|------|------|------|----------|----------|
| 1 | loading.tsx 하드코딩 8건 -> CSS 변수 교체 | developer | 3분 | 없음 |
| 2 | profile-header.tsx 하드코딩 3건 -> CSS 변수 교체 | developer | 3분 | 없음 |
| 3 | edit/page.tsx 하드코딩 ~40건 -> CSS 변수 교체 (inp/lbl/section 변수 중심) | developer | 10분 | 없음 |
| 4 | complete/page.tsx 하드코딩 ~35건 -> CSS 변수 교체 | developer | 10분 | 없음 |
| 5 | tsc + 하드코딩 잔존 확인 + 변수 사용 확인 | tester | 5분 | 1-4단계 |

총 예상 시간: 31분

### 주의사항

1. **inp/lbl/section 변수 전략**: edit/page.tsx와 complete/page.tsx 모두 상단에 `inp`, `lbl`, `section` CSS 클래스 문자열 변수가 정의되어 있음. 이 변수를 CSS 변수로 교체하면 파일 전체에 일괄 적용됨 (효율적)
2. **의미론적 색상 유지**: AI 버튼의 보라색(#7C3AED), 스탯 바의 고유 색상, 티어 색상 등은 테마와 무관한 브랜드/의미 색상이므로 교체하지 않음
3. **Tailwind -> style 속성 전환**: CSS 변수를 Tailwind 클래스에서 쓸 때는 `bg-[var(--color-xxx)]` 형태를 사용하되, 복잡한 경우(ring, 투명도 조합 등)는 style 속성으로 전환
4. **에러/성공 색상**: red-500, EF4444 등 에러 색상은 의미론적이므로 유지해도 무방. 단, 다크모드에서 가독성이 필요하면 `var(--color-error)` 같은 변수 추가 검토
5. **1-4단계는 독립적**이므로 병렬 실행 가능. 특히 1-2단계는 소규모라 빠르게 처리 가능

### 영향 범위

- 변경 파일: 4개 (profile/ 하위만)
- 다른 페이지 영향: 없음 (profile 전용 파일만 수정)
- CSS 변수 신규 추가: 없음 (기존 변수만 활용)
- 기능 변경: 없음 (색상만 교체)

---

## 작업 로그 (최근 10건만 유지)
| 일시 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 2026-03-22 | developer | Phase 5-3b 홈페이지 bdr_6 레이아웃 완전 복제 | 완료 |
| 2026-03-22 | developer | 히어로 2분할 레이아웃 + 유튜브 라이브/인기영상 + 광고 슬라이드 | 완료 |
| 2026-03-22 | developer | 헤더 기능 복구(선호/큰글씨/다크모드/벨/로고) + 강남구 제거 | 완료 |
| 2026-03-22 | developer | 용어 변경(선호->맞춤/관심) + 온보딩 맞춤보기 토글 + prefer_filter_enabled 전달 | 완료 |
| 2026-03-22 | developer | CSS 변수 값 미세 조정 10건 (surface/text/border/radius 등) | 완료 |
| 2026-03-22 | planner | 코트 찾기 페이지(/courts) Kinetic Pulse 전환 계획 수립 | 완료 |
| 2026-03-22 | developer+tester | 코트 찾기 3파일 하드코딩 27건 CSS 변수 교체 + 검증 5/5 통과 | 완료 |
| 2026-03-22 | planner | 마이페이지(/profile) Kinetic Pulse 전환 계획 수립 (4파일 ~86건) | 완료 |
| 2026-03-22 | developer | 마이페이지 4파일 하드코딩 ~86건 CSS 변수 교체 (loading/header/edit/complete) | 완료 |
| 2026-03-22 | tester | 마이페이지 CSS 변수 전환 검증 (tsc+잔존검사+변수사용) 10/10 통과 | 통과 |

---

### 구현 기록 (developer) - 마이페이지 CSS 변수 전환

구현한 기능: 마이페이지 4개 파일의 하드코딩 색상을 CSS 변수로 교체 (다크모드 자동 대응)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| profile/loading.tsx | border/bg 8건 -> CSS 변수 | 수정 |
| _components/profile-header.tsx | ring/bg 3건 -> style 속성 CSS 변수 | 수정 |
| profile/edit/page.tsx | inp/lbl/section 변수 + 개별 ~40건 -> CSS 변수 | 수정 |
| profile/complete/page.tsx | inp/lbl 변수 + 개별 ~35건 -> CSS 변수 | 수정 |

tester 참고:
- 테스트 방법: /profile, /profile/edit, /profile/complete 페이지를 라이트/다크 모드에서 확인
- 정상 동작: 라이트 모드에서 기존과 동일한 색상, 다크 모드에서 CSS 변수에 따른 색상 적용
- 의미론적 색상 유지 확인: AI 버튼 보라색(#7C3AED), 에러 빨강(#EF4444), red-500 유지됨
- 주의: profile-header.tsx의 아바타 ring은 boxShadow style로 전환됨 (Tailwind ring과 CSS 변수 호환 문제)

reviewer 참고:
- focus:ring-[var(--color-accent)]/20 형태 Tailwind에서 CSS 변수 + 투명도 조합 동작 확인 필요

### 테스트 결과 (tester) - 마이페이지 CSS 변수 전환

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| TypeScript 컴파일 (tsc --noEmit) | 통과 | 에러 0건 |
| 하드코딩 헥스 잔존 (#E8ECF0/#FFFFFF/#6B7280/#9CA3AF/#111827/#374151) | 통과 | 대상 4파일에서 0건 발견 |
| Tailwind 하드코딩 잔존 (bg-white/bg-gray-*/text-gray-*/border-gray-*) | 통과 | profile 폴더 전체 0건 |
| loading.tsx CSS 변수 적용 | 통과 | --color-border, --color-card 총 8건 적용 확인 |
| profile-header.tsx CSS 변수 적용 | 통과 | style 속성으로 6종 CSS 변수 적용 확인 |
| edit/page.tsx CSS 변수 적용 | 통과 | inp/lbl/section 변수 + 개별 요소 40건 이상 적용 |
| complete/page.tsx CSS 변수 적용 | 통과 | inp/lbl 변수 + primary/success/shadow-card 등 적용 |
| 의도적 유지 색상 확인 (#7C3AED AI 보라) | 통과 | edit, complete 모두 유지 확인 |
| 의도적 유지 색상 확인 (#EF4444/text-red-*/bg-red-* 에러) | 통과 | edit: #EF4444+rgba, complete: red-500 유지 확인 |
| 의도적 유지 색상 확인 (text-white 버튼 텍스트) | 통과 | edit 2건, complete 3건 text-white 유지 확인 |

종합: 10개 중 10개 통과 / 0개 실패
