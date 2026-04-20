/**
 * 다음카페 본문 정규식 파서 (게스트 모집 글 → 구조화 필드)
 *
 * 왜 이 모듈이 필요한가:
 *   외부 스크래퍼가 카페 본문 원문을 games.description / cafe_posts.content 에 통째로
 *   넣어두는 바람에 venue_name / city / fee_per_person / scheduled_at(시작 시각) 같은
 *   핵심 노출 컬럼이 NULL 또는 0 으로 비어있다.
 *   본문 양식이 "1. HOME 팀명 : ... / 2. 일시 : ... / 3. 장소 : ..." 로 매우 일관되어
 *   정규식 한 단계로 95%+ 복구가 가능하다.
 *
 * 사용처:
 *   - scripts/backfill-games-from-cafe.ts (일회성 백필)
 *   - 향후 카페 크롤러 인입 시점 정규화 (online 사용)
 *
 * DB 의존성 0. 순수 함수만 노출. 테스트 친화적.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────────────────────────────────────

/** 파싱 결과 — 모든 필드 optional. 못 뽑으면 undefined */
export interface ParsedCafeGame {
  /** "1. HOME 팀명" — 홈팀 이름 (빈 문자열은 undefined로 정규화) */
  homeTeamName?: string;
  /** "2. 일시" — 시작 시각 (KST 기준 Date) */
  scheduledAt?: Date;
  /** "3. 장소" — 본문 그대로의 장소 문자열 */
  venueName?: string;
  /** 장소에서 추출한 시·도 (서울/인천/...) */
  city?: string;
  /** 장소에서 추출한 자치구/시·군 (강남구/부평구/화성시...) */
  district?: string;
  /** "4. 운영방식" */
  format?: string;
  /** "5. 게스트 모집 인원" — 숫자 N명 */
  guestCount?: number;
  /** "6. 게스트 비용" — 원 단위 정수 (무료=0) */
  feePerPerson?: number;
  /** "7. 연락처" — 전화번호 원문 (정규화 X) */
  contact?: string;
  /** "8. 필수 정보" */
  requiredInfo?: string;
  /** "9. 기타 참고 사항" 이하 자유 텍스트 */
  notes?: string;
  /**
   * 본문 키워드 기반으로 추정한 경기 유형.
   *   0 = PICKUP (픽업게임/팀 양도)
   *   1 = GUEST (게스트 모집)
   *   2 = PRACTICE (교류전/연습경기/팀초청)
   *   null = 분류 불가 (덮어쓰기 금지)
   *
   * `parseCafeGame()` 의 마지막 단계에서 `inferGameType()` 호출로 자동 채움.
   */
  gameType?: 0 | 1 | 2 | null;
}

/** 라벨별 매칭 통계 (디버그/리포팅용) */
export interface ParseStats {
  /** "N. 라벨 : 값" 패턴으로 잡힌 라인 수 */
  matchedLines: number;
  /** 본문 총 라인 수 */
  totalLines: number;
  /** 인식한 라벨 키 목록 */
  labels: string[];
}

export interface ParseResult {
  data: ParsedCafeGame;
  stats: ParseStats;
}

// ─────────────────────────────────────────────────────────────────────────────
// 사전: 시·도 / 자치구
// ─────────────────────────────────────────────────────────────────────────────

// 시·도 정식 표기 (긴 것부터 매칭되도록 정렬)
const CITIES = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
  "대전광역시", "울산광역시", "세종특별자치시",
  "경기도", "강원도", "강원특별자치도", "충청북도", "충청남도",
  "전라북도", "전북특별자치도", "전라남도", "경상북도", "경상남도",
  "제주도", "제주특별자치도",
];

