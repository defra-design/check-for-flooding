// https://gist.github.com/msbarry/9152218

// DL: Refactored from class/method to functions for ie11 compatibility

const sqr = (x) => {
  return x * x
}

const distSquared = (p1, p2) => {
  return sqr(p1[0] - p2[0]) + sqr(p1[1] - p2[1])
}

const getRatio = (point, p1, p2) => {
  const segmentLength = distSquared(p1, p2)
  if (segmentLength === 0) {
    return distSquared(point, p1)
  }
  return ((point[0] - p1[0]) * (p2[0] - p1[0]) +
      (point[1] - p1[1]) * (p2[1] - p1[1])) / segmentLength
}

const distanceToSquared = (point, p1, p2) => {
  const t = getRatio(point, p1, p2)
  if (t < 0) {
    return distSquared(point, p1)
  }
  if (t > 1) {
    return distSquared(point, p2)
  }
  return distSquared(point, [
    p1[0] + t * (p2[0] - p1[0]),
    p1[1] + t * (p2[1] - p1[1])
  ])
}

// Not used
// const distanceTo = (point, p1, p2) => {
//   return Math.sqrt(distanceToSquared(point, p1, p2))
// }

window.flood.utils.simplify = (points, factor) => {
  points = points.map(obj => ({ ...obj, timestamp: parseInt((new Date(obj.dateTime)).getTime()) }))
  const optimalPoints = Math.ceil(points.length / factor)
  const pointsToKeep = optimalPoints > 2 ? optimalPoints : 2
  const weights = []
  const len = points.length
  const douglasPeucker = (start, end) => {
    if (end > start + 1) {
      const p1 = [points[start].timestamp, points[start].value]
      const p2 = [points[end].timestamp, points[end].value]
      let maxDist = -1
      let maxDistIndex = 0
      let dist
      // find point furthest off the line from start to end
      for (var i = start + 1; i < end; i += 1) {
        // dist = line.distanceToSquared([points[i].timestamp, points[i].value])
        const point = [points[i].timestamp, points[i].value]
        dist = distanceToSquared(point, p1, p2)
        if (dist > maxDist) {
          maxDist = dist
          maxDistIndex = i
        }
      }
      // record the weight of this point
      weights[maxDistIndex] = maxDist
      // split the segment at that furthest point, and recursively invoke
      // this method to assign weights to each point in the subsegments
      douglasPeucker(start, maxDistIndex)
      douglasPeucker(maxDistIndex, end)
    }
  }
  douglasPeucker(0, len - 1)
  weights[0] = Infinity
  weights[len - 1] = Infinity
  // create descending weight array so to get n most important weights,
  // just find all points with weights >= weightsDescending[n]
  const weightsDescending = weights.slice()
  weightsDescending.sort((a, b) => {
    return b - a
  })
  const maxTolerance = weightsDescending[pointsToKeep - 1]
  // const result = points.filter((d, i) => {
  //   return weights[i] >= maxTolerance
  // })
  const result = points.map((obj, i) => ({
    dateTime: obj.dateTime,
    value: obj.value,
    isSignificant: weights[i] >= maxTolerance
  }))
  // console.log(points.length + ' > ' + result.length)
  // console.log(points.length, result.filter(d => d.isSignificant).length)
  return result
}
