"use client";

import { useEffect, type ReactNode } from "react";

// 관리자 상세 모달 — 화면 중앙에 플로팅되는 모달
// 행 클릭 시 상세 정보를 보여주는 공통 컴포넌트
interface AdminDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode; // 하단 액션 버튼 영역 (optional)
}

export function AdminDetailModal({
  isOpen,
  onClose,
  title,
  children,
  actions,
}: AdminDetailModalProps) {
  // ESC 키로 모달 닫기 + body 스크롤 잠금
  useEffect(() => {
    if (!isOpen) return;

    // 모달 열리면 body 스크롤 잠금
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // 반투명 백드롭 — 클릭 시 모달 닫기
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* 중앙 모달 컨테이너 — fade-in + scale 애니메이션 */}
      <div className="relative mx-4 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-[var(--color-card)] shadow-2xl animate-[modal-in_0.2s_ease-out]">
        {/* 상단: 제목 + X 닫기 버튼 */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-elevated)] hover:text-[var(--color-text-primary)]"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* 본문: 스크롤 가능한 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {/* 하단: 액션 버튼 영역 (actions가 있을 때만 렌더링) */}
        {actions && (
          <div className="border-t border-[var(--color-border)] px-5 py-3">
            {actions}
          </div>
        )}
      </div>

      {/* 모달 애니메이션 정의 */}
      <style jsx global>{`
        @keyframes modal-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// 모달 내부에서 쓸 수 있는 정보 섹션 컴포넌트
// 유저 관리의 InfoSection 패턴을 재사용
export function ModalInfoSection({
  title,
  rows,
}: {
  title: string;
  rows: [string, string | ReactNode | null | undefined][];
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
        {title}
      </p>
      <div className="overflow-hidden rounded-[12px] border border-[var(--color-border)]">
        {rows.map(([label, value], i) => (
          <div
            key={label}
            className={`flex items-center px-4 py-2 ${
              i > 0 ? "border-t border-[var(--color-border-subtle)]" : ""
            }`}
          >
            <span className="w-24 shrink-0 text-xs text-[var(--color-text-muted)]">
              {label}
            </span>
            <span className="break-all text-sm text-[var(--color-text-primary)]">
              {value || (
                <span className="text-[var(--color-text-muted)]">-</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
