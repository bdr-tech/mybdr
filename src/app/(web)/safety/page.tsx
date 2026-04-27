"use client";

/* ============================================================
 * /safety — 안전·차단 센터 (Safety) v2 신규 — Phase 6-5
 *
 * 이유: BDR v2 디자인 적용 작업의 일환. 사용자가 차단·신고·금칙어·
 *      프라이버시를 한 화면에서 관리할 수 있는 랜딩이 필요함.
 *      시안(Dev/design/BDR v2/screens/Safety.jsx)을 그대로 박제.
 *
 * 원칙 (사용자 지침: "모든 페이지는 실사용. DB 미지원 기능도 제거 금지"):
 *  - API/Prisma/서비스 0 변경. 데이터는 시안 박제(상수).
 *  - DB 0% 지원 → 정적 더미 데이터로 UI만 박제 (실 동작 0).
 *  - 페이지 상단에 "준비 중" 안내 1줄 노출.
 *  - 4탭 (blocks / reports / muted / privacy) + 상단 stat strip 4개.
 *
 * 데이터 추후 마이그레이션 (스코프 외):
 *  - user_blocks 모델 (차단 사용자 목록)
 *  - reports 모델 (신고 내역 + 운영팀 처리 워크플로)
 *  - muted_words 모델 (금칙어 + 범위)
 *  - user_privacy_settings 모델 (DM/초대/멘션/검색/위치 노출)
 *
 * 참고: src/app/(web)/help/page.tsx, src/app/(web)/saved/page.tsx 동일 패턴.
 * ============================================================ */

import Link from "next/link";
import { useState } from "react";

// 차단 목록 더미 — 시안 그대로 박제. DB 모델 미존재.
const BLOCKS: { id: number; user: string; level: string; reason: string; date: string; scope: string }[] = [
  { id: 1, user: "trolling_kid", level: "L.2", reason: "욕설·인신공격", date: "2026.04.15", scope: "전체" },
  { id: 2, user: "spam_account", level: "L.1", reason: "스팸·광고", date: "2026.03.28", scope: "DM·댓글" },
  { id: 3, user: "late_dropper", level: "L.4", reason: "반복 노쇼", date: "2026.03.12", scope: "매치" },
  { id: 4, user: "rough_player88", level: "L.6", reason: "경기 매너 불량", date: "2026.02.04", scope: "전체" },
];

// 신고 내역 더미 — 시안 그대로. status 3종(처리완료/조사중/접수) + priority 3종(high/mid/low).
const REPORTS: {
  id: number;
  target: string;
  targetType: string;
  title: string;
  status: string;
  result: string;
  date: string;
  priority: string;
}[] = [
  {
    id: 101,
    target: "flame_comment",
    targetType: "게시글",
    title: "자유게시판 #192 — 혐오 발언",
    status: "처리완료",
    result: "게시글 삭제·작성자 7일 정지",
    date: "2026.04.18",
    priority: "high",
  },
  {
    id: 102,
    target: "no_show_team",
    targetType: "팀",
    title: "BDR Challenge 예선 무단 불참",
    status: "조사중",
    result: "팀장 소명 요청 단계",
    date: "2026.04.14",
    priority: "mid",
  },
  {
    id: 103,
    target: "fake_review",
    targetType: "리뷰",
    title: "코트 리뷰 허위사실 기재",
    status: "접수",
    result: "운영팀 검토 대기",
    date: "2026.04.20",
    priority: "low",
  },
  {
    id: 104,
    target: "dm_harassment",
    targetType: "DM",
    title: "반복적인 부적절 메시지",
    status: "처리완료",
    result: "차단·경고 · 재발 시 영구정지",
    date: "2026.03.30",
    priority: "high",
  },
];

// 금칙어 더미 — 시안 그대로. scope: 적용 범위(전체/게시판/댓글/DM).
const MUTED: { word: string; scope: string; since: string }[] = [
  { word: "낚시글", scope: "게시판", since: "2026.04.01" },
  { word: "도박", scope: "전체", since: "2026.03.15" },
];

// 프라이버시 설정 더미 — 5종. opts 중 value와 일치하는 것이 현재 선택된 옵션.
const PRIV: { key: string; label: string; value: string; opts: string[] }[] = [
  { key: "dm", label: "DM 수신", value: "팔로우한 유저만", opts: ["전체 허용", "팔로우한 유저만", "차단"] },
  { key: "invite", label: "팀 초대", value: "L.3 이상", opts: ["전체 허용", "L.3 이상", "친구만", "차단"] },
  { key: "mention", label: "멘션 알림", value: "팔로워만", opts: ["전체", "팔로워만", "없음"] },
  { key: "search", label: "이름 검색 노출", value: "허용", opts: ["허용", "차단"] },
  { key: "location", label: "활동 지역 표시", value: "구(區) 단위까지", opts: ["시/도", "구(區)", "상세 주소 없음"] },
];

