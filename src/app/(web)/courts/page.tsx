import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import { CourtsContent } from "./_components/courts-content";

// SEO: 코트 찾기 페이지 메타데이터
export const metadata: Metadata = {
  title: "내 주변 농구장 | MyBDR",
  description: "전국 농구장을 찾고 시설 정보, 바닥재, 조명, 이용료를 확인하세요.",
};

// 5분 ISR 캐시 (코트 정보는 자주 바뀌지 않음)
export const revalidate = 300;

export default async function CourtsPage() {
  // 각 코트의 활성 체크인 세션 수 조회 (3시간 이내, 체크아웃 안 한 사람)
  const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const activeSessions = await prisma.court_sessions.groupBy({
    by: ["court_id"],
    where: {
      checked_out_at: null,
      checked_in_at: { gte: cutoff },
    },
    _count: { id: true },
  }).catch((err) => {
    // 활성 세션 조회 실패 시 에러 로깅 (빈 배열로 폴백)
    console.error("Courts active sessions query failed:", err);
    return [];
  });

  // court_id -> 활성 세션 수 맵
  const activeMap = new Map(
    activeSessions.map((s) => [s.court_id.toString(), s._count.id])
  );

  // DB에서 전체 코트 목록 조회 (active 상태만)
  const rawCourts = await prisma.court_infos.findMany({
    where: { status: "active" },
    orderBy: [
      { average_rating: "desc" },
      { reviews_count: "desc" },
      { created_at: "desc" },
    ],
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      district: true,
      latitude: true,
      longitude: true,
      court_type: true,
      surface_type: true,
      hoops_count: true,
      is_free: true,
      has_lighting: true,
      fee: true,
      average_rating: true,
      reviews_count: true,
      description: true,
      // 야외 코트 확장 필드
      nickname: true,
      nearest_station: true,
      court_size: true,
      lighting_until: true,
      has_restroom: true,
      has_parking: true,
      verified: true,
      data_source: true,
    },
  }).catch((err) => {
    // 코트 목록 조회 실패 시 에러 로깅 (빈 배열로 폴백)
    console.error("Courts query failed:", err);
    return [];
  });

  // 디버깅: 조회된 코트 수 로깅
  console.log(`[Courts] Fetched ${rawCourts.length} courts`);

  // BigInt/Decimal을 JSON 직렬화 가능하게 변환
  const courts = rawCourts.map((c) => ({
    id: c.id.toString(),
    name: c.name,
    address: c.address,
    city: c.city,
    district: c.district,
    latitude: Number(c.latitude),
    longitude: Number(c.longitude),
    court_type: c.court_type,
    surface_type: c.surface_type,
    hoops_count: c.hoops_count,
    is_free: c.is_free,
    has_lighting: c.has_lighting,
    fee: c.fee ? Number(c.fee) : null,
    average_rating: c.average_rating ? Number(c.average_rating) : null,
    reviews_count: c.reviews_count,
    description: c.description,
    // 야외 코트 확장 필드
    nickname: c.nickname,
    nearest_station: c.nearest_station,
    court_size: c.court_size,
    lighting_until: c.lighting_until,
    has_restroom: c.has_restroom,
    has_parking: c.has_parking,
    verified: c.verified,
    data_source: c.data_source,
    // 혼잡도: 현재 활성 세션 수
    activeCount: activeMap.get(c.id.toString()) ?? 0,
  }));

  // 지역 목록 추출 (중복 제거 + 정렬)
  const cities = [...new Set(courts.map((c) => c.city))].sort();

  return (
    <Suspense fallback={null}>
      <CourtsContent courts={courts} cities={cities} />
    </Suspense>
  );
}
