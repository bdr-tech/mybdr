"use client";

/* ============================================================
 * /match — Phase 8 Match v2 신규 박제 (목록 + 상세 토글)
 *
 * 이유: BDR v2 시안 Match.jsx (Dev/design/BDR v2/screens/Match.jsx, 283줄)는
 *      대회 목록(MatchList) + 대회 상세(MatchDetail) 두 화면이 한 파일에 있음.
 *      기존 /tournaments 라우트는 이미 v2 작업이 진행 중(V2TournamentHero,
 *      V2RegistrationSidebar 등). /match는 시안 자체를 별도 데모용 박제로 보존
 *      하는 라우트. DB 미연결 — 시안 더미 상수만 사용.
 *
 * 원칙 (사용자 지침: "DB 미지원도 제거 금지 — 박제 + '준비 중'"):
 *  - API/Prisma/서비스 0 변경. 시안 더미 상수만 사용.
 *  - 인라인 이모지(📅 📍 💰 👥) 시안 그대로 박제 (Material Symbols 변환 금지).
 *  - 모든 버튼(신청/상세/팀으로 신청하기/대회 개설)은 noop. UI 미리보기.
 *  - lucide-react 사용 안 함.
 *  - 페이지 상단에 "준비 중" 안내 1줄.
 *  - 라우트 결정: 단순 /match 경로로 신규 박제 (기존 /tournaments와 충돌 없음).
 *
 * 시안 변형:
 *  - React 라우터(setRoute)는 useState로 view 토글로 대체.
 *  - Poster/Avatar/Icon 컴포넌트는 이모지 + 인라인 그라디언트로 대체.
 *  - 시안의 TOURNAMENTS / TEAMS / BRACKET_R16 / SCHEDULE 글로벌은
 *    이 파일 내 const로 박제.
 *
 * 데이터 추후 마이그레이션 (스코프 외 — 백로그):
 *  - 이미 /tournaments 라우트가 실데이터로 동작 중.
 *  - /match는 v2 디자인 시안 데모 보존용. 실데이터 연결은 /tournaments에서 진행.
 * ============================================================ */

import { useState } from "react";

// ---- 타입 정의 ----
type TournamentStatus = "open" | "closing" | "closed" | "live" | "ended" | "preparing";

type Tournament = {
  id: string;
  title: string;
  edition: string;
  level: string;
  status: TournamentStatus;
  subtitle: string;
  dates: string;
  court: string;
  address: string;
  prize: string;
  fee: string;
  feePerTeam: boolean;
  capacity: number;
  applied: number;
  format: string;
  host: string;
  hostContact: string;
  period: string;
  poster: string | null;
  accent: string;
  tags: string[];
};

type Team = {
  id: string;
  name: string;
  tag: string;
  color: string;
  ink: string;
  rating: number;
  wins: number;
  losses: number;
};

type ScheduleRow = {
  time: string;
  court: string;
  label: string;
  teams: [string | null, string | null];
};

type ScheduleDay = { date: string; rows: ScheduleRow[] };

type BracketMatch = { a: string; b: string; time: string };

// ---- 시안 박제 더미 데이터 ----

