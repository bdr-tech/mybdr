"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminStatusTabs } from "@/components/admin/admin-status-tabs";
import {
  AdminDetailModal,
  ModalInfoSection,
} from "@/components/admin/admin-detail-modal";

// 서버에서 직렬화된 게시글 타입
interface SerializedPost {
  id: string;
  publicId: string | null;
  title: string;
  category: string | null;
  viewCount: number;
  commentsCount: number;
  likesCount: number;
  status: string | null;
  createdAt: string;
  authorName: string | null;
  authorEmail: string | null;
}

// 카테고리 한글 매핑
const CATEGORY_LABEL: Record<string, string> = {
  general: "자유게시판",
  recruit: "팀원모집",
  review: "대회후기",
  info: "정보공유",
  qna: "질문답변",
  notice: "공지사항",
  marketplace: "농구장터",
};

interface Props {
  posts: SerializedPost[];
  hidePostAction: (formData: FormData) => Promise<void>;
  unhidePostAction: (formData: FormData) => Promise<void>;
  deletePostAction: (formData: FormData) => Promise<void>;
}

export function AdminCommunityContent({
  posts,
  hidePostAction,
  unhidePostAction,
  deletePostAction,
}: Props) {
  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState<SerializedPost | null>(null);

  // 탭: 전체 + 카테고리별
  const filtered =
    activeTab === "all"
      ? posts
      : posts.filter((p) => p.category === activeTab);

  // 동적 탭 생성 — 존재하는 카테고리만 탭으로 표시
  const categoryKeys = [...new Set(posts.map((p) => p.category).filter(Boolean))] as string[];
  const tabs = [
    { key: "all", label: "전체", count: posts.length },
    ...categoryKeys.map((key) => ({
      key,
      label: CATEGORY_LABEL[key] ?? key,
      count: posts.filter((p) => p.category === key).length,
    })),
  ];

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR");

  return (
    <>
      <AdminStatusTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 축소된 테이블: 제목 / 카테고리 / 작성자 / 날짜 (4칸) */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-5 py-4 font-medium">제목</th>
                <th className="w-[100px] px-5 py-4 font-medium">카테고리</th>
                <th className="w-[100px] px-5 py-4 font-medium">작성자</th>
                <th className="w-[90px] px-5 py-4 font-medium">날짜</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isHidden = p.status === "hidden";
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={`cursor-pointer border-b border-[var(--color-border-subtle)] transition-colors ${
                      isHidden
                        ? "opacity-60"
                        : "hover:bg-[var(--color-elevated)]"
                    }`}
                  >
                    <td className="px-5 py-3">
                      <p className="truncate font-medium text-[var(--color-text-primary)]">
                        {isHidden && (
                          <span className="mr-1.5 text-xs text-[var(--color-error)]">[숨김]</span>
                        )}
                        {p.title}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="default">
                        {CATEGORY_LABEL[p.category ?? ""] ?? p.category ?? "기타"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 truncate text-[var(--color-text-muted)]">
                      {p.authorName ?? p.authorEmail ?? "-"}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-text-muted)]">
                      {fmtDate(p.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-[var(--color-text-muted)]">
            게시글이 없습니다.
          </div>
        )}
      </Card>

      {/* 상세 모달 */}
      {selected && (
        <AdminDetailModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected.title}
          actions={
            <div className="flex items-center gap-2">
              {/* 숨김/복원 토글 */}
              <form action={selected.status === "hidden" ? unhidePostAction : hidePostAction}>
                <input type="hidden" name="post_id" value={selected.id} />
                <button
                  type="submit"
                  className={`inline-flex items-center gap-1 rounded-[8px] px-3 py-2 text-sm font-medium transition-colors ${
                    selected.status === "hidden"
                      ? "bg-[var(--color-success)]/10 text-[var(--color-success)] hover:bg-[var(--color-success)]/20"
                      : "bg-[var(--color-warning)]/10 text-[var(--color-warning)] hover:bg-[var(--color-warning)]/20"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {selected.status === "hidden" ? "visibility" : "visibility_off"}
                  </span>
                  {selected.status === "hidden" ? "복원" : "숨김"}
                </button>
              </form>
              {/* 삭제 */}
              <form action={deletePostAction}>
                <input type="hidden" name="post_id" value={selected.id} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-[8px] bg-[var(--color-error)]/10 px-3 py-2 text-sm font-medium text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/20"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                  삭제
                </button>
              </form>
            </div>
          }
        >
          <div className="space-y-4">
            <ModalInfoSection
              title="게시글 정보"
              rows={[
                ["카테고리", CATEGORY_LABEL[selected.category ?? ""] ?? selected.category ?? "기타"],
                ["작성자", selected.authorName ?? selected.authorEmail ?? "-"],
                ["상태", selected.status === "hidden" ? "숨김" : "게시중"],
              ]}
            />
            <ModalInfoSection
              title="통계"
              rows={[
                ["조회수", String(selected.viewCount)],
                ["댓글수", String(selected.commentsCount)],
                ["좋아요", String(selected.likesCount)],
              ]}
            />
            <ModalInfoSection
              title="일시"
              rows={[["작성일", fmtDate(selected.createdAt)]]}
            />
          </div>
        </AdminDetailModal>
      )}
    </>
  );
}
