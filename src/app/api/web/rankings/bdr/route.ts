import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { apiSuccess, apiError } from "@/lib/api/response";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";

/**
 * GET /api/web/rankings/bdr?division=general|university
 *
 * 외부 BDR 랭킹 데이터를 GitHub에서 가져와 JSON으로 반환하는 API
 * - GitHub 저장소의 xlsx 파일을 fetch하여 서버에서 파싱
 * - 클라이언트는 가벼운 JSON만 받으면 됨 (xlsx 라이브러리 다운로드 불필요)
 * - 10분 인메모리 캐시로 GitHub 요청 최소화
 */

// --- 타입 정의 ---

// BDR 랭킹 항목 (프론트로 내려줄 형태)
interface BdrRankingItem {
  rank: number;
  team: string;
  city: string;
  score: number;
  move: number;
  scoreChange: number;
}

// 인메모리 캐시 구조
interface CacheEntry {
  data: BdrRankingItem[];
  fetchedAt: number; // 캐시 저장 시점 (ms)
}

// --- GitHub xlsx 파일 URL ---
const GITHUB_URLS: Record<string, string> = {
  general:
    "https://raw.githubusercontent.com/cobby8/BDR-ranking-d/main/division_rank.xlsx",
  university:
    "https://raw.githubusercontent.com/cobby8/BDR-ranking-u/main/divisionU_rank.xlsx",
};

// --- 인메모리 캐시 (10분 = 600,000ms) ---
const CACHE_TTL = 10 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

/**
 * 엑셀 헤더를 표준 필드명으로 매핑하는 함수
 * - 외부 엑셀의 헤더가 한글/영문 여러 형태일 수 있으므로
 *   후보 목록에서 자동 감지하여 매핑
 */
function findColumnKey(
  headers: string[],
  candidates: string[]
): string | null {
  // 헤더 목록에서 후보와 일치하는 첫 번째 키를 반환
  for (const h of headers) {
    const normalized = h.trim().toLowerCase();
    if (candidates.includes(normalized)) return h;
  }
  return null;
}

/**
 * xlsx 바이너리 데이터를 파싱하여 BdrRankingItem 배열로 변환
 */
function parseXlsx(buffer: ArrayBuffer): BdrRankingItem[] {
  // xlsx 라이브러리로 워크북 읽기
  const workbook = XLSX.read(buffer, { type: "array" });
  // 첫 번째 시트 사용
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  // 시트를 JSON 배열로 변환 (첫 행이 헤더)
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  if (rows.length === 0) return [];

  // 헤더 자동 감지: 첫 번째 행의 키들에서 각 필드에 해당하는 컬럼명 찾기
  const headers = Object.keys(rows[0]);
  const rankKey = findColumnKey(headers, [
    "rank", "랭킹", "순위", "ranking",
  ]);
  const teamKey = findColumnKey(headers, [
    "team", "팀", "팀명", "name", "팀이름",
  ]);
  const cityKey = findColumnKey(headers, [
    "city", "지역", "연고", "도시", "연고지",
  ]);
  const scoreKey = findColumnKey(headers, [
    "score", "점수", "포인트", "point", "rating",
  ]);
  const moveKey = findColumnKey(headers, [
    "move", "랭킹 변화", "증감", "변동", "순위변동", "순위 변화",
  ]);
  const scoreChangeKey = findColumnKey(headers, [
    "scorechange", "점수 변화", "점수변화", "점수 증감", "점수증감",
  ]);

  // 각 행을 BdrRankingItem으로 변환
  return rows
    .map((row, idx) => ({
      // rank 컬럼이 없으면 인덱스 기반 순위 부여
      rank: rankKey ? Number(row[rankKey]) || idx + 1 : idx + 1,
      team: teamKey ? String(row[teamKey] ?? "") : "",
      city: cityKey ? String(row[cityKey] ?? "") : "",
      // 점수는 소수점 1자리까지 유지
      score: scoreKey
        ? Math.round((Number(row[scoreKey]) || 0) * 10) / 10
        : 0,
      move: moveKey ? Number(row[moveKey]) || 0 : 0,
      scoreChange: scoreChangeKey
        ? Math.round((Number(row[scoreChangeKey]) || 0) * 10) / 10
        : 0,
    }))
    // 팀명이 비어있는 행은 제외 (빈 줄 등)
    .filter((item) => item.team.trim() !== "");
}

/**
 * GitHub에서 xlsx 파일을 가져와 파싱 (캐시 적용)
 */
async function fetchBdrRankings(
  division: string
): Promise<BdrRankingItem[]> {
  // 캐시 확인: TTL 이내면 캐시 데이터 반환
  const cached = cache.get(division);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data;
  }

  const url = GITHUB_URLS[division];
  if (!url) return [];

  // GitHub raw URL에서 xlsx 파일을 바이너리로 fetch
  const response = await fetch(url, {
    // Next.js fetch 캐시도 10분 설정 (인메모리 캐시와 이중 안전장치)
    next: { revalidate: 600 },
  });

  if (!response.ok) {
    console.error(
      `[BDR Rankings] GitHub fetch 실패: ${response.status} ${response.statusText}`
    );
    // 이전 캐시가 있으면 만료되어도 반환 (GitHub 일시 장애 대비)
    return cached?.data ?? [];
  }

  const buffer = await response.arrayBuffer();
  const data = parseXlsx(buffer);

  // 캐시 저장
  cache.set(division, { data, fetchedAt: Date.now() });

  return data;
}

// --- API 핸들러 ---

export async function GET(request: NextRequest) {
  // 공개 API — IP 기반 rate limit (분당 100회)
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`web-rankings-bdr:${ip}`, RATE_LIMITS.api);
  if (!rl.allowed) {
    return apiError("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", 429);
  }

  try {
    const { searchParams } = request.nextUrl;
    // division 파라미터: "general" 또는 "university" (기본값 "general")
    const division = searchParams.get("division") || "general";

    // 허용된 division 값 검증
    if (!["general", "university"].includes(division)) {
      return apiError("유효하지 않은 division 값입니다.", 400, "INVALID_PARAM");
    }

    const rankings = await fetchBdrRankings(division);

    // 응답: 랭킹 배열 + division 정보 + 마지막 갱신 시각
    const cached = cache.get(division);
    const res = apiSuccess({
      rankings,
      division,
      updatedAt: cached
        ? new Date(cached.fetchedAt).toISOString()
        : new Date().toISOString(),
    });

    // 10분 브라우저/CDN 캐시
    res.headers.set(
      "Cache-Control",
      "public, s-maxage=600, max-age=600"
    );
    return res;
  } catch (error) {
    console.error("[GET /api/web/rankings/bdr] Error:", error);
    // 에러 시에도 빈 배열로 응답 (페이지가 깨지지 않도록)
    return apiSuccess({ rankings: [], division: "general", updatedAt: null });
  }
}
