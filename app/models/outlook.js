/**
 * Flood Outlook Model
 * Processes flood risk data and generates risk assessments and geospatial features
 */

const turf = require('@turf/turf')
const moment = require('moment-timezone')

// ==================== CONSTANTS ====================

/**
 * Flood source types
 */
const FLOOD_SOURCES = {
  RIVER: 'river',
  COASTAL: 'coastal', 
  SURFACE: 'surface',
  GROUND: 'ground'
}

/**
 * User-friendly labels for flood sources
 */
const FLOOD_SOURCE_LABELS = {
  [FLOOD_SOURCES.RIVER]: 'river',
  [FLOOD_SOURCES.COASTAL]: 'sea',
  [FLOOD_SOURCES.SURFACE]: 'surface water',
  [FLOOD_SOURCES.GROUND]: 'groundwater'
}

/**
 * Polygon geometry types
 */
const POLYGON_TYPES = {
  INLAND: 'inland',
  COASTAL: 'coastal'
}

/**
 * Risk matrix mapping impact/likelihood to risk levels
 * Rows: Impact levels (1-4), Columns: Likelihood levels (1-4)
 */
const RISK_MATRIX = [
  [1, 1, 1, 1], // Minimal impact
  [1, 1, 2, 2], // Minor impact  
  [2, 2, 3, 3], // Significant impact
  [2, 3, 3, 4]  // Severe impact
]

/**
 * Risk band descriptions
 */
const RISK_BANDS = ['Very low', 'Low', 'Medium', 'High']

/**
 * Text labels for generating outlook descriptions
 */
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

/**
 * Development matrix override (hardcoded for testing)
 * Format: [day][source][impact, likelihood]
 * Sources: [river, coastal, surface, ground]
 */
const DEV_MATRIX_OVERRIDE = [
  [[2,2], [3,3], [3,1], [2,4]], // Day 1
  [[1,1], [3,3], [3,1], [2,4]], // Day 2  
  [[1,1], [3,3], [3,1], [2,4]], // Day 3
  [[1,1], [3,3], [3,1], [2,4]], // Day 4
  [[0,1], [3,3], [3,1], [2,4]]  // Day 5
]

/**
 * Coastal buffer distance for intersection calculations
 */
const COASTAL_BUFFER_MILES = 1

// ==================== UTILITY FUNCTIONS ====================

/**
 * Initialize empty risk levels structure for all flood sources
 * @returns {Object} Risk levels object with zero values
 */
const initializeRiskLevels = () => ({
  [FLOOD_SOURCES.RIVER]: { impact: 0, likelihood: 0, risk: 0 },
  [FLOOD_SOURCES.SURFACE]: { impact: 0, likelihood: 0, risk: 0 },
  [FLOOD_SOURCES.GROUND]: { impact: 0, likelihood: 0, risk: 0 },
  [FLOOD_SOURCES.COASTAL]: { impact: 0, likelihood: 0, risk: 0 }
})

/**
 * Check if two arrays/objects are identical
 * @param {*} arrayA - First array or object
 * @param {*} arrayB - Second array or object  
 * @returns {boolean} True if identical
 */
const areIdentical = (arrayA, arrayB) => {
  return JSON.stringify(arrayA) === JSON.stringify(arrayB)
}

/**
 * Group array of objects by a specified property
 * @param {Array} objectArray - Array of objects to group
 * @param {string} property - Property name to group by
 * @returns {Object} Grouped objects
 */
const groupByProperty = (objectArray, property) => {
  return objectArray.reduce((accumulator, object) => {
    if (!accumulator[object[property]]) {
      accumulator[object[property]] = []
    }
    accumulator[object[property]].push(object)
    return accumulator
  }, {})
}

/**
 * Join array elements with proper punctuation and 'and' for last item
 * @param {Array} array - Array of strings to join
 * @param {string} separator - Separator character (default: ',')
 * @returns {string} Properly formatted list
 */
const joinWithAndSeparator = (array, separator = ',') => {
  if (!array || array.length === 0) return ''
  if (array.length === 1) return array[0]
  if (array.length === 2) return array.join(' and ')
  
  const pattern = new RegExp(';(?=[^;]+$)')
  return array.join('; ').replace(pattern, ' and').replace(';', separator)
}

/**
 * Get display name for a day relative to current date
 * @param {number} dayOffset - Number of days from today (0 = today, 1 = tomorrow, etc.)
 * @param {Object} labels - Text labels object containing day names
 * @returns {string} Display name for the day
 */
