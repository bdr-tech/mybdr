# frozen_string_literal: true

class UsersController < ApplicationController
  before_action :redirect_if_logged_in, only: [:new, :create]
  before_action :require_login, only: [:show, :edit, :update, :update_admin_mode]
  before_action :set_user, only: [:show, :edit, :update]
  before_action :authorize_user, only: [:edit, :update]

  # GET /signup
  def new
    @user = User.new
  end

  # POST /signup
  def create
    @user = User.new(user_params)

    if @user.save
      log_in(@user)
      flash[:success] = I18n.t("auth.signup_success")
      redirect_to root_path
    else
      render :new, status: :unprocessable_entity
    end
  end

  # GET /profile or /users/:id
  def show
  end

  # GET /profile/edit or /users/:id/edit
  def edit
  end

  # PATCH /profile or /users/:id
  def update
    if @user.update(user_update_params)
      flash[:success] = I18n.t("messages.updated")
      redirect_to profile_path
    else
      render :edit, status: :unprocessable_entity
    end
  end

  # POST /profile/admin_mode
  def update_admin_mode
    unless current_user.show_admin_mode?
      return respond_to do |format|
        format.json { render json: { success: false, error: "권한이 없습니다" }, status: :forbidden }
        format.html { redirect_to root_path, alert: "권한이 없습니다" }
      end
    end

    # Handle both JSON boolean (true/false) and string ("true"/"false") values
    admin_mode_value = ActiveModel::Type::Boolean.new.cast(params[:admin_mode])
    if current_user.update(prefer_admin_mode: admin_mode_value)
      respond_to do |format|
        format.turbo_stream
        format.json { render json: { success: true, admin_mode: current_user.prefer_admin_mode } }
        format.html { redirect_to root_path }
      end
    else
      respond_to do |format|
        format.json { render json: { success: false, error: "업데이트 실패" }, status: :unprocessable_entity }
        format.html { redirect_to root_path, alert: "업데이트 실패" }
      end
    end
  end

  private

  def set_user
    @user = if params[:id]
              User.find(params[:id])
            else
              current_user
            end
  end

  def authorize_user
    unless @user == current_user || current_user.admin?
      flash[:error] = I18n.t("messages.unauthorized")
      redirect_to root_path
    end
  end

  def redirect_if_logged_in
    redirect_to root_path if logged_in?
  end

  def user_params
    params.require(:user).permit(
      :email,
      :password,
      :password_confirmation,
      :name,
      :nickname,
      :phone
    )
  end

  def user_update_params
    params.require(:user).permit(
      :name,
      :nickname,
      :phone,
      :avatar,
      :position,
      :height,
      :weight,
      :birth_date,
      :city,
      :district,
      :bio,
      :bank_name,
      :bank_code,
      :account_number,
      :account_holder,
      :toss_id
    )
  end
end
