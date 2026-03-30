"use client";

/**
 * HeatmapOverlay -- 카카오맵 위에 Canvas 히트맵을 그리는 오버레이
 *
 * 왜 Canvas 직접 구현인가?
 * - 카카오맵 API에는 공식 히트맵 레이어가 없음
 * - simpleheat.js 같은 라이브러리도 좋지만, 3KB짜리를 위해 의존성 추가하기보다
 *   직접 radial gradient로 구현하면 외부 의존성 없이 동일한 효과를 낼 수 있음
 *
 * 동작 원리:
 * 1. 카카오맵 인스턴스를 받아서 지도 컨테이너 위에 canvas를 겹침
 * 2. 각 포인트(코트)의 위경도를 지도 픽셀 좌표로 변환
 * 3. radial gradient로 열점(heat spot)을 그림
 * 4. 지도 이동/줌 시 다시 그림 (moveend, zoom_changed 이벤트)
 */

import { useEffect, useRef, useCallback } from "react";

// 히트맵 포인트 데이터
export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number; // 체크인 횟수 (0~maxWeight)
}

interface HeatmapOverlayProps {
  map: any; // 카카오맵 인스턴스 (window.kakao.maps.Map)
  points: HeatmapPoint[];
  maxWeight: number; // 정규화 기준값 (가장 높은 weight)
  visible: boolean; // 히트맵 표시 여부
}

export function HeatmapOverlay({ map, points, maxWeight, visible }: HeatmapOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas를 지도 컨테이너에 삽입하고, 크기를 맞추는 함수
  const ensureCanvas = useCallback((): HTMLCanvasElement | null => {
    if (!map) return null;

    // 카카오맵의 실제 DOM 컨테이너 가져오기
    const container = map.getNode() as HTMLElement;
    if (!container) return null;

    // 이미 생성된 canvas가 있으면 재사용
    if (canvasRef.current && canvasRef.current.parentNode === container) {
      // 크기 동기화 (지도 리사이즈 대응)
      const rect = container.getBoundingClientRect();
      canvasRef.current.width = rect.width;
      canvasRef.current.height = rect.height;
      return canvasRef.current;
    }

    // 새 canvas 생성
    const canvas = document.createElement("canvas");
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // 지도 위에 겹쳐야 하므로 absolute 포지셔닝 + 마우스 이벤트 통과
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none"; // 지도 조작을 방해하지 않음
    canvas.style.zIndex = "2"; // 마커 아래, 컨트롤 위

    container.appendChild(canvas);
    canvasRef.current = canvas;
    return canvas;
  }, [map]);

  // 히트맵 그리기 함수
  const drawHeatmap = useCallback(() => {
    if (!map || !visible || points.length === 0 || maxWeight === 0) {
      // 안 보이거나 데이터 없으면 canvas 비우기
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = ensureCanvas();
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 이전 프레임 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 현재 지도의 projection 가져오기 (위경도 → 픽셀 변환)
    const projection = map.getProjection();

    // 각 포인트에 대해 열점(heat spot) 그리기
    for (const point of points) {
      const latLng = new window.kakao.maps.LatLng(point.lat, point.lng);

      // 위경도를 지도 컨테이너 내 픽셀 좌표로 변환
      const pixel = projection.containerPointFromCoords(latLng);
      const x = pixel.x;
      const y = pixel.y;

      // 화면 밖의 포인트는 스킵 (성능 최적화)
      if (x < -100 || x > canvas.width + 100 || y < -100 || y > canvas.height + 100) {
        continue;
      }

      // weight를 0~1로 정규화
      const intensity = Math.min(point.weight / maxWeight, 1);

      // 반경: 줌 레벨에 따라 동적으로 조절
      // 줌 레벨이 낮을수록(넓게 볼수록) 반경이 작아야 겹치지 않음
      const zoomLevel = map.getLevel();
      const baseRadius = Math.max(20, 80 - zoomLevel * 6);
      const radius = baseRadius * (0.5 + intensity * 0.5);

      // radial gradient로 열점 그리기
      // 중심: 불투명한 빨강, 외곽: 투명
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

      // BDR 레드(#E31B23) 기반 그라디언트
      // intensity에 따라 alpha 값 조절 (0.1 ~ 0.6)
      const alpha = 0.1 + intensity * 0.5;
      gradient.addColorStop(0, `rgba(227, 27, 35, ${alpha})`); // 중심: BDR 레드
      gradient.addColorStop(0.4, `rgba(227, 27, 35, ${alpha * 0.6})`);
      gradient.addColorStop(1, "rgba(227, 27, 35, 0)"); // 외곽: 투명

      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [map, points, maxWeight, visible, ensureCanvas]);

  // 지도 이벤트에 히트맵 다시 그리기 연결
  useEffect(() => {
    if (!map) return;

    // 초기 그리기
    drawHeatmap();

    // 지도 이동/줌 변경 시 다시 그리기
    window.kakao.maps.event.addListener(map, "center_changed", drawHeatmap);
    window.kakao.maps.event.addListener(map, "zoom_changed", drawHeatmap);

    return () => {
      // 이벤트 리스너 정리 (map과 kakao가 아직 살아있을 때만)
      if (window.kakao?.maps?.event) {
        window.kakao.maps.event.removeListener(map, "center_changed", drawHeatmap);
        window.kakao.maps.event.removeListener(map, "zoom_changed", drawHeatmap);
      }

      // canvas 제거
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
        canvasRef.current = null;
      }
    };
  }, [map, drawHeatmap]);

  // visible 토글 시 canvas 표시/숨김
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.display = visible ? "block" : "none";
    }
    if (visible) drawHeatmap();
  }, [visible, drawHeatmap]);

  // 이 컴포넌트는 DOM을 직접 관리하므로 렌더링할 JSX 없음
  return null;
}
