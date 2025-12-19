# frozen_string_literal: true

class OmniauthCallbacksController < ApplicationController
  skip_before_action :verify_authenticity_token, only: [ :google_oauth2, :kakao, :failure ]

  def google_oauth2
    auth = request.env["omniauth.auth"]
    user = find_or_create_user_from_oauth(auth)

    if user.persisted?
      session[:user_id] = user.id
      flash[:notice] = "Google 계정으로 로그인되었습니다."
      redirect_to root_path
    else
      flash[:alert] = "로그인에 실패했습니다: #{user.errors.full_messages.join(', ')}"
      redirect_to login_path
    end
  end

  def kakao
    # 카카오 OAuth 콜백 (개발중)
    flash[:alert] = "카카오 로그인은 현재 개발 중입니다."
    redirect_to login_path
  end

  def failure
    flash[:alert] = "소셜 로그인에 실패했습니다: #{params[:message]}"
    redirect_to login_path
  end

  private

  def find_or_create_user_from_oauth(auth)
    # 이미 OAuth로 가입된 사용자 찾기
    user = User.find_by(provider: auth.provider, uid: auth.uid)
    return user if user

    # 같은 이메일로 가입된 사용자 찾기
    user = User.find_by(email: auth.info.email)

    if user
      # 기존 사용자에 OAuth 정보 연결
      user.update(
        provider: auth.provider,
        uid: auth.uid,
        oauth_token: auth.credentials.token,
        oauth_expires_at: auth.credentials.expires_at ? Time.at(auth.credentials.expires_at) : nil
      )
      return user
    end

    # 새 사용자 생성
    User.create(
      provider: auth.provider,
      uid: auth.uid,
      email: auth.info.email,
      name: auth.info.name,
      profile_image_url: auth.info.image,
      oauth_token: auth.credentials.token,
      oauth_expires_at: auth.credentials.expires_at ? Time.at(auth.credentials.expires_at) : nil,
      password: SecureRandom.hex(16)  # 임시 비밀번호 생성
    )
  end
end
