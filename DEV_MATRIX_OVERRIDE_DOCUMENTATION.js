/**
 * DEV_MATRIX_OVERRIDE - Complete Documentation and Behavior Guide
 * 
 * This document explains how the DEV_MATRIX_OVERRIDE works, what text it generates,
 * and how to modify it for different testing scenarios.
 */

// =============================================================================
// 1. WHAT IS DEV_MATRIX_OVERRIDE?
// =============================================================================

/*
DEV_MATRIX_OVERRIDE is a development/testing tool that replaces the real flood 
risk data with fixed values. This allows developers to test specific scenarios 
without waiting for real weather conditions.

When DEV_MATRIX_OVERRIDE is defined in the code, it will ALWAYS be used instead 
of real data. To use real data, you must comment out or delete the 
DEV_MATRIX_OVERRIDE constant.
*/

// =============================================================================
// 2. MATRIX STRUCTURE
// =============================================================================

/*
Format: Array of 5 days, each containing 4 sources
[
  [day1_sources], [day2_sources], [day3_sources], [day4_sources], [day5_sources]
]

Each day_sources = [[river], [coastal], [surface], [groundwater]]
Each source = [impact, likelihood] where both are numbers 1-4

Example:
[[1, 3], [2, 4], [3, 3], [4, 2]]
 ↑       ↑       ↑       ↑
river   coastal  surface  groundwater
*/

// =============================================================================
// 3. FILTERING LOGIC
// =============================================================================

/*
Only cells with BOTH impact >= 2 AND likelihood >= 2 are shown.
This means:
- [1, 1] = FILTERED OUT (too low impact AND likelihood)
- [1, 4] = FILTERED OUT (impact too low)
- [4, 1] = FILTERED OUT (likelihood too low)  
- [2, 2] = SHOWN (meets both thresholds)
- [4, 4] = SHOWN (meets both thresholds)
*/

// =============================================================================
// 4. LOCATION MAPPING
// =============================================================================

/*
The 4 sources get mapped to 3 location types:
- River (index 0) → "riverside areas"
- Coastal (index 1) → "coastal areas"  
- Surface + Groundwater (indices 2,3) → "across the region"

For inland areas, the system takes the MAXIMUM of surface and groundwater values.
Example: surface=[2,3], groundwater=[4,2] → inland=[4,3]
*/

// =============================================================================
// 5. TEXT GENERATION MAPPING
// =============================================================================

/*
Impact Levels:
1: "flooding of low-lying land and roads"
2: "localised property flooding and travel disruption"
3: "property flooding and significant travel disruption"  
4: "severe or widespread property flooding and travel disruption"

Likelihood Levels:
1: "possible but not expected"
2: "possible"
3: "likely"
4: "expected"

Generated text format:
"[IMPACT] is [LIKELIHOOD] in [LOCATION]"

Examples:
- Impact 3, Likelihood 3 → "property flooding and significant travel disruption is likely"
- Impact 2, Likelihood 4 → "localised property flooding and travel disruption is expected"
*/

// =============================================================================
// 6. CURRENT MATRIX ANALYSIS
// =============================================================================

const CURRENT_MATRIX = [
  [[1, 3], [2, 4], [3, 3], [4, 2]], // Day 1
  [[3, 3], [3, 3], [3, 3], [3, 3]], // Day 2
  [[3, 3], [3, 3], [3, 3], [3, 3]], // Day 3
  [[3, 3], [3, 3], [3, 3], [3, 3]], // Day 4
  [[3, 3], [3, 3], [3, 3], [3, 3]]  // Day 5
]

/*
After filtering and location mapping:

Day 1:
- Riverside: [0,0] (filtered out from [1,3])
- Coastal: [2,4] → "localised property flooding and travel disruption is expected"
- Inland: [4,3] → "severe or widespread property flooding and travel disruption is likely"

Days 2-5:
- Riverside: [3,3] → "property flooding and significant travel disruption is likely"
- Coastal: [3,3] → "property flooding and significant travel disruption is likely"  
- Inland: [3,3] → "property flooding and significant travel disruption is likely"

Generated Text:
Day 1: "Severe or widespread property flooding and travel disruption is likely across the region due to surface water and groundwater. In coastal areas, localised property flooding and travel disruption is expected."

Days 2-5: "Property flooding and significant travel disruption is likely in riverside areas and coastal areas and across the region due to surface water and groundwater."
*/

// =============================================================================
// 7. HOW TO TEST DIFFERENT SCENARIOS
// =============================================================================

/*
To test a "very low risk" scenario:
Replace DEV_MATRIX_OVERRIDE with:
[
  [[1, 1], [1, 1], [1, 1], [1, 1]], // All filtered out
  [[1, 1], [1, 1], [1, 1], [1, 1]], // All filtered out
  [[1, 1], [1, 1], [1, 1], [1, 1]], // All filtered out
  [[1, 1], [1, 1], [1, 1], [1, 1]], // All filtered out
  [[1, 1], [1, 1], [1, 1], [1, 1]]  // All filtered out
]
Expected: "Today the flood risk is very low."

To test "river flooding only":
[
  [[3, 3], [0, 0], [0, 0], [0, 0]], // Only river active
  [[2, 2], [0, 0], [0, 0], [0, 0]], // Only river active  
  [[0, 0], [0, 0], [0, 0], [0, 0]], // No risk
  [[0, 0], [0, 0], [0, 0], [0, 0]], // No risk
  [[0, 0], [0, 0], [0, 0], [0, 0]]  // No risk
]
Expected Day 1: "property flooding and significant travel disruption is likely in riverside areas"
Expected Day 2: "localised property flooding and travel disruption is possible in riverside areas"
*/

// =============================================================================
// 8. HOW TO SWITCH BACK TO REAL DATA
// =============================================================================

/*
Method 1: Comment out DEV_MATRIX_OVERRIDE
Find this line in app/models/outlook.js:
const DEV_MATRIX_OVERRIDE = [...]

Change it to:
// const DEV_MATRIX_OVERRIDE = [...]

Method 2: Delete DEV_MATRIX_OVERRIDE
Simply delete the entire DEV_MATRIX_OVERRIDE constant definition.

After either change, the system will use real flood risk data from the API.
*/

// =============================================================================
// 9. VERIFICATION STEPS
// =============================================================================

/*
1. Modify DEV_MATRIX_OVERRIDE in app/models/outlook.js
2. Save the file
3. Visit localhost:3000 (server auto-restarts)
4. Check the text output on the homepage
5. Verify the text matches your expected impact/likelihood phrases

The console will show "🔧 Using DEV_MATRIX_OVERRIDE for testing" when the override is active.
*/

console.log('✅ DEV_MATRIX_OVERRIDE documentation complete')
console.log('📖 See the comments above for complete behavior explanation')
console.log('🔧 Current status: DEV_MATRIX_OVERRIDE is ACTIVE (override always used when defined)')
console.log('💡 To use real data: comment out DEV_MATRIX_OVERRIDE in app/models/outlook.js')
