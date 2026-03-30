"use client";

/* ============================================================
 * QR 체크인 페이지 -- QR 스캔 시 자동 체크인
 *
 * 사용자가 코트에 부착된 QR 코드를 스캔하면 이 페이지로 이동.
 * 마운트 즉시 method:"qr"로 체크인 API를 호출한다.
 * QR 방식이므로 GPS 검증을 스킵한다 (현장에 있다는 증거 = QR 자체).
 * ============================================================ */

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

export default function QrCheckinPage() {
  const params = useParams();
  const router = useRouter();
  const courtId = params.id as string;

  // 상태: idle → loading → success / error
  const [status, setStatus] = useState<"loading" | "success" | "error" | "already">("loading");
  const [message, setMessage] = useState("체크인 처리 중...");
  const [courtName, setCourtName] = useState<string | null>(null);

  // 중복 호출 방지 (StrictMode에서 2번 마운트 대응)
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    async function doCheckin() {
      try {
        // QR 체크인은 GPS 좌표를 0,0으로 보내고 method:"qr"로 표시
        // API에서 method:"qr"이면 GPS 거리 검증을 스킵함
        const res = await fetch(`/api/web/courts/${courtId}/checkin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "qr",
            latitude: 0,
            longitude: 0,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          // 체크인 성공
          setStatus("success");
          setMessage("체크인 완료!");
        } else if (res.status === 401) {
          // 미로그인 → 로그인 페이지로 리다이렉트
          setStatus("error");
          setMessage("로그인이 필요합니다");
          // 3초 후 로그인 페이지로 이동 (돌아올 URL 포함)
          setTimeout(() => {
            router.push(`/login?redirect=/courts/${courtId}/checkin`);
          }, 2000);
          return;
        } else if (res.status === 409) {
          // 이미 다른 코트에 체크인 중
          setStatus("already");
          setCourtName(data.checked_in_court_name ?? "다른 코트");
          setMessage(`${data.checked_in_court_name ?? "다른 코트"}에 이미 체크인 중이에요`);
          return;
        } else {
          // 기타 에러
          setStatus("error");
          setMessage(data.error ?? "체크인에 실패했습니다");
        }
      } catch {
        setStatus("error");
        setMessage("네트워크 오류가 발생했습니다");
      }
    }

    doCheckin();
  }, [courtId, router]);

  // 상태별 아이콘과 색상
  const iconMap = {
    loading: { icon: "progress_activity", color: "var(--color-text-muted)", spin: true },
    success: { icon: "check_circle", color: "var(--color-success)", spin: false },
    error: { icon: "error", color: "var(--color-primary)", spin: false },
    already: { icon: "info", color: "var(--color-accent)", spin: false },
  };

  const { icon, color, spin } = iconMap[status];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* 상태 아이콘 */}
      <span
        className={`material-symbols-outlined mb-4 ${spin ? "animate-spin" : ""}`}
        style={{ fontSize: "64px", color }}
      >
        {icon}
      </span>

      {/* 메시지 */}
      <h1
        className="text-xl font-bold text-center mb-2"
        style={{ color: "var(--color-text-primary)" }}
      >
        {message}
      </h1>

      {/* 성공 시: 코트 상세 페이지로 이동 안내 */}
      {status === "success" && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <p
            className="text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            즐거운 농구 되세요!
          </p>
          <button
            onClick={() => router.push(`/courts/${courtId}`)}
            className="inline-flex items-center gap-1.5 rounded-[4px] px-6 py-3 text-sm font-bold text-white transition-all active:scale-95"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              sports_basketball
            </span>
            코트 상세 보기
          </button>
        </div>
      )}

      {/* 이미 체크인 중: 해당 코트로 이동 또는 현재 코트로 이동 */}
      {status === "already" && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <p
            className="text-sm text-center"
            style={{ color: "var(--color-text-muted)" }}
          >
            먼저 체크아웃한 후 다시 시도해주세요
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/courts/${courtId}`)}
              className="inline-flex items-center gap-1.5 rounded-[4px] px-5 py-3 text-sm font-bold transition-all active:scale-95"
              style={{
                backgroundColor: "var(--color-surface-bright)",
                color: "var(--color-text-primary)",
              }}
            >
              이 코트 보기
            </button>
          </div>
        </div>
      )}

      {/* 에러 시: 코트 상세로 돌아가기 */}
      {status === "error" && (
        <div className="mt-6">
          <button
            onClick={() => router.push(`/courts/${courtId}`)}
            className="inline-flex items-center gap-1.5 rounded-[4px] px-6 py-3 text-sm font-bold transition-all active:scale-95"
            style={{
              backgroundColor: "var(--color-surface-bright)",
              color: "var(--color-text-primary)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              arrow_back
            </span>
            코트로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
}
