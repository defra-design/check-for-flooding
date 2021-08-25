// const db = require('./db')

module.exports = {
  // Used with maps
  getWarningsGeoJSON: async (type) => {
    // const response = await db.query('')
    const features = [
      {
        type: 'Feature',
        id: 'flood.121FWT565',
        geometry: {
          type: 'Point',
          coordinates: [
            -1.19478166594119,
            54.61741399306
          ]
        },
        properties: {
          ta_code: '121FWT565',
          ta_name: 'Tees estuary at Greatham Creek',
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
