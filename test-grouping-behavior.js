#!/usr/bin/env node

/**
 * Test script to verify the grouping behavior of locations with same risk descriptions
 */

const Outlook = require('./app/models/outlook')

console.log('🧪 Testing Location Grouping Behavior...')
console.log('=' * 50)

// Mock risk data designed to test grouping
const mockRiskData = {
  issued_at: new Date().toISOString(),
  last_modified_at: new Date().toISOString(),
  public_forecast: {
    england_forecast: 'Test forecast for grouping verification.'
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
            river: [3, 4],   // Risk score: 3×4 = 12 (property flooding + expected)
            surface: [3, 4], // Risk score: 3×4 = 12 (property flooding + expected) - SHOULD GROUP with river
            ground: [3, 4],  // Risk score: 3×4 = 12 (property flooding + expected) - SHOULD GROUP with river  
            coastal: [3, 3]  // Risk score: 3×3 = 9 (property flooding + likely) - SEPARATE sentence
          }
        }
      ]
    }
  ]
}

const mockPlace = {
  bbox2k: [-1, -1, 2, 2]
}

try {
  const outlook = new Outlook(mockRiskData, mockPlace)
  
  if (outlook.regional && outlook.regional.summary) {
    console.log('\n📝 Generated Outlook:')
    console.log('-'.repeat(50))
    const outputText = outlook.regional.summary
    console.log(outputText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
    console.log('-'.repeat(50))
    
    // Extract sentences
    const sentences = outputText.match(/[^.!?]+[.!?]/g) || []
    const cleanSentences = sentences
      .map(s => s.replace(/<[^>]*>/g, '').trim())
      .filter(s => s && s.length > 10 && !s.match(/^(Today|Tomorrow|Monday|Tuesday|Wednesday|Thursday|Friday)/))
    
    console.log('\n🔍 Sentence Analysis:')
    cleanSentences.forEach((sentence, i) => {
      console.log(`${i + 1}. ${sentence}`)
      
      // Check for proper grouping indicators
      if (sentence.includes('riverside areas and across the region')) {
        console.log('   ✅ GOOD: Riverside and region properly grouped')
      } else if (sentence.includes('riverside areas') && sentence.includes('across the region') && sentence.includes(' and ')) {
        console.log('   ✅ GOOD: Riverside and region grouped (different format)')
      } else if (sentence.includes('riverside') && sentence.includes('region')) {
        console.log('   ⚠️  WARNING: Both riverside and region mentioned but grouping unclear')
      }
    })
    
    // Test the specific grouping requirement
    console.log('\n🎯 Grouping Verification:')
    
    const hasProperGrouping = cleanSentences.some(sentence => 
      sentence.includes('riverside areas and across the region') ||
      (sentence.includes('riverside') && sentence.includes('region') && sentence.includes('expected'))
    )
    
    const hasSeparateCoastal = cleanSentences.some(sentence => 
      sentence.includes('coastal') && sentence.includes('likely') && 
      !sentence.includes('riverside') && !sentence.includes('region')
    )
    
    if (hasProperGrouping) {
      console.log('✅ PASS: Locations with same risk description are properly grouped')
    } else {
      console.log('❌ FAIL: Locations with same risk description are NOT grouped')
    }
    
    if (hasSeparateCoastal) {
      console.log('✅ PASS: Different risk descriptions have separate sentences')
    } else {
      console.log('❌ FAIL: Different risk descriptions should have separate sentences')
    }
    
    // Expected behavior summary
    console.log('\n📋 Expected Behavior:')
    console.log('• Riverside (3×4=12) + Region (3×4=12) should be grouped: "...expected in riverside areas and across the region..."')
    console.log('• Coastal (3×3=9) should be separate: "...likely in coastal areas..."')
    
    console.log('\n🏁 Test Complete!')
    
  } else {
    console.log('❌ No regional outlook generated')
  }
  
} catch (error) {
  console.error('❌ Error during testing:', error.message)
  console.error('Stack trace:', error.stack)
}
