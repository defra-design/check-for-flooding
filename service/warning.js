const db = require('./db')

module.exports = {
  getWarnings: async () => {
    const response = await db.query(`
    SELECT id, name, severity, message_changed_date AT TIME ZONE '+00' AS updated FROM warning
    ORDER BY severity ASC
    `)
    return response
  },
  getWarningsWithinBbox: async (bbox = []) => {
    const queryAll = `
      SELECT id, name, severity, message_changed_date AT TIME ZONE '+00' AS updated FROM warning
      WHERE severity > 0 ORDER BY severity ASC
    `
    const queryBbox = `
      (SELECT warning.id, warning.name, warning.severity AS severity, warning.message_changed_date AT TIME ZONE '+00' AS updated FROM warning
      LEFT JOIN flood_alert_areas ON LOWER(flood_alert_areas.fws_tacode) = LOWER(warning.id)
      WHERE ST_Intersects(ST_MakeEnvelope($1,$2,$3,$4,4326), flood_alert_areas.geom) AND warning.severity > 0)
      UNION ALL
      (SELECT warning.id, warning.name, warning.severity AS severity, warning.message_changed_date AT TIME ZONE '+00' AS updated FROM warning
      LEFT JOIN flood_warning_areas ON LOWER(flood_warning_areas.fws_tacode) = LOWER(warning.id)
      WHERE ST_Intersects(ST_MakeEnvelope($1,$2,$3,$4,4326), flood_warning_areas.geom) AND warning.severity > 0)
      ORDER BY severity;  
    `
    const response = bbox.length ? await db.query(queryBbox, bbox) : await db.query(queryAll)
    return response
  }
}
