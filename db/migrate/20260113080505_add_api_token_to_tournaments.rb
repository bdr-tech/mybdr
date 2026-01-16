class AddApiTokenToTournaments < ActiveRecord::Migration[8.0]
  def change
    add_column :tournaments, :api_token, :string
    add_index :tournaments, :api_token, unique: true
  end
end
