"use client";

/* ============================================================
 * NotifySectionV2 — Settings "알림" 섹션
 *
 * 왜:
 *  - 시안 8 토글 항목을 그대로 배치. 단 PATCH /api/web/profile/notification-settings
 *    가 받는 키는 5종(game/tournament/team/community/push)뿐.
 *  - 시안의 나머지 3 토글(이메일·D-3·좋아요·마케팅 등)은 DB 미지원 → "준비 중" disabled.
 *
 * 어떻게:
 *  - 마운트 시 GET /api/web/profile/notification-settings 호출 (기존 fetch).
 *  - 토글 클릭 → 낙관적 업데이트 → PATCH → 실패 시 롤백 (기존 v1 패턴 유지).
 *  - disabled 토글은 onChange 무시 + "준비 중" 배지.
 * ============================================================ */

import { useEffect, useState } from "react";
import { SettingsHeader, SettingsToggle } from "./settings-ui";

// PATCH 가 허용하는 5개 키 (notification-settings/route.ts 의 DEFAULT_SETTINGS)
type NotifyKey = "push" | "game" | "community" | "team" | "tournament";

// 시안 라벨 → 실제 PATCH 키 매핑. 시안 라벨을 그대로 살리되 의미가 가장 가까운 키로 연결.
const ACTIVE_TOGGLES: ReadonlyArray<{
  key: NotifyKey;
  label: string;
  desc?: string;
}> = [
  // 시안: "푸시 알림 / 모바일 앱 푸시"
  { key: "push", label: "푸시 알림", desc: "모바일·웹 푸시 수신" },
  // 시안: "경기 신청 승인/거절" — game 키 (경기 신청/승인/취소/리마인더)
  { key: "game", label: "경기 신청 승인/거절", desc: "경기 신청·승인·취소·리마인더" },
  // 시안: "댓글·멘션" — community 키 (커뮤니티 댓글/좋아요 통합)
  { key: "community", label: "댓글·멘션", desc: "커뮤니티 댓글·답글" },
  // 시안: "팀 소식" — team 키
  { key: "team", label: "팀 소식", desc: "팀 가입 신청·승인·공지" },
  // 시안에는 없지만 PATCH 키 중 tournament 가 남음 → 추가 노출
  { key: "tournament", label: "대회 알림", desc: "대회 접수·대진표·결과" },
] as const;

// 시안에 있으나 DB 미지원: 이메일 / D-3 / 좋아요 / 마케팅
const DISABLED_TOGGLES: ReadonlyArray<{ label: string; desc?: string }> = [
  { label: "이메일 알림", desc: "주요 알림을 이메일로 받음" },
  { label: "대회 접수 마감 D-3 알림" },
  { label: "좋아요" },
  { label: "마케팅·프로모션" },
];

const DEFAULT_SETTINGS: Record<NotifyKey, boolean> = {
  push: true,
  game: true,
  community: true,
  team: true,
  tournament: true,
};

export function NotifySectionV2() {
  const [settings, setSettings] = useState<Record<NotifyKey, boolean>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  // 동시에 여러 키 PATCH 가능하도록 saving 키 집합으로 추적
  const [saving, setSaving] = useState<Set<NotifyKey>>(new Set());

  // 마운트 시 현재 알림 설정 조회 (기존 GET 그대로)
  useEffect(() => {
    let aborted = false;
    fetch("/api/web/profile/notification-settings", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) return;
        const data = await r.json();
        // apiSuccess 응답은 snake_case 직렬화 — settings 그대로 옴
        if (!aborted && data?.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!aborted) setLoading(false);
      });
    return () => {
      aborted = true;
    };
  }, []);

  const handleToggle = async (key: NotifyKey, next: boolean) => {
    // 낙관적 업데이트
    setSettings((prev) => ({ ...prev, [key]: next }));
    setSaving((prev) => new Set(prev).add(key));
    try {
      const res = await fetch("/api/web/profile/notification-settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: next }),
      });
      if (!res.ok) {
        // 롤백
        setSettings((prev) => ({ ...prev, [key]: !next }));
      }
    } catch {
      setSettings((prev) => ({ ...prev, [key]: !next }));
    } finally {
      setSaving((prev) => {
        const n = new Set(prev);
        n.delete(key);
        return n;
      });
    }
  };

  return (
    <>
      <SettingsHeader
        title="알림 설정"
        desc="받을 알림 종류를 선택하세요"
      />

      {/* 동작하는 5 토글 */}
      {ACTIVE_TOGGLES.map((t) => (
        <SettingsToggle
          key={t.key}
          label={t.label}
          desc={t.desc}
          checked={settings[t.key]}
          loading={loading || saving.has(t.key)}
          onChange={(next) => handleToggle(t.key, next)}
        />
      ))}

      {/* 준비 중 4 토글 (DB 미지원) */}
      {DISABLED_TOGGLES.map((t) => (
        <SettingsToggle
          key={t.label}
          label={t.label}
          desc={t.desc}
          checked={false}
          disabled
        />
      ))}

      {/* 시안 하단 안내 — 사용자에게 push 의미 전달 */}
      <p
        style={{
          textAlign: "center",
          fontSize: 12,
          color: "var(--ink-dim)",
          marginTop: 16,
        }}
      >
        웹 푸시를 꺼도 앱 내 알림은 정상적으로 수신됩니다
      </p>
    </>
  );
}
