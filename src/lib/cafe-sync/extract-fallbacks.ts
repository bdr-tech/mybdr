/**
 * 다음카페 Phase 2b Step 4 — parseCafeGame 실패 필드를 관대한 정규식으로 보완.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 왜 이 모듈이 필요한가
 * ──────────────────────────────────────────────────────────────────────────────
 * `parseCafeGame()` 은 "1. HOME 팀명 : ..." 처럼 **번호·라벨·콜론** 패턴에만
 * 매칭된다. 그런데 실측 본문 중에는
 *   - "4월19일 일 저녁10시15분" 처럼 라벨 없이 시간만 나오거나
 *   - "5. 게스트비용 :  10,000원" 처럼 띄어쓰기·공백·단위 섞여 있거나
 *   - "경기 시흥시 뒷방울길" 처럼 본문 어딘가에 지역만 덩그러니 있는 케이스가 있다.
 *
 * 이 경우 parseCafeGame 은 값을 추출하지 못해 upsert.ts 의 fallback 으로 내려간다.
 * (scheduledAt=crawledAt+3일 / feePerPerson=0 / maxParticipants=10)
 * → 목록 UX 에서 "3일 뒤 / 0원 / 10명" 이 일률적으로 노출돼 실효성이 떨어진다.
 *
 * 이 모듈은 parser 를 **건드리지 않고** 실측 본문 패턴을 추가로 긁어
 * "파서 결과 없으면 이거라도 써라" 라는 **2단계 fallback** 을 제공한다.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 설계 원칙
 * ──────────────────────────────────────────────────────────────────────────────
 *  - **DB 의존성 0**. 순수 함수만 export. 테스트 친화.
 *  - **parseCafeGame 절대 수정 금지** — parser 는 공식 포맷만 신뢰.
 *  - 모든 필드 **null 가능** — 못 찾으면 명시적으로 null 반환.
 *  - **guestCount=0 은 null 로 변환** — "00명"(미기재)을 유효값으로 오해하지 않게.
 *  - skillLevel 4단계 매핑: `/games` 필터(SKILL_OPTIONS)와 1:1. 7단계 키는 쓰지 않음.
 *  - scheduledAt 연말 넘김: 추출한 월이 baseDate(크롤 시각) 월보다 3 이상 작으면 +1년.
 *    (예: 크롤=12월, 본문="3월" → 내년 3월).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 공개 타입
// ─────────────────────────────────────────────────────────────────────────────

/**
 * extract-fallbacks 결과.
 *
 * 모든 필드 null 가능 — parser 와 fallback 모두 실패하면 null.
 * upsert.ts 가 `parsed?.X ?? extracted.X ?? fallback상수` 체인으로 소비.
 */
