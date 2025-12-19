# frozen_string_literal: true

class MarketplaceWishlist < ApplicationRecord
  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :user
  belongs_to :marketplace_item, counter_cache: :wishlist_count

  # =============================================================================
  # Validations
  # =============================================================================
  validates :user_id, uniqueness: { scope: :marketplace_item_id, message: "이미 찜 목록에 추가되어 있습니다" }
  validates :target_price, numericality: { greater_than: 0 }, allow_nil: true

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :with_notifications, -> { where(notify_price_drop: true) }
  scope :recent, -> { order(created_at: :desc) }

  # =============================================================================
  # Instance Methods
  # =============================================================================

  def target_reached?
    return false unless target_price.present?
    marketplace_item.price <= target_price
  end
end