// TOURNAMENTS — 시안 글로벌 상수 박제 (대회 목록)
const TOURNAMENTS: Tournament[] = [
  {
    id: "t1",
    title: "SEOUL OPEN",
    edition: "Vol.12",
    level: "OPEN",
    status: "closing",
    subtitle: "서울 3x3 오픈 챔피언십 — 더블 엘리미네이션",
    dates: "05.10 토 ~ 05.11 일",
    court: "장충체육관",
    address: "서울 중구 동호로 241",
    prize: "₩3,000,000",
    fee: "120,000원",
    feePerTeam: true,
    capacity: 16,
    applied: 14,
    format: "팀 단위 등록 · 4인 (교체 1)",
    host: "BDR Tournament Org",
    hostContact: "tournament@bdr.kr",
    period: "04.20 ~ 05.06 23:59",
    poster: null,
    accent: "#E31B23",
    tags: ["서울", "OPEN", "3x3"],
  },
  {
    id: "t2",
    title: "BDR CHALLENGE",
    edition: "Vol.7",
    level: "AMATEUR",
    status: "open",
    subtitle: "전국 아마추어 챌린저스 컵",
    dates: "05.18 토",
    court: "용산국민체육센터",
    address: "서울 용산구 한강대로",
    prize: "₩1,500,000",
    fee: "70,000원",
    feePerTeam: true,
    capacity: 24,
    applied: 9,
    format: "5v5 · 풀코트",
    host: "BDR Tournament Org",
    hostContact: "tournament@bdr.kr",
    period: "04.10 ~ 05.14 23:59",
    poster: null,
    accent: "#0079B9",
    tags: ["서울", "AMATEUR", "5v5"],
  },
  {
    id: "t3",
    title: "RIM CITY CUP",
    edition: "2026 Spring",
    level: "OPEN",
    status: "live",
    subtitle: "도시별 정상 가리기",
    dates: "04.27 일",
    court: "성동구민체육관",
    address: "서울 성동구 살곶이길",
    prize: "₩2,000,000",
    fee: "100,000원",
    feePerTeam: true,
    capacity: 12,
    applied: 12,
    format: "5v5 · 풀코트",
    host: "RIM CITY",
    hostContact: "rim@city.kr",
    period: "마감",
    poster: null,
    accent: "#1B3C87",
    tags: ["서울", "OPEN", "5v5"],
  },
  {
    id: "t4",
    title: "ZONE WOMEN'S",
    edition: "Vol.3",
    level: "PRO",
    status: "preparing",
    subtitle: "여성부 전용 정규 시즌",
    dates: "06.07 토 ~ 06.08 일",
    court: "반포종합복지관",
    address: "서울 서초구",
    prize: "₩1,000,000",
    fee: "60,000원",
    feePerTeam: false,
    capacity: 16,
    applied: 0,
    format: "5v5 · 풀코트",
    host: "ZONE League",
    hostContact: "zone@league.kr",
    period: "05.10 ~ 05.31",
    poster: null,
    accent: "#7C3AED",
    tags: ["서울", "PRO", "여성부"],
  },
  {
    id: "t5",
    title: "PIVOT FRIENDLY",
    edition: "Vol.1",
    level: "AMATEUR",
    status: "open",
    subtitle: "신생팀 환영 · 친선 컵",
    dates: "05.25 일",
    court: "강남구민체육센터",
    address: "서울 강남구",
    prize: "₩500,000",
    fee: "40,000원",
    feePerTeam: false,
    capacity: 12,
    applied: 4,
    format: "5v5 · 풀코트",
    host: "PIVOT 운영",
    hostContact: "pvt@bdr.kr",
    period: "04.15 ~ 05.20",
    poster: null,
    accent: "#10B981",
    tags: ["서울", "AMATEUR", "5v5"],
  },
  {
    id: "t6",
    title: "WINTER FINALS",
    edition: "2025-26",
    level: "OPEN",
    status: "ended",
    subtitle: "겨울 정규시즌 결승전",
    dates: "03.15 토",
    court: "잠실실내체육관",
    address: "서울 송파구",
    prize: "₩5,000,000",
    fee: "150,000원",
    feePerTeam: true,
    capacity: 8,
    applied: 8,
    format: "5v5 · 풀코트",
    host: "BDR League",
    hostContact: "league@bdr.kr",
    period: "마감",
    poster: null,
    accent: "#374151",
    tags: ["서울", "OPEN", "결승"],
  },
];

