'use strict'

const { addOrUpdateParameter } = window.flood.utils

// Filter list
const Filter = () => {
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

  document.addEventListener('click', (e) => {
    if (e.target.className === 'defra-filter__input') {
      const checkboxes = Array.from(document.querySelectorAll('.defra-filter__input[type="checkbox"]'))
      const selectedTypes = checkboxes.filter(item => item.checked).map(item => item.id).join(',')
      replaceHistory('type', selectedTypes)
      loadContent()
    }
  })

  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) { // Done
      if (xhr.status === 200) { // Ok
        console.log('Success')
        // const container = document.implementation.createHTMLDocument().documentElement
        // container.innerHTML = xhr.responseText
        // const targetSearchCount = document.querySelector('#searchCount')
        // const targetList = document.querySelector('#list')
        // targetSearchCount.parentNode.replaceChild(container.querySelector('#searchCount'), targetSearchCount)
        // targetList.parentNode.replaceChild(container.querySelector('#list'), targetList)
      } else {
        console.log('Error: ' + xhr.status)
      }
    }
  }
}

window.flood.createFilter = () => {
  return new Filter()
}
