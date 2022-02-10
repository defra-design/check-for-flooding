'use strict'
// Chart component

import { area as d3Area, line as d3Line, curveMonotoneX } from 'd3-shape'
import { axisBottom, axisLeft } from 'd3-axis'
import { scaleLinear, scaleTime } from 'd3-scale'
import { timeFormat } from 'd3-time-format'
import { timeDay } from 'd3-time'
import { select, selectAll, pointer } from 'd3-selection'
import { bisector, extent } from 'd3-array'
const { xhr } = window.flood.utils

function LineChart (containerId, stationId, data) {
  const renderChart = () => {
    // Set right margin depending on length of labels
    const numChars = yScale.domain()[1].toString().length
    const margin = { top: 5, bottom: 25, left: 0, right: 12 + (numChars * 9) }

    // Get width and height
    const containerBoundingRect = chart.getBoundingClientRect()
    width = Math.floor(containerBoundingRect.width) - margin.left - margin.right
    height = Math.floor(containerBoundingRect.height) - margin.top - margin.bottom

    // Calculate new xScale and yScales height and width
    xScale.range([0, width])
    yScale.range([height, 0])

    // Draw axis
    const xAxis = axisBottom().tickSizeOuter(0)
    xAxis.scale(xScale).ticks(timeDay).tickFormat((d) => {
      return isMobile ? timeFormat('%-e/%-m')(d) : timeFormat('%a, %e %b')(d)
    })
    yAxis = axisLeft().ticks(5).tickFormat((d) => {
      return parseFloat(d).toFixed(2) + 'm'
    }).tickSizeOuter(0)
    yAxis.scale(yScale)

    // Position axis bottom and right
    svg.select('.x.axis').attr('transform', 'translate(0,' + height + ')').call(xAxis)
    svg.select('.y.axis').attr('transform', 'translate(' + width + ', 0)').call(yAxis)
    svg.selectAll('.x.axis text').attr('y', 12)
    clipText.attr('width', width).attr('height', height)

    // Position y ticks
    svg.select('.y.axis').style('text-anchor', 'start')
    svg.selectAll('.y.axis .tick line').attr('x2', 6)
    svg.selectAll('.y.axis .tick text').attr('x', 9)

    // Update grid lines
    svg.select('.x.grid')
      .attr('transform', 'translate(0,' + height + ')')
      .call(axisBottom(xScale)
        .ticks(timeDay)
        .tickSize(-height, 0, 0)
        .tickFormat('')
      )
    svg.select('.y.grid')
      .attr('transform', 'translate(0,' + 0 + ')')
      .call(axisLeft(yScale)
        .ticks(5)
        .tickSize(-width, 0, 0)
        .tickFormat('')
      )

    // Update time line
    const timeX = Math.floor(xScale(new Date()))
    svg.select('.time-line').attr('y1', 0).attr('y2', height)
    timeLine.attr('y1', 0).attr('y2', height).attr('transform', 'translate(' + timeX + ',0)')
    timeLabel.attr('y', height + 12).attr('transform', 'translate(' + timeX + ',0)').attr('dy', '0.71em')

    // X Axis time label
    timeLabel.text(timeFormat('%-I:%M%p')(new Date()).toLowerCase())

    // Add height to locator line
    svg.select('.locator-line').attr('y1', 0).attr('y2', height)

    // Draw lines and areas
    if (data.observed.length) {
      observedArea.datum(observedPoints).attr('d', area)
      observedLine.datum(observedPoints).attr('d', line)
    }
    if (data.observed.length) {
      forecastArea.datum(forecastPoints).attr('d', area)
      forecastLine.datum(forecastPoints).attr('d', line)
    }

    // Update locator position
    locator.attr('transform', 'translate(' + locatorX + ',' + 0 + ')')
    locator.select('.locator-point').attr('transform', 'translate(' + 0 + ',' + locatorY + ')')

    // Hide x axis labels that overlap with time now label
    const timeNowX = timeLabel.node().getBoundingClientRect().left
    const timeNowWidth = timeLabel.node().getBoundingClientRect().width
    const ticks = selectAll('.x .tick')
    ticks.each((d, i, n) => {
      const tick = n[i]
      const tickX = tick.getBoundingClientRect().left
      const tickWidth = tick.getBoundingClientRect().width
      const isOverlap = (tickX + tickWidth + 5) > timeNowX && tickX <= (timeNowX + timeNowWidth + 5)
      select(tick).classed('tick--hidden', isOverlap)
    })
  }

  const renderThresholds = () => {
    if (!thresholds) return
    // Empty thresholds container
    thresholdsContainer.selectAll('*').remove()
    // Add thresholds
    thresholds.forEach(threshold => {
      const thresholdContainer = thresholdsContainer.append('g').attr('class', 'threshold  threshold--' + threshold.id)
      thresholdContainer.attr('data-id', threshold.id)
      thresholdContainer.classed('threshold--selected', !!threshold.isSelected)
      const bg = thresholdContainer.append('rect').attr('class', 'threshold__bg').attr('x', 0).attr('y', -4).attr('height', 8)
      const line = thresholdContainer.append('line').attr('class', 'threshold__line')
      const label = thresholdContainer.append('g').attr('class', 'threshold-label')
      const labelBgPath = label.append('path').attr('class', 'threshold-label__bg')
      const text = label.append('text').attr('class', 'threshold-label__text').text(threshold.name)
      const remove = label.append('g').attr('class', 'threshold__remove')
      remove.append('rect').attr('x', -6).attr('y', -6).attr('width', 20).attr('height', 20)
      remove.append('line').attr('x1', -0.5).attr('y1', -0.5).attr('x2', 7.5).attr('y2', 7.5)
      remove.append('line').attr('x1', 7.5).attr('y1', -0.5).attr('x2', -0.5).attr('y2', 7.5)
      // Set individual elements size and position
      const textWidth = text.node().getBBox().width
      labelBgPath.attr('d', 'm-0.5,-0.5 l' + Math.round(textWidth + 40) + ',0 l0,36 l-' + (Math.round(textWidth + 40) - 50) + ',0 l-7.5,7.5 l-7.5,-7.5 l-35,0 l0,-36 l0,0')
      text.attr('x', 10).attr('y', 22)
      remove.attr('transform', 'translate(' + Math.round(textWidth + 20) + ',' + 14 + ')')
      const labelX = Math.round(width / 8)
      label.attr('transform', 'translate(' + labelX + ',' + -46 + ')')
      thresholdContainer.attr('transform', 'translate(0,' + Math.round(yScale(threshold.level)) + ')')
      bg.attr('width', xScale(xExtent[1]))
      line.attr('x2', xScale(xExtent[1])).attr('y2', 0)
    })
  }

  const updateToolTipBackground = () => {
    // Set Background size
    const bg = toolTip.select('rect')
    const text = toolTip.select('text')
    // const textWidth = text.node().getBBox().width
    const textHeight = Math.round(text.node().getBBox().height)
    bg.attr('height', textHeight + 23)
    const toolTipWidth = bg.node().getBBox().width
    const toolTipHeight = bg.node().getBBox().height
    // Set background left or right position
    const containerWidth = xScale(xExtent[1])
    if (toolTipX >= containerWidth - (toolTipWidth + 10)) {
      // On the left
      toolTipX -= (toolTipWidth + 10)
    } else {
      // On the right
      toolTipX += 10
    }
    // Set background above or below position
    if (toolTipY >= toolTipHeight + 10) {
      toolTipY -= toolTipHeight + 10
    } else {
      toolTipY += 10
    }
    toolTipX = toolTipX.toFixed(0)
    toolTipY = toolTipY.toFixed(0)
  }

  const updateLocator = () => {
    dataPointLocator = dataPoint // Set locator position
    locatorX = Math.floor(xScale(new Date(dataPointLocator.dateTime)))
    locatorY = Math.floor(yScale(dataPointLocator.value))
    const latestX = Math.floor(xScale(new Date(dataPointLatest.dateTime)))
    locator.attr('class', 'locator--offset')
    locator.classed('locator--forecast', locatorX > latestX)
    locator.attr('transform', 'translate(' + locatorX + ',' + 0 + ')')
    locator.select('.locator-point').attr('transform', 'translate(' + 0 + ',' + locatorY + ')')
  }

  const showTooltip = (e) => {
    // Remove existing content
    toolTip.select('text').selectAll('*').remove()
    const mouseDate = xScale.invert(pointer(e)[0])
    const bisectDate = bisector((d) => { return new Date(d.dateTime) }).left
    const i = bisectDate(lines, mouseDate, 1) // returns the index to the current data item
    const d0 = lines[i - 1]
    const d1 = lines[i] || lines[i - 1]
    // Determine which date value is closest to the mouse
    const d = mouseDate - new Date(d0.dateTime) > new Date(d1.dateTime) - mouseDate ? d1 : d0
    dataPoint.dateTime = d.dateTime
    dataPoint.value = d.value
    toolTipX = xScale(new Date(dataPoint.dateTime))
    toolTipY = pointer(e)[1]
    toolTip.select('text').append('tspan')
      .attr('class', 'tool-tip-text__strong').attr('dy', '0.5em')
      .text(Number(dataPoint.value).toFixed(2) + 'm')
    toolTip.select('text').append('tspan')
      .attr('x', 12).attr('dy', '1.4em')
      .text(`${timeFormat('%-I:%M%p')(new Date(dataPoint.dateTime)).toLowerCase()}, ${timeFormat('%e %b')(new Date(dataPoint.dateTime))}`)
    // Update tooltip left/right background
    updateToolTipBackground()
    // Update tooltip location
    toolTip.attr('transform', 'translate(' + toolTipX + ',' + toolTipY + ')')
    toolTip.classed('tool-tip--visible', true)
  }

  const hideTooltip = () => {
    toolTip.classed('tool-tip--visible', false)
  }

  const resetLocator = () => {
    // Update locator location
    locatorX = Math.floor(xScale(new Date(dataPointLatest.dateTime)))
    locatorY = Math.floor(yScale(dataPointLatest.value))
    locator.classed('locator--offset', false)
    locator.classed('locator--forecast', false)
    locator.attr('transform', 'translate(' + locatorX + ',' + 0 + ')')
    locator.select('.locator-point').attr('transform', 'translate(' + 0 + ',' + locatorY + ')')
    // Reset locator marker to latest
    dataPointLocator = dataPointLatest
  }

  const updateAxisY = () => {
    // Extend or reduce y extent
    const maxThreshold = Math.max.apply(Math, thresholds.map((x) => { return x.level }))
    const minThreshold = Math.min.apply(Math, thresholds.map((x) => { return x.level }))
    const maxData = Math.max(maxThreshold, yExtentDataMax)
    const minData = Math.min(minThreshold, yExtentDataMin)
    let range = maxData - minData
    range = range < 1 ? 1 : range
    // Add 1/3rd or range above and below, capped at zero for non-negative ranges
    const yRangeUpperBuffered = (maxData + (range / 3)).toFixed(2)
    const yRangeLowerBuffered = (minData - (range / 3)).toFixed(2)
    yExtent[1] = yExtentDataMax <= yRangeUpperBuffered ? yRangeUpperBuffered : yExtentDataMax
    yExtent[0] = data.type === 'river' ? (yRangeLowerBuffered < 0 ? 0 : yRangeLowerBuffered) : yRangeLowerBuffered
    // Update y scale
    yScale = scaleLinear().domain(yExtent).nice()
    yScale.range([height, 0])
    // Update y axis
    yAxis = axisLeft()
    yAxis.ticks(5).tickFormat((d) => { return parseFloat(d).toFixed(2) + 'm' }).tickSizeOuter(0)
    yAxis.scale(yScale)
  }

  const addThreshold = (threshold) => {
    // Update thresholds array
    thresholds = thresholds.filter((x) => { return x.id !== threshold.id })
    thresholds.forEach(x => { x.isSelected = false })
    threshold.isSelected = true
    thresholds.push(threshold)
    updateAxisY()
    // Re-render
    resetLocator()
    renderChart()
    renderThresholds()
  }

  const removeThreshold = (id) => {
    // Update thresholds array
    thresholds = thresholds.filter((x) => { return x.id !== id })
    updateAxisY()
    // Re-render
    updateLocator()
    renderChart()
    renderThresholds()
  }

  const getDataPage = (start, end) => {
    dataStart = new Date(dataCache.dataStartDateTime)
    const cacheStart = new Date(dataCache.cacheStartDateTime)
    const cacheEnd = new Date(dataCache.cacheEndDateTime)
    const pageStart = new Date(start)
    const pageEnd = new Date(end)
    // If page dates are outside cache range then load another data cache
    if (pageStart.getTime() < cacheStart.getTime() || pageEnd.getTime() > cacheEnd.getTime()) {
      // Rebuild the cache when we have more data
      // Set cache start and end
      // Set page start and end
      // Load new data and reinitialise the chart
      // New XMLHttp request
      return
    }

    // Setup array to combine observed and forecast points and identify startPoint for locator
    if (data.observed.length) {
      const errorFilter = l => !l.err
      const errorAndNegativeFilter = l => errorFilter(l) && l.value >= 0
      const filterNegativeValues = ['groundwater', 'tide'].includes(data.type) ? errorFilter : errorAndNegativeFilter
      lines = data.observed.filter(filterNegativeValues).map(l => ({ ...l, type: 'observed' })).reverse()
      dataPoint = lines[lines.length - 1] || null
    }
    if (data.forecast.length) {
      lines = lines.concat(data.forecast.map(l => ({ ...l, type: 'forecast' })))
    }

    // Get reference to oberved and forecast sections
    observedPoints = lines.filter(l => l.type === 'observed')
    forecastPoints = lines.filter(l => l.type === 'forecast')

    // Create area generator
    area = d3Area().curve(curveMonotoneX)
      .x((d) => { return xScale(new Date(d.dateTime)) })
      .y0((d) => { return height })
      .y1((d) => { return yScale(d.value) })

    // Create line generator
    line = d3Line().curve(curveMonotoneX)
      .x((d) => { return xScale(new Date(d.dateTime)) })
      .y((d) => { return yScale(d.value) })

    // Set dataPointLatest
    dataPointLatest = dataPoint
    dataPointLocator = dataPointLatest

    // Note: xExtent uses observed and forecast data rather than lines for the scenario where river levels
    // start or end as -ve since we still need to determine the datetime span of the graph even if the
    // values are excluded from plotting by virtue of being -ve

    // Set x scale extent
    xExtent = extent(data.observed.concat(data.forecast), (d, i) => { return new Date(d.dateTime) })
    // Increase x extent by 5% from now value
    let date = new Date()
    const percentile = Math.round(Math.abs(xExtent[0] - date) * 0.05)
    date = new Date(Number(date) + Number(percentile))
    const xRange = [xExtent[0], xExtent[1]]
    xRange.push(date)
    xExtent[0] = Math.min.apply(Math, xRange)
    xExtent[1] = Math.max.apply(Math, xRange)
    // Set x input domain
    xScaleInitial = scaleTime().domain(xExtent)
    xScaleInitial.range([0, width])
    xScale = scaleTime().domain(xExtent)

    // Set y scale extent
    yExtent = extent(lines, (d, i) => { return d.value })
    // Adjust y extent to highest and lowest values from the data
    yExtent[0] = Math.min.apply(Math, yExtent)
    yExtent[1] = Math.max.apply(Math, yExtent)
    // Reference to intial y extent min and max used when removing thresholds
    yExtentDataMin = yExtent[0]
    yExtentDataMax = yExtent[1]
    // Add 1/3rd or range above and below, capped at zero for non-negative ranges
    let yRange = yExtent[1] - yExtent[0]
    yRange = yRange < 1 ? 1 : yRange // make range minimum 1m to stop zigzag
    const yRangeUpperBuffer = (yExtent[1] + (yRange / 3)).toFixed(2)
    const yRangeLowerBuffer = (yExtent[0] - (yRange / 3)).toFixed(2)
    yExtent[0] = data.type === 'river' ? (yRangeLowerBuffer < 0 ? 0 : yRangeLowerBuffer) : yRangeLowerBuffer
    yExtent[1] = yRangeUpperBuffer
    yScale = scaleLinear().domain(yExtent).nice()
  }

  const initChart = () => {
    // Get page data
    getDataPage(pageStart, pageEnd)
    // Render chart
    renderChart()
  }

  //
  // Setup
  //

  const chart = document.getElementById(containerId)

  // Create chart container elements
  const svg = select(`#${containerId}`).append('svg')
    .attr('aria-label', 'Bar chart')
    .attr('aria-describedby', 'bar-chart-description')
    .attr('focusable', 'false')

  // Clip path to visually hide text
  const clipText = svg.append('defs').append('clipPath').attr('id', 'clip-text').append('rect').attr('x', 0).attr('y', 0)

  // Add grid containers
  svg.append('g').attr('class', 'y grid')
  svg.append('g').attr('class', 'x grid')
  svg.append('g').attr('class', 'x axis')
  svg.append('g').attr('class', 'y axis').style('text-anchor', 'start')

  // Add containers for observed and forecast lines
  const inner = svg.append('g').attr('clip-path', 'url(#clip-text)')
  inner.append('g').attr('class', 'observed observed-focus')
  inner.append('g').attr('class', 'forecast')
  const observedArea = inner.select('.observed').append('path').attr('class', 'observed-area')
  const observedLine = inner.select('.observed').append('path').attr('class', 'observed-line')
  const forecastArea = inner.select('.forecast').append('path').attr('class', 'forecast-area')
  const forecastLine = inner.select('.forecast').append('path').attr('class', 'forecast-line')

  // Add timeline
  const timeLine = svg.append('line').attr('class', 'time-line')
  const timeLabel = svg.append('text').attr('class', 'time-now-text').attr('x', -26)

  // Add locator
  const locator = inner.append('g').attr('class', 'locator')
  locator.append('line').attr('class', 'locator-line')
  locator.append('circle').attr('r', 4.5).attr('class', 'locator-point')

  // Add thresholds group
  const thresholdsContainer = inner.append('g').attr('class', 'thresholds')

  // Add tooltip container
  const toolTip = inner.append('g').attr('class', 'tool-tip')
  toolTip.append('rect').attr('class', 'tool-tip-bg').attr('width', 147)
  toolTip.append('text').attr('class', 'tool-tip-text').attr('x', 12).attr('y', 20)

  // Define globals
  let isMobile, interfaceType
  let dataStart, dataPage, dataPoint, dataPointLocator, dataPointLatest
  let width, height, xScaleInitial, xScale, yScale, xExtent, yAxis, yExtent, yExtentDataMin, yExtentDataMax
  let lines, area, line, observedPoints, forecastPoints
  let locatorX, locatorY, toolTipX, toolTipY
  let thresholds

  // Create a mobile width media query
  const mobileMediaQuery = window.matchMedia('(max-width: 640px)')

  // Default page size is 5 days
  let pageStart = new Date()
  let pageEnd = new Date()
  pageStart.setHours(pageStart.getHours() - (5 * 24))
  pageStart = pageStart.toISOString().replace(/.\d+Z$/g, 'Z')
  pageEnd = pageEnd.toISOString().replace(/.\d+Z$/g, 'Z')

  // XMLHttpRequest to get data if hasn't already been passed through
  let dataCache = data
  if (dataCache) {
    initChart()
  } else {
    const cacheStart = pageStart
    const cacheEnd = pageEnd
    xhr(`/service/telemetry/${stationId}/${cacheStart}/${cacheEnd}`, (err, response) => {
      if (err) {
        console.log('Error: ' + err)
      } else {
        dataCache = response
        initChart()
      }
    }, 'json')
  }

  renderChart()

  //
  // Public methods
  //

  this.removeThreshold = (id) => {
    removeThreshold(id)
  }

  this.addThreshold = (threshold) => {
    addThreshold(threshold)
  }

  this.chart = chart

  //
  // Events
  //

  mobileMediaQuery.addEventListener('change', (e) => {
    isMobile = e.matches
    hideTooltip()
    updateLocator()
    renderChart()
    renderThresholds()
  })

  window.addEventListener('resize', () => {
    hideTooltip()
    updateLocator()
    renderChart()
    renderThresholds()
  })

  svg.on('click', (e) => {
    if (e.target.closest('.threshold')) return
    updateLocator()
    showTooltip(e)
  })

  svg.on('mousemove', (e) => {
    if (e.target.closest('.threshold')) return
    updateLocator()
    showTooltip(e)
  })

  svg.on('mouseleave', (e) => {
    hideTooltip()
    resetLocator()
  })

  thresholdsContainer.on('click', (e) => {
    e.stopPropagation()
    const thresholdContainer = e.target.closest('.threshold')
    if (e.target.closest('.threshold__remove')) {
      removeThreshold(thresholdContainer.getAttribute('data-id'))
    } else if (thresholdContainer) {
      const threshold = thresholds.find((x) => { return x.id === thresholdContainer.getAttribute('data-id') })
      addThreshold(threshold)
    }
  })

  thresholdsContainer.on('mouseover', (e) => {
    if (e.target.closest('.threshold')) hideTooltip()
  })
}

window.flood.charts = {
  createLineChart: (containerId, stationId, data) => {
    return new LineChart(containerId, stationId, data)
  }
}
