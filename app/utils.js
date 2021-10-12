const getSlug = (string) => {
  return string.replace(/\s+/g, '-').replace(/'|\(|\)|,/g, '').toLowerCase()
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

module.exports = {
  formatElaspedTime,
  getSlug,
  getSlugFromGazetteerEntry,
  groupBy
}
