class AddCategoryFieldsToCommunityPosts < ActiveRecord::Migration[8.0]
  def change
    # 팀원 모집용 - 팀 연결 (Team.id는 integer)
    add_reference :community_posts, :team, null: true, foreign_key: true

    # 농구장 정보용 - 위치 정보
    add_column :community_posts, :latitude, :decimal, precision: 10, scale: 7
    add_column :community_posts, :longitude, :decimal, precision: 10, scale: 7
    add_column :community_posts, :location_name, :string
    add_column :community_posts, :location_address, :string

    # 장터용 - 거래 정보
    add_column :community_posts, :price, :integer, default: 0
    add_column :community_posts, :negotiable, :boolean, default: false
    add_column :community_posts, :share_contact, :boolean, default: false
    add_column :community_posts, :trade_status, :string, default: 'available'
  end
end