// 약칭 → 정식 매핑 ("서울" → "서울특별시" 처럼 카페 본문에서 흔히 쓰는 형태)
const CITY_SHORT: Record<string, string> = {
  "서울": "서울", "부산": "부산", "대구": "대구", "인천": "인천",
  "광주": "광주", "대전": "대전", "울산": "울산", "세종": "세종",
  "경기": "경기", "강원": "강원", "충북": "충북", "충남": "충남",
  "전북": "전북", "전남": "전남", "경북": "경북", "경남": "경남",
  "제주": "제주",
};

// 서울 25개 구 (광역시 구도 일부 포함). district 단독 추출 시 city 역추론에 사용
const SEOUL_GU = new Set([
  "강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구",
  "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구",
  "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구",
  "은평구", "종로구", "중구", "중랑구",
]);

// "구"로 끝나는 토큰을 city 역추론할 때 후보 (서울 외 광역시도 포함)
// 정확도 우선 — 광역시 매핑은 너무 광범위해서 일단 서울만 자동 매핑
const GU_TO_CITY: Record<string, string> = {};
for (const gu of SEOUL_GU) GU_TO_CITY[gu] = "서울";

// ─────────────────────────────────────────────────────────────────────────────
// 핵심: 라인 → 라벨/값 분리
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 한 라인을 "번호 + 라벨 + 값" 으로 분해.
 *
 * 왜 이렇게 느슨하게:
 *   - "1. HOME 팀명 : ..." 표준
 *   - "1 ... HOME 팀명 : ..." (점 누락 + 줄임표)
 *   - "1\n. HOME 팀명" (번호와 점이 줄바꿈) → 외부에서 미리 합쳐 들어옴
 *   - "1." + 다음 줄에 라벨 (드물게) → 본 함수 외부 처리
 *   - "게스트비용 : 8000" (번호 없음) → 번호 그룹 optional
 *   - "연락처 :01032639023" (콜론 뒤 공백 없음)
 *   - "참고사항 ：..." (전각 콜론)
 *
 * 반환값: 라벨 정규화(소문자/공백제거) 후 키, 원문 값
 */
const LINE_RE =
  /^\s*(?:(\d{1,2})\s*[\.\)]?\s*\.?\s*)?([^:：\d][^:：]{0,30}?)\s*[:：]\s*(.*)$/;

interface RawLine {
  num?: number;
  label: string;       // 정규화된 라벨 (예: "HOME팀명", "게스트비용")
  rawLabel: string;    // 원문 라벨
  value: string;
}

function splitLine(line: string): RawLine | null {
  const m = LINE_RE.exec(line);
  if (!m) return null;
  const num = m[1] ? Number(m[1]) : undefined;
  const rawLabel = m[2].trim();
  // 라벨 정규화: 모든 공백 제거 + 소문자 (영문 HOME 같은 케이스 대응)
  const label = rawLabel.replace(/\s+/g, "").toLowerCase();
  const value = m[3].trim();
  return { num, label, rawLabel, value };
}

// ─────────────────────────────────────────────────────────────────────────────
// 라벨 → 의미 매핑
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 라벨 변형을 통일된 키로 매핑.
 * 부분 일치 (includes) 로 처리해야 "게스트비용" / "게스트 비용" / "비용" 모두 잡힘.
 * 우선순위 — 더 구체적인 패턴을 위에 둔다.
 */
