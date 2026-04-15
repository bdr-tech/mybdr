import Link from "next/link";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { EmptyState } from "./_components/empty-state";

/**
 * /referee — 심판 플랫폼 대시보드 (Server Component)
 *
 * 이유: 최초 진입 시 본인 Referee 존재 여부에 따라 뷰가 완전히 달라지므로
 *      서버에서 먼저 조회해 분기한다.
 */

export const dynamic = "force-dynamic";

export default async function RefereeDashboardPage() {
  // layout에서 이미 세션 체크를 했지만 타입 안전을 위해 다시 확인
  const session = await getWebSession();
  if (!session) return null;

  const userId = BigInt(session.sub);

  // 본인 Referee + 자격증 개수 + 소속 협회 로드
  const referee = await prisma.referee.findUnique({
    where: { user_id: userId },
    include: {
      association: { select: { id: true, name: true, code: true } },
      _count: { select: { certificates: true } },
    },
  });

  // 미등록 상태: 등록 유도 CTA
  if (!referee) {
    return (
      <div className="space-y-6">
        <header>
          <h1
            className="text-2xl font-black uppercase tracking-wider"
            style={{ color: "var(--color-text-primary)" }}
          >
            심판 플랫폼
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            자격증을 등록하고 경기 배정/정산 내역을 관리하세요.
          </p>
        </header>

        <EmptyState
          icon="badge"
          title="심판 프로필이 없습니다"
          description="먼저 심판 프로필을 등록해야 자격증과 경기 배정을 관리할 수 있습니다."
          ctaText="프로필 등록하기"
          ctaHref="/referee/profile/edit"
        />
      </div>
    );
  }

  // 등록 상태: 내 카드 + 빠른 링크
  return (
    <div className="space-y-6">
      <header>
        <h1
          className="text-2xl font-black uppercase tracking-wider"
          style={{ color: "var(--color-text-primary)" }}
        >
          대시보드
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          안녕하세요, {session.name ?? "회원"}님.
        </p>
      </header>

      {/* 매칭 완료 안내 배너 — 협회가 사전 등록한 심판과 유저가 매칭된 경우 표시 */}
      {referee.match_status === "matched" && referee.association && (
        <div
          className="flex items-center gap-3 p-4"
          style={{
            backgroundColor: "var(--color-success-subtle, rgba(34,197,94,0.1))",
            border: "1px solid var(--color-success, #22c55e)",
            borderRadius: 4,
          }}
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={{ color: "var(--color-success, #22c55e)" }}
          >
            check_circle
          </span>
          <div>
            <p
              className="text-sm font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {referee.association.name}에서 심판으로 등록되었습니다
            </p>
            <p
              className="mt-0.5 text-xs"
              style={{ color: "var(--color-text-secondary)" }}
            >
              협회 관리자가 사전 등록한 정보와 자동으로 연결되었습니다.
            </p>
          </div>
        </div>
      )}

      {/* ========================================
       * 내 심판 카드
       * ======================================== */}
      <section
        className="p-5"
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 4,
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              내 프로필
            </p>
            <h2
              className="mt-1 truncate text-xl font-black"
              style={{ color: "var(--color-text-primary)" }}
            >
              {session.name ?? "회원"}
            </h2>
            <div
              className="mt-2 flex flex-wrap items-center gap-2 text-xs"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {referee.association && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-1"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    borderRadius: 4,
                  }}
                >
                  <span className="material-symbols-outlined text-sm">
                    apartment
                  </span>
                  {referee.association.name}
                </span>
              )}
              <span
                className="inline-flex items-center gap-1 px-2 py-1"
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderRadius: 4,
                }}
              >
                <span className="material-symbols-outlined text-sm">
                  category
                </span>
                {referee.role_type}
              </span>
              {referee.level && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-1"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    borderRadius: 4,
                  }}
                >
                  <span className="material-symbols-outlined text-sm">
                    military_tech
                  </span>
                  {referee.level}
                </span>
              )}
            </div>
          </div>
          <Link
            href="/referee/profile"
            className="flex h-9 items-center gap-1 px-3 text-xs font-semibold"
            style={{
              color: "var(--color-primary)",
              border: "1px solid var(--color-primary)",
              borderRadius: 4,
            }}
          >
            상세
            <span className="material-symbols-outlined text-base">
              arrow_forward
            </span>
          </Link>
        </div>

        {/* 자격증 개수 표시 */}
        <div
          className="mt-5 flex items-center justify-between border-t pt-4"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div>
            <p
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              등록 자격증
            </p>
            <p
              className="mt-0.5 text-2xl font-black"
              style={{ color: "var(--color-text-primary)" }}
            >
              {referee._count.certificates}
              <span
                className="ml-1 text-sm font-semibold"
                style={{ color: "var(--color-text-muted)" }}
              >
                건
              </span>
            </p>
          </div>
          <Link
            href="/referee/certificates"
            className="flex items-center gap-1 px-4 py-2 text-xs font-bold uppercase tracking-wide"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text-primary)",
              borderRadius: 4,
            }}
          >
            관리
            <span className="material-symbols-outlined text-base">
              arrow_forward
            </span>
          </Link>
        </div>
      </section>

      {/* ========================================
       * 빠른 링크 (2열 그리드)
       * ======================================== */}
      <section className="grid grid-cols-2 gap-3">
        <QuickLinkCard
          href="/referee/profile/edit"
          icon="edit"
          title="프로필 수정"
          description="소속/지역/등급 변경"
        />
        <QuickLinkCard
          href="/referee/certificates"
          icon="verified"
          title="자격증 관리"
          description="등록 · 수정 · 삭제"
        />
        <QuickLinkCard
          href="/referee/assignments"
          icon="event"
          title="배정 기록"
          description="공식 경기 배정 내역"
          disabled
        />
        <QuickLinkCard
          href="/referee/settlements"
          icon="payments"
          title="정산 기록"
          description="지급 · 대기 내역"
          disabled
        />
      </section>
    </div>
  );
}

/**
 * 대시보드에서만 쓰는 작은 링크 카드.
 * disabled=true면 회색 톤으로 표시하고 클릭 이동하지 않음 (Commit 3 예정 항목용).
 */
function QuickLinkCard({
  href,
  icon,
  title,
  description,
  disabled = false,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  disabled?: boolean;
}) {
  const content = (
    <div
      className="flex items-start gap-3 p-4"
      style={{
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 4,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span
        className="material-symbols-outlined text-2xl"
        style={{ color: "var(--color-primary)" }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3
          className="text-sm font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </h3>
        <p
          className="mt-0.5 text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          {description}
        </p>
      </div>
      {!disabled && (
        <span
          className="material-symbols-outlined text-base"
          style={{ color: "var(--color-text-muted)" }}
        >
          arrow_forward
        </span>
      )}
    </div>
  );

  if (disabled) return content;
  return <Link href={href}>{content}</Link>;
}
