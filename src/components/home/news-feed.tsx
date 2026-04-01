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

  // 로딩: 스켈레톤 카드 3장
  if (isLoading) {
    return (
      <div>
        <h3
          className="text-sm font-bold mb-3"
          style={{ color: "var(--color-text-secondary)" }}
        >
          소식
        </h3>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="min-w-[280px] h-[140px] rounded-xl border animate-pulse"
              style={{
                backgroundColor: "var(--color-card)",
                borderColor: "var(--color-border)",
              }}
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

  return (
    <div>
      <h3
        className="text-sm font-bold mb-3"
        style={{ color: "var(--color-text-secondary)" }}
      >
        소식
      </h3>
      {/* 카드 1~2개면 세로 스택으로 꽉 채움, 3개 이상이면 가로 스크롤 */}
      <div className={items.length <= 2
        ? "flex flex-col gap-3"
        : "flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
      }>
        {items.map((item, idx) => (
          <React.Fragment key={`${item.type}-${item.id}`}>
            {/* 2번째 위치(index=1)에 네이티브 광고 삽입 — 광고 없으면 자동 숨김 */}
            {idx === 1 && <FeedAd />}
            <NewsCard item={item} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* 개별 소식 카드 — 타입별 렌더링 분기 */
function NewsCard({ item }: { item: NewsItem }) {
  // 프로모션 카드: 그라디언트 배경 + 특별 디자인
  if (item.type === "promo") {
    return (
      <div
        className="min-w-[280px] flex-1 snap-start rounded-xl p-5 flex flex-col justify-between shrink-0"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary) 0%, var(--color-navy, #1B3C87) 100%)",
          minHeight: "140px",
        }}
      >
        <div>
          <span
            className="material-symbols-outlined text-2xl text-white/80 mb-2 block"
          >
            {item.icon ?? "campaign"}
          </span>
          <p className="text-sm font-bold text-white mb-1">{item.title}</p>
          <p className="text-xs text-white/70">{item.description}</p>
        </div>
        <Link
          href={item.link}
          className="mt-3 text-xs font-bold text-white/90 hover:text-white transition-colors"
        >
          자세히 보기 →
        </Link>
      </div>
    );
  }

  // 일반 카드 (대회/픽업/이벤트)
  const config = getCardConfig(item);

  return (
    <Link
      href={item.link}
      className="min-w-[280px] snap-start rounded-xl border p-5 flex flex-col justify-between shrink-0 transition-all hover:shadow-md active:scale-[0.98]"
      style={{
        backgroundColor: "var(--color-card)",
        borderColor: "var(--color-border)",
        minHeight: "140px",
      }}
    >
      <div>
        {/* 타입 아이콘 + 라벨 + 실내/야외 뱃지 */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="material-symbols-outlined text-lg"
            style={{ color: config.color }}
          >
            {config.icon}
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
          {/* 픽업 카드: 실내/야외 뱃지 */}
          {item.type === "pickup" && item.court_type && item.court_type !== "unknown" && (
            <CourtTypeBadge courtType={item.court_type} />
          )}
          {/* D-Day 뱃지 (대회만) */}
          {item.type === "tournament" && item.registration_end_at && (
            <span
              className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "#fff",
              }}
            >
              {getDDay(item.registration_end_at)}
            </span>
          )}
        </div>

        {/* 제목 */}
        <p
          className="text-sm font-bold truncate mb-1"
          style={{ color: "var(--color-text-primary)" }}
        >
          {item.title}
        </p>

        {/* 부가 정보 */}
        <p
          className="text-xs truncate"
          style={{ color: "var(--color-text-muted)" }}
        >
          {config.subtitle}
        </p>
      </div>

      {/* 하단 CTA */}
      <span
        className="text-xs font-medium mt-3"
        style={{ color: config.color }}
      >
        {config.cta} →
      </span>
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
