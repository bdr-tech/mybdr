"use client";

/* ============================================================
 * /live — 라이브 중계 (Live) v2 신규 — Phase 8
 *
 * 이유: BDR v2 디자인 적용. 시안(Dev/design/BDR v2/screens/Live.jsx)을
 *      Next.js 페이지로 박제. 플레이어/스코어버그/실시간팀기록/다른중계/
 *      실시간 채팅 레일을 한 화면에 구성.
 *
 * 원칙 (사용자 지침: "DB 미지원도 제거 금지 — UI 배치 + '준비 중' 표시"):
 *  - API/Prisma/서비스 0 변경. 데이터는 시안 박제(상수).
 *  - DB 0% 지원 → 정적 더미만, 실 동작 0.
 *  - 페이지 상단 1줄에 "준비 중" 안내 노출.
 *  - 시안 인라인 이모지(🏀/▶/⏸/🔊/⚙/⛶/👁/♡/🔖/↗/⚠️/🎙/👏/🔥/😂/🎯/↵)
 *    그대로 박제. lucide-react 사용 금지.
 *
 * 시안 → 페이지 변환 포인트:
 *  - setRoute('home') → <Link href="/">
 *  - 다른 중계 setActive(id) → useState 로컬 전환 (라우트 이동 아님, 시안 동작 유지)
 *  - chatText 입력 상태 → useState 유지
 *  - TEAMS 글로벌 → 모듈 상수 TEAM_A / TEAM_B 박제 (시안의 RDM / 3P)
 *  - <style>{`@keyframes pulse...`}</style> → styled-jsx 그대로
 *
 * 참고: src/app/(web)/safety/page.tsx 동일 패턴 (DB 0% + 박제 + 준비중 안내).
 * ============================================================ */

import Link from "next/link";
import { useState } from "react";

// ─────────────────────────────────────────────────────────────
// 더미 데이터 — 시안 그대로 박제
// ─────────────────────────────────────────────────────────────

// 스트림 타입 — 라이브/예고를 한 배열로 다루므로 옵셔널 필드 분리
type Stream = {
  id: string;
  title: string;
  match: string;
  viewers: number;
  live: boolean;
  quality?: string;
  q1?: string;
  q2?: string;
  host: string;
  time?: string;
  scheduled?: string;
};

const STREAMS: Stream[] = [
  { id: "l1", title: "Kings Cup Vol.07 · 8강 1경기", match: "REDEEM vs 3POINT", viewers: 1247, live: true, quality: "FHD", q1: "13", q2: "11", host: "운영팀", time: "2:34 진행중" },
  { id: "l2", title: "BDR Challenge · 예선 A조", match: "SWEEP vs IRON", viewers: 832, live: true, quality: "HD", q1: "8", q2: "14", host: "기자단", time: "1:12 진행중" },
  { id: "l3", title: "주말농구협회 리그 · 4R", match: "몽키즈 vs 피벗", viewers: 412, live: true, quality: "HD", q1: "21", q2: "19", host: "협회", time: "4Q 진행중" },
  { id: "l4", title: "장충 주간 픽업 · 풀코트", match: "5v5 로테이션", viewers: 287, live: true, quality: "HD", host: "장충관리" },
  { id: "l5", title: "예고 · REDEEM vs 몽키즈 결승", match: "5/17 14:00", viewers: 0, live: false, host: "운영팀", scheduled: "내일 14:00" },
  { id: "l6", title: "예고 · 수원 청소년 연합전", match: "4팀 토너먼트", viewers: 0, live: false, host: "수원리그", scheduled: "5/10 10:00" },
];

// 채팅 메시지 — 시안 그대로 (color는 var(--*) 또는 hex 혼용 — 시안 박제)
type ChatMsg = {
  name: string;
  level: string;
  body: string;
  color: string;
  time: string;
  official?: boolean;
};

const CHAT: ChatMsg[] = [
  { name: "3POINT_슈", level: "L.5", body: "3번 선수 진짜 잘하네요", color: "#0F5FCC", time: "2:31" },
  { name: "몽키즈_센", level: "L.7", body: "이번 라운드 REDEEM 팀 수비 좋음", color: "#F59E0B", time: "2:31" },
  { name: "새내기", level: "L.1", body: "스코어 어디서 확인하나요?", color: "var(--ink-dim)", time: "2:32" },
  { name: "운영팀", level: "ADMIN", body: "상단에 실시간 점수 표시됩니다.", color: "var(--accent)", time: "2:32", official: true },
  { name: "리딤캡틴", level: "L.8", body: "우리 2점차로 따라잡았네요 🔥", color: "#DC2626", time: "2:33" },
  { name: "코치K", level: "COACH", body: "저 픽앤롤 연결 정말 좋았습니다", color: "var(--cafe-blue)", time: "2:33" },
  { name: "block", level: "L.6", body: "3점 넣자마자 타임아웃이네요 ㅋㅋ", color: "#10B981", time: "2:34" },
  { name: "분석가", level: "L.9", body: "REDEEM 가드 PPG 지금 18점", color: "var(--ink)", time: "2:34" },
];

