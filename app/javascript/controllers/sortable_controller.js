import { Controller } from "@hotwired/stimulus"
import Sortable from "sortablejs"

// Connects to data-controller="sortable"
export default class extends Controller {
  static targets = ["list"]
  static values = {
    url: String,
    handle: { type: String, default: ".drag-handle" },
    group: String,
    animation: { type: Number, default: 150 }
  }

  connect() {
    this.initSortable()
  }

  disconnect() {
    if (this.sortable) {
      this.sortable.destroy()
    }
  }

  initSortable() {
    const options = {
      handle: this.handleValue,
      animation: this.animationValue,
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",
      dragClass: "sortable-drag",
      onEnd: this.onEnd.bind(this)
    }

    if (this.hasGroupValue) {
      options.group = this.groupValue
    }

    this.sortable = Sortable.create(this.listTarget, options)
  }

  async onEnd(event) {
    if (!this.hasUrlValue) return
    if (event.oldIndex === event.newIndex) return

    const item = event.item
    const itemId = item.dataset.itemId

    try {
      const response = await fetch(this.urlValue, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": this.csrfToken
        },
        body: JSON.stringify({
          id: itemId,
          position: event.newIndex
        })
      })

      if (!response.ok) {
        throw new Error("Failed to update position")
      }

      this.dispatch("sorted", { detail: { itemId, newIndex: event.newIndex } })
    } catch (error) {
      console.error("Sortable error:", error)
      // Revert the sort if API call fails
      if (event.oldIndex < event.newIndex) {
        event.from.insertBefore(event.item, event.from.children[event.oldIndex])
      } else {
        event.from.insertBefore(event.item, event.from.children[event.oldIndex + 1])
      }
    }
  }

  get csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content
  }
}
