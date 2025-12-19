import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="wizard"
export default class extends Controller {
  static targets = ["step", "indicator", "prevButton", "nextButton", "submitButton", "form"]
  static values = {
    currentStep: { type: Number, default: 1 },
    totalSteps: { type: Number, default: 5 },
    validateUrl: String
  }

  connect() {
    this.showStep(this.currentStepValue)
    this.updateButtons()
  }

  nextStep(event) {
    event.preventDefault()

    if (this.validateCurrentStep()) {
      if (this.currentStepValue < this.totalStepsValue) {
        this.currentStepValue++
        this.showStep(this.currentStepValue)
        this.updateButtons()
        this.updateIndicators()
        this.saveProgress()
      }
    }
  }

  prevStep(event) {
    event.preventDefault()

    if (this.currentStepValue > 1) {
      this.currentStepValue--
      this.showStep(this.currentStepValue)
      this.updateButtons()
      this.updateIndicators()
    }
  }

  goToStep(event) {
    const step = parseInt(event.currentTarget.dataset.step)

    // Only allow going to previous steps or current step
    if (step <= this.currentStepValue || this.isStepCompleted(step - 1)) {
      this.currentStepValue = step
      this.showStep(this.currentStepValue)
      this.updateButtons()
      this.updateIndicators()
    }
  }

  showStep(stepNumber) {
    this.stepTargets.forEach((step, index) => {
      const isCurrentStep = index + 1 === stepNumber

      if (isCurrentStep) {
        step.classList.remove("hidden")
        step.classList.add("animate-fade-in")
      } else {
        step.classList.add("hidden")
        step.classList.remove("animate-fade-in")
      }
    })

    // Scroll to top of wizard
    this.element.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  updateIndicators() {
    this.indicatorTargets.forEach((indicator, index) => {
      const stepNumber = index + 1
      const isCompleted = stepNumber < this.currentStepValue
      const isCurrent = stepNumber === this.currentStepValue

      // Reset classes
      indicator.classList.remove(
        "bg-primary-600", "text-white",
        "bg-green-600",
        "bg-gray-200", "text-gray-600"
      )

      if (isCompleted) {
        indicator.classList.add("bg-green-600", "text-white")
        indicator.innerHTML = "✓"
      } else if (isCurrent) {
        indicator.classList.add("bg-primary-600", "text-white")
        indicator.innerHTML = stepNumber
      } else {
        indicator.classList.add("bg-gray-200", "text-gray-600")
        indicator.innerHTML = stepNumber
      }
    })
  }

  updateButtons() {
    // Previous button
    if (this.hasPrevButtonTarget) {
      this.prevButtonTarget.classList.toggle("invisible", this.currentStepValue === 1)
    }

    // Next button
    if (this.hasNextButtonTarget) {
      this.nextButtonTarget.classList.toggle("hidden", this.currentStepValue === this.totalStepsValue)
    }

    // Submit button
    if (this.hasSubmitButtonTarget) {
      this.submitButtonTarget.classList.toggle("hidden", this.currentStepValue !== this.totalStepsValue)
    }
  }

  validateCurrentStep() {
    const currentStepElement = this.stepTargets[this.currentStepValue - 1]
    const requiredFields = currentStepElement.querySelectorAll("[required]")

    let isValid = true

    requiredFields.forEach(field => {
      // Clear previous validation state
      field.classList.remove("border-red-500")

      if (!field.value.trim()) {
        field.classList.add("border-red-500")
        isValid = false
      }

      // Custom validation for specific field types
      if (field.type === "email" && field.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(field.value)) {
          field.classList.add("border-red-500")
          isValid = false
        }
      }
    })

    if (!isValid) {
      this.showValidationError("필수 항목을 모두 입력해주세요")
    }

    return isValid
  }

  isStepCompleted(stepNumber) {
    if (stepNumber <= 0) return true
    if (stepNumber >= this.currentStepValue) return false

    const stepElement = this.stepTargets[stepNumber - 1]
    const requiredFields = stepElement.querySelectorAll("[required]")

    return Array.from(requiredFields).every(field => field.value.trim() !== "")
  }

  showValidationError(message) {
    const currentStepElement = this.stepTargets[this.currentStepValue - 1]
    let errorElement = currentStepElement.querySelector(".validation-error")

    if (!errorElement) {
      errorElement = document.createElement("div")
      errorElement.className = "validation-error bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4"
      currentStepElement.insertBefore(errorElement, currentStepElement.firstChild)
    }

    errorElement.textContent = message
    errorElement.classList.add("animate-shake")

    setTimeout(() => {
      errorElement.classList.remove("animate-shake")
    }, 500)

    setTimeout(() => {
      errorElement.remove()
    }, 5000)
  }

  saveProgress() {
    // Save wizard progress to session storage
    const formData = new FormData(this.formTarget)
    const data = Object.fromEntries(formData.entries())

    sessionStorage.setItem("wizard_progress", JSON.stringify({
      step: this.currentStepValue,
      data: data
    }))
  }

  restoreProgress() {
    const saved = sessionStorage.getItem("wizard_progress")
    if (saved) {
      const { step, data } = JSON.parse(saved)

      // Restore form data
      Object.entries(data).forEach(([name, value]) => {
        const field = this.formTarget.querySelector(`[name="${name}"]`)
        if (field) {
          field.value = value
        }
      })

      // Go to saved step
      this.currentStepValue = step
      this.showStep(this.currentStepValue)
      this.updateButtons()
      this.updateIndicators()
    }
  }

  clearProgress() {
    sessionStorage.removeItem("wizard_progress")
  }

  // Template selection handler
  selectTemplate(event) {
    const templateId = event.currentTarget.dataset.templateId

    // Update hidden field
    const hiddenField = this.formTarget.querySelector('[name="tournament[template_id]"]')
    if (hiddenField) {
      hiddenField.value = templateId
    }

    // Update visual selection
    this.element.querySelectorAll("[data-template-id]").forEach(el => {
      el.classList.remove("ring-2", "ring-primary-500", "border-primary-500")
      el.classList.add("border-gray-200")
    })

    event.currentTarget.classList.remove("border-gray-200")
    event.currentTarget.classList.add("ring-2", "ring-primary-500", "border-primary-500")

    // Auto-advance to next step
    setTimeout(() => {
      this.nextStep(new Event("click"))
    }, 300)
  }

  submit(event) {
    event.preventDefault()

    if (!this.validateCurrentStep()) return

    // Clear saved progress
    this.clearProgress()

    // Submit form
    this.formTarget.submit()
  }
}
