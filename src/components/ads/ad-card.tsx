"use client";

/* ============================================================
 * AdCard — 네이티브 광고 카드 컴포넌트
 *
 * 3가지 variant:
 *   - feed: 소식 피드에 삽입 (가로 카드, 280px min-width)
 *   - sidebar: 우측 사이드바 위젯 (세로 카드)
 *   - list: 리스트 상단 배너 (풀 width)
 *
 * 공통 규칙:
 *   - "광고" 뱃지 필수 (text-[10px], surface-bright bg, text-muted 색상)
 *   - CSS 변수만 사용, Material Symbols 아이콘
 *   - 광고 데이터가 없으면 null 반환 (영역 숨김)
 * ============================================================ */

import useSWR from "swr";

// 광고 데이터 타입
export interface AdData {
  id: string;
  headline: string;
  description: string | null;
  image_url: string | null;
  link_url: string;
  cta_text: string | null;
  partner_name: string;
  partner_logo: string | null;
  placement: string;
}

interface AdResponse {
  ads: AdData[];
}

// 광고 뱃지 — 모든 variant 공통, 사용자가 광고임을 인식할 수 있게 표시
function AdBadge() {
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium"
      style={{
        backgroundColor: "var(--color-surface-bright)",
        color: "var(--color-text-muted)",
      }}
    >
      광고
    </span>
  );
}

// ─── 피드형 광고 카드 (소식 피드 2번째 위치에 삽입) ───
function FeedAdCard({ ad }: { ad: AdData }) {
  return (
    <a
      href={ad.link_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="min-w-[280px] snap-start rounded-md border p-5 flex flex-col justify-between shrink-0 transition-all hover:shadow-md active:scale-[0.98]"
      style={{
        backgroundColor: "var(--color-card)",
        borderColor: "var(--color-border)",
        minHeight: "140px",
      }}
    >
      <div>
        {/* 상단: 광고 뱃지 + 파트너명 */}
        <div className="flex items-center gap-2 mb-2">
          <AdBadge />
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {ad.partner_name}
          </span>
        </div>

        {/* 광고 제목 */}
        <p className="text-sm font-bold truncate mb-1" style={{ color: "var(--color-text-primary)" }}>
          {ad.headline}
        </p>

        {/* 광고 설명 */}
        {ad.description && (
          <p className="text-xs line-clamp-2" style={{ color: "var(--color-text-muted)" }}>
            {ad.description}
          </p>
        )}
      </div>

      {/* 하단 CTA */}
      <span className="text-xs font-medium mt-3" style={{ color: "var(--color-info)" }}>
        {ad.cta_text || "자세히 보기"} →
      </span>
    </a>
  );
}

// ─── 사이드바형 광고 카드 (우측 사이드바 위젯) ───
function SidebarAdCard({ ad }: { ad: AdData }) {
  return (
    <a
      href={ad.link_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block rounded-md border p-4 transition-all hover:shadow-md"
      style={{
        backgroundColor: "var(--color-card)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* 상단: 광고 뱃지 */}
      <div className="flex items-center justify-between mb-3">
        <AdBadge />
        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          {ad.partner_name}
        </span>
      </div>

      {/* 광고 이미지 (있으면 표시) */}
      {ad.image_url && (
        <div
          className="w-full h-28 rounded-lg mb-3 bg-cover bg-center"
          style={{ backgroundImage: `url(${ad.image_url})` }}
        />
      )}

      {/* 제목 + 설명 */}
      <p className="text-sm font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
        {ad.headline}
      </p>
      {ad.description && (
        <p className="text-xs line-clamp-2 mb-2" style={{ color: "var(--color-text-muted)" }}>
          {ad.description}
        </p>
      )}

      {/* CTA */}
      <span className="text-xs font-medium" style={{ color: "var(--color-info)" }}>
        {ad.cta_text || "자세히 보기"} →
      </span>
    </a>
  );
}

// ─── 리스트 상단 배너형 광고 (코트 목록 등에 삽입) ───
function ListAdCard({ ad }: { ad: AdData }) {
  return (
    <a
      href={ad.link_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block rounded-md border p-4 transition-all hover:shadow-md"
      style={{
        backgroundColor: "var(--color-card)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex items-center gap-4">
        {/* 왼쪽: 이미지 또는 아이콘 */}
        {ad.image_url ? (
          <div
            className="w-16 h-16 rounded-lg shrink-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${ad.image_url})` }}
          />
        ) : (
          <div
            className="w-16 h-16 rounded-lg shrink-0 flex items-center justify-center"
            style={{ backgroundColor: "var(--color-surface)" }}
          >
            <span className="material-symbols-outlined text-2xl" style={{ color: "var(--color-text-disabled)" }}>
              campaign
            </span>
          </div>
        )}

        {/* 가운데: 텍스트 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <AdBadge />
            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
              {ad.partner_name}
            </span>
          </div>
          <p className="text-sm font-bold truncate" style={{ color: "var(--color-text-primary)" }}>
            {ad.headline}
          </p>
          {ad.description && (
            <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
              {ad.description}
            </p>
          )}
        </div>

        {/* 오른쪽: CTA */}
        <span className="text-xs font-medium shrink-0" style={{ color: "var(--color-info)" }}>
          {ad.cta_text || "보기"} →
        </span>
      </div>
    </a>
  );
}

// ─── 공개 훅: 특정 placement의 광고를 가져옴 ───
export function useAds(placement: string) {
  const { data } = useSWR<AdResponse>(
    `/api/web/ads?placement=${placement}`,
    { dedupingInterval: 300_000 } // 5분 중복 요청 방지
  );
  return data?.ads ?? [];
}

// ─── 피드 광고 위젯: 소식 피드에 삽입할 광고 1개 반환 ───
export function FeedAd() {
  const ads = useAds("feed");
  // 광고 없으면 null (영역 숨김)
  if (ads.length === 0) return null;
  return <FeedAdCard ad={ads[0]} />;
}

// ─── 사이드바 광고 위젯: 우측 사이드바에 표시 ───
export function SidebarAd() {
  const ads = useAds("sidebar");
  if (ads.length === 0) return null;
  return <SidebarAdCard ad={ads[0]} />;
}

// ─── 코트 상단 광고 위젯: 코트 리스트 상단에 표시 ───
export function CourtTopAd() {
  const ads = useAds("court_top");
  if (ads.length === 0) return null;
  return <ListAdCard ad={ads[0]} />;
}

// ─── 리스트형 광고 위젯: 범용 리스트에 삽입 ───
export function ListAd({ placement = "list" }: { placement?: string }) {
  const ads = useAds(placement);
  if (ads.length === 0) return null;
  return <ListAdCard ad={ads[0]} />;
}
