class Location {
  constructor (gazetteerEntry) {
    const localType = gazetteerEntry.LOCAL_TYPE
    const name = gazetteerEntry.NAME1
    const countyUnity = gazetteerEntry.COUNTY_UNITARY
    const districtBorough = gazetteerEntry.DISTRICT_BOROUGH
    // Construct the slug and name
    if (localType === 'Postcode') {
      this.slug = name.replace(/\s+/g, '-').toLowerCase()
      this.name = `${name}, ${(countyUnity || districtBorough)}`
    } else if (localType === 'City' || name === countyUnity || name === districtBorough) {
      this.slug = name.replace(/\s+/g, '-').toLowerCase()
      this.name = name
    } else if (countyUnity || districtBorough) {
      this.slug = `${name.replace(/\s+/g, '-').toLowerCase()}-${(countyUnity || districtBorough).replace(/\s+/g, '-').toLowerCase()}`
      this.name = `${name}, ${(countyUnity || districtBorough)}`
    }
  }
}
module.exports = Location
