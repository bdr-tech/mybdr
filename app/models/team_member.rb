# frozen_string_literal: true

class TeamMember < ApplicationRecord
  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :team, counter_cache: :members_count, primary_key: :id
  belongs_to :user

  # =============================================================================
  # Enums
  # =============================================================================
  enum :status, {
    active: "active",
    inactive: "inactive",
    left: "left",
    banned: "banned"
  }, prefix: true

  enum :role, {
    member: "member",
    vice_captain: "vice_captain",
    captain: "captain"
  }, prefix: true

  # =============================================================================
  # Validations
  # =============================================================================
  validates :user_id, uniqueness: { scope: :team_id, message: "이미 팀에 가입되어 있습니다" }
  validates :jersey_number, uniqueness: { scope: :team_id, allow_nil: true }

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :active, -> { where(status: :active) }
  scope :by_role, ->(role) { where(role: role) }
  scope :by_jersey, -> { order(jersey_number: :asc) }

  # =============================================================================
  # Instance Methods
  # =============================================================================

  def role_name
    case role
    when "member" then "팀원"
    when "vice_captain" then "부주장"
    when "captain" then "주장"
    else role
    end
  end

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

  def display_name
    if jersey_number.present?
      "##{jersey_number} #{user.display_name}"
    else
      user.display_name
    end
  end

  def leave!
    update!(status: :left, left_at: Time.current)
  end
end
