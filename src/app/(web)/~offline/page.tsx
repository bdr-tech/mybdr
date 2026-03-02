"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 text-5xl">📵</div>
      <h1 className="mb-2 text-xl font-bold text-[#111827]">오프라인 상태입니다</h1>
      <p className="mb-6 text-sm text-[#6B7280]">
        인터넷 연결을 확인하고 다시 시도해주세요.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-full bg-[#0066FF] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0052CC]"
      >
        다시 시도
      </button>
    </div>
  );
}
