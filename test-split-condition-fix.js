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

// Test the Day 1 case from DEV_MATRIX_OVERRIDE
function testSplitConditionFix() {
  console.log('=== Testing Split Condition Fix ===')
  console.log('Day 1 Matrix:')
  console.log('River: [1,3] - Filtered out (impact < 2)')
  console.log('Coastal: [2,4] - Valid')
  console.log('Surface: [3,3] - Valid')
  console.log('Groundwater: [4,2] - Valid')
  console.log('Expected: 3 valid combinations should trigger split\n')

  // Set environment to use DEV_MATRIX_OVERRIDE
  process.env.USE_DEV_MATRIX = 'true'
  
  try {
    const outlook = new Outlook(mockRiskData, mockPlace)
    
    console.log('Current Output:')
    console.log('Regional text:', outlook.regional)
    console.log('Has regional concern:', outlook.hasRegionalConcern)
    
    console.log('\n=== Analysis ===')
    if (outlook.regional && outlook.regional.summary) {
      const text = outlook.regional.summary
      // Remove HTML tags for easier analysis
      const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      const hasTwoSentences = plainText.includes('. ') && plainText.split('. ').length >= 2
      
      console.log('Risk Areas Text (HTML):')
      console.log(text)
      console.log('\nRisk Areas Text (Plain):')
      console.log(plainText)
      console.log('\nSentence Structure:')
      if (hasTwoSentences) {
        const sentences = plainText.split('. ')
        console.log('✓ Split into multiple sentences (5DF-L5 applied)')
        sentences.forEach((sentence, i) => {
          console.log(`  Sentence ${i + 1}: ${sentence.trim()}${i < sentences.length - 1 ? '.' : ''}`)
        })
      } else {
        console.log('✗ Single sentence (5DF-L5 NOT applied)')
      }
      
      // Look specifically at Day 1 (Today)
      console.log('\n=== Day 1 Analysis ===')
      const todayMatch = text.match(/<h3[^>]*>Today<\/h3><p>([^<]*)<\/p>/)
      if (todayMatch) {
        const todayText = todayMatch[1]
        console.log('Day 1 (Today) text:', todayText)
        const todayHasSplit = todayText.includes('. ') && todayText.split('. ').length >= 2
        if (todayHasSplit) {
          console.log('✓ Day 1 is split into multiple sentences')
          const todaySentences = todayText.split('. ')
          todaySentences.forEach((sentence, i) => {
            console.log(`  Day 1 Sentence ${i + 1}: ${sentence.trim()}${i < todaySentences.length - 1 ? '.' : ''}`)
          })
        } else {
          console.log('✗ Day 1 is a single sentence - 5DF-L5 split rule NOT applied')
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testSplitConditionFix()
