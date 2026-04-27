/* ============================================================
 * SummaryCard — BDR v2 경기 상세 요약 카드 (안 A: 2열 info grid + 조건부 행)
 *
 * 왜 이 컴포넌트가 있는가:
 * GameCard(목록용)와 동일한 v2 토큰·포맷을 유지하면서,
 * 상세 페이지에서는 DB의 모든 노출 가능 필드를 한 번에 보여줘야 함.
 * - 기본 행: 장소 / 일시 / 레벨 / 비용 / 인원
 * - 조건부 행: 듀레이션(duration_hours) / 연락처(contact_phone)
 *            / 게스트 허용(allow_guests) / 유니폼(uniform_home/away_color)
 * 데이터가 없으면 해당 행 자체를 렌더하지 않아 빈 공간이 안 생김.
 *
 * kind stripe 4px + 배지 줄 + 타이틀 + info grid 2열 + 진행바 구성을
 * 그대로 유지해 목록→상세 이동 시 시각적 연속성을 확보.
 *
 * 서버 컴포넌트 — Link/상호작용 없음. 데이터 바인딩만.
 * ============================================================ */

import { decodeHtmlEntities } from "@/lib/utils/decode-html";
import { SKILL_LABEL } from "@/lib/constants/game-status";

// game_type → 색상/라벨 (GameCard와 동일한 v2 토큰 사용)
const KIND_COLOR: Record<number, string> = {
  0: "var(--cafe-blue)",
  1: "var(--bdr-red)",
  2: "var(--ok)",
};
const KIND_LABEL: Record<number, string> = {
  0: "픽업",
  1: "게스트",
  2: "연습경기",
};

// 상태 → 배지 (1=모집중만 녹색, 나머지는 회색/빨강)
const STATUS_LABEL: Record<number, string> = {
  0: "모집 전",
  1: "모집중",
  2: "확정",
  3: "완료",
  4: "취소",
  5: "취소",
};

const KO_WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"] as const;

// 일시 풀 포맷 — "2026.04.25 (목) · 20:30" + duration 있으면 "– HH:mm" 이어붙임
function formatScheduleFull(iso: string | null | Date, durationHours: number | null): string {
  if (!iso) return "일정 미정";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "일정 미정";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const dow = KO_WEEKDAY[d.getDay()];
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const base = `${yyyy}.${mm}.${dd} (${dow}) · ${hh}:${mi}`;

  // duration이 있으면 종료 시각까지 계산해서 "– HH:mm" 붙임 (시안 원본 포맷)
  if (durationHours && durationHours > 0) {
    const end = new Date(d.getTime() + durationHours * 60 * 60 * 1000);
    const ehh = String(end.getHours()).padStart(2, "0");
    const emi = String(end.getMinutes()).padStart(2, "0");
    return `${base} – ${ehh}:${emi}`;
  }
  return base;
}

export interface SummaryCardGame {
  title: string | null;
  game_type: number;
  status: number;
  venue_name: string | null;
  venue_address: string | null;
  city: string | null;
  district: string | null;
  scheduled_at: Date | string | null;
  duration_hours: number | null;
  skill_level: string | null;
  fee_per_person: number | string | null;
  entry_fee_note: string | null;
  max_participants: number | null;
  min_participants: number | null;
  current_participants: number | null;
  contact_phone: string | null;
  allow_guests: boolean | null;
  uniform_home_color: string | null;
  uniform_away_color: string | null;
  author_nickname: string | null;
}

