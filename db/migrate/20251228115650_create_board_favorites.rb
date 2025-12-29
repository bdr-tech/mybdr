class CreateBoardFavorites < ActiveRecord::Migration[8.0]
  def change
    create_table :board_favorites do |t|
      t.references :user, null: false, foreign_key: true
      t.string :category, null: false
      t.integer :position, default: 0

      t.timestamps
    end

    add_index :board_favorites, [:user_id, :category], unique: true
  end
end
