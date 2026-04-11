"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminStatusTabs } from "@/components/admin/admin-status-tabs";
import {
  AdminDetailModal,
  ModalInfoSection,
} from "@/components/admin/admin-detail-modal";

// 서버에서 직렬화된 건의사항 타입
interface SerializedSuggestion {
  id: string;
  title: string;
  content: string | null;
  status: string;
  createdAt: string;
  authorName: string | null;
  authorEmail: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  open: "접수됨",
  in_progress: "처리중",
  resolved: "완료",
};

const STATUS_BADGE: Record<string, "default" | "success" | "warning"> = {
  pending: "default",
  open: "warning",
  in_progress: "warning",
  resolved: "success",
};

// 상태 전환 규칙
const TRANSITIONS: Record<string, string[]> = {
  pending: ["open", "in_progress", "resolved"],
  open: ["in_progress", "resolved"],
  in_progress: ["resolved"],
  resolved: [],
};

interface Props {
  suggestions: SerializedSuggestion[];
  updateStatusAction: (formData: FormData) => Promise<void>;
}

export function AdminSuggestionsContent({
  suggestions,
  updateStatusAction,
}: Props) {
  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState<SerializedSuggestion | null>(null);

  const filtered =
    activeTab === "all"
      ? suggestions
      : suggestions.filter((s) => s.status === activeTab);

  const tabs = [
    { key: "all", label: "전체", count: suggestions.length },
    { key: "pending", label: "대기", count: suggestions.filter((s) => s.status === "pending").length },
    { key: "open", label: "접수됨", count: suggestions.filter((s) => s.status === "open").length },
    { key: "in_progress", label: "처리중", count: suggestions.filter((s) => s.status === "in_progress").length },
    { key: "resolved", label: "완료", count: suggestions.filter((s) => s.status === "resolved").length },
  ];

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR");

  return (
    <>
      <AdminStatusTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 축소된 테이블: 제목 / 작성자 / 상태 / 날짜 (4칸) */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-5 py-4 font-medium">제목</th>
                <th className="w-[100px] px-5 py-4 font-medium">작성자</th>
                <th className="w-[90px] px-5 py-4 font-medium">상태</th>
                <th className="w-[90px] px-5 py-4 font-medium">날짜</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className="cursor-pointer border-b border-[var(--color-border-subtle)] transition-colors hover:bg-[var(--color-elevated)]"
                >
                  <td className="px-5 py-3">
                    <p className="truncate font-medium text-[var(--color-text-primary)]">
                      {s.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                      {s.content}
                    </p>
                  </td>
                  <td className="px-5 py-3 truncate text-[var(--color-text-muted)]">
                    {s.authorName ?? s.authorEmail ?? "-"}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={STATUS_BADGE[s.status] ?? "default"}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-[var(--color-text-muted)]">
                    {fmtDate(s.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-[var(--color-text-muted)]">
            건의사항이 없습니다.
          </div>
        )}
      </Card>

      {/* 상세 모달 — 내용 전체 + 상태변경 */}
      {selected && (
        <AdminDetailModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected.title}
          actions={
            (TRANSITIONS[selected.status] ?? []).length > 0 ? (
              <form action={updateStatusAction} className="flex items-center gap-2">
                <input type="hidden" name="suggestion_id" value={selected.id} />
                <select
                  name="status"
                  defaultValue=""
                  className="flex-1 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-accent)]"
                >
                  <option value="" disabled>상태 변경</option>
                  {(TRANSITIONS[selected.status] ?? []).map((st) => (
                    <option key={st} value={st}>
                      {STATUS_LABEL[st] ?? st}
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
              title="정보"
              rows={[
                ["작성자", selected.authorName ?? selected.authorEmail ?? "-"],
                ["상태", STATUS_LABEL[selected.status] ?? selected.status],
                ["작성일", fmtDate(selected.createdAt)],
              ]}
            />
            {/* 내용 전체 표시 */}
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                내용
              </p>
              <div className="rounded-[12px] border border-[var(--color-border)] p-4 text-sm leading-relaxed text-[var(--color-text-primary)]">
                {selected.content || (
                  <span className="text-[var(--color-text-muted)]">내용 없음</span>
                )}
              </div>
            </div>
          </div>
        </AdminDetailModal>
      )}
    </>
  );
}
