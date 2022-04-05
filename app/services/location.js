const axios = require('axios')
// const apiKey = process.env.OS_API_KEY
const apiKey = process.env.BING_API_KEY
const utils = require('../utils')

module.exports = {

  // Return a single result - used for resolving routes
  getLocationBySlug: async (slug) => {
    slug = slug.replace(/-/g, ' ')
    const uri = `https://dev.virtualearth.net/REST/v1/Locations?query=${encodeURI(slug)},UK&userRegion=GB&include=ciso2&c=en-GB&maxResults=1&userIP=127.0.0.1&key=${apiKey}&includeEntityTypes=PopulatedPlace,AdminDivision2`
    const response = await axios.get(uri).then((response) => { return response })
    if (response.status === 200) {
      if (response.data && response.data.resourceSets) {
        let results = response.data.resourceSets[0].resources
        // Remove results where the name doesn't match the slug
        results = results.filter(result => utils.getSlug(utils.getNameFromGazetteerEntry(result)) === utils.getSlug(slug))
        // Remove places outside of England
        results = results.filter(result => result.address.adminDistrict === 'England')
        // Remove medium and low confidence results
        results = results.filter(result => result.confidence === 'High')
        response.data.results = results
        if (results.length) {
          // We have a valid result, select first
          response.data.result = results[0]
        }
        delete response.data.results
      }
    }
    return response
  },

  // Return a single result - used for filtering lists
  getLocationByQuery: async (query) => {
    const uri = `https://dev.virtualearth.net/REST/v1/Locations?query=${encodeURI(query)},UK&userRegion=GB&include=ciso2&c=en-GB&maxResults=1&userIP=127.0.0.1&key=${apiKey}&includeEntityTypes=PopulatedPlace,Postcode1,Postcode2,Postcode3,AdminDivision2`
    const response = await axios.get(uri).then((response) => { return response })
    if (response.status === 200) {
      if (response.data && response.data.resourceSets) {
        let results = response.data.resourceSets[0].resources
        // Remove places outside of England
        results = results.filter(result => result.address.adminDistrict === 'England')
        // Remove medium and low confidence results
        results = results.filter(result => result.confidence === 'High')
        response.data.results = results
        if (results.length) {
          // We have a valid result, select first
          response.data.result = results[0]
        }
        delete response.data.results
      }
    }
    return response
  },

  getLocationByLatLon: async (lat, lon) => {
    const uri = `http://dev.virtualearth.net/REST/v1/Locations/${lat},${lon}?includeEntityTypes=PopulatedPlace,AdminDivision2&key=${apiKey}`
    const response = await axios.get(uri).then((response) => { return response })
    if (response.status === 200) {
      if (response.data && response.data.resourceSets) {
        let results = response.data.resourceSets[0].resources
        // Remove places outside of England
        results = results.filter(result => result.address.adminDistrict === 'England')
        // Remove medium and low confidence results
        results = results.filter(result => result.confidence === 'High')
        response.data.results = results
        if (results.length) {
          // We have a valid result, select first
          response.data.result = results[0]
        }
        delete response.data.results
      }
    }
    return response
  },

  // Return multiple results
  getLocationsByQuery: async (query) => {
    const uri = `https://dev.virtualearth.net/REST/v1/Locations?query=${encodeURI(query)},UK&userRegion=GB&include=ciso2&c=en-GB&maxResults=5&userIP=127.0.0.1&key=${apiKey}&includeEntityTypes=PopulatedPlace,Postcode1,Postcode2,Postcode3,AdminDivision2`
    const response = await axios.get(uri).then((response) => { return response })
    if (response.status === 200) {
      if (response.data && response.data.resourceSets) {
        let results = response.data.resourceSets[0].resources
        // Remove places outside of England
        results = results.filter(result => result.address.adminDistrict === 'England')
        // Remove low confidence results
        results = results.filter(result => result.confidence === 'High')
        // Remove duplication within the name
        results = results.map(result => {
          if (result.address.adminDistrict2 === result.address.locality) {
            result.name = result.address.locality
          }
          return result
        })
        // Remove duplicates
        results = Array.from(new Map(results.map(result => [result.name, result])).values())
        response.data.results = results
      }
    }
    return response
  }
}
