"use client";

/* ============================================================
 * /guest-apps — 게스트 지원 현황 (Guest Apps) v2 신규 — Phase 7
 *
 * 이유: BDR v2 디자인 적용 작업의 일환. 사용자가 다른 팀에 일회성
 *      참가로 지원한 내역(진행 중/완료·종료)을 한 화면에서 관리할
 *      랜딩이 필요함. 시안(Dev/design/BDR v2/screens/GuestApps.jsx)
 *      을 그대로 박제.
 *
 * 원칙 (사용자 지침: "DB 미지원 기능도 제거 금지 — UI 배치 + '준비 중' 표시"):
 *  - API/Prisma/서비스 0 변경. 데이터는 시안 박제(상수).
 *  - DB 0% 지원 → 정적 더미 데이터로 UI만 박제 (실 동작 0).
 *  - 페이지 상단에 "준비 중" 안내 1줄 노출.
 *  - 2탭 (active / past) + 게스트 프로필 요약 + 신뢰도 팁 3종.
 *
 * 데이터 추후 마이그레이션 (스코프 외 — 백로그):
 *  - guest_applications 모델 (게임 지원 내역, status enum, fee, paid)
 *  - guest_messages 모델 (지원 메시지 + 팀 답신/거절 사유)
 *  - guest_reviews 모델 (경기 후 팀 → 게스트 평점/한줄평)
 *  - User.guest_stats 집계 (총 지원/수락/승률/MVP/평균 평점/신뢰도)
 *
 * 참고: src/app/(web)/safety/page.tsx 동일 패턴 (인라인 style + Link).
 * ============================================================ */

import Link from "next/link";
import { useState } from "react";

// ---- 타입 정의 (TS strict) ----

// 진행/완료 공통 게임 정보
type GuestGame = {
  title: string;
  court: string;
  date: string;
  time: string;
};

// 진행 중(active) 지원 항목 — accepted/pending/shortlist 3종 status
type ActiveApp = {
  id: string;
  teamName: string;
  teamTag: string;
  teamColor: string;
  teamInk: string;
  game: GuestGame;
  status: "accepted" | "pending" | "shortlist";
  appliedAt: string;
  decidedAt?: string;
  role: string;
  teamMessage?: string;
  myMessage: string;
  fee: string;
  paid: boolean | null; // true=결제완료, false=미결제, null=무료/N/A
  pendingHours?: number;
};

// 완료·종료(past) 지원 항목 — completed/declined 2종 status
type PastApp = {
  id: string;
  teamName: string;
  teamTag: string;
  teamColor: string;
  teamInk: string;
  game: GuestGame;
  status: "completed" | "declined";
  appliedAt?: string;
  result?: string;
  mvp?: boolean;
  rating?: number;
  teamReview?: string;
  declinedReason?: string;
  myMessage?: string;
  fee: string;
  paid: boolean | null;
};

// 진행/완료 합집합 — 카드 컴포넌트에서 받아 분기
type GuestApp = ActiveApp | PastApp;

// 탭 상태 union
type Tab = "active" | "past";

// ---- 더미 데이터 (시안 그대로 박제) ----

