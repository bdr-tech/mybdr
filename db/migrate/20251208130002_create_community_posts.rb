class CreateCommunityPosts < ActiveRecord::Migration[8.0]
  def change
    create_table :community_posts do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.text :content
      t.string :category, default: "general"
      t.integer :view_count, default: 0
      t.string :status, default: "published"

      t.timestamps
    end

    add_index :community_posts, :category
    add_index :community_posts, :status
    add_index :community_posts, :created_at
  end
end
