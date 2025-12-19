class CreateTournaments < ActiveRecord::Migration[8.0]
  def change
    create_table :tournaments do |t|
      t.string :uuid, null: false
      t.references :series, foreign_key: { to_table: :tournament_series }, null: true
      t.references :organizer, foreign_key: { to_table: :users }, null: false

      # 기본 정보
      t.string :name, null: false
      t.integer :edition_number  # 회차 (시리즈 내)
      t.text :description
      t.string :logo_url
      t.string :banner_url

      # 일정
      t.datetime :registration_start_at
      t.datetime :registration_end_at
      t.datetime :start_date
      t.datetime :end_date

      # 대회 형식
      t.string :format, default: "single_elimination"  # single_elimination, double_elimination, round_robin, group_stage
      t.integer :max_teams, default: 16
      t.integer :min_teams, default: 4
      t.integer :team_size, default: 5  # 팀당 인원
      t.integer :roster_min, default: 5  # 최소 로스터
      t.integer :roster_max, default: 12  # 최대 로스터

      # 참가비 및 상금
      t.decimal :entry_fee, precision: 10, scale: 0, default: 0
      t.text :prize_info  # 상금 정보
      t.jsonb :prize_distribution, default: {}  # { 1: 500000, 2: 300000, 3: 100000 }

      # 규칙
      t.text :rules
      t.jsonb :game_rules, default: {}  # { quarters: 4, quarter_minutes: 10, timeout_count: 3 }

      # 장소
      t.references :venue, foreign_key: { to_table: :courts }, null: true
      t.string :venue_name
      t.string :venue_address
      t.string :city
      t.string :district

      # 상태 및 통계
      t.string :status, default: "draft"
      t.integer :teams_count, default: 0
      t.integer :matches_count, default: 0
      t.integer :views_count, default: 0

      # 대회 설정
      t.jsonb :settings, default: {}
      t.boolean :is_public, default: true
      t.boolean :auto_approve_teams, default: false

      # 우승 정보
      t.references :champion_team, foreign_key: { to_table: :teams }, null: true
      t.references :mvp_player, foreign_key: { to_table: :users }, null: true

      t.timestamps
    end

    add_index :tournaments, :uuid, unique: true
    add_index :tournaments, :status
    add_index :tournaments, :start_date
    add_index :tournaments, :is_public
    add_index :tournaments, [:series_id, :edition_number], unique: true, where: "series_id IS NOT NULL"
  end
end
