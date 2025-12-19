# frozen_string_literal: true

Rails.application.config.middleware.use OmniAuth::Builder do
  # Google OAuth2
  provider :google_oauth2,
           ENV["GOOGLE_CLIENT_ID"],
           ENV["GOOGLE_CLIENT_SECRET"],
           {
             scope: "email,profile",
             prompt: "select_account",
             image_aspect_ratio: "square",
             image_size: 200
           }

  # Kakao (개발중 - 추후 활성화)
  # provider :kakao,
  #          ENV["KAKAO_CLIENT_ID"],
  #          client_secret: ENV["KAKAO_CLIENT_SECRET"]
end

# OmniAuth configuration
OmniAuth.config.allowed_request_methods = [ :post, :get ]
OmniAuth.config.silence_get_warning = true
