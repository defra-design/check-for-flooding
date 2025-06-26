/**
 * Analyze the exact text output from DEV_MATRIX_OVERRIDE
 * This script shows what text is generated from the current matrix values
 */

// Constants from outlook.js
const TEXT_LABELS = {
  day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  likelihood: ['possible but not expected', 'possible', 'likely', 'expected'],
  impact: [
    'flooding of low-lying land and roads',
    'localised property flooding and travel disruption', 
    'property flooding and significant travel disruption',
    'severe or widespread property flooding and travel disruption'
  ],
  where: ['riverside', 'coastal', 'across the region'],
  source: ['river', 'sea', 'surface water', 'groundwater']
}

// Current DEV_MATRIX_OVERRIDE from outlook.js
const DEV_MATRIX_OVERRIDE = [
  // [impact, likelihood] for [river, coastal, surface, groundwater]
  [[1, 3], [2, 4], [3, 3], [4, 2]], // Day 1: Original problematic case
  [[3, 3], [3, 3], [3, 3], [3, 3]], // Day 2
  [[3, 3], [3, 3], [3, 3], [3, 3]], // Day 3
  [[3, 3], [3, 3], [3, 3], [3, 3]], // Day 4
  [[3, 3], [3, 3], [3, 3], [3, 3]]  // Day 5
]

// Filtering logic: only show cells with impact >= 2 AND likelihood >= 2
const applyRiskFiltering = (sourceData) => {
  const [impact, likelihood] = sourceData
  const isGreenCellToRemove = (impact < 2 || likelihood < 2)
  return isGreenCellToRemove ? [0, 0] : sourceData
}

// Extract location info (combining surface + ground as inland)
const extractLocationInfo = (dayMatrix) => {
  const filteredRiver = applyRiskFiltering(dayMatrix[0])
  const filteredCoastal = applyRiskFiltering(dayMatrix[1]) 
  const filteredSurface = applyRiskFiltering(dayMatrix[2])
  const filteredGround = applyRiskFiltering(dayMatrix[3])

  return [
    filteredRiver, // river (riverside)
    filteredCoastal, // coastal
    [
      Math.max(filteredSurface[0], filteredGround[0]), // surface + ground (inland areas)
      Math.max(filteredSurface[1], filteredGround[1])
    ]
  ]
}

console.log('='.repeat(80))
console.log('ANALYSIS: Matrix Values → Text Output Mapping')
console.log('='.repeat(80))

console.log('\n1. Current DEV_MATRIX_OVERRIDE:')
DEV_MATRIX_OVERRIDE.forEach((day, dayIndex) => {
  console.log(`   Day ${dayIndex + 1}: ${JSON.stringify(day)}`)
})

console.log('\n2. After Filtering (impact >= 2 AND likelihood >= 2):')
DEV_MATRIX_OVERRIDE.forEach((day, dayIndex) => {
  const filtered = day.map(source => applyRiskFiltering(source))
  console.log(`   Day ${dayIndex + 1}: ${JSON.stringify(filtered)}`)
})

console.log('\n3. Location Info (after combining surface+ground as inland):')
DEV_MATRIX_OVERRIDE.forEach((day, dayIndex) => {
  const locationInfo = extractLocationInfo(day)
  console.log(`   Day ${dayIndex + 1}: ${JSON.stringify(locationInfo)}`)
  console.log(`      riverside: [${locationInfo[0][0]}, ${locationInfo[0][1]}]`)
  console.log(`      coastal:   [${locationInfo[1][0]}, ${locationInfo[1][1]}]`)
  console.log(`      inland:    [${locationInfo[2][0]}, ${locationInfo[2][1]}]`)
})

console.log('\n4. Text Mapping for Each Location:')
DEV_MATRIX_OVERRIDE.forEach((day, dayIndex) => {
  console.log(`\n   === DAY ${dayIndex + 1} ===`)
  const locationInfo = extractLocationInfo(day)
  
  locationInfo.forEach((location, locIndex) => {
    const [impact, likelihood] = location
    const locationName = TEXT_LABELS.where[locIndex]
    
    if (impact > 0 && likelihood > 0) {
      const impactText = TEXT_LABELS.impact[impact - 1]
      const likelihoodText = TEXT_LABELS.likelihood[likelihood - 1]
      console.log(`   ${locationName}: "${impactText}" is "${likelihoodText}"`)
      console.log(`      → Impact ${impact} (${impactText})`)
      console.log(`      → Likelihood ${likelihood} (${likelihoodText})`)
      console.log(`      → Risk Score: ${impact * likelihood}`)
    } else {
      console.log(`   ${locationName}: FILTERED OUT (impact=${impact}, likelihood=${likelihood})`)
    }
  })
})

console.log('\n5. Expected Generated Text Structure:')
console.log('   Based on the matrix values above, the text should contain phrases like:')

DEV_MATRIX_OVERRIDE.forEach((day, dayIndex) => {
  console.log(`\n   Day ${dayIndex + 1}:`)
  const locationInfo = extractLocationInfo(day)
  
  // Find max risk for this day
  let maxRisk = 0
  let maxImpact = 0
  let maxLikelihood = 0
  const activeLocations = []
  
  locationInfo.forEach((location, locIndex) => {
    const [impact, likelihood] = location
    if (impact > 0 && likelihood > 0) {
      const riskScore = impact * likelihood
      if (riskScore > maxRisk) {
        maxRisk = riskScore
        maxImpact = impact
        maxLikelihood = likelihood
      }
      activeLocations.push({
        name: TEXT_LABELS.where[locIndex],
        impact,
        likelihood,
        riskScore
      })
    }
  })
  
  if (activeLocations.length > 0) {
    console.log(`   Primary phrase should include:`)
    console.log(`   - Impact: "${TEXT_LABELS.impact[maxImpact - 1]}"`)
    console.log(`   - Likelihood: "${TEXT_LABELS.likelihood[maxLikelihood - 1]}"`)
    console.log(`   - Locations: ${activeLocations.map(loc => loc.name).join(', ')}`)
    console.log(`   Example: "${TEXT_LABELS.impact[maxImpact - 1]} is ${TEXT_LABELS.likelihood[maxLikelihood - 1]} in ${activeLocations.map(loc => loc.name + ' areas').join(' and ')}"`)
  } else {
    console.log(`   No risk (all filtered out)`)
  }
})

console.log('\n' + '='.repeat(80))
console.log('SUMMARY: The current matrix should generate text about:')
console.log('- Day 1: "property flooding and significant travel disruption is likely" in coastal areas')
console.log('- Days 2-5: "property flooding and significant travel disruption is likely" everywhere')
console.log('='.repeat(80))
