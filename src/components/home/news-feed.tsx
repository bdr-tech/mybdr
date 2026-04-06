"use client";

/* ============================================================
 * NewsFeed — 홈 소식 피드 (가로 스크롤 카드)
 *
 * /api/web/home/news에서 대회/픽업/이벤트/프로모션 통합 데이터를 받아
 * 가로 스크롤 카드 리스트로 표시한다.
 * snap-scroll로 카드 단위 스크롤이 되도록 함.
 * ============================================================ */

import React from "react";
import useSWR from "swr";
import Link from "next/link";
import { FeedAd } from "@/components/ads/ad-card";

// API 응답 아이템 타입
interface NewsItem {
  type: "tournament" | "pickup" | "event" | "promo";
  id: string;
  title: string;
  link: string;
  // tournament 전용
  registration_end_at?: string;
  venue_name?: string;
  start_date?: string;
  // pickup 전용
  scheduled_date?: string;
  start_time?: string;
  current_players?: number;
  max_players?: number;
  court_name?: string;
  court_type?: string; // indoor | outdoor | unknown — 실내/야외 구분
  // promo 전용
  description?: string;
  icon?: string;
}

interface NewsResponse {
  items: NewsItem[];
}

// D-Day 계산 헬퍼
function getDDay(dateStr: string): string {
  const diff = Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diff <= 0) return "마감임박";
  return `D-${diff}`;
}

// 날짜 포맷 헬퍼 (3/25 화)
function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
}

interface NewsFeedProps {
  preferredRegions?: string[];
}

export function NewsFeed({ preferredRegions }: NewsFeedProps) {
  // 맞춤 지역이 있으면 regions 쿼리 파라미터로 전달
  const regionsQuery =
    preferredRegions && preferredRegions.length > 0
      ? `?regions=${encodeURIComponent(preferredRegions.join(","))}`
      : "";

  const { data, isLoading } = useSWR<NewsResponse>(
    `/api/web/home/news${regionsQuery}`,
    { dedupingInterval: 60000 }
  );

  // 로딩: 컴팩트 스켈레톤 3줄
  if (isLoading) {
    return (
      <div>
        <h3
          className="text-sm font-black uppercase text-[var(--color-text-secondary)] mb-2 tracking-wide"
        >
          LATEST NEWS
        </h3>
        <div className="flex flex-col gap-1.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 rounded border animate-pulse bg-[var(--color-card)] border-[var(--color-border)]"
            />
          ))}
        </div>
      </div>
    );
  }

  const items = data?.items ?? [];

  // 빈 상태
  if (items.length === 0) {
    return (
      <div
        className="text-center py-8 text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        아직 소식이 없어요
      </div>
    );
  }

  /* 컴팩트 리스트: 제목 축소 + 세로 리스트로 배치하여 공간 절약 */
  return (
    <div>
      <h3
        className="text-sm font-black uppercase text-[var(--color-text-secondary)] mb-2 tracking-wide"
      >
        LATEST NEWS
      </h3>
      {/* 컴팩트 세로 리스트 — 카드가 아닌 얇은 행으로 표시 */}
      <div className="flex flex-col gap-1.5">
        {items.map((item, idx) => (
          <React.Fragment key={`${item.type}-${item.id}`}>
            {idx === 1 && <FeedAd />}
            <NewsCard item={item} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* 개별 소식 카드 — 컴팩트 1줄 인라인 형태 */
function NewsCard({ item }: { item: NewsItem }) {
  // 프로모션: 그라디언트 배경의 얇은 배너
  if (item.type === "promo") {
    return (
      <Link
        href={item.link}
        className="flex items-center gap-2.5 rounded px-3 py-2 transition-all hover:brightness-110 shadow-glow-primary group"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary) 0%, var(--color-navy, #1B3C87) 100%)",
        }}
      >
        {/* 아이콘 */}
        <span className="material-symbols-outlined text-base text-white/80 shrink-0">
          {item.icon ?? "campaign"}
        </span>
        {/* 제목 + 설명을 1줄로 */}
        <span className="flex-1 min-w-0 truncate text-[11px] font-black uppercase tracking-wider text-white">
          {item.title}
        </span>
        {/* 화살표 */}
        <span className="material-symbols-outlined text-xs text-white/60 shrink-0">arrow_forward_ios</span>
      </Link>
    );
  }

  // 일반 카드 (대회/픽업/이벤트) — 컴팩트 1줄 행
  const config = getCardConfig(item);

  return (
    <Link
      href={item.link}
      className="flex items-center gap-2.5 rounded border px-3 py-2 transition-all bg-[var(--color-card)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-glow-primary active:scale-[0.99] group"
    >
      {/* 타입 아이콘 */}
      <span
        className="material-symbols-outlined text-base shrink-0"
        style={{ color: config.color }}
      >
        {config.icon}
      </span>

      {/* 제목 + 부가 정보 — 1줄로 축소 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-black uppercase tracking-widest shrink-0"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
          {/* 픽업: 실내/야외 뱃지 */}
          {item.type === "pickup" && item.court_type && item.court_type !== "unknown" && (
            <CourtTypeBadge courtType={item.court_type} />
          )}
          <span
            className="text-[11px] font-bold uppercase tracking-wide truncate group-hover:text-[var(--color-primary)] transition-colors"
            style={{ color: "var(--color-text-primary)" }}
          >
            {item.title}
          </span>
        </div>
      </div>

      {/* D-Day 뱃지 (대회만) 또는 CTA 화살표 */}
      {item.type === "tournament" && item.registration_end_at ? (
        <span
          className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm shrink-0"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "#fff",
          }}
        >
          {getDDay(item.registration_end_at)}
        </span>
      ) : (
        <span
          className="material-symbols-outlined text-xs shrink-0"
          style={{ color: config.color }}
        >
          arrow_forward_ios
        </span>
      )}
    </Link>
  );
}