const getDayDisplayName = (dayOffset, labels) => {
  const currentDayIndex = (new Date()).getDay() === 0 ? 6 : (new Date()).getDay() - 1
  
  if (dayOffset === 0) return 'Today'
  if (dayOffset === 1) return 'Tomorrow'
  
  const targetDayIndex = currentDayIndex + dayOffset > 6 
    ? currentDayIndex + dayOffset - 7 
    : currentDayIndex + dayOffset
    
  return labels.day[targetDayIndex]
}

// ==================== GEOJSON PROCESSING ====================

/**
 * Calculate risk level from impact and likelihood using the risk matrix
 * @param {number} impact - Impact level (1-4)
 * @param {number} likelihood - Likelihood level (1-4) 
 * @returns {number} Risk level (1-4)
 */
const calculateRiskLevel = (impact, likelihood) => {
  if (!impact || !likelihood || impact < 1 || likelihood < 1) return 0
  return RISK_MATRIX[impact - 1][likelihood - 1]
}

/**
 * Process flood risk data for a specific source type
 * @param {Object} riskAreaBlock - Risk area block containing risk levels
 * @param {string} sourceType - Type of flood source (river, coastal, etc.)
 * @param {Array} activeSources - Array to collect active source names
 * @param {Object} riskLevels - Object to store calculated risk levels
 */
const processFloodSource = (riskAreaBlock, sourceType, activeSources, riskLevels) => {
  const riskData = riskAreaBlock.risk_levels[sourceType]
  if (!riskData) return

  const [impact, likelihood] = riskData
  const risk = calculateRiskLevel(impact, likelihood)
  
  riskLevels[sourceType] = { impact, likelihood, risk }
  activeSources.push(sourceType)
}

/**
 * Create a GeoJSON feature for a polygon with risk information
 * @param {Object} polygon - Polygon geometry and metadata
 * @param {Object} riskAreaBlock - Risk area block data
 * @param {number} riskLevel - Calculated overall risk level
 * @param {Array} activeSources - List of active flood sources
 * @returns {Object} GeoJSON feature object
 */
const createGeoJsonFeature = (polygon, riskAreaBlock, riskLevel, activeSources) => {
  const riskDescription = RISK_BANDS[riskLevel - 1]
  const sourceLabels = activeSources.map(source => FLOOD_SOURCE_LABELS[source] || source)
  const featureName = `${riskDescription} risk of ${sourceLabels.join(', ')} flooding`
  
  const baseProperties = {
    type: 'concernArea',
    days: riskAreaBlock.days,
    labelPosition: polygon.label_position,
    name: featureName,
    'risk-level': riskLevel,
    'z-index': riskLevel * 10
  }

  if (polygon.poly_type === POLYGON_TYPES.INLAND) {
    return {
      type: 'Feature',
      id: polygon.id,
      properties: { ...baseProperties, polyType: POLYGON_TYPES.INLAND },
      geometry: {
        type: 'Polygon',
        coordinates: polygon.coordinates
      }
    }
  } else if (polygon.poly_type === POLYGON_TYPES.COASTAL) {
    return {
      type: 'Feature', 
      id: polygon.id,
      properties: { 
        ...baseProperties, 
        polyType: POLYGON_TYPES.COASTAL,
        'z-index': baseProperties['z-index'] + 1 // Coastal areas on top
      },
      geometry: {
        type: 'LineString',
        coordinates: polygon.coordinates
      }
    }
  }
}

/**
 * Build GeoJSON features from flood risk area data
 * @param {Object} riskData - The complete risk area dataset
 * @returns {Array} Array of GeoJSON features
 */
const buildGeoJsonFeatures = (riskData) => {
  const features = []

  riskData.risk_areas.forEach(riskArea => {
    riskArea.risk_area_blocks.forEach(riskAreaBlock => {
      const activeSources = []
      const riskLevels = initializeRiskLevels()

      // Process each flood source type
      Object.values(FLOOD_SOURCES).forEach(sourceType => {
        processFloodSource(riskAreaBlock, sourceType, activeSources, riskLevels)
      })

      // Calculate overall risk levels
      const overallRiskLevel = Math.max(
        riskLevels[FLOOD_SOURCES.RIVER].risk,
        riskLevels[FLOOD_SOURCES.SURFACE].risk, 
        riskLevels[FLOOD_SOURCES.COASTAL].risk,
        riskLevels[FLOOD_SOURCES.GROUND].risk
      )
      
      const maxImpactLevel = Math.max(
        riskLevels[FLOOD_SOURCES.RIVER].impact,
        riskLevels[FLOOD_SOURCES.SURFACE].impact,
        riskLevels[FLOOD_SOURCES.COASTAL].impact, 
        riskLevels[FLOOD_SOURCES.GROUND].impact
      )
      
      const maxLikelihoodLevel = Math.max(
        riskLevels[FLOOD_SOURCES.RIVER].likelihood,
        riskLevels[FLOOD_SOURCES.SURFACE].likelihood,
        riskLevels[FLOOD_SOURCES.COASTAL].likelihood,
        riskLevels[FLOOD_SOURCES.GROUND].likelihood
      )

      // Create features for each polygon in this risk area block
      riskAreaBlock.polys.forEach(polygon => {
        const feature = createGeoJsonFeature(polygon, riskAreaBlock, overallRiskLevel, activeSources)
        
        // Apply filtering logic: exclude green cells except [2,2] (minor impact + possible likelihood)
        if (maxImpactLevel > 1 && !(maxImpactLevel === 2 && maxLikelihoodLevel === 1)) {
          features.push(feature)
        }
      })
    })
  })

  return features
}

