# frozen_string_literal: true

require "test_helper"

class TournamentTest < ActiveSupport::TestCase
  # =============================================================================
  # Validations
  # =============================================================================

  test "should not save tournament without name" do
    organizer = create_user
    tournament = Tournament.new(
      organizer: organizer,
      start_date: 1.week.from_now,
      end_date: 2.weeks.from_now,
      registration_start: Time.current,
      registration_end: 6.days.from_now,
      format: :single_elimination,
      team_size: 5,
      min_teams: 4,
      max_teams: 16
    )
    assert_not tournament.save, "Saved the tournament without a name"
  end

  test "should not save tournament without organizer" do
    tournament = Tournament.new(
      name: "Test Tournament",
      start_date: 1.week.from_now,
      end_date: 2.weeks.from_now,
      registration_start: Time.current,
      registration_end: 6.days.from_now,
      format: :single_elimination,
      team_size: 5,
      min_teams: 4,
      max_teams: 16
    )
    assert_not tournament.save, "Saved the tournament without an organizer"
  end

  test "should validate end_date is after start_date" do
    organizer = create_user
    tournament = Tournament.new(
      name: "Test Tournament",
      organizer: organizer,
      start_date: 2.weeks.from_now,
      end_date: 1.week.from_now,
      registration_start: Time.current,
      registration_end: 6.days.from_now,
      format: :single_elimination,
      team_size: 5,
      min_teams: 4,
      max_teams: 16
    )
    assert_not tournament.save, "Saved the tournament with end_date before start_date"
  end

  test "should validate max_teams is greater than min_teams" do
    organizer = create_user
    tournament = Tournament.new(
      name: "Test Tournament",
      organizer: organizer,
      start_date: 1.week.from_now,
      end_date: 2.weeks.from_now,
      registration_start: Time.current,
      registration_end: 6.days.from_now,
      format: :single_elimination,
      team_size: 5,
      min_teams: 16,
      max_teams: 4
    )
    assert_not tournament.save, "Saved the tournament with max_teams less than min_teams"
  end

  # =============================================================================
  # Callbacks
  # =============================================================================

  test "should generate uuid on create" do
    tournament = create_tournament
    assert_not_nil tournament.uuid, "UUID should be generated on create"
  end

  # =============================================================================
  # Associations
  # =============================================================================

  test "should belong to organizer" do
    organizer = create_user
    tournament = create_tournament(organizer: organizer)
    assert_equal organizer, tournament.organizer, "Tournament should belong to organizer"
  end

  test "should have many tournament_teams" do
    tournament = create_tournament
    assert_respond_to tournament, :tournament_teams, "Tournament should have many tournament_teams"
  end

  test "should have many tournament_matches" do
    tournament = create_tournament
    assert_respond_to tournament, :tournament_matches, "Tournament should have many tournament_matches"
  end

  # =============================================================================
  # Scopes
  # =============================================================================

  test "active scope should return non-draft tournaments" do
    organizer = create_user
    draft = create_tournament(organizer: organizer, status: :draft)
    active = create_tournament(organizer: organizer, status: :registration_open)

    active_tournaments = Tournament.active
    assert_includes active_tournaments, active, "Should include active tournament"
    assert_not_includes active_tournaments, draft, "Should not include draft tournament"
  end

  test "upcoming scope should return future tournaments" do
    organizer = create_user
    upcoming = create_tournament(
      organizer: organizer,
      start_date: 1.month.from_now,
      end_date: 2.months.from_now
    )

    upcoming_tournaments = Tournament.upcoming
    assert_includes upcoming_tournaments, upcoming, "Should include upcoming tournament"
  end

  # =============================================================================
  # Status Methods
  # =============================================================================

  test "registration_open? should return true when registration is open" do
    tournament = create_tournament(status: :registration_open)
    assert tournament.status_registration_open?, "Should return true for registration_open status"
  end

  test "can_register? should check registration period" do
    organizer = create_user
    tournament = Tournament.create!(
      name: "Test Tournament",
      organizer: organizer,
      status: :registration_open,
      start_date: 1.week.from_now,
      end_date: 2.weeks.from_now,
      registration_start: 1.day.ago,
      registration_end: 5.days.from_now,
      format: :single_elimination,
      team_size: 5,
      min_teams: 4,
      max_teams: 16
    )
    assert tournament.can_register?, "Should allow registration during open period"
  end

  # =============================================================================
  # Instance Methods
  # =============================================================================

  test "organizer? should return true for tournament organizer" do
    organizer = create_user
    tournament = create_tournament(organizer: organizer)
    assert tournament.organizer?(organizer), "Should return true for tournament organizer"
  end

  test "organizer? should return false for non-organizer" do
    organizer = create_user
    other_user = create_user
    tournament = create_tournament(organizer: organizer)
    assert_not tournament.organizer?(other_user), "Should return false for non-organizer"
  end
end
