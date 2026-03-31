"use client";

// ============================================================
// (web) 레이아웃 에러 바운더리
//
// 왜 이게 필요한가?
// - 페이지에서 에러가 발생하면 React가 전체를 날려버린다.
// - error.tsx를 두면 레이아웃(헤더+네비)은 유지하면서 에러 영역만 교체된다.
// - 즉, 에러가 나도 사용자가 다른 페이지로 이동할 수 있다.
//
// Next.js 규칙: error.tsx는 반드시 "use client" 필요
// ============================================================

import { useEffect } from "react";

export default function WebError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // 에러 발생 시 콘솔에 기록 (프로덕션에서는 모니터링 서비스로 전송 가능)
  useEffect(() => {
    console.error("[WebError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      {/* 에러 아이콘 — Material Symbols Outlined */}
      <span
        className="material-symbols-outlined mb-4"
        style={{ fontSize: "64px", color: "var(--color-text-muted)" }}
      >
        error_outline
      </span>

      {/* 에러 제목 */}
      <h2
        className="mb-2 text-xl font-bold"
        style={{ color: "var(--color-text-primary)" }}
      >
        문제가 발생했습니다
      </h2>

      {/* 에러 설명 */}
      <p
        className="mb-6 max-w-md text-sm leading-relaxed"
        style={{ color: "var(--color-text-muted)" }}
      >
        페이지를 불러오는 중 오류가 발생했습니다.
        <br />
        잠시 후 다시 시도해 주세요.
      </p>

      {/* 다시 시도 버튼 — reset()은 해당 세그먼트를 다시 렌더링 시도 */}
      <button
        onClick={reset}
        className="rounded px-6 py-3 text-sm font-semibold text-white transition-colors"
        style={{
          backgroundColor: "var(--color-primary)",
          borderRadius: "4px", // pill 금지, 4px 규칙
        }}
      >
        다시 시도
      </button>

      {/* 에러 식별자: 프로덕션에서 디버깅에 유용 (digest는 Next.js가 자동 생성) */}
      {error.digest && (
        <p
          className="mt-4 text-xs"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          오류 코드: {error.digest}
        </p>
      )}
    </div>
  );
}
