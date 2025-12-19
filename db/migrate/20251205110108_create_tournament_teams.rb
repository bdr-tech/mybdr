class CreateTournamentTeams < ActiveRecord::Migration[8.0]
  def change
    create_table :tournament_teams do |t|
      t.references :tournament, null: false, foreign_key: true
      t.references :team, null: false, foreign_key: true

      # 시드 및 그룹 배정
      t.integer :seed_number
      t.string :group_name  # 조별 리그용 (A, B, C, D)
      t.integer :group_order  # 그룹 내 순위

      # 상태
      t.string :status, default: "pending"  # pending, approved, rejected, withdrawn

      # 등록 정보
      t.references :registered_by, foreign_key: { to_table: :users }
      t.datetime :approved_at
      t.datetime :paid_at
      t.string :payment_status, default: "unpaid"
      t.text :registration_note

      # 대회 통계 (집계)
      t.integer :wins, default: 0
      t.integer :losses, default: 0
      t.integer :draws, default: 0
      t.integer :points_for, default: 0
      t.integer :points_against, default: 0
      t.integer :point_difference, default: 0

      # 최종 순위
      t.integer :final_rank

      t.timestamps
    end

    add_index :tournament_teams, [:tournament_id, :team_id], unique: true
    add_index :tournament_teams, [:tournament_id, :seed_number]
    add_index :tournament_teams, :status
  end
end
