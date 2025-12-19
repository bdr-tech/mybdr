# frozen_string_literal: true

class CreateMarketplaceItems < ActiveRecord::Migration[8.0]
  def change
    create_table :marketplace_items do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.text :description, null: false
      t.string :category, null: false
      t.string :condition, null: false
      t.decimal :price, precision: 10, scale: 0, null: false
      t.decimal :original_price, precision: 10, scale: 0
      t.string :status, null: false, default: "active"
      t.string :location
      t.string :city
      t.string :district
      t.boolean :negotiable, default: false, null: false
      t.boolean :free_shipping, default: false, null: false
      t.boolean :direct_deal, default: true, null: false
      t.integer :views_count, default: 0, null: false
      t.integer :wishlist_count, default: 0, null: false
      t.integer :inquiries_count, default: 0, null: false
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :marketplace_items, :category
    add_index :marketplace_items, :status
    add_index :marketplace_items, :condition
    add_index :marketplace_items, [:status, :created_at]
    add_index :marketplace_items, [:city, :district]
    add_index :marketplace_items, :price

    # Wishlist table
    create_table :marketplace_wishlists do |t|
      t.references :user, null: false, foreign_key: true
      t.references :marketplace_item, null: false, foreign_key: true
      t.boolean :notify_price_drop, default: true, null: false
      t.decimal :target_price, precision: 10, scale: 0

      t.timestamps
    end

    add_index :marketplace_wishlists, [:user_id, :marketplace_item_id], unique: true

    # Phone number requests
    create_table :marketplace_phone_requests do |t|
      t.references :marketplace_item, null: false, foreign_key: true
      t.references :requester, null: false, foreign_key: { to_table: :users }
      t.references :seller, null: false, foreign_key: { to_table: :users }
      t.string :status, null: false, default: "pending"
      t.text :message
      t.text :rejection_reason
      t.datetime :processed_at

      t.timestamps
    end

    add_index :marketplace_phone_requests, [:marketplace_item_id, :requester_id], unique: true, name: "idx_phone_requests_item_requester"
    add_index :marketplace_phone_requests, :status
  end
end
