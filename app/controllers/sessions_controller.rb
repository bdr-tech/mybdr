# frozen_string_literal: true

class SessionsController < ApplicationController
  before_action :redirect_if_logged_in, only: [:new, :create]

  # GET /login
  def new
  end

  # POST /login
  def create
    user = User.find_by(email: params[:email]&.downcase)

    if user&.authenticate(params[:password])
      if user.active?
        log_in(user)
        flash[:success] = I18n.t("auth.login_success")
        redirect_back_or(root_path)
      else
        flash.now[:error] = I18n.t("auth.account_suspended", default: "계정이 정지되었습니다.")
        render :new, status: :unprocessable_entity
      end
    else
      flash.now[:error] = I18n.t("auth.invalid_credentials")
      render :new, status: :unprocessable_entity
    end
  end

  # DELETE /logout
  def destroy
    log_out
    flash[:success] = I18n.t("auth.logout_success")
    redirect_to root_path, status: :see_other
  end

  # GET /dev_login/:id (Development Only)
  def dev_login
    return head :not_found unless Rails.env.development? || Rails.env.test?

    user = User.find_by(id: params[:id])
    if user
      log_in(user)
      flash[:success] = "[DEV] #{user.display_name}(으)로 로그인되었습니다"
      redirect_to root_path
    else
      flash[:error] = "[DEV] 사용자를 찾을 수 없습니다"
      redirect_to login_path
    end
  end

  private

  def redirect_if_logged_in
    redirect_to root_path if logged_in?
  end
end