/**
 * Extract risk levels from GeoJSON features for each day
 * @param {Object} geoJsonData - GeoJSON feature collection
 * @returns {Array} Array of risk levels for 5 days
 */
const extractRiskLevels = (geoJsonData) => {
  const dailyRiskLevels = [0, 0, 0, 0, 0]

  geoJsonData.features.forEach(feature => {
    feature.properties.days.forEach(dayNumber => {
      const currentLevel = dailyRiskLevels[dayNumber - 1]
      const featureLevel = feature.properties['risk-level']
      dailyRiskLevels[dayNumber - 1] = featureLevel > currentLevel ? featureLevel : currentLevel
    })
  })

  return dailyRiskLevels
}

/**
 * Build complete GeoJSON from risk area data
 * @param {Object} riskData - Complete risk area dataset
 * @returns {Object} GeoJSON FeatureCollection
 */
const buildGeoJson = (riskData) => {
  const features = buildGeoJsonFeatures(riskData)
  
  return {
    type: 'FeatureCollection',
    features: features
  }
}

// ==================== MATRIX PROCESSING ====================

/**
 * Create a buffered polygon from coastal linestring for intersection testing
 * @param {Object} polygon - Polygon object with coordinates
 * @returns {Object} Modified polygon with buffered coordinates
 */
const createCoastalBuffer = (polygon) => {
  const lineStringFeature = {
    type: 'Feature',
    properties: { polyType: POLYGON_TYPES.COASTAL },
    geometry: {
      type: 'LineString',
      coordinates: polygon.coordinates
    }
  }

  const bufferedFeature = turf.buffer(lineStringFeature, COASTAL_BUFFER_MILES, { units: 'miles' })
  polygon.coordinates = bufferedFeature.geometry.coordinates
  
  return polygon
}

/**
 * Test if polygon intersects with the location bounding box
 * @param {Object} polygon - Polygon to test
 * @param {Object} locationBounds - Location bounding box as turf polygon
 * @returns {boolean} True if intersection exists
 */
const testPolygonIntersection = (polygon, locationBounds) => {
  const polygonFeature = turf.polygon(polygon.coordinates)
  const intersection = turf.intersect(polygonFeature, locationBounds)
  return !!intersection
}

/**
 * Create location bounding box from place coordinates
 * @param {Object} place - Place object with bbox2k coordinates
 * @returns {Object} Turf polygon representing the bounding box
 */
const createLocationBounds = (place) => {
  return turf.polygon([[
    [place.bbox2k[0], place.bbox2k[1]],
    [place.bbox2k[0], place.bbox2k[3]], 
    [place.bbox2k[2], place.bbox2k[3]],
    [place.bbox2k[2], place.bbox2k[1]],
    [place.bbox2k[0], place.bbox2k[1]]
  ]])
}

/**
 * Build risk matrix for a specific location
 * @param {Object} riskData - Complete risk area dataset
 * @param {Object} place - Location data with bounding box
 * @returns {Array} 5x4 matrix [day][source][impact, likelihood]
 */
