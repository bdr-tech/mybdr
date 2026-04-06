"use client";

import { useState, useEffect } from "react";

/**
 * 알림 설정 페이지 — 유형별 토글 UI
 *
 * 각 알림 유형(경기/대회/팀/커뮤니티/웹푸시)의 ON/OFF를 관리한다.
 * 변경 시 즉시 PATCH 요청으로 서버에 저장.
 */

// 알림 유형별 메타 정보 (아이콘, 라벨, 설명)
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

// 기본 설정값 (서버에서 아직 못 받았을 때 사용)
type Settings = Record<string, boolean>;

const DEFAULT_SETTINGS: Settings = {
  game: true,
  tournament: true,
  team: true,
  community: true,
  push: true,
};

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // 현재 저장 중인 키

  // 마운트 시 현재 설정 불러오기
  useEffect(() => {
    fetch("/api/web/profile/notification-settings", { credentials: "include" })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setSettings(data.settings ?? DEFAULT_SETTINGS);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 토글 변경 시 즉시 서버에 PATCH
  const handleToggle = async (key: string) => {
    const newValue = !settings[key];
    // 낙관적 업데이트 (먼저 UI를 바꾸고 서버에 저장)
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
        // 실패 시 원래 값으로 롤백
        setSettings((prev) => ({ ...prev, [key]: !newValue }));
      }
    } catch {
      // 네트워크 오류 시 롤백
      setSettings((prev) => ({ ...prev, [key]: !newValue }));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          알림 설정
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          받고 싶은 알림 유형을 선택해주세요
        </p>
      </div>

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
            <div className="flex items-center gap-4">
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
              {/* 토글 동그라미 (ON: 우측, OFF: 좌측) */}
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

      {/* 안내 문구 */}
      <p
        className="text-center text-xs"
        style={{ color: "var(--color-text-disabled)" }}
      >
        웹 푸시를 꺼도 앱 내 알림은 정상적으로 수신됩니다
      </p>
    </div>
  );
}
