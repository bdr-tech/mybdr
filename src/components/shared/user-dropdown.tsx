"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

export function UserDropdown({
  name,
  role,
  profileImage,
}: {
  name?: string;
  role?: string;
  profileImage?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = name?.trim() ? name.trim()[0].toUpperCase() : "U";
  const isSuperAdmin = role === "super_admin";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* 프로필 아바타 버튼 -- Kinetic Pulse: surface-high 배경, primary 텍스트 */}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-sm font-bold transition-all"
        style={{
          backgroundColor: 'var(--color-surface-high)',
          color: 'var(--color-text-primary)',
        }}
        title={name || "내 계정"}
      >
        {profileImage ? (
          <Image
            src={profileImage}
            alt={name || "프로필"}
            width={36}
            height={36}
            className="h-full w-full object-cover"
          />
        ) : (
          initial
        )}
      </button>

      {/* 드롭다운 패널 -- Kinetic Pulse: surface-high 배경 + 글래스모피즘 + ghost border */}
      {open && (
        <div
          className="absolute right-0 top-12 w-56 py-2 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            backgroundColor: 'var(--color-surface-high)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-elevated)',
          }}
        >
          <div className="px-4 pb-3 pt-2 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-sm font-bold shrink-0"
              style={{ backgroundColor: 'var(--color-surface-bright)', color: 'var(--color-text-primary)' }}
            >
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt={name || "프로필"}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              ) : (
                initial
              )}
            </div>
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{name || "내 계정"}</p>
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
                className="block px-4 py-2 text-sm transition-colors opacity-70 hover:opacity-100 hover:bg-white/5 hover:pl-5"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="pt-1" style={{ borderTop: '1px solid var(--color-border)' }}>
            <a
              href="/api/auth/logout"
              className="block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/5 hover:pl-5"
              style={{ color: 'var(--color-error)' }}
            >
              로그아웃
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
