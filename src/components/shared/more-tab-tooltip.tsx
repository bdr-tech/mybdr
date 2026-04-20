"use client";

import { useEffect, useState } from "react";

/* ============================================================
 * MoreTabTooltip — 하단 "더보기" 탭 위에 뜨는 최초 방문 툴팁
 *
 * 왜:
 * - 사용자들이 "더보기" 탭 안에 랭킹/커뮤니티/프로필/설정 등이
 *   숨어 있다는 사실을 잘 모름 → 최초 진입 시 1회 안내 필요.
 * - localStorage로 1회성 노출을 관리해 재방문자에게는 노이즈가 없도록 함.
 *
 * 어떻게:
 * - lg:hidden 으로 모바일에서만 렌더 (PC는 사이드네비에 모든 메뉴 노출됨).
 * - localStorage 키 "more_tab_tooltip_shown" 존재 여부로 노출 판단.
 * - 최초 방문 → mount 후 fade+scale 300ms 진입 → 3초 후 자동 닫힘.
 * - X 버튼 클릭 시 즉시 닫힘 + localStorage 기록.
 * - SSR 안전: localStorage 접근은 useEffect 내부에서만.
 * - 부모는 layout.tsx 더보기 버튼의 relative 컨테이너.
 *   툴팁은 absolute bottom-full (버튼 바로 위)에 띄우고,
 *   하단에 꼬리 화살표를 CSS border 삼각형으로 그린다.
 * ============================================================ */

// 1회성 노출을 제어하는 localStorage 키
const TOOLTIP_KEY = "more_tab_tooltip_shown";

export function MoreTabTooltip() {
  // 실제 렌더 여부 (최초 방문만 true)
  const [show, setShow] = useState(false);
  // 페이드/스케일 트랜지션을 제어하는 visible 상태
  // show=true로 마운트된 직후 rAF로 visible=true 전환 → transition 발동
  const [visible, setVisible] = useState(false);

  /* 마운트 시 localStorage 확인 → 최초 방문이면 노출 */
  useEffect(() => {
    // SSR/구형 브라우저 안전 처리
    if (typeof window === "undefined") return;

    let shown: string | null = null;
    try {
      shown = localStorage.getItem(TOOLTIP_KEY);
    } catch {
      // localStorage 비활성 환경(Safari private 등) — 그냥 툴팁 표시 안 함
      return;
    }

    if (shown) return; // 이미 본 사용자는 노출 생략

    // 최초 방문 — 렌더 후 다음 프레임에 visible 전환하여 transition 발동
    setShow(true);
    const raf = requestAnimationFrame(() => setVisible(true));

    // 3초 후 자동 닫힘
    const timer = setTimeout(() => {
      dismiss();
    }, 3000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 툴팁 닫기 — fade-out 후 언마운트 + localStorage 기록 */
  const dismiss = () => {
    setVisible(false);
    // localStorage 기록: 이후 재방문 시 다시 뜨지 않도록
    try {
      localStorage.setItem(TOOLTIP_KEY, "1");
    } catch {
      /* 무시 */
    }
    // transition duration(300ms)과 맞춰 언마운트
    setTimeout(() => setShow(false), 300);
  };

  // 최초 방문이 아니면 아무것도 렌더하지 않음 (DOM 비용 0)
  if (!show) return null;

  return (
    <div
      // lg:hidden — PC에서는 렌더 자체 차단 (사이드네비에 모든 메뉴 노출됨)
      // absolute bottom-full — 부모(더보기 버튼) 바로 위에 띄움
      // pointer-events-none on wrapper → 탭 클릭 방해 금지
      //   단 내부 버튼만 pointer-events-auto 로 복원
      className={`absolute bottom-full left-1/2 z-[60] mb-2 -translate-x-1/2 pointer-events-none lg:hidden transition-all duration-300 ease-out ${
        visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
      role="tooltip"
      aria-live="polite"
    >
      {/* 말풍선 본체 — BDR Red 배경 + 흰 텍스트 + 4px radius */}
      <div
        className="pointer-events-auto flex items-center gap-2 whitespace-nowrap px-3 py-2 text-xs font-semibold text-white shadow-lg"
        style={{
          backgroundColor: "var(--color-primary)",
          borderRadius: "4px",
        }}
      >
        <span>단체·팀·코트·랭킹은 여기 있어요</span>
        {/* X 버튼 — 즉시 닫힘 */}
        <button
          type="button"
          onClick={(e) => {
            // 부모 더보기 탭 onClick 으로 이벤트가 버블링되지 않도록 차단
            e.stopPropagation();
            dismiss();
          }}
          aria-label="닫기"
          className="flex h-4 w-4 items-center justify-center rounded-sm transition-colors hover:bg-white/20"
        >
          <span className="material-symbols-outlined text-[14px] leading-none">close</span>
        </button>
      </div>

      {/* 꼬리 화살표 — 말풍선 하단 중앙, CSS border 삼각형으로 구현
          아래 방향(더보기 탭을 가리킴) — border-top만 색상, 나머지 transparent */}
      <div
        className="absolute left-1/2 top-full -translate-x-1/2"
        style={{
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "6px solid var(--color-primary)",
        }}
      />
    </div>
  );
}
