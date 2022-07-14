const db = require('./db')

module.exports = {
  getTargetArea: async (id) => {
    const response = await db.query(`
    SELECT DISTINCT ON (id)
    ta1.fws_tacode AS id,
    'warning' AS type,
    ta1.ta_name AS name,
    ta1.descrip AS area,
    Replace(CONCAT(to_char(ST_X(ST_Centroid(ta1.geom)), '99.000000'),',',
    to_char(ST_Y(ST_Centroid(ta1.geom)), '99.000000')), ' ', '') AS centroid,
    Replace(CONCAT(to_char(ST_XMin(ta1.geom), '99.000000'),','
    ,to_char(ST_YMin(ta1.geom), '99.000000'),','
    ,to_char(ST_XMax(ta1.geom), '99.000000'),','
    ,to_char(ST_YMax(ta1.geom), '99.000000')), ' ', '') AS bbox,
    w1.severity,
    w1.message,
    w1.message_changed_date AS date,
    ta1.parent AS parent_id,
    w2.severity AS parent_severity,
    array_agg(targetarea_trigger.trigger_id) AS trigger_ids
    FROM flood_warning_areas ta1
    LEFT JOIN targetarea_trigger ON ta1.fws_tacode = targetarea_trigger.targetarea_id
    LEFT JOIN warning w1 ON ta1.fws_tacode = w1.id
    LEFT JOIN warning w2 ON ta1.parent = w2.id
    WHERE LOWER(ta1.fws_tacode) = LOWER($1)
    GROUP BY ta1.fws_tacode, ta1.ta_name, ta1.descrip, ta1.geom, w1.severity, w1.message, w1.message_changed_date, ta1.parent, w2.severity
    UNION ALL
    (SELECT DISTINCT ON (id)
    ta2.fws_tacode AS id,
    'alert' AS type,
    ta2.ta_name AS name,
    ta2.descrip AS area,
    Replace(CONCAT(to_char(ST_X(ST_Centroid(ta2.geom)), '99.000000'),',',
    to_char(ST_Y(ST_Centroid(ta2.geom)), '99.000000')), ' ', '') AS centroid,
    Replace(CONCAT(to_char(ST_XMin(ta2.geom), '99.000000'),','
    ,to_char(ST_YMin(ta2.geom), '99.000000'),','
    ,to_char(ST_XMax(ta2.geom), '99.000000'),','
    ,to_char(ST_YMax(ta2.geom), '99.000000')), ' ', '') AS bbox,
    warning.severity, warning.message,
    warning.message_changed_date AS date,
    null AS parent_id,
    null AS parent_severity,
    array_agg(targetarea_trigger.trigger_id) AS trigger_ids
    FROM flood_alert_areas ta2
    LEFT JOIN targetarea_trigger ON ta2.fws_tacode = targetarea_trigger.targetarea_id
    LEFT JOIN warning ON ta2.fws_tacode = warning.id
    WHERE LOWER(ta2.fws_tacode) = LOWER($1)
    GROUP BY ta2.fws_tacode, ta2.ta_name, ta2.descrip, ta2.geom, warning.severity, warning.message, warning.message_changed_date);
    `, [id])
    return response[0]
  }
}
