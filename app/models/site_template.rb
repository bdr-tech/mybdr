# frozen_string_literal: true

class SiteTemplate < ApplicationRecord
  # =============================================================================
  # Associations
  # =============================================================================
  has_many :tournament_sites, dependent: :nullify

  # =============================================================================
  # Validations
  # =============================================================================
  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :category, inclusion: { in: %w[general university corporate community] }

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :active, -> { where(is_active: true) }
  scope :premium, -> { where(is_premium: true) }
  scope :free, -> { where(is_premium: false) }
  scope :by_category, ->(category) { where(category: category) }
  scope :popular, -> { order(usage_count: :desc) }

  # =============================================================================
  # Callbacks
  # =============================================================================
  before_validation :generate_slug, on: :create

  # =============================================================================
  # Instance Methods
  # =============================================================================

  def increment_usage!
    increment!(:usage_count)
  end

  # Default pages structure for this template
  def default_page_structure
    default_pages.presence || [
      { title: '홈', slug: 'home', page_type: 'home', position: 0 },
      { title: '경기일정', slug: 'schedule', page_type: 'schedule', position: 1 },
      { title: '참가팀', slug: 'teams', page_type: 'teams', position: 2 },
      { title: '경기결과', slug: 'results', page_type: 'results', position: 3 },
      { title: '갤러리', slug: 'gallery', page_type: 'gallery', position: 4 },
      { title: '공지사항', slug: 'notice', page_type: 'notice', position: 5 }
    ]
  end

  # Default theme for this template
  def theme
    default_theme.presence || {
      'primary_color' => '#E53E3E',
      'secondary_color' => '#ED8936',
      'font_family' => 'Pretendard',
      'border_radius' => 'lg',
      'shadow_style' => 'soft'
    }
  end

  private

  def generate_slug
    self.slug ||= name.parameterize if name.present?
  end
end
