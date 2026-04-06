"use client";

/* ============================================================
 * ToastContext — 전역 토스트 알림 시스템
 *
 * 사용법:
 *   const { showToast } = useToast();
 *   showToast("저장되었습니다", "success");
 *   showToast("실패했습니다", "error");
 *   showToast("링크가 복사되었습니다", "info");
 *
 * 원리: Context로 전역 상태를 공유하고,
 *       ToastContainer가 화면 하단에 토스트를 렌더링한다.
 * ============================================================ */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

// 토스트 타입: 성공(초록), 에러(빨강), 정보(파랑)
type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  // 퇴장 애니메이션 트리거 여부
  exiting: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// 타입별 아이콘과 색상 매핑 (CSS 변수 사용)
const TOAST_STYLES: Record<ToastType, { icon: string; bg: string }> = {
  success: { icon: "check_circle", bg: "var(--color-success)" },
  error: { icon: "error", bg: "var(--color-error)" },
  info: { icon: "info", bg: "var(--color-info)" },
};

// 토스트 자동 사라짐 시간 (3초)
const TOAST_DURATION = 3000;
// 퇴장 애니메이션 시간 (300ms)
const EXIT_ANIMATION_DURATION = 300;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // 고유 ID를 위한 카운터 (useRef로 리렌더 없이 증가)
  const idRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++idRef.current;

    // 토스트 추가
    setToasts((prev) => [...prev, { id, message, type, exiting: false }]);

    // 3초 후 퇴장 애니메이션 시작
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
      // 퇴장 애니메이션 후 실제 제거
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, EXIT_ANIMATION_DURATION);
    }, TOAST_DURATION);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* 토스트 컨테이너: 화면 하단 중앙, z-index 최상위 */}
      <div
        className="fixed bottom-24 left-1/2 z-[9999] flex -translate-x-1/2 flex-col items-center gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type];
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-2 rounded-md px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 ${
                toast.exiting
                  ? "translate-y-2 opacity-0"  /* 퇴장: 아래로 이동 + 투명 */
                  : "translate-y-0 opacity-100" /* 등장: 제자리 + 불투명 */
              }`}
              style={{
                backgroundColor: style.bg,
                // 등장 애니메이션: CSS animation으로 처리
                animation: toast.exiting ? undefined : "toast-slide-up 0.3s ease-out",
              }}
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                {style.icon}
              </span>
              {toast.message}
            </div>
          );
        })}
      </div>

      {/* 등장 애니메이션 키프레임 (인라인 style 태그) */}
      <style jsx global>{`
        @keyframes toast-slide-up {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

/**
 * useToast — 토스트를 표시하는 훅
 * 반드시 ToastProvider 내부에서 사용해야 한다.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast는 ToastProvider 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}
