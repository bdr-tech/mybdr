/**
 * 실제 농구장 데이터 수집 스크립트
 *
 * 1. 기존 data_source="seed"인 가짜 시드 데이터를 삭제
 * 2. 카카오 로컬 API로 전국 농구장을 검색하여 DB에 삽입
 * 3. 카카오 API 실패 시 Google Places API로 대체
 *
 * 실행: npx tsx scripts/fetch-real-courts.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─────────────────────────────────────────
// 환경변수에서 API 키 가져오기
// ─────────────────────────────────────────
const KAKAO_REST_KEY = process.env.KAKAO_CLIENT_ID; // 카카오 REST API 키
const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;

// ─────────────────────────────────────────
// 지역별 검색 좌표 (중심점 + 반경으로 검색 범위 제한)
// ─────────────────────────────────────────
const REGIONS = [
  { name: "서울", x: 126.978, y: 37.5665 },
  { name: "경기 수원", x: 127.0286, y: 37.2636 },
  { name: "경기 고양", x: 126.832, y: 37.6584 },
  { name: "경기 성남", x: 127.1378, y: 37.4449 },
  { name: "경기 용인", x: 127.1775, y: 37.2411 },
  { name: "인천", x: 126.7052, y: 37.4563 },
  { name: "부산", x: 129.0756, y: 35.1796 },
  { name: "대구", x: 128.6014, y: 35.8714 },
  { name: "광주", x: 126.8526, y: 35.1595 },
  { name: "대전", x: 127.3845, y: 36.3504 },
  { name: "울산", x: 129.3114, y: 35.5384 },
  { name: "세종", x: 127.0, y: 36.48 },
  { name: "강원 춘천", x: 127.7295, y: 37.8813 },
  { name: "충북 청주", x: 127.4872, y: 36.6424 },
  { name: "충남 천안", x: 127.1522, y: 36.8151 },
  { name: "전북 전주", x: 127.149, y: 35.8242 },
  { name: "전남 목포", x: 126.3922, y: 34.8118 },
  { name: "경북 포항", x: 129.3439, y: 36.019 },
  { name: "경남 창원", x: 128.6811, y: 35.2281 },
  { name: "제주", x: 126.5312, y: 33.4996 },
];

// 검색 키워드 목록 (다양한 표현으로 검색)
const KEYWORDS = ["농구장", "농구코트", "체육관 농구"];

// ─────────────────────────────────────────
// 카카오 로컬 API로 키워드 검색
// ─────────────────────────────────────────
interface KakaoPlace {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string; // longitude
  y: string; // latitude
  category_name: string;
  category_group_code: string;
}

interface KakaoResponse {
  documents: KakaoPlace[];
  meta: { is_end: boolean; total_count: number; pageable_count: number };
}

async function searchKakao(
  keyword: string,
  x: number,
  y: number,
  page: number = 1
): Promise<KakaoResponse | null> {
  const url = new URL(
    "https://dapi.kakao.com/v2/local/search/keyword.json"
  );
  url.searchParams.set("query", keyword);
  url.searchParams.set("x", String(x));
  url.searchParams.set("y", String(y));
  url.searchParams.set("radius", "20000"); // 20km 반경
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", "15");

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` },
    });

    if (!res.ok) {
      console.error(`카카오 API 오류: ${res.status} ${res.statusText}`);
      return null;
    }

    return (await res.json()) as KakaoResponse;
  } catch (err) {
    console.error(`카카오 API 요청 실패:`, err);
    return null;
  }
}

// ─────────────────────────────────────────
// Google Places Text Search API
// ─────────────────────────────────────────
interface GooglePlace {
  name: string;
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
  types: string[];
  place_id: string;
}

interface GoogleResponse {
  results: GooglePlace[];
  next_page_token?: string;
  status: string;
}

async function searchGoogle(
  query: string,
  lat: number,
  lng: number
): Promise<GooglePlace[]> {
  const results: GooglePlace[] = [];
  let pageToken: string | undefined;

  // 최대 3페이지 (60건)
  for (let i = 0; i < 3; i++) {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/textsearch/json"
    );
    url.searchParams.set("query", query);
    url.searchParams.set("location", `${lat},${lng}`);
    url.searchParams.set("radius", "30000");
    url.searchParams.set("language", "ko");
    url.searchParams.set("key", GOOGLE_PLACES_KEY!);
    if (pageToken) {
      url.searchParams.set("pagetoken", pageToken);
    }

    try {
      const res = await fetch(url.toString());
      const data = (await res.json()) as GoogleResponse;

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        console.error(`Google API 오류: ${data.status}`);
        break;
      }

      results.push(...data.results);
      pageToken = data.next_page_token;

      if (!pageToken) break;
      // Google은 next_page_token 사용 전 2초 대기 필요
      await sleep(2000);
    } catch (err) {
      console.error(`Google API 요청 실패:`, err);
      break;
    }
  }

  return results;
}

// ─────────────────────────────────────────
// 유틸리티
// ─────────────────────────────────────────
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 두 좌표 간 거리 (미터) - Haversine 공식
function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 주소에서 시/도 추출
function extractCity(address: string): string {
  // Google Places는 "대한민국 서울특별시 ..."처럼 국가명이 앞에 올 수 있음
  const cleanAddr = address.replace(/^대한민국\s+/, "");
  const cityMap: Record<string, string> = {
    서울특별시: "서울",
    서울: "서울",
    부산광역시: "부산",
    부산: "부산",
    대구광역시: "대구",
    대구: "대구",
    인천광역시: "인천",
    인천: "인천",
    광주광역시: "광주",
    광주: "광주",
    대전광역시: "대전",
    대전: "대전",
    울산광역시: "울산",
    울산: "울산",
    세종특별자치시: "세종",
    세종: "세종",
    경기도: "경기",
    경기: "경기",
    강원도: "강원",
    강원특별자치도: "강원",
    강원: "강원",
    충청북도: "충북",
    충북: "충북",
    충청남도: "충남",
    충남: "충남",
    전라북도: "전북",
    전북특별자치도: "전북",
    전북: "전북",
    전라남도: "전남",
    전남: "전남",
    경상북도: "경북",
    경북: "경북",
    경상남도: "경남",
    경남: "경남",
    제주특별자치도: "제주",
    제주: "제주",
  };

  const firstWord = cleanAddr.split(" ")[0];
  return cityMap[firstWord] || firstWord;
}

// 주소에서 구/군 추출
function extractDistrict(address: string): string {
  const parts = address.replace(/^대한민국\s+/, "").split(" ");
  // 두 번째 또는 세 번째 단어에서 "구", "군", "시" 찾기
  for (let i = 1; i < Math.min(parts.length, 4); i++) {
    if (
      parts[i].endsWith("구") ||
      parts[i].endsWith("군") ||
      parts[i].endsWith("시")
    ) {
      return parts[i];
    }
  }
  return parts[1] || "";
}

// 카테고리/이름으로 실내/실외 추정
function guessCourtType(
  name: string,
  category: string
): "indoor" | "outdoor" {
  const indoorKeywords = [
    "체육관",
    "실내",
    "센터",
    "gym",
    "arena",
    "돔",
    "스포츠센터",
    "문화체육",
    "국민체육",
  ];
  const text = (name + " " + category).toLowerCase();
  return indoorKeywords.some((kw) => text.includes(kw)) ? "indoor" : "outdoor";
}

// ─────────────────────────────────────────
// 중복 체크용 수집 결과 구조
// ─────────────────────────────────────────
interface CollectedCourt {
  name: string;
  address: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  court_type: "indoor" | "outdoor";
  source: string; // "kakao" | "google"
}

// ─────────────────────────────────────────
// 메인 실행
// ─────────────────────────────────────────
async function main() {
  console.log("=== 실제 농구장 데이터 수집 시작 ===\n");

  // 1단계: 기존 시드 데이터 삭제
  console.log("[1] 기존 seed 데이터 삭제 중...");
  const deleted = await prisma.court_infos.deleteMany({
    where: { data_source: "seed" },
  });
  console.log(`   삭제 완료: ${deleted.count}건\n`);

  // 수집된 코트 저장 (중복 제거용)
  const collected: CollectedCourt[] = [];

  // 중복 확인 함수: 같은 이름+주소이거나 100m 이내
  function isDuplicate(court: CollectedCourt): boolean {
    return collected.some(
      (c) =>
        (c.name === court.name && c.address === court.address) ||
        distanceMeters(c.latitude, c.longitude, court.latitude, court.longitude) < 100
    );
  }

  // 2단계: 카카오 로컬 API로 검색
  const useKakao = !!KAKAO_REST_KEY;
  const useGoogle = !!GOOGLE_PLACES_KEY;

  if (useKakao) {
    console.log("[2] 카카오 로컬 API로 농구장 검색 시작...");
    console.log(`   REST API KEY: ${KAKAO_REST_KEY?.slice(0, 8)}...`);

    // 먼저 API 키가 유효한지 테스트
    const testRes = await searchKakao("농구장", 126.978, 37.5665, 1);
    if (!testRes) {
      console.log("   카카오 API 키 인증 실패! Google Places로 대체합니다.\n");
    } else {
      console.log(`   테스트 성공! 서울 "농구장" 검색: ${testRes.meta.total_count}건\n`);

      // 지역별 + 키워드별 검색
      for (const region of REGIONS) {
        for (const keyword of KEYWORDS) {
          let page = 1;
          let isEnd = false;

          while (!isEnd && page <= 5) {
            // 각 지역/키워드당 최대 5페이지
            const result = await searchKakao(keyword, region.x, region.y, page);
            if (!result || result.documents.length === 0) break;

            for (const place of result.documents) {
              const lat = parseFloat(place.y);
              const lng = parseFloat(place.x);
              const address = place.road_address_name || place.address_name;

              const court: CollectedCourt = {
                name: place.place_name,
                address,
                city: extractCity(address),
                district: extractDistrict(address),
                latitude: lat,
                longitude: lng,
                court_type: guessCourtType(place.place_name, place.category_name),
                source: "kakao",
              };

              if (!isDuplicate(court)) {
                collected.push(court);
              }
            }

            isEnd = result.meta.is_end;
            page++;
            await sleep(300); // rate limit 방지
          }
        }
        // 지역 간 간격
        console.log(
          `   ${region.name}: 검색 완료 (누적 ${collected.length}건)`
        );
        await sleep(500);
      }

      console.log(`\n   카카오 검색 총 수집: ${collected.length}건\n`);
    }
  }

  // 카카오로 충분히 못 모았으면 Google로 보충
  if (collected.length < 30 && useGoogle) {
    console.log("[2-B] Google Places API로 보충 검색 시작...");

    for (const region of REGIONS) {
      const places = await searchGoogle("농구장", region.y, region.x);

      for (const place of places) {
        const address = place.formatted_address;
        const court: CollectedCourt = {
          name: place.name,
          address,
          city: extractCity(address),
          district: extractDistrict(address),
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          court_type: guessCourtType(place.name, place.types.join(" ")),
          source: "google",
        };

        if (!isDuplicate(court)) {
          collected.push(court);
        }
      }

      console.log(
        `   ${region.name}: 검색 완료 (누적 ${collected.length}건)`
      );
      await sleep(1000);
    }

    console.log(`\n   Google 보충 후 총 수집: ${collected.length}건\n`);
  }

  if (collected.length === 0) {
    console.error("수집된 데이터가 없습니다. API 키를 확인하세요.");
    process.exit(1);
  }

  // 3단계: DB에 삽입
  console.log(`[3] DB에 ${collected.length}건 삽입 중...`);

  // user_id=1 (시스템 계정)으로 삽입
  const systemUser = await prisma.user.findFirst({
    orderBy: { id: "asc" },
  });
  const userId = systemUser?.id || BigInt(1);

  let insertedCount = 0;
  const now = new Date();

  for (const court of collected) {
    // DB에 이미 같은 이름+주소가 있는지 확인
    const existing = await prisma.court_infos.findFirst({
      where: {
        name: court.name,
        address: court.address,
      },
    });

    if (existing) {
      console.log(`   [스킵] 이미 존재: ${court.name}`);
      continue;
    }

    await prisma.court_infos.create({
      data: {
        user_id: userId,
        name: court.name,
        address: court.address,
        city: court.city,
        district: court.district,
        latitude: court.latitude,
        longitude: court.longitude,
        court_type: court.court_type,
        surface_type: court.court_type === "indoor" ? "마루" : "아스팔트",
        hoops_count: 2,
        has_lighting: court.court_type === "indoor", // 실내는 조명 있음으로 추정
        is_free: court.court_type === "outdoor", // 실외는 무료로 추정
        data_source: court.source, // "kakao" 또는 "google"
        status: "active",
        reviews_count: 0,
        average_rating: 0,
        checkins_count: 0,
        created_at: now,
        updated_at: now,
      },
    });

    insertedCount++;
  }

  console.log(`\n=== 완료 ===`);
  console.log(`삽입: ${insertedCount}건`);
  console.log(`스킵(중복): ${collected.length - insertedCount}건`);
  console.log(`총 court_infos 레코드 수: ${await prisma.court_infos.count()}건`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("실행 오류:", err);
  prisma.$disconnect();
  process.exit(1);
});
