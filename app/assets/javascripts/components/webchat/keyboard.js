'use strict'

import Utils from './utils'

class Keyboard {
    static _isKeyboard = false

    static init (state) {
        this._state = state
        this._detectFocus()

        Utils.listenForDevice('mobile', this._updateInert.bind(this))

    }

    static _detectFocus () {
        document.addEventListener('keydown', (e) => {
            this._isKeyboard = true
            if (e.key === 'Tab' || e.key === 'Escape' || e.key === 'Esc') {
                this._constrainFocus(e)
            }
        }, true)

        document.addEventListener('keyup', (e) => {
            this._isKeyboard = true
            if (e.key === 'Tab') {
                const obscure = document.querySelector('[data-wc-obscure]')
                const isWithinObscure = document.activeElement.closest('[data-wc-obscure]')
                if (obscure && !isWithinObscure) {
                    obscure.focus()
                }
                const el = this._getFocusParent()
                if (el) {
                    this._toggleInert(el)
                }
            }
        }, true)

        document.addEventListener('pointerdown', (e) => {
            this._isKeyboard = false
            // e.target.classList.remove('am-u-focus-visible')
        })

        document.addEventListener('focus', (e) => {
            const isScope = !!e.target.closest('[data-wc-availability], [data-wc]')
            if (!isScope) {
                return
            }
            const target = e.target.hasAttribute('data-wc-focus-parent') ? e.target.parentNode : e.target
            target.classList.toggle('wc-focus-visible', this._isKeyboard)
        }, true)

        document.addEventListener('blur',(e) => {
            const target = e.target.hasAttribute('data-wc-focus-parent') ? e.target.parentNode : e.target
            target.classList.remove('wc-focus-visible')
        }, true)
    }

    static _isFocusable (el) {
        const tagNames = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT']
        const isHidden = el.hidden || el.style.display === 'none'
        const isTextbox = el.getAttribute('role') === 'textbox'

        return (tagNames.includes(el.tagName) || el.tabIndex >= 0 || isTextbox) && !isHidden
    }

    static _getFocusParent () {
        const el = document.activeElement.closest(`
            [data-wc-inner]
        `)

        return el
    }

    static _constrainFocus (e) {
        const el = this._getFocusParent()

        if (!el) {
            return
        }

        const selectors = [
            'a[href]:not([disabled])',
            'button:not([disabled])',
            'textarea:not([disabled])',
            'div[role="textbox"]',
            'input:not([disabled])',
            'select:not([disabled])',
            '*[tabindex="0"]:not([disabled])'
        ]
        let focusableEls = Array.from(el.querySelectorAll(selectors.join(',')))
        focusableEls = focusableEls.filter(e => !e.closest('[hidden]'))
        const firstFocusableEl = focusableEls[0]
        const lastFocusableEl = focusableEls[focusableEls.length - 1]

        if (e.shiftKey ) {
            console.log(document.activeElement, el, firstFocusableEl)
            if (document.activeElement === el || document.activeElement === firstFocusableEl) {
                console.log('On first element')
                e.preventDefault()
                lastFocusableEl.focus()
            }
        } else {
            if (document.activeElement === lastFocusableEl) {
                console.log('On last element')
                e.preventDefault()
                firstFocusableEl.focus()
            }
        }
    }

    static _toggleInert (el) {
        const inert = document.querySelectorAll('[data-wc-inert]')
        for (let i = 0; i < inert.length; i++) {
            const el = inert[i]
            el.removeAttribute('aria-hidden')
            el.removeAttribute('data-wc-inert')
        }
        if (el) {
            while (el.parentNode && el !== document.body) {
                let sibling = el.parentNode.firstChild
                while (sibling) {
                    if (sibling.nodeType === 1 && sibling !== el) {
                        if (!sibling.hasAttribute('aria-hidden')) {
                            sibling.setAttribute('aria-hidden', true)
                            sibling.setAttribute('data-wc-inert', '')
                        }
                    }
                    sibling = sibling.nextSibling
                }
                el = el.parentNode
            }
        }
    }

    static _updateInert () {
        const isOpen = this._state.isOpen
        const activeElement = document.activeElement
        const isWithinDialog = activeElement && !!document.activeElement.closest('[data-wc][role="dialog"][open]')
        const containerEl = document.querySelector('[data-wc]')
        if (!isWithinDialog) {
            this._toggleInert(isOpen ? containerEl : null)
        }
    }

    static toggleInert (el) {
        this._toggleInert(el)
    }
}

export default Keyboard