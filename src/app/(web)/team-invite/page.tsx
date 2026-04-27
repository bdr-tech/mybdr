/* ============================================================
 * /team-invite — 팀 초대 수락/거절 페이지 (Phase 8 v2 박제)
 *
 * 왜 박제 100%인가:
 * - DB 스키마에 팀 초대 테이블 없음 (TeamInvitation 미존재).
 *   user_team_membership 의 status 컬럼은 존재하지만,
 *   "초대 코드 / 만료일 / 초대 메시지 / 등번호 지정" 등의 필드는 없다.
 * - 사용자 원칙: "DB 미지원도 제거 금지 — 박제 + '준비 중'".
 * - 따라서 API 호출 0건, 데이터 패칭 0건. 시안 인라인 데이터 그대로.
 *
 * 어떻게:
 * - 시안 (Dev/design/BDR v2/screens/TeamInvite.jsx) 205줄 1:1 박제.
 * - 인라인 이모지/하드코딩 텍스트도 그대로 유지 (시안 충실도).
 * - lucide-react 미사용. 시안 원본도 텍스트 ✓ ✕ → 그대로 유지.
 * - useState 인터랙션 (수락 / 거절 / 펼치기) 만 동작. 실제 API 호출은 없다.
 *
 * 향후 연결 시:
 * - DB: TeamInvitation 테이블 신설 + invite code / expires_at / message / jersey_number 필드.
 * - API: GET /api/web/team-invites/[code], POST .../accept, POST .../decline.
 * - 라우트: /team-invite/[code] 동적 세그먼트로 변경.
 * ============================================================ */

import type { Metadata } from "next";
import TeamInviteClient from "./_v2/team-invite-client";

export const metadata: Metadata = {
  title: "팀 초대 | MyBDR",
  description: "팀 초대장을 확인하고 수락하거나 거절하세요.",
};

export default function TeamInvitePage() {
  // 박제 페이지 — props 없음. 모든 데이터는 클라이언트에 인라인.
  return <TeamInviteClient />;
}
