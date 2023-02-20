const bingApiKey = process.env.BING_API_KEY
const moment = require('moment-timezone')

class ViewModel {
  constructor (targetArea) {
    const titleInActive = `${targetArea.name} flood ${targetArea.type} area`
    const titleActive = `Flood ${targetArea.type} for ${targetArea.name}`
    const isActive = targetArea.severity && targetArea.severity.id !== 4
    const isRemoved = targetArea.severity && targetArea.severity.id === 4
    const date = `${moment(targetArea.date).format('h:mma')} on ${moment(targetArea.date).format('D MMMM YYYY')}`
    this.title = isActive ? titleActive : titleInActive
    this.targetArea = targetArea
    this.targetAreaMessageDate = isActive ? `Updated at ${date}` : isRemoved ? `Removed at ${date}` : null
    this.isActive = isActive
    this.isRemoved = isRemoved
    this.mapLayers = `mv,ts,tw,ta${!isActive ? ',tr' : ''}`
    this.isParentActive = targetArea.parentSeverity && targetArea.parentSeverity.id === 3
    this.bingApiKey = bingApiKey
  }
}
module.exports = ViewModel
