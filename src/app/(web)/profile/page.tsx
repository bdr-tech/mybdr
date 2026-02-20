"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const tabs = [
  { id: "info", label: "정보" },
  { id: "games", label: "경기" },
  { id: "stats", label: "기록" },
  { id: "teams", label: "팀" },
  { id: "tournaments", label: "대회" },
];

const POSITIONS = ["PG", "SG", "SF", "PF", "C"];

interface ProfileData {
  user: {
    nickname: string | null;
    email: string;
    position: string | null;
    height: number | null;
    city: string | null;
    bio: string | null;
    profile_image_url: string | null;
    total_games_participated: number | null;
  };
  teams: { id: string; name: string; role: string }[];
  recentGames: { id: string; title: string | null; scheduled_at: string | null; status: number }[];
  tournaments: { id: string; name: string; status: string | null }[];
}

function EditModal({
  user,
  onClose,
  onSaved,
}: {
  user: ProfileData["user"];
  onClose: () => void;
  onSaved: (updated: Partial<ProfileData["user"]>) => void;
}) {
  const [form, setForm] = useState({
    nickname: user.nickname ?? "",
    position: user.position ?? "",
    height: user.height?.toString() ?? "",
    city: user.city ?? "",
    bio: user.bio ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/web/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: form.nickname || null,
          position: form.position || null,
          height: form.height ? Number(form.height) : null,
          city: form.city || null,
          bio: form.bio || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      onSaved(data);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50";
  const labelCls = "mb-1 block text-sm text-[#A0A0A0]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[20px] border border-[#2A2A2A] bg-[#1A1A1A] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-5 text-lg font-bold">프로필 수정</h3>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        <div className="space-y-4">
          <div>
            <label className={labelCls}>닉네임</label>
            <input
              className={inputCls}
              value={form.nickname}
              onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))}
              placeholder="닉네임"
            />
          </div>
          <div>
            <label className={labelCls}>포지션</label>
            <select
              className={inputCls}
              value={form.position}
              onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
            >
              <option value="">선택 안 함</option>
              {POSITIONS.map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>키 (cm)</label>
            <input
              type="number"
              className={inputCls}
              value={form.height}
              onChange={(e) => setForm((p) => ({ ...p, height: e.target.value }))}
              placeholder="예: 180"
              min={100}
              max={250}
            />
          </div>
          <div>
            <label className={labelCls}>지역</label>
            <input
              className={inputCls}
              value={form.city}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              placeholder="예: 서울, 부산"
            />
          </div>
          <div>
            <label className={labelCls}>소개</label>
            <textarea
              className={inputCls}
              rows={3}
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="자기소개를 입력하세요"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">취소</Button>
          <Button onClick={save} disabled={saving} className="flex-1">
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("info");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    fetch("/api/web/profile")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setProfile(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const initial = profile?.user.nickname?.charAt(0).toUpperCase() ?? "U";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[#A0A0A0]">
        <div className="text-center">
          <div className="mb-2 text-3xl">⏳</div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-[#A0A0A0]">로그인이 필요합니다.</p>
          <Link href="/login" className="rounded-full bg-[#F4A261] px-6 py-2 text-sm font-semibold text-[#0A0A0A]">
            로그인
          </Link>
        </div>
      </div>
    );
  }

  const { user, teams, recentGames, tournaments } = profile;

  return (
    <div>
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[#F4A261] text-2xl font-bold text-[#0A0A0A]">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="truncate text-xl font-bold">{user.nickname ?? "사용자"}</h1>
            <p className="truncate text-sm text-[#A0A0A0]">{user.email}</p>
            {user.position && (
              <span className="mt-1 inline-block rounded-full bg-[rgba(244,162,97,0.12)] px-2 py-0.5 text-xs text-[#F4A261]">
                {user.position}
              </span>
            )}
          </div>
          <Button
            variant="secondary"
            className="text-xs flex-shrink-0"
            onClick={() => setShowEdit(true)}
          >
            프로필 수정
          </Button>
        </div>
      </Card>

      <div className="mb-4 flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
              activeTab === tab.id
                ? "bg-[rgba(244,162,97,0.12)] font-medium text-[#F4A261]"
                : "text-[#A0A0A0] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        {activeTab === "info" && (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[#A0A0A0]">닉네임</span>
              <span>{user.nickname ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A0A0A0]">포지션</span>
              <span>{user.position ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A0A0A0]">키</span>
              <span>{user.height ? `${user.height}cm` : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A0A0A0]">지역</span>
              <span>{user.city ?? "-"}</span>
            </div>
            {user.bio && (
              <div className="mt-2 rounded-[12px] bg-[#252525] px-4 py-3 text-sm text-[#A0A0A0]">
                {user.bio}
              </div>
            )}
          </div>
        )}
        {activeTab === "games" &&
          (recentGames.length > 0 ? (
            <div className="space-y-2">
              {recentGames.map((g) => (
                <Link
                  key={g.id}
                  href={`/games/${g.id}`}
                  className="flex items-center justify-between rounded-[12px] bg-[#252525] px-4 py-2 hover:bg-[#2A2A2A]"
                >
                  <span className="text-sm">{g.title ?? "경기"}</span>
                  <span className="text-xs text-[#A0A0A0]">
                    {g.scheduled_at
                      ? new Date(g.scheduled_at).toLocaleDateString("ko-KR")
                      : "-"}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-[#A0A0A0]">참여한 경기 이력이 없습니다.</p>
          ))}
        {activeTab === "stats" && (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[#A0A0A0]">총 참가 경기</span>
              <span>{user.total_games_participated ?? 0}회</span>
            </div>
          </div>
        )}
        {activeTab === "teams" &&
          (teams.length > 0 ? (
            <div className="space-y-2">
              {teams.map((t) => (
                <Link
                  key={t.id}
                  href={`/teams/${t.id}`}
                  className="flex items-center justify-between rounded-[12px] bg-[#252525] px-4 py-2 hover:bg-[#2A2A2A]"
                >
                  <span className="text-sm font-medium">{t.name}</span>
                  <Badge>{t.role === "captain" ? "주장" : "멤버"}</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-[#A0A0A0]">소속 팀이 없습니다.</p>
          ))}
        {activeTab === "tournaments" &&
          (tournaments.length > 0 ? (
            <div className="space-y-2">
              {tournaments.map((t) => (
                <Link
                  key={t.id}
                  href={`/tournaments/${t.id}`}
                  className="flex items-center justify-between rounded-[12px] bg-[#252525] px-4 py-2 hover:bg-[#2A2A2A]"
                >
                  <span className="text-sm">{t.name}</span>
                  <span className="text-xs text-[#A0A0A0]">{t.status ?? "-"}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-[#A0A0A0]">참가한 대회가 없습니다.</p>
          ))}
      </Card>

      {showEdit && (
        <EditModal
          user={user}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            setProfile((prev) =>
              prev ? { ...prev, user: { ...prev.user, ...updated } } : prev
            );
          }}
        />
      )}
    </div>
  );
}
