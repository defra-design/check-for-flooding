const db = require('./db')

module.exports = {
  // Used on detail page
  getThresholds: async (id, measure) => {
    const response = await db.query(`
    SELECT
    station.id,
    station.ref,
    threshold.name AS name,
    round(threshold.value::numeric,2) AS value
    FROM station
    LEFT JOIN threshold ON threshold.id = station.ref
    WHERE lower(station.id) = lower($1) AND threshold.measure = $2;
    `, [id, measure])
    return response.rows
  }
}
