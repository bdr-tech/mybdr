import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["tooltip", "content", "arrow", "progress", "stepIndicator", "overlay", "nextButton"]
  static values = {
    pageKey: String,
    currentStep: { type: Number, default: 0 },
    tips: Array,
    sessionCompleted: Boolean
  }

  connect() {
    // 이미 완료된 세션이면 표시하지 않음
    if (this.sessionCompletedValue) return

    // DOM 로드 후 첫 번째 팁 표시
    requestAnimationFrame(() => {
      this.showCurrentTip()
    })

    // 리사이즈 이벤트 핸들러
    this.resizeHandler = this.reposition.bind(this)
    window.addEventListener('resize', this.resizeHandler)
  }

  disconnect() {
    window.removeEventListener('resize', this.resizeHandler)
    this.hideTooltip()
  }

  showCurrentTip() {
    if (this.currentStepValue >= this.tipsValue.length) {
      this.complete()
      return
    }

    const tip = this.tipsValue[this.currentStepValue]
    const targetElement = document.querySelector(tip.target)

    if (!targetElement) {
      // 타겟 요소가 없으면 다음으로
      this.currentStepValue++
      this.showCurrentTip()
      return
    }

    // 타겟 요소로 스크롤 이동
    this.scrollToElement(targetElement, () => {
      this.renderTip(tip, targetElement)
      this.positionTooltip(targetElement, tip.position || 'bottom')
      this.showTooltip()
      this.updateProgress()
    })
  }

  scrollToElement(element, callback) {
    const rect = element.getBoundingClientRect()
    const isVisible = (
      rect.top >= 80 && // 네비게이션 바 높이 고려
      rect.bottom <= (window.innerHeight - 100) // 하단 여백 고려
    )

    if (isVisible) {
      // 이미 화면에 보이면 바로 콜백 실행
      callback()
    } else {
      // 화면에 안 보이면 스크롤 후 콜백 실행
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })

      // 스크롤 완료 후 콜백 실행
      setTimeout(callback, 400)
    }
  }

  renderTip(tip, targetElement) {
    this.contentTarget.innerHTML = `
      <div class="font-bold text-gray-900 mb-1">${tip.title}</div>
      <div class="text-sm text-gray-600">${tip.description}</div>
    `

    // 이전 하이라이트 제거
    document.querySelectorAll('.tooltip-highlight').forEach(el => {
      el.classList.remove('tooltip-highlight')
    })

    // 새 타겟 하이라이트
    targetElement.classList.add('tooltip-highlight')

    // 마지막 팁이면 버튼 텍스트 변경
    if (this.currentStepValue === this.tipsValue.length - 1) {
      this.nextButtonTarget.textContent = "완료"
    } else {
      this.nextButtonTarget.textContent = "다음"
    }
  }

  positionTooltip(target, position) {
    const rect = target.getBoundingClientRect()
    const tooltip = this.tooltipTarget
    const arrow = this.arrowTarget
    const margin = 12

    // 툴팁 크기 계산을 위해 임시로 표시
    tooltip.style.visibility = 'hidden'
    tooltip.classList.remove('hidden')

    const tooltipRect = tooltip.getBoundingClientRect()
    let top, left, arrowClass

    switch (position) {
      case 'top':
        top = rect.top - tooltipRect.height - margin + window.scrollY
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2)
        arrowClass = 'arrow-bottom'
        break
      case 'bottom':
        top = rect.bottom + margin + window.scrollY
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2)
        arrowClass = 'arrow-top'
        break
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2) + window.scrollY
        left = rect.left - tooltipRect.width - margin
        arrowClass = 'arrow-right'
        break
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2) + window.scrollY
        left = rect.right + margin
        arrowClass = 'arrow-left'
        break
    }

    // 화면 경계 체크
    const padding = 16
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding))
    top = Math.max(padding + window.scrollY, top)

    tooltip.style.top = `${top}px`
    tooltip.style.left = `${left}px`
    tooltip.style.visibility = 'visible'

    // 화살표 위치
    arrow.className = `tooltip-arrow ${arrowClass}`
  }

  showTooltip() {
    this.overlayTarget.classList.remove('hidden')
    this.tooltipTarget.classList.remove('hidden', 'opacity-0', 'scale-95')
    this.tooltipTarget.classList.add('opacity-100', 'scale-100')
  }

  hideTooltip() {
    // 하이라이트 제거
    document.querySelectorAll('.tooltip-highlight').forEach(el => {
      el.classList.remove('tooltip-highlight')
    })

    this.overlayTarget.classList.add('hidden')
    this.tooltipTarget.classList.add('hidden', 'opacity-0', 'scale-95')
    this.tooltipTarget.classList.remove('opacity-100', 'scale-100')
  }

  updateProgress() {
    const total = this.tipsValue.length
    const current = this.currentStepValue + 1

    this.progressTarget.style.width = `${(current / total) * 100}%`
    this.stepIndicatorTarget.textContent = `${current}/${total}`
  }

  next() {
    this.hideTooltip()
    this.currentStepValue++

    setTimeout(() => {
      this.showCurrentTip()
    }, 200)
  }

  skip() {
    this.hideTooltip()
    this.complete()
  }

  reposition() {
    if (this.currentStepValue < this.tipsValue.length) {
      const tip = this.tipsValue[this.currentStepValue]
      const target = document.querySelector(tip.target)
      if (target) {
        this.positionTooltip(target, tip.position || 'bottom')
      }
    }
  }

  async complete() {
    const csrfToken = document.querySelector('[name="csrf-token"]')?.content

    try {
      await fetch('/tips/complete', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ page_key: this.pageKeyValue })
      })
    } catch (error) {
      console.warn('Failed to save tip completion:', error)
    }

    this.hideTooltip()
  }
}
