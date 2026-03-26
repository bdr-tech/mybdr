"use client";

import { useState, useEffect } from "react";

export function TextSizeToggle() {
  const [large, setLarge] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isLarge = document.documentElement.classList.contains("large-text");
    setLarge(isLarge);
  }, []);

  const toggle = () => {
    const next = !large;
    setLarge(next);
    document.documentElement.classList.toggle("large-text", next);
    localStorage.setItem("textSize", next ? "large" : "normal");
  };

  if (!mounted) return <div className="h-9 w-9" />;

  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[rgba(27,60,135,0.08)]"
      aria-label={large ? "기본 글씨 크기로 전환" : "큰 글씨 크기로 전환"}
      title={large ? "기본 글씨" : "큰 글씨"}
      style={{ color: large ? "var(--color-primary)" : "var(--color-text-muted)" }}
    >
      {/* 텍스트 크기 조절 아이콘 */}
      <span className="material-symbols-outlined text-xl">text_fields</span>
    </button>
  );
}
