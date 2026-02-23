"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { logoutAction } from "@/app/actions/auth";

export function UserDropdown({ name }: { name?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = (name && name.trim()) ? name.trim()[0].toUpperCase() : "U";

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
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF2FF] text-sm font-bold text-[#0066FF] hover:bg-[#E8ECF0]"
        title={name || "내 계정"}
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-56 rounded-[16px] border border-[#E8ECF0] bg-[#FFFFFF] py-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          <div className="border-b border-[#E8ECF0] px-4 pb-3 pt-2">
            <p className="text-sm font-semibold">{name || "내 계정"}</p>
          </div>

          <div className="py-1">
            {[
              { href: "/profile", label: "프로필" },
              { href: "/games/my-games", label: "내 경기" },
              { href: "/tournament-admin", label: "대회 관리" },
              { href: "/admin", label: "관리자" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-[#6B7280] hover:bg-[#EEF2FF] hover:text-[#111827]"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-[#E8ECF0] pt-1">
            <form action={logoutAction}>
              <button type="submit" className="w-full px-4 py-2 text-left text-sm text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)]">
                로그아웃
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
