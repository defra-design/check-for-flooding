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
        // We have at least one potential result
        const gazetteerEntry = response.data.results[0].GAZETTEER_ENTRY
        if (gazetteerEntry.COUNTRY === 'England' && query === utils.getSlugFromGazetteerEntry(gazetteerEntry)) {
          // We have a valid region
          response.data.result = gazetteerEntry
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
        // Remove non-England results
        results = response.data.results.filter(result => result.GAZETTEER_ENTRY.COUNTRY === 'England')
        // Remove fuzzy matches
        results = results.filter(result => result.GAZETTEER_ENTRY.NAME1.toLowerCase().includes(query.toLowerCase()))
        // Remove 'very similar' places - eg. Charlton, Wiltshire
        const seen = Object.create(null)
        results = results.filter(result => {
          const key = ['NAME1', 'LOCAL_TYPE', 'COUNTY_UNITARY', 'DISTRICT_BOROUGH'].map(k => result.GAZETTEER_ENTRY[k]).join('|')
          if (!seen[key]) {
            seen[key] = true
            return true
          }
        })
        // Remove duplicates (OS API bug?)
        results = Array.from(new Map(results.map(result => [result.GAZETTEER_ENTRY.ID, result])).values())
        // Replace results with filtered set
        response.data.results = results
      }
    }
    return response
  }
}
