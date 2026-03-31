"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

/* ============================================================
 * 단체 대시보드 — /tournament-admin/organizations/[orgId]
 *
 * 단체 정보 표시 + 수정 + 소속 시리즈 목록 + "새 시리즈 만들기" 버튼
 * ============================================================ */

interface OrgDetail {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  region: string | null;
  contactEmail: string | null;
  websiteUrl: string | null;
  status: string;
  isPublic: boolean;
  seriesCount: number;
  myRole: string | null;
  members: { id: string; nickname: string; role: string }[];
  series: {
    id: string;
    name: string;
    slug: string;
    tournamentsCount: number;
    createdAt: string;
  }[];
}

export default function OrganizationDashboardPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 단체 정보 로드
  useEffect(() => {
    fetch(`/api/web/organizations/${orgId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        // snake_case → camelCase 매핑
        setOrg({
          id: data.id,
          name: data.name,
          slug: data.slug,
          logoUrl: data.logo_url,
          bannerUrl: data.banner_url,
          description: data.description,
          region: data.region,
          contactEmail: data.contact_email,
          websiteUrl: data.website_url,
          status: data.status,
          isPublic: data.is_public,
          seriesCount: data.series_count,
          myRole: data.my_role,
          members: (data.members || []).map((m: Record<string, unknown>) => ({
            id: m.id,
            nickname: m.nickname,
            role: m.role,
          })),
          series: (data.series || []).map((s: Record<string, unknown>) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            tournamentsCount: s.tournaments_count ?? 0,
            createdAt: s.created_at,
          })),
        });
      })
      .catch(() => setError("단체 정보를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  }, [orgId]);

  // 새 시리즈 생성 (단체 소속으로)
  const [creatingSeriesName, setCreatingSeriesName] = useState("");
  const [showSeriesForm, setShowSeriesForm] = useState(false);

  const handleCreateSeries = async () => {
    if (!creatingSeriesName.trim()) return;
    try {
      const res = await fetch("/api/web/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: creatingSeriesName.trim(),
          organization_id: orgId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // 시리즈 목록에 추가
        setOrg((prev) =>
          prev
            ? {
                ...prev,
                series: [
                  {
                    id: data.id,
                    name: data.name || creatingSeriesName,
                    slug: data.slug,
                    tournamentsCount: 0,
                    createdAt: new Date().toISOString(),
                  },
                  ...prev.series,
                ],
                seriesCount: prev.seriesCount + 1,
              }
            : prev
        );
        setCreatingSeriesName("");
        setShowSeriesForm(false);
      }
    } catch {
      /* 무시 */
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-surface)]" />
        <div className="h-32 animate-pulse rounded-lg bg-[var(--color-surface)]" />
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="py-20 text-center text-[var(--color-text-muted)]">
        {error || "단체를 찾을 수 없습니다."}
      </div>
    );
  }

  const isAdmin = org.myRole === "owner" || org.myRole === "admin";

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        {org.logoUrl ? (
          <img
            src={org.logoUrl}
            alt={org.name}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-lg font-bold text-white">
            {org.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
            {org.name}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {org.region || "지역 미설정"} · 멤버 {org.members.length}명 · 시리즈{" "}
            {org.seriesCount}개
          </p>
        </div>
      </div>

      {/* 정보 카드 */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium text-[var(--color-text-primary)]">
            단체 정보
          </h2>
          {isAdmin && (
            <Link
              href={`/organizations/${org.slug}`}
              target="_blank"
              className="text-xs text-[var(--color-info)] hover:underline"
            >
              공개 페이지 보기
              <span className="material-symbols-outlined ml-0.5 text-xs align-middle">
                open_in_new
              </span>
            </Link>
          )}
        </div>
        <dl className="grid gap-2 text-sm md:grid-cols-2">
          <div>
            <dt className="text-[var(--color-text-muted)]">slug</dt>
            <dd className="text-[var(--color-text-primary)]">{org.slug}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-text-muted)]">상태</dt>
            <dd className="text-[var(--color-text-primary)]">
              {org.status} · {org.isPublic ? "공개" : "비공개"}
            </dd>
          </div>
          {org.description && (
            <div className="md:col-span-2">
              <dt className="text-[var(--color-text-muted)]">소개</dt>
              <dd className="text-[var(--color-text-primary)]">
                {org.description}
              </dd>
            </div>
          )}
          {org.contactEmail && (
            <div>
              <dt className="text-[var(--color-text-muted)]">이메일</dt>
              <dd className="text-[var(--color-text-primary)]">
                {org.contactEmail}
              </dd>
            </div>
          )}
          {org.websiteUrl && (
            <div>
              <dt className="text-[var(--color-text-muted)]">웹사이트</dt>
              <dd>
                <a
                  href={org.websiteUrl}
                  target="_blank"
                  rel="noopener"
                  className="text-[var(--color-info)] hover:underline"
                >
                  {org.websiteUrl}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* 멤버 관리 링크 */}
      {isAdmin && (
        <Link
          href={`/tournament-admin/organizations/${orgId}/members`}
          className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-primary)]"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--color-text-muted)]">
              group
            </span>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              멤버 관리 ({org.members.length}명)
            </span>
          </div>
          <span className="material-symbols-outlined text-[var(--color-text-muted)]">
            chevron_right
          </span>
        </Link>
      )}

      {/* 소속 시리즈 */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium text-[var(--color-text-primary)]">
            소속 시리즈
          </h2>
          {isAdmin && (
            <button
              onClick={() => setShowSeriesForm((v) => !v)}
              className="rounded bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >
              <span className="material-symbols-outlined mr-0.5 text-sm align-middle">
                add
              </span>
              새 시리즈
            </button>
          )}
        </div>

        {/* 시리즈 생성 인라인 폼 */}
        {showSeriesForm && (
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={creatingSeriesName}
              onChange={(e) => setCreatingSeriesName(e.target.value)}
              placeholder="시리즈 이름"
              className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              onKeyDown={(e) => e.key === "Enter" && handleCreateSeries()}
            />
            <button
              onClick={handleCreateSeries}
              className="rounded bg-[var(--color-info)] px-4 py-2 text-sm text-white hover:opacity-90"
            >
              만들기
            </button>
          </div>
        )}

        {/* 시리즈 목록 */}
        {org.series.length > 0 ? (
          <div className="space-y-2">
            {org.series.map((s) => (
              <Link
                key={s.id}
                href={`/tournament-admin/series/${s.id}`}
                className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-primary)]"
              >
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {s.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    대회 {s.tournamentsCount}개 · {s.slug}
                  </p>
                </div>
                <span className="material-symbols-outlined text-[var(--color-text-muted)]">
                  chevron_right
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
            아직 시리즈가 없습니다. 새 시리즈를 만들어보세요.
          </p>
        )}
      </div>
    </div>
  );
}
