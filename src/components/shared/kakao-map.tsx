"use client";

/**
 * KakaoMap -- 카카오맵 공통 컴포넌트
 *
 * 왜 공통 컴포넌트로 분리?
 * - courts 뿐 아니라 향후 경기장소 선택, 픽업게임 위치 등에도 재사용 가능
 * - 카카오맵 초기화/정리 로직을 한 곳에서 관리
 *
 * 핵심 기능:
 * 1. kakao.maps.load() 콜백 안에서 지도 초기화 (autoload=false 대응)
 * 2. MarkerClusterer로 마커 클러스터링
 * 3. 마커 클릭 시 콜백 호출
 * 4. 현재 위치 버튼 (navigator.geolocation)
 */

import { useEffect, useRef, useCallback, useState } from "react";

// 카카오맵 타입 선언 (SDK가 window에 주입)
declare global {
  interface Window {
    kakao: any;
  }
}

// 마커 데이터 인터페이스
export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type?: "outdoor" | "indoor" | "unknown";
  activeCount?: number; // 현재 체크인 수 (혼잡도)
  rating?: number;      // 평점 (0~5). 인포 윈도우 ★ 라인용. 없으면 라인 생략
}

interface KakaoMapProps {
  markers: MapMarker[];
  center?: { lat: number; lng: number }; // 초기 중심 좌표
  level?: number; // 줌 레벨 (1~14, 기본 8)
  onMarkerClick?: (id: string) => void; // 마커 클릭 콜백
  selectedId?: string | null; // 선택된 마커 ID (하이라이트)
  className?: string;
  showCurrentLocation?: boolean; // 현위치 버튼 표시 여부
  onMapReady?: (map: any) => void; // 지도 초기화 완료 콜백 (히트맵 등 외부 확장용)
}

// 서울 시청 기본 좌표 (위치 권한 없을 때 폴백)
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

