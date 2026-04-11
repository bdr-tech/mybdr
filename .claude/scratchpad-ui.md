# UI 개선 작업 스크래치패드 (subin 브랜치)

## 🎯 작업 목적
홈, 대회, 경기 등 특정 페이지의 비율/레이아웃 수정 (컴팩트 축소, 정렬, 간격 보정 등)

## ⚠️ 절대 지켜야 할 제약 (PM이 모든 에이전트에게 선제 명령)
1. **공통 컴포넌트 수정 금지**
   - `src/components/shared/**` 건드리지 않음
   - `src/components/ui/**` 건드리지 않음
   - `src/components/toss/**` 건드리지 않음
   - `src/components/layout/**` 건드리지 않음
2. **디자인 토큰 수정 금지**
   - `src/app/globals.css` 건드리지 않음
   - Tailwind config 건드리지 않음
3. **Prisma schema 수정 금지** — 심판 브랜치(subin-referee)가 담당
4. **API 라우트 변경 금지** — UI 렌더링만 교체

허용 범위: 대상 페이지의 `page.tsx` + 해당 페이지 전용 `_components/*` 파일만

## 현재 작업
- **요청**: [2단계] 다크모드 accent 버튼 가시성 버그 확장 수정 (Explore 전수 조사 결과 10개 포인트 / 7개 파일)
- **상태**: developer 위임 준비
- **현재 담당**: pm → developer
- **사용자 지시**: 옵션 C(하이브리드) — Explore 확정 10개 먼저 수정 → 이후 남은 의심 파일 재조사
- **이전 단계 완료**: 커밋 `5d37c12 fix: 다크모드 accent 배경 버튼 글씨 가시성 수정` (공통 컴포넌트 3개 + globals.css)
- **기반**: 이미 도입된 `--color-on-accent` 변수 그대로 재사용 (신규 CSS 변수 추가 없음)

### [2단계] developer에게 전달할 수정 명세 (7개 파일, 10개 포인트)

**공통 수정 패턴**: `bg-[var(--color-accent)]` 또는 `backgroundColor: "var(--color-accent)"` 위에 있는 `text-white` / `color: "#fff"` / `color: "#FFFFFF"`를 모두 `var(--color-on-accent)`로 교체.

**File A: `src/app/(web)/tournaments/tournaments-filter.tsx`** (🔍 시드 케이스)
- 230~231줄 style prop의 `color: "#fff"` →
  `color: showSearch ? "var(--color-on-primary)" : "var(--color-on-accent)"`
- ⚠️ showSearch=true면 배경이 primary이므로 `--color-on-primary`, false면 accent이므로 `--color-on-accent`

**File B: `src/app/(web)/games/new/_components/success-overlay.tsx:51`**
- className `text-white` 제거
- style에 `color: "var(--color-on-accent)"` 추가

**File C: `src/app/(web)/courts/[id]/_components/court-ambassador.tsx`** (4군데)
- 111줄 프로필 아바타
- 152줄 직접 수정 버튼
- 196줄 앰배서더 신청하기 버튼
- 422줄 수정 반영 버튼
- 4군데 모두: className `text-white` 제거 + style `color: "var(--color-on-accent)"` 추가

**File D: `src/app/(web)/courts/[id]/_components/session-complete-card.tsx:130`**
- `color: "#FFFFFF"` → `color: "var(--color-on-accent)"`

**File E: `src/app/(web)/profile/_components/current-team-card.tsx:68`**
- className `text-white` 제거 + style `color: "var(--color-on-accent)"` 추가

**File F: `src/app/(admin)/admin/courts/admin-courts-content.tsx:641`**
- 신청자 아바타 뱃지
- className `text-white` 제거 + style `color: "var(--color-on-accent)"` 추가

**File G: `src/app/(admin)/admin/users/page.tsx:96`**
- 검색 버튼
- className `text-white` 제거 + style `color: "var(--color-on-accent)"` 추가

### [2단계] developer 제약
- 위 7개 파일 외에는 건드리지 않는다
- 각 파일 수정 시 주변 컨텍스트(같은 파일의 다른 버튼)는 범위 외 — 건드리지 않는다
- tsc --noEmit 통과 필수
- 구현 기록 섹션(2단계)에 파일별 변경 내용 기록

### developer에게 전달할 수정 명세 (4개 파일)

**File 1: `src/app/globals.css`**
- 59줄 `--color-on-primary: #FFFFFF;` 다음 줄에 추가:
  ```
    --color-on-accent: #FFFFFF;        /* accent 위 텍스트 (라이트모드) */
  ```
- 203줄 `--color-accent-light: rgba(242, 244, 246, 0.08);` 다음 줄에 추가:
  ```
    --color-on-accent: #191F28;        /* accent 위 텍스트 (다크모드) */
  ```

**File 2: `src/components/shared/floating-filter-panel.tsx`**
- 83줄: `color: "#fff",` → `color: "var(--color-on-accent)",`

**File 3: `src/components/ui/button.tsx`**
- 35줄: `cta: { backgroundColor: 'var(--color-accent)', color: '#fff' },` → `cta: { backgroundColor: 'var(--color-accent)', color: 'var(--color-on-accent)' },`
- 12줄 `cta: "font-bold hover:opacity-90 text-white",`에서 `text-white` 제거 (style로 override되지만 혼란 방지): `cta: "font-bold hover:opacity-90",`
- ⚠️ **primary variant(34줄)는 건드리지 말 것** — 범위 외

