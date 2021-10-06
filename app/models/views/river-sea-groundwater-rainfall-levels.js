class ViewModel {
  constructor (query, place, river, levels) {
    this.queryTerm = query.term
    this.queryType = query.type
    this.place = place
    this.river = river
    this.levels = levels
  }
}
module.exports = ViewModel
