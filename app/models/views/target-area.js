const bingApiKey = process.env.BING_API_KEY
const moment = require('moment-timezone')

const twitterAccount = {
  EnvAgencyNW: ['Cumbria and Lancashire', 'Gtr Mancs Mersey and Ches'],
  EnvAgencyYNE: ['Yorkshire', 'North East'],
  EnvAgencyMids: ['Lincs and Northants', 'East Midlands', 'West Midlands'],
  EnvAgencyAnglia: ['East Anglia', 'EnvAgencySW', 'Devon and Cornwall', 'Wessex'],
  EnvAgencySE: ['Thames', 'Herts and North London', 'Kent S London and E Sussex', 'Solent and South Downs']
}

class ViewModel {
  constructor (targetArea) {
    console.log(targetArea.area)
    // console.log(Object.keys(twitterAccount).find(t => twitterAccount[t].includes(targetArea.area)))
    const titleInActive = `${targetArea.name} flood ${targetArea.type} area`
    const titleActive = `Flood ${targetArea.type} for ${targetArea.name}`
    const isActive = targetArea.severity && targetArea.severity.id !== 4
    const isRemoved = targetArea.severity && targetArea.severity.id === 4
    const date = `${moment(targetArea.date).format('h:mma')} on ${moment(targetArea.date).format('D MMMM YYYY')}`
    this.title = isActive ? titleActive : titleInActive
    this.targetArea = targetArea
    this.twitterAccount = Object.keys(twitterAccount).find(t => twitterAccount[t].includes(targetArea.area))
    this.targetAreaMessageDate = isActive ? `Updated at ${date}` : isRemoved ? `Removed at ${date}` : null
    this.isActive = isActive
    this.isRemoved = isRemoved
    this.mapButtonText = `View map of the flood ${targetArea.type} area`
    this.mapButtonClass = 'defra-button-secondary defra-button-secondary--icon govuk-!-margin-top-4'
    this.mapLayers = `mv,ts,tw,ta${!isActive ? ',tr' : ''}`
    this.isParentActive = targetArea.parentSeverity && targetArea.parentSeverity.id === 3
    this.bingApiKey = bingApiKey
    this.mapFeature = {
      id: targetArea.id,
      name: targetArea.name,
      centre: targetArea.centroid
    }
  }
}
module.exports = ViewModel
