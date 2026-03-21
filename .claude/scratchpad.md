# 📋 작업 스크래치패드

## 현재 작업
- **요청**: 대회탭 UI를 경기탭 UI와 동일하게 변경 + 종별 태그 표시
- **상태**: 진행 중 - 구현
- **현재 담당**: developer

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

📦 커밋: feat: unify tournament card UI with game card design and add division tags
🌿 브랜치: master
📁 포함 파일:
- `src/app/(web)/tournaments/_components/tournaments-content.tsx`
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
