/* ============================================================
 * HeroCard — /profile v2 본인 프로필 Hero (좌측 사이드)
 *
 * 왜 이렇게 작성하나:
 * - v2 Profile.jsx L31~42 의 좌측 aside 카드를 기존 ProfileHero 대신 재현.
 *   기존 ProfileHero 는 `--color-*` 구식 변수 사용 + 가로 레이아웃 → v2 시안(세로 카드)과
 *   구조가 달라 공존 시 시각적 불일치 발생. 파일은 보존(Phase 9 cleanup).
 * - 데이터 있는 DB 필드(PM 지시) 전부 표시:
 *   · bio        → hero 하단 구분선 아래 문단
 *   · gender     → 메타 줄 (포지션 옆 · 남/여/혼성)
 *   · evaluation_rating → ★ 별점 (메타 줄 우측)
 *   · Lv.N 배지 + PRO 멤버(구독 중) + 포지션/지역 정보
 * - 서버 컴포넌트 — 상호작용 없음, 페이지 SSR 과 동일 렌더 타이밍.
 *
 * 어떻게:
 * - .card 클래스 + v2 토큰(--bg-alt/--ink/--ink-mute) 전면 사용, 하드코딩 색상 0.
 * - 아바타는 Image(profile_image_url) 또는 이니셜 폴백. 크기 96px(시안).
 * - CTA 2개: 프로필 편집(/profile/edit) + 알림 n건(/notifications).
 * - 이름 아래 "팀명 · 포지션" 메타. 팀 없으면 포지션만.
 * ============================================================ */

import Image from "next/image";
import Link from "next/link";

// 포지션 코드 → 한글 풀네임 (기존 ProfileHero 의 POSITION_LABEL 재구성)
// 메타 줄에는 약어만 노출 (v2 시안 "가드")
const POSITION_KO: Record<string, string> = {
  PG: "가드",
  SG: "가드",
  SF: "포워드",
  PF: "포워드",
  C: "센터",
};

// gender DB 값 → 한글 (DB drift 복원 컬럼 — 값은 "male"/"female"/"mixed" 가정)
const GENDER_KO: Record<string, string> = {
  male: "남",
  female: "여",
  mixed: "혼성",
};

export interface HeroCardUser {
  nickname: string | null;
  name: string | null;
  profile_image_url: string | null;
  position: string | null;
  city: string | null;
  district: string | null;
  bio: string | null;
  gender: string | null;
  /** 주최 경기 수 — 활동 요약에 "주최 N경기" 로 표시 */
  total_games_hosted: number | null;
  /** 유저 평가 점수 (0.00~5.00) — 별점으로 표시. 0 또는 null 이면 생략 */
  evaluation_rating: number | null;
}

export interface HeroCardLevel {
  level: number;
  title: string;
  emoji: string;
}

export interface HeroCardTeamSummary {
  /** 대표 팀 이름 — 없으면 "팀 없음" */
  teamName: string | null;
}

export interface HeroCardProps {
  user: HeroCardUser;
  level: HeroCardLevel | null;
  /** PRO 멤버 여부 (subscription_status === "active") */
  isPro: boolean;
  /** 인증 완료 여부 (profile_completed) */
  isVerified: boolean;
  /** 대표 팀 정보 — 이름만 메타 줄에 표시 */
  team: HeroCardTeamSummary | null;
  /** 알림 미확인 건수 — 0이면 "알림 확인"만 표시 */
  unreadCount: number;
}

