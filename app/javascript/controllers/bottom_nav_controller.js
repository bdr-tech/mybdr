import { Controller } from "@hotwired/stimulus"

// Bottom Navigation Controller
// Handles the slide-up menu panel for mobile navigation
export default class extends Controller {
  static targets = ["menuPanel", "menuContent", "backdrop", "menuButton"]

  connect() {
    this.isOpen = false
    // Bind escape key to close menu
    this.boundHandleKeydown = this.handleKeydown.bind(this)
    document.addEventListener("keydown", this.boundHandleKeydown)
  }

  disconnect() {
    document.removeEventListener("keydown", this.boundHandleKeydown)
    this.enableScroll()
  }

  openMenu(event) {
    event.preventDefault()
    if (this.isOpen) return

    this.isOpen = true
    this.menuPanelTarget.classList.remove("hidden")
    this.disableScroll()

    // Trigger haptic feedback on supported devices
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }
  }

  closeMenu(event) {
    if (event) event.preventDefault()
    if (!this.isOpen) return

    this.isOpen = false

    // Animate out
    this.menuContentTarget.classList.remove("animate-slide-up")
    this.menuContentTarget.classList.add("animate-slide-down")
    this.backdropTarget.style.opacity = "0"

    // Hide after animation
    setTimeout(() => {
      this.menuPanelTarget.classList.add("hidden")
      this.menuContentTarget.classList.remove("animate-slide-down")
      this.menuContentTarget.classList.add("animate-slide-up")
      this.backdropTarget.style.opacity = ""
      this.enableScroll()
    }, 250)
  }

  backdropClick(event) {
    // Close only if clicking on backdrop, not on menu content
    if (event.target === this.menuPanelTarget || event.target === this.backdropTarget) {
      this.closeMenu(event)
    }
  }

  handleKeydown(event) {
    if (event.key === "Escape" && this.isOpen) {
      this.closeMenu()
    }
  }

  disableScroll() {
    document.body.style.overflow = "hidden"
    document.body.style.position = "fixed"
    document.body.style.width = "100%"
    document.body.style.top = `-${window.scrollY}px`
  }

  enableScroll() {
    const scrollY = document.body.style.top
    document.body.style.overflow = ""
    document.body.style.position = ""
    document.body.style.width = ""
    document.body.style.top = ""
    window.scrollTo(0, parseInt(scrollY || "0") * -1)
  }
}