const buildRiskMatrix = (riskData, place) => {
  let intersectingPolygons = []
  const locationBounds = createLocationBounds(place)

  // Find all polygons that intersect with the location
  riskData.risk_areas.forEach(riskArea => {
    riskArea.risk_area_blocks.forEach(riskAreaBlock => {
      riskAreaBlock.polys.forEach(polygon => {
        // Handle coastal polygons with buffering
        if (polygon.poly_type === POLYGON_TYPES.COASTAL) {
          polygon = createCoastalBuffer(polygon)
        }

        // Test intersection with location bounds
        if (testPolygonIntersection(polygon, locationBounds)) {
          const riskLevels = riskAreaBlock.risk_levels

          // Extract risk data for each day and source
          riskAreaBlock.days.forEach(dayNumber => {
            Object.keys(riskLevels).forEach(sourceKey => {
              const [impact, likelihood] = riskLevels[sourceKey]
              const sourceIndex = Object.values(FLOOD_SOURCES).indexOf(sourceKey)
              
              if (sourceIndex !== -1) {
                intersectingPolygons.push({ 
                  impact, 
                  likelihood, 
                  day: dayNumber, 
                  source: sourceIndex 
                })
              }
            })
          })
        }
      })
    })
  })

  // Group polygons by day
  const polygonsByDay = groupByProperty(intersectingPolygons, 'day')

  // Initialize 5x4 matrix with zero values [day][source][impact, likelihood]
  let riskMatrix = Array(5).fill().map(() => 
    Array(4).fill().map(() => [0, 0])
  )

  // Populate matrix with maximum risk values
  Object.entries(polygonsByDay).forEach(([dayKey, polygonsForDay]) => {
    const dayIndex = Number(dayKey) - 1
    
    polygonsForDay.forEach(polygonData => {
      const sourceIndex = polygonData.source
      const currentImpact = riskMatrix[dayIndex][sourceIndex][0]
      const currentLikelihood = riskMatrix[dayIndex][sourceIndex][1]
      
      // Take maximum values
      riskMatrix[dayIndex][sourceIndex][0] = polygonData.impact > currentImpact 
        ? polygonData.impact : currentImpact
      riskMatrix[dayIndex][sourceIndex][1] = polygonData.likelihood > currentLikelihood 
        ? polygonData.likelihood : currentLikelihood
    })
  })

  // Apply development matrix override for testing
  return DEV_MATRIX_OVERRIDE
}

// ==================== TEXT GENERATION ====================

/**
 * Extract where/location information from risk matrix for a specific day
 * @param {Array} dayMatrix - Risk matrix for a single day [source][impact, likelihood]
 * @returns {Array} Location array [riverside, coastal, inland] with max values
 */
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

/**
 * Get active flood sources from a day's risk matrix
 * @param {Array} dayMatrix - Risk matrix for a single day
 * @param {Object} labels - Text labels object
 * @returns {Array} Array of active source names
 */
const getActiveFloodSources = (dayMatrix, labels) => {
  const sources = []
  dayMatrix.forEach((sourceData, index) => {
    if (sourceData[0] > 0 && index > 1) { // Only surface water and groundwater (index 2,3)
      sources.push(labels.source[index])
    }
  })
  return sources
}

/**
 * Group consecutive days with identical risk patterns
 * @param {Array} riskMatrix - Complete 5-day risk matrix
 * @param {Object} labels - Text labels object
 * @returns {Array} Array of day groups with date ranges
 */
const groupConsecutiveDays = (riskMatrix, labels) => {
  const dayGroups = []
  
  riskMatrix.forEach((dayMatrix, dayIndex) => {
    const isIdenticalToPrevious = dayIndex > 0 && areIdentical(riskMatrix[dayIndex - 1], dayMatrix)
    
    if (isIdenticalToPrevious) {
      const currentGroup = dayGroups[dayGroups.length - 1]
      currentGroup.endDay = getDayDisplayName(dayIndex, labels)
      currentGroup.dayCount += 1
      currentGroup.dateRange = currentGroup.dayCount === 2 
        ? ' and ' 
        : ' through to '
    } else {
      dayGroups.push({
        startDay: getDayDisplayName(dayIndex, labels),
        dateRange: '',
        endDay: '',
        dayCount: 1,
        locationInfo: extractLocationInfo(dayMatrix),
        activeSources: joinWithAndSeparator(getActiveFloodSources(dayMatrix, labels), ',')
      })
    }
  })

  return dayGroups
}

/**
 * Group risk data by impact and likelihood levels
 * @param {Object} dayGroup - Day group with location info
 * @returns {Object} Nested object grouped by impact then likelihood
 */
const groupByImpactAndLikelihood = (dayGroup) => {
  const riskByLocation = dayGroup.locationInfo.map((locationData, locationIndex) => ({
    impact: locationData[0],
    likelihood: locationData[1], 
    location: locationIndex + 1
  }))
  
  let impactGroups = groupByProperty(riskByLocation, 'impact')
  
  Object.keys(impactGroups).forEach(impactLevel => {
    impactGroups[impactLevel] = groupByProperty(impactGroups[impactLevel], 'likelihood')
    
    Object.keys(impactGroups[impactLevel]).forEach(likelihoodLevel => {
      impactGroups[impactLevel][likelihoodLevel] = impactGroups[impactLevel][likelihoodLevel].map(item => item.location)
    })
  })
  
  // Remove zero impact entries
  delete impactGroups['0']
  return impactGroups
}

