# frozen_string_literal: true

class GameApplicationsController < ApplicationController
  before_action :require_login
  before_action :set_game
  before_action :set_application, only: [:show, :approve, :reject, :cancel, :cancel_redirect, :mark_paid]
  before_action :require_organizer, only: [:approve, :reject, :mark_paid]

  # 신청하기
  def create
    unless @game.can_apply?(current_user)
      redirect_to @game, alert: "신청할 수 없는 경기입니다."
      return
    end

    @application = @game.game_applications.build(application_params)
    @application.user = current_user

    if @application.save
      # 호스트에게 알림 전송
      Notification.create_game_application_received!(game: @game, applicant: current_user)
      redirect_to @game, notice: "신청이 완료되었습니다."
    else
      redirect_to @game, alert: @application.errors.full_messages.join(", ")
    end
  end

  # 내 신청 상세
  def show
    unless @application.user == current_user || @game.host?(current_user) || current_user&.is_admin?
      redirect_to @game, alert: "권한이 없습니다."
    end
  end

  # 승인
  def approve
    @application.approve!
    # 신청자에게 알림 전송
    Notification.create_game_application_approved!(game: @game, applicant: @application.user)
    redirect_to @game, notice: "#{@application.user.display_name}님의 신청을 승인했습니다."
  end

  # 거절
  def reject
    @application.reject!(reason: params[:reason])
    # 신청자에게 알림 전송
    Notification.create_game_application_rejected!(game: @game, applicant: @application.user, reason: params[:reason])
    redirect_to @game, notice: "신청을 거절했습니다."
  end

  # 취소 (본인)
  def cancel
    if @application.user == current_user
      @application.cancel!
      redirect_to @game, notice: "신청이 취소되었습니다."
    else
      redirect_to @game, alert: "권한이 없습니다."
    end
  end

  # GET 요청으로 cancel이 들어왔을 때 경기 상세 페이지로 리다이렉트
  def cancel_redirect
    redirect_to game_path(@game), alert: "신청 취소는 버튼을 클릭해주세요."
  end

  # 결제 완료 처리
  def mark_paid
    @application.mark_as_paid!(method: params[:method] || "transfer")
    redirect_to @game, notice: "결제 확인되었습니다."
  end

  # 참석 확인
  def mark_attended
    if @game.host?(current_user)
      @application.mark_attended!
      redirect_to @game, notice: "참석 확인되었습니다."
    else
      redirect_to @game, alert: "경기 호스트만 참석 확인할 수 있습니다."
    end
  end

  private

  def set_game
    @game = Game.find_by!(uuid: params[:game_id]) || Game.find(params[:game_id])
  rescue ActiveRecord::RecordNotFound
    @game = Game.find(params[:game_id])
  end

  def set_application
    @application = @game.game_applications.find(params[:id])
  end

  def require_organizer
    return if @game.host?(current_user)

    redirect_to @game, alert: "경기 호스트만 승인/거절할 수 있습니다."
  end

  def application_params
    params.require(:game_application).permit(:message, :position, :is_guest)
  end
end
