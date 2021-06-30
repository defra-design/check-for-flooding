const getSlug = (string) => {
  return string.replace(/\s+/g, '-').replace(/'/g, '').toLowerCase()
}

const getSlugFromGazetteerEntry = (gazetteerEntry) => {
  const localType = gazetteerEntry.LOCAL_TYPE
  const name = gazetteerEntry.NAME1
  const countyUnity = gazetteerEntry.COUNTY_UNITARY
  const districtBorough = gazetteerEntry.DISTRICT_BOROUGH
  let slug = getSlug(name)
  if (localType !== 'City' && (countyUnity || districtBorough)) {
    const suffix = countyUnity || districtBorough
    if (name !== suffix) { // Example: Bury
      // Make a unique slug
      slug = `${slug}-${getSlug(countyUnity || districtBorough)}`
    }
  }
  return slug
}

module.exports = {
  getSlug,
  getSlugFromGazetteerEntry
}
