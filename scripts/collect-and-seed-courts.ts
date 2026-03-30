/**
 * collect-and-seed-courts.ts
 *
 * 카카오 로컬 API로 전국 농구장을 검색하여 DB에 직접 등록하는 통합 스크립트.
 * v2 지시서 기반: 전국 72개 지역 x 3개 키워드 조합 검색.
 *
 * 원칙:
 * - 카카오 API가 반환한 실제 데이터만 저장 (추측 금지)
 * - 바닥재질, 골대수, 조명시간 등 API에 없는 정보는 null
 * - rate limit 250ms, 에러 시 건너뛰기
 * - kakao_place_id + 좌표 50m 이내 중복 체크
 *
 * 실행: npx tsx scripts/collect-and-seed-courts.ts
 */

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const KAKAO_KEY = process.env.KAKAO_REST_API_KEY;

// ─── v2 문서 그대로: 검색 대상 72개 지역 ─────────────────
const REGIONS = [
  // 서울 25개 구
  "서울 종로구", "서울 중구", "서울 용산구", "서울 성동구",
  "서울 광진구", "서울 동대문구", "서울 중랑구", "서울 성북구",
  "서울 강북구", "서울 도봉구", "서울 노원구", "서울 은평구",
  "서울 서대문구", "서울 마포구", "서울 양천구", "서울 강서구",
  "서울 구로구", "서울 금천구", "서울 영등포구", "서울 동작구",
  "서울 관악구", "서울 서초구", "서울 강남구", "서울 송파구",
  "서울 강동구",
  // 경기도 주요 시
  "경기 수원시", "경기 성남시", "경기 고양시", "경기 용인시",
  "경기 부천시", "경기 안양시", "경기 안산시", "경기 남양주시",
  "경기 화성시", "경기 평택시", "경기 의정부시", "경기 시흥시",
  "경기 파주시", "경기 광명시", "경기 김포시", "경기 군포시",
  "경기 광주시", "경기 이천시", "경기 양주시", "경기 오산시",
  "경기 구리시", "경기 하남시", "경기 포천시", "경기 동두천시",
  // 인천
  "인천 부평구", "인천 남동구", "인천 연수구", "인천 서구",
  "인천 미추홀구", "인천 계양구", "인천 중구",
  // 광역시
  "부산 해운대구", "부산 수영구", "부산 동래구", "부산 사하구", "부산 북구",
  "대구 수성구", "대구 달서구", "대구 북구", "대구 중구",
  "대전 유성구", "대전 서구", "대전 중구",
  "광주 북구", "광주 서구", "광주 남구",
  "울산 남구", "울산 중구",
  // 주요 도시
  "창원시", "천안시", "전주시", "청주시", "포항시", "제주시",
];

// v2 문서 그대로: 검색 키워드 3개
const KEYWORDS = ["농구장", "야외농구장", "농구코트"];

// ─── 헬퍼 함수들 ──────────────────────────────────────────

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

/** 실내/실외 자동 분류 — 확실하지 않으면 unknown */
function classifyCourtType(
  name: string,
  categoryName: string
): "indoor" | "outdoor" | "unknown" {
  const combined = `${name} ${categoryName}`.toLowerCase();

  // 확실한 실외 키워드
  if (
    combined.includes("야외") || combined.includes("공원 농구") ||
    combined.includes("한강") || combined.includes("스트릿") ||
    combined.includes("길거리") || combined.includes("하천")
  ) {
    return "outdoor";
  }
  // 확실한 실내 키워드
  if (
    combined.includes("체육관") || combined.includes("스포츠센터") ||
    combined.includes("실내") || combined.includes("gym") ||
    combined.includes("짐")
  ) {
    return "indoor";
  }
  // 불확실하면 unknown — 추측 금지
  return "unknown";
}

