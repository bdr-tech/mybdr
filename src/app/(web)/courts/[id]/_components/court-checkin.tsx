"use client";

/* ============================================================
 * CourtCheckin -- 체크인/체크아웃 + 혼잡도 + GPS 거리 검증
 *
 * useSWR로 30초마다 현재 코트의 활성 세션 수를 갱신한다.
 * 마운트 시 사용자 위치를 확인하여 100m 이내인지 검증한다.
 * ============================================================ */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { SessionCompleteCard } from "./session-complete-card";

// SWR fetcher (JSON 반환)
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// 두 좌표 사이 거리 계산 (미터 단위, Haversine 공식)
function haversineDistanceM(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface CourtCheckinProps {
  courtId: string;
  courtLat: number; // 코트 위도
  courtLng: number; // 코트 경도
}

interface CheckinData {
  active_count: number;
  my_session: {
    id: string;
    court_id: string;
    checked_in_at: string;
    elapsed_minutes: number;
    is_this_court: boolean;
    court_name: string | null; // 다른 코트 체크인 시 해당 코트 이름
  } | null;
}

export function CourtCheckin({ courtId, courtLat, courtLng }: CourtCheckinProps) {
  const router = useRouter();

  // 30초마다 자동 갱신
  const { data, mutate } = useSWR<CheckinData>(
    `/api/web/courts/${courtId}/checkin`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const [loading, setLoading] = useState(false);
  // 체크인 중일 때 경과 시간 표시를 위한 로컬 타이머
  const [elapsed, setElapsed] = useState(0);

  // 위치 관련 상태
  // null = 로딩 중, true = 위치 허용, false = 거부/미지원
  const [locationEnabled, setLocationEnabled] = useState<boolean | null>(null);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [distanceToCourtM, setDistanceToCourtM] = useState<number | null>(null);

  // 다른 코트 체크인 정보 (409 응답에서 받음)
  const [checkedInCourtId, setCheckedInCourtId] = useState<string | null>(null);
  const [checkedInCourtName, setCheckedInCourtName] = useState<string | null>(null);

  // 세션 완료 카드 표시 데이터 (체크아웃 성공 시 설정)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sessionResult, setSessionResult] = useState<any>(null);

  const mySession = data?.my_session;
  const activeCount = data?.active_count ?? 0;
  const isCheckedInHere = mySession?.is_this_court === true;

  // SWR GET 응답에서 다른 코트 체크인 정보 반영
  // (페이지 진입 시 POST 없이도 버튼이 보이도록)
  useEffect(() => {
    if (mySession && !mySession.is_this_court) {
      setCheckedInCourtId(mySession.court_id);
      setCheckedInCourtName(mySession.court_name ?? "다른 코트");
    } else if (!mySession) {
      // 체크인 세션이 없으면 초기화 (체크아웃 후 갱신 시)
      setCheckedInCourtId(null);
      setCheckedInCourtName(null);
    }
  }, [mySession]);

  // 마운트 시 사용자 위치 확인
  useEffect(() => {
    // 코트 위경도가 없으면 (0,0) 위치 검증 스킵
    if (courtLat === 0 && courtLng === 0) {
      setLocationEnabled(true);
      setDistanceToCourtM(0);
      return;
    }

    if (!navigator.geolocation) {
      setLocationEnabled(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const uLat = pos.coords.latitude;
        const uLng = pos.coords.longitude;
        setUserLat(uLat);
        setUserLng(uLng);
        setLocationEnabled(true);
        // 코트까지 거리 계산
        const dist = haversineDistanceM(uLat, uLng, courtLat, courtLng);
        setDistanceToCourtM(Math.round(dist));
      },
      () => {
        // 위치 권한 거부 또는 에러
        setLocationEnabled(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [courtLat, courtLng]);

  // 체크인 중이면 1분마다 경과 시간 업데이트
  useEffect(() => {
    if (!isCheckedInHere || !mySession) return;
    setElapsed(mySession.elapsed_minutes);
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, [isCheckedInHere, mySession]);

  // 체크인 처리 (사용자 위치를 body에 포함)
  const handleCheckin = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/web/courts/${courtId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "manual",
          latitude: userLat,
          longitude: userLng,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        // 409: 다른 코트에 체크인 중 → 코트 정보 저장
        if (res.status === 409 && err.checked_in_court_id) {
          setCheckedInCourtId(err.checked_in_court_id);
          setCheckedInCourtName(err.checked_in_court_name ?? "다른 코트");
          return;
        }
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
  }, [courtId, mutate, userLat, userLng]);

  // 체크아웃 처리 — 세션 완료 카드 표시
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
      // 세션 완료 카드에 데이터 전달 (gamification 포함)
      setSessionResult(result);
      await mutate();
    } catch {
      alert("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }, [courtId, mutate]);

  // 다른 코트에서 체크아웃 (409 상황에서 사용)
  const handleCheckoutOther = useCallback(async () => {
    if (!checkedInCourtId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/web/courts/${checkedInCourtId}/checkin`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "체크아웃에 실패했습니다");
        return;
      }
      // 체크아웃 성공 → 상태 초기화 + SWR 갱신
      setCheckedInCourtId(null);
      setCheckedInCourtName(null);
      await mutate();
    } catch {
      alert("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }, [checkedInCourtId, mutate]);

  return (
    <>
    {/* 세션 완료 카드: 체크아웃 성공 시 오버레이로 표시 */}
    {sessionResult && sessionResult.gamification && (
      <SessionCompleteCard
        durationMinutes={sessionResult.duration_minutes ?? 0}
        xpEarned={sessionResult.xp_earned ?? 0}
        gamification={sessionResult.gamification}
        onClose={() => setSessionResult(null)}
      />
    )}
    <div
      className="rounded-md p-5 sm:p-6 mb-4"
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
      ) : checkedInCourtId ? (
        // 409 응답 → 다른 코트에 체크인 중 (코트 이름 표시 + 이동/체크아웃 버튼)
        <div className="space-y-2">
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
            <strong style={{ color: "var(--color-text-primary)" }}>{checkedInCourtName}</strong>에 체크인 중이에요.
          </div>
          <div className="flex gap-2">
            {/* 체크인 중인 코트로 이동 */}
            <button
              onClick={() => router.push(`/courts/${checkedInCourtId}`)}
              className="flex-1 rounded-[4px] px-4 py-3 text-sm font-bold transition-all active:scale-95"
              style={{
                backgroundColor: "var(--color-surface-bright)",
                color: "var(--color-text-primary)",
              }}
            >
              <span className="flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  open_in_new
                </span>
                체크인 중인 농구장 보기
              </span>
            </button>
            {/* 다른 코트에서 체크아웃 */}
            <button
              onClick={handleCheckoutOther}
              disabled={loading}
              className="shrink-0 rounded-[4px] px-5 py-3 text-sm font-bold text-white transition-all active:scale-95"
              style={{
                backgroundColor: "var(--color-text-secondary)",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "처리 중..." : "체크아웃"}
            </button>
          </div>
        </div>
      ) : locationEnabled === null ? (
        // (a) 위치 확인 중 (로딩)
        <div
          className="w-full rounded-[4px] px-5 py-3.5 text-sm font-bold text-center"
          style={{
            backgroundColor: "var(--color-surface-bright)",
            color: "var(--color-text-muted)",
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined animate-spin" style={{ fontSize: "18px" }}>
              progress_activity
            </span>
            위치 확인 중...
          </span>
        </div>
      ) : locationEnabled === false ? (
        // (b) 위치 서비스 비활성화
        <div
          className="w-full rounded-[4px] px-5 py-3.5 text-sm text-center"
          style={{
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-muted)",
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              location_off
            </span>
            위치 서비스를 활성화해주세요
          </span>
        </div>
      ) : distanceToCourtM !== null && distanceToCourtM > 100 ? (
        // (c) 코트에서 100m 초과 (비활성화)
        <div
          className="w-full rounded-[4px] px-5 py-3.5 text-sm text-center"
          style={{
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-muted)",
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              wrong_location
            </span>
            코트에서 {distanceToCourtM >= 1000
              ? `${(distanceToCourtM / 1000).toFixed(1)}km`
              : `${distanceToCourtM}m`
            } 떨어져 있어요 (100m 이내에서 체크인)
          </span>
        </div>
      ) : (
        // (e) 정상: 체크인 버튼
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
    </>
  );
}
