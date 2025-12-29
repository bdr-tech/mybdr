import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container", "indicators", "nextButton", "buttonText"]
  static values = { current: Number, total: Number }

  steps = [
    {
      icon: "&#127936;", // Basketball emoji
      title: "내 주변 경기 찾기",
      description: "위치 기반으로 가까운 픽업게임과<br/>대회를 한눈에 확인하세요",
      color: "bg-blue-500",
      shadowColor: "shadow-blue-500/30"
    },
    {
      icon: "&#127942;", // Trophy emoji
      title: "팀과 함께 도전",
      description: "나만의 팀을 만들거나<br/>기존 팀에 합류해 대회에 출전하세요",
      color: "bg-purple-500",
      shadowColor: "shadow-purple-500/30"
    },
    {
      icon: "&#128202;", // Chart emoji
      title: "나의 농구 기록",
      description: "DNA 코드로 모든 경기 기록을<br/>평생 관리하세요",
      color: "bg-orange-500",
      shadowColor: "shadow-orange-500/30"
    }
  ]

  connect() {
    this.renderStep()
  }

  next() {
    if (this.currentValue < this.totalValue - 1) {
      this.currentValue++
      this.renderStep()
      this.updateIndicators()
      this.updateButton()
    } else {
      this.complete()
    }
  }

  skip() {
    this.complete()
  }

  async complete() {
    const csrfToken = document.querySelector('[name="csrf-token"]')?.content

    try {
      await fetch('/onboarding/complete', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken,
          'Content-Type': 'application/json'
        }
      })

      // Turbo가 있으면 사용, 없으면 일반 리다이렉트
      if (typeof Turbo !== 'undefined') {
        Turbo.visit('/')
      } else {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Onboarding completion failed:', error)
      window.location.href = '/'
    }
  }

  renderStep() {
    const step = this.steps[this.currentValue]

    // Add fade out animation
    this.containerTarget.style.opacity = '0'
    this.containerTarget.style.transform = 'translateX(20px)'

    setTimeout(() => {
      this.containerTarget.innerHTML = `
        <div class="w-32 h-32 ${step.color} rounded-3xl flex items-center justify-center mb-8 shadow-lg ${step.shadowColor}">
          <span class="text-6xl">${step.icon}</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-4 text-center">${step.title}</h1>
        <p class="text-gray-500 text-center leading-relaxed">${step.description}</p>
      `

      // Add fade in animation
      requestAnimationFrame(() => {
        this.containerTarget.style.transition = 'all 0.3s ease-out'
        this.containerTarget.style.opacity = '1'
        this.containerTarget.style.transform = 'translateX(0)'
      })
    }, 150)
  }

  updateIndicators() {
    this.indicatorsTarget.querySelectorAll('div').forEach((dot, i) => {
      if (i === this.currentValue) {
        dot.className = "h-2 w-8 bg-blue-500 rounded-full transition-all duration-300"
      } else {
        dot.className = "h-2 w-2 bg-gray-200 rounded-full transition-all duration-300"
      }
    })
  }

  updateButton() {
    if (this.currentValue === this.totalValue - 1) {
      this.buttonTextTarget.textContent = "시작하기"
    }
  }
}
