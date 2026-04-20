"use client";

/* ============================================================
 * ProfileSettingsPage — 설정 허브 (맞춤 설정 + 알림 설정 탭 통합)
 *
 * 왜 (M1 Day 8):
 *  - 기존 /profile/preferences + /profile/notification-settings 두 페이지가 좌측 네비 "설정" 하나로
 *    묶여 있었는데 실제 페이지는 각각 따로 열려 사용자 탐색이 분리됐음.
 *  - 한 페이지 안에서 탭으로 서브 섹션을 전환하도록 통합해 네비 항목과 실제 페이지 단위를 1:1로 맞춘다.
 *  - 구 경로 2개는 redirect()로 보존 → 외부 링크/북마크 호환.
 *
 * 어떻게:
 *  - 탭 상태는 URL 쿼리 ?tab= 으로 관리 (새로고침/공유/뒤로가기 보존).
 *  - 기본값은 "preferences". 유효하지 않은 값은 "preferences"로 fallback.
 *  - 탭 클릭 시 router.replace(..., { scroll: false }) 로 히스토리 누적 없이 URL만 바꿈.
 *  - 비활성 탭 섹션은 조건부 렌더 → 해당 서브 섹션의 API 호출을 하지 않아 네트워크/렌더 절약.
 *  - 탭 컴포넌트는 이번엔 페이지 내부 inline (후속에 공용 Tabs 컴포넌트로 승격 검토).
 *  - 개별 서브 페이지 헤더 제거 + 이 허브에 "설정" 단일 헤더만.
 * ============================================================ */

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PreferenceForm } from "@/components/shared/preference-form";

/* 탭 키. "preferences" = 맞춤 설정, "notifications" = 알림 설정 */
type TabKey = "preferences" | "notifications";

const VALID_TABS: TabKey[] = ["preferences", "notifications"];

/* 알림 유형 메타 정보 (아이콘/라벨/설명) — 기존 notification-settings 페이지에서 이식 */
const NOTIFICATION_TYPES = [
  {
    key: "game",
    icon: "sports_basketball",
    label: "경기 알림",
    description: "경기 신청, 승인, 취소, 리마인더",
  },
  {
    key: "tournament",
    icon: "emoji_events",
    label: "대회 알림",
    description: "대회 접수, 대진표 발표, 결과 안내",
  },
  {
    key: "team",
    icon: "groups",
    label: "팀 알림",
    description: "팀 가입 신청, 승인, 공지사항",
  },
  {
    key: "community",
    icon: "forum",
    label: "커뮤니티 알림",
    description: "댓글, 좋아요, 답글 알림",
  },
  {
    key: "push",
    icon: "notifications_active",
    label: "웹 푸시 알림",
    description: "브라우저 푸시 알림 수신 (꺼도 인앱 알림은 유지)",
  },
] as const;

type Settings = Record<string, boolean>;

const DEFAULT_NOTIFICATION_SETTINGS: Settings = {
  game: true,
  tournament: true,
  team: true,
  community: true,
  push: true,
};

