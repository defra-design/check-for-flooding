#!/usr/bin/env node

/**
 * Test script to verify the outlook duplication fix
 */

const Outlook = require('./app/models/outlook.js')

// Mock risk data that would cause the duplication issue
const mockRiskData = {
  issued_at: new Date().toISOString(),
  last_modified_at: new Date().toISOString(),
  public_forecast: {
    england_forecast: "Mock forecast text for testing."
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
            river: [2, 2],     // Minor impact, possible likelihood
            surface: [3, 4],   // Significant impact, expected likelihood
            ground: [3, 4],    // Significant impact, expected likelihood
            coastal: [3, 3]    // Significant impact, likely
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

console.log('Testing Outlook duplication fix...\n')

try {
  const outlook = new Outlook(mockRiskData, mockPlace)
  
  if (outlook.regional && outlook.regional.summary) {
    console.log('Generated regional outlook:')
    console.log('=' .repeat(50))
    console.log(outlook.regional.summary)
    console.log('=' .repeat(50))
    
    // Check for duplicate sentences
    const text = outlook.regional.summary
    const sentences = text.match(/[^.!?]+[.!?]/g) || []
    
    console.log('\nSentence analysis:')
    sentences.forEach((sentence, index) => {
      const cleanSentence = sentence.replace(/<[^>]*>/g, '').trim()
      if (cleanSentence) {
        console.log(`${index + 1}: ${cleanSentence}`)
      }
    })
    
    // Look for duplicates
    const cleanSentences = sentences.map(s => s.replace(/<[^>]*>/g, '').trim()).filter(s => s)
    const duplicates = cleanSentences.filter((sentence, index) => 
      cleanSentences.indexOf(sentence) !== index
    )
    
    if (duplicates.length > 0) {
      console.log('\n❌ DUPLICATES FOUND:')
      duplicates.forEach(dup => console.log(`- ${dup}`))
    } else {
      console.log('\n✅ No exact duplicates found!')
    }
    
    // Check for semantic duplicates (location-based patterns)
    const locationPatterns = cleanSentences.map(sentence => {
      const patterns = []
      const locationMatch = sentence.match(/in (riverside|coastal|inland|rural|urban) areas?,\s*([^.]+)/gi)
      if (locationMatch) {
        patterns.push(...locationMatch.map(m => m.toLowerCase().trim()))
      }
      return { sentence, patterns }
    })
    
    const semanticDuplicates = []
    for (let i = 0; i < locationPatterns.length; i++) {
      for (let j = i + 1; j < locationPatterns.length; j++) {
        const patterns1 = locationPatterns[i].patterns
        const patterns2 = locationPatterns[j].patterns
        
        for (const p1 of patterns1) {
          for (const p2 of patterns2) {
            if (p1 === p2) {
              semanticDuplicates.push({
                sentence1: locationPatterns[i].sentence,
                sentence2: locationPatterns[j].sentence,
                pattern: p1
              })
            }
          }
        }
      }
    }
    
    if (semanticDuplicates.length > 0) {
      console.log('\n⚠️  SEMANTIC DUPLICATES FOUND:')
      semanticDuplicates.forEach(dup => {
        console.log(`Pattern: "${dup.pattern}"`)
        console.log(`  1: ${dup.sentence1}`)
        console.log(`  2: ${dup.sentence2}`)
      })
    } else {
      console.log('✅ No semantic duplicates found!')
    }
    
  } else {
    console.log('No regional outlook generated (possibly due to date offset)')
  }
  
} catch (error) {
  console.error('Error testing outlook:', error.message)
  console.error(error.stack)
}

console.log('\nTest completed.')
