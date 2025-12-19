# frozen_string_literal: true

# UUID 기반 public_id를 제공하는 Concern
# 모델에 include하면 URL에서 숫자 ID 대신 UUID를 사용할 수 있습니다.
#
# 사용법:
#   class Post < ApplicationRecord
#     include HasPublicId
#   end
#
#   # URL에서 UUID 사용
#   post_path(@post) # => /posts/550e8400-e29b-41d4-a716-446655440000
#
#   # 조회
#   Post.find_by_public_id("550e8400-e29b-41d4-a716-446655440000")
#
module HasPublicId
  extend ActiveSupport::Concern

  included do
    # URL에서 public_id를 사용하도록 설정
    def to_param
      public_id
    end
  end

  class_methods do
    # public_id로 레코드 찾기
    def find_by_public_id(public_id)
      find_by(public_id: public_id)
    end

    def find_by_public_id!(public_id)
      find_by!(public_id: public_id)
    end
  end
end
