"use client";

/* ============================================================
 * ReviewsContent — /reviews v2 클라이언트 (4탭 + 정렬 + 카드)
 *
 * 왜 클라이언트:
 * - PM 결정(C안 Saved 패턴): 4탭 필터링 + 정렬 = useState 단일 상태.
 *   서버에서 court 리뷰 prefetch + 다른 3탭은 빈 배열 → 클라가 활성 탭에 따라 표시.
 *
 * 4탭 구성: 전체 / 대회 / 코트 / 팀 / 심판
 *   → 시안과 동일하나 "전체" 탭에서는 court 만 표시 (다른 3종은 데이터 0)
 *
 * 데이터 가용성:
 *   - court (court_reviews) ← 실데이터
 *   - tournament / team / referee ← 모델 없음 → 빈 안내 카드
 *
 * 디자인:
 *   - Dev/design/BDR v2/screens/Reviews.jsx 시안 그대로
 *   - 헤더 우측 요약 카드 (총 리뷰 수 / 평균별점 / 별점 분포)
 *   - 컨트롤 바: 타입 필터(button) + 정렬 select + "+ 리뷰 쓰기"(disabled)
 *   - 카드: 180px(타입라벨+target) | 1fr(별점+제목+본문+태그+작성자) | auto(도움됨/신고/♥)
 * ============================================================ */

import { useMemo, useState } from "react";
import Link from "next/link";

// ---- 서버 → 클라 데이터 타입 (page.tsx 와 일치) ----
export interface CourtReviewItem {
  id: string;
  courtId: string;
  target: string;        // 코트 이름
  targetSub: string;     // 시 + 구 또는 주소
  rating: number;        // 1~5
  title: string;
  body: string;
  likes: number;
  helpful: number;
  photos: number;
  verified: boolean;
  author: string;
  authorLevel: string;   // 현재 "L.—" 폴백
  createdAt: string;     // ISO
}

// 4탭 정의 — 시안과 동일 (전체/대회/코트/팀/심판)
type TabId = "all" | "tournament" | "court" | "team" | "referee";

// "준비 중" 안내가 필요한 3개 탭 (court 만 실데이터)
const PENDING_TABS: TabId[] = ["tournament", "team", "referee"];

// 정렬 모드
type SortId = "recent" | "rating" | "helpful";

// 시안의 typeColor 매핑 — 상단 라벨 색
const TYPE_COLOR: Record<Exclude<TabId, "all">, string> = {
  tournament: "var(--accent)",
  court: "var(--cafe-blue)",
  team: "var(--ok)",
  referee: "#8B5CF6",
};

const TYPE_LABEL: Record<Exclude<TabId, "all">, string> = {
  tournament: "대회",
  court: "코트",
  team: "팀",
  referee: "심판",
};

// ISO → "YYYY.MM.DD" mono 표기 (Saved.jsx / Reviews.jsx 시안과 동일)
function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// 별점 시각화 — 시안 ★ ★ ★ ★ ☆ 패턴 (CSS color로 채움/빈칸 구분)
function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span style={{ color: "var(--accent)", fontSize: size, lineHeight: 1 }}>
      {"★".repeat(filled)}
      <span style={{ color: "var(--border)" }}>{"★".repeat(5 - filled)}</span>
    </span>
  );
}

export interface ReviewsContentProps {
  courts: CourtReviewItem[];
}

