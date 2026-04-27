import type { Metadata } from "next";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";
// Phase 3 Court v2 시안 적용: CourtsContent → CourtsContentV2 교체
// 기존 CourtsContent (courts-content.tsx) 는 보존 — 필요 시 import 1줄만 되돌리면 즉시 롤백
import { CourtsContentV2 } from "./_components/courts-content-v2";

// SEO: 코트 찾기 페이지 메타데이터
export const metadata: Metadata = {
  title: "내 주변 농구장 | MyBDR",
  description: "전국 농구장을 찾고 시설 정보, 바닥재, 조명, 이용료를 확인하세요.",
};

// 5분 ISR 캐시 (코트 정보는 자주 바뀌지 않음)
export const revalidate = 300;

// unstable_cache: ISR 외에 서버 측 데이터 캐시를 추가로 적용
// 같은 5분 동안 동일한 DB 쿼리를 반복하지 않도록 결과를 메모리/파일에 저장
// 비유: ISR은 "완성된 페이지"를 캐시하고, unstable_cache는 "재료(DB 데이터)"를 캐시하는 것
const getCourtsData = unstable_cache(
  async () => {
    const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(Date.now() + kstOffset);
    const todayStr = kstDate.toISOString().split("T")[0];
    const todayDate = new Date(todayStr + "T00:00:00.000Z");

    // 3개 쿼리를 병렬 실행 (서로 의존 없으므로 동시에 보내서 대기 시간 단축)
    const [activeSessions, pickupCounts, rawCourts] = await Promise.all([
      // 1) 각 코트의 활성 체크인 세션 수 조회 (3시간 이내, 체크아웃 안 한 사람)
      prisma.court_sessions.groupBy({
        by: ["court_id"],
        where: {
          checked_out_at: null,
          checked_in_at: { gte: cutoff },
        },
        _count: { id: true },
      }).catch((err) => {
        console.error("Courts active sessions query failed:", err);
        return [] as { court_id: bigint; _count: { id: number } }[];
      }),
      // 2) 코트별 모집 중인 픽업게임 수 조회 (오늘 이후, recruiting/full)
      prisma.pickup_games.groupBy({
        by: ["court_info_id"],
        where: {
          scheduled_date: { gte: todayDate },
          status: { in: ["recruiting", "full"] },
        },
        _count: { id: true },
      }).catch(() => [] as { court_info_id: bigint; _count: { id: number } }[]),
      // 3) DB에서 전체 코트 목록 조회 (active 상태만)
      prisma.court_infos.findMany({
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
        console.error("Courts query failed:", err);
        return [] as Awaited<ReturnType<typeof prisma.court_infos.findMany>>;
      }),
    ]);

    // court_id -> 활성 세션 수 맵
    const activeMap = new Map(
      activeSessions.map((s) => [s.court_id.toString(), s._count.id])
    );

    // court_info_id -> 모집 중인 픽업게임 수 맵
    const pickupMap = new Map(
      pickupCounts.map((p) => [p.court_info_id.toString(), p._count.id])
    );

    console.log(`[Courts] Fetched ${rawCourts.length} courts (cached)`);

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
      nickname: c.nickname,
      nearest_station: c.nearest_station,
      court_size: c.court_size,
      lighting_until: c.lighting_until,
      has_restroom: c.has_restroom,
      has_parking: c.has_parking,
      verified: c.verified,
      data_source: c.data_source,
      activeCount: activeMap.get(c.id.toString()) ?? 0,
      pickupCount: pickupMap.get(c.id.toString()) ?? 0,
    }));

    const cities = [...new Set(courts.map((c) => c.city))].sort();

    return { courts, cities };
  },
  ["courts-list"], // 캐시 키: 이 이름으로 캐시를 식별
  { revalidate: 300 } // 5분마다 캐시 갱신 (ISR과 동일 주기)
);

export default async function CourtsPage() {
  // unstable_cache로 감싼 함수 호출 (5분간 결과 재사용)
  const { courts, cities } = await getCourtsData();

  return (
    <Suspense fallback={null}>
      <CourtsContentV2 courts={courts} cities={cities} />
    </Suspense>
  );
}
