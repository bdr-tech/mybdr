# frozen_string_literal: true

class NotificationsController < ApplicationController
  before_action :require_login
  before_action :set_notification, only: [:show, :mark_as_read, :visit]

  # 알림 목록
  def index
    @notifications = current_user.notifications.recent.not_expired
    @notifications = filter_notifications(@notifications)
    @pagy, @notifications = pagy(@notifications, items: 20)
    @unread_count = current_user.notifications.unread.count
  end

  # 알림 상세
  def show
    @notification.mark_as_read! if @notification.unread?
  end

  # 드롭다운 (navbar용, 최근 알림 5개)
  def dropdown
    @notifications = current_user.notifications.recent.not_expired.limit(10)
    @unread_count = current_user.notifications.unread.count

    render partial: "notifications/dropdown", locals: {
      notifications: @notifications,
      unread_count: @unread_count
    }
  end

  # 읽음 처리
  def mark_as_read
    @notification.mark_as_read!

    respond_to do |format|
      format.html { redirect_back(fallback_location: notifications_path, notice: "읽음 처리되었습니다.") }
      format.json { render json: { success: true, unread_count: current_user.notifications.unread.count } }
    end
  end

  # 전체 읽음 처리
  def mark_all_as_read
    current_user.notifications.unread.update_all(status: :read, read_at: Time.current)

    respond_to do |format|
      format.html { redirect_back(fallback_location: notifications_path, notice: "모든 알림을 읽음 처리했습니다.") }
      format.json { render json: { success: true, unread_count: 0 } }
    end
  end

  # 알림 클릭 시 읽음 처리 후 리다이렉트
  def visit
    @notification.mark_as_read! if @notification.unread?
    redirect_to @notification.action_url.presence || notifications_path, allow_other_host: true
  end

  private

  def set_notification
    @notification = current_user.notifications.find(params[:id])
  end

  def filter_notifications(notifications)
    if params[:type].present?
      case params[:type]
      when "team"
        notifications.team_related
      when "game"
        notifications.game_related
      when "payment"
        notifications.payment_related
      when "tournament"
        notifications.tournament_related
      when "marketplace"
        notifications.marketplace_related
      when "memory"
        notifications.memory_related
      when "system"
        notifications.system_related
      else
        notifications
      end
    else
      notifications
    end
  end
end
