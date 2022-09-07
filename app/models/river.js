const utils = require('../utils')

class River {
  constructor (data) {
    this.slug = utils.getSlug(data.qualified_name)
    this.name = data.local_name
    this.display = data.qualified_name
    // this.bbox = data.bbox ? data.bbox.split(',').map((value) => { return Number(value) }) : []
  }
}
module.exports = River
