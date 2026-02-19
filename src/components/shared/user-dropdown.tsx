"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

// Rails navbar 유저 드롭다운 복제
export function UserDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative hidden lg:block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#252525] text-sm font-bold text-[#F4A261] hover:bg-[#2A2A2A]"
      >
        U
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-56 rounded-[16px] border border-[#2A2A2A] bg-[#1A1A1A] py-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {/* User info */}
          <div className="border-b border-[#2A2A2A] px-4 pb-3 pt-2">
            <p className="text-sm font-semibold">사용자</p>
            <p className="text-xs text-[#666666]">user@email.com</p>
          </div>

          <div className="py-1">
            {[
              { href: "/profile", label: "프로필" },
              { href: "/tournament-admin", label: "대회 관리" },
              { href: "/admin", label: "관리자" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-[#A0A0A0] hover:bg-[#252525] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-[#2A2A2A] pt-1">
            <button className="w-full px-4 py-2 text-left text-sm text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)]">
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
