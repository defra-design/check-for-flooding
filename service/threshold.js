const db = require('./db')

module.exports = {
  // Used on detail page
  getThresholds: async (id, measure) => {
    const response = await db.query(`
    SELECT
    threshold.name AS name,
    round(threshold.value::numeric,2) AS value,
    threshold.date AS date
    FROM station
    LEFT JOIN threshold ON threshold.id = station.ref
    WHERE lower(station.id) = lower($1) AND threshold.measure = $2 AND threshold.name != 'low'
    ORDER BY threshold.value DESC, threshold.name;
    `, [id, measure])
    return response.rows
  }
}
