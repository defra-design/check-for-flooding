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
    isMobile = mobileMediaQuery.matches
    console.log(isMobile)
    // Calculate new xScale from range
    xScale = xScale.range([0, width]).padding(0.4)
    const xAxis = axisBottom(xScale).tickSizeOuter(0).tickValues(xScale.domain().filter((d, i) => {
      const hourMinute = timeFormat('%H:%M')(new Date(d))
      const labelsHours = ['01:00']
      const labelsMinutes = ['00:15', '06:15', '12:15', '18:15']
      const labels = period === 'hours' ? labelsHours : labelsMinutes
      return labels.includes(hourMinute)
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
    const bg = toolTip.select('rect')
    const text = toolTip.select('text')
    // const textWidth = Math.round(text.node().getBBox().width)
    const textHeight = Math.round(text.node().getBBox().height)
    bg.attr('width', period === 'minutes' ? 190 : 150).attr('height', textHeight + 23)
    const toolTipWidth = bg.node().getBBox().width
    const toolTipHeight = bg.node().getBBox().height
    // Set background left or right position
    if (toolTipX >= width - (toolTipWidth + 10)) {
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

  const showTooltip = (e) => {
    const mouseDateTime = scaleBandInvert(xScale)(pointer(e)[0])
    const dataItem = data.find(x => x.dateTime === mouseDateTime)
    // Only need to show toltip when data item changes
    if (dataCurrent && dataCurrent.dateTime === dataItem.dateTime) { return }
    dataCurrent = dataItem
    toolTip.select('text').selectAll('*').remove()
    // Get tooltip position and content
    toolTipX = Math.round(xScale(dataCurrent.dateTime)) + (xScale.bandwidth() / 2)
    toolTipY = pointer(e)[1]
    const value = dataCurrent.isValid ? dataCurrent.value + 'mm' : 'No data'
    const periodStartDateTime = timeMinute.offset(new Date(dataCurrent.dateTime), period === 'minutes' ? -15 : -60)
    const formatTime = timeFormat(period === 'minutes' ? '%-I:%M%p' : '%-I%p')
    const timeStart = formatTime(periodStartDateTime).toLowerCase()
    const timeEnd = formatTime(new Date(dataCurrent.dateTime)).toLowerCase()
    const date = timeFormat('%e %b')(periodStartDateTime)
    toolTip.select('text').append('tspan').attr('class', 'tool-tip-text__strong').attr('x', 12).attr('dy', '0.5em').text(value)
    toolTip.select('text').append('tspan').attr('class', 'tool-tip-text__small').attr('x', 12).attr('dy', '1.4em').text(`${timeStart} - ${timeEnd}, ${date}`)
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
    locator.classed('locator--visible', true)
  }

  const hideTooltip = () => {
    svg.selectAll('.bar--selected').classed('bar--selected', false)
    toolTip.classed('tool-tip--visible', false)
    locator.classed('locator--visible', false)
  }

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
      segmentedControl.style.display = response.availablePeriods.length > 1 ? 'block' : 'none'
      // Setup scales with domains
      xScale = setScaleX()
      yScale = setScaleY(period === 'minutes' ? 1 : 4)
      // Render bars and chart
      renderBars()
      renderChart()
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

  // Add time scale buttons
  const segmentedControl = document.createElement('div')
  segmentedControl.style.display = 'none'
  segmentedControl.className = 'defra-segmented-control'
  segmentedControl.innerHTML = `
  <div class="defra-segmented-control__segment defra-segmented-control__segment--selected">
    <input class="defra-segmented-control__input" name="time" type="radio" id="timeHours" data-period="hours" checked/>
    <label for="timeHours">Hourly</label>
  </div>
  <div class="defra-segmented-control__segment">
    <input class="defra-segmented-control__input" name="time" type="radio" id="timeMinutes" data-period="minutes"/>
    <label for="timeMinutes">15 minutes</label>
  </div>`
  container.parentNode.insertBefore(segmentedControl, container)

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
  toolTip.append('rect').attr('class', 'tool-tip-bg').attr('width', 147)
  toolTip.append('text').attr('class', 'tool-tip-text').attr('x', 12).attr('y', 20)

  // Get width and height
  const margin = { top: 0, bottom: 45, left: 0, right: 34 }
  const containerBoundingRect = select('#' + containerId).node().getBoundingClientRect()
  let width = Math.floor(containerBoundingRect.width) - margin.right - margin.left
  let height = Math.floor(containerBoundingRect.height) - margin.bottom - margin.top

  // Set defaults
  let period = segmentedControl.querySelector('input[checked]').getAttribute('data-period')
  let xScale, yScale, data, dataCurrent
  let isMobile

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
  })

  document.addEventListener('click', (e) => {
    if (e.target.className === 'defra-segmented-control__input') {
      const siblings = e.target.parentNode.parentNode.children
      for (let i = 0; i < siblings.length; i++) {
        siblings[i].classList.remove('defra-segmented-control__segment--selected')
      }
      e.target.parentNode.classList.add('defra-segmented-control__segment--selected')
      period = e.target.getAttribute('data-period')
      startDate = new Date()
      startDate.setHours(startDate.getHours() - (period === 'hours' ? 120 : 24))
      startDate = startDate.toISOString().replace(/.\d+Z$/g, 'Z')
      // New xhr request
      xhr(`/service/telemetry/rainfall/${telemetryId}/${startDate}/${endDate}/${period}`, initChart, 'json')
    }
  })

  background.on('mousemove', (e) => {
    showTooltip(e)
  })

  background.on('mouseleave', (e) => {
    hideTooltip()
  })

  this.chart = chart
}

window.flood.charts = {
  createBarChart: (containerId, telemetryId) => {
    return new BarChart(containerId, telemetryId)
  }
}
