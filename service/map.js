const db = require('./db')
const places = require('./data/places.json')
const outlookServices = require('./outlook')
const OutlookGeoJSON = require('./models/outlook')

module.exports = {
  getPlacesGeoJSON: async () => {
    return places
  },
  getOutlookGeoJSON: async () => {
    const outlook = await outlookServices.getOutlook()
    return new OutlookGeoJSON(outlook)
  },
  getWarningsGeoJSON: async () => {
    const response = await db.query(`
    SELECT warning.id, ST_AsGeoJSON(ST_Centroid(geom))::JSONB AS geometry, warning.name, warning.severity, warning.raised_date
    FROM warning JOIN flood_warning_areas ON flood_warning_areas.fws_tacode = warning.id UNION
    SELECT warning.id, ST_AsGeoJSON(ST_Centroid(geom))::JSONB AS geometry, warning.name, warning.severity, warning.raised_date
    FROM warning JOIN flood_alert_areas ON flood_alert_areas.fws_tacode = warning.id;
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
  },
  getStationsGeoJSON: async (type) => {
    const response = await db.query(`
    SELECT id, rloi_id, lon, lat, upper(type) AS type, is_wales, initcap(status) AS status, state, name, river, value, value_1hr, value_6hr, value_24hr, value_date, percentile_5, percentile_95, up, down
    FROM station
    WHERE $1 LIKE '%' || type || '%';
    `, [`${type}`])
    const features = []
    response.rows.forEach(row => {
      features.push({
        type: 'Feature',
        id: `stations.${row.type === 'R' ? row.id : row.rloi_id}`,
        geometry: {
          type: 'Point',
          coordinates: [row.lon, row.lat]
        },
        properties: {
          type: row.type,
          iswales: row.is_wales,
          status: row.status,
          atrisk: !!(row.state === 'high'),
          name: row.name,
          river: row.river,
          value: row.value,
          valueDate: row.value_date,
          value1hr: row.value_1hr,
          value6hr: row.value_6hr,
          value24hr: row.value_24hr,
          percentile5: row.percentile_5,
          percentile95: row.percentile_95,
          up: row.up,
          down: row.down
        }
      })
    })
    const geoJSON = {
      type: 'FeatureCollection',
      features: features
    }
    return geoJSON
  },
  getTargetAreasGeoJSON: async () => {
    const response = await db.query(`
    SELECT 5000 + id AS id, ST_AsGeoJSON(geom)::JSONB AS geometry, fws_tacode
    FROM flood_alert_areas
    UNION ALL
    SELECT id, ST_AsGeoJSON(geom)::JSONB AS geometry, fws_tacode
    FROM flood_warning_areas
    `)
    const features = []
    response.rows.forEach(row => {
      features.push({
        type: 'Feature',
        id: row.id,
        geometry: row.geometry,
        properties: {
          fws_tacode: row.fws_tacode
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