export default function ProfileSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* 현재 활성 탭 결정
   * - URL 쿼리 ?tab=X 우선
   * - 값이 VALID_TABS에 없거나 없으면 "preferences" 기본 */
  const rawTab = searchParams.get("tab");
  const activeTab: TabKey =
    rawTab && (VALID_TABS as string[]).includes(rawTab)
      ? (rawTab as TabKey)
      : "preferences";

  /* 탭 클릭 핸들러
   * - router.replace: 같은 URL 히스토리에 쌓지 않음 (뒤로가기가 이전 탭으로 돌아가지 않게)
   * - scroll: false: 탭 전환 시 페이지 맨 위로 스크롤 점프 방지 */
  const handleTabChange = useCallback(
    (tab: TabKey) => {
      router.replace(`/profile/settings?tab=${tab}`, { scroll: false });
    },
    [router]
  );

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* ============ 허브 단일 헤더 (개별 페이지 헤더는 제거됨) ============ */}
        <h1 className="text-2xl font-bold mb-6">설정</h1>

        {/* ============ 탭 바 (border-b-2 절제형) ============ */}
        <div
          role="tablist"
          aria-label="설정 카테고리"
          className="flex gap-6 border-b mb-6"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <TabButton
            label="맞춤 설정"
            active={activeTab === "preferences"}
            onClick={() => handleTabChange("preferences")}
            controls="panel-preferences"
          />
          <TabButton
            label="알림 설정"
            active={activeTab === "notifications"}
            onClick={() => handleTabChange("notifications")}
            controls="panel-notifications"
          />
        </div>

        {/* ============ 탭 패널 (조건부 렌더로 비활성 탭의 API 호출/무거운 렌더 방지) ============ */}
        {activeTab === "preferences" && (
          <div
            role="tabpanel"
            id="panel-preferences"
            aria-labelledby="tab-preferences"
          >
            <p className="text-[var(--color-text-secondary)] mb-6 text-sm">
              관심 종별, 경기 유형, 게시판을 설정하면 맞춤 콘텐츠를 받아볼 수 있습니다
            </p>
            {/* 기존 /profile/preferences 와 동일한 폼 — settings 모드 (스킵 버튼 없음) */}
            <PreferenceForm mode="settings" />
          </div>
        )}

        {activeTab === "notifications" && (
          <div
            role="tabpanel"
            id="panel-notifications"
            aria-labelledby="tab-notifications"
          >
            <NotificationsSection />
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * TabButton — border-b-2 절제형 탭 버튼
 *
 * 활성 시: text-primary + border-b-2 border-primary
 * 비활성 시: text-muted + border-transparent
 * ============================================================ */
function TabButton({
  label,
  active,
  onClick,
  controls,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  controls: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className="relative -mb-px py-3 text-sm font-semibold transition-colors"
      style={{
        color: active
          ? "var(--color-primary)"
          : "var(--color-text-secondary)",
        borderBottom: active
          ? "2px solid var(--color-primary)"
          : "2px solid transparent",
      }}
    >
      {label}
    </button>
  );
}

/* ============================================================
 * NotificationsSection — 알림 설정 서브 섹션
 *
 * 기존 /profile/notification-settings 페이지의 UI/로직을 그대로 이식.
 * (페이지 헤더 h1 "알림 설정"은 제거 — 허브 탭 라벨이 역할 대체)
 * ============================================================ */
function NotificationsSection() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [loading, setLoading] = useState(true);
  // 현재 저장 중인 키 (낙관적 업데이트 중 disabled 처리용)
  const [saving, setSaving] = useState<string | null>(null);

  // 마운트 시 현재 설정 로드
  useEffect(() => {
    fetch("/api/web/profile/notification-settings", { credentials: "include" })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setSettings(data.settings ?? DEFAULT_NOTIFICATION_SETTINGS);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 토글 클릭 → 낙관적 업데이트 → PATCH → 실패 시 롤백
  const handleToggle = async (key: string) => {
    const newValue = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newValue }));
    setSaving(key);
    try {
      const res = await fetch("/api/web/profile/notification-settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: newValue }),
      });
      if (!res.ok) {
        setSettings((prev) => ({ ...prev, [key]: !newValue }));
      }
    } catch {
      setSettings((prev) => ({ ...prev, [key]: !newValue }));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 설명 (기존 h1 대체) */}
      <p
        className="text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        받고 싶은 알림 유형을 선택해주세요
      </p>

      {/* 알림 유형별 토글 카드 */}
      <div
        className="overflow-hidden rounded-md"
        style={{
          backgroundColor: "var(--color-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {NOTIFICATION_TYPES.map((type, index) => (
          <div
            key={type.key}
            className={`flex items-center justify-between px-5 py-4 ${
              index < NOTIFICATION_TYPES.length - 1
                ? "border-b border-[var(--color-border-subtle)]"
                : ""
            }`}
          >
            {/* 좌측: 아이콘 + 라벨 + 설명 */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                <span
                  className="material-symbols-outlined text-xl"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {type.icon}
                </span>
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {type.label}
                </p>
                <p
                  className="mt-0.5 text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {type.description}
                </p>
              </div>
            </div>

            {/* 우측: 토글 스위치 */}
            <button
              onClick={() => handleToggle(type.key)}
              disabled={loading || saving === type.key}
              className="relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200"
              style={{
                backgroundColor: settings[type.key]
                  ? "var(--color-primary)"
                  : "var(--color-border)",
                opacity: loading ? 0.5 : 1,
              }}
              aria-label={`${type.label} ${settings[type.key] ? "끄기" : "켜기"}`}
            >
              <span
                className="absolute top-0.5 block h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200"
                style={{
                  transform: settings[type.key]
                    ? "translateX(22px)"
                    : "translateX(2px)",
                }}
              />
            </button>
          </div>
        ))}
      </div>

      {/* 하단 안내 문구 */}
      <p
        className="text-center text-xs"
        style={{ color: "var(--color-text-disabled)" }}
      >
        웹 푸시를 꺼도 앱 내 알림은 정상적으로 수신됩니다
      </p>
    </div>
  );
}
