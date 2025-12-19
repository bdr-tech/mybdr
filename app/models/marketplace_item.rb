# frozen_string_literal: true

class MarketplaceItem < ApplicationRecord
  include ActionView::Helpers::SanitizeHelper
  include HasPublicId

  # =============================================================================
  # Active Storage
  # =============================================================================
  has_many_attached :photos

  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :user
  has_many :wishlists, class_name: "MarketplaceWishlist", dependent: :destroy
  has_many :wishlisted_by, through: :wishlists, source: :user
  has_many :phone_requests, class_name: "MarketplacePhoneRequest", dependent: :destroy
  has_many :comments, as: :commentable, dependent: :destroy

  # =============================================================================
  # Constants
  # =============================================================================
  CATEGORIES = {
    basketball: "농구공",
    shoes: "농구화",
    apparel: "의류",
    gear: "장비",
    accessories: "악세서리",
    other: "기타"
  }.freeze

  CONDITIONS = {
    new: "새상품",
    like_new: "거의 새것",
    good: "양호",
    fair: "보통",
    poor: "하"
  }.freeze

  MAX_PHOTOS = 10
  MAX_PHOTO_SIZE = 1.megabyte

  # =============================================================================
  # Enums
  # =============================================================================
  enum :category, {
    basketball: "basketball",
    shoes: "shoes",
    apparel: "apparel",
    gear: "gear",
    accessories: "accessories",
    other: "other"
  }, prefix: true

  enum :condition, {
    new: "new",
    like_new: "like_new",
    good: "good",
    fair: "fair",
    poor: "poor"
  }, prefix: true

  enum :status, {
    active: "active",
    reserved: "reserved",
    sold: "sold",
    hidden: "hidden",
    deleted: "deleted"
  }, prefix: true

  # =============================================================================
  # Validations
  # =============================================================================
  validates :title, presence: true, length: { maximum: 100 }
  validates :description, presence: true, length: { maximum: 5000 }
  validates :category, presence: true
  validates :condition, presence: true
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validate :validate_photos

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :available, -> { where(status: [:active, :reserved]) }
  scope :active_only, -> { where(status: :active) }
  scope :by_category, ->(cat) { where(category: cat) if cat.present? }
  scope :by_city, ->(city) { where(city: city) if city.present? }
  scope :price_range, ->(min, max) {
    result = all
    result = result.where("price >= ?", min) if min.present?
    result = result.where("price <= ?", max) if max.present?
    result
  }
  scope :recent, -> { order(created_at: :desc) }
  scope :search, ->(query) {
    where("title ILIKE :q OR description ILIKE :q", q: "%#{query}%") if query.present?
  }

  # =============================================================================
  # Callbacks
  # =============================================================================
  before_validation :sanitize_content
  after_update :notify_price_drop, if: :saved_change_to_price?

  # =============================================================================
  # Class Methods
  # =============================================================================

  def self.category_label(cat)
    CATEGORIES[cat.to_sym] || cat
  end

  def self.condition_label(cond)
    CONDITIONS[cond.to_sym] || cond
  end

  # =============================================================================
  # Instance Methods
  # =============================================================================

  def category_label
    CATEGORIES[category.to_sym] || category
  end

  def condition_label
    CONDITIONS[condition.to_sym] || condition
  end

  def primary_photo
    photos.first
  end

  def increment_views!
    increment!(:views_count)
  end

  def editable_by?(user)
    return false unless user
    self.user_id == user.id || user.membership_type_super_admin?
  end

  def owned_by?(user)
    self.user_id == user&.id
  end

  def wishlisted_by?(user)
    return false unless user
    wishlists.exists?(user: user)
  end

  def toggle_wishlist!(user)
    wishlist = wishlists.find_by(user: user)
    if wishlist
      wishlist.destroy
      update_column(:wishlist_count, wishlists.count)
      false
    else
      wishlists.create!(user: user)
      update_column(:wishlist_count, wishlists.count)
      true
    end
  end

  def price_dropped?
    return false unless original_price.present?
    price < original_price
  end

  def discount_percentage
    return 0 unless price_dropped?
    ((original_price - price).to_f / original_price * 100).round
  end

  def mark_as_sold!
    update!(status: :sold)
  end

  def mark_as_reserved!
    update!(status: :reserved)
  end

  def location_display
    [city, district].compact.join(" ")
  end

  private

  def validate_photos
    return unless photos.attached?

    if photos.count > MAX_PHOTOS
      errors.add(:photos, "최대 #{MAX_PHOTOS}장까지 업로드 가능합니다")
    end

    photos.each do |photo|
      unless photo.content_type.in?(%w[image/jpeg image/png image/gif image/webp])
        errors.add(:photos, "이미지 형식만 업로드 가능합니다")
      end

      if photo.byte_size > MAX_PHOTO_SIZE
        errors.add(:photos, "이미지는 #{MAX_PHOTO_SIZE / 1.megabyte}MB 이하만 가능합니다")
      end
    end
  end

  def sanitize_content
    return unless description.present?
    self.description = sanitize(description, tags: %w[p br strong em u], attributes: [])
  end

  def notify_price_drop
    return unless status_active?
    return unless price_before_last_save.present? && price < price_before_last_save

    wishlists.where(notify_price_drop: true).find_each do |wishlist|
      # Skip if target price is set and current price is still above it
      next if wishlist.target_price.present? && price > wishlist.target_price
      # TODO: Implement notification system
    end
  end
end
