class CreateTournamentMatches < ActiveRecord::Migration[8.0]
  def change
    create_table :tournament_matches do |t|
      t.string :uuid, null: false
      t.references :tournament, null: false, foreign_key: true

      # 대진 정보
      t.references :home_team, foreign_key: { to_table: :tournament_teams }
      t.references :away_team, foreign_key: { to_table: :tournament_teams }

      # 라운드/조 정보
      t.string :round_name  # 16강, 8강, 준결승, 결승 / 조별 1R, 2R
      t.integer :round_number
      t.integer :match_number  # 해당 라운드 내 경기 번호
      t.string :group_name  # 조별 리그용 (A, B, C, D)

      # 토너먼트 대진표 위치
      t.integer :bracket_position  # 대진표 상의 위치
      t.integer :bracket_level  # 대진표 레벨 (0: 결승, 1: 준결승, 2: 8강...)

      # 일정
      t.datetime :scheduled_at
      t.datetime :started_at
      t.datetime :ended_at

      # 장소
      t.references :venue, foreign_key: { to_table: :courts }
      t.string :court_number  # 코트 번호

      # 점수
      t.integer :home_score, default: 0
      t.integer :away_score, default: 0

      # 쿼터별 점수 (NBA 스타일)
      t.jsonb :quarter_scores, default: {
        "home" => { "q1" => 0, "q2" => 0, "q3" => 0, "q4" => 0, "ot" => [] },
        "away" => { "q1" => 0, "q2" => 0, "q3" => 0, "q4" => 0, "ot" => [] }
      }

      # 상태
      t.string :status, default: "scheduled"  # scheduled, live, completed, cancelled, postponed

      # 승자
      t.references :winner_team, foreign_key: { to_table: :tournament_teams }

      # 다음 라운드 연결
      t.references :next_match, foreign_key: { to_table: :tournament_matches }
      t.string :next_match_slot  # "home" or "away"

      # MVP
      t.references :mvp_player, foreign_key: { to_table: :users }

      # 추가 정보
      t.text :notes
      t.jsonb :settings, default: {}

      t.timestamps
    end

    add_index :tournament_matches, :uuid, unique: true
    add_index :tournament_matches, [:tournament_id, :round_number, :match_number]
    add_index :tournament_matches, :status
    add_index :tournament_matches, :scheduled_at
    add_index :tournament_matches, [:tournament_id, :bracket_position]
  end
end
