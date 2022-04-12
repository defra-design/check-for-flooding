const moment = require('moment-timezone')
const updateData = require('./update-data')
const updateRainfall = require('./update-rainfall')

const update = async () => {
  const start = moment()
  console.log(`--> Data update: Latest readings started at ${start.format('HH:mm:ss')}`)
  await updateRainfall()
  await updateData()
  console.log(`--> Data update: Finished at ${moment().format('HH:mm:ss')}`)
}

module.exports = update()
