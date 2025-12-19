# frozen_string_literal: true

class TournamentTeamPlayer < ApplicationRecord
  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :tournament_team
  belongs_to :user

  has_many :match_player_stats, dependent: :destroy

  # Delegate for convenience
  delegate :tournament, to: :tournament_team
  delegate :team, to: :tournament_team

  # =============================================================================
  # Enums
  # =============================================================================
  enum :role, {
    player: "player",
    captain: "captain",
    coach: "coach"
  }, prefix: true

  # =============================================================================
  # Validations
  # =============================================================================
  validates :user_id, uniqueness: { scope: :tournament_team_id, message: "이미 등록된 선수입니다" }
  validates :jersey_number, uniqueness: { scope: :tournament_team_id, message: "이미 사용중인 등번호입니다" }, allow_nil: true

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :active, -> { where(is_active: true) }
  scope :starters, -> { where(is_starter: true) }
  scope :auto_registered, -> { where(auto_registered: true) }
  scope :manually_added, -> { where(auto_registered: false) }
  scope :by_jersey, -> { order(jersey_number: :asc) }
  scope :by_position, -> { order(:position) }

  # =============================================================================
  # Instance Methods
  # =============================================================================

  # 통계 업데이트
  def update_stats!
    stats = match_player_stats.includes(:tournament_match)
    played = stats.count

    return if played.zero?

    totals = stats.inject({
      points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0
    }) do |acc, s|
      acc[:points] += s.points.to_i
      acc[:rebounds] += s.total_rebounds.to_i
      acc[:assists] += s.assists.to_i
      acc[:steals] += s.steals.to_i
      acc[:blocks] += s.blocks.to_i
      acc
    end

    update!(
      games_played: played,
      total_points: totals[:points],
      total_rebounds: totals[:rebounds],
      total_assists: totals[:assists],
      total_steals: totals[:steals],
      total_blocks: totals[:blocks],
      avg_points: (totals[:points].to_f / played).round(1),
      avg_rebounds: (totals[:rebounds].to_f / played).round(1),
      avg_assists: (totals[:assists].to_f / played).round(1)
    )
  end

  # 비활성화
  def deactivate!
    update!(is_active: false)
  end

  # 활성화
  def activate!
    update!(is_active: true)
  end

  # 선발 지정
  def set_as_starter!
    update!(is_starter: true)
  end

  # 후보 지정
  def set_as_bench!
    update!(is_starter: false)
  end

  # 역할 한글명
  def role_name
    case role
    when "player" then "선수"
    when "captain" then "주장"
    when "coach" then "코치"
    else role
    end
  end

  # 포지션 한글명
  def position_name
    case position
    when "point_guard", "PG" then "포인트가드"
    when "shooting_guard", "SG" then "슈팅가드"
    when "small_forward", "SF" then "스몰포워드"
    when "power_forward", "PF" then "파워포워드"
    when "center", "C" then "센터"
    else position
    end
  end

  # 선수명 (등번호 포함)
  def display_name
    if jersey_number.present?
      "##{jersey_number} #{user.display_name}"
    else
      user.display_name
    end
  end

  # 평균 통계 표시
  def stats_line
    "#{avg_points}점 #{avg_rebounds}리바 #{avg_assists}어시"
  end
end
