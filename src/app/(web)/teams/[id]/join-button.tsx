"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/contexts/toast-context";

/* ============================================================
 * TeamJoinButton — 팀 상세 히어로 우측 버튼 그룹 + 신청 상태 안내
 *
 * 이유 (W4 M7):
 *   기존에는 "입단 신청" 버튼을 누른 직후 2초 메시지만 표시하고,
 *   페이지 재진입 시 본인의 신청 상태(대기/승인/거부)를 알 수 없었다.
 *   GET /api/web/teams/[id]/my-application 을 마운트 시 조회해
 *   상태별로 분기 렌더링한다.
 *
 * 상태 매트릭스:
 *   - none (신청/멤버 아님)    → "입단 신청" 버튼 활성
 *   - pending (대기)           → 비활성 "신청 중(대기)" + 신청 취소 + 안내 문구
 *   - approved / isMember=true → 버튼 숨김. 최초 진입 시 환영 토스트 1회 (localStorage)
 *   - rejected                 → 거부 문구(+사유) + "다시 신청" + "다른 팀 둘러보기" 링크
 *
 * 기존 공유/매치 제안 버튼은 그대로 유지.
 *
 * ⚠️ apiSuccess 래핑 없음 / snake_case 자동 변환 — errors.md 6회차 가드:
 *   응답 키는 is_member / application.rejection_reason / application.created_at 등 snake_case로 접근.
 * ============================================================ */

// 서버 응답 타입 (apiSuccess → snake_case 변환 후)
type MyApplicationResponse = {
  is_member: boolean;
  application: {
    id: string;
    status: string; // "pending" | "approved" | "rejected" | 기타
    message: string | null;
    rejection_reason: string | null;
    preferred_position: string | null;
    preferred_jersey_number: number | null;
    created_at: string;
    processed_at: string | null;
  } | null;
};

// 상태 분기용 타입 — UI 렌더링 3갈래
type UiStatus = "none" | "pending" | "approved" | "rejected";

// 응답 → UI 상태 축약
// isMember는 rejected 이력이 있어도 결국 승인된 멤버임을 의미하므로 approved로 동일 처리
function resolveUiStatus(res: MyApplicationResponse | null): UiStatus {
  if (!res) return "none";
  if (res.is_member) return "approved";
  const s = res.application?.status;
  if (s === "pending") return "pending";
  if (s === "approved") return "approved";
  if (s === "rejected") return "rejected";
  return "none";
}

