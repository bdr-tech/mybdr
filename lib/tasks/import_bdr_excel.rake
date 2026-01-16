# frozen_string_literal: true

require "json"

namespace :tournaments do
  desc "Import tournaments, teams, and players from BDR Excel export"
  task import_excel: :environment do
    puts "=" * 60
    puts "BDR 엑셀 데이터 임포트 시작"
    puts "=" * 60

    # Find or create organizer (admin user)
    organizer = User.find_by(email: "admin@bdr.com")

    unless organizer
      puts "❌ admin@bdr.com 사용자를 찾을 수 없습니다."
      puts "   먼저 db:seed를 실행하여 관리자 계정을 생성하세요."
      exit 1
    end

    puts "✅ 주최자: #{organizer.email}"

    # Load JSON data
    tournaments_json = JSON.parse(File.read("/tmp/bdr_tournaments.json"))
    teams_json = JSON.parse(File.read("/tmp/bdr_teams.json"))

    puts "\n📊 데이터 로드 완료"
    puts "  대회: #{tournaments_json.count}개"
    puts "  팀: #{teams_json.count}개"

    # Track mappings
    tour_id_mapping = {} # Excel tourId => DB tournament UUID
    team_id_mapping = {} # Excel teamId => DB team ID
    user_cache = {}       # email/phone => User

    # Stats
    stats = {
      tournaments_created: 0,
      tournaments_skipped: 0,
      teams_created: 0,
      teams_skipped: 0,
      tournament_teams_created: 0,
      players_created: 0,
      users_created: 0
    }

    # Step 1: Import Tournaments
    puts "\n" + "=" * 60
    puts "Step 1: 대회 임포트"
    puts "=" * 60

    tournaments_json.each do |t_data|
      tour_id = t_data["tourId"]
      name = t_data["name"]

      # Skip if already exists
      existing = Tournament.find_by(name: name)
      if existing
        puts "⏭️  스킵: #{name} (이미 존재)"
        tour_id_mapping[tour_id] = existing.id
        stats[:tournaments_skipped] += 1
        next
      end

      # Parse divisions from divSets
      divisions = []
      division_tiers = []
      begin
        if t_data["divSets"]
          div_sets = JSON.parse(t_data["divSets"])
          div_sets.each do |ds|
            divisions << ds["group"] if ds["group"]
            division_tiers.concat(ds["divisions"]) if ds["divisions"]
          end
        end
      rescue JSON::ParserError
        # Ignore parse errors
      end

      # Parse venue from places
      venue_name = nil
      begin
        if t_data["places"]
          places = JSON.parse(t_data["places"])
          venue_name = places.first&.dig("name")
        end
      rescue JSON::ParserError
        # Ignore
      end

      # Parse max_teams from divCaps
      max_teams = 12
      begin
        if t_data["divCaps"]
          caps = JSON.parse(t_data["divCaps"])
          max_teams = caps.values.sum if caps.is_a?(Hash) && caps.values.any?
        end
      rescue JSON::ParserError
        # Ignore
      end

      # Map status
      status = case t_data["status"]
               when "종료" then "completed"
               when "진행중" then "in_progress"
               when "모집중" then "registration_open"
               else "completed"
               end

      tournament = Tournament.new(
        name: name,
        organizer: organizer,
        description: "BDR Join V1에서 임포트된 대회\n원본 URL: #{t_data['url']}",
        venue_name: venue_name,
        banner_url: t_data["posterUrl"],
        registration_start_at: parse_datetime(t_data["regStart"]),
        registration_end_at: parse_datetime(t_data["regEnd"]),
        start_date: parse_datetime(t_data["start"]),
        end_date: parse_datetime(t_data["end"]),
        max_teams: [max_teams, 4].max,
        min_teams: 4,
        team_size: 5,
        entry_fee: t_data["fee"].to_i,
        format: "group_stage",
        status: status,
        divisions: divisions.uniq,
        division_tiers: division_tiers.uniq,
        is_public: true,
        settings: {
          original_tour_id: tour_id,
          account_info: t_data["account"]
        }
      )

      if tournament.save
        puts "✅ 생성: #{tournament.name}"
        tour_id_mapping[tour_id] = tournament.id
        stats[:tournaments_created] += 1
      else
        puts "❌ 실패: #{name}"
        puts "   에러: #{tournament.errors.full_messages.join(', ')}"
      end
    end

    # Step 2: Create Teams and TeamMembers
    puts "\n" + "=" * 60
    puts "Step 2: 팀 및 선수 임포트"
    puts "=" * 60

    teams_json.each do |team_data|
      excel_team_id = team_data["teamId"]
      tour_id = team_data["tourId"]
      team_name = team_data["teamNameKo"]

      next unless team_name.present?

      # Find or create team
      team = Team.find_by(name: team_name)

      if team
        puts "⏭️  팀 존재: #{team_name}"
        team_id_mapping[excel_team_id] = team.id
        stats[:teams_skipped] += 1
      else
        # Create manager user first
        manager_name = team_data["managerName"] || "매니저"
        manager_phone = team_data["managerPhone"]&.gsub(/[^0-9]/, "")
        manager_phone = nil if manager_phone.blank?

        # Generate unique email for manager
        manager_email = "manager_#{excel_team_id.downcase}@bdr-import.local"

        manager = user_cache[manager_email] || User.find_by(email: manager_email)

        # Also check if phone number already exists
        if manager_phone.present? && !manager
          manager = User.find_by(phone: manager_phone)
        end

        unless manager
          # Try creating with phone, if fails try without phone
          begin
            manager = User.create!(
              email: manager_email,
              password: SecureRandom.hex(16),
              name: manager_name,
              phone: manager_phone,
              city: team_data["province"],
              district: team_data["city"]
            )
          rescue ActiveRecord::RecordInvalid => e
            if e.message.include?("전화번호")
              # Phone duplicate, create without phone
              manager = User.create!(
                email: manager_email,
                password: SecureRandom.hex(16),
                name: manager_name,
                city: team_data["province"],
                district: team_data["city"]
              )
            else
              raise e
            end
          end
          user_cache[manager_email] = manager
          stats[:users_created] += 1
        end

        # Parse colors
        primary_color = team_data["uniformHome"] || "#FFFFFF"
        secondary_color = team_data["uniformAway"] || "#000000"

        team = Team.create!(
          name: team_name,
          captain: manager,
          manager: manager,
          city: team_data["province"],
          district: team_data["city"],
          primary_color: primary_color,
          secondary_color: secondary_color,
          description: "BDR Join V1에서 임포트됨\n영문명: #{team_data['teamNameEn']}",
          settings: {
            original_team_id: excel_team_id,
            edit_code: team_data["editCode"]
          }
        )

        # Captain is automatically added via after_create callback in Team model

        puts "✅ 팀 생성: #{team_name}"
        team_id_mapping[excel_team_id] = team.id
        stats[:teams_created] += 1
      end

      # Parse and create players
      if team_data["players"].present?
        begin
          players = JSON.parse(team_data["players"])

          players.each do |player|
            player_name = player["name"]
            next unless player_name.present?

            # Map position (G -> point_guard, F -> small_forward, C -> center)
            mapped_position = case player["position"]
                              when "G" then "point_guard"
                              when "F" then "small_forward"
                              when "C" then "center"
                              when "PG" then "point_guard"
                              when "SG" then "shooting_guard"
                              when "SF" then "small_forward"
                              when "PF" then "power_forward"
                              else nil
                              end

            # Create player user
            player_email = "player_#{SecureRandom.hex(8)}@bdr-import.local"
            player_user = User.create!(
              email: player_email,
              password: SecureRandom.hex(16),
              name: player_name,
              position: mapped_position,
              birth_date: parse_date(player["birth"])
            )
            stats[:users_created] += 1

            # Add as team member if not exists
            begin
              unless TeamMember.exists?(team: team, user: player_user)
                TeamMember.create!(
                  team: team,
                  user: player_user,
                  jersey_number: player["number"].to_i,
                  role: "member",
                  position: player["position"],
                  status: "active",
                  joined_at: Time.current
                )
                stats[:players_created] += 1
              end
            rescue ActiveRecord::RecordInvalid => e
              # Skip duplicate jersey numbers or other validation errors
            end
          end
        rescue JSON::ParserError => e
          puts "  ⚠️  선수 파싱 실패: #{team_name}"
        end
      end

      # Link team to tournament
      tournament_uuid = tour_id_mapping[tour_id]
      if tournament_uuid && team
        tournament = Tournament.find_by(id: tournament_uuid)
        if tournament
          # Use actual bigint team id for existence check
          team_actual_id = team.attributes["id"]
          unless TournamentTeam.where(tournament_id: tournament.id, team_id: team_actual_id).exists?
            TournamentTeam.create!(
              tournament: tournament,
              team: team,
              status: "approved",
              payment_status: "paid",
              registered_by: team.captain
            )
            stats[:tournament_teams_created] += 1
            puts "  📋 대회 등록: #{team_name} → #{tournament.name}"
          end
        end
      end
    end

    # Summary
    puts "\n" + "=" * 60
    puts "임포트 완료!"
    puts "=" * 60
    puts "  대회 생성: #{stats[:tournaments_created]}개"
    puts "  대회 스킵: #{stats[:tournaments_skipped]}개"
    puts "  팀 생성: #{stats[:teams_created]}개"
    puts "  팀 스킵: #{stats[:teams_skipped]}개"
    puts "  대회-팀 연결: #{stats[:tournament_teams_created]}개"
    puts "  사용자 생성: #{stats[:users_created]}명"
    puts "  선수 등록: #{stats[:players_created]}명"
    puts "=" * 60
  end

  private

  def parse_datetime(value)
    return nil unless value.present?

    case value
    when String
      Time.zone.parse(value) rescue nil
    when Time, DateTime
      value.in_time_zone
    else
      nil
    end
  end

  def parse_date(value)
    return nil unless value.present?

    case value
    when String
      Date.parse(value) rescue nil
    when Date
      value
    when Time, DateTime
      value.to_date
    else
      nil
    end
  end
end
