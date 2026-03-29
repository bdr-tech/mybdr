"use client";

import { useState, useEffect } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    /* dark/light 클래스를 동시에 토글 (CSS 변수가 html.light에 정의됨) */
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.classList.toggle("light", !next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  if (!mounted) return <div className="h-9 w-9" />;

  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[rgba(27,60,135,0.08)]"
      aria-label={dark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      title={dark ? "라이트 모드" : "다크 모드"}
      style={{ color: dark ? "var(--color-warning)" : "var(--color-text-muted)" }}
    >
      {/* 다크모드: light_mode(해) / 라이트모드: dark_mode(달) */}
      <span className="material-symbols-outlined text-xl">{dark ? "light_mode" : "dark_mode"}</span>
    </button>
  );
}
