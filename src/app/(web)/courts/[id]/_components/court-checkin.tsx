"use client";

/* ============================================================
 * CourtCheckin -- 체크인/체크아웃 + 혼잡도 표시 컴포넌트
 *
 * useSWR로 30초마다 현재 코트의 활성 세션 수를 갱신한다.
 * 로그인한 유저는 체크인/체크아웃 버튼을 사용할 수 있다.
 * ============================================================ */

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";

// SWR fetcher (JSON 반환)
const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface CourtCheckinProps {
  courtId: string;
}

interface CheckinData {
  active_count: number;
  my_session: {
    id: string;
    court_id: string;
    checked_in_at: string;
    elapsed_minutes: number;
    is_this_court: boolean;
  } | null;
}

export function CourtCheckin({ courtId }: CourtCheckinProps) {
  // 30초마다 자동 갱신
  const { data, mutate } = useSWR<CheckinData>(
    `/api/web/courts/${courtId}/checkin`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const [loading, setLoading] = useState(false);
  // 체크인 중일 때 경과 시간 표시를 위한 로컬 타이머
  const [elapsed, setElapsed] = useState(0);

  const mySession = data?.my_session;
  const activeCount = data?.active_count ?? 0;
  // 이 코트에 체크인 중인지 여부
  const isCheckedInHere = mySession?.is_this_court === true;
  // 다른 코트에 체크인 중인지 여부
  const isCheckedInElsewhere = mySession && !mySession.is_this_court;

  // 체크인 중이면 1분마다 경과 시간 업데이트
  useEffect(() => {
    if (!isCheckedInHere || !mySession) return;
    setElapsed(mySession.elapsed_minutes);
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 60000); // 1분마다
    return () => clearInterval(timer);
  }, [isCheckedInHere, mySession]);

  // 체크인 처리
  const handleCheckin = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/web/courts/${courtId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "manual" }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "체크인에 실패했습니다");
        return;
      }
      // SWR 데이터 갱신
      await mutate();
    } catch {
      alert("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }, [courtId, mutate]);

  // 체크아웃 처리
  const handleCheckout = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/web/courts/${courtId}/checkin`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "체크아웃에 실패했습니다");
        return;
      }
      const result = await res.json();
      const xp = result.xp_earned ?? 0;
      const mins = result.duration_minutes ?? 0;
      alert(`농구 끝! ${mins}분 동안 활동하여 ${xp}XP를 획득했습니다`);
      await mutate();
    } catch {
      alert("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }, [courtId, mutate]);

  return (
    <div
      className="rounded-2xl p-5 sm:p-6 mb-4"
      style={{
        backgroundColor: "var(--color-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* 혼잡도 표시 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-xl"
            style={{
              color: activeCount >= 5
                ? "var(--color-success)"
                : activeCount >= 1
                ? "var(--color-accent)"
                : "var(--color-text-disabled)",
            }}
          >
            {activeCount >= 5 ? "local_fire_department" : activeCount >= 1 ? "groups" : "bedtime"}
          </span>
          <span
            className="text-sm font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {activeCount >= 1
              ? `지금 ${activeCount}명 활동 중`
              : "지금 아무도 없어요"}
          </span>
        </div>

        {/* 혼잡도 레벨 뱃지 */}
        {activeCount >= 1 && (
          <span
            className="rounded-[4px] px-2 py-0.5 text-[11px] font-bold"
            style={{
              backgroundColor: activeCount >= 5
                ? "color-mix(in srgb, var(--color-success) 15%, transparent)"
                : "color-mix(in srgb, var(--color-accent) 15%, transparent)",
              color: activeCount >= 5
                ? "var(--color-success)"
                : "var(--color-accent)",
            }}
          >
            {activeCount >= 5 ? "활발" : "적당"}
          </span>
        )}
      </div>

      {/* 체크인/체크아웃 버튼 영역 */}
      {isCheckedInHere ? (
        // 체크인 중 상태: 경과 시간 + 체크아웃 버튼
        <div className="flex items-center gap-3">
          {/* 경과 시간 표시 */}
          <div
            className="flex-1 flex items-center gap-2 rounded-[4px] px-4 py-3"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ color: "var(--color-primary)", fontSize: "20px" }}
            >
              timer
            </span>
            <div>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                농구 중
              </p>
              <p className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
                {elapsed < 60 ? `${elapsed}분` : `${Math.floor(elapsed / 60)}시간 ${elapsed % 60}분`}
              </p>
            </div>
          </div>

          {/* 체크아웃 버튼 */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="shrink-0 rounded-[4px] px-5 py-3 text-sm font-bold text-white transition-all active:scale-95"
            style={{
              backgroundColor: "var(--color-text-secondary)",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "처리 중..." : "농구 끝!"}
          </button>
        </div>
      ) : isCheckedInElsewhere ? (
        // 다른 코트에 체크인 중인 경우
        <div
          className="rounded-[4px] px-4 py-3 text-sm text-center"
          style={{
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-muted)",
          }}
        >
          <span className="material-symbols-outlined text-base align-middle mr-1">
            info
          </span>
          다른 코트에 체크인 중이에요. 먼저 체크아웃 해주세요.
        </div>
      ) : (
        // 미체크인 상태: 체크인 버튼
        <button
          onClick={handleCheckin}
          disabled={loading}
          className="w-full rounded-[4px] px-5 py-3.5 text-sm font-bold text-white transition-all active:scale-95"
          style={{
            backgroundColor: "var(--color-primary)",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? (
            "처리 중..."
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                sports_basketball
              </span>
              농구 시작! 체크인
            </span>
          )}
        </button>
      )}
    </div>
  );
}
