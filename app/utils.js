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

const formatTimeElapsed = (date) => {
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

const formatTimeRecent = (date) => {
  const today = moment().startOf('day')
  const tomorrow = moment().add(1, 'days').startOf('day')
  const dateWhen = (() => {
    if (moment(date).isSame(today, 'd')) {
      return 'today'
    } else if (moment(date).isSame(tomorrow, 'd')) {
      return 'tomorrow'
    } else {
      return `${moment(date).format('D/MM/YY')}`
    }
  })()
  return `${moment(date).tz('Europe/London').format('h:mma')} ${dateWhen}`
}

const formatTimeHour = (date) => {
  return moment(date).tz('Europe/London').format('h:mma')
}

const formatTimeDate = (date) => {
  return `${moment(date).tz('Europe/London').format('h:mma')}, ${moment(date).format('D\xa0MMMM')}`
}

const formatTime = (date) => {
  return `${moment(date).tz('Europe/London').format('h:mma')}`
}

const formatDate = (date) => {
  return `${moment(date).format('D\xa0MMM')}`
}

const formatDatePast = (date) => {
  return `${moment(date).format('D\xa0MMMM\xa0YYYY')}`
}

const bufferBbox = (bbox, m) => {
  // Convert bbox (binding box) )into polygon, add buffer, and convert back to bbox as db query needs a bbox envelope
  return turf.bbox(turf.buffer(turf.bboxPolygon(bbox), m, { units: 'meters' }))
}

const getSlugFromGazetteerEntry = (gazetteerEntry) => {
  const localType = gazetteerEntry.LOCAL_TYPE
  const name = gazetteerEntry.NAME1
  const countyUnity = gazetteerEntry.COUNTY_UNITARY
  const districtBorough = gazetteerEntry.DISTRICT_BOROUGH
  const postCodeDistrict = gazetteerEntry.POSTCODE_DISTRICT
  const isSimilar = gazetteerEntry.IS_SIMILAR
  let slug = getSlug(name)
  if (localType !== 'City' && localType !== 'Postcode' && (countyUnity || districtBorough)) {
    let qaulifier = getSlug(countyUnity || districtBorough) // eg Bury, bury
    if (name !== qaulifier) {
      // eg Charlton, Wiltshire
      qaulifier += isSimilar && postCodeDistrict ? `-${postCodeDistrict.toLowerCase()}` : ''
      // Make a 'unique' slug
      slug = `${slug}-${qaulifier}`
    }
    // Address Charlton
  }
  return slug
}

module.exports = {
  formatTimeElapsed,
  formatTimeRecent,
  formatTimeHour,
  formatTimeDate,
  formatTime,
  formatDate,
  formatDatePast,
  getSlug,
  groupBy,
  bufferBbox,
  getSlugFromGazetteerEntry
}
