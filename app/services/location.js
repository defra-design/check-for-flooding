const axios = require('axios')
const apiKey = process.env.OS_NAMES_KEY
const utils = require('../utils')

module.exports = {
  getLocation: async (query) => {
    const types = ['postcode', 'hamlet', 'village', 'town', 'city', 'other_settlement'].map(i => `local_type:${i}`).join(' ')
    const uri = `https://api.os.uk/search/names/v1/find?query=${query}&fq=${types}&key=${apiKey}`
    const response = await axios.get(uri).then((response) => { return response })
    if (response.status === 200) {
      if (response.data.header.totalresults > 0) {
        // Flag places that share name, type and qaulfier - eg. Charlton, Wiltshire
        response.data.results = utils.setIsSimilar(response.data.results)
        // Remove places outside of England or that don't match slug
        response.data.results = response.data.results.filter(result =>
          query === utils.getSlugFromGazetteerEntry(result.GAZETTEER_ENTRY) &&
          result.GAZETTEER_ENTRY.COUNTRY === 'England')
        if (response.data.results.length) {
          // We have a valid result
          response.data.result = response.data.results[0].GAZETTEER_ENTRY
        }
        delete response.data.results
      }
    }
    return response
  },
  getLocations: async (query) => {
    const types = ['postcode', 'hamlet', 'village', 'town', 'city', 'other_settlement'].map(i => `local_type:${i}`).join(' ')
    const uri = `https://api.os.uk/search/names/v1/find?query=${query}&fq=${types}&key=${apiKey}`
    const response = await axios.get(uri).then((response) => { return response })
    if (response.status === 200) {
      if (response.data && response.data.results) {
        let results = []
        // Remove places outside of England
        results = response.data.results.filter(result => result.GAZETTEER_ENTRY.COUNTRY === 'England')
        // Remove fuzzy matches
        results = results.filter(result => result.GAZETTEER_ENTRY.NAME1.toLowerCase().includes(query.toLowerCase()))
        // Flag places that share name, type and qaulfier - eg. Charlton, Wiltshire
        results = utils.setIsSimilar(results)
        // Remove duplicates (OS API bug?)
        results = Array.from(new Map(results.map(result => [result.GAZETTEER_ENTRY.ID, result])).values())
        // Replace results with filtered set
        response.data.results = results
      }
    }
    return response
  }
}
