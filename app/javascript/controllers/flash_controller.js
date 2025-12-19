import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="flash"
export default class extends Controller {
  static targets = ["message"]

  connect() {
    // Auto dismiss after 5 seconds
    this.messageTargets.forEach((message, index) => {
      setTimeout(() => {
        this.dismissMessage(message)
      }, 5000 + (index * 500))
    })
  }

  dismiss(event) {
    const message = event.currentTarget.closest("[data-flash-target='message']")
    if (message) {
      this.dismissMessage(message)
    }
  }

  dismissMessage(message) {
    message.classList.add("opacity-0", "translate-x-4")
    setTimeout(() => {
      message.remove()
    }, 300)
  }
}
