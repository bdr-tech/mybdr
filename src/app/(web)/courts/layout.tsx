"use client";

import { useEffect } from "react";

// 카카오맵 JavaScript SDK appkey
// 운영/프리뷰: Vercel 환경변수 NEXT_PUBLIC_KAKAO_MAPS_KEY 사용
// 폴백: env 미설정 시 기존 하드코딩 키 사용 → 환경변수 누락으로 지도가 깜깜해지는 사고 방지
const KAKAO_MAPS_FALLBACK_KEY = "c11da2b86ea219b0a8681c33e83a05ed";

/**
 * Courts 레이아웃 -- 카카오맵 SDK를 이 영역에서만 로드한다.
 * Script 컴포넌트 대신 동적 script 삽입으로 로딩 보장.
 */
export default function CourtsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // 이미 로드됐으면 스킵
    if (document.getElementById("kakao-map-sdk")) return;

    // env 우선, 없으면 폴백. 폴백 사용 시 한 번만 경고
    // 왜? .env.local에 키 안 넣어도 일단 동작하게 하되, 운영 배포 전 알아챌 수 있게
    const envKey = process.env.NEXT_PUBLIC_KAKAO_MAPS_KEY;
    const appkey = envKey ?? KAKAO_MAPS_FALLBACK_KEY;
    if (!envKey) {
      console.warn(
        "[courts] NEXT_PUBLIC_KAKAO_MAPS_KEY 미설정 → 폴백 키 사용"
      );
    }

    const script = document.createElement("script");
    script.id = "kakao-map-sdk";
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&libraries=services,clusterer&autoload=false`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  return <>{children}</>;
}
