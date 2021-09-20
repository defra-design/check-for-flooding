'use strict'

const { addOrUpdateParameter } = window.flood.utils

// Filter list
const Filter = (container, listId, summaryId) => {
  container.setAttribute('role', 'region')
  const toggleFilters = document.createElement('button')
  toggleFilters.className = 'defra-search-filter-button'
  toggleFilters.setAttribute('aria-expanded', false)
  toggleFilters.setAttribute('aria-controls', container.id)
  const filterHeading = container.querySelector('.defra-search-filter__heading')
  filterHeading.innerHTML += ' (Updates on select)'
  container.parentNode.insertBefore(toggleFilters, container.parentNode.firstChild)

  // Set button text
  const setToggleFiltersButtonText = (numSelected) => {
    toggleFilters.innerHTML = numSelected > 0 ? `Filters (${numSelected})` : 'Filters'
  }

  // Show details on desktop
  const toggleDetails = () => {
    toggleFilters.setAttribute('aria-expanded', !(toggleFilters.getAttribute('aria-expanded') === 'true'))
    container.classList.toggle('defra-search-filter--expanded')
  }

  const numSelected = parseInt(container.querySelector('input[name="numFiltersSelected"]').value, 10)
  setToggleFiltersButtonText(numSelected)

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

  //
  // Events
  //

  // Show filters (mobile only)
  toggleFilters.addEventListener('click', (e) => {
    e.preventDefault()
    toggleDetails()
  })

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('defra-search-filter__input')) {
      const checkboxes = Array.from(document.querySelectorAll('.defra-search-filter__input[type="checkbox"]'))
      const selectedTypes = checkboxes.filter(item => item.checked).map(item => item.id).join(',')
      setToggleFiltersButtonText(checkboxes.filter(item => item.checked).length)
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
        const targetSearchCount = document.querySelector(`#${summaryId}`)
        const targetList = document.querySelector(`#${listId}`)
        targetSearchCount.parentNode.replaceChild(documentElement.querySelector(`#${summaryId}`), targetSearchCount)
        targetList.parentNode.replaceChild(documentElement.querySelector(`#${listId}`), targetList)
      } else {
        console.log('Error: ' + xhr.status)
      }
    }
  }
}

window.flood.createFilter = (container, listId, summaryId) => {
  return new Filter(container, listId, summaryId)
}
