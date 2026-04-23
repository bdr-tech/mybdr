/* ============================================================
 * GameCard — BDR v2 "경기" 카드 (픽업/게스트/연습경기)
 *
 * 왜 이 컴포넌트가 있는가:
 * v2 Games.jsx 시안의 카드 1장 구조를 충실히 재현.
 *   [상단 kind stripe 4px]
 *   [padding 18px / 종류 배지 + 마감임박 배지 + 우측 지역]
 *   [타이틀 15px bold]
 *   [4행 info grid: 장소/일시/레벨/비용]
 *   [자동 파생 태그(최대 3개)]
 *   [푸터: 호스트 + 진행바 + 신청 버튼]
 *
 * 서버 컴포넌트 — Link만 사용. 서버/클라 양쪽에서 렌더 가능.
 *
 * DQ3 방침 — 태그는 props.tags로 받지 않고 DB 필드에서 자동 파생:
 *   - fee=0/null → "무료"
 *   - skill_level ∈ {beginner, lowest, low} → "초보환영"
 *   - scheduled_at 이 토/일 → "주말"
 * 파생은 상위(games-client)에서 수행해 props로 주입한다. (SSR 안전:
 * 서버가 계산해 직렬화된 문자열 배열로 내려준다.)
 * ============================================================ */

import Link from "next/link";
import { decodeHtmlEntities } from "@/lib/utils/decode-html";
import { TYPE_BADGE, SKILL_LABEL } from "@/lib/constants/game-status";

export interface GameCardProps {
  /** 상세 페이지 이동용 경로 */
  href: string;
  /** 경기 종류 코드 — 0=픽업, 1=게스트, 2=연습경기 */
  gameType: number;
  /** 상태 코드 — 3=완료/라이브 등 (마감/만석 판단용) */
  status: number;
  /** 타이틀 — DB 원문 그대로(HTML 엔티티 디코드는 내부에서 수행) */
  title: string | null;
  /** 장소 — venue_name 우선, 없으면 city */
  venueName: string | null;
  /** 노출용 지역(우상단 monospace) — city 혹은 city+district */
  areaLabel: string;
  /** 일시 ISO 문자열 — 없으면 "일정 미정" 표기 */
  scheduledAt: string | null;
  /** 실력 수준 코드 — SKILL_LABEL 한글로 변환해 표시 */
  skillLevel: string | null;
  /** 참가비 원문(decimal string) — 0/null 이면 "무료" 강조 */
  feePerPerson: string | null;
  /** 현재 참가자 수 — 진행바용 */
  currentParticipants: number | null;
  /** 최대 참가자 수 — 진행바/인원 표기용 */
  maxParticipants: number | null;
  /** 호스트 닉네임 */
  authorNickname: string | null;
  /** 자동 파생 태그(최대 3개) — 상위에서 계산해 주입 */
  tags: string[];
}

/* -- ISO → "MM/DD HH:mm" 포맷 (시안과 맞춘 2줄 미만 고정 폭) --
 * 왜: formatRelativeDateTime("3일 후") 형태는 카드에서 읽기는 편하지만
 * 시안은 "9/21 · 18:00" 같은 고정 표기를 선호. 여기서는 간결 포맷을 쓴다. */
