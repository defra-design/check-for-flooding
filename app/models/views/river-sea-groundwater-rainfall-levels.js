const bingApiKey = process.env.BING_API_KEY

class ViewModel {
  constructor (query, places, rivers, catchments, levels) {
    this.querySearch = decodeURI(query.search)
    this.querySearchType = query.searchType || ''
    this.queryType = levels ? levels.type : 'river'
    this.bbox = levels ? levels.bbox : []
    this.place = places.length ? places[0] : null
    this.places = places
    this.river = rivers.length ? rivers[0] : null
    this.rivers = rivers
    this.catchment = catchments.length ? catchments[0] : null
    this.catchments = catchments
    this.levels = levels
    this.bingApiKey = bingApiKey
    // Results
    this.isSinglePlace = places.length === 1 && !rivers.length && !catchments.length
    this.isSingleRiver = rivers.length === 1 && !places.length && !catchments.length
    this.isSingleCatchment = catchments.length === 1 && !places.length && !rivers.length
    this.isMultipleMatch = (places.length + rivers.length + catchments.length) > 1
    this.isMultipleGroupMatch = !!([places.length, rivers.length, catchments.length].filter(x => x > 0).length)
    this.isNoResults = !places.length && !rivers.length && !catchments.length
    // Errors
    this.isErrorEmpty = !query.search
    this.isErrorLocation = query.search && !places.length && !rivers.length && !catchments.length
    this.isErrorPostcode = places.length > 1 && (places.filter(place => place.type === 'postcode').length === places.length)
    this.isError = (this.isErrorEmpty || this.isErrorLocation || this.isErrorPostcode)
  }
}
module.exports = ViewModel
