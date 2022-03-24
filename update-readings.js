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

const updateReadings = async () => {
  // Get data from API
  const start = moment()
  console.log(`= Started at ${start.format('HH:mm:ss')}`)
  const uri = 'http://environment.data.gov.uk/flood-monitoring/data/readings?latest'
  const response = await axios.get(uri).then(response => { return response })
  const readings = []
  if (response.status === 200 && response.data && response.data.items) {
    const items = response.data.items
    for (const item of items) {
      readings.push({
        measureId: item.measure.substring(item.measure.lastIndexOf('/') + 1),
        value: item.value,
        dateTime: item.dateTime,
        processDateTime: start.toISOString()
      })
    }
  }
  console.log('= Data received')
  // Insert new records
  const insertErrors = []
  const insertPromises = []
  const inserted = []
  for (const [i, reading] of readings.entries()) {
    // Insert latest reading
    // If the time is newer than the current latest
    insertPromises.push(new Promise((resolve, reject) => {
      db.query(`
        INSERT INTO reading (measure_id, value, datetime, process_datetime)
        SELECT $1, $2, $3, $4
        WHERE $3 > (SELECT MAX(datetime) 
        FROM reading WHERE reading.measure_id = $1)`, [
        reading.measureId, reading.value, reading.dateTime, reading.processDateTime
      ], (err, result) => {
        if (err) {
          insertErrors.push(reading.measureId)
        } else if (result) {
          if (result.rowCount > 0) {
            inserted.push(reading.measureId)
          }
        }
        const percentage = `${((100 / readings.length) * (i + 1)).toFixed(2).padStart(4, '0')}%`
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
        process.stdout.write(`= Inserting records ${percentage} | Inserted (${inserted.length}) | Error (${insertErrors.length})`)
        resolve(i)
      })
    }))
  }
  await Promise.all(insertPromises).then(() => {
    console.log('\n= Insert complete')
  })
  // Delete old records
  // Rainfall these are more that 23 hours 45 minutes old otherwise 15mins older than latest
  const deletedErrors = []
  const deletedPromises = []
  const deleted = []
  for (const [i, reading] of readings.entries()) {
    deletedPromises.push(new Promise((resolve, reject) => {
      const minutes = reading.measureId.includes('rainfall') ? 1425 : 15
      db.query(`
        DELETE FROM reading
        WHERE measure_id = $1
        AND datetime < (SELECT MAX(datetime) 
        FROM reading where measure_id = $1) - interval '${minutes} minutes'`, [
        reading.measureId
      ], (err, result) => {
        if (err) {
          deletedErrors.push(reading.measureId)
        } else if (result) {
          if (result.rowCount > 0) {
            deleted.push(reading.measureId)
          }
        }
        const percentage = `${((100 / readings.length) * (i + 1)).toFixed(2).padStart(4, '0')}%`
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
        process.stdout.write(`= Deleting records ${percentage} | Deleted (${deleted.length}) | Error (${deletedErrors.length})`)
        resolve(i)
      })
    }))
  }
  await Promise.all(deletedPromises).then(() => {
    console.log('\n= Delete complete')
  })
  const end = moment()
  const duration = end.diff(start)
  console.log(`= Finished at ${end.format('HH:mm:ss')} (${moment.utc(duration).format('HH:mm:ss')})}`)
}

updateReadings()
