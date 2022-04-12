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
  // Get data from API
  const uri = 'http://environment.data.gov.uk/flood-monitoring/data/readings?latest'
  // const uri = 'http://environment.data.gov.uk/flood-monitoring/data/readings?today&parameter=level&_sorted&_limit=10000'
  const readings = []
  const response = await axios.get(uri).then(response => { return response }).catch((err) => {
    if (err.response.status !== 200) {
      throw new Error(`--> API call failed with status code: ${err.response.status} after 3 retry attempts`)
    }
  })
  if (response.status === 200 && response.data && response.data.items) {
    const items = response.data.items.filter(x => !x['@id'].includes('rainfall'))
    const end = moment()
    console.log(`--> Data update: Received ${items.length} readings, excluding rainfall at ${end.format('HH:mm:ss')}`)
    for (const item of items) {
      // Some measures have an array of numbers???
      if (typeof item.value !== 'number') {
        continue
      }
      readings.push({
        id: item['@id'].substring(item['@id'].lastIndexOf('readings/') + 9),
        measure_id: item.measure.substring(item.measure.lastIndexOf('/') + 1),
        value: item.value,
        datetime: item.dateTime,
        process_datetime: end.format()
      })
    }
    const cs = new pgp.helpers.ColumnSet(['id', 'measure_id', 'value', 'datetime', 'process_datetime'], { table: 'reading' })
    const query = pgp.helpers.insert(readings, cs) + ' ON CONFLICT (id) DO UPDATE SET process_datetime = EXCLUDED.process_datetime'
    await db.none(query)
    console.log(`--> Data update: Insert/updated ${items.length} readings, excluding rainfall`)
    // Delete old records
    const deleted = await db.any(`
      WITH deleted AS (DELETE FROM reading WHERE process_datetime NOT IN
      (SELECT DISTINCT ON (process_datetime) process_datetime FROM reading
      ORDER BY process_datetime DESC
      LIMIT 2) RETURNING id )
      SELECT count(*) FROM deleted;
    `)
    console.log(`--> Data update: Deleted ${deleted[0].count} readings processed earlier than the last two updates`)
    // Refresh materialized view
    await db.query('REFRESH MATERIALIZED VIEW CONCURRENTLY measure_with_latest;')
    console.log('--> Data update: Refreshed materialized view')
    // Update log
    await db.query('INSERT INTO log (datetime, message) values($1, $2)', [
      moment().format(), `Data update: Updated ${readings.length} readings, excluding rainfall`
    ])
  } else {
    console.log(`--> Data update: Error ${response.status} receiving readings`)
  }
}
