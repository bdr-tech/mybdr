# frozen_string_literal: true

class CreatePayments < ActiveRecord::Migration[8.0]
  def change
    create_table :payments do |t|
      # References
      t.references :user, null: false, foreign_key: true
      t.references :payable, polymorphic: true, null: false

      # Payment identification
      t.string :payment_code, null: false
      t.string :order_id, null: false
      t.string :payment_key

      # TossPayments fields
      t.string :toss_payment_key
      t.string :toss_order_id
      t.string :toss_transaction_key

      # Amount
      t.decimal :amount, precision: 10, scale: 0, null: false
      t.decimal :discount_amount, precision: 10, scale: 0, default: 0
      t.decimal :final_amount, precision: 10, scale: 0, null: false
      t.string :currency, default: "KRW"

      # Payment method
      t.string :payment_method
      t.string :card_company
      t.string :card_number
      t.integer :installment_months, default: 0
      t.string :receipt_url
      t.string :cash_receipt_url

      # Status
      t.string :status, null: false, default: "pending"
      t.text :failure_reason
      t.string :failure_code

      # Timestamps
      t.datetime :paid_at
      t.datetime :cancelled_at
      t.datetime :refunded_at
      t.datetime :expired_at

      # Refund
      t.decimal :refund_amount, precision: 10, scale: 0
      t.text :refund_reason
      t.string :refund_status

      # Metadata
      t.string :description
      t.jsonb :metadata, default: {}
      t.jsonb :toss_response, default: {}

      t.timestamps
    end

    add_index :payments, :payment_code, unique: true
    add_index :payments, :order_id, unique: true
    add_index :payments, :toss_payment_key
    add_index :payments, :status
    add_index :payments, [:user_id, :status]
    add_index :payments, [:payable_type, :payable_id]
    add_index :payments, :paid_at
  end
end
