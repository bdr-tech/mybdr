import { Controller } from "@hotwired/stimulus"

// Template selection controller for wizard Step 1
// Handles template selection and updates hidden field in the form
export default class extends Controller {
  select(event) {
    const templateId = event.target.value
    const container = document.getElementById("selected-template-field")

    if (container) {
      // Update or create hidden field with selected template_id
      container.innerHTML = `<input type="hidden" name="template_id" value="${templateId}">`
    }

    // Visual feedback - highlight selected template
    this.updateVisualSelection(event.target)
  }

  updateVisualSelection(selectedInput) {
    // Remove highlight from all template cards
    document.querySelectorAll('input[name="template_id"]').forEach(input => {
      const label = input.closest('label')
      if (label) {
        const card = label.querySelector('div.border-2')
        if (card) {
          card.classList.remove('border-primary-600', 'ring-2', 'ring-primary-600/20')
          card.classList.add('border-gray-200')
        }
      }
    })

    // Add highlight to selected template card
    const selectedLabel = selectedInput.closest('label')
    if (selectedLabel) {
      const selectedCard = selectedLabel.querySelector('div.border-2')
      if (selectedCard) {
        selectedCard.classList.remove('border-gray-200')
        selectedCard.classList.add('border-primary-600', 'ring-2', 'ring-primary-600/20')
      }
    }
  }
}
