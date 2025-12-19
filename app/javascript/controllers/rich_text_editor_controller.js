import { Controller } from "@hotwired/stimulus"

// Rich Text Editor Controller
// Provides WYSIWYG editing with toolbar buttons for formatting
export default class extends Controller {
  static targets = ["editor", "hiddenInput", "toolbar"]

  static values = {
    placeholder: { type: String, default: "내용을 입력하세요..." }
  }

  connect() {
    this.setupEditor()
    this.loadContent()
  }

  setupEditor() {
    // Make editor contenteditable
    this.editorTarget.setAttribute("contenteditable", "true")
    this.editorTarget.classList.add("rich-text-editor")

    // Set placeholder
    if (!this.editorTarget.innerHTML.trim()) {
      this.editorTarget.setAttribute("data-placeholder", this.placeholderValue)
    }

    // Sync content to hidden input on input
    this.editorTarget.addEventListener("input", () => this.syncContent())
    this.editorTarget.addEventListener("paste", (e) => this.handlePaste(e))

    // Focus/blur for placeholder
    this.editorTarget.addEventListener("focus", () => this.handleFocus())
    this.editorTarget.addEventListener("blur", () => this.handleBlur())
  }

  loadContent() {
    // Load existing content from hidden input
    if (this.hiddenInputTarget.value) {
      this.editorTarget.innerHTML = this.hiddenInputTarget.value
    }
  }

  syncContent() {
    this.hiddenInputTarget.value = this.editorTarget.innerHTML
  }

  handleFocus() {
    this.editorTarget.classList.add("focused")
  }

  handleBlur() {
    this.editorTarget.classList.remove("focused")
    this.syncContent()
  }

  handlePaste(e) {
    // Allow HTML paste but clean it up
    e.preventDefault()

    let html = e.clipboardData.getData("text/html")
    let text = e.clipboardData.getData("text/plain")

    if (html) {
      // Clean HTML - only allow safe tags
      const cleanHtml = this.sanitizeHtml(html)
      document.execCommand("insertHTML", false, cleanHtml)
    } else {
      document.execCommand("insertText", false, text)
    }

    this.syncContent()
  }

  sanitizeHtml(html) {
    // Create a temporary element to parse HTML
    const temp = document.createElement("div")
    temp.innerHTML = html

    // Remove script tags and event handlers
    temp.querySelectorAll("script, style").forEach(el => el.remove())

    // Remove dangerous attributes
    const allElements = temp.querySelectorAll("*")
    allElements.forEach(el => {
      // Remove event handlers
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith("on")) {
          el.removeAttribute(attr.name)
        }
      })
    })

    return temp.innerHTML
  }

  // Toolbar actions
  bold(e) {
    e.preventDefault()
    document.execCommand("bold", false, null)
    this.editorTarget.focus()
    this.syncContent()
  }

  italic(e) {
    e.preventDefault()
    document.execCommand("italic", false, null)
    this.editorTarget.focus()
    this.syncContent()
  }

  underline(e) {
    e.preventDefault()
    document.execCommand("underline", false, null)
    this.editorTarget.focus()
    this.syncContent()
  }

  strikethrough(e) {
    e.preventDefault()
    document.execCommand("strikeThrough", false, null)
    this.editorTarget.focus()
    this.syncContent()
  }

  heading(e) {
    e.preventDefault()
    const level = e.currentTarget.dataset.level || "h2"
    document.execCommand("formatBlock", false, level)
    this.editorTarget.focus()
    this.syncContent()
  }

  paragraph(e) {
    e.preventDefault()
    document.execCommand("formatBlock", false, "p")
    this.editorTarget.focus()
    this.syncContent()
  }

  fontSize(e) {
    e.preventDefault()
    const size = e.currentTarget.dataset.size || "3"
    document.execCommand("fontSize", false, size)
    this.editorTarget.focus()
    this.syncContent()
  }

  textColor(e) {
    e.preventDefault()
    const color = e.currentTarget.dataset.color || e.currentTarget.value
    document.execCommand("foreColor", false, color)
    this.editorTarget.focus()
    this.syncContent()
  }

  bgColor(e) {
    e.preventDefault()
    const color = e.currentTarget.dataset.color || e.currentTarget.value
    document.execCommand("hiliteColor", false, color)
    this.editorTarget.focus()
    this.syncContent()
  }

  alignLeft(e) {
    e.preventDefault()
    document.execCommand("justifyLeft", false, null)
    this.editorTarget.focus()
    this.syncContent()
  }

  alignCenter(e) {
    e.preventDefault()
    document.execCommand("justifyCenter", false, null)
    this.editorTarget.focus()
    this.syncContent()
  }

  alignRight(e) {
    e.preventDefault()
    document.execCommand("justifyRight", false, null)
    this.editorTarget.focus()
    this.syncContent()
  }

  bulletList(e) {
    e.preventDefault()
    document.execCommand("insertUnorderedList", false, null)
    this.editorTarget.focus()
    this.syncContent()
  }

  numberedList(e) {
    e.preventDefault()
    document.execCommand("insertOrderedList", false, null)
    this.editorTarget.focus()
    this.syncContent()
  }

  insertLink(e) {
    e.preventDefault()
    const url = prompt("URL을 입력하세요:", "https://")
    if (url) {
      document.execCommand("createLink", false, url)
      this.editorTarget.focus()
      this.syncContent()
    }
  }

  removeFormat(e) {
    e.preventDefault()
    document.execCommand("removeFormat", false, null)
    this.editorTarget.focus()
    this.syncContent()
  }

  undo(e) {
    e.preventDefault()
    document.execCommand("undo", false, null)
    this.editorTarget.focus()
    this.syncContent()
  }

  redo(e) {
    e.preventDefault()
    document.execCommand("redo", false, null)
    this.editorTarget.focus()
    this.syncContent()
  }
}
