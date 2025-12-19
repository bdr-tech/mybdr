# frozen_string_literal: true

require "test_helper"

class Admin::DashboardControllerTest < ActionDispatch::IntegrationTest
  setup do
    @admin = create_admin_user
    @regular_user = create_user
  end

  # =============================================================================
  # Authorization Tests
  # =============================================================================

  test "should redirect to login when not authenticated" do
    get admin_root_path
    assert_redirected_to login_path
  end

  test "should redirect to root when not admin" do
    sign_in_as(@regular_user)
    get admin_root_path
    assert_redirected_to root_path
    assert_equal "관리자 권한이 필요합니다.", flash[:error]
  end

  test "should access dashboard when admin" do
    sign_in_as(@admin)
    get admin_root_path
    assert_response :success
  end

  # =============================================================================
  # Dashboard Content Tests
  # =============================================================================

  test "should display dashboard statistics" do
    sign_in_as(@admin)
    get admin_root_path
    assert_response :success
    assert_select "h1", /대시보드|Dashboard/i
  end

  # =============================================================================
  # Dashboard Actions
  # =============================================================================

  test "should refresh stats" do
    sign_in_as(@admin)
    get admin_dashboard_refresh_stats_path, headers: { "Accept" => "application/json" }
    assert_response :success
  end
end
