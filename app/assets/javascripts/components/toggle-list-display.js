'use strict'
// Toggle list display component

const { forEach } = window.flood.utils

const ToggleListDisplay = (container, options) => {
  let isExpanded = false
  const list = document.querySelector('.defra-flood-impact-list')
  const items = list.querySelectorAll(`[data-toggle-list-display-item="${options.type}"]`)
  const button = document.createElement('button')
  button.className = 'defra-button-text-s govuk-!-margin-bottom-4'
  button.setAttribute('aria-controls', list.id)
  button.setAttribute('data-module', 'govuk-button')
  container.appendChild(button)

  const toggleDisplay = () => {
    // Toggle Button
    button.innerText = `${isExpanded ? 'Hide' : 'Show'} ${options.btnText}`
    button.setAttribute('aria-expanded', isExpanded)
    // Toggle list
    forEach(items, (item) => {
      item.style.display = isExpanded ? 'block' : 'none'
    })
  }

  //
  // Initialise
  //

  toggleDisplay()

  //
  // Events
  //

  button.addEventListener('click', (e) => {
    isExpanded = !isExpanded
    toggleDisplay()
  })
}

window.flood.createToggleListDisplay = (container, options) => {
  return ToggleListDisplay(container, options)
}
