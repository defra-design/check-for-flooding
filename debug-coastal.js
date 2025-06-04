#!/usr/bin/env node

console.log('Starting debug script...')

const outlook = require('./app/models/outlook.js')

console.log('Outlook module loaded successfully')

console.log('Debugging coastal data issue...\n')

// Mock risk data to simulate the environment
const mockRiskData = {
  issued_at: new Date().toISOString(),
  last_modified_at: new Date().toISOString(),
  public_forecast: {
    england_forecast: "Test forecast content"
  },
  risk_areas: []
}

// Mock place data
const mockPlace = {
  name: "Test Location",
  bbox2k: [-1.5, 50.5, -1.0, 51.0]
}

try {
  // Create outlook instance
  const outlookInstance = new outlook(mockRiskData, mockPlace)
  
  if (outlookInstance.regional) {
    console.log('=== RAW MATRIX DATA ===')
    // Let's access the development matrix override directly
    const DEV_MATRIX_OVERRIDE = [
      [[2,2], [3,3], [3,1], [2,4]], // Day 1
      [[1,1], [3,3], [3,1], [2,4]], // Day 2  
      [[1,1], [3,3], [3,1], [2,4]], // Day 3
      [[1,1], [3,3], [3,1], [2,4]], // Day 4
      [[0,1], [3,3], [3,1], [2,4]]  // Day 5
    ]
    
    console.log('Original matrix:')
    DEV_MATRIX_OVERRIDE.forEach((day, index) => {
      console.log(`Day ${index + 1}: [river: ${day[0]}, coastal: ${day[1]}, surface: ${day[2]}, ground: ${day[3]}]`)
    })
    
    console.log('\n=== FILTERED MATRIX (after green cell filtering) ===')
    // Simulate green cell filtering
    const filteredMatrix = DEV_MATRIX_OVERRIDE.map(dayMatrix => 
      dayMatrix.map(sourceData => {
        const [impact, likelihood] = sourceData
        
        // Green cells to filter out: (1,1), (1,2), (2,1) - keep only (2,2)
        const isGreenCellToRemove = (
          (impact === 1 && likelihood === 1) ||
          (impact === 1 && likelihood === 2) ||
          (impact === 2 && likelihood === 1)
        )
        
        return isGreenCellToRemove ? [0, 0] : sourceData
      })
    )
    
    filteredMatrix.forEach((day, index) => {
      console.log(`Day ${index + 1}: [river: ${day[0]}, coastal: ${day[1]}, surface: ${day[2]}, ground: ${day[3]}]`)
    })
    
    console.log('\n=== LOCATION INFO EXTRACTION ===')
    // Simulate extractLocationInfo for each day
    filteredMatrix.forEach((dayMatrix, index) => {
      const locationInfo = [
        dayMatrix[0], // river (riverside)
        dayMatrix[1], // coastal
        [
          Math.max(dayMatrix[2][0], dayMatrix[3][0]), // surface + ground (inland areas)
          Math.max(dayMatrix[2][1], dayMatrix[3][1])
        ]
      ]
      console.log(`Day ${index + 1} locations: [riverside: ${locationInfo[0]}, coastal: ${locationInfo[1]}, inland: ${locationInfo[2]}]`)
    })
    
    console.log('\n=== ACTUAL GENERATED TEXT ===')
    console.log(outlookInstance.regional.html)
  } else {
    console.log('No regional outlook generated')
  }
} catch (error) {
  console.error('Error:', error.message)
  console.error(error.stack)
}
