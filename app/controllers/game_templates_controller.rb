# frozen_string_literal: true

class GameTemplatesController < ApplicationController
  before_action :require_login
  before_action :set_template, only: [:show, :edit, :update, :destroy, :use]

  def index
    @my_templates = current_user.game_templates.order(use_count: :desc)
    @public_templates = GameTemplate.public_templates
                                    .where.not(user: current_user)
                                    .includes(:user, :court)
                                    .order(use_count: :desc)
                                    .limit(10)
  end

  def show
  end

  def new
    @template = current_user.game_templates.build
    @courts = Court.active.order(:name)
  end

  def create
    @template = current_user.game_templates.build(template_params)

    if @template.save
      redirect_to game_templates_path, notice: "템플릿이 생성되었습니다."
    else
      @courts = Court.active.order(:name)
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @courts = Court.active.order(:name)
  end

  def update
    if @template.update(template_params)
      redirect_to game_templates_path, notice: "템플릿이 수정되었습니다."
    else
      @courts = Court.active.order(:name)
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @template.destroy
    redirect_to game_templates_path, notice: "템플릿이 삭제되었습니다."
  end

  # 템플릿 사용 (경기 생성 페이지로 이동)
  def use
    redirect_to new_game_path(template_id: @template.id)
  end

  private

  def set_template
    @template = current_user.game_templates.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    # 공개 템플릿인 경우
    @template = GameTemplate.public_templates.find(params[:id])
  end

  def template_params
    params.require(:game_template).permit(
      :name, :game_type, :court_id, :is_public,
      default_settings: [
        :max_participants, :min_participants, :fee_per_person,
        :duration_hours, :uniform_home_color, :uniform_away_color,
        :skill_level, :requirements, :description
      ]
    )
  end
end
