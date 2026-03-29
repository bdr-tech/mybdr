"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AdminDetailModal,
  ModalInfoSection,
} from "@/components/admin/admin-detail-modal";

// 서버에서 직렬화된 코트 타입
interface SerializedCourt {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string | null;
  courtType: string;
  status: string;
  isFree: boolean | null;
  reviewsCount: number;
  createdAt: string;
}

const COURT_TYPE_LABEL: Record<string, string> = {
  indoor: "실내",
  outdoor: "실외",
};

const STATUS_LABEL: Record<string, string> = {
  active: "운영중",
  inactive: "비활성",
};

const STATUS_BADGE: Record<string, "success" | "error"> = {
  active: "success",
  inactive: "error",
};

interface Props {
  courts: SerializedCourt[];
  createCourtAction: (formData: FormData) => Promise<void>;
  updateCourtAction: (formData: FormData) => Promise<void>;
  deleteCourtAction: (formData: FormData) => Promise<void>;
}

export function AdminCourtsContent({
  courts,
  createCourtAction,
  updateCourtAction,
  deleteCourtAction,
}: Props) {
  const [selected, setSelected] = useState<SerializedCourt | null>(null);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR");

  return (
    <>
      {/* 코트 등록 폼 — 기존 유지 */}
      <Card className="mb-6 p-5">
        <h2 className="mb-4 text-sm font-bold text-[var(--color-text-primary)]">
          <span className="material-symbols-outlined mr-1 align-middle text-base">add_circle</span>
          새 코트 등록
        </h2>
        <form action={createCourtAction} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-text-muted)]">코트명 *</label>
            <input
              name="name"
              required
              placeholder="예: 서울숲 농구장"
              className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-text-muted)]">주소 *</label>
            <input
              name="address"
              required
              placeholder="예: 서울시 성동구 ..."
              className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-text-muted)]">도시 *</label>
            <input
              name="city"
              required
              placeholder="예: 서울"
              className="w-24 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-text-muted)]">구/군</label>
            <input
              name="district"
              placeholder="예: 성동구"
              className="w-24 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-text-muted)]">유형 *</label>
            <select
              name="court_type"
              defaultValue="outdoor"
              className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-accent)]"
            >
              <option value="outdoor">실외</option>
              <option value="indoor">실내</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded-[10px] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)]"
          >
            등록
          </button>
        </form>
      </Card>

      {/* 축소된 테이블: 코트명 / 도시 / 유형 (3칸) */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-5 py-4 font-medium">코트명</th>
                <th className="w-[120px] px-5 py-4 font-medium">도시</th>
                <th className="w-[80px] px-5 py-4 font-medium">유형</th>
              </tr>
            </thead>
            <tbody>
              {courts.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="cursor-pointer border-b border-[var(--color-border-subtle)] transition-colors hover:bg-[var(--color-elevated)]"
                >
                  <td className="px-5 py-3">
                    <p className="truncate font-medium text-[var(--color-text-primary)]">
                      {c.name}
                    </p>
                    <p className="truncate text-xs text-[var(--color-text-muted)]">
                      {c.address}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-[var(--color-text-muted)]">
                    {c.city}{c.district ? ` ${c.district}` : ""}
                  </td>
                  <td className="px-5 py-3 text-[var(--color-text-muted)]">
                    {COURT_TYPE_LABEL[c.courtType] ?? c.courtType}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {courts.length === 0 && (
          <div className="p-8 text-center text-[var(--color-text-muted)]">
            등록된 코트가 없습니다.
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
            <div className="flex items-center gap-2">
              {/* 유형 토글 */}
              <form action={updateCourtAction} className="flex-1">
                <input type="hidden" name="court_id" value={selected.id} />
                <input type="hidden" name="name" value={selected.name} />
                <input type="hidden" name="address" value={selected.address} />
                <input type="hidden" name="city" value={selected.city} />
                <input type="hidden" name="district" value={selected.district ?? ""} />
                <input
                  type="hidden"
                  name="court_type"
                  value={selected.courtType === "indoor" ? "outdoor" : "indoor"}
                />
                <button
                  type="submit"
                  className="w-full rounded-[10px] border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
                >
                  <span className="material-symbols-outlined mr-1 align-middle text-base">swap_horiz</span>
                  {selected.courtType === "indoor" ? "실외로 변경" : "실내로 변경"}
                </button>
              </form>
              {/* 삭제 */}
              <form action={deleteCourtAction}>
                <input type="hidden" name="court_id" value={selected.id} />
                <button
                  type="submit"
                  className="rounded-[10px] bg-[var(--color-error)]/10 px-4 py-2 text-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/20"
                >
                  <span className="material-symbols-outlined mr-1 align-middle text-base">delete</span>
                  삭제
                </button>
              </form>
            </div>
          }
        >
          <div className="space-y-4">
            <ModalInfoSection
              title="코트 정보"
              rows={[
                ["주소", selected.address],
                ["도시", `${selected.city}${selected.district ? ` ${selected.district}` : ""}`],
                ["유형", COURT_TYPE_LABEL[selected.courtType] ?? selected.courtType],
                ["상태", (
                  <Badge variant={STATUS_BADGE[selected.status] ?? "default"}>
                    {STATUS_LABEL[selected.status] ?? selected.status}
                  </Badge>
                )],
                ["무료 여부", selected.isFree === null ? "미확인" : selected.isFree ? "무료" : "유료"],
                ["리뷰수", `${selected.reviewsCount}건`],
              ]}
            />
            <ModalInfoSection
              title="기타"
              rows={[["등록일", fmtDate(selected.createdAt)]]}
            />
          </div>
        </AdminDetailModal>
      )}
    </>
  );
}
