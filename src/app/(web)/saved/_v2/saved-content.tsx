"use client";

/* ============================================================
 * SavedContent — /saved v2 클라이언트 (탭 + 카드 그리드)
 *
 * 왜 클라이언트:
 * - PM 결정(D-옵션 C): 7탭 필터링 = useState 단일 상태. 서버에서 전체 데이터를 prefetch 하고
 *   클라는 활성 탭에 따라 섹션을 보이거나 빈상태 표시.
 * - URL 동기화(?tab=...) 도 가능하지만 단순성을 위해 클라 상태만으로 처리(시안 Saved.jsx 패턴).
 *
 * 7탭 구성:
 *   전체 / 게시글 / 게시판 / 경기 / 대회 / 팀 / 코트
 *
 * 데이터 가용성:
 *   - 게시판(boards) ← board_favorites 실데이터
 *   - 코트(courts)   ← user_favorite_courts 실데이터
 *   - 게시글/경기/대회/팀 ← DB 모델 없음 → 빈 배열, "북마크 시스템 준비 중" 안내
 *
 * 디자인:
 *   - Dev/design/BDR v2/screens/Saved.jsx 의 레이아웃 + 시안 색/타이포 그대로
 *   - 상단: breadcrumb / 타이틀 / 액션(내보내기/폴더관리 disabled "준비 중")
 *   - 탭: 활성 시 var(--accent) 언더라인. count는 ff-mono.
 *   - 🔖 토글 아이콘: 코트/게시판 = 활성(현재는 표시만, 토글 동작은 추후), 그 외 5탭 = disabled
 * ============================================================ */

import { useState, useMemo } from "react";
import Link from "next/link";

// ---- 서버 → 클라 데이터 타입 (page.tsx 와 일치) ----
export interface SavedBoard {
  id: string;
  category: string; // 슬러그 (notice/general/...)
  label: string;    // 한글 라벨
  savedAt: string;  // ISO
}

export interface SavedCourt {
  id: string;
  courtPublicId: string; // 상세 페이지 링크용
  name: string;
  area: string | null;
  indoor: boolean | null;
  rentalFee: number | null;
  openingHours: string | null;
  nickname: string | null;
  useCount: number;
  savedAt: string; // ISO (last_used_at 또는 created_at)
}

export interface SavedContentProps {
  boards: SavedBoard[];
  courts: SavedCourt[];
}

// 7탭 정의 — 시안 그대로(전체/게시글/게시판/경기/대회/팀/코트)
type TabId = "all" | "posts" | "boards" | "games" | "tourney" | "teams" | "courts";

// "북마크 시스템 준비 중" 안내가 필요한 5개 탭
const PENDING_TABS: TabId[] = ["posts", "games", "tourney", "teams"];

