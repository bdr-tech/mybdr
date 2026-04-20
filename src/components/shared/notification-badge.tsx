/**
 * NotificationBadge — 알림 개수 배지
 *
 * [왜]
 * - 헤더 알림 아이콘에 표시되는 "읽지 않은 알림 수" 시각 컴포넌트.
 * - 기존에는 2×2 dot만 표시했지만, 수치 가독성을 높이기 위해 숫자 배지로 전환.
 * - 100건 이상은 "99+"로 축약하여 폭이 과도하게 늘어나는 것을 방지.
 *
 * [방법]
 * - count <= 0 이면 null 반환 (렌더링 안 함)
 * - count >= 100 이면 "99+" 표시
 * - 부모 컴포넌트는 `relative`여야 하며, 배지는 absolute로 아이콘 우상단에 위치
 * - 스타일: BDR Red 배경 + 흰 글씨 9px bold (좁은 숫자라 가독 가능)
 */

interface NotificationBadgeProps {
  /** 읽지 않은 알림 개수 */
  count: number;
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
  // 0건이면 배지 자체를 숨긴다
  if (count <= 0) return null;

  // 100건 이상은 "99+"로 축약 (배지 폭 안정화)
  const display = count >= 100 ? "99+" : String(count);

  return (
    <span
      // -right-0.5 / -top-0.5 : 배지가 아이콘 모서리 바깥으로 살짝 튀어나와
      //   아이콘 픽셀을 덜 가리면서도 부모 relative 기준으로 안정적으로 고정
      // min-w-[16px] h-[16px] : 원형 유지 + 3자리("99+")도 여유 있게 수용
      // px-1 : "99+"일 때 좌우 여백 확보
      // text-[9px] font-bold : 작은 배지 내부에서 읽을 수 있는 최소 크기
      // leading-none : line-height를 1로 맞춰 세로 정렬 흐트러짐 방지
      className="absolute -right-0.5 -top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[9px] font-bold leading-none text-white"
      aria-label={`읽지 않은 알림 ${count}건`}
    >
      {display}
    </span>
  );
}
