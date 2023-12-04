const db = require('./db')

module.exports = {
  getTargetArea: async (id) => {
    const response = await db.query(`
    SELECT DISTINCT ON (id)
    lower(ta1.fws_tacode) AS id,
    'warning' AS type,
    ta1.ta_name AS name,
    ta1.area AS area,
    ta1.descrip AS geography,
    Replace(CONCAT(to_char(ST_X(ST_Centroid(ta1.geom)), '99.000000'),',',
    to_char(ST_Y(ST_Centroid(ta1.geom)), '99.000000')), ' ', '') AS centroid,
    Replace(CONCAT(to_char(ST_XMin(ta1.geom), '99.000000'),','
    ,to_char(ST_YMin(ta1.geom), '99.000000'),','
    ,to_char(ST_XMax(ta1.geom), '99.000000'),','
    ,to_char(ST_YMax(ta1.geom), '99.000000')), ' ', '') AS bbox,
    w1.severity,
    w1.message,
    w1.message_changed_date AT TIME ZONE '+00' AS date,
    ta1.parent AS parent_id,
    w2.severity AS parent_severity,
    'river-sea' AS source,
    coalesce(json_agg(json_build_object(
    'id', t.id,
    'rloiId', mwl.rloi_id,
    'name', mwl.name,
    'status', mwl.status,
    'river_name', mwl.river_name,
    'latest_height', mwl.latest_height,
    'latest_datetime', mwl.latest_datetime,
    'latest_status', mwl.latest_status,
    'type', t.type,
    'threshold', t.height,
    'stage', t.stage,
    'has_detail', CASE WHEN mwl.measure_id IS NOT NULL THEN true ELSE false END
    )) filter (WHERE mwl.rloi_id IS NOT NULL), '[]'::json) AS trigger_levels
    FROM flood_warning_areas ta1
    LEFT JOIN (
    Select id, targetarea_id, station_id, type, height, stage from trigger
    where LOWER(targetarea_id) = LOWER($1) and type SIMILAR TO '(FW RES FW|FW ACT FW|FW ACTCON FW)%'
    order by array_position(array['FW RES FW','FW ACT FW','FW ACTCON FW'], type), height asc
    limit 1
    ) as t ON LOWER(ta1.fws_tacode) = LOWER(t.targetarea_id)
    LEFT JOIN measure_with_latest mwl ON mwl.rloi_id = t.station_id
    LEFT JOIN warning w1 ON LOWER(ta1.fws_tacode) = LOWER(w1.id)
    LEFT JOIN warning w2 ON LOWER(ta1.parent) = LOWER(w2.id)
    WHERE LOWER(ta1.fws_tacode) = LOWER($1)
    GROUP BY t.targetarea_id, ta1.fws_tacode, ta1.ta_name, ta1.area, ta1.descrip, ta1.geom, w1.severity, w1.message, w1.message_changed_date, ta1.parent, w2.severity
    UNION ALL
    (SELECT DISTINCT ON (id)
    lower(ta2.fws_tacode) AS id,
    'alert' AS type,
    ta2.ta_name AS name,
    ta2.area AS area,
    ta2.descrip AS geography,
    Replace(CONCAT(to_char(ST_X(ST_Centroid(ta2.geom)), '99.000000'),',',
    to_char(ST_Y(ST_Centroid(ta2.geom)), '99.000000')), ' ', '') AS centroid,
    Replace(CONCAT(to_char(ST_XMin(ta2.geom), '99.000000'),','
    ,to_char(ST_YMin(ta2.geom), '99.000000'),','
    ,to_char(ST_XMax(ta2.geom), '99.000000'),','
    ,to_char(ST_YMax(ta2.geom), '99.000000')), ' ', '') AS bbox,
    w.severity,
    w.message,
    w.message_changed_date AT TIME ZONE '+00' AS date,
    null AS parent_id,
    null AS parent_severity,
    'river-sea' AS source,
    coalesce(json_agg(json_build_object(
    'id', t.id,
    'rloiId', mwl.rloi_id,
    'name', mwl.name,
    'status', mwl.status,
    'river_name', mwl.river_name,
    'latest_height', mwl.latest_height,
    'latest_datetime', mwl.latest_datetime,
    'latest_status', mwl.latest_status,
    'type', t.type,
    'threshold', t.height,
    'stage', t.stage,
    'has_detail', CASE WHEN mwl.measure_id IS NOT NULL THEN true ELSE false END
    )) filter (WHERE mwl.rloi_id IS NOT NULL), '[]'::json) AS trigger_levels
    FROM flood_alert_areas ta2
    LEFT JOIN (
    Select id, targetarea_id, station_id, type, height, stage from trigger
    where LOWER(targetarea_id) = LOWER($1) and type SIMILAR TO '(FW RES FAL|FW ACT FAL|FW ACTCON FAL)%'
    order by array_position(array['FW RES FAL', 'FW ACT FAL', 'FW ACTCON FAL'], type), height asc
    limit 1
    ) as t ON LOWER(ta2.fws_tacode) = LOWER(t.targetarea_id)
    LEFT JOIN measure_with_latest mwl ON mwl.rloi_id = t.station_id
    LEFT JOIN warning w ON LOWER(ta2.fws_tacode) = LOWER(w.id)
    WHERE LOWER(ta2.fws_tacode) = LOWER($1)
    GROUP BY t.targetarea_id, ta2.fws_tacode, ta2.ta_name, ta2.area, ta2.descrip, ta2.geom, w.severity, w.message, w.message_changed_date)
    UNION ALL
    (SELECT DISTINCT ON (id)
    lower(id) AS id,
    'alert' AS type,
    name,
    null AS area,
    null AS geography,
    Replace(CONCAT(to_char(ST_X(ST_Centroid(geom)), '99.000000'),',',
    to_char(ST_Y(ST_Centroid(geom)), '99.000000')), ' ', '') AS centroid,
    Replace(CONCAT(to_char(ST_XMin(geom), '99.000000'),','
    ,to_char(ST_YMin(geom), '99.000000'),','
    ,to_char(ST_XMax(geom), '99.000000'),','
    ,to_char(ST_YMax(geom), '99.000000')), ' ', '') AS bbox,
    severity,
    message,
    raised_date AT TIME ZONE '+00' AS date,
    null AS parent_id,
    null AS parent_severity,
    'surface-water' AS source,
    null AS trigger_levels
    FROM warning_surface_water
    WHERE LOWER(id) = LOWER($1)
    GROUP BY id, name, geom, severity, message, raised_date);
    `, [id])
    console.log(response[0])
    return response[0]
  }
}
