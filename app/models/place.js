const utils = require('../utils')
const OsGridRef = require('mt-osgridref')

class Place {
  constructor (gazetteerEntry) {
    // const localType = gazetteerEntry.LOCAL_TYPE
    // const name = gazetteerEntry.NAME1
    // const countyUnity = gazetteerEntry.COUNTY_UNITARY
    // const districtBorough = gazetteerEntry.DISTRICT_BOROUGH
    // const postcodeDistrict = gazetteerEntry.POSTCODE_DISTRICT
    // const isSimilar = gazetteerEntry.IS_SIMILAR
    // Postcodes return a point so we approximate to a 1km2 area
    // const lon1 = gazetteerEntry.MBR_XMIN || gazetteerEntry.GEOMETRY_X - 500
    // const lat1 = gazetteerEntry.MBR_YMIN || gazetteerEntry.GEOMETRY_Y - 500
    // const lon2 = gazetteerEntry.MBR_XMAX || gazetteerEntry.GEOMETRY_X + 500
    // const lat2 = gazetteerEntry.MBR_YMAX || gazetteerEntry.GEOMETRY_Y + 500

    // Construct the name
    // if (localType === 'Postcode') {
    //   this.name = `${name}, ${(countyUnity || districtBorough)}`
    // } else if (localType === 'City' || name === countyUnity || name === districtBorough) {
    //   this.name = name
    // } else if (countyUnity || districtBorough) {
    //   this.name = `${name}, ${(countyUnity || districtBorough)}`
    // }

    // Add additional qualifying component if names are similar
    // if (isSimilar) {
    //   this.name = `${this.name} (${postcodeDistrict})`
    // }

    // Crerate slug
    // this.slug = utils.getSlugFromGazetteerEntry(gazetteerEntry)

    // Add location type
    // this.type = localType.toLowerCase()

    // Add lon/lat
    // let latlon1 = OsGridRef.osGridToLatLong(new OsGridRef(lon1, lat1))
    // let latlon2 = OsGridRef.osGridToLatLong(new OsGridRef(lon2, lat2))
    // this.bbox = [latlon1._lon, latlon1._lat, latlon2._lon, latlon2._lat]

    // Add lon/lat with 8km buffer
    // latlon1 = OsGridRef.osGridToLatLong(new OsGridRef(lon1 - 8000, lat1 - 8000))
    // latlon2 = OsGridRef.osGridToLatLong(new OsGridRef(lon2 + 8000, lat2 + 8000))
    // this.bboxBuffered = [latlon1._lon, latlon1._lat, latlon2._lon, latlon2._lat]
    console.log(gazetteerEntry)
  }
}
module.exports = Place
