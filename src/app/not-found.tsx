import Link from "next/link";

// 글로벌 404 페이지: 존재하지 않는 URL로 접속했을 때 Next.js가 자동으로 보여줌
// 서버 컴포넌트로 작성 — 상호작용 없이 링크만 제공하므로 "use client" 불필요
export default function NotFound() {
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
        backgroundColor: "var(--color-bg)",
        color: "var(--color-text-primary)",
      }}
    >
      {/* Material Symbols 아이콘: 찾을 수 없음 */}
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: "64px",
          color: "var(--color-text-muted)",
          marginBottom: "16px",
        }}
      >
        search_off
      </span>

      {/* 404 숫자를 크게 표시 */}
      <h1
        style={{
          fontSize: "56px",
          fontWeight: 700,
          fontFamily: "var(--font-heading), sans-serif",
          color: "var(--color-text-muted)",
          marginBottom: "8px",
          lineHeight: 1,
        }}
      >
        404
      </h1>

      <p
        style={{
          fontSize: "18px",
          fontWeight: 600,
          marginBottom: "8px",
        }}
      >
        페이지를 찾을 수 없습니다
      </p>

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
        요청하신 페이지가 이동되었거나 삭제되었을 수 있습니다.
      </p>

      {/* 홈으로 돌아가기 링크 (Next.js Link로 클라이언트 라우팅) */}
      <Link
        href="/"
        style={{
          padding: "10px 24px",
          backgroundColor: "var(--color-primary)",
          color: "var(--color-text-on-primary)",
          borderRadius: "4px",
          fontSize: "15px",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
