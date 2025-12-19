# frozen_string_literal: true

class TournamentSeries < ApplicationRecord
  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :organizer, class_name: "User"
  has_many :tournaments, foreign_key: :series_id, dependent: :destroy

  # =============================================================================
  # Enums
  # =============================================================================
  enum :status, {
    active: "active",
    inactive: "inactive",
    archived: "archived"
  }, prefix: true

  # =============================================================================
  # Callbacks
  # =============================================================================
  before_validation :generate_uuid, on: :create
  before_validation :generate_slug, on: :create

  # =============================================================================
  # Validations
  # =============================================================================
  validates :name, presence: true, length: { maximum: 100 }
  validates :slug, presence: true, uniqueness: true
  validates :uuid, presence: true, uniqueness: true

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :public_series, -> { where(is_public: true) }
  scope :active, -> { where(status: :active) }
  scope :by_organizer, ->(user) { where(organizer: user) }

  # =============================================================================
  # Instance Methods
  # =============================================================================

  # 최신 대회 (가장 최근 회차)
  def latest_tournament
    tournaments.order(edition_number: :desc).first
  end

  # 다음 회차 번호
  def next_edition_number
    (latest_tournament&.edition_number || 0) + 1
  end

  # 다음 회차 1클릭 생성
  def create_next_edition!(attributes = {})
    latest = latest_tournament

    new_tournament = tournaments.build(
      organizer: organizer,
      edition_number: next_edition_number,
      name: "#{name} #{next_edition_number}회",
      status: :draft
    )

    # 이전 대회 설정 복사
    if latest
      new_tournament.assign_attributes(
        description: latest.description,
        max_teams: latest.max_teams,
        min_teams: latest.min_teams,
        team_size: latest.team_size,
        entry_fee: latest.entry_fee,
        prize_info: latest.prize_info,
        rules: latest.rules,
        format: latest.format,
        settings: latest.settings
      )
    end

    new_tournament.assign_attributes(attributes)
    new_tournament.save!
    new_tournament
  end

  # 역대 기록 (모든 회차)
  def all_editions
    tournaments.order(edition_number: :desc)
  end

  # 완료된 대회 수
  def completed_tournaments_count
    tournaments.status_completed.count
  end

  # 총 참가팀 수 (역대)
  def total_teams_count
    tournaments.sum(:teams_count)
  end

  # 총 경기 수 (역대)
  def total_matches_count
    tournaments.sum(:matches_count)
  end

  private

  def generate_uuid
    self.uuid ||= SecureRandom.uuid
  end

  def generate_slug
    return if slug.present?

    base_slug = name.to_s.parameterize
    base_slug = SecureRandom.hex(4) if base_slug.blank?

    slug_candidate = base_slug
    counter = 1

    while TournamentSeries.exists?(slug: slug_candidate)
      slug_candidate = "#{base_slug}-#{counter}"
      counter += 1
    end

    self.slug = slug_candidate
  end
end
