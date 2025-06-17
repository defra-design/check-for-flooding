#!/usr/bin/env node

/**
 * Debug script to understand the grouping logic
 */

const Outlook = require('./app/models/outlook')

// Mock data with specific risk levels for testing grouping
const mockRiskData = {
  issued_at: new Date().toISOString(),
  last_modified_at: new Date().toISOString(),
  public_forecast: {
    england_forecast: 'Test forecast for grouping logic.'
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
            river: [3, 4],   // Impact 3, Likelihood 4 = "likely" (riverside)
            surface: [3, 4], // Impact 3, Likelihood 4 = "likely" (region)
            ground: [3, 4],  // Impact 3, Likelihood 4 = "likely" (region)
            coastal: [2, 3]  // Impact 2, Likelihood 3 = "possible" (coastal)
          }
        }
      ]
    }
  ]
}

const mockPlace = {
  bbox2k: [-1, -1, 2, 2]
}

console.log('Testing grouping logic with same impact/likelihood...')

try {
  const outlook = new Outlook(mockRiskData, mockPlace)
  
  if (outlook.regional && outlook.regional.summary) {
    console.log('\nGenerated outlook:')
    console.log('='.repeat(60))
    console.log(outlook.regional.summary)
    console.log('='.repeat(60))
    
    const text = outlook.regional.summary.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    console.log('\nPlain text:')
    console.log(text)
    
    // Check if riverside and region are grouped together when they have same risk levels
    if (text.includes('in riverside areas and across the region')) {
      console.log('\n✅ Correct: Riverside and region are grouped together!')
    } else {
      console.log('\n❌ Issue: Riverside and region should be grouped together when they have same risk levels')
    }
  } else {
    console.log('❌ No regional outlook generated')
  }
  
} catch (error) {
  console.error('❌ Error:', error.message)
}
