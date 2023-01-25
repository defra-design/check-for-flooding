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

const formatTimeHour = (date) => {
  return moment(date).tz('Europe/London').format(moment(date).minutes() === 0 ? 'ha' : 'h:mma')
}

const formatTimeDate = (date) => {
  return `${moment(date).tz('Europe/London').format(moment(date).minutes() === 0 ? 'ha' : 'h:mma')}, ${moment(date).format('D\xa0MMMM')}`
}

const formatTime = (date) => {
  return `${moment(date).tz('Europe/London').format(moment(date).minutes() === 0 ? 'ha' : 'h:mma')}`
}

const formatDate = (date) => {
  return `${moment(date).tz('Europe/London').format('D\xa0MMM')}`
}

const formatDatePast = (date) => {
  return `${moment(date).tz('Europe/London').format('D\xa0MMMM\xa0YYYY')}`
}

const bufferBbox = (bbox, m) => {
  // Convert bbox (binding box) )into polygon, add buffer, and convert back to bbox as db query needs a bbox envelope
  return turf.bbox(turf.buffer(turf.bboxPolygon(bbox), m, { units: 'meters' }))
}

const bufferPoint = (point, m) => {
  const p = turf.point(point)
  return turf.bbox(turf.buffer(p, m, { units: 'meters' }))
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
    'Reading, Berkshire'
    // 'Sheffield, South Yorkshire'
  ]
  // Default name
  let name = gazetteerEntry.name

  // Remove ', GB' from reverse geocode name
  name = name.endsWith(', GB') ? name.substring(0, name.lastIndexOf(',')) : name

  if (coreCities.includes(name)) {
    // If core city remove local authority
    name = gazetteerEntry.address.locality
  } else if (gazetteerEntry.entityType === 'Postcode1') {
    // If full postcode re-construct name
    name = `${gazetteerEntry.address.locality}, ${gazetteerEntry.address.postalCode}`
  } else if (gazetteerEntry.address.adminDistrict2 && gazetteerEntry.address.adminDistrict2 === gazetteerEntry.address.locality) {
    // Remove duplication within the name
    name = gazetteerEntry.address.locality
  }
  return name
}

module.exports = {
  formatTimeHour,
  formatTimeDate,
  formatTime,
  formatDate,
  formatDatePast,
  getSlug,
  groupBy,
  bufferBbox,
  bufferPoint,
  getNameFromGazetteerEntry
}
