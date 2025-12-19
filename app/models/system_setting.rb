# frozen_string_literal: true

class SystemSetting < ApplicationRecord
  # =============================================================================
  # Constants
  # =============================================================================
  CATEGORIES = %w[general system team payment membership notification marketing legal].freeze
  VALUE_TYPES = %w[string integer boolean json array].freeze

  # =============================================================================
  # Validations
  # =============================================================================
  validates :key, presence: true, uniqueness: true
  validates :category, inclusion: { in: CATEGORIES }
  validates :value_type, inclusion: { in: VALUE_TYPES }

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :by_category, ->(category) { where(category: category) }
  scope :public_settings, -> { where(is_public: true) }
  scope :editable, -> { where(is_editable: true) }

  # =============================================================================
  # Class Methods
  # =============================================================================

  # 설정값 가져오기 (캐싱 적용)
  def self.get(key, default = nil)
    Rails.cache.fetch("system_setting:#{key}", expires_in: 5.minutes) do
      setting = find_by(key: key)
      setting ? setting.typed_value : default
    end
  end

  # 설정값 설정하기
  def self.set(key, value, options = {})
    setting = find_or_initialize_by(key: key)
    setting.value = value.to_s
    setting.value_type = options[:value_type] if options[:value_type]
    setting.category = options[:category] if options[:category]
    setting.description = options[:description] if options[:description]
    setting.is_public = options[:is_public] if options.key?(:is_public)
    setting.is_editable = options[:is_editable] if options.key?(:is_editable)

    if setting.save
      Rails.cache.delete("system_setting:#{key}")
      setting
    else
      false
    end
  end

  # Boolean 설정 체크
  def self.enabled?(key)
    get(key, false) == true
  end

  # 카테고리별 설정 가져오기
  def self.settings_for_category(category)
    by_category(category).map do |setting|
      {
        key: setting.key,
        value: setting.typed_value,
        value_type: setting.value_type,
        description: setting.description,
        is_editable: setting.is_editable
      }
    end
  end

  # 공개 설정만 가져오기
  def self.public_settings_hash
    Rails.cache.fetch("system_settings:public", expires_in: 5.minutes) do
      public_settings.each_with_object({}) do |setting, hash|
        hash[setting.key] = setting.typed_value
      end
    end
  end

  # 캐시 클리어
  def self.clear_cache
    Rails.cache.delete_matched("system_setting:*")
    Rails.cache.delete("system_settings:public")
  end

  # =============================================================================
  # Instance Methods
  # =============================================================================

  # 타입에 따른 값 변환
  def typed_value
    case value_type
    when "integer"
      value.to_i
    when "boolean"
      ActiveModel::Type::Boolean.new.cast(value)
    when "json"
      JSON.parse(value) rescue {}
    when "array"
      JSON.parse(value) rescue []
    else
      value
    end
  end

  # 설정값 업데이트
  def update_value(new_value)
    old_value = value
    self.value = new_value.to_s

    if save
      Rails.cache.delete("system_setting:#{key}")
      Rails.cache.delete("system_settings:public") if is_public?
      { success: true, old_value: old_value, new_value: value }
    else
      { success: false, errors: errors.full_messages }
    end
  end

  def category_label
    {
      "general" => "일반",
      "system" => "시스템",
      "team" => "팀",
      "payment" => "결제",
      "membership" => "멤버십",
      "notification" => "알림",
      "marketing" => "마케팅",
      "legal" => "법률"
    }[category] || category
  end

  def value_type_label
    {
      "string" => "문자열",
      "integer" => "정수",
      "boolean" => "예/아니오",
      "json" => "JSON",
      "array" => "배열"
    }[value_type] || value_type
  end
end
