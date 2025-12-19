# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_12_11_050830) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

  create_table "active_storage_attachments", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.uuid "record_id", null: false
    t.uuid "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "admin_logs", force: :cascade do |t|
    t.bigint "admin_id", null: false
    t.string "target_type"
    t.bigint "target_id"
    t.string "action", null: false
    t.string "resource_type", null: false
    t.bigint "resource_id"
    t.jsonb "changes_made", default: {}
    t.jsonb "previous_values", default: {}
    t.text "description"
    t.string "ip_address"
    t.string "user_agent"
    t.string "request_id"
    t.string "severity", default: "info"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["action"], name: "index_admin_logs_on_action"
    t.index ["admin_id", "created_at"], name: "index_admin_logs_on_admin_id_and_created_at"
    t.index ["admin_id"], name: "index_admin_logs_on_admin_id"
    t.index ["created_at"], name: "index_admin_logs_on_created_at"
    t.index ["resource_type", "resource_id"], name: "index_admin_logs_on_resource_type_and_resource_id"
    t.index ["resource_type"], name: "index_admin_logs_on_resource_type"
    t.index ["severity"], name: "index_admin_logs_on_severity"
    t.index ["target_type", "target_id"], name: "index_admin_logs_on_target"
  end

  create_table "comments", force: :cascade do |t|
    t.string "commentable_type", null: false
    t.bigint "commentable_id", null: false
    t.bigint "user_id", null: false
    t.bigint "parent_id"
    t.text "content", null: false
    t.integer "depth", default: 0, null: false
    t.integer "likes_count", default: 0, null: false
    t.integer "replies_count", default: 0, null: false
    t.string "status", default: "published", null: false
    t.boolean "is_author", default: false, null: false
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "public_id", default: -> { "gen_random_uuid()" }, null: false
    t.index ["commentable_type", "commentable_id", "created_at"], name: "index_comments_on_commentable_and_created_at"
    t.index ["commentable_type", "commentable_id", "status"], name: "index_comments_on_commentable_and_status"
    t.index ["commentable_type", "commentable_id"], name: "index_comments_on_commentable"
    t.index ["depth"], name: "index_comments_on_depth"
    t.index ["parent_id", "created_at"], name: "index_comments_on_parent_id_and_created_at"
    t.index ["parent_id"], name: "index_comments_on_parent_id"
    t.index ["public_id"], name: "index_comments_on_public_id", unique: true
    t.index ["status"], name: "index_comments_on_status"
    t.index ["user_id"], name: "index_comments_on_user_id"
  end

  create_table "community_posts", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "title", null: false
    t.text "content"
    t.string "category", default: "general"
    t.integer "view_count", default: 0
    t.string "status", default: "published"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "comments_count", default: 0, null: false
    t.uuid "public_id", default: -> { "gen_random_uuid()" }, null: false
    t.bigint "team_id"
    t.decimal "latitude", precision: 10, scale: 7
    t.decimal "longitude", precision: 10, scale: 7
    t.string "location_name"
    t.string "location_address"
    t.integer "price", default: 0
    t.boolean "negotiable", default: false
    t.boolean "share_contact", default: false
    t.string "trade_status", default: "available"
    t.index ["category"], name: "index_community_posts_on_category"
    t.index ["created_at"], name: "index_community_posts_on_created_at"
    t.index ["public_id"], name: "index_community_posts_on_public_id", unique: true
    t.index ["status"], name: "index_community_posts_on_status"
    t.index ["team_id"], name: "index_community_posts_on_team_id"
    t.index ["user_id"], name: "index_community_posts_on_user_id"
  end

  create_table "content_presets", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "slug", null: false
    t.text "description"
    t.string "category", default: "general", null: false
    t.string "target_section_type", default: "text"
    t.string "target_page_types", default: [], array: true
    t.jsonb "content", default: {}, null: false
    t.jsonb "default_settings", default: {}
    t.string "background_color"
    t.string "text_color"
    t.boolean "is_active", default: true
    t.boolean "is_featured", default: false
    t.integer "position", default: 0
    t.integer "usage_count", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_content_presets_on_category"
    t.index ["is_active", "category"], name: "index_content_presets_on_is_active_and_category"
    t.index ["is_active", "is_featured"], name: "index_content_presets_on_is_active_and_is_featured"
    t.index ["slug"], name: "index_content_presets_on_slug", unique: true
    t.index ["target_section_type"], name: "index_content_presets_on_target_section_type"
  end

  create_table "court_checkins", force: :cascade do |t|
    t.bigint "court_info_id", null: false
    t.bigint "user_id", null: false
    t.decimal "latitude", precision: 10, scale: 7, null: false
    t.decimal "longitude", precision: 10, scale: 7, null: false
    t.decimal "distance_meters", precision: 10, scale: 2
    t.text "message"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["court_info_id", "user_id", "created_at"], name: "idx_court_checkins_court_user_time"
    t.index ["court_info_id"], name: "index_court_checkins_on_court_info_id"
    t.index ["user_id"], name: "index_court_checkins_on_user_id"
  end

  create_table "court_infos", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "name", null: false
    t.text "description"
    t.string "address", null: false
    t.string "city", null: false
    t.string "district"
    t.decimal "latitude", precision: 10, scale: 7, null: false
    t.decimal "longitude", precision: 10, scale: 7, null: false
    t.string "court_type", default: "outdoor", null: false
    t.integer "hoops_count", default: 2
    t.string "surface_type"
    t.boolean "is_free", default: true, null: false
    t.decimal "fee", precision: 10
    t.jsonb "operating_hours", default: {}
    t.jsonb "facilities", default: []
    t.string "status", default: "active", null: false
    t.integer "reviews_count", default: 0, null: false
    t.decimal "average_rating", precision: 3, scale: 2, default: "0.0"
    t.integer "checkins_count", default: 0, null: false
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["average_rating"], name: "index_court_infos_on_average_rating"
    t.index ["city", "district"], name: "index_court_infos_on_city_and_district"
    t.index ["city"], name: "index_court_infos_on_city"
    t.index ["court_type", "is_free"], name: "index_court_infos_on_type_and_free"
    t.index ["court_type"], name: "index_court_infos_on_court_type"
    t.index ["is_free"], name: "index_court_infos_on_is_free"
    t.index ["latitude", "longitude"], name: "index_court_infos_on_latitude_and_longitude"
    t.index ["status"], name: "index_court_infos_on_status"
    t.index ["user_id"], name: "index_court_infos_on_user_id"
  end

  create_table "court_reviews", force: :cascade do |t|
    t.bigint "court_info_id", null: false
    t.bigint "user_id", null: false
    t.integer "rating", null: false
    t.text "content"
    t.integer "likes_count", default: 0, null: false
    t.string "status", default: "published", null: false
    t.boolean "is_checkin", default: false, null: false
    t.decimal "checkin_latitude", precision: 10, scale: 7
    t.decimal "checkin_longitude", precision: 10, scale: 7
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["court_info_id", "user_id"], name: "index_court_reviews_on_court_info_id_and_user_id", unique: true, where: "(is_checkin = false)"
    t.index ["court_info_id"], name: "index_court_reviews_on_court_info_id"
    t.index ["is_checkin"], name: "index_court_reviews_on_is_checkin"
    t.index ["rating"], name: "index_court_reviews_on_rating"
    t.index ["status"], name: "index_court_reviews_on_status"
    t.index ["user_id"], name: "index_court_reviews_on_user_id"
  end

  create_table "courts", force: :cascade do |t|
    t.string "name", null: false
    t.string "address"
    t.string "city"
    t.string "district"
    t.decimal "latitude", precision: 10, scale: 8
    t.decimal "longitude", precision: 11, scale: 8
    t.boolean "indoor", default: false
    t.text "facilities"
    t.string "contact_name"
    t.string "contact_phone"
    t.boolean "parking_available", default: false
    t.integer "rental_fee", default: 0
    t.string "opening_hours"
    t.text "description"
    t.boolean "is_active", default: true
    t.string "status", default: "active"
    t.integer "games_count", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "public_id", default: -> { "gen_random_uuid()" }, null: false
    t.index ["city"], name: "index_courts_on_city"
    t.index ["district"], name: "index_courts_on_district"
    t.index ["is_active"], name: "index_courts_on_is_active"
    t.index ["latitude", "longitude"], name: "index_courts_on_latitude_and_longitude"
    t.index ["public_id"], name: "index_courts_on_public_id", unique: true
  end

  create_table "game_applications", force: :cascade do |t|
    t.bigint "game_id", null: false
    t.bigint "user_id", null: false
    t.integer "status", default: 0, null: false
    t.text "message"
    t.string "position"
    t.boolean "is_guest", default: false
    t.boolean "payment_required", default: false
    t.integer "payment_status", default: 0
    t.datetime "paid_at"
    t.string "payment_method"
    t.text "admin_note"
    t.datetime "approved_at"
    t.datetime "rejected_at"
    t.datetime "cancelled_at"
    t.datetime "attended_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["game_id", "user_id"], name: "index_game_applications_on_game_id_and_user_id", unique: true
    t.index ["game_id"], name: "index_game_applications_on_game_id"
    t.index ["payment_status"], name: "index_game_applications_on_payment_status"
    t.index ["status"], name: "index_game_applications_on_status"
    t.index ["user_id"], name: "index_game_applications_on_user_id"
  end

  create_table "game_templates", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "court_id"
    t.string "name", null: false
    t.integer "game_type", default: 0, null: false
    t.jsonb "default_settings", default: {}
    t.integer "use_count", default: 0
    t.boolean "is_public", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["court_id"], name: "index_game_templates_on_court_id"
    t.index ["game_type"], name: "index_game_templates_on_game_type"
    t.index ["is_public"], name: "index_game_templates_on_is_public"
    t.index ["user_id", "name"], name: "index_game_templates_on_user_id_and_name", unique: true
    t.index ["user_id"], name: "index_game_templates_on_user_id"
  end

  create_table "games", force: :cascade do |t|
    t.string "game_id", null: false
    t.uuid "uuid"
    t.string "title"
    t.integer "game_type", default: 0, null: false
    t.text "description"
    t.bigint "organizer_id", null: false
    t.bigint "court_id"
    t.string "city"
    t.string "district"
    t.string "venue_name"
    t.string "venue_address"
    t.datetime "scheduled_at", null: false
    t.datetime "ended_at"
    t.integer "duration_hours", default: 2
    t.integer "max_participants", default: 10
    t.integer "min_participants", default: 4
    t.integer "current_participants", default: 0
    t.integer "fee_per_person", default: 0
    t.string "skill_level", default: "all"
    t.string "uniform_home_color", default: "#FF0000"
    t.string "uniform_away_color", default: "#0000FF"
    t.text "requirements"
    t.text "notes"
    t.boolean "allow_guests", default: true
    t.integer "status", default: 0, null: false
    t.bigint "template_id"
    t.bigint "cloned_from_id"
    t.boolean "is_recurring", default: false
    t.string "recurrence_rule"
    t.integer "applications_count", default: 0
    t.integer "views_count", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["city", "game_type"], name: "index_games_on_city_and_game_type"
    t.index ["city", "scheduled_at"], name: "index_games_on_city_and_scheduled_at"
    t.index ["city"], name: "index_games_on_city"
    t.index ["cloned_from_id"], name: "index_games_on_cloned_from_id"
    t.index ["court_id"], name: "index_games_on_court_id"
    t.index ["game_id"], name: "index_games_on_game_id", unique: true
    t.index ["game_type"], name: "index_games_on_game_type"
    t.index ["is_recurring"], name: "index_games_on_is_recurring"
    t.index ["organizer_id", "status"], name: "index_games_on_organizer_and_status"
    t.index ["organizer_id"], name: "index_games_on_organizer_id"
    t.index ["scheduled_at"], name: "index_games_on_scheduled_at"
    t.index ["status", "scheduled_at"], name: "index_games_on_status_and_scheduled_at"
    t.index ["status"], name: "index_games_on_status"
    t.index ["template_id"], name: "index_games_on_template_id"
    t.index ["uuid"], name: "index_games_on_uuid", unique: true
  end

  create_table "marketplace_items", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "title", null: false
    t.text "description", null: false
    t.string "category", null: false
    t.string "condition", null: false
    t.decimal "price", precision: 10, null: false
    t.decimal "original_price", precision: 10
    t.string "status", default: "active", null: false
    t.string "location"
    t.string "city"
    t.string "district"
    t.boolean "negotiable", default: false, null: false
    t.boolean "free_shipping", default: false, null: false
    t.boolean "direct_deal", default: true, null: false
    t.integer "views_count", default: 0, null: false
    t.integer "wishlist_count", default: 0, null: false
    t.integer "inquiries_count", default: 0, null: false
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "public_id", default: -> { "gen_random_uuid()" }, null: false
    t.index ["category", "status", "created_at"], name: "index_marketplace_items_on_category_status_created"
    t.index ["category"], name: "index_marketplace_items_on_category"
    t.index ["city", "district"], name: "index_marketplace_items_on_city_and_district"
    t.index ["condition"], name: "index_marketplace_items_on_condition"
    t.index ["price"], name: "index_marketplace_items_on_price"
    t.index ["public_id"], name: "index_marketplace_items_on_public_id", unique: true
    t.index ["status", "created_at"], name: "index_marketplace_items_on_status_and_created_at"
    t.index ["status"], name: "index_marketplace_items_on_status"
    t.index ["user_id"], name: "index_marketplace_items_on_user_id"
  end

  create_table "marketplace_phone_requests", force: :cascade do |t|
    t.bigint "marketplace_item_id", null: false
    t.bigint "requester_id", null: false
    t.bigint "seller_id", null: false
    t.string "status", default: "pending", null: false
    t.text "message"
    t.text "rejection_reason"
    t.datetime "processed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["marketplace_item_id", "requester_id"], name: "idx_phone_requests_item_requester", unique: true
    t.index ["marketplace_item_id"], name: "index_marketplace_phone_requests_on_marketplace_item_id"
    t.index ["requester_id"], name: "index_marketplace_phone_requests_on_requester_id"
    t.index ["seller_id"], name: "index_marketplace_phone_requests_on_seller_id"
    t.index ["status"], name: "index_marketplace_phone_requests_on_status"
  end

  create_table "marketplace_wishlists", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "marketplace_item_id", null: false
    t.boolean "notify_price_drop", default: true, null: false
    t.decimal "target_price", precision: 10
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["marketplace_item_id"], name: "index_marketplace_wishlists_on_marketplace_item_id"
    t.index ["user_id", "marketplace_item_id"], name: "index_marketplace_wishlists_on_user_id_and_marketplace_item_id", unique: true
    t.index ["user_id"], name: "index_marketplace_wishlists_on_user_id"
  end

  create_table "match_player_stats", force: :cascade do |t|
    t.bigint "tournament_match_id", null: false
    t.bigint "tournament_team_player_id", null: false
    t.boolean "is_starter", default: false
    t.integer "minutes_played", default: 0
    t.integer "points", default: 0
    t.integer "field_goals_made", default: 0
    t.integer "field_goals_attempted", default: 0
    t.decimal "field_goal_percentage", precision: 5, scale: 1, default: "0.0"
    t.integer "three_pointers_made", default: 0
    t.integer "three_pointers_attempted", default: 0
    t.decimal "three_point_percentage", precision: 5, scale: 1, default: "0.0"
    t.integer "free_throws_made", default: 0
    t.integer "free_throws_attempted", default: 0
    t.decimal "free_throw_percentage", precision: 5, scale: 1, default: "0.0"
    t.integer "offensive_rebounds", default: 0
    t.integer "defensive_rebounds", default: 0
    t.integer "total_rebounds", default: 0
    t.integer "assists", default: 0
    t.integer "steals", default: 0
    t.integer "blocks", default: 0
    t.integer "turnovers", default: 0
    t.integer "personal_fouls", default: 0
    t.integer "plus_minus", default: 0
    t.decimal "efficiency", precision: 6, scale: 1, default: "0.0"
    t.decimal "true_shooting_percentage", precision: 5, scale: 1, default: "0.0"
    t.decimal "effective_fg_percentage", precision: 5, scale: 1, default: "0.0"
    t.decimal "assist_turnover_ratio", precision: 5, scale: 2, default: "0.0"
    t.integer "two_pointers_made", default: 0
    t.integer "two_pointers_attempted", default: 0
    t.decimal "two_point_percentage", precision: 5, scale: 1, default: "0.0"
    t.boolean "fouled_out", default: false
    t.boolean "ejected", default: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["assists"], name: "index_match_player_stats_on_assists"
    t.index ["points"], name: "index_match_player_stats_on_points"
    t.index ["total_rebounds"], name: "index_match_player_stats_on_total_rebounds"
    t.index ["tournament_match_id", "tournament_team_player_id"], name: "idx_match_player_stats_unique", unique: true
    t.index ["tournament_match_id"], name: "index_match_player_stats_on_tournament_match_id"
    t.index ["tournament_team_player_id", "points"], name: "index_match_player_stats_on_player_points"
    t.index ["tournament_team_player_id"], name: "index_match_player_stats_on_tournament_team_player_id"
  end

  create_table "memory_cards", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "cardable_type"
    t.bigint "cardable_id"
    t.string "card_type", null: false
    t.string "title", null: false
    t.text "description"
    t.string "template", default: "default"
    t.jsonb "stats_data", default: {}
    t.jsonb "highlights", default: []
    t.string "image_url"
    t.string "thumbnail_url"
    t.string "share_url"
    t.string "status", default: "pending", null: false
    t.integer "share_count", default: 0, null: false
    t.integer "view_count", default: 0, null: false
    t.boolean "is_public", default: true, null: false
    t.jsonb "share_platforms", default: {}
    t.datetime "last_shared_at"
    t.jsonb "metadata", default: {}
    t.date "reference_date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["card_type"], name: "index_memory_cards_on_card_type"
    t.index ["cardable_type", "cardable_id"], name: "index_memory_cards_on_cardable"
    t.index ["cardable_type", "cardable_id"], name: "index_memory_cards_on_cardable_type_and_cardable_id"
    t.index ["created_at"], name: "index_memory_cards_on_created_at"
    t.index ["is_public"], name: "index_memory_cards_on_is_public"
    t.index ["reference_date"], name: "index_memory_cards_on_reference_date"
    t.index ["status"], name: "index_memory_cards_on_status"
    t.index ["user_id", "card_type"], name: "index_memory_cards_on_user_id_and_card_type"
    t.index ["user_id"], name: "index_memory_cards_on_user_id"
  end

  create_table "notifications", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "notifiable_type"
    t.bigint "notifiable_id"
    t.string "notification_type", null: false
    t.string "status", default: "unread", null: false
    t.string "title", null: false
    t.text "content"
    t.string "action_url"
    t.string "action_type"
    t.jsonb "metadata", default: {}
    t.datetime "read_at"
    t.datetime "sent_at"
    t.datetime "expired_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_notifications_on_created_at"
    t.index ["notifiable_type", "notifiable_id"], name: "index_notifications_on_notifiable"
    t.index ["notifiable_type", "notifiable_id"], name: "index_notifications_on_notifiable_type_and_notifiable_id"
    t.index ["notification_type"], name: "index_notifications_on_notification_type"
    t.index ["read_at"], name: "index_notifications_on_read_at"
    t.index ["status"], name: "index_notifications_on_status"
    t.index ["user_id", "notification_type"], name: "index_notifications_on_user_id_and_notification_type"
    t.index ["user_id", "read_at"], name: "index_notifications_on_user_and_read"
    t.index ["user_id", "status"], name: "index_notifications_on_user_id_and_status"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "payments", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "payable_type", null: false
    t.bigint "payable_id", null: false
    t.string "payment_code", null: false
    t.string "order_id", null: false
    t.string "payment_key"
    t.string "toss_payment_key"
    t.string "toss_order_id"
    t.string "toss_transaction_key"
    t.decimal "amount", precision: 10, null: false
    t.decimal "discount_amount", precision: 10, default: "0"
    t.decimal "final_amount", precision: 10, null: false
    t.string "currency", default: "KRW"
    t.string "payment_method"
    t.string "card_company"
    t.string "card_number"
    t.integer "installment_months", default: 0
    t.string "receipt_url"
    t.string "cash_receipt_url"
    t.string "status", default: "pending", null: false
    t.text "failure_reason"
    t.string "failure_code"
    t.datetime "paid_at"
    t.datetime "cancelled_at"
    t.datetime "refunded_at"
    t.datetime "expired_at"
    t.decimal "refund_amount", precision: 10
    t.text "refund_reason"
    t.string "refund_status"
    t.string "description"
    t.jsonb "metadata", default: {}
    t.jsonb "toss_response", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_payments_on_created_at"
    t.index ["order_id"], name: "index_payments_on_order_id", unique: true
    t.index ["paid_at"], name: "index_payments_on_paid_at"
    t.index ["payable_type", "payable_id"], name: "index_payments_on_payable"
    t.index ["payable_type", "payable_id"], name: "index_payments_on_payable_type_and_payable_id"
    t.index ["payment_code"], name: "index_payments_on_payment_code", unique: true
    t.index ["status", "created_at"], name: "index_payments_on_status_and_created_at"
    t.index ["status"], name: "index_payments_on_status"
    t.index ["toss_payment_key"], name: "index_payments_on_toss_payment_key"
    t.index ["user_id", "status"], name: "index_payments_on_user_id_and_status"
    t.index ["user_id"], name: "index_payments_on_user_id"
  end

  create_table "posts", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "post_code", null: false
    t.string "title", null: false
    t.text "content", null: false
    t.string "category", null: false
    t.string "status", default: "published", null: false
    t.integer "views_count", default: 0, null: false
    t.integer "comments_count", default: 0, null: false
    t.integer "likes_count", default: 0, null: false
    t.boolean "is_pinned", default: false, null: false
    t.boolean "is_notice", default: false, null: false
    t.boolean "allow_comments", default: true, null: false
    t.jsonb "metadata", default: {}
    t.datetime "published_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "public_id", default: -> { "gen_random_uuid()" }, null: false
    t.index ["category", "is_pinned", "created_at"], name: "index_posts_on_category_and_is_pinned_and_created_at"
    t.index ["category"], name: "index_posts_on_category"
    t.index ["post_code"], name: "index_posts_on_post_code", unique: true
    t.index ["public_id"], name: "index_posts_on_public_id", unique: true
    t.index ["published_at"], name: "index_posts_on_published_at"
    t.index ["status", "published_at"], name: "index_posts_on_status_and_published_at"
    t.index ["status"], name: "index_posts_on_status"
    t.index ["user_id", "created_at"], name: "index_posts_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_posts_on_user_id"
  end

  create_table "site_pages", force: :cascade do |t|
    t.bigint "tournament_site_id", null: false
    t.string "title", null: false
    t.string "slug", null: false
    t.string "page_type", default: "custom", null: false
    t.integer "position", default: 0
    t.boolean "is_visible", default: true
    t.boolean "show_in_nav", default: true
    t.text "content"
    t.string "meta_title"
    t.text "meta_description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["page_type"], name: "index_site_pages_on_page_type"
    t.index ["tournament_site_id", "position"], name: "index_site_pages_on_tournament_site_id_and_position"
    t.index ["tournament_site_id", "slug"], name: "index_site_pages_on_tournament_site_id_and_slug", unique: true
    t.index ["tournament_site_id"], name: "index_site_pages_on_tournament_site_id"
  end

  create_table "site_sections", force: :cascade do |t|
    t.bigint "site_page_id", null: false
    t.string "section_type", null: false
    t.integer "position", default: 0
    t.boolean "is_visible", default: true
    t.jsonb "content", default: {}
    t.jsonb "settings", default: {}
    t.string "background_color"
    t.string "text_color"
    t.string "padding_top", default: "normal"
    t.string "padding_bottom", default: "normal"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["section_type"], name: "index_site_sections_on_section_type"
    t.index ["site_page_id", "position"], name: "index_site_sections_on_site_page_id_and_position"
    t.index ["site_page_id"], name: "index_site_sections_on_site_page_id"
  end

  create_table "site_templates", force: :cascade do |t|
    t.string "name", null: false
    t.string "slug", null: false
    t.text "description"
    t.string "thumbnail_url"
    t.string "preview_url"
    t.string "category", default: "general"
    t.jsonb "default_theme", default: {}
    t.jsonb "default_pages", default: []
    t.boolean "is_premium", default: false
    t.boolean "is_active", default: true
    t.integer "usage_count", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_site_templates_on_category"
    t.index ["is_active", "is_premium"], name: "index_site_templates_on_active_and_premium"
    t.index ["is_active"], name: "index_site_templates_on_is_active"
    t.index ["slug"], name: "index_site_templates_on_slug", unique: true
  end

  create_table "suggestions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "assigned_to_id"
    t.string "title", null: false
    t.text "content", null: false
    t.string "category", default: "general", null: false
    t.string "status", default: "pending", null: false
    t.integer "priority", default: 0
    t.text "admin_response"
    t.datetime "responded_at"
    t.bigint "responded_by_id"
    t.jsonb "metadata", default: {}
    t.string "device_info"
    t.string "app_version"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "uuid", null: false
    t.index ["assigned_to_id"], name: "index_suggestions_on_assigned_to_id"
    t.index ["category"], name: "index_suggestions_on_category"
    t.index ["created_at"], name: "index_suggestions_on_created_at"
    t.index ["priority"], name: "index_suggestions_on_priority"
    t.index ["responded_by_id"], name: "index_suggestions_on_responded_by_id"
    t.index ["status", "priority"], name: "index_suggestions_on_status_and_priority"
    t.index ["status"], name: "index_suggestions_on_status"
    t.index ["user_id"], name: "index_suggestions_on_user_id"
    t.index ["uuid"], name: "index_suggestions_on_uuid", unique: true
  end

  create_table "system_settings", force: :cascade do |t|
    t.string "key", null: false
    t.text "value"
    t.string "value_type", default: "string"
    t.string "category", default: "general"
    t.text "description"
    t.boolean "is_public", default: false
    t.boolean "is_editable", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_system_settings_on_category"
    t.index ["is_public"], name: "index_system_settings_on_is_public"
    t.index ["key"], name: "index_system_settings_on_key", unique: true
  end

  create_table "team_join_requests", force: :cascade do |t|
    t.bigint "team_id", null: false
    t.bigint "user_id", null: false
    t.bigint "processed_by_id"
    t.string "status", default: "pending", null: false
    t.text "message"
    t.text "rejection_reason"
    t.string "preferred_position"
    t.integer "preferred_jersey_number"
    t.datetime "processed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["processed_by_id"], name: "index_team_join_requests_on_processed_by_id"
    t.index ["status"], name: "index_team_join_requests_on_status"
    t.index ["team_id", "user_id", "status"], name: "index_team_join_requests_on_team_id_and_user_id_and_status"
    t.index ["team_id"], name: "index_team_join_requests_on_team_id"
    t.index ["user_id"], name: "index_team_join_requests_on_user_id"
  end

  create_table "team_member_histories", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "team_id", null: false
    t.string "action", null: false
    t.string "role"
    t.integer "jersey_number"
    t.bigint "from_team_id"
    t.bigint "to_team_id"
    t.bigint "processed_by_id"
    t.text "note"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["action"], name: "index_team_member_histories_on_action"
    t.index ["from_team_id"], name: "index_team_member_histories_on_from_team_id"
    t.index ["processed_by_id"], name: "index_team_member_histories_on_processed_by_id"
    t.index ["team_id", "action"], name: "index_team_member_histories_on_team_id_and_action"
    t.index ["team_id"], name: "index_team_member_histories_on_team_id"
    t.index ["to_team_id"], name: "index_team_member_histories_on_to_team_id"
    t.index ["user_id", "created_at"], name: "index_team_member_histories_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_team_member_histories_on_user_id"
  end

  create_table "team_members", force: :cascade do |t|
    t.bigint "team_id", null: false
    t.bigint "user_id", null: false
    t.integer "jersey_number"
    t.string "role", default: "member"
    t.string "position"
    t.string "status", default: "active"
    t.datetime "joined_at"
    t.datetime "left_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["status"], name: "index_team_members_on_status"
    t.index ["team_id", "jersey_number"], name: "index_team_members_on_team_id_and_jersey_number", unique: true
    t.index ["team_id", "user_id"], name: "index_team_members_on_team_id_and_user_id", unique: true
    t.index ["team_id"], name: "index_team_members_on_team_id"
    t.index ["user_id"], name: "index_team_members_on_user_id"
  end

  create_table "teams", force: :cascade do |t|
    t.string "uuid", null: false
    t.string "name", null: false
    t.string "slug"
    t.text "description"
    t.string "logo_url"
    t.string "banner_url"
    t.string "city"
    t.string "district"
    t.string "home_court"
    t.integer "founded_year"
    t.bigint "captain_id", null: false
    t.bigint "manager_id"
    t.string "status", default: "active"
    t.boolean "is_public", default: true
    t.boolean "accepting_members", default: true
    t.integer "max_members", default: 15
    t.jsonb "settings", default: {}
    t.integer "members_count", default: 0
    t.integer "wins", default: 0
    t.integer "losses", default: 0
    t.integer "draws", default: 0
    t.integer "tournaments_count", default: 0
    t.string "primary_color", default: "#FFFFFF"
    t.string "secondary_color", default: "#000000"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "team_code"
    t.boolean "auto_accept_members", default: false, null: false
    t.index ["captain_id"], name: "index_teams_on_captain_id"
    t.index ["city"], name: "index_teams_on_city"
    t.index ["manager_id"], name: "index_teams_on_manager_id"
    t.index ["name"], name: "index_teams_on_name"
    t.index ["slug"], name: "index_teams_on_slug", unique: true
    t.index ["status", "city"], name: "index_teams_on_status_and_city"
    t.index ["status"], name: "index_teams_on_status"
    t.index ["team_code"], name: "index_teams_on_team_code", unique: true
    t.index ["uuid"], name: "index_teams_on_uuid", unique: true
  end

  create_table "tournament_admin_members", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "role", default: "admin", null: false
    t.jsonb "permissions", default: {}
    t.boolean "is_active", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "tournament_id", null: false
    t.index ["tournament_id", "role"], name: "index_tournament_admin_members_on_tournament_id_and_role"
    t.index ["tournament_id"], name: "index_tournament_admin_members_on_tournament_id"
    t.index ["user_id"], name: "index_tournament_admin_members_on_user_id"
  end

  create_table "tournament_matches", force: :cascade do |t|
    t.string "uuid", null: false
    t.bigint "home_team_id"
    t.bigint "away_team_id"
    t.string "round_name"
    t.integer "round_number"
    t.integer "match_number"
    t.string "group_name"
    t.integer "bracket_position"
    t.integer "bracket_level"
    t.datetime "scheduled_at"
    t.datetime "started_at"
    t.datetime "ended_at"
    t.bigint "venue_id"
    t.string "court_number"
    t.integer "home_score", default: 0
    t.integer "away_score", default: 0
    t.jsonb "quarter_scores", default: {"away"=>{"ot"=>[], "q1"=>0, "q2"=>0, "q3"=>0, "q4"=>0}, "home"=>{"ot"=>[], "q1"=>0, "q2"=>0, "q3"=>0, "q4"=>0}}
    t.string "status", default: "scheduled"
    t.bigint "winner_team_id"
    t.bigint "next_match_id"
    t.string "next_match_slot"
    t.bigint "mvp_player_id"
    t.text "notes"
    t.jsonb "settings", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "tournament_id", null: false
    t.index ["away_team_id"], name: "index_tournament_matches_on_away_team_id"
    t.index ["home_team_id"], name: "index_tournament_matches_on_home_team_id"
    t.index ["mvp_player_id"], name: "index_tournament_matches_on_mvp_player_id"
    t.index ["next_match_id"], name: "index_tournament_matches_on_next_match_id"
    t.index ["scheduled_at"], name: "index_tournament_matches_on_scheduled_at"
    t.index ["status", "scheduled_at"], name: "index_tournament_matches_on_status_and_scheduled_at"
    t.index ["status"], name: "index_tournament_matches_on_status"
    t.index ["tournament_id", "bracket_position"], name: "index_tournament_matches_on_tournament_id_and_bracket_position"
    t.index ["tournament_id"], name: "index_tournament_matches_on_tournament_id"
    t.index ["uuid"], name: "index_tournament_matches_on_uuid", unique: true
    t.index ["venue_id"], name: "index_tournament_matches_on_venue_id"
    t.index ["winner_team_id"], name: "index_tournament_matches_on_winner_team_id"
  end

  create_table "tournament_series", force: :cascade do |t|
    t.string "uuid", null: false
    t.string "name", null: false
    t.string "slug", null: false
    t.text "description"
    t.string "logo_url"
    t.bigint "organizer_id", null: false
    t.string "status", default: "active"
    t.boolean "is_public", default: true
    t.jsonb "settings", default: {}
    t.integer "tournaments_count", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["is_public"], name: "index_tournament_series_on_is_public"
    t.index ["organizer_id"], name: "index_tournament_series_on_organizer_id"
    t.index ["slug"], name: "index_tournament_series_on_slug", unique: true
    t.index ["status"], name: "index_tournament_series_on_status"
    t.index ["uuid"], name: "index_tournament_series_on_uuid", unique: true
  end

  create_table "tournament_sites", force: :cascade do |t|
    t.bigint "site_template_id"
    t.string "subdomain", null: false
    t.string "custom_domain"
    t.string "site_name"
    t.jsonb "theme_settings", default: {}
    t.string "primary_color", default: "#E53E3E"
    t.string "secondary_color", default: "#ED8936"
    t.string "logo_url"
    t.string "hero_image_url"
    t.string "favicon_url"
    t.boolean "is_published", default: false
    t.datetime "published_at"
    t.boolean "is_active", default: true
    t.integer "views_count", default: 0
    t.integer "unique_visitors", default: 0
    t.string "meta_title"
    t.text "meta_description"
    t.string "og_image_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "tournament_id", null: false
    t.index ["custom_domain"], name: "index_tournament_sites_on_custom_domain", unique: true
    t.index ["is_published"], name: "index_tournament_sites_on_is_published"
    t.index ["site_template_id"], name: "index_tournament_sites_on_site_template_id"
    t.index ["subdomain"], name: "index_tournament_sites_on_subdomain", unique: true
    t.index ["tournament_id", "is_published"], name: "index_tournament_sites_on_tournament_and_published"
    t.index ["tournament_id"], name: "index_tournament_sites_on_tournament_id"
  end

  create_table "tournament_team_players", force: :cascade do |t|
    t.bigint "tournament_team_id", null: false
    t.bigint "user_id", null: false
    t.integer "jersey_number"
    t.string "role", default: "player"
    t.string "position"
    t.boolean "auto_registered", default: false
    t.boolean "is_active", default: true
    t.boolean "is_starter", default: false
    t.integer "games_played", default: 0
    t.integer "total_points", default: 0
    t.integer "total_rebounds", default: 0
    t.integer "total_assists", default: 0
    t.integer "total_steals", default: 0
    t.integer "total_blocks", default: 0
    t.decimal "avg_points", precision: 5, scale: 1, default: "0.0"
    t.decimal "avg_rebounds", precision: 5, scale: 1, default: "0.0"
    t.decimal "avg_assists", precision: 5, scale: 1, default: "0.0"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["is_active"], name: "index_tournament_team_players_on_is_active"
    t.index ["tournament_team_id", "jersey_number"], name: "idx_tournament_team_players_jersey", unique: true
    t.index ["tournament_team_id", "user_id"], name: "idx_tournament_team_players_unique", unique: true
    t.index ["tournament_team_id"], name: "index_tournament_team_players_on_tournament_team_id"
    t.index ["user_id"], name: "index_tournament_team_players_on_user_id"
  end

  create_table "tournament_teams", force: :cascade do |t|
    t.bigint "team_id", null: false
    t.integer "seed_number"
    t.string "group_name"
    t.integer "group_order"
    t.string "status", default: "pending"
    t.bigint "registered_by_id"
    t.datetime "approved_at"
    t.datetime "paid_at"
    t.string "payment_status", default: "unpaid"
    t.text "registration_note"
    t.integer "wins", default: 0
    t.integer "losses", default: 0
    t.integer "draws", default: 0
    t.integer "points_for", default: 0
    t.integer "points_against", default: 0
    t.integer "point_difference", default: 0
    t.integer "final_rank"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "tournament_id", null: false
    t.index ["registered_by_id"], name: "index_tournament_teams_on_registered_by_id"
    t.index ["status"], name: "index_tournament_teams_on_status"
    t.index ["team_id"], name: "index_tournament_teams_on_team_id"
    t.index ["tournament_id", "group_name"], name: "index_tournament_teams_on_tournament_and_group"
    t.index ["tournament_id", "seed_number"], name: "index_tournament_teams_on_tournament_id_and_seed_number"
    t.index ["tournament_id", "team_id"], name: "index_tournament_teams_on_tournament_id_and_team_id", unique: true
    t.index ["tournament_id"], name: "index_tournament_teams_on_tournament_id"
  end

  create_table "tournaments", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.bigint "series_id"
    t.bigint "organizer_id", null: false
    t.string "name", null: false
    t.integer "edition_number"
    t.text "description"
    t.string "logo_url"
    t.string "banner_url"
    t.datetime "registration_start_at"
    t.datetime "registration_end_at"
    t.datetime "start_date"
    t.datetime "end_date"
    t.string "format", default: "single_elimination"
    t.integer "max_teams", default: 16
    t.integer "min_teams", default: 4
    t.integer "team_size", default: 5
    t.integer "roster_min", default: 5
    t.integer "roster_max", default: 12
    t.decimal "entry_fee", precision: 10, default: "0"
    t.text "prize_info"
    t.jsonb "prize_distribution", default: {}
    t.text "rules"
    t.jsonb "game_rules", default: {}
    t.bigint "venue_id"
    t.string "venue_name"
    t.string "venue_address"
    t.string "city"
    t.string "district"
    t.string "status", default: "draft"
    t.integer "teams_count", default: 0
    t.integer "matches_count", default: 0
    t.integer "views_count", default: 0
    t.jsonb "settings", default: {}
    t.boolean "is_public", default: true
    t.boolean "auto_approve_teams", default: false
    t.bigint "champion_team_id"
    t.bigint "mvp_player_id"
    t.jsonb "divisions", default: [], null: false
    t.jsonb "division_tiers", default: [], null: false
    t.string "bank_name"
    t.string "bank_account"
    t.string "bank_holder"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "primary_color"
    t.string "secondary_color"
    t.index ["champion_team_id"], name: "index_tournaments_on_champion_team_id"
    t.index ["divisions"], name: "index_tournaments_on_divisions", using: :gin
    t.index ["is_public"], name: "index_tournaments_on_is_public"
    t.index ["mvp_player_id"], name: "index_tournaments_on_mvp_player_id"
    t.index ["organizer_id", "status"], name: "index_tournaments_on_organizer_and_status"
    t.index ["organizer_id"], name: "index_tournaments_on_organizer_id"
    t.index ["series_id", "edition_number"], name: "index_tournaments_on_series_id_and_edition_number", unique: true, where: "(series_id IS NOT NULL)"
    t.index ["series_id"], name: "index_tournaments_on_series_id"
    t.index ["start_date"], name: "index_tournaments_on_start_date"
    t.index ["status", "start_date"], name: "index_tournaments_on_status_and_start_date"
    t.index ["status"], name: "index_tournaments_on_status"
    t.index ["venue_id"], name: "index_tournaments_on_venue_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "name"
    t.string "nickname"
    t.string "phone"
    t.string "profile_image"
    t.string "position"
    t.integer "height"
    t.integer "weight"
    t.date "birth_date"
    t.string "city"
    t.string "district"
    t.text "bio"
    t.integer "membership_type", default: 0, null: false
    t.datetime "subscription_started_at"
    t.datetime "subscription_expires_at"
    t.string "subscription_status", default: "inactive"
    t.string "bank_name"
    t.string "bank_code"
    t.string "account_number"
    t.string "account_holder"
    t.string "toss_id"
    t.boolean "is_admin", default: false
    t.string "status", default: "active"
    t.datetime "suspended_at"
    t.decimal "evaluation_rating", precision: 3, scale: 2, default: "0.0"
    t.integer "total_games_hosted", default: 0
    t.integer "total_games_participated", default: 0
    t.datetime "last_login_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "public_id", default: -> { "gen_random_uuid()" }, null: false
    t.string "provider"
    t.string "uid"
    t.string "oauth_token"
    t.datetime "oauth_expires_at"
    t.string "profile_image_url"
    t.index ["created_at"], name: "index_users_on_created_at"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["is_admin"], name: "index_users_on_is_admin_partial", where: "(is_admin = true)"
    t.index ["membership_type"], name: "index_users_on_membership_type"
    t.index ["nickname"], name: "index_users_on_nickname", unique: true, where: "((nickname IS NOT NULL) AND ((nickname)::text <> ''::text))"
    t.index ["phone"], name: "index_users_on_phone", unique: true, where: "((phone IS NOT NULL) AND ((phone)::text <> ''::text))"
    t.index ["provider", "uid"], name: "index_users_on_provider_and_uid", unique: true
    t.index ["public_id"], name: "index_users_on_public_id", unique: true
    t.index ["status"], name: "index_users_on_status"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "admin_logs", "users", column: "admin_id"
  add_foreign_key "comments", "comments", column: "parent_id"
  add_foreign_key "comments", "users"
  add_foreign_key "community_posts", "teams"
  add_foreign_key "community_posts", "users"
  add_foreign_key "court_checkins", "court_infos"
  add_foreign_key "court_checkins", "users"
  add_foreign_key "court_infos", "users"
  add_foreign_key "court_reviews", "court_infos"
  add_foreign_key "court_reviews", "users"
  add_foreign_key "game_applications", "games"
  add_foreign_key "game_applications", "users"
  add_foreign_key "game_templates", "courts"
  add_foreign_key "game_templates", "users"
  add_foreign_key "games", "courts"
  add_foreign_key "games", "game_templates", column: "template_id"
  add_foreign_key "games", "games", column: "cloned_from_id"
  add_foreign_key "games", "users", column: "organizer_id"
  add_foreign_key "marketplace_items", "users"
  add_foreign_key "marketplace_phone_requests", "marketplace_items"
  add_foreign_key "marketplace_phone_requests", "users", column: "requester_id"
  add_foreign_key "marketplace_phone_requests", "users", column: "seller_id"
  add_foreign_key "marketplace_wishlists", "marketplace_items"
  add_foreign_key "marketplace_wishlists", "users"
  add_foreign_key "match_player_stats", "tournament_matches"
  add_foreign_key "match_player_stats", "tournament_team_players"
  add_foreign_key "memory_cards", "users"
  add_foreign_key "notifications", "users"
  add_foreign_key "payments", "users"
  add_foreign_key "posts", "users"
  add_foreign_key "site_pages", "tournament_sites"
  add_foreign_key "site_sections", "site_pages"
  add_foreign_key "suggestions", "users"
  add_foreign_key "suggestions", "users", column: "assigned_to_id"
  add_foreign_key "suggestions", "users", column: "responded_by_id"
  add_foreign_key "team_join_requests", "teams"
  add_foreign_key "team_join_requests", "users"
  add_foreign_key "team_join_requests", "users", column: "processed_by_id"
  add_foreign_key "team_member_histories", "teams"
  add_foreign_key "team_member_histories", "teams", column: "from_team_id"
  add_foreign_key "team_member_histories", "teams", column: "to_team_id"
  add_foreign_key "team_member_histories", "users"
  add_foreign_key "team_member_histories", "users", column: "processed_by_id"
  add_foreign_key "team_members", "teams"
  add_foreign_key "team_members", "users"
  add_foreign_key "teams", "users", column: "captain_id"
  add_foreign_key "teams", "users", column: "manager_id"
  add_foreign_key "tournament_admin_members", "tournaments"
  add_foreign_key "tournament_admin_members", "users"
  add_foreign_key "tournament_matches", "courts", column: "venue_id"
  add_foreign_key "tournament_matches", "tournament_matches", column: "next_match_id"
  add_foreign_key "tournament_matches", "tournament_teams", column: "away_team_id"
  add_foreign_key "tournament_matches", "tournament_teams", column: "home_team_id"
  add_foreign_key "tournament_matches", "tournament_teams", column: "winner_team_id"
  add_foreign_key "tournament_matches", "tournaments"
  add_foreign_key "tournament_matches", "users", column: "mvp_player_id"
  add_foreign_key "tournament_series", "users", column: "organizer_id"
  add_foreign_key "tournament_sites", "site_templates"
  add_foreign_key "tournament_sites", "tournaments"
  add_foreign_key "tournament_team_players", "tournament_teams"
  add_foreign_key "tournament_team_players", "users"
  add_foreign_key "tournament_teams", "teams"
  add_foreign_key "tournament_teams", "tournaments"
  add_foreign_key "tournament_teams", "users", column: "registered_by_id"
  add_foreign_key "tournaments", "courts", column: "venue_id"
  add_foreign_key "tournaments", "teams", column: "champion_team_id"
  add_foreign_key "tournaments", "tournament_series", column: "series_id"
  add_foreign_key "tournaments", "users", column: "mvp_player_id"
  add_foreign_key "tournaments", "users", column: "organizer_id"
end
