/**
 * GET /api/web/courts/heatmap
 *
 * 히트맵 API -- 코트별 체크인 세션 수와 좌표를 반환
 *
 * 왜 별도 API인가?
 * - 기존 코트 목록 API는 코트 정보 + 실시간 혼잡도(activeCount)만 반환
 * - 히트맵은 "과거 누적 체크인 수(weight)"를 시간대별로 집계해야 함
 * - ISR 10분 캐시로 DB 부하 최소화 (실시간까지는 불필요)
 *
 * 쿼리 파라미터:
 * - period: "morning" (06~12) | "afternoon" (12~18) | "evening" (18~24) | "all" (기본)
 * - days: 최근 N일 (기본 30일)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

// 시간대별 시간 범위 정의 (한국 시간 기준)
const PERIOD_HOURS: Record<string, [number, number]> = {
  morning: [6, 12],    // 오전 06:00 ~ 11:59
  afternoon: [12, 18], // 오후 12:00 ~ 17:59
  evening: [18, 24],   // 저녁 18:00 ~ 23:59
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all";
    const days = Math.min(Number(searchParams.get("days")) || 30, 90); // 최대 90일

    // 유효한 period 값 검증
    if (!["all", "morning", "afternoon", "evening"].includes(period)) {
      return apiError("유효하지 않은 period 값입니다", 400, "INVALID_PARAM");
    }

    // 조회 시작일 계산 (최근 N일)
    const since = new Date();
    since.setDate(since.getDate() - days);

    // 시간대 필터 조건 구성
    // Prisma에서 시간 추출이 어려우므로 raw query 사용
    // PostgreSQL EXTRACT(HOUR FROM checked_in_at AT TIME ZONE 'Asia/Seoul')
    const hourCondition =
      period === "all"
        ? "" // 전체: 시간 조건 없음
        : `AND EXTRACT(HOUR FROM cs.checked_in_at AT TIME ZONE 'Asia/Seoul') >= ${PERIOD_HOURS[period][0]}
           AND EXTRACT(HOUR FROM cs.checked_in_at AT TIME ZONE 'Asia/Seoul') < ${PERIOD_HOURS[period][1]}`;

    // 코트별 체크인 세션 수 집계 + 좌표 조인
    // weight = 해당 기간 내 체크인 횟수 (히트맵 밀집도에 사용)
    const results = await prisma.$queryRawUnsafe<
      Array<{
        court_id: bigint;
        name: string;
        lat: number;
        lng: number;
        weight: bigint;
      }>
    >(
      `
      SELECT
        ci.id AS court_id,
        ci.name,
        CAST(ci.latitude AS FLOAT) AS lat,
        CAST(ci.longitude AS FLOAT) AS lng,
        COUNT(cs.id) AS weight
      FROM court_sessions cs
      JOIN court_infos ci ON ci.id = cs.court_id
      WHERE cs.checked_in_at >= $1
        AND ci.latitude != 0
        AND ci.longitude != 0
        ${hourCondition}
      GROUP BY ci.id, ci.name, ci.latitude, ci.longitude
      HAVING COUNT(cs.id) > 0
      ORDER BY weight DESC
      `,
      since
    );

    // BigInt를 Number로 변환 (JSON 직렬화 불가하므로)
    const points = results.map((r) => ({
      courtId: Number(r.court_id),
      name: r.name,
      lat: r.lat,
      lng: r.lng,
      weight: Number(r.weight),
    }));

    // 최대 weight 값도 함께 반환 (프론트에서 정규화에 사용)
    const maxWeight = points.length > 0 ? Math.max(...points.map((p) => p.weight)) : 0;

    return apiSuccess({
      points,
      max_weight: maxWeight,
      period,
      days,
      total: points.length,
    });
  } catch (error) {
    console.error("[Heatmap API Error]", error);
    return apiError("히트맵 데이터 조회 실패", 500, "INTERNAL_ERROR");
  }
}

// ISR 10분 캐시 (Next.js App Router)
export const revalidate = 600;
