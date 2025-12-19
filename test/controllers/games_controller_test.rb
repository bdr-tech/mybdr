# frozen_string_literal: true

require "test_helper"

class GamesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = create_user
    @organizer = create_user
    @game = create_game(organizer: @organizer)
  end

  # =============================================================================
  # Index
  # =============================================================================

  test "should get index without authentication" do
    get games_path
    assert_response :success
  end

  test "should filter games by city" do
    get games_path, params: { city: "서울" }
    assert_response :success
  end

  test "should filter games by game_type" do
    get games_path, params: { game_type: "pickup" }
    assert_response :success
  end

  # =============================================================================
  # Show
  # =============================================================================

  test "should show game without authentication" do
    get game_path(@game)
    assert_response :success
  end

  # =============================================================================
  # New/Create
  # =============================================================================

  test "should redirect new when not authenticated" do
    get new_game_path
    assert_redirected_to login_path
  end

  test "should get new when authenticated" do
    sign_in_as(@user)
    get new_game_path
    assert_response :success
  end

  test "should create game" do
    sign_in_as(@user)
    assert_difference("Game.count") do
      post games_path, params: {
        game: {
          title: "새로운 경기",
          city: "서울",
          district: "강남구",
          address: "테스트 주소",
          scheduled_at: 1.day.from_now,
          game_type: "pickup",
          skill_level: "intermediate",
          max_participants: 10,
          participation_fee: 5000,
          description: "테스트 경기입니다."
        }
      }
    end
    assert_redirected_to game_path(Game.last)
  end

  # =============================================================================
  # Edit/Update
  # =============================================================================

  test "should redirect edit when not organizer" do
    sign_in_as(@user)
    get edit_game_path(@game)
    assert_redirected_to game_path(@game)
  end

  test "should get edit when organizer" do
    sign_in_as(@organizer)
    get edit_game_path(@game)
    assert_response :success
  end

  test "should update game when organizer" do
    sign_in_as(@organizer)
    patch game_path(@game), params: {
      game: { title: "수정된 제목" }
    }
    assert_redirected_to game_path(@game)
    @game.reload
    assert_equal "수정된 제목", @game.title
  end

  # =============================================================================
  # Destroy
  # =============================================================================

  test "should not destroy game when not organizer" do
    sign_in_as(@user)
    assert_no_difference("Game.count") do
      delete game_path(@game)
    end
  end

  test "should destroy game when organizer" do
    sign_in_as(@organizer)
    assert_difference("Game.count", -1) do
      delete game_path(@game)
    end
    assert_redirected_to games_path
  end

  # =============================================================================
  # My Games
  # =============================================================================

  test "should get my_games when authenticated" do
    sign_in_as(@organizer)
    get my_games_games_path
    assert_response :success
  end

  test "should redirect my_games when not authenticated" do
    get my_games_games_path
    assert_redirected_to login_path
  end
end
