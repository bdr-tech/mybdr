/* ============================================================
 * PlayerHero — /users/[id] v2 타인 프로필 Hero (그라디언트 히어로)
 *
 * 왜:
 * - v2 PlayerProfile.jsx L69~116 Hero 블록 재현. 그라디언트 배경 + 120px 아바타 +
 *   이름·이니셜 아래 physical strip (키/몸무게/최근접속 3열 축소 — D-P3).
 * - 데이터 있는 DB 필드(PM 지시) 전부 표시:
 *   · bio                → 그라디언트 영역 아래 설명 문단
 *   · gender             → 메타 줄 (실명 · 지역 · 나이 · 성별)
 *   · evaluation_rating  → ★ 별점 (메타 줄 우측 또는 배지 근처)
 *
 * 어떻게:
 * - 그라디언트 배경은 소속팀 primaryColor 기반 (v2 원본 team.color).
 *   팀 없으면 v2 bdr-red 기본. color-mix 로 50%+black 조합.
 * - 아바타 120px 원형 + 이니셜/이미지.
 * - Physical strip: 3열 축소 (키 / 몸무게 / 최근접속). rating/wing/hand 제거 (D-P3).
 * - 배경 색 위 텍스트 가독성: 배경이 밝을 수 있어 color-mix 없이 흰색 ink 고정.
 * ============================================================ */

import Image from "next/image";

import type { ReactNode } from "react";

const POSITION_KO: Record<string, string> = {
  PG: "포인트가드",
  SG: "슈팅가드",
  SF: "스몰포워드",
  PF: "파워포워드",
  C: "센터",
};

const GENDER_KO: Record<string, string> = {
  male: "남",
  female: "여",
  mixed: "혼성",
};

export interface PlayerHeroUser {
  nickname: string | null;
  name: string | null;
  profile_image_url: string | null;
  position: string | null;
  height: number | null;
  weight: number | null;
  city: string | null;
  district: string | null;
  bio: string | null;
  gender: string | null;
  evaluation_rating: number | null;
  /** 가입일 — 최근 접속 대체 (last_login_at 이 없으므로 createdAt 보여줌) */
  createdAt: string | null;
  /** 마지막 로그인 (있으면) */
  lastLoginAt: string | null;
}

export interface PlayerHeroLevel {
  level: number;
  title: string;
  emoji: string;
}

export interface PlayerHeroProps {
  user: PlayerHeroUser;
  level: PlayerHeroLevel | null;
  /** 대표 팀 색상 (primaryColor) — 배경 그라디언트용. null 이면 --bdr-red */
  teamColor: string | null;
  /** 대표 팀 이름 — 메타에 사용 ("{TEAM_NAME}") */
  teamName: string | null;
  /** 팔로우·메시지 등 액션 슬롯 (ActionButtons) */
  actionSlot?: ReactNode;
}

