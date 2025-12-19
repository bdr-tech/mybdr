# frozen_string_literal: true

class CreateCourtReviews < ActiveRecord::Migration[8.0]
  def change
    create_table :court_reviews do |t|
      t.references :court_info, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.integer :rating, null: false
      t.text :content
      t.integer :likes_count, default: 0, null: false
      t.string :status, null: false, default: "published"
      t.boolean :is_checkin, default: false, null: false
      t.decimal :checkin_latitude, precision: 10, scale: 7
      t.decimal :checkin_longitude, precision: 10, scale: 7
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :court_reviews, [:court_info_id, :user_id], unique: true, where: "is_checkin = false"
    add_index :court_reviews, :rating
    add_index :court_reviews, :status
    add_index :court_reviews, :is_checkin

    # Court check-ins table
    create_table :court_checkins do |t|
      t.references :court_info, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.decimal :latitude, precision: 10, scale: 7, null: false
      t.decimal :longitude, precision: 10, scale: 7, null: false
      t.decimal :distance_meters, precision: 10, scale: 2
      t.text :message

      t.timestamps
    end

    add_index :court_checkins, [:court_info_id, :user_id, :created_at], name: "idx_court_checkins_court_user_time"
  end
end