// 진행 중: 수락(accepted) / 응답대기(pending) / 고려중(shortlist)
const ACTIVE: ActiveApp[] = [
  {
    id: "ga1",
    teamName: "SWEEP",
    teamTag: "SWP",
    teamColor: "#F59E0B",
    teamInk: "#000",
    game: {
      title: "주말 오전 픽업 — 성동",
      court: "성동구민체육관",
      date: "2026.04.28 (일)",
      time: "10:00 – 12:00",
    },
    status: "accepted",
    appliedAt: "2026.04.20 14:22",
    decidedAt: "2026.04.21 09:15",
    role: "포워드",
    teamMessage: "수준 좋으시네요. 일요일 뵐게요!",
    myMessage: "포워드 가능합니다. 게스트 경험 3회 있습니다.",
    fee: "₩8,000",
    paid: true,
  },
  {
    id: "ga2",
    teamName: "IRON WOLVES",
    teamTag: "IRW",
    teamColor: "#6B7280",
    teamInk: "#fff",
    game: {
      title: "평일 저녁 픽업 — 강남",
      court: "강남구민체육관",
      date: "2026.04.30 (화)",
      time: "20:00 – 22:00",
    },
    status: "pending",
    appliedAt: "2026.04.23 11:04",
    role: "가드",
    myMessage: "가드/포워드 모두 가능합니다. 주말 오후 시간 확보됩니다.",
    fee: "₩10,000",
    paid: false,
    pendingHours: 8,
  },
  {
    id: "ga3",
    teamName: "3POINT",
    teamTag: "3PT",
    teamColor: "#F59E0B",
    teamInk: "#000",
    game: {
      title: "스크림 옵저버 모집 — 잠실",
      court: "잠실학생체육관",
      date: "2026.04.29 (수)",
      time: "19:30 – 21:30",
    },
    status: "shortlist",
    appliedAt: "2026.04.21 19:47",
    role: "옵저버",
    teamMessage: "고려 중입니다. 내일 최종 결정해서 알려드릴게요.",
    myMessage: "스크림 관전도 좋고, 필요하면 합류도 가능합니다.",
    fee: "관람 무료",
    paid: null,
  },
];

// 완료·종료: 경기완료(completed) / 거절(declined)
const PAST: PastApp[] = [
  {
    id: "gp1",
    teamName: "KINGS CREW",
    teamTag: "KGS",
    teamColor: "#0EA5E9",
    teamInk: "#fff",
    game: {
      title: "화요일 저녁 테크노마트 게스트 2명",
      court: "테크노마트 스카이코트",
      date: "2026.04.15 (화)",
      time: "19:30 – 21:30",
    },
    status: "completed",
    result: "3전 2승 1패",
    mvp: true,
    rating: 5,
    teamReview: "실력·매너 모두 훌륭했습니다. 다음에 또 모시고 싶어요.",
    fee: "₩6,000",
    paid: true,
  },
  {
    id: "gp2",
    teamName: "THE ZONE",
    teamTag: "TZN",
    teamColor: "#8B5CF6",
    teamInk: "#fff",
    game: {
      title: "스크림 게스트 — 용산",
      court: "용산국민체육센터",
      date: "2026.04.02 (수)",
      time: "20:00 – 22:00",
    },
    status: "declined",
    declinedReason: "이미 다른 게스트 확정",
    fee: "₩8,000",
    paid: false,
  },
  {
    id: "gp3",
    teamName: "BLOCK",
    teamTag: "BLK",
    teamColor: "#10B981",
    teamInk: "#000",
    game: {
      title: "주말 오전 3x3",
      court: "하남미사체육관",
      date: "2026.03.23 (일)",
      time: "10:00 – 12:00",
    },
    status: "completed",
    result: "4전 3승 1패",
    rating: 4,
    teamReview: "좋은 게스트였습니다. 다만 수비 때 적극성 조금 아쉬움.",
    fee: "₩5,000",
    paid: true,
  },
];

// 게스트 프로필 통계 — 시안 박제 (DB 미존재)
const MY_STATS = {
  totalApps: 18,
  accepted: 12,
  winRate: 67,
  mvpCount: 2,
  avgRating: 4.6,
  reliability: 94,
};

// 신뢰도 팁 3종 — 이모지 시안 그대로 (Material Symbols 아닌 시안 의도 보존)
const RELIABILITY_TIPS: { icon: string; title: string; desc: string }[] = [
  { icon: "⚡", title: "빠른 응답", desc: "평균 응답 시간 4시간. 신뢰도에 반영됩니다." },
  { icon: "🎯", title: "수락률 향상", desc: "프로필·포지션이 상세할수록 수락률이 2배 올라갑니다." },
  { icon: "🏆", title: "게스트 뱃지", desc: "10회 이상·평점 4.5↑ 달성 시 \"프리미엄 게스트\" 뱃지 획득." },
];

