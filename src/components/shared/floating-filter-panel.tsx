"use client";

import { useState, useEffect, useCallback } from "react";

// --- 필터 설정 타입 ---
// 각 페이지가 "어떤 필터를 보여줄지"를 이 형태로 전달하면
// FloatingFilterPanel이 알아서 그려줌 (레고 블록처럼 조립하는 방식)
export interface FilterConfig {
  key: string;                                    // 필터 식별 키 (예: "type", "city")
  label: string;                                  // 한글 라벨 (예: "유형", "지역")
  type: "select" | "tabs";                        // select: 버튼 그룹, tabs: 가로 스크롤 탭
  options: { value: string; label: string }[];     // 선택 가능한 옵션 목록
  value: string;                                  // 현재 선택된 값
  onChange: (value: string) => void;              // 값 변경 콜백
}

// --- 패널 Props ---
export interface FloatingFilterPanelProps {
  filters: FilterConfig[];
  onReset: () => void;       // 초기화 콜백
  activeCount: number;       // 활성 필터 수 (기본값이 아닌 것의 개수)
}

/**
 * FloatingFilterPanel - 플로팅 필터 패널 공통 컴포넌트
 *
 * 비유: 모든 방(페이지)에서 동일한 형태의 슬라이드 서랍(패널)을 사용.
 * 트리거 버튼을 누르면 오른쪽에서 패널이 슬라이드하며 나타남.
 *
 * - 트리거 버튼: "tune" 아이콘 (원형, h-9 w-9)
 * - 활성 필터가 있으면 빨간 뱃지 표시
 * - 패널: 오른쪽에서 슬라이드 (320px, 모바일은 전체 너비)
 * - 반투명 백드롭 (클릭 시 닫기)
 * - ESC 키로 닫기
 */
export function FloatingFilterPanel({
  filters,
  onReset,
  activeCount,
}: FloatingFilterPanelProps) {
  // 패널 열림/닫기 상태
  const [isOpen, setIsOpen] = useState(false);

  // ESC 키로 패널 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // 패널이 열리면 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // 패널 닫기 핸들러
  const handleClose = useCallback(() => setIsOpen(false), []);

  // 초기화 버튼 핸들러
  const handleReset = useCallback(() => {
    onReset();
  }, [onReset]);

  return (
    <>
      {/* 트리거 버튼: "tune" 아이콘 (MY 버튼과 동일 크기/스타일) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors"
        style={{
          backgroundColor: "var(--color-accent)",
          color: "#fff",
        }}
        aria-label="필터 열기"
        title="필터"
      >
        <span className="material-symbols-outlined text-lg">tune</span>
        {/* 활성 필터 수 뱃지: 1개 이상일 때만 표시 */}
        {activeCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {activeCount}
          </span>
        )}
      </button>

      {/* 백드롭: 반투명 검정, 클릭 시 닫기 */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-50 transition-opacity duration-300"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
        onClick={handleClose}
      />

      {/* 패널: 오른쪽에서 슬라이드 인 (width 320px, 모바일 전체) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="필터 패널"
        className="fixed top-0 right-0 z-50 h-full w-full sm:w-80 flex flex-col transition-transform duration-300 ease-in-out"
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          backgroundColor: "var(--color-surface)",
          borderLeft: "1px solid var(--color-border)",
        }}
      >
        {/* 패널 헤더: "필터" 제목 + 닫기(X) 버튼 */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <h3
            className="text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            필터
          </h3>
          <button
            type="button"
            onClick={handleClose}
            aria-label="필터 닫기"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            style={{ color: "var(--color-text-muted)" }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* 패널 본문: 각 FilterConfig를 순서대로 렌더링 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {filters.map((filter) => (
            <FilterSection key={filter.key} filter={filter} />
          ))}
        </div>

        {/* 패널 하단 (sticky): "초기화" + "닫기" 버튼 */}
        <div
          className="shrink-0 px-6 py-4 flex items-center gap-3"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          {/* 초기화 버튼 (왼쪽) */}
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 py-3 rounded text-sm font-medium transition-colors"
            style={{
              backgroundColor: "var(--color-elevated)",
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-border)",
            }}
          >
            초기화
          </button>
          {/* 닫기 버튼 (오른쪽, 빨간색) */}
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 rounded text-sm font-bold text-white transition-colors"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            적용
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * FilterSection - 개별 필터 항목 렌더링
 *
 * type에 따라 다른 UI를 그림:
 * - "select": 옵션 버튼 그룹 (세로 배열, 선택된 것은 primary 색상)
 * - "tabs": 가로 스크롤 탭 (pill 스타일)
 */
function FilterSection({ filter }: { filter: FilterConfig }) {
  return (
    <div>
      {/* 라벨 */}
      <p
        className="text-xs font-bold uppercase tracking-wider mb-3"
        style={{ color: "var(--color-text-muted)" }}
      >
        {filter.label}
      </p>

      {/* 옵션 버튼 그룹 */}
      {filter.type === "select" ? (
        // select 타입: 세로 배열 버튼 그룹
        <div className="flex flex-wrap gap-2">
          {filter.options.map((opt) => {
            const isActive = filter.value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => filter.onChange(opt.value)}
                className="px-4 py-2 rounded text-sm font-medium transition-colors"
                style={
                  isActive
                    ? {
                        backgroundColor: "var(--color-primary)",
                        color: "var(--color-on-primary)",
                      }
                    : {
                        backgroundColor: "var(--color-elevated)",
                        color: "var(--color-text-secondary)",
                        border: "1px solid var(--color-border)",
                      }
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      ) : (
        // tabs 타입: 세로 배열 (카테고리처럼 항목이 많을 때)
        <div className="flex flex-col gap-1">
          {filter.options.map((opt) => {
            const isActive = filter.value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => filter.onChange(opt.value)}
                className="text-left px-4 py-2.5 rounded text-sm font-medium transition-colors"
                style={
                  isActive
                    ? {
                        backgroundColor: "var(--color-primary)",
                        color: "var(--color-on-primary)",
                      }
                    : {
                        color: "var(--color-text-secondary)",
                      }
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
