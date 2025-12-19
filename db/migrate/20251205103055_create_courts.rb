class CreateCourts < ActiveRecord::Migration[8.0]
  def change
    create_table :courts do |t|
      t.string :name, null: false
      t.string :address
      t.string :city
      t.string :district
      t.decimal :latitude, precision: 10, scale: 8
      t.decimal :longitude, precision: 11, scale: 8
      t.boolean :indoor, default: false
      t.text :facilities
      t.string :contact_name
      t.string :contact_phone
      t.boolean :parking_available, default: false
      t.integer :rental_fee, default: 0
      t.string :opening_hours
      t.text :description
      t.boolean :is_active, default: true
      t.string :status, default: "active"
      t.integer :games_count, default: 0

      t.timestamps
    end

    add_index :courts, :city
    add_index :courts, :district
    add_index :courts, :is_active
    add_index :courts, [:latitude, :longitude]
  end
end
