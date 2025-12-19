# frozen_string_literal: true

# 기존 uuid 필드를 URL 파라미터로 사용하는 Concern
# Tournament, Game, Team, TournamentMatch 등 이미 uuid 필드가 있는 모델에 사용
#
# 사용법:
#   class Tournament < ApplicationRecord
#     include HasUuid
#   end
#
#   # URL에서 UUID 사용
#   tournament_path(@tournament) # => /tournaments/550e8400-e29b-41d4-a716-446655440000
#
#   # 조회
#   Tournament.find_by_uuid("550e8400-e29b-41d4-a716-446655440000")
#
module HasUuid
  extend ActiveSupport::Concern

  included do
    # URL에서 uuid를 사용하도록 설정
    def to_param
      uuid
    end
  end

  class_methods do
    # uuid로 레코드 찾기
    def find_by_uuid(uuid)
      find_by(uuid: uuid)
    end

    def find_by_uuid!(uuid)
      find_by!(uuid: uuid)
    end
  end
end