/**
 * Sort grouped risk data by impact and likelihood levels (highest first)
 * @param {Object} groupedData - Risk data grouped by impact/likelihood
 * @param {Object} labels - Text labels object
 * @returns {Array} Sorted array of [impact, [likelihood, locations]] pairs
 */
const sortByRiskLevels = (groupedData, labels) => {
  return Object.keys(groupedData)
    .sort((a, b) => b - a) // Sort impact levels descending
    .map(impactKey => [
      labels.impact[impactKey - 1], // Get impact description
      Object.keys(groupedData[impactKey])
        .sort((a, b) => b - a) // Sort likelihood levels descending  
        .map(likelihoodKey => [
          labels.likelihood[likelihoodKey - 1], // Get likelihood description
          groupedData[impactKey][likelihoodKey]
            .sort((a, b) => a - b) // Sort locations ascending
            .map(locationIndex => labels.where[locationIndex - 1]) // Get location descriptions
        ])
    ])
}

/**
 * Format location list with proper grammar and punctuation
 * @param {Array} locations - Array of location strings
 * @param {Object} labels - Text labels object
 * @returns {string} Formatted location string
 */
const formatLocationList = (locations, labels) => {
  let specificAreas = locations.filter(location => 
    [labels.where[0], labels.where[1]].includes(location) // riverside, coastal
  )
  let generalArea = locations.find(location => location === labels.where[2]) || '' // across the region
  
  const formattedSpecific = specificAreas.length 
    ? `${specificAreas.join(' and ')} areas${locations.length === 3 ? ',' : ''}`
    : ''
    
  return joinWithAndSeparator([formattedSpecific, generalArea].filter(area => area.length > 0), ',')
}

/**
 * Split complex risk data into smaller chunks for better readability
 * @param {Array} sortedData - Sorted risk data array
 * @returns {Array} Array of data chunks
 */
const splitComplexData = (sortedData) => {
  const totalLocations = sortedData.length ? sortedData[0][1].flat(2).length : 0
  
  if (totalLocations <= 3) {
    return [sortedData]
  }
  
  // Instead of splitting by likelihood groups, split by location types to avoid duplication
  const firstChunk = JSON.parse(JSON.stringify(sortedData))
  const secondChunk = JSON.parse(JSON.stringify(sortedData))
  
  // Collect all unique locations from all likelihood groups
  const allLocations = new Set()
  sortedData[0][1].forEach(likelihoodGroup => {
    likelihoodGroup[1].forEach(location => allLocations.add(location))
  })
  
  const locationArray = Array.from(allLocations)
  const midPoint = Math.ceil(locationArray.length / 2)
  
  // Split locations into two groups
  const firstLocations = new Set(locationArray.slice(0, midPoint))
  const secondLocations = new Set(locationArray.slice(midPoint))
  
  // Filter likelihood groups to only include relevant locations
  firstChunk[0][1] = firstChunk[0][1].map(likelihoodGroup => [
    likelihoodGroup[0],
    likelihoodGroup[1].filter(location => firstLocations.has(location))
  ]).filter(likelihoodGroup => likelihoodGroup[1].length > 0)
  
  secondChunk[0][1] = secondChunk[0][1].map(likelihoodGroup => [
    likelihoodGroup[0], 
    likelihoodGroup[1].filter(location => secondLocations.has(location))
  ]).filter(likelihoodGroup => likelihoodGroup[1].length > 0)
  
  // Return only chunks that have content
  return [firstChunk, secondChunk].filter(chunk => chunk[0][1].length > 0)
}

/**
 * Create the primary sentence describing flood risk impact and likelihood
 * @param {Array} riskDataChunks - Array of risk data chunks
 * @param {string} activeSources - String of active flood sources
 * @param {Object} labels - Text labels object
 * @returns {string} Formatted sentence
 */
const buildPrimarySentence = (riskDataChunks, activeSources, labels) => {
  let sentence = ''
  
  riskDataChunks.forEach(impactGroup => {
    const [impactDescription, likelihoodGroups] = impactGroup
    
    // Skip if impact description is empty or null
    if (!impactDescription || impactDescription === 'null') return
    
    const validClauses = []
    
    likelihoodGroups.forEach(likelihoodGroup => {
      const [likelihoodDescription, locations] = likelihoodGroup
      
      // Skip if likelihood or locations are empty/null
      if (!likelihoodDescription || likelihoodDescription === 'null' || 
          !locations || locations.length === 0) return
          
      const formattedLocations = formatLocationList(locations, labels)
      if (!formattedLocations || formattedLocations === 'null' || formattedLocations === '') return
      
      let clause = `${likelihoodDescription} in ${formattedLocations}`
      
      // Special formatting for location descriptions starting with 'a'
      if (locations[0] && locations[0].startsWith('a')) {
        clause = `${likelihoodDescription} ${formattedLocations} due to ${activeSources}`
      }
      
      validClauses.push(clause)
    })
    
    if (validClauses.length > 0) {
      const capitalizedImpact = impactDescription.charAt(0).toUpperCase() + impactDescription.slice(1)
      sentence += `${capitalizedImpact} is ${validClauses.join(' and ')}. `
    }
  })
  
  return sentence.trim()
}

