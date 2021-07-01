const getSlug = (string) => {
  return string.replace(/\s+/g, '-').replace(/'/g, '').toLowerCase()
}

const getSlugFromGazetteerEntry = (gazetteerEntry) => {
  const localType = gazetteerEntry.LOCAL_TYPE
  const name = gazetteerEntry.NAME1
  const countyUnity = gazetteerEntry.COUNTY_UNITARY
  const districtBorough = gazetteerEntry.DISTRICT_BOROUGH
  const postCodeDistrict = gazetteerEntry.POSTCODE_DISTRICT
  const isSimilar = gazetteerEntry.IS_SIMILAR
  let slug = getSlug(name)
  if (localType !== 'City' && (countyUnity || districtBorough)) {
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

const setIsSimilar = (results) => {
  const seen = Object.create(null)
  results.forEach(result => {
    const key = ['NAME1', 'LOCAL_TYPE', 'COUNTY_UNITARY', 'DISTRICT_BOROUGH'].map(k => result.GAZETTEER_ENTRY[k]).join('|')
    seen[key] ? result.GAZETTEER_ENTRY.IS_SIMILAR = true : seen[key] = true
  })
  return results
}

module.exports = {
  getSlug,
  getSlugFromGazetteerEntry,
  setIsSimilar
}
