# frozen_string_literal: true

require "test_helper"

class Admin::UsersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @admin = create_admin_user
    @regular_user = create_user
  end

  # =============================================================================
  # Authorization Tests
  # =============================================================================

  test "should redirect non-admin users" do
    sign_in_as(@regular_user)
    get admin_users_path
    assert_redirected_to root_path
  end

  # =============================================================================
  # Index
  # =============================================================================

  test "should get index" do
    sign_in_as(@admin)
    get admin_users_path
    assert_response :success
  end

  test "should filter users by status" do
    sign_in_as(@admin)
    get admin_users_path, params: { status: "active" }
    assert_response :success
  end

  test "should search users" do
    sign_in_as(@admin)
    get admin_users_path, params: { q: @regular_user.nickname }
    assert_response :success
  end

  # =============================================================================
  # Show
  # =============================================================================

  test "should show user" do
    sign_in_as(@admin)
    get admin_user_path(@regular_user)
    assert_response :success
  end

  # =============================================================================
  # User Actions
  # =============================================================================

  test "should suspend user" do
    sign_in_as(@admin)
    post suspend_admin_user_path(@regular_user)
    assert_redirected_to admin_user_path(@regular_user)
    @regular_user.reload
    assert @regular_user.status_suspended?
  end

  test "should activate user" do
    @regular_user.update!(status: :suspended)
    sign_in_as(@admin)
    post activate_admin_user_path(@regular_user)
    assert_redirected_to admin_user_path(@regular_user)
    @regular_user.reload
    assert @regular_user.status_active?
  end

  test "should make user admin" do
    sign_in_as(@admin)
    post make_admin_admin_user_path(@regular_user)
    assert_redirected_to admin_user_path(@regular_user)
    @regular_user.reload
    assert @regular_user.is_admin?
  end

  test "should remove admin rights" do
    other_admin = create_admin_user
    sign_in_as(@admin)
    post remove_admin_admin_user_path(other_admin)
    assert_redirected_to admin_user_path(other_admin)
    other_admin.reload
    assert_not other_admin.is_admin?
  end

  test "should not remove own admin rights" do
    sign_in_as(@admin)
    post remove_admin_admin_user_path(@admin)
    @admin.reload
    assert @admin.is_admin?
  end
end
