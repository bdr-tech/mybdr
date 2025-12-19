# frozen_string_literal: true

require "test_helper"

class SessionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = create_user(email: "test@test.com", password: "password123!")
  end

  # =============================================================================
  # GET /login
  # =============================================================================

  test "should get login page" do
    get login_path
    assert_response :success
    assert_select "form"
  end

  # =============================================================================
  # POST /login
  # =============================================================================

  test "should login with valid credentials" do
    post login_path, params: { email: @user.email, password: "password123!" }
    assert_redirected_to root_path
    assert_equal @user.id, session[:user_id]
  end

  test "should not login with invalid email" do
    post login_path, params: { email: "wrong@email.com", password: "password123!" }
    assert_response :unprocessable_entity
    assert_nil session[:user_id]
  end

  test "should not login with invalid password" do
    post login_path, params: { email: @user.email, password: "wrongpassword" }
    assert_response :unprocessable_entity
    assert_nil session[:user_id]
  end

  test "should not login suspended user" do
    @user.update!(status: :suspended)
    post login_path, params: { email: @user.email, password: "password123!" }
    assert_response :unprocessable_entity
    assert_nil session[:user_id]
  end

  # =============================================================================
  # DELETE /logout
  # =============================================================================

  test "should logout" do
    post login_path, params: { email: @user.email, password: "password123!" }
    assert_equal @user.id, session[:user_id]

    delete logout_path
    assert_redirected_to root_path
    assert_nil session[:user_id]
  end
end
