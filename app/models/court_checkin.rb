# frozen_string_literal: true

class CourtCheckin < ApplicationRecord
  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :court_info, counter_cache: :checkins_count
  belongs_to :user

  # =============================================================================
  # Validations
  # =============================================================================
  validates :latitude, presence: true, numericality: { greater_than_or_equal_to: -90, less_than_or_equal_to: 90 }
  validates :longitude, presence: true, numericality: { greater_than_or_equal_to: -180, less_than_or_equal_to: 180 }
  validates :message, length: { maximum: 500 }

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :recent, -> { order(created_at: :desc) }
  scope :today, -> { where("created_at >= ?", Date.current.beginning_of_day) }
  scope :this_week, -> { where("created_at >= ?", 1.week.ago) }
  scope :by_user, ->(user) { where(user: user) }

  # =============================================================================
  # Instance Methods
  # =============================================================================

  def coordinates
    { lat: latitude, lng: longitude }
  end

  def distance_display
    return nil unless distance_meters.present?
    "#{distance_meters.round}m"
  end
end
