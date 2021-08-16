const { forEach } = window.flood.utils

// Filter list
const Filter = (filter) => {
  const toggleVisibility = (type, isChecked) => {
    const levels = document.querySelectorAll(`.defra-flood-list-item[data-type="${type}"]`)
    const groups = document.querySelectorAll('.defra-flood-list-item-group')
    // Toggle level display
    forEach(levels, (level) => {
      level.classList.toggle('defra-flood-list-item--hidden')
    })
    // Toggle group display
    forEach(groups, (group) => {
      const hasLevels = !!group.querySelectorAll('.defra-flood-list-item:not(.defra-flood-list-item--hidden)').length
      console.log(hasLevels)
      hasLevels ? group.classList.remove('defra-flood-list-item--hidden') : group.classList.add('defra-flood-list-item--hidden')
    })
  }

  filter.addEventListener('click', (e) => {
    if (e.target.type === 'checkbox') {
      toggleVisibility(e.target.id, e.target.checked)
    }
  })
}

window.flood.createFilter = (filter) => {
  return new Filter(filter)
}
