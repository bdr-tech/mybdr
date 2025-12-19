# frozen_string_literal: true

class CourtReview < ApplicationRecord
  include ActionView::Helpers::SanitizeHelper

  # =============================================================================
  # Active Storage
  # =============================================================================
  has_many_attached :photos

  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :court_info, counter_cache: :reviews_count
  belongs_to :user

  # =============================================================================
  # Enums
  # =============================================================================
  enum :status, {
    published: "published",
    hidden: "hidden",
    deleted: "deleted"
  }, prefix: true

  # =============================================================================
  # Validations
  # =============================================================================
  validates :rating, presence: true, numericality: { in: 1..5 }
  validates :content, length: { maximum: 2000 }
  validates :user_id, uniqueness: {
    scope: :court_info_id,
    message: "이미 이 코트에 리뷰를 작성했습니다",
    conditions: -> { where(is_checkin: false) }
  }, unless: :is_checkin?

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :published, -> { where(status: :published) }
  scope :recent, -> { order(created_at: :desc) }
  scope :top_rated, -> { order(rating: :desc) }
  scope :with_photos, -> { joins(:photos_attachments) }
  scope :checkin_reviews, -> { where(is_checkin: true) }
  scope :regular_reviews, -> { where(is_checkin: false) }

  # =============================================================================
  # Callbacks
  # =============================================================================
  before_validation :sanitize_content
  after_save :update_court_rating
  after_destroy :update_court_rating

  # =============================================================================
  # Instance Methods
  # =============================================================================

  def editable_by?(user)
    return false unless user
    self.user_id == user.id || user.membership_type_super_admin?
  end

  def authored_by?(user)
    self.user_id == user&.id
  end

  def rating_stars
    "★" * rating + "☆" * (5 - rating)
  end

  def rating_label
    case rating
    when 5 then "최고"
    when 4 then "좋음"
    when 3 then "보통"
    when 2 then "별로"
    when 1 then "최악"
    else ""
    end
  end

  private

  def sanitize_content
    return content unless content.present?
    self.content = sanitize(content, tags: %w[p br strong em u], attributes: [])
  end

  def update_court_rating
    court_info.update_rating!
  end
end
