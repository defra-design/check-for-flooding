const db = require('./db')

module.exports = {
  // Used on natioanl and location page
  getOutlook: async () => {
    const response = await db.query(`
    SELECT * FROM outlook
    `)
    return response.length ? response[0].data.statement : {}
  }
}
