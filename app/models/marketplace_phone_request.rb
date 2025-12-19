# frozen_string_literal: true

class MarketplacePhoneRequest < ApplicationRecord
  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :marketplace_item, counter_cache: :inquiries_count
  belongs_to :requester, class_name: "User"
  belongs_to :seller, class_name: "User"

  # =============================================================================
  # Enums
  # =============================================================================
  enum :status, {
    pending: "pending",
    approved: "approved",
    rejected: "rejected"
  }, prefix: true

  # =============================================================================
  # Validations
  # =============================================================================
  validates :requester_id, uniqueness: {
    scope: :marketplace_item_id,
    message: "이미 연락처 요청을 보냈습니다"
  }
  validates :message, length: { maximum: 500 }
  validates :rejection_reason, length: { maximum: 500 }
  validate :cannot_request_own_item

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :pending, -> { where(status: :pending) }
  scope :recent, -> { order(created_at: :desc) }

  # =============================================================================
  # Callbacks
  # =============================================================================
  before_validation :set_seller, on: :create

  # =============================================================================
  # Instance Methods
  # =============================================================================

  def approve!
    return false unless status_pending?
    update!(status: :approved, processed_at: Time.current)
    notify_requester_approved
    true
  end

  def reject!(reason: nil)
    return false unless status_pending?
    update!(
      status: :rejected,
      rejection_reason: reason,
      processed_at: Time.current
    )
    notify_requester_rejected
    true
  end

  def can_process?(user)
    seller_id == user.id && status_pending?
  end

  private

  def set_seller
    self.seller = marketplace_item.user if marketplace_item
  end

  def cannot_request_own_item
    return unless marketplace_item && requester
    if marketplace_item.user_id == requester_id
      errors.add(:base, "본인의 상품에는 연락처를 요청할 수 없습니다")
    end
  end

  def notify_requester_approved
    # TODO: Implement notification to requester with seller phone number
  end

  def notify_requester_rejected
    # TODO: Implement notification to requester about rejection
  end
end
