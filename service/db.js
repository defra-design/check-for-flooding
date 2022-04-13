const pgp = require('pg-promise')()
const connectionString = process.env.DATABASE_URL
const connection = {
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
}

module.exports = pgp(connection)
