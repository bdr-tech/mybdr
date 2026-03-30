"use client";

import Link from "next/link";

// 글로벌 404 페이지: "이전 페이지로" 버튼에 history.back()이 필요하므로 클라이언트 컴포넌트
export default function NotFound() {
  return (
    <div
      style={{
        // 화면 전체를 차지하는 중앙 정렬 레이아웃
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        backgroundColor: "var(--color-bg)",
      }}
    >
      {/* 토스 스타일 카드: 둥근 모서리 + 그림자 */}
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "48px 32px",
          borderRadius: "20px",
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-card)",
          textAlign: "center",
        }}
      >
        {/* 큰 아이콘: 페이지를 찾을 수 없음 */}
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: "72px",
            color: "var(--color-text-muted)",
            marginBottom: "16px",
            display: "block",
          }}
        >
          explore_off
        </span>

        {/* 404 숫자 */}
        <p
          style={{
            fontSize: "48px",
            fontWeight: 800,
            fontFamily: "var(--font-heading), sans-serif",
            color: "var(--color-text-muted)",
            lineHeight: 1,
            marginBottom: "12px",
          }}
        >
          404
        </p>

        {/* 제목 */}
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            marginBottom: "8px",
          }}
        >
          페이지를 찾을 수 없어요
        </h1>

        {/* 설명 */}
        <p
          style={{
            fontSize: "14px",
            color: "var(--color-text-secondary)",
            lineHeight: "1.6",
            marginBottom: "32px",
          }}
        >
          주소가 잘못되었거나, 삭제된 페이지입니다.
        </p>

        {/* CTA 버튼 영역 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Primary CTA: 홈으로 돌아가기 */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              height: "48px",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-on-primary)",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>home</span>
            홈으로 돌아가기
          </Link>

          {/* Outline CTA: 이전 페이지로 (history.back) */}
          <button
            type="button"
            onClick={() => window.history.back()}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              height: "48px",
              backgroundColor: "transparent",
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>arrow_back</span>
            이전 페이지로
          </button>
        </div>
      </div>
    </div>
  );
}
