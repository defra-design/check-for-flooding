const axios = require('axios')
const apiKey = process.env.OS_NAMES_KEY

module.exports = {
  getLocation: async (query) => {
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
        // Remove duplicates (OS API bug?)
        results = Array.from(new Map(results.map(result => [result.GAZETTEER_ENTRY.ID, result])).values())
        // Replace results with filtered set
        response.data.results = results
      }
    }
    return response
  }
}
