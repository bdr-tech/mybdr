# frozen_string_literal: true

require "test_helper"

class AdminLogTest < ActiveSupport::TestCase
  # =============================================================================
  # Validations
  # =============================================================================

  test "should not save admin_log without action" do
    admin = create_admin_user
    log = AdminLog.new(admin: admin, resource_type: "User")
    assert_not log.save, "Saved the admin_log without an action"
  end

  test "should not save admin_log without resource_type" do
    admin = create_admin_user
    log = AdminLog.new(admin: admin, action: "update")
    assert_not log.save, "Saved the admin_log without a resource_type"
  end

  # =============================================================================
  # Class Methods
  # =============================================================================

  test "log_action should create admin log" do
    admin = create_admin_user
    user = create_user

    log = AdminLog.log_action(
      admin: admin,
      action: "update",
      resource: user,
      changes: { status: ["active", "suspended"] },
      description: "사용자 상태 변경"
    )

    assert log.persisted?, "Admin log should be saved"
    assert_equal admin, log.admin
    assert_equal "update", log.action
    assert_equal "User", log.resource_type
    assert_equal user.id, log.resource_id
    assert_equal({ "status" => ["active", "suspended"] }, log.changes_made)
  end

  test "log_action should handle nil resource" do
    admin = create_admin_user

    log = AdminLog.log_action(
      admin: admin,
      action: "system_update",
      resource: nil,
      description: "시스템 설정 변경"
    )

    assert log.persisted?, "Admin log should be saved"
    assert_nil log.resource_type
    assert_nil log.resource_id
  end

  # =============================================================================
  # Scopes
  # =============================================================================

  test "recent scope should order by created_at desc" do
    admin = create_admin_user

    old_log = AdminLog.create!(admin: admin, action: "old", resource_type: "User", created_at: 1.day.ago)
    new_log = AdminLog.create!(admin: admin, action: "new", resource_type: "User")

    recent = AdminLog.recent
    assert_equal new_log, recent.first, "Most recent log should be first"
  end

  test "by_action scope should filter by action" do
    admin = create_admin_user

    create_log = AdminLog.create!(admin: admin, action: "create", resource_type: "User")
    update_log = AdminLog.create!(admin: admin, action: "update", resource_type: "User")

    create_logs = AdminLog.by_action("create")
    assert_includes create_logs, create_log, "Should include create log"
    assert_not_includes create_logs, update_log, "Should not include update log"
  end

  test "by_resource_type scope should filter by resource type" do
    admin = create_admin_user

    user_log = AdminLog.create!(admin: admin, action: "create", resource_type: "User")
    team_log = AdminLog.create!(admin: admin, action: "create", resource_type: "Team")

    user_logs = AdminLog.by_resource_type("User")
    assert_includes user_logs, user_log, "Should include User log"
    assert_not_includes user_logs, team_log, "Should not include Team log"
  end

  # =============================================================================
  # Instance Methods
  # =============================================================================

  test "action_label should return Korean label" do
    admin = create_admin_user
    log = AdminLog.create!(admin: admin, action: "create", resource_type: "User")
    assert_equal "생성", log.action_label
  end

  test "severity_badge should return appropriate badge class" do
    admin = create_admin_user

    info_log = AdminLog.create!(admin: admin, action: "view", resource_type: "User", severity: "info")
    critical_log = AdminLog.create!(admin: admin, action: "delete", resource_type: "User", severity: "critical")

    assert_includes info_log.severity_badge, "info", "Info severity should return info badge"
    assert_includes critical_log.severity_badge, "danger", "Critical severity should return danger badge"
  end
end
