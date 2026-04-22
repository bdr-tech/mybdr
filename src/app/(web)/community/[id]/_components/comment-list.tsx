"use client";

import { useState } from "react";
import Image from "next/image";
import { updateCommentAction, deleteCommentAction } from "@/app/actions/community";
// [2026-04-22] 카페 원문 HTML entity 디코드 — Stage A 확장 후속
import { decodeHtmlEntities } from "@/lib/utils/decode-html";

/**
 * 댓글 1개의 직렬화된 데이터 타입
 * (서버 컴포넌트에서 BigInt를 string으로 변환하여 전달)
 */
interface CommentItem {
  id: string;
  userId: string;
  content: string;
  likesCount: number;
  createdAt: string;
  isPostAuthor: boolean;
  nickname: string;
  profileImage: string | null;
  isReply?: boolean;
}

/**
 * CommentList - 댓글 목록 + 인라인 편집/삭제
 *
 * 본인 댓글에만 수정/삭제 메뉴가 표시됨.
 * 수정 클릭 시 해당 댓글이 textarea로 전환되어 인라인 편집 가능.
 */
export function CommentList({
  comments,
  postPublicId,
  currentUserId,
}: {
  comments: CommentItem[];
  postPublicId: string;
  currentUserId?: string;
}) {
  return (
    <div className="space-y-8">
      {comments.map((c) => (
        <CommentRow
          key={c.id}
          comment={c}
          postPublicId={postPublicId}
          isOwner={!!currentUserId && currentUserId === c.userId}
        />
      ))}

      {/* 댓글 없음 */}
      {comments.length === 0 && (
        <p
          className="text-center py-8 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
        </p>
      )}
    </div>
  );
}

/**
 * CommentRow - 개별 댓글 행
 *
 * 본인 댓글이면 more_horiz 클릭 시 수정/삭제 메뉴 표시.
 * 수정 모드에서는 textarea + 저장/취소 버튼으로 전환.
 */
function CommentRow({
  comment: c,
  postPublicId,
  isOwner,
}: {
  comment: CommentItem;
  postPublicId: string;
  isOwner: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(c.content);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 상대 시간 포맷 (클라이언트 측)
  function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "방금 전";
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    if (diffDay < 7) return `${diffDay}일 전`;
    return date.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
  }

  // 수정 저장
  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updateCommentAction(c.id, editContent, postPublicId);
    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }
    setEditing(false);
    setSaving(false);
    // revalidatePath가 서버에서 실행되므로 페이지가 자동 갱신됨
  }

  // 삭제
  async function handleDelete() {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    setDeleting(true);
    setError(null);
    const result = await deleteCommentAction(c.id, postPublicId);
    if (result.error) {
      setError(result.error);
      setDeleting(false);
    }
    // 성공 시 revalidatePath로 페이지 갱신 -> 삭제된 댓글 사라짐
  }

  return (
    <div className={`flex gap-4${c.isReply ? " ml-12 pl-4 border-l-2" : ""}`} style={c.isReply ? { borderColor: "var(--color-border)" } : undefined}>
      {/* 댓글 작성자 아바타 */}
      {c.profileImage ? (
        <Image
          src={c.profileImage}
          alt={c.nickname}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover shrink-0"
        />
      ) : (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {c.nickname.charAt(0)}
        </div>
      )}
      <div className="flex-1">
        {/* 작성자 정보 + 메뉴 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {decodeHtmlEntities(c.nickname)}
            </span>
            {/* 게시글 작성자 표시 */}
            {c.isPostAuthor && (
              <span
                className="text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-tighter"
                style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
              >
                작성자
              </span>
            )}
            <span
              className="text-xs ml-2"
              style={{ color: "var(--color-text-muted)" }}
            >
              {formatRelativeTime(c.createdAt)}
            </span>
          </div>

          {/* 본인 댓글일 때만 메뉴 표시 */}
          {isOwner && !editing && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{ color: "var(--color-text-muted)" }}
              >
                <span className="material-symbols-outlined text-lg">more_horiz</span>
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-28 rounded border shadow-lg z-50 py-1"
                  style={{
                    backgroundColor: "var(--color-elevated)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <button
                    onClick={() => { setEditing(true); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left transition-colors hover:bg-white/5"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    수정
                  </button>
                  <button
                    onClick={() => { handleDelete(); setMenuOpen(false); }}
                    disabled={deleting}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left transition-colors hover:bg-white/5 disabled:opacity-50"
                    style={{ color: "var(--color-primary)" }}
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    {deleting ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-xs mb-2" style={{ color: "var(--color-primary)" }}>
            {error}
          </p>
        )}

        {/* 수정 모드: textarea + 저장/취소 */}
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full rounded border p-3 text-sm resize-none bg-transparent outline-none focus:border-[var(--color-primary)]"
              style={{
                color: "var(--color-text-primary)",
                borderColor: "var(--color-border)",
              }}
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setEditing(false); setEditContent(c.content); setError(null); }}
                className="px-3 py-1 text-xs rounded border"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editContent.trim()}
                className="px-3 py-1 text-xs rounded font-bold text-white disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 댓글 내용 */}
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {decodeHtmlEntities(c.content)}
            </p>

            {/* 좋아요 + 답글 */}
            <div className="flex items-center gap-4 mt-3">
              <button
                className="flex items-center gap-1 text-xs transition-colors"
                style={{ color: "var(--color-text-muted)" }}
              >
                <span className="material-symbols-outlined text-sm">thumb_up</span>
                {c.likesCount > 0 ? c.likesCount : ""}
              </button>
              <button
                className="text-xs font-medium"
                style={{ color: "var(--color-text-muted)" }}
              >
                답글 쓰기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