**File 4: `src/app/(web)/games/_components/games-content.tsx`**
- 268줄 className에서 `text-white` 제거하고, style prop에 `color: "var(--color-on-accent)"` 추가:
  ```tsx
  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black transition-colors bg-[var(--color-accent)] shrink-0"
  style={{ color: "var(--color-on-accent)" }}
  ```

### developer 제약
- 위 4개 파일 외에는 건드리지 않는다
- primary variant 수정 금지
- 다른 30+ 파일의 `bg-[var(--color-accent)] text-white` 패턴은 이번 작업 범위 아님

## 구현 기록 (developer)

📝 구현한 기능: 다크모드 accent 배경 버튼 글씨 가시성 버그 수정 (`--color-on-accent` CSS 변수 도입)

⚠️ **공통 컴포넌트 2개 수정됨 (사용자 승인)** — `src/components/shared/floating-filter-panel.tsx`, `src/components/ui/button.tsx`. 평소 원칙(공통 컴포넌트 수정 금지)과 다르나, 이번 건은 디자인 시스템 버그로 판단되어 사용자 승인 하 예외 적용.

### 변경 파일 목록 (4개)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/globals.css` | 라이트/다크 모드 각각에 `--color-on-accent` 변수 추가 (라이트=#FFFFFF, 다크=#191F28) | 수정 |
| `src/components/shared/floating-filter-panel.tsx` | 트리거 버튼 style의 `color: "#fff"` → `"var(--color-on-accent)"` | 수정 |
| `src/components/ui/button.tsx` | cta variant: className의 `text-white` 제거 + style의 `color: '#fff'` → `'var(--color-on-accent)'` (primary는 건드리지 않음) | 수정 |
| `src/app/(web)/games/_components/games-content.tsx` | MY 버튼 className의 `text-white` 제거 + `style={{ color: "var(--color-on-accent)" }}` 추가 | 수정 |

### 변경 전/후 핵심 요약

**globals.css (라이트모드 60줄 부근)**
- before: `--color-on-primary: #FFFFFF;` 다음 줄에 아무 것도 없음
- after: `--color-on-accent: #FFFFFF;` 추가 (주석: "accent 위 텍스트 (라이트모드: 진한 accent 배경에 흰 글씨)")

**globals.css (다크모드 203줄 부근)**
- before: `--color-accent-light: rgba(242, 244, 246, 0.08);`에서 블록 종료
- after: 같은 줄 다음에 `--color-on-accent: #191F28;` 추가 (주석: "다크모드: 밝은 accent 배경이라 검정 글씨")

**floating-filter-panel.tsx (83줄)**
- before: `color: "#fff",`
- after: `color: "var(--color-on-accent)",` + 한국어 주석

**button.tsx (11~13줄, 36~37줄)**
- before (12줄): `"font-bold hover:opacity-90 text-white"`
- after: `"font-bold hover:opacity-90"` (text-white 제거) + 한국어 주석
- before (35줄): `cta: { backgroundColor: 'var(--color-accent)', color: '#fff' }`
- after: `cta: { backgroundColor: 'var(--color-accent)', color: 'var(--color-on-accent)' }` + 한국어 주석
- ✅ primary variant (9~10, 35줄)는 **손대지 않음**

**games-content.tsx (268줄 부근)**
- before: `className="... bg-[var(--color-accent)] text-white shrink-0"`
- after: `className="... bg-[var(--color-accent)] shrink-0"` + `style={{ color: "var(--color-on-accent)" }}` + 한국어 주석

### 타입 체크 결과
```
npx tsc --noEmit → EXIT_CODE=0 (에러 0건)
```

### 💡 tester 참고
- **테스트 방법**:
  1. `/games` 페이지 접속
  2. 우측 상단 필터 버튼(tune 아이콘)과 MY 버튼이 다크모드에서 글씨/아이콘이 보이는지 확인
  3. 라이트모드로 전환 (html.light) 후 동일 버튼의 글씨 가시성 확인
  4. `/tournaments`, `/teams` 페이지의 필터 버튼도 자동 정상화되었는지 확인 (FloatingFilterPanel 공통 컴포넌트 수정 덕분)
  5. Button 컴포넌트의 `variant="cta"` 쓰는 CTA 버튼들 확인
