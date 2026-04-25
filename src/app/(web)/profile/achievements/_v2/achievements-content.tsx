"use client";

/* ============================================================
 * AchievementsContent — /profile/achievements 클라이언트 본체
 *
 * 왜 클라이언트인가:
 * - 시안 (Achievements.jsx) L4 React.useState('all') — 필터 상태가 클라 인터랙션.
 * - 서버에서 사전 페칭한 user_badges 만 props 로 받고, 클라 카탈로그와 merge 하여
 *   "획득(earned) + 잠금(locked)" 통합 그리드를 만든다.
 *
 * 어떻게:
 * - props.earnedBadges 는 page.tsx 에서 BigInt → string, Date → ISO 변환 완료.
 * - SIGNATURE_ORDER (시안 16종) 를 기준으로 통합 리스트를 만들고,
 *   earnedTypes 에 포함된 키는 earned=true + earnedAt 이용.
 * - DB 미지원 메타 (rarity / progress / total) 는 "—" / "0 / N" / 0% 로 폴백.
 *   · rarity 는 색상 var(--ink-dim) 으로 약하게.
 *   · progress 바는 0% 로 표시 + title="측정 준비 중" 툴팁.
 * - 매핑 미스 (DB 에 카탈로그 외 타입) 도 earned 리스트 끝에 추가.
 * ============================================================ */

import { useMemo, useState } from "react";

import {
  resolveBadgeMeta,
  TIER_COLOR,
  TIER_LABEL,
  CATEGORY_LABEL,
  SIGNATURE_ORDER,
  type BadgeCategory,
} from "./badge-catalog";

/** page.tsx 에서 직렬화해서 넘기는 1행 — DB user_badges 그대로 */
export interface EarnedBadgeDTO {
  id: string;
  badgeType: string;
  badgeName: string;
  /** ISO 문자열 */
  earnedAt: string;
}

export interface AchievementsContentProps {
  earnedBadges: EarnedBadgeDTO[];
}

/** 그리드/필터에서 다루는 통합 항목 — earned + locked 한쪽으로 정규화 */
interface BadgeItem {
  /** 안정적 React key */
  key: string;
  /** badge_type (DB 또는 카탈로그) */
  type: string;
  /** 표시 이름 — earned 면 DB badgeName 우선, 아니면 카탈로그 name */
  name: string;
  earned: boolean;
  /** 획득일 ISO — earned 일 때만 */
  earnedAt: string | null;
}

/** YYYY.MM.DD 포맷 — 시안 스타일 */
function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

/** 필터 ID 종류 */
type FilterId = "all" | "earned" | "locked" | BadgeCategory;

