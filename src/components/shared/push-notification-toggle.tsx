"use client";

import { useState, useEffect } from "react";

/* ============================================================
 * PushNotificationToggle — 푸시 알림 권한 요청 UI
 *
 * 브라우저의 Notification API를 사용하여:
 * - 현재 알림 권한 상태를 표시 (허용됨/차단됨/미설정)
 * - 미설정 상태일 때 "알림 허용하기" 버튼 제공
 *
 * 주의: Notification API는 브라우저에서만 사용 가능하므로
 *       typeof window 체크로 SSR 환경을 방어한다.
 * ============================================================ */
export function PushNotificationToggle() {
  /* 브라우저 Notification API 지원 여부 */
  const [supported, setSupported] = useState(false);
  /* 현재 알림 권한 상태: "default" | "granted" | "denied" */
  const [permission, setPermission] = useState<NotificationPermission>("default");
  /* 권한 요청 중 로딩 상태 */
  const [requesting, setRequesting] = useState(false);

  /* 컴포넌트 마운트 시 브라우저 환경 확인 + 현재 권한 읽기 */
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  /* 브라우저가 Notification을 지원하지 않으면 렌더링 안 함 */
  if (!supported) return null;

  /* 사용자에게 알림 권한을 요청하는 함수 */
  async function requestPermission() {
    setRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch {
      /* 권한 요청 실패 시 무시 (일부 브라우저 제한) */
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-xl px-4 py-3 bg-[var(--color-surface)]">
      {/* 좌측: 아이콘 + 라벨 */}
      <div className="flex items-center gap-3">
        <span
          className="material-symbols-outlined text-xl"
          style={{ color: permission === "granted" ? "var(--color-primary)" : "var(--color-text-muted)" }}
        >
          notifications_active
        </span>
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            푸시 알림
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {permission === "granted" && "알림이 허용되었습니다"}
            {permission === "denied" && "브라우저 설정에서 변경해주세요"}
            {permission === "default" && "경기 결과, 대회 소식을 받아보세요"}
          </p>
        </div>
      </div>

      {/* 우측: 상태 표시 또는 허용 버튼 */}
      <div className="shrink-0">
        {permission === "granted" && (
          <span
            className="material-symbols-outlined text-xl"
            style={{ color: "var(--color-primary)", fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
        )}
        {permission === "denied" && (
          <span
            className="material-symbols-outlined text-xl"
            style={{ color: "var(--color-text-muted)" }}
          >
            block
          </span>
        )}
        {permission === "default" && (
          <button
            onClick={requestPermission}
            disabled={requesting}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {requesting ? "요청 중..." : "허용하기"}
          </button>
        )}
      </div>
    </div>
  );
}
