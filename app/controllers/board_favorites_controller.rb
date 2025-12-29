# frozen_string_literal: true

class BoardFavoritesController < ApplicationController
  before_action :require_login

  def create
    category = params[:category]

    unless CommunityPost::CATEGORIES.include?(category)
      return render json: { success: false, error: "유효하지 않은 카테고리입니다" }, status: :unprocessable_entity
    end

    @favorite = current_user.board_favorites.build(category: category)

    if @favorite.save
      respond_to do |format|
        format.turbo_stream
        format.json { render json: { success: true, category: category } }
      end
    else
      respond_to do |format|
        format.turbo_stream { render turbo_stream: turbo_stream.replace("flash", partial: "shared/flash", locals: { message: @favorite.errors.full_messages.first, type: "error" }) }
        format.json { render json: { success: false, error: @favorite.errors.full_messages.first }, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    category = params[:category]
    @favorite = current_user.board_favorites.find_by(category: category)

    if @favorite&.destroy
      respond_to do |format|
        format.turbo_stream
        format.json { render json: { success: true, category: category } }
      end
    else
      respond_to do |format|
        format.turbo_stream { render turbo_stream: turbo_stream.replace("flash", partial: "shared/flash", locals: { message: "즐겨찾기를 찾을 수 없습니다", type: "error" }) }
        format.json { render json: { success: false, error: "즐겨찾기를 찾을 수 없습니다" }, status: :not_found }
      end
    end
  end

  private

  def require_login
    unless logged_in?
      respond_to do |format|
        format.turbo_stream { redirect_to login_path }
        format.json { render json: { success: false, error: "로그인이 필요합니다" }, status: :unauthorized }
      end
    end
  end
end
