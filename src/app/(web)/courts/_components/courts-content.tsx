"use client";

/* ============================================================
 * CourtsContent -- 코트 목록 클라이언트 컴포넌트
 *
 * 서버에서 받은 코트 데이터를 클라이언트에서 필터링한다.
 * - 실내/실외/전체 탭 필터
 * - 지역 드롭다운 필터
 * - 야외 전용 pill 필터 (무료만, 조명있음, 풀코트)
 * - 야외 코트 상단 우선 정렬
 * - 바닥재질, 골대수, 조명시간, 가까운역 뱃지
 * ============================================================ */

import { useState, useMemo } from "react";
import Link from "next/link";

// API에서 직렬화된 코트 데이터 타입
interface CourtItem {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string | null;
  latitude: number;
  longitude: number;
  court_type: string;
  surface_type: string | null;
  hoops_count: number | null;
  is_free: boolean;
  has_lighting: boolean;
  fee: number | null;
  average_rating: number | null;
  reviews_count: number;
  description: string | null;
  // 야외 코트 확장 필드
  nickname: string | null;
  nearest_station: string | null;
  court_size: string | null;
  lighting_until: string | null;
  has_restroom: boolean;
  has_parking: boolean;
  verified: boolean;
  data_source: string | null;
  // 혼잡도: 현재 활성 체크인 세션 수
  activeCount: number;
}

interface CourtsContentProps {
  courts: CourtItem[];
  cities: string[];
}

// 코트 유형 탭 정의
const TYPE_TABS = [
  { key: "all", label: "전체" },
  { key: "outdoor", label: "야외" },
  { key: "indoor", label: "실내" },
] as const;

// 야외 전용 pill 필터 정의
const OUTDOOR_PILLS = [
  { key: "free", label: "무료만", icon: "savings" },
  { key: "lighting", label: "조명있음", icon: "lightbulb" },
  { key: "fullcourt", label: "풀코트", icon: "square_foot" },
] as const;

// 바닥재질 한글 매핑
const SURFACE_LABELS: Record<string, string> = {
  urethane: "우레탄",
  rubber: "고무",
  modular: "모듈형",
  concrete: "콘크리트",
  asphalt: "아스팔트",
  wood: "나무",
};

// 코트 크기 한글 매핑
const SIZE_LABELS: Record<string, string> = {
  fullcourt: "풀코트",
  halfcourt: "하프코트",
  "3x3": "3x3",
};

// 페이지당 코트 수
const COURTS_PER_PAGE = 20;

