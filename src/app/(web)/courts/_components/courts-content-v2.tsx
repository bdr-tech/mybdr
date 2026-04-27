"use client";

/* ============================================================
 * CourtsContentV2 — Phase 3 v2 시안 적용 (좌측 카드 그리드 + 우측 sticky 지도)
 *
 * 데이터 보존 원칙:
 *  - API/Prisma 변경 0
 *  - 정렬: 거리 우선(위치 있을 때) → 평점·검증 우선 → activeCount 내림차순 (PM 결정)
 *  - 카카오맵 B 변형: 시안 sticky placeholder 자리에 기존 KakaoMap 임베드 (히트맵·근접감지 포함)
 *  - CourtTopAd 유지 (비즈니스 데이터)
 *
 * 기존 courts-content.tsx 는 그대로 보존 — page.tsx 에서 V2로 1줄 교체.
 * ============================================================ */

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { KakaoMap, type MapMarker } from "@/components/shared/kakao-map";
import { CourtTopAd } from "@/components/ads/ad-card";
// 히트맵 오버레이: Canvas 기반 → SSR 불가 + 토글 시에만 필요 → 동적 import (기존 v1 동일)
import { type HeatmapPoint } from "@/components/shared/heatmap-overlay";
import { CourtCardV2 } from "./court-card-v2";

const HeatmapOverlay = dynamic(
  () => import("@/components/shared/heatmap-overlay").then((mod) => mod.HeatmapOverlay),
  { ssr: false }
);

// ─── 거리 계산 (Haversine) ───
// 기존 v1 과 동일 로직 유지 (위치 권한 허용 시 거리순 정렬에 사용)
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

const PROXIMITY_DISMISS_KEY = "bdr_proximity_dismissed";

// ─── API 직렬화 데이터 타입 (기존 v1 과 100% 동일) ───
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
  is_free: boolean | null;
  has_lighting: boolean | null;
  fee: number | null;
  average_rating: number | null;
  reviews_count: number;
  description: string | null;
  nickname: string | null;
  nearest_station: string | null;
  court_size: string | null;
  lighting_until: string | null;
  has_restroom: boolean | null;
  has_parking: boolean | null;
  verified: boolean;
  data_source: string | null;
  activeCount: number;
  pickupCount: number;
}

interface CourtsContentV2Props {
  courts: CourtItem[];
  cities: string[];
}

