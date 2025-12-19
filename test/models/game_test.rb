# frozen_string_literal: true

require "test_helper"

class GameTest < ActiveSupport::TestCase
  # =============================================================================
  # Validations
  # =============================================================================

  test "should not save game without title" do
    organizer = create_user
    game = Game.new(
      organizer: organizer,
      city: "서울",
      address: "강남역",
      scheduled_at: 1.day.from_now,
      game_type: :pickup,
      status: :open,
      max_participants: 10
    )
    assert_not game.save, "Saved the game without a title"
  end

  test "should not save game without organizer" do
    game = Game.new(
      title: "Test Game",
      city: "서울",
      address: "강남역",
      scheduled_at: 1.day.from_now,
      game_type: :pickup,
      status: :open,
      max_participants: 10
    )
    assert_not game.save, "Saved the game without an organizer"
  end

  test "should not save game without city" do
    organizer = create_user
    game = Game.new(
      title: "Test Game",
      organizer: organizer,
      address: "강남역",
      scheduled_at: 1.day.from_now,
      game_type: :pickup,
      status: :open,
      max_participants: 10
    )
    assert_not game.save, "Saved the game without a city"
  end

  test "should not save game without scheduled_at" do
    organizer = create_user
    game = Game.new(
      title: "Test Game",
      organizer: organizer,
      city: "서울",
      address: "강남역",
      game_type: :pickup,
      status: :open,
      max_participants: 10
    )
    assert_not game.save, "Saved the game without scheduled_at"
  end

  test "should validate max_participants is positive" do
    organizer = create_user
    game = Game.new(
      title: "Test Game",
      organizer: organizer,
      city: "서울",
      address: "강남역",
      scheduled_at: 1.day.from_now,
      game_type: :pickup,
      status: :open,
      max_participants: 0
    )
    assert_not game.save, "Saved the game with non-positive max_participants"
  end

  # =============================================================================
  # Callbacks
  # =============================================================================

  test "should generate uuid on create" do
    game = create_game
    assert_not_nil game.uuid, "UUID should be generated on create"
  end

  test "should generate game_id on create" do
    game = create_game
    assert_not_nil game.game_id, "Game ID should be generated on create"
  end

  # =============================================================================
  # Associations
  # =============================================================================

  test "should belong to organizer" do
    organizer = create_user
    game = create_game(organizer: organizer)
    assert_equal organizer, game.organizer, "Game should belong to organizer"
  end

  test "should have many game_applications" do
    game = create_game
    assert_respond_to game, :game_applications, "Game should have many game_applications"
  end

  # =============================================================================
  # Scopes
  # =============================================================================

  test "open scope should return only open games" do
    organizer = create_user
    open_game = create_game(organizer: organizer, status: :open)
    closed_game = create_game(organizer: organizer, status: :closed)

    open_games = Game.open
    assert_includes open_games, open_game, "Should include open game"
    assert_not_includes open_games, closed_game, "Should not include closed game"
  end

  test "upcoming scope should return future games" do
    organizer = create_user
    upcoming_game = create_game(organizer: organizer, scheduled_at: 1.week.from_now)

    upcoming_games = Game.upcoming
    assert_includes upcoming_games, upcoming_game, "Should include upcoming game"
  end

  test "by_city scope should filter by city" do
    organizer = create_user
    seoul_game = create_game(organizer: organizer, city: "서울")
    busan_game = create_game(organizer: organizer, city: "부산")

    seoul_games = Game.by_city("서울")
    assert_includes seoul_games, seoul_game, "Should include Seoul game"
    assert_not_includes seoul_games, busan_game, "Should not include Busan game"
  end

  # =============================================================================
  # Instance Methods
  # =============================================================================

  test "organizer? should return true for game organizer" do
    organizer = create_user
    game = create_game(organizer: organizer)
    assert game.organizer?(organizer), "Should return true for game organizer"
  end

  test "organizer? should return false for non-organizer" do
    organizer = create_user
    other_user = create_user
    game = create_game(organizer: organizer)
    assert_not game.organizer?(other_user), "Should return false for non-organizer"
  end

  test "full? should return true when at capacity" do
    organizer = create_user
    game = create_game(organizer: organizer, max_participants: 1, current_participants: 1)
    assert game.full?, "Should return true when game is full"
  end

  test "full? should return false when not at capacity" do
    organizer = create_user
    game = create_game(organizer: organizer, max_participants: 10, current_participants: 5)
    assert_not game.full?, "Should return false when game is not full"
  end
end
