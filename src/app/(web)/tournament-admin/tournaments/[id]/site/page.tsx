"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    slug: "classic-tournament",
    name: "Classic",
    desc: "깔끔한 화이트 배경의 모던 레이아웃",
    navBg: "#1B3C87",
    bg: "#F5F7FA",
    cardBg: "#FFFFFF",
  },
  {
    slug: "the-process",
    name: "Dark",
    desc: "강렬한 다크 배경의 대담한 스타일",
    navBg: "#1F2937",
    bg: "#0F172A",
    cardBg: "#1E293B",
  },
  {
    slug: "minimal-white",
    name: "Minimal",
    desc: "타이포그래피 중심의 미니멀한 느낌",
    navBg: "#FFFFFF",
    bg: "#FFFFFF",
    cardBg: "#F5F7FA",
  },
];

const COLOR_PRESETS = [
  { hex: "#1B3C87", name: "토스 블루" },
  { hex: "#EF4444", name: "레드" },
  { hex: "#E31B23", name: "오렌지" },
  { hex: "#22C55E", name: "그린" },
  { hex: "#8B5CF6", name: "퍼플" },
  { hex: "#FBBF24", name: "골드" },
  { hex: "#0EA5E9", name: "스카이" },
  { hex: "#1F2937", name: "다크" },
];

// ─── 타입 ─────────────────────────────────────────────────────────────────────

type Site = {
  id: string;
  subdomain: string;
  isPublished: boolean;
  primaryColor: string | null;
  secondaryColor: string | null;
  site_name: string | null;
  siteTemplateSlug?: string | null;
};

// ─── 템플릿 미리보기 카드 ────────────────────────────────────────────────────

