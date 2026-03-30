"use client";

import { useEffect } from "react";

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

    const script = document.createElement("script");
    script.id = "kakao-map-sdk";
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=c11da2b86ea219b0a8681c33e83a05ed&libraries=services,clusterer&autoload=false`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  return <>{children}</>;
}