// ISO → "YYYY.MM.DD" mono 표기 (Saved.jsx 시안과 동일)
function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export function SavedContent({ boards, courts }: SavedContentProps) {
  const [tab, setTab] = useState<TabId>("all");

  // 탭별 카운트(=총 항목 수). 미지원 탭은 0.
  const counts = useMemo(
    () => ({
      all: boards.length + courts.length,
      posts: 0,
      boards: boards.length,
      games: 0,
      tourney: 0,
      teams: 0,
      courts: courts.length,
    }),
    [boards.length, courts.length]
  );

  // 탭별 표시 여부 (전체 탭일 때는 "데이터가 있는 섹션"만 표시)
  const showBoards = (tab === "all" && boards.length > 0) || tab === "boards";
  const showCourts = (tab === "all" && courts.length > 0) || tab === "courts";

  // 미지원 탭(전용 탭 클릭 시) → 안내 카드 표시
  const showPending = PENDING_TABS.includes(tab);

  // 전체 비어 있고 전체 탭일 때만 글로벌 빈상태
  const isAllEmpty = tab === "all" && boards.length === 0 && courts.length === 0;

  // 탭 정의 (label + count)
  const tabs: { id: TabId; label: string }[] = [
    { id: "all", label: "전체" },
    { id: "posts", label: "게시글" },
    { id: "boards", label: "게시판" },
    { id: "games", label: "경기" },
    { id: "tourney", label: "대회" },
    { id: "teams", label: "팀" },
    { id: "courts", label: "코트" },
  ];

  return (
    <div className="page">
      {/* breadcrumb — 시안 그대로 */}
      <div style={{ display: "flex", gap: 6, fontSize: 12, color: "var(--ink-mute)", marginBottom: 12 }}>
        <Link href="/" style={{ color: "var(--ink-mute)" }}>
          홈
        </Link>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>보관함</span>
      </div>

      {/* 헤더 — 타이틀 + 액션 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div className="eyebrow">Saved · Bookmarks</div>
          <h1 style={{ margin: "6px 0 0", fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}>
            보관함
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--ink-mute)", fontSize: 13 }}>
            북마크한 게시판과 코트를 한 곳에서 모아 보세요.
          </p>
        </div>
        {/* 내보내기 / 폴더 관리 — Phase 5 Saved 추후 구현. 현재는 disabled */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            className="btn btn--sm"
            disabled
            title="준비 중"
            style={{ cursor: "not-allowed", opacity: 0.5 }}
          >
            내보내기
          </button>
          <button
            type="button"
            className="btn btn--sm"
            disabled
            title="준비 중"
            style={{ cursor: "not-allowed", opacity: 0.5 }}
          >
            폴더 관리
          </button>
        </div>
      </div>

      {/* 탭 — 활성 시 underline + accent 컬러 */}
      <div
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "1px solid var(--border)",
          marginBottom: 20,
          overflowX: "auto",
        }}
      >
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                padding: "10px 16px",
                background: "transparent",
                border: 0,
                cursor: "pointer",
                borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
                color: active ? "var(--accent)" : "var(--ink-soft)",
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                whiteSpace: "nowrap",
                display: "flex",
                gap: 6,
                alignItems: "center",
              }}
            >
              {t.label}
              <span
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontSize: 11,
                  color: "var(--ink-dim)",
                  fontWeight: 500,
                }}
              >
                {counts[t.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ====== 게시판 섹션 (board_favorites 실데이터) ====== */}
      {showBoards && (
        <section style={{ marginBottom: 32 }}>
          {tab === "all" && (
            <h2
              style={{
                margin: "0 0 12px",
                fontSize: 15,
                fontWeight: 700,
                display: "flex",
                alignItems: "baseline",
                gap: 8,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--ink-soft)" }}>
                forum
              </span>
              게시판
              <span
                style={{
                  fontSize: 12,
                  color: "var(--ink-dim)",
                  fontFamily: "var(--ff-mono)",
                  fontWeight: 500,
                }}
              >
                {boards.length}
              </span>
            </h2>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {boards.map((b) => (
              <Link
                key={b.id}
                href={`/community?category=${b.category}`}
                className="card"
                style={{
                  padding: "16px 18px",
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{b.label}</div>
                  {/* 🔖 토글 — 게시판 탭은 active 색. 현재는 표시만(클릭 동작은 Phase 5 Saved) */}
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, color: "var(--accent)" }}
                    aria-label="북마크됨"
                    title="북마크됨"
                  >
                    bookmark
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    fontFamily: "var(--ff-mono)",
                  }}
                >
                  저장 {fmtDate(b.savedAt)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ====== 코트 섹션 (user_favorite_courts 실데이터) ====== */}
      {showCourts && (
        <section style={{ marginBottom: 32 }}>
          {tab === "all" && (
            <h2
              style={{
                margin: "0 0 12px",
                fontSize: 15,
                fontWeight: 700,
                display: "flex",
                alignItems: "baseline",
                gap: 8,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--ink-soft)" }}>
                place
              </span>
              코트
              <span
                style={{
                  fontSize: 12,
                  color: "var(--ink-dim)",
                  fontFamily: "var(--ff-mono)",
                  fontWeight: 500,
                }}
              >
                {courts.length}
              </span>
            </h2>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {courts.map((c) => (
              <Link
                key={c.id}
                href={`/courts/${c.courtPublicId}`}
                className="card"
                style={{
                  padding: "16px 18px",
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 6,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {c.nickname ? c.nickname : c.name}
                    {/* 별칭 사용 시 본명을 보조로 노출 */}
                    {c.nickname && (
                      <span style={{ fontSize: 11, color: "var(--ink-dim)", fontWeight: 500, marginLeft: 6 }}>
                        ({c.name})
                      </span>
                    )}
                  </div>
                  {/* 🔖 토글 — 코트 탭 active. 현재는 표시만 */}
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, color: "var(--accent)" }}
                    aria-label="북마크됨"
                    title="북마크됨"
                  >
                    bookmark
                  </span>
                </div>
                {/* 지역 */}
                {c.area && <div style={{ fontSize: 12, color: "var(--ink-mute)", marginBottom: 10 }}>{c.area}</div>}
                {/* 메타 — 운영시간/요금/실내외 */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    fontFamily: "var(--ff-mono)",
                  }}
                >
                  {c.openingHours && <span>시간 {c.openingHours}</span>}
                  {c.rentalFee != null && (
                    <span>요금 {c.rentalFee === 0 ? "무료" : `₩${c.rentalFee.toLocaleString()}`}</span>
                  )}
                  {c.indoor != null && <span>{c.indoor ? "실내" : "실외"}</span>}
                </div>
                {/* 사용 횟수 + 저장일 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 10,
                    color: "var(--ink-dim)",
                    fontFamily: "var(--ff-mono)",
                    marginTop: 8,
                  }}
                >
                  <span>사용 {c.useCount}회</span>
                  <span>저장 {fmtDate(c.savedAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ====== 미지원 탭 안내 (게시글/경기/대회/팀) ====== */}
      {showPending && (
        <div className="card" style={{ padding: "60px 24px", textAlign: "center" }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 48, color: "var(--ink-dim)", marginBottom: 12, display: "block" }}
          >
            construction
          </span>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>북마크 시스템 준비 중</div>
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            {tab === "posts" && "게시글 북마크 기능은 곧 추가됩니다."}
            {tab === "games" && "경기 북마크 기능은 곧 추가됩니다."}
            {tab === "tourney" && "대회 북마크 기능은 곧 추가됩니다."}
            {tab === "teams" && "팀 팔로우 기능은 곧 추가됩니다."}
          </div>
        </div>
      )}

      {/* ====== 전체 탭 + 데이터 0건 빈상태 ====== */}
      {isAllEmpty && (
        <div className="card" style={{ padding: 60, textAlign: "center" }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 48, color: "var(--ink-dim)", marginBottom: 12, display: "block" }}
          >
            bookmark_border
          </span>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>아직 보관한 항목이 없어요</div>
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            관심있는 게시판/코트를 북마크하면 여기에서 모아볼 수 있습니다.
          </div>
        </div>
      )}

      {/* ====== 게시판 전용 탭 + 0건 ====== */}
      {tab === "boards" && boards.length === 0 && (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            아직 즐겨찾는 게시판이 없습니다. 커뮤니티에서 게시판을 추가해보세요.
          </div>
        </div>
      )}

      {/* ====== 코트 전용 탭 + 0건 ====== */}
      {tab === "courts" && courts.length === 0 && (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            아직 즐겨찾는 코트가 없습니다. 코트 페이지에서 자주 가는 코트를 등록해보세요.
          </div>
        </div>
      )}
    </div>
  );
}
