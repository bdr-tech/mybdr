/* ============================================================
 * TeamSideCard — /profile v2 소속 팀 사이드 카드
 *
 * 왜:
 * - v2 Profile.jsx L44~53 좌측 aside "소속 팀" 카드 재현.
 * - 시안은 1팀 선택형 (TEAMS[0]) 이나 실제 DB 에는 여러 팀 소속 가능.
 *   → 첫 번째 활성 팀(기존 getProfile teams 리스트 0번) 만 표시. 복수 시 "외 N팀" 메타 추가.
 * - "리딤" 같은 팀 tag 는 DB 필드 없음 → team name 첫 2글자 이니셜로 폴백.
 *
 * 어떻게:
 * - Link → /teams/[id] 이동.
 * - 팀 로고(logoUrl) 있으면 이미지, 없으면 primaryColor 배경 + 이니셜 텍스트.
 * - 팀 1개 이상일 때만 렌더. 0개면 컴포넌트 자체 숨김 (페이지에서 조건부 렌더).
 * ============================================================ */

import Image from "next/image";
import Link from "next/link";

export interface TeamSideItem {
  id: string;
  name: string;
  /** 팀 색상 — 기본 var(--accent) */
  primaryColor: string | null;
  /** 팀 로고 URL — 없으면 이니셜 폴백 */
  logoUrl: string | null;
  /** 총 팀 개수 (복수일 때 "외 N팀" 표시용) */
}

export interface TeamSideCardProps {
  primaryTeam: TeamSideItem;
  /** 총 소속팀 수 — 2 이상일 때 "외 N팀" 메타 추가 */
  totalTeams: number;
}

export function TeamSideCard({ primaryTeam, totalTeams }: TeamSideCardProps) {
  // 팀 tag 이니셜 — 한글 2글자 또는 영문 앞 3글자
  const tagInitial = primaryTeam.name.trim().slice(0, 3).toUpperCase();
  // 배경색 — null 이면 v2 accent 폴백
  const bgColor = primaryTeam.primaryColor ?? "var(--accent)";

  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: "var(--ink)" }}>
        소속 팀
      </div>

      <Link
        href={`/teams/${primaryTeam.id}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: 8,
          background: "var(--bg-alt)",
          borderRadius: 6,
          textDecoration: "none",
          color: "inherit",
        }}
      >
        {/* 팀 로고 / 이니셜 */}
        <span
          style={{
            width: 32,
            height: 32,
            background: bgColor,
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--ff-mono)",
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 4,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {primaryTeam.logoUrl ? (
            <Image
              src={primaryTeam.logoUrl}
              alt={primaryTeam.name}
              width={32}
              height={32}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            tagInitial
          )}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 13,
              color: "var(--ink)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {primaryTeam.name}
          </div>
          {/* 복수 팀 메타 — 2팀 이상일 때만 */}
          {totalTeams > 1 && (
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontFamily: "var(--ff-mono)",
              }}
            >
              외 {totalTeams - 1}팀
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
