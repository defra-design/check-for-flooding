'use strict'

class Keyboard {
  static _isKeyboard = false

  static init (state) {
    this._state = state
    this._detectFocus()
  }

  static _detectFocus () {
    document.addEventListener('keydown', (e) => {
        this._isKeyboard = true
        // if (e.key === 'Tab' || e.key === 'Escape' || e.key === 'Esc') {
        //     this._constrainFocus(e)
        // }
    }, true)

    document.addEventListener('keyup', (e) => {
        this._isKeyboard = true
        // if (e.key === 'Tab') {
        //     const obscure = document.querySelector('[data-am-obscure]')
        //     const isWithinObscure = document.activeElement.closest('[data-am-obscure]')
        //     if (obscure && !isWithinObscure) {
        //         obscure.focus()
        //     }
        //     const el = this._getFocusParent()
        //     if (el) {
        //         this._toggleInert(el)
        //     }
        // }
    }, true)

    document.addEventListener('pointerdown', (e) => {
        this._isKeyboard = false
        // e.target.classList.remove('am-u-focus-visible')
    })

    document.addEventListener('focus', (e) => {
        const isScope = !!e.target.closest('[data-wc]')
        if (!isScope) {
            return
        }
        const target = e.target.hasAttribute('data-wc-focus-parent') ? e.target.parentNode : e.target
        target.toggleAttribute('keyboard-focus', this._isKeyboard)
        // target.classList.toggle('am-wc-focus-visible', this._isKeyboard)
    }, true)

    document.addEventListener('blur',(e) => {
        const target = e.target.hasAttribute('data-wc-focus-parent') ? e.target.parentNode : e.target
        target.removeAttribute('keyboard-focus')
        target.classList.remove('am-wc-focus-visible')
    }, true)
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