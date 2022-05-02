const db = require('./db')

module.exports = {
  getRiver: async (slug) => {
    const response = await db.query(`
    SELECT * FROM river
    WHERE slug = $1
    ORDER BY display
    `, [slug])
    return response[0] || {}
  },

  getRivers: async (query) => {
    const response = await db.query(`
    SELECT * FROM river
    WHERE lower($2) NOT SIMILAR TO 'river|brook|stream' AND (lower(name) LIKE lower($1) OR lower(display) = lower($2))
    ORDER BY display
    `, [`%${query}%`, query])
    return response
  }
}