// 탭 4종 타입 — TS strict 호환을 위해 union 명시
type Tab = "blocks" | "reports" | "muted" | "privacy";

export default function SafetyPage() {
  // 탭 상태 — 시안과 동일하게 'blocks' 기본값
  const [tab, setTab] = useState<Tab>("blocks");

  // stat strip 계산값 — 더미 데이터 기준 즉시 계산 (메모 불필요)
  const monthlyReports = REPORTS.filter((r) => r.date.startsWith("2026.04")).length;
  const doneReports = REPORTS.filter((r) => r.status === "처리완료").length;
  const pendingReports = REPORTS.filter((r) => r.status !== "처리완료").length;

  return (
    <div className="page">
      {/* 브레드크럼 — 시안의 setRoute 추상화를 Next.js Link로 대체 */}
      <div style={{ display: "flex", gap: 6, fontSize: 12, color: "var(--ink-mute)", marginBottom: 12 }}>
        <Link href="/" style={{ color: "inherit" }}>홈</Link>
        <span>›</span>
        <Link href="/settings" style={{ color: "inherit" }}>설정</Link>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>안전·차단</span>
      </div>

      {/* 헤더 — eyebrow + h1 + 설명 */}
      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow">SAFETY · 안전 센터</div>
        <h1 style={{ margin: "4px 0 6px", fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}>
          괜찮은 농구 경험을 위해
        </h1>
        <p style={{ margin: 0, color: "var(--ink-mute)", fontSize: 14, maxWidth: 680, lineHeight: 1.6 }}>
          차단·신고·프라이버시를 한 곳에서 관리하세요. 신고는 운영팀이 48시간 내 검토하며, 차단은 즉시 적용됩니다.
        </p>
        {/* "준비 중" 안내 — 사용자 지침: DB 미지원 기능은 제거 금지, 빈 상태/안내로 표시 */}
        <p style={{ margin: "8px 0 0", color: "var(--ink-dim)", fontSize: 12, lineHeight: 1.5 }}>
          현재 안전 센터는 준비 중입니다. UI 미리보기로만 동작합니다.
        </p>
      </div>

      {/* Stat strip — 4개 카드, 좌측 색상 보더 강조 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
        {(
          [
            { label: "현재 차단", value: BLOCKS.length, color: "var(--ink)" },
            { label: "이번달 신고", value: monthlyReports, color: "var(--accent)" },
            { label: "처리완료", value: doneReports, color: "var(--ok)" },
            { label: "처리중", value: pendingReports, color: "var(--cafe-blue-deep)" },
          ] as { label: string; value: number; color: string }[]
        ).map((s) => (
          <div key={s.label} className="card" style={{ padding: "14px 18px", borderLeft: `3px solid ${s.color}` }}>
            <div
              style={{
                fontSize: 10,
                color: "var(--ink-dim)",
                fontWeight: 700,
                letterSpacing: ".08em",
                textTransform: "uppercase",
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontFamily: "var(--ff-display)",
                fontSize: 28,
                fontWeight: 900,
                marginTop: 3,
                color: s.color,
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* 탭 네비 — cafe-blue 하단 라인 (help/page.tsx 동일 패턴) */}
      <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
        {(
          [
            { id: "blocks", label: "차단 목록", n: BLOCKS.length },
            { id: "reports", label: "신고 내역", n: REPORTS.length },
            { id: "muted", label: "금칙어", n: MUTED.length },
            { id: "privacy", label: "프라이버시" },
          ] as { id: Tab; label: string; n?: number }[]
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
            {t.n !== undefined && (
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
            )}
          </button>
        ))}
      </div>

      {/* 탭 1: 차단 목록 — 게시판 형식 (board__head + board__row) */}
      {tab === "blocks" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
              차단된 사용자는 DM·멘션·팀 초대를 보낼 수 없습니다.
            </div>
            <button className="btn btn--sm">+ 유저 차단</button>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="board__head" style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr 100px" }}>
              <div style={{ textAlign: "left" }}>사용자</div>
              <div>사유</div>
              <div>범위</div>
              <div>차단일</div>
              <div></div>
            </div>
            {BLOCKS.map((b) => (
              <div
                key={b.id}
                className="board__row"
                style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr 100px", alignItems: "center" }}
              >
                <div className="title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {/* 아바타 placeholder — 유저명 앞 2글자 대문자 */}
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: "var(--ink-soft)",
                      color: "var(--bg)",
                      display: "grid",
                      placeItems: "center",
                      fontFamily: "var(--ff-mono)",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {b.user.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <b>{b.user}</b>{" "}
                    <span className="badge badge--ghost" style={{ marginLeft: 4, fontSize: 9 }}>
                      {b.level}
                    </span>
                  </div>
                </div>
                <div>{b.reason}</div>
                <div>
                  <span className="badge badge--soft">{b.scope}</span>
                </div>
                <div style={{ fontFamily: "var(--ff-mono)", color: "var(--ink-dim)", fontSize: 12 }}>{b.date}</div>
                <div>
                  <button className="btn btn--sm" style={{ fontSize: 11 }}>
                    해제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 탭 2: 신고 내역 — 카드 그리드 (1fr auto) */}
      {tab === "reports" && (
        <div>
          <div style={{ fontSize: 13, color: "var(--ink-mute)", marginBottom: 10 }}>
            운영팀이 24–48시간 내 검토합니다. 처리결과는 알림으로 전달됩니다.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {REPORTS.map((r) => (
              <div
                key={r.id}
                className="card"
                style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr auto", gap: 14 }}
              >
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <span className="badge badge--ghost">{r.targetType}</span>
                    {/* status별 배지 색상 분기 — 처리완료=ok, 조사중=warn, 접수=soft */}
                    <span
                      className={`badge ${
                        r.status === "처리완료"
                          ? "badge--ok"
                          : r.status === "조사중"
                            ? "badge--warn"
                            : "badge--soft"
                      }`}
                    >
                      {r.status}
                    </span>
                    {r.priority === "high" && <span className="badge badge--red">긴급</span>}
                    <span style={{ fontSize: 11, color: "var(--ink-dim)", fontFamily: "var(--ff-mono)" }}>
                      #{r.id}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                    대상 · <b style={{ color: "var(--ink-soft)" }}>{r.target}</b>
                  </div>
                  {/* 처리 결과 박스 — accent 좌측 보더로 강조 */}
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--ink-soft)",
                      marginTop: 8,
                      padding: "8px 10px",
                      background: "var(--bg-alt)",
                      borderRadius: 4,
                      borderLeft: "2px solid var(--accent)",
                    }}
                  >
                    처리 결과 · {r.result}
                  </div>
                </div>
                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontFamily: "var(--ff-mono)", fontSize: 11, color: "var(--ink-dim)" }}>{r.date}</div>
                  <button className="btn btn--sm" style={{ fontSize: 11 }}>
                    상세
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* 신고 기준 안내 박스 */}
          <div
            style={{
              marginTop: 12,
              padding: "14px 18px",
              background: "var(--bg-alt)",
              borderRadius: 6,
              fontSize: 12.5,
              color: "var(--ink-mute)",
              lineHeight: 1.6,
            }}
          >
            <b style={{ color: "var(--ink)" }}>💡 신고 기준</b> — 욕설·혐오·도박/사기 광고·반복 노쇼·허위 신분·비매너 행동.
            단순 의견 차이는 신고 대상이 아닙니다.
          </div>
        </div>
      )}

      {/* 탭 3: 금칙어 — 입력 + 칩 형태 표시 */}
      {tab === "muted" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input className="input" placeholder="차단할 단어 입력 (예: 낚시, 도박)" style={{ flex: 1 }} />
            <select className="input" style={{ width: 140 }}>
              <option>전체</option>
              <option>게시판</option>
              <option>댓글</option>
              <option>DM</option>
            </select>
            <button className="btn btn--primary">추가</button>
          </div>
          {/* 등록된 금칙어 — 칩 형태 (단어 + 범위·등록일 + 삭제 X) */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {MUTED.map((m) => (
              <span
                key={m.word}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px 6px 12px",
                  background: "var(--bg-alt)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  fontSize: 13,
                }}
              >
                <b>{m.word}</b>
                <span style={{ fontSize: 10, color: "var(--ink-dim)", fontFamily: "var(--ff-mono)" }}>
                  {m.scope} · {m.since}
                </span>
                <button
                  style={{
                    background: "transparent",
                    border: 0,
                    color: "var(--ink-dim)",
                    cursor: "pointer",
                    fontSize: 14,
                    padding: 0,
                  }}
                  aria-label={`${m.word} 삭제`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div style={{ marginTop: 20, fontSize: 13, color: "var(--ink-mute)", lineHeight: 1.7 }}>
            등록된 단어가 포함된 게시글·댓글·DM은 피드에서 자동으로 가려집니다. 직접 선택해서 열 수는 있습니다.
          </div>
        </div>
      )}

      {/* 탭 4: 프라이버시 — 항목별 옵션 토글 (현재 선택값은 btn--primary) */}
      {tab === "privacy" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {PRIV.map((p, i) => (
            <div
              key={p.key}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.4fr",
                gap: 20,
                padding: "18px 24px",
                borderBottom: i < PRIV.length - 1 ? "1px solid var(--border)" : 0,
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{p.label}</div>
                <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 3 }}>
                  현재 · <b style={{ color: "var(--ink-soft)" }}>{p.value}</b>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {p.opts.map((o) => (
                  <button
                    key={o}
                    className={`btn ${o === p.value ? "btn--primary" : ""} btn--sm`}
                    style={{ fontSize: 12 }}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
