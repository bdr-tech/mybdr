class AddCommentsCountToCommunityPosts < ActiveRecord::Migration[8.0]
  def change
    add_column :community_posts, :comments_count, :integer, default: 0, null: false
  end
end
