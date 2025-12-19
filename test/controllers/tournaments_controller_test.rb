# frozen_string_literal: true

require "test_helper"

class TournamentsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = create_user
    @organizer = create_user
    @tournament = create_tournament(organizer: @organizer, status: :registration_open)
  end

  # =============================================================================
  # Index
  # =============================================================================

  test "should get index without authentication" do
    get tournaments_path
    assert_response :success
  end

  test "should filter tournaments by status" do
    get tournaments_path, params: { status: "registration_open" }
    assert_response :success
  end

  # =============================================================================
  # Show
  # =============================================================================

  test "should show tournament without authentication" do
    get tournament_path(@tournament)
    assert_response :success
  end

  # =============================================================================
  # New/Create
  # =============================================================================

  test "should redirect new when not authenticated" do
    get new_tournament_path
    assert_redirected_to login_path
  end

  test "should get new when authenticated" do
    sign_in_as(@user)
    get new_tournament_path
    assert_response :success
  end

  test "should create tournament" do
    sign_in_as(@user)
    assert_difference("Tournament.count") do
      post tournaments_path, params: {
        tournament: {
          name: "새로운 대회",
          format: "single_elimination",
          start_date: 2.weeks.from_now,
          end_date: 4.weeks.from_now,
          registration_start: Time.current,
          registration_end: 1.week.from_now,
          team_size: 5,
          min_teams: 4,
          max_teams: 16,
          entry_fee: 50000,
          description: "테스트 대회입니다."
        }
      }
    end
    assert_redirected_to tournament_path(Tournament.last)
  end

  # =============================================================================
  # Edit/Update
  # =============================================================================

  test "should redirect edit when not organizer" do
    sign_in_as(@user)
    get edit_tournament_path(@tournament)
    assert_redirected_to tournament_path(@tournament)
  end

  test "should get edit when organizer" do
    sign_in_as(@organizer)
    get edit_tournament_path(@tournament)
    assert_response :success
  end

  test "should update tournament when organizer" do
    sign_in_as(@organizer)
    patch tournament_path(@tournament), params: {
      tournament: { name: "수정된 대회명" }
    }
    assert_redirected_to tournament_path(@tournament)
    @tournament.reload
    assert_equal "수정된 대회명", @tournament.name
  end

  # =============================================================================
  # Special Views
  # =============================================================================

  test "should get bracket" do
    get bracket_tournament_path(@tournament)
    assert_response :success
  end

  test "should get standings" do
    get standings_tournament_path(@tournament)
    assert_response :success
  end

  test "should get schedule" do
    get schedule_tournament_path(@tournament)
    assert_response :success
  end

  # =============================================================================
  # Status Actions
  # =============================================================================

  test "should open registration when organizer" do
    @tournament.update!(status: :draft)
    sign_in_as(@organizer)
    post open_registration_tournament_path(@tournament)
    assert_redirected_to tournament_path(@tournament)
    @tournament.reload
    assert @tournament.status_registration_open?
  end

  test "should not open registration when not organizer" do
    @tournament.update!(status: :draft)
    sign_in_as(@user)
    post open_registration_tournament_path(@tournament)
    assert_redirected_to tournament_path(@tournament)
    @tournament.reload
    assert @tournament.status_draft?
  end

  # =============================================================================
  # My Tournaments
  # =============================================================================

  test "should get my_tournaments when authenticated" do
    sign_in_as(@organizer)
    get my_tournaments_tournaments_path
    assert_response :success
  end

  test "should redirect my_tournaments when not authenticated" do
    get my_tournaments_tournaments_path
    assert_redirected_to login_path
  end
end
