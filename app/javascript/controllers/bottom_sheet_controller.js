import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["overlay", "sheet"]
  static values = { name: String }

  connect() {
    // Listen for global open events
    document.addEventListener('bottom-sheet:open', this.handleGlobalOpen.bind(this))
  }

  disconnect() {
    document.removeEventListener('bottom-sheet:open', this.handleGlobalOpen.bind(this))
  }

  handleGlobalOpen(event) {
    if (event.detail?.target === this.nameValue) {
      this.open()
    }
  }

  open(event) {
    // Check if this is the targeted sheet
    const targetName = event?.params?.target || event?.detail?.target || this.nameValue
    if (targetName !== this.nameValue) return

    this.element.classList.remove("hidden")

    // Force reflow for animation
    requestAnimationFrame(() => {
      this.overlayTarget.classList.add("opacity-100")
      this.sheetTarget.classList.remove("translate-y-full")
    })

    // Prevent body scroll
    document.body.classList.add("overflow-hidden")
  }

  close() {
    this.sheetTarget.classList.add("translate-y-full")
    this.overlayTarget.classList.remove("opacity-100")

    // Hide after animation completes
    setTimeout(() => {
      this.element.classList.add("hidden")
      document.body.classList.remove("overflow-hidden")
    }, 300)
  }

  // Handle escape key
  keydown(event) {
    if (event.key === "Escape") {
      this.close()
    }
  }
}