/** 주소에서 city, district 추출 */
function parseAddress(address: string): { city: string; district: string | null } {
  const parts = address.split(" ");
  let city = parts[0] || "기타";
  let district: string | null = parts[1] || null;

  // 도 단위(경기, 경기도)는 다음 단어(시)로 변환
  if (city === "경기" || city === "경기도") {
    city = parts[1]?.replace("시", "") || "경기";
    district = parts[2] || null;
  } else if (city === "인천" || city === "인천광역시") {
    city = "인천";
    district = parts[1] || null;
  } else if (city === "부산" || city === "부산광역시") {
    city = "부산";
    district = parts[1] || null;
  } else if (city === "대구" || city === "대구광역시") {
    city = "대구";
    district = parts[1] || null;
  } else if (city === "대전" || city === "대전광역시") {
    city = "대전";
    district = parts[1] || null;
  } else if (city === "광주" || city === "광주광역시") {
    city = "광주";
    district = parts[1] || null;
  } else if (city === "울산" || city === "울산광역시") {
    city = "울산";
    district = parts[1] || null;
  } else if (city === "충남" || city === "충청남도" || city === "경남" || city === "경상남도" ||
             city === "전북" || city === "전라북도" || city === "충북" || city === "충청북도" ||
             city === "경북" || city === "경상북도" || city === "제주" || city === "제주특별자치도") {
    // 도 단위는 시 이름으로 변환
    city = parts[1]?.replace("시", "") || city;
    district = parts[2] || null;
  }

  return { city, district };
}

// ─── 비농구장 필터링 ────────────────────────────────────

const EXCLUDE_KEYWORDS = [
  "축구", "풋살", "테니스", "배드민턴", "볼링", "당구",
  "탁구", "골프", "수영", "헬스", "피트니스", "요가",
  "태권도", "검도", "유도", "권투", "복싱",
  "야구", "소프트볼", "족구", "배구",
  "카페", "식당", "마트", "편의점",
  "학원", "유치원", "어린이집", "병원", "약국",
];

/** 농구 관련 장소인지 판별 */
function isBasketballRelated(name: string, category: string): boolean {
  const combined = `${name} ${category}`.toLowerCase();

  // 명시적 제외 종목이 이름에 포함되면 제거
  for (const kw of EXCLUDE_KEYWORDS) {
    if (name.includes(kw)) return false;
  }

  // "농구"가 포함되면 확실히 관련
  if (combined.includes("농구")) return true;

  // 체육관/스포츠센터 등은 포함하되 courtType을 unknown으로 처리
  if (
    combined.includes("체육관") || combined.includes("스포츠센터") ||
    combined.includes("체육공원") || combined.includes("종합운동장")
  ) {
    return true;
  }

  return false;
}

// ─── 카카오 API 호출 ─────────────────────────────────────

interface KakaoResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
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
    try {
      const url =
        `https://dapi.kakao.com/v2/local/search/keyword.json?` +
        `query=${encodeURIComponent(region + " " + keyword)}` +
        `&size=15&page=${page}`;

      const res = await fetch(url, {
        headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
      });

      if (!res.ok) {
        console.error(`  API 오류 (${res.status}): ${region} ${keyword} p${page}`);
        break; // 에러 시 다음 키워드로
      }

      const data = await res.json();

      if (data.documents) {
        for (const doc of data.documents) {
          results.push({
            name: doc.place_name,
            address: doc.road_address_name || doc.address_name,
            latitude: parseFloat(doc.y),
            longitude: parseFloat(doc.x),
            phone: doc.phone || null,
            kakaoPlaceId: doc.id,
            kakaoPlaceUrl: doc.place_url,
            categoryName: doc.category_name || "",
          });
        }
      }

      isEnd = data.meta?.is_end ?? true;
      page++;
    } catch (err: any) {
      console.error(`  네트워크 오류: ${region} ${keyword} p${page} — ${err.message}`);
      break; // 에러 시 건너뛰기
    }

    // 카카오 API rate limit 방지: 250ms 대기
    await sleep(250);
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
    // 2. 좌표 50m 이내 (같은 장소로 판단)
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

// ─── 메인 실행 ──────────────────────────────────────────

