const db = require('./db')

module.exports = {
  getRivers: async () => {
    const response = await db.query('SELECT * FROM river')
    return response.rows
  },

  getRiverBySlug: async (slug) => {
    const response = await db.query('SELECT * FROM river WHERE slug = $1', [slug])
    return response.rows[0] || {}
  },

  getRiversLikeSlug: async (slug) => {
    const response = await db.query('SELECT * FROM river WHERE slug LIKE $1', [`%${slug}%`])
    return response.rows
  }
}
