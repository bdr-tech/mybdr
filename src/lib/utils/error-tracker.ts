/**
 * 에러 추적 유틸리티
 *
 * 왜 별도 모듈인가?
 * - 현재는 console.error로 로깅하지만, 나중에 Sentry 등 외부 서비스로 교체할 때
 *   이 파일 하나만 수정하면 전체 프로젝트에 적용됨
 * - 에러 발생 위치(context)와 추가 정보(extra)를 구조화해서 기록
 */

interface CaptureOptions {
  /** 에러 발생 위치/맥락 (예: "error.tsx", "forgot-password API") */
  context?: string;
  /** 추가 정보 (사용자 ID, 요청 URL 등) */
  extra?: Record<string, unknown>;
}

/**
 * 에러를 캡처하고 기록한다
 *
 * 현재: 콘솔 로그 + 구조화된 출력
 * 미래: Sentry.captureException() 등으로 교체 가능
 *
 * @param error 캡처할 에러 객체
 * @param options 컨텍스트 + 추가 정보
 */
export function captureException(
  error: unknown,
  options?: CaptureOptions
): void {
  const { context = "unknown", extra } = options ?? {};

  // 에러 메시지 추출
  const message =
    error instanceof Error ? error.message : String(error);

  // 구조화된 로그 출력
  console.error(`[ErrorTracker] [${context}] ${message}`, {
    // 스택 트레이스 (Error 객체일 때만)
    stack: error instanceof Error ? error.stack : undefined,
    // 추가 정보
    ...(extra && { extra }),
    // 타임스탬프
    timestamp: new Date().toISOString(),
  });

  // TODO: Sentry 연동 시 아래 코드 활성화
  // Sentry.captureException(error, {
  //   tags: { context },
  //   extra,
  // });
}
