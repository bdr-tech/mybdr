import { Controller } from "@hotwired/stimulus"

// Admin Mode Toggle Controller
// Handles switching between normal user and admin mode
export default class extends Controller {
  static targets = ["normalBtn", "adminBtn"]

  connect() {
    // Controller connected
  }

  selectNormal(event) {
    event.preventDefault()
    this.updateMode(false)
  }

  selectAdmin(event) {
    event.preventDefault()
    this.updateMode(true)
  }

  async updateMode(isAdmin) {
    // Update UI immediately for responsiveness
    this.updateButtonStyles(isAdmin)

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }

    try {
      const response = await fetch("/profile/admin_mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": document.querySelector("meta[name='csrf-token']")?.content,
          "Accept": "application/json"
        },
        body: JSON.stringify({ admin_mode: isAdmin })
      })

      if (response.ok) {
        // Reload the page to reflect changes
        window.location.reload()
      } else {
        // Revert UI if request failed
        this.updateButtonStyles(!isAdmin)
        this.showToast("모드 전환에 실패했습니다", "error")
      }
    } catch (error) {
      console.error("Error updating admin mode:", error)
      // Revert UI if request failed
      this.updateButtonStyles(!isAdmin)
      this.showToast("모드 전환에 실패했습니다", "error")
    }
  }

  updateButtonStyles(isAdmin) {
    if (isAdmin) {
      this.normalBtnTarget.classList.remove("mode-toggle-option-active")
      this.adminBtnTarget.classList.add("mode-toggle-option-active")
    } else {
      this.normalBtnTarget.classList.add("mode-toggle-option-active")
      this.adminBtnTarget.classList.remove("mode-toggle-option-active")
    }
  }

  showToast(message, type = "success") {
    const toast = document.createElement("div")
    toast.className = `fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl text-sm font-medium z-[60] transition-all duration-300 ${
      type === "success" ? "bg-gray-900 text-white" : "bg-red-500 text-white"
    }`
    toast.textContent = message
    toast.style.opacity = "0"
    toast.style.transform = "translateX(-50%) translateY(10px)"

    document.body.appendChild(toast)

    requestAnimationFrame(() => {
      toast.style.opacity = "1"
      toast.style.transform = "translateX(-50%) translateY(0)"
    })

    setTimeout(() => {
      toast.style.opacity = "0"
      toast.style.transform = "translateX(-50%) translateY(10px)"
      setTimeout(() => toast.remove(), 300)
    }, 2000)
  }
}
