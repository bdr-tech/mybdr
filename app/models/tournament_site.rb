# frozen_string_literal: true

class TournamentSite < ApplicationRecord
  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :tournament
  belongs_to :site_template, optional: true
  has_many :site_pages, dependent: :destroy
  has_many :site_sections, through: :site_pages

  # =============================================================================
  # Validations
  # =============================================================================
  validates :subdomain, presence: true,
                        uniqueness: true,
                        length: { minimum: 3, maximum: 63 },
                        format: {
                          with: /\A[a-z0-9]([a-z0-9\-]*[a-z0-9])?\z/,
                          message: '영문 소문자, 숫자, 하이픈만 사용 가능합니다'
                        }
  validates :custom_domain, uniqueness: true, allow_blank: true,
                            format: {
                              with: /\A[a-z0-9\-]+(\.[a-z0-9\-]+)+\z/i,
                              message: '유효한 도메인 형식이 아닙니다'
                            }
  validate :subdomain_not_reserved

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :published, -> { where(is_published: true) }
  scope :active, -> { where(is_active: true) }
  scope :by_subdomain, ->(subdomain) { where(subdomain: subdomain) }
  scope :by_custom_domain, ->(domain) { where(custom_domain: domain) }

  # =============================================================================
  # Callbacks
  # =============================================================================
  before_validation :normalize_subdomain
  before_validation :normalize_custom_domain
  after_create :create_default_pages
  after_save :sync_colors_to_tournament, if: :colors_changed?

  # =============================================================================
  # Class Methods
  # =============================================================================

  class << self
    def find_by_host(host)
      # Check if it's a custom domain first
      site = by_custom_domain(host).first
      return site if site

      # Then check subdomain (e.g., theprocess.mybdr.kr)
      subdomain = extract_subdomain(host)
      by_subdomain(subdomain).first if subdomain
    end

    def extract_subdomain(host)
      return nil if host.blank?

      parts = host.split('.')
      # Expecting: subdomain.mybdr.kr or subdomain.localhost
      return nil if parts.length < 2
      return parts[0] if parts[0] != 'www' && parts[0] != 'bdr'

      nil
    end

    def reserved_subdomains
      %w[
        www admin api mail ftp smtp pop imap
        app dashboard help support blog
        static assets cdn images files
        signup login register auth oauth
        tournament tournaments game games
        team teams user users profile
        settings admin-panel super-admin
      ]
    end

    def subdomain_available?(subdomain)
      return false if reserved_subdomains.include?(subdomain.downcase)
      !exists?(subdomain: subdomain.downcase)
    end
  end

  # =============================================================================
  # Instance Methods
  # =============================================================================

  def publish!
    update!(is_published: true, published_at: Time.current)
  end

  def unpublish!
    update!(is_published: false)
  end

  def full_url
    if custom_domain.present?
      "https://#{custom_domain}"
    else
      "https://#{subdomain}.mybdr.kr"
    end
  end

  def preview_url
    "https://#{subdomain}.mybdr.kr/preview"
  end

  # Theme accessor with defaults
  def theme
    base_theme = site_template&.theme || {}
    base_theme.merge(theme_settings || {}).merge(
      'primary_color' => primary_color,
      'secondary_color' => secondary_color
    ).compact
  end

  def home_page
    site_pages.find_by(page_type: 'home') || site_pages.order(:position).first
  end

  def visible_pages
    site_pages.where(is_visible: true).order(:position)
  end

  def nav_pages
    site_pages.where(is_visible: true, show_in_nav: true).order(:position)
  end

  def increment_view!
    increment!(:views_count)
  end

  # Clone site structure to another tournament
  def clone_to(new_tournament)
    new_site = new_tournament.build_tournament_site(
      site_template: site_template,
      theme_settings: theme_settings,
      primary_color: primary_color,
      secondary_color: secondary_color
      # subdomain will be set separately
    )

    if new_site.save
      site_pages.each do |page|
        cloned_page = new_site.site_pages.create!(
          page.attributes.except('id', 'tournament_site_id', 'created_at', 'updated_at')
        )

        page.site_sections.each do |section|
          cloned_page.site_sections.create!(
            section.attributes.except('id', 'site_page_id', 'created_at', 'updated_at')
          )
        end
      end
    end

    new_site
  end

  private

  def normalize_subdomain
    self.subdomain = subdomain&.downcase&.strip
  end

  def normalize_custom_domain
    self.custom_domain = custom_domain&.downcase&.strip
    self.custom_domain = nil if custom_domain.blank?
  end

  def subdomain_not_reserved
    if subdomain.present? && self.class.reserved_subdomains.include?(subdomain)
      errors.add(:subdomain, '사용할 수 없는 서브도메인입니다')
    end
  end

  def create_default_pages
    template_pages = site_template&.default_page_structure || default_pages_structure

    template_pages.each do |page_attrs|
      page = site_pages.create!(page_attrs.slice(:title, :slug, :page_type, :position))

      # Create default sections based on page type
      create_default_sections_for(page)
    end
  end

  def default_pages_structure
    [
      { title: '홈', slug: 'home', page_type: 'home', position: 0 },
      { title: '경기일정', slug: 'schedule', page_type: 'schedule', position: 1 },
      { title: '참가팀', slug: 'teams', page_type: 'teams', position: 2 },
      { title: '경기결과', slug: 'results', page_type: 'results', position: 3 },
      { title: '갤러리', slug: 'gallery', page_type: 'gallery', position: 4 },
      { title: '공지사항', slug: 'notice', page_type: 'notice', position: 5 }
    ]
  end

  def create_default_sections_for(page)
    case page.page_type
    when 'home'
      page.site_sections.create!([
        { section_type: 'hero', position: 0, content: { title: tournament.name, subtitle: tournament.description } },
        { section_type: 'countdown', position: 1, content: { target_date: tournament.start_date&.iso8601 } },
        { section_type: 'schedule', position: 2, settings: { limit: 5, show_filter: false } },
        { section_type: 'teams', position: 3, settings: { limit: 8, style: 'grid' } }
      ])
    when 'schedule'
      page.site_sections.create!(section_type: 'schedule', position: 0, settings: { show_filter: true })
    when 'teams'
      page.site_sections.create!(section_type: 'teams', position: 0, settings: { style: 'grid' })
    when 'results'
      page.site_sections.create!(section_type: 'results', position: 0, settings: { show_filter: true })
    when 'gallery'
      page.site_sections.create!(section_type: 'gallery', position: 0, settings: { columns: 3 })
    when 'notice'
      page.site_sections.create!(section_type: 'text', position: 0, content: { title: '공지사항', body: '' })
    end
  end

  def colors_changed?
    saved_change_to_primary_color? || saved_change_to_secondary_color?
  end

  def sync_colors_to_tournament
    tournament.update_columns(
      primary_color: primary_color,
      secondary_color: secondary_color
    )
  end
end
