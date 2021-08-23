const { Pool } = require('pg')
const isDev = process.env.ENVIRONMENT === 'dev'
const connectionString = process.env.DATABASE_URL
const pool = isDev ? new Pool({
  connectionString: connectionString
}) : new Pool({
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
