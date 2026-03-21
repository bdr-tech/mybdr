# 📋 작업 스크래치패드

## 현재 작업
- **요청**: UI/UX 전체 개선 - ESPN 박스형 카드 + WHOOP 정보 디테일 스타일 믹스
- **상태**: 진행 중 - 계획 수립
- **현재 담당**: planner
- **디자인 방향**: ESPN(박스형 레이아웃, 스코어 카드 구조) + WHOOP(다크 테마, 포인트 컬러, 미니멀 정보 표시)

## 작업 계획 (planner)

### Phase 3: 대회탭 UI를 경기탭과 동일한 스타일로 변경 + 종별(divisions) 태그 표시

### 현재 UI 비교 분석

**경기탭 GameCard** (`games-content.tsx` 73~170행):
- 그리드: `grid-cols-2 gap-3 lg:grid-cols-3` (2열 기본, 대형 3열)
- 카드 외형: `rounded-[16px] border border-[#E8ECF0] bg-[#FFFFFF]` + 호버 시 `-translate-y-1 shadow-lg border-[#1B3C87]/30`
- 상단 컬러바: `h-1` + 유형별 색상 (PICKUP=파랑, GUEST=녹색, PRACTICE=주황)
- Row 1: 유형 뱃지(`rounded-[6px] px-2 py-0.5 text-xs font-bold uppercase`) + 상태 텍스트(`text-[11px] font-bold`)
- Row 2: 제목(`text-sm font-bold text-[#111827] line-clamp-1`)
- Row 3: 날짜+장소 (SVG 아이콘 + `text-xs text-[#6B7280]`)
- Row 4: 참가 프로그레스바 (`h-1.5 rounded-full` + `text-[11px] font-bold tabular-nums`)
- Row 5: 참가비 + 난이도 뱃지 (`mt-auto`)

**대회탭 TournamentCard** (`tournaments-content.tsx` 100~162행):
- 그리드: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (1열 기본, 중형 2열)
- 카드 외형: 동일한 `rounded-[16px] border` 스타일 (이미 비슷)
- 상단 컬러바: `h-1` + 상태별 색상 (경기탭과 달리 상태로 결정)
- Row 1: 형식 뱃지(검정 bg 고정 `bg-[#111827]`) + Badge 컴포넌트(경기탭과 다른 방식)
- Row 2: 대회명(`text-[15px] font-bold line-clamp-2`)
- Row 3: 장소+날짜 (SVG 아이콘 + text-xs, 경기탭과 순서 반대)
- 구분선: `h-px bg-[#E8ECF0]` (경기탭에는 없음)
- Row 4: 참가팀 프로그레스바 (별도 컴포넌트 TeamCountBar)
- Row 5: 참가비 (난이도 뱃지 없음)
- divisions 태그: API에서 내려오지만 UI 미표시

### 차이점 요약

