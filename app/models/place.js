const utils = require('../utils')

class Place {
  constructor (gazetteerEntry) {
    const localType = gazetteerEntry.LOCAL_TYPE
    const name = gazetteerEntry.NAME1
    const countyUnity = gazetteerEntry.COUNTY_UNITARY
    const districtBorough = gazetteerEntry.DISTRICT_BOROUGH
    const postcodeDistrict = gazetteerEntry.POSTCODE_DISTRICT
    const isSimilar = gazetteerEntry.IS_SIMILAR
    // Construct the name
    if (localType === 'Postcode') {
      this.name = `${name}, ${(countyUnity || districtBorough)}`
    } else if (localType === 'City' || name === countyUnity || name === districtBorough) {
      this.name = name
    } else if (countyUnity || districtBorough) {
      this.name = `${name}, ${(countyUnity || districtBorough)}`
    }
    // Add additional qualifying compnent if names are similar
    if (isSimilar) {
      this.name = `${this.name} (${postcodeDistrict})`
    }
    // Crerate slug
    this.slug = utils.getSlugFromGazetteerEntry(gazetteerEntry)
    // Add location type
    this.type = localType.toLowerCase()
  }
}
module.exports = Place
