import Link from "next/link";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { EmptyState } from "../_components/empty-state";

/**
 * /referee/profile — 내 심판 프로필 조회 (Server Component)
 *
 * 이유: 읽기 전용 뷰라서 서버에서 한 번에 조회하는 편이 SEO/성능/코드 단순성 모두 유리.
 *      수정은 /referee/profile/edit 로 분리.
 */

export const dynamic = "force-dynamic";

export default async function RefereeProfilePage() {
  const session = await getWebSession();
  if (!session) return null;

  const userId = BigInt(session.sub);

  // 본인 Referee + User(실명/연락처) + 협회 정보
  const referee = await prisma.referee.findUnique({
    where: { user_id: userId },
    include: {
      association: {
        select: { id: true, name: true, code: true, level: true },
      },
      user: {
        select: {
          name: true,
          phone: true,
          birth_date: true,
        },
      },
    },
  });

  // 미등록: 생성 폼으로 안내
  if (!referee) {
    return (
      <div className="space-y-6">
        <PageHeader title="내 프로필" />
        <EmptyState
          icon="badge"
          title="심판 프로필이 없습니다"
          description="먼저 심판 프로필을 등록하세요."
          ctaText="프로필 등록"
          ctaHref="/referee/profile/edit"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="내 프로필" />

      {/* 상단 카드: 기본 정보 */}
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
            <h2
              className="truncate text-xl font-black"
              style={{ color: "var(--color-text-primary)" }}
            >
              {referee.user?.name ?? session.name ?? "이름 미등록"}
            </h2>
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              {referee.association?.name ?? "소속 협회 미지정"}
            </p>
          </div>
          <Link
            href="/referee/profile/edit"
            className="flex h-9 items-center gap-1 px-3 text-xs font-semibold"
            style={{
              color: "var(--color-primary)",
              border: "1px solid var(--color-primary)",
              borderRadius: 4,
            }}
          >
            <span className="material-symbols-outlined text-base">edit</span>
            수정
          </Link>
        </div>
      </section>

      {/* 필드 리스트 */}
      <section
        className="divide-y"
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 4,
        }}
      >
        <Field label="역할" value={referee.role_type} />
        <Field label="숙련도" value={referee.level ?? "-"} />
        <Field
          label="자격번호"
          value={referee.license_number ?? "-"}
        />
        <Field
          label="지역"
          value={
            referee.region_sido || referee.region_sigungu
              ? `${referee.region_sido ?? ""} ${referee.region_sigungu ?? ""}`.trim()
              : "-"
          }
        />
        <Field label="상태" value={referee.status} />
        <Field
          label="소개"
          value={referee.bio ?? "-"}
          multiline
        />
      </section>
    </div>
  );
}

function PageHeader({ title }: { title: string }) {
  return (
    <header className="flex items-center justify-between">
      <h1
        className="text-2xl font-black uppercase tracking-wider"
        style={{ color: "var(--color-text-primary)" }}
      >
        {title}
      </h1>
    </header>
  );
}

function Field({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div
      className="flex gap-4 px-5 py-3"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div
        className="w-24 shrink-0 text-xs font-bold uppercase tracking-wider"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </div>
      <div
        className={`flex-1 text-sm ${multiline ? "whitespace-pre-wrap" : "truncate"}`}
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </div>
    </div>
  );
}
