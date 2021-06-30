const utils = require('../utils')

class Place {
  constructor (gazetteerEntry) {
    const localType = gazetteerEntry.LOCAL_TYPE
    const name = gazetteerEntry.NAME1
    const countyUnity = gazetteerEntry.COUNTY_UNITARY
    const districtBorough = gazetteerEntry.DISTRICT_BOROUGH
    const slug = utils.getSlug(name)
    // Construct the slug and name
    if (localType === 'Postcode') {
      this.slug = slug
      this.name = `${name}, ${(countyUnity || districtBorough)}`
    } else if (localType === 'City' || name === countyUnity || name === districtBorough) {
      this.slug = slug
      this.name = name
    } else if (countyUnity || districtBorough) {
      this.slug = `${slug}-${utils.getSlug(countyUnity || districtBorough)}`
      this.name = `${name}, ${(countyUnity || districtBorough)}`
    }
    // Add location type
    this.type = localType.toLowerCase()
  }
}
module.exports = Place
