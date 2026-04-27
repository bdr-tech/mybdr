"use client";

import { useEffect, useState } from "react";

/* ============================================================
 * ThemeSwitch (BDR v2)
 *
 * 이유(왜):
 *   v2 원본 AppNav는 라이트/다크 2버튼 토글(.theme-switch__btn)을
 *   헤더 우측에 고정 배치한다. 기존 프로젝트의 ThemeToggle은 단일 아이콘
 *   토글 방식이라 v2 시안과 어긋나므로 별도 구현한다.
 *
 *   호환 포인트:
 *   - v2 CSS 셀렉터 이중화: `[data-theme="dark"]` + `html.dark`
 *     → 두 가지를 모두 세팅해 기존 다크모드 분기(html.dark 기반 JS 체크)가
 *       깨지지 않도록 한다.
 *   - localStorage 키는 기존 `theme-preference` 재사용.
 *
 * 방법(어떻게):
 *   1. 마운트 시 html 태그에서 현재 테마 읽어 상태 초기화 (FOUC 방지 —
 *      layout.tsx의 beforeInteractive 스크립트가 이미 data-theme/class 세팅)
 *   2. 버튼 클릭 시 `document.documentElement.classList` + `dataset.theme`
 *      동시 세팅 + localStorage 저장
 * ============================================================ */

type Theme = "light" | "dark";

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  if (document.documentElement.classList.contains("dark")) return "dark";
  if (document.documentElement.dataset.theme === "dark") return "dark";
  return "light";
}

export function ThemeSwitch() {
  const [theme, setThemeState] = useState<Theme>("light");

  // 마운트 이후 실제 DOM 상태에 맞춰 동기화 (SSR/CSR mismatch 방지)
  useEffect(() => {
    setThemeState(readTheme());
  }, []);

  const applyTheme = (next: Theme) => {
    const html = document.documentElement;
    // 이중 셀렉터 모두 세팅 — CSS가 `[data-theme="dark"], html.dark` 양쪽을 봄
    html.dataset.theme = next;
    if (next === "dark") {
      html.classList.add("dark");
      html.classList.remove("light");
    } else {
      html.classList.add("light");
      html.classList.remove("dark");
    }
    try {
      window.localStorage.setItem("theme-preference", next);
    } catch {
      // 프라이빗 모드 등에서 실패해도 무시 (UI는 유지)
    }
    setThemeState(next);
  };

  return (
    <div className="theme-switch" role="group" aria-label="테마 선택">
      <button
        type="button"
        className="theme-switch__btn"
        data-active={theme === "light"}
        onClick={() => applyTheme("light")}
        aria-pressed={theme === "light"}
      >
        {/* 태양 아이콘 — Material Symbols */}
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          light_mode
        </span>
        <span>라이트</span>
      </button>
      <button
        type="button"
        className="theme-switch__btn"
        data-active={theme === "dark"}
        onClick={() => applyTheme("dark")}
        aria-pressed={theme === "dark"}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          dark_mode
        </span>
        <span>다크</span>
      </button>
    </div>
  );
}
