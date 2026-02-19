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
    { href: "/teams", label: "내 팀", icon: "👕" },
    { href: "/courts", label: "코트 찾기", icon: "📍" },
    { href: "/profile", label: "프로필", icon: "👤" },
    { href: "/tournament-admin", label: "대회 관리", icon: "⚙️", adminOnly: true },
    { href: "/admin", label: "관리자", icon: "🔧", superAdminOnly: true },
  ],
};

export function SlideMenu({
  open,
  onClose,
  isLoggedIn,
}: {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
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
        className={`fixed right-0 top-0 z-[70] h-full w-[300px] transform bg-[#1A1A1A] transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A2A2A] p-4">
          <span className="font-bold text-[#F4A261]">메뉴</span>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#A0A0A0] hover:bg-[#252525]"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-4" style={{ height: "calc(100% - 57px)" }}>
          {isLoggedIn ? (
            <>
              {/* User Info */}
              <div className="mb-6 rounded-[16px] bg-[#252525] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4A261] text-sm font-bold text-[#0A0A0A]">
                    U
                  </div>
                  <div>
                    <p className="font-semibold">사용자</p>
                    <p className="text-xs text-[#A0A0A0]">user@email.com</p>
                  </div>
                </div>
              </div>

              {/* 게시판 */}
              <div className="mb-6">
                <p className="mb-2 text-xs font-medium text-[#666666]">게시판</p>
                {menuSections.boards.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center rounded-[12px] px-3 py-2.5 text-sm text-[#A0A0A0] hover:bg-[#252525] hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* 기타 */}
              <div className="mb-6">
                <p className="mb-2 text-xs font-medium text-[#666666]">기타</p>
                {menuSections.etc.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-[12px] px-3 py-2.5 text-sm text-[#A0A0A0] hover:bg-[#252525] hover:text-white"
                  >
                    {item.icon && <span>{item.icon}</span>}
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* 로그아웃 */}
              <button className="w-full rounded-[12px] px-3 py-2.5 text-left text-sm text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)]">
                로그아웃
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="mb-4 text-[#A0A0A0]">로그인하고 BDR의 모든 기능을 이용하세요</p>
              <Link
                href="/login"
                onClick={onClose}
                className="mb-2 w-full rounded-full bg-[#F4A261] py-3 text-center text-sm font-semibold text-[#0A0A0A]"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="w-full rounded-full border border-[#2A2A2A] py-3 text-center text-sm text-[#A0A0A0]"
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
