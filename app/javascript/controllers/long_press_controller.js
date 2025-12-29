import { Controller } from "@hotwired/stimulus"

// Long Press Controller
// Detects long press gestures for adding board favorites
export default class extends Controller {
  static values = {
    duration: { type: Number, default: 500 },
    category: String,
    favorited: { type: Boolean, default: false }
  }

  connect() {
    this.timeout = null
    this.isLongPressing = false
  }

  disconnect() {
    this.clearTimeout()
  }

  start(event) {
    // Only handle left mouse button or touch
    if (event.type === "mousedown" && event.button !== 0) return

    this.isLongPressing = false
    this.startX = event.touches ? event.touches[0].clientX : event.clientX
    this.startY = event.touches ? event.touches[0].clientY : event.clientY

    this.timeout = setTimeout(() => {
      this.triggerLongPress()
    }, this.durationValue)

    // Add visual indicator
    this.element.classList.add("long-press-active")
  }

  end(event) {
    this.clearTimeout()
    this.element.classList.remove("long-press-active")

    // If it was a long press, prevent the default link action
    if (this.isLongPressing) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  move(event) {
    // Cancel if moved too far (scrolling)
    const x = event.touches ? event.touches[0].clientX : event.clientX
    const y = event.touches ? event.touches[0].clientY : event.clientY
    const distance = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2))

    if (distance > 10) {
      this.clearTimeout()
      this.element.classList.remove("long-press-active")
    }
  }

  clearTimeout() {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
  }

  async triggerLongPress() {
    this.isLongPressing = true
    this.element.classList.remove("long-press-active")

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50])
    }

    // Toggle favorite status
    const category = this.categoryValue
    const isFavorited = this.favoritedValue

    try {
      const response = await fetch(isFavorited ? `/board_favorites/${category}` : "/board_favorites", {
        method: isFavorited ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": document.querySelector("meta[name='csrf-token']")?.content,
          "Accept": "application/json"
        },
        body: isFavorited ? null : JSON.stringify({ category })
      })

      if (response.ok) {
        // Show success feedback
        this.showToast(isFavorited ? "즐겨찾기에서 제거했습니다" : "즐겨찾기에 추가했습니다")

        // Update the UI
        this.favoritedValue = !isFavorited

        // Reload the page to reflect changes
        window.location.reload()
      } else {
        this.showToast("오류가 발생했습니다", "error")
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      this.showToast("오류가 발생했습니다", "error")
    }
  }

  showToast(message, type = "success") {
    // Create toast element
    const toast = document.createElement("div")
    toast.className = `fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl text-sm font-medium z-[60] transition-all duration-300 ${
      type === "success" ? "bg-gray-900 text-white" : "bg-red-500 text-white"
    }`
    toast.textContent = message
    toast.style.opacity = "0"
    toast.style.transform = "translateX(-50%) translateY(10px)"

    document.body.appendChild(toast)

    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = "1"
      toast.style.transform = "translateX(-50%) translateY(0)"
    })

    // Remove after delay
    setTimeout(() => {
      toast.style.opacity = "0"
      toast.style.transform = "translateX(-50%) translateY(10px)"
      setTimeout(() => toast.remove(), 300)
    }, 2000)
  }
}
