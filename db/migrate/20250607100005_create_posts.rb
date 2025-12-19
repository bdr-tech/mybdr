# frozen_string_literal: true

class CreatePosts < ActiveRecord::Migration[8.0]
  def change
    create_table :posts do |t|
      t.references :user, null: false, foreign_key: true
      t.string :post_code, null: false
      t.string :title, null: false
      t.text :content, null: false
      t.string :category, null: false
      t.string :status, null: false, default: "published"
      t.integer :views_count, default: 0, null: false
      t.integer :comments_count, default: 0, null: false
      t.integer :likes_count, default: 0, null: false
      t.boolean :is_pinned, default: false, null: false
      t.boolean :is_notice, default: false, null: false
      t.boolean :allow_comments, default: true, null: false
      t.jsonb :metadata, default: {}
      t.datetime :published_at

      t.timestamps
    end

    add_index :posts, :post_code, unique: true
    add_index :posts, :category
    add_index :posts, :status
    add_index :posts, [:category, :is_pinned, :created_at]
    add_index :posts, [:user_id, :created_at]
    add_index :posts, :published_at
  end
end
