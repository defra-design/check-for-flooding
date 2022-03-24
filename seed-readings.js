//
// Seed readings table from public API
// Warning: Takes approx 15-20 minutes
//

const dotenv = require('dotenv')
const https = require('https')
dotenv.config({ path: './.env' })
const db = require('./service/db')
const moment = require('moment-timezone')
const axios = require('axios')
// const cron = require('node-cron')

// cron.schedule('*/1 * * * * ', async () => {
//   console.log('running a task every one minute')
// })

axios.defaults.timeout = 30000
axios.defaults.httpsAgent = new https.Agent({ keepAlive: true })

const seedReadings = async () => {
  // Get list of measure Id's
  const response = await db.query(`
    (SELECT
    ref AS id,
    CASE
    WHEN station.type_name = 'rainfall' THEN 96
    WHEN station.type = 'm' THEN 4
    ELSE 2 END AS limit
    FROM station WHERE ref != '')
  `)
  // Get data from API (approx 3k plus endpoints)
  const stations = response.rows.slice(0, 10)
  const readings = []
  const errors = []
  const start = moment()
  let end, duration
  console.log(`= Started at ${start.format('HH:mm:ss')}`)
  for (const [i, station] of stations.entries()) {
    const uri = `http://environment.data.gov.uk/flood-monitoring/id/stations/${station.id}/readings?_sorted&_limit=${station.limit}`
    const percentage = `${((100 / stations.length) * (i + 1)).toFixed(2).padStart(4, '0')}%`
    let response
    try {
      response = await axios.get(uri) // .then(response => { return response })
    } catch (err) {
      errors.push(station.id)
      continue
    }
    if (response.status === 200 && response.data && response.data.items) {
      const items = response.data.items
      for (const item of items) {
        let measureType = 'stage'
        if (item.measure.includes('downstage')) {
          measureType = 'downstage'
        } else if (item.measure.includes('rainfall')) {
          measureType = 'rainfall'
        } else if (item.measure.includes('tidal')) {
          measureType = 'tidal'
        } else if (item.measure.includes('groundwater')) {
          measureType = 'groundwater'
        }
        readings.push({
          stationId: station.id,
          measureId: item.measure.substring(item.measure.lastIndexOf('/') + 1),
          measureType: measureType,
          value: item.value,
          dateTime: item.dateTime,
          processDateTime: start.toISOString()
        })
      }
    } else {
      errors.push(station.id)
    }
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
    end = moment()
    duration = end.diff(start)
    process.stdout.write(`= Getting stations ${moment.utc(duration).format('HH:mm:ss')} ${percentage} ${String(i + 1)} of ${stations.length} | Readings (${readings.length}) | Errors (${errors.length}) `)
  }
  // Truncate table and insert records
  process.stdout.write('\n')
  await db.query('TRUNCATE table reading')
  const insertErrors = []
  const insertPromises = []
  const inserted = []
  for (const [i, reading] of readings.entries()) {
    const percentage = `${((100 / readings.length) * (i + 1)).toFixed(2).padStart(4, '0')}%`
    // const percentage = `${((100 / readings.length) * (i + 1)).toFixed(2).padStart(4, '0')}%`
    insertPromises.push(new Promise((resolve, reject) => {
      db.query('INSERT INTO reading (station_id, measure_id, type, value, datetime, process_datetime) values($1, $2, $3, $4, $5, $6)', [
        reading.stationId, reading.measureId, reading.measureType, reading.value, reading.dateTime, reading.processDateTime
      ], (err, result) => {
        if (err) {
          insertErrors.push(reading.stationId)
        } else if (result) {
          inserted.push(reading.stationId)
        }
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
        end = moment()
        duration = end.diff(start)
        process.stdout.write(`= Inserting records ${percentage} | Inserted (${inserted.length}) | Error (${insertErrors.length})`)
        resolve(i)
      })
    }))
  }
  await Promise.all(insertPromises).then(() => {
    process.stdout.write('\n')
    console.log('= Finished')
  })
}

seedReadings()
