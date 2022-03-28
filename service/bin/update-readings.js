const db = require('./db')
const pgp = require('pg-promise')()
const moment = require('moment-timezone')
const axios = require('axios')

// module.exports = async () => {
const update = async () => {
  // Get data from API
  const start = moment()
  console.log(`--> Started at ${start.format('HH:mm:ss')}`)
  const uri = 'http://environment.data.gov.uk/flood-monitoring/data/readings?latest'
  const response = await axios.get(uri).then(response => { return response })
  const readings = []
  if (response.status === 200 && response.data && response.data.items) {
    const measureTypes = ['downstage', 'stage', 'tidal', 'groundwater', 'rainfaill']
    const items = response.data.items.filter(x => measureTypes.some(string => x.measure.includes(string)))
    for (const item of items) {
      // Some measures have an array of numbers???
      if (typeof item.value !== 'number') {
        continue
      }
      readings.push({
        id: item['@id'].substring(item['@id'].lastIndexOf('readings/') + 9),
        measure_id: item.measure.substring(item.measure.lastIndexOf('/') + 1),
        value: item.value,
        datetime: item.dateTime
      })
    }
  }
  console.log(`--> Received ${readings.length} readings`)
  const cs = new pgp.helpers.ColumnSet(['id', 'measure_id', 'value', 'datetime'], { table: 'reading' })
  const query = pgp.helpers.insert(readings, cs) + ' ON CONFLICT (id) DO NOTHING'
  await db.none(query)
  console.log('--> Updated readings')
  await db.any(
    `SELECT * FROM reading a
    WHERE (measure_id LIKE '%raingauge-t-15_min%' AND id NOT IN (
    SELECT b.id FROM reading b WHERE b.measure_id = a.measure_id ORDER BY b.datetime DESC LIMIT 96))
    OR (measure_id LIKE '%raingauge-t-1_h%' AND id NOT IN (
    SELECT b.id FROM reading b WHERE b.measure_id = a.measure_id ORDER BY b.datetime DESC LIMIT 24))
    OR (measure_id NOT LIKE '%rainfall%' AND id NOT IN (
    SELECT b.id FROM reading b WHERE b.measure_id = a.measure_id ORDER BY b.datetime DESC LIMIT 2));`
  )
  console.log('--> Deleted old readings')
  // Update log
  await db.query('INSERT INTO log (datetime, message) values($1, $2)', [
    moment().format(), `Updated ${readings.length} readings`
  ])
  process.exit()
}
