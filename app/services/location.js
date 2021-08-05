const axios = require('axios')
const apiKey = process.env.OS_NAMES_KEY
const utils = require('../utils')

module.exports = {
  // Return a unique results - used for resolving routes
  getLocationBySlug: async (slug) => {
    const query = slug.replace(/-/g, ' ')
    const types = ['postcode', 'hamlet', 'village', 'town', 'city', 'other_settlement'].map(i => `local_type:${i}`).join(' ')
    const uri = `https://api.os.uk/search/names/v1/find?query=${query}&fq=${types}&key=${apiKey}`
    const response = await axios.get(uri).then((response) => { return response })
    if (response.status === 200) {
      if (response.data.header.totalresults > 0) {
        // Flag places that share name, type and qaulfier - eg. Charlton, Wiltshire
        response.data.results = utils.setIsSimilar(response.data.results)
        // Remove places outside of England or that don't match slug
        response.data.results = response.data.results.filter(result =>
          slug === utils.getSlugFromGazetteerEntry(result.GAZETTEER_ENTRY) &&
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
  // Return a unique results, expect postcodes - used for resolving queries
  getLocationByQuery: async (query) => {
    query = encodeURI(query)
    const types = ['postcode', 'hamlet', 'village', 'town', 'city', 'other_settlement'].map(i => `local_type:${i}`).join(' ')
    const uri = `https://api.os.uk/search/names/v1/find?query=${query}&fq=${types}&key=${apiKey}`
    const response = await axios.get(uri).then((response) => { return response })
    if (response.status === 200) {
      if (response.data.header.totalresults > 0) {
        let results = response.data.results
        // Flag places that share name, type and qaulfier - eg. Charlton, Wiltshire
        results = utils.setIsSimilar(results)
        // Remove places outside of England or that don't match slug unless its a postcode
        results = results.filter(result => utils.isGazetteerMatch(query, result.GAZETTEER_ENTRY))
        if (results.length) {
          // We have a valid result
          response.data.result = results[0].GAZETTEER_ENTRY
        }
        delete response.data.results
      }
    }
    return response
  },
  // Return multiple results - used for resolving queries
  getLocationsByQuery: async (query) => {
    query = encodeURI(query)
    const types = ['postcode', 'hamlet', 'village', 'town', 'city', 'other_settlement'].map(i => `local_type:${i}`).join(' ')
    const uri = `https://api.os.uk/search/names/v1/find?query=${query}&fq=${types}&key=${apiKey}`
    const response = await axios.get(uri).then((response) => { return response })
    if (response.status === 200) {
      if (response.data && response.data.results) {
        let results = response.data.results
        // Remove fuzzy matches, non-England results but not postcodes whithout spaces
        results = results.filter(result => utils.isGazetteerMatch(query, result.GAZETTEER_ENTRY))
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
