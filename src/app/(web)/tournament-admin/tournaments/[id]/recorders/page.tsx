"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Recorder = {
  id: string;
  recorderId: string;
  isActive: boolean;
  createdAt: string;
  recorder: {
    id: string;
    nickname: string | null;
    email: string;
    profile_image_url: string | null;
  };
};

export default function TournamentRecordersPage() {
  const { id } = useParams<{ id: string }>();
  const [recorders, setRecorders] = useState<Recorder[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/recorders`);
      if (res.ok) setRecorders(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const addRecorder = async () => {
    if (!email.trim()) return;
    setAdding(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/recorders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "추가 실패");
      setEmail("");
      setSuccess(`${data.recorder?.nickname ?? email} 님을 기록원으로 추가했습니다.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setAdding(false);
    }
  };

  const removeRecorder = async (recorderId: string, name: string) => {
    if (!confirm(`${name} 님의 기록원 권한을 제거하시겠습니까?`)) return;
    try {
      await fetch(`/api/web/tournaments/${id}/recorders`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recorderId }),
      });
      await load();
    } catch { /* ignore */ }
  };

  const activeRecorders = recorders.filter((r) => r.isActive);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link
          href={`/tournament-admin/tournaments/${id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← 대회 관리
        </Link>
        <h1 className="text-xl font-bold">기록원 관리</h1>
      </div>

      {/* 기록원 추가 */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-gray-800">기록원 추가</h2>
        <p className="text-sm text-gray-500">
          mybdr 가입 회원의 이메일로 기록원을 지정합니다. 기록원은 bdr_stat 앱으로 경기를 실시간 기록할 수 있습니다.
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addRecorder()}
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={addRecorder} disabled={adding || !email.trim()}>
            {adding ? "추가 중..." : "추가"}
          </Button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
      </Card>

      {/* 기록원 목록 */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-gray-800">
          현재 기록원 {activeRecorders.length > 0 && `(${activeRecorders.length}명)`}
        </h2>

        {loading ? (
          <p className="text-sm text-gray-400">불러오는 중...</p>
        ) : activeRecorders.length === 0 ? (
          <p className="text-sm text-gray-400">등록된 기록원이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {activeRecorders.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {r.recorder.profile_image_url ? (
                    <Image
                      src={r.recorder.profile_image_url}
                      alt=""
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                      unoptimized /* 외부 프로필 이미지 URL — 도메인이 다양 */
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                      {(r.recorder.nickname ?? r.recorder.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {r.recorder.nickname ?? r.recorder.email}
                    </p>
                    <p className="text-xs text-gray-400">{r.recorder.email}</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    removeRecorder(
                      r.recorderId,
                      r.recorder.nickname ?? r.recorder.email
                    )
                  }
                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                >
                  제거
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