| 항목 | 경기탭 (기준) | 대회탭 (변경 대상) | 변경 필요 |
|------|-------------|------------------|----------|
| 그리드 레이아웃 | `grid-cols-2` 기본 | `grid-cols-1` 기본 | O - 2열로 변경 |
| 상단 뱃지 배경색 | 유형별 컬러 bg | 검정(#111827) 고정 | O - 상태별 컬러 bg로 변경 |
| 상태 표시 | 텍스트+색상만 (`text-[11px]`) | Badge 컴포넌트 | O - 텍스트+색상 방식으로 통일 |
| 제목 크기 | `text-sm` | `text-[15px]` | O - text-sm으로 통일 |
| 제목 줄수 | `line-clamp-1` | `line-clamp-2` | O - line-clamp-1로 통일 |
| 정보 순서 | 날짜 먼저, 장소 다음 | 장소 먼저, 날짜 다음 | O - 날짜 먼저로 통일 |
| 구분선 | 없음 | 있음 | O - 제거 |
| 프로그레스바 스타일 | 인라인, `text-[11px] font-bold tabular-nums` | 별도 컴포넌트, `text-xs text-[#6B7280]` | O - 인라인+경기탭 스타일로 통일 |
| 프로그레스 바 색상 | 상태별(#1B3C87/#D97706/#EF4444) | 상태별(#1B3C87/#D97706/#E31B23) | 소 - 거의 동일, 통일 |
| 참가비+하단 | 참가비 + 난이도뱃지 | 참가비만 | - (대회에 난이도 없으므로 유지) |
| 종별 태그 | 해당 없음 | 미표시 (API에서 divisions 내려옴) | O - 태그 추가 |
| 스켈레톤 | 2열 그리드 | 1열 그리드 | O - 2열로 변경 |
| 다크모드 | 없음 | 없음 | - 해당 없음 |

### 작업 계획

목표: 대회 목록 카드 UI를 경기 목록 카드와 동일한 디자인 패턴으로 통일하고, divisions(종별) 태그를 카드에 표시

| 순서 | 작업 | 담당 | 예상 시간 | 선행 조건 | 수정 파일 |
|------|------|------|----------|----------|----------|
| 1 | TournamentFromApi 인터페이스에 divisions 필드 추가 | developer | 2분 | 없음 | `tournaments-content.tsx` |
| 2 | TournamentCard를 경기탭 GameCard 스타일로 리디자인 | developer | 10분 | 1단계 | `tournaments-content.tsx` |
| 3 | 그리드 레이아웃 + 스켈레톤 수정 | developer | 3분 | 2단계 | `tournaments-content.tsx` |
| 4 | 테스트 및 검증 (tsc + 시각 확인) | tester | 5분 | 3단계 | - |
| 5 | 코드 리뷰 | reviewer | 5분 | 4단계 | - |

총 예상 시간: 25분

### 각 단계 상세

**1단계: TournamentFromApi 인터페이스에 divisions 필드 추가** (2분)
- `tournaments-content.tsx`의 `TournamentFromApi` 인터페이스에 `divisions: string[]` 추가
- API 응답에는 이미 `divisions` 필드가 포함되어 있음 (Phase 2에서 route.ts에 추가 완료)
- C단계 테스트 참고 사항에서도 이 작업이 필요하다고 명시됨

**2단계: TournamentCard를 경기탭 GameCard 스타일로 리디자인** (10분)
이것이 핵심 작업. 구체적 변경 내용:

(a) STATUS_STYLE 매핑 변경:
- 현재: `variant`(Badge용) + `accent`(컬러바용) 구조
- 변경: `color`(텍스트 색상) + `bg`(뱃지 배경색) 구조로 변경 (GameCard의 TYPE_BADGE 패턴)
- Badge 컴포넌트 import 제거

(b) 상단 뱃지 + 상태 영역 (Row 1):
- 좌측: 형식 뱃지를 `rounded-[6px] px-2 py-0.5 text-xs font-bold uppercase tracking-wider` + 상태별 컬러 bg로 변경
- 우측: Badge 컴포넌트 -> `text-[11px] font-bold` 텍스트로 변경

(c) 제목 (Row 2):
- `text-[15px]` -> `text-sm`
- `line-clamp-2` -> `line-clamp-1`
- `mb-3` -> `mb-1`

(d) 날짜+장소 (Row 3):
- 순서: 장소 먼저 -> 날짜 먼저로 변경 (경기탭과 통일)
- `gap-1.5` -> `gap-1`
- `mb-3` -> `mb-2`
- `space-y-1` -> `space-y-0.5`

(e) 구분선 제거:
- `<div className="mb-3 h-px bg-[#E8ECF0]" />` 삭제

(f) 참가팀 프로그레스바:
- TeamCountBar 별도 컴포넌트 -> 인라인으로 변경 (GameCard 패턴)
- 숫자 스타일: `text-xs text-[#6B7280]` -> `text-[11px] font-bold tabular-nums` + 색상 동적
- 바 색상: 동일한 3단계 (정상/#1B3C87, 80%/#D97706, 100%/#EF4444)
- `mb-2` 추가

(g) 하단 영역 (Row 5):
- 참가비: 기존 스타일 유지 (경기탭과 이미 유사)
- 종별(divisions) 태그 추가: 우측에 작은 칩으로 표시
  - divisions 배열의 각 항목을 `rounded-[6px] px-1.5 py-0.5 text-[11px]` 칩으로 표시
  - 색상: 부드러운 톤 (bg-[#F3F4F6], text-[#6B7280]) -- 보조 정보이므로 눈에 띄지 않게
  - 최대 2개까지만 표시, 나머지는 `+N` 으로 축약
- `mt-auto flex items-center justify-between pt-1` (GameCard와 동일)

(h) 패딩:
- `p-4 sm:p-5` -> `p-3.5` (GameCard와 동일)

**3단계: 그리드 레이아웃 + 스켈레톤 수정** (3분)
- 카드 그리드: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` -> `grid-cols-2 gap-3 lg:grid-cols-3`
- TournamentGridSkeleton도 동일하게 변경
- 스켈레톤 내부도 GameCard 스켈레톤 패턴으로 맞춤 (h-1 컬러바 + space-y-2.5)

**4단계: 테스트** (5분)
- tsc --noEmit으로 타입 에러 확인
- 개발 서버에서 /tournaments 페이지 시각 확인 (경기탭과 동일한 느낌인지)
- divisions 태그가 카드에 표시되는지 확인
- 반응형(모바일 2열, 데스크톱 3열) 확인

**5단계: 코드 리뷰** (5분)
- 경기탭과의 스타일 일관성 확인
- 불필요한 import(Badge) 제거 확인
- 다크모드 영향 없는지 확인

### 수정 대상 파일 (1개만)

| 파일 | 변경 범위 | 비고 |
|------|----------|------|
| `src/app/(web)/tournaments/_components/tournaments-content.tsx` | TournamentFromApi 인터페이스, STATUS_STYLE, TournamentCard, TournamentGridSkeleton, 그리드 레이아웃 | API/서비스 파일 변경 불필요 (이미 divisions 포함됨) |

### 주의사항
- API 파일(`route.ts`)과 서비스 파일(`tournament.ts`)은 수정하지 않음. Phase 2에서 이미 `divisions` 필드가 API 응답에 포함되어 있음
- Badge 컴포넌트 import를 제거해도 다른 곳에서 사용하지 않으므로 안전
- `TOURNAMENT_STATUS_LABEL` import는 유지 (상태 한글 라벨 매핑에 필요)
- FORMAT_LABEL 매핑도 유지 (형식 뱃지에 사용)
- TeamCountBar 컴포넌트는 인라인으로 변환 후 삭제
- divisions 배열이 빈 배열(`[]`)이면 태그 영역을 표시하지 않음

## 설계 노트 (architect)

### Phase 2: Prisma Json 배열 간 교집합 필터링 설계

#### 핵심 판단: Prisma `path` + `array_contains` OR 조합 (방식 C) 채택

**왜 이 방식인가?**

| 방식 | 장점 | 단점 | 판정 |
|------|------|------|------|
| A: 전체 `$queryRaw` | 성능 최적, `?|` 연산자 활용 | 기존 코드 전면 재작성, select/type 안전성 상실 | 불채택 |
| B: ID 선조회 후 `findMany` | Raw SQL 최소화 | 2번 쿼리, 복잡도 증가 | 불채택 |
| **C: Prisma `OR` + `array_contains`** | **기존 코드 구조 100% 유지, 타입 안전** | 값 개수만큼 OR 조건 생성 (보통 1~5개라 문제 없음) | **채택** |

Prisma 6에서 `Json` 타입은 `hasSome` 같은 배열 전용 연산자를 지원하지 않습니다. 하지만 `path: []` (루트 배열) + `array_contains: "값"` 조합으로 "이 Json 배열에 특정 문자열이 들어있는가"를 검사할 수 있습니다. 이것을 OR로 묶으면 "하나라도 겹치면 매칭" 효과를 냅니다.

비유: 엑셀에서 A열(대회 종별)과 B열(내 선호 종별)을 비교할 때, B열의 각 값을 하나씩 A열에서 찾아보고 하나라도 있으면 OK 표시하는 것과 같습니다.

#### 📍 만들 위치와 구조

| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| `src/lib/services/tournament.ts` | TournamentListFilters에 `divisions` 추가 + where 조건 추가 | 수정 |
| `src/lib/services/tournament.ts` | TOURNAMENT_LIST_SELECT에 `divisions: true` 추가 | 수정 |
| `src/app/api/web/tournaments/route.ts` | prefer=true일 때 `preferred_divisions` 조회 + 서비스에 전달 | 수정 |

#### 1단계: TournamentListFilters 인터페이스 수정안

```typescript
// src/lib/services/tournament.ts (79~84행 부근)
export interface TournamentListFilters {
  status?: string;
  cities?: string[];
  /** 선호 종별 필터 -- Json 배열 교집합 매칭 (prefer=true 시 사용) */
  divisions?: string[];
  take?: number;
}
```

#### 2단계: listTournaments() where 조건 수정안

```typescript
// src/lib/services/tournament.ts - listTournaments 함수 내부
export async function listTournaments(filters: TournamentListFilters = {}) {
  const { status, cities, divisions, take = 60 } = filters;

  // where 조건을 동적으로 구성
  const where: Record<string, unknown> = {
    status: status && status !== "all" ? status : { not: "draft" },
  };

  // 선호 지역(cities)이 있으면 OR 조건으로 도시 필터 적용
  if (cities && cities.length > 0) {
    where.city = { in: cities, mode: "insensitive" };
  }

  // 선호 종별(divisions) 필터: Json 배열 교집합 매칭
  // divisions 배열의 각 값에 대해 OR 조건 생성
  // 예: divisions = ["챌린저", "비기너스"] 이면
  //     tournaments.divisions 에 "챌린저" OR "비기너스"가 포함된 대회 매칭
  if (divisions && divisions.length > 0) {
    where.OR = divisions.map((div) => ({
      divisions: { path: [], array_contains: div },
    }));
  }

  return prisma.tournament.findMany({
    where,
    orderBy: { startDate: "desc" },
    take,
    select: TOURNAMENT_LIST_SELECT,
  });
}
```

**주의**: `where`에 이미 다른 `OR` 조건이 있다면 충돌할 수 있습니다. 현재 코드에는 OR이 없으므로 안전합니다. 만약 향후 OR이 추가되면 `AND`로 감싸는 구조로 변경해야 합니다.

더 안전한 대안 (AND로 감싸기):
```typescript
if (divisions && divisions.length > 0) {
  where.AND = [
    ...(Array.isArray(where.AND) ? where.AND : []),
    {
      OR: divisions.map((div) => ({
        divisions: { path: [], array_contains: div },
      })),
    },
  ];
}
```

**권장: 안전한 대안(AND 감싸기) 사용** -- 향후 확장에도 안전합니다.

#### 3단계: TOURNAMENT_LIST_SELECT 수정안

```typescript
export const TOURNAMENT_LIST_SELECT = {
  id: true,
  name: true,
  format: true,
  status: true,
  startDate: true,
  endDate: true,
  entry_fee: true,
  city: true,
  venue_name: true,
  maxTeams: true,
  divisions: true,  // <-- 추가: 목록에서 종별 표시용
  _count: { select: { tournamentTeams: true } },
} as const;
```

#### 4단계: tournaments/route.ts API 수정안

```typescript
// GET 함수 내부, prefer=true 블록에서 preferred_divisions도 함께 조회
if (prefer) {
  const session = await getWebSession();
  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(session.sub) },
      select: { city: true, preferred_divisions: true },  // <-- 추가
    });
    // 기존 city 처리 로직 유지...

    // preferred_divisions 처리 추가
    if (user?.preferred_divisions && Array.isArray(user.preferred_divisions)) {
      const divs = user.preferred_divisions as string[];
      if (divs.length > 0) {
        preferredDivisions = divs;
      }
    }
  }
}

// 서비스 호출 시 divisions 파라미터 전달
const rows = await listTournaments({
  status,
  cities: preferredCities,
  divisions: preferredDivisions,  // <-- 추가
  take: 60,
}).catch(() => []);

// 응답 매핑에 divisions 필드 추가
const tournaments = rows.map((t) => ({
  // ... 기존 필드 ...
  divisions: t.divisions ?? [],  // <-- 추가
}));
```

#### 🔗 기존 코드 연결

- `tournament.ts`의 `listTournaments()` 함수 (194행): where 조건에 divisions 필터 추가
- `tournament.ts`의 `TOURNAMENT_LIST_SELECT` (15행): divisions 필드 추가
- `tournaments/route.ts`의 GET 함수 (15행): preferred_divisions 조회 및 전달
- cities 필터와 divisions 필터는 AND 조건으로 결합 (지역도 맞고 종별도 맞는 대회만)

#### ⚠️ developer 주의사항

1. **Prisma Json 필터 문법 주의**: `{ path: [], array_contains: "값" }` 에서 `path: []`는 "루트 레벨 배열"을 의미합니다. `path`를 빠뜨리면 동작하지 않습니다.
2. **OR과 AND 충돌 방지**: divisions 필터는 반드시 `where.AND = [{ OR: [...] }]` 형태로 감싸서 기존/미래의 OR 조건과 충돌하지 않게 합니다.
3. **`preferred_divisions`의 타입**: DB에서 Json으로 저장되므로 `as string[]` 캐스팅 전에 `Array.isArray()` 검증이 필수입니다. (빈 배열 `[]`이 기본값이므로 보통 안전하지만 방어 코딩)
4. **GIN 인덱스 활용**: `tournaments.divisions`와 `users.preferred_divisions` 모두 GIN 인덱스가 이미 존재합니다. `@>` (array_contains) 연산은 GIN 인덱스를 활용하므로 성능 문제 없습니다.
5. **빈 배열 처리**: `preferred_divisions`가 `[]`(빈 배열)이면 divisions 필터를 적용하지 않아야 합니다 (전체 대회 표시). 이미 `divs.length > 0` 체크로 처리됩니다.
6. **응답에 divisions 추가 시**: Json 타입이므로 별도 직렬화 불필요 (이미 배열 형태)

## 구현 기록 (developer)

### Phase 2: 선호 종별(divisions) 대회 필터 적용

구현한 기능: prefer=true일 때 유저의 preferred_divisions를 조회하여, 해당 종별이 포함된 대회만 필터링하여 반환

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/lib/services/tournament.ts` | TournamentListFilters에 `divisions?: string[]` 추가 | 수정 |
| `src/lib/services/tournament.ts` | TOURNAMENT_LIST_SELECT에 `divisions: true` 추가 | 수정 |
| `src/lib/services/tournament.ts` | listTournaments()에 divisions 필터 로직 추가 (AND+OR+array_contains) | 수정 |
| `src/app/api/web/tournaments/route.ts` | prefer=true 블록에서 preferred_divisions 조회 추가 | 수정 |
| `src/app/api/web/tournaments/route.ts` | listTournaments 호출에 divisions 파라미터 전달 | 수정 |
| `src/app/api/web/tournaments/route.ts` | 응답 매핑에 `divisions: t.divisions ?? []` 추가 | 수정 |

tester 참고:
- 테스트 방법: /api/web/tournaments?prefer=true 호출 시 로그인 유저의 preferred_divisions에 해당하는 종별이 포함된 대회만 반환되는지 확인
- 정상 동작: preferred_divisions가 ["챌린저"]이면 divisions 배열에 "챌린저"가 포함된 대회만 목록에 표시
- prefer=false이거나 preferred_divisions가 빈 배열이면 기존과 동일하게 전체 대회 표시
- cities와 divisions 필터는 AND 조건으로 결합됨 (지역도 맞고 종별도 맞는 대회만)

reviewer 참고:
- divisions 필터는 AND로 감싸서 기존/미래의 OR 조건과 충돌하지 않도록 구현
- Prisma Json 필터: `{ path: [], array_contains: div }` 방식으로 GIN 인덱스 활용
- preferred_divisions는 Array.isArray()로 검증 후 사용 (방어 코딩)

### Phase 4-1: 디자인 토큰 시스템 구축 (컬러/타이포/간격 변수 통합)

구현한 기능: globals.css에 ESPN+WHOOP 믹스 디자인 토큰(CSS 변수)을 정의. 기존 변수의 값을 새 팔레트로 변경하고, 타이포그래피/간격/추가 컬러 변수를 새로 추가했다. 기존 컴포넌트는 전혀 수정하지 않았다.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/globals.css` | @theme 블록: 기존 컬러 변수 값 변경 (accent #E31B23->#F4A261, success/error/warning/info/border 톤 변경) + 새 변수 추가 (bg-primary, bg-secondary, card-hover, text-tertiary, font-size 6종, spacing 3종) | 수정 |
| `src/app/globals.css` | html.dark 블록: WHOOP 다크 팔레트로 값 변경 (background #0F1117->#0D0D0D, card/elevated/surface 순수 그레이톤, accent 웜 오렌지, text-secondary/muted 조정) + 새 다크 변수 추가 | 수정 |

주요 변경 사항:
- 포인트 컬러(--color-accent): #E31B23(빨강) -> #F4A261(웜 오렌지) -- 가장 큰 시각적 변화
- 다크 모드 배경: #0F1117(파란 기운) -> #0D0D0D(순수 어둠, WHOOP 스타일)
- 다크 모드 카드/표면: 파란 틴트(#1A1D27) -> 순수 그레이(#1A1A1A)
- 새 타이포 변수 6종: display(32px) ~ micro(11px)
- 새 간격 변수 3종: card-padding(14px), card-gap(12px), section-gap(24px)

tester 참고:
- 테스트 방법: tsc --noEmit 통과 확인 (완료), 개발 서버에서 라이트/다크 모드 전환 시 색상 변화 확인
- 정상 동작: 포인트 컬러가 빨강에서 오렌지로 바뀌어 보여야 함 (--color-accent 사용처), 다크 모드 배경이 더 짙은 순수 검정 톤으로 바뀌어야 함
- 주의: 하드코딩 색상(bg-[#FFFFFF] 등)을 쓰는 컴포넌트는 아직 CSS 변수를 참조하지 않으므로, 변수 변경의 영향을 받지 않는 곳이 있을 수 있음 (이것은 정상 -- Phase 4-2 이후에 전환 예정)
- 기존 html.dark attribute selector 오버라이드는 그대로 유지되어 있으므로 다크 모드도 기존대로 동작

reviewer 참고:
- 기존 변수명은 100% 유지 (하위 호환), 값만 변경
- @theme 블록 안에 정의되므로 Tailwind CSS 4에서 자동으로 유틸리티로 사용 가능 (예: `bg-[var(--color-bg-primary)]` 또는 `text-[length:var(--font-size-body)]`)
- elevated, surface 변수는 Phase 4-7에서 정리 예정이므로 이번에는 기존값 유지

### Phase 4-2: 공통 UI 컴포넌트 리디자인 (Card, Button, Badge, Skeleton)

구현한 기능: 공통 UI 컴포넌트 4개의 하드코딩 색상(#FFFFFF, #E8ECF0, #E31B23 등)을 Phase 4-1에서 정의한 CSS 변수로 전환하고, WHOOP 스타일의 호버 효과를 적용했다.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/components/ui/card.tsx` | 배경 bg-[#FFFFFF]->var(--color-card), 테두리 border-[#E8ECF0]->var(--color-border), 그림자->var(--shadow-card), 호버 translate-y 제거하고 배경색/테두리 변화로 대체, StatCard 아이콘 배경/텍스트도 CSS 변수로 전환 | 수정 |
| `src/components/ui/button.tsx` | cta variant #E31B23->var(--color-accent), primary #111827->var(--color-text-primary), secondary 배경/테두리->CSS 변수, ghost->var(--color-primary), danger->var(--color-error), focus-visible 링->var(--color-primary) | 수정 |
| `src/components/ui/badge.tsx` | default bg rgba(27,60,135,0.12)->var(--color-primary-light), success/error/warning/info 각각 해당 CSS 변수의 12% 투명도로 전환 | 수정 |
| `src/components/ui/skeleton.tsx` | 배경 bg-[#E8ECF0]->var(--color-border), 다크 모드에서 자동으로 어두운 색 적용 | 수정 |

주요 변경 사항:
- Card 호버: hover:-translate-y-1 hover:shadow-lg (떠오르기) -> hover:bg-[var(--color-card-hover)] hover:border-[var(--color-border-subtle)] (미세한 밝기 변화)
- Card 그림자: shadow-[0_2px_8px_rgba(0,0,0,0.06)] -> var(--shadow-card) -- 다크 모드에서 자동으로 더 진한 그림자 적용
- Card 라운드: rounded-[16px] -> var(--radius-card) -- 일관된 디자인 토큰 사용
- Button cta: 빨간색(#E31B23) -> 웜 오렌지(--color-accent, #F4A261)
- Button primary 호버: hover:bg-[#1F2937] -> hover:opacity-85 (CSS 변수 기반 자동 대응)
- Badge: 모든 variant가 CSS 변수 기반으로 다크 모드 자동 대응
- Skeleton: 다크 모드에서 --color-border가 #2A2A2A로 적용되어 자연스러운 어두운 톤

tester 참고:
- 테스트 방법: tsc --noEmit 통과 확인 (완료), 개발 서버에서 다음 확인 필요
- 정상 동작:
  - Card: 호버 시 떠오르지 않고 배경색이 미세하게 밝아져야 함 (라이트: #FFFFFF -> #F9F9FB)
  - Button cta: 빨간색이 아닌 웜 오렌지(#F4A261) 배경이어야 함
  - Badge: 라이트/다크 모드 전환 시 배경과 텍스트 색상이 자연스럽게 바뀌어야 함
  - Skeleton: 다크 모드에서 로딩 플레이스홀더가 어두운 회색(#2A2A2A)이어야 함
- 주의할 점:
  - Card를 사용하는 페이지(프로필, 대회 상세 등)에서 레이아웃이 깨지지 않는지 확인
  - Button의 className으로 색상을 덮어쓰는 곳이 있다면 그 부분은 영향 없음
  - 대회/경기 목록 카드는 Card 컴포넌트를 사용하지 않고 자체 스타일을 쓰므로 이번 변경에 영향 없음

reviewer 참고:
- props 인터페이스 변경 없음 -- 기존 사용처 100% 호환
- CSS 변수는 모두 Phase 4-1에서 정의된 것만 사용 (새 변수 추가 없음)
- danger variant의 투명도 처리: Tailwind의 /20, /30 문법으로 CSS 변수와 결합 (bg-[var(--color-error)]/20)
- badge의 success/error/warning/info도 /12 투명도 문법 사용 -- default만 --color-primary-light(별도 rgba 변수) 사용
- 주석은 한국어로 추가하여 바이브코더 이해도 향상

### Phase 4-3: 헤더 + 네비게이션 + 레이아웃 리디자인

구현한 기능: 헤더, 모바일 하단 네비, 슬라이드 메뉴, 풋터, 레이아웃의 하드코딩 색상을 CSS 변수로 전환하고, 포인트 컬러를 빨강(#E31B23)에서 웜 오렌지(var(--color-accent))로 변경했다.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/layout.tsx` | 배경색 bg-[#F5F7FA] -> var(--color-bg-secondary) | 수정 |
| `src/components/shared/header.tsx` | 데스크탑 헤더: 테두리 border-[#E8ECF0] -> var(--color-border), 활성 탭 텍스트/하단바 -> var(--color-text-primary)/var(--color-accent), 비활성 탭 -> var(--color-text-muted), Sparkles 활성 #E31B23 -> var(--color-accent) + 배경 var(--color-accent-light), 로그인 버튼 bg-[#111827] -> var(--color-accent) | 수정 |
| `src/components/shared/header.tsx` | 모바일 하단 네비: 배경 bg-[#FFFFFF] -> var(--color-bg-primary), 테두리 -> var(--color-border), 활성 탭 text-[#E31B23] -> var(--color-accent), 비활성 text-[#B0B8C1] -> var(--color-text-muted), 활성 바 bg-[#E31B23] -> var(--color-accent) | 수정 |
| `src/components/shared/slide-menu.tsx` | 패널 배경 bg-[#FFFFFF] -> var(--color-bg-primary), 헤더 테두리/포인트 -> var(--color-border)/var(--color-accent), 유저 카드 배경 -> var(--color-elevated), 섹션 제목/링크 -> var(--color-text-muted)/var(--color-text-primary), 닫기 버튼 -> var(--color-text-secondary), 브랜드 BDR -> var(--color-accent), CTA 로그인 -> var(--color-accent), 회원가입 테두리 -> var(--color-border) | 수정 |
| `src/components/layout/Footer.tsx` | 배경 bg-[#F5F7FA] -> var(--color-bg-secondary), 테두리 -> var(--color-border), BDR 로고 text-[#E31B23] -> var(--color-accent), 저작권/링크 -> var(--color-text-secondary) | 수정 |

tester 참고:
- 테스트 방법: 개발 서버에서 라이트/다크 모드 전환하며 확인
- 정상 동작:
  - 라이트 모드: 기존과 거의 동일하되, 포인트 컬러(활성 탭 하단 바, 로그인 버튼, BDR 로고)가 빨강 -> 웜 오렌지로 변경
  - 다크 모드: 헤더/하단 네비/슬라이드 메뉴/풋터가 어두운 배경(#0D0D0D)으로 자연스럽게 전환
  - 모바일 하단 네비: 활성 탭 아이콘+텍스트가 웜 오렌지, 비활성은 회색
  - Sparkles 필터 활성 시: 웜 오렌지 아이콘 + 연한 오렌지 배경
- 주의할 입력:
  - 모바일 하단 네비의 safe-area-inset-bottom은 건드리지 않았으므로 iOS에서 동작 확인 필요
  - 유저 세션 로직은 변경하지 않았으므로 로그인/로그아웃 기능에 영향 없음
  - header의 bg-[#FFFFFF]/95는 유지 (globals.css의 html.dark backdrop-blur 오버라이드가 다크 모드 처리)

reviewer 참고:
- 유저 세션 로직(useEffect, fetch)은 일절 변경하지 않음 -- 순수 스타일 변경만 진행
- CSS 변수는 모두 Phase 4-1에서 정의된 것만 사용 (새 변수 추가 없음)
- 헤더 배경의 반투명(bg-[#FFFFFF]/95)은 유지 -- rgba 값에 CSS 변수를 쓰기 어려워 globals.css의 dark backdrop-blur 오버라이드에 의존
- slide-menu의 role/aria 속성은 그대로 유지 (접근성)

## 테스트 결과 (tester)

### Phase 2: 선호 종별(divisions) 대회 필터 검증 (2026-03-21)

| 번호 | 검증 항목 | 결과 | 비고 |
|------|----------|------|------|
| 1 | TypeScript 컴파일 체크 (`tsc --noEmit`) | 통과 | 에러/경고 0건 |
| 2-1 | tournament.ts: TournamentListFilters에 divisions 필드 | 통과 | 85행 `divisions?: string[]` 확인 |
| 2-2 | tournament.ts: divisions 필터가 AND로 감싸져 있는지 | 통과 | 216-224행 `where.AND = [{ OR: ... }]` 확인 |
| 2-3 | tournament.ts: TOURNAMENT_LIST_SELECT에 divisions: true | 통과 | 26행 확인 |
| 2-4 | route.ts: prefer=true에서 preferred_divisions select | 통과 | 31행 `select: { city: true, preferred_divisions: true }` |
| 2-5 | route.ts: Array.isArray() 검증 | 통과 | 41행 `Array.isArray(user.preferred_divisions)` |
| 2-6 | route.ts: listTournaments에 divisions 파라미터 전달 | 통과 | 51행 `divisions: preferredDivisions` |
| 2-7 | route.ts: 응답 매핑에 divisions 필드 포함 | 통과 | 65행 `divisions: t.divisions ?? []` |
| 3-1 | 빈 배열이면 필터 미적용 (전체 대회 표시) | 통과 | route.ts 43행 length>0 + tournament.ts 215행 length>0 이중 체크 |
| 3-2 | divisions가 있으면 OR로 매칭 | 통과 | 219행 `OR: divisions.map(...)` |
| 3-3 | cities + divisions가 AND로 결합 | 통과 | cities는 where.city, divisions는 where.AND에 분리 배치 -> Prisma 자동 AND |
| 3-4 | Prisma Json 필터 문법 올바른지 | 통과 | `{ path: [], array_contains: div }` 정확한 문법 |
| 4 | tsc --noEmit 빌드 테스트 | 통과 | 타입 에러 없음 |

종합: 13개 중 13개 통과 / 0개 실패

참고 사항:
- architect 설계 노트의 "안전한 대안(AND 감싸기)" 권장 방식이 정확히 반영됨
- 기존 where.AND가 없을 때를 대비한 `Array.isArray(where.AND)` 방어 코드도 217행에 포함
- preferred_divisions가 null이거나 배열이 아닌 경우의 방어 코딩이 route.ts에 적절히 구현됨

### A단계: 전체 사이트 빌드/컴파일 점검 (2026-03-21)

| 번호 | 점검 항목 | 결과 | 비고 |
|------|----------|------|------|
| A-1 | TypeScript 컴파일 체크 (`npx tsc --noEmit`) | 통과 | 타입 에러/경고 0건. 출력 없이 정상 종료 |
| A-2 | Next.js 빌드 체크 (`npx next build`) | 통과 | 79개 정적 페이지 생성 완료. 컴파일 4.6초, 페이지 생성 2.3초. 에러 없음 |
| A-3 | 린트 체크 (`npm run lint` / `npx eslint`) | 실행 불가 | ESLint 설정 파일(eslint.config.js) 미존재. `next lint` 명령은 Next.js 16에서 "Invalid project directory" 에러 발생 |

종합: 2개 통과 / 0개 실패 / 1개 실행 불가

상세 기록:

**A-1 TypeScript 컴파일**: `npx tsc --noEmit` 실행 시 출력 없이 종료코드 0으로 완료. 전체 프로젝트에 타입 에러 없음.

**A-2 Next.js 빌드**: `npx next build` 실행 결과:
- Next.js 16.1.6 (Turbopack) 사용
- Serwist(PWA) 관련 WARNING 1건 출력 (Turbopack에서 @serwist/next 미지원 경고 -- 기능 문제 아님, 개발 환경 안내 메시지)
- 컴파일 성공 (4.6초)
- TypeScript 체크 통과
- 정적 페이지 79개 생성 완료 (21 workers, 2.3초)
- 참고: `npm run build`는 `prisma generate`가 선행되는데, 개발 서버가 실행 중이면 query_engine 파일 잠금으로 EPERM 에러 발생. `npx next build`로 직접 실행하면 문제 없음.

**A-3 린트 체크**: 실행 불가 사유:
- 프로젝트 루트에 `eslint.config.js` (ESLint v9 flat config) 파일이 없음
- `next lint` 명령은 Next.js 16에서 `lint`를 디렉토리 인자로 해석하여 "Invalid project directory: ...\\lint" 에러 발생 (Next.js 16 호환 문제 추정)
- ESLint v9.39.3이 설치되어 있으나 설정 파일 없이는 실행 불가
- 이 문제는 프로젝트 초기 설정 누락으로, 별도 설정 작업이 필요함

### B단계: 페이지별 기능 점검 (2026-03-21)

**1. 주요 페이지 접근 테스트** (개발서버 http://localhost:3001)

| 번호 | 페이지 | URL | HTTP 상태 | HTML 크기 | 결과 | 비고 |
|------|--------|-----|----------|----------|------|------|
| B-1 | 홈 페이지 | / | 200 | 57,847 bytes | 통과 | title: "MyBDR - Basketball Tournament Platform" |
| B-2 | 대회 목록 | /tournaments | 200 | 179,267 bytes | 통과 | 정상 렌더링 |
| B-3 | 경기 목록 | /games | 200 | 111,751 bytes | 통과 | 정상 렌더링 |
| B-4 | 로그인 | /login | 200 | 60,287 bytes | 통과 | 정상 렌더링 |
| B-5 | 선호 설정 | /profile/preferences | 200 | 83,074 bytes | 통과 | 정상 렌더링 (비로그인도 페이지 자체는 접근 가능) |

**2. API 엔드포인트 테스트**

| 번호 | API 엔드포인트 | HTTP 상태 | 결과 | 비고 |
|------|---------------|----------|------|------|
| B-6 | GET /api/web/tournaments | 200 | 통과 | 30개 대회 반환. JSON 구조 정상 |
| B-7 | GET /api/web/tournaments?prefer=true | 200 | 통과 | 비로그인 시 30개 전체 반환 (필터 미적용 -- 정상 동작) |
| B-8 | GET /api/web/games | 200 | 통과 | 11개 경기 반환. JSON 구조 정상 |
| B-9 | GET /api/web/preferences | 401 | 통과 | 비로그인 시 `{"error":"로그인이 필요합니다.","code":"UNAUTHORIZED"}` -- 인증 보호 정상 |

**3. API 응답 검증**

| 번호 | 검증 항목 | 결과 | 비고 |
|------|----------|------|------|
| B-10 | tournaments 응답이 올바른 JSON 구조인지 | 통과 | `{"tournaments": [...]}` 구조 |
| B-11 | tournaments 응답에 divisions 필드 포함 | 통과 | 각 대회 객체에 `divisions` 배열 포함 (예: `["디비전7부"]`, `["일반부"]`, `[]`) |
| B-12 | tournaments 응답 필드가 snake_case인지 | 통과 | `start_date`, `end_date`, `entry_fee`, `venue_name`, `max_teams`, `team_count` -- 모두 snake_case |
| B-13 | games 응답이 올바른 JSON 구조인지 | 통과 | `{"games": [...], "cities": [...]}` 구조 |
| B-14 | preferences API 에러 응답 구조 | 통과 | `{"error": "...", "code": "..."}` 형식으로 정상 에러 응답 |
| B-15 | 존재하지 않는 API 경로 (404) | 통과 | /api/web/nonexistent -> 404 반환 |
| B-16 | 잘못된 status 파라미터 처리 | 통과 | `?status=invalidstatus` -> 200 응답, 빈 tournaments 배열 반환 (해당 status 대회 없음) |
| B-17 | prefer=true 비로그인 시 전체 대회 반환 | 통과 | prefer=true(30개) == prefer 미사용(30개) -- 로그인 없으면 필터 미적용, 정상 |

종합: 17개 중 17개 통과 / 0개 실패

참고 사항:
- 모든 페이지가 정상적인 HTML을 반환하며, Next.js 에러 페이지가 표시되지 않음
- tournaments API 응답에 Phase 2에서 추가된 `divisions` 필드가 정상 포함됨
- API 응답 컨벤션(snake_case)이 일관성 있게 유지됨
- 인증이 필요한 API(preferences)는 비로그인 시 401로 적절히 보호됨
- prefer=true는 로그인 세션이 없을 때 필터 없이 전체 대회를 반환 (graceful fallback)

### C단계: Phase1+2 통합 점검 (2026-03-21)

**점검 범위**: Phase 1(선호 설정 전체) + Phase 2(선호 종별 대회 필터) 코드 통합 일관성, 흐름, 엣지 케이스, UI 연동, 토글, 타입

| 번호 | 점검 항목 | 결과 | 비고 |
|------|----------|------|------|
| C-1 | API 엔드포인트 패턴 일관성 (preferences, tournaments, games) | 통과 | 3개 API 모두 동일 패턴: getWebSession -> user 조회 -> 서비스 호출 -> apiSuccess 반환 |
| C-2 | prefer=true 파라미터 처리 일관성 (tournaments vs games) | 통과 | tournaments: cities+divisions 필터, games: cities+gameTypes 필터. 둘 다 동일한 패턴(session 조회 -> user select -> 배열 검증 -> 서비스 전달) |
| C-3 | snake_case 응답 컨벤션 일관성 | 통과 | apiSuccess()가 convertKeysToSnakeCase() 자동 적용. tournaments(startDate->start_date), games(scheduledAt->scheduled_at 등) 모두 정상 변환. divisions는 소문자이므로 변환 불필요하게 유지 |
| C-4 | 선호 저장 -> 필터 적용 흐름 (preferences PATCH -> tournaments GET prefer=true) | 통과 | preference-form.tsx가 PATCH /api/web/preferences로 preferred_divisions 저장 -> tournaments API에서 user.preferred_divisions 조회 -> listTournaments(divisions: ...) 전달 -> where.AND[OR[array_contains]] 필터 적용. 전체 흐름 연결 완전 |
| C-5 | 선호 저장 -> 필터 적용 흐름 (preferences PATCH -> games GET prefer=true) | 통과 | preference-form.tsx에서 preferred_game_types 저장 -> games API에서 user.preferred_game_types 조회 -> listGames(gameTypes: ...) 전달 -> where.game_type IN 필터 적용. cities도 user.city에서 가져와 동일 흐름 |
| C-6 | 엣지: preferred_divisions 빈 배열일 때 필터 미적용 | 통과 | route.ts 43행 `divs.length > 0` + tournament.ts 215행 `divisions.length > 0` 이중 체크. 빈 배열이면 두 곳 모두 스킵하여 전체 대회 표시 |
| C-7 | 엣지: preferred_divisions null일 때 에러 없이 처리 | 통과 | route.ts 41행 `user?.preferred_divisions && Array.isArray(...)` 로 null/undefined/비배열 모두 안전 스킵 |
| C-8 | 엣지: cities + divisions 모두 설정 시 AND 결합 | 통과 | cities는 `where.city = { in: ... }`, divisions는 `where.AND = [{ OR: [...] }]`로 별도 배치. Prisma가 자동으로 AND 결합. 두 필터 독립적으로 작동 |
| C-9 | 엣지: 비로그인 + prefer=true 시 graceful fallback | 통과 | tournaments route.ts 27-28행: `getWebSession()` 실패 시 session=null -> cities/divisions 모두 undefined -> 필터 없이 전체 대회 반환. games도 동일 패턴 |
| C-10 | 선호 설정 UI -> API 연동 (preference-form.tsx) | 통과 | loadPreferences()에서 GET /api/web/preferences -> data.preferred_divisions을 selectedDivisions에 설정. handleSave()에서 selectedDivisions을 preferred_divisions으로 PATCH 전송. Zod 스키마(preferencesSchema)에서 z.array(z.string()).optional()로 검증 |
| C-11 | 선호 필터 토글(헤더) 동작 | 통과 | PreferFilterContext: 로그인 시 preferFilter=true 기본값, 페이지 이동 시 자동 리셋. header.tsx에서 Sparkles 아이콘 클릭 시 togglePreferFilter 호출. tournaments-content/games-content에서 preferFilter 변화 감지 -> API에 prefer=true/false 전달 |
| C-12 | TypeScript 타입 일관성 + tsc --noEmit 재확인 | 통과 | TournamentListFilters.divisions: string[] -> listTournaments 파라미터 -> where.AND 조건. GameListFilters.gameTypes: number[] -> listGames 파라미터 -> where.game_type 조건. tsc --noEmit 에러 0건 |

종합: 12개 중 12개 통과 / 0개 실패

참고 사항:
- tournaments-content.tsx의 TournamentFromApi 인터페이스에 divisions 필드가 정의되어 있지 않으나, API 응답에는 포함됨. 이는 plan 4단계 "대회 목록 UI에 종별 태그 표시(선택사항)"가 아직 미구현이기 때문이며 기능적 문제 없음. 향후 UI에서 divisions를 표시하려면 인터페이스에 `divisions: string[]` 추가 필요.
- games API에서 preferred_divisions를 사용하지 않음 -- divisions는 대회(tournaments) 전용 개념이고, games는 game_type(경기 유형)으로 필터링하므로 정상 설계.
- preferences API의 Zod 스키마가 preferred_divisions, preferred_board_categories, preferred_game_types 세 필드를 모두 검증하며, 각 필드가 optional이므로 부분 업데이트도 안전하게 처리됨.
- 개발 서버가 실행 중이 아니어서 동적 API 호출 테스트는 수행하지 못함. B단계에서 이미 검증되었으므로 이번 C단계는 정적 코드 분석에 집중.

## 리뷰 결과 (reviewer)

### Phase 2: 선호 종별(divisions) 대회 필터 코드 리뷰 (2026-03-21)

종합 판정: **통과**

**검토 파일:**
- `src/lib/services/tournament.ts` (서비스 레이어)
- `src/app/api/web/tournaments/route.ts` (API 라우트)

**1. architect 설계 준수 여부**
- TournamentListFilters에 `divisions?: string[]` 추가 -- 설계대로
- AND로 감싼 OR+array_contains 패턴 (안전한 대안) -- 설계 권장 방식 정확히 반영
- TOURNAMENT_LIST_SELECT에 `divisions: true` 추가 -- 설계대로
- route.ts에서 preferred_divisions 조회 + Array.isArray 검증 -- 설계대로
- cities와 divisions AND 결합 -- 설계대로

**2. 보안**
- GET은 공개 API, prefer=true 시에만 세션 조회 -- 적절
- session.sub를 BigInt 변환하여 사용 -- 기존 패턴과 동일
- 사용자 입력이 아닌 DB 저장값을 필터로 사용하므로 인젝션 위험 없음

**3. 타입 안전성**
- tsc --noEmit 통과 확인됨
- `where: Record<string, unknown>` 사용은 Prisma 동적 where 구성에서 흔한 패턴
- `as string[]` 캐스팅(route.ts 42행)은 Array.isArray 체크 후 사용되어 안전

**4. 에러 처리**
- `listTournaments().catch(() => [])` -- DB 에러 시 빈 배열 반환, 적절
- `t.divisions ?? []` -- null 방어 처리 OK
- `user?.preferred_divisions` -- optional chaining으로 null 안전
- divisions 빈 배열 시 필터 미적용(length > 0 이중 체크) -- 적절

**5. 성능**
- `path: [] + array_contains`는 PostgreSQL GIN 인덱스(`@>` 연산자)를 활용함
- divisions 값이 보통 1~5개이므로 OR 조건 수가 적어 성능 문제 없음
- N+1 문제 없음 (단일 쿼리로 처리)

**6. 코드 컨벤션**
- TypeScript 코드: camelCase 사용 -- OK
- DB 컬럼: snake_case(preferred_divisions, entry_fee) -- OK
- 주석이 충분하고 한국어로 작성됨 -- 바이브코더 친화적

**7. 기존 코드와의 일관성**
- cities 필터 패턴(split -> filter -> 서비스 전달)과 동일한 구조
- 응답 매핑 방식 일치 (Date->toISOString, Decimal->toString 등 기존 패턴 유지)

---

필수 수정: 없음
권장 수정: 없음

참고 사항 (향후 개선):
- `as string[]` 캐스팅은 배열 내부 요소가 실제 string인지까지는 검증하지 않음. 현재는 DB 저장 시 이미 검증되므로 실용적으로 문제 없으나, 만약 DB 데이터가 수동 편집될 가능성이 있다면 `.filter((v): v is string => typeof v === 'string')` 추가를 고려할 수 있음. 현시점에서는 불필요.

### Phase 3: 대회탭 UI 변경 코드 리뷰 (2026-03-21)

종합 판정: **통과**

**검토 파일:**
- `src/app/(web)/tournaments/_components/tournaments-content.tsx` (대회 목록 UI)
- `src/app/(web)/games/_components/games-content.tsx` (경기 목록 UI -- 비교 기준)

**잘된 점:**
- planner가 계획한 8가지 변경사항(그리드/뱃지색/상태표시/제목/정보순서/구분선/프로그레스바/종별태그)이 빠짐없이 반영됨
- 경기탭 GameCard와 클래스명, 색상코드, 간격이 거의 100% 동일하게 구현됨 (tester P3-16~25 비교 항목 10개 모두 일치)
- Badge 컴포넌트 import와 TeamCountBar 컴포넌트가 깔끔하게 제거되고 사용하지 않는 코드가 남아있지 않음
- divisions 빈 배열 방어 처리가 두 단계로 안전하게 구현됨 (97행 `?? []`, 165행 `visibleDivs.length > 0 &&`)
- 종별 칩의 "+N" 축약 로직이 간결하고 정확함 (98-99행 slice/계산, 175-178행 조건부 렌더링)
- AbortController를 활용한 race condition 방지 패턴이 경기탭과 동일하게 유지됨
- 주석이 충분하고 한국어로 작성되어 유지보수에 용이

**1. planner 설계 준수 여부**
- 8개 변경 항목 모두 정확히 반영됨
- 불필요한 추가 변경 없음 -- 수정 범위가 계획에서 벗어나지 않음

**2. 경기탭과의 스타일 일관성**
- 카드 외형, 컬러바, 뱃지, 제목, 날짜/장소, 프로그레스바, 하단 영역 모두 동일 패턴
- 유일한 차이: Row5에서 경기탭은 "난이도 뱃지", 대회탭은 "종별 칩" -- 도메인 차이로 적절한 대체
- 참가비 표시 방식이 미세하게 다름 (경기탭: `fee ?? <무료>`, 대회탭: `hasFee ? 금액 : <무료>`) -- 동작 결과는 동일하므로 문제 아님

**3. 코드 품질**
- 불필요한 import 없음 (Badge 제거 완료)
- 미사용 컴포넌트/함수 없음 (TeamCountBar 제거 완료)
- divisions 처리 로직이 안전함 (`?? []`로 undefined/null 방어, `slice(0,2)`로 빈 배열도 안전 처리)

**4. 보안/성능**
- XSS 위험 없음: 사용자 입력을 dangerouslySetInnerHTML 없이 텍스트 노드로만 렌더링
- `t.divisions ?? []`에서 divisions는 API 응답(서버에서 검증된 데이터)이므로 안전
- 불필요한 리렌더링 요소 없음: useEffect 의존성 배열이 `[searchParams, preferFilter]`로 정확
- prefetch={true}로 Link 프리페치 활성화 -- 사용자 경험 향상

**5. 종별 태그 UI**
- 최대 2개 표시 + "+N" 축약: 98행 `slice(0, 2)`, 99행 `divisions.length - 2`, 175행 `extraCount > 0 &&` -- 정확
- 빈 배열일 때: 165행 `visibleDivs.length > 0 &&`로 영역 자체가 렌더링되지 않음 -- 정확
- 칩 스타일: `bg-[#F3F4F6] text-[#6B7280]`으로 보조 정보답게 부드러운 톤 -- 적절

---

필수 수정: 없음
권장 수정: 없음

참고 사항 (향후 개선):
- 대회탭과 경기탭의 카드 구조가 거의 동일하므로, 향후 공통 CardShell 컴포넌트로 추출하는 것도 가능. 단, 현재 단계에서는 각 탭의 독립성을 유지하는 것이 유지보수에 더 나으므로 지금은 불필요.
- STATUS_STYLE에서 `registration`, `registration_open`, `published`, `active`가 모두 동일한 녹색(#16A34A)으로 매핑됨. 이는 의도된 것으로 보이나, 향후 상태가 세분화되면 색상 구분을 고려할 수 있음.

### Phase 3: 대회탭 UI 변경 검증 (2026-03-21)

**1. TypeScript 컴파일 체크**

| 번호 | 점검 항목 | 결과 | 비고 |
|------|----------|------|------|
| P3-1 | `npx tsc --noEmit` | 통과 | 에러/경고 0건. 출력 없이 정상 종료 |

**2. 코드 변경사항 검증 (planner 계획 8항목 대비)**

| 번호 | 항목 | 변경 전 (계획) | 변경 후 (기대값) | 결과 | 비고 |
|------|------|-------------|--------------|------|------|
| P3-2 | 그리드 레이아웃 | grid-cols-1 기본 | grid-cols-2 기본, 대형 3열 | 통과 | 288행 `grid-cols-2 gap-3 lg:grid-cols-3` 확인 |
| P3-3 | 뱃지 배경색 | 검정 고정 | 상태별 컬러 | 통과 | 31-42행 STATUS_STYLE에 상태별 bg 정의, 112행에서 `style={{ backgroundColor: style.bg }}` 적용 |
| P3-4 | 상태 표시 | Badge 컴포넌트 | 텍스트+색상 방식 | 통과 | 116-118행 `text-[11px] font-bold` + `style={{ color: style.bg }}` 확인. Badge import 완전 제거됨 |
| P3-5 | 제목 | 큰 글씨, 2줄 | text-sm, line-clamp-1 | 통과 | 122행 `text-sm font-bold ... line-clamp-1 leading-tight` 확인 |
| P3-6 | 정보 순서 | 장소 -> 날짜 | 날짜 -> 장소 | 통과 | 128-139행: 날짜(dateRange) 먼저, 장소(location) 다음 순서로 배치 |
| P3-7 | 구분선 | 있음 | 제거 | 통과 | `h-px bg-[#E8ECF0]` 구분선 코드 없음 확인 |
| P3-8 | 프로그레스바 | 별도 컴포넌트 | 인라인 (경기탭 패턴) | 통과 | 143-155행 인라인 구현. TeamCountBar 참조 완전 제거됨 |
| P3-9 | 종별 태그 | 없음 | 칩으로 표시 (최대 2개 + "+N") | 통과 | 165-181행: visibleDivs.map()으로 최대 2개 칩 + extraCount>0이면 "+N" 표시 |

**3. 추가 확인사항**

| 번호 | 점검 항목 | 결과 | 비고 |
|------|----------|------|------|
| P3-10 | TournamentFromApi에 divisions: string[] 필드 추가 | 통과 | 23행 `divisions: string[]` 확인 + 주석 "종별 목록 (Phase 2에서 API에 추가됨)" |
| P3-11 | Badge 컴포넌트 import 제거 | 통과 | import 목록(1-8행)에 Badge 없음. Grep 검색에서도 파일 내 "Badge" 0건 |
| P3-12 | TeamCountBar 별도 컴포넌트 제거 | 통과 | Grep 검색에서 파일 내 "TeamCountBar" 0건. 93-94행에 인라인 계산 |
| P3-13 | 스켈레톤(TournamentGridSkeleton) 경기탭 스타일 변경 | 통과 | 64행 `grid-cols-2 gap-3 lg:grid-cols-3`, 68행 `h-1` 컬러바, 69행 `p-3.5 space-y-2.5` -- GamesGridSkeleton(56-70행)과 구조 동일 |
| P3-14 | divisions 빈 배열일 때 태그 미표시 조건 | 통과 | 97행 `const divisions = t.divisions ?? []`, 165행 `visibleDivs.length > 0 &&` 조건부 렌더링 |
| P3-15 | 패딩 p-3.5 변경 | 통과 | 107행 `p-3.5` 확인 (경기탭 GameCard 100행과 동일) |

**4. 경기탭(GameCard)과의 스타일 일관성 비교**

| 번호 | 비교 항목 | 대회탭 (tournaments-content.tsx) | 경기탭 (games-content.tsx) | 일치 여부 |
|------|----------|-------------------------------|-------------------------|----------|
| P3-16 | 카드 외형 | `rounded-[16px] border border-[#E8ECF0] bg-[#FFFFFF]` + hover 효과 | 동일 | 일치 |
| P3-17 | 상단 컬러바 | `h-1` + style bg | `h-1` + style bg | 일치 |
| P3-18 | Row1 뱃지 | `rounded-[6px] px-2 py-0.5 text-xs font-bold uppercase tracking-wider` | 동일 | 일치 |
| P3-19 | Row1 상태 텍스트 | `text-[11px] font-bold` | `text-[11px] font-bold` | 일치 |
| P3-20 | Row2 제목 | `mb-1 text-sm font-bold text-[#111827] line-clamp-1 leading-tight group-hover:text-[#1B3C87] transition-colors` | 동일 | 일치 |
| P3-21 | Row3 날짜+장소 | `mb-2 space-y-0.5`, SVG 12x12, `text-xs text-[#6B7280]` | 동일 | 일치 |
| P3-22 | Row4 프로그레스바 | `h-1.5 rounded-full bg-[#E8ECF0]` + `text-[11px] font-bold tabular-nums` | 동일 | 일치 |
| P3-23 | Row5 하단 영역 | `mt-auto flex items-center justify-between pt-1` | 동일 | 일치 |
| P3-24 | 그리드 | `grid-cols-2 gap-3 lg:grid-cols-3` | 동일 | 일치 |
| P3-25 | 스켈레톤 구조 | h-1 컬러바 + p-3.5 space-y-2.5 + 4개 Skeleton | 동일 | 일치 |

종합: 25개 중 25개 통과 / 0개 실패

참고 사항:
- 대회탭 Row5에서 경기탭의 "난이도 뱃지" 자리에 "종별(divisions) 칩"이 배치됨 -- 대회에는 난이도 개념이 없으므로 적절한 대체
- 경기탭은 참가비 표시에서 `fee ?? <span>무료</span>` 패턴, 대회탭은 `hasFee ? 금액 : <span>무료</span>` 패턴으로 약간 다르나 동작 결과는 동일 (무료 시 회색 텍스트 표시)
- STATUS_STYLE의 color 값이 모두 "#FFFFFF"(흰색)으로 통일되어 있어, 뱃지 텍스트 가독성 양호
- FORMAT_LABEL 매핑(45-50행)이 유지되어 형식 뱃지에 한글 라벨 표시 정상

### Phase 4-1: 디자인 토큰 시스템 구축 검증 (2026-03-21)

**1. TypeScript 컴파일 체크**

| 번호 | 점검 항목 | 결과 | 비고 |
|------|----------|------|------|
| P4-1-1 | `npx tsc --noEmit` | 통과 | 에러/경고 0건. 출력 없이 정상 종료 |

**2. CSS 변수 정의 확인 (@theme 블록)**

| 번호 | 점검 항목 | 결과 | 비고 |
|------|----------|------|------|
| P4-1-2 | @theme 블록에 컬러 변수 정의 | 통과 | 3-64행. Phase 4-1 주석 헤더 포함, 기존 변수명 유지 + 값 변경 방식 |
| P4-1-3 | 포인트 컬러 #F4A261 적용 | 통과 | 19행 `--color-accent: #F4A261` 확인. 호버(#E8934F), 라이트(rgba 0.1) 변수도 정의 |
| P4-1-4 | 타이포그래피 변수 6개 추가 | 통과 | 53-58행: display(2rem), heading(1.25rem), subheading(1rem), body(0.875rem), caption(0.75rem), micro(0.6875rem) |
| P4-1-5 | 간격 변수 3개 추가 | 통과 | 61-63행: card-padding(0.875rem), card-gap(0.75rem), section-gap(1.5rem) |
| P4-1-6 | 새 컬러 변수 4개 추가 | 통과 | 47-50행: bg-primary, bg-secondary, card-hover, text-tertiary -- Phase 4-2 이후 전환용 |
| P4-1-7 | 배경색 값 변경 | 통과 | 11행 `--color-background: #F5F5F7` (기존 #F5F6FA에서 변경) |

**3. 다크 모드 변수 확인 (html.dark 블록)**

| 번호 | 점검 항목 | 결과 | 비고 |
|------|----------|------|------|
| P4-1-8 | html.dark 블록 존재 | 통과 | 67-104행. WHOOP 스타일 다크 팔레트 주석 포함 |
| P4-1-9 | 다크 배경 #0D0D0D | 통과 | 69행 `--color-background: #0D0D0D` 확인 (기존 #0F1117에서 변경) |
| P4-1-10 | 카드 배경 #1A1A1A | 통과 | 70행 `--color-card: #1A1A1A` 확인 (기존 #1A1D27에서 변경) |
| P4-1-11 | 다크 포인트 컬러 #F4A261 | 통과 | 77행 `--color-accent: #F4A261` 확인. 다크에서도 동일한 웜 오렌지 |
| P4-1-12 | 다크 새 컬러 변수 4개 | 통과 | 98-101행: bg-primary(#0D0D0D), bg-secondary(#141414), card-hover(#222222), text-tertiary(#666666) |
| P4-1-13 | 다크 보더 색상 WHOOP 스타일 | 통과 | 91행 `--color-border: #2A2A2A` (기존 #2A2D37에서 변경), 92행 `--color-border-subtle: #1F1F1F` (기존 #22252F에서 변경) |

**4. 기존 코드 영향 확인**

| 번호 | 점검 항목 | 결과 | 비고 |
|------|----------|------|------|
| P4-1-14 | 변경 파일 범위 | 통과 | git diff --name-only: globals.css, scratchpad.md, settings.local.json만 변경. 컴포넌트 파일 변경 없음 |
| P4-1-15 | html.dark attribute selector 오버라이드 유지 | 통과 | 113-201행: bg, border, text, gradient, shadow, backdrop-blur 등 기존 오버라이드 블록 전체 유지 |
| P4-1-16 | body 스타일 유지 | 통과 | 106-111행: background-color, color, font-family, transition 유지 |
| P4-1-17 | 큰글씨 모드(large-text) 유지 | 통과 | 204-236행: html.large-text 블록 변경 없음 |
| P4-1-18 | 기존 기능 코드 미변경 | 통과 | tournaments-content.tsx는 staged 상태가 아닌 working tree 변경 (Phase 3 관련, Phase 4-1과 무관) |

**5. 빌드 테스트**

| 번호 | 점검 항목 | 결과 | 비고 |
|------|----------|------|------|
| P4-1-19 | `npx next build` | 통과 | Next.js 16.1.6 (Turbopack). 컴파일 4.2초, 정적 페이지 79개 생성 2.1초. 에러 없음 |

종합: 19개 중 19개 통과 / 0개 실패

참고 사항:
- planner 계획서의 "기존 변수명 유지 + 값만 변경" 원칙이 정확히 지켜졌음. 변수명은 동일하고 값만 WHOOP 팔레트로 변경됨
- 새 변수(bg-primary, bg-secondary, card-hover, text-tertiary, 타이포 6개, 간격 3개)는 추가만 되었고, 기존 변수를 대체하지 않음 -- Phase 4-2 이후 점진적 전환에 적합한 구조
- 기존 html.dark attribute selector 오버라이드 블록이 그대로 유지되어, 현재 하드코딩된 색상을 사용하는 컴포넌트들의 다크 모드가 계속 동작함
- 라이트 모드 배경이 #F5F6FA -> #F5F5F7로 미세 변경됨. 시각적 차이 거의 없음

### Phase 4-2: 공통 UI 컴포넌트 리디자인 검증 (2026-03-21)

**1. TypeScript 컴파일 체크**

| 번호 | 점검 항목 | 결과 | 비고 |
|------|----------|------|------|
| P4-2-1 | `npx tsc --noEmit` | 통과 | 에러/경고 0건. 출력 없이 정상 종료 (종료코드 0) |

**2. card.tsx 변경사항 검증**

| 번호 | 점검 항목 | 결과 | 비고 |
|------|----------|------|------|
| P4-2-2 | 하드코딩 색상 제거 | 통과 | #FFFFFF, #E8ECF0 등 하드코딩 색상 0건. 주석에만 참조용으로 남아있음 |
| P4-2-3 | 배경 CSS 변수 전환 | 통과 | `bg-[var(--color-card)]` 적용 (14행) |
| P4-2-4 | 테두리 CSS 변수 전환 | 통과 | `border-[var(--color-border)]` 적용 (14행) |
| P4-2-5 | 그림자 CSS 변수 전환 | 통과 | `shadow-[var(--shadow-card)]` 적용 (14행) |
| P4-2-6 | 라운드 CSS 변수 전환 | 통과 | `rounded-[var(--radius-card)]` 적용 (14행) |
| P4-2-7 | 호버 효과 변경 | 통과 | translate-y 제거, `hover:bg-[var(--color-card-hover)] hover:border-[var(--color-border-subtle)]` 적용 |
| P4-2-8 | StatCard 아이콘 CSS 변수 | 통과 | `bg-[var(--color-primary-light)] text-[var(--color-primary)]` 적용 (34행) |
| P4-2-9 | StatCard 라벨 CSS 변수 | 통과 | `text-[var(--color-text-secondary)]` 적용 (39행) |
| P4-2-10 | props 인터페이스 유지 | 통과 | Card: `{ children, className? }`, StatCard: `{ label, value, icon? }` -- 변경 없음 |

**3. button.tsx 변경사항 검증**

| 번호 | 점검 항목 | 결과 | 비고 |
|------|----------|------|------|
| P4-2-11 | cta variant 웜 오렌지 적용 | 통과 | `bg-[var(--color-accent)]` + `hover:bg-[var(--color-accent-hover)]` (14행). globals.css에서 --color-accent=#F4A261 확인 |
| P4-2-12 | primary variant CSS 변수 | 통과 | `bg-[var(--color-text-primary)] text-[var(--color-text-on-primary)]` (11행) |
| P4-2-13 | secondary variant CSS 변수 | 통과 | `bg-[var(--color-card)] text-[var(--color-text-primary)] border-[var(--color-text-primary)]` + `hover:bg-[var(--color-card-hover)]` (17행) |
| P4-2-14 | ghost variant CSS 변수 | 통과 | `text-[var(--color-primary)]` + `hover:bg-[var(--color-primary-light)]` (20행) |
| P4-2-15 | danger variant CSS 변수 | 통과 | `bg-[var(--color-error)]/20 text-[var(--color-error)]` + `hover:bg-[var(--color-error)]/30` (23행) |
| P4-2-16 | focus-visible 링 CSS 변수 | 통과 | `focus-visible:ring-[var(--color-primary)]` (42행) |
| P4-2-17 | 하드코딩 색상 제거 | 통과 | 코드 내 하드코딩 색상 0건. 주석에만 #F4A261, #E31B23 참조 |
| P4-2-18 | props 인터페이스 유지 | 통과 | `{ children, variant?, className?, loading? }` + ButtonHTMLAttributes -- 변경 없음 |

**4. badge.tsx 변경사항 검증**

| 번호 | 점검 항목 | 결과 | 비고 |
|------|----------|------|------|
| P4-2-19 | default variant CSS 변수 | 통과 | `bg-[var(--color-primary-light)] text-[var(--color-primary)]` (7행) |
| P4-2-20 | success variant CSS 변수 | 통과 | `bg-[var(--color-success)]/12 text-[var(--color-success)]` (8행) |
| P4-2-21 | error variant CSS 변수 | 통과 | `bg-[var(--color-error)]/12 text-[var(--color-error)]` (9행) |
| P4-2-22 | warning variant CSS 변수 | 통과 | `bg-[var(--color-warning)]/12 text-[var(--color-warning)]` (10행) |
| P4-2-23 | info variant CSS 변수 | 통과 | `bg-[var(--color-info)]/12 text-[var(--color-info)]` (11행) |
| P4-2-24 | 하드코딩 색상 제거 | 통과 | 코드 내 하드코딩 색상 0건 |
| P4-2-25 | props 인터페이스 유지 | 통과 | `{ children, variant? }` -- 변경 없음 |

**5. skeleton.tsx 변경사항 검증**

| 번호 | 점검 항목 | 결과 | 비고 |
|------|----------|------|------|
| P4-2-26 | 배경 CSS 변수 전환 | 통과 | `bg-[var(--color-border)]` 적용 (7행). 다크 모드에서 --color-border=#2A2A2A로 자동 적용 |
| P4-2-27 | 하드코딩 색상 제거 | 통과 | 코드 내 하드코딩 색상(#E8ECF0) 0건. 주석에만 참조 |
| P4-2-28 | props 인터페이스 유지 | 통과 | `{ className? }` -- 변경 없음 |

**6. CSS 변수 매칭 확인 (globals.css 대조)**

| 번호 | CSS 변수명 | 라이트 모드 값 | 다크 모드 값 | 사용 컴포넌트 | 결과 |
|------|-----------|--------------|-------------|-------------|------|
| P4-2-29 | --color-card | #FFFFFF | #1A1A1A | card, button | 통과 |
| P4-2-30 | --color-border | #E5E7EB | #2A2A2A | card, skeleton | 통과 |
| P4-2-31 | --color-border-subtle | #F0F0F0 | #1F1F1F | card (hover) | 통과 |
| P4-2-32 | --color-card-hover | #F9F9FB | #222222 | card, button | 통과 |
| P4-2-33 | --color-accent | #F4A261 | #F4A261 | button (cta) | 통과 |
| P4-2-34 | --color-accent-hover | #E8934F | #FABD82 | button (cta hover) | 통과 |
| P4-2-35 | --color-text-primary | #111827 | #F5F5F5 | button, card | 통과 |
| P4-2-36 | --color-text-secondary | #6B7280 | #A0A0A0 | card (StatCard) | 통과 |
| P4-2-37 | --color-text-on-primary | #FFFFFF | #FFFFFF | button | 통과 |
| P4-2-38 | --color-primary | #1B3C87 | #5B7FD6 | button, badge, card | 통과 |
| P4-2-39 | --color-primary-light | rgba(27,60,135,0.08) | rgba(91,127,214,0.15) | button, badge, card | 통과 |
| P4-2-40 | --color-success | #10B981 | #4ADE80 | badge | 통과 |
| P4-2-41 | --color-error | #EF4444 | #F87171 | button, badge | 통과 |
| P4-2-42 | --color-warning | #F59E0B | #FBBF24 | badge | 통과 |
| P4-2-43 | --color-info | #3B82F6 | #60A5FA | badge | 통과 |
| P4-2-44 | --shadow-card | 0 4px 24px rgba(0,0,0,0.08) | 0 4px 24px rgba(0,0,0,0.4) | card | 통과 |
| P4-2-45 | --radius-card | 16px | (라이트와 동일) | card | 통과 |

**7. 기존 사용처 호환성 확인**

| 번호 | 점검 항목 | 결과 | 비고 |
|------|----------|------|------|
| P4-2-46 | Card 사용처 (26개 파일) | 통과 | tsc --noEmit 에러 0건. props 변경 없어 기존 코드 100% 호환 |
| P4-2-47 | Button 사용처 (14개 파일) | 통과 | tsc --noEmit 에러 0건. variant 타입/props 변경 없음 |
| P4-2-48 | Badge 사용처 (19개 파일) | 통과 | tsc --noEmit 에러 0건. variant 타입/props 변경 없음 |
| P4-2-49 | Skeleton 사용처 (14개 파일) | 통과 | tsc --noEmit 에러 0건. props 변경 없음 |
| P4-2-50 | StatCard 사용처 (3개 파일) | 통과 | admin, tournament-admin 페이지에서 사용. 에러 없음 |

종합: 50개 중 50개 통과 / 0개 실패

참고 사항:
- 4개 컴포넌트 모두 하드코딩 색상이 코드에서 완전히 제거됨. 주석에만 참조용으로 남아있어 가독성에 도움됨
- 모든 CSS 변수가 globals.css의 라이트/다크 모드 양쪽에 정의되어 있어, 다크 모드 자동 전환이 보장됨
- props 인터페이스 변경이 전혀 없어 기존 사용처 73개 파일(중복 포함)에서 호환성 문제 없음
- Button danger variant의 `/20`, `/30` 투명도 문법과 Badge의 `/12` 투명도 문법은 Tailwind CSS 4에서 지원되는 정상 문법
- Card 호버 효과가 translate-y(떠오르기)에서 배경색 변화(WHOOP 스타일)로 변경되어, 모바일에서 터치 시 어색한 움직임이 사라짐

### Phase 4-3: 헤더 + 네비게이션 + 레이아웃 리디자인 검증 (2026-03-21)

**1. TypeScript 컴파일 체크**

| 번호 | 점검 항목 | 결과 | 비고 |
|------|----------|------|------|
| P4-3-1 | `npx tsc --noEmit` | 통과 | 에러/경고 0건. 출력 없이 정상 종료 (종료코드 0) |

**2. layout.tsx 변경사항 검증**

| 번호 | 점검 항목 | 결과 | 비고 |
|------|----------|------|------|
| P4-3-2 | 배경색 CSS 변수 전환 | 통과 | `bg-[#F5F7FA]` 제거, `style={{ backgroundColor: 'var(--color-bg-secondary)' }}` 적용 (12행) |
| P4-3-3 | 하드코딩 색상 잔존 여부 | 통과 | bg-[#], text-[#], border-[#] 패턴 검색 결과 0건 |
| P4-3-4 | 레이아웃 구조 유지 | 통과 | Header, main, Footer 구조 변경 없음. pb-24 (모바일 하단 네비 여백) 유지 |

**3. header.tsx 변경사항 검증**

| 번호 | 점검 항목 | 결과 | 비고 |
|------|----------|------|------|
| P4-3-5 | 데스크탑 헤더 테두리 CSS 변수 | 통과 | `style={{ borderBottom: '1px solid var(--color-border)' }}` 적용 (85행) |
| P4-3-6 | 헤더 배경 bg-[#FFFFFF]/95 유지 | 통과 | 84행에 유지. 다크 모드는 globals.css의 `html.dark [class*="bg-[#FFFFFF]/95"]` + `backdrop-blur` 오버라이드가 처리 |
| P4-3-7 | 활성 탭 텍스트 CSS 변수 | 통과 | `style={{ color: 'var(--color-text-primary)' }}` 적용 (110행). className에 text-[#111827] 잔존하나 inline style이 우선 적용됨 |
| P4-3-8 | 비활성 탭 텍스트 CSS 변수 | 통과 | `style={{ color: 'var(--color-text-muted)' }}` 적용 (110행). className에 text-[#9CA3AF] 잔존하나 inline style이 우선 적용됨 |
| P4-3-9 | 활성 탭 하단 바 웜 오렌지 | 통과 | `style={{ backgroundColor: 'var(--color-accent)' }}` 적용 (115행). #E31B23은 주석에만 참조용으로 남음 |
| P4-3-10 | Sparkles 활성 색상 웜 오렌지 | 통과 | `color: 'var(--color-accent)'`, `backgroundColor: 'var(--color-accent-light)'` 적용 (131-132행) |
| P4-3-11 | 로그인 버튼 웜 오렌지 | 통과 | `backgroundColor: 'var(--color-accent)'` 적용 (149행). 기존 bg-[#111827]에서 변경 |
| P4-3-12 | 모바일 하단 네비 배경 CSS 변수 | 통과 | `backgroundColor: 'var(--color-bg-primary)'` 적용 (165행) |
| P4-3-13 | 모바일 하단 네비 테두리 CSS 변수 | 통과 | `borderTop: '1px solid var(--color-border)'` 적용 (164행) |
| P4-3-14 | 모바일 활성 탭 웜 오렌지 | 통과 | `color: active ? 'var(--color-accent)' : 'var(--color-text-muted)'` 적용 (177행) |
| P4-3-15 | 모바일 활성 바 웜 오렌지 | 통과 | `style={{ backgroundColor: 'var(--color-accent)' }}` 적용 (180, 193행) |
| P4-3-16 | safe-area-inset-bottom 유지 | 통과 | `paddingBottom: "env(safe-area-inset-bottom, 0px)"` 163행에 그대로 유지. iOS 노치 대응 보존 |
| P4-3-17 | 세션/인증 로직 미변경 | 통과 | useEffect 내 fetch(/api/web/me, /api/web/notifications), setUser, setLoggedIn 로직 48-75행 전혀 변경 없음 |

**4. slide-menu.tsx 변경사항 검증**

| 번호 | 점검 항목 | 결과 | 비고 |
|------|----------|------|------|
| P4-3-18 | 패널 배경 CSS 변수 | 통과 | `style={{ backgroundColor: 'var(--color-bg-primary)' }}` 적용 (58행) |
| P4-3-19 | 헤더 테두리 CSS 변수 | 통과 | `style={{ borderBottom: '1px solid var(--color-border)' }}` 적용 (61행) |
| P4-3-20 | 메뉴 제목 웜 오렌지 | 통과 | `color: 'var(--color-accent)'` 적용 (62행) |
| P4-3-21 | 유저 카드 배경 CSS 변수 | 통과 | `backgroundColor: 'var(--color-elevated)'` 적용 (82행) |
| P4-3-22 | 유저 아바타 CSS 변수 | 통과 | `backgroundColor: 'var(--color-primary)'` 적용 (84행) |
| P4-3-23 | 텍스트 색상 CSS 변수 | 통과 | text-primary(88행), text-secondary(89,146행), text-muted(91,96,112,160행) 적절히 적용 |
| P4-3-24 | 로그아웃 버튼 색상 | 확인 | text-[#EF4444] 하드코딩 유지 (136행). 로그아웃은 위험 동작으로 빨간색 유지가 의도적 (--color-error 변수 대체 가능하나, 기능적으로 문제 없음) |
| P4-3-25 | CTA 버튼 웜 오렌지 | 통과 | 로그인 버튼 `backgroundColor: 'var(--color-accent)'` (171행), BDR 텍스트 `color: 'var(--color-accent)'` (145행) |
| P4-3-26 | 회원가입 테두리 CSS 변수 | 통과 | `border: '2px solid var(--color-border)'` (180행) |
| P4-3-27 | role/aria 속성 유지 | 통과 | `role="dialog"`, `aria-modal="true"`, `aria-label="전체 메뉴"` (53-54행), 닫기 버튼 `aria-label="메뉴 닫기"` (65행) 모두 유지 |

**5. Footer.tsx 변경사항 검증**

| 번호 | 점검 항목 | 결과 | 비고 |
|------|----------|------|------|
| P4-3-28 | 배경색 CSS 변수 | 통과 | `backgroundColor: 'var(--color-bg-secondary)'` 적용 (6행) |
| P4-3-29 | 테두리 CSS 변수 | 통과 | `borderTop: '1px solid var(--color-border)'` 적용 (6행) |
| P4-3-30 | BDR 로고 웜 오렌지 | 통과 | `color: 'var(--color-accent)'` 적용 (11행). 기존 #E31B23에서 변경 |
| P4-3-31 | 텍스트 색상 CSS 변수 | 통과 | `color: 'var(--color-text-secondary)'` 적용 (12,15행) |
| P4-3-32 | 하드코딩 색상 잔존 여부 | 통과 | bg-[#], text-[#], border-[#] 패턴 검색 결과 0건 |

**6. CSS 변수 매칭 확인 (globals.css 대조)**

| 번호 | CSS 변수명 | 라이트 모드 값 | 다크 모드 값 | 사용 파일 | 결과 |
|------|-----------|--------------|-------------|----------|------|
| P4-3-33 | --color-bg-primary | #FFFFFF | #0D0D0D | header, slide-menu | 통과 |
| P4-3-34 | --color-bg-secondary | #F5F5F7 | #141414 | layout, footer | 통과 |
| P4-3-35 | --color-border | #E5E7EB | #2A2A2A | header, slide-menu, footer | 통과 |
| P4-3-36 | --color-accent | #F4A261 | #F4A261 | header, slide-menu, footer | 통과 |
| P4-3-37 | --color-accent-light | rgba(244,162,97,0.1) | rgba(244,162,97,0.15) | header (Sparkles) | 통과 |
| P4-3-38 | --color-text-primary | #111827 | #F5F5F5 | header, slide-menu | 통과 |
| P4-3-39 | --color-text-secondary | #6B7280 | #A0A0A0 | slide-menu, footer | 통과 |
| P4-3-40 | --color-text-muted | #9CA3AF | #666666 | header, slide-menu | 통과 |
| P4-3-41 | --color-elevated | #EDF0F8 | #222222 | slide-menu (유저카드) | 통과 |
| P4-3-42 | --color-primary | #1B3C87 | #5B7FD6 | slide-menu (아바타) | 통과 |
| P4-3-43 | --font-heading | Barlow Condensed... | (라이트와 동일) | header, slide-menu | 통과 |

종합: 43개 중 43개 통과 / 0개 실패

참고 사항:
- header.tsx 107-108행의 className에 text-[#111827], text-[#9CA3AF] 하드코딩이 남아있으나, 110행의 inline style(CSS 변수)이 우선 적용되므로 기능적 문제 없음. 다만 className 정리가 가능한 개선 사항임 (필수 아님)
- slide-menu.tsx 136행의 로그아웃 버튼 text-[#EF4444]은 의도적 하드코딩으로 판단. var(--color-error)로 대체하면 다크 모드에서 #F87171으로 자동 전환되어 더 나을 수 있으나, 현재도 정상 동작
- safe-area-inset-bottom이 정확히 유지되어 iOS 노치 기기에서의 하단 네비 렌더링 안전
- 세션/인증 로직(fetch, state)이 전혀 변경되지 않아 로그인/로그아웃 기능 영향 없음

### Phase 4: UI/UX 전체 개선 (ESPN + WHOOP 믹스 스타일)

---

#### 현재 상태 분석

**1. 현재 컬러 시스템**

라이트 모드 기본:
- 배경: `#F5F7FA` (전체), `#FFFFFF` (카드)
- 텍스트: `#111827`(제목), `#6B7280`(보조), `#9CA3AF`(약한)
- 포인트: `#E31B23`(CTA/액센트), `#1B3C87`(프라이머리/네이비)
- 보더: `#E8ECF0`
- 상태색: `#16A34A`(성공), `#2563EB`(정보), `#D97706`(경고), `#EF4444`(에러)

다크 모드 (globals.css의 html.dark 셀렉터):
- 배경: `#0F1117`, 카드: `#1A1D27`, 서피스: `#2A2D37`
- CSS attribute selector 방식으로 다크 모드 구현 (`html.dark [class*="bg-[#FFFFFF]"]`)
- 이 방식은 유지보수가 어렵고, 하드코딩된 색상을 모두 잡아내지 못함

**2. 현재 타이포그래피**
- 본문: Pretendard (--font-sans)
- 제목: Barlow Condensed (--font-heading) -- uppercase + tracking-wide
- h1~h3, text-xl 이상은 자동으로 heading 폰트 적용 (globals.css 210-217행)

**3. 현재 카드 구조** (경기탭/대회탭 공통)
- 둥글기: `rounded-[16px]`
- 보더: `border border-[#E8ECF0]`
- 배경: `bg-[#FFFFFF]`
- 상단 컬러바: `h-1` + 상태/유형별 색상
- 호버: `-translate-y-1 shadow-lg border-[#1B3C87]/30`
- 패딩: `p-3.5`

**4. 현재 주요 UI 구성 요소 파일 목록**

| 영역 | 파일 경로 | 설명 |
|------|----------|------|
| 전체 레이아웃 | `src/app/(web)/layout.tsx` | 배경 #F5F7FA, max-w-7xl |
| 글로벌 CSS | `src/app/globals.css` | CSS 변수, 다크 모드 오버라이드, 큰글씨 모드 |
| 헤더 (데스크탑+모바일) | `src/components/shared/header.tsx` | 상단 네비 + 하단 모바일 네비 |
| 슬라이드 메뉴 | `src/components/shared/slide-menu.tsx` | 모바일 전체 메뉴 |
| 풋터 | `src/components/layout/Footer.tsx` | 하단 정보 |
| 테마 토글 | `src/components/shared/theme-toggle.tsx` | 다크/라이트 전환 |
| 카드 컴포넌트 | `src/components/ui/card.tsx` | 공통 Card, StatCard |
| 버튼 컴포넌트 | `src/components/ui/button.tsx` | primary/cta/secondary/ghost/danger |
| 뱃지 컴포넌트 | `src/components/ui/badge.tsx` | 상태 뱃지 |
| 스켈레톤 | `src/components/ui/skeleton.tsx` | 로딩 플레이스홀더 |
| 홈 - 히어로 | `src/components/home/hero-section.tsx` | 비로그인 히어로 |
| 홈 - 개인 히어로 | `src/components/home/personal-hero.tsx` | 로그인 시 대시보드 슬라이드 |
| 홈 - 퀵메뉴 | `src/components/home/quick-menu.tsx` | 자주 쓰는 메뉴 (4칸 그리드) |
| 홈 - 추천 영상 | `src/components/home/recommended-videos.tsx` | 유튜브 추천 |
| 홈 - 추천 경기 | `src/components/home/recommended-games.tsx` | 개인화 추천 경기 카드 |
| 경기 목록 | `src/app/(web)/games/_components/games-content.tsx` | GameCard + 그리드 |
| 대회 목록 | `src/app/(web)/tournaments/_components/tournaments-content.tsx` | TournamentCard + 그리드 |
| 대회 상세 | `src/app/(web)/tournaments/[id]/page.tsx` | 대회 정보 + 경기/순위 테이블 |
| 팀 목록 | `src/app/(web)/teams/_components/teams-content.tsx` | 팀 카드 |
| 커뮤니티 | `src/app/(web)/community/_components/community-content.tsx` | 게시판 목록 |
| 프로필 | `src/app/(web)/profile/page.tsx` | 프로필 대시보드 |
| 프로필 헤더 | `src/app/(web)/profile/_components/profile-header.tsx` | 아바타+이름 |
| 활동 링 | `src/app/(web)/profile/_components/activity-ring.tsx` | 활동 시각화 |
| 스탯 바 | `src/app/(web)/profile/_components/stat-bars.tsx` | 스탯 막대그래프 |
| 로그인 | `src/app/(web)/login/page.tsx` | OAuth + 이메일 로그인 |
| 선호 설정 | `src/components/shared/preference-form.tsx` | 선호 설정 폼 |

---

#### ESPN + WHOOP 믹스 디자인 정의

**ESPN에서 가져올 것:**
- 박스형 카드: 카드 안에서 정보를 구획화 (상단 뱃지 영역, 중앙 콘텐츠, 하단 액션)
- 스코어보드 스타일: 숫자를 크고 굵게, 라벨을 작고 가볍게 (프로필 스탯, 대회 순위 테이블)
- 상태별 시각적 차별화: 모집중/진행중/완료 등 상태에 따라 카드 좌측 컬러 스트라이프 or 상단 바 색상 변화
- 탭 네비게이션: 필터 탭이 가로 스크롤, 선택된 탭은 진한 배경 + 흰 텍스트

**WHOOP에서 가져올 것:**
- 다크 테마 우선: 기본 모드를 다크로 설정하되, 라이트 모드도 유지
- 절제된 포인트 컬러: 웜 오렌지 `#F4A261`을 CTA 버튼, 중요 숫자, 활성 상태에만 사용
- 미니멀 정보 표시: 카드에 필수 정보만, 세부 정보는 상세 페이지에서
- 여백: 카드 간격 넓히기, 패딩 충분히
- 타이포: 제목은 굵고 시원하게 (font-bold~font-black), 본문은 가볍게 (font-normal)
- 데이터 시각화: 참가 인원을 원형 또는 반원 게이지로, 승률을 프로그레스바로

**새 컬러 팔레트 (다크 모드 기준, WHOOP 스타일):**

| 용도 | 색상 | 설명 |
|------|------|------|
| 배경 (전체) | `#0D0D0D` | 거의 순수한 검정, WHOOP의 깊은 어둠 |
| 배경 (카드) | `#1A1A1A` | 카드 배경, 배경과 살짝 분리 |
| 배경 (서피스/호버) | `#242424` | 호버 상태, 구분 영역 |
| 배경 (엘리베이티드) | `#2E2E2E` | 모달, 드롭다운 등 띄워진 요소 |
| 보더 | `#2A2A2A` | 카드 보더, 구분선 (미세하게) |
| 보더 서틀 | `#1F1F1F` | 더 미세한 구분선 |
| 텍스트 (제목) | `#FFFFFF` | 제목, 중요 텍스트 |
| 텍스트 (본문) | `#B0B0B0` | 일반 본문 |
| 텍스트 (약한) | `#666666` | 라벨, 보조 텍스트 |
| 포인트 (CTA) | `#F4A261` | 웜 오렌지 -- 버튼, 중요 숫자 |
| 포인트 (CTA hover) | `#E8934F` | 웜 오렌지 호버 |
| 성공 | `#4ADE80` | 모집중, 성공 상태 |
| 에러/긴급 | `#F87171` | 마감, 취소 |
| 경고 | `#FBBF24` | 임박, 경고 |
| 정보 | `#60A5FA` | 진행중, 정보 |

**새 컬러 팔레트 (라이트 모드, 현재 유지하되 따뜻하게 조정):**

| 용도 | 색상 | 설명 |
|------|------|------|
| 배경 (전체) | `#FAFAFA` | 약간 따뜻한 회색 |
| 배경 (카드) | `#FFFFFF` | 유지 |
| 배경 (서피스) | `#F5F5F0` | 약간 크림색 |
| 보더 | `#E5E5E0` | 따뜻한 회색 보더 |
| 텍스트 (제목) | `#1A1A1A` | 거의 검정 |
| 텍스트 (본문) | `#666666` | 중간 회색 |
| 포인트 (CTA) | `#E8934F` | 웜 오렌지 (다크보다 약간 진하게) |

---

#### 실행 계획

##### Phase 4-1: 디자인 토큰 시스템 구축 (컬러/타이포/간격 변수 통합)

목표: 하드코딩된 색상값을 CSS 변수로 통합하여, 다크/라이트 전환이 한 곳에서 제어되게 만든다. WHOOP 컬러 팔레트를 적용한다.

현재 문제:
- 컴포넌트마다 `bg-[#FFFFFF]`, `text-[#111827]` 같은 하드코딩 색상이 분산되어 있음
- globals.css에서 `html.dark [class*="bg-[#FFFFFF]"]` 방식으로 다크 모드를 처리 중인데, 이 방식은 CSS attribute selector를 사용하므로 성능이 나쁘고 놓치는 색상이 생김
- 새 팔레트를 적용하려면 모든 파일의 하드코딩 색상을 변경해야 하는데, 변수 시스템 없이는 불가능에 가까움

변경할 것:
1. `globals.css`의 `@theme` 블록에 새 컬러 팔레트 변수 추가/수정
2. `html.dark` 블록에 새 다크 모드 변수 추가/수정
3. 타이포그래피 변수 추가 (제목 크기 스케일, 본문 크기 스케일)
4. 간격(spacing) 변수 추가 (카드 패딩, 카드 간격, 섹션 간격)

| 순서 | 작업 | 담당 | 예상 시간 | 선행 조건 | 수정 대상 파일 |
|------|------|------|----------|----------|-------------|
| 1 | globals.css @theme 블록에 새 컬러/타이포/간격 변수 정의 | developer | 10분 | 없음 | `src/app/globals.css` |
| 2 | html.dark 블록에 새 다크 모드 변수 정의 (WHOOP 다크 팔레트) | developer | 5분 | 1 | `src/app/globals.css` |
| 3 | Tailwind 설정에서 커스텀 색상/변수를 theme로 등록 (tailwind.config.ts or @theme 연동) | developer | 5분 | 1 | `src/app/globals.css` 또는 `tailwind.config.ts` |
| 4 | tsc --noEmit + 빌드 테스트 | tester | 3분 | 3 | - |

총 예상 시간: 23분

주의사항:
- 이 단계에서는 변수만 정의하고, 기존 컴포넌트는 건드리지 않는다. 기존 하드코딩 색상과 새 변수가 공존하는 상태가 된다.
- @theme 블록의 기존 변수명은 유지하되 값만 변경한다 (기존 dark 오버라이드와 호환).
- 포인트 컬러를 `#E31B23`(현재 빨강)에서 `#F4A261`(웜 오렌지)로 바꾸는 것이 가장 큰 변화. 기존 `--color-accent`를 `#F4A261`로 변경.

##### Phase 4-2: 공통 UI 컴포넌트 리디자인 (Card, Button, Badge)

목표: 공통 컴포넌트(Card, Button, Badge)가 CSS 변수를 사용하도록 변경하고, ESPN 박스형 구조 + WHOOP 미니멀 스타일을 적용한다.

변경할 것:
1. `card.tsx`: 하드코딩 색상을 CSS 변수로 교체 + 카드 디자인 업데이트
   - 현재: `bg-[#FFFFFF]`, `border-[#E8ECF0]`, `shadow-[0_2px_8px_...]`
   - 변경: CSS 변수 사용 (`bg-[var(--color-card)]`, `border-[var(--color-border)]`)
   - 호버 효과를 WHOOP 스타일로 변경 (살짝 밝아지는 효과, translate 제거)
2. `button.tsx`: 포인트 컬러를 웜 오렌지로 변경
   - `cta` variant: `#E31B23` -> `#F4A261` (웜 오렌지)
   - `primary` variant: `#111827` -> CSS 변수
3. `badge.tsx`: CSS 변수 사용 + 둥글기 조정
4. `skeleton.tsx`: 다크 모드 호환 배경색

| 순서 | 작업 | 담당 | 예상 시간 | 선행 조건 | 수정 대상 파일 |
|------|------|------|----------|----------|-------------|
| 1 | card.tsx 리디자인 (CSS 변수 + WHOOP 스타일) | developer | 5분 | Phase 4-1 | `src/components/ui/card.tsx` |
| 2 | button.tsx 리디자인 (포인트 컬러 + CSS 변수) | developer | 5분 | Phase 4-1 | `src/components/ui/button.tsx` |
| 3 | badge.tsx 리디자인 (CSS 변수) | developer | 3분 | Phase 4-1 | `src/components/ui/badge.tsx` |
| 4 | skeleton.tsx 다크 모드 호환 | developer | 2분 | Phase 4-1 | `src/components/ui/skeleton.tsx` |
| 5 | 빌드 테스트 + 시각 확인 | tester | 5분 | 4 | - |

총 예상 시간: 20분

주의사항:
- Card 컴포넌트는 프로필 페이지, 대회 상세 페이지 등 여러 곳에서 사용 중이므로, API 인터페이스(props)는 변경하지 않는다.
- 호버 효과는 translate-y(-1)을 제거하고 border 또는 background 밝기 변화로 대체한다 (WHOOP은 떠오르는 효과 대신 미세한 밝기 변화를 사용).

##### Phase 4-3: 헤더 + 네비게이션 + 레이아웃 리디자인

목표: 헤더, 모바일 하단 네비, 슬라이드 메뉴, 풋터를 ESPN+WHOOP 스타일로 변경한다.

변경할 것:
1. `layout.tsx`: 배경색을 CSS 변수로 변경
2. `header.tsx`:
   - 데스크탑 헤더: 배경 투명도 + 블러 효과 유지하되 색상을 CSS 변수로
   - 네비 텍스트: 현재 활성 탭 하단 빨간줄 `#E31B23` -> 웜 오렌지 `#F4A261`
   - 모바일 하단 네비: 배경을 다크 테마에서 어두운 색으로
   - 로그인 버튼: 웜 오렌지 배경으로 변경
3. `slide-menu.tsx`: CSS 변수 적용, 다크 모드에서 어두운 배경
4. `Footer.tsx`: CSS 변수 적용

| 순서 | 작업 | 담당 | 예상 시간 | 선행 조건 | 수정 대상 파일 |
|------|------|------|----------|----------|-------------|
| 1 | layout.tsx 배경색 CSS 변수 적용 | developer | 2분 | Phase 4-1 | `src/app/(web)/layout.tsx` |
| 2 | header.tsx 리디자인 (CSS 변수 + 포인트컬러 변경) | developer | 10분 | Phase 4-1 | `src/components/shared/header.tsx` |
| 3 | slide-menu.tsx 리디자인 (CSS 변수) | developer | 5분 | Phase 4-1 | `src/components/shared/slide-menu.tsx` |
| 4 | Footer.tsx 리디자인 (CSS 변수) | developer | 3분 | Phase 4-1 | `src/components/layout/Footer.tsx` |
| 5 | 빌드 테스트 + 시각 확인 | tester | 5분 | 4 | - |

총 예상 시간: 25분

주의사항:
- 모바일 하단 네비의 safe-area-inset-bottom 처리는 건드리지 않는다 (iOS 노치 대응).
- 헤더의 유저 세션 로직은 건드리지 않는다 -- 스타일만 변경.

##### Phase 4-4: 홈 페이지 리디자인

목표: 홈 페이지의 히어로, 추천 영상, 퀵 메뉴, 추천 경기를 ESPN+WHOOP 스타일로 변경한다.

변경할 것:
1. `hero-section.tsx` (비로그인 히어로):
   - 배경: `#111827` -> CSS 변수 (`var(--color-card)`)
   - 포인트 컬러: `#E31B23` -> `#F4A261`
   - 버튼: CTA 웜 오렌지
2. `personal-hero.tsx` (로그인 대시보드):
   - 배경: CSS 변수 사용
   - 슬라이드 내부 색상: CSS 변수
   - 뱃지/CTA: 웜 오렌지
3. `quick-menu.tsx`:
   - 카드 스타일: CSS 변수 사용
   - 보더 호버: 웜 오렌지
4. `recommended-videos.tsx`:
   - 영상 카드: CSS 변수 사용
5. `recommended-games.tsx`:
   - 게임 카드: CSS 변수 사용, 포인트 컬러 변경

| 순서 | 작업 | 담당 | 예상 시간 | 선행 조건 | 수정 대상 파일 |
|------|------|------|----------|----------|-------------|
| 1 | hero-section.tsx 리디자인 | developer | 5분 | Phase 4-2 | `src/components/home/hero-section.tsx` |
| 2 | personal-hero.tsx 리디자인 | developer | 10분 | Phase 4-2 | `src/components/home/personal-hero.tsx` |
| 3 | quick-menu.tsx 리디자인 | developer | 5분 | Phase 4-2 | `src/components/home/quick-menu.tsx` |
| 4 | recommended-videos.tsx 리디자인 | developer | 5분 | Phase 4-2 | `src/components/home/recommended-videos.tsx` |
| 5 | recommended-games.tsx 리디자인 | developer | 5분 | Phase 4-2 | `src/components/home/recommended-games.tsx` |
| 6 | 빌드 테스트 + 시각 확인 | tester | 5분 | 5 | - |

총 예상 시간: 35분

##### Phase 4-5: 경기/대회 목록 카드 리디자인

목표: 경기 카드와 대회 카드를 ESPN 스코어보드 스타일 + WHOOP 미니멀 스타일로 통합 리디자인한다.

변경할 것:
1. `games-content.tsx` GameCard:
   - 하드코딩 색상을 CSS 변수로 교체 (20개 이상의 하드코딩 색상)
   - 상단 컬러바: 유지하되 더 얇게 (`h-0.5`) or 좌측 스트라이프로 변경
   - 포인트 컬러: 웜 오렌지
   - 호버 효과: WHOOP 스타일 (밝기 변화)
2. `tournaments-content.tsx` TournamentCard:
   - GameCard와 동일한 변경 적용
   - STATUS_STYLE 색상: 새 팔레트에 맞게 조정
3. 스켈레톤 UI: CSS 변수 적용

| 순서 | 작업 | 담당 | 예상 시간 | 선행 조건 | 수정 대상 파일 |
|------|------|------|----------|----------|-------------|
| 1 | games-content.tsx 하드코딩 색상 -> CSS 변수 + 스타일 변경 | developer | 10분 | Phase 4-2 | `src/app/(web)/games/_components/games-content.tsx` |
| 2 | tournaments-content.tsx 하드코딩 색상 -> CSS 변수 + 스타일 변경 | developer | 10분 | 1 | `src/app/(web)/tournaments/_components/tournaments-content.tsx` |
| 3 | 빌드 테스트 + 경기탭-대회탭 일관성 확인 | tester | 5분 | 2 | - |

총 예상 시간: 25분

##### Phase 4-6: 상세 페이지 + 프로필 + 로그인 리디자인

목표: 대회 상세, 프로필 대시보드, 로그인 페이지를 새 디자인 시스템에 맞춘다.

변경할 것:
1. `tournaments/[id]/page.tsx`:
   - 카드, 테이블, 뱃지 색상: CSS 변수
   - 스코어보드(순위 테이블): ESPN 스타일 강화 (진한 헤더, 교대 행 색상)
   - 참가 신청 버튼: 웜 오렌지
2. `profile/page.tsx` + 하위 컴포넌트들:
   - ActivityRing, StatBars: WHOOP 데이터 시각화 스타일 (어두운 배경 + 네온 컬러)
   - ProfileHeader: 미니멀 스타일
3. `login/page.tsx`:
   - 로그인 카드: CSS 변수
   - CTA 버튼: 웜 오렌지
4. 선호 설정, 커뮤니티, 팀 목록 등 나머지 페이지:
   - CSS 변수 적용 (하드코딩 색상 교체)

| 순서 | 작업 | 담당 | 예상 시간 | 선행 조건 | 수정 대상 파일 |
|------|------|------|----------|----------|-------------|
| 1 | tournaments/[id]/page.tsx 리디자인 | developer | 10분 | Phase 4-2 | `src/app/(web)/tournaments/[id]/page.tsx` |
| 2 | profile 관련 컴포넌트 리디자인 (8개 파일) | developer | 15분 | Phase 4-2 | `src/app/(web)/profile/_components/*.tsx`, `src/app/(web)/profile/page.tsx` |
| 3 | login/page.tsx 리디자인 | developer | 5분 | Phase 4-2 | `src/app/(web)/login/page.tsx` |
| 4 | 나머지 페이지 CSS 변수 적용 (커뮤니티, 팀, 선호설정 등) | developer | 10분 | Phase 4-2 | `src/app/(web)/community/_components/community-content.tsx`, `src/app/(web)/teams/_components/*.tsx`, `src/components/shared/preference-form.tsx` |
| 5 | 전체 빌드 테스트 + 주요 페이지 시각 확인 | tester | 10분 | 4 | - |

총 예상 시간: 50분

##### Phase 4-7: 다크 모드 오버라이드 정리 + 최종 점검

목표: globals.css의 기존 attribute selector 다크 모드 오버라이드를 정리하고, 모든 페이지가 다크/라이트 모드에서 정상 동작하는지 최종 확인한다.

변경할 것:
1. `globals.css`:
   - Phase 4-1~4-6에서 CSS 변수로 전환 완료된 후, `html.dark [class*="..."]` 셀렉터 블록 중 불필요해진 것들을 정리/제거
   - 새 변수 기반의 다크 모드만 남기기
2. 전체 페이지 다크/라이트 모드 전환 테스트

| 순서 | 작업 | 담당 | 예상 시간 | 선행 조건 | 수정 대상 파일 |
|------|------|------|----------|----------|-------------|
| 1 | globals.css 불필요한 attribute selector 정리 | developer | 10분 | Phase 4-6 | `src/app/globals.css` |
| 2 | 전체 페이지 다크/라이트 모드 통합 테스트 | tester | 10분 | 1 | - |
| 3 | 최종 코드 리뷰 | reviewer | 10분 | 2 | - |

총 예상 시간: 30분

---

#### 전체 요약

| Phase | 내용 | 핵심 변경 | 예상 시간 |
|-------|------|----------|----------|
| 4-1 | 디자인 토큰 시스템 구축 | globals.css 변수 정의 (WHOOP 팔레트) | 23분 |
| 4-2 | 공통 UI 컴포넌트 (Card/Button/Badge) | 4개 파일 CSS 변수 전환 + 스타일 변경 | 20분 |
| 4-3 | 헤더/네비/레이아웃 | 4개 파일 리디자인 | 25분 |
| 4-4 | 홈 페이지 (히어로/추천/퀵메뉴) | 5개 파일 리디자인 | 35분 |
| 4-5 | 경기/대회 목록 카드 | 2개 파일 리디자인 | 25분 |
| 4-6 | 상세/프로필/로그인/나머지 | 12개+ 파일 리디자인 | 50분 |
| 4-7 | 다크 모드 정리 + 최종 점검 | globals.css 정리 + 전체 테스트 | 30분 |

총 예상 시간: 약 208분 (약 3.5시간)

우선순위: 4-1 -> 4-2 -> 4-3 -> 4-5 -> 4-4 -> 4-6 -> 4-7
(4-5를 4-4보다 먼저 하는 이유: 경기/대회 목록이 사용자가 가장 많이 보는 페이지이므로 효과가 큼)

주의사항:
- 기존 동작 코드(API 호출, 데이터 처리, 라우팅)는 절대 건드리지 않는다. 스타일(CSS 클래스, 색상값)만 변경한다.
- 각 Phase는 독립적으로 커밋 가능하다. Phase 4-1만 완료해도 사이트는 정상 동작한다.
- 포인트 컬러 변경(`#E31B23` -> `#F4A261`)은 브랜드 아이덴티티 변화이므로, PM 확인 필요.
- 다크 모드를 "기본 모드"로 설정할지는 별도 결정 사항. 현재 계획은 라이트 모드가 기본인 상태 유지.

---

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|
| tester | 프로젝트 루트 | ESLint 설정 파일(eslint.config.js) 미존재 -- next lint 및 eslint 명령 실행 불가. Next.js 16 + ESLint v9 환경에 맞는 flat config 설정 필요 | 대기 |

## Git 기록 (git-manager)

### Phase 2 커밋 (2026-03-21)

📦 커밋: `ba1af0f` feat: add preferred divisions filter to tournament list API
🌿 브랜치: master
📁 포함 파일:
- `src/lib/services/tournament.ts`
- `src/app/api/web/tournaments/route.ts`
- `.claude/scratchpad.md`
🔄 push 여부: 완료 (2026-03-21)

### Phase 3 커밋 (2026-03-21)

📦 커밋: `09313e5` feat: unify tournament card UI with game card design and add division tags
🌿 브랜치: master
📁 포함 파일:
- `src/app/(web)/tournaments/_components/tournaments-content.tsx`
- `.claude/scratchpad.md`
🔄 push 여부: 미완료

### Phase 4-1 커밋 (2026-03-21)

📦 커밋: `8acb3cf` feat: add ESPN+WHOOP design token system with CSS variables for colors, typography, and spacing
🌿 브랜치: master
📁 포함 파일:
- `src/app/globals.css`
- `.claude/scratchpad.md`
🔄 push 여부: 미완료

### Phase 4-2 커밋 (2026-03-21)

📦 커밋: `2f20efe` feat: redesign common UI components (Card, Button, Badge, Skeleton) with CSS variables
🌿 브랜치: master
📁 포함 파일:
- `src/components/ui/card.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/skeleton.tsx`
- `.claude/scratchpad.md`
🔄 push 여부: 미완료

## 문서 기록 (doc-writer)
(아직 없음)

## 작업 로그 (최근 10건만 유지)
| 일시 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 2026-03-21 | developer | Phase 1 1단계: DB스키마(preferred_game_types, onboarding_step) + 선호 API + 상수파일 | 완료 |
| 2026-03-21 | developer | Phase 1 2단계: 프로필 완성 흐름에 선호설정 단계 추가 | 완료 |
| 2026-03-21 | developer | Phase 1 3단계: 경기 목록 선호 지역 필터링 | 완료 |
| 2026-03-21 | developer | Phase 1 4단계: 대회 목록 선호 지역 필터링 | 완료 |
| 2026-03-21 | developer | Phase 1 5단계: 게시판 선호 카테고리 필터링 | 완료 |
| 2026-03-21 | developer | Phase 1 6단계: 홈 추천 경기 선호 반영 | 완료 |
| 2026-03-21 | developer | Phase 1 7단계: 선호설정 페이지(/profile/preferences) | 완료 |
| 2026-03-21 | developer | 전역 선호필터 토글(헤더 버튼) + Sparkles아이콘 + 자동리셋 | 완료 |
| 2026-03-21 | developer | AbortController 적용 + tournament city 인덱스 추가 | 완료 |
| 2026-03-21 | developer | Phase 1 감점요인 3건 수정 (onboarding_step, game_type필터, 다크모드) | 완료 - tester 15통과/1경고 |
| 2026-03-21 | reviewer | Phase 1 감점요인 3건 수정 코드 리뷰 | 통과 - 필수/권장 수정 없음, tester 경고는 현행 유지 판단 |
| 2026-03-21 | planner | Phase 2 계획 수립 - 선호 종별 대회 필터 적용 | 완료 - 6단계, 28분 예상 |
| 2026-03-21 | architect | Phase 2 설계 - Prisma Json 배열 교집합 필터링 쿼리 설계 | 완료 - 방식C(OR+array_contains) 채택 |
| 2026-03-21 | developer | Phase 2 구현 - 선호 종별 대회 필터 적용 (서비스+API) | 완료 - tsc 통과 |
| 2026-03-21 | tester | Phase 2 검증 - 정적 분석 + 로직 검증 + tsc 빌드 | 통과 - 13/13 항목 통과 |
| 2026-03-21 | reviewer | Phase 2 코드 리뷰 - 설계 준수/보안/타입/에러/성능/컨벤션/일관성 7개 관점 | 통과 - 필수/권장 수정 없음 |
| 2026-03-21 | git-manager | Phase 2 커밋 - feat: add preferred divisions filter to tournament list API | 완료 - ba1af0f (push 미완료) |
| 2026-03-21 | tester | A단계: 전체 사이트 빌드/컴파일 점검 (tsc + build + lint) | 2통과/0실패/1실행불가(lint 설정 없음) |
| 2026-03-21 | tester | C단계: Phase1+2 통합 점검 - 코드 일관성/흐름/엣지케이스/UI연동/토글/타입 | 12통과/0실패 |
| 2026-03-21 | planner | Phase 3 계획 수립 - 대회탭 UI를 경기탭 스타일로 통일 + 종별 태그 표시 | 완료 - 5단계, 25분 예상 |
| 2026-03-21 | tester | Phase 3 검증 - tsc 컴파일 + 코드 변경 8항목 + 추가 확인 6항목 + 경기탭 일관성 10항목 | 통과 - 25/25 항목 통과 |
| 2026-03-21 | reviewer | Phase 3 코드 리뷰 - 설계준수/경기탭일관성/코드품질/보안성능/종별태그UI 5개 관점 | 통과 - 필수/권장 수정 없음 |
| 2026-03-21 | git-manager | Phase 3 커밋 - feat: unify tournament card UI with game card design and add division tags | 완료 (push 미완료) |
| 2026-03-21 | planner | Phase 4 계획 수립 - UI/UX 전체 개선 (ESPN+WHOOP 믹스, 7개 서브 Phase, 약 208분) | 완료 |
| 2026-03-21 | developer | Phase 4-1 구현 - 디자인 토큰 시스템 구축 (globals.css 컬러/타이포/간격 변수 정의) | 완료 |
| 2026-03-21 | tester | Phase 4-1 검증 - tsc + CSS변수정의 + 다크모드 + 기존코드영향 + 빌드 | 통과 - 19/19 항목 통과 |
| 2026-03-21 | git-manager | Phase 4-1 커밋 - feat: add ESPN+WHOOP design token system | 완료 - 8acb3cf (push 미완료) |
| 2026-03-21 | developer | Phase 4-3 구현 - 헤더+네비+슬라이드메뉴+풋터+레이아웃 CSS 변수 전환 + 포인트컬러 웜 오렌지 | 완료 - tsc 통과 |
| 2026-03-21 | git-manager | Phase 4-2 커밋 - feat: redesign common UI components (Card, Button, Badge, Skeleton) | 완료 - 2f20efe (push 미완료) |
| 2026-03-21 | tester | Phase 4-3 검증 - tsc + 헤더/네비/슬라이드메뉴/풋터/레이아웃 CSS변수 + 포인트컬러 + safe-area + 세션로직 | 통과 - 43/43 항목 통과 |
