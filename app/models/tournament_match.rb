# frozen_string_literal: true

class TournamentMatch < ApplicationRecord
  include HasUuid

  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :tournament, counter_cache: :matches_count
  belongs_to :home_team, class_name: "TournamentTeam", optional: true
  belongs_to :away_team, class_name: "TournamentTeam", optional: true
  belongs_to :winner_team, class_name: "TournamentTeam", optional: true
  belongs_to :venue, class_name: "Court", optional: true
  belongs_to :mvp_player, class_name: "User", optional: true
  belongs_to :next_match, class_name: "TournamentMatch", optional: true

  has_many :match_player_stats, dependent: :destroy
  has_many :previous_matches, class_name: "TournamentMatch", foreign_key: :next_match_id

  # =============================================================================
  # Enums
  # =============================================================================
  enum :status, {
    scheduled: "scheduled",
    live: "live",
    completed: "completed",
    cancelled: "cancelled",
    postponed: "postponed"
  }, prefix: true

  # =============================================================================
  # Callbacks
  # =============================================================================
  before_validation :generate_uuid, on: :create
  after_save :update_tournament_matches_count

  # =============================================================================
  # Validations
  # =============================================================================
  validates :uuid, presence: true, uniqueness: true

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :upcoming, -> { where("scheduled_at > ?", Time.current).order(scheduled_at: :asc) }
  scope :past, -> { where("scheduled_at <= ?", Time.current).order(scheduled_at: :desc) }
  scope :completed, -> { where(status: :completed) }
  scope :live, -> { where(status: :live) }
  scope :by_round, ->(round) { where(round_number: round) }
  scope :in_group, ->(group) { where(group_name: group) }
  scope :finals, -> { where(round_name: "결승") }

  # =============================================================================
  # Instance Methods
  # =============================================================================

  # 경기 시작
  def start!
    update!(
      status: :live,
      started_at: Time.current
    )
  end

  # 경기 종료
  def finish!(home_final_score:, away_final_score:, mvp: nil)
    winner = if home_final_score > away_final_score
      home_team
    elsif away_final_score > home_final_score
      away_team
    end

    update!(
      status: :completed,
      ended_at: Time.current,
      home_score: home_final_score,
      away_score: away_final_score,
      winner_team: winner,
      mvp_player: mvp
    )

    # 팀 통계 업데이트
    home_team&.update_stats!
    away_team&.update_stats!

    # 다음 경기 승자 배정
    advance_winner_to_next_match! if winner && next_match
  end

  # 쿼터 점수 업데이트
  def update_quarter_score!(team:, quarter:, score:)
    scores = quarter_scores.deep_dup

    team_key = team == :home ? "home" : "away"

    if quarter.to_s.start_with?("ot")
      ot_number = quarter.to_s.gsub("ot", "").to_i
      scores[team_key]["ot"] ||= []
      scores[team_key]["ot"][ot_number - 1] = score
    else
      scores[team_key][quarter.to_s] = score
    end

    update!(quarter_scores: scores)
    recalculate_total_score!
  end

  # 총점 재계산
  def recalculate_total_score!
    home_total = quarter_scores["home"].values.flatten.compact.sum
    away_total = quarter_scores["away"].values.flatten.compact.sum

    update_columns(home_score: home_total, away_score: away_total)
  end

  # 쿼터별 점수 조회
  def home_quarter_scores
    quarter_scores["home"]
  end

  def away_quarter_scores
    quarter_scores["away"]
  end

  # 연장전 횟수
  def overtime_count
    [quarter_scores["home"]["ot"]&.length || 0,
     quarter_scores["away"]["ot"]&.length || 0].max
  end

  # 연장전 여부
  def has_overtime?
    overtime_count > 0
  end

  # 점수 차이
  def score_difference
    (home_score - away_score).abs
  end

  # 상태 한글명
  def status_name
    case status
    when "scheduled" then "예정"
    when "live" then "진행중"
    when "completed" then "종료"
    when "cancelled" then "취소됨"
    when "postponed" then "연기됨"
    else status
    end
  end

  # 결과 표시
  def result_display
    return "미정" unless status_completed?

    "#{home_score} : #{away_score}"
  end

  # 라운드명 한글
  def round_display
    round_name.presence || "#{round_number}라운드"
  end

  # 대진 표시
  def matchup_display
    home_name = home_team&.team&.name || "TBD"
    away_name = away_team&.team&.name || "TBD"

    "#{home_name} vs #{away_name}"
  end

  # 시간 표시
  def time_display
    return "미정" unless scheduled_at

    scheduled_at.strftime("%m/%d %H:%M")
  end

  # 박스스코어 생성
  def generate_box_score
    {
      match: {
        id: id,
        uuid: uuid,
        status: status,
        scheduled_at: scheduled_at,
        round: round_display,
        venue: venue&.name || court_number
      },
      home_team: build_team_box_score(home_team, "home"),
      away_team: build_team_box_score(away_team, "away"),
      mvp: mvp_player ? {
        id: mvp_player.id,
        name: mvp_player.display_name
      } : nil
    }
  end

  private

  def generate_uuid
    self.uuid ||= SecureRandom.uuid
  end

  def update_tournament_matches_count
    tournament.update_matches_count!
  end

  def advance_winner_to_next_match!
    return unless winner_team && next_match

    if next_match_slot == "home"
      next_match.update!(home_team: winner_team)
    else
      next_match.update!(away_team: winner_team)
    end
  end

  def build_team_box_score(tournament_team, side)
    return nil unless tournament_team

    {
      team: {
        id: tournament_team.team.id,
        name: tournament_team.team.name,
        logo_url: tournament_team.team.logo_url
      },
      score: side == "home" ? home_score : away_score,
      quarter_scores: quarter_scores[side],
      players: match_player_stats
        .joins(:tournament_team_player)
        .where(tournament_team_players: { tournament_team_id: tournament_team.id })
        .includes(tournament_team_player: :user)
        .map(&:to_box_score_row)
    }
  end
end
