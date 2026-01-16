# frozen_string_literal: true

class CommunityPost < ApplicationRecord
  include HasPublicId

  belongs_to :user
  belongs_to :team, optional: true, primary_key: :id
  has_many :comments, as: :commentable, dependent: :destroy

  # Validations
  validates :title, presence: true, length: { maximum: 200 }
  validates :content, presence: true
  validates :category, presence: true

  # Categories
  CATEGORIES = %w[general question team_recruit court_info trade tips].freeze

  # Trade status
  TRADE_STATUSES = %w[available reserved sold].freeze

  validates :category, inclusion: { in: CATEGORIES }
  validates :trade_status, inclusion: { in: TRADE_STATUSES }, allow_nil: true

  # Scopes
  scope :published, -> { where(status: "published") }
  scope :draft, -> { where(status: "draft") }
  scope :by_category, ->(category) { where(category: category) if category.present? }
  scope :recent, -> { order(created_at: :desc) }
  scope :available_trades, -> { where(category: "trade", trade_status: "available") }

  # Class methods
  def self.category_label(category)
    {
      "general" => "자유게시판",
      "question" => "질문/답변",
      "team_recruit" => "팀원 모집",
      "court_info" => "농구장 정보",
      "trade" => "장터",
      "tips" => "팁/노하우"
    }[category] || category
  end

  def self.trade_status_label(status)
    {
      "available" => "판매중",
      "reserved" => "예약중",
      "sold" => "판매완료"
    }[status] || status
  end

  # Instance methods
  def category_label
    self.class.category_label(category)
  end

  def trade_status_label
    self.class.trade_status_label(trade_status)
  end

  def published?
    status == "published"
  end

  def author?(user)
    self.user == user
  end

  # 팀원 모집 카테고리인지
  def team_recruit?
    category == "team_recruit"
  end

  # 농구장 정보 카테고리인지
  def court_info?
    category == "court_info"
  end

  # 장터 카테고리인지
  def trade?
    category == "trade"
  end

  # 위치 정보가 있는지
  def has_location?
    latitude.present? && longitude.present?
  end

  # 마스킹된 연락처 표시 (010-88**-2211 형태)
  def masked_phone
    return nil unless share_contact && user.phone.present?

    phone = user.phone.gsub(/\D/, "")
    return nil if phone.length < 10

    if phone.length == 11
      "#{phone[0..2]}-#{phone[3..4]}**-#{phone[7..8]}#{phone[9..10]}"
    else
      "#{phone[0..2]}-#{phone[3]}**-#{phone[6..7]}#{phone[8..9]}"
    end
  end

  # 마스킹된 이름 표시 (유*영 형태)
  def masked_name
    return nil unless share_contact

    name = user.name.presence || user.display_name
    return nil if name.blank?

    if name.length == 2
      "#{name[0]}*"
    elsif name.length >= 3
      "#{name[0]}#{'*' * (name.length - 2)}#{name[-1]}"
    else
      name
    end
  end
end
