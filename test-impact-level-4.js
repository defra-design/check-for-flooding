const Outlook = require('./app/models/outlook')

// Test the updated matrix for Days 2-5
console.log('Testing updated DEV_MATRIX_OVERRIDE for Days 2-5...\n')

// Test configuration
const testConfig = {
  polygon: null,
  earlyWarningsOnly: false,
  riskLevels: [4, 3, 2, 1],
  displayLongTermRisk: true,
  displaySevenDaysOfRisk: false
}

const outlook = new Outlook(testConfig)

// Test Days 2-5
for (let day = 2; day <= 5; day++) {
  console.log(`=== Day ${day} ===`)
  
  // Check the matrix values
  console.log('Matrix values:')
  console.log('River:', outlook.getMatrixValue('river', day - 1))
  console.log('Coastal:', outlook.getMatrixValue('coastal', day - 1))
  console.log('Surface:', outlook.getMatrixValue('surfaceWater', day - 1))
  console.log('Groundwater:', outlook.getMatrixValue('groundwater', day - 1))
  
  // Check the generated text
  const riskData = outlook.processRiskData(day - 1)
  const validCombinations = riskData.filter(data => data[0] >= 2 && data[1] >= 2)
  
  console.log('Valid combinations:', validCombinations.length)
  console.log('Valid data:', validCombinations)
  
  if (validCombinations.length > 0) {
    const maxImpact = Math.max(...validCombinations.map(data => data[0]))
    const maxLikelihood = Math.max(...validCombinations.map(data => data[1]))
    
    const impactText = outlook.getLabel('impact')[maxImpact - 1]
    const likelihoodText = outlook.getLabel('likelihood')[maxLikelihood - 1]
    
    console.log(`Max impact: ${maxImpact} -> "${impactText}"`)
    console.log(`Max likelihood: ${maxLikelihood} -> "${likelihoodText}"`)
    
    const textArray = outlook.getRiskText(day - 1)
    console.log('Generated text:', textArray)
  }
  
  console.log('')
}
