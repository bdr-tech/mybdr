# frozen_string_literal: true

class Comment < ApplicationRecord
  include ActionView::Helpers::SanitizeHelper

  # =============================================================================
  # Constants
  # =============================================================================
  MAX_DEPTH = 4 # 0-based, so 5 levels total

  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :commentable, polymorphic: true, counter_cache: :comments_count
  belongs_to :user
  belongs_to :parent, class_name: "Comment", optional: true, counter_cache: :replies_count
  has_many :replies, class_name: "Comment", foreign_key: :parent_id, dependent: :destroy

  # =============================================================================
  # Enums
  # =============================================================================
  enum :status, {
    published: "published",
    hidden: "hidden",
    deleted: "deleted"
  }, prefix: true

  # =============================================================================
  # Validations
  # =============================================================================
  validates :content, presence: true, length: { maximum: 5000 }
  validates :depth, numericality: { less_than_or_equal_to: MAX_DEPTH }
  validate :validate_parent_depth

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :published, -> { where(status: :published) }
  scope :root_comments, -> { where(parent_id: nil) }
  scope :recent, -> { order(created_at: :desc) }
  scope :oldest_first, -> { order(created_at: :asc) }
  scope :threaded, -> { order(created_at: :asc) }

  # =============================================================================
  # Callbacks
  # =============================================================================
  before_validation :set_depth
  before_validation :sanitize_content
  before_validation :set_is_author
  after_create :notify_mentions

  # =============================================================================
  # Instance Methods
  # =============================================================================

  def can_reply?
    depth < MAX_DEPTH
  end

  def root_comment
    parent_id.nil? ? self : parent.root_comment
  end

  def editable_by?(user)
    return false unless user
    self.user_id == user.id || user.membership_type_super_admin?
  end

  def authored_by?(user)
    self.user_id == user&.id
  end

  def soft_delete!
    update!(status: :deleted, content: "[삭제된 댓글]")
  end

  def ancestors
    return [] unless parent
    [parent] + parent.ancestors
  end

  def all_replies
    replies.flat_map { |r| [r] + r.all_replies }
  end

  def reply_count_recursive
    replies.sum { |r| 1 + r.reply_count_recursive }
  end

  def depth_indicator
    "└" + ("─" * depth)
  end

  private

  def set_depth
    self.depth = parent ? parent.depth + 1 : 0
  end

  def validate_parent_depth
    return unless parent
    if parent.depth >= MAX_DEPTH
      errors.add(:parent, "더 이상 답글을 달 수 없습니다 (최대 #{MAX_DEPTH + 1}단계)")
    end
  end

  def sanitize_content
    return unless content.present?
    self.content = sanitize(content, tags: %w[p br strong em u], attributes: [])
  end

  def set_is_author
    return unless commentable.respond_to?(:user_id)
    self.is_author = (user_id == commentable.user_id)
  end

  def notify_mentions
    # Extract @username mentions and notify users
    mentioned_usernames = content.scan(/@(\w+)/).flatten
    return if mentioned_usernames.empty?

    # TODO: Implement notification system for mentions
  end
end