/* 카드 타입별 설정값 반환 */
function getCardConfig(item: NewsItem) {
  switch (item.type) {
    case "tournament":
      return {
        icon: "emoji_events",
        label: "대회",
        color: "var(--color-warning)",
        subtitle: item.venue_name
          ? `${item.venue_name} · ${item.start_date ? formatShortDate(item.start_date) : ""}`
          : item.start_date
            ? formatShortDate(item.start_date)
            : "접수 중",
        cta: "참가하기",
      };
    case "pickup":
      return {
        icon: "sports_basketball",
        label: "픽업게임",
        color: "var(--color-info)",
        subtitle: `${item.court_name ?? ""} · ${item.scheduled_date ? formatShortDate(item.scheduled_date) : ""} ${item.start_time ?? ""} · ${item.current_players ?? 0}/${item.max_players ?? 0}명`,
        cta: "참가",
      };
    case "event":
      return {
        icon: "celebration",
        label: "이벤트",
        color: "var(--color-success)",
        subtitle: `${item.court_name ?? ""} · ${item.scheduled_date ? formatShortDate(item.scheduled_date) : ""}`,
        cta: "자세히",
      };
    default:
      return {
        icon: "campaign",
        label: "소식",
        color: "var(--color-text-secondary)",
        subtitle: "",
        cta: "보기",
      };
  }
}

/* 실내/야외 뱃지 — 소식 피드 픽업 카드용 */
function CourtTypeBadge({ courtType }: { courtType: string }) {
  const isIndoor = courtType === "indoor";
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
      style={{
        backgroundColor: isIndoor
          ? "color-mix(in srgb, var(--color-info) 15%, transparent)"
          : "color-mix(in srgb, var(--color-success) 15%, transparent)",
        color: isIndoor ? "var(--color-info)" : "var(--color-success)",
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "11px" }}>
        {isIndoor ? "stadium" : "park"}
      </span>
      {isIndoor ? "실내" : "야외"}
    </span>
  );
}
