class Location {
  constructor (gazetteerEntry) {
    const localType = gazetteerEntry.LOCAL_TYPE
    const name = gazetteerEntry.NAME1
    const countyUnity = gazetteerEntry.COUNTY_UNITARY
    const districtBorough = gazetteerEntry.DISTRICT_BOROUGH
    const slug = name.replace(/\s+/g, '-').replace(/'/g, '').toLowerCase()
    // Construct the slug and name
    if (localType === 'Postcode') {
      this.slug = slug
      this.name = `${name}, ${(countyUnity || districtBorough)}`
    } else if (localType === 'City' || name === countyUnity || name === districtBorough) {
      this.slug = slug
      this.name = name
    } else if (countyUnity || districtBorough) {
      this.slug = `${slug}-${(countyUnity || districtBorough).replace(/\s+/g, '-').toLowerCase()}`
      this.name = `${name}, ${(countyUnity || districtBorough)}`
    }
    // Add location type
    this.type = localType.toLowerCase()
  }
}
module.exports = Location
