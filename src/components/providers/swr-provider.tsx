"use client";

import { SWRConfig } from "swr";

// 공통 fetcher: URL을 받아 JSON으로 변환
// SWRConfig에 등록하면 모든 useSWR 호출에서 자동 사용됨
const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((r) => r.json());

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        // 10초간 같은 키(URL)로 중복 호출 방지
        // 예: hero-bento와 recommended-videos가 같은 /api/web/youtube/recommend를 호출해도 1회만 요청
        dedupingInterval: 10000,
        // 탭 전환(포커스 복귀) 시 자동 재호출 방지
        revalidateOnFocus: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
