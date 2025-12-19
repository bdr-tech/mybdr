# frozen_string_literal: true

require "test_helper"

class SystemSettingTest < ActiveSupport::TestCase
  setup do
    SystemSetting.delete_all
  end

  # =============================================================================
  # Validations
  # =============================================================================

  test "should not save setting without key" do
    setting = SystemSetting.new(value: "test")
    assert_not setting.save, "Saved the setting without a key"
  end

  test "should not save duplicate key" do
    SystemSetting.create!(key: "unique_key", value: "value1")
    setting = SystemSetting.new(key: "unique_key", value: "value2")
    assert_not setting.save, "Saved the setting with duplicate key"
  end

  # =============================================================================
  # Class Methods - Get/Set
  # =============================================================================

  test "get should return value for existing key" do
    SystemSetting.create!(key: "test_key", value: "test_value")
    assert_equal "test_value", SystemSetting.get("test_key")
  end

  test "get should return default for non-existing key" do
    assert_equal "default", SystemSetting.get("non_existing", "default")
  end

  test "set should create new setting" do
    SystemSetting.set("new_key", "new_value")
    setting = SystemSetting.find_by(key: "new_key")
    assert_not_nil setting
    assert_equal "new_value", setting.value
  end

  test "set should update existing setting" do
    SystemSetting.create!(key: "existing_key", value: "old_value")
    SystemSetting.set("existing_key", "new_value")
    assert_equal "new_value", SystemSetting.get("existing_key")
  end

  # =============================================================================
  # Class Methods - Enabled
  # =============================================================================

  test "enabled? should return true for truthy values" do
    SystemSetting.create!(key: "feature_enabled", value: "true")
    assert SystemSetting.enabled?("feature_enabled")
  end

  test "enabled? should return false for falsy values" do
    SystemSetting.create!(key: "feature_disabled", value: "false")
    assert_not SystemSetting.enabled?("feature_disabled")
  end

  test "enabled? should return false for non-existing key" do
    assert_not SystemSetting.enabled?("non_existing")
  end

  # =============================================================================
  # Class Methods - Enable/Disable
  # =============================================================================

  test "enable should set value to true" do
    SystemSetting.enable("test_feature")
    assert SystemSetting.enabled?("test_feature")
  end

  test "disable should set value to false" do
    SystemSetting.create!(key: "test_feature", value: "true")
    SystemSetting.disable("test_feature")
    assert_not SystemSetting.enabled?("test_feature")
  end

  # =============================================================================
  # Scopes
  # =============================================================================

  test "by_category scope should filter by category" do
    general = SystemSetting.create!(key: "general_setting", value: "val", category: "general")
    email = SystemSetting.create!(key: "email_setting", value: "val", category: "email")

    general_settings = SystemSetting.by_category("general")
    assert_includes general_settings, general
    assert_not_includes general_settings, email
  end

  test "public_settings scope should return only public settings" do
    public_setting = SystemSetting.create!(key: "public_key", value: "val", is_public: true)
    private_setting = SystemSetting.create!(key: "private_key", value: "val", is_public: false)

    public_settings = SystemSetting.public_settings
    assert_includes public_settings, public_setting
    assert_not_includes public_settings, private_setting
  end

  # =============================================================================
  # Instance Methods
  # =============================================================================

  test "parsed_value should parse JSON values" do
    setting = SystemSetting.create!(key: "json_setting", value: '{"key": "value"}')
    assert_equal({ "key" => "value" }, setting.parsed_value)
  end

  test "parsed_value should return string for non-JSON values" do
    setting = SystemSetting.create!(key: "string_setting", value: "simple string")
    assert_equal "simple string", setting.parsed_value
  end

  test "boolean? should return true for boolean values" do
    true_setting = SystemSetting.create!(key: "true_setting", value: "true")
    false_setting = SystemSetting.create!(key: "false_setting", value: "false")

    assert true_setting.boolean?
    assert false_setting.boolean?
  end

  test "boolean? should return false for non-boolean values" do
    setting = SystemSetting.create!(key: "non_bool", value: "some_value")
    assert_not setting.boolean?
  end
end
