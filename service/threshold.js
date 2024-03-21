const db = require('./db')

module.exports = {
  // Used on list page
  getThresholds: async (id) => {
    const response = await db.query(`
    SELECT DISTINCT ON (targetarea_id) * FROM (
      SELECT t.id::text, s.name AS name, w.ta_name AS description, t.targetarea_id,
      CASE when t.stage = 'd' THEN concat(t.station_id, '-downstage') ELSE t.station_id END AS station_id,
      'warning' AS type, t.height AS value, null::timestamp AS date
      FROM trigger t
      LEFT JOIN flood_warning_areas w ON lower(t.targetarea_id) = lower(w.fws_tacode)
      LEFT JOIN short_ta_name s ON lower(t.targetarea_id) = lower(s.fws_tacode)
      WHERE t.station_id = $1 AND w.ta_name IS NOT NULL AND t.type SIMILAR TO '(FW RES FW|FW ACT FW|FW ACTCON FW)%'
      ORDER BY array_position(array['FW RES FW', 'FW ACT FW', 'FW ACTCON FW'], t.type), t.height asc ) w
    UNION (SELECT * FROM (
      SELECT t.id::text, s.name AS name, a.ta_name AS description, t.targetarea_id,
      CASE when t.stage = 'd' THEN concat(t.station_id, '-downstage') ELSE t.station_id END AS station_id,
      'alert' AS type, t.height AS value, null::timestamp AS date
      FROM trigger t
      LEFT JOIN flood_alert_areas a ON lower(t.targetarea_id) = lower(a.fws_tacode)
      LEFT JOIN short_ta_name s ON lower(t.targetarea_id) = lower(s.fws_tacode)
      WHERE t.station_id = $1 AND a.ta_name IS NOT NULL AND t.type SIMILAR TO '(FW RES FAL|FW ACT FAL|FW ACTCON FAL)%'
      ORDER BY array_position(array['FW RES FAL', 'FW ACT FAL', 'FW ACTCON FAL'], t.type), t.height asc ) a)
    UNION (
      SELECT concat(rloi_id, '-max') AS id, null AS name, null AS description, null AS targetarea_id, rloi_id AS station_id, 'max' AS type, level_max AS value, level_max_datetime AS date
      FROM measure_with_latest
      WHERE rloi_id = $1
    )
    UNION (
      SELECT concat(rloi_id, '-high') AS id, null AS name, null AS description, null AS targetarea_id, rloi_id AS station_id, 'high' AS type, level_high AS value, null AS date
      FROM measure_with_latest
      WHERE rloi_id = $1
    )
    ORDER BY value desc;    
    `, id)
    return response || {}
  }
}
