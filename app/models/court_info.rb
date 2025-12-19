# frozen_string_literal: true

class CourtInfo < ApplicationRecord
  include ActionView::Helpers::SanitizeHelper

  # =============================================================================
  # Active Storage
  # =============================================================================
  has_many_attached :photos

  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :user
  has_many :reviews, class_name: "CourtReview", dependent: :destroy
  has_many :checkins, class_name: "CourtCheckin", dependent: :destroy
  has_many :comments, as: :commentable, dependent: :destroy

  # =============================================================================
  # Constants
  # =============================================================================
  COURT_TYPES = {
    outdoor: "야외",
    indoor: "실내",
    rooftop: "옥상",
    school: "학교",
    park: "공원"
  }.freeze

  SURFACE_TYPES = {
    concrete: "콘크리트",
    asphalt: "아스팔트",
    wood: "마루",
    rubber: "고무",
    urethane: "우레탄"
  }.freeze

  FACILITIES = %w[parking restroom water shower locker light bench].freeze

  CHECKIN_RADIUS_METERS = 50

  # =============================================================================
  # Enums
  # =============================================================================
  enum :court_type, {
    outdoor: "outdoor",
    indoor: "indoor",
    rooftop: "rooftop",
    school: "school",
    park: "park"
  }, prefix: true

  enum :status, {
    active: "active",
    closed: "closed",
    under_construction: "under_construction",
    pending: "pending"
  }, prefix: true

  # =============================================================================
  # Validations
  # =============================================================================
  validates :name, presence: true, length: { maximum: 100 }
  validates :address, presence: true, length: { maximum: 300 }
  validates :city, presence: true, length: { maximum: 50 }
  validates :latitude, presence: true, numericality: { greater_than_or_equal_to: -90, less_than_or_equal_to: 90 }
  validates :longitude, presence: true, numericality: { greater_than_or_equal_to: -180, less_than_or_equal_to: 180 }
  validates :hoops_count, numericality: { greater_than: 0 }, allow_nil: true
  validates :fee, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :description, length: { maximum: 2000 }

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :active_only, -> { where(status: :active) }
  scope :by_city, ->(city) { where(city: city) if city.present? }
  scope :by_type, ->(type) { where(court_type: type) if type.present? }
  scope :free_only, -> { where(is_free: true) }
  scope :search, ->(query) {
    where("name ILIKE :q OR address ILIKE :q", q: "%#{query}%") if query.present?
  }
  scope :top_rated, -> { order(average_rating: :desc) }
  scope :most_popular, -> { order(checkins_count: :desc) }

  # GPS-based search using Haversine formula
  scope :near, ->(lat, lng, radius_km = 5) {
    where(
      "( 6371 * acos( cos( radians(:lat) ) * cos( radians( latitude ) ) * " \
      "cos( radians( longitude ) - radians(:lng) ) + sin( radians(:lat) ) * " \
      "sin( radians( latitude ) ) ) ) <= :radius",
      lat: lat, lng: lng, radius: radius_km
    )
  }

  # =============================================================================
  # Callbacks
  # =============================================================================
  before_validation :sanitize_content

  # =============================================================================
  # Class Methods
  # =============================================================================

  def self.court_type_label(type)
    COURT_TYPES[type.to_sym] || type
  end

  def self.surface_type_label(type)
    SURFACE_TYPES[type.to_sym] || type
  end

  # Haversine distance calculation in kilometers
  def self.distance_between(lat1, lng1, lat2, lng2)
    rad_per_deg = Math::PI / 180
    earth_radius_km = 6371

    dlat = (lat2 - lat1) * rad_per_deg
    dlng = (lng2 - lng1) * rad_per_deg

    a = Math.sin(dlat / 2)**2 +
        Math.cos(lat1 * rad_per_deg) * Math.cos(lat2 * rad_per_deg) *
        Math.sin(dlng / 2)**2
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    earth_radius_km * c
  end

  # =============================================================================
  # Instance Methods
  # =============================================================================

  def court_type_label
    COURT_TYPES[court_type.to_sym] || court_type
  end

  def surface_type_label
    SURFACE_TYPES[surface_type.to_sym] || surface_type if surface_type.present?
  end

  def full_address
    [city, district, address].compact.join(" ")
  end

  def coordinates
    { lat: latitude, lng: longitude }
  end

  def distance_from(lat, lng)
    self.class.distance_between(latitude, longitude, lat, lng)
  end

  def distance_in_meters_from(lat, lng)
    (distance_from(lat, lng) * 1000).round(2)
  end

  def within_checkin_radius?(lat, lng)
    distance_in_meters_from(lat, lng) <= CHECKIN_RADIUS_METERS
  end

  def can_checkin?(user, lat, lng)
    return false unless user
    return false unless within_checkin_radius?(lat, lng)

    # Prevent duplicate check-ins within 1 hour
    !checkins.where(user: user)
             .where("created_at > ?", 1.hour.ago)
             .exists?
  end

  def checkin!(user, lat, lng, message: nil)
    return { success: false, error: "로그인이 필요합니다" } unless user

    distance = distance_in_meters_from(lat, lng)

    unless distance <= CHECKIN_RADIUS_METERS
      return { success: false, error: "코트에서 #{CHECKIN_RADIUS_METERS}m 이내에 있어야 합니다 (현재 거리: #{distance.round}m)" }
    end

    if checkins.where(user: user).where("created_at > ?", 1.hour.ago).exists?
      return { success: false, error: "1시간 이내에 이미 체크인했습니다" }
    end

    checkin = checkins.create!(
      user: user,
      latitude: lat,
      longitude: lng,
      distance_meters: distance,
      message: message
    )

    increment!(:checkins_count)
    { success: true, checkin: checkin }
  rescue ActiveRecord::RecordInvalid => e
    { success: false, error: e.message }
  end

  def update_rating!
    avg = reviews.where(status: :published).average(:rating) || 0
    update_column(:average_rating, avg.round(2))
  end

  def editable_by?(user)
    return false unless user
    self.user_id == user.id || user.membership_type_super_admin?
  end

  def facility_labels
    return [] unless facilities.present?
    facilities.map { |f| facility_label(f) }
  end

  private

  def facility_label(facility)
    {
      "parking" => "주차장",
      "restroom" => "화장실",
      "water" => "식수대",
      "shower" => "샤워실",
      "locker" => "라커",
      "light" => "조명",
      "bench" => "벤치"
    }[facility] || facility
  end

  def sanitize_content
    return unless description.present?
    self.description = sanitize(description, tags: %w[p br strong em u], attributes: [])
  end
end
