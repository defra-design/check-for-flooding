const dotenv = require('dotenv')
const https = require('https')
dotenv.config({ path: './../../.env' })
const db = require('./../db')
const moment = require('moment-timezone')
const axios = require('axios')
const measureServices = require('./../measure')
// const cron = require('node-cron')

// cron.schedule('*/1 * * * * ', async () => {
//   console.log('running a task every one minute')
// })

axios.defaults.timeout = 30000
axios.defaults.httpsAgent = new https.Agent({ keepAlive: true })

const seedReadings = async () => {
  const measureResponse = await measureServices.getMeasureIds()
  const measures = measureResponse.slice(0, 10)
  const readings = []
  const errors = []
  const start = moment()
  let end, duration
  console.log(`= Started at ${start.format('HH:mm:ss')} =========`)
  for (const [i, measure] of measures.entries()) {
    const uri = `http://environment.data.gov.uk/flood-monitoring/id/measures/${measure.id}/readings?_sorted&_limit=${measure.limit}`
    const percentage = `${((100 / measures.length) * i).toFixed(2).padStart(4, '0')}%`
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
          measureId: item.measure.substring(item.measure.lastIndexOf('/') + 1),
          value: item.value,
          dateTime: item.dateTime,
          processDateTime: start.toISOString()
        })
      }
    } else {
      errors.push(measure.id)
    }
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
    end = moment()
    duration = end.diff(start)
    process.stdout.write(`${moment.utc(duration).format('HH:mm:ss')} ${percentage} ${String(i)} of ${measures.length} | Readings (${readings.length}) | Errors (${errors.length}) `)
  }
  // Update table
  process.stdout.write('\n')
  await db.query('TRUNCATE table reading')
  let isError = false
  for (const i in readings) {
    const percentage = `${((100 / readings.length) * i).toFixed(2).padStart(4, '0')}%`
    await db.query('INSERT INTO reading (measure_id, value, datetime, process_datetime) values($1, $2, $3, $4)', [
      readings[i].measureId, readings[i].value, readings[i].dateTime, readings[i].processDateTime
    ], (err) => {
      if (err) {
        isError = true
      }
    })
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
    end = moment()
    duration = end.diff(start)
    process.stdout.write(`${moment.utc(duration).format('HH:mm:ss')} ${percentage} ${String(i)} of ${readings.length} `)
  }
  process.stdout.write('\n')
  console.log(`= ${isError ? 'Error insert' : 'Finished'} =========`)
}

seedReadings()
