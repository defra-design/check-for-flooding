class ViewModel {
  constructor (query, places, isPost = false) {
    this.queryTerm = query.term
    this.places = places
    // Results
    this.isSinglePlace = isPost && places.length === 1
    this.isMultipleMatch = isPost && places.length > 1
    this.isNoResults = isPost && !places.length
    // Errors
    this.isErrorEmpty = isPost && !query.term
    this.isErrorLocation = isPost && query.term && !places.length
    this.isErrorPostcode = isPost && places.length > 1 && (places.filter(place => place.type === 'postcode').length === places.length)
    this.isError = isPost ? (this.isErrorEmpty || this.isErrorLocation || this.isErrorPostcode) : false
  }
}
module.exports = ViewModel
