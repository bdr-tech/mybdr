/* ============================================================
 * /courts/[id]/manage — 운영자용 코트 관리 페이지 (Phase A)
 *
 * 시안 없음 → BDR v2 토큰 기반 자체 디자인
 *
 * 권한:
 *   - 비로그인 → /login 리다이렉트
 *   - 본인이 court_infos.user_id 가 아니거나 court_rental 비활성 → 403 안내 화면
 *
 * 기능 (Phase A):
 *   1. 예약 현황 테이블 (오늘 + 향후 30일)
 *   2. 차단 슬롯 등록 폼 (날짜 + 시간 + 시간 + 사유)
 *   3. 개별 예약 취소 버튼 (운영자 강제 취소)
 *   4. 예약 모드(booking_mode) 토글 안내 — Phase A 는 admin/courts 직접 수정 권장 (UI 토글 X, 메시지만)
 * ============================================================ */

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { checkCourtManager } from "@/lib/courts/court-manager-guard";
import { ManageClient } from "./_manage-client";

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
    title: court ? `${court.name} 운영 | MyBDR` : "코트 운영 | MyBDR",
  };
}

export default async function CourtManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 비로그인 차단
  const session = await getWebSession();
  if (!session) {
    redirect(`/login?redirect=/courts/${id}/manage`);
  }

  const courtInfoId = BigInt(id);
  const userId = BigInt(session.sub);

  const court = await prisma.court_infos
    .findUnique({
      where: { id: courtInfoId },
      select: {
        id: true,
        name: true,
        address: true,
        booking_mode: true,
        booking_fee_per_hour: true,
      },
    })
    .catch(() => null);

  if (!court) notFound();

  // 운영자 권한 체크 — 비운영자는 안내 화면
  const guard = await checkCourtManager(userId, courtInfoId);
  if (!guard.isManager) {
    return (
      <div
        className="page"
        style={{ padding: "60px 20px", textAlign: "center" }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: ".12em",
            color: "var(--ink-dim)",
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          COURT MANAGE
        </div>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            margin: "0 0 12px",
            color: "var(--ink)",
          }}
        >
          {guard.reason === "NO_SUBSCRIPTION"
            ? "코트 대관 멤버십이 필요합니다"
            : "이 코트의 운영자가 아닙니다"}
        </h1>
        <p
          style={{
            color: "var(--ink-mute)",
            margin: "0 0 24px",
            fontSize: 14,
          }}
        >
          {guard.reason === "NO_SUBSCRIPTION"
            ? "코트 대관 멤버십(court_rental) 활성 구독자만 운영자 페이지에 접근할 수 있습니다."
            : "코트 등록자만 운영 페이지에 접근할 수 있습니다."}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {guard.reason === "NO_SUBSCRIPTION" && (
            <Link href="/pricing" className="btn btn--primary">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                workspace_premium
              </span>
              멤버십 가입
            </Link>
          )}
          <Link href={`/courts/${id}`} className="btn">
            코트 상세로
          </Link>
        </div>
      </div>
    );
  }

  // 운영자 통과 — 클라이언트 컴포넌트로 데이터 위임
  return (
    <ManageClient
      court={{
        id: court.id.toString(),
        name: court.name,
        address: court.address,
        booking_mode: court.booking_mode,
        booking_fee_per_hour: court.booking_fee_per_hour
          ? Number(court.booking_fee_per_hour)
          : null,
      }}
    />
  );
}
