"use client";

import { useState, useEffect, useCallback } from "react";

/* ============================================================
 * PushPermissionBanner — 웹 푸시 알림 구독 배너
 *
 * 브라우저의 Push API + Service Worker를 사용하여:
 * 1. Notification 권한을 요청한다.
 * 2. 권한이 허용되면 PushManager.subscribe()로 구독을 생성한다.
 * 3. 구독 정보를 서버 API(/api/web/push/subscribe)에 전송한다.
 *
 * 이 컴포넌트는 로그인한 유저에게만 표시해야 한다.
 * ============================================================ */

// VAPID 공개키 — 환경변수에서 가져온다 (NEXT_PUBLIC_ 접두사라 클라이언트에서 접근 가능)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/**
 * VAPID 공개키를 Uint8Array로 변환하는 헬퍼
 * (PushManager.subscribe가 applicationServerKey로 Uint8Array를 요구)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushPermissionBanner() {
  // 브라우저가 Push API를 지원하는지
  const [supported, setSupported] = useState(false);
  // 현재 알림 권한 상태
  const [permission, setPermission] = useState<NotificationPermission>("default");
  // 이미 구독되어 있는지 (서비스워커에 구독이 존재하는지)
  const [subscribed, setSubscribed] = useState(false);
  // 처리 중 로딩
  const [loading, setLoading] = useState(false);
  // 배너를 닫았는지 (세션 동안만 유지)
  const [dismissed, setDismissed] = useState(false);

  // 현재 구독 상태를 확인하는 함수
  const checkSubscription = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    } catch {
      // 서비스워커가 아직 준비 안 됐으면 무시
    }
  }, []);

  // 마운트 시: 브라우저 지원 여부 + 기존 구독 확인
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      setSupported(true);
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, [checkSubscription]);

  // 구독 처리: 권한 요청 → 서비스워커 구독 → 서버에 저장
  async function handleSubscribe() {
    setLoading(true);
    try {
      // 1) 브라우저 알림 권한 요청
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        // 권한이 거부되면 더 진행하지 않음
        return;
      }

      // 2) 서비스워커가 준비될 때까지 대기
      const registration = await navigator.serviceWorker.ready;

      // 3) PushManager에 구독 생성 (VAPID 공개키로 서버를 식별)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, // 반드시 true — 알림을 표시해야 함 (브라우저 정책)
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // 4) 구독 정보를 서버에 전송 (endpoint + 암호화 키)
      const res = await fetch("/api/web/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (res.ok) {
        setSubscribed(true);
      }
    } catch {
      // 에러 발생 시 조용히 실패 (네트워크 문제 등)
    } finally {
      setLoading(false);
    }
  }

  // 구독 해제: 서비스워커 구독 취소 → 서버에서 삭제
  async function handleUnsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        // 1) 서버에서 구독 삭제
        await fetch("/api/web/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });

        // 2) 브라우저에서 구독 해제
        await sub.unsubscribe();
        setSubscribed(false);
      }
    } catch {
      // 에러 무시
    } finally {
      setLoading(false);
    }
  }

  // 지원하지 않는 브라우저이거나, 배너를 닫았으면 렌더링 안 함
  if (!supported || dismissed) return null;

  // 이미 구독됨 → 간단한 상태 표시 (설정에서 해제 가능)
  if (subscribed && permission === "granted") {
    return (
      <div className="flex items-center justify-between rounded-md px-4 py-3 border-l-4 border-[var(--color-primary)]"
        style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined text-xl"
            style={{ color: "var(--color-primary)", fontVariationSettings: "'FILL' 1" }}
          >
            notifications_active
          </span>
          <div>
            <p className="text-[12px] font-black uppercase tracking-wider" style={{ color: "var(--color-text-primary)" }}>
              푸시 알림 활성화됨
            </p>
            <p className="text-[10px] font-bold mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              경기 결과, 대회 소식을 받고 있습니다
            </p>
          </div>
        </div>
        <button
          onClick={handleUnsubscribe}
          disabled={loading}
          className="text-[10px] font-black uppercase px-3 py-1.5 rounded-sm transition-colors disabled:opacity-50"
          style={{ color: "var(--color-text-muted)", backgroundColor: "var(--color-surface-alt)" }}
        >
          {loading ? "처리 중..." : "해제"}
        </button>
      </div>
    );
  }

  // 권한이 차단됨
  if (permission === "denied") {
    return (
      <div className="flex items-center justify-between rounded-md px-4 py-3 border-l-4 border-red-500"
        style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-xl"
            style={{ color: "var(--color-text-muted)" }}>
            notifications_off
          </span>
          <div>
            <p className="text-[12px] font-black uppercase tracking-wider" style={{ color: "var(--color-text-primary)" }}>
              알림이 차단되었습니다
            </p>
            <p className="text-[10px] font-bold mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              브라우저 설정에서 알림을 허용해주세요
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="material-symbols-outlined text-lg p-1"
          style={{ color: "var(--color-text-muted)" }}
        >
          close
        </button>
      </div>
    );
  }

  // 기본 상태: 구독 유도 배너
  return (
    <div className="flex items-center justify-between rounded-md px-4 py-3 border-l-4 border-[var(--color-primary)] shadow-sm"
      style={{ backgroundColor: "var(--color-surface)" }}>
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-xl"
          style={{ color: "var(--color-primary)" }}>
          notifications
        </span>
        <div>
          <p className="text-[12px] font-black uppercase tracking-wider pr-1" style={{ color: "var(--color-text-primary)" }}>
            알림 받기
          </p>
          <p className="text-[10px] font-bold mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            경기 결과, 대회 소식을 실시간으로 받아보세요
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setDismissed(true)}
          className="text-[10px] font-black uppercase px-2 py-1.5"
          style={{ color: "var(--color-text-muted)" }}
        >
          나중에
        </button>
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white transition-colors disabled:opacity-50 rounded-sm"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {loading ? "요청 중..." : "허용하기"}
        </button>
      </div>
    </div>
  );
}
