# frozen_string_literal: true

require "test_helper"

class TeamTest < ActiveSupport::TestCase
  # =============================================================================
  # Validations
  # =============================================================================

  test "should not save team without name" do
    captain = create_user
    team = Team.new(captain: captain, manager: captain, city: "서울", status: :active)
    assert_not team.save, "Saved the team without a name"
  end

  test "should not save team without captain" do
    team = Team.new(name: "Test Team", city: "서울", status: :active)
    assert_not team.save, "Saved the team without a captain"
  end

  test "should not save team without city" do
    captain = create_user
    team = Team.new(name: "Test Team", captain: captain, manager: captain, status: :active)
    assert_not team.save, "Saved the team without a city"
  end

  test "should generate unique slug" do
    captain = create_user
    team = Team.create!(
      name: "테스트 팀",
      captain: captain,
      manager: captain,
      city: "서울",
      status: :active
    )
    assert_not_nil team.slug, "Slug should be generated"
  end

  test "should generate unique team_code" do
    captain = create_user
    team = Team.create!(
      name: "Test Team",
      captain: captain,
      manager: captain,
      city: "서울",
      status: :active
    )
    assert_not_nil team.team_code, "Team code should be generated"
    assert team.team_code.length >= 6, "Team code should be at least 6 characters"
  end

  # =============================================================================
  # Associations
  # =============================================================================

  test "should belong to captain" do
    captain = create_user
    team = create_team(captain: captain)
    assert_equal captain, team.captain, "Team should belong to captain"
  end

  test "should have many team_members" do
    team = create_team
    assert_respond_to team, :team_members, "Team should have many team_members"
  end

  # =============================================================================
  # Scopes
  # =============================================================================

  test "active scope should return only active teams" do
    captain = create_user
    active_team = Team.create!(
      name: "Active Team",
      captain: captain,
      manager: captain,
      city: "서울",
      status: :active
    )
    inactive_team = Team.create!(
      name: "Inactive Team",
      captain: captain,
      manager: captain,
      city: "서울",
      status: :inactive
    )

    active_teams = Team.active
    assert_includes active_teams, active_team, "Should include active team"
    assert_not_includes active_teams, inactive_team, "Should not include inactive team"
  end

  test "by_city scope should filter by city" do
    captain = create_user
    seoul_team = Team.create!(
      name: "Seoul Team",
      captain: captain,
      manager: captain,
      city: "서울",
      status: :active
    )
    busan_team = Team.create!(
      name: "Busan Team",
      captain: captain,
      manager: captain,
      city: "부산",
      status: :active
    )

    seoul_teams = Team.by_city("서울")
    assert_includes seoul_teams, seoul_team, "Should include Seoul team"
    assert_not_includes seoul_teams, busan_team, "Should not include Busan team"
  end

  # =============================================================================
  # Instance Methods
  # =============================================================================

  test "captain? should return true for team captain" do
    captain = create_user
    team = create_team(captain: captain)
    assert team.captain?(captain), "Should return true for team captain"
  end

  test "captain? should return false for non-captain" do
    captain = create_user
    other_user = create_user
    team = create_team(captain: captain)
    assert_not team.captain?(other_user), "Should return false for non-captain"
  end

  test "admin? should return true for captain" do
    captain = create_user
    team = create_team(captain: captain)
    assert team.admin?(captain), "admin? should return true for captain"
  end
end
