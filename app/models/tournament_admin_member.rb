# frozen_string_literal: true

class TournamentAdminMember < ApplicationRecord
  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :user
  belongs_to :tournament

  # =============================================================================
  # Enums
  # =============================================================================
  enum :role, {
    viewer: 'viewer',
    editor: 'editor',
    admin: 'admin',
    owner: 'owner'
  }, default: :admin

  # =============================================================================
  # Validations
  # =============================================================================
  validates :user_id, uniqueness: { scope: :tournament_id, message: '이미 해당 대회의 관리자입니다' }
  validates :role, presence: true

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :active, -> { where(is_active: true) }
  scope :owners, -> { where(role: 'owner') }
  scope :with_edit_access, -> { where(role: %w[editor admin owner]) }

  # =============================================================================
  # Callbacks
  # =============================================================================
  before_destroy :ensure_owner_remains, if: :owner?

  # =============================================================================
  # Instance Methods
  # =============================================================================

  # Permission checks
  def can_view?
    is_active
  end

  def can_edit?
    is_active && (editor? || admin? || owner?)
  end

  def can_manage_admins?
    is_active && (admin? || owner?)
  end

  def can_delete_tournament?
    is_active && owner?
  end

  def can_publish?
    is_active && (admin? || owner?)
  end

  # Check specific permission from jsonb
  def has_permission?(permission_key)
    return true if owner?
    permissions[permission_key.to_s] == true
  end

  private

  def ensure_owner_remains
    # 대회 자체가 삭제될 때는 owner 삭제 허용
    return if tournament.destroyed? || tournament.being_destroyed

    if tournament.tournament_admin_members.owners.where.not(id: id).empty?
      errors.add(:base, '대회에는 최소 한 명의 소유자가 있어야 합니다')
      throw(:abort)
    end
  end
end