// 시안 5필터칩 — 시안 Court.jsx L22 정의 그대로
// 이유: 시안 충실도(전체/실내/실외/무료/지금 한산). v1의 야외전용 5pill 은 보존된 v1 컴포넌트에서 계속 동작.
const FILTERS = [
  { key: "all", label: "전체" },
  { key: "indoor", label: "실내" },
  { key: "outdoor", label: "실외" },
  { key: "free", label: "무료" },
  { key: "quiet", label: "지금 한산" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

// 히트맵 시간대 옵션 (v1 동일)
const HEATMAP_PERIODS = [
  { key: "all", label: "전체" },
  { key: "morning", label: "오전" },
  { key: "afternoon", label: "오후" },
  { key: "evening", label: "저녁" },
] as const;

export function CourtsContentV2({ courts, cities }: CourtsContentV2Props) {
  // ─── 필터 상태 ───
  const [filter, setFilter] = useState<FilterKey>("all");
  // 지역 드롭다운: 시안에는 없지만 기존 데이터 가치(필터링) 보존
  const [cityFilter, setCityFilter] = useState<string>("all");

  // ─── 지도/선택 상태 ───
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);

  // ─── 히트맵 (v1 그대로 이식) ───
  const [heatmapOn, setHeatmapOn] = useState(false);
  const [heatmapPeriod, setHeatmapPeriod] = useState<string>("all");
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [heatmapMaxWeight, setHeatmapMaxWeight] = useState(0);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [kakaoMapInstance, setKakaoMapInstance] = useState<unknown>(null);

  // ─── 위치 + 근접 감지 (v1 그대로 이식 — 데이터 보존 원칙) ───
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyCourtId, setNearbyCourtId] = useState<string | null>(null);
  const [proximityDismissed, setProximityDismissed] = useState(false);

  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // 거리 맵
  const distanceMap = useMemo(() => {
    if (!userLocation) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const c of courts) {
      if (c.latitude === 0 || c.longitude === 0) continue;
      map.set(c.id, haversineDistance(userLocation.lat, userLocation.lng, c.latitude, c.longitude));
    }
    return map;
  }, [courts, userLocation]);

  // ─── 필터링 + 정렬 (PM 결정: 평점·검증 우선 + activeCount 내림차순) ───
  const filtered = useMemo(() => {
    let result = courts;

    // 시안 5필터칩
    if (filter === "indoor") result = result.filter((c) => c.court_type === "indoor");
    else if (filter === "outdoor") result = result.filter((c) => c.court_type === "outdoor");
    else if (filter === "free") result = result.filter((c) => c.is_free === true);
    else if (filter === "quiet") result = result.filter((c) => c.activeCount < 5); // 시안 status !== 'busy'

    // 지역 필터 (보존)
    if (cityFilter !== "all") result = result.filter((c) => c.city === cityFilter);

    // 정렬: 거리(있으면) → verified → average_rating desc → activeCount desc
    result = [...result].sort((a, b) => {
      if (userLocation) {
        const distA = distanceMap.get(a.id) ?? Infinity;
        const distB = distanceMap.get(b.id) ?? Infinity;
        if (distA !== distB) return distA - distB;
      }
      // 검증 우선
      if (a.verified !== b.verified) return a.verified ? -1 : 1;
      // 평점 내림차순
      const ratingDiff = (b.average_rating ?? 0) - (a.average_rating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      // activeCount 내림차순 (사람있는곳 우선 노출)
      return b.activeCount - a.activeCount;
    });

    return result;
  }, [courts, filter, cityFilter, userLocation, distanceMap]);

  // ─── 히트맵 데이터 패칭 (v1 그대로) ───
  useEffect(() => {
    if (!heatmapOn) return;
    let cancelled = false;
    setHeatmapLoading(true);

    fetch(`/api/web/courts/heatmap?period=${heatmapPeriod}&days=30`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.data?.points) {
          setHeatmapPoints(data.data.points);
          setHeatmapMaxWeight(data.data.max_weight || 0);
        }
      })
      .catch((err) => console.error("[히트맵 데이터 로드 실패]", err))
      .finally(() => {
        if (!cancelled) setHeatmapLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [heatmapOn, heatmapPeriod]);

  const handleMapReady = useCallback((map: unknown) => {
    setKakaoMapInstance(map);
  }, []);

  // ─── 사용자 위치 1회 ───
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        /* 위치 거부 — 거리 표시만 생략 */
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    );
  }, []);

  // ─── 위치 watch + 100m 근접 감지 (v1 그대로) ───
  useEffect(() => {
    if (!navigator.geolocation) return;

    const dismissedAt = sessionStorage.getItem(PROXIMITY_DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (elapsed < 30 * 60 * 1000) setProximityDismissed(true);
      else sessionStorage.removeItem(PROXIMITY_DISMISS_KEY);
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        const dismissed = sessionStorage.getItem(PROXIMITY_DISMISS_KEY);
        if (dismissed && Date.now() - Number(dismissed) < 30 * 60 * 1000) return;

        let closestId: string | null = null;
        let closestDist = Infinity;
        for (const c of courts) {
          if (c.latitude === 0 || c.longitude === 0) continue;
          const d = haversineDistance(latitude, longitude, c.latitude, c.longitude);
          if (d <= 0.1 && d < closestDist) {
            closestDist = d;
            closestId = c.id;
          }
        }
        setNearbyCourtId(closestId);
      },
      () => {
        /* 위치 거부 무시 */
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [courts]);

  const nearbyCourt = useMemo(
    () => (nearbyCourtId ? courts.find((c) => c.id === nearbyCourtId) ?? null : null),
    [courts, nearbyCourtId]
  );

  const nearbyDistance = useMemo(() => {
    if (!nearbyCourt || !userLocation) return null;
    const km = haversineDistance(
      userLocation.lat,
      userLocation.lng,
      nearbyCourt.latitude,
      nearbyCourt.longitude
    );
    return formatDistance(km);
  }, [nearbyCourt, userLocation]);

  const dismissProximity = useCallback(() => {
    setProximityDismissed(true);
    setNearbyCourtId(null);
    sessionStorage.setItem(PROXIMITY_DISMISS_KEY, String(Date.now()));
  }, []);

  // ─── 지도 마커 (v1 동일) ───
  const mapMarkers: MapMarker[] = useMemo(
    () =>
      filtered
        .filter((c) => c.latitude !== 0 && c.longitude !== 0)
        .map((c) => ({
          id: c.id,
          lat: c.latitude,
          lng: c.longitude,
          name: c.name,
          type: c.court_type === "indoor" ? "indoor" : "outdoor",
          activeCount: c.activeCount,
          rating: c.average_rating ?? undefined,
        })),
    [filtered]
  );

  // 마커 클릭 → 좌측 카드로 스크롤
  const handleMarkerClick = useCallback((id: string) => {
    setSelectedCourtId(id);
    const card = cardRefs.current.get(id);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // ─── 통계 (헤더 메타) ───
  const stats = useMemo(() => {
    const indoor = courts.filter((c) => c.court_type === "indoor").length;
    const outdoor = courts.filter((c) => c.court_type === "outdoor").length;
    return { total: courts.length, indoor, outdoor };
  }, [courts]);

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* ─── 시안 헤더 ─── */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div className="eyebrow">코트 · COURTS</div>
          <h1
            style={{
              margin: "6px 0 4px",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.015em",
              color: "var(--ink)",
            }}
          >
            등록 코트 {stats.total}곳
          </h1>
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            실내 {stats.indoor} · 실외 {stats.outdoor} · 필터 결과 {filtered.length}개
          </div>
        </div>

        {/* 우측: 지역 드롭다운 (보존) */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setSelectedCourtId(null);
            }}
            className="input"
            style={{
              fontSize: 13,
              padding: "8px 12px",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-chip)",
              background: "var(--bg-elev)",
              color: "var(--ink)",
            }}
          >
            <option value="all">전체 지역</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── 5필터칩 (시안 핵심) ─── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => {
                setFilter(f.key);
                setSelectedCourtId(null);
              }}
              className="btn btn--sm"
              style={
                isActive
                  ? {
                      background: "var(--cafe-blue, var(--accent))",
                      color: "#fff",
                      borderColor: "var(--cafe-blue-deep, var(--accent))",
                    }
                  : {}
              }
            >
              {f.label}
            </button>
          );
        })}

        {/* 구분선 */}
        <div
          style={{
            width: 1,
            alignSelf: "stretch",
            background: "var(--border)",
            margin: "0 4px",
          }}
        />

        {/* 히트맵 토글 (보존) — 시안에 없지만 데이터 가치 우선 */}
        <button
          onClick={() => setHeatmapOn((p) => !p)}
          className="btn btn--sm"
          style={
            heatmapOn
              ? {
                  background: "var(--accent)",
                  color: "#fff",
                  borderColor: "var(--accent)",
                }
              : {}
          }
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 2 }}>
            whatshot
          </span>
          히트맵
          {heatmapLoading && (
            <span
              className="material-symbols-outlined animate-spin"
              style={{ fontSize: 12, marginLeft: 2 }}
            >
              progress_activity
            </span>
          )}
        </button>

        {heatmapOn && (
          <div style={{ display: "flex", gap: 4 }}>
            {HEATMAP_PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setHeatmapPeriod(p.key)}
                className="btn btn--sm"
                style={
                  heatmapPeriod === p.key
                    ? {
                        background: "var(--accent)",
                        color: "#fff",
                        borderColor: "var(--accent)",
                        fontSize: 11,
                      }
                    : { fontSize: 11 }
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── 시안 그리드: 좌측 카드 + 우측 sticky 지도 ─── */}
      <div
        style={{
          display: "grid",
          // 시안: minmax(0,1fr) 340px. 모바일에서는 자동 1열 (gridTemplateColumns 반응형 지원 위해 미디어 쿼리 대신 lg+에서만 2열)
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: 20,
          alignItems: "flex-start",
        }}
        className="courts-v2-grid"
      >
        {/* ─── 좌측: 카드 그리드 ─── */}
        <div>
          {/* 광고 (비즈니스 데이터 — 보존) */}
          <div style={{ marginBottom: 12 }}>
            <CourtTopAd />
          </div>

          {filtered.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 12,
              }}
            >
              {filtered.map((court) => (
                <div
                  key={court.id}
                  ref={(el) => {
                    if (el) cardRefs.current.set(court.id, el);
                  }}
                  // 선택된 카드 강조: 좌측 accent 보더 (스크롤 인포커스 시 시각 피드백)
                  style={
                    court.id === selectedCourtId
                      ? {
                          outline: "2px solid var(--accent)",
                          outlineOffset: 0,
                          borderRadius: "var(--radius-card)",
                        }
                      : undefined
                  }
                >
                  <CourtCardV2
                    court={{
                      id: court.id,
                      name: court.name,
                      city: court.city,
                      district: court.district,
                      court_type: court.court_type,
                      surface_type: court.surface_type,
                      hoops_count: court.hoops_count,
                      is_free: court.is_free,
                      has_lighting: court.has_lighting,
                      lighting_until: court.lighting_until,
                      fee: court.fee,
                      average_rating: court.average_rating,
                      reviews_count: court.reviews_count,
                      verified: court.verified,
                      activeCount: court.activeCount,
                      pickupCount: court.pickupCount,
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            // 빈 상태
            <div
              className="card"
              style={{
                padding: 40,
                textAlign: "center",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 36, color: "var(--ink-dim)", marginBottom: 8 }}
              >
                sports_basketball
              </span>
              <div style={{ fontSize: 14, color: "var(--ink-mute)", marginBottom: 4 }}>
                조건에 맞는 농구장이 없습니다
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-dim)", marginBottom: 16 }}>
                다른 필터를 선택하거나 초기화해보세요
              </div>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => {
                  setFilter("all");
                  setCityFilter("all");
                  setSelectedCourtId(null);
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 4 }}>
                  refresh
                </span>
                필터 초기화
              </button>
            </div>
          )}
        </div>

        {/* ─── 우측: sticky 지도 (B 변형 — 기존 KakaoMap 임베드) ─── */}
        <aside className="courts-v2-aside">
          <div
            className="card"
            style={{
              padding: 0,
              overflow: "hidden",
              position: "sticky",
              top: 120,
            }}
          >
            <div
              style={{
                position: "relative",
                height: 360,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <KakaoMap
                markers={mapMarkers}
                onMarkerClick={handleMarkerClick}
                selectedId={selectedCourtId}
                className="h-full w-full"
                showCurrentLocation
                onMapReady={handleMapReady}
              />

              {/* 히트맵 Canvas 오버레이 (지도 위 겹침) */}
              {kakaoMapInstance ? (
                <HeatmapOverlay
                  // KakaoMap 인스턴스 타입은 HeatmapOverlay 측에서 정의됨 — unknown → any 캐스팅 1회
                  map={kakaoMapInstance as never}
                  points={heatmapPoints}
                  maxWeight={heatmapMaxWeight}
                  visible={heatmapOn}
                />
              ) : null}
            </div>

            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>
                내 주변 코트
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>
                {userLocation
                  ? `현재 위치 기준 가까운 순 정렬 중`
                  : `위치 권한을 허용하면 가까운 순으로 정렬됩니다.`}
              </div>
              {/* 위치 권한 버튼: 이미 권한이 있으면 비활성, 없으면 다시 요청 */}
              {!userLocation && (
                <button
                  type="button"
                  className="btn btn--sm btn--primary"
                  style={{ marginTop: 12 }}
                  onClick={() => {
                    if (!navigator.geolocation) return;
                    navigator.geolocation.getCurrentPosition(
                      (pos) =>
                        setUserLocation({
                          lat: pos.coords.latitude,
                          lng: pos.coords.longitude,
                        }),
                      () => {
                        /* 거부 — 무시 */
                      }
                    );
                  }}
                >
                  위치 허용
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* lg+ 에서 2열 (시안 minmax(0,1fr) 340px) — 인라인 미디어쿼리 대신 클래스로 처리 */}
      <style jsx>{`
        @media (min-width: 1024px) {
          :global(.courts-v2-grid) {
            grid-template-columns: minmax(0, 1fr) 340px !important;
          }
        }
        @media (max-width: 1023px) {
          :global(.courts-v2-aside) {
            display: none;
          }
        }
      `}</style>

      {/* ─── 근접 감지 슬라이드업 (v1 그대로 보존) ─── */}
      {nearbyCourt && !proximityDismissed && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: 16,
            right: 16,
            zIndex: 50,
            maxWidth: 480,
            margin: "0 auto",
          }}
        >
          <div
            className="card"
            style={{
              padding: 16,
              border: "1px solid var(--accent)",
              boxShadow: "0 -4px 24px rgba(0,0,0,.18)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, color: "var(--accent)" }}
                >
                  location_on
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "var(--ink-mute)", fontWeight: 500 }}>
                  근처 농구장 발견!
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--ink)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {nearbyCourt.name}
                </div>
                {nearbyDistance && (
                  <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 2 }}>
                    {nearbyDistance} 거리
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link
                href={`/courts/${nearbyCourt.id}`}
                className="btn btn--primary"
                style={{ flex: 1, justifyContent: "center" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  sports_basketball
                </span>
                체크인
              </Link>
              <button type="button" onClick={dismissProximity} className="btn">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
