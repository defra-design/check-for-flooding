// const db = require('./db')

module.exports = {
  // Used with maps
  getWarningsGeoJSON: async (type) => {
    // const response = await db.query('')
    const features = [
      {
        type: 'Feature',
        id: 'flood.011WAFLE',
        geometry: {
          type: 'Point',
          coordinates: [-2.92968747130188, 54.9156692345903]
        },
        properties: {
          ta_code: '011WAFLE',
          ta_name: 'Lower River Eden',
          severity_value: 1,
          severity: 'Flood alert'
        }
      }
    ]
    const geoJSON = {
      type: 'FeatureCollection',
      features: features
    }
    return geoJSON
  }
}
