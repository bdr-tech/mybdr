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
