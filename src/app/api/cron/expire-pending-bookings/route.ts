import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Vercel Cron: 코트 대관 결제 미완료 자동 만료 (10분 주기).
 *
 * 이유:
 *   Phase B 결제 흐름에서 booking 생성 시 status="pending" 으로 슬롯을 잠그고
 *   사용자에게 토스페이먼츠 결제창을 띄운다. 그러나 사용자가 결제를 완료하지 않고
 *   브라우저를 닫거나 이탈하면 슬롯이 영구히 점유되어 다른 사용자가 예약할 수 없다.
 *   → 15분 이상 지난 pending 예약을 자동으로 cancelled 처리하여 슬롯을 해제한다.
 *
 * 동작:
 *   1. CRON_SECRET 헤더 검증 (다른 cron과 동일 패턴)
 *   2. status=pending && created_at < (now - 15분) 대상 단일 SQL UPDATE
 *      → status=cancelled, cancelled_at=now, cancellation_reason="결제 미완료 자동 만료"
 *   3. 만료 카운트와 cutoff 시간을 응답
 *
 * 환불 처리 불필요:
 *   pending 상태는 결제 confirm 전이므로 토스에 결제 자체가 없다.
 *   confirmed 후 결제된 건의 환불은 별도 취소 API에서 처리한다.
 *
 * Phase A(무료 즉시 confirmed) 영향 없음:
 *   where status=pending 만 대상이므로 confirmed 건은 절대 건드리지 않는다.
 *
 * 스케줄: vercel.json "* /10 * * * *" (10분마다)
 * 보안:   CRON_SECRET Bearer 인증 (referee-healthcheck / tournament-reminders 등 동일 패턴)
 */

// Vercel Cron은 동적 실행이므로 캐시/정적 최적화 비활성화
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // 1) CRON_SECRET 검증 — 외부에서 임의 호출하여 부당하게 예약을 취소시키는 것을 방지
  //    CRON_SECRET 미설정인 로컬/개발 환경에서는 검증 생략 (개발 편의)
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2) cutoff 계산: 현재 시각 - 15분
  //    이 시각보다 이전에 생성된 pending 예약을 만료 대상으로 본다.
  const cutoff = new Date(Date.now() - 15 * 60 * 1000);

  // 3) 단일 UPDATE 쿼리로 일괄 만료 처리
  //    - 다른 API 호출(토스 환불 등) 없이 DB 한 번만 → 빠르고 부분 실패 위험 없음
  //    - updated_at 은 Prisma @updatedAt 으로 자동 갱신되지만, 명시적 가독성 위해 함께 지정
  const result = await prisma.court_bookings.updateMany({
    where: {
      status: "pending",
      created_at: { lt: cutoff },
    },
    data: {
      status: "cancelled",
      cancelled_at: new Date(),
      cancellation_reason: "결제 미완료 자동 만료",
      updated_at: new Date(),
    },
  });

  // 4) 결과 반환 — Vercel Cron 로그에서 모니터링 가능
  return NextResponse.json({
    expired: result.count,
    cutoff: cutoff.toISOString(),
    timestamp: new Date().toISOString(),
  });
}
