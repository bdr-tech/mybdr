# frozen_string_literal: true

class SiteSection < ApplicationRecord
  # =============================================================================
  # Constants
  # =============================================================================
  SECTION_TYPES = %w[
    hero text schedule teams results gallery sponsors
    youtube instagram countdown cta faq contact
    series_nav boxscore player_card
  ].freeze

  PADDING_OPTIONS = %w[none small normal large].freeze

  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :site_page

  # Delegate for easy access
  delegate :tournament_site, to: :site_page
  delegate :tournament, to: :tournament_site

  # =============================================================================
  # Validations
  # =============================================================================
  validates :section_type, presence: true, inclusion: { in: SECTION_TYPES }
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :padding_top, inclusion: { in: PADDING_OPTIONS }
  validates :padding_bottom, inclusion: { in: PADDING_OPTIONS }

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :visible, -> { where(is_visible: true) }
  scope :ordered, -> { order(:position) }
  scope :by_type, ->(type) { where(section_type: type) }

  # =============================================================================
  # Callbacks
  # =============================================================================
  before_validation :set_default_position, on: :create
  after_save :reorder_siblings, if: :saved_change_to_position?

  # =============================================================================
  # Instance Methods
  # =============================================================================

  # Content accessors for specific section types
  def title
    content['title']
  end

  def title=(value)
    self.content = content.merge('title' => value)
  end

  def subtitle
    content['subtitle']
  end

  def body
    content['body']
  end

  def items
    content['items'] || []
  end

  # Settings accessors
  def limit
    settings['limit']
  end

  def style
    settings['style']
  end

  def columns
    settings['columns'] || 3
  end

  def show_filter?
    settings['show_filter'] == true
  end

  # Section type helpers
  def hero?
    section_type == 'hero'
  end

  def text?
    section_type == 'text'
  end

  def schedule?
    section_type == 'schedule'
  end

  def teams?
    section_type == 'teams'
  end

  def results?
    section_type == 'results'
  end

  def gallery?
    section_type == 'gallery'
  end

  def series_nav?
    section_type == 'series_nav'
  end

  def boxscore?
    section_type == 'boxscore'
  end

  # Dynamic data based on section type
  def dynamic_data
    case section_type
    when 'schedule'
      fetch_schedule_data
    when 'teams'
      fetch_teams_data
    when 'results'
      fetch_results_data
    when 'series_nav'
      fetch_series_data
    when 'boxscore'
      fetch_boxscore_data
    else
      {}
    end
  end

  # CSS classes for padding
  def padding_classes
    top_class = case padding_top
                when 'none' then 'pt-0'
                when 'small' then 'pt-4'
                when 'normal' then 'pt-8'
                when 'large' then 'pt-16'
                end

    bottom_class = case padding_bottom
                   when 'none' then 'pb-0'
                   when 'small' then 'pb-4'
                   when 'normal' then 'pb-8'
                   when 'large' then 'pb-16'
                   end

    "#{top_class} #{bottom_class}"
  end

  def style_attributes
    attrs = {}
    attrs['background-color'] = background_color if background_color.present?
    attrs['color'] = text_color if text_color.present?
    attrs
  end

  # Clone section to another page
  def clone_to(target_page)
    target_page.site_sections.create!(
      attributes.except('id', 'site_page_id', 'created_at', 'updated_at')
    )
  end

  private

  def set_default_position
    return if position.present?
    self.position = (site_page.site_sections.maximum(:position) || -1) + 1
  end

  def reorder_siblings
    site_page.site_sections
             .where.not(id: id)
             .where('position >= ?', position)
             .order(:position)
             .each_with_index do |section, index|
      section.update_column(:position, position + index + 1)
    end
  end

  # Data fetchers for dynamic sections
  def fetch_schedule_data
    matches = tournament.tournament_matches.upcoming.order(:scheduled_at)
    matches = matches.limit(limit) if limit.present?
    { matches: matches }
  end

  def fetch_teams_data
    teams = tournament.tournament_teams.includes(:team).approved
    teams = teams.limit(limit) if limit.present?
    { teams: teams }
  end

  def fetch_results_data
    matches = tournament.tournament_matches.completed.order(scheduled_at: :desc)
    matches = matches.limit(limit) if limit.present?
    { matches: matches }
  end

  def fetch_series_data
    return {} unless tournament.series.present?

    {
      series: tournament.series,
      tournaments: tournament.series.tournaments.order(edition_number: :desc),
      current_edition: tournament.edition_number
    }
  end

  def fetch_boxscore_data
    match_id = content['match_id']
    return {} unless match_id

    match = tournament.tournament_matches.find_by(id: match_id)
    return {} unless match

    {
      match: match,
      home_stats: match.home_player_stats,
      away_stats: match.away_player_stats
    }
  end
end
