class River {
  constructor (data) {
    this.slug = data.slug
    this.name = data.name
    this.bbox = data.bbox
    this.levels = data.levels
  }
}
module.exports = River
