"use client";

/**
 * 검색 페이지 클라이언트 컴포넌트 — BDR v2 시안 박제 (Search.jsx 1:1)
 *
 * 왜 분리됐는가:
 * - controlled input + form submit 시 router.push 는 "use client" 필요.
 * - 탭 전환은 클라이언트 상태 — 서버 재요청 없이 이미 받은 결과를 필터만 바꾼다.
 * - page.tsx(서버)가 Prisma 6테이블 검색 → 직렬화 → props로 전달.
 *
 * v2 시안 박제 (Dev/design/BDR v2/screens/Search.jsx):
 * - 폭: maxWidth 900 (시안 21번째 줄 그대로)
 * - 헤더: 큰 input(height 52, fontSize 17) 위 → 제목 + 카운트 라인 아래
 * - 탭 5종 유지 + 코트/유저 2종 추가 (사용자 원칙: 데이터 있으면 표시 = 7탭)
 * - 팀: grid auto-fill 200px 카드 + 이니셜 칩(32×32)
 * - 경기: card 0 padding + grid '60px 1fr auto' 행 + badge--soft
 * - 대회: grid '56px 1fr auto' 행 + 48×48 accent 박스 (level 약어) + "상세" btn--sm
 * - 커뮤니티: grid '60px 1fr auto' 행 + badge--soft
 * - 코트 / 유저: 팀과 동일한 grid 카드 형태 (시안 톤 일관)
 *
 * 불변 (절대 변경 금지):
 * - API / Prisma / 서비스 레이어 변경 없음
 * - 6종 데이터 모두 화면에 보존
 * - props 인터페이스, form submit 동작, searchParams 흐름 100% 유지
 */

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  SerializedGame,
  SerializedTournament,
  SerializedTeam,
  SerializedPost,
  SerializedUser,
  SerializedCourt,
} from "../page";

// 경기 유형 한글 매핑 (badge--soft에 들어갈 짧은 라벨)
const GAME_TYPE_LABELS: Record<number, string> = {
  0: "픽업",
  1: "팀매치",
  2: "대회",
};

// 커뮤니티 카테고리 한글 매핑 (badge--soft 라벨)
const CATEGORY_LABELS: Record<string, string> = {
  general: "자유",
  question: "질문",
  info: "정보",
  recruit: "모집",
  trade: "거래",
  review: "후기",
};

// 대회 상태 — 48×48 accent 박스 안에 들어갈 약어 (시안의 level 위치)
const STATUS_SHORT: Record<string, string> = {
  draft: "준비",
  upcoming: "준비",
  registration: "접수",
  active: "접수",
  open: "접수",
  in_progress: "진행",
  live: "진행",
  ongoing: "진행",
  completed: "종료",
  ended: "종료",
  cancelled: "종료",
};

// 대회 상태별 accent 색 (시안의 t.accent 자리 — 토큰 변수만 사용)
const STATUS_ACCENT: Record<string, string> = {
  draft: "var(--ink-mute)",
  upcoming: "var(--ink-mute)",
  registration: "var(--accent)",
  active: "var(--accent)",
  open: "var(--accent)",
  in_progress: "var(--cafe-blue)",
  live: "var(--cafe-blue)",
  ongoing: "var(--cafe-blue)",
  completed: "var(--ink-dim)",
  ended: "var(--ink-dim)",
  cancelled: "var(--ink-dim)",
};

// 대회 상태 풀 라벨 (오른쪽 보조 텍스트용)
const STATUS_LABELS: Record<string, string> = {
  draft: "준비중",
  upcoming: "준비중",
  registration: "접수중",
  active: "접수중",
  open: "접수중",
  in_progress: "진행중",
  live: "진행중",
  ongoing: "진행중",
  completed: "종료",
  ended: "종료",
  cancelled: "종료",
};

// 코트 유형 한글 매핑
const COURT_TYPE_LABELS: Record<string, string> = {
  outdoor: "야외",
  indoor: "실내",
  rooftop: "옥상",
};

