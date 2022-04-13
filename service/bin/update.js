const moment = require('moment-timezone')
const updateData = require('./update-data')
const updateRainfall = require('./update-rainfall')

const update = async () => {
  const start = moment()
  console.log(`--> Data update: Started at ${start.format('HH:mm:ss')}`)
  await updateRainfall(start)
  await updateData(start)
  console.log(`--> Data update: Finished at ${moment().format('HH:mm:ss')}`)
}

module.exports = update()
