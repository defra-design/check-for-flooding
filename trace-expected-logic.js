/**
 * Trace the exact logic flow for the current matrix
 * According to user's analysis of what SHOULD happen
 */

const DEV_MATRIX_OVERRIDE = [
  [[1, 3], [2, 4], [3, 3], [4, 2]], // Day 1
  [[3, 3], [3, 3], [3, 3], [3, 3]], // Day 2-5
  [[3, 3], [3, 3], [3, 3], [3, 3]],
  [[3, 3], [3, 3], [3, 3], [3, 3]],
  [[3, 3], [3, 3], [3, 3], [3, 3]]
]

const TEXT_LABELS = {
  likelihood: ['possible but not expected', 'possible', 'likely', 'expected'],
  impact: [
    'flooding of low-lying land and roads',                              // Impact 1
    'localised property flooding and travel disruption',                 // Impact 2  
    'property flooding and significant travel disruption',               // Impact 3
    'severe or widespread property flooding and travel disruption'       // Impact 4
  ]
}

console.log('🔍 TRACING USER\'S EXPECTED LOGIC')
console.log('=' * 60)

console.log('\n📊 Day 1 Matrix Analysis:')
const day1 = DEV_MATRIX_OVERRIDE[0]
console.log('Raw matrix:', JSON.stringify(day1))

// Apply filtering (impact >= 2 AND likelihood >= 2)
console.log('\n🔬 After Filtering (impact >= 2 AND likelihood >= 2):')
const filteredDay1 = day1.map(([impact, likelihood]) => {
  const passes = impact >= 2 && likelihood >= 2
  console.log(`[${impact},${likelihood}] → ${passes ? 'PASSES' : 'FILTERED OUT'}`)
  return passes ? [impact, likelihood] : [0, 0]
})

console.log('Filtered result:', JSON.stringify(filteredDay1))

console.log('\n✅ Valid Entries (L7, L8):')
const validEntries = []
filteredDay1.forEach(([impact, likelihood], index) => {
  if (impact > 0 && likelihood > 0) {
    const sources = ['River', 'Coastal', 'Surface', 'Ground']
    const impactText = TEXT_LABELS.impact[impact - 1]
    const likelihoodText = TEXT_LABELS.likelihood[likelihood - 1]
    console.log(`${sources[index]}: [${impact},${likelihood}] → ${impactText} + ${likelihoodText}`)
    validEntries.push({
      source: sources[index],
      impact,
      likelihood,
      impactText,
      likelihoodText,
      riskScore: impact * likelihood
    })
  }
})

console.log('\n🎯 5DF-L5 Split Rule Analysis:')
console.log(`Total valid entries: ${validEntries.length}`)
if (validEntries.length > 3) {
  console.log('✂️ 5DF-L5 APPLIES: >3 entries, so split into groups')
  
  // Sort by likelihood (highest first)
  const sortedByLikelihood = [...validEntries].sort((a, b) => b.likelihood - a.likelihood)
  console.log('\nSorted by likelihood (highest first):')
  sortedByLikelihood.forEach(entry => {
    console.log(`${entry.source}: likelihood ${entry.likelihood} (${entry.likelihoodText})`)
  })
  
  const highestLikelihood = sortedByLikelihood[0]
  const remainingEntries = sortedByLikelihood.slice(1)
  
  console.log('\n📝 Group 1 (First Sentence - Highest Likelihood):')
  console.log(`${highestLikelihood.source}: [${highestLikelihood.impact},${highestLikelihood.likelihood}]`)
  console.log(`Impact: ${highestLikelihood.impactText}`)
  console.log(`Likelihood: ${highestLikelihood.likelihoodText}`)
  
  console.log('\n📝 Group 2 (Second Sentence - Remaining):')
  remainingEntries.forEach(entry => {
    console.log(`${entry.source}: [${entry.impact},${entry.likelihood}] → ${entry.impactText} + ${entry.likelihoodText}`)
  })
  
  console.log('\n🎯 EXPECTED OUTPUT:')
  
  // First sentence (coastal)
  if (highestLikelihood.source === 'Coastal') {
    console.log('First Sentence (Coastal):')
    console.log(`"In coastal areas, ${highestLikelihood.impactText} ${highestLikelihood.likelihoodText}."`)
  }
  
  // Second sentence (surface + ground)
  const maxImpactInGroup2 = Math.max(...remainingEntries.map(e => e.impact))
  const maxImpactText = TEXT_LABELS.impact[maxImpactInGroup2 - 1]
  
  // Find dominant likelihood in group 2
  const dominantLikelihood = Math.max(...remainingEntries.map(e => e.likelihood))
  const dominantLikelihoodText = TEXT_LABELS.likelihood[dominantLikelihood - 1]
  
  console.log('\nSecond Sentence (Surface + Ground):')
  console.log(`"${maxImpactText} ${dominantLikelihoodText} across the region due to surface water and groundwater flooding."`)
  
} else {
  console.log('5DF-L5 does NOT apply: ≤3 entries')
}

console.log('\n' + '=' * 60)
console.log('🔴 PROBLEM ANALYSIS:')
console.log('If the current output doesn\'t match this, then there\'s likely an issue with:')
console.log('1. The 5DF-L5 split logic implementation')
console.log('2. The sentence ordering logic')
console.log('3. The impact/likelihood text selection')
console.log('=' * 60)
