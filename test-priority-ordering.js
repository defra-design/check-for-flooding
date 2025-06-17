/**
 * Test script for flood outlook priority ordering
 */

const Outlook = require('./app/models/outlook')

// Mock risk data with specific values to test priority ordering
const mockRiskData = {
  issued_at: new Date().toISOString(),
  last_modified_at: new Date().toISOString(),
  public_forecast: {
    england_forecast: 'Mock forecast text for testing priority ordering.'
  },
  risk_areas: [
    {
      risk_area_blocks: [
        {
          days: [1],
          polys: [
            {
              id: 1,
              poly_type: 'inland',
              coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
              label_position: [0.5, 0.5]
            }
          ],
          risk_levels: {
            river: [3, 4], // Riverside: 3×4 = 12 points
            surface: [3, 3], // Region: 3×3 = 9 points  
            ground: [3, 3], // Region: 3×3 = 9 points
            coastal: [3, 2] // Coastal: 3×2 = 6 points
          }
        }
      ]
    }
  ]
}

// Mock place data with bounding box
const mockPlace = {
  bbox2k: [-1, -1, 2, 2]
}

console.log('Testing Priority Ordering Logic...')

// Test matrix override for priority testing
const TEST_MATRIX_OVERRIDE = [
  [[3, 4], [3, 2], [3, 3], [3, 3]], // Day 1: Riverside=12, Coastal=6, Surface=9, Ground=9
  [[1, 1], [1, 1], [1, 1], [1, 1]], // Day 2: All low
  [[1, 1], [1, 1], [1, 1], [1, 1]], // Day 3: All low
  [[1, 1], [1, 1], [1, 1], [1, 1]], // Day 4: All low
  [[0, 1], [0, 1], [0, 1], [0, 1]]  // Day 5: All zero
]

// Extract risk score calculation function for testing
function calculateRiskScore (impact, likelihood) {
  return impact * likelihood
}

try {
  const outlook = new Outlook(mockRiskData, mockPlace)

  // Print risk scores for different combinations
  console.log('\nRisk Scores:')
  console.log(`Riverside: Impact=${3}, Likelihood=${4}, Score=${calculateRiskScore(3, 4)}`)
  console.log(`Coastal: Impact=${3}, Likelihood=${2}, Score=${calculateRiskScore(3, 2)}`)
  console.log(`Region: Impact=${3}, Likelihood=${3}, Score=${calculateRiskScore(3, 3)}`)

  // Override the DEV_MATRIX_OVERRIDE with our test values
  global.DEV_MATRIX_OVERRIDE = TEST_MATRIX_OVERRIDE

  // Generate text using our risk matrix
  const outlookInstance = outlook
  
  if (!outlookInstance.regional || !outlookInstance.regional.summary) {
    console.log('❌ No regional outlook generated')
    return
  }
  
  const outputText = outlookInstance.regional.summary

  // Extract sentences to analyze ordering
  console.log('\nGenerated outlook:')
  console.log('='.repeat(50))
  console.log(outputText)
  console.log('='.repeat(50))

  // Split by HTML tags to analyze sentence order
  const plainText = outputText.replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n').trim()
  console.log('\nPlain text version:')
  console.log('-'.repeat(50))
  console.log(plainText)
  console.log('-'.repeat(50))

  // Extract sentences and check order - use more sophisticated sentence splitting
  const sentences = outputText.match(/[^.!?]+[.!?]/g) || []
  const cleanSentences = sentences.map(s => s.replace(/<[^>]*>/g, '').trim()).filter(s => s && s.length > 10)
  console.log('\nSentence order analysis:')
  cleanSentences.forEach((sentence, i) => {
    // Identify the location type
    let locationType = 'unknown'
    if (sentence.includes('across the region')) {
      locationType = 'REGION'
    } else if (sentence.includes('riverside areas')) {
      locationType = 'RIVERSIDE'
    } else if (sentence.includes('coastal areas')) {
      locationType = 'COASTAL'
    }

    // Calculate risk score
    let impact = 3 // Default
    let likelihood = 3 // Default

    if (sentence.includes('significant') || sentence.includes('severe')) {
      impact = 5
    } else if (sentence.includes('substantial')) {
      impact = 4
    }

    if (sentence.includes('expected')) {
      likelihood = 5
    } else if (sentence.includes('likely')) {
      likelihood = 4
    } else if (sentence.includes('possible but not expected')) {
      likelihood = 2
    } else if (sentence.includes('possible')) {
      likelihood = 3
    }

    const riskScore = impact * likelihood

    console.log(`${i + 1}: [${locationType}] Risk=${riskScore} (${impact}×${likelihood}): ${sentence}`)
  })

  // Verify ordering is correct (highest risk first within each day)
  console.log('\nVerifying priority ordering...')
  let orderingCorrect = true
  
  // Split sentences by day groups to check ordering within each day
  const dayGroups = []
  let currentGroup = []
  
  cleanSentences.forEach(sentence => {
    // Check if this sentence seems to be starting a new day
    if ((sentence.includes('Today') || sentence.includes('Tomorrow') || sentence.includes('Monday') || sentence.includes('Tuesday') || sentence.includes('Wednesday') || sentence.includes('Thursday') || sentence.includes('Friday')) && currentGroup.length > 0) {
      dayGroups.push([...currentGroup])
      currentGroup = [sentence]
    } else {
      currentGroup.push(sentence)
    }
  })
  
  if (currentGroup.length > 0) {
    dayGroups.push(currentGroup)
  }
  
  // Check priority ordering within each day group
  dayGroups.forEach((group, dayIndex) => {
    console.log(`\nChecking Day ${dayIndex + 1} ordering:`)
    let previousRiskScore = Infinity
    
    group.forEach((sentence, i) => {
      // Calculate risk score for this sentence
      let impact = 3
      let likelihood = 3

      if (sentence.includes('significant') || sentence.includes('severe')) {
        impact = 5
      } else if (sentence.includes('substantial')) {
        impact = 4
      }

      if (sentence.includes('expected')) {
        likelihood = 5
      } else if (sentence.includes('likely')) {
        likelihood = 4
      } else if (sentence.includes('possible but not expected')) {
        likelihood = 2
      } else if (sentence.includes('possible')) {
        likelihood = 3
      }

      const currentRiskScore = impact * likelihood
      
      // Determine location type
      let locationType = 'unknown'
      if (sentence.includes('across the region')) {
        locationType = 'REGION'
      } else if (sentence.includes('riverside areas')) {
        locationType = 'RIVERSIDE'
      } else if (sentence.includes('coastal areas')) {
        locationType = 'COASTAL'
      }
      
      console.log(`  ${i + 1}: [${locationType}] Risk=${currentRiskScore} (${impact}×${likelihood})`)

      if (currentRiskScore > previousRiskScore) {
        console.log(`  ❌ ERROR: Sentence ${i + 1} has higher risk score (${currentRiskScore}) than previous sentence (${previousRiskScore})`)
        orderingCorrect = false
      }

      previousRiskScore = currentRiskScore
    })
  })

  if (orderingCorrect) {
    console.log('✅ Priority ordering is correct!')
  } else {
    console.log('❌ Priority ordering has issues!')
  }

  console.log('\nTest completed.')

} catch (error) {
  console.error('Error during testing:', error)
  console.error('Stack trace:', error.stack)
}
