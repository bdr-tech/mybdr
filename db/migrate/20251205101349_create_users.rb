class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      # Authentication
      t.string :email, null: false
      t.string :password_digest, null: false

      # Basic Info
      t.string :name
      t.string :nickname
      t.string :phone
      t.string :profile_image

      # Basketball Profile
      t.string :position
      t.integer :height
      t.integer :weight
      t.date :birth_date
      t.string :city
      t.string :district
      t.text :bio

      # Membership (enum: free=0, pro=1, pickup_host=2, tournament_admin=3, super_admin=4)
      t.integer :membership_type, default: 0, null: false
      t.datetime :subscription_started_at
      t.datetime :subscription_expires_at
      t.string :subscription_status, default: "inactive"

      # Payment Info
      t.string :bank_name
      t.string :bank_code
      t.string :account_number
      t.string :account_holder
      t.string :toss_id

      # Admin & Status
      t.boolean :is_admin, default: false
      t.string :status, default: "active"
      t.datetime :suspended_at

      # Statistics
      t.decimal :evaluation_rating, precision: 3, scale: 2, default: 0.0
      t.integer :total_games_hosted, default: 0
      t.integer :total_games_participated, default: 0

      # Tracking
      t.datetime :last_login_at

      t.timestamps
    end

    add_index :users, :email, unique: true
    add_index :users, :membership_type
    add_index :users, :status
    add_index :users, :nickname, unique: true, where: "nickname IS NOT NULL AND nickname != ''"
    add_index :users, :phone, unique: true, where: "phone IS NOT NULL AND phone != ''"
  end
end
