const updateData = require('./update-data')
const updateRainfall = require('./update-rainfall')

const update = async () => {
  await updateData()
  await updateRainfall()
}

module.exports = update()
