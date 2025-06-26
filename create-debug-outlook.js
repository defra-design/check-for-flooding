#!/usr/bin/env node

const fs = require('fs')

// Let's temporarily add some debug logging to the splitComplexData function
function addDebugLogging() {
  const outlookPath = './app/models/outlook.js'
  let content = fs.readFileSync(outlookPath, 'utf8')
  
  // Find the splitComplexData function and add logging
  const originalFunction = `const splitComplexData = (sortedData) => {
  if (!sortedData || sortedData.length === 0) {
    return [sortedData]
  }

  // Calculate total number of likelihood and location combinations
  // Count surface water and groundwater as one (inland areas)
  let totalCombinations = 0
  
  sortedData.forEach(([impactDesc, likelihoodGroups]) => {
    likelihoodGroups.forEach(([likelihood, locations]) => {
      // Count each likelihood-location combination
      // Note: locations already accounts for surface+ground being combined as 'across the region'
      totalCombinations += locations.length
    })
  })

  // AC 5DF-L4: If total combinations <= 3, use first sentence logic only
  if (totalCombinations <= 3) {
    return [sortedData]
  }`

  const debugFunction = `const splitComplexData = (sortedData) => {
  if (!sortedData || sortedData.length === 0) {
    return [sortedData]
  }

  // DEBUG: Log the input data
  console.log('🔍 DEBUG: splitComplexData input:', JSON.stringify(sortedData, null, 2))

  // Calculate total number of likelihood and location combinations
  // Count surface water and groundwater as one (inland areas)
  let totalCombinations = 0
  
  sortedData.forEach(([impactDesc, likelihoodGroups]) => {
    console.log('🔍 DEBUG: Processing impact group:', impactDesc)
    likelihoodGroups.forEach(([likelihood, locations]) => {
      console.log('🔍 DEBUG:   Likelihood group:', likelihood, 'Locations:', locations)
      // Count each likelihood-location combination
      // Note: locations already accounts for surface+ground being combined as 'across the region'
      totalCombinations += locations.length
      console.log('🔍 DEBUG:   Added', locations.length, 'combinations, total now:', totalCombinations)
    })
  })

  console.log('🔍 DEBUG: Final totalCombinations:', totalCombinations)

  // AC 5DF-L4: If total combinations <= 3, use first sentence logic only
  if (totalCombinations <= 3) {
    console.log('🔍 DEBUG: Using single sentence logic (totalCombinations <= 3)')
    return [sortedData]
  } else {
    console.log('🔍 DEBUG: Using split sentence logic (totalCombinations > 3)')
  }`

  const modifiedContent = content.replace(originalFunction, debugFunction)
  fs.writeFileSync('./app/models/outlook-debug.js', modifiedContent)
  
  console.log('Created debug version of outlook.js as outlook-debug.js')
}

addDebugLogging()
