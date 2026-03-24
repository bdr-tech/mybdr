"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/* 메뉴 항목 정의: bdr_6 스타일 — 아이콘 + 타이틀 + 서브텍스트 */
const MENU_POOL = [
  { id: "find_game",    label: "경기 찾기",  sub: "실시간 매칭 리스트", icon: "🏀", href: "/games",              iconBg: "var(--color-accent)" },
  { id: "my_team",      label: "내 팀",      sub: "팀 관리 및 일정",    icon: "👥", href: "/teams",              iconBg: "var(--color-primary)" },
  { id: "tournaments",  label: "대회 보기",  sub: "공식 토너먼트 신청", icon: "🏆", href: "/tournaments",        iconBg: "var(--color-tertiary)" },
  { id: "pickup",       label: "픽업 신청",  sub: "원데이 농구 모임",   icon: "⚡", href: "/games?type=pickup",  iconBg: "var(--color-text-muted)" },
  { id: "my_schedule",  label: "일정",       sub: "나의 경기 일정",     icon: "📅", href: "/schedule",           iconBg: "var(--color-success)" },
  { id: "stats",        label: "기록",       sub: "시즌 스탯 확인",     icon: "📊", href: "/profile?tab=stats",  iconBg: "var(--color-info)" },
  { id: "community",    label: "게시판",     sub: "커뮤니티 글",        icon: "💬", href: "/community",          iconBg: "var(--color-warning)" },
  { id: "ranking",      label: "랭킹",       sub: "시즌 랭킹 보기",    icon: "🥇", href: "/ranking",            iconBg: "var(--color-error)" },
  { id: "venue",        label: "코트",       sub: "주변 코트 정보",     icon: "📍", href: "/courts",             iconBg: "var(--color-accent)" },
] as const;

type MenuId = (typeof MENU_POOL)[number]["id"];

const DEFAULT_ITEMS: MenuId[] = ["find_game", "my_team", "tournaments", "pickup"];
const MAX_ITEMS = 4;

/* ============================================================
 * QuickMenu — bdr_6 디자인 완전 복제
 * - grid 2열(모바일) / 4열(lg)
 * - 각 카드: bg-surface-high, rounded-xl, p-6
 * - 아이콘 영역: p-3 rounded-lg mb-4
 * - 하단 border-b-2 hover:border-primary 효과
 * - 서브텍스트: text-xs opacity-70
 * ============================================================ */
export function QuickMenu() {
  const [items, setItems] = useState<MenuId[]>(DEFAULT_ITEMS);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [pending, setPending] = useState<MenuId[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/web/user/quick-menu", { credentials: "include" })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json() as { menu_items: MenuId[] };
          setItems(data.menu_items ?? DEFAULT_ITEMS);
          setIsLoggedIn(true);
        }
      })
      .catch(() => {});
  }, []);

  const menuItems = MENU_POOL.filter((m) => items.includes(m.id));

  const openEdit = () => {
    setPending([...items]);
    setEditMode(true);
  };

  const toggleItem = (id: MenuId) => {
    setPending((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= MAX_ITEMS) return prev;
      return [...prev, id];
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    setItems(pending);
    setEditMode(false);
    try {
      await fetch("/api/web/user/quick-menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ menu_items: pending }),
      });
    } catch {
      // silent fail -- UI already updated optimistically
    } finally {
      setSaving(false);
    }
  };

  /* 편집 모드 UI */
  if (editMode) {
    return (
      <section className="rounded-2xl bg-surface-low p-5">
        <div className="mb-4 flex items-center justify-between">
          <span
            className="text-sm font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
          >
            메뉴 편집 ({pending.length}/{MAX_ITEMS}개 선택)
          </span>
          <button
            onClick={saveEdit}
            disabled={saving || pending.length === 0}
            className="rounded-lg px-4 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(to right, var(--color-primary), var(--color-accent))" }}
          >
            완료
          </button>
        </div>

        {/* 현재 선택된 메뉴 칩 */}
        <div className="mb-4 flex flex-wrap gap-2">
          {MENU_POOL.filter((m) => pending.includes(m.id)).map((m) => (
            <button
              key={m.id}
              onClick={() => toggleItem(m.id)}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold"
              style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}
            >
              {m.icon} {m.label} ✕
            </button>
          ))}
        </div>

        {/* 전체 후보 목록 */}
        <div className="rounded-xl bg-surface-high p-4">
          <p className="mb-3 text-xs" style={{ color: "var(--color-text-muted)" }}>추가 가능한 메뉴</p>
          <div className="grid grid-cols-3 gap-2">
            {MENU_POOL.filter((m) => !pending.includes(m.id)).map((m) => (
              <button
                key={m.id}
                onClick={() => toggleItem(m.id)}
                disabled={pending.length >= MAX_ITEMS}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-low py-3 text-xs transition-colors hover:bg-surface-bright disabled:opacity-40"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <span className="text-lg">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ============================================================
   * 기본 표시 모드 — bdr_6 스타일 그리드
   * ============================================================ */
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2
          className="text-lg font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
        >
          Quick Menu
        </h2>
        {isLoggedIn && (
          <button
            onClick={openEdit}
            className="text-xs font-semibold transition-colors hover:underline"
            style={{ color: "var(--color-text-muted)" }}
          >
            편집
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {menuItems.map((m) => (
          <Link key={m.id} href={m.href}>
            {/* bdr_6 퀵메뉴 카드: surface-high + 하단 보더 효과 */}
            <div
              className="group flex flex-col items-start rounded-xl p-6 transition-all hover:bg-surface-bright"
              style={{
                backgroundColor: "var(--color-surface-high)",
                borderBottom: "2px solid transparent",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderBottomColor = "var(--color-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderBottomColor = "transparent"; }}
            >
              {/* 아이콘 영역: bdr_6 스타일 p-3 rounded-lg */}
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg p-3 text-lg transition-transform group-hover:scale-110"
                style={{ backgroundColor: `color-mix(in srgb, ${m.iconBg} 20%, transparent)` }}
              >
                {m.icon}
              </div>
              {/* 타이틀 */}
              <span className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                {m.label}
              </span>
              {/* 서브텍스트: bdr_6 스타일 */}
              <span className="mt-1 text-xs opacity-70" style={{ color: "var(--color-text-secondary)" }}>
                {m.sub}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