function classifyLabel(label: string): keyof ParsedCafeGame | "skip" | null {
  // home 팀명
  if (label.includes("home") || label.includes("팀명")) return "homeTeamName";
  // 일시 / 시간
  if (label.includes("일시") || label === "시간" || label === "날짜") return "scheduledAt";
  // 장소 / 체육관
  if (label.includes("장소") || label.includes("체육관")) return "venueName";
  // 운영방식 / 진행방식
  if (label.includes("운영") || label.includes("진행방식") || label === "방식") return "format";
  // 게스트 모집 인원
  if (label.includes("모집") || label.includes("인원")) return "guestCount";
  // 비용 / 회비 / 참가비
  if (label.includes("비용") || label.includes("회비") || label.includes("참가비")) return "feePerPerson";
  // 연락처
  if (label.includes("연락") || label.includes("전화")) return "contact";
  // 필수정보
  if (label.includes("필수") || label.includes("신청")) return "requiredInfo";
  // 기타 참고
  if (label.includes("참고") || label.includes("기타")) return "notes";
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 값 휴리스틱
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 비용 정규화.
 *   "5천원"        → 5000
 *   "1만원"        → 10000
 *   "8,000원"      → 8000
 *   "8000"         → 8000
 *   "무료" / "0"   → 0
 *   "7천원 (선입금 요청)" → 7000  (괄호 부가설명 제거)
 *
 * 왜 천/만 단위 처리:
 *   카페 본문에서 "5천원", "1만원" 표기가 매우 흔함. 단순 \d+\s*원 으로는 누락.
 */
export function parseFee(raw: string): number | undefined {
  if (!raw) return undefined;
  const s = raw.trim();
  if (/^\s*무료/.test(s) || /^free$/i.test(s)) return 0;

  // "1만원" / "1.5만원" 우선 매칭
  const manMatch = /(\d+(?:\.\d+)?)\s*만\s*원?/.exec(s);
  if (manMatch) return Math.round(Number(manMatch[1]) * 10000);

  // "5천원" / "5.5천원"
  const cheonMatch = /(\d+(?:\.\d+)?)\s*천\s*원?/.exec(s);
  if (cheonMatch) return Math.round(Number(cheonMatch[1]) * 1000);

  // "8,000원" / "8000원" / "8000"
  const wonMatch = /(\d[\d,]{2,})\s*원?/.exec(s);
  if (wonMatch) {
    const n = Number(wonMatch[1].replace(/,/g, ""));
    if (Number.isFinite(n)) return n;
  }

  return undefined;
}

/**
 * 게스트 모집 인원 정규화.
 *   "5명" → 5
 *   "5 명" → 5
 *   "O명(...)" → undefined (자리표시자)
 *   "4명 (8대8 or 6대6대6)" → 4
 *   "2 - 3명" → 2 (보수적으로 첫 숫자)
 */
export function parseGuestCount(raw: string): number | undefined {
  if (!raw) return undefined;
  const m = /(\d{1,2})\s*명/.exec(raw);
  if (!m) return undefined;
  return Number(m[1]);
}

/**
 * 일시 → KST Date 변환.
 *
 * 지원 형식:
 *   "4월 9일 목요일 18:30 - 21:00"   → 2026-04-09T18:30 KST
 *   "4월9일 오후8시~10시"              → 2026-04-09T20:00 KST
 *   "10:00-12:30"                       → fallback: createdAt 의 날짜 + 10:00
 *   "4월 11일 토요일 오후 3시 ~ 5시"   → 2026-04-11T15:00 KST
 *
 * referenceDate(보통 cafe_posts.created_at 또는 games.created_at):
 *   - 본문에 "월/일"이 없을 때 날짜 fallback
 *   - 연도가 명시되지 않을 때 referenceDate 의 연도 사용
 *     (단, 4월에 작성된 글에서 "1월 5일" 이라고 적혀있으면 다음 해로 보정)
 *
 * KST 처리:
 *   Node 환경 TZ 와 무관하게 결과 일관성을 보장하려고
 *   `new Date(Date.UTC(y, mo, d, h-9, mi))` 로 명시 변환.
 *
 * 실패 시 undefined.
 */
export function parseScheduledAt(
  raw: string,
  referenceDate?: Date,
): Date | undefined {
  if (!raw) return undefined;
  const ref = referenceDate ?? new Date();

  // 1) 월/일 추출
  const mdMatch = /(\d{1,2})\s*월\s*(\d{1,2})\s*일/.exec(raw);
  let year = ref.getFullYear();
  let month: number | undefined;
  let day: number | undefined;
  if (mdMatch) {
    month = Number(mdMatch[1]);
    day = Number(mdMatch[2]);
    // 연도 보정: 본문 월이 reference 월보다 6개월 이상 과거면 다음 해
    const refMonth = ref.getMonth() + 1;
    if (month < refMonth - 6) year += 1;
  } else {
    // 월/일 없음 → reference 의 연/월/일 사용 (본문에 시각만 있는 경우)
    month = ref.getMonth() + 1;
    day = ref.getDate();
  }

  // 2) 시각 추출 — "오후 3시" / "20시" / "20시 30분" / "18:30" / "오후8시"
  //
  // 왜 "가장 빠른 매칭" 방식인가:
  //   "20시 ~ 21시30분" 같은 문장에서 우리는 "시작 시각 = 20시" 를 원한다.
  //   여러 정규식의 결과 중 첫 위치(index)가 가장 빠른 것을 시작 시각으로 채택한다.
  //   이래야 "콜론" 패턴이 종료시각에 더 잘 들어맞더라도 시작 시각이 먼저 잡힌다.
  let hour: number | undefined;
  let minute = 0;
  let bestIdx = Number.POSITIVE_INFINITY;

  // 패턴 A: "오전/오후 H시(M분)?" — 오전/오후 토큰까지 포함되어 가장 명확
  const ampmMatch = /(오전|오후)\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/.exec(raw);
  // 패턴 B: "HH:MM" (콜론 형식)
  const hmMatch = /(\d{1,2})\s*:\s*(\d{2})/.exec(raw);
  // 패턴 C: "H시(M분)?" (오전/오후 없음, 단순 24시제)
  const hourOnly = /(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/.exec(raw);

  if (ampmMatch && ampmMatch.index < bestIdx) {
    const ampm = ampmMatch[1];
    let h = Number(ampmMatch[2]);
    const mi = ampmMatch[3] ? Number(ampmMatch[3]) : 0;
    if (ampm === "오후" && h < 12) h += 12;
    if (ampm === "오전" && h === 12) h = 0;
    hour = h;
    minute = mi;
    bestIdx = ampmMatch.index;
  }
  if (hmMatch && hmMatch.index < bestIdx) {
    hour = Number(hmMatch[1]);
    minute = Number(hmMatch[2]);
    bestIdx = hmMatch.index;
  }
  if (hourOnly && hourOnly.index < bestIdx) {
    hour = Number(hourOnly[1]);
    minute = hourOnly[2] ? Number(hourOnly[2]) : 0;
    bestIdx = hourOnly.index;
  }

  if (hour === undefined || month === undefined || day === undefined) return undefined;
  if (hour < 0 || hour > 23) return undefined;
  if (month < 1 || month > 12) return undefined;
  if (day < 1 || day > 31) return undefined;

  // KST(UTC+9) → UTC 변환
  const utcMs = Date.UTC(year, month - 1, day, hour - 9, minute);
  const result = new Date(utcMs);
  if (Number.isNaN(result.getTime())) return undefined;
  return result;
}

/**
 * 장소 문자열 → city / district 추출.
 *
 * 휴리스틱 우선순위:
 *   1) 정식 시·도 명 (서울특별시 등) → 그대로 city
 *   2) 약칭 시·도 (서울/인천/경기...) → city = 약칭
 *   3) 자치구 (강남구 등) → district. 서울 25구면 city="서울" 자동 보정
 *   4) "OO동" → district 후보로만 사용 (city 추론 안 함, 동명이인 너무 많음)
 *
 * 못 뽑으면 두 필드 모두 undefined.
 */
export function parseLocation(raw: string): { city?: string; district?: string } {
  if (!raw) return {};

  // 괄호와 특수문자 정리한 검색용 텍스트
  const text = raw.replace(/[\(\)\[\]【】]/g, " ");

  let city: string | undefined;
  let district: string | undefined;

  // 1) 정식 시·도
  for (const c of CITIES) {
    if (text.includes(c)) {
      // "서울특별시" → "서울" 로 짧게 정규화
      const short = c.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, "");
      city = short || c;
      break;
    }
  }

  // 2) 약칭 시·도 (앞 토큰 매칭 — 본문 첫 줄에 흔히 등장)
  if (!city) {
    for (const short of Object.keys(CITY_SHORT)) {
      // 단어 경계 — 한글은 \b 가 안 먹어서 공백/괄호/특수문자 둘러싸임 검사
      const re = new RegExp(`(?:^|[\\s\\(\\)\\[\\],/])${short}(?=[\\s\\(\\)\\[\\],/]|$|시|도|특별)`);
      if (re.test(` ${text} `)) {
        city = CITY_SHORT[short];
        break;
      }
    }
  }

  // 3) 일반 시 (화성시/수원시...)
  //   "OO시" 를 "OO구" 보다 먼저 매칭.
  //   이유: "화성시 병점구 ..." 같은 본문은 시를 district 로 잡아야 의미가 맞음
  //        (광역시가 아니므로 city 로는 넣지 않는다).
  //   1차 매칭 후 광역시/특별시/자치시 같은 정식 시·도 명은 제외.
  const SI_BLACKLIST = new Set([
    "광역시", "특별시", "특별자치시", "특별자치도",
    "인천광역시", "부산광역시", "대구광역시", "광주광역시", "대전광역시",
    "울산광역시", "서울특별시", "세종특별자치시",
    "강원특별자치도", "전북특별자치도", "제주특별자치도",
  ]);
  const siCandidates = text.match(/[가-힣]{1,8}시/g) ?? [];
  for (const cand of siCandidates) {
    if (SI_BLACKLIST.has(cand)) continue;
    // 끝에 "광역시" 등 접미사가 붙어있으면 제외
    if (/(특별|광역|자치)시$/.test(cand)) continue;
    // 단어 경계 검사: 앞뒤가 한글 연속이면 (예: "체육시설") 제외
    const idx = text.indexOf(cand);
    const after = text[idx + cand.length] ?? " ";
    if (/[가-힣]/.test(after)) continue; // 뒤에 한글 더 붙으면 무효
    district = cand;
    break;
  }

  // 4) 자치구 (강남구/부평구/관악구민체육센터...)
  //   "관악구민체육센터" 처럼 "구" 바로 뒤에 다른 한글이 이어지는 경우도 잡아야 함.
  //   그래서 lookahead 를 느슨하게: 공백/구분자 OR 한글 이어짐 모두 허용.
  //   단 SEOUL_GU 사전에 있는 정확한 구명만 채택해서 오탐 방지.
  if (!district) {
    const guCandidates = text.match(/[가-힣]{1,5}구/g) ?? [];
    for (const cand of guCandidates) {
      // 뒷부분을 하나씩 떼가며 정식 구명 매칭 ("관악구민" → "관악구" OK)
      for (let len = cand.length; len >= 2; len--) {
        const sub = cand.slice(cand.length - len); // "관악구" 부분
        if (SEOUL_GU.has(sub)) {
          district = sub;
          break;
        }
      }
      if (district) break;
    }
    // SEOUL_GU 에 없지만 "OO구" 로 끝나는 토큰이 있으면 그대로 사용 (광역시 구 등)
    if (!district && guCandidates.length > 0) {
      // 뒤에 구분자가 있는 첫 후보만 사용 (오탐 최소화)
      const strict = /([가-힣]{1,5}구)(?=[\s\(\)\[\]/,]|$)/.exec(text);
      if (strict) district = strict[1];
    }
  }

  // 5) city 역추론: district 가 서울 구면 city="서울"
  if (!city && district && GU_TO_CITY[district]) {
    city = GU_TO_CITY[district];
  }

  return { city, district };
}

// ─────────────────────────────────────────────────────────────────────────────
// 게임 유형 추론
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 카페 본문/제목에서 game_type 추론.
 *   0 = PICKUP (픽업게임/팀 양도)
 *   1 = GUEST (게스트 모집)
 *   2 = PRACTICE (교류전/연습경기/팀초청)
 *   null = 어디에도 안 걸리면 분류 보류 (덮어쓰지 않음)
 *
 * 우선순위 (위에서부터 첫 매칭 채택):
 *   1) PRACTICE — "교류전/연습경기/친선전/팀초청/한팀 초청" 키워드가 있고
 *                 GUEST 키워드(게스트모집/게스트비용/게스트신청)가 없을 때.
 *                 ※ "교류전 + 게스트모집" 혼합글은 GUEST 로 보내야 정확. (실제 표본 #389)
 *   2) GUEST — "게스트모집/게스트비용/게스트신청/픽업게임 게스트" 키워드 OR
 *              parsed.guestCount(모집 인원) 이 1 이상이면 GUEST.
 *   3) PICKUP — "픽업게임/픽업" 키워드 (단독) OR "양도/대관양도" 키워드.
 *               (=GUEST 키워드가 없는 픽업게임은 보통 팀-팀 픽업 매칭)
 *   4) null — 위 어디에도 매칭 안 되면 보류.
 *
 * 왜 export 분리:
 *   백필 스크립트 dry-run 시 단위 호출 가능 + vitest 단위 테스트 가능.
 *
 * @param parsed   parseCafeGame() 의 data (guestCount 같은 구조화 필드 활용)
 * @param content  본문 원문 (키워드 검색용)
 * @param title    제목 (선택, 본문이 짧을 때 보조 단서)
 */
