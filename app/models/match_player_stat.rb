# frozen_string_literal: true

class MatchPlayerStat < ApplicationRecord
  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :tournament_match
  belongs_to :tournament_team_player

  # Delegates for convenience
  delegate :tournament, to: :tournament_match
  delegate :user, to: :tournament_team_player
  delegate :tournament_team, to: :tournament_team_player

  # =============================================================================
  # Callbacks
  # =============================================================================
  before_save :calculate_percentages
  before_save :calculate_advanced_stats
  after_save :update_player_aggregates

  # =============================================================================
  # Validations
  # =============================================================================
  validates :tournament_match_id, uniqueness: { scope: :tournament_team_player_id }
  validates :minutes_played, numericality: { greater_than_or_equal_to: 0 }
  validates :points, :field_goals_made, :field_goals_attempted,
            :three_pointers_made, :three_pointers_attempted,
            :free_throws_made, :free_throws_attempted,
            :offensive_rebounds, :defensive_rebounds,
            :assists, :steals, :blocks, :turnovers, :personal_fouls,
            numericality: { greater_than_or_equal_to: 0 }

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :starters, -> { where(is_starter: true) }
  scope :by_points, -> { order(points: :desc) }
  scope :by_rebounds, -> { order(total_rebounds: :desc) }
  scope :by_assists, -> { order(assists: :desc) }
  scope :by_efficiency, -> { order(efficiency: :desc) }

  # =============================================================================
  # 통계 집계 Class Methods
  # =============================================================================
  class << self
    def total_points
      sum(:points)
    end

    def total_rebounds
      sum(:total_rebounds)
    end

    def total_assists
      sum(:assists)
    end

    def average_points
      average(:points).to_f.round(1)
    end

    def average_rebounds
      average(:total_rebounds).to_f.round(1)
    end

    def average_assists
      average(:assists).to_f.round(1)
    end
  end

  # =============================================================================
  # Instance Methods
  # =============================================================================

  # 더블더블 여부
  def double_double?
    categories = [points, total_rebounds, assists, steals, blocks]
    categories.count { |stat| stat >= 10 } >= 2
  end

  # 트리플더블 여부
  def triple_double?
    categories = [points, total_rebounds, assists, steals, blocks]
    categories.count { |stat| stat >= 10 } >= 3
  end

  # 출전시간 표시 (MM:SS)
  def minutes_display
    return "DNP" if minutes_played.zero?

    mins = minutes_played
    "#{mins}:00"
  end

  # 슈팅 라인 표시 (FG-3P-FT)
  def shooting_line
    "#{field_goals_made}/#{field_goals_attempted} - #{three_pointers_made}/#{three_pointers_attempted} - #{free_throws_made}/#{free_throws_attempted}"
  end

  # 리바운드 라인 (OREB/DREB/REB)
  def rebound_line
    "#{offensive_rebounds}/#{defensive_rebounds}/#{total_rebounds}"
  end

  # 박스스코어 행 데이터 (View용)
  def to_box_score_row
    {
      player: {
        id: user.id,
        name: user.display_name,
        jersey_number: tournament_team_player.jersey_number,
        position: tournament_team_player.position
      },
      starter: is_starter,
      min: minutes_display,
      pts: points,
      reb: total_rebounds,
      ast: assists,
      stl: steals,
      blk: blocks,
      to: turnovers,
      pf: personal_fouls,
      plus_minus: plus_minus,
      fg: "#{field_goals_made}-#{field_goals_attempted}",
      fg_pct: field_goal_percentage,
      three_pt: "#{three_pointers_made}-#{three_pointers_attempted}",
      three_pt_pct: three_point_percentage,
      ft: "#{free_throws_made}-#{free_throws_attempted}",
      ft_pct: free_throw_percentage,
      oreb: offensive_rebounds,
      dreb: defensive_rebounds,
      eff: efficiency,
      double_double: double_double?,
      triple_double: triple_double?
    }
  end

  # NBA 스타일 통계 요약
  def stat_summary
    "#{points}점 #{total_rebounds}리바 #{assists}어시"
  end

  # 통계 하이라이트 (10 이상인 카테고리)
  def highlights
    highlights = []
    highlights << "#{points}점" if points >= 10
    highlights << "#{total_rebounds}리바" if total_rebounds >= 10
    highlights << "#{assists}어시" if assists >= 10
    highlights << "#{steals}스틸" if steals >= 5
    highlights << "#{blocks}블록" if blocks >= 5
    highlights
  end

  private

  # 슈팅 퍼센티지 계산
  def calculate_percentages
    # 필드골 퍼센티지
    self.field_goal_percentage = if field_goals_attempted.to_i > 0
      (field_goals_made.to_f / field_goals_attempted * 100).round(1)
    else
      0.0
    end

    # 3점슛 퍼센티지
    self.three_point_percentage = if three_pointers_attempted.to_i > 0
      (three_pointers_made.to_f / three_pointers_attempted * 100).round(1)
    else
      0.0
    end

    # 자유투 퍼센티지
    self.free_throw_percentage = if free_throws_attempted.to_i > 0
      (free_throws_made.to_f / free_throws_attempted * 100).round(1)
    else
      0.0
    end

    # 2점슛 계산
    self.two_pointers_made = field_goals_made.to_i - three_pointers_made.to_i
    self.two_pointers_attempted = field_goals_attempted.to_i - three_pointers_attempted.to_i
    self.two_point_percentage = if two_pointers_attempted > 0
      (two_pointers_made.to_f / two_pointers_attempted * 100).round(1)
    else
      0.0
    end

    # 총 리바운드
    self.total_rebounds = offensive_rebounds.to_i + defensive_rebounds.to_i
  end

  # 고급 통계 계산
  def calculate_advanced_stats
    # 효율성 지수 (EFF)
    missed_fg = field_goals_attempted.to_i - field_goals_made.to_i
    missed_ft = free_throws_attempted.to_i - free_throws_made.to_i
    self.efficiency = points.to_i + total_rebounds.to_i + assists.to_i +
                      steals.to_i + blocks.to_i - missed_fg - missed_ft - turnovers.to_i

    # 진정 슈팅 비율 (TS%)
    tsa = field_goals_attempted.to_i + (0.44 * free_throws_attempted.to_i)
    self.true_shooting_percentage = if tsa > 0
      (points.to_f / (2 * tsa) * 100).round(1)
    else
      0.0
    end

    # 유효 필드골 비율 (eFG%)
    self.effective_fg_percentage = if field_goals_attempted.to_i > 0
      ((field_goals_made.to_i + 0.5 * three_pointers_made.to_i) / field_goals_attempted.to_f * 100).round(1)
    else
      0.0
    end

    # 어시스트 대 턴오버 비율 (A/TO)
    self.assist_turnover_ratio = if turnovers.to_i > 0
      (assists.to_f / turnovers).round(2)
    else
      assists.to_f
    end
  end

  # 선수 집계 통계 업데이트
  def update_player_aggregates
    tournament_team_player.update_stats!
  end
end
