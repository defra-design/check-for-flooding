class ViewModel {
  constructor (targetArea) {
    const titleInActive = `${targetArea.name} flood ${targetArea.type} area`
    const titleActive = `Flood ${targetArea.type} for ${targetArea.name}`
    this.title = targetArea.severity && targetArea.severity.id !== 4 ? titleActive : titleInActive
    this.targetArea = targetArea
  }
}
module.exports = ViewModel
