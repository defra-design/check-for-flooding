'use strict'

class Keyboard {
  static _isKeyboard = false

  static init () {

  }

  static hideSiblings () {
    // Hide all modal siblings from screen readers
    this.webchatSiblings.forEach(webchatSibling => {
      webchatSibling.setAttribute('aria-hidden', 'true')
      webchatSibling.classList.add('defra-webchat-visibility-hidden')
    })
  }

  static showSiblings () {
    // Re-instate aria-hidden elements
    this.webchatSiblings.forEach(webchatSibling => {
      webchatSibling.removeAttribute('aria-hidden')
      webchatSibling.classList.remove('defra-webchat-visibility-hidden')
    })
  }

  static setInitialFocus () {
    if (!document.activeElement.closest(`#${this.container.id}`)) {
      this.inner.focus()
    }
  }

  static constrainFocus (e) {
    const selectors = [
      'a[href]:not([disabled]):not([hidden])',
      'button:not([disabled]):not([hidden])',
      'textarea:not([disabled]):not([hidden])',
      'input[type="text"]:not([disabled]):not([hidden])',
      'input[type="radio"]:not([disabled]):not([hidden])',
      'input[type="checkbox"]:not([disabled]):not([hidden])',
      'select:not([disabled]):not([hidden])',
      '*[tabindex="0"]:not([disabled]):not([hidden])'
    ]
    const specificity = selectors.map(i => `#${this.container.id} ${i}`).join(',')
    const focusableEls = document.querySelectorAll(specificity)
    const firstFocusableEl = focusableEls[0]
    const lastFocusableEl = focusableEls[focusableEls.length - 1]
    // Tab and shift tab
    if (e.shiftKey) {
      if (document.activeElement === firstFocusableEl || document.activeElement.getAttribute('tabindex') === '-1') {
        lastFocusableEl.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastFocusableEl) {
        firstFocusableEl.focus()
        e.preventDefault()
      }
    }
  }
}

export default Keyboard