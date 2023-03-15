const bingApiKey = process.env.BING_API_KEY
const nrwURL = process.env.NRW_URL

class ViewModel {
  constructor (query, places, rivers, levels, error) {
    this.querySearch = query ? decodeURI(query.search) : null
    this.querySearchType = query?.searchType
    this.queryType = levels ? levels.type : 'river'
    this.extent = levels ? levels.bbox : []
    this.place = places?.length ? places[0] : null
    this.places = places
    this.river = rivers?.length ? rivers[0] : null
    this.rivers = rivers
    this.levels = levels
    this.riverId = rivers?.length === 1 && !places?.length ? this.river?.id : null
    this.bingApiKey = bingApiKey
    this.nrwURL = nrwURL
    // Test
    if (this.querySearch?.toLocaleLowerCase() === 'frome') {
      this.showBingError = true
    }
    if (query?.searchType !== 'trigger') {
      // Results
      this.isSinglePlace = places?.length === 1 && !rivers?.length
      this.isSingleRiver = rivers?.length === 1 && !places?.length
      this.isMultipleMatch = (places?.length + rivers?.length) > 1
      this.isMultipleGroupMatch = !!([places?.length, rivers?.length].filter(x => x > 0).length)
      this.isNoResults = !places?.length && !rivers?.length
      // Errors
      this.isErrorBing = error === 'bing'
      this.isErrorEmpty = !query?.search
      this.isErrorLocation = query?.search && !places?.length && !rivers?.length
      this.isErrorPostcode = places?.length > 1 && (places?.filter(place => place.type === 'postcode').length === places?.length)
      this.isError = this.isErrorEmpty || this.isErrorLocation || this.isErrorPostcode
    }
  }
}
module.exports = ViewModel
