class CreateTournamentTeamPlayers < ActiveRecord::Migration[8.0]
  def change
    create_table :tournament_team_players do |t|
      t.references :tournament_team, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      # 선수 정보
      t.integer :jersey_number
      t.string :role, default: "player"  # player, captain, coach
      t.string :position

      # 등록 정보
      t.boolean :auto_registered, default: false  # 팀 등록 시 자동 등록 여부
      t.boolean :is_active, default: true
      t.boolean :is_starter, default: false  # 선발 여부

      # 대회 통계 (집계)
      t.integer :games_played, default: 0
      t.integer :total_points, default: 0
      t.integer :total_rebounds, default: 0
      t.integer :total_assists, default: 0
      t.integer :total_steals, default: 0
      t.integer :total_blocks, default: 0

      # 평균 통계
      t.decimal :avg_points, precision: 5, scale: 1, default: 0.0
      t.decimal :avg_rebounds, precision: 5, scale: 1, default: 0.0
      t.decimal :avg_assists, precision: 5, scale: 1, default: 0.0

      t.timestamps
    end

    add_index :tournament_team_players, [:tournament_team_id, :user_id], unique: true, name: "idx_tournament_team_players_unique"
    add_index :tournament_team_players, [:tournament_team_id, :jersey_number], unique: true, name: "idx_tournament_team_players_jersey"
    add_index :tournament_team_players, :is_active
  end
end
