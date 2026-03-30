/**
 * 날짜/시간 포맷 공통 유틸
 *
 * 프로젝트 전체에서 날짜 표시를 통일하기 위한 함수 모음.
 * 각 파일에서 제각각 포맷하던 것을 이 파일로 통일한다.
 */

// 요일 배열 (일~토)
const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"] as const;

/**
 * Date 또는 ISO 문자열을 안전하게 Date 객체로 변환
 * null/undefined/빈 문자열이면 null 반환
 */
function toDate(date: Date | string | null | undefined): Date | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  // 유효하지 않은 날짜 체크
  if (isNaN(d.getTime())) return null;
  return d;
}

/**
 * "3/22(토)" 형식 — 카드/목록에서 간결한 날짜 표시
 */
export function formatShortDate(date: Date | string | null | undefined): string {
  const d = toDate(date);
  if (!d) return "";
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayName = DAY_NAMES[d.getDay()];
  return `${month}/${day}(${dayName})`;
}

/**
 * "19:00" 24시간제 — 카드/목록에서 간결한 시간 표시
 */
export function formatShortTime(date: Date | string | null | undefined): string {
  const d = toDate(date);
  if (!d) return "--:--";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * 오늘이면 "오늘 19:00", 내일이면 "내일 14:00", 그 외 "3/22 19:00"
 * — 가까운 경기에서 상대적 시간 표시
 */
export function formatRelativeDateTime(date: Date | string | null | undefined): string {
  const d = toDate(date);
  if (!d) return "";

  const now = new Date();
  const time = formatShortTime(d);

  // 오늘/내일 판별: 연-월-일 비교 (시간 무관)
  const todayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const targetStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  if (todayStr === targetStr) {
    return `오늘 ${time}`;
  }

  // 내일 판별
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${tomorrow.getMonth()}-${tomorrow.getDate()}`;

  if (targetStr === tomorrowStr) {
    return `내일 ${time}`;
  }

  // 그 외: "3/22 19:00"
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}/${day} ${time}`;
}

/**
 * "3/22(토) ~ 3/24(월)" 기간 표시 — 대회 기간용
 * start와 end가 같은 날이면 "3/22(토)"만 표시
 */
export function formatDateRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
): string {
  const s = toDate(start);
  if (!s) return "";

  const startStr = formatShortDate(s);
  const e = toDate(end);

  // end가 없거나 start와 같은 날이면 start만 표시
  if (!e || s.toDateString() === e.toDateString()) {
    return startStr;
  }

  const endStr = formatShortDate(e);
  return `${startStr} ~ ${endStr}`;
}

/**
 * "3월 22일 토요일" 형식 — 타임라인 날짜 그룹 헤더용
 * 기존 toLocaleDateString("ko-KR", { year, month, day, weekday }) 대체
 */
export function formatGroupDate(date: Date | string | null | undefined): string {
  const d = toDate(date);
  if (!d) return "일정 미정";
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayName = DAY_NAMES[d.getDay()];
  return `${month}월 ${day}일 ${dayName}요일`;
}