export function SummaryCard({ game }: { game: SummaryCardGame }) {
  // kind 색상/라벨
  const kindColor = KIND_COLOR[game.game_type] ?? KIND_COLOR[0];
  const kindLabel = KIND_LABEL[game.game_type] ?? KIND_LABEL[0];

  // 인원 계산 (null 안전)
  const cur = game.current_participants ?? 0;
  const max = game.max_participants ?? 0;
  const pct = max > 0 ? Math.min((cur / max) * 100, 100) : 0;
  const isFull = max > 0 && cur >= max;

  // 참가비 — 0/null → "무료" (ok 색상 강조)
  const feeNum = game.fee_per_person != null ? Number(game.fee_per_person) : 0;
  const isFree = !game.fee_per_person || feeNum === 0;
  const feeText = isFree ? "무료" : `₩${feeNum.toLocaleString()}`;

  // 실력 라벨
  const skillText =
    game.skill_level && SKILL_LABEL[game.skill_level]
      ? SKILL_LABEL[game.skill_level]
      : "전체";

  // 장소 문자열 — venue_name 우선, 없으면 city+district
  const placeParts = [game.city, game.district].filter(Boolean).join(" ");
  const place = game.venue_name
    ? decodeHtmlEntities(game.venue_name) || ""
    : placeParts || "-";
  const placeDetail = game.venue_address
    ? decodeHtmlEntities(game.venue_address) || null
    : null;

  // 인원 문자열 — "N/M명" (min이 있으면 "최소 N" 추가)
  const participantsText = max > 0 ? `${cur}/${max}명` : `${cur}명`;
  const minText = game.min_participants ? ` (최소 ${game.min_participants}명)` : "";

  // 상태 라벨
  const statusText = STATUS_LABEL[game.status] ?? "대기";
  const isActiveStatus = game.status === 1; // 모집중만 녹색 배지

  return (
    <section
      className="card"
      style={{ padding: 0, overflow: "hidden" }}
    >
      {/* 1. kind stripe — GameCard와 동일하게 4px 상단 바 */}
      <div style={{ height: 4, background: kindColor }} />

      <div style={{ padding: "18px 20px 16px" }}>
        {/* 2. 배지 줄 — 종류 / 상태 / 만석 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          <span
            className="badge"
            style={{
              background: kindColor,
              color: "#fff",
              borderColor: kindColor,
            }}
          >
            {kindLabel}
          </span>
          {/* 모집중이면 soft 녹색, 완료/취소면 회색, 확정이면 기본 */}
          <span
            className={
              isActiveStatus ? "badge" : game.status >= 3 ? "badge" : "badge"
            }
            style={
              isActiveStatus
                ? { background: "var(--ok)", color: "#fff", borderColor: "var(--ok)" }
                : undefined
            }
          >
            {statusText}
          </span>
          {isFull && <span className="badge badge--red">만석</span>}
        </div>

        {/* 3. 타이틀 — 상세용이므로 말줄임 없이 풀 노출 */}
        <h1
          style={{
            fontWeight: 700,
            fontSize: 20,
            lineHeight: 1.35,
            letterSpacing: "-0.005em",
            margin: 0,
            marginBottom: 14,
            color: "var(--ink)",
          }}
        >
          {decodeHtmlEntities(game.title) || "제목 없음"}
        </h1>

        {/* 4. info grid — 2열(라벨 76px / 값 1fr). 조건부 행은 데이터 있을 때만 렌더 */}
        <div
          style={{
            fontSize: 13,
            color: "var(--ink-mute)",
            display: "grid",
            gridTemplateColumns: "76px 1fr",
            rowGap: 6,
            columnGap: 10,
            marginBottom: 14,
          }}
        >
          {/* 장소 — venue_address가 있으면 2째 줄에 주소 표시 */}
          <span style={{ color: "var(--ink-dim)" }}>장소</span>
          <span>
            <span>{place}</span>
            {placeDetail && (
              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "var(--ink-dim)",
                  marginTop: 2,
                }}
              >
                {placeDetail}
              </span>
            )}
          </span>

          {/* 일시 (+duration 병합) — duration 있으면 "– HH:mm" 형식으로 합쳐서 1줄 */}
          <span style={{ color: "var(--ink-dim)" }}>일시</span>
          <span>{formatScheduleFull(game.scheduled_at, game.duration_hours)}</span>

          {/* 레벨 */}
          <span style={{ color: "var(--ink-dim)" }}>레벨</span>
          <span>{skillText}</span>

          {/* 비용 (+entry_fee_note 병합) */}
          <span style={{ color: "var(--ink-dim)" }}>비용</span>
          <span>
            <span
              style={{
                fontWeight: isFree ? 700 : 500,
                color: isFree ? "var(--ok)" : "var(--ink-soft)",
              }}
            >
              {feeText}
            </span>
            {game.entry_fee_note && (
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 12,
                  color: "var(--ink-dim)",
                }}
              >
                {decodeHtmlEntities(game.entry_fee_note)}
              </span>
            )}
          </span>

          {/* 인원 */}
          <span style={{ color: "var(--ink-dim)" }}>인원</span>
          <span>
            {participantsText}
            {minText && (
              <span style={{ fontSize: 12, color: "var(--ink-dim)" }}>{minText}</span>
            )}
          </span>

          {/* 연락처 — contact_phone 있을 때만 (tel 링크) */}
          {game.contact_phone && (
            <>
              <span style={{ color: "var(--ink-dim)" }}>연락처</span>
              <span>
                <a
                  href={`tel:${game.contact_phone}`}
                  style={{
                    color: "var(--cafe-blue)",
                    textDecoration: "none",
                    fontFamily: "var(--ff-mono)",
                  }}
                >
                  {game.contact_phone}
                </a>
              </span>
            </>
          )}

          {/* 게스트 허용 — allow_guests 명시적 false일 때만 특별 표시(기본은 true) */}
          {game.allow_guests === false && (
            <>
              <span style={{ color: "var(--ink-dim)" }}>게스트</span>
              <span style={{ color: "var(--ink-soft)" }}>게스트 참여 불가</span>
            </>
          )}
          {game.allow_guests === true && (
            <>
              <span style={{ color: "var(--ink-dim)" }}>게스트</span>
              <span style={{ color: "var(--ok)" }}>게스트 참여 가능</span>
            </>
          )}

          {/* 유니폼 — home/away 색상 원형 칩 표시 (둘 중 하나라도 있으면 렌더) */}
          {(game.uniform_home_color || game.uniform_away_color) && (
            <>
              <span style={{ color: "var(--ink-dim)" }}>유니폼</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {game.uniform_home_color && (
                  <UniformChip
                    color={game.uniform_home_color}
                    label={`홈 ${game.uniform_home_color}`}
                  />
                )}
                {game.uniform_away_color && (
                  <UniformChip
                    color={game.uniform_away_color}
                    label={`원정 ${game.uniform_away_color}`}
                  />
                )}
              </span>
            </>
          )}
        </div>

        {/* 5. 진행바 + 호스트 닉네임 (GameCard 푸터 축약) */}
        <div
          style={{
            paddingTop: 12,
            borderTop: "1px dashed var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              marginBottom: 6,
            }}
          >
            <span style={{ color: "var(--ink-dim)" }}>
              호스트{" "}
              <span style={{ color: "var(--ink)", fontWeight: 600 }}>
                {game.author_nickname
                  ? decodeHtmlEntities(game.author_nickname)
                  : "익명"}
              </span>
            </span>
            <span
              style={{
                fontFamily: "var(--ff-mono)",
                fontWeight: 700,
                color: "var(--ink-soft)",
              }}
            >
              {cur}/{max || "?"}
            </span>
          </div>
          <div
            style={{
              height: 4,
              background: "var(--bg-alt)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                background: kindColor,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// 유니폼 색상 칩 — 색상 원 + 라벨. inline CSS(임의 색상은 CSS 변수화 불가)
function UniformChip({ color, label }: { color: string; label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 12,
      }}
      title={label}
    >
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: color,
          border: "1px solid var(--border)",
          display: "inline-block",
        }}
      />
      <span
        style={{
          fontFamily: "var(--ff-mono)",
          fontSize: 11,
          color: "var(--ink-dim)",
        }}
      >
        {label}
      </span>
    </span>
  );
}