// 포지션 한글 매핑
const POSITION_LABELS: Record<string, string> = {
  PG: "포인트가드",
  SG: "슈팅가드",
  SF: "스몰포워드",
  PF: "파워포워드",
  C: "센터",
};

// 탭 키 — "all"은 전체, 나머지는 개별 섹션 (시안 5탭 + 코트/유저 2탭)
type TabKey =
  | "all"
  | "teams"
  | "games"
  | "tournaments"
  | "community"
  | "courts"
  | "users";

// 탭 정의 (PM 확정 순서: 전체 / 팀 / 경기 / 대회 / 커뮤니티 / 코트 / 유저)
const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "teams", label: "팀" },
  { key: "games", label: "경기" },
  { key: "tournaments", label: "대회" },
  { key: "community", label: "커뮤니티" },
  { key: "courts", label: "코트" },
  { key: "users", label: "유저" },
];

interface SearchClientProps {
  q: string;
  games: SerializedGame[];
  tournaments: SerializedTournament[];
  teams: SerializedTeam[];
  posts: SerializedPost[];
  users: SerializedUser[];
  courts: SerializedCourt[];
}

/**
 * 이름에서 칩에 들어갈 2글자 이니셜 추출.
 * 시안의 t.tag(예: "RDM") 자리에 mybdr DB에 그런 필드가 없으므로 name 첫 글자 사용.
 */
function getInitials(name: string): string {
  if (!name) return "?";
  const trimmed = name.trim();
  if (!trimmed) return "?";
  // 한글 1글자, 알파벳 2글자
  const first = trimmed.charAt(0);
  if (/[A-Za-z]/.test(first)) {
    return trimmed.slice(0, 2).toUpperCase();
  }
  return first;
}

/**
 * id 기반 결정적 색상 — 시안 t.color/t.ink 자리.
 * 토큰 변수만 사용하여 4가지 톤 순환 (디자인 컨벤션 — 하드코딩 금지).
 */
const CHIP_TONES: { bg: string; ink: string }[] = [
  { bg: "var(--accent)", ink: "#fff" },
  { bg: "var(--cafe-blue)", ink: "#fff" },
  { bg: "var(--ink)", ink: "var(--bg)" },
  { bg: "var(--bg-elev-2)", ink: "var(--ink)" },
];
function getChipTone(id: string): { bg: string; ink: string } {
  // 단순 합 해시 — id 변하지 않으면 색도 유지
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % 4;
  return CHIP_TONES[h];
}