export function KakaoMap({
  markers,
  center,
  level = 8,
  onMarkerClick,
  selectedId,
  className = "",
  showCurrentLocation = true,
  onMapReady,
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null); // 카카오맵 인스턴스
  const clustererRef = useRef<any>(null); // 클러스터러 인스턴스
  const kakaoMarkersRef = useRef<any[]>([]); // 마커 인스턴스 배열
  const overlayRef = useRef<any>(null); // 현재 열린 인포윈도우
  const [isLoaded, setIsLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const hasUserLocationRef = useRef(false); // 현위치 확보 여부 (setBounds 스킵용)

  // 마커 혼잡도에 따른 색상 결정 (초록: 활발, 노랑: 적당, 파랑: 한적/없음)
  const getMarkerColor = useCallback((activeCount: number) => {
    if (activeCount >= 5) return "#22C55E"; // 초록 - 활발
    if (activeCount >= 1) return "#F59E0B"; // 노랑 - 적당
    return "#3B82F6"; // 파랑 - 기본
  }, []);

  // 커스텀 마커 이미지 SVG 생성
  const createMarkerContent = useCallback(
    (marker: MapMarker, isSelected: boolean) => {
      const color = getMarkerColor(marker.activeCount ?? 0);
      const size = isSelected ? 40 : 32;
      const borderColor = isSelected ? "#E31B23" : color;

      // SVG 마커: 원형 핀 + 농구공 아이콘
      return `
      <div style="
        width:${size}px; height:${size}px;
        border-radius:50%;
        background:${color};
        border:3px solid ${borderColor};
        display:flex; align-items:center; justify-content:center;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        cursor:pointer;
        transition:transform 0.15s;
        transform:${isSelected ? "scale(1.2)" : "scale(1)"};
      ">
        <span style="color:white;font-size:${isSelected ? 18 : 14}px;font-weight:bold;">
          ${marker.type === "indoor" ? "I" : "O"}
        </span>
      </div>
    `;
    },
    [getMarkerColor]
  );

  // 지도 초기화
  useEffect(() => {
    // SDK 아직 안 로드된 경우 폴링 (최대 10초)
    const checkAndInit = () => {
      if (!window.kakao?.maps) return false;

      window.kakao.maps.load(() => {
        if (!containerRef.current) return;

        const initialCenter = center || DEFAULT_CENTER;
        const mapCenter = new window.kakao.maps.LatLng(
          initialCenter.lat,
          initialCenter.lng
        );

        // 지도 생성
        const map = new window.kakao.maps.Map(containerRef.current, {
          center: mapCenter,
          level,
        });

        // 줌 컨트롤 추가
        const zoomControl = new window.kakao.maps.ZoomControl();
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

        mapRef.current = map;

        // 마커 클러스터러 생성 (가까운 마커들을 하나로 묶어서 표시)
        const clusterer = new window.kakao.maps.MarkerClusterer({
          map,
          averageCenter: true, // 클러스터 중심을 마커 평균 위치로
          minLevel: 5, // 줌 레벨 5 이하에서 클러스터 활성화
          disableClickZoom: false, // 클러스터 클릭 시 줌인
        });

        clustererRef.current = clusterer;
        setIsLoaded(true);

        // 외부에 지도 인스턴스 전달 (히트맵 오버레이 등에서 사용)
        onMapReady?.(map);
      });

      return true;
    };

    // 즉시 시도, 실패하면 500ms 간격 폴링
    if (!checkAndInit()) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (checkAndInit() || attempts > 20) {
          clearInterval(interval);
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, []); // 최초 1회만 실행

  // 마커 갱신 (markers 또는 selectedId 변경 시)
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !clustererRef.current) return;

    const map = mapRef.current;
    const clusterer = clustererRef.current;

    // 기존 마커 정리
    clusterer.clear();
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }

    // 위경도 있는 마커만 지도에 표시
    const validMarkers = markers.filter(
      (m) => m.lat !== 0 && m.lng !== 0 && !isNaN(m.lat) && !isNaN(m.lng)
    );

    const kakaoMarkers = validMarkers.map((marker) => {
      const position = new window.kakao.maps.LatLng(marker.lat, marker.lng);
      const isSelected = marker.id === selectedId;

      // CustomOverlay로 커스텀 마커 표현
      const content = document.createElement("div");
      content.innerHTML = createMarkerContent(marker, isSelected);
      content.style.cursor = "pointer";

      // 마커 클릭 이벤트
      content.addEventListener("click", () => {
        onMarkerClick?.(marker.id);

        // 클릭한 마커로 부드럽게 이동
        map.panTo(position);

        // 인포윈도우 표시
        if (overlayRef.current) {
          overlayRef.current.setMap(null);
        }

        // 혼잡도 텍스트 결정
        const activeCount = marker.activeCount ?? 0;
        let crowdText = "";
        if (activeCount >= 5) crowdText = `<span style="color:#22C55E">활발 ${activeCount}명</span>`;
        else if (activeCount >= 1) crowdText = `<span style="color:#F59E0B">적당 ${activeCount}명</span>`;

        // 평점 라인 — 평점 없으면 라인 자체 생략 (planner-architect 명세 "평점 없으면 라인 생략")
        // 왜? 평점 0건/null인 코트는 ★ 0.0 표시하면 되려 신뢰도 떨어뜨림
        const ratingLine =
          typeof marker.rating === "number" && marker.rating > 0
            ? `<div style="font-size:11px;color:var(--color-primary,#E31B23);font-weight:700;margin-top:2px;display:flex;align-items:center;gap:2px;">
                 <span>★</span>
                 <span>${marker.rating.toFixed(1)}</span>
               </div>`
            : "";

        // 상세 보기 링크 — innerHTML 한계로 Next.js Link 사용 불가 → <a href> 예외 허용 (conventions.md)
        // 클릭 시 카카오맵 인포 윈도우는 그대로 라우팅 발생 (target=_self 기본)
        const detailLink = `
          <a href="/courts/${marker.id}"
             style="display:inline-flex;align-items:center;gap:2px;margin-top:6px;font-size:11px;font-weight:600;color:var(--color-primary,#E31B23);text-decoration:none;border:1px solid var(--color-primary,#E31B23);border-radius:4px;padding:3px 8px;">
            상세 보기
            <span style="font-size:13px;">›</span>
          </a>
        `;

        const infoContent = `
          <div style="
            padding:10px 14px;
            background:var(--color-card, #1a1a2e);
            border-radius:8px;
            box-shadow:0 4px 12px rgba(0,0,0,0.3);
            min-width:160px;
            border:1px solid var(--color-border, #333);
          ">
            <div style="font-size:13px;font-weight:700;color:var(--color-text-primary, #fff);margin-bottom:4px;">
              ${marker.name}
            </div>
            <div style="font-size:11px;color:var(--color-text-muted, #888);display:flex;align-items:center;gap:4px;">
              <span>${marker.type === "indoor" ? "실내" : "야외"}</span>
              ${crowdText ? `<span style="margin-left:4px">${crowdText}</span>` : ""}
            </div>
            ${ratingLine}
            ${detailLink}
          </div>
        `;

        const overlay = new window.kakao.maps.CustomOverlay({
          content: infoContent,
          position,
          yAnchor: 1.4, // 마커 위에 표시
        });
        overlay.setMap(map);
        overlayRef.current = overlay;
      });

      // CustomOverlay 생성 (일반 Marker 대신 사용 -- 커스텀 디자인)
      const customOverlay = new window.kakao.maps.CustomOverlay({
        content: content,
        position,
        yAnchor: 0.5,
        xAnchor: 0.5,
      });

      // 클러스터러에는 일반 Marker를 추가해야 하므로 Marker도 생성
      const kakaoMarker = new window.kakao.maps.Marker({
        position,
      });

      // Marker에도 클릭 이벤트 등록
      window.kakao.maps.event.addListener(kakaoMarker, "click", () => {
        content.click();
      });

      return kakaoMarker;
    });

    // 클러스터러에 마커 일괄 추가
    clusterer.addMarkers(kakaoMarkers);
    kakaoMarkersRef.current = kakaoMarkers;

    // 마커가 있으면 bounds 조정 (단, 현위치가 확보된 경우 스킵 → 20km 뷰 유지)
    if (kakaoMarkers.length > 0 && !center && !hasUserLocationRef.current) {
      const bounds = new window.kakao.maps.LatLngBounds();
      validMarkers.forEach((m) => {
        bounds.extend(new window.kakao.maps.LatLng(m.lat, m.lng));
      });
      map.setBounds(bounds);
    }
  }, [markers, selectedId, isLoaded, createMarkerContent, onMarkerClick, center]);

  // 현재 위치로 이동하는 함수
  const moveToCurrentLocation = useCallback(() => {
    if (!mapRef.current) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        hasUserLocationRef.current = true; // setBounds 스킵하여 20km 뷰 유지

        const moveLatLng = new window.kakao.maps.LatLng(lat, lng);
        mapRef.current.setCenter(moveLatLng);
        mapRef.current.setLevel(7); // 약 20km 반경으로 주변 코트가 함께 보이도록

        // 현위치 마커 표시
        const markerContent = `
          <div style="
            width:16px; height:16px;
            border-radius:50%;
            background:#E31B23;
            border:3px solid white;
            box-shadow:0 0 0 2px #E31B23, 0 2px 8px rgba(0,0,0,0.3);
          "></div>
        `;
        const overlay = new window.kakao.maps.CustomOverlay({
          content: markerContent,
          position: moveLatLng,
          yAnchor: 0.5,
          xAnchor: 0.5,
          zIndex: 999,
        });
        overlay.setMap(mapRef.current);
      },
      (err) => {
        // 위치 권한 거부 시 무시 (서울 중심 유지)
        console.warn("위치 권한 없음:", err.message);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    );
  }, []);

  // 초기 로드 시 현위치로 이동 시도
  useEffect(() => {
    if (isLoaded && showCurrentLocation && !center) {
      moveToCurrentLocation();
    }
  }, [isLoaded, showCurrentLocation, center, moveToCurrentLocation]);

  return (
    <div className={`relative ${className}`} style={{ minHeight: "300px" }}>
      {/* 카카오맵 컨테이너 */}
      <div
        ref={containerRef}
        className="h-full w-full rounded-lg"
        style={{ minHeight: "inherit" }}
      />

      {/* 지도 로딩 중 */}
      {!isLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-lg"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          <div className="text-center">
            <span
              className="material-symbols-outlined text-3xl mb-2 block animate-pulse"
              style={{ color: "var(--color-text-disabled)" }}
            >
              map
            </span>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              지도 로딩중...
            </p>
          </div>
        </div>
      )}

      {/* 현위치 버튼 -- 좌하단 배치 */}
      {showCurrentLocation && isLoaded && (
        <button
          type="button"
          onClick={moveToCurrentLocation}
          className="absolute bottom-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95"
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
          }}
          title="현재 위치로 이동"
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "20px",
              color: userLocation ? "var(--color-primary)" : "var(--color-text-secondary)",
            }}
          >
            my_location
          </span>
        </button>
      )}
    </div>
  );
}
