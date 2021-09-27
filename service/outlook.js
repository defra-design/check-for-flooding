const db = require('./db')

module.exports = {
  // Used with maps
  getOutlook: async () => {
    const response = await db.query(`
    SELECT * FROM outlook
    `)
    return response.rows[0].data.statement
  }
}
