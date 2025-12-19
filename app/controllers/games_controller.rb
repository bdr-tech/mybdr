# frozen_string_literal: true

class GamesController < ApplicationController
  before_action :require_login, except: [:index, :show]
  before_action :set_game, only: [:show, :edit, :update, :destroy, :clone, :publish, :cancel]
  before_action :require_organizer, only: [:edit, :update, :destroy, :clone, :publish, :cancel]

  def index
    games = Game.includes(:organizer, :court)
                .active
                .upcoming

    # 필터링
    games = games.in_city(params[:city]) if params[:city].present?
    games = games.by_game_type(params[:game_type]) if params[:game_type].present?

    if params[:date].present?
      date = Date.parse(params[:date])
      games = games.where(scheduled_at: date.beginning_of_day..date.end_of_day)
    end

    @pagy, @games = pagy(games, items: 12)
  end

  def show
    @game.increment!(:views_count)
    @applications = @game.game_applications.includes(:user).order(created_at: :desc) if @game.host?(current_user) || current_user&.is_admin?
    @my_application = @game.game_applications.find_by(user: current_user) if logged_in?
  end

  def new
    @game = current_user.organized_games.build
    @game.game_type = params[:game_type] || :pickup

    # 템플릿에서 생성
    if params[:template_id].present?
      @template = current_user.game_templates.find(params[:template_id])
      apply_template_settings(@template)
    end

    # 복제해서 생성
    if params[:clone_from].present?
      @source_game = Game.find(params[:clone_from])
      apply_clone_settings(@source_game) if @source_game.host?(current_user)
    end
  end

  def create
    @game = current_user.organized_games.build(game_params)

    if @game.save
      # 반복 경기 생성
      if params[:create_recurring] == "1" && @game.is_recurring?
        @game.create_recurring_games!(count: params[:recurring_count].to_i.clamp(1, 12))
      end

      redirect_to @game, notice: "경기가 생성되었습니다."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @courts = Court.active.order(:name)
  end

  def update
    if @game.update(game_params)
      redirect_to @game, notice: "경기가 수정되었습니다."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    if @game.game_applications.exists?
      redirect_to @game, alert: "신청자가 있는 경기는 삭제할 수 없습니다."
    else
      @game.destroy
      redirect_to games_path, notice: "경기가 삭제되었습니다."
    end
  end

  # 경기 복제
  def clone
    @new_game = @game.clone!(
      new_scheduled_at: params[:scheduled_at].present? ? Time.zone.parse(params[:scheduled_at]) : @game.scheduled_at + 1.week,
      new_title: params[:title]
    )
    redirect_to edit_game_path(@new_game), notice: "경기가 복제되었습니다. 일정을 확인해주세요."
  end

  # 경기 공개
  def publish
    if @game.status_draft?
      @game.update!(status: :published)
      redirect_to @game, notice: "경기가 공개되었습니다."
    else
      redirect_to @game, alert: "이미 공개된 경기입니다."
    end
  end

  # 경기 취소
  def cancel
    if @game.update(status: :cancelled)
      # TODO: 참가자들에게 알림 발송
      redirect_to @game, notice: "경기가 취소되었습니다."
    else
      redirect_to @game, alert: "경기 취소에 실패했습니다."
    end
  end

  # 내 경기 목록
  def my_games
    @pagy_organized, @organized = pagy(
      current_user.organized_games.order(scheduled_at: :desc),
      page_param: :page,
      items: 10
    )
    @pagy_applied, @applied = pagy(
      current_user.applied_games.order(scheduled_at: :desc),
      page_param: :applied_page,
      items: 10
    )
  end

  # 템플릿으로 저장
  def save_as_template
    @game = Game.find(params[:id])

    if @game.host?(current_user)
      @template = @game.save_as_template!(
        name: params[:template_name],
        is_public: params[:is_public] == "1"
      )
      redirect_to @game, notice: "템플릿으로 저장되었습니다."
    else
      redirect_to @game, alert: "권한이 없습니다."
    end
  rescue ActiveRecord::RecordInvalid => e
    redirect_to @game, alert: e.message
  end

  private

  def set_game
    @game = Game.find_by!(uuid: params[:id]) || Game.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    @game = Game.find(params[:id])
  end

  def require_organizer
    unless @game.host?(current_user)
      redirect_to games_path, alert: "권한이 없습니다."
    end
  end

  def game_params
    params.require(:game).permit(
      :title, :game_type, :description,
      :court_id, :city, :district, :venue_name, :venue_address,
      :scheduled_at, :duration_hours,
      :max_participants, :min_participants, :fee_per_person, :skill_level,
      :uniform_home_color, :uniform_away_color,
      :requirements, :notes, :allow_guests,
      :is_recurring, :recurrence_rule
    )
  end

  def apply_template_settings(template)
    settings = template.default_settings.symbolize_keys
    @game.assign_attributes(
      game_type: template.game_type,
      court_id: template.court_id,
      max_participants: settings[:max_participants],
      min_participants: settings[:min_participants],
      fee_per_person: settings[:fee_per_person],
      duration_hours: settings[:duration_hours],
      uniform_home_color: settings[:uniform_home_color],
      uniform_away_color: settings[:uniform_away_color],
      skill_level: settings[:skill_level],
      requirements: settings[:requirements],
      description: settings[:description]
    )
  end

  def apply_clone_settings(source)
    @game.assign_attributes(
      source.attributes.except(
        "id", "game_id", "uuid", "created_at", "updated_at",
        "status", "current_participants", "applications_count", "views_count"
      )
    )
    @game.cloned_from = source
    @game.scheduled_at = source.scheduled_at + 1.week
  end
end
