/**
 * GET /api/web/home/news
 *
 * 홈 소식 피드 — 접수중 대회 / 모집중 픽업 / 코트 이벤트를 통합 조회
 * 공개 API (인증 불필요)
 */

import { prisma } from "@/lib/db/prisma";
import { apiSuccess } from "@/lib/api/response";

// 소식 항목 타입 (클라이언트에서도 import 가능)
export type NewsItemType = "tournament" | "pickup" | "event" | "promo";

export async function GET(req: Request) {
  // regions 쿼리 파라미터: 맞춤 지역 우선 정렬 (예: ?regions=서울,경기)
  const url = new URL(req.url);
  const regionsParam = url.searchParams.get("regions");
  const preferredRegions = regionsParam
    ? regionsParam.split(",").map((r) => r.trim()).filter(Boolean)
    : [];
  // 3가지 데이터를 병렬로 조회 — 하나가 실패해도 나머지는 응답
  const [tournamentsResult, pickupsResult, eventsResult] =
    await Promise.allSettled([
      // 접수 중인 대회: registration_end_at이 아직 안 지난 것, 최신 3개
      prisma.tournament.findMany({
        where: {
          status: { in: ["registration", "open"] },
          is_public: true,
          registration_end_at: { gte: new Date() },
        },
        orderBy: { registration_end_at: "asc" },
        take: 3,
        select: {
          id: true,
          name: true,
          registration_end_at: true,
          venue_name: true,
          startDate: true,
        },
      }),

      // 모집 중인 픽업게임: status=recruiting, 최신 3개
      prisma.pickup_games.findMany({
        where: { status: "recruiting" },
        orderBy: { scheduled_date: "asc" },
        take: 3,
        select: {
          id: true,
          title: true,
          scheduled_date: true,
          start_time: true,
          max_players: true,
          _count: { select: { participants: true } },
          court_infos: { select: { name: true, id: true, court_type: true } },
        },
      }),

      // 모집 중인 코트 이벤트: status=recruiting, 최신 2개
      prisma.court_events.findMany({
        where: { status: "recruiting" },
        orderBy: { event_date: "asc" },
        take: 2,
        select: {
          id: true,
          title: true,
          event_date: true,
          start_time: true,
          court_info: { select: { id: true, name: true } },
        },
      }),
    ]);

  // 성공한 결과만 추출
  const tournaments =
    tournamentsResult.status === "fulfilled" ? tournamentsResult.value : [];
  const pickups =
    pickupsResult.status === "fulfilled" ? pickupsResult.value : [];
  const events =
    eventsResult.status === "fulfilled" ? eventsResult.value : [];

  // 통합 피드 배열 생성
  const items: Record<string, unknown>[] = [];

  // 대회 카드
  for (const t of tournaments) {
    items.push({
      type: "tournament" as NewsItemType,
      id: t.id,
      title: t.name,
      registration_end_at: t.registration_end_at?.toISOString() ?? null,
      venue_name: t.venue_name ?? null,
      start_date: t.startDate?.toISOString() ?? null,
      link: `/tournaments/${t.id}`,
    });
  }

  // 픽업 카드
  for (const p of pickups) {
    items.push({
      type: "pickup" as NewsItemType,
      id: p.id.toString(),
      title: p.title,
      scheduled_date: p.scheduled_date.toISOString(),
      start_time: p.start_time,
      current_players: p._count.participants,
      max_players: p.max_players,
      court_name: p.court_infos.name,
      court_type: p.court_infos.court_type ?? "unknown", // 실내/야외 구분
      link: `/courts/${p.court_infos.id}`, // 픽업은 코트 페이지에서 접근
    });
  }

  // 코트 이벤트 카드
  for (const e of events) {
    items.push({
      type: "event" as NewsItemType,
      id: e.id.toString(),
      title: e.title,
      event_date: e.event_date.toISOString(),
      start_time: e.start_time ?? null,
      court_name: e.court_info.name,
      link: `/courts/${e.court_info.id}/events/${e.id}`,
    });
  }

  // 맞춤 지역이 있으면 해당 지역 소식을 앞으로 정렬
  // venue_name / court_name에 지역명이 포함되면 우선 배치
  if (preferredRegions.length > 0) {
    items.sort((a, b) => {
      const aMatch = preferredRegions.some(
        (r) =>
          (typeof a.venue_name === "string" && a.venue_name.includes(r)) ||
          (typeof a.court_name === "string" && a.court_name.includes(r))
      );
      const bMatch = preferredRegions.some(
        (r) =>
          (typeof b.venue_name === "string" && b.venue_name.includes(r)) ||
          (typeof b.court_name === "string" && b.court_name.includes(r))
      );
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0; // 동일 우선순위면 기존 순서 유지
    });
  }

  // 프로모션 카드를 2번째 위치에 삽입 (PWA 설치 유도)
  const promoCard = {
    type: "promo" as NewsItemType,
    id: "pwa-install",
    title: "BDR BASKET 앱 설치하기",
    description: "홈 화면에 추가하고 빠르게 접속하세요",
    icon: "install_mobile",
    link: "#pwa-install",
  };

  // 2번째 위치에 프로모션 삽입 (아이템이 1개 이하면 맨 뒤에)
  if (items.length >= 1) {
    items.splice(1, 0, promoCard);
  } else {
    items.push(promoCard);
  }

  return apiSuccess({ items });
}
