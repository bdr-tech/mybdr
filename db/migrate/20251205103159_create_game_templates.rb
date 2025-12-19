# frozen_string_literal: true

class CreateGameTemplates < ActiveRecord::Migration[8.0]
  def change
    create_table :game_templates do |t|
      t.references :user, foreign_key: true, null: false
      t.references :court, foreign_key: true

      # 기본 정보
      t.string :name, null: false
      t.integer :game_type, default: 0, null: false  # pickup, guest_recruit, team_vs_team

      # 기본 설정 (JSON)
      t.jsonb :default_settings, default: {}
      # {
      #   max_participants: 10,
      #   min_participants: 4,
      #   fee_per_person: 10000,
      #   duration_hours: 2,
      #   uniform_home_color: '#FF0000',
      #   uniform_away_color: '#0000FF',
      #   skill_level: 'all',
      #   requirements: '',
      #   description: ''
      # }

      # 사용 통계
      t.integer :use_count, default: 0

      # 공개 설정
      t.boolean :is_public, default: false

      t.timestamps
    end

    add_index :game_templates, :game_type
    add_index :game_templates, :is_public
    add_index :game_templates, [:user_id, :name], unique: true
  end
end
