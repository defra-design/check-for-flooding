const db = require('./db')

module.exports = {
  // Used on list page
  getThresholds: async (id) => {
    const response = await db.query(`
      SELECT DISTINCT ON (ta_name) lower(targetarea_id) AS id, name, ta_name AS description, height AS value, null AS date
      FROM (
        SELECT 'warning' AS name, t.id, w.ta_name, t.targetarea_id, t.station_id, t.type, t.height, t.stage
        FROM trigger t
        LEFT JOIN flood_warning_areas w ON lower(t.targetarea_id) = lower(w.fws_tacode)
        WHERE t.station_id = $1 AND w.ta_name IS NOT NULL AND t.type SIMILAR TO '(FW RES FW|FW ACT FW|FW ACTCON FW)%'
        UNION (
          SELECT 'alert' AS name, t.id, a.ta_name, t.targetarea_id, t.station_id, t.type, t.height, t.stage
          FROM trigger t
          LEFT JOIN flood_alert_areas a ON lower(t.targetarea_id) = lower(a.fws_tacode)
          WHERE t.station_id = $1 AND a.ta_name IS NOT NULL AND t.type SIMILAR TO '(FW RES FAL|FW ACT FAL|FW ACTCON FAL)%'
        )
      ) s
      ORDER BY ta_name, array_position(array['FW RES FW', 'FW ACT FW', 'FW ACTCON FW', 'FW RES FAL', 'FW ACT FAL', 'FW ACTCON FAL'], type), height desc;  
    `, id)
    return response || {}
  }
}
