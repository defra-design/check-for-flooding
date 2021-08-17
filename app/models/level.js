class Level {
  constructor (data) {
    this.id = data.id
    this.name = data.name
    this.state = data.state
    this.value = data.value
    this.velueDate = data.value_date
    this.elapsedTime = data.value_date ? this.formatElaspedTime(data.value_date) : ''
    this.type = data.type
    this.riverSlug = data.river_slug || ''
  }

  formatElaspedTime (date) {
    const duration = (new Date() - new Date(date))
    const mins = Math.floor(duration / (1000 * 60))
    const hours = Math.floor(duration / (1000 * 60 * 60))
    const days = parseInt(Math.floor(hours / 24))
    if (mins < 91) {
      return `${mins} minutes ago`
    } else {
      if (hours < 48) {
        return `${hours} hours ago`
      } else {
        return `${days} days ago`
      }
    }
  }
}
module.exports = Level
