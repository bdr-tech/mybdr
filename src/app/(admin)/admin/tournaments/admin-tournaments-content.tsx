"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminStatusTabs } from "@/components/admin/admin-status-tabs";
import {
  AdminDetailModal,
  ModalInfoSection,
} from "@/components/admin/admin-detail-modal";

// 서버에서 직렬화된 토너먼트 타입
interface SerializedTournament {
  id: string;
  name: string;
  format: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  teamCount: number;
  matchCount: number;
  organizerName: string | null;
  organizerEmail: string | null;
}

// 상태 4종 통일: draft(준비중) / registration(접수중) / in_progress(진행중) / completed(종료)
const STATUS_LABEL: Record<string, string> = {
  draft: "준비중",
  upcoming: "준비중",
  registration: "접수중",
  registration_open: "접수중",
  active: "접수중",
  published: "접수중",
  open: "접수중",
  opening_soon: "접수중",
  registration_closed: "접수중",
  in_progress: "진행중",
  live: "진행중",
  ongoing: "진행중",
  group_stage: "진행중",
  completed: "종료",
  ended: "종료",
  closed: "종료",
  cancelled: "종료",
};

const STATUS_BADGE: Record<string, "default" | "success" | "info" | "warning" | "secondary"> = {
  draft: "default",
  registration: "info",
  in_progress: "success",
  completed: "secondary",
};

const FORMAT_LABEL: Record<string, string> = {
  single_elimination: "토너먼트",
  double_elimination: "더블 엘리미네이션",
  round_robin: "리그전",
  group_stage: "조별리그",
  group_stage_knockout: "조별리그+토너먼트",
  GROUP_STAGE_KNOCKOUT: "조별리그+토너먼트",
  dual_tournament: "듀얼토너먼트",
  full_league_knockout: "풀리그+토너먼트",
  swiss: "스위스 라운드",
};

// 상태 전환 규칙 — 4종 기준: 준비중→접수중→진행중→종료
const TRANSITIONS: Record<string, string[]> = {
  draft: ["registration"],
  registration: ["in_progress"],
  in_progress: ["completed"],
  completed: [],
  // 레거시 상태도 전환 지원
  upcoming: ["registration"],
  registration_open: ["in_progress"],
  active: ["in_progress"],
  published: ["registration"],
  open: ["in_progress"],
  ongoing: ["completed"],
  live: ["completed"],
  cancelled: ["draft"],
};

interface Props {
  tournaments: SerializedTournament[];
  updateStatusAction: (formData: FormData) => Promise<void>;
}

export function AdminTournamentsContent({
  tournaments,
  updateStatusAction,
}: Props) {
  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState<SerializedTournament | null>(null);

  // DB의 다양한 status 값을 4종 탭 키로 매핑
  const toTabKey = (status: string): string => {
    const map: Record<string, string> = {
      draft: "draft", upcoming: "draft",
      registration: "registration", registration_open: "registration", active: "registration",
      published: "registration", open: "registration", opening_soon: "registration", registration_closed: "registration",
      in_progress: "in_progress", live: "in_progress", ongoing: "in_progress", group_stage: "in_progress",
      completed: "completed", ended: "completed", closed: "completed", cancelled: "completed",
    };
    return map[status] ?? "draft";
  };

  // 탭별 필터링 — 4종 매핑 기준
  const filtered =
    activeTab === "all"
      ? tournaments
      : tournaments.filter((t) => toTabKey(t.status ?? "draft") === activeTab);

  // 탭 목록 + 각 상태별 개수 계산
  const tabs = [
    { key: "all", label: "전체", count: tournaments.length },
    { key: "draft", label: "준비중", count: tournaments.filter((t) => toTabKey(t.status ?? "draft") === "draft").length },
    { key: "registration", label: "접수중", count: tournaments.filter((t) => toTabKey(t.status ?? "draft") === "registration").length },
    { key: "in_progress", label: "진행중", count: tournaments.filter((t) => toTabKey(t.status ?? "draft") === "in_progress").length },
    { key: "completed", label: "종료", count: tournaments.filter((t) => toTabKey(t.status ?? "draft") === "completed").length },
  ];

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("ko-KR") : "-";

  return (
    <>
      {/* 상태별 탭 */}
      <AdminStatusTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 축소된 테이블: 대회명 / 상태 / 날짜 (3칸) */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-5 py-4 font-medium">대회명</th>
                <th className="w-[100px] px-5 py-4 font-medium">상태</th>
                <th className="w-[100px] px-5 py-4 font-medium">날짜</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const status = t.status ?? "draft";
                // 레거시 status도 4종 기준 뱃지로 표시
                const tabKey = toTabKey(status);
                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="cursor-pointer border-b border-[var(--color-border-subtle)] transition-colors hover:bg-[var(--color-elevated)]"
                  >
                    {/* 대회명 + 주최자 미리보기 */}
                    <td className="px-5 py-3">
                      <p className="truncate font-medium text-[var(--color-text-primary)]">
                        {t.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {t.organizerName ?? t.organizerEmail ?? "-"}
                      </p>
                    </td>
                    {/* 상태 뱃지 — 4종 기준 */}
                    <td className="px-5 py-3">
                      <Badge variant={STATUS_BADGE[tabKey] ?? "default"}>
                        {STATUS_LABEL[status] ?? status}
                      </Badge>
                    </td>
                    {/* 생성일 */}
                    <td className="px-5 py-3 text-[var(--color-text-muted)]">
                      {fmtDate(t.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-[var(--color-text-muted)]">
            해당하는 토너먼트가 없습니다.
          </div>
        )}
      </Card>

      {/* 상세 모달 — 행 클릭 시 표시 */}
      {selected && (
        <AdminDetailModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected.name}
          actions={
            // 상태 변경 폼 (전환 가능한 상태가 있을 때만)
            (TRANSITIONS[selected.status ?? "draft"] ?? []).length > 0 ? (
              <form action={updateStatusAction} className="flex items-center gap-2">
                <input type="hidden" name="tournament_id" value={selected.id} />
                <select
                  name="status"
                  defaultValue=""
                  className="flex-1 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-accent)]"
                >
                  <option value="" disabled>상태 변경</option>
                  {(TRANSITIONS[selected.status ?? "draft"] ?? []).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s] ?? s}
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
              title="대회 정보"
              rows={[
                ["주최자", selected.organizerName ?? selected.organizerEmail ?? "-"],
                ["형식", FORMAT_LABEL[selected.format ?? ""] ?? selected.format ?? "-"],
                ["참가팀", `${selected.teamCount}팀`],
                ["경기수", `${selected.matchCount}경기`],
              ]}
            />
            <ModalInfoSection
              title="일정"
              rows={[
                ["시작일", fmtDate(selected.startDate)],
                ["종료일", fmtDate(selected.endDate)],
                ["생성일", fmtDate(selected.createdAt)],
              ]}
            />
          </div>
        </AdminDetailModal>
      )}
    </>
  );
}
