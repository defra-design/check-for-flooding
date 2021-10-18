const axios = require('axios')
// const apiKey = process.env.OS_API_KEY
const apiKey = process.env.BING_API_KEY
const utils = require('../utils')

module.exports = {

  // Return a single result - used for resolving routes
  getLocationBySlug: async (slug) => {
    const query = slug.replace(/-/g, ' ')
    const types = ['postcode', 'hamlet', 'village', 'town', 'city', 'other_settlement'].map(i => `local_type:${i}`).join(' ')
    const uri = `https://api.os.uk/search/names/v1/find?query=${query}&fq=${types}&key=${apiKey}`
    const response = await axios.get(uri).then((response) => { return response })
    if (response.status === 200) {
      if (response.data.header.totalresults > 0) {
        let results = response.data.results
        results = removeDuplicates(results)
        results = setIsSimilar(results)
        results = filterSlug(slug, results)
        if (results.length) {
          // We have a valid result, select first
          response.data.result = results[0].GAZETTEER_ENTRY
        }
        delete response.data.results
      }
    }
    return response
  },

  // Return a single result - used for get requests
  getLocationByQuery: async (query) => {
    query = encodeURI(query)
    const types = ['postcode', 'hamlet', 'village', 'town', 'city', 'other_settlement'].map(i => `local_type:${i}`).join(' ')
    const uri = `https://api.os.uk/search/names/v1/find?query=${query}&fq=${types}&key=${apiKey}`
    const response = await axios.get(uri).then((response) => { return response })
    if (response.status === 200) {
      if (response.data.header.totalresults > 0) {
        let results = response.data.results
        results = removeDuplicates(results)
        results = setIsSimilar(results)
        results = filterQuery(query, results)
        if (results.length) {
          // We have a valid result
          response.data.result = results[0].GAZETTEER_ENTRY
        }
        delete response.data.results
      }
    }
    return response
  },

  // Return multiple results - used for post requests
  getLocationsByQuery: async (query) => {
    query = encodeURI(query)
    // const types = ['postcode', 'hamlet', 'village', 'town', 'city', 'other_settlement'].map(i => `local_type:${i}`).join(' ')
    // const uri = `https://api.os.uk/search/names/v1/find?query=${query}&fq=${types}&key=${apiKey}`
    const uri = `https://dev.virtualearth.net/REST/v1/Locations?query=${query},UK&userRegion=GB&include=ciso2&c=en-GB&maxResults=5&userIP=127.0.0.1&key=${apiKey}&includeEntityTypes=PopulatedPlace,AdminDivision2`
    const response = await axios.get(uri).then((response) => { return response })
    // if (response.status === 200) {
    //   if (response.data && response.data.results) {
    //     let results = response.data.results
    //     results = removeDuplicates(results)
    //     results = setIsSimilar(results)
    //     results = filterQuery(query, results)
    //     // Replace results with filtered set
    //     response.data.results = results
    //   }
    // }
    if (response.status === 200) {
      if (response.data && response.data.resourceSets) {
        // let results = response.data.resourceSets.results[0].resources
        // results = removeDuplicates(results)
        // results = setIsSimilar(results)
        // results = filterQuery(query, results)
        // Replace results with filtered set
        response.data.results = response.data.resourceSets[0].resources
      }
    }
    return response
  }
}

// Remove duplicates (OS API bug?) eg: 'Newcastle upon Tyne'
const removeDuplicates = (results) => {
  results = Array.from(new Map(results.map(result => [result.GAZETTEER_ENTRY.ID, result])).values())
  return results
}

// Flag places that share name, type and qaulfier - eg. 'Henley, Wiltshire'
const setIsSimilar = (results) => {
  const places = Object.create(null)
  results.forEach(result => {
    const key = ['NAME1', 'LOCAL_TYPE', 'COUNTY_UNITARY', 'DISTRICT_BOROUGH'].map(k => result.GAZETTEER_ENTRY[k]).join('|')
    if (places[key]) {
      result.GAZETTEER_ENTRY.IS_SIMILAR = true
      const original = results.find(o => o.GAZETTEER_ENTRY.ID === places[key])
      original.GAZETTEER_ENTRY.IS_SIMILAR = true
    } else {
      places[key] = result.GAZETTEER_ENTRY.ID
    }
  })
  return results
}

// Remove places outside of England or that don't match slug
const filterSlug = (slug, results) => {
  results = results.filter(result => {
    const isSlugMatch = slug === utils.getSlugFromGazetteerEntry(result.GAZETTEER_ENTRY)
    const isEngland = result.GAZETTEER_ENTRY.COUNTRY === 'England'
    return isSlugMatch && isEngland
  })
  return results
}

// Remove places outside of England or that don't match query (postcode space optional)
const filterQuery = (query, results) => {
  results = results.filter(result => {
    query = decodeURI(query)
    query = query.toLowerCase().replace(/\s+|\(|\)|,/g, '')
    const gazetteerEntry = result.GAZETTEER_ENTRY
    const name1 = gazetteerEntry.NAME1.toLowerCase().replace(/\s+/g, '')
    const name2 = gazetteerEntry.NAME2 ? gazetteerEntry.NAME2.toLowerCase().replace(/\s+/g, '') : ''
    const id = gazetteerEntry.ID.toLowerCase()
    const country = gazetteerEntry.COUNTRY
    const countyUnity = gazetteerEntry.COUNTY_UNITARY || ''
    const districtBorough = gazetteerEntry.DISTRICT_BOROUGH || ''
    const postCodeDistrict = gazetteerEntry.POSTCODE_DISTRICT || ''
    const qaulifiedName1 = `${name1}${(countyUnity || districtBorough).replace(/\s+/g, '').toLowerCase()}`
    const postcodeQaulifiedName1 = `${qaulifiedName1}${postCodeDistrict.toLowerCase()}`
    const isEngland = country === 'England'
    const isNameMatch = [name1, name2].some(e => e.includes(query))
    const isQaulifierMatch = [id, qaulifiedName1, postcodeQaulifiedName1].some(e => e === query)
    return isEngland && (isNameMatch || isQaulifierMatch)
  })
  return results
}
