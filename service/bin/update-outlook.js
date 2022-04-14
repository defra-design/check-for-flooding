const dotenv = require('dotenv')
dotenv.config({ path: './.env' })
const db = require('../db')
const moment = require('moment-timezone')
const axios = require('axios')
const axiosRetry = require('axios-retry')

axiosRetry(axios, {
  retries: 3, // number of retries
  retryDelay: (retryCount) => {
    console.log(`retry attempt: ${retryCount}`)
    return retryCount * 2000 // time interval between retries
  },
  retryCondition: (error) => {
    // if retry condition is not specified, by default idempotent requests are retried
    return error.response.status === 503
  }
})

module.exports = async (processStartDatetime) => {
  // Get data from API
  const uri = 'https://api.ffc-environment-agency.fgs.metoffice.gov.uk/api/public/v1/statements/latest'
  const response = await axios.get(uri).then(response => { return response }).catch((err) => {
    if (err.response.status !== 200) {
      throw new Error(`--> API call failed with status code: ${err.response.status} after 3 retry attempts`)
    }
  })
  if (response.status === 200 && response.data) {
    await db.none('TRUNCATE TABLE outlook;')
    await db.none(`
      INSERT INTO outlook (data, process_datetime) values($1, $2)
    `, [response.data, processStartDatetime])
    console.log('--> Data update: Updated FGS statement')
    // Update log
    await db.query('INSERT INTO log (datetime, message) values($1, $2)', [
      moment().format(), 'Data update: Updated FGS statement'
    ])
  } else {
    console.log('--> Data update: Error receiving latest FGS')
  }
}
