class CreateUserFavoriteCourts < ActiveRecord::Migration[8.0]
  def change
    create_table :user_favorite_courts do |t|
      t.references :user, null: false, foreign_key: true
      t.references :court, null: false, foreign_key: true
      t.string :nickname
      t.integer :use_count, default: 0, null: false
      t.integer :position, default: 0
      t.datetime :last_used_at

      t.timestamps
    end

    add_index :user_favorite_courts, [:user_id, :court_id], unique: true
    add_index :user_favorite_courts, [:user_id, :position]
    add_index :user_favorite_courts, [:user_id, :use_count]
  end
end