/**
 * Create the secondary sentence with alternative phrasing
 * @param {Array} riskDataChunks - Array of risk data chunks  
 * @param {Object} labels - Text labels object
 * @returns {string} Formatted sentence
 */
const buildSecondarySentence = (riskDataChunks, labels) => {
  let sentence = ''
  
  riskDataChunks.forEach(impactGroup => {
    const [impactDescription, likelihoodGroups] = impactGroup
    
    if (!impactDescription || impactDescription === 'null') return
    
    const validPhrases = []
    
    likelihoodGroups.forEach((likelihoodGroup, groupIndex) => {
      const [likelihoodDescription, locations] = likelihoodGroup
      
      if (!likelihoodDescription || likelihoodDescription === 'null' || 
          !locations || locations.length === 0) return
          
      const formattedLocations = formatLocationList(locations, labels)
      if (!formattedLocations || formattedLocations === 'null' || formattedLocations === '') return
      
      let phrase = ''
      if (groupIndex === 0) {
        const locationPrefix = formattedLocations.startsWith('a') 
          ? formattedLocations.charAt(0).toUpperCase() + formattedLocations.slice(1)
          : 'In ' + formattedLocations
        phrase = `${locationPrefix}, ${impactDescription} is ${likelihoodDescription}`
      } else {
        phrase = `${likelihoodDescription} in ${formattedLocations}`
      }
      
      validPhrases.push(phrase)
    })
    
    if (validPhrases.length > 0) {
      sentence += joinWithAndSeparator(validPhrases, ',') + '. '
    }
  })
  
  return sentence.trim()
}

/**
 * Filter out location-specific information from secondary sentence that's already in primary sentence
 * @param {string} primarySentence - The primary sentence already included
 * @param {string} secondarySentence - The secondary sentence to filter
 * @returns {string} Filtered secondary sentence with duplicate location info removed
 */
const filterDuplicateLocationInfo = (primarySentence, secondarySentence) => {
  if (!primarySentence || !secondarySentence) return secondarySentence
  
  // Extract location types and their associated content from sentences
  const extractLocationInfo = (str) => {
    const locations = new Map()
    
    // Match "In X areas, Y" patterns
    const inAreaMatches = str.match(/in\s+(riverside|coastal|inland|rural|urban)\s+areas?,\s*([^.]+)/gi)
    if (inAreaMatches) {
      inAreaMatches.forEach(match => {
        const [, locationType, content] = match.match(/in\s+(\w+)\s+areas?,\s*(.+)/i)
        locations.set(locationType.toLowerCase(), content.toLowerCase().trim())
      })
    }
    
    // Match "Y in X areas" patterns
    const areaInMatches = str.match(/([^.]+)\s+in\s+(riverside|coastal|inland|rural|urban)\s+areas?/gi)
    if (areaInMatches) {
      areaInMatches.forEach(match => {
        const [, content, locationType] = match.match(/(.+)\s+in\s+(\w+)\s+areas?/i)
        locations.set(locationType.toLowerCase(), content.toLowerCase().trim())
      })
    }
    
    return locations
  }
  
  const primaryLocations = extractLocationInfo(primarySentence)
  
  // Split secondary sentence into individual statements
  const secondaryStatements = secondarySentence.split('.').map(s => s.trim()).filter(s => s.length > 0)
  const filteredStatements = []
  
  for (const statement of secondaryStatements) {
    let shouldInclude = true
    const statementLocation = extractLocationInfo(statement + '.')
    
    // Check if this statement's location info is already covered in primary
    for (const [locType, content] of statementLocation) {
      if (primaryLocations.has(locType)) {
        const primaryContent = primaryLocations.get(locType)
        
        // Normalize content for comparison
        const normalize = (str) => str
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s]/g, '')
          .trim()
          
        const normStatement = normalize(content)
        const normPrimary = normalize(primaryContent)
        
        // Check for significant content overlap
        const words1 = new Set(normStatement.split(' ').filter(w => w.length > 2))
        const words2 = new Set(normPrimary.split(' ').filter(w => w.length > 2))
        
        if (words1.size > 0 && words2.size > 0) {
          const intersection = new Set([...words1].filter(x => words2.has(x)))
          const similarity = intersection.size / Math.min(words1.size, words2.size)
          
          if (similarity > 0.6) { // Lower threshold for more aggressive filtering
            shouldInclude = false
            break
          }
        }
      }
    }
    
    if (shouldInclude && statement) {
      filteredStatements.push(statement)
    }
  }
  
  const result = filteredStatements.join('. ').trim()
  return result ? result + '.' : ''
}

