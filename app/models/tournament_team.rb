# frozen_string_literal: true

class TournamentTeam < ApplicationRecord
  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :tournament, counter_cache: :teams_count
  belongs_to :team, primary_key: :id
  belongs_to :registered_by, class_name: "User", optional: true

  has_many :tournament_team_players, dependent: :destroy
  has_many :players, through: :tournament_team_players, source: :user
  has_many :home_matches, class_name: "TournamentMatch", foreign_key: :home_team_id
  has_many :away_matches, class_name: "TournamentMatch", foreign_key: :away_team_id

  # =============================================================================
  # Enums
  # =============================================================================
  enum :status, {
    pending: "pending",
    approved: "approved",
    rejected: "rejected",
    withdrawn: "withdrawn"
  }, prefix: true

  enum :payment_status, {
    unpaid: "unpaid",
    paid: "paid",
    refunded: "refunded"
  }, prefix: true

  # =============================================================================
  # Callbacks
  # =============================================================================
  after_create :auto_register_team_members
  after_save :update_tournament_teams_count, if: :saved_change_to_status?
  after_destroy :update_tournament_teams_count

  # =============================================================================
  # Validations
  # =============================================================================
  validates :tournament_id, uniqueness: { scope: :team_id, message: "이미 등록된 팀입니다" }

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :approved, -> { where(status: :approved) }
  scope :pending_approval, -> { where(status: :pending) }
  scope :in_group, ->(group) { where(group_name: group) }
  scope :by_seed, -> { order(seed_number: :asc) }
  scope :ranked, -> { where.not(final_rank: nil).order(final_rank: :asc) }

  # =============================================================================
  # Instance Methods
  # =============================================================================

  # 승인
  def approve!
    update!(
      status: :approved,
      approved_at: Time.current
    )
    tournament.update_teams_count!
  end

  # 거절
  def reject!
    update!(status: :rejected)
  end

  # 철회
  def withdraw!
    update!(status: :withdrawn)
    tournament.update_teams_count!
  end

  # 결제 완료
  def mark_as_paid!
    update!(
      payment_status: :paid,
      paid_at: Time.current
    )
  end

  # 환불
  def mark_as_refunded!
    update!(payment_status: :refunded)
  end

  # 전적 업데이트
  def update_stats!
    wins_count = 0
    losses_count = 0
    draws_count = 0
    pf = 0
    pa = 0

    all_matches.completed.each do |match|
      if match.home_team_id == id
        pf += match.home_score.to_i
        pa += match.away_score.to_i
        if match.home_score > match.away_score
          wins_count += 1
        elsif match.home_score < match.away_score
          losses_count += 1
        else
          draws_count += 1
        end
      else
        pf += match.away_score.to_i
        pa += match.home_score.to_i
        if match.away_score > match.home_score
          wins_count += 1
        elsif match.away_score < match.home_score
          losses_count += 1
        else
          draws_count += 1
        end
      end
    end

    update!(
      wins: wins_count,
      losses: losses_count,
      draws: draws_count,
      points_for: pf,
      points_against: pa,
      point_difference: pf - pa
    )
  end

  # 모든 경기
  def all_matches
    TournamentMatch.where("home_team_id = ? OR away_team_id = ?", id, id)
  end

  # 경기 수
  def games_played
    wins + losses + draws
  end

  # 승률
  def win_rate
    return 0.0 if games_played.zero?

    (wins.to_f / games_played * 100).round(1)
  end

  # 승률 (소수점)
  def win_percentage
    return 0.0 if games_played.zero?

    wins.to_f / games_played
  end

  # 점수차
  def point_differential
    points_for.to_i - points_against.to_i
  end

  # 연승/연패 스트릭
  def current_streak
    matches = all_matches.completed.order(ended_at: :desc).limit(10)
    return 0 if matches.empty?

    streak = 0
    last_result = nil

    matches.each do |match|
      won = (match.home_team_id == id && match.home_score > match.away_score) ||
            (match.away_team_id == id && match.away_score > match.home_score)

      if last_result.nil?
        last_result = won
        streak = won ? 1 : -1
      elsif won == last_result
        streak += (won ? 1 : -1)
      else
        break
      end
    end

    streak
  end

  # 상태 한글명
  def status_name
    case status
    when "pending" then "대기중"
    when "approved" then "승인됨"
    when "rejected" then "거절됨"
    when "withdrawn" then "철회됨"
    else status
    end
  end

  # 결제 상태 한글명
  def payment_status_name
    case payment_status
    when "unpaid" then "미결제"
    when "paid" then "결제완료"
    when "refunded" then "환불됨"
    else payment_status
    end
  end

  # 전적 표시
  def record_display
    "#{wins}승 #{losses}패 #{draws}무"
  end

  # 로스터 수 확인
  def roster_valid?
    players_count = tournament_team_players.active.count
    players_count >= tournament.roster_min && players_count <= tournament.roster_max
  end

  # 선수 추가
  def add_player!(user, attributes = {})
    tournament_team_players.create!(
      user: user,
      **attributes
    )
  end

  # 선수 제거
  def remove_player!(user)
    tournament_team_players.find_by!(user: user).destroy
  end

  private

  # 팀 멤버 자동 등록
  def auto_register_team_members
    return unless team.present?

    team.team_members.active.each do |member|
      # Map TeamMember role to TournamentTeamPlayer role
      player_role = case member.role
                    when "captain" then :captain
                    when "vice_captain", "member" then :player
                    else :player
                    end

      tournament_team_players.create!(
        user: member.user,
        jersey_number: member.jersey_number,
        role: player_role,
        auto_registered: true
      )
    end
  end

  def update_tournament_teams_count
    tournament.update_teams_count!
  end
end
