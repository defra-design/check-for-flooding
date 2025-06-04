const Outlook = require('./app/models/outlook')

// Test data with coastal flooding
const mockRiskData = {
  issued_at: new Date().toISOString(),
  last_modified_at: new Date().toISOString(),
  public_forecast: {
    england_forecast: 'Test forecast'
  },
  flood_risk_matrix: {
    days: [
      {
        day: 1,
        risk_areas: [
          {
            risk_area_blocks: [
              {
                days: [1],
                risk_levels: {
                  river: [2, 2],     // Moderate impact, likely
                  surface: [3, 1],   // Significant impact, possible but not expected
                  ground: [2, 4],    // Moderate impact, expected likelihood
                  coastal: [3, 3]    // Significant impact, likely ← THIS SHOULD APPEAR
                }
              }
            ]
          }
        ]
      },
      {
        day: 2,
        risk_areas: [
          {
            risk_area_blocks: [
              {
                days: [2, 3, 4],
                risk_levels: {
                  river: [0, 0],
                  surface: [3, 1],
                  ground: [2, 4],
                  coastal: [3, 3]
                }
              }
            ]
          }
        ]
      }
    ]
  }
}

const mockPlace = {
  bbox2k: [-1, -1, 2, 2]
}

console.log('=== DETAILED TEXT GENERATION DEBUG ===\n')

try {
  const outlook = new Outlook(mockRiskData, mockPlace)
  
  // Let's use the development matrix override that we know is working
  console.log('1. Development matrix (from DEV_MATRIX_OVERRIDE):')
  const DEV_MATRIX = [
    [[2,2], [3,3], [3,1], [2,4]], // Day 1 - has coastal [3,3]
    [[1,1], [3,3], [3,1], [2,4]], // Day 2  
    [[1,1], [3,3], [3,1], [2,4]], // Day 3
    [[1,1], [3,3], [3,1], [2,4]], // Day 4
    [[0,1], [3,3], [3,1], [2,4]]  // Day 5
  ]
  
  DEV_MATRIX.forEach((day, index) => {
    console.log(`Day ${index + 1}: [river: ${day[0]}, coastal: ${day[1]}, surface: ${day[2]}, ground: ${day[3]}]`)
  })
  
  console.log('\n2. After green cell filtering:')
  // Simulate green cell filtering (remove cells with impact=1,likelihood=1), (1,2), (2,1)
  const filteredMatrix = DEV_MATRIX.map(day => 
    day.map(sourceData => {
      const [impact, likelihood] = sourceData
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
  
  console.log('\n3. Location info extraction:')
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
  
  console.log('\n9. Final generated text:')
  if (outlook.regional && outlook.regional.summary) {
    console.log(outlook.regional.summary)
  }
  
} catch (error) {
  console.error('Error:', error.message)
  console.error(error.stack)
}
