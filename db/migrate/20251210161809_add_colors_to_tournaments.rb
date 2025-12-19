class AddColorsToTournaments < ActiveRecord::Migration[8.0]
  def change
    add_column :tournaments, :primary_color, :string
    add_column :tournaments, :secondary_color, :string
  end
end