// TEAMS — 시안 글로벌 상수 박제 (참가팀)
const TEAMS: Team[] = [
  { id: "redeem", name: "REDEEM", tag: "RDM", color: "#E31B23", ink: "#fff", rating: 1820, wins: 12, losses: 3 },
  { id: "monkeys", name: "MONKEYZ", tag: "MNK", color: "#F59E0B", ink: "#000", rating: 1812, wins: 11, losses: 4 },
  { id: "3point", name: "3POINT", tag: "3PT", color: "#0079B9", ink: "#fff", rating: 1780, wins: 10, losses: 5 },
  { id: "kings", name: "KINGS", tag: "KNG", color: "#7C3AED", ink: "#fff", rating: 1755, wins: 9, losses: 5 },
  { id: "zone", name: "ZONE", tag: "ZN", color: "#1B3C87", ink: "#fff", rating: 1730, wins: 9, losses: 6 },
  { id: "pivot", name: "PIVOT", tag: "PVT", color: "#10B981", ink: "#fff", rating: 1520, wins: 6, losses: 7 },
  { id: "iron", name: "IRON WOLVES", tag: "IRN", color: "#374151", ink: "#fff", rating: 1705, wins: 8, losses: 6 },
  { id: "heat", name: "HEAT", tag: "HT", color: "#DC2626", ink: "#fff", rating: 1690, wins: 7, losses: 7 },
];

// BRACKET_R16 — 16강 대진 박제
const BRACKET_R16: BracketMatch[] = [
  { a: "redeem", b: "heat", time: "10:00" },
  { a: "monkeys", b: "iron", time: "10:40" },
  { a: "3point", b: "pivot", time: "11:20" },
  { a: "kings", b: "zone", time: "12:00" },
];

// SCHEDULE — 일정 박제
const SCHEDULE: ScheduleDay[] = [
  {
    date: "5월 10일 (토)",
    rows: [
      { time: "10:00", court: "A", label: "16강 R1", teams: ["redeem", "heat"] },
      { time: "10:40", court: "A", label: "16강 R2", teams: ["monkeys", "iron"] },
      { time: "11:20", court: "B", label: "16강 R3", teams: ["3point", "pivot"] },
      { time: "12:00", court: "B", label: "16강 R4", teams: ["kings", "zone"] },
    ],
  },
  {
    date: "5월 11일 (일)",
    rows: [
      { time: "13:00", court: "A", label: "8강 1경기", teams: [null, null] },
      { time: "13:50", court: "A", label: "8강 2경기", teams: [null, null] },
      { time: "15:00", court: "A", label: "준결승", teams: [null, null] },
      { time: "17:00", court: "A", label: "결승", teams: [null, null] },
    ],
  },
];

// ---- 라벨/스타일 매핑 (시안 L4~9 박제) ----
const STATUS_LABEL: Record<TournamentStatus, string> = {
  open: "접수중",
  closing: "마감임박",
  closed: "접수마감",
  live: "진행중",
  ended: "종료",
  preparing: "접수예정",
};

// 배지 색상: 시안 className(badge--ok 등) → 인라인 스타일 매핑
const STATUS_BADGE_STYLE: Record<TournamentStatus, React.CSSProperties> = {
  open: { background: "rgba(16,185,129,.16)", color: "#10B981", border: "1px solid rgba(16,185,129,.35)" },
  closing: { background: "rgba(227,27,35,.16)", color: "#E31B23", border: "1px solid rgba(227,27,35,.35)" },
  closed: { background: "rgba(120,120,120,.16)", color: "var(--color-text-muted)", border: "1px solid rgba(120,120,120,.35)" },
  live: { background: "rgba(227,27,35,.16)", color: "#E31B23", border: "1px solid rgba(227,27,35,.35)" },
  ended: { background: "rgba(120,120,120,.16)", color: "var(--color-text-muted)", border: "1px solid rgba(120,120,120,.35)" },
  preparing: { background: "rgba(0,121,185,.16)", color: "#0079B9", border: "1px solid rgba(0,121,185,.35)" },
};

const FILTERS = ["전체", "접수중", "마감임박", "진행중", "접수예정", "종료"] as const;
type FilterKey = (typeof FILTERS)[number];

