"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* ============================================================
 * 단체 생성 폼 — /tournament-admin/organizations/new
 *
 * name(필수), slug(선택), description, region, logo_url 입력.
 * 생성 성공 시 해당 단체 대시보드로 이동.
 * ============================================================ */

export default function NewOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("단체 이름을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/web/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
          region: region.trim() || undefined,
          logo_url: logoUrl.trim() || undefined,
          contact_email: contactEmail.trim() || undefined,
          website_url: websiteUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "생성에 실패했습니다.");
        return;
      }

      // 생성 성공 → 단체 대시보드로 이동
      router.push(`/tournament-admin/organizations/${data.id}`);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // 지역 옵션 (한국 주요 광역시/도)
  const regions = [
    "서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산",
    "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
  ];

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-xl font-bold text-[var(--color-text-primary)]">
        새 단체 만들기
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 에러 메시지 */}
        {error && (
          <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* 단체 이름 (필수) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
            단체 이름 <span className="text-[var(--color-primary)]">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 서울 농구 연합"
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
            required
          />
        </div>

        {/* slug (선택 — 비워두면 자동 생성) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
            URL 슬러그
            <span className="ml-1 text-xs text-[var(--color-text-muted)]">
              (비워두면 자동 생성)
            </span>
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="예: seoul-basketball-union"
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
          />
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            영문/숫자/하이픈만 사용. 공개 페이지 URL에 사용됩니다.
          </p>
        </div>

        {/* 소개 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
            소개
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="단체를 소개해주세요"
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
          />
        </div>

        {/* 활동 지역 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
            활동 지역
          </label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">선택 안함</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* 로고 URL */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
            로고 URL
          </label>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
          />
        </div>

        {/* 연락 이메일 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
            연락 이메일
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="contact@example.com"
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
          />
        </div>

        {/* 웹사이트 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
            웹사이트
          </label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "생성 중..." : "단체 만들기"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded border border-[var(--color-border)] px-6 py-2.5 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
