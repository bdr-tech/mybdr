/* ============================================================
 * /profile/bookings — 내 코트 예약 내역 (Phase A)
 *
 * 권한: 비로그인 시 /login 리다이렉트
 *
 * 데이터: 서버 컴포넌트에서 직접 prisma.court_bookings.findMany 조회
 *   - status 별 그룹화 없이 시간순 (최근 30일 + 향후 30일)
 *   - 코트 이름/주소 join
 *
 * 액션: 예약 카드의 "취소" 버튼은 클라이언트 컴포넌트로 위임 (DELETE /api/web/bookings/[id])
 * ============================================================ */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { BookingsListClient } from "./_bookings-list-client";

export const metadata: Metadata = {
  title: "내 예약 | MyBDR",
};

export const dynamic = "force-dynamic";

export default async function MyBookingsPage() {
  const session = await getWebSession();
  if (!session) {
    redirect("/login?redirect=/profile/bookings");
  }
  const userId = BigInt(session.sub);

  // 최근 90일 이내 예약 (예약자 본인 기준)
  // status="blocked" 는 제외 (운영자 차단 슬롯이라 사용자에게 의미 없음)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const bookings = await prisma.court_bookings.findMany({
    where: {
      user_id: userId,
      status: { not: "blocked" },
      OR: [
        { start_at: { gte: ninetyDaysAgo } },
        { created_at: { gte: ninetyDaysAgo } },
      ],
    },
    include: {
      court: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          district: true,
        },
      },
    },
    orderBy: { start_at: "desc" },
  });

  // 직렬화 (BigInt/Decimal/Date → string/number)
  const items = bookings.map((b) => ({
    id: b.id.toString(),
    start_at: b.start_at.toISOString(),
    end_at: b.end_at.toISOString(),
    duration_hours: b.duration_hours,
    purpose: b.purpose,
    status: b.status,
    expected_count: b.expected_count,
    final_amount: Number(b.final_amount),
    cancellation_reason: b.cancellation_reason,
    cancelled_at: b.cancelled_at?.toISOString() ?? null,
    created_at: b.created_at.toISOString(),
    court: {
      id: b.court.id.toString(),
      name: b.court.name,
      address: b.court.address,
      city: b.court.city,
      district: b.court.district,
    },
  }));

  return (
    <div className="page">
      {/* 브레드크럼 */}
      <div
        style={{
          display: "flex",
          gap: 6,
          fontSize: 12,
          color: "var(--ink-mute)",
          marginBottom: 12,
        }}
      >
        <Link href="/" style={{ color: "var(--ink-mute)", textDecoration: "none" }}>
          홈
        </Link>
        <span>›</span>
        <Link href="/profile" style={{ color: "var(--ink-mute)", textDecoration: "none" }}>
          프로필
        </Link>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>내 예약</span>
      </div>

      {/* 헤더 */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: ".12em",
            color: "var(--ink-dim)",
            fontWeight: 800,
            textTransform: "uppercase",
          }}
        >
          MY BOOKINGS · 내 예약 내역
        </div>
        <h1
          style={{
            margin: "6px 0 0",
            fontSize: 28,
            fontWeight: 800,
            color: "var(--ink)",
          }}
        >
          내 코트 예약
        </h1>
        <p style={{ margin: "4px 0 0", color: "var(--ink-mute)", fontSize: 13 }}>
          최근 90일 이내 예약을 시간순으로 보여드립니다.
        </p>
      </div>

      <BookingsListClient items={items} />
    </div>
  );
}