export interface ExtractedFallbacks {
  /** "4월19일 일 저녁10시15분" 류에서 추출한 Date. 없으면 null */
  scheduledAt: Date | null;
  /** "게스트비용 : 10,000원" 등에서 추출한 원화 정수. 없으면 null */
  fee: number | null;
  /**
   * "게스트 모집 인원 : 00명" 등에서 추출한 인원 수.
   * **0 은 null 로 반환** — 실측에 "00명"(미기재 의미) 케이스 있음.
   * 1 이상의 유효값만 반환.
   */
  guestCount: number | null;
  /**
   * "실력 : 중하" 등에서 추출한 스킬 키.
   * 값 집합: "beginner" | "intermediate" | "intermediate_advanced" | "advanced" | "all".
   * 매칭 실패 시 null.
   */
  skillLevel: string | null;
  /** 본문에서 발견된 광역(서울/경기/인천...). 없으면 null */
  city: string | null;
  /** 본문에서 발견된 시/구(시흥시/강남구...). 없으면 null */
  district: string | null;
  /**
   * "장소 : 상암스킬존 3관" 같은 본문에서 추출한 체육관/경기장 이름.
   * parseCafeGame 이 못 뽑은 경우(비표준 라벨) fallback 용. 없으면 null.
   */
  venueName: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// skillLevel 매핑
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 한글 실력 표기 → DB 키 매핑 (4단계).
 *
 * 왜 4단계:
 *   `src/app/(web)/games/games-filter.tsx` 의 `SKILL_OPTIONS` 가 beginner/intermediate/
 *   intermediate_advanced/advanced 4 키만 사용. DB 에 7단계 키를 넣어봐야 필터가 못 걸러냄.
 *   → "중하" 는 intermediate 로 **묶어서** 필터 호환성 확보.
 *
 * "전체" 는 필터 옵션에는 없지만 본문 표기로는 자주 나와 `"all"` 로 명시.
 * upsert.ts 가 최종 fallback 으로도 `"all"` 을 쓰므로 일관.
 */
const SKILL_MAP: Record<string, string> = {
  초급: "beginner",
  중급: "intermediate",
  중하: "intermediate", // 중급으로 묶음 (필터 4단계)
  중상: "intermediate_advanced",
  상급: "advanced",
  전체: "all",
};

// ─────────────────────────────────────────────────────────────────────────────
// 지역 사전
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 광역(시·도) 약칭. parseCafeGame 의 CITY_SHORT 와 동일 집합이지만
 * 모듈 분리 원칙(parser 안 건드림)에 따라 재정의.
 */
const KOREAN_CITIES = [
  "서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산",
  "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

// ─────────────────────────────────────────────────────────────────────────────
// 메인 함수
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 본문 텍스트에서 scheduledAt / fee / guestCount / skillLevel / city / district 를 추출.
 *
 * @param content  카페 본문 원문 (null 허용 — 이 경우 모두 null 반환)
 * @param baseDate 크롤 시각. scheduledAt 연도 보정의 기준점.
 * @returns ExtractedFallbacks — 모든 필드 null 가능
 */
export function extractFallbacks(content: string | null, baseDate: Date): ExtractedFallbacks {
  // 본문 없으면 전부 null — upsert.ts 가 parser 결과/상수 fallback 으로 대체
  if (!content) {
    return {
      scheduledAt: null,
      fee: null,
      guestCount: null,
      skillLevel: null,
      city: null,
      district: null,
      venueName: null,
    };
  }

  return {
    scheduledAt: extractScheduledAt(content, baseDate),
    fee: extractFee(content),
    guestCount: extractGuestCount(content),
    skillLevel: extractSkillLevel(content),
    city: extractCity(content),
    district: extractDistrict(content),
    venueName: extractVenueName(content),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// scheduledAt 추출
// ─────────────────────────────────────────────────────────────────────────────

/**
 * "4월19일 일 저녁10시15분~12시45분" 같은 덩어리에서 시작 Date 를 뽑는다.
 *
 * 관대한 정책:
 *   - 월·일 필수, 시 필수. 분은 optional (없으면 0).
 *   - "저녁/오후/밤" + 시각<13 → +12 (예: 저녁10시 → 22시).
 *   - "오전/낮" 또는 접두사 없음 → 그대로.
 *   - 연도는 baseDate 기준. 월이 base 월보다 3 이상 작으면 "내년" 해석 (연말 넘김).
 *
 * 왜 첫 매치만 쓰나:
 *   본문에 끝 시간("~12시45분")도 같이 나오지만 첫 시각이 **시작 시각**.
 *   글로벌 flag 안 붙이고 `.exec` 한 번으로 충분.
 */
function extractScheduledAt(content: string, baseDate: Date): Date | null {
  // Phase 2b 품질 보강: 월·일 은 "첫 매치", 시각 은 "별도 스캔" 으로 분리.
  //   실측 id=397: "1부) 오후 5 : 00 ~ 7 : 00 / 2부) 저녁 10 : 00" 처럼
  //   월·일 매치 위치와 시각 매치 위치가 멀리 떨어져 있어 단일 regex 로는 실패.
  //   → 1단계 월·일 추출 → 2단계 시각 여러 패턴 순차 매칭.

  // 1단계: 월·일 추출
  const dateMatch = /(\d{1,2})\s*월\s*(\d{1,2})\s*일/.exec(content);
  if (!dateMatch) return null;

  const month = Number(dateMatch[1]);
  const day = Number(dateMatch[2]);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  // 2단계: 시각 추출 — 여러 패턴 순차 시도 (첫 매치 채택)
  // 우선순위:
  //   (A) 한글 단위 "저녁10시15분" / "오후 5시" — 명확한 시간대 키워드
  //   (B) 한글+콜론 "오후 5 : 00" / "저녁 10 : 00" — 실측 3925/397
  //   (C) 순수 콜론 "20:45~22:15" — 24h 형식, 접두사 없음
  //
  // 각 패턴은 본문 전체에서 매칭 (월·일 근처 제약 X) — 시각 덩어리가 멀리 있어도 잡음.
  type TimeResult = { hour: number; minute: number; period: string };

  const tryPatterns: Array<() => TimeResult | null> = [
    // (A) "(저녁|오후|오전|밤|낮)? 12시 30분" — 분은 optional
    () => {
      const p = /(저녁|오후|오전|밤|낮)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/;
      const m = p.exec(content);
      if (!m) return null;
      return {
        period: m[1] ?? "",
        hour: Number(m[2]),
        minute: m[3] ? Number(m[3]) : 0,
      };
    },
    // (B) "(저녁|오후|오전|밤|낮) 5 : 00" — 접두사 + 콜론 포맷
    () => {
      const p = /(저녁|오후|오전|밤|낮)\s*(\d{1,2})\s*:\s*(\d{1,2})/;
      const m = p.exec(content);
      if (!m) return null;
      return { period: m[1], hour: Number(m[2]), minute: Number(m[3]) };
    },
    // (C) 순수 "20:45" 콜론 포맷 — 접두사 없음, 24h 형식.
    //     "13:00" 이상이면 자동으로 오후. "08:00" 같은 오전은 그대로 사용.
    //     단, 앞뒤로 숫자가 붙으면 시각이 아닌 숫자 나열 (예: "1,234:56")이므로 단어 경계 체크.
    () => {
      const p = /(?:^|[^\d])(\d{1,2})\s*:\s*(\d{2})(?!\d)/;
      const m = p.exec(content);
      if (!m) return null;
      return { period: "", hour: Number(m[1]), minute: Number(m[2]) };
    },
  ];

  let timeResult: TimeResult | null = null;
  for (const tryPattern of tryPatterns) {
    timeResult = tryPattern();
    if (timeResult) break;
  }
  if (!timeResult) return null;

  const period = timeResult.period; // "저녁"|"오후"|"밤"|"오전"|"낮"|""
  let hour = timeResult.hour;
  const minute = timeResult.minute;

  if (hour < 0 || hour > 23) return null;
  if (minute < 0 || minute > 59) return null;

  // 시간대 보정: 저녁/오후/밤 + 1~12시 → +12 (예: 저녁10시 → 22시)
  if ((period === "저녁" || period === "오후" || period === "밤") && hour < 13) {
    hour += 12;
  }
  // "오전"·"낮"·접두사 없음은 그대로 사용 (24 시간 표기인 경우가 많음)

  // 연도: baseDate 기준. 연말에 내년 일정 얘기하는 경우 (12월에 3월 얘기) +1년.
  let year = baseDate.getFullYear();
  const baseMonth = baseDate.getMonth() + 1; // JS 는 0-indexed
  if (month - baseMonth < -2) {
    // 예: base=12월, 본문=3월 → 3-12=-9 → 내년 3월
    year += 1;
  }

  // JS Date 는 month 를 0-indexed 로 받음 — 1 빼서 생성
  // 로컬 타임존 기준 Date — DB 에는 UTC 로 저장되지만 Phase 2a 스모크에서
  // 로컬 KST 표시 확인을 위해 로컬 생성 유지 (기존 parseCafeGame 동작과 일관)
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// fee 추출
// ─────────────────────────────────────────────────────────────────────────────

/**
 * "게스트비용 : 10,000원" 같은 표기에서 원화 정수를 뽑는다.
 *
 * 관대 포인트:
 *   - "게스트 비용" / "게스트비용" / "입장료" / "참가비" / "이용료" 여러 라벨 허용
 *   - 콜론 전후 공백 무제한
 *   - 콤마 구분자 제거 후 parseInt
 */
function extractFee(content: string): number | null {
  const pattern = /(?:게스트\s*비용|입장료|참가비|이용료)\s*[:：]?\s*([0-9,]+)\s*원/;
  const m = pattern.exec(content);
  if (!m) return null;

  const raw = m[1].replace(/,/g, "");
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

// ─────────────────────────────────────────────────────────────────────────────
// guestCount 추출
// ─────────────────────────────────────────────────────────────────────────────

/**
 * "게스트 모집 인원 : 5명" 같은 표기에서 인원 수를 뽑는다.
 *
 * **0 은 null 로 반환**:
 *   실측 본문에 "모집 인원 : 00명" 처럼 미기재 의미로 0을 쓰는 케이스가 있음.
 *   이 값이 DB 에 들어가면 games 목록에서 "0명 모집"으로 깨져 보이므로
 *   유효값(1 이상)만 취급하고 나머지는 null → upsert.ts 에서 10 (fallback) 으로.
 */
function extractGuestCount(content: string): number | null {
  const pattern = /(?:모집\s*인원|게스트\s*모집|인원\s*최소|게스트\s*인원)\s*[:：]?\s*(\d+)\s*명/;
  const m = pattern.exec(content);
  if (!m) return null;

  const n = parseInt(m[1], 10);
  if (!Number.isFinite(n) || n <= 0) return null; // 0 및 음수는 유효값 아님
  return n;
}

// ─────────────────────────────────────────────────────────────────────────────
// skillLevel 추출
// ─────────────────────────────────────────────────────────────────────────────

/**
 * "실력 : 중하" 같은 표기에서 DB 키로 매핑.
 *
 * 여러 표기 변형 허용:
 *   - "실력", "실력대", "레벨" 다 가능
 *   - 콜론 유무 무관
 *   - "초급~중급" 처럼 범위 표기는 **첫 값**만 채택 (보수적)
 */
function extractSkillLevel(content: string): string | null {
  const pattern = /(?:실력(?:대)?|레벨)\s*[:：]?\s*(초급|중급|중하|중상|상급|전체)/;
  const m = pattern.exec(content);
  if (!m) return null;

  const key = m[1];
  return SKILL_MAP[key] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// city / district 추출
// ─────────────────────────────────────────────────────────────────────────────

/**
 * "경기 시흥시 뒷방울길" 같은 본문에서 광역만 뽑는다.
 *
 * 독립 추출: district 와 엮지 않음 — city 만 있는 본문도 있음.
 * 단, 앞뒤 한글과 바로 붙으면(예: "경기장") 매칭 안 되도록 단어 경계 고려.
 */
function extractCity(content: string): string | null {
  // 앞: 줄 시작 or 공백/구두점, 뒤: 공백 or 한자어 경계(시/도/구 등이 이어지거나 끝)
  // KOREAN_CITIES 를 | 로 엮어 그룹 1 로 캡처
  const cityAlt = KOREAN_CITIES.join("|");
  const pattern = new RegExp(
    `(?:^|[\\s,./·()\\[\\]\\-])(${cityAlt})(?=\\s|[시도특광]|$)`,
    "m",
  );
  const m = pattern.exec(content);
  if (!m) return null;
  return m[1];
}

/**
 * "시흥시" / "강남구" 같은 단위를 본문 어디에서든 뽑는다.
 *
 * 관대 정책:
 *   - `\S{1,5}(시|구)` 형태 — 5글자 이내 어근 + "시"/"구"
 *   - 단, **광역 도 이름 자체(경기도/강원도 등) 는 매치 금지** → 앞에 "도" 붙은 2음절은 skip
 *   - 첫 매치만 사용 (여러 개면 본문 윗부분 우선)
 */
function extractDistrict(content: string): string | null {
  // (\S{1,5}(시|구)) 전체를 캡처. 공백·괄호·쉼표로 구분된 경우 위주로 매칭.
  // 시/구 바로 뒤에 "청/장/청사" 같은 접미가 오면 행정기관 명칭이니 제외.
  const pattern = /([가-힣]{1,5}(?:시|구))(?![장청가계])/g;
  let m: RegExpExecArray | null;

  // 라벨/일반 명사 블랙리스트 — "시" 또는 "구" 로 끝나지만 지명이 아닌 단어.
  // 왜 필요: 실측에서 "일시 :" 의 "일시" 가 district 로 잡혔음(3924번 글).
  //   본문 앞부분에 라벨이 자주 등장해 첫 매치를 잘못 선택할 위험이 크다.
  // 확장 대비: "최소/상구/일구" 등 흔히 본문에 나오는 "~시/~구" 지명 아닌 단어 나오면 추가.
  const BLACKLIST = new Set([
    "일시", // "일시 :" 라벨
    "당시", "동시", "즉시", "수시", "임시", "평시", "항시", // 일반 명사 (~시)
    "다시", "함께시", // 동사 활용형 혼입 방지
    "최소", "상구", "하구", "분구", "단구", "도구", // "~구" 일반 명사/접미사
  ]);

  while ((m = pattern.exec(content)) !== null) {
    const cand = m[1];

    // 블랙리스트 컷
    if (BLACKLIST.has(cand)) continue;

    // 광역 시·도 정식 표기 자체(예: "서울시"/"부산시")는 city 쪽이 가져가므로 skip.
    if (cand.length === 3 && KOREAN_CITIES.includes(cand.slice(0, 2)) && cand.endsWith("시")) {
      continue;
    }
    // "N시" 처럼 숫자+시 (예: "10시") 는 시간 — 위 [가-힣] 제한으로 이미 배제됨.
    return cand;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// venueName 추출 (Phase 2b 품질 보강)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * "장소 : 상암스킬존 3관" 같은 본문에서 체육관/경기장 이름을 뽑는다.
 *
 * 우선순위:
 *   1) "장소 :" 뒤 첫 줄 — 가장 명확한 라벨
 *   2) "위치 :" 뒤 첫 줄 — "장소" 대신 "위치" 쓰는 카페가 있음
 *   3) "티맵 검색 :" 뒤 — 지도 앱 검색용 정식 명칭 (종종 장소 라벨 누락해도 있음)
 *   4) "HOME 팀명" / "팀명" 라벨 — 최후 수단. 경기장 이름을 팀명으로 쓰는 관례 존재
 *
 * 후처리:
 *   - 앞뒤 공백 제거
 *   - "1.", "3." 같은 숫자 접두사 제거 (정규식이 이미 처리했지만 이중 방어)
 *   - 길이 1~50자만 허용 (너무 짧거나 긴 문자열은 주소 전체/노이즈 가능성)
 *   - "/" 앞까지만 — "상암스킬존 3관 / 서울 마포구" 같은 연결 표기 대응
 *
 * 왜 첫 줄까지만 캡처하나:
 *   "장소 : 상암스킬존 3관\n주소: ..." 처럼 라벨 다음 줄에 다른 정보가 이어지는 경우가 많음.
 *   줄 경계 넘지 않도록 [^\n/] 로 제한해 안전하게 첫 값만 추출.
 */
function extractVenueName(content: string): string | null {
  // 패턴 시도 순서 — 위에서 성공하면 즉시 반환
  const patterns: RegExp[] = [
    // (1) "장소 :" — 가장 흔한 라벨. 앞 숫자 접두사("1.", "3.") 허용.
    /(?:^|\n)\s*\d?\.?\s*장소\s*[:：]\s*([^\n/]+?)(?:\n|$|\/)/,
    // (2) "위치 :" — 대체 라벨
    /(?:^|\n)\s*\d?\.?\s*위치\s*[:：]\s*([^\n/]+?)(?:\n|$|\/)/,
    // (3) "티맵 검색 :" — 지도앱 검색명
    /티맵\s*검색\s*[:：]\s*([^\n]+)/,
    // (4) "HOME 팀명" 또는 "팀명" — 최후 수단
    /(?:^|\n)\s*\d?\.?\s*(?:HOME\s*)?팀명\s*[:：]\s*([^\n]+)/,
  ];

  for (const p of patterns) {
    const m = p.exec(content);
    if (!m) continue;

    // 후처리 (Phase 2b 재수정 — venue 품질 가드 강화)
    let cand = m[1].trim();
    // (1) 혹시 남아 있을 숫자 접두사 제거 ("1. ", "3." 등)
    cand = cand.replace(/^\d+\.\s*/, "").trim();

    // (2) 괄호 블록 제거 — "상암체육관 (수색교3분거리)" → "상암체육관"
    //     왜: 괄호 안은 부가설명(경로/주의사항)이라 venue 이름으로 부적합.
    cand = cand.replace(/\([^)]*\)/g, "").replace(/\（[^）]*\）/g, "").trim();

    // (3) 연속 공백 → 단일 공백
    cand = cand.replace(/\s+/g, " ").trim();

    // (4) "/" 나 "|" 가 있으면 앞부분만 (연결 표기 대응)
    const cut = cand.split(/[/|]/)[0].trim();
    if (cut.length < 1) continue;

    // (5) 주소 패턴 거부 — "경기도 구리시 토평동 28-2" 같은 번지수 포함 문자열은 venue 아님.
    //     왜: 카페 글에서 "장소 :" 뒤에 주소 전체를 쓰는 케이스가 있어 venue 에 주소가 들어감.
    //     "162-4", "28-2" 같이 1~5자리 숫자 - 1자리+ 숫자 = 전형적인 번지/도로명 구조.
    if (/\d{1,5}-\d+/.test(cut)) continue;

    // (6) 길이 가드 — 20 자 초과 시 null (주소/설명문 가능성 높음).
    //     왜 20: 실측 체육관명은 대부분 10~15자 ("상암체육관", "삼성썬더스 스포츠팰리스", "스킬존 3관").
    //     매직 넘버지만 본 서비스 수집 도메인에서 경험적으로 충분. 초과분은 자르지 말고 버림(null).
    //     slice 하면 잘린 문자열이 DB 에 들어가 "경기도 구리시 토평동 28" 같은 반쪽 주소가 남는다.
    if (cut.length > 20) continue;

    return cut;
  }
  return null;
}
