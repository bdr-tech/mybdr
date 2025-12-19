# frozen_string_literal: true

class CreateComments < ActiveRecord::Migration[8.0]
  def change
    create_table :comments do |t|
      t.references :commentable, polymorphic: true, null: false
      t.references :user, null: false, foreign_key: true
      t.references :parent, foreign_key: { to_table: :comments }
      t.text :content, null: false
      t.integer :depth, default: 0, null: false
      t.integer :likes_count, default: 0, null: false
      t.integer :replies_count, default: 0, null: false
      t.string :status, null: false, default: "published"
      t.boolean :is_author, default: false, null: false
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :comments, [:commentable_type, :commentable_id, :created_at], name: "index_comments_on_commentable_and_created_at"
    add_index :comments, [:parent_id, :created_at]
    add_index :comments, :depth
    add_index :comments, :status
  end
end