// status별 라벨/색상 매핑 — 시안과 동일 (5종)
const STATUS_MAP: Record<
  ActiveApp["status"] | PastApp["status"],
  { label: string; color: string; bg: string }
> = {
  accepted: { label: "수락됨", color: "var(--ok)", bg: "rgba(28,160,94,.1)" },
  pending: { label: "응답 대기", color: "var(--warn)", bg: "rgba(232,163,59,.12)" },
  shortlist: { label: "고려 중", color: "var(--cafe-blue-deep)", bg: "var(--cafe-blue-soft)" },
  completed: { label: "경기 완료", color: "var(--ink-soft)", bg: "var(--bg-alt)" },
  declined: { label: "거절", color: "var(--danger)", bg: "rgba(226,76,75,.08)" },
};

// ============================================================
// 메인 페이지
// ============================================================
export default function GuestAppsPage() {
  // 탭 상태 — 시안과 동일하게 'active' 기본값
  const [tab, setTab] = useState<Tab>("active");

  // 현재 탭에 해당하는 리스트
  const list: GuestApp[] = tab === "active" ? ACTIVE : PAST;

  return (
    <div className="page">
      {/* 브레드크럼 — 시안의 setRoute 추상화를 Next.js Link로 대체 */}
      <div style={{ display: "flex", gap: 6, fontSize: 12, color: "var(--ink-mute)", marginBottom: 12 }}>
        <Link href="/" style={{ color: "inherit" }}>홈</Link>
        <span>›</span>
        <Link href="/profile" style={{ color: "inherit" }}>마이페이지</Link>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>게스트 지원 현황</span>
      </div>

      {/* 헤더 — 시안 h1 + 설명 + "준비 중" 안내 */}
      <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, letterSpacing: "-0.015em" }}>
        게스트 지원 현황
      </h1>
      <p style={{ margin: "0 0 6px", color: "var(--ink-mute)", fontSize: 14 }}>
        다른 팀에 일회성 참가로 지원한 내역을 관리하세요.
      </p>
      {/* "준비 중" 안내 — 사용자 지침 (DB 미지원, UI 미리보기) */}
      <p style={{ margin: "0 0 20px", color: "var(--ink-dim)", fontSize: 12, lineHeight: 1.5 }}>
        현재 게스트 신청 관리는 준비 중입니다. UI 미리보기로만 동작합니다.
      </p>

      {/* 게스트 프로필 요약 카드 — 좌(이니셜 박스) + 중(이름·신뢰도·통계) + 우(CTA) */}
      <div
        className="card"
        style={{
          padding: "20px 22px",
          marginBottom: 20,
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gap: 18,
          alignItems: "center",
        }}
      >
        {/* 이니셜 박스 — 시안 그대로 'RDM' 박제 (로그인 유저명 없으므로) */}
        <div
          style={{
            width: 60,
            height: 60,
            background: "var(--bdr-red)",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--ff-mono)",
            fontWeight: 700,
            fontSize: 14,
            borderRadius: 8,
          }}
        >
          RDM
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>rdm_captain 님의 게스트 이력</div>
            <span className="badge badge--red">신뢰도 {MY_STATS.reliability}%</span>
          </div>
          <div style={{ display: "flex", gap: 18, fontSize: 12.5, color: "var(--ink-mute)", flexWrap: "wrap" }}>
            <span>
              총 지원 <b style={{ color: "var(--ink)", fontFamily: "var(--ff-mono)" }}>{MY_STATS.totalApps}</b>회
            </span>
            <span>
              수락 <b style={{ color: "var(--ok)", fontFamily: "var(--ff-mono)" }}>{MY_STATS.accepted}</b>회
            </span>
            <span>
              승률 <b style={{ color: "var(--ink)", fontFamily: "var(--ff-mono)" }}>{MY_STATS.winRate}%</b>
            </span>
            <span>
              MVP <b style={{ color: "var(--accent)", fontFamily: "var(--ff-mono)" }}>{MY_STATS.mvpCount}</b>회
            </span>
            <span>
              평점 <b style={{ color: "var(--ink)", fontFamily: "var(--ff-mono)" }}>★ {MY_STATS.avgRating}</b>
            </span>
          </div>
        </div>
        {/* CTA — '게스트 찾기'는 게임 목록(/games)으로 연결 */}
        <Link href="/games" className="btn btn--sm" style={{ textDecoration: "none" }}>
          게스트 찾기 →
        </Link>
      </div>

      {/* 신뢰도 팁 3종 — 이모지 + 제목 + 설명 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
        {RELIABILITY_TIPS.map((t) => (
          <div
            key={t.title}
            style={{
              padding: "14px 16px",
              background: "var(--bg-alt)",
              borderRadius: 6,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <div style={{ fontSize: 20 }}>{t.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12.5 }}>{t.title}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-mute)", marginTop: 2, lineHeight: 1.5 }}>{t.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 탭 네비 — cafe-blue 하단 라인 (safety/help 동일 패턴) */}
      <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
        {(
          [
            { id: "active", label: "진행 중", count: ACTIVE.length },
            { id: "past", label: "완료·종료", count: PAST.length },
          ] as { id: Tab; label: string; count: number }[]
        ).map((t) => (
          <button
            key={t.id}
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
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* 지원 카드 리스트 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {list.map((a) => (
          <GuestRow key={a.id} a={a} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 지원 카드 한 건
// ============================================================
function GuestRow({ a }: { a: GuestApp }) {
  const s = STATUS_MAP[a.status];
  const g = a.game;

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 16, alignItems: "flex-start" }}>
          {/* 팀 뱃지 (좌측) */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div
              style={{
                width: 56,
                height: 56,
                background: a.teamColor,
                color: a.teamInk,
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--ff-display)",
                fontWeight: 900,
                fontSize: 15,
                borderRadius: 6,
              }}
            >
              {a.teamTag}
            </div>
            <div style={{ fontSize: 10, color: "var(--ink-dim)", fontWeight: 600 }}>{a.teamName}</div>
          </div>

          {/* 본문 (중앙) */}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
              {/* status 배지 (점 + 라벨 + pendingHours 옵션) */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 8px",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: ".04em",
                  color: s.color,
                  background: s.bg,
                  borderRadius: 4,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
                {s.label}
                {a.status === "pending" && (a as ActiveApp).pendingHours && (
                  <span style={{ opacity: 0.7 }}>· {(a as ActiveApp).pendingHours}h 경과</span>
                )}
              </span>
              {/* 포지션 배지 (active만) */}
              {"role" in a && a.role && <span className="badge badge--ghost">포지션 · {a.role}</span>}
              {/* MVP 배지 (past completed에서만 mvp=true) */}
              {a.status === "completed" && (a as PastApp).mvp && <span className="badge badge--red">MVP</span>}
            </div>

            {/* 게임 타이틀 + 메타 */}
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{g.title}</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-mute)", display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span>📅 {g.date} · {g.time}</span>
              <span>📍 {g.court}</span>
              <span>
                💳 {a.fee}
                {a.paid === true ? " · 결제완료" : a.paid === false ? " · 미결제" : ""}
              </span>
            </div>

            {/* 결과 (past completed) */}
            {a.status === "completed" && (a as PastApp).result && (
              <div style={{ marginTop: 6, fontSize: 13 }}>
                <span style={{ color: "var(--ink-dim)" }}>결과 · </span>
                <b>{(a as PastApp).result}</b>
              </div>
            )}
          </div>

          {/* 액션 버튼 (우측) — status별 분기 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 120, alignItems: "stretch" }}>
            {a.status === "accepted" && (
              <>
                <Link href="/games" className="btn btn--primary btn--sm" style={{ textDecoration: "none", textAlign: "center" }}>
                  경기 상세
                </Link>
                <button className="btn btn--sm" type="button">팀과 채팅</button>
                <button className="btn btn--sm" type="button" style={{ color: "var(--danger)" }}>참가 취소</button>
              </>
            )}
            {a.status === "pending" && (
              <>
                <button className="btn btn--sm" type="button">팀에 문의</button>
                <button className="btn btn--sm" type="button" style={{ color: "var(--danger)" }}>지원 철회</button>
              </>
            )}
            {a.status === "shortlist" && (
              <>
                <button className="btn btn--sm" type="button">팀과 채팅</button>
                <button className="btn btn--sm" type="button" style={{ color: "var(--danger)" }}>지원 철회</button>
              </>
            )}
            {a.status === "completed" && (
              <>
                <button className="btn btn--primary btn--sm" type="button">후기 남기기</button>
                <Link href="/teams" className="btn btn--sm" style={{ textDecoration: "none", textAlign: "center" }}>
                  다시 지원
                </Link>
              </>
            )}
            {a.status === "declined" && (
              <Link href="/teams" className="btn btn--sm" style={{ textDecoration: "none", textAlign: "center" }}>
                팀 보기
              </Link>
            )}
          </div>
        </div>

        {/* 메시지 스레드 — 내 지원/팀 답신/팀 평가/거절 사유 4종 */}
        {(a.myMessage ||
          ("teamMessage" in a && a.teamMessage) ||
          ("teamReview" in a && a.teamReview) ||
          ("declinedReason" in a && a.declinedReason)) && (
          <div
            style={{
              marginTop: 14,
              padding: "14px 16px",
              background: "var(--bg-alt)",
              borderRadius: 6,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {/* 내 지원 메시지 */}
            {a.myMessage && (
              <div style={{ display: "flex", gap: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    background: "var(--bdr-red)",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--ff-mono)",
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 4,
                    flexShrink: 0,
                  }}
                >
                  나
                </div>
                <div style={{ flex: 1, fontSize: 13 }}>
                  <div style={{ fontSize: 11, color: "var(--ink-dim)", marginBottom: 2 }}>
                    내 지원 메시지{a.appliedAt ? ` · ${a.appliedAt}` : ""}
                  </div>
                  <div style={{ color: "var(--ink-soft)" }}>&quot;{a.myMessage}&quot;</div>
                </div>
              </div>
            )}

            {/* 팀 답신 (active의 teamMessage) */}
            {"teamMessage" in a && a.teamMessage && (
              <div style={{ display: "flex", gap: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    background: a.teamColor,
                    color: a.teamInk,
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--ff-mono)",
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 4,
                    flexShrink: 0,
                  }}
                >
                  {a.teamTag.slice(0, 2)}
                </div>
                <div style={{ flex: 1, fontSize: 13 }}>
                  <div style={{ fontSize: 11, color: "var(--ink-dim)", marginBottom: 2 }}>
                    {a.teamName} 답신{(a as ActiveApp).decidedAt ? ` · ${(a as ActiveApp).decidedAt}` : ""}
                  </div>
                  <div style={{ color: "var(--ink-soft)" }}>&quot;{a.teamMessage}&quot;</div>
                </div>
              </div>
            )}

            {/* 팀 평가 (past completed의 teamReview + rating) */}
            {"teamReview" in a && a.teamReview && (
              <div style={{ display: "flex", gap: 10, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    background: a.teamColor,
                    color: a.teamInk,
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--ff-mono)",
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 4,
                    flexShrink: 0,
                  }}
                >
                  {a.teamTag.slice(0, 2)}
                </div>
                <div style={{ flex: 1, fontSize: 13 }}>
                  <div style={{ fontSize: 11, color: "var(--ink-dim)", marginBottom: 2 }}>
                    {a.teamName} 게스트 평가 ·{" "}
                    <span style={{ color: "var(--accent)" }}>
                      {"★".repeat((a as PastApp).rating ?? 0)}
                      {"☆".repeat(5 - ((a as PastApp).rating ?? 0))}
                    </span>
                  </div>
                  <div style={{ color: "var(--ink-soft)" }}>&quot;{a.teamReview}&quot;</div>
                </div>
              </div>
            )}

            {/* 거절 사유 (past declined) */}
            {"declinedReason" in a && a.declinedReason && (
              <div style={{ fontSize: 12.5, color: "var(--ink-mute)", fontStyle: "italic" }}>
                사유 · {a.declinedReason}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
