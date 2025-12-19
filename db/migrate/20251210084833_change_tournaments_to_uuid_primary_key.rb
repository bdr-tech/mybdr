# frozen_string_literal: true

class ChangeTournamentsToUuidPrimaryKey < ActiveRecord::Migration[8.0]
  def up
    # 1. 기존 데이터 삭제 (개발 단계이므로)
    execute "DELETE FROM match_player_stats"
    execute "DELETE FROM tournament_team_players"
    execute "DELETE FROM tournament_matches"
    execute "DELETE FROM tournament_teams"
    execute "DELETE FROM tournament_admin_members"
    execute "DELETE FROM site_sections"
    execute "DELETE FROM site_pages"
    execute "DELETE FROM tournament_sites"
    execute "DELETE FROM tournaments"

    # 2. 외래키 제거
    remove_foreign_key :tournament_admin_members, :tournaments
    remove_foreign_key :tournament_matches, :tournaments
    remove_foreign_key :tournament_sites, :tournaments
    remove_foreign_key :tournament_teams, :tournaments

    # 3. 기존 인덱스 제거
    remove_index :tournament_admin_members, :tournament_id, if_exists: true
    remove_index :tournament_admin_members, [:tournament_id, :role], if_exists: true
    remove_index :tournament_matches, :tournament_id, if_exists: true
    remove_index :tournament_matches, [:tournament_id, :bracket_position], if_exists: true
    remove_index :tournament_sites, :tournament_id, if_exists: true
    remove_index :tournament_sites, [:tournament_id, :is_published], if_exists: true
    remove_index :tournament_teams, :tournament_id, if_exists: true
    remove_index :tournament_teams, [:tournament_id, :team_id], if_exists: true
    remove_index :tournament_teams, [:tournament_id, :group_name], if_exists: true
    remove_index :tournament_teams, [:tournament_id, :seed_number], if_exists: true

    # 4. 관련 테이블의 tournament_id 컬럼 제거
    remove_column :tournament_admin_members, :tournament_id
    remove_column :tournament_matches, :tournament_id
    remove_column :tournament_sites, :tournament_id
    remove_column :tournament_teams, :tournament_id

    # 5. tournaments 테이블 재생성 (UUID 기본 키)
    drop_table :tournaments

    create_table :tournaments, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :series, type: :bigint, foreign_key: { to_table: :tournament_series }
      t.references :organizer, type: :bigint, null: false, foreign_key: { to_table: :users }
      t.string :name, null: false
      t.integer :edition_number
      t.text :description
      t.string :logo_url
      t.string :banner_url
      t.datetime :registration_start_at
      t.datetime :registration_end_at
      t.datetime :start_date
      t.datetime :end_date
      t.string :format, default: "single_elimination"
      t.integer :max_teams, default: 16
      t.integer :min_teams, default: 4
      t.integer :team_size, default: 5
      t.integer :roster_min, default: 5
      t.integer :roster_max, default: 12
      t.decimal :entry_fee, precision: 10, default: 0
      t.text :prize_info
      t.jsonb :prize_distribution, default: {}
      t.text :rules
      t.jsonb :game_rules, default: {}
      t.references :venue, type: :bigint, foreign_key: { to_table: :courts }
      t.string :venue_name
      t.string :venue_address
      t.string :city
      t.string :district
      t.string :status, default: "draft"
      t.integer :teams_count, default: 0
      t.integer :matches_count, default: 0
      t.integer :views_count, default: 0
      t.jsonb :settings, default: {}
      t.boolean :is_public, default: true
      t.boolean :auto_approve_teams, default: false
      t.references :champion_team, type: :bigint, foreign_key: { to_table: :teams }
      t.references :mvp_player, type: :bigint, foreign_key: { to_table: :users }
      t.jsonb :divisions, default: [], null: false
      t.jsonb :division_tiers, default: [], null: false
      t.string :bank_name
      t.string :bank_account
      t.string :bank_holder

      t.timestamps
    end

    add_index :tournaments, :status
    add_index :tournaments, :is_public
    add_index :tournaments, :start_date
    add_index :tournaments, [:status, :start_date]
    add_index :tournaments, [:organizer_id, :status], name: "index_tournaments_on_organizer_and_status"
    add_index :tournaments, [:series_id, :edition_number], unique: true, where: "series_id IS NOT NULL"
    add_index :tournaments, :divisions, using: :gin

    # 6. 관련 테이블에 UUID 타입의 tournament_id 추가
    add_reference :tournament_admin_members, :tournament, type: :uuid, null: false, foreign_key: true
    add_index :tournament_admin_members, [:tournament_id, :role]

    add_reference :tournament_matches, :tournament, type: :uuid, null: false, foreign_key: true
    add_index :tournament_matches, [:tournament_id, :bracket_position]

    add_reference :tournament_sites, :tournament, type: :uuid, null: false, foreign_key: true
    add_index :tournament_sites, [:tournament_id, :is_published], name: "index_tournament_sites_on_tournament_and_published"

    add_reference :tournament_teams, :tournament, type: :uuid, null: false, foreign_key: true
    add_index :tournament_teams, [:tournament_id, :team_id], unique: true
    add_index :tournament_teams, [:tournament_id, :group_name], name: "index_tournament_teams_on_tournament_and_group"
    add_index :tournament_teams, [:tournament_id, :seed_number]
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Cannot reverse UUID primary key migration"
  end
end
