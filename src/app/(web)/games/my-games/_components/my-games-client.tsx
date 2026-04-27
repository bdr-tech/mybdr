"use client";

/* ============================================================
 * MyGamesClient — 탭/배너 client 쉘
 *
 * 왜 client:
 *   - 시안의 3탭(예정/지난 경기/취소·환불) 전환 state
 *   - sessionStorage 의 "mybdr.justApplied" 플래그 읽어 배너 노출
 *   - 배너는 12초 내에 사용자가 "확인" 클릭 가능
 *
 * 서버 컴포넌트에서 받은 data 를 props 로 내려받아 분기만 담당.
 * 데이터 패칭은 page.tsx 서버 컴포넌트에서 이미 완료.
 * ============================================================ */

import { useEffect, useState } from "react";
import { RegRow, type RegItem } from "./reg-row";

type Tab = "upcoming" | "past" | "cancelled";

interface Props {
  /** 예정 탭 아이템 (pending + 미래 confirmed) */
  upcoming: RegItem[];
  /** 지난 경기 탭 아이템 (completed) */
  past: RegItem[];
  /** 취소·환불 탭 아이템 (cancelled) */
  cancelled: RegItem[];
}

export function MyGamesClient({ upcoming, past, cancelled }: Props) {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [justApplied, setJustApplied] = useState(false);

  // just-applied 배너 — sessionStorage 플래그 읽고 한 번만 표시
  useEffect(() => {
    const flag = sessionStorage.getItem("mybdr.justApplied");
    if (flag) {
      setJustApplied(true);
      // 플래그는 읽자마자 제거 (재진입 시 재표시 방지)
      sessionStorage.removeItem("mybdr.justApplied");
    }
  }, []);

  const list = tab === "upcoming" ? upcoming : tab === "past" ? past : cancelled;
  const counts = {
    upcoming: upcoming.length,
    past: past.length,
    cancelled: cancelled.length,
  };

  return (
    <>
      {/* just-applied 배너 — sessionStorage 플래그 있을 때만 */}
      {justApplied && (
        <div
          className="card"
          style={{
            padding: "20px 22px",
            marginBottom: 20,
            // cafe-blue-soft / hair 토큰 — globals.css에 alias 존재
            background: "var(--cafe-blue-soft)",
            borderColor: "var(--cafe-blue-hair)",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* 좌측 체크 아이콘 */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--cafe-blue)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              fontSize: 24,
              fontWeight: 800,
            }}
            aria-hidden
          >
            ✓
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 15,
                color: "var(--cafe-blue-deep)",
              }}
            >
              신청이 완료되었습니다
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--ink-soft)",
                marginTop: 2,
              }}
            >
              호스트 확인 후 확정 알림이 발송됩니다. 보통 24시간 이내에
              처리됩니다.
            </div>
          </div>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => setJustApplied(false)}
          >
            확인
          </button>
        </div>
      )}

      {/* 탭 바 — 3개 (시안 그대로) */}
      <div
        style={{
          display: "flex",
          gap: 2,
          borderBottom: "1px solid var(--border)",
          marginBottom: 16,
        }}
      >
        {(
          [
            { id: "upcoming", label: "예정" },
            { id: "past", label: "지난 경기" },
            { id: "cancelled", label: "취소·환불" },
          ] as const
        ).map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                padding: "12px 18px",
                background: "transparent",
                border: 0,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                color: active ? "var(--cafe-blue-deep)" : "var(--ink-mute)",
                borderBottom: active
                  ? "2px solid var(--cafe-blue)"
                  : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {t.label}{" "}
              <span
                style={{
                  fontSize: 11,
                  color: "var(--ink-dim)",
                  fontWeight: 500,
                  marginLeft: 4,
                  fontFamily: "var(--ff-mono)",
                }}
              >
                {counts[t.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* 리스트 영역 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {list.length === 0 && (
          <div
            className="card"
            style={{
              padding: "60px 20px",
              textAlign: "center",
              color: "var(--ink-dim)",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }} aria-hidden>
              📭
            </div>
            <div style={{ fontSize: 14 }}>해당 상태의 신청이 없습니다.</div>
          </div>
        )}
        {list.map((r) => (
          <RegRow key={r.id} r={r} />
        ))}
      </div>

      {/* 정책 안내 — 예정 탭에서만 */}
      {tab === "upcoming" && (
        <div
          style={{
            marginTop: 24,
            padding: "16px 18px",
            background: "var(--bg-alt)",
            borderRadius: 8,
            fontSize: 12.5,
            color: "var(--ink-mute)",
            lineHeight: 1.6,
          }}
        >
          <b style={{ color: "var(--ink-soft)" }}>취소 정책</b> · 경기 시작
          72시간 전까지 취소 시 100% 환불, 24시간 전까지 50% 환불, 이후 환불
          불가. 대회는 접수 마감 3일 전까지만 전액 환불됩니다. 노쇼(무통보
          불참) 3회 누적 시 7일간 신청이 제한됩니다.
        </div>
      )}
    </>
  );
}
