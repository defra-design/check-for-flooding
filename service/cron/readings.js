const dotenv = require('dotenv')
const https = require('https')
dotenv.config({ path: './../../.env' })
const db = require('./../db')
const moment = require('moment-timezone')
const axios = require('axios')
const stationServices = require('./../station')
const cron = require('node-cron')

// cron.schedule('*/1 * * * * ', async () => {
//   console.log('running a task every one minute')
// })

axios.defaults.timeout = 30000
axios.defaults.httpsAgent = new https.Agent({ keepAlive: true })

const getReadings = async () => {
  const stationResponse = await stationServices.getStationIds()
  const stations = stationResponse
  const readings = []
  const errors = []
  const start = moment()
  let end, duration
  console.log(`= Started at ${start.format('HH:mm:ss')} =========`)
  for (const [i, station] of stations.entries()) {
    const qualifier = station.type === 'river' ? 'Stage' : station.type === 'river-downstage' ? 'Downstream Stage' : ''
    const limit = station.type === 'rainfall' ? 96 : 2
    const uri = `https://environment.data.gov.uk/flood-monitoring/id/stations/${station.id}/readings?qualifier=${qualifier}&_sorted&_limit=${limit}`
    const percentage = `${((100 / stations.length) * i).toFixed(2).padStart(4, '0')}%`
    const response = await axios.get(uri).then(response => { return response })
    if (response.status === 200 && response.data) {
      const items = response.data.items
      if (station.type === 'rainfall' && items.length === 96) {
        const value24 = items.reduce((a, b) => { return a + b.value }, 0)
        const value6 = items.slice(0, 24).reduce((a, b) => { return a + b.value }, 0)
        const value1 = items.slice(0, 4).reduce((a, b) => { return a + b.value }, 0)
        readings.push({ stationId: station.id, measure: null, type: 'value1', value: value1, dateTime: null })
        readings.push({ stationId: station.id, measure: null, type: 'value6', value: value6, dateTime: null })
        readings.push({ stationId: station.id, measure: null, type: 'value24', value: value24, dateTime: null })
        readings.push({ stationId: station.id, measure: null, type: 'latest', value: items[0].value, dateTime: items[0].dateTime })
      } else if (items.length >= 2) {
        const latest = Math.round(items[0].value * 100) / 100
        const previous = Math.round(items[1].value * 100) / 100
        const trend = latest > previous ? 1 : latest < previous ? -1 : 0
        readings.push({ stationId: station.id, measure: qualifier, type: 'latest', value: latest, dateTime: items[0].dateTime })
        readings.push({ stationId: station.id, measure: qualifier, type: 'trend', value: trend, dateTime: items[0].dateTime })
      } else {
        errors.push({ stationId: station.id, Error: 'no items' })
      }
    } else {
      errors.push({ stationId: station.id, Error: 'response' })
    }
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
    end = moment()
    duration = end.diff(start)
    process.stdout.write(`${moment.utc(duration).format('HH:mm:ss')} ${percentage} ${String(i)} of ${stations.length} | Errors (${errors.length}) | Current (${station.id}) `)
  }
  // Update table
  await db.query('TRUNCATE table reading')
  let isError = false
  for (const i in readings) {
    db.query('INSERT INTO reading (stationId, measure, type, value, date) values($1, $2, $3, $4, $5)', [
      readings[i].stationId, readings[i].measure, readings[i].type, readings[i].value, readings[i].dateTime
    ], (err) => {
      if (err) {
        isError = true
      }
    })
  }
  process.stdout.write(`\n= ${!isError ? 'Table updated' : 'Fail: Table insert error'} =========`)
  process.stdout.write(`\n= Finished at ${moment().format('HH:mm:ss')} =========\n`)
}

getReadings()
