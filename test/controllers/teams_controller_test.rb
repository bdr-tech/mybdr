# frozen_string_literal: true

require "test_helper"

class TeamsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = create_user
    @captain = create_user
    @team = create_team(captain: @captain)
  end

  # =============================================================================
  # Index
  # =============================================================================

  test "should get index without authentication" do
    get teams_path
    assert_response :success
  end

  test "should filter teams by city" do
    get teams_path, params: { city: "서울" }
    assert_response :success
  end

  # =============================================================================
  # Show
  # =============================================================================

  test "should show team without authentication" do
    get team_path(@team)
    assert_response :success
  end

  # =============================================================================
  # New/Create
  # =============================================================================

  test "should redirect new when not authenticated" do
    get new_team_path
    assert_redirected_to login_path
  end

  test "should get new when authenticated" do
    sign_in_as(@user)
    get new_team_path
    assert_response :success
  end

  test "should create team" do
    sign_in_as(@user)
    assert_difference("Team.count") do
      post teams_path, params: {
        team: {
          name: "새로운 팀",
          city: "서울",
          district: "강남구",
          description: "테스트 팀입니다."
        }
      }
    end
    assert_redirected_to team_path(Team.last)
  end

  # =============================================================================
  # Edit/Update
  # =============================================================================

  test "should redirect edit when not captain" do
    sign_in_as(@user)
    get edit_team_path(@team)
    assert_redirected_to team_path(@team)
  end

  test "should get edit when captain" do
    sign_in_as(@captain)
    get edit_team_path(@team)
    assert_response :success
  end

  test "should update team when captain" do
    sign_in_as(@captain)
    patch team_path(@team), params: {
      team: { name: "수정된 팀명" }
    }
    assert_redirected_to team_path(@team)
    @team.reload
    assert_equal "수정된 팀명", @team.name
  end

  # =============================================================================
  # Join/Leave
  # =============================================================================

  test "should join team when authenticated" do
    sign_in_as(@user)
    post join_team_path(@team)
    # Either redirect or JSON response depending on implementation
    assert_response :redirect
  end

  test "should leave team when member" do
    sign_in_as(@user)
    # First join
    @team.team_members.create!(user: @user, role: :member, status: :active)

    delete leave_team_path(@team)
    assert_response :redirect
  end

  test "should not leave team when captain" do
    sign_in_as(@captain)
    delete leave_team_path(@team)
    # Captain should not be able to leave
    assert_response :redirect
  end
end
