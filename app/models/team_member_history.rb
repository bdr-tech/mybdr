# frozen_string_literal: true

class TeamMemberHistory < ApplicationRecord
  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :user
  belongs_to :team
  belongs_to :from_team, class_name: "Team", optional: true
  belongs_to :to_team, class_name: "Team", optional: true
  belongs_to :processed_by, class_name: "User", optional: true

  # =============================================================================
  # Constants
  # =============================================================================
  ACTIONS = %w[joined left transferred captain_transferred role_changed kicked].freeze

  # =============================================================================
  # Validations
  # =============================================================================
  validates :action, presence: true, inclusion: { in: ACTIONS }
  validates :note, length: { maximum: 1000 }

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :recent, -> { order(created_at: :desc) }
  scope :for_user, ->(user) { where(user: user) }
  scope :for_team, ->(team) { where(team: team) }
  scope :transfers, -> { where(action: "transferred") }
  scope :captain_changes, -> { where(action: "captain_transferred") }

  # =============================================================================
  # Class Methods
  # =============================================================================

  def self.record_join(user:, team:, role: "member", jersey_number: nil, processed_by: nil, note: nil)
    create!(
      user: user,
      team: team,
      action: "joined",
      role: role,
      jersey_number: jersey_number,
      to_team: team,
      processed_by: processed_by,
      note: note || "팀 가입"
    )
  end

  def self.record_leave(user:, team:, role: nil, processed_by: nil, note: nil)
    create!(
      user: user,
      team: team,
      action: "left",
      role: role,
      from_team: team,
      processed_by: processed_by,
      note: note || "팀 탈퇴"
    )
  end

  def self.record_transfer(user:, from_team:, to_team:, role: "member", jersey_number: nil, processed_by: nil, note: nil)
    create!(
      user: user,
      team: to_team,
      action: "transferred",
      role: role,
      jersey_number: jersey_number,
      from_team: from_team,
      to_team: to_team,
      processed_by: processed_by,
      note: note || "#{from_team.name}에서 #{to_team.name}으로 이적"
    )
  end

  def self.record_kick(user:, team:, role: nil, processed_by:, note: nil)
    create!(
      user: user,
      team: team,
      action: "kicked",
      role: role,
      from_team: team,
      processed_by: processed_by,
      note: note || "팀에서 추방"
    )
  end

  # =============================================================================
  # Instance Methods
  # =============================================================================

  def action_label
    case action
    when "joined" then "가입"
    when "left" then "탈퇴"
    when "transferred" then "이적"
    when "captain_transferred" then "주장 이전"
    when "role_changed" then "역할 변경"
    when "kicked" then "추방"
    else action
    end
  end

  def transfer?
    action == "transferred"
  end

  def captain_change?
    action == "captain_transferred"
  end

  def summary
    case action
    when "joined"
      "#{user.display_name}님이 #{team.name}에 #{role_label}으로 가입했습니다."
    when "left"
      "#{user.display_name}님이 #{team.name}을 탈퇴했습니다."
    when "transferred"
      "#{user.display_name}님이 #{from_team&.name}에서 #{to_team&.name}으로 이적했습니다."
    when "captain_transferred"
      "#{user.display_name}님이 #{team.name}의 새 주장이 되었습니다."
    when "kicked"
      "#{user.display_name}님이 #{team.name}에서 추방되었습니다."
    else
      note || "#{action_label} 처리됨"
    end
  end

  private

  def role_label
    case role
    when "captain" then "주장"
    when "vice_captain" then "부주장"
    when "member" then "팀원"
    else role
    end
  end
end
