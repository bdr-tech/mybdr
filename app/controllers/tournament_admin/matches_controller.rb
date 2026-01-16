# frozen_string_literal: true

module TournamentAdmin
  class MatchesController < BaseController
    before_action :set_match, only: [:show, :edit, :update, :destroy]

    # 일정/대진표 관리 메인
    def index
      @matches = @tournament.tournament_matches
                           .includes(home_team: :team, away_team: :team)
                           .order(round_number: :asc, match_number: :asc)
      @teams = @tournament.tournament_teams.approved.includes(:team)
      @groups = @teams.where.not(group_name: nil).group_by(&:group_name)
    end

    def show
    end

    def new
      @match = @tournament.tournament_matches.build
      @teams = @tournament.tournament_teams.approved.includes(:team)
    end

    def create
      @match = @tournament.tournament_matches.build(match_params)

      if @match.save
        redirect_to tournament_admin_tournament_matches_path(@tournament),
                    notice: "경기가 생성되었습니다."
      else
        @teams = @tournament.tournament_teams.approved.includes(:team)
        render :new, status: :unprocessable_entity
      end
    end

    def edit
      @teams = @tournament.tournament_teams.approved.includes(:team)
    end

    def update
      if @match.update(match_params)
        redirect_to tournament_admin_tournament_matches_path(@tournament),
                    notice: "경기가 수정되었습니다."
      else
        @teams = @tournament.tournament_teams.approved.includes(:team)
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @match.destroy
      redirect_to tournament_admin_tournament_matches_path(@tournament),
                  notice: "경기가 삭제되었습니다."
    end

    # =========================================================================
    # 대진표 생성/관리
    # =========================================================================

    # 대진표 자동 생성
    def generate_bracket
      service = BracketGeneratorService.new(@tournament)

      if service.generate!
        redirect_to tournament_admin_tournament_matches_path(@tournament),
                    notice: "대진표가 생성되었습니다."
      else
        redirect_to tournament_admin_tournament_matches_path(@tournament),
                    alert: service.errors.join(", ")
      end
    end

    # 대진표 초기화
    def clear_bracket
      service = BracketGeneratorService.new(@tournament)
      service.clear_bracket!

      redirect_to tournament_admin_tournament_matches_path(@tournament),
                  notice: "대진표가 초기화되었습니다."
    end

    # =========================================================================
    # 조 추첨
    # =========================================================================

    # 조 추첨 페이지
    def draw
      @teams = @tournament.tournament_teams.approved.includes(:team).order(:seed_number, :created_at)
      @groups = @teams.where.not(group_name: nil).group_by(&:group_name)
    end

    # 조 추첨 실행
    def perform_draw
      group_count = params[:group_count].to_i
      seeded_team_ids = params[:seeded_teams]&.reject(&:blank?)&.map(&:to_i) || []

      if group_count < 2
        redirect_to draw_tournament_admin_tournament_matches_path(@tournament),
                    alert: "최소 2개 조가 필요합니다."
        return
      end

      service = BracketGeneratorService.new(@tournament)

      if service.draw_groups!(group_count: group_count, seeded_teams: seeded_team_ids)
        redirect_to draw_tournament_admin_tournament_matches_path(@tournament),
                    notice: "조 추첨이 완료되었습니다."
      else
        redirect_to draw_tournament_admin_tournament_matches_path(@tournament),
                    alert: "조 추첨에 실패했습니다."
      end
    end

    # 조 추첨 초기화
    def reset_draw
      @tournament.tournament_teams.update_all(group_name: nil, seed_number: nil)
      redirect_to draw_tournament_admin_tournament_matches_path(@tournament),
                  notice: "조 추첨이 초기화되었습니다."
    end

    # 수동 조 배치
    def assign_group
      team = @tournament.tournament_teams.find(params[:team_id])
      team.update!(group_name: params[:group_name])

      respond_to do |format|
        format.html { redirect_to draw_tournament_admin_tournament_matches_path(@tournament) }
        format.json { render json: { success: true } }
      end
    end

    # =========================================================================
    # 시드 배정
    # =========================================================================

    def seeds
      @teams = @tournament.tournament_teams.approved.includes(:team).order(:seed_number, :created_at)
    end

    def update_seeds
      seed_data = params[:seeds] || {}

      seed_data.each do |team_id, seed_number|
        team = @tournament.tournament_teams.find_by(id: team_id)
        team&.update!(seed_number: seed_number.presence)
      end

      redirect_to seeds_tournament_admin_tournament_matches_path(@tournament),
                  notice: "시드가 업데이트되었습니다."
    end

    # =========================================================================
    # 일괄 일정 등록
    # =========================================================================

    def bulk_schedule
      @matches = @tournament.tournament_matches
                           .where(scheduled_at: nil)
                           .includes(home_team: :team, away_team: :team)
                           .order(round_number: :asc, match_number: :asc)
    end

    def update_bulk_schedule
      schedule_data = params[:schedules] || {}

      schedule_data.each do |match_id, data|
        match = @tournament.tournament_matches.find_by(id: match_id)
        next unless match

        match.update!(
          scheduled_at: data[:scheduled_at],
          venue_name: data[:venue_name],
          court_number: data[:court_number]
        )
      end

      redirect_to tournament_admin_tournament_matches_path(@tournament),
                  notice: "일정이 업데이트되었습니다."
    end

    private

    def set_match
      @match = @tournament.tournament_matches.find(params[:id])
    end

    def match_params
      params.require(:tournament_match).permit(
        :home_team_id, :away_team_id,
        :round_name, :round_number, :match_number,
        :group_name, :bracket_position, :bracket_level,
        :scheduled_at, :venue_id, :venue_name, :court_number,
        :notes, :status
      )
    end
  end
end
