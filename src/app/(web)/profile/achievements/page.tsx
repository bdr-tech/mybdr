/* ============================================================
 * /profile/achievements — 업적 (서버 컴포넌트)
 *
 * 왜 서버 컴포넌트:
 * - PM 결정 (Phase 1 동일 패턴): 서버에서 prisma.user_badges 직접 호출.
 *   API/route.ts/Prisma 스키마 0 변경. 신규 fetch 0건.
 * - 비로그인은 안내 화면 + 로그인 버튼 (기존 /profile UX 일관).
 * - 카페 세션 무관 — getWebSession 만 사용.
 *
 * 어떻게:
 * - getWebSession → session.sub 으로 userId BigInt 변환.
 * - prisma.user_badges.findMany 로 본인 획득 배지 전부 조회.
 *   · earned_at desc 정렬 (최근 획득 4건 컴포넌트가 클라에서 다시 정렬).
 *   · BigInt → string, Date → ISO 변환은 여기서 처리.
 * - 클라이언트(achievements-content.tsx) 에서 정적 카탈로그(badge-catalog.ts) 와
 *   merge 하여 earned + locked 통합 그리드 표시.
 *
 * 보안/규칙:
 * - 세션 userId 기반 본인 데이터만 조회 (IDOR 없음).
 * - 캐시 금지 (force-dynamic) — 본인 데이터는 매 요청 최신.
 * ============================================================ */

import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";

import { AchievementsContent } from "./_v2/achievements-content";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const session = await getWebSession();

  // 비로그인 → 로그인 유도 (기존 /profile UX 그대로)
  if (!session) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 48,
              color: "var(--ink-dim)",
              marginBottom: 16,
              display: "block",
            }}
          >
            person_off
          </span>
          <p style={{ marginBottom: 16, fontSize: 14, color: "var(--ink-mute)" }}>
            로그인이 필요합니다
          </p>
          <Link href="/login" className="btn btn--accent" style={{ display: "inline-block" }}>
            로그인
          </Link>
        </div>
      </div>
    );
  }

  const userId = BigInt(session.sub);

  // 본인 획득 배지 전체 (Phase 1 패턴 — Prisma 직접 호출)
  // 실패 시 빈 배열 폴백 (페이지 전체가 카탈로그-only locked 그리드로 정상 렌더)
  const userBadges = await prisma.user_badges
    .findMany({
      where: { user_id: userId },
      select: {
        id: true,
        badge_type: true,
        badge_name: true,
        earned_at: true,
      },
      orderBy: { earned_at: "desc" },
    })
    .catch(() => []);

  // 클라 컴포넌트로 직렬화 — BigInt → string, Date → ISO
  const earnedBadges = userBadges.map((b) => ({
    id: b.id.toString(),
    badgeType: b.badge_type,
    badgeName: b.badge_name,
    earnedAt: b.earned_at.toISOString(),
  }));

  return <AchievementsContent earnedBadges={earnedBadges} />;
}
