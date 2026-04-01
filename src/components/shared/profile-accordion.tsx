"use client";

import { useState } from "react";
import Link from "next/link";

/* ============================================================
 * ProfileAccordion — 프로필 4개 카테고리 아코디언 메뉴
 *
 * 유저 아바타+닉네임 클릭 → 4개 카테고리 토글
 * 각 카테고리 클릭 → 2depth 하위 링크 펼침/접힘
 *
 * 사용처:
 * - PC 사이드네비 하단 (layout.tsx)
 * - 모바일 슬라이드 메뉴 (slide-menu.tsx)
 * ============================================================ */

// 메뉴 아이템 타입: href가 있으면 링크, action이 있으면 버튼
interface MenuItem {
  href?: string;
  label: string;
  icon: string;
  action?: "logout"; // 특수 액션 (로그아웃 등)
}

// 4개 카테고리 정의
interface Category {
  id: string;
  label: string;
  icon: string; // Material Symbols 아이콘명
  items: MenuItem[];
}

// 카테고리별 메뉴 데이터
const categories: Category[] = [
  {
    id: "basketball",
    label: "내 농구",
    icon: "sports_basketball",
    items: [
      { href: "/teams", label: "소속 팀", icon: "groups" },
      { href: "/games", label: "최근 경기", icon: "sports_basketball" },
      { href: "/tournaments", label: "참가 대회", icon: "emoji_events" },
      { href: "/profile/weekly-report", label: "주간 리포트", icon: "bar_chart" },
    ],
  },
  {
    id: "growth",
    label: "내 성장",
    icon: "trending_up",
    items: [
      { href: "/profile#gamification", label: "XP / 레벨", icon: "star" },
      { href: "/profile#streak", label: "연속 출석", icon: "local_fire_department" },
      { href: "/profile#badges", label: "뱃지 컬렉션", icon: "military_tech" },
      { href: "/profile#stamps", label: "코트 도장깨기", icon: "approval" },
    ],
  },
  {
    id: "info",
    label: "내 정보",
    icon: "person",
    items: [
      { href: "/profile/edit", label: "프로필 편집", icon: "edit" },
      { href: "/profile/edit#social", label: "소셜 계정", icon: "link" },
    ],
  },
  {
    id: "preferences",
    label: "맞춤 설정",
    icon: "tune",
    items: [
      { href: "/profile/preferences", label: "맞춤 설정 관리", icon: "tune" },
    ],
  },
  {
    id: "account",
    label: "계정",
    icon: "settings",
    items: [
      { href: "/profile/subscription", label: "구독 관리", icon: "card_membership" },
      { href: "/profile/payments", label: "결제 내역", icon: "receipt_long" },
      { href: "/profile/notification-settings", label: "알림 설정", icon: "notifications" },
      { label: "로그아웃", icon: "logout", action: "logout" },
      { href: "/profile/edit#withdraw", label: "회원 탈퇴", icon: "person_remove" },
    ],
  },
];

interface ProfileAccordionProps {
  name?: string;              // 유저 닉네임
  onNavigate?: () => void;    // 링크 클릭 후 콜백 (슬라이드 메뉴 닫기용)
}

export function ProfileAccordion({ name, onNavigate }: ProfileAccordionProps) {
  // 전체 아코디언 펼침 여부
  const [expanded, setExpanded] = useState(false);
  // 각 카테고리별 열림 상태 (id를 키로 관리)
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  // 이니셜 계산 (아바타용)
  const displayName = name?.trim() || "사용자";
  const initial = displayName[0]?.toUpperCase() || "U";

  // 카테고리 토글
  const toggleCategory = (id: string) => {
    setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 로그아웃 핸들러
  const handleLogout = async () => {
    await fetch("/api/web/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  };

  return (
    <div className="space-y-1">
      {/* 유저 프로필 헤더: 클릭 시 전체 아코디언 토글 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--color-surface)]"
      >
        {/* 아바타 원형 */}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {initial}
        </div>
        {/* 닉네임 */}
        <span
          className="flex-1 truncate text-left text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {displayName}
        </span>
        {/* 화살표 아이콘: 펼침/접힘 회전 */}
        <span
          className="material-symbols-outlined text-lg transition-transform duration-200"
          style={{
            color: "var(--color-text-muted)",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          expand_more
        </span>
      </button>

      {/* 아코디언 본체: grid-template-rows 트랜지션으로 부드러운 펼침 */}
      <div
        className="overflow-hidden transition-[grid-template-rows] duration-300"
        style={{
          display: "grid",
          gridTemplateRows: expanded ? "1fr" : "0fr",
        }}
      >
        <div className="min-h-0 space-y-0.5 pl-2">
          {categories.map((cat) => {
            const isOpen = !!openCategories[cat.id];
            return (
              <div key={cat.id}>
                {/* 카테고리 헤더: 클릭 시 하위 메뉴 토글 */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--color-surface)]"
                >
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ color: isOpen ? "var(--color-primary)" : "var(--color-text-muted)" }}
                  >
                    {cat.icon}
                  </span>
                  <span
                    className="flex-1 text-xs font-semibold"
                    style={{ color: isOpen ? "var(--color-primary)" : "var(--color-text-secondary)" }}
                  >
                    {cat.label}
                  </span>
                  <span
                    className="material-symbols-outlined text-base transition-transform duration-200"
                    style={{
                      color: "var(--color-text-muted)",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    expand_more
                  </span>
                </button>

                {/* 하위 메뉴: grid-template-rows 트랜지션 */}
                <div
                  className="overflow-hidden transition-[grid-template-rows] duration-200"
                  style={{
                    display: "grid",
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                  }}
                >
                  <div className="min-h-0">
                    {cat.items.map((item) => {
                      // 로그아웃 등 특수 액션은 버튼으로 렌더
                      if (item.action === "logout") {
                        return (
                          <button
                            key={item.label}
                            onClick={() => {
                              handleLogout();
                              onNavigate?.();
                            }}
                            className="flex w-full items-center gap-2.5 rounded-lg py-1.5 pl-10 pr-3 text-left transition-colors hover:bg-[var(--color-surface)]"
                          >
                            <span
                              className="material-symbols-outlined text-base"
                              style={{ color: "var(--color-error, #EF4444)" }}
                            >
                              {item.icon}
                            </span>
                            <span
                              className="text-xs"
                              style={{ color: "var(--color-error, #EF4444)" }}
                            >
                              {item.label}
                            </span>
                          </button>
                        );
                      }

                      // 회원 탈퇴는 빨간색으로 표시
                      const isDanger = item.icon === "person_remove";

                      return (
                        <Link
                          key={item.label}
                          href={item.href!}
                          onClick={onNavigate}
                          className="flex items-center gap-2.5 rounded-lg py-1.5 pl-10 pr-3 transition-colors hover:bg-[var(--color-surface)]"
                        >
                          <span
                            className="material-symbols-outlined text-base"
                            style={{ color: isDanger ? "var(--color-error, #EF4444)" : "var(--color-text-muted)" }}
                          >
                            {item.icon}
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: isDanger ? "var(--color-error, #EF4444)" : "var(--color-text-secondary)" }}
                          >
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
