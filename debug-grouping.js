#!/usr/bin/env node

console.log('Starting day grouping debug...')

// Simulate the filtered matrix data based on our debug output
const filteredMatrix = [
  [[2,2], [3,3], [3,1], [2,4]], // Day 1
  [[0,0], [3,3], [3,1], [2,4]], // Day 2
  [[0,0], [3,3], [3,1], [2,4]], // Day 3
  [[0,0], [3,3], [3,1], [2,4]], // Day 4
  [[0,1], [3,3], [3,1], [2,4]]  // Day 5
]

const TEXT_LABELS = {
  day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  likelihood: ['possible but not expected', 'possible', 'likely', 'expected'],
  impact: [
    'flooding of low-lying land and roads',
    'localised property flooding and travel disruption', 
    'property flooding and significant travel disruption',
    'severe or widespread property flooding and travel disruption'
  ],
  where: ['riverside', 'coastal', 'across the region'],
  source: ['river', 'sea', 'surface water', 'groundwater']
}

// Simulate utility functions
const areIdentical = (arrayA, arrayB) => {
  return JSON.stringify(arrayA) === JSON.stringify(arrayB)
}

const getDayDisplayName = (dayIndex, labels) => {
  if (dayIndex === 0) return 'Today'
  if (dayIndex === 1) return 'Tomorrow'
  
  const currentDayIndex = (new Date()).getDay() === 0 ? 6 : (new Date()).getDay() - 1
  const targetDayIndex = currentDayIndex + dayIndex > 6 
    ? currentDayIndex + dayIndex - 7 
    : currentDayIndex + dayIndex
    
  return labels.day[targetDayIndex]
}

const extractLocationInfo = (dayMatrix) => {
  return [
    dayMatrix[0], // river (riverside)
    dayMatrix[1], // coastal
    [
      Math.max(dayMatrix[2][0], dayMatrix[3][0]), // surface + ground (inland areas)
      Math.max(dayMatrix[2][1], dayMatrix[3][1])
    ]
  ]
}

const getActiveFloodSources = (dayMatrix, labels) => {
  const sources = []
  dayMatrix.forEach((sourceData, index) => {
    if (sourceData[0] > 0 && index > 1) { // Only surface water and groundwater (index 2,3)
      sources.push(labels.source[index])
    }
  })
  return sources
}

const joinWithAndSeparator = (items, finalSeparator = 'and') => {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} ${finalSeparator} ${items[1]}`
  return `${items.slice(0, -1).join(', ')} ${finalSeparator} ${items[items.length - 1]}`
}

// Simulate groupConsecutiveDays function
const groupConsecutiveDays = (riskMatrix, labels) => {
  const dayGroups = []
  
  riskMatrix.forEach((dayMatrix, dayIndex) => {
    console.log(`\nProcessing Day ${dayIndex + 1}:`)
    console.log(`  Matrix: [river: ${dayMatrix[0]}, coastal: ${dayMatrix[1]}, surface: ${dayMatrix[2]}, ground: ${dayMatrix[3]}]`)
    
    const isIdenticalToPrevious = dayIndex > 0 && areIdentical(riskMatrix[dayIndex - 1], dayMatrix)
    console.log(`  Identical to previous: ${isIdenticalToPrevious}`)
    
    if (isIdenticalToPrevious) {
      const currentGroup = dayGroups[dayGroups.length - 1]
      currentGroup.endDay = getDayDisplayName(dayIndex, labels)
      currentGroup.dayCount += 1
      currentGroup.dateRange = currentGroup.dayCount === 2 
        ? ' and ' 
        : ' through to '
      console.log(`  Added to existing group, now: ${currentGroup.startDay}${currentGroup.dateRange}${currentGroup.endDay}`)
    } else {
      const locationInfo = extractLocationInfo(dayMatrix)
      const activeSources = joinWithAndSeparator(getActiveFloodSources(dayMatrix, labels), ',')
      
      dayGroups.push({
        startDay: getDayDisplayName(dayIndex, labels),
        dateRange: '',
        endDay: '',
        dayCount: 1,
        locationInfo: locationInfo,
        activeSources: activeSources
      })
      console.log(`  Created new group: ${getDayDisplayName(dayIndex, labels)}`)
      console.log(`  Location info: [riverside: ${locationInfo[0]}, coastal: ${locationInfo[1]}, inland: ${locationInfo[2]}]`)
      console.log(`  Active sources: ${activeSources}`)
    }
  })

  console.log(`\nFinal day groups: ${dayGroups.length}`)
  dayGroups.forEach((group, index) => {
    console.log(`  Group ${index + 1}: ${group.startDay}${group.dateRange}${group.endDay}`)
    console.log(`    Location info: [riverside: ${group.locationInfo[0]}, coastal: ${group.locationInfo[1]}, inland: ${group.locationInfo[2]}]`)
    console.log(`    Active sources: ${group.activeSources}`)
  })

  return dayGroups
}

// Run the simulation
const dayGroups = groupConsecutiveDays(filteredMatrix, TEXT_LABELS)
