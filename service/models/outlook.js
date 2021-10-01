const turf = require('@turf/turf')

const messageContent = {
  '1-i2-l2': 'Very low risk, impact minor (2), likelihood low (2).',
  '2-i2-l3': 'Low risk, impact minor (2), likelihood medium (3).',
  '2-i2-l4': 'Low risk, impact minor (2), likelihood high (4).',
  '2-i3-l1': 'Low risk, impact significant (3), likelihood very low (1).',
  '2-i3-l2': 'Low risk, impact significant (3), likelihood low (2).',
  '2-i4-l1': 'Low risk, impact severe (4), likelihood very low (1).',
  '3-i3-l3': 'Medium risk, impact significant (3), likelihood medium (3).',
  '3-i3-l4': 'Medium risk, impact significant (3), likelihood high (4).',
  '3-i4-l2': 'Medium risk, impact severe (4), likelihood low (2).',
  '3-i4-l3': 'Medium risk, impact severe (4), likelihood medium (3).',
  '4-i4-l4': 'High risk, impact severe (4), likelihood high (4).'
}

class OutlookGeoJSON {
  constructor (outlook) {
    this.type = 'FeatureCollection'
    this.features = []

    const riskMatrix = [[1, 1, 1, 1], [1, 1, 2, 2], [2, 2, 3, 3], [2, 3, 3, 4]]
    const riskBands = ['Very low', 'Low', 'Medium', 'High']

    if (!outlook || Object.keys(outlook).length === 0) {
      console.error('Outlook FGS error')
      return
    }
    try {
      this.outlookRiskAreas(outlook, riskMatrix, riskBands)
    } catch (err) {
      console.error('Outlook FGS data error: ', err)
      return
    }

    this.features.forEach((feature) => {
      // Convert linestrings to polygons
      if (feature.geometry.type === 'LineString') {
        const buffer = turf.buffer(feature, 1, { units: 'miles' })
        const coordinates = buffer.geometry.coordinates
        feature.geometry.type = 'Polygon'
        feature.geometry.coordinates = coordinates
      }
    })
  }

  outlookRiskAreas (outlook, riskMatrix, riskBands) {
    outlook.risk_areas.forEach(riskArea => {
      riskArea.risk_area_blocks.forEach(riskAreaBlock => {
        let sources = []
        let rImpact = 0
        let rLikelihood = 0
        let sImpact = 0
        let sLikelihood = 0
        let cImpact = 0
        let cLikelihood = 0
        let gImpact = 0
        let gLikelihood = 0
        let rRisk = 0
        let sRisk = 0
        let cRisk = 0
        let gRisk = 0

        if (riskAreaBlock.risk_levels.river) {
          rImpact = riskAreaBlock.risk_levels.river[0]
          rLikelihood = riskAreaBlock.risk_levels.river[1]
          rRisk = riskMatrix[rImpact - 1][rLikelihood - 1]
          sources.push('river')
        }
        if (riskAreaBlock.risk_levels.surface) {
          sImpact = riskAreaBlock.risk_levels.surface[0]
          sLikelihood = riskAreaBlock.risk_levels.surface[1]
          sRisk = riskMatrix[sImpact - 1][sLikelihood - 1]
          sources.push('surface water')
        }
        if (riskAreaBlock.risk_levels.ground) {
          gImpact = riskAreaBlock.risk_levels.ground[0]
          gLikelihood = riskAreaBlock.risk_levels.ground[1]
          gRisk = riskMatrix[gImpact - 1][gLikelihood - 1]
          sources.push('ground water')
        }
        if (riskAreaBlock.risk_levels.coastal) {
          cImpact = riskAreaBlock.risk_levels.coastal[0]
          cLikelihood = riskAreaBlock.risk_levels.coastal[1]
          cRisk = riskMatrix[cImpact - 1][cLikelihood - 1]
          sources.push('coastal')
        }

        const riskLevel = Math.max(rRisk, sRisk, cRisk, gRisk)
        const impactLevel = Math.max(rImpact, sImpact, cImpact, gImpact)
        const likelihoodLevel = Math.max(rLikelihood, sLikelihood, cLikelihood, gLikelihood)

        // Build up sources string and feature name
        sources = sources.length > 1 ? `${sources.slice(0, -1).join(', ')} and ${sources[sources.length - 1]}` : sources

        const featureName = `${riskBands[riskLevel - 1]} risk of ${sources} flooding`

        const rKey = [rRisk, `i${rImpact}`, `l${rLikelihood}`].join('-')
        const sKey = [sRisk, `i${sImpact}`, `l${sLikelihood}`].join('-')
        const cKey = [cRisk, `i${cImpact}`, `l${cLikelihood}`].join('-')
        const gKey = [gRisk, `i${gImpact}`, `l${gLikelihood}`].join('-')

        const messageGroupObj = this.expandSourceDescription(rKey, sKey, cKey, gKey)

        this.generatePolyFeature(riskAreaBlock, featureName, messageGroupObj, riskLevel, impactLevel, likelihoodLevel)
      })
    })
  }

  expandSourceDescription (rKey, sKey, cKey, gKey) {
    const messageGroupObj = {}

    const expandedSource = [
      'overflowing rivers',
      'runoff from rainfall or blocked drains',
      'a high water table',
      'high tides or large waves'
    ]

    const keyArr = [rKey, sKey, cKey, gKey]

    for (const [pos, key] of keyArr.entries()) {
      if (messageGroupObj[key]) {
        messageGroupObj[key].sources.push(expandedSource[pos])
      } else {
        messageGroupObj[key] = { sources: [expandedSource[pos]], message: messageContent[key] }
      }
    }

    for (const [messageId, messageObj] of Object.entries(messageGroupObj)) {
      if (messageObj.sources.length > 1) {
        const lastSource = messageObj.sources.pop()
        messageGroupObj[messageId].sources[0] = `${messageObj.sources.slice(0).join(', ')} and ${lastSource}`
      }
    }

    delete messageGroupObj['0-i0-l0']
    return messageGroupObj
  }

  generatePolyFeature (riskAreaBlock, featureName, messageGroupObj, riskLevel, impactLevel, likelihoodLevel) {
    riskAreaBlock.polys.forEach(poly => {
      const feature = {
        type: 'Feature',
        id: poly.id,
        properties: {
          type: 'concernArea',
          days: riskAreaBlock.days,
          labelPosition: poly.label_position,
          name: featureName,
          message: messageGroupObj,
          'risk-level': riskLevel,
          'z-index': (riskLevel * 10)
        }
      }

      if (poly.poly_type === 'inland') {
        feature.geometry = {
          type: 'Polygon',
          coordinates: poly.coordinates
        }
        feature.properties.polyType = 'inland'
      } else if (poly.poly_type === 'coastal') {
        feature.geometry = {
          type: 'LineString',
          coordinates: poly.coordinates
        }
        feature.properties.polyType = 'coastal'
        // Put coastal areas on top of inland areas
        feature.properties['z-index'] += 1
      }
      if (impactLevel > 1 && !(impactLevel === 2 && likelihoodLevel === 1)) {
        this.features.push(feature)
      }
    })
  }
}

module.exports = OutlookGeoJSON
