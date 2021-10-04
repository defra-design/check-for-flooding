const db = require('./db')

module.exports = {
  getWarnings: async () => {
    const response = await db.query(`
    SELECT id, name, severity FROM warning
    ORDER BY severity ASC
    `)
    return response.rows
  },
  getWarningsWithinBbox: async (bbox) => {
    const response = await db.query(`
    (SELECT warning.id, warning.name, warning.severity As severity FROM warning
    LEFT JOIN flood_alert_areas ON flood_alert_areas.fws_tacode = warning.id
    WHERE ST_Intersects(ST_MakeEnvelope($1,$2,$3,$4,4326), flood_alert_areas.geom))
    UNION ALL
    (SELECT warning.id, warning.name, warning.severity As severity FROM warning
    LEFT JOIN flood_warning_areas ON flood_warning_areas.fws_tacode = warning.id
    WHERE ST_Intersects(ST_MakeEnvelope($1,$2,$3,$4,4326), flood_warning_areas.geom))
    ORDER BY severity;  
    `, bbox)
    return response.rows
  }
}
