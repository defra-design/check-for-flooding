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
    ORDER BY display
    `, [slug])
    return response.rows[0] || {}
  },

  getRiversLikeSlug: async (slug) => {
    const response = await db.query(`
    SELECT * FROM river
    WHERE slug LIKE $1 OR slug LIKE $2 OR slug = $3
    ORDER BY display
    `, [`%-${slug}%`, `%${slug}-%`, slug])
    return response.rows
  },

  // Used on list pages
  getRiverDetailBySlug: async (slug) => {
    const response = await db.query(`
    SELECT river.display AS name, river.slug,
    replace(substring(left(ST_Extent(station.geom) :: text, -1), 5),' ',',') AS bbox
    FROM river
    LEFT JOIN river_station ON river_station.slug = river.slug
    LEFT JOIN station ON river_station.station_id = station.id
    WHERE river.slug LIKE $1 OR river.slug LIKE $2 OR river.slug LIKE $3
    GROUP BY river.display, river.slug
    `, [`%-${slug}%`, `%${slug}-%`, slug])
    // Address this in SQL/Materialised view
    if (response.rows && [...new Set(response.rows.map(item => item.river_slug))].length > 1) {
      response.rows = []
    }
    return response.rows.length ? response.rows[0] : {}
  }
}
