class Catchment {
  constructor (data) {
    this.name = data.eahydarea
    this.display = `${data.eahydarea} catchment`
  }
}
module.exports = Catchment
