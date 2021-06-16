'use strict'
// ToggleTip component

const ToggleTip = (toggleTip) => {
  const link = toggleTip.firstElementChild
  const url = link.href.split(/\?|#/)[0]
  const container = toggleTip.querySelector('.defra-toggletip__status')
  // Show text
  link.addEventListener('click', (e) => {
    e.preventDefault()
    link.focus()
    // XMLHttpRequest could be moved to utils
    const xmlhttp = new window.XMLHttpRequest()
    xmlhttp.onreadystatechange = () => {
      if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
        try {
          toggleTip.classList.add('defra-toggletip--open')
          container.innerHTML = ''
          const fragmentId = link.href.substring(link.href.indexOf('#'))
          const fragment = xmlhttp.response.querySelector(`${fragmentId}`)
          // Remove any hyperlinks
          fragment.querySelectorAll('a').forEach(link => {
            link.outerHTML = link.innerHTML
          })
          fragment.className = 'defra-toggletip__container'
          window.setTimeout(() => {
            container.appendChild(fragment)
          }, 100)
        } catch (err) {
          console.log(err)
        }
      }
    }
    xmlhttp.responseType = 'document'
    xmlhttp.open('GET', url, true)
    xmlhttp.send()
  })
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (e.target !== container) {
      toggleTip.classList.remove('defra-toggletip--open')
      container.innerHTML = ''
    }
  })
  // Key presses
  toggleTip.addEventListener('keyup', (e) => {
    // Close on escape
    if ((e.keyCode || e.which) === 27) {
      toggleTip.classList.remove('defra-toggletip--open')
      container.innerHTML = ''
    }
  })
  // Remove on blur
  link.addEventListener('blur', (e) => {
    toggleTip.classList.remove('defra-toggletip--open')
    container.innerHTML = ''
  })
}

window.flood.createToggleTip = (toggleTip) => {
  return ToggleTip(toggleTip)
}
