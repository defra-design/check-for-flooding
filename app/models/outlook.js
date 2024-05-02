const turf = require('@turf/turf')
const moment = require('moment-timezone')

const buildGeoJsonFeatures = (data, riskMatrix, riskBands) => {
  let features = []

  data.risk_areas.forEach(riskArea => {
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
        sources.push('surface')
      }

      if (riskAreaBlock.risk_levels.ground) {
        gImpact = riskAreaBlock.risk_levels.ground[0]
        gLikelihood = riskAreaBlock.risk_levels.ground[1]
        gRisk = riskMatrix[gImpact - 1][gLikelihood - 1]
        sources.push('ground')
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
      const featureName = `${riskBands[riskLevel - 1]} risk of ${sources} flooding`

      riskAreaBlock.polys.forEach(poly => {
        const feature = {
          type: 'Feature',
          id: poly.id,
          properties: {
            type: 'concernArea',
            days: riskAreaBlock.days,
            labelPosition: poly.label_position,
            name: featureName,
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
          features.push(feature)
        }
      })
    })
  })

  return features
}

const getRiskLevels = (geojson) => {
  const levels = [0, 0, 0, 0, 0]

  for (let i = 0; i < geojson.features.length; i++ ) {
    const feature = geojson.features[i]
    for (let j = 0; j < feature.properties.days.length; j++ ) {
      const day = feature.properties.days[j]
      const level = levels[day - 1]
      const newLevel = feature.properties['risk-level']
      levels[day - 1] = newLevel > level ? newLevel : level
    }
  }

  return levels
}

const buildGeoJson = (data) => {
  const riskMatrix = [[1, 1, 1, 1], [1, 1, 2, 2], [2, 2, 3, 3], [2, 3, 3, 4]]
  const riskBands = ['Very low', 'Low', 'Medium', 'High']

  const features = buildGeoJsonFeatures(data, riskMatrix, riskBands)
  
  const geoJson = {
    type: 'FeatureCollection',
    features: features
  }

  return geoJson
}

const buildMatrix = (data, place) => {
  let polys = []

  const locationCoords = turf.polygon([[
    [place.bbox2k[0], place.bbox2k[1]],
    [place.bbox2k[0], place.bbox2k[3]],
    [place.bbox2k[2], place.bbox2k[3]],
    [place.bbox2k[2], place.bbox2k[1]],
    [place.bbox2k[0], place.bbox2k[1]]
  ]])

  data.risk_areas.forEach(riskArea => {
    riskArea.risk_area_blocks.forEach(riskAreaBlock => {
      riskAreaBlock.polys.forEach(poly => {
        // if linestring ( i.e. coastal ) add buffer and change geometry for use with turf
        if (poly.poly_type === 'coastal') {
          const feature = {
            type: 'Feature',
            properties: { polyType: 'coastal' },
            geometry: {
              type: 'LineString',
              coordinates: poly.coordinates
            }
          }

          const buffer = turf.buffer(feature, 1, { units: 'miles' })
          const coordinates = buffer.geometry.coordinates
          feature.geometry.type = 'Polygon'
          feature.geometry.coordinates = coordinates
          poly.coordinates = coordinates
        }

        // test if poly intersects
        const polyCoords = turf.polygon(poly.coordinates)

        const intersection = turf.intersect(polyCoords, locationCoords)

        // build array of polys that intersect
        if (intersection) {
          const riskLevels = riskAreaBlock.risk_levels

          riskAreaBlock.days.forEach(day => {
            Object.keys(riskLevels).forEach(key => {
              const impact = riskLevels[key][0]
              const likelihood = riskLevels[key][1]
              const source = ['river', 'coastal', 'surface', 'ground'].findIndex(k => k === key)
              polys.push({ impact, likelihood, day, source })
            })
          })
        }
      })
    })
  })

  // Group polygons by day
  polys = polys.reduce((groups, item) => ({
    ...groups, [item.day]: [...(groups[item.day] || []), item]
  }), {})

  // Build output
  const matrix = [
    [[0,0],[0,0],[0,0],[0,0]],
    [[0,0],[0,0],[0,0],[0,0]],
    [[0,0],[0,0],[0,0],[0,0]],
    [[0,0],[0,0],[0,0],[0,0]],
    [[0,0],[0,0],[0,0],[0,0]]
  ]

  for (const [key, value] of Object.entries(polys)) {
    for (let poly of value) {
      const impact = matrix[Number(key) -1][poly.source][0]
      matrix[Number(key) -1][poly.source][0] = poly.impact > impact ? poly.impact : impact
      const likelihood = matrix[Number(key) -1][poly.source][1]
      matrix[Number(key) -1][poly.source][1] = poly.likelihood > likelihood ? poly.likelihood : likelihood
    }
  }

  return matrix
}

