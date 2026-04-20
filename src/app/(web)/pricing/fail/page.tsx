import Link from "next/link";

/**
 * 결제 실패 페이지 (/pricing/fail)
 *
 * 토스페이먼츠는 결제 실패 시 이 URL로 리다이렉트하면서
 * ?code=...&message=...&orderId=... 쿼리를 붙여준다.
 * 범용 "실패" 안내 대신 code를 사용자 친화적 한국어로 변환해 표시한다.
 *
 * Server Component로 유지하는 이유:
 *   - 결제 실패는 SEO/pre-render가 필요 없지만, 성공 페이지처럼
 *     useSearchParams + Suspense 경계까지 둘 만한 동적 상호작용이 없다.
 *     (인쇄 같은 클라이언트 동작이 없음)
 *   - Next.js 15 서버 컴포넌트의 Promise searchParams 패턴으로 단순하게 읽는다.
 */

// 토스페이먼츠 공식 에러 코드 → 사용자 친화적 한국어 메시지 매핑.
// 자주 발생할 만한 코드 위주로 13개만 정리. 나머지는 폴백으로 처리한다.
// 참고: 토스페이먼츠 개발자 문서 "결제 실패 코드" 표
const ERROR_MESSAGES: Record<string, { title: string; desc: string }> = {
  // 사용자가 결제창에서 취소 버튼을 누른 경우 (가장 흔함)
  PAY_PROCESS_CANCELED: {
    title: "결제를 취소하셨어요",
    desc: "언제든 다시 시도하실 수 있어요.",
  },
  // 결제창이 닫히거나 통신 오류로 중단된 경우
  PAY_PROCESS_ABORTED: {
    title: "결제가 중단됐어요",
    desc: "다시 시도해 주세요.",
  },
  // 일부 토스 SDK 버전에서 사용자 취소를 이 코드로 내려주기도 함
  USER_CANCEL: {
    title: "결제를 취소하셨어요",
    desc: "언제든 다시 시도하실 수 있어요.",
  },
  // 카드 번호 오타/잘못된 형식
  INVALID_CARD_NUMBER: {
    title: "카드 번호가 올바르지 않아요",
    desc: "카드 정보를 다시 확인해 주세요.",
  },
  // 유효기간 만료/잘못 입력
  INVALID_CARD_EXPIRATION: {
    title: "카드 유효기간을 다시 확인해 주세요",
    desc: "유효기간이 지났거나 형식이 올바르지 않아요.",
  },
  // 할부 불가 카드 / 할부 개월 비지원
  INVALID_CARD_INSTALLMENT_PLAN: {
    title: "할부 개월 수를 확인해 주세요",
    desc: "선택하신 카드에서 지원하지 않는 할부 조건이에요.",
  },
  // 일 결제 횟수 초과
  EXCEED_MAX_DAILY_PAYMENT_COUNT: {
    title: "오늘 결제 한도를 초과했어요",
    desc: "내일 다시 시도하거나 다른 결제 수단을 이용해 주세요.",
  },
  // 일 결제 금액 초과
  EXCEED_MAX_ONE_DAY_AMOUNT: {
    title: "일일 결제 한도를 초과했어요",
    desc: "다른 결제 수단이나 카드사에 문의해 주세요.",
  },
  // 카드 한도 초과 / 계좌 잔액 부족
  NOT_ENOUGH_BALANCE: {
    title: "잔액이 부족해요",
    desc: "카드 한도나 계좌 잔액을 확인해 주세요.",
  },
  // 카드사 승인 거절 (도난/정지/한도 외 사유)
  REJECT_CARD_COMPANY: {
    title: "카드사에서 거절했어요",
    desc: "카드사에 직접 문의해 주시거나 다른 카드로 시도해 주세요.",
  },
  // 권한/IP 차단 등으로 요청이 막힌 경우
  FORBIDDEN_REQUEST: {
    title: "결제 요청이 거부됐어요",
    desc: "잠시 후 다시 시도하거나 관리자에게 문의해 주세요.",
  },
  // 시크릿키 오류 등 인증 실패 — 서비스 설정 문제
  UNAUTHORIZED_KEY: {
    title: "결제 인증에 실패했어요",
    desc: "관리자에게 문의해 주세요.",
  },
  // 파라미터 누락/잘못된 요청
  INVALID_REQUEST: {
    title: "잘못된 요청이에요",
    desc: "다시 시도하거나 관리자에게 문의해 주세요.",
  },
};

