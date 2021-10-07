const db = require('./db')

module.exports = {
  getTargetArea: async (id) => {
    const response = await db.query(`
    (SELECT
    flood_warning_areas.fws_tacode AS id,
    flood_warning_areas.parent,
    flood_warning_areas.ta_name AS name,
    flood_warning_areas.descrip AS area,
    Replace(CONCAT(to_char(ST_X(ST_Centroid(flood_warning_areas.geom)), '99.000000'),','
    ,to_char(ST_Y(ST_Centroid(flood_warning_areas.geom)), '99.000000')), ' ', '') AS centroid,
    Replace(CONCAT(to_char(ST_XMin(flood_warning_areas.geom), '99.000000'),','
    ,to_char(ST_YMin(flood_warning_areas.geom), '99.000000'),','
    ,to_char(ST_XMax(flood_warning_areas.geom), '99.000000'),','
    ,to_char(ST_YMax(flood_warning_areas.geom), '99.000000')), ' ', '') AS bbox,
    'warning' AS type,
    warning.severity, warning.message,
    warning.message_changed_date AS date
    FROM flood_warning_areas
    LEFT JOIN warning ON flood_warning_areas.fws_tacode = warning.id
    WHERE LOWER(flood_warning_areas.fws_tacode) = LOWER($1))
    UNION ALL
    (SELECT
    flood_alert_areas.fws_tacode AS id,
    null AS parent,
    flood_alert_areas.ta_name AS name,
    flood_alert_areas.descrip AS area,
    Replace(CONCAT(to_char(ST_X(ST_Centroid(flood_alert_areas.geom)), '99.000000'),','
    ,to_char(ST_Y(ST_Centroid(flood_alert_areas.geom)), '99.000000')), ' ', '') AS centroid,
    Replace(CONCAT(to_char(ST_XMin(flood_alert_areas.geom), '99.000000'),','
    ,to_char(ST_YMin(flood_alert_areas.geom), '99.000000'),','
    ,to_char(ST_XMax(flood_alert_areas.geom), '99.000000'),','
    ,to_char(ST_YMax(flood_alert_areas.geom), '99.000000')), ' ', '') AS bbox,
    'alert' AS type,
    warning.severity, warning.message,
    warning.message_changed_date AS date
    FROM flood_alert_areas
    LEFT JOIN warning ON flood_alert_areas.fws_tacode = warning.id
    WHERE LOWER(flood_alert_areas.fws_tacode) = LOWER($1));
    `, [id])
    return response.rows[0]
  }
}
