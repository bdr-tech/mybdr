# frozen_string_literal: true

class CourtsController < ApplicationController
  def index
    courts = Court.active

    # 검색
    if params[:q].present?
      courts = courts.where("name ILIKE :q OR address ILIKE :q", q: "%#{params[:q]}%")
    end

    # 지역 필터
    courts = courts.in_city(params[:city]) if params[:city].present?
    courts = courts.in_district(params[:district]) if params[:district].present?

    # 실내/실외 필터
    courts = courts.indoor if params[:indoor] == "1"
    courts = courts.outdoor if params[:outdoor] == "1"

    # 주차 가능 필터
    courts = courts.with_parking if params[:parking] == "1"

    # 위치 기반 정렬
    if params[:lat].present? && params[:lng].present?
      lat = params[:lat].to_f
      lng = params[:lng].to_f
      courts = courts.nearby(lat, lng, radius_km: params[:radius]&.to_i || 10)
    end

    @pagy, @courts = pagy(courts.order(:name), items: 12)

    # 지도 표시용 데이터
    @map_courts = courts.where.not(latitude: nil, longitude: nil).limit(100)
  end

  def show
    @court = Court.find(params[:id])
    @upcoming_games = @court.games.upcoming.limit(5)
  end
end