export function HeroCard({
  user,
  level,
  isPro,
  isVerified,
  team,
  unreadCount,
}: HeroCardProps) {
  // 표시 이름 — nickname 우선, 없으면 name, 둘 다 없으면 "사용자"
  const displayName = user.nickname ?? user.name ?? "사용자";
  // 이미지 없을 때 이니셜 — 한글·영문 혼합 대비 trim 후 첫 글자 대문자화
  const initial = displayName.trim()[0]?.toUpperCase() ?? "U";
  // 메타 1줄 — "팀명 · 포지션 · 지역"
  const metaParts: string[] = [];
  if (team?.teamName) metaParts.push(team.teamName);
  if (user.position) {
    // 포지션 매핑 없으면 원본 코드 그대로 사용
    metaParts.push(POSITION_KO[user.position] ?? user.position);
  }
  const location = [user.city, user.district].filter(Boolean).join(" ");
  if (location) metaParts.push(location);
  const metaLine = metaParts.join(" · ");

  // 메타 2줄 — gender + ★ evaluation_rating (둘 중 하나만 있어도 렌더)
  const genderLabel = user.gender ? (GENDER_KO[user.gender] ?? user.gender) : null;
  // evaluation_rating 은 Decimal(3,2) — Prisma 반환값은 Decimal 객체일 수 있어 Number() 변환 후 체크
  const ratingNum = user.evaluation_rating != null ? Number(user.evaluation_rating) : 0;
  // 0 초과일 때만 별점 표시 (시드값 0.0 은 숨김 처리해 UI 잡음 방지)
  const showRating = ratingNum > 0;

  return (
    // v2 .card 토큰 + 중앙 정렬 레이아웃 (시안 구조)
    <div className="card" style={{ padding: "24px 22px", textAlign: "center" }}>
      {/* 아바타 — 96px 원형, v2 border 2px */}
      <div
        style={{
          width: 96,
          height: 96,
          margin: "0 auto 14px",
          borderRadius: "50%",
          overflow: "hidden",
          border: "3px solid var(--border)",
          background: "var(--bg-alt)",
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--ff-display)",
          fontWeight: 900,
          fontSize: 32,
          color: "var(--ink)",
        }}
      >
        {user.profile_image_url ? (
          <Image
            src={user.profile_image_url}
            alt={displayName}
            width={96}
            height={96}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          initial
        )}
      </div>

      {/* 닉네임 (h1) */}
      <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "var(--ink)" }}>
        {displayName}
      </h1>

      {/* 메타 1줄 — 팀 · 포지션 · 지역 */}
      {metaLine && (
        <div style={{ fontSize: 13, color: "var(--ink-mute)", marginBottom: 6 }}>
          {metaLine}
        </div>
      )}

      {/* 메타 2줄 — 성별 · ★ 평점 (있을 때만) */}
      {(genderLabel || showRating) && (
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-dim)",
            marginBottom: 12,
            display: "flex",
            gap: 8,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {genderLabel && <span>{genderLabel}</span>}
          {genderLabel && showRating && <span>·</span>}
          {showRating && (
            <span style={{ fontFamily: "var(--ff-mono)" }}>
              {/* 별 아이콘은 유니코드 ★ (Material Symbols 아닌 단일 문자 — 시인성 + 크기 일관성) */}
              <span style={{ color: "var(--warn)" }}>★</span> {ratingNum.toFixed(2)}
            </span>
          )}
        </div>
      )}

      {/* 배지 3종 — Lv / PRO / 인증 */}
      <div
        style={{
          display: "flex",
          gap: 6,
          justifyContent: "center",
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        {level && (
          <span className="badge badge--red" title={level.title}>
            {level.emoji} L.{level.level}
          </span>
        )}
        {isPro && <span className="badge badge--soft">PRO 멤버</span>}
        {isVerified && <span className="badge badge--ok">인증완료</span>}
      </div>

      {/* CTA 1 — 프로필 편집 */}
      <Link
        href="/profile/edit"
        className="btn btn--sm"
        style={{ width: "100%", marginBottom: 6, display: "block", textDecoration: "none" }}
      >
        프로필 편집
      </Link>

      {/* CTA 2 — 알림 (미확인 건수 > 0 시 "알림 N건 확인", 아니면 "알림 확인") */}
      <Link
        href="/notifications"
        className="btn btn--sm"
        style={{ width: "100%", display: "block", textDecoration: "none" }}
      >
        {unreadCount > 0 ? `알림 ${unreadCount}건 확인` : "알림 확인"}
      </Link>

      {/* 활동 요약 — 주최 경기 수 (0 초과일 때만) */}
      {user.total_games_hosted != null && user.total_games_hosted > 0 && (
        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            color: "var(--ink-mute)",
          }}
        >
          주최 <span style={{ fontFamily: "var(--ff-mono)", fontWeight: 700, color: "var(--ink-soft)" }}>{user.total_games_hosted}</span>경기
        </div>
      )}

      {/* bio — 있을 때만 구분선 아래 */}
      {user.bio && (
        <p
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px solid var(--border)",
            fontSize: 13,
            lineHeight: 1.6,
            color: "var(--ink-soft)",
            textAlign: "left",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {user.bio}
        </p>
      )}
    </div>
  );
}
