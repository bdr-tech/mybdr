/**
 * seed-curated-courts.ts
 *
 * 수동 큐레이션된 서울 핵심 야외 농구장 15개를 DB에 등록한다.
 * - latitude/longitude가 null인 항목은 카카오 주소/키워드 검색 API로 보강
 * - 기존 Google 데이터(data_source="google")와 이름 중복 시 상세 정보 업데이트
 * - 신규이면 insert
 *
 * 실행: npx tsx scripts/seed-curated-courts.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const KAKAO_KEY = process.env.KAKAO_REST_API_KEY;

// ─── 카카오 API 헬퍼 ───────────────────────────────────

/** 주소 → 좌표 변환 (주소검색 → 키워드검색 폴백) */
async function geocode(address: string, name?: string) {
  // 1차: 주소 검색
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
    { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } }
  );
  const data = await res.json();
  if (data.documents?.[0]) {
    return {
      lat: parseFloat(data.documents[0].y),
      lng: parseFloat(data.documents[0].x),
    };
  }

  // 2차: 키워드 검색 (이름 + 농구장)
  const keyword = name ? name : address + " 농구장";
  const res2 = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword)}`,
    { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } }
  );
  const data2 = await res2.json();
  if (data2.documents?.[0]) {
    return {
      lat: parseFloat(data2.documents[0].y),
      lng: parseFloat(data2.documents[0].x),
      // 카카오 장소 정보도 함께 반환
      kakaoPlaceId: data2.documents[0].id,
      kakaoPlaceUrl: data2.documents[0].place_url,
    };
  }

  return null;
}

/** rate limit 방지용 대기 (200ms) */
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── 시드 데이터: 서울 핵심 야외 농구장 15개 ──────────

interface CuratedCourt {
  name: string;
  nickname: string;
  address: string;
  city: string;
  district: string;
  courtType: string;
  surfaceType?: string;
  hoopCount?: number;
  hoopHeight?: number;
  courtSize?: string;
  hasLighting: boolean;
  lightingUntil?: string;
  isFree: boolean;
  hasRestroom?: boolean;
  hasParking?: boolean;
  nearestStation?: string;
  description: string;
  latitude?: number | null;
  longitude?: number | null;
}

const CURATED_COURTS: CuratedCourt[] = [
  {
    name: "뚝섬 한강공원 농구장",
    nickname: "뚝섬 코트",
    address: "서울 성동구 뚝섬로 273",
    city: "서울",
    district: "성동구",
    courtType: "outdoor",
    surfaceType: "urethane",
    hoopCount: 8,
    hoopHeight: 305,
    courtSize: "fullcourt",
    hasLighting: true,
    lightingUntil: "23:00",
    isFree: true,
    hasRestroom: true,
    hasParking: true,
    nearestStation: "뚝섬역 2번 출구 도보 5분",
    description:
      "서울 야외 농구 성지. 뚝섬역 쪽 우레탄 코트 2면 + 고무 코트 2면. 국적/연령 불문 고수 다수.",
    latitude: 37.5315,
    longitude: 127.0668,
  },
  {
    name: "잠실 종합운동장 농구장",
    nickname: "잠실 코트",
    address: "서울 송파구 올림픽로 25",
    city: "서울",
    district: "송파구",
    courtType: "outdoor",
    surfaceType: "urethane",
    hoopCount: 8,
    hoopHeight: 300,
    courtSize: "fullcourt",
    hasLighting: true,
    lightingUntil: "22:00",
    isFree: true,
    hasRestroom: true,
    hasParking: true,
    nearestStation: "종합운동장역 6번 출구 도보 10분",
    description:
      "풀코트 우레탄 2면 + 고무 2면. 대한민국 야외 코트 중 최상급 시설 보유.",
    latitude: 37.5153,
    longitude: 127.0729,
  },
  {
    name: "올림픽공원 3x3 농구장",
    nickname: "올림픽공원 코트",
    address: "서울 송파구 올림픽로 424",
    city: "서울",
    district: "송파구",
    courtType: "outdoor",
    surfaceType: "modular",
    hoopCount: 3,
    hoopHeight: 305,
    courtSize: "3x3",
    hasLighting: true,
    lightingUntil: "22:00",
    isFree: true,
    hasRestroom: true,
    hasParking: true,
    nearestStation: "올림픽공원역 3번 출구 도보 10분",
    description:
      "3x3 정식 규격 코트. KBA 3x3 대회 개최지. 모듈형 바닥 — 겨울철 미끄러움 주의.",
    latitude: 37.5209,
    longitude: 127.1214,
  },
  {
    name: "오목교 오목공원 농구장",
    nickname: "오목교 코트",
    address: "서울 양천구 오목로 100",
    city: "서울",
    district: "양천구",
    courtType: "outdoor",
    surfaceType: "urethane",
    hoopCount: 6,
    hoopHeight: 295,
    courtSize: "fullcourt",
    hasLighting: true,
    lightingUntil: "22:00",
    isFree: true,
    hasRestroom: true,
    hasParking: false,
    nearestStation: "오목교역 1번 출구 도보 2분",
    description:
      "고수들의 성지. 6개 골대 원형 배치. 밀어내기 방식 픽업게임. 평일 20~22시 피크.",
    latitude: 37.5243,
    longitude: 126.8753,
  },
  {
    name: "보라매공원 농구장",
    nickname: "보라매 코트",
    address: "서울 동작구 여의대방로20길 33",
    city: "서울",
    district: "동작구",
    courtType: "outdoor",
    surfaceType: "urethane",
    hoopCount: 4,
    courtSize: "halfcourt",
    hasLighting: true,
    isFree: true,
    hasRestroom: true,
    nearestStation: "보라매역 도보 10분",
    description: "관악/동작 지역 대표 야외 코트.",
    latitude: null,
    longitude: null,
  },
  {
    name: "여의도 한강공원 농구장",
    nickname: "여의도 코트",
    address: "서울 영등포구 여의동로 330",
    city: "서울",
    district: "영등포구",
    courtType: "outdoor",
    surfaceType: "rubber",
    hoopCount: 4,
    courtSize: "fullcourt",
    hasLighting: true,
    isFree: true,
    hasRestroom: true,
    hasParking: true,
    nearestStation: "여의나루역 도보 10분",
    description: "직장인 퇴근 후 농구 명소. 한강뷰 코트.",
    latitude: null,
    longitude: null,
  },
  {
    name: "천호공원 농구장",
    nickname: "천호 코트",
    address: "서울 강동구 천호대로 1139",
    city: "서울",
    district: "강동구",
    courtType: "outdoor",
    hoopCount: 4,
    courtSize: "fullcourt",
    hasLighting: true,
    isFree: true,
    description: "강동 지역 대표 야외 코트.",
    latitude: null,
    longitude: null,
  },
  {
    name: "효창공원 농구장",
    nickname: "효창 코트",
    address: "서울 용산구 효창원로 177-18",
    city: "서울",
    district: "용산구",
    courtType: "outdoor",
    hoopCount: 4,
    courtSize: "halfcourt",
    hasLighting: true,
    isFree: true,
    description: "용산 지역 야외 코트. 학생들이 자주 찾음.",
    latitude: null,
    longitude: null,
  },
  {
    name: "용마폭포공원 농구장",
    nickname: "용마폭포 코트",
    address: "서울 중랑구 용마산로 250-12",
    city: "서울",
    district: "중랑구",
    courtType: "outdoor",
    hoopCount: 4,
    courtSize: "halfcourt",
    hasLighting: true,
    isFree: true,
    description: "중랑구 대표 야외 코트.",
    latitude: null,
    longitude: null,
  },
  {
    name: "월곡오동근린공원 농구장",
    nickname: "월곡 코트",
    address: "서울 성북구 화랑로13가길 62",
    city: "서울",
    district: "성북구",
    courtType: "outdoor",
    surfaceType: "urethane",
    hoopCount: 2,
    courtSize: "fullcourt",
    hasLighting: true,
    isFree: true,
    description: "성북구 잔디구장 옆 농구코트.",
    latitude: null,
    longitude: null,
  },
  {
    name: "응봉체육공원 농구장",
    nickname: "응봉 코트",
    address: "서울 성동구 독서당로 113",
    city: "서울",
    district: "성동구",
    courtType: "outdoor",
    hoopCount: 4,
    courtSize: "fullcourt",
    hasLighting: true,
    isFree: true,
    description: "한강 뷰 야외 코트.",
    latitude: null,
    longitude: null,
  },
  {
    name: "난지 한강공원 농구장",
    nickname: "난지 코트",
    address: "서울 마포구 한강난지로 162",
    city: "서울",
    district: "마포구",
    courtType: "outdoor",
    hoopCount: 4,
    courtSize: "fullcourt",
    hasLighting: true,
    isFree: true,
    hasRestroom: true,
    hasParking: true,
    description: "마포구 한강공원 내 야외 코트.",
    latitude: null,
    longitude: null,
  },
  {
    name: "반포 한강공원 농구장",
    nickname: "반포 코트",
    address: "서울 서초구 신반포로11길 40",
    city: "서울",
    district: "서초구",
    courtType: "outdoor",
    hoopCount: 4,
    courtSize: "fullcourt",
    hasLighting: true,
    isFree: true,
    hasRestroom: true,
    nearestStation: "신반포역 4번 출구",
    description: "서래마을 인근. 길거리 농구 성행지.",
    latitude: null,
    longitude: null,
  },
  {
    name: "뚝섬유원지 Art Cube 농구장",
    nickname: "아트큐브 코트",
    address: "서울 광진구 자양동 강변북로",
    city: "서울",
    district: "광진구",
    courtType: "outdoor",
    hoopCount: 2,
    courtSize: "halfcourt",
    isFree: true,
    hasLighting: false,
    description: "뚝섬유원지 내 소규모 코트.",
    latitude: null,
    longitude: null,
  },
  {
    name: "빈스 카터 농구장",
    nickname: "빈스 카터 코트",
    address: "서울 용산구 한남동",
    city: "서울",
    district: "용산구",
    courtType: "outdoor",
    hoopCount: 2,
    courtSize: "halfcourt",
    isFree: true,
    hasLighting: false,
    description: "한남동 길거리 코트. 이름의 유래 불명.",
    latitude: null,
    longitude: null,
  },
];

// ─── 메인 실행 ─────────────────────────────────────────

async function main() {
  console.log("=== 수동 큐레이션 야외 농구장 15개 시드 시작 ===\n");

  if (!KAKAO_KEY) {
    console.error("KAKAO_REST_API_KEY 환경변수가 필요합니다.");
    process.exit(1);
  }

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const court of CURATED_COURTS) {
    // 좌표가 없으면 카카오 API로 보강
    let lat = court.latitude;
    let lng = court.longitude;
    let kakaoPlaceId: string | undefined;
    let kakaoPlaceUrl: string | undefined;

    if (!lat || !lng) {
      console.log(`  [좌표 보강] ${court.name} → 카카오 API 검색중...`);
      const geo = await geocode(court.address, court.name);
      if (geo) {
        lat = geo.lat;
        lng = geo.lng;
        kakaoPlaceId = (geo as any).kakaoPlaceId;
        kakaoPlaceUrl = (geo as any).kakaoPlaceUrl;
        console.log(`    좌표 확인: ${lat}, ${lng}`);
      } else {
        console.log(`    [경고] 좌표를 찾을 수 없음 — 건너뜀`);
        failed++;
        continue;
      }
      await sleep(200); // rate limit
    }

    // 중복 체크: 이름 또는 좌표 50m 이내
    const existing = await prisma.court_infos.findFirst({
      where: {
        OR: [
          { name: court.name },
          { nickname: court.nickname },
        ],
      },
    });

    const courtData = {
      nickname: court.nickname,
      description: court.description,
      court_type: court.courtType,
      surface_type: court.surfaceType || null,
      hoops_count: court.hoopCount || null,
      hoop_height: court.hoopHeight || null,
      court_size: court.courtSize || null,
      has_lighting: court.hasLighting,
      lighting_until: court.lightingUntil || null,
      is_free: court.isFree,
      has_restroom: court.hasRestroom ?? false,
      has_parking: court.hasParking ?? false,
      nearest_station: court.nearestStation || null,
      kakao_place_id: kakaoPlaceId || null,
      kakao_place_url: kakaoPlaceUrl || null,
      data_source: "manual_curation",
      verified: true,
    };

    if (existing) {
      // 기존 데이터 업데이트 (상세 정보 보강)
      await prisma.court_infos.update({
        where: { id: existing.id },
        data: {
          ...courtData,
          latitude: lat!,
          longitude: lng!,
          updated_at: new Date(),
        },
      });
      console.log(`  [업데이트] ${court.name} (기존 ID: ${existing.id})`);
      updated++;
    } else {
      // 신규 등록
      await prisma.court_infos.create({
        data: {
          name: court.name,
          address: court.address,
          city: court.city,
          district: court.district,
          latitude: lat!,
          longitude: lng!,
          ...courtData,
          user_id: BigInt(1), // 시스템 유저
          status: "active",
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      console.log(`  [신규] ${court.name}`);
      created++;
    }
  }

  console.log(`\n=== 결과 ===`);
  console.log(`신규 등록: ${created}개`);
  console.log(`업데이트: ${updated}개`);
  console.log(`실패(좌표 없음): ${failed}개`);

  // 전체 통계
  const total = await prisma.court_infos.count({ where: { status: "active" } });
  const outdoor = await prisma.court_infos.count({
    where: { status: "active", court_type: "outdoor" },
  });
  const curated = await prisma.court_infos.count({
    where: { status: "active", data_source: "manual_curation" },
  });
  console.log(`\n전체 코트: ${total}개 (야외: ${outdoor}개, 큐레이션: ${curated}개)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
