# frozen_string_literal: true

class OnboardingController < ApplicationController
  def index
    # 이미 완료했거나 로그인한 경우 홈으로
    redirect_to root_path if session[:onboarding_completed] || logged_in?
  end

  def complete
    session[:onboarding_completed] = true
    head :ok
  end
end
