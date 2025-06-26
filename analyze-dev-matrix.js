#!/usr/bin/env node

/**
 * Analysis of DEV_MATRIX_OVERRIDE data to understand what it should show
 */

// Current DEV_MATRIX_OVERRIDE data
const DEV_MATRIX_OVERRIDE = [
  // [impact, likelihood] for [river, coastal, surface, groundwater]
  [[1, 3], [2, 4], [3, 3], [4, 2]], // Day 1
  [[3, 3], [3, 3], [3, 3], [3, 3]], // Day 2
  [[3, 3], [3, 3], [3, 3], [3, 3]], // Day 3
  [[3, 3], [3, 3], [3, 3], [3, 3]], // Day 4
  [[3, 3], [3, 3], [3, 3], [3, 3]]  // Day 5
]

// Risk filtering logic: only show cells with impact >= 2 AND likelihood >= 2
const applyRiskFiltering = (sourceData) => {
  const [impact, likelihood] = sourceData
  // Only show cells with impact >= 2 AND likelihood >= 2
  const isGreenCellToRemove = (
    impact < 2 || likelihood < 2
  )
  return isGreenCellToRemove ? [0, 0] : sourceData
}

// Text labels
const TEXT_LABELS = {
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

console.log('=== ANALYSIS OF DEV_MATRIX_OVERRIDE ===\n')

DEV_MATRIX_OVERRIDE.forEach((dayMatrix, dayIndex) => {
  console.log(`Day ${dayIndex + 1}:`)
  console.log('Raw data:', dayMatrix)
  
  // Apply filtering to each source
  const filteredMatrix = dayMatrix.map(sourceData => applyRiskFiltering(sourceData))
  console.log('After filtering (impact>=2 AND likelihood>=2):', filteredMatrix)
  
  // Extract location info (how the code processes it)
  const filteredRiver = applyRiskFiltering(dayMatrix[0])     // [1,3] -> [0,0] (filtered out)
  const filteredCoastal = applyRiskFiltering(dayMatrix[1])   // [2,4] -> [2,4] (kept)
  const filteredSurface = applyRiskFiltering(dayMatrix[2])   // [3,3] -> [3,3] (kept)
  const filteredGround = applyRiskFiltering(dayMatrix[3])    // [4,2] -> [0,0] (filtered out)
  
  const locationInfo = [
    filteredRiver, // river (riverside)
    filteredCoastal, // coastal
    [
      Math.max(filteredSurface[0], filteredGround[0]), // surface + ground (inland areas)
      Math.max(filteredSurface[1], filteredGround[1])
    ]
  ]
  
  console.log('Location info [riverside, coastal, inland]:', locationInfo)
  
  // Interpret what this should mean
  console.log('What this should show:')
  
  // Riverside
  if (locationInfo[0][0] > 0) {
    const impact = TEXT_LABELS.impact[locationInfo[0][0] - 1]
    const likelihood = TEXT_LABELS.likelihood[locationInfo[0][1] - 1]
    console.log(`  - Riverside: ${impact} is ${likelihood}`)
  } else {
    console.log('  - Riverside: No significant risk (filtered out)')
  }
  
  // Coastal
  if (locationInfo[1][0] > 0) {
    const impact = TEXT_LABELS.impact[locationInfo[1][0] - 1]
    const likelihood = TEXT_LABELS.likelihood[locationInfo[1][1] - 1]
    console.log(`  - Coastal: ${impact} is ${likelihood}`)
  } else {
    console.log('  - Coastal: No significant risk (filtered out)')
  }
  
  // Inland (surface + ground combined)
  if (locationInfo[2][0] > 0) {
    const impact = TEXT_LABELS.impact[locationInfo[2][0] - 1]
    const likelihood = TEXT_LABELS.likelihood[locationInfo[2][1] - 1]
    console.log(`  - Inland: ${impact} is ${likelihood}`)
  } else {
    console.log('  - Inland: No significant risk (filtered out)')
  }
  
  console.log('')
})

console.log('=== WHAT THE MATRIX DATA ACTUALLY MEANS ===\n')

console.log('Day 1 raw data:')
console.log('  River: [1,3] = Impact 1 (flooding of low-lying land), Likelihood 3 (likely)')
console.log('  Coastal: [2,4] = Impact 2 (localised property flooding), Likelihood 4 (expected)')
console.log('  Surface: [3,3] = Impact 3 (property flooding), Likelihood 3 (likely)')
console.log('  Ground: [4,2] = Impact 4 (severe flooding), Likelihood 2 (possible)')
console.log('')

console.log('Day 1 after filtering (impact>=2 AND likelihood>=2):')
console.log('  River: [1,3] -> [0,0] (FILTERED OUT - impact too low)')
console.log('  Coastal: [2,4] -> [2,4] (KEPT)')
console.log('  Surface: [3,3] -> [3,3] (KEPT)')
console.log('  Ground: [4,2] -> [0,0] (FILTERED OUT - likelihood too low)')
console.log('')

console.log('Expected Day 1 output should be:')
console.log('  - Coastal areas: localised property flooding and travel disruption is expected')
console.log('  - Across the region: property flooding and significant travel disruption is likely (from surface water)')
console.log('  - NO riverside flooding (river was filtered out)')
console.log('  - NO groundwater flooding (groundwater was filtered out)')
console.log('')

console.log('Days 2-5 all have [3,3] for all sources:')
console.log('  All sources: Impact 3 (property flooding), Likelihood 3 (likely)')
console.log('  Expected output: property flooding and significant travel disruption is likely in riverside areas, coastal areas, and across the region')