export function CourtsContent({ courts, cities }: CourtsContentProps) {
  // 필터 상태
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [activePills, setActivePills] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  // pill 필터 토글
  const togglePill = (key: string) => {
    setActivePills((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setPage(1);
  };

  // 필터링 + 야외 우선 정렬
  const filtered = useMemo(() => {
    let result = courts;

    // 유형 필터
    if (typeFilter !== "all") {
      result = result.filter((c) => c.court_type === typeFilter);
    }

    // 지역 필터
    if (cityFilter !== "all") {
      result = result.filter((c) => c.city === cityFilter);
    }

    // pill 필터 (야외 전용)
    if (activePills.has("free")) {
      result = result.filter((c) => c.is_free);
    }
    if (activePills.has("lighting")) {
      result = result.filter((c) => c.has_lighting);
    }
    if (activePills.has("fullcourt")) {
      result = result.filter((c) => c.court_size === "fullcourt");
    }

    // 야외 코트 상단 우선 정렬 + 검증된 코트 우선
    result = [...result].sort((a, b) => {
      // 1순위: 야외 > 실내 > 미분류
      const typeOrder = (t: string) =>
        t === "outdoor" ? 0 : t === "indoor" ? 1 : 2;
      const typeDiff = typeOrder(a.court_type) - typeOrder(b.court_type);
      if (typeDiff !== 0) return typeDiff;

      // 2순위: 검증된(큐레이션) > 미검증
      if (a.verified !== b.verified) return a.verified ? -1 : 1;

      // 3순위: 평점 높은 순
      const rA = a.average_rating ?? 0;
      const rB = b.average_rating ?? 0;
      return rB - rA;
    });

    return result;
  }, [courts, typeFilter, cityFilter, activePills]);

  // 페이지네이션
  const totalPages = Math.ceil(filtered.length / COURTS_PER_PAGE);
  const paged = filtered.slice(0, page * COURTS_PER_PAGE);

  // 필터 변경 시 페이지 리셋
  const handleTypeChange = (key: string) => {
    setTypeFilter(key);
    setPage(1);
    // 실내 탭일 때 야외 전용 pill 비활성화
    if (key === "indoor") setActivePills(new Set());
  };
  const handleCityChange = (val: string) => {
    setCityFilter(val);
    setPage(1);
  };

  // 통계
  const stats = useMemo(() => {
    const indoor = courts.filter((c) => c.court_type === "indoor").length;
    const outdoor = courts.filter((c) => c.court_type === "outdoor").length;
    return { total: courts.length, indoor, outdoor };
  }, [courts]);

  // 야외 탭이 선택되었거나 전체 탭일 때 pill 표시
  const showPills = typeFilter !== "indoor";

  return (
    <div>
      {/* 헤더 영역 */}
      <div className="mb-6">
        <h1
          className="text-2xl font-extrabold tracking-tight sm:text-3xl"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
        >
          내 주변 농구장
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          전국 {stats.total}개 농구장 (실내 {stats.indoor} · 실외 {stats.outdoor})
        </p>
      </div>

      {/* 필터 영역: 유형 탭 + 지역 드롭다운 */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        {/* 유형 탭 (야외/실내/전체) */}
        <div className="flex gap-1.5">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTypeChange(tab.key)}
              className="rounded-[4px] px-4 py-2 text-sm font-semibold transition-all duration-150"
              style={{
                backgroundColor:
                  typeFilter === tab.key
                    ? "var(--color-primary)"
                    : "var(--color-surface-bright)",
                color:
                  typeFilter === tab.key
                    ? "white"
                    : "var(--color-text-secondary)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 지역 드롭다운 */}
        <select
          value={cityFilter}
          onChange={(e) => handleCityChange(e.target.value)}
          className="rounded-[4px] border px-3 py-2 text-sm"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-primary)",
          }}
        >
          <option value="all">전체 지역</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        {/* 결과 수 표시 */}
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {filtered.length}개
        </span>
      </div>

      {/* 야외 전용 pill 필터 */}
      {showPills && (
        <div className="mb-5 flex flex-wrap gap-2">
          {OUTDOOR_PILLS.map((pill) => {
            const isActive = activePills.has(pill.key);
            return (
              <button
                key={pill.key}
                onClick={() => togglePill(pill.key)}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150"
                style={{
                  backgroundColor: isActive
                    ? "color-mix(in srgb, var(--color-primary) 15%, transparent)"
                    : "var(--color-surface-bright)",
                  color: isActive
                    ? "var(--color-primary)"
                    : "var(--color-text-secondary)",
                  border: isActive
                    ? "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)"
                    : "1px solid transparent",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "14px" }}
                >
                  {pill.icon}
                </span>
                {pill.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 코트 리스트 */}
      {paged.length > 0 ? (
        <div className="space-y-3">
          {paged.map((court) => (
            <CourtListCard key={court.id} court={court} />
          ))}
        </div>
      ) : (
        /* 빈 상태 */
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            backgroundColor: "var(--color-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <span
            className="material-symbols-outlined text-4xl mb-3 block"
            style={{ color: "var(--color-text-disabled)" }}
          >
            sports_basketball
          </span>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
            조건에 맞는 농구장이 없습니다
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-disabled)" }}>
            다른 필터를 선택해보세요
          </p>
        </div>
      )}

      {/* 더보기 버튼 */}
      {page < totalPages && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="rounded-[4px] px-6 py-2.5 text-sm font-semibold transition-colors"
            style={{
              backgroundColor: "var(--color-surface-bright)",
              color: "var(--color-text-secondary)",
            }}
          >
            더보기 ({paged.length}/{filtered.length})
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// CourtListCard -- 개별 코트 리스트 카드
// ─────────────────────────────────────────────────────────
function CourtListCard({ court }: { court: CourtItem }) {
  // 코트 유형에 따른 아이콘과 색상
  const isOutdoor = court.court_type === "outdoor";
  const isIndoor = court.court_type === "indoor";
  const typeIcon = isIndoor ? "stadium" : "park";
  const typeLabel = isIndoor ? "실내" : isOutdoor ? "야외" : "미분류";
  const typeBg = isIndoor
    ? "color-mix(in srgb, var(--color-info) 15%, transparent)"
    : "color-mix(in srgb, var(--color-success) 15%, transparent)";
  const typeColor = isIndoor ? "var(--color-info)" : "var(--color-success)";

  // 카카오맵 길찾기 URL
  const kakaoUrl = `https://map.kakao.com/link/to/${encodeURIComponent(court.name)},${court.latitude},${court.longitude}`;

  return (
    <Link href={`/courts/${court.id}`} className="block">
      <div
        className="rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:scale-[1.005] hover:shadow-[var(--shadow-elevated)]"
        style={{
          backgroundColor: "var(--color-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* 상단: 아이콘 + 이름 + 유형 뱃지 */}
        <div className="flex items-start gap-3">
          {/* 유형 아이콘 (원형) */}
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: typeBg }}
          >
            <span className="material-symbols-outlined text-xl" style={{ color: typeColor }}>
              {typeIcon}
            </span>
          </div>

          {/* 코트 정보 */}
          <div className="flex-1 min-w-0">
            {/* 이름 + 검증 뱃지 */}
            <div className="flex items-center gap-2">
              <h3
                className="text-sm font-bold truncate"
                style={{ color: "var(--color-text-primary)" }}
              >
                {court.name}
              </h3>
              {/* 검증 마크: 수동 큐레이션 데이터 */}
              {court.verified && (
                <span
                  className="material-symbols-outlined shrink-0"
                  style={{ fontSize: "14px", color: "var(--color-info)" }}
                  title="검증된 코트"
                >
                  verified
                </span>
              )}
            </div>

            {/* 속성 뱃지 행 */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {/* 실내/실외 */}
              <span
                className="inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium"
                style={{ backgroundColor: typeBg, color: typeColor }}
              >
                {typeLabel}
              </span>

              {/* 코트 크기 (풀코트/하프/3x3) */}
              {court.court_size && SIZE_LABELS[court.court_size] && (
                <span
                  className="rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium"
                  style={{
                    backgroundColor: "var(--color-surface-bright)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {SIZE_LABELS[court.court_size]}
                </span>
              )}

              {/* 바닥재질 */}
              {court.surface_type && SURFACE_LABELS[court.surface_type] && (
                <span
                  className="rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium"
                  style={{
                    backgroundColor: "var(--color-surface-bright)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {SURFACE_LABELS[court.surface_type]}
                </span>
              )}

              {/* 골대 수 */}
              {court.hoops_count && (
                <span
                  className="inline-flex items-center gap-0.5 rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium"
                  style={{
                    backgroundColor: "var(--color-surface-bright)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                    sports_basketball
                  </span>
                  {court.hoops_count}개
                </span>
              )}

              {/* 무료/유료 */}
              <span
                className="rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium"
                style={{
                  backgroundColor: court.is_free
                    ? "color-mix(in srgb, var(--color-success) 15%, transparent)"
                    : "color-mix(in srgb, var(--color-warning) 15%, transparent)",
                  color: court.is_free ? "var(--color-success)" : "var(--color-warning)",
                }}
              >
                {court.is_free ? "무료" : court.fee ? `${court.fee.toLocaleString()}원` : "유료"}
              </span>

              {/* 야간 조명 + 시간 */}
              {court.has_lighting && (
                <span
                  className="inline-flex items-center gap-0.5 rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-accent) 15%, transparent)",
                    color: "var(--color-accent)",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                    lightbulb
                  </span>
                  {court.lighting_until ? `~${court.lighting_until}` : "조명"}
                </span>
              )}

              {/* 평점 */}
              {court.average_rating !== null && court.average_rating > 0 && (
                <span
                  className="inline-flex items-center gap-0.5 rounded-[4px] px-1.5 py-0.5 text-[11px] font-bold"
                  style={{ color: "var(--color-primary)" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                    star
                  </span>
                  {court.average_rating.toFixed(1)}
                </span>
              )}

              {/* 혼잡도 뱃지: 5명+ 활발(초록), 1~4명 적당(노랑), 0명은 표시 안 함 */}
              {court.activeCount >= 5 && (
                <span
                  className="inline-flex items-center gap-0.5 rounded-[4px] px-1.5 py-0.5 text-[11px] font-bold"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-success) 15%, transparent)",
                    color: "var(--color-success)",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                    local_fire_department
                  </span>
                  활발 {court.activeCount}명
                </span>
              )}
              {court.activeCount >= 1 && court.activeCount < 5 && (
                <span
                  className="inline-flex items-center gap-0.5 rounded-[4px] px-1.5 py-0.5 text-[11px] font-bold"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-accent) 15%, transparent)",
                    color: "var(--color-accent)",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                    groups
                  </span>
                  적당 {court.activeCount}명
                </span>
              )}
            </div>

            {/* 주소 + 가까운 역 */}
            <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
              <span className="truncate">
                {court.city} {court.district}
              </span>
              {court.nearest_station && (
                <>
                  <span style={{ color: "var(--color-border)" }}>|</span>
                  <span className="inline-flex items-center gap-0.5 truncate">
                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                      train
                    </span>
                    {court.nearest_station}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 우측: 카카오맵 길찾기 버튼 (Link 안이므로 button + window.open) */}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(kakaoUrl, "_blank"); }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors"
            style={{
              backgroundColor: "var(--color-surface-bright)",
            }}
            title="카카오맵 길찾기"
          >
            <span
              className="material-symbols-outlined text-lg"
              style={{ color: "var(--color-text-secondary)" }}
            >
              directions
            </span>
          </button>
        </div>
      </div>
    </Link>
  );
}
