const db = require('./db')

module.exports = {
  // Used with maps
  getWarningsGeoJSON: async () => {
    const response = await db.query(`
    SELECT warning_alert.id, ST_AsGeoJSON(ST_Centroid(geom))::JSONB AS geometry, warning_alert.name, warning_alert.severity, warning_alert.raised_date
    FROM warning_alert JOIN flood_warning_areas ON flood_warning_areas.fws_tacode = warning_alert.id UNION
    SELECT warning_alert.id, ST_AsGeoJSON(ST_Centroid(geom))::JSONB AS geometry, warning_alert.name, warning_alert.severity, warning_alert.raised_date
    FROM warning_alert JOIN flood_alert_areas ON flood_alert_areas.fws_tacode = warning_alert.id;
    `)
    const features = []
    response.rows.forEach(row => {
      features.push({
        type: 'Feature',
        id: row.id,
        geometry: row.geometry,
        properties: {
          name: row.name,
          severity: Number(row.severity),
          issuedDate: row.raised_date,
          type: 'TA'
        }
      })
    })
    const geoJSON = {
      type: 'FeatureCollection',
      features: features
    }
    return geoJSON
  }
}
