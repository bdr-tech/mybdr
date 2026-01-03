import { Controller } from "@hotwired/stimulus"

// 탭 전환 컨트롤러 (프로필 페이지 등에서 사용)
export default class extends Controller {
  static targets = ["tab", "panel"]
  static values = {
    defaultTab: { type: String, default: "info" }
  }

  connect() {
    // URL 해시에서 탭 읽기 또는 기본값 사용
    const hash = window.location.hash.replace("#", "")
    const initialTab = hash || this.defaultTabValue

    this.showTab(initialTab)

    // 브라우저 뒤로/앞으로 버튼 지원
    window.addEventListener("hashchange", this.handleHashChange.bind(this))
  }

  disconnect() {
    window.removeEventListener("hashchange", this.handleHashChange.bind(this))
  }

  handleHashChange() {
    const hash = window.location.hash.replace("#", "")
    if (hash) {
      this.showTab(hash)
    }
  }

  // 탭 클릭 시 호출
  switch(event) {
    event.preventDefault()
    const tabName = event.currentTarget.dataset.tabsName
    
    // URL 해시 업데이트
    window.history.pushState(null, null, `#${tabName}`)
    
    this.showTab(tabName)
  }

  showTab(tabName) {
    // 모든 탭 비활성화
    this.tabTargets.forEach(tab => {
      const isActive = tab.dataset.tabsName === tabName
      
      if (isActive) {
        tab.classList.add("text-indigo-600", "border-indigo-600", "bg-indigo-50/50")
        tab.classList.remove("text-gray-500", "border-transparent", "hover:text-gray-700", "hover:border-gray-200")
      } else {
        tab.classList.remove("text-indigo-600", "border-indigo-600", "bg-indigo-50/50")
        tab.classList.add("text-gray-500", "border-transparent", "hover:text-gray-700", "hover:border-gray-200")
      }
    })

    // 모든 패널 숨기기/표시
    this.panelTargets.forEach(panel => {
      const isActive = panel.dataset.tabsPanel === tabName
      panel.classList.toggle("hidden", !isActive)
    })
  }
}