export default async function PaymentFailPage({
  searchParams,
}: {
  // Next.js 15: searchParams는 Promise로 전달된다
  searchParams: Promise<{ message?: string; code?: string }>;
}) {
  // Promise를 await로 풀어서 실제 쿼리값 접근
  const params = await searchParams;
  const code = params.code ?? "";
  // 토스가 넘겨주는 message는 URL 디코딩이 이미 되어 프레임워크에서 처리됨
  // (Next.js가 searchParams에 넣어줄 때 디코딩된 문자열로 들어옴)
  const message = params.message ?? "";

  // 매핑에 해당 code가 있으면 매핑된 메시지, 없으면 폴백 사용
  const mapped = ERROR_MESSAGES[code];
  const title = mapped?.title ?? (message || "결제에 실패했어요");
  const desc =
    mapped?.desc ?? "다시 시도하시거나, 계속 문제가 발생하면 관리자에게 문의해 주세요.";

  // 매핑되지 않은 코드는 하단에 원본 code + message를 노출해 문의 시 활용
  const showRawInfo = !mapped && (code || message);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-16 px-4 text-center">
      {/* 실패 아이콘 — Material Symbols error.
          배경색은 primary-light(연한 BDR Red 톤) 변수 재사용 */}
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: "var(--color-primary-light)" }}
      >
        <span
          className="material-symbols-outlined text-4xl"
          style={{ color: "var(--color-primary)" }}
        >
          error
        </span>
      </div>

      {/* 제목: 매핑된 한국어 또는 토스 message 원문 */}
      <h1 className="mb-2 text-xl font-bold sm:text-2xl">{title}</h1>

      {/* 부연 설명 */}
      <p className="mb-4 text-sm text-[var(--color-text-muted)] sm:text-base">
        {desc}
      </p>

      {/* 매핑 없는 코드일 때만: 디버깅/문의용 원본 정보 표시.
          - code가 있으면 작은 글씨로 표기 (사용자 문의 시 그대로 전달 가능)
          - code 없고 message만 있으면 message 자체를 보조 표시 (title에 이미 썼어도 문맥 보강) */}
      {showRawInfo && (
        <div
          className="mb-8 max-w-md rounded border px-4 py-2 text-xs"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          {code && (
            <p>
              <span className="font-mono">code:</span> {code}
            </p>
          )}
          {!code && message && <p className="font-mono">{message}</p>}
        </div>
      )}

      {/* 원본 정보 영역이 없을 때만 버튼과의 간격 확보 (이중 공백 방지) */}
      {!showRawInfo && <div className="mb-4" />}

      {/* 주요 액션 버튼 — BDR Red + rounded 4px (프로젝트 컨벤션) */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/pricing"
          className="rounded bg-[var(--color-accent)] px-6 py-3 font-semibold text-[var(--color-on-accent)] transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          요금제 다시 보기
        </Link>
        <Link
          href="/"
          className="rounded border border-[var(--color-border)] px-6 py-3 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)]/50 hover:text-[var(--color-text-primary)]"
        >
          홈으로
        </Link>
      </div>

      {/* 관리자 문의 링크 — 기존 privacy/pricing 페이지와 동일 이메일 사용 */}
      <a
        href="mailto:bdr.wonyoung@gmail.com"
        className="mt-6 text-xs transition-colors hover:underline"
        style={{ color: "var(--color-text-muted)" }}
      >
        문제가 계속되면 관리자에게 문의하기 ({"bdr.wonyoung@gmail.com"})
      </a>
    </div>
  );
}
