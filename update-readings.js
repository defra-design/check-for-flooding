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
        value: item.value, // Need to check for values that are an array?
        dateTime: item.dateTime,
        processDateTime: start.toISOString()
      })
    }
  }
  console.log('= Data received')
  // Update oldest record with latest
  const errors = []
  const promises = []
  const updated = []
  for (const [i, reading] of readings.entries()) {
    promises.push(new Promise((resolve, reject) => {
      db.query(`
        UPDATE reading
        SET value = $2, datetime = $3, process_datetime = $4
        WHERE measure_id = $1
        AND $3 > (SELECT MAX(datetime) 
        FROM reading WHERE reading.measure_id = $1)
        AND datetime = (SELECT MIN(datetime) 
        FROM reading WHERE reading.measure_id = $1)`, [
        reading.measureId, reading.value, reading.dateTime, reading.processDateTime
      ], (err, result) => {
        if (err) {
          console.log(err)
          errors.push(reading.measureId)
        } else if (result) {
          if (result.rowCount > 0) {
            updated.push(reading.measureId)
          }
        }
        const percentage = `${((100 / readings.length) * (i + 1)).toFixed(2).padStart(4, '0')}%`
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
        process.stdout.write(`= Updating records ${percentage} | Updated (${updated.length}) | Error (${errors.length})`)
        resolve(i)
      })
    }))
  }
  await Promise.all(promises).then(() => {
    console.log('\n= Update complete')
  })
  const end = moment()
  const duration = end.diff(start)
  console.log(`= Finished at ${end.format('HH:mm:ss')} (${moment.utc(duration).format('HH:mm:ss')})}`)
  console.log(errors)
}

updateReadings()
