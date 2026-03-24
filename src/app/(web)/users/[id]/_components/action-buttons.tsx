"use client";

/**
 * ActionButtons - 타인 프로필 CTA 버튼 (클라이언트 컴포넌트)
 *
 * 서버 컴포넌트(page.tsx)에서 onClick을 직접 쓸 수 없으므로
 * 클라이언트 컴포넌트로 분리. 백엔드 없으므로 alert 처리.
 */

export function ActionButtons() {
  return (
    <div className="flex flex-wrap justify-center md:justify-start gap-3">
      <button
        className="flex items-center gap-2 px-5 py-2 font-bold text-sm rounded text-white transition-all hover:opacity-90"
        style={{ backgroundColor: "var(--color-primary)" }}
        onClick={() => alert("준비 중인 기능입니다")}
      >
        <span className="material-symbols-outlined text-sm">send</span>
        메시지 보내기
      </button>
      <button
        className="flex items-center gap-2 px-5 py-2 font-bold text-sm rounded border transition-all hover:opacity-80"
        style={{
          borderColor: "var(--color-text-secondary)",
          color: "var(--color-text-primary)",
          backgroundColor: "transparent",
        }}
        onClick={() => alert("준비 중인 기능입니다")}
      >
        <span className="material-symbols-outlined text-sm">person_add</span>
        팔로우
      </button>
    </div>
  );
}
