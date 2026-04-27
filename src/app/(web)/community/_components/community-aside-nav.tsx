"use client";

/**
 * CommunityAsideNav — PostDetail용 클라이언트 래퍼
 *
 * 이유: PostDetail page.tsx 는 RSC(서버) 컴포넌트인데
 *       CommunityAside 는 "use client" + onSelect 콜백을 받는다.
 *       서버에서 클라 콜백 함수를 직접 prop으로 넘길 수 없으므로
 *       useRouter 를 가진 작은 클라이언트 래퍼를 둔다.
 *
 * 동작: 사이드바 항목 클릭 → /community?category=... 로 push.
 *       (PostDetail 에서는 카테고리가 없으므로 항상 "전체글"이 활성으로 표시)
 *
 * CommunityAside 자체는 0 수정. BoardList 와 동일한 컴포넌트 재사용.
 */

import { useRouter } from "next/navigation";
import { CommunityAside } from "./community-aside";

interface CommunityAsideNavProps {
  // 현재 활성 카테고리 (PostDetail 에서는 보통 null = 전체글)
  activeCategory: string | null;
}

export function CommunityAsideNav({ activeCategory }: CommunityAsideNavProps) {
  const router = useRouter();

  // 클릭 시 /community 로 이동 (카테고리 쿼리 동기화)
  const handleSelect = (cat: string | null) => {
    const params = new URLSearchParams();
    if (cat) params.set("category", cat);
    const qs = params.toString();
    router.push(qs ? `/community?${qs}` : "/community");
  };

  return <CommunityAside activeCategory={activeCategory} onSelect={handleSelect} />;
}
