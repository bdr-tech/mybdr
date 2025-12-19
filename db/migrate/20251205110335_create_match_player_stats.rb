class CreateMatchPlayerStats < ActiveRecord::Migration[8.0]
  def change
    create_table :match_player_stats do |t|
      t.references :tournament_match, null: false, foreign_key: true
      t.references :tournament_team_player, null: false, foreign_key: true

      # 출전 정보
      t.boolean :is_starter, default: false  # 선발 여부
      t.integer :minutes_played, default: 0  # 출전 시간 (분)

      # =============================================================================
      # NBA 스타일 박스스코어 - 26개 통계 필드
      # =============================================================================

      # 1. 득점 (PTS)
      t.integer :points, default: 0

      # 2-4. 필드골 (FG)
      t.integer :field_goals_made, default: 0      # 필드골 성공 (FGM)
      t.integer :field_goals_attempted, default: 0  # 필드골 시도 (FGA)
      t.decimal :field_goal_percentage, precision: 5, scale: 1, default: 0.0  # 필드골 성공률 (FG%)

      # 5-7. 3점슛 (3P)
      t.integer :three_pointers_made, default: 0     # 3점슛 성공 (3PM)
      t.integer :three_pointers_attempted, default: 0 # 3점슛 시도 (3PA)
      t.decimal :three_point_percentage, precision: 5, scale: 1, default: 0.0  # 3점슛 성공률 (3P%)

      # 8-10. 자유투 (FT)
      t.integer :free_throws_made, default: 0       # 자유투 성공 (FTM)
      t.integer :free_throws_attempted, default: 0  # 자유투 시도 (FTA)
      t.decimal :free_throw_percentage, precision: 5, scale: 1, default: 0.0  # 자유투 성공률 (FT%)

      # 11-13. 리바운드 (REB)
      t.integer :offensive_rebounds, default: 0    # 공격 리바운드 (OREB)
      t.integer :defensive_rebounds, default: 0    # 수비 리바운드 (DREB)
      t.integer :total_rebounds, default: 0        # 총 리바운드 (REB)

      # 14. 어시스트 (AST)
      t.integer :assists, default: 0

      # 15. 스틸 (STL)
      t.integer :steals, default: 0

      # 16. 블록 (BLK)
      t.integer :blocks, default: 0

      # 17. 턴오버 (TO)
      t.integer :turnovers, default: 0

      # 18. 파울 (PF)
      t.integer :personal_fouls, default: 0

      # 19. 플러스/마이너스 (+/-)
      t.integer :plus_minus, default: 0

      # =============================================================================
      # 고급 통계 (Advanced Stats)
      # =============================================================================

      # 20. 효율성 지수 (EFF) - (PTS + REB + AST + STL + BLK - Missed FG - Missed FT - TO)
      t.decimal :efficiency, precision: 6, scale: 1, default: 0.0

      # 21. 진정 슈팅 비율 (TS%) - PTS / (2 * (FGA + 0.44 * FTA))
      t.decimal :true_shooting_percentage, precision: 5, scale: 1, default: 0.0

      # 22. 유효 필드골 비율 (eFG%) - (FGM + 0.5 * 3PM) / FGA
      t.decimal :effective_fg_percentage, precision: 5, scale: 1, default: 0.0

      # 23. 어시스트 대 턴오버 비율 (A/TO)
      t.decimal :assist_turnover_ratio, precision: 5, scale: 2, default: 0.0

      # 24. 2점슛 성공 (2PM)
      t.integer :two_pointers_made, default: 0

      # 25. 2점슛 시도 (2PA)
      t.integer :two_pointers_attempted, default: 0

      # 26. 2점슛 성공률 (2P%)
      t.decimal :two_point_percentage, precision: 5, scale: 1, default: 0.0

      # 추가 정보
      t.boolean :fouled_out, default: false  # 파울 아웃 여부
      t.boolean :ejected, default: false     # 퇴장 여부
      t.text :notes

      t.timestamps
    end

    add_index :match_player_stats, [:tournament_match_id, :tournament_team_player_id], unique: true, name: "idx_match_player_stats_unique"
    add_index :match_player_stats, :points
    add_index :match_player_stats, :total_rebounds
    add_index :match_player_stats, :assists
  end
end
