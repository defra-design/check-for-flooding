#!/usr/bin/env node

const Outlook = require('./app/models/outlook')

// Mock risk data - complete structure
const mockRiskData = {
  last_modified_at: new Date().toISOString(),
  issued_at: new Date().toISOString(),
  public_forecast: {
    england_forecast: 'Test forecast text for England.'
  },
  risk_areas: []
}

// Mock place data
const mockPlace = {
  centroid: { lat: 52.0, lon: -1.0 },
  bounding_box: { min_lat: 51.9, min_lon: -1.1, max_lat: 52.1, max_lon: -0.9 },
  bbox2k: [-1.1, 51.9, -0.9, 52.1] // [min_lon, min_lat, max_lon, max_lat]
}

function testCombinationCounting() {
  console.log('=== Analyzing Combination Counting Logic ===\n')
  
  // Set environment to use DEV_MATRIX_OVERRIDE
  process.env.USE_DEV_MATRIX = 'true'
  
  console.log('Day 1 DEV_MATRIX_OVERRIDE:')
  console.log('River: [1,3] - impact=1, likelihood=3')
  console.log('Coastal: [2,4] - impact=2, likelihood=4')
  console.log('Surface: [3,3] - impact=3, likelihood=3')
  console.log('Groundwater: [4,2] - impact=4, likelihood=2')
  console.log()
  
  console.log('Filtering logic: impact >= 2 AND likelihood >= 2')
  console.log('River: [1,3] - FILTERED OUT (impact=1 < 2)')
  console.log('Coastal: [2,4] - VALID (impact=2 >= 2, likelihood=4 >= 2)')
  console.log('Surface: [3,3] - VALID (impact=3 >= 2, likelihood=3 >= 2)')
  console.log('Groundwater: [4,2] - VALID (impact=4 >= 2, likelihood=2 >= 2)')
  console.log()
  
  console.log('Expected grouping for Day 1:')
  console.log('- Coastal: likelihood=4 (expected), impact=2 (localised)')
  console.log('- Surface+Groundwater: combined as "across the region", max likelihood=3 (likely), max impact=4 (severe or widespread)')
  console.log()
  
  console.log('Expected combinations count:')
  console.log('1. Coastal areas (likelihood=4, impact=2)')
  console.log('2. Across the region (likelihood=3, impact=4)')
  console.log('Total: 2 combinations')
  console.log()
  
  // Generate the actual outlook
  const outlook = new Outlook(mockRiskData, mockPlace)
  
  console.log('=== Actual Output ===')
  console.log('Regional text:', JSON.stringify(outlook.regional, null, 2))
  
  if (outlook.regional && outlook.regional.summary) {
    const todayMatch = outlook.regional.summary.match(/<h3[^>]*>Today<\/h3><p>([^<]*)<\/p>/)
    if (todayMatch) {
      const todayText = todayMatch[1]
      console.log('\nDay 1 (Today) text:', todayText)
      
      const sentences = todayText.split('. ').filter(s => s.trim())
      console.log(`Number of sentences in Day 1: ${sentences.length}`)
      
      if (sentences.length > 1) {
        console.log('✓ Day 1 text is split (5DF-L5 applied)')
        console.log('\nThis means the combination count was > 3, not <= 3')
      } else {
        console.log('✗ Day 1 text is not split (5DF-L5 not applied)')
        console.log('\nThis means the combination count was <= 3')
      }
    }
  }
}

testCombinationCounting()
