const db = require('./db')

module.exports = {
  // Used in search
  getRivers: async () => {
    const response = await db.query('SELECT * FROM river')
    return response.rows
  },

  getRiverBySlug: async (slug) => {
    const response = await db.query(`
    SELECT * FROM river
    WHERE slug = $1
    `, [slug])
    return response.rows[0] || {}
  },

  getRiversLikeSlug: async (slug) => {
    const response = await db.query(`
    SELECT * FROM river
    WHERE slug LIKE $1 OR slug LIKE $2 OR slug = $3
    `, [`%-${slug}%`, `%${slug}-%`, slug])
    return response.rows
  },

  // Used on list pages
  getRiverDetailBySlug: async (slug) => {
    const response = await db.query(`
    SELECT river.display AS river_name, station.name AS station_name, round(station.value, 2), station.value_date,
    CASE WHEN station.value <= station.percentile_95 THEN 'low'
    WHEN station.value >= station.percentile_5 THEN 'high'
    ELSE 'normal'
    END as state
    FROM station
    INNER JOIN river_station ON river_station.station_id = station.id
    INNER JOIN river ON river.slug = river_station.slug
    WHERE river_station.slug = $1
    ORDER BY river_station.order
    `, [slug])
    return response.rows || {}
  }
}
