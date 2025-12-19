import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="clipboard"
export default class extends Controller {
  static values = { text: String }

  copy() {
    const text = this.textValue || this.element.dataset.clipboardText

    navigator.clipboard.writeText(text).then(() => {
      // Show success feedback
      const originalHtml = this.element.innerHTML
      const originalClasses = this.element.className

      // Add success styling with backdrop blur effect
      this.element.classList.add("bg-white/80", "backdrop-blur-sm", "text-green-600")
      this.element.classList.remove("bg-black/60", "bg-white/90", "text-gray-600", "text-white", "hover:text-primary-600")

      this.element.innerHTML = `
        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        복사됨
      `

      setTimeout(() => {
        this.element.innerHTML = originalHtml
        this.element.className = originalClasses
      }, 2000)
    }).catch((err) => {
      console.error("Failed to copy text: ", err)
    })
  }
}
