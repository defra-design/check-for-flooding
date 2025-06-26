/**
 * Matrix Builder Tool
 * Helps create custom DEV_MATRIX_OVERRIDE scenarios for testing different text outputs
 */

const TEXT_LABELS = {
  likelihood: ['possible but not expected', 'possible', 'likely', 'expected'],
  impact: [
    'flooding of low-lying land and roads',                              // Impact 1
    'localised property flooding and travel disruption',                 // Impact 2  
    'property flooding and significant travel disruption',               // Impact 3
    'severe or widespread property flooding and travel disruption'       // Impact 4
  ],
  where: ['riverside', 'coastal', 'across the region'],
  source: ['river', 'sea', 'surface water', 'groundwater']
}

console.log('='.repeat(80))
console.log('MATRIX BUILDER TOOL')
console.log('='.repeat(80))

console.log('\nQuick Reference:')
console.log('Impact Levels:')
TEXT_LABELS.impact.forEach((impact, index) => {
  console.log(`  ${index + 1}: ${impact}`)
})

console.log('\nLikelihood Levels:')
TEXT_LABELS.likelihood.forEach((likelihood, index) => {
  console.log(`  ${index + 1}: ${likelihood}`)
})

console.log('\nSources:')
TEXT_LABELS.source.forEach((source, index) => {
  console.log(`  Index ${index}: ${source}`)
})

console.log('\nLocations (after filtering):')
TEXT_LABELS.where.forEach((where, index) => {
  console.log(`  Index ${index}: ${where}`)
})

console.log('\n' + '='.repeat(80))
console.log('SAMPLE SCENARIOS')
console.log('='.repeat(80))

// Scenario 1: Very Low Risk
console.log('\n1. VERY LOW RISK SCENARIO:')
console.log('   All values below filtering threshold (impact < 2 OR likelihood < 2)')
const veryLowRisk = [
  [[1, 1], [1, 1], [1, 1], [1, 1]], // Day 1
  [[1, 1], [1, 1], [1, 1], [1, 1]], // Day 2
  [[1, 1], [1, 1], [1, 1], [1, 1]], // Day 3
  [[1, 1], [1, 1], [1, 1], [1, 1]], // Day 4
  [[1, 1], [1, 1], [1, 1], [1, 1]]  // Day 5
]
console.log('   Matrix:', JSON.stringify(veryLowRisk))
console.log('   Expected: "Today the flood risk is very low."')

// Scenario 2: River Only
console.log('\n2. RIVER FLOODING ONLY:')
console.log('   Only river source active (index 0)')
const riverOnly = [
  [[3, 3], [0, 0], [0, 0], [0, 0]], // Day 1: River flooding likely
  [[2, 2], [0, 0], [0, 0], [0, 0]], // Day 2: River flooding possible
  [[0, 0], [0, 0], [0, 0], [0, 0]], // Day 3: No risk
  [[0, 0], [0, 0], [0, 0], [0, 0]], // Day 4: No risk
  [[0, 0], [0, 0], [0, 0], [0, 0]]  // Day 5: No risk
]
console.log('   Matrix:', JSON.stringify(riverOnly))
console.log('   Expected Day 1: "property flooding and significant travel disruption is likely in riverside areas"')
console.log('   Expected Day 2: "localised property flooding and travel disruption is possible in riverside areas"')

// Scenario 3: Coastal Only  
console.log('\n3. COASTAL FLOODING ONLY:')
console.log('   Only coastal source active (index 1)')
const coastalOnly = [
  [[0, 0], [4, 4], [0, 0], [0, 0]], // Day 1: Severe coastal flooding expected
  [[0, 0], [2, 3], [0, 0], [0, 0]], // Day 2: Minor coastal flooding likely
  [[0, 0], [0, 0], [0, 0], [0, 0]], // Day 3: No risk
  [[0, 0], [0, 0], [0, 0], [0, 0]], // Day 4: No risk
  [[0, 0], [0, 0], [0, 0], [0, 0]]  // Day 5: No risk
]
console.log('   Matrix:', JSON.stringify(coastalOnly))
console.log('   Expected Day 1: "severe or widespread property flooding and travel disruption is expected in coastal areas"')
console.log('   Expected Day 2: "localised property flooding and travel disruption is likely in coastal areas"')

// Scenario 4: Surface Water Only
console.log('\n4. SURFACE WATER FLOODING ONLY:')
console.log('   Only surface water active (index 2), shows as "across the region"')
const surfaceOnly = [
  [[0, 0], [0, 0], [3, 4], [0, 0]], // Day 1: Surface water flooding expected
  [[0, 0], [0, 0], [2, 2], [0, 0]], // Day 2: Minor surface water flooding possible
  [[0, 0], [0, 0], [0, 0], [0, 0]], // Day 3: No risk
  [[0, 0], [0, 0], [0, 0], [0, 0]], // Day 4: No risk
  [[0, 0], [0, 0], [0, 0], [0, 0]]  // Day 5: No risk
]
console.log('   Matrix:', JSON.stringify(surfaceOnly))
console.log('   Expected Day 1: "property flooding and significant travel disruption is expected across the region due to surface water"')
console.log('   Expected Day 2: "localised property flooding and travel disruption is possible across the region due to surface water"')

// Scenario 5: Mixed Sources
console.log('\n5. MIXED SOURCES SCENARIO:')
console.log('   Multiple sources with different risk levels')
const mixedSources = [
  [[3, 2], [2, 3], [4, 2], [0, 0]], // Day 1: River possible, coastal likely, surface possible
  [[2, 4], [3, 3], [2, 2], [3, 2]], // Day 2: All sources active
  [[0, 0], [0, 0], [0, 0], [0, 0]], // Day 3: No risk
  [[0, 0], [0, 0], [0, 0], [0, 0]], // Day 4: No risk
  [[0, 0], [0, 0], [0, 0], [0, 0]]  // Day 5: No risk
]
console.log('   Matrix:', JSON.stringify(mixedSources))
console.log('   Expected Day 1: Dominated by surface water [4,2] = risk score 8')
console.log('   Expected Day 2: Dominated by river [2,4] = risk score 8')

console.log('\n' + '='.repeat(80))
console.log('HOW TO USE:')
console.log('1. Copy one of the scenarios above')
console.log('2. Replace the DEV_MATRIX_OVERRIDE in app/models/outlook.js')
console.log('3. Visit localhost:3000 to see the text output')
console.log('4. Remember: filtering removes cells with impact < 2 OR likelihood < 2')
console.log('='.repeat(80))
