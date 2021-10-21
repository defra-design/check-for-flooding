const moment = require('moment-timezone')
const turf = require('@turf/turf')

const getSlug = (string) => {
  return string.replace(/\s+/g, '-').replace(/'|\(|\)|,/g, '').toLowerCase()
}

const groupBy = (items, key) => items.reduce(
  (result, item) => ({
    ...result,
    [item[key]]: [
      ...(result[item[key]] || []),
      item
    ]
  }),
  {}
)

const formatElaspedTime = (date) => {
  const duration = (new Date() - new Date(date))
  const mins = Math.floor(duration / (1000 * 60))
  const hours = Math.floor(duration / (1000 * 60 * 60))
  const days = parseInt(Math.floor(hours / 24))
  if (mins < 91 || hours < 2) {
    return `${mins} minutes ago`
  } else {
    if (hours < 48) {
      return `${hours} hours ago`
    } else {
      return `${days} days ago`
    }
  }
}

const formatTime = (date) => {
  const today = moment().startOf('day')
  const tomorrow = moment().add(1, 'days').startOf('day')
  const dateWhen = (() => {
    if (moment(date).isSame(today, 'd')) {
      return 'today'
    } else if (moment(date).isSame(tomorrow, 'd')) {
      return 'tomorrow'
    } else {
      return `on ${moment(date).format('D/MM/YY')}`
    }
  })()
  return `${moment(date).tz('Europe/London').format('h:mma')} ${dateWhen}`
}

const bufferBbox = (bbox, m) => {
  // Convert bbox (binding box) )into polygon, add buffer, and convert back to bbox as db query needs a bbox envelope
  return turf.bbox(turf.buffer(turf.bboxPolygon(bbox), m, { units: 'meters' }))
}

const getNameFromGazetteerEntry = (gazetteerEntry) => {
  const coreCities = [
    'Birmingham, West Midlands',
    'Brighton, Brighton and Hove',
    'Coventry, West Midlands',
    'Derby, Derby City',
    'Manchester, Greater Manchester',
    'Leeds, West Yorkshire',
    'Leicester, Leicester City',
    'Liverpool, Merseyside',
    'Newcastle upon Tyne, Tyne & Wear',
    'Nottingham, Nottingham City',
    'Reading, Berkshire',
    'Sheffield, South Yorkshire'
  ]
  // Default name
  let name = gazetteerEntry.name
  // If core city remove local authority
  if (coreCities.includes(name)) {
    name = gazetteerEntry.address.locality
  }
  // If postcode re-construct name
  if (gazetteerEntry.address.postalCode) {
    name = gazetteerEntry.address.postalCode.replace(/ /g, '\u00a0')
  }
  // Remove duplication within the name
  if (gazetteerEntry.address.adminDistrict2 === gazetteerEntry.address.locality) {
    name = gazetteerEntry.address.locality
  }
  return name
}

module.exports = {
  formatElaspedTime,
  formatTime,
  getSlug,
  groupBy,
  bufferBbox,
  getNameFromGazetteerEntry
}
