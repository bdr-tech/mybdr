"use client";

/* ============================================================
 * /scrim — 스크림 매칭(Scrimmage) v2 신규
 *
 * 이유: BDR v2 디자인 적용 작업의 일환. 팀 vs 팀 연습경기 매칭 페이지를
 *      v2 시안 그대로 박제. DB 0% — 시안 더미 상수만 사용.
 *      시안(Dev/design/BDR v2/screens/Scrim.jsx 169줄) 1:1 박제.
 *
 * 원칙 (사용자 지침: "DB 미지원 기능도 제거 금지 — UI 배치 + '준비 중'"):
 *  - API/Prisma/서비스 0 변경. 데이터는 시안 박제(상수).
 *  - 인라인 이모지(📅 📍)는 시안 그대로 박제 (Material Symbols 변환 금지).
 *  - 모든 버튼(제안 보내기/메시지/수락/거절/상세/매칭 조건 편집/내 요청 관리/
 *    + 스크림 등록)은 noop. UI 미리보기 전용.
 *  - lucide-react 사용 안 함.
 *  - 페이지 상단에 "준비 중" 안내 1줄.
 *
 * 데이터 추후 마이그레이션 (스코프 외 — 백로그):
 *  - scrim_open_requests / scrim_proposals / scrim_history 모델
 *  - 팀 레이팅 매칭 알고리즘
 *  - 팀 간 메시지/제안 채널
 * ============================================================ */

import Link from "next/link";
import { useState } from "react";

// ---- 타입 정의 ----
type TabId = "find" | "incoming" | "outgoing" | "history";

type OpenReq = {
  id: string;
  team: string;
  tag: string;
  color: string;
  rating: number;
  date: string;
  court: string;
  format: string;
  level: string;
  note: string;
  openBy: string;
  deadline: string;
};

type IncomingProposal = {
  id: string;
  from: string;
  tag: string;
  color: string;
  msg: string;
  at: string;
  status: "new" | "replied";
};

type OutgoingProposal = {
  id: string;
  to: string;
  tag: string;
  color: string;
  msg: string;
  at: string;
  status: "pending" | "accepted" | "rejected";
};

type HistoryRow = {
  date: string;
  opp: string;
  score: string;
  result: "승" | "패";
  rating: number;
  court: string;
};

// ---- 상수 (시안 L6~L26 박제) ----
const OPEN_REQS: OpenReq[] = [
  { id: "s1", team: "MONKEYZ", tag: "MNK", color: "#F59E0B", rating: 1812, date: "04.27 (일) 14:00", court: "장충체육관", format: "5v5 · 풀코트", level: "OPEN", note: "BDR Challenge 직전 감각 조율용. 심판 같이 섭외 가능.", openBy: "monkey_cap", deadline: "D-4" },
  { id: "s2", team: "IRON WOLVES", tag: "IRN", color: "#374151", rating: 1705, date: "05.02 (토) 19:00", court: "용산국민체육센터", format: "5v5 · 풀코트", level: "OPEN/PRO", note: "상급 대응 가능 팀만. 세미 풀타임 40분×2.", openBy: "iron_coach", deadline: "D-9" },
  { id: "s3", team: "SWEEP", tag: "SWP", color: "#F59E0B", rating: 1650, date: "05.04 (월) 20:00", court: "성동구민체육관", format: "3v3 · 하프", level: "AMATEUR", note: "로테이션 돌려가며 서로 편하게. 회식 가능.", openBy: "sweep_pg", deadline: "D-11" },
  { id: "s4", team: "PIVOT", tag: "PVT", color: "#10B981", rating: 1520, date: "05.10 (토) 13:00", court: "반포종합복지관", format: "5v5 · 풀코트", level: "AMATEUR", note: "신생팀. 매너 중시. 초보 섞여도 괜찮아요.", openBy: "pvt_mng", deadline: "D-17" },
];

const INCOMING: IncomingProposal[] = [
  { id: "in1", from: "몽키즈", tag: "MNK", color: "#F59E0B", msg: "토요일 스크림 어떠세요?", at: "2시간 전", status: "new" },
  { id: "in2", from: "3POINT", tag: "3PT", color: "#E31B23", msg: "4/30 저녁 용산 같이 뛰시죠", at: "어제", status: "replied" },
];

const OUTGOING: OutgoingProposal[] = [
  { id: "o1", to: "킹스크루", tag: "KGS", color: "#0F5FCC", msg: "금요일 저녁 풀코트 제안드려요", at: "1시간 전", status: "pending" },
  { id: "o2", to: "IRON WOLVES", tag: "IRN", color: "#374151", msg: "5/2 스크림 가능하신지", at: "3일 전", status: "accepted" },
];

