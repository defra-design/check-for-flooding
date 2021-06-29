const { Pool } = require('pg')
const connectionString = process.env.DATABASE_URI
const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
})

module.exports = {
  query: async (sql, ...args) => {
    return pool.query(sql, ...args)
  }
}
