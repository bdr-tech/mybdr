"use client";

import { useState, useEffect } from "react";

export function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ("Notification" in window && "serviceWorker" in navigator) {
      setSupported(true);
      // 이미 구독됐는지 확인
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub);
        });
      });
    }
  }, []);

  if (!supported) return null;

  const toggle = async () => {
    setLoading(true);
    try {
      if (subscribed) {
        // 구독 해제
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();

        await fetch("/api/web/push/subscribe", {
          method: "DELETE",
          credentials: "include",
        });
        setSubscribed(false);
      } else {
        // 구독
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });

        await fetch("/api/web/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(sub.toJSON()),
        });
        setSubscribed(true);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[rgba(27,60,135,0.08)] disabled:opacity-50"
      title={subscribed ? "알림 끄기" : "알림 받기"}
      style={{ color: subscribed ? "var(--color-primary)" : "var(--color-text-muted)" }}
    >
      <span
        className="material-symbols-outlined text-xl"
        style={subscribed ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {subscribed ? "notifications_active" : "notification_add"}
      </span>
    </button>
  );
}
