"use client";

/* ============================================================
 * AccountSectionV2 — Settings "계정" 섹션
 *
 * 왜:
 *  - 시안 Settings.jsx 의 5 행(이메일/비밀번호/연결된계정/2단계 인증/로그인 기기) 그대로 이식.
 *  - 계정 정보는 GET /api/web/profile 로 받아 표시 (별도 fetch 신규 0건).
 *
 * 어떻게:
 *  - 부모(page.tsx)에서 한 번 받은 user 데이터를 prop 으로 내려받음.
 *  - 5행 중 동작 가능한 것: 이메일/비밀번호/연결된 계정 → 기존 페이지 라우팅
 *      · 비밀번호 변경 → /reset-password (이미 구현됨)
 *      · 연결된 계정 → /profile/edit (소셜 연결 관리 자리)
 *  - 미구현 2개: 2단계 인증 / 로그인 기기 → disabled "준비 중"
 * ============================================================ */

import { useRouter } from "next/navigation";
import { SettingsHeader, SettingsRow } from "./settings-ui";

interface AccountUser {
  email?: string | null;
  // 시안의 "마지막 변경 N개월 전"은 DB 미지원 — placeholder 표시
  // 향후 users.password_updated_at 추가 시 채움
}

export function AccountSectionV2({ user }: { user: AccountUser | null }) {
  const router = useRouter();

  // 비밀번호 변경 — 기존 reset-password 플로우로 이동
  const onChangePassword = () => router.push("/reset-password");

  // 이메일 변경 / 연결된 계정 — /profile/edit 페이지가 아직 단일 폼이므로
  // 동일 페이지로 이동 (기존 페이지 보존 원칙)
  const onChangeEmail = () => router.push("/profile/edit");
  const onManageLinked = () => router.push("/profile/edit");

  return (
    <>
      <SettingsHeader
        title="계정 정보"
        desc="로그인과 보안 관련 설정"
      />

      {/* 이메일 — 실제 API 응답 사용. null 이면 "이메일 미등록" 안내 */}
      <SettingsRow
        label="이메일"
        value={user?.email ?? "이메일 미등록"}
        action="변경"
        onAction={onChangeEmail}
      />

      {/* 비밀번호 — 마지막 변경일 DB 미지원: "변경 이력 준비 중" */}
      <SettingsRow
        label="비밀번호"
        value="변경 이력 준비 중"
        action="변경"
        onAction={onChangePassword}
      />

      {/* 연결된 계정 — 카카오/구글 연동 정보 DB 조회 미구현 → 자리만 + 관리 버튼은 edit 라우트 */}
      <SettingsRow
        label="연결된 계정"
        value="준비 중"
        action="관리"
        onAction={onManageLinked}
        // edit 페이지는 존재하나 소셜 연동 UI 자체가 미구현 — 우선 동작 가능 상태로 보존
      />

      {/* 2단계 인증 — 추후 구현 (Phase 5) */}
      <SettingsRow
        label="2단계 인증"
        value="준비 중"
        action="켜기"
        disabled
      />

      {/* 로그인 기기 — sessions 테이블 필요. 추후 구현 */}
      <SettingsRow
        label="로그인 기기"
        value="준비 중"
        action="관리"
        disabled
      />
    </>
  );
}
