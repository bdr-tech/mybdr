# frozen_string_literal: true

module Api
  module V1
    class MatchStatsController < BaseController
      before_action :require_tournament!, only: [:create, :update, :destroy, :bulk_create]
      before_action :set_match, only: [:show, :create, :update, :destroy, :bulk_create]
      before_action :set_stat, only: [:update, :destroy]

      # GET /api/v1/matches/:match_id/stats
      # 경기의 모든 선수 스탯 조회
      def show
        stats = @match.match_player_stats.includes(tournament_team_player: :user)

        render_success({
          match: match_summary(@match),
          home_team: team_stats(@match.home_team, stats),
          away_team: team_stats(@match.away_team, stats)
        })
      end

      # POST /api/v1/matches/:match_id/stats
      # 개별 선수 스탯 입력
      def create
        player = find_or_create_tournament_team_player

        stat = @match.match_player_stats.find_or_initialize_by(
          tournament_team_player: player
        )
        stat.assign_attributes(stat_params)

        if stat.save
          render_success(stat_response(stat), status: :created)
        else
          render_error("스탯 저장 실패", :unprocessable_entity, stat.errors.full_messages)
        end
      end

      # POST /api/v1/matches/:match_id/stats/bulk
      # 여러 선수 스탯 일괄 입력
      def bulk_create
        results = { created: [], updated: [], errors: [] }

        ActiveRecord::Base.transaction do
          params[:stats].each do |stat_data|
            process_bulk_stat(stat_data, results)
          end

          # 에러가 있으면 롤백
          raise ActiveRecord::Rollback if results[:errors].any? && params[:strict_mode]
        end

        if results[:errors].empty?
          render_success({
            created: results[:created].count,
            updated: results[:updated].count,
            stats: results[:created] + results[:updated]
          }, status: :created)
        else
          render json: {
            success: false,
            created: results[:created].count,
            updated: results[:updated].count,
            errors: results[:errors]
          }, status: :multi_status
        end
      end

      # PATCH /api/v1/matches/:match_id/stats/:id
      def update
        if @stat.update(stat_params)
          render_success(stat_response(@stat))
        else
          render_error("스탯 수정 실패", :unprocessable_entity, @stat.errors.full_messages)
        end
      end

      # DELETE /api/v1/matches/:match_id/stats/:id
      def destroy
        @stat.destroy
        render_success({ message: "삭제되었습니다" })
      end

      # GET /api/v1/tournaments/:tournament_id/player_stats
      # 대회 전체 선수 통계
      def tournament_stats
        tournament = Tournament.find(params[:tournament_id])
        stats = MatchPlayerStat.joins(tournament_team_player: :tournament_team)
                               .where(tournament_teams: { tournament_id: tournament.id })
                               .includes(tournament_team_player: [:user, :tournament_team])

        # 집계
        aggregated = stats.group_by { |s| s.tournament_team_player.user_id }.map do |user_id, player_stats|
          aggregate_player_stats(player_stats)
        end

        render_success({
          tournament: { id: tournament.id, name: tournament.name },
          players: aggregated.sort_by { |p| -p[:total_points] }
        })
      end

      # GET /api/v1/players/:user_id/stats
      # 선수 개인 통산 기록
      def player_career_stats
        user = User.find(params[:user_id])
        stats = MatchPlayerStat.joins(:tournament_team_player)
                               .where(tournament_team_players: { user_id: user.id })
                               .includes(tournament_match: :tournament)

        by_tournament = stats.group_by { |s| s.tournament_match.tournament_id }

        render_success({
          player: { id: user.id, name: user.display_name },
          career_totals: aggregate_player_stats(stats),
          by_tournament: by_tournament.map do |tournament_id, t_stats|
            tournament = t_stats.first.tournament_match.tournament
            {
              tournament: { id: tournament.id, name: tournament.name },
              stats: aggregate_player_stats(t_stats)
            }
          end
        })
      end

      private

      def set_match
        @match = if current_tournament
                   current_tournament.tournament_matches.find_by!(uuid: params[:match_id])
                 else
                   TournamentMatch.find_by!(uuid: params[:match_id])
                 end
      end

      def set_stat
        @stat = @match.match_player_stats.find(params[:id])
      end

      def stat_params
        params.permit(
          :is_starter, :minutes_played,
          :points, :field_goals_made, :field_goals_attempted,
          :three_pointers_made, :three_pointers_attempted,
          :free_throws_made, :free_throws_attempted,
          :offensive_rebounds, :defensive_rebounds,
          :assists, :steals, :blocks, :turnovers, :personal_fouls,
          :plus_minus
        )
      end

      def find_or_create_tournament_team_player
        # tournament_team_player_id로 직접 찾기
        if params[:tournament_team_player_id]
          return TournamentTeamPlayer.find(params[:tournament_team_player_id])
        end

        # user_id + team으로 찾기
        team = if params[:team] == "home"
                 @match.home_team
               elsif params[:team] == "away"
                 @match.away_team
               else
                 TournamentTeam.find(params[:tournament_team_id])
               end

        user = User.find(params[:user_id])

        team.tournament_team_players.find_or_create_by!(user: user) do |ttp|
          ttp.jersey_number = params[:jersey_number]
          ttp.position = params[:position]
        end
      end

      def process_bulk_stat(stat_data, results)
        player = find_player_for_bulk(stat_data)
        return results[:errors] << { data: stat_data, error: "선수를 찾을 수 없습니다" } unless player

        stat = @match.match_player_stats.find_or_initialize_by(tournament_team_player: player)
        is_new = stat.new_record?

        stat.assign_attributes(stat_data.slice(*permitted_stat_keys))

        if stat.save
          response = stat_response(stat)
          is_new ? results[:created] << response : results[:updated] << response
        else
          results[:errors] << { data: stat_data, error: stat.errors.full_messages }
        end
      end

      def find_player_for_bulk(data)
        if data[:tournament_team_player_id]
          TournamentTeamPlayer.find_by(id: data[:tournament_team_player_id])
        elsif data[:user_id] && data[:tournament_team_id]
          TournamentTeamPlayer.find_by(user_id: data[:user_id], tournament_team_id: data[:tournament_team_id])
        elsif data[:jersey_number] && data[:team]
          team = data[:team] == "home" ? @match.home_team : @match.away_team
          team&.tournament_team_players&.find_by(jersey_number: data[:jersey_number])
        end
      end

      def permitted_stat_keys
        %w[
          is_starter minutes_played points
          field_goals_made field_goals_attempted
          three_pointers_made three_pointers_attempted
          free_throws_made free_throws_attempted
          offensive_rebounds defensive_rebounds
          assists steals blocks turnovers personal_fouls plus_minus
        ]
      end

      def match_summary(match)
        {
          id: match.id,
          uuid: match.uuid,
          status: match.status,
          scheduled_at: match.scheduled_at,
          home_score: match.home_score,
          away_score: match.away_score
        }
      end

      def team_stats(team, all_stats)
        return nil unless team

        team_player_ids = team.tournament_team_players.pluck(:id)
        stats = all_stats.select { |s| team_player_ids.include?(s.tournament_team_player_id) }

        {
          team: { id: team.team.id, name: team.team.name },
          players: stats.map { |s| stat_response(s) }
        }
      end

      def stat_response(stat)
        {
          id: stat.id,
          player: {
            id: stat.user.id,
            name: stat.user.display_name,
            jersey_number: stat.tournament_team_player.jersey_number
          },
          is_starter: stat.is_starter,
          minutes: stat.minutes_played,
          points: stat.points,
          rebounds: stat.total_rebounds,
          assists: stat.assists,
          steals: stat.steals,
          blocks: stat.blocks,
          turnovers: stat.turnovers,
          fouls: stat.personal_fouls,
          fg: "#{stat.field_goals_made}/#{stat.field_goals_attempted}",
          three_pt: "#{stat.three_pointers_made}/#{stat.three_pointers_attempted}",
          ft: "#{stat.free_throws_made}/#{stat.free_throws_attempted}",
          efficiency: stat.efficiency
        }
      end

      def aggregate_player_stats(stats)
        return {} if stats.empty?

        first = stats.first
        user = first.tournament_team_player.user

        {
          player_id: user.id,
          player_name: user.display_name,
          games_played: stats.count,
          total_points: stats.sum(&:points),
          avg_points: (stats.sum(&:points).to_f / stats.count).round(1),
          total_rebounds: stats.sum(&:total_rebounds),
          avg_rebounds: (stats.sum(&:total_rebounds).to_f / stats.count).round(1),
          total_assists: stats.sum(&:assists),
          avg_assists: (stats.sum(&:assists).to_f / stats.count).round(1),
          total_steals: stats.sum(&:steals),
          total_blocks: stats.sum(&:blocks),
          total_turnovers: stats.sum(&:turnovers),
          fg_made: stats.sum(&:field_goals_made),
          fg_attempted: stats.sum(&:field_goals_attempted),
          three_made: stats.sum(&:three_pointers_made),
          three_attempted: stats.sum(&:three_pointers_attempted),
          ft_made: stats.sum(&:free_throws_made),
          ft_attempted: stats.sum(&:free_throws_attempted)
        }
      end
    end
  end
end