export function TeamJoinButton({ teamId }: { teamId: string }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MyApplicationResponse | null>(null);
  // fetching: 최초 마운트 상태 조회가 끝나기 전에는 CTA 노출 지연(깜빡임 방지)
  const [fetching, setFetching] = useState(true);

  /* 상태 조회 — 마운트 시 + 신청/취소 성공 후 재호출 */
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/teams/${teamId}/my-application`, {
        credentials: "include",
      });
      if (!res.ok) {
        // 401(비로그인) 포함 모든 실패 → "none"으로 취급해 기본 신청 버튼 노출
        setData(null);
        return;
      }
      // ⚠️ apiSuccess는 data 래핑 없음 — json 자체가 응답
      const json = (await res.json()) as MyApplicationResponse;
      setData(json);
    } catch {
      setData(null);
    } finally {
      setFetching(false);
    }
  }, [teamId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /* 승인 직후 1회 환영 토스트 — localStorage로 중복 방지 */
  useEffect(() => {
    if (!data?.is_member) return;
    const key = `welcomed_team_${teamId}`;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    showToast("팀에 가입되었어요! 환영합니다 🎉", "success");
  }, [data?.is_member, teamId, showToast]);

  /* 입단 신청 (신규 + 재신청 공용) */
  async function handleJoin() {
    setLoading(true);
    try {
      const res = await fetch(`/api/web/teams/${teamId}/join`, { method: "POST" });
      const body = (await res.json()) as { message?: string; error?: string };
      if (res.ok) {
        showToast(body.message ?? "신청 완료!", "success");
        await refresh();
      } else {
        showToast(body.error ?? "오류가 발생했습니다.", "error");
      }
    } catch {
      showToast("네트워크 오류가 발생했습니다.", "error");
    } finally {
      setLoading(false);
    }
  }

  /* 신청 취소 (pending 상태에서만) */
  async function handleCancel() {
    if (!confirm("가입 신청을 취소할까요?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/web/teams/${teamId}/my-application`, {
        method: "DELETE",
      });
      const body = (await res.json()) as { message?: string; error?: string };
      if (res.ok) {
        showToast(body.message ?? "신청이 취소되었습니다.", "success");
        await refresh();
      } else {
        showToast(body.error ?? "취소 중 오류가 발생했습니다.", "error");
      }
    } catch {
      showToast("네트워크 오류가 발생했습니다.", "error");
    } finally {
      setLoading(false);
    }
  }

  /* 공유 — 기존 동작 유지 (Web Share API → fallback 클립보드) */
  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: "BDR 팀 페이지", url }).catch(() => {});
    } else {
      navigator.clipboard
        .writeText(url)
        .then(() => showToast("링크가 복사되었습니다!", "success"))
        .catch(() => {});
    }
  }

  const uiStatus = resolveUiStatus(data);

  return (
    <div className="flex flex-col items-end gap-2">
      {/* 상태 안내 텍스트 — 버튼 위 한 줄. pending/rejected일 때만 노출 */}
      {!fetching && uiStatus === "pending" && (
        <p
          className="text-xs font-medium"
          style={{ color: "var(--color-text-on-primary-hero, #fff)", opacity: 0.9 }}
        >
          팀장의 승인을 기다리고 있어요.
        </p>
      )}
      {!fetching && uiStatus === "rejected" && (
        <div
          className="flex flex-col items-end gap-0.5 text-xs font-medium"
          style={{ color: "var(--color-error)" }}
        >
          <span>신청이 거절되었어요.</span>
          {/* 거부 사유가 있을 때만 노출 — 프라이버시 고려한 조건부 */}
          {data?.application?.rejection_reason && (
            <span style={{ color: "var(--color-text-muted)" }}>
              사유: {data.application.rejection_reason}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* 공유 아이콘 버튼 — 항상 노출 */}
        <button
          type="button"
          onClick={handleShare}
          className="flex h-10 w-10 items-center justify-center rounded border border-white/30 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          title="공유하기"
        >
          <span className="material-symbols-outlined text-xl">share</span>
        </button>

        {/* 매치 제안 버튼 — 항상 노출 (기존 동작) */}
        <button
          type="button"
          className="rounded border border-[var(--color-primary)] px-3 sm:px-6 py-2 sm:py-2.5 text-sm font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10 whitespace-nowrap"
        >
          매치 제안
        </button>

        {/* 상태별 주 CTA — fetching 동안에는 자리 차지용 placeholder로 깜빡임 방지 */}
        {fetching ? (
          <div className="h-10 w-[120px]" aria-hidden />
        ) : uiStatus === "none" ? (
          // 기본 신청 버튼
          <button
            type="button"
            onClick={handleJoin}
            disabled={loading}
            className="flex items-center gap-2 rounded bg-[var(--color-primary)] px-3 sm:px-6 py-2 sm:py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-[var(--color-primary-hover)] disabled:opacity-50 whitespace-nowrap"
            style={{ boxShadow: "0 4px 14px var(--color-primary-light)" }}
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            {loading ? "신청 중..." : "입단 신청"}
          </button>
        ) : uiStatus === "pending" ? (
          // 신청 중 — 비활성 버튼 + 작은 "신청 취소" 텍스트 버튼
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="flex items-center gap-2 rounded px-3 sm:px-6 py-2 sm:py-2.5 text-sm font-bold whitespace-nowrap cursor-not-allowed"
              style={{
                backgroundColor: "var(--color-surface-bright)",
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
              }}
            >
              <span className="material-symbols-outlined text-lg">hourglass_empty</span>
              신청 중 (대기)
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="text-xs font-semibold underline-offset-2 hover:underline disabled:opacity-50"
              style={{ color: "var(--color-text-muted)" }}
            >
              신청 취소
            </button>
          </div>
        ) : uiStatus === "rejected" ? (
          // 거부됨 — "다시 신청" 기본 버튼 + "다른 팀 둘러보기" 보조 링크
          <div className="flex items-center gap-2">
            <Link
              href="/teams"
              className="text-xs font-semibold underline-offset-2 hover:underline whitespace-nowrap"
              style={{ color: "var(--color-text-muted)" }}
            >
              다른 팀 둘러보기
            </Link>
            <button
              type="button"
              onClick={handleJoin}
              disabled={loading}
              className="flex items-center gap-2 rounded bg-[var(--color-primary)] px-3 sm:px-6 py-2 sm:py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-[var(--color-primary-hover)] disabled:opacity-50 whitespace-nowrap"
              style={{ boxShadow: "0 4px 14px var(--color-primary-light)" }}
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              {loading ? "신청 중..." : "다시 신청"}
            </button>
          </div>
        ) : null /* approved/isMember: 버튼 영역 숨김 (환영 토스트는 useEffect에서 처리) */}
      </div>
    </div>
  );
}
