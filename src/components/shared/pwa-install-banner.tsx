"use client";

import { useState, useEffect, useRef } from "react";

/**
 * PWA 설치 유도 배너
 *
 * 동작 방식:
 * 1. Chrome/Edge: beforeinstallprompt 이벤트를 잡아서 "설치" 버튼 표시
 * 2. iOS Safari: 수동 안내 ("공유 > 홈 화면에 추가")
 * 3. 이미 설치된 경우(standalone): 배너 미표시
 * 4. "닫기" 클릭 시 localStorage에 7일간 미표시
 */

// localStorage 키 & 미표시 기간(7일)
const STORAGE_KEY = "pwa-install-dismissed";
const DISMISS_DAYS = 7;

// beforeinstallprompt 이벤트 타입 (Chrome 전용)
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // 이미 PWA로 실행 중이면 배너 미표시
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // 7일 미표시 체크
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const expiry = new Date(dismissed).getTime();
      if (Date.now() < expiry) return; // 아직 기간 내
      localStorage.removeItem(STORAGE_KEY); // 만료됨, 제거
    }

    // iOS Safari 감지 (Chrome이 아닌 iOS 기기)
    const ua = navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|Chrome/.test(ua);

    if (isIosDevice && isSafari) {
      setIsIos(true);
      setVisible(true);
      return;
    }

    // Chrome/Edge: beforeinstallprompt 이벤트 대기
    const handler = (e: Event) => {
      e.preventDefault(); // 브라우저 기본 설치 프롬프트 억제
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // "설치" 버튼 클릭 (Chrome/Edge)
  const handleInstall = async () => {
    if (!deferredPromptRef.current) return;
    await deferredPromptRef.current.prompt();
    const { outcome } = await deferredPromptRef.current.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    deferredPromptRef.current = null;
  };

  // "닫기" 버튼 클릭 — 7일간 미표시
  const handleDismiss = () => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + DISMISS_DAYS);
    localStorage.setItem(STORAGE_KEY, expiry.toISOString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="mb-4 flex items-center gap-3 rounded-md px-4 py-3.5 shadow-md border-l-4 border-[var(--color-primary)]"
      style={{
        backgroundColor: "var(--color-card)",
      }}
    >
      {/* 앱 아이콘 영역 */}
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <span className="material-symbols-outlined text-2xl text-white">
          install_mobile
        </span>
      </div>

      {/* 텍스트 영역 */}
      <div className="min-w-0 flex-1">
        <p
          className="text-[13px] font-black uppercase tracking-wider pr-1 truncate"
          style={{ color: "var(--color-text-primary)" }}
        >
          MyBDR 앱 설치
        </p>
        <p
          className="mt-0.5 text-[10px] font-bold truncate"
          style={{ color: "var(--color-text-muted)" }}
        >
          {isIos
            ? "공유 버튼 → '홈 화면에 추가'를 눌러주세요"
            : "홈 화면에 추가하면 더 빠르게 접근할 수 있어요"}
        </p>
      </div>

      {/* 버튼 영역 */}
      <div className="flex shrink-0 items-center gap-2">
        {/* iOS가 아닌 경우에만 "설치" 버튼 표시 */}
        {!isIos && (
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white rounded-sm hover:brightness-110 transition-all shadow-glow-primary"
            style={{
              backgroundColor: "var(--color-primary)",
            }}
          >
            설치
          </button>
        )}
        {/* 닫기 버튼 */}
        <button
          onClick={handleDismiss}
          className="flex h-7 w-7 items-center justify-center rounded-sm transition-colors hover:bg-[var(--color-surface)]"
          aria-label="닫기"
        >
          <span
            className="material-symbols-outlined text-lg"
            style={{ color: "var(--color-text-muted)" }}
          >
            close
          </span>
        </button>
      </div>
    </div>
  );
}