export function SearchClient({
  q,
  games,
  tournaments,
  teams,
  posts,
  users,
  courts,
}: SearchClientProps) {
  const router = useRouter();

  // controlled input — 서버 q 값으로 초기화, 사용자 타이핑 상태 보존
  const [inputValue, setInputValue] = useState(q);
  // 현재 활성 탭
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  // form submit → URL push (Enter / 돋보기 클릭)
  // 이유: 탭 필터는 클라가 하지만, 실제 DB 재검색은 서버에서 해야 하므로 URL 변경 필수.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next = inputValue.trim();
    if (next === "") {
      router.push("/search");
    } else {
      router.push(`/search?q=${encodeURIComponent(next)}`);
    }
  }

  // 전체 결과 건수 (탭별 뱃지 / 빈 상태 판정용)
  const counts = useMemo(
    () => ({
      all:
        games.length +
        tournaments.length +
        teams.length +
        posts.length +
        users.length +
        courts.length,
      teams: teams.length,
      games: games.length,
      tournaments: tournaments.length,
      community: posts.length,
      courts: courts.length,
      users: users.length,
    }),
    [games, tournaments, teams, posts, users, courts],
  );

  // 현재 탭에서 어떤 섹션을 노출할지 판정
  const showGames = activeTab === "all" || activeTab === "games";
  const showTournaments = activeTab === "all" || activeTab === "tournaments";
  const showTeams = activeTab === "all" || activeTab === "teams";
  const showCommunity = activeTab === "all" || activeTab === "community";
  const showCourts = activeTab === "all" || activeTab === "courts";
  const showUsers = activeTab === "all" || activeTab === "users";

  // 활성 탭 기준 결과 건수 (활성 탭이 all 이면 전체, 아니면 해당 카테고리)
  const activeTabCount =
    activeTab === "all" ? counts.all : counts[activeTab];

  return (
    // .page 쉘 + 시안 21번째 줄 그대로: maxWidth 900, 가운데 정렬
    <div className="page">
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* ==== 큰 검색 input (시안 22~26줄): height 52, fontSize 17, 좌측 search 아이콘 absolute ==== */}
        <form onSubmit={handleSubmit} role="search">
          <div style={{ position: "relative", marginBottom: 20 }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ink-dim)",
                fontSize: 20,
                pointerEvents: "none",
              }}
            >
              search
            </span>
            <input
              type="search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="경기, 대회, 팀, 코트, 유저, 커뮤니티"
              aria-label="통합 검색"
              className="input"
              style={{
                paddingLeft: 44,
                height: 52,
                fontSize: 17,
                fontWeight: 500,
                width: "100%",
              }}
            />
            {/* 입력값 초기화 버튼 — 값이 있을 때만 표시 (시안에 없는 편의 기능, 우측 absolute) */}
            {inputValue.length > 0 && (
              <button
                type="button"
                onClick={() => setInputValue("")}
                aria-label="입력값 지우기"
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  padding: 0,
                  border: 0,
                  background: "transparent",
                  color: "var(--ink-mute)",
                  cursor: "pointer",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18 }}
                >
                  close
                </span>
              </button>
            )}
          </div>
        </form>

        {/* ==== 빈 쿼리 상태: 기존 안내 메시지 유지 (탭/결과 없음) ==== */}
        {q === "" ? (
          <div style={{ padding: "80px 16px", textAlign: "center" }}>
            <span
              className="material-symbols-outlined"
              style={{
                display: "block",
                fontSize: 48,
                color: "var(--ink-dim)",
                marginBottom: 12,
              }}
            >
              search
            </span>
            <p
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: "var(--ink)",
              }}
            >
              검색어를 입력해주세요
            </p>
            <p
              style={{
                margin: "6px 0 0 0",
                fontSize: 13,
                color: "var(--ink-mute)",
              }}
            >
              경기, 대회, 팀, 코트, 유저, 커뮤니티 글을 한번에 검색할 수 있어요
            </p>
          </div>
        ) : (
          <>
            {/* ==== 검색 결과 헤더 (시안 28~37줄): "키워드" 검색 결과 + 카운트 라인 ==== */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 18,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
                  &ldquo;
                  <span style={{ color: "var(--accent)" }}>{q}</span>
                  &rdquo; 검색 결과
                </h1>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--ink-mute)",
                    marginTop: 4,
                  }}
                >
                  총 {counts.all}건 · 팀 {counts.teams} · 경기 {counts.games} ·
                  대회 {counts.tournaments} · 글 {counts.community}
                  {/* 사용자 원칙(데이터 있으면 표시) — 코트/유저는 시안에 없지만 카운트 합류 */}
                  {counts.courts > 0 ? ` · 코트 ${counts.courts}` : ""}
                  {counts.users > 0 ? ` · 유저 ${counts.users}` : ""}
                </div>
              </div>
            </div>

            {/* ==== 탭 7개 (시안 39~48줄 톤): border-bottom 밑줄 + cafe-blue accent ==== */}
            <div
              className="no-scrollbar"
              style={{
                display: "flex",
                gap: 4,
                marginBottom: 20,
                borderBottom: "1px solid var(--border)",
                overflowX: "auto",
              }}
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                const n =
                  tab.key === "all" ? counts.all : counts[tab.key];
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    aria-pressed={isActive}
                    style={{
                      padding: "10px 16px",
                      background: "transparent",
                      border: 0,
                      // 시안 그대로: 활성 cafe-blue 3px 밑줄
                      borderBottom: isActive
                        ? "3px solid var(--cafe-blue)"
                        : "3px solid transparent",
                      color: isActive ? "var(--ink)" : "var(--ink-mute)",
                      fontWeight: isActive ? 700 : 500,
                      fontSize: 14,
                      cursor: "pointer",
                      marginBottom: -1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tab.label}
                    <span
                      style={{
                        fontFamily: "var(--ff-mono)",
                        fontSize: 11,
                        color: "var(--ink-dim)",
                        marginLeft: 4,
                      }}
                    >
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ==== 결과가 0건일 때 (시안 120~125줄: 60px + 36px ○ + 안내) ==== */}
            {activeTabCount === 0 ? (
              <div
                style={{
                  padding: 60,
                  textAlign: "center",
                  color: "var(--ink-dim)",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    display: "block",
                    fontSize: 48,
                    color: "var(--ink-dim)",
                    marginBottom: 8,
                  }}
                >
                  search_off
                </span>
                검색 결과가 없습니다. 다른 키워드를 시도해보세요.
              </div>
            ) : (
              <>
                {/* ==== 팀 섹션 (시안 50~67줄): grid auto-fill 200px 카드 ==== */}
                {showTeams && teams.length > 0 && (
                  <SectionHeader title="팀" count={teams.length}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: 10,
                      }}
                    >
                      {teams.map((t) => {
                        const tone = getChipTone(t.id);
                        return (
                          <Link
                            key={t.id}
                            href={`/teams/${t.id}`}
                            className="card"
                            style={{
                              padding: "12px 14px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              textDecoration: "none",
                              color: "inherit",
                            }}
                          >
                            {/* 32×32 이니셜 칩 (시안 58줄 t.tag 자리 — DB에 tag 필드 없어 이니셜로 대체) */}
                            <span
                              style={{
                                width: 32,
                                height: 32,
                                background: tone.bg,
                                color: tone.ink,
                                display: "grid",
                                placeItems: "center",
                                fontFamily: "var(--ff-mono)",
                                fontSize: 11,
                                fontWeight: 700,
                                borderRadius: 4,
                                flexShrink: 0,
                              }}
                            >
                              {getInitials(t.name)}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: 14,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  color: "var(--ink)",
                                }}
                              >
                                {t.name}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "var(--ink-dim)",
                                  fontFamily: "var(--ff-mono)",
                                }}
                              >
                                {/* 시안 t.rating 자리 — DB에 rating 없으므로 city + 인원수로 대체 */}
                                {[
                                  t.city,
                                  t.members_count != null
                                    ? `${t.members_count}명`
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .join(" · ") || "—"}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </SectionHeader>
                )}

                {/* ==== 경기 섹션 (시안 69~85줄): card 0 padding + 60px/1fr/auto 행 + badge--soft ==== */}
                {showGames && games.length > 0 && (
                  <SectionHeader title="경기 모집">
                    <div
                      className="card"
                      style={{ padding: 0, overflow: "hidden" }}
                    >
                      {games.map((g, i) => (
                        <Link
                          key={g.id}
                          href={`/games/${g.id}`}
                          style={{
                            padding: "12px 16px",
                            borderBottom:
                              i < games.length - 1
                                ? "1px solid var(--border)"
                                : 0,
                            display: "grid",
                            gridTemplateColumns: "60px 1fr auto",
                            gap: 10,
                            alignItems: "center",
                            cursor: "pointer",
                            textDecoration: "none",
                            color: "inherit",
                          }}
                        >
                          <span className="badge badge--soft">
                            {GAME_TYPE_LABELS[g.game_type] || "경기"}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: 14,
                                color: "var(--ink)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {g.title || "제목 없음"}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--ink-dim)",
                                marginTop: 2,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {[
                                g.venue_name || g.city,
                                g.scheduled_at
                                  ? new Date(g.scheduled_at).toLocaleDateString(
                                      "ko-KR",
                                      { month: "2-digit", day: "2-digit" },
                                    )
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          </div>
                          {/* 시안 우측 mono "applied/spots" 자리 — DB에 정원 필드 없어 chevron으로 대체 */}
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 18, color: "var(--ink-dim)" }}
                          >
                            chevron_right
                          </span>
                        </Link>
                      ))}
                    </div>
                  </SectionHeader>
                )}

                {/* ==== 대회 섹션 (시안 87~103줄): 56px/1fr/auto 행 + 48×48 accent 박스 + level 약어 + 상세 btn ==== */}
                {showTournaments && tournaments.length > 0 && (
                  <SectionHeader title="대회">
                    <div
                      className="card"
                      style={{ padding: 0, overflow: "hidden" }}
                    >
                      {tournaments.map((t, i) => {
                        const statusKey = t.status || "draft";
                        const accent =
                          STATUS_ACCENT[statusKey] || "var(--ink-mute)";
                        const short = STATUS_SHORT[statusKey] || "예정";
                        return (
                          <div
                            key={t.id}
                            style={{
                              padding: "14px 16px",
                              borderBottom:
                                i < tournaments.length - 1
                                  ? "1px solid var(--border)"
                                  : 0,
                              display: "grid",
                              gridTemplateColumns: "56px 1fr auto",
                              gap: 12,
                              alignItems: "center",
                            }}
                          >
                            {/* 48×48 accent 박스 (시안 t.accent + t.level 자리) — status 기반 */}
                            <div
                              style={{
                                width: 48,
                                height: 48,
                                background: accent,
                                color: "#fff",
                                display: "grid",
                                placeItems: "center",
                                fontFamily: "var(--ff-display)",
                                fontWeight: 900,
                                fontSize: 12,
                                borderRadius: "var(--radius-chip)",
                              }}
                            >
                              {short}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 700,
                                  color: "var(--ink)",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {t.name}
                                {/* 시안 t.edition 자리 — 팀수 표시 */}
                                {t.teams_count != null && t.max_teams ? (
                                  <span
                                    style={{
                                      color: "var(--ink-mute)",
                                      fontWeight: 500,
                                      fontSize: 12,
                                      marginLeft: 4,
                                    }}
                                  >
                                    {t.teams_count}/{t.max_teams}팀
                                  </span>
                                ) : null}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "var(--ink-dim)",
                                  marginTop: 2,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {[
                                  STATUS_LABELS[statusKey] || statusKey,
                                  t.city,
                                  t.start_date
                                    ? new Date(
                                        t.start_date,
                                      ).toLocaleDateString("ko-KR", {
                                        month: "2-digit",
                                        day: "2-digit",
                                      })
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </div>
                            </div>
                            {/* 시안 "상세" btn--sm (Link 로 라우팅) */}
                            <Link
                              href={`/tournaments/${t.id}`}
                              className="btn btn--sm"
                              style={{ textDecoration: "none" }}
                            >
                              상세
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </SectionHeader>
                )}

                {/* ==== 코트 섹션 (시안에는 없음 — 사용자 원칙으로 추가, 팀 grid 톤과 통일) ==== */}
                {showCourts && courts.length > 0 && (
                  <SectionHeader title="코트" count={courts.length}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: 10,
                      }}
                    >
                      {courts.map((c) => (
                        <Link
                          key={c.id}
                          href={`/courts/${c.id}`}
                          className="card"
                          style={{
                            padding: "12px 14px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            textDecoration: "none",
                            color: "inherit",
                          }}
                        >
                          {/* location_on 아이콘 칩 — cafe-blue 톤 */}
                          <span
                            style={{
                              width: 32,
                              height: 32,
                              background: "var(--cafe-blue)",
                              color: "#fff",
                              display: "grid",
                              placeItems: "center",
                              borderRadius: 4,
                              flexShrink: 0,
                            }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: 16 }}
                            >
                              location_on
                            </span>
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: 14,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                color: "var(--ink)",
                              }}
                            >
                              {c.name}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--ink-dim)",
                                fontFamily: "var(--ff-mono)",
                              }}
                            >
                              {[
                                COURT_TYPE_LABELS[c.court_type] || c.court_type,
                                c.district || c.city,
                                c.average_rating != null
                                  ? `${c.average_rating.toFixed(1)}`
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </SectionHeader>
                )}

                {/* ==== 유저 섹션 (시안에는 없음 — 사용자 원칙으로 추가, 팀 grid 톤과 통일) ==== */}
                {showUsers && users.length > 0 && (
                  <SectionHeader title="유저" count={users.length}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: 10,
                      }}
                    >
                      {users.map((u) => {
                        const display = u.nickname || u.name || "알 수 없음";
                        const tone = getChipTone(u.id);
                        return (
                          <Link
                            key={u.id}
                            href={`/users/${u.id}`}
                            className="card"
                            style={{
                              padding: "12px 14px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              textDecoration: "none",
                              color: "inherit",
                            }}
                          >
                            {/* 이니셜 칩 — id 결정 색 */}
                            <span
                              style={{
                                width: 32,
                                height: 32,
                                background: tone.bg,
                                color: tone.ink,
                                display: "grid",
                                placeItems: "center",
                                fontFamily: "var(--ff-mono)",
                                fontSize: 11,
                                fontWeight: 700,
                                borderRadius: 999,
                                flexShrink: 0,
                              }}
                            >
                              {getInitials(display)}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: 14,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  color: "var(--ink)",
                                }}
                              >
                                {display}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "var(--ink-dim)",
                                  fontFamily: "var(--ff-mono)",
                                }}
                              >
                                {[
                                  u.position
                                    ? POSITION_LABELS[u.position] || u.position
                                    : null,
                                  u.city,
                                ]
                                  .filter(Boolean)
                                  .join(" · ") || "—"}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </SectionHeader>
                )}

                {/* ==== 커뮤니티 섹션 (시안 105~118줄): 60px/1fr/auto 행 + badge--soft ==== */}
                {showCommunity && posts.length > 0 && (
                  <SectionHeader title="커뮤니티">
                    <div
                      className="card"
                      style={{ padding: 0, overflow: "hidden" }}
                    >
                      {posts.map((p, i) => (
                        <Link
                          key={p.id}
                          href={`/community/${p.id}`}
                          style={{
                            padding: "12px 16px",
                            borderBottom:
                              i < posts.length - 1
                                ? "1px solid var(--border)"
                                : 0,
                            display: "grid",
                            gridTemplateColumns: "60px 1fr auto",
                            gap: 10,
                            alignItems: "center",
                            cursor: "pointer",
                            textDecoration: "none",
                            color: "inherit",
                          }}
                        >
                          <span className="badge badge--soft">
                            {CATEGORY_LABELS[p.category || "general"] ||
                              p.category ||
                              "글"}
                          </span>
                          <div
                            style={{
                              fontWeight: 500,
                              color: "var(--ink)",
                              minWidth: 0,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {p.title}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--ink-dim)",
                              fontFamily: "var(--ff-mono)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {/* 시안 author · date 자리 — DB select에 author 없음 → 댓글 + 날짜 */}
                            {[
                              p.comments_count > 0
                                ? `댓글 ${p.comments_count}`
                                : null,
                              p.created_at
                                ? new Date(p.created_at).toLocaleDateString(
                                    "ko-KR",
                                    {
                                      month: "2-digit",
                                      day: "2-digit",
                                    },
                                  )
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </SectionHeader>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * SectionHeader — 시안 51~54 / 71 / 89 / 107줄 톤 통일
 * - h2 fontSize:15, fontWeight:700, marginBottom:10
 * - 우측 mono 카운트(옵션), section marginBottom:28
 * ============================================================ */
function SectionHeader({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2
        style={{
          fontSize: 15,
          fontWeight: 700,
          marginBottom: 10,
          marginTop: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "var(--ink)",
        }}
      >
        {title}
        {count != null && (
          <span
            style={{
              fontSize: 12,
              color: "var(--ink-dim)",
              fontFamily: "var(--ff-mono)",
              fontWeight: 500,
            }}
          >
            {count}
          </span>
        )}
      </h2>
      {children}
    </section>
  );
}
