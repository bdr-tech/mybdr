/**
 * discover-courts-kakao.ts
 *
 * 카카오 키워드 검색 API로 서울 25개 구 + 수도권 주요 시에서
 * 농구장을 검색하여 기존 DB에 없는 코트만 추가 등록한다.
 *
 * - 중복 제거: 이름 포함 관계 + 좌표 50m 이내
 * - 실내/실외 자동 분류
 * - rate limit: 200ms 간격
 *
 * 실행: npx tsx scripts/discover-courts-kakao.ts
 */

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const KAKAO_KEY = process.env.KAKAO_REST_API_KEY;

// ─── 검색 대상 지역 ─────────────────────────────────────

const REGIONS = [
  // 서울 25개 구
  "서울 종로구", "서울 중구", "서울 용산구", "서울 성동구",
  "서울 광진구", "서울 동대문구", "서울 중랑구", "서울 성북구",
  "서울 강북구", "서울 도봉구", "서울 노원구", "서울 은평구",
  "서울 서대문구", "서울 마포구", "서울 양천구", "서울 강서구",
  "서울 구로구", "서울 금천구", "서울 영등포구", "서울 동작구",
  "서울 관악구", "서울 서초구", "서울 강남구", "서울 송파구",
  "서울 강동구",
  // 수도권 주요 도시
  "구리시", "하남시", "성남시 분당구", "수원시 영통구",
  "고양시 일산서구", "인천 부평구", "안양시 동안구", "부천시",
];

// 농구장을 찾기 위한 키워드
const KEYWORDS = ["농구장", "야외농구장", "농구코트"];

// ─── 헬퍼 함수 ──────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** 두 좌표 간 거리 (미터) — Haversine 공식 */
function getDistanceMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // 지구 반지름 (미터)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 실내/실외 자동 분류 */
function classifyCourtType(
  name: string,
  categoryName: string
): "indoor" | "outdoor" | "unknown" {
  const n = name.toLowerCase();
  const c = categoryName.toLowerCase();

  // 실외 키워드
  if (
    n.includes("야외") || n.includes("공원") || n.includes("한강") ||
    n.includes("스트릿") || n.includes("길거리") || n.includes("하천")
  ) {
    return "outdoor";
  }
  // 실내 키워드
  if (
    n.includes("체육관") || n.includes("스포츠센터") || n.includes("실내") ||
    n.includes("gym") || n.includes("센터") ||
    c.includes("체육관") || c.includes("스포츠시설")
  ) {
    return "indoor";
  }
  return "unknown";
}

/** 주소에서 city, district 추출 */
function parseAddress(address: string): { city: string; district: string | null } {
  // "서울 성동구 ..." → city="서울", district="성동구"
  // "경기 성남시 분당구 ..." → city="성남", district="분당구"
  const parts = address.split(" ");
  let city = parts[0] || "기타";
  let district: string | null = parts[1] || null;

  // 도 단위는 시로 변환
  if (city === "경기" || city === "경기도") {
    city = parts[1]?.replace("시", "") || "경기";
    district = parts[2] || null;
  } else if (city === "인천" || city === "인천광역시") {
    city = "인천";
    district = parts[1] || null;
  }

  return { city, district };
}

// ─── 카카오 키워드 검색 ─────────────────────────────────

interface KakaoResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  kakaoPlaceId: string;
  kakaoPlaceUrl: string;
  categoryName: string;
}

async function searchRegion(
  region: string,
  keyword: string
): Promise<KakaoResult[]> {
  const results: KakaoResult[] = [];
  let page = 1;
  let isEnd = false;

  while (!isEnd && page <= 3) {
    // 최대 3페이지 (45건)
    const url =
      `https://dapi.kakao.com/v2/local/search/keyword.json?` +
      `query=${encodeURIComponent(region + " " + keyword)}` +
      `&size=15&page=${page}`;

    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
    });
    const data = await res.json();

    if (data.documents) {
      for (const doc of data.documents) {
        results.push({
          name: doc.place_name,
          address: doc.road_address_name || doc.address_name,
          latitude: parseFloat(doc.y),
          longitude: parseFloat(doc.x),
          phone: doc.phone || undefined,
          kakaoPlaceId: doc.id,
          kakaoPlaceUrl: doc.place_url,
          categoryName: doc.category_name || "",
        });
      }
    }

    isEnd = data.meta?.is_end ?? true;
    page++;
    await sleep(200); // rate limit
  }

  return results;
}

// ─── 중복 체크 ──────────────────────────────────────────

interface ExistingCourt {
  name: string;
  latitude: number;
  longitude: number;
  kakao_place_id: string | null;
}

function isDuplicate(
  existing: ExistingCourt[],
  candidate: KakaoResult
): boolean {
  for (const court of existing) {
    // 1. 카카오 ID 동일
    if (court.kakao_place_id && court.kakao_place_id === candidate.kakaoPlaceId) {
      return true;
    }
    // 2. 이름 포함 관계
    if (
      court.name.includes(candidate.name) ||
      candidate.name.includes(court.name)
    ) {
      return true;
    }
    // 3. 좌표 50m 이내
    if (court.latitude && candidate.latitude) {
      const dist = getDistanceMeters(
        court.latitude, court.longitude,
        candidate.latitude, candidate.longitude
      );
      if (dist < 50) return true;
    }
  }
  return false;
}

