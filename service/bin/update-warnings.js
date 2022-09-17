const dotenv = require('dotenv')
dotenv.config({ path: './.env' })
const db = require('../db')
const pgp = require('pg-promise')()
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
  const uri = 'https://environment.data.gov.uk/flood-monitoring/id/floods'
  const response = await axios.get(uri).then(response => { return response }).catch((err) => {
    if (err.response.status !== 200) {
      throw new Error(`--> API call failed with status code: ${err.response.status} after 3 retry attempts`)
    }
  })
  if (response.status === 200 && response.data) {
    const warnings = []
    for (const item of response.data.items) {
      warnings.push({
        id: item['@id'].substring(item['@id'].lastIndexOf('floods/') + 7),
        // name: item.eaAreaName,
        name: item.description,
        message: item.message,
        severity: item.severityLevel,
        raised_date: item.timeRaised,
        message_changed_date: item.timeMessageChanged,
        severity_changed_date: item.timeSeverityChanged,
        process_datetime: processStartDatetime.format()
      })
    }
    await db.none('TRUNCATE TABLE warning;')
    if (warnings.length) {
      const cs = new pgp.helpers.ColumnSet(['id', 'name', 'message', 'severity', 'raised_date', 'message_changed_date', 'severity_changed_date', 'process_datetime'], { table: 'warning' })
      const query = pgp.helpers.insert(warnings, cs)
      await db.none(query)
    }
    console.log('--> Data update: Updated flood Alerts and Warnings')
    // Update log
    await db.query('INSERT INTO log (datetime, message) values($1, $2)', [
      moment().format(), 'Data update: Updated flood Alerts and Warnings'
    ])
  } else {
    console.log('--> Data update: Error receiving latest flood Alerts and Warnings')
  }
}
