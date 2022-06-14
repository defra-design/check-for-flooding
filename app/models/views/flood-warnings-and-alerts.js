const bingApiKey = process.env.BING_API_KEY

class ViewModel {
  constructor (querySearch, places, warnings) {
    this.searchType = 'placeOnly'
    this.querySearch = querySearch
    this.place = places.length ? places[0] : null
    this.bbox = places.length ? places[0].bboxBuffered : []
    this.places = places
    this.warnings = warnings
    this.bingApiKey = bingApiKey
    // Results
    this.isSingleMatch = !!querySearch && places.length === 1
    this.isMultipleMatch = !!querySearch && places.length > 1
    this.isNoResults = warnings && !warnings.groups.length
    // Errors
    this.isErrorLocation = !!querySearch && !places.length
    this.isErrorPostcode = !!querySearch && places.length > 1 && places.filter(p => p.type === 'postcode').length === places.length
  }
}
module.exports = ViewModel
