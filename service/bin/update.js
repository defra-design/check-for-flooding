const moment = require('moment-timezone')
const updateLevels = require('./update-levels')
const updateRainfall = require('./update-rainfall')
// const updateWarnings = require('./update-warnings')
const updateOutlook = require('./update-outlook')

module.exports = {
  getData: async () => {
    const start = moment()
    console.log(`--> Data update: Started at ${start.format('HH:mm:ss')}`)
    await updateRainfall(start)
    await updateLevels(start)
    // await updateWarnings(start)
    await updateOutlook(start)
    console.log(`--> Data update: Finished at ${moment().format('HH:mm:ss')}`)
  }
}
