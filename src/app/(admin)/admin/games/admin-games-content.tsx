"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminStatusTabs } from "@/components/admin/admin-status-tabs";
import {
  AdminDetailModal,
  ModalInfoSection,
} from "@/components/admin/admin-detail-modal";

// 서버에서 직렬화된 경기 타입
interface SerializedGame {
  id: string;
  title: string | null;
  gameType: number;
  venueName: string | null;
  city: string | null;
  scheduledAt: string;
  currentParticipants: number | null;
  maxParticipants: number | null;
  status: number;
  createdAt: string;
  hostName: string | null;
  hostEmail: string;
}

// 상태 라벨/뱃지 매핑
const STATUS_LABEL: Record<number, string> = {
  1: "모집중",
  2: "확정",
  3: "완료",
  4: "취소",
};

const STATUS_BADGE: Record<number, "success" | "info" | "secondary" | "error"> = {
  1: "success",
  2: "info",
  3: "secondary",
  4: "error",
};

// 유형 라벨 (game_type은 숫자: 0=픽업, 1=게스트, 2=연습)
const TYPE_LABEL: Record<number, string> = {
  0: "픽업",
  1: "게스트",
  2: "연습",
};

// 상태 전환 규칙
const TRANSITIONS: Record<number, number[]> = {
  1: [2, 4],
  2: [3, 4],
  3: [],
  4: [],
};

interface Props {
  games: SerializedGame[];
  updateStatusAction: (formData: FormData) => Promise<void>;
}

export function AdminGamesContent({ games, updateStatusAction }: Props) {
  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState<SerializedGame | null>(null);

  // 탭별 필터링
  const filtered =
    activeTab === "all"
      ? games
      : games.filter((g) => g.status === Number(activeTab));

  const tabs = [
    { key: "all", label: "전체", count: games.length },
    { key: "1", label: "모집중", count: games.filter((g) => g.status === 1).length },
    { key: "2", label: "확정", count: games.filter((g) => g.status === 2).length },
    { key: "3", label: "완료", count: games.filter((g) => g.status === 3).length },
    { key: "4", label: "취소", count: games.filter((g) => g.status === 4).length },
  ];

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("ko-KR") : "-";

  return (
    <>
      <AdminStatusTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 축소된 테이블: 제목 / 유형 / 상태 / 날짜 (4칸) */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-5 py-4 font-medium">제목</th>
                <th className="w-[90px] px-5 py-4 font-medium">유형</th>
                <th className="w-[90px] px-5 py-4 font-medium">상태</th>
                <th className="w-[100px] px-5 py-4 font-medium">날짜</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr
                  key={g.id}
                  onClick={() => setSelected(g)}
                  className="cursor-pointer border-b border-[var(--color-border-subtle)] transition-colors hover:bg-[var(--color-elevated)]"
                >
                  <td className="px-5 py-3">
                    <p className="truncate font-medium text-[var(--color-text-primary)]">
                      {g.title ?? "(제목 없음)"}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {g.hostName ?? g.hostEmail ?? "-"}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-[var(--color-text-muted)]">
                    {TYPE_LABEL[g.gameType] ?? g.gameType}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={STATUS_BADGE[g.status] ?? "default"}>
                      {STATUS_LABEL[g.status] ?? "알 수 없음"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-[var(--color-text-muted)]">
                    {fmtDate(g.scheduledAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-[var(--color-text-muted)]">
            해당하는 경기가 없습니다.
          </div>
        )}
      </Card>

      {/* 상세 모달 */}
      {selected && (
        <AdminDetailModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected.title ?? "(제목 없음)"}
          actions={
            (TRANSITIONS[selected.status] ?? []).length > 0 ? (
              <form action={updateStatusAction} className="flex items-center gap-2">
                <input type="hidden" name="game_id" value={selected.id} />
                <select
                  name="status"
                  defaultValue=""
                  className="flex-1 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-accent)]"
                >
                  <option value="" disabled>상태 변경</option>
                  {(TRANSITIONS[selected.status] ?? []).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s] ?? String(s)}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-[10px] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-on-accent)] hover:bg-[var(--color-accent-hover)]"
                >
                  적용
                </button>
              </form>
            ) : undefined
          }
        >
          <div className="space-y-4">
            <ModalInfoSection
              title="경기 정보"
              rows={[
                ["주최자", selected.hostName ?? selected.hostEmail ?? "-"],
                ["유형", TYPE_LABEL[selected.gameType] ?? selected.gameType],
                ["장소", selected.venueName ?? selected.city ?? "-"],
                ["참가자", `${selected.currentParticipants ?? 0} / ${selected.maxParticipants ?? "-"}`],
              ]}
            />
            <ModalInfoSection
              title="일정"
              rows={[
                ["예정일", fmtDate(selected.scheduledAt)],
                ["생성일", fmtDate(selected.createdAt)],
              ]}
            />
          </div>
        </AdminDetailModal>
      )}
    </>
  );
}
