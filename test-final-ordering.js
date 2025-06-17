/**
 * Final test script for flood outlook priority ordering
 * Tests that riverside areas with high risk are ranked above regional statements
 */

const Outlook = require('./app/models/outlook.js')

// Custom risk data that ensures riverside has highest risk score
const mockRiskData = {
  issued_at: new Date().toISOString(),
  last_modified_at: new Date().toISOString(),
  public_forecast: {
    england_forecast: 'Mock forecast text for testing.'
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
            river: [4, 5], // Substantial impact, expected likelihood (20 points) - HIGHEST
            surface: [3, 4], // Significant impact, likely likelihood (12 points)
            ground: [3, 4], // Significant impact, likely likelihood (12 points)
            coastal: [3, 3] // Significant impact, possible likelihood (9 points) - LOWEST
          }
        },
        {
          days: [2, 3, 4, 5],
          polys: [
            {
              id: 2,
              poly_type: 'coastal',
              coordinates: [[[0, 0], [0, 1], [1, 1]]],
              label_position: [0.33, 0.33]
            }
          ],
          risk_levels: {
            river: [2, 2], // Minor impact, possible likelihood
            surface: [3, 4], // Significant impact, likely likelihood
            ground: [3, 4], // Significant impact, likely likelihood
            coastal: [3, 3] // Significant impact, possible likelihood
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

console.log('Testing final priority ordering...\n')

try {
  const outlook = new Outlook(mockRiskData, mockPlace)

  if (outlook.regional && outlook.regional.summary) {
    console.log('Generated regional outlook:')
    console.log('='.repeat(70))
    console.log(outlook.regional.summary)
    console.log('='.repeat(70))

    // Check sentence order
    const text = outlook.regional.summary
    const sentences = text.match(/[^.!?]+[.!?]/g) || []

    console.log('\nSentence analysis:')
    sentences.forEach((sentence, index) => {
      // Calculate approximate risk score based on text cues
      const impact = sentence.includes('substantial') ? 4
        : sentence.includes('significant') ? 3
          : sentence.includes('minor') ? 2 : 3

      const likelihood = sentence.includes('expected') ? 5
        : sentence.includes('likely') ? 4
          : sentence.includes('possible') ? 3 : 3

      const riskScore = impact * likelihood

      // Identify location type
      let locationType = 'unknown'
      if (sentence.includes('across the region')) {
        locationType = 'REGION'
      } else if (sentence.includes('riverside')) {
        locationType = 'RIVERSIDE'
      } else if (sentence.includes('coastal')) {
        locationType = 'COASTAL'
      }

      const cleanSentence = sentence.replace(/<[^>]*>/g, '').trim()
      if (cleanSentence) {
        console.log(`${index + 1}: [${locationType}] Risk=${riskScore} (${impact}×${likelihood}): ${cleanSentence}`)
      }
    })

    // Check for correct ordering
    let correctOrder = true
    let prevRiskScore = 999

    for (let i = 0; i < sentences.length; i++) {
      const s = sentences[i]
      if (!s) continue

      const impact = s.includes('substantial') ? 4
        : s.includes('significant') ? 3
          : s.includes('minor') ? 2 : 3

      const likelihood = s.includes('expected') ? 5
        : s.includes('likely') ? 4
          : s.includes('possible') ? 3 : 3

      const riskScore = impact * likelihood

      if (riskScore > prevRiskScore) {
        correctOrder = false
        break
      }

      prevRiskScore = riskScore
    }

    if (correctOrder) {
      console.log('\n✅ SUCCESS: Sentences are correctly ordered by descending risk score!')

      // Check if riverside appears before region when they have same risk
      const firstRiverside = sentences.findIndex(s => s && s.includes('riverside'))
      const firstRegion = sentences.findIndex(s => s && s.includes('across the region'))

      if (firstRiverside >= 0 && firstRegion >= 0) {
        if (firstRiverside < firstRegion) {
          console.log('✅ Riverside sentence appears before region sentence when risk scores are equal!')
        }
      }
    } else {
      console.log('\n❌ FAILURE: Sentences are NOT ordered by descending risk score!')
    }
  } else {
    console.log('No regional outlook generated (possibly due to date offset)')
  }
} catch (error) {
  console.error('Error testing outlook:', error.message)
  console.error(error.stack)
}

console.log('\nTest completed.')
