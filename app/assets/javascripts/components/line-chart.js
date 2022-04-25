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

function LineChart (containerId, stationId, data, options = {}) {
  const renderChart = () => {
    // Set scales
    setScaleX()
    setScaleY()

    // Set right margin depending on length of labels
    // const numChars = yScale.domain()[1].toFixed(2).length - 1
    const numChars = yScale.domain()[1].toFixed(1).length - 2
    const margin = { top: 5, bottom: 45, left: 0, right: (isMobile ? 16 : 21) + (numChars * 9) }

    // Get width and height
    const containerBoundingRect = chart.getBoundingClientRect()
    width = Math.floor(containerBoundingRect.width) - margin.left - margin.right
    height = Math.floor(containerBoundingRect.height) - margin.top - margin.bottom

    // Calculate new xScale and yScales height and width
    xScale.range([0, width])
    yScale.range([height, 0])

    // Draw axis
    const xAxis = axisBottom().tickSizeOuter(0)
    xAxis.scale(xScale).ticks(timeDay).tickFormat((d) => { return '' })
    yAxis = axisLeft().ticks(5).tickFormat((d) => {
      // return parseFloat(d).toFixed(2) + 'm'
      return parseFloat(d).toFixed(1)
    }).tickSizeOuter(0)
    yAxis.scale(yScale)

    // Position axis bottom and right
    svg.select('.x.axis').attr('transform', 'translate(0,' + height + ')').call(xAxis)
    svg.select('.y.axis').attr('transform', 'translate(' + width + ', 0)').call(yAxis)

    // Format X Axis ticks
    svg.select('.x.axis').selectAll('text').each(formatLabelsX)

    // svg.selectAll('.x.axis text').attr('y', 12)
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
    timeLabel.attr('y', height + 9).attr('transform', 'translate(' + timeX + ',0)').attr('dy', '0.71em')

    // X Axis time label
    timeLabel.select('.time-now-text__time').text(timeFormat('%-I:%M%p')(new Date()).toLowerCase())
    timeLabel.select('.time-now-text__date').text(timeFormat('%-e %b')(new Date()))

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

    // Add thresholds
    thresholdsContainer.selectAll('*').remove()
    thresholds.forEach(threshold => {
      const thresholdContainer = thresholdsContainer
        .append('g').attr('class', 'threshold')
        .attr('data-id', threshold.id)
        .classed('threshold--selected', !!threshold.isSelected)
      thresholdContainer.append('rect')
        .attr('class', 'threshold__bg')
        .attr('x', 0).attr('y', -10).attr('height', 20)
        .attr('width', xScale(xExtent[1]))
      thresholdContainer.append('line')
        .attr('class', 'threshold__line')
        .attr('x2', xScale(xExtent[1])).attr('y2', 0)
      const label = thresholdContainer.append('g')
        .attr('class', 'threshold-label')
      const path = label.append('path')
        .attr('class', 'threshold-label__bg')
      const text = label.append('text')
        .attr('class', 'threshold-label__text')
        .attr('x', 10).attr('y', 22)
        .text(threshold.name)
      const textWidth = text.node().getBBox().width
      path.attr('d', `m-0.5,-0.5 l${Math.round(textWidth + 40)},0 l0,36 l-${((Math.round(textWidth + 40) / 2) - 7.5)},0 l-7.5,7.5 l-7.5,-7.5 l-${((Math.round(textWidth + 40) / 2) - 7.5)},0 l0,-36 l0,0`)
      label.attr('transform', `translate(${Math.round(width / 2) - (Math.round(textWidth + 40) / 2)}, -46)`)
      const remove = thresholdContainer.append('g').attr('class', 'threshold__remove')
        .attr('transform', 'translate(20,0)')
      remove.append('circle').attr('r', 11)
      remove.append('line').attr('x1', -3).attr('y1', -3).attr('x2', 3).attr('y2', 3)
      remove.append('line').attr('y1', -3).attr('x2', -3).attr('x1', 3).attr('y2', 3)
      // Set individual elements size and position
      thresholdContainer.attr('transform', 'translate(0,' + Math.round(yScale(threshold.level)) + ')')
    })

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

  const getDataPointByX = (x) => {
    const mouseDate = xScale.invert(x)
    const bisectDate = bisector((d) => { return new Date(d.dateTime) }).left
    const i = bisectDate(lines, mouseDate, 1) // returns the index to the current data item
    const d0 = lines[i - 1]
    const d1 = lines[i] || lines[i - 1]
    // Determine which date value is closest to the mouse
    const d = mouseDate - new Date(d0.dateTime) > new Date(d1.dateTime) - mouseDate ? d1 : d0
    dataPoint = d
  }

  const setTooltipPosition = (x, y) => {
    // Set Background size
    const text = tooltip.select('text')
    const txtHeight = Math.round(text.node().getBBox().height) + 23
    const pathLength = 130
    const pathCentre = `M${pathLength},${txtHeight}l0,-${txtHeight}l-${pathLength},0l0,${txtHeight}l${pathLength},0Z`
    // Set tooltip layout
    tooltipText.attr('x', 0).attr('y', 20)
    tooltipPath.attr('d', pathCentre)
    // Centre tooltip
    x -= pathLength / 2
    if (x <= 10) {
      // tooltip on the left
      x = 10
    } else if (x + ((pathLength / 2) + 10) >= width) {
      // tooltip on the right
      x = width - 10
    }
    // Set background above or below position
    const tooltipHeight = tooltipPath.node().getBBox().height
    const tooltipMarginTop = 10
    const tooltipMarginBottom = height - (tooltipHeight + 10)
    // Tooltip 40 px above cursor
    y -= tooltipHeight + 40
    y = y < tooltipMarginTop ? tooltipMarginTop : y > tooltipMarginBottom ? tooltipMarginBottom : y
    tooltip.attr('transform', 'translate(' + x.toFixed(0) + ',' + y.toFixed(0) + ')')
    tooltip.classed('tooltip--visible', true)
    // Update locator
    const locatorX = Math.floor(xScale(new Date(dataPoint.dateTime)))
    const locatorY = Math.floor(yScale(dataPoint.value))
    const latestX = Math.floor(xScale(new Date(dataPoint.dateTime)))
    locator.classed('locator--forecast', locatorX > latestX)
    locator.attr('transform', 'translate(' + locatorX + ',' + 0 + ')')
    locator.select('.locator-point').attr('transform', 'translate(' + 0 + ',' + locatorY + ')')
  }

  const showTooltip = (tooltipY = 10) => {
    if (!dataPoint) return
    // Hide threshold label
    // thresholdsContainer.select('.threshold--selected .threshold-label').style('visibility', 'hidden')
    // Set tooltip text
    tooltipValue.text(`${Number(dataPoint.value).toFixed(2)}m`)
    tooltipDescription.text(`${timeFormat('%-I:%M%p')(new Date(dataPoint.dateTime)).toLowerCase()}, ${timeFormat('%e %b')(new Date(dataPoint.dateTime))}`)
    // Set locator properties
    locator.classed('locator--visible', true)
    // Update tooltip left/right background
    const tooltipX = xScale(new Date(dataPoint.dateTime))
    setTooltipPosition(tooltipX, tooltipY)
  }

  const hideTooltip = () => {
    tooltip.classed('tooltip--visible', false)
    locator.classed('locator--visible', false)
  }

  const showThreshold = (threshold) => {
    thresholdsContainer.selectAll('.threshold').classed('threshold--selected', false)
    threshold.classed('threshold--selected', true)
  }

  const hideThreshold = () => {
    thresholdsContainer.selectAll('.threshold').classed('threshold--selected', false)
  }

  const addThreshold = (threshold) => {
    // Update thresholds array
    thresholds = thresholds.filter((x) => { return x.id !== threshold.id })
    thresholds.forEach(x => { x.isSelected = false })
    threshold.isSelected = true
    thresholds.push(threshold)
    // Re-render
    renderChart()
  }

  const removeThreshold = (id) => {
    // Update thresholds array
    thresholds = thresholds.filter(x => x.id.toString() !== id)
    // Re-render
    renderChart()
  }

  const setScaleX = () => {
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
  }

  const setScaleY = () => {
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
    yScale = scaleLinear().domain(yExtent).nice(5)
    yScale.range([height, 0])
    // Update y axis
    yAxis = axisLeft()
    yAxis.ticks(5).tickFormat((d) => { return parseFloat(d).toFixed(2) + 'm' })
    yAxis.scale(yScale)
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

    // To follow
    // Determin which resolution and range to displa
    // Using raw data for now

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

    // Note: xExtent uses observed and forecast data rather than lines for the scenario where river levels
    // start or end as -ve since we still need to determine the datetime span of the graph even if the
    // values are excluded from plotting by virtue of being -ve

    // Set referecne to yExtent before any thresholds are added
    yExtent = extent(lines, (d, i) => { return d.value })
    yExtentDataMin = yExtent[0]
    yExtentDataMax = yExtent[1]
  }

  const formatLabelsX = (d, i, nodes) => {
    // Format X Axis labels
    const element = select(nodes[i])
    // const formattedTime = timeFormat(period === 'hours' ? '%-I%p' : '%-I:%M%p')(new Date(d)).toLocaleLowerCase()
    const formattedTime = timeFormat('%-I%p')(new Date(d)).toLocaleLowerCase()
    const formattedDate = timeFormat('%-e %b')(new Date(d))
    element.append('tspan').text(formattedTime)
    element.append('tspan').attr('x', 0).attr('dy', '15').text(formattedDate)
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

  const defaults = {
    btnAddThresholdClass: 'defra-button-text-s',
    btnAddThresholdText: 'Show on chart'
  }
  options = Object.assign({}, defaults, options)

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
  const inner = svg.append('g') // .attr('clip-path', 'url(#clip-text)')
  inner.append('g').attr('class', 'observed observed-focus')
  inner.append('g').attr('class', 'forecast')
  const observedArea = inner.select('.observed').append('path').attr('class', 'observed-area')
  const observedLine = inner.select('.observed').append('path').attr('class', 'observed-line')
  const forecastArea = inner.select('.forecast').append('path').attr('class', 'forecast-area')
  const forecastLine = inner.select('.forecast').append('path').attr('class', 'forecast-line')

  // Add timeline
  const timeLine = svg.append('line').attr('class', 'time-line')
  const timeLabel = svg.append('text').attr('class', 'time-now-text').attr('x', -26)
  timeLabel.append('tspan').attr('class', 'time-now-text__time')
  timeLabel.append('tspan').attr('text-anchor', 'middle').attr('class', 'time-now-text__date').attr('x', 0).attr('dy', '15')

  // Add locator
  const locator = inner.append('g').attr('class', 'locator')
  locator.append('line').attr('class', 'locator-line')
  locator.append('circle').attr('r', 4.5).attr('class', 'locator-point')

  // Add thresholds group
  const thresholdsContainer = inner.append('g').attr('class', 'thresholds')

  // Add tooltip container
  const tooltip = svg.append('g').attr('class', 'tooltip').attr('aria-hidden', true)
  const tooltipPath = tooltip.append('path').attr('class', 'tooltip-bg')
  const tooltipText = tooltip.append('text').attr('class', 'tooltip-text')
  const tooltipValue = tooltipText.append('tspan').attr('class', 'tooltip-text__strong').attr('x', 12).attr('dy', '0.5em')
  const tooltipDescription = tooltipText.append('tspan').attr('class', 'tooltip-text').attr('x', 12).attr('dy', '1.4em')

  // Add optional 'Add threshold' buttons
  document.querySelectorAll('[data-line-chart-threshold]').forEach(container => {
    const button = document.createElement('button')
    button.className = options.btnAddThresholdClass
    button.innerHTML = options.btnAddThresholdText
    button.setAttribute('data-id', container.getAttribute('data-id'))
    button.setAttribute('data-line-chart-threshold', '')
    button.setAttribute('data-level', container.getAttribute('data-level'))
    button.setAttribute('data-name', container.getAttribute('data-name'))
    container.parentElement.replaceChild(button, container)
  })

  // Define globals
  let isMobile, interfaceType
  let dataStart, dataPage, dataPoint
  let width, height, xScaleInitial, xScale, yScale, xExtent, yAxis, yExtent, yExtentDataMin, yExtentDataMax
  let lines, area, line, observedPoints, forecastPoints
  let thresholds = []

  // Create a mobile width media query
  const mobileMediaQuery = window.matchMedia('(max-width: 640px)')
  isMobile = mobileMediaQuery.matches

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
    renderChart()
  })

  window.addEventListener('resize', () => {
    hideTooltip()
    renderChart()
  })

  document.addEventListener('click', (e) => {
    if (!e.target.hasAttribute('data-line-chart-threshold')) return
    const button = e.target
    addThreshold({
      id: button.getAttribute('data-id'),
      level: Number(button.getAttribute('data-level')),
      name: button.getAttribute('data-name')
    })
  })

  svg.on('click', (e) => {
    if (e.target.closest('.threshold')) return
    getDataPointByX(pointer(e)[0])
    showTooltip(pointer(e)[1])
  })

  svg.on('mousemove', (e) => {
    if (!xScale || e.target.closest('.threshold')) return
    if (interfaceType === 'touch') {
      interfaceType = 'mouse'
      return
    }
    interfaceType = 'mouse'
    getDataPointByX(pointer(e)[0])
    hideThreshold()
    showTooltip(pointer(e)[1])
  })

  svg.on('mouseleave', (e) => {
    // if (dataPage) {
    hideTooltip()
    // }
  })

  svg.on('touchstart', (e) => {
    interfaceType = 'touch'
    const touchEvent = e.targetTouches[0]
    if (!xScale) return
    getDataPointByX(pointer(touchEvent)[0])
    showTooltip(10)
  })

  svg.on('touchmove', (e) => {
    const touchEvent = e.targetTouches[0]
    if (!xScale) return
    getDataPointByX(pointer(touchEvent)[0])
    showTooltip(10)
  })

  thresholdsContainer.on('click', (e) => {
    e.stopPropagation()
    const thresholdContainer = e.target.closest('.threshold')
    if (e.target.closest('.threshold__remove')) {
      removeThreshold(thresholdContainer.getAttribute('data-id'))
    } else if (thresholdContainer) {
      hideTooltip()
      showThreshold(select(thresholdContainer))
    }
  })

  thresholdsContainer.on('mouseover', (e) => {
    const thresholdContainer = e.target.closest('.threshold')
    if (thresholdContainer) {
      hideTooltip()
      showThreshold(select(thresholdContainer))
    }
  })
}

window.flood.charts = {
  createLineChart: (containerId, stationId, data) => {
    return new LineChart(containerId, stationId, data)
  }
}
