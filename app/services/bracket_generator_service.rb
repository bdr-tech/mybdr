# frozen_string_literal: true

class BracketGeneratorService
  attr_reader :tournament, :errors

  def initialize(tournament)
    @tournament = tournament
    @errors = []
  end

  # 대진표 자동 생성
  def generate!
    return false unless valid_for_generation?

    ActiveRecord::Base.transaction do
      case tournament.format
      when "single_elimination"
        generate_single_elimination!
      when "double_elimination"
        generate_double_elimination!
      when "round_robin"
        generate_round_robin!
      when "group_stage"
        generate_group_stage!
      when "swiss"
        generate_swiss_first_round!
      else
        @errors << "지원하지 않는 대회 형식입니다"
        raise ActiveRecord::Rollback
      end
    end

    errors.empty?
  end

  # 조 추첨 (그룹 스테이지용)
  def draw_groups!(group_count:, seeded_teams: [], random_remaining: true)
    teams = tournament.tournament_teams.approved.includes(:team)

    return false if teams.count < group_count * 2

    # 시드 팀 먼저 배치
    seeded_teams.each_with_index do |team_id, index|
      team = teams.find { |t| t.id == team_id }
      next unless team

      group_letter = ('A'.ord + (index % group_count)).chr
      team.update!(group_name: group_letter, seed_number: index + 1)
    end

    # 나머지 팀 랜덤 배치
    if random_remaining
      remaining_teams = teams.where(group_name: nil).shuffle
      remaining_teams.each_with_index do |team, index|
        group_letter = ('A'.ord + (index % group_count)).chr
        team.update!(group_name: group_letter)
      end
    end

    true
  end

  # 시드 배정
  def assign_seeds!(team_seed_map)
    team_seed_map.each do |team_id, seed_number|
      team = tournament.tournament_teams.find_by(id: team_id)
      team&.update!(seed_number: seed_number)
    end
    true
  end

  # 기존 대진표 삭제
  def clear_bracket!
    tournament.tournament_matches.destroy_all
    tournament.tournament_teams.update_all(group_name: nil)
    true
  end

  private

  def valid_for_generation?
    teams = tournament.tournament_teams.approved

    if teams.count < 2
      @errors << "최소 2팀 이상이 필요합니다"
      return false
    end

    if tournament.tournament_matches.exists?
      @errors << "이미 대진표가 존재합니다. 먼저 삭제해주세요."
      return false
    end

    true
  end

  # 싱글 엘리미네이션 대진표 생성
  def generate_single_elimination!
    teams = tournament.tournament_teams.approved.order(:seed_number, :created_at).to_a
    team_count = teams.size

    # 2의 거듭제곱으로 올림 (8, 16, 32...)
    bracket_size = [2, 4, 8, 16, 32, 64].find { |n| n >= team_count } || 64
    total_rounds = Math.log2(bracket_size).to_i

    # 부전승 계산
    byes = bracket_size - team_count

    # 1라운드 매치 생성
    round1_match_count = bracket_size / 2
    match_number = 1

    round1_match_count.times do |i|
      home_team = teams[i * 2]
      away_team = teams[i * 2 + 1]

      create_match!(
        round_number: 1,
        round_name: round_name_for(1, total_rounds),
        match_number: match_number,
        home_team: home_team,
        away_team: away_team,
        bracket_position: i,
        bracket_level: 1
      )
      match_number += 1
    end

    # 나머지 라운드 매치 생성 (팀 미정)
    (2..total_rounds).each do |round|
      matches_in_round = bracket_size / (2 ** round)

      matches_in_round.times do |i|
        create_match!(
          round_number: round,
          round_name: round_name_for(round, total_rounds),
          match_number: match_number,
          home_team: nil,
          away_team: nil,
          bracket_position: i,
          bracket_level: round
        )
        match_number += 1
      end
    end
  end

  # 더블 엘리미네이션 대진표 생성
  def generate_double_elimination!
    teams = tournament.tournament_teams.approved.order(:seed_number, :created_at).to_a
    team_count = teams.size
    bracket_size = [2, 4, 8, 16, 32].find { |n| n >= team_count } || 32

    # 승자조 생성
    generate_winners_bracket!(teams, bracket_size)

    # 패자조 생성
    generate_losers_bracket!(bracket_size)

    # 그랜드 파이널
    create_match!(
      round_number: 100,
      round_name: "그랜드 파이널",
      match_number: 999,
      home_team: nil,
      away_team: nil,
      bracket_position: 0,
      bracket_level: 100
    )
  end

  def generate_winners_bracket!(teams, bracket_size)
    total_rounds = Math.log2(bracket_size).to_i
    match_number = 1

    # 1라운드
    (bracket_size / 2).times do |i|
      home_team = teams[i * 2]
      away_team = teams[i * 2 + 1]

      create_match!(
        round_number: 1,
        round_name: "승자조 1라운드",
        match_number: match_number,
        home_team: home_team,
        away_team: away_team,
        bracket_position: i,
        bracket_level: 1,
        group_name: "W"
      )
      match_number += 1
    end

    # 나머지 승자조 라운드
    (2..total_rounds).each do |round|
      matches_in_round = bracket_size / (2 ** round)

      matches_in_round.times do |i|
        create_match!(
          round_number: round,
          round_name: "승자조 #{round}라운드",
          match_number: match_number,
          home_team: nil,
          away_team: nil,
          bracket_position: i,
          bracket_level: round,
          group_name: "W"
        )
        match_number += 1
      end
    end
  end

  def generate_losers_bracket!(bracket_size)
    # 패자조는 승자조보다 라운드가 더 많음
    losers_rounds = (Math.log2(bracket_size).to_i - 1) * 2
    match_number = 500

    losers_rounds.times do |round|
      matches_in_round = [bracket_size / (2 ** ((round / 2) + 2)), 1].max

      matches_in_round.times do |i|
        create_match!(
          round_number: round + 1,
          round_name: "패자조 #{round + 1}라운드",
          match_number: match_number,
          home_team: nil,
          away_team: nil,
          bracket_position: i,
          bracket_level: round + 1,
          group_name: "L"
        )
        match_number += 1
      end
    end
  end

  # 리그전 (라운드 로빈) 대진표 생성
  def generate_round_robin!
    teams = tournament.tournament_teams.approved.order(:seed_number, :created_at).to_a
    team_count = teams.size

    # 홀수면 가상의 팀 추가 (부전승용)
    teams << nil if team_count.odd?
    n = teams.size

    rounds = n - 1
    matches_per_round = n / 2
    match_number = 1

    rounds.times do |round|
      matches_per_round.times do |match|
        home_idx = match
        away_idx = n - 1 - match

        home_team = teams[home_idx]
        away_team = teams[away_idx]

        # nil 팀은 부전승
        next if home_team.nil? || away_team.nil?

        create_match!(
          round_number: round + 1,
          round_name: "#{round + 1}라운드",
          match_number: match_number,
          home_team: home_team,
          away_team: away_team,
          bracket_position: match,
          bracket_level: round + 1
        )
        match_number += 1
      end

      # 팀 로테이션 (첫 번째 팀은 고정)
      teams = [teams[0]] + [teams[-1]] + teams[1..-2]
    end
  end

  # 그룹 스테이지 대진표 생성
  def generate_group_stage!
    groups = tournament.tournament_teams.approved.group_by(&:group_name)

    if groups.keys.compact.empty?
      @errors << "먼저 조 추첨을 진행해주세요"
      raise ActiveRecord::Rollback
    end

    match_number = 1

    groups.each do |group_name, teams|
      next if group_name.nil?

      # 각 조별 리그전
      teams.combination(2).each_with_index do |(home, away), index|
        round = (index / (teams.size / 2)) + 1

        create_match!(
          round_number: round,
          round_name: "#{group_name}조 #{round}라운드",
          match_number: match_number,
          home_team: home,
          away_team: away,
          group_name: group_name,
          bracket_position: index,
          bracket_level: round
        )
        match_number += 1
      end
    end

    # 결선 토너먼트 경기 (빈 상태로 생성)
    group_count = groups.keys.compact.size
    knockout_teams = group_count * 2  # 각 조 상위 2팀

    # 8강, 4강, 결승 생성
    create_knockout_matches!(knockout_teams, match_number)
  end

  def create_knockout_matches!(team_count, start_match_number)
    rounds = Math.log2(team_count).to_i
    match_number = start_match_number

    rounds.times do |round|
      matches = team_count / (2 ** (round + 1))
      round_name = knockout_round_name(matches)

      matches.times do |i|
        create_match!(
          round_number: 100 + round,
          round_name: round_name,
          match_number: match_number,
          home_team: nil,
          away_team: nil,
          bracket_position: i,
          bracket_level: 100 + round,
          group_name: "KO"
        )
        match_number += 1
      end
    end
  end

  # 스위스 방식 첫 라운드 생성
  def generate_swiss_first_round!
    teams = tournament.tournament_teams.approved.order(:seed_number, :created_at).to_a

    # 첫 라운드만 생성 (이후 라운드는 결과에 따라 동적 생성)
    teams.each_slice(2).with_index do |(home, away), index|
      next unless away  # 부전승 처리

      create_match!(
        round_number: 1,
        round_name: "1라운드",
        match_number: index + 1,
        home_team: home,
        away_team: away,
        bracket_position: index,
        bracket_level: 1
      )
    end
  end

  def create_match!(attrs)
    tournament.tournament_matches.create!(
      home_team: attrs[:home_team],
      away_team: attrs[:away_team],
      round_number: attrs[:round_number],
      round_name: attrs[:round_name],
      match_number: attrs[:match_number],
      bracket_position: attrs[:bracket_position],
      bracket_level: attrs[:bracket_level],
      group_name: attrs[:group_name],
      status: :scheduled
    )
  end

  def round_name_for(round, total_rounds)
    remaining = total_rounds - round + 1

    case remaining
    when 1 then "결승"
    when 2 then "준결승"
    when 3 then "8강"
    when 4 then "16강"
    when 5 then "32강"
    else "#{round}라운드"
    end
  end

  def knockout_round_name(matches)
    case matches
    when 1 then "결승"
    when 2 then "준결승"
    when 4 then "8강"
    when 8 then "16강"
    else "#{matches * 2}강"
    end
  end
end
