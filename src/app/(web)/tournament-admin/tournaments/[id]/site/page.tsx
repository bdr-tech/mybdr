"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Site = {
  id: string;
  subdomain: string;
  isPublished: boolean;
  primaryColor: string | null;
  secondaryColor: string | null;
  site_name: string | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
};

export default function TournamentSitePage() {
  const { id } = useParams<{ id: string }>();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    subdomain: "",
    site_name: "",
    primaryColor: "#F4A261",
    secondaryColor: "#E76F51",
    meta_title: "",
    meta_description: "",
  });

  const set = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/site`);
      if (res.ok) {
        const data: Site = await res.json();
        if (data) {
          setSite(data);
          setForm({
            subdomain: data.subdomain ?? "",
            site_name: data.site_name ?? "",
            primaryColor: data.primaryColor ?? "#F4A261",
            secondaryColor: data.secondaryColor ?? "#E76F51",
            meta_title: data.meta_title ?? "",
            meta_description: data.meta_description ?? "",
          });
        }
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/site`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      setSuccess("저장되었습니다.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    setPublishing(true);
    setError("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/site/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: !site?.isPublished }),
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

  const inputCls = "w-full rounded-[16px] border-none bg-[#E8ECF0] px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50";
  const labelCls = "mb-1 block text-sm text-[#6B7280]";

  if (loading)
    return <div className="flex h-40 items-center justify-center text-[#6B7280]">불러오는 중...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/tournament-admin/tournaments/${id}`} className="text-sm text-[#6B7280] hover:text-[#111827]">← 대회 관리</Link>
          <h1 className="mt-1 text-2xl font-bold">사이트 관리</h1>
        </div>
        {site && (
          <div className="flex gap-2">
            {site.isPublished && (
              <a
                href={`https://${site.subdomain}.mybdr.kr`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[#E8ECF0] px-4 py-2 text-sm text-[#6B7280] hover:text-[#111827]"
              >
                미리보기 ↗
              </a>
            )}
            <Button
              onClick={togglePublish}
              disabled={publishing}
              className={site.isPublished ? "bg-[#EF4444] hover:bg-red-600" : ""}
            >
              {publishing ? "처리 중..." : site.isPublished ? "비공개로 전환" : "공개하기"}
            </Button>
          </div>
        )}
      </div>

      {error && <div className="mb-4 rounded-[12px] bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      {success && <div className="mb-4 rounded-[12px] bg-green-500/10 px-4 py-3 text-sm text-green-400">{success}</div>}

      {/* 현재 상태 */}
      {site && (
        <Card className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#6B7280]">현재 URL</p>
              <p className="font-mono text-[#F4A261]">{site.subdomain}.mybdr.kr</p>
            </div>
            <span className={`text-sm font-semibold ${site.isPublished ? "text-[#4ADE80]" : "text-[#6B7280]"}`}>
              {site.isPublished ? "● 공개 중" : "○ 비공개"}
            </span>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* URL 설정 */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold">URL 설정</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>서브도메인</label>
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 rounded-[16px] border-none bg-[#E8ECF0] px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50"
                  value={form.subdomain}
                  onChange={(e) => set("subdomain", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="my-tournament"
                />
                <span className="whitespace-nowrap text-sm text-[#6B7280]">.mybdr.kr</span>
              </div>
            </div>
            <div>
              <label className={labelCls}>사이트 이름</label>
              <input className={inputCls} value={form.site_name} onChange={(e) => set("site_name", e.target.value)} placeholder="사이트 이름 (선택)" />
            </div>
          </div>
        </Card>

        {/* 디자인 */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold">디자인</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>대표 색상</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => set("primaryColor", e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-[8px] border-none bg-transparent p-0"
                  />
                  <span className="text-xs text-[#6B7280]">{form.primaryColor}</span>
                </div>
              </div>
              <div>
                <label className={labelCls}>보조 색상</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.secondaryColor}
                    onChange={(e) => set("secondaryColor", e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-[8px] border-none bg-transparent p-0"
                  />
                  <span className="text-xs text-[#6B7280]">{form.secondaryColor}</span>
                </div>
              </div>
            </div>
            {/* 색상 미리보기 */}
            <div
              className="h-12 rounded-[16px]"
              style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})` }}
            />
          </div>
        </Card>

        {/* SEO */}
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">SEO 설정</h2>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>메타 제목</label>
              <input className={inputCls} value={form.meta_title} onChange={(e) => set("meta_title", e.target.value)} placeholder="검색 결과에 표시될 제목" />
            </div>
            <div>
              <label className={labelCls}>메타 설명</label>
              <textarea className={inputCls} rows={3} value={form.meta_description} onChange={(e) => set("meta_description", e.target.value)} placeholder="검색 결과에 표시될 설명" />
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}
