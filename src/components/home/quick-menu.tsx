"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const MENU_POOL = [
  { id: "find_game",    label: "경기 찾기",  icon: "🏀", href: "/games" },
  { id: "my_team",      label: "내 팀",      icon: "👥", href: "/teams" },
  { id: "tournaments",  label: "대회 보기",  icon: "🏆", href: "/tournaments" },
  { id: "pickup",       label: "픽업 신청",  icon: "⚡", href: "/games?type=pickup" },
  { id: "my_schedule",  label: "내 일정",    icon: "📅", href: "/schedule" },
  { id: "stats",        label: "내 기록",    icon: "📊", href: "/profile?tab=stats" },
  { id: "community",   label: "커뮤니티",   icon: "💬", href: "/community" },
  { id: "ranking",      label: "랭킹",       icon: "🥇", href: "/ranking" },
  { id: "venue",        label: "코트 찾기",  icon: "📍", href: "/courts" },
  { id: "notifications",label: "알림",       icon: "🔔", href: "/notifications" },
] as const;

type MenuId = (typeof MENU_POOL)[number]["id"];

const DEFAULT_ITEMS: MenuId[] = ["find_game", "my_team", "tournaments", "pickup"];
const MAX_ITEMS = 4;

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
        // 401: 미로그인 → 기본값 유지
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
      if (prev.length >= MAX_ITEMS) return prev; // 최대 4개
      return [...prev, id];
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    // 낙관적 업데이트
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
      // silent fail — UI already updated optimistically
    } finally {
      setSaving(false);
    }
  };

  if (editMode) {
    return (
      <section className="rounded-[20px] border border-[#E8ECF0] bg-[#FFFFFF] p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-[#111827]">
            메뉴 편집 ({pending.length}/{MAX_ITEMS}개 선택)
          </span>
          <button
            onClick={saveEdit}
            disabled={saving || pending.length === 0}
            className="rounded-full bg-[#0066FF] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            완료
          </button>
        </div>

        {/* 현재 선택 */}
        <div className="mb-3 flex flex-wrap gap-2">
          {MENU_POOL.filter((m) => pending.includes(m.id)).map((m) => (
            <button
              key={m.id}
              onClick={() => toggleItem(m.id)}
              className="flex items-center gap-1 rounded-full bg-[rgba(0,102,255,0.12)] px-3 py-1.5 text-xs font-medium text-[#0066FF]"
            >
              {m.icon} {m.label} ✕
            </button>
          ))}
        </div>

        {/* 전체 후보 */}
        <div className="border-t border-[#F1F5F9] pt-3">
          <p className="mb-2 text-xs text-[#9CA3AF]">추가 가능한 메뉴</p>
          <div className="grid grid-cols-3 gap-2">
            {MENU_POOL.filter((m) => !pending.includes(m.id)).map((m) => (
              <button
                key={m.id}
                onClick={() => toggleItem(m.id)}
                disabled={pending.length >= MAX_ITEMS}
                className="flex flex-col items-center gap-1 rounded-[12px] border border-[#E8ECF0] py-3 text-xs text-[#6B7280] transition-colors hover:border-[#0066FF] hover:text-[#0066FF] disabled:opacity-40"
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

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-[#111827]">자주 쓰는 메뉴</span>
        {isLoggedIn && (
          <button
            onClick={openEdit}
            className="text-xs text-[#9CA3AF] hover:text-[#6B7280]"
          >
            편집
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {menuItems.map((m) => (
          <Link key={m.id} href={m.href}>
            <div className="flex flex-col items-center gap-1.5 rounded-[16px] border border-[#E8ECF0] bg-[#FFFFFF] py-4 text-center transition-colors hover:bg-[#EEF2FF]">
              <span className="text-2xl">{m.icon}</span>
              <span className="text-[10px] font-medium text-[#374151]">{m.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
