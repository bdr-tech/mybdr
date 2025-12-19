# frozen_string_literal: true

ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    # Add more helper methods to be used by all tests here...

    # =============================================================================
    # Authentication Helpers
    # =============================================================================

    def sign_in(user)
      post login_path, params: { email: user.email, password: "password123!" }
    end

    def sign_out
      delete logout_path
    end

    # =============================================================================
    # Fixture Helpers
    # =============================================================================

    def create_user(attributes = {})
      User.create!({
        email: "test_#{SecureRandom.hex(4)}@test.com",
        password: "password123!",
        password_confirmation: "password123!",
        nickname: "테스터#{SecureRandom.hex(4)}",
        phone: "010#{rand(10000000..99999999)}",
        name: "테스트유저",
        status: :active,
        membership_type: :free
      }.merge(attributes))
    end

    def create_admin_user(attributes = {})
      create_user({
        is_admin: true,
        membership_type: :super_admin
      }.merge(attributes))
    end

    def create_team(attributes = {})
      captain = attributes[:captain] || create_user
      Team.create!({
        name: "테스트팀#{SecureRandom.hex(4)}",
        city: "서울",
        description: "테스트 팀입니다.",
        captain: captain,
        manager: captain,
        status: :active
      }.merge(attributes))
    end

    def create_tournament(attributes = {})
      organizer = attributes[:organizer] || create_user
      Tournament.create!({
        name: "테스트대회#{SecureRandom.hex(4)}",
        organizer: organizer,
        status: :draft,
        start_date: 1.week.from_now,
        end_date: 2.weeks.from_now,
        registration_start: Time.current,
        registration_end: 6.days.from_now,
        format: :single_elimination,
        team_size: 5,
        min_teams: 4,
        max_teams: 16
      }.merge(attributes))
    end

    def create_game(attributes = {})
      organizer = attributes[:organizer] || create_user
      Game.create!({
        organizer: organizer,
        title: "테스트경기#{SecureRandom.hex(4)}",
        city: "서울",
        district: "강남구",
        address: "강남역 3번 출구",
        scheduled_at: 1.day.from_now,
        game_type: :pickup,
        skill_level: :intermediate,
        status: :open,
        max_participants: 10,
        participation_fee: 5000
      }.merge(attributes))
    end
  end
end

module ActionDispatch
  class IntegrationTest
    include ActiveSupport::TestCase::LocalVariables rescue nil

    def sign_in_as(user)
      post login_path, params: { email: user.email, password: "password123!" }
    end
  end
end
