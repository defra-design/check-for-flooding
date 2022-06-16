'use strict'

// Navbar component
const { addOrUpdateParameter, getParameterByName, forEach } = window.flood.utils

function Navbar (id) {
  const navbar = document.getElementById(id)
  const navItems = navbar.children
  const table = document.getElementById(navbar.getAttribute('data-controls'))
  const headerRows = table.querySelectorAll('thead tr')
  const bodyRows = table.querySelectorAll('tbody tr')

  // Modify DOM
  navbar.setAttribute('aria-controls', navbar.getAttribute('data-controls'))
  forEach(navItems, navItem => {
    navItem.children[0].setAttribute('role', 'button')
  })

  const toggleSelected = (button) => {
    const groupType = button.getAttribute('data-group-type')

    // Navbar
    forEach(navItems, navItem => {
      navItem.classList.toggle('defra-navbar__item--selected', navItem === button.parentNode)
    })

    // Table thead rows
    forEach(headerRows, headerRow => {
      const type = headerRow.getAttribute('data-group-type')
      if (type.includes(groupType)) {
        headerRow.removeAttribute('style')
      } else {
        headerRow.setAttribute('style', 'display:none')
      }
    })

    // Table tbody rows
    forEach(bodyRows, bodyRow => {
      const type = bodyRow.getAttribute('data-group-type')
      if (type === groupType) {
        bodyRow.removeAttribute('style')
      } else {
        bodyRow.setAttribute('style', 'display:none')
      }
    })

    // Replace history, ie not adding a new entry
    replaceHistory('type', groupType)
  }

  const replaceHistory = (key, value) => {
    const data = { type: value }
    const uri = addOrUpdateParameter(window.location.href, key, value)
    const title = document.title
    window.history.replaceState(data, title, uri)
  }

  //
  // Events
  //

  document.addEventListener('click', (e) => {
    if (e.target.parentNode.classList.contains('defra-navbar__item')) {
      e.preventDefault()
      toggleSelected(e.target)
    }
  })

  // Stop space bar scrolling page when on button
  document.addEventListener('keydown', (e) => {
    const keys = [' ', 'ArrowRight', 'ArrowLeft', 'Home', 'End']
    if (e.target.parentNode.classList.contains('defra-navbar__item') && keys.includes(e.key)) {
      e.preventDefault()
    }
  })

  // Ensure buttons are operable with keyboard
  document.addEventListener('keyup', (e) => {
    if (e.target.parentNode.classList.contains('defra-navbar__item') && e.key === ' ') {
      e.preventDefault()
      toggleSelected(e.target)
    }
  })
}

window.flood.createNavbar = (id) => {
  // Set initial history state
  if (!window.history.state) {
    const data = {}
    const title = document.title
    const uri = window.location.href
    window.history.replaceState(data, title, uri)
  }

  return Navbar(id)
}