/** ISO 일자 → "N일 전" / "N시간 전" 간이 relative 포맷 */
function relativeKo(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return null;
  const min = Math.floor(diffMs / (60 * 1000));
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}일 전`;
  const mon = Math.floor(day / 30);
  if (mon < 12) return `${mon}개월 전`;
  return `${Math.floor(mon / 12)}년 전`;
}

export function PlayerHero({
  user,
  level,
  teamColor,
  teamName,
  actionSlot,
}: PlayerHeroProps) {
  const displayName = user.nickname ?? user.name ?? "사용자";
  // 이니셜: 2자 (한글 성+이름 or 영문 앞 2자)
  const initial = displayName.trim().slice(0, 2).toUpperCase();
  const bgColor = teamColor ?? "var(--bdr-red)";
  // 그라디언트 — v2 color-mix 사용. fallback 값은 라이트/다크 동일 톤 저하.
  const gradient = `linear-gradient(135deg, ${bgColor} 0%, color-mix(in oklab, ${bgColor} 50%, #000) 100%)`;

  // 메타 줄: 실명 · 지역 · 성별 (시안의 "김민재 · 서울 송파 · 28세" 대체)
  const metaParts: string[] = [];
  if (user.name) metaParts.push(user.name);
  const location = [user.city, user.district].filter(Boolean).join(" ");
  if (location) metaParts.push(location);
  if (user.gender) {
    metaParts.push(GENDER_KO[user.gender] ?? user.gender);
  }

  // 평점 — 0 초과만 표시
  const ratingNum = user.evaluation_rating ?? 0;
  const showRating = ratingNum > 0;

  // 최근 접속 — lastLoginAt 우선, 없으면 "가입일" 폴백
  const lastSeen = relativeKo(user.lastLoginAt) ?? relativeKo(user.createdAt) ?? "-";

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
      {/* 그라디언트 영역 */}
      <div
        style={{
          padding: "32px 32px 24px",
          background: gradient,
          color: "#fff",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gap: 24,
          alignItems: "center",
        }}
      >
        {/* 아바타 — 120px 원형 */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "rgba(255,255,255,.18)",
              border: "3px solid rgba(255,255,255,.35)",
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--ff-display)",
              fontWeight: 900,
              fontSize: 32,
              color: "#fff",
              overflow: "hidden",
            }}
          >
            {user.profile_image_url ? (
              <Image
                src={user.profile_image_url}
                alt={displayName}
                width={120}
                height={120}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              initial
            )}
          </div>
        </div>

        {/* 이름 + 메타 */}
        <div style={{ minWidth: 0 }}>
          {/* 포지션·팀명 eyebrow */}
          {(user.position || teamName) && (
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                marginBottom: 4,
                fontSize: 11,
                opacity: 0.85,
                fontWeight: 700,
                letterSpacing: ".08em",
              }}
            >
              {user.position && (
                <>
                  <span>{POSITION_KO[user.position] ?? user.position}</span>
                </>
              )}
              {user.position && teamName && <span>·</span>}
              {teamName && <span>{teamName.toUpperCase()}</span>}
            </div>
          )}

          {/* 닉네임 h1 */}
          <h1
            style={{
              margin: "0 0 4px",
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#fff",
            }}
          >
            {displayName}
          </h1>

          {/* 메타 줄 — 실명·지역·성별 */}
          {metaParts.length > 0 && (
            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 10 }}>
              {metaParts.join(" · ")}
            </div>
          )}

          {/* 배지들 — Lv / ★평점 */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {level && (
              <span
                style={{
                  background: "rgba(0,0,0,.3)",
                  color: "#fff",
                  padding: "3px 8px",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 4,
                }}
                title={level.title}
              >
                {level.emoji} L.{level.level}
              </span>
            )}
            {showRating && (
              <span
                style={{
                  background: "rgba(255,255,255,.2)",
                  color: "#fff",
                  padding: "3px 8px",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 4,
                  fontFamily: "var(--ff-mono)",
                }}
              >
                ★ {ratingNum.toFixed(2)}
              </span>
            )}
          </div>

          {/* bio — 그라디언트 영역 안 하단 */}
          {user.bio && (
            <p
              style={{
                marginTop: 10,
                fontSize: 13,
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.92)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {user.bio}
            </p>
          )}
        </div>

        {/* 액션 슬롯 — 팔로우/메시지 버튼 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 140 }}>
          {actionSlot}
        </div>
      </div>

      {/* Physical strip — 3열 축소 (키 / 몸무게 / 최근접속) D-P3 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-elev)",
        }}
      >
        {[
          { label: "키", value: user.height ? `${user.height}cm` : "-" },
          { label: "몸무게", value: user.weight ? `${user.weight}kg` : "-" },
          { label: "최근 접속", value: lastSeen },
        ].map((v, i) => (
          <div
            key={v.label}
            style={{
              padding: "12px 10px",
              textAlign: "center",
              borderLeft: i > 0 ? "1px solid var(--border)" : 0,
            }}
          >
            <div
              style={{
                fontFamily: "var(--ff-display)",
                fontWeight: 800,
                fontSize: 15,
                letterSpacing: "-0.01em",
                color: "var(--ink)",
              }}
            >
              {v.value}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--ink-dim)",
                fontWeight: 600,
                letterSpacing: ".04em",
                textTransform: "uppercase",
                marginTop: 2,
              }}
            >
              {v.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
