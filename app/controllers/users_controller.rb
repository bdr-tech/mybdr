# frozen_string_literal: true

class UsersController < ApplicationController
  before_action :redirect_if_logged_in, only: [:new, :create]
  before_action :require_login, only: [:show, :edit, :update]
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
