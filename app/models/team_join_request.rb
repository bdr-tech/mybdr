# frozen_string_literal: true

class TeamJoinRequest < ApplicationRecord
  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :team
  belongs_to :user
  belongs_to :processed_by, class_name: "User", optional: true

  # =============================================================================
  # Enums
  # =============================================================================
  enum :status, {
    pending: "pending",
    approved: "approved",
    rejected: "rejected",
    cancelled: "cancelled"
  }, prefix: true

  # =============================================================================
  # Validations
  # =============================================================================
  validates :user_id, uniqueness: {
    scope: [:team_id, :status],
    conditions: -> { where(status: :pending) },
    message: "이미 가입 신청이 진행 중입니다"
  }
  validates :message, length: { maximum: 500 }
  validates :rejection_reason, length: { maximum: 500 }

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :pending, -> { where(status: :pending) }
  scope :recent, -> { order(created_at: :desc) }
  scope :for_team, ->(team) { where(team: team) }

  # =============================================================================
  # Callbacks
  # =============================================================================
  after_create :notify_team_captain

  # =============================================================================
  # Instance Methods
  # =============================================================================

  def approve!(processed_by_user, attributes = {})
    return false unless status_pending?

    transaction do
      update!(
        status: :approved,
        processed_by: processed_by_user,
        processed_at: Time.current
      )

      # Add user to team
      team.team_members.create!(
        user: user,
        role: :member,
        position: preferred_position,
        jersey_number: preferred_jersey_number,
        joined_at: Time.current,
        status: :active,
        **attributes
      )

      # Record history
      TeamMemberHistory.create!(
        user: user,
        team: team,
        action: "joined",
        role: "member",
        jersey_number: preferred_jersey_number,
        processed_by: processed_by_user,
        note: "가입 승인"
      )

      # Notify user
      notify_user_approved
    end
    true
  rescue ActiveRecord::RecordInvalid => e
    errors.add(:base, e.message)
    false
  end

  def reject!(processed_by_user, reason: nil)
    return false unless status_pending?

    update!(
      status: :rejected,
      processed_by: processed_by_user,
      processed_at: Time.current,
      rejection_reason: reason
    )

    notify_user_rejected
    true
  end

  def cancel!
    return false unless status_pending?

    update!(status: :cancelled)
    true
  end

  def can_process?(user)
    team.admin?(user) && status_pending?
  end

  private

  def notify_team_captain
    # TODO: Implement notification to team captain
  end

  def notify_user_approved
    # TODO: Implement notification to user
  end

  def notify_user_rejected
    # TODO: Implement notification to user
  end
end
