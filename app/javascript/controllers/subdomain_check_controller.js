import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="subdomain-check"
export default class extends Controller {
  static targets = ["input", "status", "result", "preview", "submit"]
  static values = {
    url: String,
    domain: { type: String, default: ".mybdr.kr" },
    minLength: { type: Number, default: 3 },
    maxLength: { type: Number, default: 30 }
  }

  connect() {
    this.debounceTimer = null
    this.currentSubdomain = this.inputTarget.value
  }

  disconnect() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
  }

  check() {
    const subdomain = this.inputTarget.value.trim().toLowerCase()

    // Clear previous timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    // Basic validation
    if (!this.validateFormat(subdomain)) {
      return
    }

    // Update preview immediately
    this.updatePreview(subdomain)

    // Debounce API call
    this.debounceTimer = setTimeout(() => {
      this.checkAvailability(subdomain)
    }, 300)
  }

  validateFormat(subdomain) {
    // Empty check
    if (!subdomain) {
      this.setStatus("waiting", "서브도메인을 입력하세요")
      this.disableSubmit()
      return false
    }

    // Length check
    if (subdomain.length < this.minLengthValue) {
      this.setStatus("error", `최소 ${this.minLengthValue}자 이상 입력하세요`)
      this.disableSubmit()
      return false
    }

    if (subdomain.length > this.maxLengthValue) {
      this.setStatus("error", `최대 ${this.maxLengthValue}자까지 가능합니다`)
      this.disableSubmit()
      return false
    }

    // Format check (lowercase alphanumeric and hyphens)
    const validFormat = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/
    if (!validFormat.test(subdomain)) {
      this.setStatus("error", "영문 소문자, 숫자, 하이픈만 사용 가능합니다")
      this.disableSubmit()
      return false
    }

    // No consecutive hyphens
    if (subdomain.includes("--")) {
      this.setStatus("error", "연속된 하이픈은 사용할 수 없습니다")
      this.disableSubmit()
      return false
    }

    return true
  }

  async checkAvailability(subdomain) {
    this.setStatus("checking", "확인 중...")

    try {
      const response = await fetch(`${this.urlValue}?subdomain=${encodeURIComponent(subdomain)}`, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      })

      const data = await response.json()

      if (data.available) {
        this.setStatus("available", "사용 가능한 주소입니다")
        this.enableSubmit()
      } else {
        this.setStatus("unavailable", data.message || "이미 사용 중인 주소입니다")
        this.disableSubmit()
      }
    } catch (error) {
      console.error("Subdomain check error:", error)
      this.setStatus("error", "확인 중 오류가 발생했습니다")
      this.disableSubmit()
    }
  }

  setStatus(type, message) {
    // Support both status and result targets
    const statusTarget = this.hasStatusTarget ? this.statusTarget :
                         this.hasResultTarget ? this.resultTarget : null

    if (!statusTarget) return

    // Reset classes
    statusTarget.classList.remove(
      "text-gray-500", "text-green-600", "text-red-600", "text-yellow-600"
    )

    // Add appropriate class
    switch (type) {
      case "available":
        statusTarget.classList.add("text-green-600")
        statusTarget.innerHTML = `<span class="flex items-center gap-1">✓ ${message}</span>`
        break
      case "unavailable":
      case "error":
        statusTarget.classList.add("text-red-600")
        statusTarget.innerHTML = `<span class="flex items-center gap-1">✗ ${message}</span>`
        break
      case "checking":
        statusTarget.classList.add("text-yellow-600")
        statusTarget.innerHTML = `<span class="flex items-center gap-1">
          <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          ${message}
        </span>`
        break
      default:
        statusTarget.classList.add("text-gray-500")
        statusTarget.textContent = message
    }
  }

  // Suggest a subdomain value from button click
  suggest(event) {
    const value = event.currentTarget.dataset.value
    if (value && this.hasInputTarget) {
      this.inputTarget.value = value
      this.check()
    }
  }

  // Toggle custom domain field visibility
  toggleCustomDomain(event) {
    const customDomainField = document.getElementById('custom_domain_field')
    if (customDomainField) {
      customDomainField.classList.toggle('hidden', !event.target.checked)
    }
  }

  updatePreview(subdomain) {
    if (this.hasPreviewTarget) {
      // Only show the subdomain part (domain is separate in the view)
      const preview = subdomain || 'your-tournament'
      this.previewTarget.textContent = preview
    }
  }

  enableSubmit() {
    if (this.hasSubmitTarget) {
      this.submitTarget.disabled = false
      this.submitTarget.classList.remove("opacity-50", "cursor-not-allowed")
    }
  }

  disableSubmit() {
    if (this.hasSubmitTarget) {
      this.submitTarget.disabled = true
      this.submitTarget.classList.add("opacity-50", "cursor-not-allowed")
    }
  }

  // Transform input to valid subdomain format
  transform() {
    let value = this.inputTarget.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

    this.inputTarget.value = value
    this.check()
  }
}
