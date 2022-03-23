
const db = require('./db')

// Get measure Id's
module.exports = {
  getMeasureIds: async () => {
    const response = await db.query(`
    (SELECT
    measure_id AS id,
    CASE
    WHEN station.type_name = 'rainfall' THEN 96
    ELSE 2 END AS limit
    FROM station WHERE ref != '')
    UNION ALL
    (SELECT
    measure_downstream_id AS id,
    2 AS limit
    FROM station WHERE type = 'm' AND ref != '');
    `)
    return response.rows
  }
}
