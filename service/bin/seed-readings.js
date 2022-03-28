const dotenv = require('dotenv')
const https = require('https')
dotenv.config({ path: './.env' })
const db = require('./db')
const pgp = require('pg-promise')()
const moment = require('moment-timezone')
const axios = require('axios')
const updateReadings = require('./update-readings')

axios.defaults.timeout = 30000
axios.defaults.httpsAgent = new https.Agent({ keepAlive: true })

const seedReadings = async () => {
  // Get list of measure Id's
  const response = await db.any(`
    (SELECT
    measure_id AS id, 
    CASE
    WHEN measure_id LIKE '%raingauge-t-15_min-mm%' THEN 96
    WHEN measure_id LIKE '%raingauge-t-1_h-mm%' THEN 24
    ELSE 2 END AS limit
    FROM station WHERE ref != '')
    UNION ALL
    (SELECT
    measure_downstream_id AS id,
    2 AS limit
    FROM station WHERE measure_id LIKE '%downstage%' AND ref != '')
    `)
  // Get data from API (approx 3k plus endpoints)
  const measures = response
  // const measures = response.slice(0, 10)
  const readings = []
  const errors = []
  const start = moment()
  let end, duration
  console.log(`--> Seed started at ${start.format('HH:mm:ss')}`)
  for (const [i, measure] of measures.entries()) {
    const uri = `http://environment.data.gov.uk/flood-monitoring/id/measures/${measure.id}/readings?_sorted&_limit=${measure.limit}`
    const percentage = `${((100 / measures.length) * (i + 1)).toFixed(2).padStart(4, '0')}%`
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
          datetime: item.dateTime
        })
      }
    } else {
      errors.push(measure.id)
    }
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
    end = moment()
    duration = end.diff(start)
    process.stdout.write(`--> Getting measures ${moment.utc(duration).format('HH:mm:ss')} ${percentage} ${String(i + 1)} of ${measures.length} (Readings ${readings.length}), Errors (${errors.length}) `)
  }
  // Truncate table and insert records
  process.stdout.write('\n')
  await db.any('TRUNCATE table reading')
  const cs = new pgp.helpers.ColumnSet(['id', 'measure_id', 'value', 'datetime'], { table: 'reading' })
  const query = pgp.helpers.insert(readings, cs)
  await db.none(query)
  console.log(`--> Inserted ${readings.length} readings`)
  // Run update as seed process takes longer than 15 minutes
  await updateReadings()
  // Update log
  await db.query('INSERT INTO log (datetime, message) values($1, $2)', [
    moment().format(), `Seeded readings: Inserted ${readings.length}`
  ])
}

seedReadings()
