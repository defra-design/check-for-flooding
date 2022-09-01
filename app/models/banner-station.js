class BannerStation {
  constructor (warnings, place) {
    const alert = warnings.groups.find(x => x.severity.id === 3)
    const warning = warnings.groups.find(x => x.severity.id === 2)
    const severe = warnings.groups.find(x => x.severity.id === 1)
    let severity, slug, count
    if (severe) {
      count = severe.items.length
      slug = severe.items.length === 1 ? severe.items[0].id : null
      severity = severe.severity
    } else if (warning) {
      count = warning.items.length
      slug = warning.items.length === 1 ? warning.items[0].id : null
      severity = warning.severity
    } else if (alert) {
      count = alert.items.length
      slug = alert.items.length === 1 ? alert.items[0].id : null
      severity = alert.severity
    }
    if (severity) {
      this.severity = severity.hash
      this.icon = severity.icon
      this.text = `There ${count === 1 ? 'is a' : 'are'} ${severity.title.toLowerCase()}${count === 1 ? '' : 's'} within 5 miles of this measuring station`
      this.link = slug ? `/target-area/${slug}` : `/flood-warnings-and-alerts?search=${place.postcode}`
    }
  }
}

module.exports = BannerStation
