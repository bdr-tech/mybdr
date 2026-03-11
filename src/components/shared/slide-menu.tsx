"use client";

import Link from "next/link";

// Rails _full_menu.html.erb 복제
const menuSections = {
  boards: [
    { href: "/community", label: "게시판 전체" },
    { href: "/community?category=general", label: "자유게시판" },
    { href: "/community?category=info", label: "정보게시판" },
    { href: "/community?category=review", label: "후기게시판" },
    { href: "/community?category=marketplace", label: "장터게시판" },
  ],
  etc: [
    { href: "/games/my-games", label: "내 경기", icon: "🏀" },
    { href: "/teams", label: "내 팀", icon: "👕" },
    { href: "/courts", label: "코트 찾기", icon: "📍" },
    // { href: "/pricing", label: "요금제", icon: "💳" },
    { href: "/profile", label: "프로필", icon: "👤" },
    { href: "/tournament-admin", label: "대회 관리", icon: "⚙️", adminOnly: true },
    { href: "/admin", label: "관리자", icon: "🔧", superAdminOnly: true },
  ],
};

export function SlideMenu({
  open,
  onClose,
  isLoggedIn,
  role,
  name,
  email,
}: {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  role?: string;
  name?: string;
  email?: string;
}) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/60"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="전체 메뉴"
        className={`fixed right-0 top-0 z-[70] h-full w-[300px] transform bg-[#FFFFFF] transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8ECF0] p-4">
          <span className="font-bold text-[#F4A261]">메뉴</span>
          <button
            onClick={onClose}
            aria-label="메뉴 닫기"
            className="rounded-full p-2 text-[#6B7280] hover:bg-[#EEF2FF]"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-4" style={{ height: "calc(100% - 57px)" }}>
          {isLoggedIn ? (
            <>
              {/* User Info — /profile 링크 */}
              <Link
                href="/profile"
                onClick={onClose}
                className="mb-6 flex items-center gap-3 rounded-[16px] bg-[#EEF2FF] p-4 transition-colors hover:bg-[#E8ECF0] active:opacity-80"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0066FF] text-sm font-bold text-white">
                  {name?.trim() ? name.trim()[0].toUpperCase() : "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{name || "사용자"}</p>
                  {email && <p className="truncate text-xs text-[#6B7280]">{email}</p>}
                </div>
                <span className="flex-shrink-0 text-xs text-[#9CA3AF]">›</span>
              </Link>

              {/* 게시판 */}
              <div className="mb-6">
                <p className="mb-2 text-xs font-medium text-[#9CA3AF]">게시판</p>
                {menuSections.boards.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center rounded-[12px] px-3 py-2.5 text-sm text-[#6B7280] hover:bg-[#EEF2FF] hover:text-[#111827]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* 기타 */}
              <div className="mb-6">
                <p className="mb-2 text-xs font-medium text-[#9CA3AF]">기타</p>
                {menuSections.etc
                  .filter((item) => {
                    if (item.superAdminOnly) return role === "super_admin";
                    if (item.adminOnly) return role === "super_admin" || role === "tournament_admin";
                    return true;
                  })
                  .map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-2 rounded-[12px] px-3 py-2.5 text-sm text-[#6B7280] hover:bg-[#EEF2FF] hover:text-[#111827]"
                    >
                      {item.icon && <span>{item.icon}</span>}
                      {item.label}
                    </Link>
                  ))}
              </div>

              {/* 로그아웃 */}
              <a
                href="/api/auth/logout"
                className="block w-full rounded-[12px] px-3 py-2.5 text-left text-sm text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)]"
              >
                로그아웃
              </a>
            </>
          ) : (
            <div className="flex flex-col">
              {/* 브랜드 */}
              <div className="mb-6 rounded-[16px] bg-[#EEF2FF] px-5 py-6 text-center">
                <p className="text-2xl font-bold text-[#F4A261]">BDR</p>
                <p className="mt-1 text-xs text-[#6B7280]">농구인을 위한 농구 플랫폼</p>
              </div>

              {/* 기능 소개 */}
              <div className="mb-6 space-y-3">
                {[
                  { icon: "🏀", title: "픽업게임", desc: "내 주변 경기 참가" },
                  { icon: "👕", title: "팀 관리", desc: "팀원 모집 · 매니지먼트" },
                  { icon: "🏆", title: "토너먼트", desc: "대회 참가 · 전적 관리" },
                ].map((f) => (
                  <div key={f.title} className="flex items-center gap-3 rounded-[12px] px-3 py-2">
                    <span className="text-xl">{f.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-[#111827]">{f.title}</p>
                      <p className="text-xs text-[#9CA3AF]">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA 버튼 */}
              <Link
                href="/login"
                onClick={onClose}
                className="mb-2 w-full rounded-full bg-[#0066FF] py-3 text-center text-sm font-semibold text-white hover:bg-[#0052CC]"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="w-full rounded-full border border-[#E8ECF0] py-3 text-center text-sm font-medium text-[#6B7280] hover:bg-[#F5F7FA]"
              >
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