// ─── 비농구장 필터링 ────────────────────────────────────

/** 농구와 관련 없는 장소를 걸러낸다 */
function isNotBasketball(name: string, category: string): boolean {
  const exclude = [
    "축구", "야구", "테니스", "배드민턴", "탁구", "볼링",
    "수영", "골프", "스쿼시", "클라이밍", "요가", "필라테스",
    "헬스", "피트니스", "카페", "식당", "마트", "편의점",
    "학원", "유치원", "어린이집", "병원", "약국",
  ];
  const n = name.toLowerCase();
  const c = category.toLowerCase();
  return exclude.some((kw) => n.includes(kw) || c.includes(kw));
}

// ─── 메인 실행 ──────────────────────────────────────────

async function main() {
  console.log("=== 카카오 키워드 검색으로 농구장 발견 시작 ===\n");

  if (!KAKAO_KEY) {
    console.error("KAKAO_REST_API_KEY 환경변수가 필요합니다.");
    process.exit(1);
  }

  // 기존 코트 목록 로드 (중복 체크용)
  const existingRaw = await prisma.court_infos.findMany({
    where: { status: "active" },
    select: {
      name: true,
      latitude: true,
      longitude: true,
      kakao_place_id: true,
    },
  });
  const existingCourts: ExistingCourt[] = existingRaw.map((c) => ({
    name: c.name,
    latitude: Number(c.latitude),
    longitude: Number(c.longitude),
    kakao_place_id: c.kakao_place_id,
  }));
  console.log(`기존 DB 코트: ${existingCourts.length}개\n`);

  // 전체 검색 결과 수집
  const allResults: KakaoResult[] = [];
  const seenPlaceIds = new Set<string>();
  let searchCount = 0;

  for (const region of REGIONS) {
    for (const keyword of KEYWORDS) {
      const results = await searchRegion(region, keyword);
      searchCount++;

      for (const r of results) {
        // 카카오 ID 기준 중복 제거 (검색 결과 간)
        if (seenPlaceIds.has(r.kakaoPlaceId)) continue;
        seenPlaceIds.add(r.kakaoPlaceId);

        // 비농구장 필터링
        if (isNotBasketball(r.name, r.categoryName)) continue;

        allResults.push(r);
      }

      // 진행률 표시 (10회마다)
      if (searchCount % 10 === 0) {
        console.log(
          `  검색 진행: ${searchCount}/${REGIONS.length * KEYWORDS.length} ` +
          `(발견: ${allResults.length}개)`
        );
      }
    }
  }

  console.log(
    `\n검색 완료: ${searchCount}회 API 호출, ${allResults.length}개 후보 발견\n`
  );

  // DB 기존 데이터와 중복 제거
  const newCourts = allResults.filter((r) => !isDuplicate(existingCourts, r));
  console.log(
    `중복 제거 후 신규 코트: ${newCourts.length}개 ` +
    `(${allResults.length - newCourts.length}개 중복)\n`
  );

  // DB 등록
  let created = 0;
  let errors = 0;

  for (const court of newCourts) {
    const courtType = classifyCourtType(court.name, court.categoryName);
    const { city, district } = parseAddress(court.address);

    try {
      await prisma.court_infos.create({
        data: {
          name: court.name,
          address: court.address,
          city,
          district,
          latitude: new Prisma.Decimal(court.latitude),
          longitude: new Prisma.Decimal(court.longitude),
          court_type: courtType,
          is_free: true, // 기본값: 무료 (확인 필요)
          has_lighting: false, // 기본값: 조명 없음 (확인 필요)
          kakao_place_id: court.kakaoPlaceId,
          kakao_place_url: court.kakaoPlaceUrl,
          data_source: "kakao_search",
          verified: false,
          user_id: BigInt(1), // 시스템 유저
          status: "active",
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      created++;

      // 중복 체크 리스트에 추가 (후속 항목과의 중복 방지)
      existingCourts.push({
        name: court.name,
        latitude: court.latitude,
        longitude: court.longitude,
        kakao_place_id: court.kakaoPlaceId,
      });
    } catch (err: any) {
      // 유니크 제약 등 에러 시 건너뜀
      errors++;
    }
  }

  console.log(`\n=== 결과 ===`);
  console.log(`신규 등록: ${created}개`);
  console.log(`에러/건너뜀: ${errors}개`);

  // 최종 통계
  const total = await prisma.court_infos.count({ where: { status: "active" } });
  const outdoor = await prisma.court_infos.count({
    where: { status: "active", court_type: "outdoor" },
  });
  const indoor = await prisma.court_infos.count({
    where: { status: "active", court_type: "indoor" },
  });
  const unknown = await prisma.court_infos.count({
    where: { status: "active", court_type: "unknown" },
  });
  const kakao = await prisma.court_infos.count({
    where: { status: "active", data_source: "kakao_search" },
  });
  const curated = await prisma.court_infos.count({
    where: { status: "active", data_source: "manual_curation" },
  });

  console.log(`\n=== 최종 통계 ===`);
  console.log(`전체: ${total}개`);
  console.log(`  야외: ${outdoor}개 | 실내: ${indoor}개 | 미분류: ${unknown}개`);
  console.log(`  카카오 검색: ${kakao}개 | 큐레이션: ${curated}개 | Google: ${total - kakao - curated}개`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
