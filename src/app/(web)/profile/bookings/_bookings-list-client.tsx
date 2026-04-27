"use client";

/* ============================================================
 * BookingsListClient — 내 예약 카드 리스트 + 취소 액션 (Phase A)
 *
 * 서버 컴포넌트에서 prefetch 한 items 를 props 로 받아 렌더링.
 * 취소 액션 후에는 router.refresh() 로 서버 데이터 재로드.
 * ============================================================ */

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface BookingItem {
  id: string;
  start_at: string;
  end_at: string;
  duration_hours: number;
  purpose: string;
  status: string;
  expected_count: number | null;
  final_amount: number;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
  court: {
    id: string;
    name: string;
    address: string;
    city: string;
    district: string | null;
  };
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> =
  {
    confirmed: {
      label: "확정",
      color: "var(--ok)",
      bg: "color-mix(in srgb, var(--ok) 12%, transparent)",
    },
    pending: {
      label: "대기",
      color: "var(--warn)",
      bg: "color-mix(in srgb, var(--warn) 12%, transparent)",
    },
    cancelled: {
      label: "취소",
      color: "var(--err)",
      bg: "color-mix(in srgb, var(--err) 10%, transparent)",
    },
    refunded: {
      label: "환불",
      color: "var(--err)",
      bg: "color-mix(in srgb, var(--err) 10%, transparent)",
    },
    completed: {
      label: "이용완료",
      color: "var(--ink-dim)",
      bg: "color-mix(in srgb, var(--ink-dim) 10%, transparent)",
    },
  };

const PURPOSE_LABELS: Record<string, string> = {
  pickup: "픽업경기",
  team: "팀 훈련",
  scrim: "스크림",
  private: "개인 연습",
};

export function BookingsListClient({ items }: { items: BookingItem[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // /courts/[id]/booking 에서 성공 후 ?just_booked=1 으로 진입 → 1회성 안내 배너
  const justBooked = searchParams.get("just_booked") === "1";

  const [busyId, setBusyId] = useState<string | null>(null);

  async function cancelBooking(bookingId: string) {
    if (!confirm("이 예약을 취소하시겠습니까?")) return;
    setBusyId(bookingId);
    try {
      const res = await fetch(`/api/web/bookings/${bookingId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        alert(typeof json?.error === "string" ? json.error : "취소 실패");
        return;
      }
      // 서버 컴포넌트 데이터 재패칭
      router.refresh();
    } catch (err) {
      alert("네트워크 오류");
      console.error(err);
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: "40px 20px",
          textAlign: "center",
          color: "var(--ink-dim)",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 36, opacity: 0.5, display: "block", marginBottom: 8 }}
        >
          event_available
        </span>
        <p style={{ margin: 0, fontSize: 14 }}>아직 예약 내역이 없습니다.</p>
        <Link
          href="/courts"
          className="btn btn--primary btn--sm"
          style={{ marginTop: 14 }}
        >
          코트 둘러보기
        </Link>
      </div>
    );
  }

  return (
    <>
      {justBooked && (
        <div
          style={{
            background: "color-mix(in srgb, var(--ok) 15%, transparent)",
            color: "var(--ok)",
            padding: "12px 16px",
            borderRadius: 6,
            fontSize: 13,
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            check_circle
          </span>
          예약이 확정되었습니다 (Phase A 무료 베타).
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((b) => (
          <BookingItemCard
            key={b.id}
            booking={b}
            busy={busyId === b.id}
            onCancel={cancelBooking}
          />
        ))}
      </div>
    </>
  );
}

function BookingItemCard({
  booking,
  busy,
  onCancel,
}: {
  booking: BookingItem;
  busy: boolean;
  onCancel: (id: string) => void;
}) {
  const meta = STATUS_META[booking.status] ?? {
    label: booking.status,
    color: "var(--ink-mute)",
    bg: "var(--bg-alt)",
  };
  const start = new Date(booking.start_at);
  const end = new Date(booking.end_at);

  // 취소 가능: confirmed/pending 만 + 시작 24시간 이상 전
  // (Phase A 정책 — 이후 운영 정책 추가 시 확장)
  const hoursUntilStart =
    (start.getTime() - Date.now()) / (60 * 60 * 1000);
  const cancellable =
    (booking.status === "confirmed" || booking.status === "pending") &&
    hoursUntilStart > 0;

  const dateLabel = start.toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  const timeLabel = `${start.toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })} - ${end.toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;

  return (
    <div
      className="card"
      style={{
        padding: "16px 18px",
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      {/* 좌측: 상태 + 일자 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 88 }}>
        <span
          style={{
            background: meta.bg,
            color: meta.color,
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 4,
            textAlign: "center",
            display: "inline-block",
            width: "fit-content",
          }}
        >
          {meta.label}
        </span>
        <div
          style={{
            fontSize: 11,
            color: "var(--ink-dim)",
            fontFamily: "var(--ff-mono)",
          }}
        >
          {booking.duration_hours}h
        </div>
      </div>

      {/* 가운데: 정보 */}
      <div style={{ flex: 1, minWidth: 220 }}>
        <Link
          href={`/courts/${booking.court.id}`}
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "var(--ink)",
            textDecoration: "none",
          }}
        >
          {booking.court.name}
        </Link>
        <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>
          {booking.court.district || booking.court.city} · {booking.court.address}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--ink)",
            marginTop: 8,
            fontFamily: "var(--ff-mono)",
          }}
        >
          {dateLabel}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--ink-soft)",
            fontFamily: "var(--ff-mono)",
            marginTop: 2,
          }}
        >
          {timeLabel}
          {" · "}
          <span style={{ fontFamily: "inherit", color: "var(--ink-mute)" }}>
            {PURPOSE_LABELS[booking.purpose] ?? booking.purpose}
            {booking.expected_count ? ` (${booking.expected_count}명)` : ""}
          </span>
        </div>
        {booking.cancellation_reason && (
          <div
            style={{
              fontSize: 12,
              color: "var(--err)",
              marginTop: 6,
            }}
          >
            취소 사유: {booking.cancellation_reason}
          </div>
        )}
      </div>

      {/* 우측: 액션 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--ink)",
            fontFamily: "var(--ff-mono)",
          }}
        >
          {booking.final_amount === 0 ? "무료" : `₩${booking.final_amount.toLocaleString()}`}
        </div>
        {cancellable && (
          <button
            type="button"
            className="btn btn--sm"
            disabled={busy}
            onClick={() => onCancel(booking.id)}
          >
            {busy ? "처리 중…" : "예약 취소"}
          </button>
        )}
      </div>
    </div>
  );
}
