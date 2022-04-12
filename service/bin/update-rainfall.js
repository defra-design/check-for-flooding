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

module.exports = async () => {
  // Get list of measure Id's
  const response = await db.any(`
    SELECT id, 
    CASE
    WHEN id LIKE '%raingauge-t-15_min-mm%' OR id LIKE '%raingauge-Event-15_min%' THEN 96
    WHEN id LIKE '%raingauge-t-1_h-mm%' THEN 24
    ELSE 0 END AS limit
    FROM measure WHERE id LIKE '%raingauge%' AND id NOT LIKE '%Not_Specified%';
  `)
  // Get data from API (approx 3k plus endpoints)
  const measures = response
  // const measures = response.slice(0, 10)
  const readings = []
  const errors = []
  const start = moment()
  console.log(`--> Data update: Rainfall started at ${start.format('HH:mm:ss')} - approx 5-10 mins`)
  for (const measure of measures) {
    const uri = `http://environment.data.gov.uk/flood-monitoring/id/measures/${measure.id}/readings?_sorted&_limit=${measure.limit}`
    // const percentage = ((100 / measures.length) * (i + 1))
    // const percentageDisplay = `${percentage.toFixed(2).padStart(4, '0')}%`
    let response
    try {
      response = await axios.get(uri) // .then(response => { return response })
    } catch (err) {
      errors.push(measure.id)
      continue
    }
    if (response.status === 200 && response.data && response.data.items) {
      const items = response.data.items
      for (const item of items) {
        readings.push({
          id: item['@id'].substring(item['@id'].lastIndexOf('readings/') + 9),
          measure_id: item.measure.substring(item.measure.lastIndexOf('/') + 1),
          value: item.value,
          datetime: item.dateTime,
          process_datetime: start.format()
        })
      }
    } else {
      errors.push(measure.id)
    }
  }
  const end = moment()
  const duration = end.diff(start)
  console.log(`--> Data update: Received ${readings.length} readings from ${measures.length} measures at ${end.format('HH:mm:ss')} (${moment.utc(duration).format('HH:mm:ss')})`)
  const deleted = await db.any(`
    WITH deleted AS (DELETE FROM reading WHERE id LIKE '%rainfall%' RETURNING id)
    SELECT count(*) FROM deleted;
  `)
  console.log(`--> Data update: Deleted ${deleted[0].count} previous rainfall readings`)
  const cs = new pgp.helpers.ColumnSet(['id', 'measure_id', 'value', 'datetime', 'process_datetime'], { table: 'reading' })
  const query = pgp.helpers.insert(readings, cs)
  await db.none(query)
  console.log(`--> Data update: Inserted ${readings.length} rainfall readings`)
  // Update log
  await db.query('INSERT INTO log (datetime, message) values($1, $2)', [
    moment().format(), `Data update: Inserted ${readings.length} rainfall readings`
  ])
}
