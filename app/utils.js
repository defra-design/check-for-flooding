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

const setIsSimilar = (results) => {
  const places = Object.create(null)
  results.forEach(result => {
    const key = ['NAME1', 'LOCAL_TYPE', 'COUNTY_UNITARY', 'DISTRICT_BOROUGH'].map(k => result.GAZETTEER_ENTRY[k]).join('|')
    if (places[key]) {
      result.GAZETTEER_ENTRY.IS_SIMILAR = true
      const original = results.find(o => o.GAZETTEER_ENTRY.ID === places[key])
      original.GAZETTEER_ENTRY.IS_SIMILAR = true
    } else {
      places[key] = result.GAZETTEER_ENTRY.ID
    }
  })
  return results
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

module.exports = {
  getSlug,
  getSlugFromGazetteerEntry,
  setIsSimilar,
  groupBy
}
