/* ============================================================
 * /courts/[id]/booking — 회원용 코트 예약 페이지 (Phase A)
 *
 * 시안: Dev/design/BDR v2/screens/CourtBooking.jsx
 * 디자인 토큰: var(--accent), var(--bg-alt), var(--ink), var(--ff-mono) 등
 *
 * Phase A 정책:
 *   - 결제 미도입 → 요약 카드의 "결제하고 예약 확정" 버튼은 final_amount=0 으로 즉시 confirmed 생성
 *   - "BDR+ 할인" 라인은 시안 유지하되 Phase D 도입 전까지는 0 표시
 *   - 환불 안내 문구는 시안 그대로 유지 (운영자 수동 처리)
 * ============================================================ */

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { BookingClient } from "./_booking-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const court = await prisma.court_infos
    .findUnique({ where: { id: BigInt(id) }, select: { name: true } })
    .catch(() => null);
  return {
    title: court ? `${court.name} 예약 | MyBDR` : "코트 예약 | MyBDR",
  };
}

export default async function CourtBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 비로그인 차단 — 예약은 로그인 필수
  const session = await getWebSession();
  if (!session) {
    redirect(`/login?redirect=/courts/${id}/booking`);
  }

  const court = await prisma.court_infos
    .findUnique({
      where: { id: BigInt(id) },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        district: true,
        court_type: true,
        average_rating: true,
        booking_mode: true,
        booking_fee_per_hour: true,
        rental_url: true,
        operating_hours: true,
        facilities: true,
      },
    })
    .catch(() => null);

  if (!court) notFound();

  // booking_mode 가드 — internal 만 본 페이지 접근 허용
  // none/external 은 코트 상세에서 접근 막혀있겠지만 직접 URL 진입 차단
  if (court.booking_mode !== "internal") {
    return (
      <div className="page" style={{ padding: "60px 20px", textAlign: "center" }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: ".12em",
            color: "var(--ink-dim)",
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          COURT BOOKING
        </div>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            margin: "0 0 12px",
            color: "var(--ink)",
          }}
        >
          이 코트는 자체 예약을 지원하지 않습니다
        </h1>
        <p
          style={{
            color: "var(--ink-mute)",
            margin: "0 0 24px",
            fontSize: 14,
          }}
        >
          {court.booking_mode === "external" && court.rental_url
            ? "외부 대관 신청 페이지로 이동해주세요."
            : "코트 운영자가 예약 시스템을 활성화하지 않았습니다."}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {court.booking_mode === "external" && court.rental_url && (
            <a
              href={court.rental_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--primary"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                open_in_new
              </span>
              외부 대관 신청
            </a>
          )}
          <Link href={`/courts/${id}`} className="btn">
            코트 상세로
          </Link>
        </div>
      </div>
    );
  }

  // 직렬화 (BigInt/Decimal → 직렬화 가능 형태)
  const courtData = {
    id: court.id.toString(),
    name: court.name,
    address: court.address,
    area: court.district || court.city,
    court_type: court.court_type,
    average_rating: court.average_rating ? Number(court.average_rating) : null,
    booking_fee_per_hour: court.booking_fee_per_hour
      ? Number(court.booking_fee_per_hour)
      : 0,
    facilities: Array.isArray(court.facilities) ? (court.facilities as string[]) : [],
    // BDR 브랜드 컬러 — 시안 그라디언트 헤더용 (tournament.primary_color 와 비슷한 패턴)
    primary_color: "#E31B23",
  };

  return <BookingClient court={courtData} />;
}
