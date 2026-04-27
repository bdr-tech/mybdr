"use client";

/* ============================================================
 * ManageClient — 운영자용 예약 관리 (Phase A)
 *
 * 기능:
 *   1. 예약 현황 리스트 (SWR — /api/web/courts/[id]/manage/bookings)
 *   2. 차단 슬롯 등록 폼 (POST 동일 경로)
 *   3. 개별 예약 취소 (DELETE /api/web/bookings/[id])
 *
 * Phase A 한정:
 *   - booking_mode 토글 UI 미포함 (admin 콘솔에서 직접 수정 안내)
 *   - 시간당 요금 변경 UI 미포함 (Phase B 결제 도입 시 추가)
 * ============================================================ */

import { useState } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// 상태 라벨 + 색상 — 디자인 토큰 기반
const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
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
  blocked: {
    label: "차단",
    color: "var(--ink-mute)",
    bg: "color-mix(in srgb, var(--ink-mute) 12%, transparent)",
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
  pickup: "픽업",
  team: "팀 훈련",
  scrim: "스크림",
  private: "개인",
  block: "운영자 차단",
};

interface BookingRow {
  id: string;
  start_at: string;
  end_at: string;
  duration_hours: number;
  purpose: string;
  status: string;
  expected_count: number | null;
  amount: number;
  final_amount: number;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
  user: {
    id: string;
    nickname: string | null;
    name: string | null;
    profile_image: string | null;
  };
}

interface CourtMeta {
  id: string;
  name: string;
  address: string;
  booking_mode: string;
  booking_fee_per_hour: number | null;
}

