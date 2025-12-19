# frozen_string_literal: true

class Post < ApplicationRecord
  include ActionView::Helpers::SanitizeHelper
  include HasPublicId

  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :user
  has_many :comments, as: :commentable, dependent: :destroy

  # =============================================================================
  # Constants
  # =============================================================================
  CATEGORIES = {
    free: "� ��",
    marketplace: "�p�",
    court_info: "T��",
    site_review: "�t���",
    my_bdr: "MyBDR",
    lesson: "�/P!",
    news: "�l��"
  }.freeze

  CATEGORY_CODES = {
    free: "FRE",
    marketplace: "MKT",
    court_info: "CRT",
    site_review: "REV",
    my_bdr: "MYB",
    lesson: "LES",
    news: "NEW"
  }.freeze

  # =============================================================================
  # Enums
  # =============================================================================
  enum :category, {
    free: "free",
    marketplace: "marketplace",
    court_info: "court_info",
    site_review: "site_review",
    my_bdr: "my_bdr",
    lesson: "lesson",
    news: "news"
  }, prefix: true

  enum :status, {
    draft: "draft",
    published: "published",
    hidden: "hidden",
    deleted: "deleted"
  }, prefix: true

  # =============================================================================
  # Validations
  # =============================================================================
  validates :title, presence: true, length: { maximum: 200 }
  validates :content, presence: true, length: { maximum: 50_000 }
  validates :category, presence: true
  validates :post_code, presence: true, uniqueness: true

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :published, -> { where(status: :published) }
  scope :by_category, ->(cat) { where(category: cat) if cat.present? }
  scope :pinned_first, -> { order(is_pinned: :desc, created_at: :desc) }
  scope :recent, -> { order(created_at: :desc) }
  scope :notices, -> { where(is_notice: true) }
  scope :search, ->(query) {
    where("title ILIKE :q OR content ILIKE :q", q: "%#{query}%") if query.present?
  }

  # =============================================================================
  # Callbacks
  # =============================================================================
  before_validation :generate_post_code, on: :create
  before_validation :sanitize_content
  before_save :set_published_at

  # =============================================================================
  # Class Methods
  # =============================================================================

  def self.category_label(cat)
    CATEGORIES[cat.to_sym] || cat
  end

  def self.admin_only_categories
    %i[news site_review]
  end

  def self.can_create_in_category?(user, category)
    return true unless admin_only_categories.include?(category.to_sym)
    user.membership_type_super_admin?
  end

  # =============================================================================
  # Instance Methods
  # =============================================================================

  def category_label
    CATEGORIES[category.to_sym] || category
  end

  def increment_views!
    increment!(:views_count)
  end

  def editable_by?(user)
    return false unless user
    self.user_id == user.id || user.membership_type_super_admin?
  end

  def authored_by?(user)
    self.user_id == user&.id
  end

  def excerpt(length = 200)
    ActionController::Base.helpers.strip_tags(content).truncate(length)
  end

  def published?
    status_published? && published_at.present? && published_at <= Time.current
  end

  private

  def generate_post_code
    return if post_code.present?

    date_str = Date.current.strftime("%Y%m%d")
    category_code = CATEGORY_CODES[category.to_sym] || "GEN"
    sequence = Post.where("post_code LIKE ?", "POST-#{date_str}-#{category_code}-%").count + 1

    self.post_code = "POST-#{date_str}-#{category_code}-#{sequence.to_s.rjust(4, '0')}"
  end

  def sanitize_content
    return unless content.present?
    self.content = sanitize(content, tags: %w[p br strong em u s ul ol li a img h1 h2 h3 h4 blockquote code pre],
                                    attributes: %w[href src alt title class])
  end

  def set_published_at
    return unless status_published? && published_at.nil?
    self.published_at = Time.current
  end
end
