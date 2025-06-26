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

function testDays2to5() {
  console.log('=== Analyzing Days 2-5 Issue ===\n')
  
  // Set environment to use DEV_MATRIX_OVERRIDE
  process.env.USE_DEV_MATRIX = 'true'
  
  console.log('Days 2-5 matrix: [[3,3], [3,3], [3,3], [3,3]]')
  console.log('All sources: impact=3, likelihood=3')
  console.log('After filtering (all valid):')
  console.log('- River [3,3] → riverside')
  console.log('- Coastal [3,3] → coastal') 
  console.log('- Surface [3,3] + Ground [3,3] → max(3,3), max(3,3) = [3,3] → across the region')
  console.log()
  
  console.log('Expected behavior:')
  console.log('Since all have the same impact/likelihood, they should be grouped together')
  console.log('But NOT as "riverside areas and coastal areas and across the region"')
  console.log('Should be separate sentences or better grouping')
  console.log()
  
  const outlook = new Outlook(mockRiskData, mockPlace)
  
  console.log('=== Actual Output ===')
  if (outlook.regional && outlook.regional.summary) {
    const text = outlook.regional.summary
    console.log('Full HTML:', text)
    
    // Extract Days 2-5 text
    const days2to5Match = text.match(/<h3[^>]*>Tomorrow through to [^<]*<\/h3><p>([^<]*)<\/p>/)
    if (days2to5Match) {
      const days2to5Text = days2to5Match[1]
      console.log('\nDays 2-5 text:', days2to5Text)
      
      console.log('\n=== Problem Analysis ===')
      if (days2to5Text.includes('riverside areas and coastal areas and across the region')) {
        console.log('❌ PROBLEM: All locations are listed together in one sentence')
        console.log('This suggests the grouping logic is not working correctly')
        console.log('When all sources have the same impact/likelihood, they should not all be listed together')
      }
    }
  }
}

testDays2to5()