async function main() {
  console.log("=== 카카오 전국 농구장 수집 + DB 등록 시작 ===\n");

  // 환경변수 확인
  if (!KAKAO_KEY) {
    console.error("ERROR: .env에 KAKAO_REST_API_KEY가 없습니다.");
    process.exit(1);
  }

  // user_id 결정: DB에서 첫 번째 유저 조회, 없으면 1 사용
  let systemUserId = BigInt(1);
  try {
    const firstUser = await prisma.users.findFirst({
      orderBy: { id: "asc" },
      select: { id: true },
    });
    if (firstUser) {
      systemUserId = firstUser.id;
      console.log(`시스템 유저 ID: ${systemUserId}`);
    }
  } catch {
    console.log("유저 조회 실패, user_id=1 사용");
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
  console.log(`기존 DB 코트: ${existingCourts.length}개`);
  console.log(`검색 대상: ${REGIONS.length}개 지역 x ${KEYWORDS.length}개 키워드 = ${REGIONS.length * KEYWORDS.length}회\n`);

  // ── Phase 1: 카카오 API로 전체 수집 ──
  const allResults: KakaoResult[] = [];
  const seenPlaceIds = new Set<string>();
  let searchCount = 0;
  let totalRawResults = 0;
  let filteredOut = 0;
  let apiDuplicates = 0;

  for (const region of REGIONS) {
    for (const keyword of KEYWORDS) {
      const results = await searchRegion(region, keyword);
      searchCount++;
      totalRawResults += results.length;

      for (const r of results) {
        // 카카오 ID 기준 중복 제거 (검색 결과 간)
        if (seenPlaceIds.has(r.kakaoPlaceId)) {
          apiDuplicates++;
          continue;
        }

        // 비농구장 필터링
        if (!isBasketballRelated(r.name, r.categoryName)) {
          filteredOut++;
          continue;
        }

        seenPlaceIds.add(r.kakaoPlaceId);
        allResults.push(r);
      }
    }
    // 지역별 진행 상황 출력
    console.log(`  ${region} 완료 — 누적 ${allResults.length}개 수집`);
  }

  console.log(
    `\n수집 완료: ${searchCount}회 API 호출, 원본 ${totalRawResults}개, ` +
    `필터링 제외 ${filteredOut}개, API 내 중복 ${apiDuplicates}개, ` +
    `최종 후보 ${allResults.length}개\n`
  );

  // ── Phase 2: DB 기존 데이터와 중복 제거 후 등록 ──
  const newCourts = allResults.filter((r) => !isDuplicate(existingCourts, r));
  const dbDuplicates = allResults.length - newCourts.length;
  console.log(`DB 중복 제거: ${dbDuplicates}개 → 신규 등록 대상: ${newCourts.length}개\n`);

  let created = 0;
  let errors = 0;

  for (const court of newCourts) {
    const courtType = classifyCourtType(court.name, court.categoryName);
    const { city, district } = parseAddress(court.address);

    try {
      await prisma.court_infos.create({
        data: {
          name: court.name,
          // road_address 우선, 카카오 카테고리는 description에 저장
          address: court.address,
          description: court.categoryName || null, // category_name 필드 없으므로 description에 저장
          city,
          district,
          latitude: new Prisma.Decimal(court.latitude),
          longitude: new Prisma.Decimal(court.longitude),
          court_type: courtType,
          // 카카오 API에 없는 정보는 null/기본값 — 추측 금지
          is_free: true,          // 기본값
          has_lighting: false,    // 기본값
          has_restroom: false,    // 기본값
          has_parking: false,     // 기본값
          kakao_place_id: court.kakaoPlaceId,
          kakao_place_url: court.kakaoPlaceUrl,
          data_source: "kakao_search",
          verified: false,
          user_id: systemUserId,
          status: "active",
          // phone은 별도 필드 없으므로 metadata에 저장
          metadata: court.phone ? { phone: court.phone } : {},
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
      // 유니크 제약 등 에러 시 건너뛰기
      errors++;
      if (errors <= 5) {
        console.error(`  에러 [${court.name}]: ${err.message?.substring(0, 100)}`);
      }
    }
  }

  // ── Phase 3: 최종 통계 ──
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

  console.log("\n============================");
  console.log("실행 결과 통계");
  console.log("============================");
  console.log(`API 호출: ${searchCount}회`);
  console.log(`원본 결과: ${totalRawResults}개`);
  console.log(`비농구장 필터링: ${filteredOut}개`);
  console.log(`API 내 중복: ${apiDuplicates}개`);
  console.log(`DB 중복: ${dbDuplicates}개`);
  console.log(`신규 등록: ${created}개`);
  console.log(`에러/건너뜀: ${errors}개`);
  console.log("");
  console.log("DB 전체 현황:");
  console.log(`  전체: ${total}개`);
  console.log(`  야외: ${outdoor}개 | 실내: ${indoor}개 | 미분류: ${unknown}개`);
  console.log(`  카카오 검색: ${kakao}개`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