// ============================================================
// MatchList — 시안 L3~L82 박제
// ============================================================
function MatchList({ onOpen }: { onOpen: () => void }) {
  // 필터 상태: 시안 L10~L20 그대로
  const [filter, setFilter] = useState<FilterKey>("전체");

  const shown = TOURNAMENTS.filter((t) => {
    if (filter === "전체") return true;
    if (filter === "접수중") return t.status === "open";
    if (filter === "마감임박") return t.status === "closing";
    if (filter === "진행중") return t.status === "live";
    if (filter === "접수예정") return t.status === "preparing";
    if (filter === "종료") return t.status === "ended";
    return true;
  });

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
      {/* 헤더: eyebrow + 대형 제목 + 카운트 + "대회 개설" 버튼 (시안 L24~L31) */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: ".12em",
              color: "var(--color-primary, #E31B23)",
              textTransform: "uppercase",
            }}
          >
            대회 · TOURNAMENTS
          </div>
          <h1
            style={{
              margin: "6px 0 4px",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.015em",
            }}
          >
            열린 대회 · 예정 대회
          </h1>
          <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            접수중 {TOURNAMENTS.filter((t) => t.status === "open").length} · 마감임박{" "}
            {TOURNAMENTS.filter((t) => t.status === "closing").length} · 진행중{" "}
            {TOURNAMENTS.filter((t) => t.status === "live").length} · 예정{" "}
            {TOURNAMENTS.filter((t) => t.status === "preparing").length}
          </div>
        </div>
        {/* "대회 개설" 버튼 — 시안 그대로 박제 (noop) */}
        <button
          onClick={() => alert("대회 개설은 준비 중입니다.")}
          style={{
            background: "var(--color-primary, #E31B23)",
            color: "#fff",
            border: "none",
            padding: "10px 18px",
            borderRadius: 4,
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          + 대회 개설
        </button>
      </div>

      {/* 필터 칩 (시안 L33~L38) */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: "8px 14px",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              ...(filter === s
                ? {
                    background: "var(--color-info, #0079B9)",
                    color: "#fff",
                    border: "1px solid var(--color-info, #0079B9)",
                  }
                : {
                    background: "var(--color-surface)",
                    color: "var(--color-text-secondary)",
                    border: "1px solid var(--color-border)",
                  }),
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 카드 그리드 (시안 L40~L79): 2열, 좌측 포스터 / 우측 메타 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {shown.map((t) => (
          <div
            key={t.id}
            onClick={onOpen}
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              padding: 0,
              display: "grid",
              gridTemplateColumns: "140px 1fr",
              overflow: "hidden",
              cursor: "pointer",
            }}
          >
            {/* 포스터 영역: 시안 L46~L55 — 그라디언트 + 텍스트 */}
            <div
              style={{
                background: `linear-gradient(155deg, ${t.accent}, ${t.accent}CC 50%, #000 130%)`,
                color: "#fff",
                padding: 14,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 148,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* 빗금 패턴 — 시안 L47 */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0.1,
                  background:
                    "repeating-linear-gradient(135deg, #fff 0 2px, transparent 2px 14px)",
                }}
              />
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: ".12em",
                  opacity: 0.85,
                  position: "relative",
                }}
              >
                {t.level}
              </div>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {t.title.split(" ")[0]}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {t.title.split(" ").slice(1).join(" ") || t.edition}
                </div>
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>{t.edition}</div>
              </div>
            </div>

            {/* 메타 영역: 시안 L56~L76 */}
            <div
              style={{
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {/* 상태 배지 */}
                <span
                  style={{
                    ...STATUS_BADGE_STYLE[t.status],
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 3,
                  }}
                >
                  {STATUS_LABEL[t.status]}
                </span>
                {/* 보조 태그 */}
                {t.tags.slice(1, 3).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 10,
                      color: "var(--color-text-muted)",
                      border: "1px solid var(--color-border)",
                      padding: "3px 8px",
                      borderRadius: 3,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" }}>
                {t.subtitle}
              </div>
              {/* 메타 그리드: 이모지 + 텍스트 (시안 L62~L66 그대로 — 변환 금지) */}
              <div
                style={{
                  fontSize: 13,
                  color: "var(--color-text-muted)",
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  columnGap: 10,
                  rowGap: 4,
                }}
              >
                <span>📅</span>
                <span>{t.dates}</span>
                <span>📍</span>
                <span>{t.court}</span>
                <span>💰</span>
                <span>
                  {t.prize} · 참가비 {t.fee}
                </span>
              </div>
              {/* 진행률 바 + 카운트 + CTA */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "auto" }}>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: "var(--color-surface)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(t.applied / t.capacity) * 100}%`,
                      height: "100%",
                      background:
                        t.status === "closing"
                          ? "var(--color-primary, #E31B23)"
                          : "var(--color-info, #0079B9)",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-muted)",
                    fontFamily: "monospace",
                  }}
                >
                  {t.applied}/{t.capacity}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen();
                  }}
                  style={{
                    background: "var(--color-primary, #E31B23)",
                    color: "#fff",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {t.status === "open" || t.status === "closing"
                    ? "신청"
                    : t.status === "live"
                      ? "라이브"
                      : "상세"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MatchDetail — 시안 L84~L280 박제 (탭별 콘텐츠 포함)
// ============================================================
type DetailTab = "overview" | "schedule" | "bracket" | "teams" | "rules";

function MatchDetail({ onBack }: { onBack: () => void }) {
  // 첫 번째 대회로 데모. 시안 L85 동일.
  const t = TOURNAMENTS[0];
  const [tab, setTab] = useState<DetailTab>("overview");

  // 참가팀 (시안 L87 박제)
  const appliedTeams = ["redeem", "monkeys", "3point", "kings", "zone", "pivot", "iron", "heat"]
    .map((id) => TEAMS.find((x) => x.id === id))
    .filter((x): x is Team => Boolean(x));

  const TABS: [DetailTab, string][] = [
    ["overview", "대회소개"],
    ["schedule", "경기일정"],
    ["bracket", "대진표"],
    ["teams", "참가팀"],
    ["rules", "규정"],
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 16px" }}>
      {/* 브레드크럼 (시안 L91~L97) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "var(--color-text-muted)",
          marginBottom: 10,
          whiteSpace: "nowrap",
          flexWrap: "wrap",
        }}
      >
        <a onClick={onBack} style={{ cursor: "pointer" }}>
          홈
        </a>
        <span>›</span>
        <a onClick={onBack} style={{ cursor: "pointer" }}>
          대회
        </a>
        <span>›</span>
        <span style={{ color: "var(--color-text-primary)" }}>{t.title}</span>
      </div>

      {/* 히어로: 그라디언트 배너 (시안 L99~L112) */}
      <div
        style={{
          background: `linear-gradient(135deg, ${t.accent}, ${t.accent}AA 50%, #0B0D10)`,
          color: "#fff",
          padding: "36px 32px",
          borderRadius: 12,
          position: "relative",
          overflow: "hidden",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: ".12em",
            fontWeight: 800,
            opacity: 0.85,
            marginBottom: 10,
          }}
        >
          {t.level} · {t.edition}
        </div>
        <h1 style={{ margin: "0 0 8px", fontSize: 48, letterSpacing: "-0.02em", fontWeight: 900 }}>
          {t.title}
        </h1>
        <div style={{ fontSize: 16, opacity: 0.9, marginBottom: 18 }}>{t.subtitle}</div>
        {/* 메타: 이모지 시안 그대로 (시안 L106~L110) */}
        <div
          style={{
            display: "flex",
            gap: 18,
            fontSize: 13,
            opacity: 0.9,
            flexWrap: "wrap",
          }}
        >
          <span>📅 {t.dates}</span>
          <span>📍 {t.court}</span>
          <span>💰 상금 {t.prize}</span>
          <span>👥 {t.format}</span>
        </div>
      </div>

      {/* 본문 2열: 좌측 탭 콘텐츠 / 우측 사이드바 (시안 L114~L277) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 340px",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        <div>
          {/* 탭 (시안 L116~L125) */}
          <div
            style={{
              display: "flex",
              borderBottom: "2px solid var(--color-border)",
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            {TABS.map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                style={{
                  padding: "12px 18px",
                  background: "transparent",
                  border: 0,
                  borderBottom:
                    tab === k
                      ? "3px solid var(--color-info, #0079B9)"
                      : "3px solid transparent",
                  color:
                    tab === k ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  fontWeight: tab === k ? 700 : 500,
                  fontSize: 14,
                  cursor: "pointer",
                  marginBottom: -2,
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* overview 탭 (시안 L127~L144) */}
          {tab === "overview" && (
            <div
              style={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                padding: "24px 26px",
              }}
            >
              <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 700 }}>대회 개요</h2>
              <p
                style={{
                  color: "var(--color-text-secondary)",
                  margin: "0 0 16px",
                  lineHeight: 1.7,
                }}
              >
                서울 3x3 농구의 정수를 겨루는 오픈 챔피언십. 더블 엘리미네이션 방식으로 16강부터
                결승까지 이틀간 진행됩니다. OPEN 레벨이므로 참가 자격 제한 없이, 팀 단위로 등록한
                누구나 참가 가능합니다.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "140px 1fr",
                  rowGap: 10,
                  columnGap: 16,
                  fontSize: 14,
                  padding: "14px 16px",
                  background: "var(--color-surface)",
                  borderRadius: 6,
                }}
              >
                <div style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>주최</div>
                <div>{t.host}</div>
                <div style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>문의</div>
                <div>{t.hostContact}</div>
                <div style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>경기장</div>
                <div>
                  {t.court} — {t.address}
                </div>
                <div style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>접수 기간</div>
                <div>{t.period}</div>
                <div style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>참가 방식</div>
                <div>
                  {t.format} · 참가비 {t.fee} ({t.feePerTeam ? "팀당" : "인당"})
                </div>
                <div style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>정원</div>
                <div>
                  {t.capacity}팀 (현재 {t.applied}팀 접수)
                </div>
                <div style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>우승상금</div>
                <div style={{ color: "var(--color-primary, #E31B23)", fontWeight: 700 }}>
                  {t.prize}
                </div>
              </div>
            </div>
          )}

          {/* schedule 탭 (시안 L146~L177) */}
          {tab === "schedule" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {SCHEDULE.map((day, di) => (
                <div
                  key={di}
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    padding: 0,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 18px",
                      borderBottom: "1px solid var(--color-border)",
                      background: "var(--color-surface)",
                      fontWeight: 700,
                    }}
                  >
                    {day.date}
                  </div>
                  {day.rows.map((r, ri) => {
                    const ta = r.teams[0] ? TEAMS.find((x) => x.id === r.teams[0]) : null;
                    const tb = r.teams[1] ? TEAMS.find((x) => x.id === r.teams[1]) : null;
                    return (
                      <div
                        key={ri}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "80px 60px 1fr auto",
                          gap: 14,
                          padding: "12px 18px",
                          borderBottom:
                            ri < day.rows.length - 1 ? "1px solid var(--color-border)" : 0,
                          alignItems: "center",
                        }}
                      >
                        <div style={{ fontFamily: "monospace", fontWeight: 700 }}>{r.time}</div>
                        <div>
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--color-text-muted)",
                              border: "1px solid var(--color-border)",
                              padding: "3px 8px",
                              borderRadius: 3,
                            }}
                          >
                            코트 {r.court}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--color-text-tertiary)",
                              marginRight: 6,
                              minWidth: 72,
                            }}
                          >
                            {r.label}
                          </span>
                          {ta && tb ? (
                            <>
                              <span style={{ fontWeight: 700 }}>{ta.name}</span>
                              <span
                                style={{
                                  color: "var(--color-text-tertiary)",
                                  fontFamily: "monospace",
                                }}
                              >
                                vs
                              </span>
                              <span style={{ fontWeight: 700 }}>{tb.name}</span>
                            </>
                          ) : (
                            <span style={{ color: "var(--color-text-tertiary)", fontSize: 13 }}>
                              이전 경기 승자
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => alert("상세는 준비 중입니다.")}
                          style={{
                            background: "var(--color-surface)",
                            color: "var(--color-text-secondary)",
                            border: "1px solid var(--color-border)",
                            padding: "5px 12px",
                            borderRadius: 4,
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          상세
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* bracket 탭 (시안 L179~L205) */}
          {tab === "bracket" && (
            <div
              style={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                padding: "22px 24px",
              }}
            >
              <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>16강 대진표</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 60px 1fr",
                  gap: 14,
                  alignItems: "center",
                }}
              >
                {BRACKET_R16.map((m, i) => {
                  const a = TEAMS.find((x) => x.id === m.a);
                  const b = TEAMS.find((x) => x.id === m.b);
                  if (!a || !b) return null;
                  return (
                    <BracketRow key={i} a={a} b={b} time={m.time} />
                  );
                })}
              </div>
            </div>
          )}

          {/* teams 탭 (시안 L207~L225) */}
          {tab === "teams" && (
            <div
              style={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 1fr 90px 100px 80px",
                  padding: "12px 18px",
                  background: "var(--color-surface)",
                  borderBottom: "1px solid var(--color-border)",
                  fontWeight: 700,
                  fontSize: 12,
                  color: "var(--color-text-muted)",
                }}
              >
                <div>#</div>
                <div>팀</div>
                <div>레이팅</div>
                <div>전적</div>
                <div>상태</div>
              </div>
              {appliedTeams.map((tm, i) => (
                <div
                  key={tm.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "56px 1fr 90px 100px 80px",
                    padding: "12px 18px",
                    borderBottom:
                      i < appliedTeams.length - 1 ? "1px solid var(--color-border)" : 0,
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 14 }}>{i + 1}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        background: tm.color,
                        color: tm.ink,
                        display: "grid",
                        placeItems: "center",
                        fontFamily: "monospace",
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 3,
                      }}
                    >
                      {tm.tag}
                    </span>
                    <span style={{ fontWeight: 600 }}>{tm.name}</span>
                  </div>
                  <div style={{ fontFamily: "monospace", fontWeight: 700 }}>{tm.rating}</div>
                  <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                    {tm.wins}W {tm.losses}L
                  </div>
                  <div>
                    <span
                      style={{
                        ...STATUS_BADGE_STYLE.open,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 3,
                      }}
                    >
                      확정
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* rules 탭 (시안 L227~L239) */}
          {tab === "rules" && (
            <div
              style={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                padding: "22px 26px",
              }}
            >
              <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 700 }}>경기 규정</h2>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.8,
                }}
              >
                <li>FIBA 3x3 공식 규정을 따릅니다.</li>
                <li>정규 시간은 10분이며, 21점 선취 시 경기 종료.</li>
                <li>동점 시 2분 연장, 2점 선취 시 종료.</li>
                <li>선수 등록은 최대 4명 (교체 1명 포함).</li>
                <li>팀 소속 증빙은 접수 마감 3일 전까지 필수.</li>
                <li>무단 불참 시 다음 대회 참가 제한 (1회).</li>
              </ul>
            </div>
          )}
        </div>

        {/* 사이드바: D-day + 참가비/상금 + 신청 버튼 (시안 L242~L276) */}
        <aside style={{ position: "sticky", top: 120 }}>
          <div
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              padding: 0,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 20px 14px",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: ".1em",
                  color: "var(--color-primary, #E31B23)",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                접수중
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 44,
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                    color: "var(--color-primary, #E31B23)",
                    lineHeight: 1,
                  }}
                >
                  D-14
                </span>
                <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>마감까지</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{t.period}</div>
            </div>
            <div
              style={{
                padding: "16px 20px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--color-text-tertiary)",
                    fontWeight: 600,
                    letterSpacing: ".04em",
                  }}
                >
                  참가비 (팀)
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, marginTop: 2 }}>{t.fee}</div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--color-text-tertiary)",
                    fontWeight: 600,
                    letterSpacing: ".04em",
                  }}
                >
                  상금
                </div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 18,
                    marginTop: 2,
                    color: "var(--color-primary, #E31B23)",
                  }}
                >
                  {t.prize}
                </div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ color: "var(--color-text-tertiary)" }}>접수 현황</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700 }}>
                    {t.applied}/{t.capacity}팀
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    background: "var(--color-surface)",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(t.applied / t.capacity) * 100}%`,
                      height: "100%",
                      background: "var(--color-info, #0079B9)",
                    }}
                  />
                </div>
              </div>
            </div>
            <div style={{ padding: "0 20px 20px" }}>
              <button
                onClick={() => alert("팀 신청은 준비 중입니다.")}
                style={{
                  background: "var(--color-primary, #E31B23)",
                  color: "#fff",
                  border: "none",
                  padding: "14px 18px",
                  borderRadius: 4,
                  fontWeight: 800,
                  fontSize: 16,
                  width: "100%",
                  cursor: "pointer",
                }}
              >
                팀으로 신청하기
              </button>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--color-text-tertiary)",
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                로그인된 팀:{" "}
                <b style={{ color: "var(--color-text-primary)" }}>리딤 (RDM)</b>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// 대진표 한 행 (시안 L186~L201) — 가독성을 위해 분리
function BracketRow({ a, b, time }: { a: Team; b: Team; time: string }) {
  return (
    <>
      <div
        style={{
          padding: "12px 14px",
          background: "var(--color-surface)",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            width: 24,
            height: 24,
            background: a.color,
            color: a.ink,
            display: "grid",
            placeItems: "center",
            fontFamily: "monospace",
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 3,
          }}
        >
          {a.tag}
        </span>
        <span style={{ fontWeight: 700, flex: 1 }}>{a.name}</span>
      </div>
      <div
        style={{
          textAlign: "center",
          fontFamily: "monospace",
          fontSize: 11,
          color: "var(--color-text-tertiary)",
        }}
      >
        <div>VS</div>
        <div style={{ fontSize: 10, marginTop: 2 }}>{time}</div>
      </div>
      <div
        style={{
          padding: "12px 14px",
          background: "var(--color-surface)",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            width: 24,
            height: 24,
            background: b.color,
            color: b.ink,
            display: "grid",
            placeItems: "center",
            fontFamily: "monospace",
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 3,
          }}
        >
          {b.tag}
        </span>
        <span style={{ fontWeight: 700, flex: 1 }}>{b.name}</span>
      </div>
    </>
  );
}

// ============================================================
// 페이지 엔트리: 목록 ↔ 상세 토글 (시안의 setRoute 대체)
// ============================================================
export default function MatchPage() {
  // 시안의 setRoute('matchDetail') / setRoute('match')는 이 view state로 대체
  const [view, setView] = useState<"list" | "detail">("list");

  return (
    <>
      {/* 준비 중 안내: 사용자 지침 — 모든 v2 박제는 상단에 1줄 안내 */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "12px 16px 0",
          fontSize: 12,
          color: "var(--color-text-muted)",
        }}
      >
        ⚙️ Match v2 시안 박제 (UI 미리보기 · 실데이터는{" "}
        <a href="/tournaments" style={{ color: "var(--color-info, #0079B9)" }}>
          /tournaments
        </a>{" "}
        에서 운영 중)
      </div>

      {view === "list" ? (
        <MatchList onOpen={() => setView("detail")} />
      ) : (
        <MatchDetail onBack={() => setView("list")} />
      )}
    </>
  );
}
