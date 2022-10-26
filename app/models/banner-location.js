class BannerLocation {
  constructor (place, warnings, levels) {
    const hasSevere = !!(warnings.groups.find(g => g.severity.id === 1))
    const hasWarnings = !!(warnings.groups.find(g => g.severity.id === 2))
    const hasAlerts = !!(warnings.groups.find(g => g.severity.id === 3))
    const hasRemoved = !!(warnings.groups.find(g => g.severity.id === 4))
    warnings.groups.forEach((group, i) => {
      switch (group.severity.hash) {
        case 'severe':
          this.groupSevere(group, place.name)
          break
        case 'warning':
          this.groupWarning(group, place.name)
          break
        case 'alert':
          this.groupAlert(hasSevere, hasWarnings, group, place.name)
          break
        case 'removed':
          this.groupRemoved(group, place.name)
          break
      }
    })
    this.hasSevere = hasSevere
    this.hasWarnings = hasWarnings
    this.hasAlerts = hasAlerts
    this.hasRemoved = hasRemoved
    this.hasHighLevels = levels.hasHigh
  }

  groupSevere (group, location) {
    console.log(group)
    this.severeSub = 'There is a danger to life'
    this.severitySevereTitle = group.severity.title
    if (group.items.length === 1) {
      this.severeMainLink = `/target-area/${group.items[0].id}`
      this.severeMainText = `Severe flood warning for ${group.items[0].name}`
    } else {
      this.severeMainLink = `/flood-warnings-and-alerts?place=${encodeURIComponent(location)}#severe`
      this.severeMainText = `${group.items.length} severe flood warnings in this area`
    }
    this.severeIcon = group.severity.icon
  }

  groupWarning (group, location) {
    this.sub = 'Flooding is expected'
    this.severity = group.severity.hash
    this.severityTitle = group.severity.title
    if (group.items.length === 1) {
      this.mainLink = `/target-area/${group.items[0].id}`
      this.mainText = `Flood warning for ${group.items[0].name}`
    } else {
      this.mainLink = `/flood-warnings-and-alerts?place=${encodeURIComponent(location)}#warnings`
      this.mainText = `${group.items.length} flood warnings in this area`
    }
    this.mainIcon = group.severity.icon
  }

  groupAlert (hasSevere, hasWarnings, group, location) {
    if (!hasSevere && !hasWarnings) {
      this.sub = 'Some flooding is possible'
      this.severity = group.severity.hash
      this.severityTitle = group.severity.title
      if (group.items.length === 1) {
        this.mainLink = `/target-area/${group.items[0].id}`
        this.mainText = 'There is a flood alert in this area'
      } else {
        this.mainLink = `/flood-warnings-and-alerts?place=${encodeURIComponent(location)}#alerts`
        this.mainText = `${group.items.length} flood alerts in this area`
      }
      this.mainIcon = group.severity.icon
    } else {
      this.alerts = group.items.length
      if (group.items.length === 1) {
        this.alertsSummaryLink = `/target-area/${group.items[0].id}`
        this.alertsSummaryLinkText = '1 flood alert'
        this.alertsSummaryText = 'is'
      } else {
        this.alertsSummaryLink = `/flood-warnings-and-alerts?place=${encodeURIComponent(location)}#alerts`
        this.alertsSummaryLinkText = `${group.items.length} flood alerts`
        this.alertsSummaryText = 'are'
      }
    }
  }

  groupRemoved (group, location) {
    this.removed = group.items.length
    // if (group.items.length === 1) {
    //   this.removedLink = `/target-area/${group.items[0].id}`
    //   this.removedLinkText = '1 flood alert or warning was removed '
    //   this.removedText = 'in the last 24 hours.'
    // } else {
    this.removedLink = `/flood-warnings-and-alerts?place=${encodeURIComponent(location)}#removed`
    this.removedLinkText = 'Flood warnings and alerts removed'
    this.removedText = ''
    // }
  }
}

module.exports = BannerLocation
