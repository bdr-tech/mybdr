import { Controller } from "@hotwired/stimulus"
import Sortable from "sortablejs"

// Connects to data-controller="page-editor"
export default class extends Controller {
  static targets = [
    "sectionList",
    "sectionPalette",
    "sectionModal",
    "sectionForm",
    "preview"
  ]

  static values = {
    pageId: String,
    sectionsUrl: String,
    reorderUrl: String
  }

  connect() {
    this.initSortable()
    this.initPaletteSortable()
  }

  disconnect() {
    if (this.sortable) this.sortable.destroy()
    if (this.paletteSortable) this.paletteSortable.destroy()
  }

  initSortable() {
    if (!this.hasSectionListTarget) return

    this.sortable = Sortable.create(this.sectionListTarget, {
      handle: ".section-drag-handle",
      animation: 150,
      ghostClass: "bg-blue-50",
      chosenClass: "bg-blue-100",
      dragClass: "shadow-lg",
      onEnd: this.onSectionReorder.bind(this)
    })
  }

  initPaletteSortable() {
    if (!this.hasSectionPaletteTarget) return

    this.paletteSortable = Sortable.create(this.sectionPaletteTarget, {
      group: {
        name: "sections",
        pull: "clone",
        put: false
      },
      sort: false,
      animation: 150,
      onEnd: this.onPaletteDrop.bind(this)
    })

    // Also make section list accept drops from palette
    if (this.sortable) {
      this.sortable.option("group", {
        name: "sections",
        pull: true,
        put: true
      })
    }
  }

  async onSectionReorder(event) {
    if (event.oldIndex === event.newIndex) return

    const sectionIds = Array.from(this.sectionListTarget.children)
      .map(el => el.dataset.sectionId)
      .filter(id => id)

    try {
      const response = await fetch(this.reorderUrlValue, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": this.csrfToken
        },
        body: JSON.stringify({ section_ids: sectionIds })
      })

      if (!response.ok) {
        throw new Error("Reorder failed")
      }

      this.showToast("순서가 변경되었습니다", "success")
    } catch (error) {
      console.error("Reorder error:", error)
      this.showToast("순서 변경에 실패했습니다", "error")
      // Refresh to restore original order
      window.location.reload()
    }
  }

  onPaletteDrop(event) {
    // If dropped into section list, create new section
    if (event.to === this.sectionListTarget) {
      const sectionType = event.item.dataset.sectionType
      event.item.remove() // Remove the cloned element
      this.addSection(sectionType, event.newIndex)
    }
  }

  addSection(sectionType, position = null) {
    this.openSectionModal(sectionType, position)
  }

  editSection(event) {
    const sectionId = event.currentTarget.closest("[data-section-id]").dataset.sectionId
    this.openSectionModal(null, null, sectionId)
  }

  async deleteSection(event) {
    if (!confirm("이 섹션을 삭제하시겠습니까?")) return

    const sectionElement = event.currentTarget.closest("[data-section-id]")
    const sectionId = sectionElement.dataset.sectionId

    try {
      const response = await fetch(`${this.sectionsUrlValue}/${sectionId}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": this.csrfToken,
          "Accept": "application/json"
        }
      })

      if (response.ok) {
        sectionElement.classList.add("opacity-0", "scale-95", "transition-all")
        setTimeout(() => sectionElement.remove(), 200)
        this.showToast("섹션이 삭제되었습니다", "success")
      } else {
        throw new Error("Delete failed")
      }
    } catch (error) {
      console.error("Delete error:", error)
      this.showToast("삭제에 실패했습니다", "error")
    }
  }

  duplicateSection(event) {
    const sectionId = event.currentTarget.closest("[data-section-id]").dataset.sectionId
    this.createSectionCopy(sectionId)
  }

  async createSectionCopy(sectionId) {
    try {
      const response = await fetch(`${this.sectionsUrlValue}/${sectionId}/duplicate`, {
        method: "POST",
        headers: {
          "X-CSRF-Token": this.csrfToken,
          "Accept": "text/vnd.turbo-stream.html"
        }
      })

      if (response.ok) {
        this.showToast("섹션이 복제되었습니다", "success")
      } else {
        throw new Error("Duplicate failed")
      }
    } catch (error) {
      console.error("Duplicate error:", error)
      this.showToast("복제에 실패했습니다", "error")
    }
  }

  toggleVisibility(event) {
    const sectionElement = event.currentTarget.closest("[data-section-id]")
    const sectionId = sectionElement.dataset.sectionId
    const currentlyVisible = sectionElement.dataset.visible !== "false"

    this.updateSectionVisibility(sectionId, !currentlyVisible, sectionElement)
  }

  async updateSectionVisibility(sectionId, isVisible, element) {
    try {
      const response = await fetch(`${this.sectionsUrlValue}/${sectionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": this.csrfToken
        },
        body: JSON.stringify({ site_section: { is_visible: isVisible } })
      })

      if (response.ok) {
        element.dataset.visible = isVisible.toString()
        element.classList.toggle("opacity-50", !isVisible)
        const icon = element.querySelector("[data-visibility-icon]")
        if (icon) {
          icon.innerHTML = isVisible ? "👁️" : "👁️‍🗨️"
        }
        this.showToast(isVisible ? "섹션을 표시합니다" : "섹션을 숨깁니다", "success")
      }
    } catch (error) {
      console.error("Visibility update error:", error)
    }
  }

  openSectionModal(sectionType = null, position = null, sectionId = null) {
    // Open modal via Turbo Frame
    let url = this.sectionsUrlValue

    if (sectionId) {
      url = `${url}/${sectionId}/edit`
    } else {
      url = `${url}/new?section_type=${sectionType}`
      if (position !== null) {
        url += `&position=${position}`
      }
    }

    // Use Turbo to load the modal
    Turbo.visit(url, { frame: "section_modal" })
  }

  closeModal() {
    if (this.hasSectionModalTarget) {
      this.sectionModalTarget.innerHTML = ""
      this.sectionModalTarget.classList.add("hidden")
    }
  }

  showToast(message, type = "info") {
    const toast = document.createElement("div")
    toast.className = `fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 transition-all transform translate-y-full ${
      type === "success" ? "bg-green-500 text-white" :
      type === "error" ? "bg-red-500 text-white" :
      "bg-gray-800 text-white"
    }`
    toast.textContent = message
    document.body.appendChild(toast)

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove("translate-y-full")
    })

    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.add("translate-y-full", "opacity-0")
      setTimeout(() => toast.remove(), 300)
    }, 3000)
  }

  get csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content
  }
}
