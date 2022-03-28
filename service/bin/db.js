const dotenv = require('dotenv')
dotenv.config({ path: './.env' })
const pgp = require('pg-promise')()
const connectionString = process.env.DATABASE_URL
const cn = {
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
}
const db = pgp(cn)

module.exports = db