function formatScheduleShort(iso: string | null): string {
  if (!iso) return "일정 미정";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "일정 미정";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} · ${hh}:${mi}`;
}

/* -- 마감임박 판단 --
 * 왜: 시안의 badge--red "마감임박" 은 정량 기준이 없으므로,
 * 현실 데이터에 맞춰 (1) scheduled_at 이 24h 이내 OR (2) 진행률 80%+ 인 경우로 한다. */
function isClosingSoon(
  scheduledAt: string | null,
  cur: number,
  max: number,
): boolean {
  if (max > 0 && cur / max >= 0.8) return true;
  if (!scheduledAt) return false;
  const diff = new Date(scheduledAt).getTime() - Date.now();
  return diff > 0 && diff <= 24 * 60 * 60 * 1000;
}

export function GameCard({
  href,
  gameType,
  status,
  title,
  venueName,
  areaLabel,
  scheduledAt,
  skillLevel,
  feePerPerson,
  currentParticipants,
  maxParticipants,
  authorNickname,
  tags,
}: GameCardProps) {
  // 종류 배지 스타일 (TYPE_BADGE 재사용) — bg 값을 stripe 색상으로도 사용
  const typeBadge = TYPE_BADGE[gameType] ?? TYPE_BADGE[0];
  // stripe / 배경 배지 색상은 CSS 변수 참조 — 하드코딩 금지 규칙 준수
  const kindColor = typeBadge.bg;

  // 참가자 계산 — null 안전
  const cur = currentParticipants ?? 0;
  const max = maxParticipants ?? 0;
  const pct = max > 0 ? Math.min((cur / max) * 100, 100) : 0;

  // 상태 플래그
  const isFull = max > 0 && cur >= max;
  const isClosing = !isFull && isClosingSoon(scheduledAt, cur, max);
  // status 3(종료/취소) 혹은 만석이면 신청 비활성화 UI
  const isDisabled = isFull || status === 3 || status === 4;

  // 참가비: "무료" 강조 (시안: 무료면 green bold)
  const feeNum = feePerPerson ? Number(feePerPerson) : 0;
  const isFree = !feePerPerson || feeNum === 0;
  const feeText = isFree ? "무료" : `${feeNum.toLocaleString()}원`;

  // 실력 한글 라벨 (없으면 "전체")
  const skillText =
    skillLevel && SKILL_LABEL[skillLevel] ? SKILL_LABEL[skillLevel] : "전체";

  // 장소 — venue 우선, HTML 엔티티 디코드
  const place = decodeHtmlEntities(venueName ?? areaLabel ?? "");

  return (
    // Link 자체가 카드 컨테이너. .card 클래스는 globals.css v2 토큰 스타일.
    // padding:0 로 재정의하고 overflow:hidden 으로 상단 stripe 가 카드 경계에 붙게 함.
    <Link
      href={href}
      className="card"
      style={{
        padding: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        color: "inherit",
        opacity: isDisabled ? 0.6 : 1,
      }}
    >
      {/* 1. kind stripe — 4px 색상 바, 종류를 한눈에 구분 */}
      <div style={{ height: 4, background: kindColor }} />

      {/* 2. 본문 padding 영역 */}
      <div style={{ padding: "16px 18px 12px" }}>
        {/* 2-1. 상단 배지 줄: 종류 / 마감임박 / 지역(우측) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            className="badge"
            style={{
              background: kindColor,
              color: typeBadge.color,
              borderColor: kindColor,
            }}
          >
            {typeBadge.label}
          </span>
          {isClosing && <span className="badge badge--red">마감임박</span>}
          {isFull && <span className="badge">만석</span>}
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--ff-mono)",
              color: "var(--ink-dim)",
              marginLeft: "auto",
            }}
          >
            {areaLabel || "-"}
          </span>
        </div>

        {/* 2-2. 타이틀 */}
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            lineHeight: 1.4,
            letterSpacing: "-0.005em",
            marginBottom: 10,
            color: "var(--ink)",
            // 2줄 넘어가면 말줄임
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {decodeHtmlEntities(title) || "제목 없음"}
        </div>

        {/* 2-3. 4행 info grid — 라벨 68px / 값 1fr */}
        <div
          style={{
            fontSize: 13,
            color: "var(--ink-mute)",
            display: "grid",
            gridTemplateColumns: "68px 1fr",
            rowGap: 4,
            columnGap: 8,
            marginBottom: 12,
          }}
        >
          <span style={{ color: "var(--ink-dim)" }}>장소</span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {place || "-"}
          </span>
          <span style={{ color: "var(--ink-dim)" }}>일시</span>
          <span>{formatScheduleShort(scheduledAt)}</span>
          <span style={{ color: "var(--ink-dim)" }}>레벨</span>
          <span>{skillText}</span>
          <span style={{ color: "var(--ink-dim)" }}>비용</span>
          <span
            style={{
              fontWeight: isFree ? 700 : 500,
              color: isFree ? "var(--ok)" : "var(--ink-soft)",
            }}
          >
            {feeText}
          </span>
        </div>

        {/* 2-4. 자동 파생 태그 — tags 배열 길이 0이면 섹션 자체 숨김 */}
        {tags.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 4,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            {tags.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 11,
                  padding: "2px 7px",
                  color: "var(--ink-mute)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-chip, 6px)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. 푸터 — 호스트 + 진행바 + 신청 버튼. marginTop:auto 로 카드 최하단 고정 */}
      <div
        style={{
          padding: "12px 18px 14px",
          borderTop: "1px dashed var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: "auto",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                color: "var(--ink-dim)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {authorNickname ? decodeHtmlEntities(authorNickname) : "익명"}
            </span>
            <span
              style={{
                fontFamily: "var(--ff-mono)",
                fontWeight: 700,
                color: isClosing ? "var(--accent)" : "var(--ink-soft)",
              }}
            >
              {cur}/{max || "?"}
            </span>
          </div>
          {/* 진행바 — 4px 높이, 마감임박이면 accent(red), 아니면 kindColor */}
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
                background: isClosing ? "var(--accent)" : kindColor,
              }}
            />
          </div>
        </div>
        {/* 신청 버튼 — 비활성(만석/종료)이면 회색 "마감" 표기.
         * Link 안의 button 은 클릭이 부모 Link로 버블링되는데,
         * 카드 전체가 상세 이동 Link이므로 의도된 동작(버튼 클릭도 상세로 이동).
         * 별도 신청 플로우가 생기면 stopPropagation 처리 필요. */}
        {isDisabled ? (
          <span
            className="btn btn--sm"
            style={{ pointerEvents: "none", opacity: 0.7 }}
          >
            마감
          </span>
        ) : (
          <span className="btn btn--sm btn--primary">신청</span>
        )}
      </div>
    </Link>
  );
}