const HISTORY: HistoryRow[] = [
  { date: "04.18", opp: "몽키즈", score: "71–78", result: "패", rating: -12, court: "장충" },
  { date: "04.11", opp: "IRON WOLVES", score: "82–74", result: "승", rating: +14, court: "용산" },
  { date: "03.29", opp: "KINGSCREW", score: "68–80", result: "패", rating: -18, court: "양재" },
];

export default function ScrimPage() {
  // 시안 L4 — 탭 상태
  const [tab, setTab] = useState<TabId>("find");

  return (
    <div className="page">
      {/* 브레드크럼 (시안 L30~L33) */}
      <div style={{ display: "flex", gap: 6, fontSize: 12, color: "var(--ink-mute)", marginBottom: 12 }}>
        <Link href="/" style={{ cursor: "pointer", color: "inherit" }}>
          홈
        </Link>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>스크림 매칭</span>
      </div>

      {/* 헤더 (시안 L35~L45) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 18,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div className="eyebrow">스크림 · SCRIMMAGE</div>
          <h1 style={{ margin: "4px 0 6px", fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}>
            팀 vs 팀, 연습경기 잡기
          </h1>
          <p style={{ margin: 0, color: "var(--ink-mute)", fontSize: 14 }}>
            내 팀 레이팅에 맞는 상대를 찾고, 바로 제안을 주고받으세요.
          </p>
          {/* 준비 중 안내 (PM 지시) */}
          <p style={{ margin: "6px 0 0", color: "var(--ink-dim)", fontSize: 12 }}>
            현재 스크림 매칭은 준비 중입니다. UI 미리보기로만 동작합니다.
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {/* 내 요청 관리/스크림 등록 — noop */}
          <button className="btn" type="button" disabled title="준비 중">
            내 요청 관리
          </button>
          <button className="btn btn--accent" type="button" disabled title="준비 중">
            + 스크림 등록
          </button>
        </div>
      </div>

      {/* Me bar — 내 팀 정보 (시안 L47~L55) */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          marginBottom: 16,
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gap: 18,
          alignItems: "center",
        }}
      >
        <span
          style={{
            width: 40,
            height: 40,
            background: "#DC2626",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--ff-mono)",
            fontWeight: 800,
            fontSize: 12,
            borderRadius: 4,
          }}
        >
          RDM
        </span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>REDEEM · 레이팅 1684</div>
          <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>
            적합 상대 레이팅 <b style={{ color: "var(--ink-soft)" }}>1550–1820</b> · 활동지역{" "}
            <b style={{ color: "var(--ink-soft)" }}>서울 중·송파</b>
          </div>
        </div>
        {/* 매칭 조건 편집 — noop */}
        <button className="btn btn--sm" type="button" disabled title="준비 중">
          매칭 조건 편집
        </button>
      </div>

      {/* 탭 (시안 L57~L74) */}
      <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
        {([
          { id: "find" as TabId, label: "상대 찾기", n: OPEN_REQS.length },
          { id: "incoming" as TabId, label: "받은 제안", n: INCOMING.length },
          { id: "outgoing" as TabId, label: "보낸 제안", n: OUTGOING.length },
          { id: "history" as TabId, label: "지난 스크림", n: HISTORY.length },
        ]).map((t) => (
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
              fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? "var(--cafe-blue-deep)" : "var(--ink-mute)",
              borderBottom: tab === t.id ? "2px solid var(--cafe-blue)" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {t.label}
            <span
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontFamily: "var(--ff-mono)",
                marginLeft: 4,
              }}
            >
              {t.n}
            </span>
          </button>
        ))}
      </div>

      {/* === 상대 찾기 === (시안 L76~L103) */}
      {tab === "find" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {OPEN_REQS.map((r) => (
            <div
              key={r.id}
              className="card"
              style={{
                padding: "18px 22px",
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 18,
                alignItems: "center",
              }}
            >
              {/* 좌측: 팀 태그 + 이름 */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    width: 52,
                    height: 52,
                    background: r.color,
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--ff-mono)",
                    fontWeight: 800,
                    fontSize: 14,
                    borderRadius: 6,
                  }}
                >
                  {r.tag}
                </span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.01em" }}>{r.team}</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ink-dim)",
                      fontFamily: "var(--ff-mono)",
                    }}
                  >
                    레이팅 {r.rating} · @{r.openBy}
                  </div>
                </div>
              </div>
              {/* 중앙: 배지 + 일정 + 메모 (시안 인라인 이모지 박제) */}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                  <span className="badge badge--soft">{r.format}</span>
                  <span className="badge badge--ghost">{r.level}</span>
                  <span className="badge badge--red">{r.deadline}</span>
                </div>
                {/* 시안 인라인 이모지 그대로 박제 (Material Symbols 변환 금지) */}
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                  📅 {r.date} · 📍 {r.court}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--ink-mute)", lineHeight: 1.5 }}>
                  {r.note}
                </div>
              </div>
              {/* 우측: 액션 버튼 — noop */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 110 }}>
                <button className="btn btn--primary btn--sm" type="button" disabled title="준비 중">
                  제안 보내기
                </button>
                <button className="btn btn--sm" type="button" disabled title="준비 중">
                  메시지
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === 받은 제안 === (시안 L105~L126) */}
      {tab === "incoming" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {INCOMING.map((i) => (
            <div
              key={i.id}
              className="card"
              style={{
                padding: "18px 22px",
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 16,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  width: 44,
                  height: 44,
                  background: i.color,
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--ff-mono)",
                  fontWeight: 800,
                  fontSize: 12,
                  borderRadius: 4,
                }}
              >
                {i.tag}
              </span>
              <div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                  <b style={{ fontSize: 14 }}>{i.from}</b>
                  {i.status === "new" && <span className="badge badge--new">NEW</span>}
                  {i.status === "replied" && <span className="badge badge--ok">응답함</span>}
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--ink-dim)",
                      fontFamily: "var(--ff-mono)",
                      marginLeft: "auto",
                    }}
                  >
                    {i.at}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{i.msg}</div>
              </div>
              {/* 거절/수락 — noop */}
              <div style={{ display: "flex", gap: 4 }}>
                <button className="btn btn--sm" type="button" disabled title="준비 중">
                  거절
                </button>
                <button className="btn btn--primary btn--sm" type="button" disabled title="준비 중">
                  수락
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === 보낸 제안 === (시안 L128~L146) */}
      {tab === "outgoing" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {OUTGOING.map((o) => (
            <div
              key={o.id}
              className="card"
              style={{
                padding: "18px 22px",
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 16,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  width: 44,
                  height: 44,
                  background: o.color,
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--ff-mono)",
                  fontWeight: 800,
                  fontSize: 12,
                  borderRadius: 4,
                }}
              >
                {o.tag}
              </span>
              <div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>To</span>
                  <b style={{ fontSize: 14 }}>{o.to}</b>
                  {/* 시안 L137 status 배지 매핑 */}
                  <span
                    className={`badge ${
                      o.status === "accepted"
                        ? "badge--ok"
                        : o.status === "pending"
                        ? "badge--warn"
                        : "badge--soft"
                    }`}
                  >
                    {o.status === "accepted" ? "수락됨" : o.status === "pending" ? "응답대기" : "거절"}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--ink-dim)",
                      fontFamily: "var(--ff-mono)",
                      marginLeft: "auto",
                    }}
                  >
                    {o.at}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{o.msg}</div>
              </div>
              {/* 상세 — noop */}
              <button className="btn btn--sm" type="button" disabled title="준비 중">
                상세
              </button>
            </div>
          ))}
        </div>
      )}

      {/* === 지난 스크림 === (시안 L148~L164) */}
      {tab === "history" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            className="board__head"
            style={{ gridTemplateColumns: "80px 1.2fr 100px 80px 80px 90px" }}
          >
            <div>날짜</div>
            <div style={{ textAlign: "left" }}>상대</div>
            <div>스코어</div>
            <div>결과</div>
            <div>레이팅</div>
            <div>코트</div>
          </div>
          {HISTORY.map((h, i) => (
            <div
              key={i}
              className="board__row"
              style={{ gridTemplateColumns: "80px 1.2fr 100px 80px 80px 90px" }}
            >
              <div
                style={{
                  fontFamily: "var(--ff-mono)",
                  color: "var(--ink-dim)",
                  fontSize: 12,
                }}
              >
                {h.date}
              </div>
              <div className="title">{h.opp}</div>
              <div style={{ fontFamily: "var(--ff-mono)", fontWeight: 700 }}>{h.score}</div>
              <div>
                <span className={`badge ${h.result === "승" ? "badge--ok" : "badge--red"}`}>
                  {h.result}
                </span>
              </div>
              <div
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontWeight: 700,
                  color: h.rating > 0 ? "var(--ok)" : "var(--err)",
                }}
              >
                {h.rating > 0 ? "+" : ""}
                {h.rating}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>{h.court}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
