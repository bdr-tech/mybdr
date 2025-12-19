import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="mobile-menu"
export default class extends Controller {
  static targets = ["menu"]

  toggle() {
    if (this.hasMenuTarget) {
      this.menuTarget.classList.toggle("hidden")
    }
  }

  close() {
    if (this.hasMenuTarget) {
      this.menuTarget.classList.add("hidden")
    }
  }
}
