// Format day today or Monday, Tuesday etc
export const formatDay = (date) => {
  date.setHours(0)
  date.setMinutes(0)
  date.setSeconds(0, 0)
  const now = new Date()
  now.setHours(0)
  now.setMinutes(0)
  now.setSeconds(0, 0)
  if (date.getTime() === now.getTime()) {
    return 'Today'
  } else {
    return date.toLocaleString('en-GB', { weekday: 'short' })
  }
}

// Format date as 4th or 23rd etc
export const formatDate = (date) => {
  const number = date.getDate()
  const month = date.toLocaleString('en-GB', { month: 'short' })
  return `${number} ${month}`
}