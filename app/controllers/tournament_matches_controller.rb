# frozen_string_literal: true

class TournamentMatchesController < ApplicationController
  before_action :require_login, except: [:show, :box_score]
  before_action :set_tournament
  before_action :set_match, only: [:show, :edit, :update, :destroy, :box_score, :start, :finish, :update_score]
  before_action :require_organizer, only: [:new, :create, :edit, :update, :destroy, :start, :finish, :update_score]

  def index
    @matches = @tournament.tournament_matches
                         .includes(:home_team, :away_team, :venue)
                         .order(scheduled_at: :asc)
  end

  def show
    @home_stats = @match.match_player_stats
                       .joins(:tournament_team_player)
                       .where(tournament_team_players: { tournament_team_id: @match.home_team_id })
                       .includes(tournament_team_player: :user)
                       .order(points: :desc)

    @away_stats = @match.match_player_stats
                       .joins(:tournament_team_player)
                       .where(tournament_team_players: { tournament_team_id: @match.away_team_id })
                       .includes(tournament_team_player: :user)
                       .order(points: :desc)
  end

  def new
    @match = @tournament.tournament_matches.build
    @teams = @tournament.tournament_teams.approved.includes(:team)
  end

  def create
    @match = @tournament.tournament_matches.build(match_params)

    if @match.save
      redirect_to tournament_tournament_match_path(@tournament, @match), notice: "경기가 생성되었습니다."
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
      redirect_to tournament_tournament_match_path(@tournament, @match), notice: "경기가 수정되었습니다."
    else
      @teams = @tournament.tournament_teams.approved.includes(:team)
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @match.destroy
    redirect_to tournament_tournament_matches_path(@tournament), notice: "경기가 삭제되었습니다."
  end

  # NBA 스타일 박스스코어
  def box_score
    @box_score = @match.generate_box_score

    @home_stats = @match.match_player_stats
                       .joins(:tournament_team_player)
                       .where(tournament_team_players: { tournament_team_id: @match.home_team_id })
                       .includes(tournament_team_player: :user)
                       .order(points: :desc)

    @away_stats = @match.match_player_stats
                       .joins(:tournament_team_player)
                       .where(tournament_team_players: { tournament_team_id: @match.away_team_id })
                       .includes(tournament_team_player: :user)
                       .order(points: :desc)

    respond_to do |format|
      format.html
      format.json { render json: @box_score }
    end
  end

  # 경기 시작
  def start
    @match.start!
    redirect_to tournament_tournament_match_path(@tournament, @match), notice: "경기가 시작되었습니다."
  end

  # 경기 종료
  def finish
    @match.finish!(
      home_final_score: params[:home_score].to_i,
      away_final_score: params[:away_score].to_i,
      mvp: params[:mvp_player_id].present? ? User.find(params[:mvp_player_id]) : nil
    )
    redirect_to tournament_tournament_match_path(@tournament, @match), notice: "경기가 종료되었습니다."
  end

  # 점수 업데이트 (라이브)
  def update_score
    @match.update_quarter_score!(
      team: params[:team].to_sym,
      quarter: params[:quarter],
      score: params[:score].to_i
    )

    respond_to do |format|
      format.html { redirect_to tournament_tournament_match_path(@tournament, @match) }
      format.json { render json: { success: true, match: @match.reload.as_json } }
    end
  end

  private

  def set_tournament
    @tournament = Tournament.find(params[:tournament_id])
  end

  def set_match
    @match = @tournament.tournament_matches.find_by!(uuid: params[:id])
  rescue ActiveRecord::RecordNotFound
    @match = @tournament.tournament_matches.find(params[:id])
  end

  def require_organizer
    unless @tournament.organizer_id == current_user.id
      redirect_to tournament_path(@tournament), alert: "권한이 없습니다."
    end
  end

  def match_params
    params.require(:tournament_match).permit(
      :home_team_id, :away_team_id,
      :round_name, :round_number, :match_number, :group_name,
      :bracket_position, :bracket_level,
      :scheduled_at, :venue_id, :court_number,
      :notes
    )
  end
end
