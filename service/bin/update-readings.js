const db = require('./db')
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
// const updateReading = async () => {
  // Get data from API
  const start = moment()
  console.log(`--> Update started at ${start.format('HH:mm:ss')}`)
  const uri = 'http://environment.data.gov.uk/flood-monitoring/data/readings?latest'
  // const uri = 'http://environment.data.gov.uk/flood-monitoring/data/readings?today&parameter=level&_sorted&_limit=10000'
  const readings = []
  const response = await axios.get(uri).then(response => { return response }).catch((err) => {
    if (err.response.status !== 200) {
      throw new Error(`--> API call failed with status code: ${err.response.status} after 3 retry attempts`)
    }
  })
  if (response.status === 200 && response.data && response.data.items) {
    const items = response.data.items
    const end = moment()
    const duration = end.diff(start)
    console.log(`--> Received ${items.length} readings at ${end.format('HH:mm:ss')} (${moment.utc(duration).format('HH:mm:ss')})`)
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
    console.log(`--> Insert/updated ${items.length} new readings`)
    // Delete old records
    const deleted = await db.any(`
      WITH deleted AS (DELETE FROM reading WHERE process_datetime NOT IN
      (SELECT DISTINCT ON (process_datetime) process_datetime FROM reading
      ORDER BY process_datetime DESC
      LIMIT 2) RETURNING id )
      SELECT count(*) FROM deleted;
    `)
    console.log(`--> Deleted ${deleted[0].count} readings processed earlier than latest 2`)
    // Update log
    await db.query('INSERT INTO log (datetime, message) values($1, $2)', [
      moment().format(), `Updated ${readings.length} readings`
    ])
  } else {
    console.log(`--> Error ${response.status} receiving readings`)
  }
}

// module.exports = updateReadings()