// 팀 박제 — 시안의 TEAMS.find(t=>t.tag==='RDM') / '3P' 결과를 직접 상수화
type Team = { tag: string; name: string; color: string; ink: string };
const TEAM_A: Team = { tag: "RDM", name: "REDEEM", color: "#DC2626", ink: "#fff" };
const TEAM_B: Team = { tag: "3P", name: "3POINT", color: "#0F5FCC", ink: "#fff" };

// 실시간 팀 기록 — 시안 그대로
type Stat = { label: string; a: number; b: number };
const STATS: Stat[] = [
  { label: "야투%", a: 47, b: 52 },
  { label: "3점%", a: 38, b: 41 },
  { label: "자유투%", a: 76, b: 82 },
  { label: "리바운드", a: 18, b: 16 },
  { label: "어시스트", a: 12, b: 9 },
  { label: "스틸", a: 6, b: 4 },
];

// 채팅 입력창 하단 빠른 이모지
const QUICK_EMOJI = ["👏", "🔥", "🏀", "😂", "🎯"];

// ─────────────────────────────────────────────────────────────
// 페이지
// ─────────────────────────────────────────────────────────────
export default function LivePage() {
  // 활성 스트림 — 시안의 active 상태 그대로 (id로 전환)
  const [active, setActive] = useState<string>("l1");
  // 채팅 입력 — 시안과 동일하게 보내면 비움
  const [chatText, setChatText] = useState<string>("");

  // 현재 스트림 — find 결과가 undefined일 가능성을 TS strict 대비 처리
  const current = STREAMS.find((s) => s.id === active) ?? STREAMS[0];

  return (
    <div className="page">
      {/* 브레드크럼 — 시안의 setRoute('home') → Link href="/" */}
      <div style={{ display: "flex", gap: 6, fontSize: 12, color: "var(--ink-mute)", marginBottom: 12 }}>
        <Link href="/" style={{ color: "inherit" }}>홈</Link>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>라이브 중계</span>
      </div>

      {/* "준비 중" 안내 — 사용자 지침: DB 미지원이라 UI 미리보기만 동작 */}
      <p style={{ margin: "0 0 12px", color: "var(--ink-dim)", fontSize: 12, lineHeight: 1.5 }}>
        현재 라이브 페이지는 준비 중입니다. UI 미리보기로만 동작합니다.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 18, alignItems: "flex-start" }}>
        {/* ────────── 좌측: 플레이어 + 팀기록 + 다른 중계 ────────── */}
        <div>
          {/* Player 카드 */}
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 14 }}>
            <div
              style={{
                aspectRatio: "16/9",
                background: "linear-gradient(135deg, #1a1a1a, #000)",
                position: "relative",
                display: "grid",
                placeItems: "center",
              }}
            >
              {/* Fake court 배경 */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(ellipse at center, rgba(220,38,38,.15), transparent 60%)",
                }}
              />
              <svg width="60%" height="60%" viewBox="0 0 400 225" style={{ opacity: 0.18 }}>
                <rect x="40" y="30" width="320" height="165" fill="none" stroke="#fff" strokeWidth="2" />
                <circle cx="200" cy="112" r="30" fill="none" stroke="#fff" strokeWidth="2" />
                <rect x="40" y="75" width="60" height="75" fill="none" stroke="#fff" strokeWidth="2" />
                <rect x="300" y="75" width="60" height="75" fill="none" stroke="#fff" strokeWidth="2" />
                <line x1="200" y1="30" x2="200" y2="195" stroke="#fff" strokeWidth="2" />
              </svg>

              {/* LIVE 배지 + 화질 + 시청자 */}
              <div style={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 6, alignItems: "center" }}>
                <span
                  style={{
                    background: "var(--err)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: ".12em",
                    padding: "4px 10px",
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  {/* 펄스 도트 — keyframes는 아래 styled-jsx에서 정의 */}
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#fff",
                      animation: "pulse 1.5s infinite",
                    }}
                  />
                  LIVE
                </span>
                <span
                  style={{
                    background: "rgba(0,0,0,.6)",
                    color: "#fff",
                    fontSize: 11,
                    padding: "4px 8px",
                    borderRadius: 3,
                    fontFamily: "var(--ff-mono)",
                  }}
                >
                  {current.quality ?? "HD"}
                </span>
                <span
                  style={{
                    background: "rgba(0,0,0,.6)",
                    color: "#fff",
                    fontSize: 11,
                    padding: "4px 8px",
                    borderRadius: 3,
                  }}
                >
                  👁 {current.viewers.toLocaleString()}
                </span>
              </div>

              {/* Scorebug — 우측 상단 */}
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: "rgba(0,0,0,.85)",
                  padding: "10px 14px",
                  borderRadius: 6,
                  color: "#fff",
                  minWidth: 220,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                    fontSize: 10,
                    letterSpacing: ".1em",
                    opacity: 0.7,
                    fontWeight: 700,
                  }}
                >
                  <span>Q3 · 5:24</span>
                  <span style={{ color: "var(--err)" }}>LIVE</span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "28px 1fr 36px",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      background: TEAM_A.color,
                      color: TEAM_A.ink,
                      fontFamily: "var(--ff-mono)",
                      fontSize: 9,
                      fontWeight: 700,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 3,
                    }}
                  >
                    {TEAM_A.tag}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{TEAM_A.name}</span>
                  <span
                    style={{
                      fontFamily: "var(--ff-display)",
                      fontSize: 22,
                      fontWeight: 900,
                      textAlign: "right",
                    }}
                  >
                    47
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 36px", gap: 8, alignItems: "center" }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      background: TEAM_B.color,
                      color: TEAM_B.ink,
                      fontFamily: "var(--ff-mono)",
                      fontSize: 9,
                      fontWeight: 700,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 3,
                    }}
                  >
                    {TEAM_B.tag}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{TEAM_B.name}</span>
                  <span
                    style={{
                      fontFamily: "var(--ff-display)",
                      fontSize: 22,
                      fontWeight: 900,
                      textAlign: "right",
                      color: "var(--err)",
                    }}
                  >
                    52
                  </span>
                </div>
              </div>

              {/* 중앙 재생 버튼 */}
              <button
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,.9)",
                  border: 0,
                  fontSize: 32,
                  cursor: "pointer",
                  color: "#000",
                  boxShadow: "0 8px 30px rgba(0,0,0,.4)",
                  zIndex: 2,
                }}
              >
                ▶
              </button>

              {/* 하단 컨트롤 바 — 일시정지/타임라인/시간/볼륨/설정/풀스크린 */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "14px 16px",
                  background: "linear-gradient(to top, rgba(0,0,0,.9), transparent)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <button style={{ background: "transparent", border: 0, color: "#fff", fontSize: 16, cursor: "pointer" }}>
                  ⏸
                </button>
                <div
                  style={{
                    flex: 1,
                    height: 4,
                    background: "rgba(255,255,255,.2)",
                    borderRadius: 2,
                    position: "relative",
                  }}
                >
                  <div style={{ width: "62%", height: "100%", background: "var(--err)", borderRadius: 2 }} />
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: -3,
                      width: 10,
                      height: 10,
                      background: "var(--err)",
                      borderRadius: "50%",
                    }}
                  />
                </div>
                <span style={{ color: "#fff", fontFamily: "var(--ff-mono)", fontSize: 11 }}>{current.time ?? ""}</span>
                <button style={{ background: "transparent", border: 0, color: "#fff", fontSize: 14, cursor: "pointer" }}>
                  🔊
                </button>
                <button style={{ background: "transparent", border: 0, color: "#fff", fontSize: 14, cursor: "pointer" }}>
                  ⚙
                </button>
                <button style={{ background: "transparent", border: 0, color: "#fff", fontSize: 14, cursor: "pointer" }}>
                  ⛶
                </button>
              </div>
            </div>

            {/* 플레이어 하단 메타 */}
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <span className="badge badge--red">LIVE</span>
                <span className="badge badge--soft">Kings Cup · 8강</span>
                <span className="badge badge--ghost">공식 중계</span>
              </div>
              <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, letterSpacing: "-0.015em" }}>
                {current.title}
              </h1>
              <div style={{ fontSize: 13, color: "var(--ink-mute)", marginBottom: 14 }}>
                {current.match} · 장충체육관 메인코트 · 해설 코치K & 분석가
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button className="btn btn--sm">♡ 좋아요 234</button>
                <button className="btn btn--sm">🔖 저장</button>
                <button className="btn btn--sm">↗ 공유</button>
                <button className="btn btn--sm">⚠️ 신고</button>
                <button className="btn btn--primary btn--sm" style={{ marginLeft: "auto" }}>
                  🎙 해설 참여 신청
                </button>
              </div>
            </div>
          </div>

          {/* 실시간 팀 기록 카드 — 3열 그리드 + 비율 막대 */}
          <div className="card" style={{ padding: "18px 22px", marginBottom: 14 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>실시간 팀 기록</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
              {STATS.map((s) => (
                <div key={s.label}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      color: "var(--ink-dim)",
                      fontWeight: 700,
                      marginBottom: 4,
                      fontFamily: "var(--ff-mono)",
                    }}
                  >
                    {/* 큰 쪽이 팀 색상으로 강조됨 — 시안 그대로 */}
                    <span style={{ color: s.a > s.b ? TEAM_A.color : "var(--ink-dim)" }}>
                      {s.a}
                      {s.label.includes("%") ? "%" : ""}
                    </span>
                    <span>{s.label}</span>
                    <span style={{ color: s.b > s.a ? TEAM_B.color : "var(--ink-dim)" }}>
                      {s.b}
                      {s.label.includes("%") ? "%" : ""}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      height: 6,
                      borderRadius: 3,
                      overflow: "hidden",
                      background: "var(--bg-alt)",
                    }}
                  >
                    <div style={{ width: `${(s.a / (s.a + s.b)) * 100}%`, background: TEAM_A.color }} />
                    <div style={{ flex: 1, background: TEAM_B.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 다른 중계 — 3열 그리드 카드, 클릭 시 active 전환 */}
          <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>
              다른 중계
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {STREAMS.filter((s) => s.id !== active).map((s) => (
                <div
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className="card"
                  style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}
                >
                  <div
                    style={{
                      aspectRatio: "16/9",
                      background: "linear-gradient(135deg, #1a1a1a, #000)",
                      position: "relative",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 28, opacity: 0.25 }}>🏀</span>
                    {s.live ? (
                      <span
                        style={{
                          position: "absolute",
                          top: 6,
                          left: 6,
                          background: "var(--err)",
                          color: "#fff",
                          fontSize: 9,
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: 2,
                          letterSpacing: ".1em",
                        }}
                      >
                        ● LIVE
                      </span>
                    ) : (
                      <span
                        style={{
                          position: "absolute",
                          top: 6,
                          left: 6,
                          background: "rgba(255,255,255,.15)",
                          color: "#fff",
                          fontSize: 9,
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: 2,
                        }}
                      >
                        예고
                      </span>
                    )}
                    {s.live && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: 6,
                          right: 6,
                          background: "rgba(0,0,0,.7)",
                          color: "#fff",
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 2,
                          fontFamily: "var(--ff-mono)",
                        }}
                      >
                        👁 {s.viewers}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: 700, fontSize: 12, lineHeight: 1.35, marginBottom: 3 }}>{s.title}</div>
                    <div style={{ fontSize: 10, color: "var(--ink-dim)", fontFamily: "var(--ff-mono)" }}>
                      {s.match} · {s.scheduled || `${s.viewers} 시청중`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ────────── 우측: 채팅 레일 (sticky) ────────── */}
        <aside
          className="card"
          style={{
            padding: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            position: "sticky",
            top: 120,
            height: "calc(100vh - 160px)",
            minHeight: 600,
          }}
        >
          {/* 헤더 — 제목 + 시청자수 */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>실시간 채팅</h3>
            <span style={{ fontSize: 11, color: "var(--ink-dim)", fontFamily: "var(--ff-mono)" }}>
              {current.viewers.toLocaleString()}명
            </span>
          </div>

          {/* 메시지 리스트 — 1줄 레이아웃 (이름 · 레벨 · 본문) */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              minHeight: 0,
            }}
          >
            {CHAT.map((c, i) => (
              <div key={i} style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                <span style={{ color: c.color, fontWeight: 700, marginRight: 5 }}>
                  {c.official && (
                    <span className="badge badge--red" style={{ fontSize: 8, padding: "0 4px", marginRight: 3 }}>
                      공식
                    </span>
                  )}
                  {c.name}
                </span>
                <span
                  style={{
                    color: "var(--ink-dim)",
                    fontFamily: "var(--ff-mono)",
                    fontSize: 10,
                    marginRight: 5,
                  }}
                >
                  {c.level}
                </span>
                <span style={{ color: "var(--ink)" }}>{c.body}</span>
              </div>
            ))}
          </div>

          {/* 입력창 — 이모지 단축 */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                className="input"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="채팅 입력"
                style={{ fontSize: 12, flex: 1, padding: "6px 10px" }}
              />
              {/* 보내기 — 시안 동작: 입력값 비움 (실 전송 아님) */}
              <button className="btn btn--primary btn--sm" onClick={() => setChatText("")}>
                ↵
              </button>
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 6, fontSize: 14 }}>
              {QUICK_EMOJI.map((e) => (
                <button
                  key={e}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    padding: "2px 7px",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* LIVE 배지 도트 펄스 애니메이션 — 시안의 inline <style> 그대로 */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}
