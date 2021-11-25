'use strict'
// Chart component

import { axisBottom, axisLeft } from 'd3-axis'
import { scaleLinear, scaleBand } from 'd3-scale'
import { timeFormat } from 'd3-time-format'
import { select, pointer } from 'd3-selection'
import { max } from 'd3-array'
import { timeMinute } from 'd3-time'

function BarChart (containerId, telemetry) {
  const chart = document.getElementById(containerId)
  let dataLatest = telemetry.find(d => d.isLatest)
  let dataCurrent

  const renderChart = () => {
    // Calculate new xScale from range
    xScale = xScale.range([0, width]).padding(0.4)
    const xAxis = axisBottom(xScale).tickSizeOuter(0).tickValues(xScale.domain().filter((d, i) => {
      const hourMinute = timeFormat('%-I:%M')(new Date(d))
      return ['3:00', '6:00', '9:00', '12:00'].includes(hourMinute)
    }))
    xAxis.tickFormat((d) => { return timeFormat('%-I%p')(new Date(d)).toLocaleLowerCase() })

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

  const getDataHourly = () => {
    // Batch data into hourly totals
    const hours = []
    let batchTotal = 0
    telemetry.forEach(item => {
      const minutes = parseInt(timeFormat('%-M')(new Date(item.dateTime)), 10)
      const latestTime = timeMinute.offset(new Date(dataLatest.dateTime), +45).setMinutes(0)
      batchTotal += item.value
      if (minutes === 15) {
        const currentHour = timeMinute.offset(new Date(item.dateTime), +45)
        hours.push({
          dateTime: currentHour,
          value: Math.round(batchTotal * 100) / 100,
          ...(!(new Date(telemetry[0].dateTime).getTime() >= currentHour.getTime()) && { isInComplete: true }),
          ...((currentHour.getTime() === latestTime) && { isLatest: true })
        })
        batchTotal = 0
      }
    })
    return hours
  }

  const setScaleX = () => {
    return scaleBand().domain(data.map((d) => { return d.dateTime }).reverse())
  }

  const setScaleY = (minimum) => {
    // Get max from data or minimum
    let maxData = Math.max(max(data, (d) => { return d.value }), minimum)
    // Buffer 25% and round to nearest integer
    maxData = Math.ceil((maxData * 1.25) * 10 / 10)
    return scaleLinear().domain([0, maxData])
  }

  const updateToolTipBackground = () => {
    // Set Background size
    const bg = toolTip.select('rect')
    const text = toolTip.select('text')
    // const textWidth = Math.round(text.node().getBBox().width)
    const textHeight = Math.round(text.node().getBBox().height)
    bg.attr('width', period === 'quarterly' ? 190 : 150).attr('height', textHeight + 23)
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
    let value = dataCurrent.value + 'mm' + (dataCurrent.dateTime === dataLatest.dateTime ? ' (latest)' : '')
    value = new Date(dataCurrent.dateTime).getTime() > new Date(dataLatest.dateTime).getTime() ? 'No data' : value
    const periodStartDateTime = timeMinute.offset(new Date(dataCurrent.dateTime), period === 'quarterly' ? -15 : -60)
    const formatTime = timeFormat(period === 'quarterly' ? '%-I:%M%p' : '%-I%p')
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

  //
  // Setup
  //

  const dataQuarterly = telemetry
  const dataHourly = getDataHourly()

  // Get container element
  const container = document.querySelector(`#${containerId}`)

  // Add time scale buttons
  const segmentedControl = document.createElement('div')
  segmentedControl.className = 'defra-segmented-control'
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
  const margin = { top: 0, bottom: 30, left: 0, right: 34 }
  const containerBoundingRect = select('#' + containerId).node().getBoundingClientRect()
  let width = Math.floor(containerBoundingRect.width) - margin.right - margin.left
  let height = Math.floor(containerBoundingRect.height) - margin.bottom - margin.top

  // Setup scales with domains
  let data = dataQuarterly
  let xScale = setScaleX()
  let yScale = setScaleY(1)

  // Set default period
  let period = segmentedControl.querySelector('input[checked]').getAttribute('data-period')

  renderBars()
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
      period = e.target.getAttribute('data-period')
      data = period === 'quarterly' ? dataQuarterly : dataHourly
      dataLatest = data.find(x => x.isLatest)
      xScale = setScaleX()
      yScale = setScaleY(period === 'quarterly' ? 1 : 4)
      renderBars()
      renderChart()
    }
  })

  background.on('mousemove', (e) => {
    showTooltip(e)
  })

  background.on('mouseleave', (e) => {
    // hideTooltip()
  })

  this.chart = chart
}

window.flood.charts = {
  createBarChart: (containerId, telemetry) => {
    return new BarChart(containerId, telemetry)
  }
}
