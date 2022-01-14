'use strict'
// Chart component

import { axisBottom, axisLeft } from 'd3-axis'
import { scaleLinear, scaleBand } from 'd3-scale'
import { timeFormat } from 'd3-time-format'
import { select, pointer } from 'd3-selection'
import { max } from 'd3-array'
import { timeMinute } from 'd3-time'

const { xhr } = window.flood.utils

function BarChart (containerId, telemetryId) {
  const renderChart = () => {
    // Mobile media query
    // isMobile = mobileMediaQuery.matches
    // Calculate new xScale from range
    xScale = xScale.range([0, width]).padding(0.4)
    const xAxis = axisBottom(xScale).tickSizeOuter(0).tickValues(xScale.domain().filter((d, i) => {
      const hourMinute = timeFormat('%H:%M')(new Date(d))
      const labelsHours = ['01:00']
      const labelsMinutes = ['00:15', '06:15', '12:15', '18:15']
      const labels = period === 'hours' ? labelsHours : labelsMinutes
      return labels.includes(hourMinute) && i >= 2 // Don't show lable if before 3rd tick
    }))
    xAxis.tickFormat((d) => { return '' })

    // Calculate new yScale from range
    yScale = yScale.range([height, 0])
    const yAxis = axisLeft(yScale).tickSizeOuter(0).ticks(5)

    // Position axis bottom and right
    svg.select('.x.axis').attr('transform', 'translate(0,' + height + ')').call(xAxis)
    svg.select('.y.axis').attr('transform', 'translate(' + width + ', 0)').call(yAxis)

    // Format X Axis ticks
    svg.select('.x.axis').selectAll('text').each(formatLabelsX)

    // Position y ticks
    svg.select('.y.axis').style('text-anchor', 'start')
    svg.selectAll('.y.axis .tick line').attr('x2', 6)
    svg.selectAll('.y.axis .tick text').attr('x', 9)

    // Position y grid
    svg.select('.y.grid')
      .attr('transform', 'translate(0,' + 0 + ')')
      .call(axisLeft(yScale).tickSizeOuter(0).ticks(5).tickSize(-width, 0, 0).tickFormat(''))

    // Position bars
    svg.selectAll('.bar')
      .attr('transform', (d) => { return 'translate(' + xScale(d.dateTime) + ', 0)' })
    svg.selectAll('.bar__fill')
      .attr('x', 0)
      .attr('y', (d) => { return yScale(d.value) })
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => { return height - yScale(d.value) })

    // Position background
    background.attr('x', 0).attr('y', 0).attr('width', width).attr('height', height)

    // Draw latest reading line
    const xLatest = Math.round(xScale.bandwidth() / 2)
    svg.select('.latest-line').attr('transform', 'translate(' + xLatest + ', 0)').attr('y1', 0).attr('y2', height)

    // Update clip container
    clip.attr('width', width).attr('height', height)
  }

  const renderBars = () => {
    clipInner.selectAll('.bar').remove()
    const bars = clipInner.selectAll('.bar').data(data).enter()
      .append('g').attr('class', 'bar').attr('data-datetime', (d) => { return d.dateTime })
      .classed('bar--incomplete', (d) => { return d.isInComplete })
      .classed('bar--latest', (d) => { return d.isLatest })
    bars.filter((d) => { return d.isLatest }).append('line').attr('class', 'latest-line')
    bars.append('rect').attr('class', 'bar__fill')
  }

  const setScaleX = () => {
    return scaleBand().domain(data.map((d) => { return d.dateTime }).reverse())
  }

  const setScaleY = (minimum) => {
    // Get max from data or minimum
    let maxData = Math.max(max(data, (d) => { return d.value }), minimum)
    // Buffer 25% and round to nearest integer
    maxData = Math.ceil((maxData * 1.25) * 10 / 10)
    // Ensure y scale always divides by 5
    maxData = Math.ceil(maxData / 5) * 5
    return scaleLinear().domain([0, maxData])
  }

  const updateToolTipBackground = () => {
    // Set Background size
    const text = toolTip.select('text')
    const txtHeight = Math.round(text.node().getBBox().height) + 23
    const pathLength = period === 'minutes' ? 182 : 142
    const pathLeft = `M${pathLength},${(txtHeight / 2) - 8}l-0,-${(txtHeight / 2) - 8}l-${pathLength},0l0,${txtHeight}l${pathLength},0l0,-${(txtHeight / 2) - 8}l8,-8l-8,-8Z`
    const pathRight = `M8,${(txtHeight / 2) - 8}l0,-${(txtHeight / 2) - 8}l${pathLength},0l-0,${txtHeight}l-${pathLength},0l-0,-${(txtHeight / 2) - 8}l-8,-8l8,-8Z`
    const pathCentre = `M${pathLength},${txtHeight}l0,-${txtHeight}l-${pathLength},0l0,${txtHeight}l${pathLength},0Z`
    const pathWidth = pathLength + 8
    // const textWidth = Math.round(text.node().getBBox().width)
    // Set tooltip layout
    toolTipText.attr('x', 0).attr('y', 20)
    if (toolTipX >= width - (pathWidth + 10)) {
      // Tooltip on the left
      toolTipX -= (pathWidth + 3)
      toolTipPath.attr('d', pathLeft)
      toolTipValue.attr('x', 12)
      toolTipDescription.attr('x', 12)
    } else {
      // Tooltip on the right
      toolTipX += 3
      toolTipPath.attr('d', pathRight)
      toolTipValue.attr('x', 20)
      toolTipDescription.attr('x', 20)
    }
    // Tooltip centred
    if (toolTipX <= 0) {
      toolTipX = 0
      toolTipPath.attr('d', pathCentre)
    }

    // Set background above or below position
    const toolTipHeight = toolTipPath.node().getBBox().height
    const toolTipMarginTop = 10
    const toolTipMarginBottom = height - (toolTipHeight + 10)
    toolTipY -= toolTipHeight / 2
    toolTipY = toolTipY < toolTipMarginTop ? toolTipMarginTop : toolTipY > toolTipMarginBottom ? toolTipMarginBottom : toolTipY
    toolTipX = toolTipX.toFixed(0)
    toolTipY = toolTipY.toFixed(0)
  }

  const showTooltip = (event) => {
    // Choose which value to show
    const mouseDateTime = event ? scaleBandInvert(xScale)(pointer(event)[0]) : null
    const dataItem = mouseDateTime ? data.find(x => x.dateTime === mouseDateTime) : null
    dataCurrent = event && dataItem ? dataItem : data.find(x => x.isLatest)
    if (!dataCurrent) return

    // Get tooltip position and content
    toolTipX = Math.round(xScale(dataCurrent.dateTime)) + (xScale.bandwidth() / 2)
    toolTipY = event ? pointer(event)[1] : 0
    const periodStartDateTime = timeMinute.offset(new Date(dataCurrent.dateTime), period === 'minutes' ? -15 : -60)
    const formatTime = timeFormat(period === 'minutes' ? '%-I:%M%p' : '%-I%p')
    const timeStart = formatTime(periodStartDateTime).toLowerCase()
    const timeEnd = formatTime(new Date(dataCurrent.dateTime)).toLowerCase()
    const date = timeFormat('%e %b')(periodStartDateTime)
    const value = dataCurrent.isValid ? dataCurrent.value + 'mm' + (dataCurrent.isLatest ? ' latest' : '') : 'No data'
    const description = `${timeStart} - ${timeEnd}, ${date}`
    toolTipValue.attr('dy', '0.5em').text(value)
    toolTipDescription.attr('dy', '1.4em').text(description)
    // Update locator
    locator.attr('transform', 'translate(' + toolTipX + ', 0)').attr('y1', 0).attr('y2', height)
    // Update tooltip left/right background
    updateToolTipBackground()
    // Update bar selected state
    svg.selectAll('.bar--selected').classed('bar--selected', false)
    svg.select('[data-datetime="' + dataCurrent.dateTime + '"]').classed('bar--selected', true)
    // Update tooltip location
    toolTip.attr('transform', 'translate(' + toolTipX + ',' + toolTipY + ')')
    toolTip.classed('tool-tip--visible', true)
    locator.classed('locator--visible', !dataCurrent.isLatest)
  }

  // const hideTooltip = () => {
  //   svg.selectAll('.bar--selected').classed('bar--selected', false)
  //   toolTip.classed('tool-tip--visible', false)
  //   locator.classed('locator--visible', false)
  // }

  // D3 doesnt currently support inverting of a scaleBand
  const scaleBandInvert = (scale) => {
    const domain = scale.domain()
    const paddingOuter = scale(domain[0])
    const eachBand = scale.step()
    return function (value) {
      const index = Math.floor(((value - paddingOuter) / eachBand))
      return domain[Math.max(0, Math.min(index, domain.length - 1))]
    }
  }

  // Format X Axis labels
  const formatLabelsX = (d, i, nodes) => {
    const element = select(nodes[i])
    const formattedTime = timeFormat(period === 'hours' ? '%-I%p' : '%-I:%M%p')(new Date(d)).toLocaleLowerCase()
    const formattedDate = timeFormat('%-e %b')(new Date(d))
    element.append('tspan').text(formattedTime)
    element.append('tspan').attr('x', 0).attr('dy', '15').text(formattedDate)
  }

  const initChart = (err, response) => {
    if (err) {
      console.log('Error: ' + err)
    } else {
      data = response.values
      // Show period navigation
      controlsContainer.style.display = response.availablePeriods.length > 1 ? 'block' : 'none'
      pagingControl.style.display = period === 'minutes' ? 'inline-block' : 'none'
      // Setup scales with domains
      xScale = setScaleX()
      yScale = setScaleY(period === 'minutes' ? 1 : 4)
      // Render bars and chart
      renderBars()
      renderChart()
      // Show default tooltip
      showTooltip(null)
    }
  }

  //
  // Setup
  //

  const container = document.querySelector(`#${containerId}`)
  const chart = document.getElementById(containerId)
  telemetryId = /[^/]*$/.exec(telemetryId)[0]

  // Set initial dates
  let endDate = new Date()
  let startDate = new Date()
  startDate.setHours(startDate.getHours() - 120)
  startDate = startDate.toISOString().replace(/.\d+Z$/g, 'Z')
  endDate = endDate.toISOString().replace(/.\d+Z$/g, 'Z')

  // Add controls container
  const controlsContainer = document.createElement('div')
  controlsContainer.style.display = 'none'
  controlsContainer.className = 'defra-chart-controls'
  container.parentNode.insertBefore(controlsContainer, container)

  // Add time scale buttons
  const segmentedControl = document.createElement('div')
  segmentedControl.className = 'defra-chart-segmented-control'
  segmentedControl.innerHTML = `
  <div class="defra-chart-segmented-control__segment defra-chart-segmented-control__segment--selected">
    <input class="defra-chart-segmented-control__input" name="time" type="radio" id="timeHours" data-period="hours" checked/>
    <label for="timeHours">Hourly</label>
  </div>
  <div class="defra-chart-segmented-control__segment">
    <input class="defra-chart-segmented-control__input" name="time" type="radio" id="timeMinutes" data-period="minutes"/>
    <label for="timeMinutes">15 minutes</label>
  </div>`
  // container.parentNode.insertBefore(segmentedControl, container)
  controlsContainer.appendChild(segmentedControl)

  // Add paging buttons
  const pagingControl = document.createElement('div')
  pagingControl.style.display = 'none'
  pagingControl.className = 'defra-chart-paging-control'
  const pageBack = document.createElement('button')
  pageBack.className = 'defra-chart-paging-control__button defra-chart-paging-control__button--backward'
  pageBack.innerHTML = '<span class="govuk-visually-hidden">Backward</span>'
  const pageForward = document.createElement('button')
  pageForward.className = 'defra-chart-paging-control__button defra-chart-paging-control__button--forward'
  pageForward.innerHTML = '<span class="govuk-visually-hidden">Forward</span>'
  pagingControl.appendChild(pageBack)
  pagingControl.appendChild(pageForward)
  // container.parentNode.insertBefore(pagingControl, container)
  controlsContainer.appendChild(pagingControl)

  // Create chart container elements
  const svg = select(`#${containerId}`).append('svg')
  const background = svg.append('rect').attr('class', 'background')
  svg.append('g').attr('class', 'y grid')
  svg.append('g').attr('class', 'x axis')
  svg.append('g').attr('class', 'y axis')
  const clip = svg.append('defs').append('clipPath').attr('id', 'clip').append('rect').attr('x', 0).attr('y', 0)
  const clipInner = svg.append('g').attr('clip-path', 'url(#clip)')

  // Add locator
  const locator = clipInner.append('line').attr('class', 'locator')

  // Add tooltip container
  let toolTipX, toolTipY
  const toolTip = svg.append('g').attr('class', 'tool-tip')
  // toolTip.append('rect').attr('class', 'tool-tip-bg').attr('width', 147)
  const toolTipPath = toolTip.append('path').attr('class', 'tool-tip-bg')
  const toolTipText = toolTip.append('text').attr('class', 'tool-tip-text')
  const toolTipValue = toolTipText.append('tspan').attr('class', 'tool-tip-text__strong')
  const toolTipDescription = toolTipText.append('tspan').attr('class', 'tool-tip-text__small')

  // Get width and height
  const margin = { top: 0, bottom: 45, left: 0, right: 24 }
  const containerBoundingRect = select('#' + containerId).node().getBoundingClientRect()
  let width = Math.floor(containerBoundingRect.width) - margin.right - margin.left
  let height = Math.floor(containerBoundingRect.height) - margin.bottom - margin.top

  // Set defaults
  let period = segmentedControl.querySelector('input[checked]').getAttribute('data-period')
  let xScale, yScale, data, dataCurrent
  // let isMobile

  // Get mobile media query list
  const mobileMediaQuery = window.matchMedia('(max-width: 640px)')

  // XMLHttpRequest
  xhr(`/service/telemetry/rainfall/${telemetryId}/${startDate}/${endDate}/hours`, initChart, 'json')

  //
  // Events
  //

  mobileMediaQuery.addEventListener('change', renderChart)

  window.addEventListener('resize', () => {
    const containerBoundingRect = select('#' + containerId).node().getBoundingClientRect()
    width = Math.floor(containerBoundingRect.width) - margin.right - margin.left
    height = Math.floor(containerBoundingRect.height) - margin.bottom - margin.top
    renderChart()
    showTooltip(null)
  })

  document.addEventListener('click', (e) => {
    if (e.target.className === 'defra-chart-segmented-control__input') {
      const siblings = e.target.parentNode.parentNode.children
      for (let i = 0; i < siblings.length; i++) {
        siblings[i].classList.remove('defra-chart-segmented-control__segment--selected')
      }
      e.target.parentNode.classList.add('defra-chart-segmented-control__segment--selected')
      period = e.target.getAttribute('data-period')
      startDate = new Date()
      startDate.setHours(startDate.getHours() - (period === 'hours' ? 120 : 24))
      startDate = startDate.toISOString().replace(/.\d+Z$/g, 'Z')
      // New xhr request
      xhr(`/service/telemetry/rainfall/${telemetryId}/${startDate}/${endDate}/${period}`, initChart, 'json')
    }
    if (e.target.classList.contains('defra-chart-paging-control__button')) {
      console.log(e.target.className)
    }
  })

  svg.on('mousemove', (e) => {
    showTooltip(e)
  })

  svg.on('mouseleave', (e) => {
    showTooltip(null)
  })

  this.chart = chart
}

window.flood.charts = {
  createBarChart: (containerId, telemetryId) => {
    return new BarChart(containerId, telemetryId)
  }
}
