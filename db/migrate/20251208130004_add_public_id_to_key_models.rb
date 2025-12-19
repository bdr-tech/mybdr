# frozen_string_literal: true

class AddPublicIdToKeyModels < ActiveRecord::Migration[8.0]
  def change
    # Enable pgcrypto for UUID generation
    enable_extension "pgcrypto" unless extension_enabled?("pgcrypto")

    # Community Posts - 커뮤니티 게시글
    add_column :community_posts, :public_id, :uuid, default: "gen_random_uuid()", null: false
    add_index :community_posts, :public_id, unique: true

    # Posts - 일반 게시글
    add_column :posts, :public_id, :uuid, default: "gen_random_uuid()", null: false
    add_index :posts, :public_id, unique: true

    # Users - 사용자 (프로필 공개 링크용)
    add_column :users, :public_id, :uuid, default: "gen_random_uuid()", null: false
    add_index :users, :public_id, unique: true

    # Marketplace Items - 마켓플레이스 아이템
    add_column :marketplace_items, :public_id, :uuid, default: "gen_random_uuid()", null: false
    add_index :marketplace_items, :public_id, unique: true

    # Courts - 코트
    add_column :courts, :public_id, :uuid, default: "gen_random_uuid()", null: false
    add_index :courts, :public_id, unique: true

    # Comments - 댓글
    add_column :comments, :public_id, :uuid, default: "gen_random_uuid()", null: false
    add_index :comments, :public_id, unique: true
  end
end
