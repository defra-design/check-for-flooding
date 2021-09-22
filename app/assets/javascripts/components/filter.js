'use strict'

const { addOrUpdateParameter } = window.flood.utils

// Filter list
const Filter = (btnContainer, settings) => {
  const container = document.getElementById(settings.detailsId)
  container.setAttribute('role', 'dialog')
  const button = document.createElement('button')
  button.className = 'defra-button-filter'
  button.setAttribute('aria-expanded', false)
  button.setAttribute('aria-haspopup', 'dialog')
  button.setAttribute('aria-controls', settings.detailsId)
  const filterHeading = container.querySelector('.defra-search-filter__heading')
  filterHeading.innerHTML += ' (Updates on select)'
  btnContainer.parentNode.replaceChild(button, btnContainer)
  const state = {
    isExpanded: false,
    count: parseInt(container.querySelector('input[name="numFiltersSelected"]').value, 10)
  }

  // Set button text
  const setButtonText = () => {
    button.innerHTML = (state.isExpanded ? 'Hide ' : 'Show ') + 'filters' + (state.count > 0 ? ` (${state.count})` : '')
  }

  // Show details on desktop
  const toggleDetails = () => {
    state.isExpanded = !state.isExpanded
    button.setAttribute('aria-expanded', state.isExpanded)
    setButtonText()
    container.classList.toggle('defra-search-filter--expanded')
  }

  const xhr = new window.XMLHttpRequest()
  const loadContent = () => {
    const uri = window.location.href
    xhr.open('GET', uri)
    xhr.send()
  }

  // Update url and replace history state
  const replaceHistory = (key, value) => {
    const data = {}
    const uri = addOrUpdateParameter(window.location.href, key, value)
    const title = document.title
    window.history.replaceState(data, title, uri)
  }

  // Setup
  setButtonText()

  //
  // Events
  //

  // Show filters (mobile only)
  button.addEventListener('click', (e) => {
    e.preventDefault()
    toggleDetails()
  })

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('defra-search-filter__input')) {
      const checkboxes = Array.from(container.querySelectorAll('.defra-search-filter__input[type="checkbox"]'))
      const selectedTypes = checkboxes.filter(item => item.checked).map(item => item.id).join(',')
      state.count = checkboxes.filter(item => item.checked).length
      setButtonText()
      replaceHistory('filters', selectedTypes)
      loadContent()
    }
  })

  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) { // Done
      if (xhr.status === 200) { // Ok
        console.log('Success')
        const documentElement = document.implementation.createHTMLDocument().documentElement
        documentElement.innerHTML = xhr.responseText
        const targetSearchCount = document.getElementById(settings.countId)
        const targetList = document.getElementById(settings.listId)
        targetSearchCount.parentNode.replaceChild(documentElement.getElementById(settings.countId), targetSearchCount)
        targetList.parentNode.replaceChild(documentElement.getElementById(settings.listId), targetList)
      } else {
        console.log('Error: ' + xhr.status)
      }
    }
  }
}

window.flood.createFilter = (btnContainer, settings) => {
  return new Filter(btnContainer, settings)
}