export function ReviewsContent({ courts }: ReviewsContentProps) {
  const [tab, setTab] = useState<TabId>("all");
  const [sort, setSort] = useState<SortId>("recent");

  // ---- 요약 통계 (시안 우상단 카드) ----
  // 평균/분포는 court 리뷰만 대상 (실데이터). 다른 3탭은 0건이라 영향 없음.
  const summary = useMemo(() => {
    const total = courts.length;
    if (total === 0) {
      return {
        total: 0,
        avg: "0.0",
        dist: [0, 0, 0, 0, 0],
        verified: 0,
      };
    }
    const sum = courts.reduce((acc, r) => acc + r.rating, 0);
    const avg = (sum / total).toFixed(1);
    // dist[0]=5★ 개수, dist[4]=1★ 개수 (시안과 동일 [5,4,3,2,1] 순서)
    const dist = [5, 4, 3, 2, 1].map((n) => courts.filter((r) => r.rating === n).length);
    const verified = courts.filter((r) => r.verified).length;
    return { total, avg, dist, verified };
  }, [courts]);

  // ---- 탭별 카운트 ----
  const counts = useMemo(
    () => ({
      all: courts.length, // 전체 = 현재는 court 만 (다른 3탭 0건)
      tournament: 0,
      court: courts.length,
      team: 0,
      referee: 0,
    }),
    [courts.length]
  );

  // ---- 활성 탭 필터링 ----
  // tournament/team/referee 는 빈 배열. all/court 만 court 데이터 노출.
  const visibleCourts = useMemo<CourtReviewItem[]>(() => {
    if (tab === "all" || tab === "court") return courts;
    return [];
  }, [tab, courts]);

  // ---- 정렬 ----
  const sortedCourts = useMemo<CourtReviewItem[]>(() => {
    const arr = [...visibleCourts];
    if (sort === "rating") {
      // 별점 내림차순 → 동점은 최신순
      arr.sort((a, b) => b.rating - a.rating || b.createdAt.localeCompare(a.createdAt));
    } else if (sort === "helpful") {
      // 도움됨 내림차순 → 동점은 최신순
      arr.sort((a, b) => b.helpful - a.helpful || b.createdAt.localeCompare(a.createdAt));
    } else {
      // recent: ISO 비교 = 시각 내림차순
      arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return arr;
  }, [visibleCourts, sort]);

  // 미지원 탭 클릭 → 안내 카드
  const showPending = PENDING_TABS.includes(tab);
  // 전체/court 탭에서 0건일 때 안내
  const showCourtsEmpty = (tab === "all" || tab === "court") && courts.length === 0;

  // 탭 정의 (label + count)
  const tabs: { id: TabId; label: string }[] = [
    { id: "all", label: "전체" },
    { id: "tournament", label: "대회" },
    { id: "court", label: "코트" },
    { id: "team", label: "팀" },
    { id: "referee", label: "심판" },
  ];

  return (
    <div className="page">
      {/* breadcrumb — 시안 그대로 */}
      <div style={{ display: "flex", gap: 6, fontSize: 12, color: "var(--ink-mute)", marginBottom: 12 }}>
        <Link href="/" style={{ color: "var(--ink-mute)" }}>
          홈
        </Link>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>리뷰</span>
      </div>

      {/* ====== 헤더 — 좌측 타이틀 + 우측 요약 카드 (시안 2열 그리드) ====== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 360px",
          gap: 16,
          marginBottom: 18,
        }}
      >
        <div>
          <div className="eyebrow">커뮤니티 리뷰 · REVIEWS</div>
          <h1 style={{ margin: "4px 0 8px", fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}>
            다녀온 사람들의 진짜 후기
          </h1>
          <p style={{ margin: 0, color: "var(--ink-mute)", fontSize: 14, maxWidth: 560, lineHeight: 1.6 }}>
            실제 방문 인증된 리뷰만 모았습니다. 별점·사진·해시태그로 빠르게 훑어보고, 도움된 리뷰에 투표하세요.
          </p>
        </div>

        {/* 요약 카드 — 평균별점 + 분포바 */}
        <div className="card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
            <div
              style={{
                fontFamily: "var(--ff-display)",
                fontSize: 44,
                fontWeight: 900,
                letterSpacing: "-0.03em",
              }}
            >
              {summary.avg}
            </div>
            <div>
              <StarRow rating={Number(summary.avg)} size={16} />
              <div style={{ fontSize: 11, color: "var(--ink-mute)", fontFamily: "var(--ff-mono)" }}>
                {summary.total}개 리뷰 · 인증 {summary.verified}
              </div>
            </div>
          </div>

          {/* 별점 분포 바 5행 (5★ → 1★) */}
          {[5, 4, 3, 2, 1].map((n, i) => {
            const cnt = summary.dist[i];
            const pct = summary.total > 0 ? (cnt / summary.total) * 100 : 0;
            // 시안: 4-5★=ok / 3★=accent / 1-2★=err
            const barColor = n >= 4 ? "var(--ok)" : n >= 3 ? "var(--accent)" : "var(--err)";
            return (
              <div
                key={n}
                style={{
                  display: "grid",
                  gridTemplateColumns: "20px 1fr 32px",
                  gap: 8,
                  alignItems: "center",
                  fontSize: 11,
                  marginBottom: 3,
                }}
              >
                <span style={{ fontFamily: "var(--ff-mono)", color: "var(--ink-dim)" }}>{n}★</span>
                <div style={{ height: 6, background: "var(--bg-alt)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: barColor }} />
                </div>
                <span
                  style={{
                    fontFamily: "var(--ff-mono)",
                    color: "var(--ink-dim)",
                    textAlign: "right",
                  }}
                >
                  {cnt}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====== 컨트롤 바 — 타입 필터 + 정렬 + 리뷰쓰기 ====== */}
      <div
        className="card"
        style={{
          padding: "12px 14px",
          marginBottom: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* 타입 필터 5개 (시안과 동일) */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {tabs.map((f) => {
            const active = tab === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setTab(f.id)}
                className={`btn btn--sm ${active ? "btn--primary" : ""}`}
              >
                {f.label}
                {f.id !== "all" && (
                  <span
                    style={{
                      marginLeft: 4,
                      opacity: 0.7,
                      fontFamily: "var(--ff-mono)",
                    }}
                  >
                    {counts[f.id]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 정렬 select + 리뷰쓰기(disabled) */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
          <span style={{ color: "var(--ink-mute)" }}>정렬</span>
          <select
            className="input"
            style={{ padding: "4px 8px", fontSize: 12 }}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortId)}
          >
            <option value="recent">최신순</option>
            <option value="rating">별점순</option>
            <option value="helpful">도움순</option>
          </select>
          {/* 리뷰 쓰기 — 통합 폼 미구현. 추후 코트 상세 페이지의 작성 폼으로 유도하거나 별도 모달 도입 */}
          <button
            type="button"
            className="btn btn--accent btn--sm"
            disabled
            title="코트 상세 페이지에서 리뷰를 작성할 수 있습니다 (통합 작성 폼은 준비 중)"
            style={{ marginLeft: 8, cursor: "not-allowed", opacity: 0.5 }}
          >
            + 리뷰 쓰기
          </button>
        </div>
      </div>

      {/* ====== 리스트 (court 실데이터) ====== */}
      {!showPending && sortedCourts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sortedCourts.map((r) => (
            <article
              key={r.id}
              className="card"
              style={{
                padding: "18px 22px",
                display: "grid",
                gridTemplateColumns: "180px 1fr auto",
                gap: 18,
              }}
            >
              {/* 좌: 타입 라벨 + 코트명 + 위치 (코트 상세로 링크) */}
              <Link
                href={`/courts/${r.courtId}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    background: TYPE_COLOR.court,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: ".06em",
                    padding: "3px 8px",
                    borderRadius: 3,
                    textTransform: "uppercase",
                  }}
                >
                  {TYPE_LABEL.court}
                </span>
                <div style={{ fontWeight: 700, fontSize: 14, marginTop: 6 }}>{r.target}</div>
                {r.targetSub && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ink-mute)",
                      fontFamily: "var(--ff-mono)",
                    }}
                  >
                    {r.targetSub}
                  </div>
                )}
              </Link>

              {/* 중앙: 별점 + 제목 + 본문 + (사진수) + 작성자/날짜 */}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                  <StarRow rating={r.rating} />
                  <b style={{ fontSize: 15 }}>{r.title}</b>
                  {r.verified && (
                    <span className="badge badge--ok" style={{ fontSize: 9 }}>
                      ✓ 인증
                    </span>
                  )}
                </div>
                {r.body && (
                  <p
                    style={{
                      margin: "0 0 8px",
                      fontSize: 13.5,
                      color: "var(--ink-soft)",
                      lineHeight: 1.6,
                      // 본문은 5줄까지만 노출 (긴 리뷰 카드 균형)
                      display: "-webkit-box",
                      WebkitLineClamp: 5,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {r.body}
                  </p>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {/* 태그는 시안에는 있으나 DB 미지원 → 생략 (추후 컬럼 추가 시 노출) */}
                  {r.photos > 0 && (
                    <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>
                      📷 사진 {r.photos}장
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    fontFamily: "var(--ff-mono)",
                    marginTop: 8,
                  }}
                >
                  <b style={{ color: "var(--ink-soft)", fontFamily: "inherit" }}>{r.author}</b>{" "}
                  <span
                    className="badge badge--soft"
                    style={{ fontSize: 9, marginLeft: 2 }}
                    title="레벨 시스템은 준비 중"
                  >
                    {r.authorLevel}
                  </span>{" "}
                  · {fmtDate(r.createdAt)}
                </div>
              </div>

              {/* 우: 도움됨 / 신고 / 좋아요 (모두 disabled — 토글 동작은 Phase 5 Reviews) */}
              <div
                style={{
                  textAlign: "right",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  alignItems: "flex-end",
                }}
              >
                <button
                  type="button"
                  className="btn btn--sm"
                  disabled
                  title="도움됨 토글은 준비 중"
                  style={{ fontSize: 11, padding: "4px 10px", cursor: "not-allowed", opacity: 0.6 }}
                >
                  👍 도움됨 {r.helpful}
                </button>
                <button
                  type="button"
                  disabled
                  title="신고 기능은 준비 중"
                  style={{
                    fontSize: 11,
                    padding: "4px 10px",
                    background: "transparent",
                    border: 0,
                    color: "var(--ink-dim)",
                    cursor: "not-allowed",
                    opacity: 0.6,
                  }}
                >
                  🚩 신고
                </button>
                <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>♥ {r.likes}</div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ====== 미지원 탭(대회/팀/심판) 안내 카드 ====== */}
      {showPending && (
        <div className="card" style={{ padding: "60px 24px", textAlign: "center" }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 48, color: "var(--ink-dim)", marginBottom: 12, display: "block" }}
          >
            construction
          </span>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>리뷰 시스템 준비 중</div>
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            {tab === "tournament" && "대회 후기는 곧 추가됩니다."}
            {tab === "team" && "팀 후기는 곧 추가됩니다."}
            {tab === "referee" && "심판 평가는 곧 추가됩니다."}
          </div>
        </div>
      )}

      {/* ====== 코트 리뷰 0건 빈상태 (전체/코트 탭) ====== */}
      {showCourtsEmpty && (
        <div className="card" style={{ padding: 60, textAlign: "center" }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 48, color: "var(--ink-dim)", marginBottom: 12, display: "block" }}
          >
            rate_review
          </span>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
            아직 등록된 코트 리뷰가 없습니다
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            첫 리뷰를 작성하려면 코트 상세 페이지에서 별점을 남겨주세요.
          </div>
        </div>
      )}
    </div>
  );
}
