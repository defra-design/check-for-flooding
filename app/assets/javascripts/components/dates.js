// Format day today or Monday, Tuesday etc
export const formatDayName = (date) => {
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
export const formatDayNumber = (date) => {
  const number = date.getDate()
  const month = date.toLocaleString('en-GB', { month: 'short' })
  return `${number} ${month}`
}

// Time format function for live map info panel
export const formatTime = (date) => {
  const hours = date.getHours() > 12 ? date.getHours() - 12 : date.getHours()
  const minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes()
  const amPm = (date.getHours() > 12) ? 'pm' : 'am'
  return hours + ':' + minutes + amPm
}

// Day format function for live map info panel
export const formatDayMonth = (date) => {
  const day = date.getDate()
  const month = date.toLocaleString('en-GB', { month: 'long' })
  return `${day} ${month}`
}

// Format expired time
const formatExpiredTime = (date) => {
  const duration = (new Date() - new Date(date)) // milliseconds between now & Christmas
  const mins = Math.floor(duration / (1000 * 60)) // minutes
  const hours = Math.floor(duration / (1000 * 60 * 60)) // hours
  const days = parseInt(Math.floor(hours / 24)) // days
  return (mins < 91 ? mins + ' minutes' : (hours < 48 ? hours + ' hours' : days + ' days')) + ' ago'
}