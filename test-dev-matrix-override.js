#!/usr/bin/env node

/**
 * Test script to verify DEV_MATRIX_OVERRIDE functionality
 */

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

console.log('=== Testing DEV_MATRIX_OVERRIDE functionality ===\n')

console.log('1. Testing without DEV_MATRIX_OVERRIDE (production mode):')
console.log(`NODE_ENV: "${process.env.NODE_ENV}"`)
console.log(`USE_DEV_MATRIX: "${process.env.USE_DEV_MATRIX}"`)

const outlookProduction = new Outlook(mockRiskData, mockPlace)
console.log('Production outlook regional text:', outlookProduction.regional)
console.log('Has regional concern:', outlookProduction.hasRegionalConcern)
console.log()

console.log('2. Testing with NODE_ENV=development:')
process.env.NODE_ENV = 'development'
const outlookDev = new Outlook(mockRiskData, mockPlace)
console.log('Development outlook regional text:', outlookDev.regional)
console.log('Has regional concern:', outlookDev.hasRegionalConcern)
console.log()

console.log('3. Testing with USE_DEV_MATRIX=true:')
process.env.NODE_ENV = ''
process.env.USE_DEV_MATRIX = 'true'
const outlookCustom = new Outlook(mockRiskData, mockPlace)
console.log('Custom override outlook regional text:', outlookCustom.regional)
console.log('Has regional concern:', outlookCustom.hasRegionalConcern)
console.log()

console.log('4. Resetting to production mode:')
process.env.NODE_ENV = ''
process.env.USE_DEV_MATRIX = ''
const outlookFinal = new Outlook(mockRiskData, mockPlace)
console.log('Final production outlook regional text:', outlookFinal.regional)
console.log('Has regional concern:', outlookFinal.hasRegionalConcern)