export function AchievementsContent({ earnedBadges }: AchievementsContentProps) {
  // 시안 L4 — 필터 상태
  const [filter, setFilter] = useState<FilterId>("all");

  // ---- 통합 리스트 만들기 ----
  // 왜 useMemo: earnedBadges props 변화 시에만 재계산. filter 토글에는 영향 없음
  const allBadges = useMemo<BadgeItem[]>(() => {
    // earned type → DTO 매핑 (빠른 조회)
    const earnedMap = new Map<string, EarnedBadgeDTO>();
    for (const b of earnedBadges) {
      earnedMap.set(b.badgeType, b);
    }

    const items: BadgeItem[] = [];

    // 1) 시안 SIGNATURE_ORDER 16종 — 시안 그리드 순서 보존
    for (const type of SIGNATURE_ORDER) {
      const earned = earnedMap.get(type);
      const meta = resolveBadgeMeta(type);
      items.push({
        key: `cat-${type}`,
        type,
        name: earned?.badgeName ?? meta.name ?? type,
        earned: !!earned,
        earnedAt: earned?.earnedAt ?? null,
      });
      // 시안 16종에 매칭되면 earnedMap 에서 제거 (중복 방지)
      earnedMap.delete(type);
    }

    // 2) 시안 외 DB 발급 배지 (court_explorer, streak_*, mvp 등) — earned 만 끝에 추가
    for (const [type, earned] of earnedMap) {
      const meta = resolveBadgeMeta(type);
      items.push({
        key: `db-${earned.id}`,
        type,
        name: earned.badgeName || meta.name || type,
        earned: true,
        earnedAt: earned.earnedAt,
      });
    }

    return items;
  }, [earnedBadges]);

  // ---- 카운트 ----
  const earnedItems = useMemo(() => allBadges.filter((b) => b.earned), [allBadges]);
  const lockedItems = useMemo(() => allBadges.filter((b) => !b.earned), [allBadges]);

  // ---- 카테고리별 카운트 (필터 칩 라벨에 사용) ----
  const categoryCounts = useMemo(() => {
    const counts: Record<BadgeCategory, number> = {
      game: 0,
      team: 0,
      community: 0,
      season: 0,
      milestone: 0,
    };
    for (const b of allBadges) {
      const meta = resolveBadgeMeta(b.type);
      counts[meta.category] += 1;
    }
    return counts;
  }, [allBadges]);

  // ---- 필터 적용 ----
  const shownBadges = useMemo(() => {
    if (filter === "all") return allBadges;
    if (filter === "earned") return earnedItems;
    if (filter === "locked") return lockedItems;
    // 카테고리 필터 — meta.category 매칭
    return allBadges.filter((b) => resolveBadgeMeta(b.type).category === filter);
  }, [filter, allBadges, earnedItems, lockedItems]);

  // ---- 최근 획득 4건 (earned 만, earnedAt desc) ----
  const recent4 = useMemo(() => {
    return [...earnedItems]
      .sort((a, b) => (b.earnedAt ?? "").localeCompare(a.earnedAt ?? ""))
      .slice(0, 4);
  }, [earnedItems]);

  // ---- 달성률 ----
  const achievementPct = allBadges.length > 0
    ? Math.round((earnedItems.length / allBadges.length) * 100)
    : 0;

  return (
    <div className="page">
      {/* Breadcrumb — 시안 L42-46 */}
      <div
        style={{
          display: "flex",
          gap: 6,
          fontSize: 12,
          color: "var(--ink-mute)",
          marginBottom: 12,
        }}
      >
        <a href="/" style={{ cursor: "pointer" }}>홈</a>
        <span>›</span>
        <a href="/profile" style={{ cursor: "pointer" }}>프로필</a>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>업적</span>
      </div>

      {/* Header — 시안 L48-67 */}
      <div
        className="card"
        style={{
          padding: "28px 32px",
          marginBottom: 18,
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 24,
          alignItems: "center",
        }}
      >
        <div>
          <div className="eyebrow">ACHIEVEMENTS</div>
          <h1
            style={{
              margin: "4px 0 6px",
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            내가 걸어온 기록
          </h1>
          <p style={{ margin: 0, color: "var(--ink-mute)", fontSize: 14 }}>
            경기·팀·커뮤니티 활동으로 모은 업적 배지. 희소도가 낮을수록 귀한
            배지입니다.
          </p>
        </div>
        {/* 통계 3셀 (획득/전체/달성률) */}
        <div style={{ display: "flex", gap: 18 }}>
          {[
            { l: "획득", v: earnedItems.length, c: "var(--accent)" },
            { l: "전체", v: allBadges.length, c: "var(--ink)" },
            { l: "달성률", v: `${achievementPct}%`, c: "var(--ok)" },
          ].map((s) => (
            <div key={s.l} style={{ textAlign: "center", minWidth: 80 }}>
              <div
                style={{
                  fontFamily: "var(--ff-display)",
                  fontSize: 32,
                  fontWeight: 900,
                  color: s.c,
                  letterSpacing: "-0.02em",
                }}
              >
                {s.v}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--ink-dim)",
                  fontWeight: 700,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 획득 4건 — earned 1개 이상일 때만 표시 (시안 L70-83) */}
      {recent4.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              margin: "0 0 10px",
            }}
          >
            최근 획득
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 10,
            }}
          >
            {recent4.map((b) => {
              const meta = resolveBadgeMeta(b.type);
              return (
                <div
                  key={b.key}
                  className="card"
                  style={{
                    padding: "16px 18px",
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    borderLeft: `3px solid ${TIER_COLOR[meta.tier]}`,
                  }}
                >
                  <div style={{ fontSize: 32, width: 42, textAlign: "center" }}>
                    {meta.icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{b.name}</div>
                    {/* rarity 미지원 — "—" 폴백 + dim 색 */}
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--ink-dim)",
                        fontFamily: "var(--ff-mono)",
                      }}
                      title="희소도 측정 준비 중"
                    >
                      {fmtDate(b.earnedAt)} · 상위 —
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 필터 칩 — 시안 L86-95 */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        {[
          { id: "all" as const, label: `전체 · ${allBadges.length}` },
          { id: "earned" as const, label: `획득 · ${earnedItems.length}` },
          { id: "locked" as const, label: `진행중 · ${lockedItems.length}` },
          // 카테고리 5종 — count > 0 만 노출하면 시안과 차이 — 시안은 항상 5종 표시
          ...(["game", "team", "community", "season", "milestone"] as BadgeCategory[]).map(
            (cat) => ({
              id: cat,
              label: `${CATEGORY_LABEL[cat]} · ${categoryCounts[cat]}`,
            }),
          ),
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`btn btn--sm${filter === f.id ? " btn--primary" : ""}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 배지 그리드 — 시안 L97-120 (4열) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
        }}
      >
        {shownBadges.map((b) => {
          const meta = resolveBadgeMeta(b.type);
          return (
            <div
              key={b.key}
              className="card"
              style={{
                padding: "22px 20px",
                position: "relative",
                opacity: b.earned ? 1 : 0.65,
              }}
            >
              {/* tier 라벨 (우상단) */}
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: ".08em",
                  color: TIER_COLOR[meta.tier],
                  textTransform: "uppercase",
                }}
              >
                {TIER_LABEL[meta.tier]}
              </div>

              {/* 아이콘 (잠금 상태면 자물쇠 + 그레이) */}
              <div
                style={{
                  fontSize: 48,
                  textAlign: "center",
                  marginBottom: 10,
                  filter: b.earned ? "none" : "grayscale(100%)",
                }}
              >
                {b.earned ? meta.icon : "🔒"}
              </div>

              {/* 이름 */}
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 14,
                  textAlign: "center",
                  marginBottom: 4,
                }}
              >
                {b.name}
              </div>

              {/* 설명 */}
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--ink-mute)",
                  textAlign: "center",
                  lineHeight: 1.5,
                  minHeight: 32,
                }}
              >
                {meta.desc}
              </div>

              {/* 획득 / 진행도 푸터 */}
              {b.earned ? (
                <div
                  style={{
                    marginTop: 10,
                    padding: "8px 10px",
                    background: "var(--bg-alt)",
                    borderRadius: 4,
                    fontSize: 10,
                    fontFamily: "var(--ff-mono)",
                    display: "flex",
                    justifyContent: "space-between",
                    color: "var(--ink-dim)",
                  }}
                >
                  <span>✓ {fmtDate(b.earnedAt)}</span>
                  {/* rarity 측정 준비 중 — "—" 폴백 */}
                  <span title="희소도 측정 준비 중">상위 —</span>
                </div>
              ) : (
                // 진행도 0% 폴백 + tooltip — DB 에 progress 컬럼 없음
                <div
                  style={{ marginTop: 10 }}
                  title="진행도 측정 준비 중"
                >
                  <div
                    style={{
                      height: 6,
                      background: "var(--bg-alt)",
                      borderRadius: 3,
                      overflow: "hidden",
                      marginBottom: 4,
                    }}
                  >
                    {/* 0% 바 — 카탈로그 색 유지하되 width:0 */}
                    <div
                      style={{
                        width: "0%",
                        height: "100%",
                        background: TIER_COLOR[meta.tier],
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--ink-dim)",
                      fontFamily: "var(--ff-mono)",
                      textAlign: "center",
                    }}
                  >
                    0 / —
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* 빈 상태 — 필터 결과 0건 */}
        {shownBadges.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: "48px 20px",
              textAlign: "center",
              color: "var(--ink-mute)",
              fontSize: 14,
            }}
          >
            해당 조건의 배지가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
