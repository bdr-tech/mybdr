# frozen_string_literal: true

class TipsController < ApplicationController
  # POST /tips/complete
  def complete
    page_key = params[:page_key]
    session["tips_#{page_key}"] = true
    head :ok
  end
end
