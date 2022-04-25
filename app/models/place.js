const utils = require('../utils')

class Place {
  constructor (gazetteerEntry) {
    const name = utils.getNameFromGazetteerEntry(gazetteerEntry)
    const bbox = [gazetteerEntry.bbox[1], gazetteerEntry.bbox[0], gazetteerEntry.bbox[3], gazetteerEntry.bbox[2]]
    const postcode = gazetteerEntry.address ? gazetteerEntry.address.postalCode : null
    this.type = gazetteerEntry.entityType.toLowerCase()
    this.name = name
    this.slug = utils.getSlug(name)
    this.postcode = postcode
    this.bbox = bbox
    this.bboxBuffered = utils.bufferBbox(bbox, 8000)
  }
}

module.exports = Place
