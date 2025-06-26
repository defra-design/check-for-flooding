#!/usr/bin/env node

const Outlook = require('./app/models/outlook-debug')

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

function testWithDebugLogging() {
  console.log('=== Testing with Debug Logging ===\n')
  
  // Set environment to use DEV_MATRIX_OVERRIDE
  process.env.USE_DEV_MATRIX = 'true'
  
  console.log('Day 1 matrix: [[1,3], [2,4], [3,3], [4,2]]')
  console.log('After filtering and location info extraction:')
  console.log('- River [1,3] → [0,0] (filtered out)')
  console.log('- Coastal [2,4] → [2,4] (valid)')
  console.log('- Surface+Ground [3,3]+[4,2] → [4,3] (combined)')
  console.log('Location info array: [[0,0], [2,4], [4,3]]')
  console.log()
  
  const outlook = new Outlook(mockRiskData, mockPlace)
  
  console.log('\n=== Final Output ===')
  if (outlook.regional && outlook.regional.summary) {
    const todayMatch = outlook.regional.summary.match(/<h3[^>]*>Today<\/h3><p>([^<]*)<\/p>/)
    if (todayMatch) {
      const todayText = todayMatch[1]
      console.log('Day 1 text:', todayText)
    }
  }
}

testWithDebugLogging()
