# frozen_string_literal: true

class HomeController < ApplicationController
  def index
    # 온보딩 미완료 + 비로그인 시 온보딩으로 리다이렉트
    if !session[:onboarding_completed] && !logged_in?
      return redirect_to onboarding_path
    end

    # 추천 경기 (모집중, 최대 3개)
    @recommended_games = Game.recruiting.upcoming.limit(3)

    # 인기 대회 (참가 모집중, 최대 2개)
    @popular_tournaments = Tournament.registering.upcoming.limit(2)

    if logged_in?
      # 로그인 사용자용: 참여 가능 경기 수
      @available_games_count = Game.recruiting.upcoming.count
    end
  end
end
