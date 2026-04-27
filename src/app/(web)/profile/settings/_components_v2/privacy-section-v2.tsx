"use client";

/* ============================================================
 * PrivacySectionV2 — Settings "공개 범위" 섹션
 *
 * 왜:
 *  - 시안 5 토글(프로필 검색/경기 기록/타임라인/실명/DM) 모두 DB 미지원.
 *  - users.privacy_settings JSONB 컬럼 + 권한 가드 추가가 별건 작업이라
 *    이번 Phase 5 Settings 범위에서는 UI만 배치 + disabled "준비 중".
 *
 * 어떻게:
 *  - 5 토글 전부 SettingsToggle disabled.
 *  - 추후 구현 시 GET/PATCH /api/web/profile/privacy-settings (또는 profile PATCH 확장) 도입.
 * ============================================================ */

import { SettingsHeader, SettingsToggle } from "./settings-ui";

// 시안 그대로의 5 토글
const PRIVACY_TOGGLES: ReadonlyArray<{
  label: string;
  desc?: string;
  // 시안의 defaultChecked 값을 시각적으로 보존 (켜진 모양으로 보이도록)
  defaultChecked: boolean;
}> = [
  { label: "프로필 검색 허용", desc: "닉네임 검색에 노출", defaultChecked: true },
  { label: "경기 기록 공개", desc: "다른 사용자가 스탯·전적 열람", defaultChecked: true },
  { label: "활동 타임라인 공개", defaultChecked: false },
  { label: "실명 표시", desc: "소속팀 페이지에서만 표시", defaultChecked: false },
  { label: "DM 수신", defaultChecked: true },
] as const;

export function PrivacySectionV2() {
  return (
    <>
      <SettingsHeader
        title="공개 범위"
        desc="프로필·활동 정보 노출 설정"
      />

      {PRIVACY_TOGGLES.map((t) => (
        <SettingsToggle
          key={t.label}
          label={t.label}
          desc={t.desc}
          // 시안의 시각적 의도(체크 상태) 보존 — 단 disabled 라 클릭 무반응
          checked={t.defaultChecked}
          disabled
        />
      ))}
    </>
  );
}
