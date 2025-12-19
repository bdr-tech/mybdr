# frozen_string_literal: true

module Authentication
  extend ActiveSupport::Concern

  included do
    before_action :current_user
    helper_method :current_user, :logged_in?, :admin?
  end

  # Get current user from session
  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
  end

  # Check if user is logged in
  def logged_in?
    current_user.present?
  end

  # Check if current user is admin
  def admin?
    logged_in? && current_user.admin?
  end

  # Require user to be logged in
  def require_login
    unless logged_in?
      store_location
      flash[:warning] = I18n.t("messages.login_required")
      redirect_to login_path
    end
  end

  # Require user to be admin
  def require_admin
    unless admin?
      flash[:error] = I18n.t("messages.unauthorized")
      redirect_to root_path
    end
  end

  # Log in user
  def log_in(user)
    session[:user_id] = user.id
    user.update_column(:last_login_at, Time.current)
  end

  # Log out user
  def log_out
    session.delete(:user_id)
    @current_user = nil
  end

  # Remember the URL attempting to access
  def store_location
    session[:forwarding_url] = request.original_url if request.get?
  end

  # Redirect to stored URL or default
  def redirect_back_or(default)
    redirect_to(session[:forwarding_url] || default)
    session.delete(:forwarding_url)
  end

  # Membership check helpers
  def require_pro_membership
    unless logged_in? && current_user.subscription_active?
      flash[:error] = I18n.t("messages.pro_required", default: "유료 멤버십이 필요합니다.")
      redirect_to membership_path
    end
  end

  def require_pickup_host
    unless logged_in? && current_user.can_access_pickup_menu?
      flash[:error] = I18n.t("messages.pickup_host_required", default: "픽업게임 개최자 권한이 필요합니다.")
      redirect_to membership_path
    end
  end

  def require_tournament_admin
    unless logged_in? && current_user.can_create_tournament?
      flash[:error] = I18n.t("messages.tournament_admin_required", default: "대회관리자 권한이 필요합니다.")
      redirect_to membership_path
    end
  end
end