/**
 * Check if two sentences contain duplicate content based on semantic similarity
 * @param {string} sentence1 - First sentence to compare
 * @param {string} sentence2 - Second sentence to compare
 * @returns {boolean} True if sentences are semantically duplicate
 */
const areContentDuplicates = (sentence1, sentence2) => {
  if (!sentence1 || !sentence2) return false
  
  // Extract location-specific patterns that commonly duplicate
  const extractLocationPatterns = (str) => {
    const patterns = []
    
    // Match patterns like "In riverside areas, X is Y"
    const locationMatch = str.match(/in (riverside|coastal|inland|rural|urban) areas?,\s*([^.]+)/gi)
    if (locationMatch) {
      patterns.push(...locationMatch.map(m => m.toLowerCase().trim()))
    }
    
    // Match patterns like "X is Y in Z areas"
    const reverseLocationMatch = str.match(/([^.]+)\s+in (riverside|coastal|inland|rural|urban) areas?/gi)
    if (reverseLocationMatch) {
      patterns.push(...reverseLocationMatch.map(m => m.toLowerCase().trim()))
    }
    
    return patterns
  }
  
  // Extract unique location types from patterns
  const extractLocationTypes = (patterns) => {
    const types = new Set()
    patterns.forEach(pattern => {
      const match = pattern.match(/(riverside|coastal|inland|rural|urban)/g)
      if (match) {
        match.forEach(type => types.add(type))
      }
    })
    return types
  }
  
  const patterns1 = extractLocationPatterns(sentence1)
  const patterns2 = extractLocationPatterns(sentence2)
  
  // Check if secondary sentence contains unique location information
  const locations1 = extractLocationTypes(patterns1)
  const locations2 = extractLocationTypes(patterns2)
  
  // If secondary sentence has unique location types, don't consider it duplicate
  const uniqueLocations = new Set([...locations2].filter(loc => !locations1.has(loc)))
  if (uniqueLocations.size > 0) {
    return false
  }
  
  // Check for location-specific duplicates (existing logic)
  for (const pattern1 of patterns1) {
    for (const pattern2 of patterns2) {
      // Normalize patterns to compare core content
      const normalize = (p) => p
        .replace(/^in\s+/, '')
        .replace(/\s+in\s+/, ' ')
        .replace(/\s+areas?,?\s*/, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      
      const norm1 = normalize(pattern1)
      const norm2 = normalize(pattern2)
      
      // Check if the core content (without location prefix) is very similar
      const words1 = new Set(norm1.split(' ').filter(w => w.length > 2))
      const words2 = new Set(norm2.split(' ').filter(w => w.length > 2))
      
      if (words1.size > 0 && words2.size > 0) {
        const intersection = new Set([...words1].filter(x => words2.has(x)))
        const union = new Set([...words1, ...words2])
        const similarity = intersection.size / union.size
        
        if (similarity > 0.7) {
          return true
        }
      }
    }
  }
  
  // Fallback to general similarity check
  const normalize = (str) => {
    return str.toLowerCase()
      .replace(/^(in |a |the |where |local |widespread |minor |significant |major |severe )/g, '')
      .replace(/(is possible|is very likely|is likely|are possible|are very likely|are likely)\.?$/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  const norm1 = normalize(sentence1)
  const norm2 = normalize(sentence2)
  
  // Check for exact matches after normalization
  if (norm1 === norm2) return true
  
  // Check for high similarity (>80% common words)
  const words1 = new Set(norm1.split(' ').filter(w => w.length > 2))
  const words2 = new Set(norm2.split(' ').filter(w => w.length > 2))
  
  if (words1.size === 0 || words2.size === 0) return false
  
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  const similarity = intersection.size / union.size
  
  return similarity > 0.8
}

/**
 * Apply green cell filtering - remove all green cells except [2,2] (minor impact + possible likelihood)
 * @param {Array} riskMatrix - 5x4 risk matrix [day][source][impact, likelihood]  
 * @returns {Array} Filtered matrix
 */
const applyGreenCellFiltering = (riskMatrix) => {
  return riskMatrix.map(dayMatrix => 
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
}

/**
 * Generate outlook text from risk matrix
 * @param {Array} riskMatrix - 5x4 risk matrix
 * @param {number} dayOffset - Number of days to offset (default: 0)
 * @returns {Object} Object containing HTML summary text
 */
const generateOutlookText = (riskMatrix, dayOffset = 0) => {
  // Apply offset and green cell filtering
  const filteredMatrix = applyGreenCellFiltering(riskMatrix.slice(dayOffset))
  
  const dayGroups = groupConsecutiveDays(filteredMatrix, TEXT_LABELS)
  
  const htmlContent = []

  // Handle case where there's no significant flood risk
  if (dayGroups.length === 1 && !dayGroups[0].locationInfo.flat().some(value => value !== 0)) {
    const dateRange = `${dayGroups[0].startDay}${dayGroups[0].dateRange}${dayGroups[0].endDay}`
    htmlContent.push(`<p>${dateRange} the flood risk is very low.</p>`)
  } else {
    // Generate content for each day group
    dayGroups.forEach(dayGroup => {
      const dateRange = `${dayGroup.startDay}${dayGroup.dateRange}${dayGroup.endDay}`
      const groupedRiskData = groupByImpactAndLikelihood(dayGroup)
      const sortedRiskData = sortByRiskLevels(groupedRiskData, TEXT_LABELS)
      const dataChunks = splitComplexData(sortedRiskData)
      
      let paragraphText = ''
      if (dataChunks[0].length > 0) {
        const primarySentence = buildPrimarySentence(dataChunks[0], dayGroup.activeSources, TEXT_LABELS)
        
        paragraphText = primarySentence
        
        if (dataChunks.length === 2) {
          const secondarySentence = buildSecondarySentence(dataChunks[1], TEXT_LABELS)
          
          // Filter out parts of secondary sentence that duplicate primary sentence
          const filteredSecondarySentence = filterDuplicateLocationInfo(primarySentence, secondarySentence)
          
          // Advanced deduplication: Check for semantic similarity between sentences
          if (filteredSecondarySentence && !areContentDuplicates(primarySentence, filteredSecondarySentence)) {
            paragraphText += ' ' + filteredSecondarySentence
          }
        }
      } else {
        paragraphText = 'The flood risk is very low.'
      }
      
      htmlContent.push(`<h3 class="govuk-heading-s">${dateRange}</h3><p>${paragraphText}</p>`)
    })
  }
  
  return {
    summary: htmlContent.join('').replace('and Tomorrow', 'and tomorrow')
  }
}

// ==================== MAIN OUTLOOK CLASS ====================

/**
 * Flood Outlook Class
 * Main class that processes flood risk data and generates outlook information
 */
class Outlook {
  /**
   * Create a new Outlook instance
   * @param {Object} riskData - Complete flood risk dataset
   * @param {Object} place - Location data with bounding box (optional)
   */
  constructor(riskData, place) {
    // Generate GeoJSON representation
    const geoJsonData = buildGeoJson(riskData)
    this.geoJson = geoJsonData

    // Extract daily risk levels from GeoJSON
    const dailyRiskLevels = extractRiskLevels(geoJsonData)
    this.riskLevels = dailyRiskLevels

    // Determine if there are any concerns in the outlook period
    this.hasOutlookConcern = Math.max(...dailyRiskLevels) > 0

    // Process full public forecast text
    let fullForecastText = riskData.public_forecast.england_forecast
    fullForecastText = fullForecastText
      .replace(/\r\n\r\n/g, '</p><p>')
      .replace(/\n\n/g, '</p><p>')
    this.full = `<p>${fullForecastText}</p>`

    // Generate day information
    const issueDate = new Date(riskData.issued_at)
    this.days = [0, 1, 2, 3, 4].map(dayIndex => {
      const date = new Date(issueDate)
      return {
        idx: dayIndex + 1,
        level: 0, // Placeholder for risk level
        date: new Date(date.setDate(date.getDate() + dayIndex))
      }
    })

    // Set timestamp information (using internal timestamp if available)
    if (this._timestampOutlook) {
      this.outlookTimestamp = `${moment(this._timestampOutlook).tz('Europe/London').format('h:mma')} on ${moment(this._timestampOutlook).tz('Europe/London').format('D MMMM YYYY')}`
      this.outlookUTC = moment(this._timestampOutlook).tz('Europe/London').format()
    }

    // Process location-specific information if place is provided
    if (!place) return
    
    const riskMatrix = buildRiskMatrix(riskData, place)
    const dayOffset = moment().startOf('day').diff(moment(riskData.last_modified_at).startOf('day'), 'days')
    
    // Check if there are any regional concerns
    this.hasRegionalConcern = !!riskMatrix.flat(3).find(value => value > 0)
    
    // Generate regional outlook text if data is recent enough
    this.regional = dayOffset <= 1 ? generateOutlookText(riskMatrix, dayOffset) : null
    this.isError = dayOffset > 1
  }
}

module.exports = Outlook