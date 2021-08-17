class River {
  constructor (data) {
    this.slug = data.slug
    this.name = data.name
    this.bbox = data.bbox ? data.bbox.split(',').map((value) => { return Number(value) }) : []
  }
}
module.exports = River
