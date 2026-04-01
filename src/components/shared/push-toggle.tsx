"use client";

import { useState, useEffect, useCallback } from "react";

export function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ("Notification" in window && "serviceWorker" in navigator) {
      setSupported(true);
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub);
        });
      });
    }
  }, []);

  const toggle = useCallback(async () => {
    if (!supported || loading) return;
    setLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;

      if (subscribed) {
        // 구독 해제
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
        await fetch("/api/web/push/subscribe", { method: "DELETE" });
        setSubscribed(false);
      } else {
        // 구독 요청
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setLoading(false);
          return;
        }

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          setLoading(false);
          return;
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
        });

        await fetch("/api/web/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });

        setSubscribed(true);
      }
    } catch (err) {
      console.error("Push toggle error:", err);
    } finally {
      setLoading(false);
    }
  }, [supported, subscribed, loading]);

  if (!supported) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="relative p-2 rounded-lg transition-colors hover:bg-[var(--color-surface)]"
      title={subscribed ? "알림 끄기" : "알림 켜기"}
    >
      <span className="material-symbols-outlined text-[20px]">
        {subscribed ? "notifications_active" : "notifications_off"}
      </span>
      {subscribed && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--color-primary)] rounded-full" />
      )}
    </button>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
