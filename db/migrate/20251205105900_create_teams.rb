class CreateTeams < ActiveRecord::Migration[8.0]
  def change
    create_table :teams do |t|
      t.string :uuid, null: false
      t.string :name, null: false
      t.string :slug
      t.text :description
      t.string :logo_url
      t.string :banner_url

      # 팀 정보
      t.string :city
      t.string :district
      t.string :home_court
      t.integer :founded_year

      # 팀장/관리자
      t.references :captain, foreign_key: { to_table: :users }, null: false
      t.references :manager, foreign_key: { to_table: :users }

      # 설정
      t.string :status, default: "active"
      t.boolean :is_public, default: true
      t.boolean :accepting_members, default: true
      t.integer :max_members, default: 15
      t.jsonb :settings, default: {}

      # 통계
      t.integer :members_count, default: 0
      t.integer :wins, default: 0
      t.integer :losses, default: 0
      t.integer :draws, default: 0
      t.integer :tournaments_count, default: 0

      # 유니폼 색상
      t.string :primary_color, default: "#FFFFFF"
      t.string :secondary_color, default: "#000000"

      t.timestamps
    end

    add_index :teams, :uuid, unique: true
    add_index :teams, :slug, unique: true
    add_index :teams, :name
    add_index :teams, :status
    add_index :teams, :city

    # 팀 멤버 테이블
    create_table :team_members do |t|
      t.references :team, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      t.integer :jersey_number
      t.string :role, default: "member"  # member, vice_captain, captain
      t.string :position
      t.string :status, default: "active"

      t.datetime :joined_at
      t.datetime :left_at

      t.timestamps
    end

    add_index :team_members, [:team_id, :user_id], unique: true
    add_index :team_members, [:team_id, :jersey_number], unique: true
    add_index :team_members, :status
  end
end
