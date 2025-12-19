# frozen_string_literal: true

module ApplicationHelper
  include Pagy::Frontend

  # Flash message type to alert class mapping
  def flash_class(type)
    case type.to_s
    when "success" then "alert-success"
    when "error", "alert" then "alert-error"
    when "warning" then "alert-warning"
    else "alert-info"
    end
  end

  # Format date for display
  def format_date(date, format = :short)
    return "-" unless date

    l(date, format: format)
  end

  # Format datetime for display
  def format_datetime(datetime, format = :short)
    return "-" unless datetime

    l(datetime, format: format)
  end

  # Time ago in words (Korean friendly)
  def time_ago(datetime)
    return "-" unless datetime

    time_ago_in_words(datetime) + " 전"
  end

  # Truncate text with ellipsis
  def truncate_text(text, length: 100)
    return "" unless text

    truncate(text, length: length, omission: "...")
  end

  # Number formatting helpers
  def format_number(number)
    number_with_delimiter(number)
  end

  def format_currency(amount)
    number_to_currency(amount, unit: "₩", precision: 0)
  end

  # Active link helper for navigation
  def nav_link_class(path, base_class: "")
    is_active = current_page?(path)
    active_class = is_active ? "text-primary-600 border-primary-600" : "text-gray-600 border-transparent"
    "#{base_class} #{active_class}".strip
  end

  # Generate page title
  def page_title(title = nil)
    base = "BDR"
    title.present? ? "#{title} - #{base}" : base
  end

  # Avatar URL helper (placeholder)
  def avatar_url(user, size: 100)
    if user.profile_image.present?
      user.profile_image
    else
      "https://ui-avatars.com/api/?name=#{CGI.escape(user.display_name)}&size=#{size}&background=DC2626&color=ffffff"
    end
  end

  # Render empty state
  def empty_state(icon: nil, title:, description: nil, action: nil, &block)
    render partial: "shared/empty_state", locals: {
      icon: icon,
      title: title,
      description: description,
      action: action,
      block: block
    }
  end

  # =============================================================================
  # SNS Embed Helpers
  # =============================================================================

  # Allowed HTML tags for rich text content
  ALLOWED_TAGS = %w[p br div span b strong i em u s strike del a ul ol li h1 h2 h3 h4 h5 h6 blockquote font].freeze
  ALLOWED_ATTRIBUTES = %w[href target rel style class color size face].freeze

  # Convert content with URLs to embedded content (for plain text)
  def embed_content(text)
    return "" if text.blank?

    # Split by newlines to process each line/paragraph
    lines = text.split(/\n/)

    processed_lines = lines.map do |line|
      # Check if the line is just a URL (with optional whitespace)
      stripped = line.strip

      if youtube_url?(stripped)
        embed_youtube(stripped)
      elsif youtube_shorts_url?(stripped)
        embed_youtube_shorts(stripped)
      elsif instagram_url?(stripped)
        embed_instagram(stripped)
      elsif twitter_url?(stripped)
        embed_twitter(stripped)
      elsif tiktok_url?(stripped)
        embed_tiktok(stripped)
      else
        # Normal text - escape HTML and auto-link URLs
        safe_line = h(line)
        auto_link_urls(safe_line)
      end
    end

    processed_lines.join("\n").html_safe
  end

  # Render content with embeds and proper formatting (for plain text)
  def render_with_embeds(text)
    return "" if text.blank?

    # Check if content is HTML (from rich text editor)
    if text.include?("<") && text.include?(">")
      render_rich_text_with_embeds(text)
    else
      # Plain text content
      content_tag(:div, class: "prose prose-gray max-w-none embed-content") do
        simple_format(embed_content(text), {}, sanitize: false)
      end
    end
  end

  # Render rich text HTML content with SNS embeds
  def render_rich_text_with_embeds(html_content)
    return "" if html_content.blank?

    # Sanitize HTML first
    sanitized = sanitize_rich_text(html_content)

    # Process URLs for embedding
    processed = process_urls_for_embedding(sanitized)

    content_tag(:div, class: "prose prose-gray max-w-none rich-text-content embed-content") do
      processed.html_safe
    end
  end

  # Sanitize rich text HTML
  def sanitize_rich_text(html)
    ActionController::Base.helpers.sanitize(
      html,
      tags: ALLOWED_TAGS,
      attributes: ALLOWED_ATTRIBUTES
    )
  end

  # Process URLs in HTML content for embedding
  def process_urls_for_embedding(html)
    return html if html.blank?

    # Find standalone URLs (not already in anchor tags)
    # Match URLs that are either at start of line, after whitespace, or in their own paragraph
    url_pattern = %r{(?<![href="\'])(?<![">])(https?://(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/|instagram\.com/(?:p|reel|tv)/|(?:twitter|x)\.com/[^/]+/status/|tiktok\.com/|vm\.tiktok\.com/)[^\s<"\']+)}

    html.gsub(url_pattern) do |url|
      stripped = url.strip
      if youtube_url?(stripped)
        embed_youtube(stripped)
      elsif youtube_shorts_url?(stripped)
        embed_youtube_shorts(stripped)
      elsif instagram_url?(stripped)
        embed_instagram(stripped)
      elsif twitter_url?(stripped)
        embed_twitter(stripped)
      elsif tiktok_url?(stripped)
        embed_tiktok(stripped)
      else
        url
      end
    end
  end

  private

  # YouTube regular video URL detection
  def youtube_url?(url)
    url.match?(%r{^https?://(www\.)?(youtube\.com/watch\?v=|youtu\.be/)[a-zA-Z0-9_-]+})
  end

  # YouTube Shorts URL detection
  def youtube_shorts_url?(url)
    url.match?(%r{^https?://(www\.)?youtube\.com/shorts/[a-zA-Z0-9_-]+})
  end

  # Extract YouTube video ID
  def extract_youtube_id(url)
    if url.include?("youtu.be/")
      url.split("youtu.be/").last.split(/[?&#]/).first
    elsif url.include?("youtube.com/shorts/")
      url.split("shorts/").last.split(/[?&#]/).first
    else
      uri = URI.parse(url)
      params = URI.decode_www_form(uri.query || "").to_h
      params["v"]
    end
  rescue
    nil
  end

  # Embed YouTube video
  def embed_youtube(url)
    video_id = extract_youtube_id(url)
    return h(url) unless video_id

    content_tag(:div, class: "embed-container youtube-embed my-4") do
      content_tag(:iframe,
        "",
        src: "https://www.youtube.com/embed/#{video_id}",
        frameborder: "0",
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
        allowfullscreen: true,
        class: "w-full aspect-video rounded-lg"
      )
    end
  end

  # Embed YouTube Shorts (vertical format)
  def embed_youtube_shorts(url)
    video_id = extract_youtube_id(url)
    return h(url) unless video_id

    content_tag(:div, class: "embed-container youtube-shorts-embed my-4 flex justify-center") do
      content_tag(:iframe,
        "",
        src: "https://www.youtube.com/embed/#{video_id}",
        frameborder: "0",
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
        allowfullscreen: true,
        class: "w-[315px] h-[560px] max-w-full rounded-lg"
      )
    end
  end

  # Instagram URL detection
  def instagram_url?(url)
    url.match?(%r{^https?://(www\.)?instagram\.com/(p|reel|tv)/[a-zA-Z0-9_-]+})
  end

  # Extract Instagram post ID
  def extract_instagram_id(url)
    match = url.match(%r{instagram\.com/(p|reel|tv)/([a-zA-Z0-9_-]+)})
    match ? match[2] : nil
  end

  # Embed Instagram post
  def embed_instagram(url)
    post_id = extract_instagram_id(url)
    return auto_link_urls(h(url)) unless post_id

    # Instagram oEmbed - render as a styled link with preview option
    content_tag(:div, class: "embed-container instagram-embed my-4 p-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-lg") do
      content_tag(:a,
        href: url,
        target: "_blank",
        rel: "noopener noreferrer",
        class: "flex items-center gap-3 text-white no-underline hover:opacity-90"
      ) do
        content_tag(:div, class: "flex-shrink-0") do
          content_tag(:svg, class: "w-8 h-8", fill: "currentColor", viewBox: "0 0 24 24") do
            content_tag(:path, "", d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z")
          end
        end +
        content_tag(:div) do
          content_tag(:p, "Instagram에서 보기", class: "font-medium") +
          content_tag(:p, url.truncate(40), class: "text-sm opacity-80")
        end
      end
    end
  end

  # Twitter/X URL detection
  def twitter_url?(url)
    url.match?(%r{^https?://(www\.)?(twitter\.com|x\.com)/[a-zA-Z0-9_]+/status/\d+})
  end

  # Embed Twitter/X post
  def embed_twitter(url)
    content_tag(:div, class: "embed-container twitter-embed my-4 p-4 bg-black rounded-lg") do
      content_tag(:a,
        href: url,
        target: "_blank",
        rel: "noopener noreferrer",
        class: "flex items-center gap-3 text-white no-underline hover:opacity-90"
      ) do
        content_tag(:div, class: "flex-shrink-0") do
          # X logo
          content_tag(:svg, class: "w-6 h-6", fill: "currentColor", viewBox: "0 0 24 24") do
            content_tag(:path, "", d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z")
          end
        end +
        content_tag(:div) do
          content_tag(:p, "X(Twitter)에서 보기", class: "font-medium") +
          content_tag(:p, url.truncate(40), class: "text-sm opacity-60")
        end
      end
    end
  end

  # TikTok URL detection
  def tiktok_url?(url)
    url.match?(%r{^https?://(www\.)?(tiktok\.com|vm\.tiktok\.com)/})
  end

  # Embed TikTok post
  def embed_tiktok(url)
    content_tag(:div, class: "embed-container tiktok-embed my-4 p-4 bg-black rounded-lg") do
      content_tag(:a,
        href: url,
        target: "_blank",
        rel: "noopener noreferrer",
        class: "flex items-center gap-3 text-white no-underline hover:opacity-90"
      ) do
        content_tag(:div, class: "flex-shrink-0") do
          # TikTok logo
          content_tag(:svg, class: "w-6 h-6", fill: "currentColor", viewBox: "0 0 24 24") do
            content_tag(:path, "", d: "M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z")
          end
        end +
        content_tag(:div) do
          content_tag(:p, "TikTok에서 보기", class: "font-medium") +
          content_tag(:p, url.truncate(40), class: "text-sm opacity-60")
        end
      end
    end
  end

  # Auto-link URLs in text
  def auto_link_urls(text)
    url_regex = %r{(https?://[^\s<>"{}|\\^`\[\]]+)}
    text.gsub(url_regex) do |url|
      "<a href=\"#{url}\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-primary-600 hover:text-primary-700 underline\">#{url.truncate(50)}</a>"
    end
  end

  public

  # Tournament bracket round display name
  def round_display_name(round_number, total_rounds)
    remaining_teams = 2 ** (total_rounds - round_number + 1)
    case remaining_teams
    when 2
      "결승"
    when 4
      "준결승"
    when 8
      "8강"
    when 16
      "16강"
    when 32
      "32강"
    else
      "#{round_number}라운드"
    end
  end
end