- **정상 동작**:
  - 다크모드: 밝은 회색(#F2F4F6) 배경 위에 진한 검정(#191F28) 글씨 → 또렷하게 읽힘
  - 라이트모드: 진한 회색(#191F28) 배경 위에 흰(#FFFFFF) 글씨 → 또렷하게 읽힘
- **주의할 입력**:
  - 테마 전환 (다크 ↔ 라이트) 시 색상이 즉시 반영되는지
  - primary variant 버튼은 이번 작업 범위 외 — 수정되지 않아야 함 (건드렸다면 회귀)

### ⚠️ reviewer 참고
- **특별히 봐줬으면 하는 부분**:
  1. `button.tsx`의 primary variant가 그대로인지 (10줄 `text-white`, 35줄 `color: '#fff'` 유지 확인)
  2. globals.css에서 라이트/다크 두 곳 모두 `--color-on-accent`가 정의되었는지
  3. 네이밍 컨벤션 `--color-on-*`이 기존 `--color-on-primary`와 일관성 있는지
- **범위 외 (이번에 안 건드린 것)**: 다른 30+ 파일의 `bg-[var(--color-accent)] text-white` 패턴, button.tsx primary variant

---

## 구현 기록 (developer) — [2단계] 확장 수정

📝 구현한 기능: 다크모드 accent 배경 버튼 가시성 버그 확장 수정 (Explore 전수 조사 확정 7개 파일 / 10개 포인트에 `--color-on-accent` 적용). 1단계에서 도입한 CSS 변수를 그대로 재사용, 신규 토큰 추가 없음.

### 변경 파일 목록 (7개 / 10개 포인트)

| 파일 경로 | 포인트 | 변경 내용 | 신규/수정 |
|----------|--------|----------|----------|
| `src/app/(web)/tournaments/tournaments-filter.tsx` | 1 (229~232줄) | style.color를 showSearch 분기로 `var(--color-on-primary)` / `var(--color-on-accent)` 동적 전환 | 수정 |
| `src/app/(web)/games/new/_components/success-overlay.tsx` | 1 (51줄) | className `text-white` 제거 + `style={{ color: "var(--color-on-accent)" }}` 추가 | 수정 |
| `src/app/(web)/courts/[id]/_components/court-ambassador.tsx` | 4 (108~113 / 149~153 / 192~196 / 418~422줄) | 프로필 아바타 + 직접 수정 버튼 + 앰배서더 신청 버튼 + 수정 반영 버튼 모두 `text-white` 제거 + style에 `color: "var(--color-on-accent)"` 병합 | 수정 |
| `src/app/(web)/courts/[id]/_components/session-complete-card.tsx` | 1 (126~133줄) | 연속 출석 뱃지 style의 `color: "#FFFFFF"` → `"var(--color-on-accent)"` | 수정 |
| `src/app/(web)/profile/_components/current-team-card.tsx` | 1 (65~69줄) | "팀 상세 정보" Link className `text-white` 제거 + style에 `color: "var(--color-on-accent)"` 병합 | 수정 |
| `src/app/(admin)/admin/courts/admin-courts-content.tsx` | 1 (639~642줄) | 신청자 아바타 뱃지 className `text-white` 제거 + style에 color 병합 | 수정 |
| `src/app/(admin)/admin/users/page.tsx` | 1 (96줄) | 검색 버튼 className `text-white` 제거 + `style={{ color: "var(--color-on-accent)" }}` 추가 | 수정 |

### 주요 변경 포인트 상세

**tournaments-filter.tsx (유일한 분기 케이스)**
- before: `color: "#fff"` 고정
- after: `color: showSearch ? "var(--color-on-primary)" : "var(--color-on-accent)"`
- showSearch=true면 배경이 primary(#E31B23)라 on-primary(#FFFFFF 고정) / false면 배경이 accent(테마 반응)라 on-accent 사용

**court-ambassador.tsx (한 파일 4군데)**
- 4군데 모두 동일 패턴 적용: className에서 `text-white` 제거 → style 객체에 `color: "var(--color-on-accent)"` 프로퍼티 병합
- 108~113줄 프로필 아바타만 다른 버튼들과 달리 원래부터 style 블록이 multi-line이어서 별도 라인으로 추가, 나머지 3군데는 inline-style에 콤마 구분으로 병합

**나머지 파일**
- 동일 패턴: 고정 색상 제거 → `var(--color-on-accent)`로 대체
- 주변 컨텍스트(같은 파일의 다른 primary 버튼, 다른 CTA 등)는 **일체 건드리지 않음**

### 작업 원칙 준수 체크
- ✅ 명시된 7개 파일만 수정 (`git status --short`로 확인, 그 외 소스 파일 변경 0건)
- ✅ `replace_all` 옵션 미사용, 각 위치를 개별 Edit로 처리
- ✅ `--color-on-accent` / `--color-on-primary` 외에 신규 CSS 변수 추가 없음
- ✅ API/데이터 패칭 변경 없음, CSS/className/style prop 한정
- ✅ 공통 컴포넌트(`src/components/**`) 미수정
- ✅ 각 변경 지점에 한국어 주석으로 의도 기록

### 타입 체크 결과
```
npx tsc --noEmit → EXIT=0 (에러 0건)
```
(1단계에서 언급된 기존 lucide-react 관련 에러는 이번 실행에서도 발생하지 않음 — 0에러 유지)

### git status 검증
```
 M src/app/(admin)/admin/courts/admin-courts-content.tsx
 M src/app/(admin)/admin/users/page.tsx
 M src/app/(web)/courts/[id]/_components/court-ambassador.tsx
 M src/app/(web)/courts/[id]/_components/session-complete-card.tsx
 M src/app/(web)/games/new/_components/success-overlay.tsx
 M src/app/(web)/profile/_components/current-team-card.tsx
 M src/app/(web)/tournaments/tournaments-filter.tsx
```
정확히 7개. scratchpad-ui.md와 settings.local.json 제외 (작업 범위 외 기존 변경).

### 💡 tester 참고

**테스트 방법 (다크 / 라이트 양쪽 각각 확인)**
1. `/tournaments` → 우측 상단 검색 돋보기 버튼 (showSearch 토글로 배경색/글씨색이 같이 바뀌는지 확인)
2. `/games/new` → 경기 생성 완료 후 성공 오버레이의 "경기 보러 가기" CTA 버튼
3. `/courts/[id]` → 앰배서더 섹션에서
   - 앰배서더가 있을 때: 프로필 아바타(이니셜 표시) + "직접 수정" 버튼(본인일 때)
   - 앰배서더가 없을 때: "앰배서더 신청하기" 버튼
   - 수정 모달 내 "수정 반영" 버튼
4. `/courts/[id]` → 세션 완료 카드에서 연속 출석 스트릭이 1 이상일 때 "+N XP" 뱃지
5. `/profile` → 메인 팀이 있을 때 "팀 상세 정보" 버튼
6. `/admin/courts` → 앰배서더 신청자 리스트의 닉네임 첫 글자 아바타 뱃지
7. `/admin/users` → 상단 "검색" 버튼

**정상 동작 기준**
- 다크모드: 밝은 회색(#F2F4F6) 배경 위에 진한 검정(#191F28) 글씨/이니셜 → 또렷하게 읽힘
- 라이트모드: 진한 검정(#191F28) 배경 위에 흰(#FFFFFF) 글씨/이니셜 → 또렷하게 읽힘
- 테마 토글 시 즉시 반영 (globals.css CSS 변수 전환)
- tournaments-filter 검색 버튼은 showSearch=true일 때 primary(빨강) 배경 + 흰 글씨, false일 때 accent 배경 + 테마 반응 글씨

**주의할 입력**
- 앰배서더 이미지가 있는 경우는 아바타 자리에 `<img>`가 렌더링되므로 색상 변화 없음 — 이미지 없는 경우(이니셜 폴백)만 가시성 체크 대상
- current-team-card는 `mainTeam`이 있어야 해당 링크가 렌더됨 — 프로필에 팀이 없는 계정이면 해당 UI 확인 불가

### ⚠️ reviewer 참고
- **특별히 봐줬으면 하는 부분**:
  1. tournaments-filter.tsx의 분기 로직 — `--color-on-primary`는 primary 배경용, `--color-on-accent`는 accent 배경용. showSearch 상태와 backgroundColor / color 페어링이 정확한지 확인
  2. court-ambassador.tsx의 4군데 중 아바타(108~113줄)만 style 객체가 multi-line이고 나머지 3군데는 inline 객체 — 병합 스타일이 다르지만 결과물은 동일
  3. success-overlay.tsx의 style prop은 기존에 없었고 이번에 새로 추가 — className과 style이 분리되어 있지만 React에서 동시 적용됨
- **범위 외 (안 건드린 것)**:
  - 각 파일 내 다른 primary/주변 버튼 (같은 파일이라도 범위 외로 판단)
  - 공통 컴포넌트 (`src/components/**`)
  - 1단계에서 이미 고친 4개 파일
  - 남은 의심 파일(3단계 재조사 대상) — 이번 범위 아님

---

## 테스트 결과 (tester)

🧪 검증 방식: 실제 브라우저 구동 없이 **정적 코드 검증 + tsc + git diff** 기반으로 판정 (바이브 코더 환경 특성 상 dev 서버 실행/스크린샷 불가).

### 테스트 항목

| # | 테스트 항목 | 결과 | 비고 |
|---|------------|------|------|
| 1 | `npx tsc --noEmit` 에러 0건 | ✅ 통과 | EXIT=0 |
| 2 | 수정된 파일이 지정된 4개와 일치 | ✅ 통과 | globals.css, floating-filter-panel.tsx, button.tsx, games-content.tsx (settings.local.json은 무관한 기존 변경, scratchpad-ui.md는 untracked) |
| 3 | globals.css 라이트모드에 `--color-on-accent: #FFFFFF;` 추가 | ✅ 통과 | 60행, `--color-on-primary` 다음 줄 |
| 4 | globals.css 다크모드(`html.dark`)에 `--color-on-accent: #191F28;` 추가 | ✅ 통과 | 205행, `--color-accent-light` 다음 줄 |
| 5 | floating-filter-panel.tsx 트리거 버튼 color가 `var(--color-on-accent)` 사용 | ✅ 통과 | 84행 (기존 `#fff` 제거) + 한국어 주석 |
| 6 | button.tsx cta variant style.color가 `var(--color-on-accent)` 사용 | ✅ 통과 | 37행 |
| 7 | button.tsx cta variant className에서 `text-white` 제거 | ✅ 통과 | 13행, `font-bold hover:opacity-90`만 남음 |
| 8 | **button.tsx primary variant 회귀 없음 (text-white + color:'#fff' 유지)** | ✅ 통과 | 10행 `text-white` 그대로, 35행 `color: '#fff'` 그대로 — 가장 중요한 회귀 방지 체크 **성공** |
| 9 | games-content.tsx MY 버튼 className에서 `text-white` 제거 | ✅ 통과 | 268행 |
| 10 | games-content.tsx MY 버튼 style에 `color: "var(--color-on-accent)"` 추가 | ✅ 통과 | 269행 |
| 11 | 범위 외 30+ 파일의 `bg-[var(--color-accent)] text-white` 패턴 미수정 | ✅ 통과 | grep 결과 31개 파일에 패턴 그대로 남아있음 (스크래치패드 명시 "이번 작업 범위 외" — 의도대로) |
| 12 | 의도하지 않은 side effect (대상 외 소스 파일 변경) 없음 | ✅ 통과 | git status에 4개 대상 파일만 (settings.local.json, scratchpad-ui.md 제외) |

### 변경 라인 수 검증 (git diff --stat)
- globals.css: **+2 / -0**
- floating-filter-panel.tsx: **+2 / -1**
- button.tsx: **+4 / -2** — primary variant 손 안 댐 재확인
- games-content.tsx: **+3 / -1**

총 **+11 / -4**. 명세와 일치. (명세가 최소한의 타겟 수정이었고, 주석 추가분이 포함된 것이 전부)

### 종합
📊 **12개 항목 중 12개 통과 / 0개 실패 / 0개 수정 요청**

⚠️ **실제 브라우저 렌더링 테스트는 수행 불가**. 다음 항목은 사용자가 로컬(`http://localhost:3001`) 또는 Vercel 프리뷰에서 직접 확인 필요:
  - 다크모드에서 `/games` 필터 버튼(tune 아이콘)과 MY 버튼이 밝은 배경 위에 검정 글씨로 선명하게 보이는지
  - 라이트모드 전환 시 동일 버튼이 진한 배경 위에 흰 글씨로 보이는지
  - `/tournaments`, `/teams` 등 FloatingFilterPanel을 쓰는 다른 페이지의 필터 버튼도 자동 정상화되었는지
  - `<Button variant="cta">`가 사용되는 CTA 버튼들의 글씨 대비

🎯 **코드 정합성 관점에서는 결함 없음**. 명세대로 정확히 4개 파일만 수정, primary variant 회귀 없음, tsc 통과. **커밋 진행 가능** 판정.

---

### [2단계] 테스트 결과 (tester) — 확장 수정 검증

🧪 검증 방식: 정적 코드 검증 + `npx tsc --noEmit` + `git diff` / `git status` + 1단계 파일 회귀 확인. (브라우저 렌더링 테스트 불가)

#### 2단계 테스트 항목 (파일 단위 + 회귀 + 전체 무결성)

| # | 테스트 항목 | 결과 | 비고 |
|---|------------|------|------|
| 1 | `npx tsc --noEmit` 에러 0건 | ✅ 통과 | EXIT=0 (기존 lucide-react 관련 에러 포함 0건) |
| 2 | `git status --short`에 정확히 7개 소스 파일만 modified | ✅ 통과 | 7개 타겟 파일 + `.claude/scratchpad-ui.md` + `.claude/settings.local.json`만 변경 (그 외 0건) |
| 3 | 1단계 파일 4개 회귀 없음 | ✅ 통과 | `globals.css`, `floating-filter-panel.tsx`, `button.tsx`, `games-content.tsx` 전부 untouched (git status에 미노출) |
| 4 | **File A** `tournaments-filter.tsx` 229~232줄 분기 적용 | ✅ 통과 | `color: showSearch ? "var(--color-on-primary)" : "var(--color-on-accent)"` 정확히 명세대로. showSearch=true → primary 배경/글씨, false → accent 배경/글씨 페어링 완벽 |
| 5 | **File B** `success-overlay.tsx:51` text-white 제거 + style 추가 | ✅ 통과 | className에서 `text-white` 제거 확인, `style={{ color: "var(--color-on-accent)" }}` 추가 확인. 주석 동반 |
| 6 | **File C** `court-ambassador.tsx` 4군데 모두 적용 | ✅ 통과 | 프로필 아바타(108줄), 직접 수정 버튼(153줄), 앰배서더 신청 버튼(198줄), 수정 반영 버튼(425줄) 전부 `text-white` 제거 + `color: "var(--color-on-accent)"` 병합. grep 결과 파일 내 `text-white`/`#fff` 패턴 완전히 0건 (잔존 없음) |
| 7 | **File D** `session-complete-card.tsx:130` `#FFFFFF` → `var(--color-on-accent)` | ✅ 통과 | style 객체 내 `color: "#FFFFFF"` → `color: "var(--color-on-accent)"`, 주석 동반 |
| 8 | **File E** `current-team-card.tsx:68` 적용 | ✅ 통과 | `<Link>` className `text-white` 제거 + style에 `color: "var(--color-on-accent)"` 병합 (backgroundColor와 한 객체 merge) |
| 9 | **File F** `admin-courts-content.tsx:641` 아바타 뱃지 적용 | ✅ 통과 | className `text-white` 제거 + style에 `color: "var(--color-on-accent)"` 추가, 주석 동반 |
| 10 | **File G** `admin/users/page.tsx:96` 검색 버튼 적용 | ✅ 통과 | className `text-white` 제거 + `style={{ color: "var(--color-on-accent)" }}` inline 추가 |
| 11 | 각 파일 내 다른 버튼(primary/error 배경 등)에 영향 없음 | ✅ 통과 | diff 상 7개 파일 각각 1~4개 hunk, 범위 외 라인 미변경. court-ambassador.tsx는 4 hunk지만 전부 명세 지점 (108/150/195/422줄) |
| 12 | 변경량이 과하지 않음 (각 포인트 1~3줄) | ✅ 통과 | 총 **+27 / -15** 라인 (7파일 10포인트 + 주석). 파일별 변경량 아래 기재 |
| 13 | 신규 CSS 변수 추가 없음 (1단계 변수 재사용만) | ✅ 통과 | `--color-on-accent` / `--color-on-primary` 모두 1단계에서 이미 도입된 것. globals.css는 2단계에서 손대지 않음 (git status 기준) |
| 14 | API/데이터 패칭 변경 없음 | ✅ 통과 | 7개 파일 diff 모두 className/style prop만 변경, fetch/useEffect/prisma 호출 등 일체 없음 |

#### 파일별 변경량 (`git diff --stat`)

| 파일 | 삽입 | 삭제 |
|-----|------|------|
| `tournaments-filter.tsx` | +2 | -1 |
| `success-overlay.tsx` | +3 | -1 |
| `court-ambassador.tsx` | +12 | -7 (4군데 × 평균 2.75~3줄) |
| `session-complete-card.tsx` | +2 | -1 |
| `current-team-card.tsx` | +3 | -2 |
| `admin-courts-content.tsx` | +3 | -2 |
| `admin/users/page.tsx` | +2 | -1 |
| **합계** | **+27** | **-15** |

- 모든 파일이 명세대로 최소 변경 + 한국어 주석 1줄 추가 수준. 과도한 변경 없음.
- court-ambassador.tsx가 가장 많지만 이는 명세상 4군데 × 3줄씩 = 12줄로 예상치와 일치.

#### 1단계 파일 회귀 확인 (명시)

```bash
git status --short src/app/globals.css \
  "src/components/shared/floating-filter-panel.tsx" \
  "src/components/ui/button.tsx" \
  "src/app/(web)/games/_components/games-content.tsx"
# → 출력 없음 (4개 파일 모두 2단계에서 수정되지 않음)
```

→ 1단계에서 수정한 `--color-on-accent` 변수 정의, FloatingFilterPanel 트리거, Button cta variant, games MY 버튼 **전부 2단계에서 건드리지 않음** 확인.

#### 종합

📊 **14개 항목 중 14개 통과 / 0개 실패 / 0개 수정 요청**

⚠️ **실제 브라우저 렌더링 테스트는 수행 불가**. 다음은 사용자가 `localhost:3001` 또는 Vercel 프리뷰에서 다크/라이트 양쪽 확인 필요:
- `/tournaments` 우측 상단 검색 돋보기 (showSearch 토글 시 배경+글씨 색 동시 전환)
- `/games/new` 경기 생성 완료 성공 오버레이의 "경기 보러 가기" 버튼
- `/courts/[id]` 앰배서더 섹션 프로필 아바타 이니셜 + "직접 수정"/"앰배서더 신청하기"/"수정 반영" 버튼
- `/courts/[id]` 세션 완료 카드 연속 출석 XP 뱃지
- `/profile` 메인 팀의 "팀 상세 정보" Link 버튼
- `/admin/courts` 앰배서더 탭 신청자 아바타
- `/admin/users` 상단 "검색" 버튼

정상 동작 기준:
- 다크모드 → 밝은 회색(#F2F4F6) 배경 + 검정(#191F28) 글씨/이니셜
- 라이트모드 → 진한 검정(#191F28) 배경 + 흰(#FFFFFF) 글씨/이니셜
- tournaments-filter만 예외로 showSearch=true면 primary(#E31B23) 배경 + 흰 글씨

🎯 **코드 정합성 관점에서는 결함 없음**. 명세대로 정확히 7개 파일 10개 포인트 수정, 1단계 파일 회귀 없음, 각 파일 내 범위 외 버튼 미변경, tsc 0 에러, API 변경 없음. **커밋 진행 가능** 판정.

수정 요청: **없음**.

---

## 리뷰 결과 (reviewer)

📊 **종합 판정: 승인**

변경 명세와 실제 코드가 완벽히 일치한다. primary variant 회귀 없음, 범위 외 파일 손대지 않음, 네이밍/값/주석 모두 프로젝트 컨벤션 준수.

### ✅ 잘된 점
1. **네이밍 일관성 우수**: `--color-on-accent`가 기존 `--color-on-primary`(59줄)와 완전히 동일한 패턴(`on-{배경역할}`)을 따름. 디자인 시스템 규칙 자연스럽게 확장됨.
2. **값 선택 적절**: 라이트 `#FFFFFF` ↔ 다크 `#191F28`이 각 모드의 `--color-accent`(`#191F28` ↔ `#F2F4F6`)와 정확히 반대 색상. 대비(contrast) 최대화.
3. **라이트/다크 양쪽 모두 정의**: `:root`(60줄), `.dark`(205줄) 두 곳 다 선언되어 테마 전환 시 fallback 없음.
4. **primary variant 완벽 보존**: button.tsx 9~10줄(`"font-bold hover:opacity-85 text-white"`), 35줄(`{ backgroundColor: 'var(--color-text-primary)', color: '#fff' }`) — 스크래치패드 제약 그대로. 회귀 없음.
5. **한국어 주석 품질 우수**: 각 변경 지점에 "왜 이렇게 바꿨는지" 의도가 명시됨. 예: button.tsx 12줄 "style prop의 color가 라이트/다크 자동 전환하므로 고정 흰색 클래스는 오히려 혼란을 준다", 36줄 "다크모드에서 accent가 #F2F4F6(거의 흰색)이 되면 글씨는 자동으로 #191F28(검정)이 됨".
6. **className/style 충돌 제거**: games-content.tsx 269줄에서 `text-white`를 className에서 빼고 style의 `color`로 일원화 → Tailwind와 inline style이 경쟁하지 않음.
7. **하드코딩 색상 제거**: 4개 파일 모두 `#fff`/`text-white` → CSS 변수로 전환. 프로젝트 "하드코딩 색상 금지" 컨벤션 준수.
8. **범위 외 파일 절제**: games-content.tsx 278줄 NEW 버튼(`bg-[var(--color-primary)] text-white`)은 **primary 배경**이라 이번 작업(accent 배경) 범위 외 — 건드리지 않은 것이 정확. 다른 30+ 파일의 `bg-[var(--color-accent)] text-white` 패턴도 손대지 않음.

### 🔴 필수 수정
없음.

### 🟡 권장 수정 (낮은 우선순위, 이번엔 반영하지 말 것)
- **(정보성)** globals.css 74줄에 `--color-text-on-primary: #FFFFFF`가 이미 존재. 59줄 `--color-on-primary`와 이름이 겹쳐 혼란 소지 있음. 이번 작업 범위 아니므로 **이번엔 손대지 말 것**. 나중에 별도 정리 작업으로 분리.
- **(정보성)** 다른 30+ 파일의 `bg-[var(--color-accent)] text-white` 패턴은 여전히 다크모드에서 가독성 문제 있을 수 있음. 이번 작업은 `/games` 페이지 긴급 버그 한정이고, 전체 일괄 교체는 별도 리팩토링 작업으로 분리 예정. 스크래치패드 명시대로 **범위 외**.

### 🎯 디자인 시스템 일관성 체크
| 항목 | 결과 |
|------|------|
| `--color-on-accent` 네이밍이 `--color-on-primary`와 일관성 있는가 | ✅ |
| 라이트/다크 양쪽 모두 정의되었는가 | ✅ (60줄, 205줄) |
| 값이 `--color-accent`의 반대 색상인가 | ✅ (라이트: accent #191F28 ↔ on-accent #FFFFFF / 다크: accent #F2F4F6 ↔ on-accent #191F28) |
| 하드코딩 색상 없이 CSS 변수 사용 | ✅ |

### 🛡️ 회귀 방지 체크
| 항목 | 결과 |
|------|------|
| button.tsx primary variant 변경 없음 | ✅ (10줄, 35줄 원본 유지) |
| 다른 30+ 파일의 `bg-[var(--color-accent)] text-white` 패턴 변경 없음 | ✅ |
| API/데이터 패칭 변경 없음 | ✅ (CSS/className/style prop만 변경) |
| tsc 통과 | ✅ (EXIT_CODE=0) |

### 🔧 공통 컴포넌트 수정 정당성 (예외 상황)
- **FloatingFilterPanel**: `/games`, `/tournaments`, `/teams`에서 공통 사용. 이번 수정으로 3곳 모두 다크모드에서 트리거 버튼 가시성 자동 정상화. **부작용 없는 의도된 side effect** — 버그 수정이 3페이지 동시에 적용되는 이점.
- **Button cta variant**: style prop의 color를 변수화하고 className `text-white` 제거. cta variant를 사용하는 모든 곳에서 동일하게 자동 전환. 기존 라이트모드 외관(흰 글씨)은 그대로 유지되므로 시각적 회귀 없음.
- 사용자 승인 하 디자인 시스템 버그 수정이므로 "공통 컴포넌트 수정 금지" 원칙 예외 적용이 정당.

### 📌 최종 판정
**승인 (developer 작업 완료, 추가 수정 불필요).** tester가 `/games` 다크/라이트 양쪽에서 실제 가시성 확인 후 PM이 커밋 진행해도 됨.

---

## 리뷰 결과 (reviewer) — [2단계] 확장 수정

📊 **종합 판정: 조건부 승인**

명세된 7개 파일 / 10개 포인트는 모두 정확히 수정되었고, 1단계 패턴과 완전히 일관된다. 다만 리뷰 중 `admin-courts-content.tsx`에서 **Explore 전수 조사가 놓친 1개의 추가 accent 포인트**(219줄 "등록" 버튼)를 발견했다. 2단계 작업 자체는 명세 100% 준수이므로 커밋은 진행 가능하나, 발견된 포인트는 3단계 재조사 때 함께 처리해야 한다.

### ✅ 잘된 점
1. **패턴 일관성 완벽**: 7개 파일 모두 1단계 패턴(className의 `text-white` 제거 + style.color에 `var(--color-on-accent)` 추가)과 동일. 변형/혼란 없음.
2. **tournaments-filter.tsx 분기 처리 정확**: 229~232줄에서 `showSearch=true`일 때 배경=`var(--color-primary)` + 글씨=`var(--color-on-primary)`, `false`일 때 배경=`var(--color-accent)` + 글씨=`var(--color-on-accent)`. 배경-전경 페어링 정확. **이번 작업에서 유일하게 복잡했던 지점인데 깔끔하게 처리**.
3. **court-ambassador.tsx 4군데 모두 수정**: 108~113(프로필 아바타), 149~155(직접 수정 버튼), 195~200(앰배서더 신청 버튼), 422~427(수정 반영 버튼). 파일 내 `text-white` grep 결과 0건 → 4지점 모두 제거 확인. 같은 파일의 취소 버튼 등 다른 버튼은 건드리지 않음.
4. **범위 외 1단계 파일 미변경**: `git status --short` 결과 수정 파일은 정확히 7개(+ scratchpad-ui.md, settings.local.json만). 1단계 파일(`globals.css`, `floating-filter-panel.tsx`, `button.tsx`, `games-content.tsx`) 재수정 0건 → 회귀 없음.
5. **한국어 주석 품질 우수**: 모든 변경 지점에 "왜"가 명시됨.
   - tournaments-filter.tsx 231줄: "배경이 테마에 따라 바뀌므로, 텍스트 색상도 대응하는 on-* 변수로 자동 전환"
   - session-complete-card.tsx 131줄: "다크/라이트 모드에서 accent 배경 대비가 유지되도록 on-accent 변수 사용"
   - success-overlay.tsx 52줄: "accent 배경이 테마에 따라 달라지므로 텍스트 색상도 on-accent 변수로 자동 대비 유지"
6. **className/style 충돌 해소**: 모든 지점에서 `text-white` 제거와 `style.color` 추가가 동시에 수행됨 → Tailwind utility와 inline style이 경쟁하지 않음.
7. **정확히 명세 범위만 수정**: `admin-courts-content.tsx`에서도 명세된 641줄 신청자 아바타만 수정, 다른 버튼들은 그대로 유지.
8. **tsc 통과**: `npx tsc --noEmit` 0에러.

### 🔴 필수 수정
없음 (2단계 명세 범위 내에서는).

### 🟡 권장 수정 (3단계에서 처리)
- **(발견 사항) admin-courts-content.tsx:219** — "등록" 버튼 className이 `"... bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)]"` 형태로 **accent 배경 + text-white** 패턴이 잔존. 다크모드 가시성 버그가 남아있음. 이번 2단계 Explore 명세에 이 라인이 누락되어 있었음 → **Explore 전수 조사 누락 1건**. 3단계 재조사 대상으로 추가 필요.
  - 수정 방법(3단계용): className에서 `text-white` 제거 + `style={{ color: "var(--color-on-accent)" }}` 추가.

### 🛡️ 범위 외 잔존 `text-white` 분석 (회귀 아님)
리뷰 중 수정 대상 파일 내 `text-white` 잔존을 모두 grep으로 확인, **accent 배경과 무관한 것들만** 남아있음을 검증했다:

| 파일 | 라인 | 배경색 | 판정 |
|------|------|--------|------|
| session-complete-card.tsx | 168 | `var(--color-primary)` | 범위 외 (primary) ✅ |
| current-team-card.tsx | 91 | `var(--color-primary)` | 범위 외 (primary) ✅ |
| success-overlay.tsx | 31 | `bg-[var(--color-success)]` (부모 div) | 범위 외 (success 배경 위 svg 아이콘) ✅ |
| admin-courts-content.tsx | 123, 143 | `var(--color-primary)` | 범위 외 (primary 카운트 뱃지) ✅ |
| admin-courts-content.tsx | 467, 666 | `var(--color-success)` | 범위 외 (success 승인 버튼) ✅ |
| admin-courts-content.tsx | 585, 595 | `"#FFFFFF"` (활성 탭 텍스트, 부모 배경은 `--color-card`) | 범위 외 (탭 활성 색) ✅ |
| **admin-courts-content.tsx** | **219** | **`var(--color-accent)`** | **🟡 범위 내지만 Explore 누락 — 3단계 처리 필요** |

### 🎯 패턴 일관성 체크 (2단계)
| 항목 | 결과 |
|------|------|
| 1단계 패턴(className text-white 제거 + style color 추가)과 일관 | ✅ |
| tournaments-filter.tsx showSearch 분기 페어링 정확 | ✅ |
| court-ambassador.tsx 4군데 모두 수정 + 다른 버튼 미변경 | ✅ |
| 1단계 파일(globals.css 등 4개) 재수정 없음 | ✅ |
| `#fff` / `#FFFFFF` / `text-white` 명세 지점에서 완전 제거 | ✅ (명세 10개 포인트 모두) |
| 주석 품질 ("왜" 명시) | ✅ |
| className과 style 충돌 없음 | ✅ |
| tsc 0 에러 | ✅ |
| git status 정확히 7개 파일만 변경 | ✅ |
| primary variant / primary 배경 회귀 없음 | ✅ |

### 📌 최종 판정
**조건부 승인.** 2단계 명세 범위 내에서는 결함 0건이므로 PM은 **즉시 커밋 진행 가능**. 단, 리뷰 중 발견한 `admin-courts-content.tsx:219 "등록" 버튼`은 **3단계(남은 의심 파일 재조사) 작업 목록에 반드시 추가**해야 동일 버그가 완전히 제거됨. 이 포인트는 2단계 developer의 책임이 아니라 **Explore 조사 단계의 누락**이다.

## 작업 로그
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 2026-04-11 | developer | 다크모드 accent 버튼 가시성 수정 (--color-on-accent 도입, 4파일) | tsc 0 에러 |
| 2026-04-11 | tester | 정적 검증 (tsc + git diff + 코드 리뷰) | 12/12 통과, primary 회귀 없음 |
| 2026-04-12 | developer | [2단계] accent 버튼 가시성 확장 수정 (7파일 10포인트, --color-on-accent 재사용) | tsc 0 에러, git status 정확히 7파일만 변경 |
| 2026-04-12 | reviewer | [2단계] 리뷰 — 패턴 일관성/분기/범위/주석 전수 검증 | 조건부 승인. 명세 10/10 완벽, admin-courts-content.tsx:219 Explore 누락 1건 발견 → 3단계 이관 |
| 2026-04-12 | tester | [2단계] 정적 검증 (tsc + git diff 7파일 + 1단계 회귀 체크) | 14/14 통과, 1단계 파일 미수정, 커밋 가능 |