function TemplateMockup({
  template,
  accentColor,
}: {
  template: (typeof TEMPLATES)[0];
  accentColor: string;
}) {
  const nav = template.slug === "minimal-white" ? "#FFFFFF" : accentColor;
  const navTextColor = template.slug === "minimal-white" ? accentColor : "#FFFFFF";

  return (
    <div
      className="overflow-hidden rounded-xl border-2 border-transparent"
      style={{ backgroundColor: template.bg, height: 120 }}
    >
      {/* 네비 */}
      <div
        className="flex h-7 items-center gap-1 px-2"
        style={{ backgroundColor: nav }}
      >
        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: navTextColor, opacity: 0.5 }} />
        <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: navTextColor, opacity: 0.8 }} />
        <div className="ml-auto flex gap-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-1.5 w-4 rounded-full" style={{ backgroundColor: navTextColor, opacity: 0.5 }} />
          ))}
        </div>
      </div>
      {/* 히어로 */}
      <div className="mx-2 mt-2 h-5 rounded-lg" style={{ backgroundColor: accentColor, opacity: 0.15 }}>
        <div className="flex h-full items-center justify-center">
          <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.7 }} />
        </div>
      </div>
      {/* 콘텐츠 행 */}
      <div className="mx-2 mt-2 space-y-1.5">
        {[0.8, 0.5, 0.3].map((op, i) => (
          <div
            key={i}
            className="h-2 rounded-full"
            style={{ backgroundColor: template.cardBg, opacity: op, width: `${[80, 60, 45][i]}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────

export default function TournamentSitePage() {
  const { id } = useParams<{ id: string }>();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  // 상태
  const [selectedTemplate, setSelectedTemplate] = useState("classic-tournament");
  const [selectedColor, setSelectedColor] = useState("#1B3C87");
  const [subdomain, setSubdomain] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/site`);
      if (res.ok) {
        const data: Site & { siteTemplate?: { slug: string } | null } = await res.json();
        if (data?.id) {
          setSite(data);
          if (data.siteTemplate?.slug) setSelectedTemplate(data.siteTemplate.slug);
          if (data.primaryColor) setSelectedColor(data.primaryColor);
          if (data.subdomain) setSubdomain(data.subdomain);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // PATCH 저장 (템플릿 + 색상 + 서브도메인)
  const save = async (opts?: { andPublish?: boolean }) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/site`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain: subdomain.trim().toLowerCase(),
          siteTemplateSlug: selectedTemplate,
          primaryColor: selectedColor,
          secondaryColor: selectedColor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      await load();

      if (opts?.andPublish) {
        await togglePublish(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
      setSaving(false);
      return false;
    }
    setSaving(false);
    return true;
  };

  const togglePublish = async (forcePublish?: boolean) => {
    setPublishing(true);
    setError("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/site/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: forcePublish ?? !site?.isPublished }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "실패");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setPublishing(false);
    }
  };

  const handleNextFromStep2 = async () => {
    // Step 2 → Step 3: 중간 저장
    const ok = await save();
    if (ok) setStep(3);
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-[var(--color-text-muted)]">
        불러오는 중...
      </div>
    );
  }

  // ─── 발행 완료 상태 ──────────────────────────────────────────────────────

  if (site?.isPublished) {
    return (
      <div>
        <div className="mb-6">
          <Link href={`/tournament-admin/tournaments/${id}`} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            ← 대회 관리
          </Link>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">사이트 관리</h1>
        </div>

        {/* 발행 중 상태 카드 */}
        <div className="mb-6 rounded-2xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-success)]">● 사이트 공개 중</p>
              <p className="mt-0.5 font-mono text-lg font-semibold text-[var(--color-text-primary)]">
                {site.subdomain}.mybdr.kr
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href={`https://${site.subdomain}.mybdr.kr`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                방문하기 ↗
              </a>
              <button
                onClick={() => togglePublish(false)}
                disabled={publishing}
                className="rounded-full border border-[var(--color-error)]/30 px-4 py-2 text-sm text-[var(--color-error)] hover:bg-[var(--color-error)]/5 disabled:opacity-50"
              >
                {publishing ? "처리 중..." : "비공개 전환"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {/* 수정 버튼들 */}
        <div className="grid gap-3 md:grid-cols-3">
          <button
            onClick={() => setStep(1)}
            className="rounded-2xl border border-[var(--color-border)] bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-2xl mb-2">🎨</p>
            <p className="font-semibold text-[var(--color-text-primary)]">템플릿 변경</p>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
              {TEMPLATES.find((t) => t.slug === selectedTemplate)?.name ?? "Classic"}
            </p>
          </button>
          <button
            onClick={() => setStep(2)}
            className="rounded-2xl border border-[var(--color-border)] bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <div
              className="mb-2 h-8 w-8 rounded-full border-2 border-white shadow"
              style={{ backgroundColor: selectedColor }}
            />
            <p className="font-semibold text-[var(--color-text-primary)]">색상 변경</p>
            <p className="mt-0.5 font-mono text-sm text-[var(--color-text-muted)]">{selectedColor}</p>
          </button>
          <Link
            href={`/tournament-admin/tournaments/${id}/site/pages`}
            className="rounded-2xl border border-[var(--color-border)] bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-2xl mb-2">📄</p>
            <p className="font-semibold text-[var(--color-text-primary)]">공지 페이지</p>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">공지사항 작성</p>
          </Link>
        </div>

        {/* 스텝 1 오버레이 */}
        {step === 1 && (
          <Step1
            selected={selectedTemplate}
            accentColor={selectedColor}
            onChange={setSelectedTemplate}
            onNext={() => setStep(2)}
            onCancel={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <Step2
            selected={selectedColor}
            onChange={setSelectedColor}
            onNext={handleNextFromStep2}
            onBack={() => setStep(1)}
            saving={saving}
          />
        )}
      </div>
    );
  }

  // ─── 위자드 (3단계) ──────────────────────────────────────────────────────

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-8">
        <Link href={`/tournament-admin/tournaments/${id}`} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          ← 대회 관리
        </Link>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">사이트 만들기</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          3단계로 대회 전용 웹사이트를 만들어보세요
        </p>
      </div>

      {/* 진행 표시 */}
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                step === s
                  ? "bg-[var(--color-accent)] text-white"
                  : step > s
                  ? "bg-[var(--color-success)] text-white"
                  : "bg-[var(--color-border)] text-[var(--color-text-muted)]"
              }`}
            >
              {step > s ? "✓" : s}
            </div>
            <span
              className={`text-sm font-medium ${
                step === s ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"
              }`}
            >
              {["템플릿", "색상", "발행"][s - 1]}
            </span>
            {s < 3 && <div className="h-px w-8 bg-[var(--color-border)]" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* 단계별 컨텐츠 */}
      {step === 1 && (
        <Step1
          selected={selectedTemplate}
          accentColor={selectedColor}
          onChange={setSelectedTemplate}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <Step2
          selected={selectedColor}
          onChange={setSelectedColor}
          onNext={handleNextFromStep2}
          onBack={() => setStep(1)}
          saving={saving}
        />
      )}

      {step === 3 && (
        <Step3
          subdomain={subdomain}
          onChange={setSubdomain}
          selectedTemplate={selectedTemplate}
          selectedColor={selectedColor}
          siteId={site?.id}
          saving={saving || publishing}
          onBack={() => setStep(2)}
          onPublish={async () => {
            const ok = await save({ andPublish: true });
            if (!ok) return;
          }}
          onSaveDraft={async () => {
            await save();
          }}
          error={error}
        />
      )}
    </div>
  );
}

// ─── 스텝 1: 템플릿 선택 ────────────────────────────────────────────────────

function Step1({
  selected,
  accentColor,
  onChange,
  onNext,
  onCancel,
}: {
  selected: string;
  accentColor: string;
  onChange: (slug: string) => void;
  onNext: () => void;
  onCancel?: () => void;
}) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-bold text-[var(--color-text-primary)]">템플릿 선택</h2>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        대회 사이트의 전체 스타일을 선택하세요. 언제든지 변경할 수 있습니다.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.slug}
            onClick={() => onChange(tpl.slug)}
            className={`rounded-2xl border-2 p-4 text-left transition-all ${
              selected === tpl.slug
                ? "border-[var(--color-accent)] shadow-[0_0_0_4px_rgba(0,102,255,0.1)]"
                : "border-[var(--color-border)] hover:border-[var(--color-text-muted)]"
            }`}
          >
            <TemplateMockup template={tpl} accentColor={accentColor} />
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[var(--color-text-primary)]">{tpl.name}</p>
                {selected === tpl.slug && (
                  <span className="text-xs font-medium text-[var(--color-accent)]">선택됨 ✓</span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{tpl.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-between">
        {onCancel && (
          <button onClick={onCancel} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            취소
          </button>
        )}
        <Button onClick={onNext} className="ml-auto">
          다음: 색상 선택 →
        </Button>
      </div>
    </div>
  );
}

// ─── 스텝 2: 색상 선택 ──────────────────────────────────────────────────────

function Step2({
  selected,
  onChange,
  onNext,
  onBack,
  saving,
}: {
  selected: string;
  onChange: (hex: string) => void;
  onNext: () => void;
  onBack: () => void;
  saving: boolean;
}) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-bold text-[var(--color-text-primary)]">대표 색상 선택</h2>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        사이트 네비게이션과 강조 색상으로 사용됩니다.
      </p>

      {/* 색상 팔레트 */}
      <div className="flex flex-wrap gap-4">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c.hex}
            onClick={() => onChange(c.hex)}
            title={c.name}
            className={`group relative flex flex-col items-center gap-2 ${
              selected === c.hex ? "" : "opacity-80 hover:opacity-100"
            }`}
          >
            <div
              className={`h-14 w-14 rounded-full shadow-md transition-transform ${
                selected === c.hex
                  ? "scale-110 ring-4 ring-[var(--color-accent)]/30 ring-offset-2"
                  : "hover:scale-105"
              }`}
              style={{ backgroundColor: c.hex }}
            />
            <span className="text-xs text-[var(--color-text-muted)]">{c.name}</span>
            {selected === c.hex && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg text-white drop-shadow">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* 미리보기 */}
      <div className="mt-8 rounded-2xl border border-[var(--color-border)] p-4">
        <p className="mb-3 text-xs font-medium text-[var(--color-text-muted)]">미리보기</p>
        <div className="overflow-hidden rounded-xl" style={{ height: 64 }}>
          <div
            className="flex h-10 items-center gap-2 px-4"
            style={{ backgroundColor: selected }}
          >
            <div className="h-5 w-5 rounded-full bg-white/20" />
            <div className="h-2 w-20 rounded-full bg-white/80" />
            <div className="ml-auto flex gap-2">
              {["홈", "팀", "일정", "결과"].map((l) => (
                <span key={l} className="text-xs text-white/80">{l}</span>
              ))}
            </div>
          </div>
          <div
            className="flex items-center justify-center"
            style={{ height: 24, backgroundColor: `${selected}15` }}
          >
            <div className="h-1.5 w-24 rounded-full" style={{ backgroundColor: selected, opacity: 0.5 }} />
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button onClick={onBack} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          ← 이전
        </button>
        <Button onClick={onNext} disabled={saving}>
          {saving ? "저장 중..." : "다음: 주소 설정 →"}
        </Button>
      </div>
    </div>
  );
}

// ─── 스텝 3: 주소 설정 + 발행 ────────────────────────────────────────────────

function Step3({
  subdomain,
  onChange,
  selectedTemplate,
  selectedColor,
  siteId,
  saving,
  onBack,
  onPublish,
  onSaveDraft,
  error,
}: {
  subdomain: string;
  onChange: (v: string) => void;
  selectedTemplate: string;
  selectedColor: string;
  siteId?: string;
  saving: boolean;
  onBack: () => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  error: string;
}) {
  const tplName = TEMPLATES.find((t) => t.slug === selectedTemplate)?.name ?? "Classic";

  return (
    <div>
      <h2 className="mb-2 text-lg font-bold text-[var(--color-text-primary)]">주소 설정 및 발행</h2>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        대회 사이트 URL을 설정하고 바로 공개하거나 임시 저장할 수 있습니다.
      </p>

      {/* 요약 */}
      <div className="mb-6 grid gap-3 rounded-2xl bg-[var(--color-surface)] p-4 md:grid-cols-2">
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">선택한 템플릿</p>
          <p className="mt-1 font-semibold text-[var(--color-text-primary)]">{tplName}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">대표 색상</p>
          <div className="mt-1 flex items-center gap-2">
            <div
              className="h-5 w-5 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="font-mono text-sm font-semibold text-[var(--color-text-primary)]">
              {selectedColor}
            </span>
          </div>
        </div>
      </div>

      {/* URL 설정 */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">
          사이트 주소 <span className="text-[var(--color-error)]">*</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            className="flex-1 rounded-2xl border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
            value={subdomain}
            onChange={(e) =>
              onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            placeholder="my-tournament"
            autoFocus
          />
          <span className="whitespace-nowrap text-sm font-medium text-[var(--color-text-muted)]">
            .mybdr.kr
          </span>
        </div>
        {subdomain && (
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            https://<span className="text-[var(--color-accent)]">{subdomain}</span>.mybdr.kr
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          onClick={onBack}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          disabled={saving}
        >
          ← 이전
        </button>
        <div className="flex gap-3">
          <button
            onClick={onSaveDraft}
            disabled={saving || !subdomain.trim()}
            className="rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-40"
          >
            {saving ? "저장 중..." : "임시 저장"}
          </button>
          <Button
            onClick={onPublish}
            disabled={saving || !subdomain.trim()}
            className="min-w-[120px]"
          >
            {saving ? "처리 중..." : "🚀 공개하기"}
          </Button>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
        공개 후에도 언제든지 설정을 변경하거나 비공개로 전환할 수 있습니다
      </p>
    </div>
  );
}