const createText = (matrix, offset = 0) => {
  const m = matrix.slice(offset)

  const l = {
    day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    likelihood: ['possible but not expected', 'possible', 'likely', 'expected'],
    impact: ['flooding of low-lying land', 'isolated property flooding', 'property flooding and travel disruption', 'severe flooding and travel disruption'],
    where: ['riverside', 'coastal', 'across the region'],
    source: ['river', 'sea', 'surface water', 'groundwater']
  }

  const day = (n, l) => {
    const d = (new Date()).getDay() === 0 ? 6 : (new Date()).getDay() - 1
    return n === 0
      ? 'Today'
      : n === 1
      ? 'Tomorrow'
      : l.day[d + n > 6 ? d + n - 7 : d + n]
  }

  const where = (m) => {
    return [m[0], m[1], [
      Math.max(m[2][0], m[3][0]),
      Math.max(m[2][1], m[3][1])
    ]]
  }

  const source = (m, l) => {
    const sources = []
    for (let i = 0; i < m.length; i++ ) {
      m[i][0] > 0 && i > 1 ? sources.push(l.source[i]) : null
    }
    return sources
  }

  const isSame = (a, b) => {
    return JSON.stringify(a) === JSON.stringify(b)
  }

  const groupBy = (objectArray, property) => {
    return objectArray.reduce((acc, obj) => {
      if (!acc[obj[property]])
        acc[obj[property]] = []
      acc[obj[property]].push(obj)
      return acc
    }, {})
  }

  const joinList = (a, s) => {
    // const p = new RegExp(s + '(?=[^'+ s + ']+$)') // /;(?=[^;]+$)/
    const p = new RegExp(';(?=[^;]+$)') // /;(?=[^;]+$)/
    return a.join('; ').replace(p, ' and').replace(';', s)
  }

  const listWhere = (a, l) => {
    let s = a.filter(a => [l.where[0], l.where[1]].includes(a))
    let r = a.find(a => a === l.where[2]) || ''
    s = s.length ? `${s.join(' and ')} areas${a.length === 3 ? ',' : ''}` : ''
    return joinList([s, r].filter(w => w.length > 0), ',')
  }

  const splitData = (a) => {
    const l = a.length ? a[0][1].flat(2).length : 0
    if (l <= 4) return [a]
    const f = JSON.parse(JSON.stringify(a))
    f[0][1] = f[0][1].slice(0, 1)
    const s = JSON.parse(JSON.stringify(a))
    s[0][1] = s[0][1].splice(1)
    return [f, s]
  }

  const groupByMatrix = (m, l) => {
    const groups = []
    for (let i = 0; i < m.length; i++ ) {
      if (i > 0 && isSame(m[i-1], m[i])) {
        const g = groups[groups.length - 1]
        g.end = day(i, l)
        g.length += 1
        g.join = g.length === 2 ? ' and ' : ' through to '
      } else {
        groups.push({
          start: day(i, l),
          join: '',
          end: '',
          length: 1,
          where: where(m[i]),
          source: joinList(source(m[i], l), ',')
        })
      }
    }

    return groups
  }

  const groupByImpactLikelihood = (g) => {
    const matrix = g.where.map((m, i) => ({
      impact: m[0],
      likelihood: m[1],
      where: i + 1
    }))
    let group = groupBy(matrix, 'impact')
    for (let i in group) {
      group[i] = groupBy(group[i], 'likelihood')
      for (let l in group[i]) {
        for (let v in group[i][l]) {
          group[i][l][v] = group[i][l][v].where
        }
      }
    }
    delete group['0']
    return group
  }

  const sortArray = (g, l) => {
    return Object.keys(g).sort().reverse().map(a => (
      [l.impact[a-1], Object.keys(g[a]).sort().reverse().map(b => (
        [l.likelihood[b-1], g[a][b].sort().map(c => (
          l.where[c-1]
        )
      )]))
    ]))
  }

  const createFirstSentence = (data, source, l) => {
    let sentence = ''
    for (let i = 0; i < data.length; i++ ) {
      const g = data[i]
      sentence += `${g[0].charAt(0).toUpperCase() + g[0].slice(1)} is `
      for (let j = 0; j < g[1].length; j++ ) {
        const d = data[i][1][j]
        const w = listWhere(d[1], l)
        //g[0]: impact, d[0]: liklihood, w: loation 
        sentence += `${j > 0 ? 'and ' : ''}${d[0]}${d[1][0].startsWith('a') ? ' ' : ' in '}${w}${d[1][0].startsWith('a') ? ' due to ' + source : ''}${g[1].length <= 1 ? '. ' : ' '}`
      }
    }
    return sentence.trim()
  }

  const createSecondSentence = (data, l) => {
    let sentence = ''
    for (let i = 0; i < data.length; i++ ) {
      const g = data[i]
      const p = []
      for (let j = 0; j < g[1].length; j++ ) {
        const d = data[i][1][j]
        const w = listWhere(d[1], l)
        p.push(`${j === 0 ? (w.startsWith('a') ? w.charAt(0).toUpperCase() + w.slice(1) : 'In ' + w) + ', ' + g[0] + ' is ' + d[0] : d[0] + ' in ' + w}`)
      }
      sentence += joinList(p, ',')
    }
    return sentence.trim()
  }

  const groups = groupByMatrix(m, l)
  const html = []

  for (let i = 0; i < groups.length; i++ ) {
    const date = `${groups[i].start}${groups[i].join}${groups[i].end}` 
    const group = groupByImpactLikelihood(groups[i], l)
    const data = sortArray(group, l)
    const split = splitData(data)
    let p = split[0].length ? createFirstSentence(split[0], groups[i].source, l) + (split.length === 2 ? ' ' + createSecondSentence(split[1], l) : '') : 'The flood risk is very low' 
    html.push(`<h3 class="govuk-heading-s">${date}</h3><p>${p}</p>`)
    html.push((i === 0 && groups.length > 1) ? '<p><a href="#">Show more</a></p>' : '')
  }
  
  return html.join('')
}

class Outlook {
  constructor (data, place) {
    const geojson = buildGeoJson(data)
    this.geoJson = geojson

    const riskLevels = getRiskLevels(geojson)
    this.riskLevels = riskLevels

    this.hasOutlookConcern = Math.max(...riskLevels) > 0

    this.full = data.public_forecast.england_forecast

    const issueDate = new Date(data.issued_at)

    this.days = [0, 1, 2, 3, 4].map(i => {
      const date = new Date(issueDate)
      return {
        idx: i + 1,
        level: 0, // this._riskLevels[i],
        date: new Date(date.setDate(date.getDate() + i))
      }
    })

    this.outlookTimestamp = `${moment(this._timestampOutlook).tz('Europe/London').format('h:mma')} on ${moment(this._timestampOutlook).tz('Europe/London').format('D MMMM YYYY')}`
    this.outlookUTC = moment(this._timestampOutlook).tz('Europe/London').format()

    if (!place) return
    const matrix = buildMatrix(data, place)
    this.regionalSummary = createText(matrix)
  }
}
module.exports = Outlook