/**
 * Debugging script to specifically test the sentence risk scoring
 */

console.log('Testing sentence risk scoring...')

// Test sentences
const sentences = [
  'Property flooding and significant travel disruption is expected across the region due to river.',
  'In coastal areas, property flooding and significant travel disruption is likely.',
  'Property flooding and significant travel disruption is expected in riverside areas.'
]

// Recreate the functions from outlook.js that calculate risk scores
function getImpactLevelFromSentence (sentence) {
  // Default to middle impact if can't determine
  let impact = 3
  const lowerSentence = sentence.toLowerCase()

  // Check impact level keywords
  if (lowerSentence.includes('significant') || lowerSentence.includes('severe')) {
    impact = 5
  } else if (lowerSentence.includes('substantial')) {
    impact = 4
  } else if (lowerSentence.includes('minor') || lowerSentence.includes('minimal')) {
    impact = 2
  } else if (lowerSentence.includes('negligible')) {
    impact = 1
  }

  return impact
}

function getLikelihoodLevelFromSentence (sentence) {
  // Default to middle likelihood if can't determine
  let likelihood = 3
  const lowerSentence = sentence.toLowerCase()

  // Check likelihood level keywords
  if (lowerSentence.includes('expected')) {
    likelihood = 5
  } else if (lowerSentence.includes('likely')) {
    likelihood = 4
  } else if (lowerSentence.includes('possible')) {
    likelihood = 3
  } else if (lowerSentence.includes('unlikely')) {
    likelihood = 2
  } else if (lowerSentence.includes('very unlikely')) {
    likelihood = 1
  }

  return likelihood
}

// Score and sort sentences
const scoredSentences = sentences.map(sentence => {
  const impact = getImpactLevelFromSentence(sentence)
  const likelihood = getLikelihoodLevelFromSentence(sentence)
  const riskScore = impact * likelihood
  let locationType = 'other'

  // Determine location type
  if (sentence.match(/across the region/i)) {
    locationType = 'REGION'
  } else if (sentence.match(/coastal areas/i) || sentence.match(/in coastal/i)) {
    locationType = 'COASTAL'
  } else if (sentence.match(/riverside areas/i) || sentence.match(/in riverside/i)) {
    locationType = 'RIVERSIDE'
  }

  return {
    sentence,
    impact,
    likelihood,
    riskScore,
    locationType
  }
})

console.log('\nSentence risk scores:')
scoredSentences.forEach(s => {
  console.log(`[${s.locationType}] Impact=${s.impact}, Likelihood=${s.likelihood}, Score=${s.riskScore}: "${s.sentence}"`)
})

// Sort by risk score
const sortedSentences = [...scoredSentences].sort((a, b) => b.riskScore - a.riskScore)

console.log('\nSorted sentences by risk score:')
sortedSentences.forEach((s, i) => {
  console.log(`${i + 1}. [${s.locationType}] Score=${s.riskScore}: "${s.sentence}"`)
})

console.log('\nTest complete!')
