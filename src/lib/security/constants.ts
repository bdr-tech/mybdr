/**
 * Timing attack 방지용 더미 bcrypt 해시 (12 라운드).
 * 존재하지 않는 사용자에 대해서도 동일한 bcrypt compare 시간을 소비하기 위해 사용.
 */
export const DUMMY_HASH =
  "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.P2PEey";
