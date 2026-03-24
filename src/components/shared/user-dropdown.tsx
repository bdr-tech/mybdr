"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

export function UserDropdown({ name, role, profileImage }: { name?: string; role?: string; profileImage?: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = (name && name.trim()) ? name.trim()[0].toUpperCase() : "U";
  const isSuperAdmin = role === "super_admin";

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
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EDF0F8] text-sm font-bold text-[#1B3C87] hover:bg-[#E8ECF0] overflow-hidden"
        title={name || "내 계정"}
      >
        {profileImage ? (
          <Image src={profileImage} alt="" width={36} height={36} className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-56 rounded-[16px] border border-[#E8ECF0] bg-[#FFFFFF] py-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          <div className="border-b border-[#E8ECF0] px-4 pb-3 pt-2 flex items-center gap-3">
            {profileImage ? (
              <Image src={profileImage} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EDF0F8] text-xs font-bold text-[#1B3C87]">
                {initial}
              </div>
            )}
            <p className="text-sm font-semibold">{name || "내 계정"}</p>
          </div>

          <div className="py-1">
            {[
              { href: "/profile", label: "프로필" },
              { href: "/games/my-games", label: "내 경기" },
              { href: "/tournament-admin", label: "대회 관리" },
              ...(isSuperAdmin ? [{ href: "/admin", label: "관리자" }] : []),
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-[#6B7280] hover:bg-[#EDF0F8] hover:text-[#111827]"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-[#E8ECF0] pt-1">
            <a
              href="/api/auth/logout"
              className="block w-full px-4 py-2 text-left text-sm text-[#DC2626] hover:bg-[rgba(220,38,38,0.1)]"
            >
              로그아웃
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
