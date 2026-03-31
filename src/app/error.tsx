"use client";

import { useEffect } from "react";
import { captureException } from "@/lib/utils/error-tracker";

// 글로벌 에러 페이지: 예상치 못한 에러 발생 시 Next.js가 자동으로 이 컴포넌트를 보여줌
// "use client" 필수 — 에러 바운더리는 클라이언트 컴포넌트여야 함
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // 에러 발생 시 추적 서비스에 자동 보고
  useEffect(() => {
    captureException(error, {
      context: "error.tsx",
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div
      style={{
        // 화면 전체를 차지하는 중앙 정렬 레이아웃
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        // CSS 변수로 테마 색상 적용 (다크/라이트 자동 대응)
        backgroundColor: "var(--color-bg)",
        color: "var(--color-text-primary)",
      }}
    >
      {/* Material Symbols 에러 아이콘 */}
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: "64px",
          color: "var(--color-error)",
          marginBottom: "16px",
        }}
      >
        error
      </span>

      <h1
        style={{
          fontSize: "24px",
          fontWeight: 700,
          marginBottom: "8px",
        }}
      >
        문제가 발생했습니다
      </h1>

      <p
        style={{
          fontSize: "15px",
          color: "var(--color-text-secondary)",
          marginBottom: "24px",
          textAlign: "center",
          maxWidth: "360px",
          lineHeight: "1.5",
        }}
      >
        일시적인 오류가 발생했습니다. 아래 버튼을 눌러 다시 시도하거나, 잠시 후 다시 방문해주세요.
      </p>

      {/* reset() 호출 시 React가 에러 바운더리를 초기화하고 컴포넌트를 다시 렌더링 */}
      <button
        onClick={reset}
        style={{
          padding: "10px 24px",
          backgroundColor: "var(--color-primary)",
          color: "var(--color-text-on-primary)",
          border: "none",
          borderRadius: "4px", // pill 금지, 4px 규칙
          fontSize: "15px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        다시 시도
      </button>
    </div>
  );
}
