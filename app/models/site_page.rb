# frozen_string_literal: true

class SitePage < ApplicationRecord
  # =============================================================================
  # Constants
  # =============================================================================
  PAGE_TYPES = %w[home schedule teams results gallery notice registration custom].freeze

  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :tournament_site
  has_many :site_sections, dependent: :destroy

  # Delegate to access tournament directly
  delegate :tournament, to: :tournament_site

  # =============================================================================
  # Validations
  # =============================================================================
  validates :title, presence: true
  validates :slug, presence: true,
                   uniqueness: { scope: :tournament_site_id },
                   format: {
                     with: /\A[a-z0-9\-]+\z/,
                     message: '영문 소문자, 숫자, 하이픈만 사용 가능합니다'
                   }
  validates :page_type, inclusion: { in: PAGE_TYPES }
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :visible, -> { where(is_visible: true) }
  scope :in_nav, -> { where(show_in_nav: true) }
  scope :ordered, -> { order(:position) }
  scope :by_type, ->(type) { where(page_type: type) }

  # =============================================================================
  # Callbacks
  # =============================================================================
  before_validation :generate_slug, on: :create
  before_validation :set_default_position, on: :create
  after_save :reorder_siblings, if: :saved_change_to_position?

  # =============================================================================
  # Instance Methods
  # =============================================================================

  def home?
    page_type == 'home'
  end

  def custom?
    page_type == 'custom'
  end

  def system_page?
    !custom?
  end

  def url_path
    home? ? '/' : "/#{slug}"
  end

  def full_url
    "#{tournament_site.full_url}#{url_path}"
  end

  # Section management
  def visible_sections
    site_sections.where(is_visible: true).order(:position)
  end

  def add_section(section_type, content: {}, settings: {})
    max_position = site_sections.maximum(:position) || -1
    site_sections.create!(
      section_type: section_type,
      position: max_position + 1,
      content: content,
      settings: settings
    )
  end

  def reorder_sections(section_ids)
    section_ids.each_with_index do |section_id, index|
      site_sections.find(section_id).update_column(:position, index)
    end
  end

  # Meta information
  def effective_meta_title
    meta_title.presence || "#{title} - #{tournament_site.site_name || tournament.name}"
  end

  def effective_meta_description
    meta_description.presence || tournament.description
  end

  private

  def generate_slug
    self.slug ||= title&.parameterize
  end

  def set_default_position
    return if position.present?
    self.position = (tournament_site.site_pages.maximum(:position) || -1) + 1
  end

  def reorder_siblings
    # Ensure no gaps in positions
    tournament_site.site_pages
                   .where.not(id: id)
                   .where('position >= ?', position)
                   .order(:position)
                   .each_with_index do |page, index|
      page.update_column(:position, position + index + 1)
    end
  end
end
