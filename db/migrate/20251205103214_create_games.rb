# frozen_string_literal: true

class CreateGames < ActiveRecord::Migration[8.0]
  def change
    create_table :games do |t|
      # 고유 식별자
      t.string :game_id, null: false
      t.uuid :uuid

      # 기본 정보
      t.string :title
      t.integer :game_type, default: 0, null: false  # pickup, guest_recruit, team_vs_team
      t.text :description

      # 관계
      t.references :organizer, foreign_key: { to_table: :users }, null: false
      t.references :court, foreign_key: true

      # 장소 정보 (court 없이도 저장 가능)
      t.string :city
      t.string :district
      t.string :venue_name
      t.string :venue_address

      # 일정
      t.datetime :scheduled_at, null: false
      t.datetime :ended_at
      t.integer :duration_hours, default: 2

      # 참가 설정
      t.integer :max_participants, default: 10
      t.integer :min_participants, default: 4
      t.integer :current_participants, default: 0
      t.integer :fee_per_person, default: 0
      t.string :skill_level, default: "all"  # beginner, intermediate, advanced, all

      # 유니폼 색상
      t.string :uniform_home_color, default: "#FF0000"
      t.string :uniform_away_color, default: "#0000FF"

      # 추가 설정
      t.text :requirements
      t.text :notes
      t.boolean :allow_guests, default: true

      # 상태
      t.integer :status, default: 0, null: false  # draft, published, full, in_progress, completed, cancelled

      # 복제 & 템플릿 기능
      t.references :template, foreign_key: { to_table: :game_templates }
      t.references :cloned_from, foreign_key: { to_table: :games }

      # 반복 경기
      t.boolean :is_recurring, default: false
      t.string :recurrence_rule  # weekly:tuesday, biweekly, monthly

      # 통계
      t.integer :applications_count, default: 0
      t.integer :views_count, default: 0

      t.timestamps
    end

    add_index :games, :game_id, unique: true
    add_index :games, :uuid, unique: true
    add_index :games, :game_type
    add_index :games, :status
    add_index :games, :scheduled_at
    add_index :games, [:city, :scheduled_at]
    add_index :games, :is_recurring
    add_index :games, :city
  end
end
