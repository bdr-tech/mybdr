"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminStatusTabs } from "@/components/admin/admin-status-tabs";
import {
  AdminDetailModal,
  ModalInfoSection,
} from "@/components/admin/admin-detail-modal";

// 서버에서 직렬화된 팀 타입
interface SerializedTeam {
  id: string;
  name: string;
  city: string | null;
  membersCount: number;
  wins: number;
  losses: number;
  draws: number;
  status: string;
  createdAt: string;
  captainName: string | null;
  captainEmail: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  active: "활동중",
  inactive: "비활성",
};

const STATUS_BADGE: Record<string, "success" | "error"> = {
  active: "success",
  inactive: "error",
};

interface Props {
  teams: SerializedTeam[];
  updateStatusAction: (formData: FormData) => Promise<void>;
}

export function AdminTeamsContent({ teams, updateStatusAction }: Props) {
  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState<SerializedTeam | null>(null);

  const filtered =
    activeTab === "all"
      ? teams
      : teams.filter((t) => t.status === activeTab);

  const tabs = [
    { key: "all", label: "전체", count: teams.length },
    { key: "active", label: "활성", count: teams.filter((t) => t.status === "active").length },
    { key: "inactive", label: "비활성", count: teams.filter((t) => t.status === "inactive").length },
  ];

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR");

  return (
    <>
      <AdminStatusTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 축소된 테이블: 팀명 / 도시 / 상태 (3칸) */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-5 py-4 font-medium">팀명</th>
                <th className="w-[100px] px-5 py-4 font-medium">도시</th>
                <th className="w-[90px] px-5 py-4 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className="cursor-pointer border-b border-[var(--color-border-subtle)] transition-colors hover:bg-[var(--color-elevated)]"
                >
                  <td className="px-5 py-3">
                    <p className="truncate font-medium text-[var(--color-text-primary)]">
                      {t.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {t.membersCount}명
                    </p>
                  </td>
                  <td className="px-5 py-3 text-[var(--color-text-muted)]">
                    {t.city ?? "-"}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={STATUS_BADGE[t.status] ?? "default"}>
                      {STATUS_LABEL[t.status] ?? t.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-[var(--color-text-muted)]">
            해당하는 팀이 없습니다.
          </div>
        )}
      </Card>

      {/* 상세 모달 */}
      {selected && (
        <AdminDetailModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected.name}
          actions={
            // 상태 토글 버튼
            <form action={updateStatusAction} className="flex items-center gap-2">
              <input type="hidden" name="team_id" value={selected.id} />
              <input
                type="hidden"
                name="status"
                value={selected.status === "active" ? "inactive" : "active"}
              />
              <button
                type="submit"
                className="w-full rounded-[10px] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)]"
              >
                {selected.status === "active" ? "비활성화" : "활성화"}
              </button>
            </form>
          }
        >
          <div className="space-y-4">
            <ModalInfoSection
              title="팀 정보"
              rows={[
                ["팀장", selected.captainName ?? selected.captainEmail ?? "-"],
                ["도시", selected.city ?? "-"],
                ["멤버수", `${selected.membersCount}명`],
              ]}
            />
            <ModalInfoSection
              title="전적"
              rows={[
                ["승", `${selected.wins}W`],
                ["패", `${selected.losses}L`],
                ["무", `${selected.draws}D`],
              ]}
            />
            <ModalInfoSection
              title="기타"
              rows={[["생성일", fmtDate(selected.createdAt)]]}
            />
          </div>
        </AdminDetailModal>
      )}
    </>
  );
}
