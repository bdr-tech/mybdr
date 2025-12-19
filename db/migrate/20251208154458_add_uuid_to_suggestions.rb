# frozen_string_literal: true

class AddUuidToSuggestions < ActiveRecord::Migration[8.0]
  def up
    add_column :suggestions, :uuid, :uuid

    # Populate existing records with UUIDs
    execute <<-SQL
      UPDATE suggestions SET uuid = gen_random_uuid() WHERE uuid IS NULL
    SQL

    change_column_null :suggestions, :uuid, false
    add_index :suggestions, :uuid, unique: true
  end

  def down
    remove_index :suggestions, :uuid
    remove_column :suggestions, :uuid
  end
end
