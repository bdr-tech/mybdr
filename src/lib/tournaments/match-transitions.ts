/**
 * 매치 상태 전환 테이블 (TC-NEW-012).
 * 모든 가능한 상태 전환의 단일 소스.
 */
export const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:     ["scheduled", "cancelled"],
  scheduled:   ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  bye:         [],
  completed:   [],
  cancelled:   ["scheduled"],
};

/**
 * 기록원(Recorder) API에서 허용하는 전환의 서브셋.
 * 기록원은 scheduled -> in_progress, in_progress -> completed/cancelled 만 가능.
 */
export const RECORDER_TRANSITIONS: Record<string, string[]> = {
  scheduled:   ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
};
