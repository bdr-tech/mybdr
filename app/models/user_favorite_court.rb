class UserFavoriteCourt < ApplicationRecord
  belongs_to :user
  belongs_to :court

  validates :court_id, uniqueness: { scope: :user_id, message: "이미 즐겨찾기에 추가된 경기장입니다" }

  scope :ordered, -> { order(position: :asc, use_count: :desc) }
  scope :recent, -> { order(last_used_at: :desc) }
  scope :frequently_used, -> { order(use_count: :desc) }

  def increment_use!
    update!(
      use_count: use_count + 1,
      last_used_at: Time.current
    )
  end

  def display_name
    nickname.presence || court.name
  end
end
