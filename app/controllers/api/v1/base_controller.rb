# frozen_string_literal: true

module Api
  module V1
    class BaseController < ActionController::API
      include ActionController::HttpAuthentication::Token::ControllerMethods

      before_action :authenticate_api_token!

      rescue_from ActiveRecord::RecordNotFound, with: :not_found
      rescue_from ActiveRecord::RecordInvalid, with: :unprocessable_entity
      rescue_from ActionController::ParameterMissing, with: :bad_request

      private

      def authenticate_api_token!
        authenticate_or_request_with_http_token do |token, _options|
          # API 토큰 검증 (Tournament의 api_token 또는 시스템 토큰)
          @current_tournament = Tournament.find_by(api_token: token)
          @api_authenticated = @current_tournament.present? || valid_system_token?(token)
        end
      end

      def valid_system_token?(token)
        # 환경변수로 설정된 시스템 API 토큰
        system_token = ENV.fetch("BDR_API_TOKEN", nil)
        system_token.present? && ActiveSupport::SecurityUtils.secure_compare(token, system_token)
      end

      def current_tournament
        @current_tournament
      end

      def require_tournament!
        render_error("대회 토큰이 필요합니다", :unauthorized) unless current_tournament
      end

      def render_success(data = {}, status: :ok)
        render json: { success: true, data: data }, status: status
      end

      def render_error(message, status = :unprocessable_entity, errors = nil)
        response = { success: false, error: message }
        response[:errors] = errors if errors.present?
        render json: response, status: status
      end

      def not_found(exception)
        render_error(exception.message, :not_found)
      end

      def unprocessable_entity(exception)
        render_error(exception.message, :unprocessable_entity, exception.record&.errors&.full_messages)
      end

      def bad_request(exception)
        render_error(exception.message, :bad_request)
      end
    end
  end
end
