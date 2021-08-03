class River {
  constructor (data) {
    this.slug = data.slug
    this.name = data.name
    this.bbox = data.bbox.split(',').map((value) => {
      return Number(value)
    })
    this.levels = data.levels
  }
}
module.exports = River
