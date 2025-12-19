# frozen_string_literal: true

# Pagy initializer file
# See https://ddnexus.github.io/pagy/docs/api/pagy#configuration

# Default number of items per page
Pagy::DEFAULT[:limit] = 20

# Max items per page (for user-defined limits)
Pagy::DEFAULT[:max_limit] = 100

# Frontend extras
require "pagy/extras/overflow"
require "pagy/extras/pagy"
Pagy::DEFAULT[:overflow] = :empty_page

# Size configuration for pagination links
# Shows: first 1, gap, 2 around current, gap, last 1
Pagy::DEFAULT[:size] = 7

# Use Rails I18n for translations
require "pagy/extras/i18n"
