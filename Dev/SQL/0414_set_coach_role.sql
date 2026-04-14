-- 0414: 감독/코치진 role 업데이트
-- 사장 요청: 서장훈/산다라박/기매술/전태풍 → role='coach' 로 변경
-- 박스스코어 자동 제외 대상
--
-- 사용법:
--   1) 아래 SELECT로 매칭 확인
--   2) UPDATE 실행 (트랜잭션 권장)
--
-- 주의:
--   - 운영 DB에서 실행 시 반드시 백업/트랜잭션 사용
--   - 동명이인이 있을 수 있으므로 team/tournament 필터 추가 고려

-- ─── STEP 1: 영향 받는 선수 확인 ──────────────────────────────
SELECT
  ttp.id,
  ttp.jersey_number,
  COALESCE(u.nickname, u.name, ttp.player_name) AS display_name,
  ttp.role,
  ttp.is_active,
  tt.team_id,
  t.name AS team_name
FROM tournament_team_players ttp
LEFT JOIN users u ON u.id = ttp.user_id
LEFT JOIN tournament_teams tt ON tt.id = ttp.tournament_team_id
LEFT JOIN teams t ON t.id = tt.team_id
WHERE
  (
    COALESCE(u.nickname, u.name, ttp.player_name) LIKE '%서장훈%'
    OR COALESCE(u.nickname, u.name, ttp.player_name) LIKE '%산다라박%'
    OR COALESCE(u.nickname, u.name, ttp.player_name) LIKE '%기매술%'
    OR COALESCE(u.nickname, u.name, ttp.player_name) LIKE '%전태풍%'
  )
ORDER BY team_name, display_name;

-- ─── STEP 2: role='coach' 업데이트 (트랜잭션) ──────────────────
-- 확인 후 아래 블록을 주석 해제하여 실행

-- BEGIN;
--
-- UPDATE tournament_team_players ttp
-- SET role = 'coach', updated_at = NOW()
-- FROM users u
-- WHERE ttp.user_id = u.id
--   AND (
--     COALESCE(u.nickname, u.name, ttp.player_name) LIKE '%서장훈%'
--     OR COALESCE(u.nickname, u.name, ttp.player_name) LIKE '%산다라박%'
--     OR COALESCE(u.nickname, u.name, ttp.player_name) LIKE '%기매술%'
--     OR COALESCE(u.nickname, u.name, ttp.player_name) LIKE '%전태풍%'
--   );
--
-- -- 영향 받은 행 확인
-- SELECT id, jersey_number, role
-- FROM tournament_team_players
-- WHERE role = 'coach';
--
-- COMMIT;

-- ─── 참고: 특정 team/tournament로 범위 제한 (선택) ──────────────
-- 동명이인 회피 목적. 위 UPDATE에 아래 조건 추가:
--   AND tt.tournament_id = {해당_대회_id}
--   또는 AND ttp.tournament_team_id = {팀_id}
