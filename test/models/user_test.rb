# frozen_string_literal: true

require "test_helper"

class UserTest < ActiveSupport::TestCase
  # =============================================================================
  # Validations
  # =============================================================================

  test "should not save user without email" do
    user = User.new(password: "password123!", nickname: "test", phone: "01012345678", name: "Test")
    assert_not user.save, "Saved the user without an email"
  end

  test "should not save user without password" do
    user = User.new(email: "test@test.com", nickname: "test", phone: "01012345678", name: "Test")
    assert_not user.save, "Saved the user without a password"
  end

  test "should not save user without nickname" do
    user = User.new(email: "test@test.com", password: "password123!", phone: "01012345678", name: "Test")
    assert_not user.save, "Saved the user without a nickname"
  end

  test "should not save user with duplicate email" do
    user1 = create_user(email: "duplicate@test.com")
    user2 = User.new(
      email: "duplicate@test.com",
      password: "password123!",
      nickname: "other",
      phone: "01099999999",
      name: "Other"
    )
    assert_not user2.save, "Saved the user with duplicate email"
  end

  test "should not save user with duplicate nickname" do
    user1 = create_user(nickname: "duplicatenick")
    user2 = User.new(
      email: "other@test.com",
      password: "password123!",
      nickname: "duplicatenick",
      phone: "01099999999",
      name: "Other"
    )
    assert_not user2.save, "Saved the user with duplicate nickname"
  end

  test "should validate email format" do
    user = User.new(
      email: "invalid-email",
      password: "password123!",
      nickname: "test",
      phone: "01012345678",
      name: "Test"
    )
    assert_not user.save, "Saved the user with invalid email format"
  end

  test "should validate phone format" do
    user = User.new(
      email: "test@test.com",
      password: "password123!",
      nickname: "test",
      phone: "invalid-phone",
      name: "Test"
    )
    assert_not user.save, "Saved the user with invalid phone format"
  end

  # =============================================================================
  # Authentication
  # =============================================================================

  test "should authenticate with correct password" do
    user = create_user(password: "correctpassword123!")
    assert user.authenticate("correctpassword123!"), "Failed to authenticate with correct password"
  end

  test "should not authenticate with incorrect password" do
    user = create_user(password: "correctpassword123!")
    assert_not user.authenticate("wrongpassword"), "Authenticated with incorrect password"
  end

  # =============================================================================
  # Admin Methods
  # =============================================================================

  test "admin? should return true for admin users" do
    admin = create_admin_user
    assert admin.admin?, "admin? should return true for admin users"
  end

  test "admin? should return false for regular users" do
    user = create_user
    assert_not user.admin?, "admin? should return false for regular users"
  end

  test "admin? should return true for super_admin membership" do
    user = create_user(membership_type: :super_admin)
    assert user.admin?, "admin? should return true for super_admin membership"
  end

  # =============================================================================
  # Status Methods
  # =============================================================================

  test "active? should return true for active users" do
    user = create_user(status: :active)
    assert user.status_active?, "active? should return true for active users"
  end

  test "suspended user should not be active" do
    user = create_user(status: :suspended)
    assert_not user.status_active?, "suspended user should not be active"
  end

  # =============================================================================
  # Callbacks
  # =============================================================================

  test "should generate uuid on create" do
    user = create_user
    assert_not_nil user.uuid, "UUID should be generated on create"
    assert_match(/^[0-9a-f-]{36}$/, user.uuid, "UUID should be valid format")
  end
end
