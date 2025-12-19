import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="dropdown"
export default class extends Controller {
  static targets = ["menu"]

  connect() {
    // Close dropdown when clicking outside
    this.clickOutsideHandler = this.clickOutside.bind(this)
    document.addEventListener("click", this.clickOutsideHandler)
  }

  disconnect() {
    document.removeEventListener("click", this.clickOutsideHandler)
  }

  toggle(event) {
    event.stopPropagation()
    this.menuTarget.classList.toggle("hidden")
  }

  clickOutside(event) {
    if (!this.element.contains(event.target)) {
      this.menuTarget.classList.add("hidden")
    }
  }
}
