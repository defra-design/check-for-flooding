'use strict'
// Chart component

import { axisBottom, axisLeft } from 'd3-axis'
import { scaleLinear, scaleBand } from 'd3-scale'
import { timeFormat } from 'd3-time-format'
import { select } from 'd3-selection'
import { max } from 'd3-array'

function BarChart (containerId, data) {
  const chart = document.getElementById(containerId)

  const formatTime = timeFormat('%-I%p')
  const parseHourMinute = timeFormat('%-I:%M')

  const renderChart = () => {
    // Setup xScale, domain and range
    const xScale = scaleBand().range([0, width]).padding(0.4)
    xScale.domain(data.map((d) => { return d.dateTime }).reverse())
    const xAxis = axisBottom(xScale).tickSizeOuter(0).tickValues(xScale.domain().filter((d, i) => {
      const hourMinute = parseHourMinute(new Date(d))
      return ['3:00', '6:00', '9:00', '12:00'].includes(hourMinute)
    }))
    xAxis.tickFormat((d) => { return formatTime(new Date(d)).toLocaleLowerCase() })

    // Setup yScale, domain and range
    const yScale = scaleLinear().range([height, 0])
    const yAxis = axisLeft(yScale).tickSizeOuter(0).ticks(5)
    yScale.domain([0, max(data, (d) => { return d.value })])

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

    // Update clip container
    clip.attr('width', width).attr('height', height)
  }

  //
  // Setup
  //

  // Add time scale buttons
  const segmentedControl = document.createElement('div')
  segmentedControl.className = 'defra-segmented-control'
  segmentedControl.innerHTML = `
    <div class="defra-segmented-control__item">
    <input class="defra-segmented-control__input" name="time" type="radio" id="time15"/>
    <label for="time15">15 minutes</label>
    </div>
    <div class="defra-segmented-control__item">
    <input class="defra-segmented-control__input" name="time" type="radio" id="time60"/>
    <label for="time60">Hourly</label>
    </div>
  `
  document.querySelector(`#${containerId}`).append(segmentedControl)

  const svg = select(`#${containerId}`).append('svg').style('pointer-events', 'none')
  const svgInner = svg.append('g').style('pointer-events', 'all')
  svgInner.append('g').classed('y grid', true)
  svgInner.append('g').classed('x axis', true)
  svgInner.append('g').classed('y axis', true)
  const clip = svgInner.append('defs').append('clipPath').attr('id', 'clip').append('rect').attr('x', 0).attr('y', 0)
  const clipInner = svgInner.append('g').attr('clip-path', 'url(#clip)')
  clipInner.selectAll('.bar').data(data).enter().append('rect').attr('class', 'bar')

  // Get width and height
  const margin = { top: 25, bottom: 25, left: 28, right: 28 }
  const containerBoundingRect = select('#' + containerId).node().getBoundingClientRect()
  let width = Math.floor(containerBoundingRect.width) - margin.left - margin.right
  let height = Math.floor(containerBoundingRect.height) - margin.top - margin.bottom

  //
  // Events
  //

  window.addEventListener('resize', () => {
    const containerBoundingRect = select('#' + containerId).node().getBoundingClientRect()
    width = Math.floor(containerBoundingRect.width) - margin.left - margin.right
    height = Math.floor(containerBoundingRect.height) - margin.top - margin.bottom
    renderChart()
  })

  renderChart()

  this.chart = chart
}

window.flood.charts = {
  createBarChart: (containerId, data) => {
    return new BarChart(containerId, data)
  }
}
