import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="design-preview"
export default class extends Controller {
  static targets = ["primaryColor", "secondaryColor", "preview", "previewFrame", "colorInput"]
  static values = {
    previewUrl: String
  }

  connect() {
    // Find color input if not using targets
    this.colorInputElement = this.hasColorInputTarget ? this.colorInputTarget :
                             this.element.querySelector('input[type="color"][name="primary_color"]')
    this.updatePreviewFromInput()
  }

  // Called when color picker changes
  updateColor(event) {
    const color = event.target.value
    this.applyColor(color)
  }

  // Called when preset button is clicked
  selectColor(event) {
    event.preventDefault()
    const color = event.currentTarget.dataset.color
    if (color && this.colorInputElement) {
      this.colorInputElement.value = color
      this.applyColor(color)
    }
  }

  applyColor(color) {
    // Update preview element background
    if (this.hasPreviewTarget) {
      const heroDiv = this.previewTarget.querySelector('.aspect-video')
      if (heroDiv) {
        heroDiv.style.backgroundColor = color
      }
    }

    // Update CSS custom property
    document.documentElement.style.setProperty("--preview-color", color)
  }

  updatePreviewFromInput() {
    if (this.colorInputElement) {
      this.applyColor(this.colorInputElement.value || "#E53E3E")
    }
  }

  updatePreview() {
    const primaryColor = this.hasPrimaryColorTarget ? this.primaryColorTarget.value : "#E53E3E"
    const secondaryColor = this.hasSecondaryColorTarget ? this.secondaryColorTarget.value : "#ED8936"

    // Update CSS custom properties
    document.documentElement.style.setProperty("--preview-primary", primaryColor)
    document.documentElement.style.setProperty("--preview-secondary", secondaryColor)

    // Update preview elements
    if (this.hasPreviewTarget) {
      const previewElements = this.previewTarget.querySelectorAll("[data-color-type]")
      previewElements.forEach(el => {
        const colorType = el.dataset.colorType
        if (colorType === "primary") {
          el.style.backgroundColor = primaryColor
        } else if (colorType === "secondary") {
          el.style.backgroundColor = secondaryColor
        } else if (colorType === "primary-text") {
          el.style.color = primaryColor
        } else if (colorType === "secondary-text") {
          el.style.color = secondaryColor
        }
      })
    }

    // Update iframe if exists
    if (this.hasPreviewFrameTarget && this.hasPreviewUrlValue) {
      this.updateIframePreview(primaryColor, secondaryColor)
    }

    // Dispatch event for other components
    this.dispatch("changed", { detail: { primaryColor, secondaryColor } })
  }

  updateIframePreview(primaryColor, secondaryColor) {
    try {
      const iframe = this.previewFrameTarget
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
      const style = iframeDoc.documentElement.style
      style.setProperty("--primary-color", primaryColor)
      style.setProperty("--secondary-color", secondaryColor)
    } catch (e) {
      // Cross-origin iframe, use postMessage
      this.previewFrameTarget.contentWindow.postMessage({
        type: "theme-update",
        primaryColor,
        secondaryColor
      }, "*")
    }
  }

  // Preset theme selection
  selectPreset(event) {
    const preset = event.currentTarget.dataset.preset
    const presets = {
      default: { primary: "#E53E3E", secondary: "#ED8936" },
      blue: { primary: "#3182CE", secondary: "#63B3ED" },
      green: { primary: "#38A169", secondary: "#68D391" },
      purple: { primary: "#805AD5", secondary: "#B794F4" },
      dark: { primary: "#1A202C", secondary: "#4A5568" },
      orange: { primary: "#DD6B20", secondary: "#F6AD55" },
      teal: { primary: "#319795", secondary: "#4FD1C5" },
      pink: { primary: "#D53F8C", secondary: "#F687B3" }
    }

    if (presets[preset]) {
      this.primaryColorTarget.value = presets[preset].primary
      this.secondaryColorTarget.value = presets[preset].secondary
      this.updatePreview()
    }
  }

  // Reset to default colors
  reset() {
    this.primaryColorTarget.value = "#E53E3E"
    this.secondaryColorTarget.value = "#ED8936"
    this.updatePreview()
  }
}
