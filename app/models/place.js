const utils = require('../utils')
const OsGridRef = require('mt-osgridref')

class Place {
  constructor (gazetteerEntry) {
    const localType = gazetteerEntry.LOCAL_TYPE
    const name = gazetteerEntry.NAME1
    const countyUnity = gazetteerEntry.COUNTY_UNITARY
    const districtBorough = gazetteerEntry.DISTRICT_BOROUGH
    const postcodeDistrict = gazetteerEntry.POSTCODE_DISTRICT
    const isSimilar = gazetteerEntry.IS_SIMILAR
    const lon1 = gazetteerEntry.MBR_XMIN
    const lat1 = gazetteerEntry.MBR_YMIN
    const lon2 = gazetteerEntry.MBR_XMAX
    const lat2 = gazetteerEntry.MBR_YMAX

    // Construct the name
    if (localType === 'Postcode') {
      this.name = `${name}, ${(countyUnity || districtBorough)}`
    } else if (localType === 'City' || name === countyUnity || name === districtBorough) {
      this.name = name
    } else if (countyUnity || districtBorough) {
      this.name = `${name}, ${(countyUnity || districtBorough)}`
    }

    // Add additional qualifying component if names are similar
    if (isSimilar) {
      this.name = `${this.name} (${postcodeDistrict})`
    }

    // Crerate slug
    this.slug = utils.getSlugFromGazetteerEntry(gazetteerEntry)

    // Add location type
    this.type = localType.toLowerCase()

    // Add lon/lat
    const latlon1 = OsGridRef.osGridToLatLong(new OsGridRef(lon1, lat1))
    const latlon2 = OsGridRef.osGridToLatLong(new OsGridRef(lon2, lat2))
    this.bbox = [
      latlon1._lon.toFixed(6),
      latlon1._lat.toFixed(6),
      latlon2._lon.toFixed(6),
      latlon2._lat.toFixed(6)
    ]
  }
}
module.exports = Place