export function inferGameType(
  parsed: ParsedCafeGame,
  content?: string,
  title?: string,
): 0 | 1 | 2 | null {
  // 검색 텍스트: 제목 + 본문 + 운영방식 라벨 값까지 합쳐서 한 번에 검사.
  // 공백 정규화는 includes 검색 정확도와 무관하므로 생략.
  const haystack = [title ?? "", content ?? "", parsed.format ?? ""]
    .filter(Boolean)
    .join("\n");

  // GUEST 키워드 — 가장 강한 신호 (게스트 모집글 특유의 표현)
  const GUEST_KEYWORDS = [
    "게스트 모집",
    "게스트모집",
    "게스트 비용",
    "게스트비용",
    "게스트 신청",
    "게스트신청",
    "게스트 환영",
  ];
  // PRACTICE 키워드 — 팀-팀 매칭 특유의 표현
  const PRACTICE_KEYWORDS = [
    "교류전",
    "연습경기",
    "친선전",
    "팀 초청",
    "팀초청",
    "한팀 초청",
    "한 팀 초청",
    "팀 연습경기",
  ];
  // PICKUP 키워드 — 본인 팀이 픽업/양도 (게스트 모집과는 다른 결)
  const PICKUP_KEYWORDS = [
    "픽업게임",
    "픽업 게임",
    "체육관 양도",
    "대관 양도",
    "코트 양도",
    "양도합니다",
  ];

  const hasGuestKw = GUEST_KEYWORDS.some((k) => haystack.includes(k));
  const hasPracticeKw = PRACTICE_KEYWORDS.some((k) => haystack.includes(k));
  const hasPickupKw = PICKUP_KEYWORDS.some((k) => haystack.includes(k));

  // 1) PRACTICE — 교류전 키워드 + GUEST 신호 없음
  //   (GUEST 키워드 또는 guestCount 명시는 "게스트 모집글" 단서이므로 PRACTICE 보다 우선)
  const hasGuestSignal = hasGuestKw || (parsed.guestCount !== undefined && parsed.guestCount > 0);
  if (hasPracticeKw && !hasGuestSignal) return 2;

  // 2) GUEST — 키워드 또는 모집 인원 명시
  if (hasGuestSignal) return 1;

  // 3) PICKUP — 픽업/양도 키워드 (GUEST 가 아닌 경우의 픽업)
  if (hasPickupKw) return 0;

  // 4) 분류 불가
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 본문 전체 파싱
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 본문 → 구조화 필드 변환 (메인 진입점).
 *
 * @param content     본문 원문 (cafe_posts.content 또는 games.description)
 * @param referenceDate scheduledAt 보정용 reference (보통 cafe_posts.created_at).
 *                    본문에 연/월/일이 빠져있을 때 이 값을 fallback 으로 사용.
 */
export function parseCafeGame(
  content: string,
  referenceDate?: Date,
): ParseResult {
  if (!content) {
    return { data: {}, stats: { matchedLines: 0, totalLines: 0, labels: [] } };
  }

  // 본문 정규화:
  //   - HTML 엔티티 일부 (&nbsp;)
  //   - "1\n. HOME 팀명" 처럼 번호와 점이 분리된 케이스 합치기
  const normalized = content
    .replace(/&nbsp;/g, " ")
    .replace(/\r\n/g, "\n")
    // "숫자 \n . " → "숫자. " (드물지만 실제 표본에 존재)
    .replace(/(\d)\s*\n\s*\.\s*/g, "$1. ");

  const lines = normalized.split("\n");

  const data: ParsedCafeGame = {};
  const labels: string[] = [];
  let matchedLines = 0;

  // 라벨별 첫 매칭만 채택 (중복 라인 시 첫 줄 우선)
  // 단 notes 는 마지막 라벨 이후 모든 라인을 합치므로 별도 처리.
  let notesStartIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parsed = splitLine(line);
    if (!parsed) continue;

    const key = classifyLabel(parsed.label);
    if (!key || key === "skip") continue;

    matchedLines++;
    labels.push(parsed.rawLabel);

    if (key === "notes") {
      // notes 라벨을 만난 시점부터 본문 끝까지가 자유 텍스트
      const tail = [parsed.value, ...lines.slice(i + 1)]
        .map((l) => l.trim())
        .filter(Boolean)
        .join("\n");
      if (tail) data.notes = tail;
      notesStartIdx = i;
      break; // notes 이후는 더 파싱하지 않음
    }

    if (data[key as keyof ParsedCafeGame] !== undefined) continue; // 첫 매칭만

    if (key === "homeTeamName") {
      const v = parsed.value.trim();
      if (v) data.homeTeamName = v;
    } else if (key === "scheduledAt") {
      const dt = parseScheduledAt(parsed.value, referenceDate);
      if (dt) data.scheduledAt = dt;
    } else if (key === "venueName") {
      const v = parsed.value.trim();
      if (v) {
        data.venueName = v;
        const loc = parseLocation(v);
        if (loc.city) data.city = loc.city;
        if (loc.district) data.district = loc.district;
      }
    } else if (key === "format") {
      const v = parsed.value.trim();
      if (v) data.format = v;
    } else if (key === "guestCount") {
      const n = parseGuestCount(parsed.value);
      if (n !== undefined) data.guestCount = n;
    } else if (key === "feePerPerson") {
      const n = parseFee(parsed.value);
      if (n !== undefined) data.feePerPerson = n;
    } else if (key === "contact") {
      const v = parsed.value.trim();
      if (v) data.contact = v;
    } else if (key === "requiredInfo") {
      const v = parsed.value.trim();
      if (v) data.requiredInfo = v;
    }
  }

  // notes 가 별도 라벨로 잡히지 않았는데 본문 후반부에 자유 텍스트가 있으면 무시
  // (현재 표본에는 notes 없는 케이스가 많고, 잘못 잡으면 노이즈가 큼)
  void notesStartIdx;

  // 게임 유형 추론 — 키워드 + guestCount 신호. null 가능 (분류 불가)
  // 백필 시 null 인 경우 game_type 컬럼은 건드리지 않는다 (덮어쓰기 금지).
  data.gameType = inferGameType(data, normalized);

  return {
    data,
    stats: {
      matchedLines,
      totalLines: lines.length,
      labels,
    },
  };
}
