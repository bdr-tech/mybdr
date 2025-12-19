# frozen_string_literal: true

class ContentPreset < ApplicationRecord
  # =============================================================================
  # Constants
  # =============================================================================
  CATEGORIES = %w[general rules info prize schedule registration faq contact].freeze

  # Maps to SiteSection::SECTION_TYPES that support content presets
  SUPPORTED_SECTION_TYPES = %w[text faq contact].freeze

  # =============================================================================
  # Validations
  # =============================================================================
  validates :name, presence: true, length: { maximum: 100 }
  validates :slug, presence: true, uniqueness: true,
                   format: { with: /\A[a-z0-9\-]+\z/, message: "영문 소문자, 숫자, 하이픈만 사용 가능합니다" }
  validates :category, presence: true, inclusion: { in: CATEGORIES }
  validates :target_section_type, inclusion: { in: SUPPORTED_SECTION_TYPES }
  validates :content, presence: true

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :active, -> { where(is_active: true) }
  scope :featured, -> { where(is_featured: true) }
  scope :by_category, ->(category) { where(category: category) }
  scope :for_section_type, ->(type) { where(target_section_type: type) }
  scope :for_page_type, ->(page_type) { where("? = ANY(target_page_types)", page_type) }
  scope :ordered, -> { order(is_featured: :desc, position: :asc, name: :asc) }
  scope :popular, -> { order(usage_count: :desc) }

  # =============================================================================
  # Callbacks
  # =============================================================================
  before_validation :generate_slug, on: :create
  before_validation :set_default_position, on: :create

  # =============================================================================
  # Instance Methods
  # =============================================================================

  def title
    content["title"]
  end

  def body
    content["body"]
  end

  def increment_usage!
    increment!(:usage_count)
  end

  # Build a new section from this preset
  def build_section(site_page, position: nil)
    site_page.site_sections.build(
      section_type: target_section_type,
      position: position || (site_page.site_sections.maximum(:position) || -1) + 1,
      content: content,
      settings: default_settings.presence || {},
      background_color: background_color,
      text_color: text_color,
      is_visible: true
    )
  end

  # Category display name
  def category_name
    case category
    when "rules" then "대회 규정"
    when "info" then "참가 안내"
    when "prize" then "시상"
    when "schedule" then "일정"
    when "registration" then "참가 신청"
    when "faq" then "FAQ"
    when "contact" then "문의"
    else "일반"
    end
  end

  private

  def generate_slug
    return if slug.present?
    self.slug = name&.parameterize if name.present?
  end

  def set_default_position
    return if position.present? && position > 0
    max_pos = self.class.by_category(category).maximum(:position) || -1
    self.position = max_pos + 1
  end
end
