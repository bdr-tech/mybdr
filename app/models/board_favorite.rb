# frozen_string_literal: true

class BoardFavorite < ApplicationRecord
  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :user

  # =============================================================================
  # Validations
  # =============================================================================
  validates :category, presence: true,
            inclusion: { in: CommunityPost::CATEGORIES }
  validates :category, uniqueness: { scope: :user_id, message: "이미 즐겨찾기에 추가되어 있습니다" }

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :ordered, -> { order(position: :asc, created_at: :asc) }

  # =============================================================================
  # Class Methods
  # =============================================================================
  def self.category_label(category)
    CommunityPost.category_label(category)
  end

  # =============================================================================
  # Instance Methods
  # =============================================================================
  def label
    self.class.category_label(category)
  end
end
