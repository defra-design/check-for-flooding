'use strict'
// Chart component

import { axisBottom, axisLeft } from 'd3-axis'
import { scaleLinear, scaleBand } from 'd3-scale'
import { timeFormat } from 'd3-time-format'
import { select } from 'd3-selection'
import { max } from 'd3-array'
import { timeMinute } from 'd3-time'

function BarChart (containerId, data) {
  const chart = document.getElementById(containerId)

  const formatTime = timeFormat('%-I%p')
  const parseHourMinute = timeFormat('%-I:%M')
  const parseMinutes = timeFormat('%-M')

  const renderChart = () => {
    // Calculate new xScale from range
    xScale = xScale.range([0, width]).padding(0.4)
    const xAxis = axisBottom(xScale).tickSizeOuter(0).tickValues(xScale.domain().filter((d, i) => {
      const hourMinute = parseHourMinute(new Date(d))
      return ['3:00', '6:00', '9:00', '12:00'].includes(hourMinute)
    }))
    xAxis.tickFormat((d) => { return formatTime(new Date(d)).toLocaleLowerCase() })

    // Calculate new yScale from range
    yScale = yScale.range([height, 0])
    const yAxis = axisLeft(yScale).tickSizeOuter(0).ticks(5)

    // Position axis bottom and right
    svg.select('.x.axis').attr('transform', 'translate(0,' + height + ')').call(xAxis)
    svg.select('.y.axis').attr('transform', 'translate(' + width + ', 0)').call(yAxis)

    // Re-position y ticks
    svg.select('.y.axis').style('text-anchor', 'start')
    svg.selectAll('.y.axis .tick line').attr('x2', 6)
    svg.selectAll('.y.axis .tick text').attr('x', 9)

    // Position y grid
    svg.select('.y.grid')
      .attr('transform', 'translate(0,' + 0 + ')')
      .call(axisLeft(yScale).tickSizeOuter(0).ticks(5).tickSize(-width, 0, 0).tickFormat(''))

    // Position bars
    svg.selectAll('.bar')
      .attr('x', (d) => { return xScale(d.dateTime) })
      .attr('y', (d) => { return yScale(d.value) })
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => { return height - yScale(d.value) })
      .classed('bar--incomplete', (d) => { return d.isInComplete })

    // Update clip container
    clip.attr('width', width).attr('height', height)
  }

  const renderBars = (data) => {
    clipInner.selectAll('.bar').remove()
    clipInner.selectAll('.bar').data(data).enter().append('rect').attr('class', 'bar')
  }

  const getDataHourly = () => {
    // Batch data into hourly totals
    const hours = []
    let batchTotal = 0
    data.forEach(item => {
      const minutes = parseInt(parseMinutes(new Date(item.dateTime)), 10)
      batchTotal += item.value
      if (minutes === 15) {
        hours.push({
          dateTime: timeMinute.offset(new Date(item.dateTime), +45),
          value: Math.round(batchTotal * 100) / 100,
          isInComplete: !(new Date(data[0].dateTime).getTime() >= timeMinute.offset(new Date(item.dateTime), +45).getTime())
        })
        batchTotal = 0
      }
    })
    return hours
  }

  const setScaleX = (data) => {
    return scaleBand().domain(data.map((d) => { return d.dateTime }).reverse())
  }

  const setScaleY = (data) => {
    // Return y Scale but with a minimum of 0.6mm
    return scaleLinear().domain([0, Math.max(max(data, (d) => { return d.value }), 0.6)])
  }

  //
  // Setup
  //

  const dataQuarterly = data
  const dataHourly = getDataHourly()

  // Get container element
  const container = document.querySelector(`#${containerId}`)

  // Add time scale buttons
  const segmentedControl = document.createElement('div')
  segmentedControl.className = 'defra-segmented-control govuk-!-margin-bottom-2'
  segmentedControl.innerHTML = `
    <div class="defra-segmented-control__segment defra-segmented-control__segment--selected">
      <input class="defra-segmented-control__input" name="time" type="radio" id="timeQuarterly" data-period="quarterly" checked/>
      <label for="timeQuarterly">15 minutes</label>
    </div>
    <div class="defra-segmented-control__segment">
      <input class="defra-segmented-control__input" name="time" type="radio" id="timeHourly" data-period="hourly"/>
      <label for="timeHourly">Hourly</label>
    </div>
  `
  container.parentNode.insertBefore(segmentedControl, container)
  // container.append(segmentedControl)

  // Create chart container elements
  const svg = select(`#${containerId}`).append('svg').style('pointer-events', 'none')
  const svgInner = svg.append('g').style('pointer-events', 'all')
  svgInner.append('g').classed('y grid', true)
  svgInner.append('g').classed('x axis', true)
  svgInner.append('g').classed('y axis', true)
  const clip = svgInner.append('defs').append('clipPath').attr('id', 'clip').append('rect').attr('x', 0).attr('y', 0)
  const clipInner = svgInner.append('g').attr('clip-path', 'url(#clip)')

  // Get width and height
  const margin = { top: 0, bottom: 30, left: 0, right: 34 }
  const containerBoundingRect = select('#' + containerId).node().getBoundingClientRect()
  let width = Math.floor(containerBoundingRect.width) - margin.right - margin.left
  let height = Math.floor(containerBoundingRect.height) - margin.bottom - margin.top

  // Setup scales with domains
  let xScale = setScaleX(dataQuarterly)
  let yScale = setScaleY(dataQuarterly)
  renderBars(dataQuarterly)

  renderChart()

  //
  // Events
  //

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
      const dataPeriod = e.target.getAttribute('data-period') === 'quarterly' ? dataQuarterly : dataHourly
      xScale = setScaleX(dataPeriod)
      yScale = setScaleY(dataPeriod)
      renderBars(dataPeriod)
      renderChart()
    }
  })

  this.chart = chart
}

window.flood.charts = {
  createBarChart: (containerId, data) => {
    return new BarChart(containerId, data)
  }
}
