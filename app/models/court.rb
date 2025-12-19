# frozen_string_literal: true

class Court < ApplicationRecord
  include HasPublicId

  # =============================================================================
  # Associations
  # =============================================================================
  has_many :games, dependent: :nullify

  # =============================================================================
  # Validations
  # =============================================================================
  validates :name, presence: true

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :active, -> { where(is_active: true) }
  scope :indoor, -> { where(indoor: true) }
  scope :outdoor, -> { where(indoor: false) }
  scope :in_city, ->(city) { where(city: city) }
  scope :in_district, ->(district) { where(district: district) }
  scope :with_parking, -> { where(parking_available: true) }

  # =============================================================================
  # Instance Methods
  # =============================================================================

  # 전체 주소
  def full_address
    [city, district, address].compact.join(" ")
  end

  # 위치 정보 있는지
  def has_location?
    latitude.present? && longitude.present?
  end

  # 시설 목록 (배열로)
  def facilities_list
    return [] if facilities.blank?

    facilities.split(",").map(&:strip)
  end

  # 거리 계산 (km, Haversine formula)
  def distance_from(lat, lng)
    return nil unless has_location?

    rad_per_deg = Math::PI / 180
    earth_radius_km = 6371

    lat1 = latitude * rad_per_deg
    lat2 = lat * rad_per_deg
    lon1 = longitude * rad_per_deg
    lon2 = lng * rad_per_deg

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = Math.sin(dlat / 2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2)**2
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    (earth_radius_km * c).round(2)
  end

  # 근처 경기장 찾기
  def self.nearby(lat, lng, radius_km: 10)
    return none unless lat.present? && lng.present?

    # 간단한 bounding box 필터링 (정확한 거리 계산 전 필터)
    lat_delta = radius_km / 111.0
    lng_delta = radius_km / (111.0 * Math.cos(lat * Math::PI / 180))

    where(
      latitude: (lat - lat_delta)..(lat + lat_delta),
      longitude: (lng - lng_delta)..(lng + lng_delta)
    )
  end

  # 표시용 이름 (실내/외 포함)
  def display_name
    type_label = indoor? ? "[실내]" : "[실외]"
    "#{type_label} #{name}"
  end
end
