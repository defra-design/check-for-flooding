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
          coordinates: [-2.929687, 54.915669]
        },
        properties: {
          ta_code: '011WAFLE',
          ta_name: 'Lower River Eden',
          severity_value: 1,
          severity: 'Flood alert'
        }
      },
      {
        type: 'Feature',
        id: 'flood.011FWFNC3A',
        geometry: {
          type: 'Point',
          coordinates: [-2.909892, 54.901589]
        },
        properties: {
          ta_code: '011FWFNC3A',
          ta_name: 'River Eden at Carlisle, Rickerby Park, Swifts and Stoneyholme Golf Courses',
          severity_value: 2,
          severity: 'Flood warning'
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