export function ManageClient({ court }: { court: CourtMeta }) {
  // 예약 목록 — 기본 30일치
  const apiUrl = `/api/web/courts/${court.id}/manage/bookings`;
  const { data, isLoading } = useSWR<{ bookings?: BookingRow[] }>(apiUrl, fetcher);
  const bookings = data?.bookings ?? [];

  // 차단 폼 상태
  const [blockDate, setBlockDate] = useState<string>(() => todayKstYmd());
  const [blockHour, setBlockHour] = useState<number>(9);
  const [blockDuration, setBlockDuration] = useState<number>(1);
  const [blockReason, setBlockReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function submitBlock(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setOkMsg(null);
    setSubmitting(true);
    try {
      const startKstIso = `${blockDate}T${String(blockHour).padStart(2, "0")}:00:00+09:00`;
      const startAt = new Date(startKstIso).toISOString();
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_at: startAt,
          duration_hours: blockDuration,
          reason: blockReason.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(typeof json?.error === "string" ? json.error : "차단 등록 실패");
        return;
      }
      setOkMsg("차단 슬롯이 등록되었습니다");
      setBlockReason("");
      await mutate(apiUrl);
    } catch (err) {
      setErrorMsg("네트워크 오류");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  // 개별 예약 취소
  async function cancelBooking(bookingId: string) {
    if (!confirm("이 예약을 취소하시겠습니까?")) return;
    const reason = prompt("취소 사유 (선택, 최대 200자)") ?? undefined;
    try {
      const res = await fetch(`/api/web/bookings/${bookingId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(typeof json?.error === "string" ? json.error : "취소 실패");
        return;
      }
      await mutate(apiUrl);
    } catch (err) {
      alert("네트워크 오류");
      console.error(err);
    }
  }

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
        <Link href="/courts" style={{ color: "var(--ink-mute)", textDecoration: "none" }}>
          코트
        </Link>
        <span>›</span>
        <Link
          href={`/courts/${court.id}`}
          style={{ color: "var(--ink-mute)", textDecoration: "none" }}
        >
          {court.name}
        </Link>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>운영</span>
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
          COURT MANAGE · 운영자 대시보드
        </div>
        <h1
          style={{
            margin: "6px 0 0",
            fontSize: 28,
            fontWeight: 800,
            color: "var(--ink)",
          }}
        >
          {court.name} 운영
        </h1>
        <p style={{ margin: "4px 0 0", color: "var(--ink-mute)", fontSize: 13 }}>
          {court.address}
        </p>
      </div>

      {/* 모드 안내 */}
      <div
        className="card"
        style={{ padding: "16px 20px", marginBottom: 20, fontSize: 13 }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}
        >
          <span
            className="material-symbols-outlined"
            style={{ color: "var(--accent)", fontSize: 18 }}
          >
            info
          </span>
          <strong style={{ color: "var(--ink)" }}>예약 모드</strong>
          <span
            className="badge"
            style={{
              fontSize: 11,
              background: "var(--bg-alt)",
              color: "var(--ink)",
              padding: "2px 8px",
              borderRadius: 4,
            }}
          >
            {court.booking_mode === "internal"
              ? "INTERNAL (시스템 예약)"
              : court.booking_mode === "external"
              ? "EXTERNAL (외부 링크)"
              : "NONE (대관 미지원)"}
          </span>
        </div>
        <div style={{ color: "var(--ink-mute)", lineHeight: 1.6 }}>
          {court.booking_mode === "internal" ? (
            <>회원이 시스템 내에서 예약할 수 있습니다. 시간당 요금은 <code>{court.booking_fee_per_hour ? `₩${court.booking_fee_per_hour.toLocaleString()}` : "미설정"}</code>. Phase A 는 무료 운영 단계라 요금이 설정되어 있어도 결제 없이 확정됩니다.</>
          ) : (
            <>현재 모드는 <code>{court.booking_mode}</code> 입니다. 시스템 내 예약을 활성화하려면 관리자에게 booking_mode 를 <code>internal</code> 로 변경 요청해주세요. (Phase A 는 admin 콘솔 수동 설정)</>
          )}
        </div>
      </div>

      {/* 차단 슬롯 등록 폼 */}
      <div
        className="card"
        style={{ padding: "18px 20px", marginBottom: 20 }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--ink)",
            margin: "0 0 12px",
          }}
        >
          차단 슬롯 등록 (점검·우천 등)
        </h2>
        <form
          onSubmit={submitBlock}
          style={{ display: "grid", gap: 10 }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
            }}
          >
            <Field label="날짜">
              <input
                type="date"
                className="input"
                value={blockDate}
                min={todayKstYmd()}
                onChange={(e) => setBlockDate(e.target.value)}
                required
              />
            </Field>
            <Field label="시작 시간">
              <select
                className="input"
                value={blockHour}
                onChange={(e) => setBlockHour(Number(e.target.value))}
              >
                {Array.from({ length: 24 }, (_, h) => h).map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </Field>
            <Field label="시간 (1~8h)">
              <input
                type="number"
                className="input"
                min={1}
                max={8}
                value={blockDuration}
                onChange={(e) =>
                  setBlockDuration(
                    Math.max(1, Math.min(8, Number(e.target.value) || 1))
                  )
                }
              />
            </Field>
            <Field label="사유 (선택)">
              <input
                type="text"
                className="input"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="우천 / 점검 / 사적 사용 등"
                maxLength={200}
              />
            </Field>
          </div>
          {errorMsg && (
            <div
              style={{
                background: "color-mix(in srgb, var(--err) 12%, transparent)",
                color: "var(--err)",
                padding: "8px 12px",
                borderRadius: 4,
                fontSize: 12,
              }}
            >
              {errorMsg}
            </div>
          )}
          {okMsg && (
            <div
              style={{
                background: "color-mix(in srgb, var(--ok) 14%, transparent)",
                color: "var(--ok)",
                padding: "8px 12px",
                borderRadius: 4,
                fontSize: 12,
              }}
            >
              {okMsg}
            </div>
          )}
          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting}
            style={{ width: "fit-content" }}
          >
            {submitting ? "등록 중…" : "차단 슬롯 추가"}
          </button>
        </form>
      </div>

      {/* 예약 목록 */}
      <div className="card" style={{ padding: "18px 20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 12,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--ink)",
              margin: 0,
            }}
          >
            예약 현황
          </h2>
          <span style={{ fontSize: 11, color: "var(--ink-mute)" }}>
            {isLoading ? "불러오는 중…" : `${bookings.length}건`}
          </span>
        </div>

        {isLoading ? (
          <div style={{ color: "var(--ink-dim)", fontSize: 13 }}>
            예약 목록을 불러오는 중입니다…
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ color: "var(--ink-dim)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
            예약된 슬롯이 없습니다.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {bookings.map((b) => (
              <BookingCard key={b.id} booking={b} onCancel={cancelBooking} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  onCancel,
}: {
  booking: BookingRow;
  onCancel: (id: string) => void;
}) {
  const meta = STATUS_META[booking.status] ?? {
    label: booking.status,
    color: "var(--ink-mute)",
    bg: "var(--bg-alt)",
  };
  const start = new Date(booking.start_at);
  const end = new Date(booking.end_at);
  const dateLabel = start.toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "short",
    day: "numeric",
    weekday: "short",
  });
  const timeLabel = `${start.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: false })} - ${end.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: false })}`;

  // 취소 가능 상태인지
  const cancellable = ["confirmed", "pending", "blocked"].includes(booking.status);

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: "12px 14px",
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          background: meta.bg,
          color: meta.color,
          fontSize: 11,
          fontWeight: 700,
          padding: "3px 8px",
          borderRadius: 4,
          minWidth: 56,
          textAlign: "center",
        }}
      >
        {meta.label}
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
          {dateLabel} · {timeLabel}{" "}
          <span style={{ fontSize: 11, color: "var(--ink-dim)", fontWeight: 500 }}>
            ({booking.duration_hours}h)
          </span>
        </div>
        <div
          style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2, display: "flex", gap: 8, flexWrap: "wrap" }}
        >
          <span>
            {PURPOSE_LABELS[booking.purpose] ?? booking.purpose}
          </span>
          {booking.status !== "blocked" && (
            <span>
              · {booking.user.nickname ?? booking.user.name ?? "회원"}
              {booking.expected_count ? ` (${booking.expected_count}명 예상)` : ""}
            </span>
          )}
          {booking.cancellation_reason && (
            <span style={{ color: "var(--err)" }}>
              · {booking.cancellation_reason}
            </span>
          )}
        </div>
      </div>
      {cancellable && (
        <button
          type="button"
          className="btn btn--sm"
          onClick={() => onCancel(booking.id)}
          title="이 예약을 취소합니다"
        >
          취소
        </button>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          fontSize: 11,
          color: "var(--ink-dim)",
          fontWeight: 700,
          letterSpacing: ".06em",
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

// 오늘 날짜 KST YYYY-MM-DD
function todayKstYmd(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
