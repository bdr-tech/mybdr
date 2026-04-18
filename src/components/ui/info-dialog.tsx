"use client";

import { useEffect, useRef } from "react";

/**
 * 재사용 가능한 알림 다이얼로그 (InfoDialog)
 *
 * 목적: 인라인 배너 대신 모달로 사용자에게 1회성 알림을 명확히 전달한다.
 * 전역 컨벤션 3요건:
 *  1) ESC 키로 닫기
 *  2) backdrop(바깥 영역) 클릭으로 닫기
 *  3) 확인 버튼으로 닫기 (autofocus — 키보드 엔터 즉시 닫기 가능)
 *
 * 기존 login 페이지 이메일 모달 패턴을 재사용하되, 외부 의존성 없이 자체 구현.
 */
export interface InfoDialogProps {
  /** 열림 상태 */
  open: boolean;
  /** 닫기 콜백 (ESC/backdrop/확인 버튼 공통) */
  onClose: () => void;
  /** 제목 (aria-labelledby로 연결) */
  title: string;
  /** 본문 설명 (aria-describedby로 연결) */
  description: string;
  /** 확인 버튼 라벨 (기본: "확인") */
  confirmLabel?: string;
}

export function InfoDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = "확인",
}: InfoDialogProps) {
  // 확인 버튼 autofocus를 위한 ref (엔터키 즉시 닫기 가능)
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // ESC 키 핸들러 + body 스크롤 잠금
  // 모달 열릴 때마다 리스너 등록/해제, 닫힐 때 스크롤 원상복구
  useEffect(() => {
    if (!open) return;

    // body 스크롤 잠금 (로그인 페이지 이메일 모달과 동일 패턴)
    document.body.style.overflow = "hidden";

    // ESC 키 입력 감지 → onClose 호출
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // 확인 버튼에 포커스 (접근성 + 엔터 즉시 닫기)
    // 애니메이션 직후 포커스 이동을 위해 next tick 사용
    const focusTimer = setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 0);

    // cleanup: 리스너 해제 + 스크롤 원복 + 포커스 타이머 해제
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  // 닫혀 있으면 DOM에 렌더하지 않음 (초기 로드 성능)
  if (!open) return null;

  // aria 속성 연결을 위한 고유 id (title/description 연결)
  const titleId = "info-dialog-title";
  const descId = "info-dialog-description";

  return (
    <div
      // backdrop: 클릭 시 onClose (자기 자신 클릭일 때만 — 내부 클릭 방지)
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      {/* 모달 카드: radius 24px (모달 관행), CSS 변수 색상 */}
      <div
        className="w-full max-w-sm rounded-t-[24px] sm:rounded-[24px] p-6 animate-slide-up sm:animate-fade-in"
        style={{
          backgroundColor: "var(--color-card)",
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        {/* 제목 */}
        <h2
          id={titleId}
          className="text-lg font-bold mb-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </h2>

        {/* 본문 설명 */}
        <p
          id={descId}
          className="text-sm mb-5"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {description}
        </p>

        {/* 확인 버튼: autofocus + primary 배경 + radius 4px (버튼 컨벤션) */}
        <button
          ref={confirmButtonRef}
          type="button"
          onClick={onClose}
          className="w-full rounded-[4px] py-3 text-sm font-semibold text-white transition-all active:scale-[0.98] focus:outline-none focus:ring-2"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {confirmLabel}
        </button>
      </div>

      {/* 모달 애니메이션 (login 페이지 이메일 모달과 동일 키프레임 — 중복 정의는 Next가 해시로 병합) */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fade-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
