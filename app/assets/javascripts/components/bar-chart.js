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

    // Setup scales with domains
    xScale = setScaleX()
    yScale = setScaleY(period === 'minutes' ? 1 : 4)

    // Calculate new xScale from range
    xScale = xScale.range([0, width]).padding(0.4)
    const xAxis = axisBottom(xScale).tickSizeOuter(0).tickValues(xScale.domain().filter((d, i) => {
      const hourMinute = timeFormat('%H:%M')(new Date(d))
      const labelsHours = ['00:00']
      const labelsMinutes = ['00:00', '06:00', '12:00', '18:00']
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

    // Add bars
    clipInner.selectAll('.bar').remove()
    const bars = clipInner.selectAll('.bar').data(dataPage).enter()
      .append('g').attr('class', 'bar').attr('data-datetime', (d) => { return d.dateTime })
      .classed('bar--incomplete', (d) => { return d.isInComplete })
      .classed('bar--latest', (d) => { return d.isLatest })
    bars.filter((d) => { return d.isLatest }).append('line').attr('class', 'latest-line')
    bars.append('rect').attr('class', 'bar__fill')

    // Position bars
    svg.selectAll('.bar')
      .attr('transform', (d) => { return 'translate(' + xScale(d.dateTime) + ', 0)' })
    svg.selectAll('.bar__fill')
      .attr('x', 0)
      .attr('y', (d) => { return yScale(d.value) })
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => { return height - yScale(d.value) })

    // Draw latest reading line
    const xLatest = Math.round(xScale.bandwidth() / 2)
    svg.select('.latest-line').attr('transform', 'translate(' + xLatest + ', 0)').attr('y1', 0).attr('y2', height)

    // Update clip container
    clip.attr('width', width).attr('height', height)
  }

  const setScaleX = () => {
    return scaleBand().domain(dataPage.map((d) => { return d.dateTime }).reverse())
  }

  const setScaleY = (minimum) => {
    // Get max from data or minimum
    let maxData = Math.max(max(dataPage, (d) => { return d.value }), minimum)
    // Buffer 25% and round to nearest integer
    maxData = Math.ceil((maxData * 1.25) * 10 / 10)
    // Ensure y scale always divides by 5
    maxData = Math.ceil(maxData / 5) * 5
    return scaleLinear().domain([0, maxData])
  }

  const setTooltipPosition = (x, y) => {
    // Set Background size
    const text = tooltip.select('text')
    const txtHeight = Math.round(text.node().getBBox().height) + 23
    const pathLength = period === 'minutes' ? 182 : 142
    const pathLeft = `M${pathLength},${(txtHeight / 2) - 8}l-0,-${(txtHeight / 2) - 8}l-${pathLength},0l0,${txtHeight}l${pathLength},0l0,-${(txtHeight / 2) - 8}l8,-8l-8,-8Z`
    const pathRight = `M8,${(txtHeight / 2) - 8}l0,-${(txtHeight / 2) - 8}l${pathLength},0l-0,${txtHeight}l-${pathLength},0l-0,-${(txtHeight / 2) - 8}l-8,-8l8,-8Z`
    const pathCentre = `M${pathLength},${txtHeight}l0,-${txtHeight}l-${pathLength},0l0,${txtHeight}l${pathLength},0Z`
    const pathWidth = pathLength + 8
    // Set tooltip layout
    tooltipText.attr('x', 0).attr('y', 20)
    if (x >= width - (pathWidth + 10)) {
      // tooltip on the left
      x -= (pathWidth + 3)
      tooltipPath.attr('d', pathLeft)
      tooltipValue.attr('x', 12)
      tooltipDescription.attr('x', 12)
    } else {
      // tooltip on the right
      x += 3
      tooltipPath.attr('d', pathRight)
      tooltipValue.attr('x', 20)
      tooltipDescription.attr('x', 20)
    }
    // tooltip centred
    if (x <= 0) {
      x = 0
      tooltipPath.attr('d', pathCentre)
    }
    // Set background above or below position
    const tooltipHeight = tooltipPath.node().getBBox().height
    const tooltipMarginTop = 10
    const tooltipMarginBottom = height - (tooltipHeight + 10)
    y -= tooltipHeight / 2
    y = y < tooltipMarginTop ? tooltipMarginTop : y > tooltipMarginBottom ? tooltipMarginBottom : y
    tooltip.attr('transform', 'translate(' + x.toFixed(0) + ',' + y.toFixed(0) + ')')
    tooltip.classed('tooltip--visible', true)
    locatorLine.classed('locator__line--visible', !dataTooltip.isLatest)
  }

  const showTooltip = (tooltipY = 10) => {
    // Choose which value to show
    if (!dataTooltip) return
    // Get tooltip position and content
    const formatTime12 = timeFormat(period === 'minutes' ? '%-I:%M%p' : '%-I%p')
    const formatTime24 = timeFormat('%H:%M')
    const timeStart = timeMinute.offset(new Date(dataTooltip.dateTime), period === 'minutes' ? -15 : -60)
    const timeEnd = new Date(dataTooltip.dateTime)
    const value = dataTooltip.isValid ? dataTooltip.value + 'mm' + (dataTooltip.isLatest ? ' latest' : '') : 'No data'
    const description = `${formatTime12(timeStart).toLowerCase()} - ${formatTime12(timeEnd).toLowerCase()}, ${timeFormat('%e %b')(timeEnd)}`
    tooltipValue.attr('dy', '0.5em').text(value)
    tooltipDescription.attr('dy', '1.4em').text(description)
    // Update locator
    locator.attr('transform', 'translate(' + Math.round(xScale(dataTooltip.dateTime)) + ', 0)')
    locatorBackground.attr('x', 0).attr('y', 0).attr('width', xScale.bandwidth()).attr('height', height)
    locatorLine.attr('transform', 'translate(' + Math.round(xScale.bandwidth() / 2) + ', 0)').attr('y1', 0).attr('y2', height)
    // Update bar selected state
    svg.selectAll('.bar--selected').classed('bar--selected', false)
    svg.select('[data-datetime="' + dataTooltip.dateTime + '"]').classed('bar--selected', true)
    // Update tooltip location
    const tooltipX = Math.round(xScale(dataTooltip.dateTime)) + (xScale.bandwidth() / 2)
    // Update screen reader description
    chartDescription.innerHTML = `
      ${value},
      <time datetime="${formatTime24(timeStart)}">${formatTime12(timeStart).toLowerCase()}</time> to
      <time datetime="${formatTime24(timeEnd)}">${formatTime12(timeEnd).toLowerCase()}</time>,
      <time datetime="${timeFormat('%Y-%m-%d')(timeEnd)}">${timeFormat('%e %B')(timeEnd)}</time>
    `
    setTooltipPosition(tooltipX, tooltipY)
  }

  const getNextDataTooltip = (isForeward, hasShift) => {
    let index = dataPage.findIndex(x => x === dataTooltip)
    if (hasShift) {
      // Shift plus arrow keys jumps > 0mm or isLatests
      if (isForeward) {
        for (let i = index; i > 0; i--) {
          if (dataPage[i - 1].value > 0 || dataPage[i - 1].isLatest) {
            index = i - 1
            break
          }
        }
      } else {
        for (let i = index; i < dataPage.length - 1; i++) {
          if (dataPage[i + 1].value > 0 || dataPage[i + 1].isLatest) {
            index = i + 1
            break
          }
        }
      }
    } else {
      // Arrow keys without shift move one bar at a time
      index = isForeward ? index - 1 : index + 1
      index = index > dataPage.length - 1 ? dataPage.length - 1 : index < 0 ? 0 : index
    }
    // Contrain index to array length
    dataTooltip = dataPage[index]
  }

  const hideTooltip = () => {
    svg.selectAll('.bar--selected').classed('bar--selected', false)
    tooltip.classed('tooltip--visible', false)
    locator.classed('locator--visible', false)
    locatorLine.classed('locator__line--visible', false)
    locatorBackground.classed('locator__background--visible', false)
    chartDescription.innerHTML = ''
  }

  const getDataPage = (start, end) => {
    const cacheStart = new Date(dataCache.cacheStartDateTime)
    const cacheEnd = new Date(dataCache.cacheEndDateTime)
    const pageStart = new Date(start)
    const pageEnd = new Date(end)
    // If dates are outside rsange we need to load another data set
    if (pageStart.getTime() < cacheStart.getTime() || pageEnd.getTime() > cacheEnd.getTime()) {
      // Rebuild the cache when we have more data
      // const cacheStart = ?
      // const cacheEnd = ?
      // xhr(`/service/telemetry/rainfall/${telemetryId}/${cacheStart}/${cacheEnd}`, initChart, 'json')
      return
    }
    const now = new Date()
    const dataStart = new Date(dataCache.dataStartDateTime)
    // Determin which resolution and telemetry set to use
    const pageDuration = pageEnd.getTime() - pageStart.getTime()
    const pageDurationHours = pageDuration / (1000 * 60 * 60)
    period = pageDurationHours > 24 ? 'hours' : 'minutes'
    dataPage = period === 'hours' ? dataCache.telemetryHours : dataCache.telemetryMinutes
    // Get value duration
    const valueStart = new Date(dataPage[1].dateTime)
    const valueEnd = new Date(dataPage[0].dateTime)
    const valueDuration = valueEnd.getTime() - valueStart.getTime()
    dataPage = dataPage.filter(x => {
      const date = new Date(x.dateTime)
      return date.getTime() > (pageStart.getTime() + valueDuration) && date.getTime() <= (pageEnd.getTime() + valueDuration)
    })
    // Set segemented control html properties
    segmentedControl.querySelectorAll('.defra-chart-segmented-control__segment input').forEach(input => {
      const selectedClass = 'defra-chart-segmented-control__segment--selected'
      if (period === input.getAttribute('data-period')) {
        input.parentNode.classList.add(selectedClass)
        input.checked = true
      } else {
        input.parentNode.classList.remove(selectedClass)
        input.checked = false
      }
    })
    // Set paging values and ensure they are within data range
    let nextStart = new Date(pageStart.getTime() + pageDuration)
    let nextEnd = new Date(pageEnd.getTime() + pageDuration)
    let previousStart = new Date(pageStart.getTime() - pageDuration)
    let previousEnd = new Date(pageEnd.getTime() - pageDuration)
    nextEnd = nextEnd.getTime() <= now.getTime() ? nextEnd.toISOString().replace(/.\d+Z$/g, 'Z') : null
    nextStart = nextEnd ? nextStart.toISOString().replace(/.\d+Z$/g, 'Z') : null
    previousStart = previousStart.getTime() >= dataStart.getTime() ? previousStart.toISOString().replace(/.\d+Z$/g, 'Z') : null
    previousEnd = previousStart ? previousEnd.toISOString().replace(/.\d+Z$/g, 'Z') : null
    // Set properties
    pagingControl.style.display = (nextStart || previousEnd) ? 'inline-block' : 'none'
    pageForward.setAttribute('data-start', nextStart)
    pageForward.setAttribute('data-end', nextEnd)
    pageBack.setAttribute('data-start', previousStart)
    pageBack.setAttribute('data-end', previousEnd)
    pageForward.setAttribute('aria-disabled', !(nextStart && nextEnd))
    pageBack.setAttribute('aria-disabled', !(previousStart && previousEnd))
  }

  const changePage = (event) => {
    const button = event.target
    direction = button.getAttribute('data-direction')
    pageStart = new Date(button.getAttribute('data-start'))
    pageEnd = new Date(button.getAttribute('data-end'))
    // Move into existing or new methods
    getDataPage(pageStart, pageEnd)
    // Render bars and chart
    renderChart()
    hideTooltip()
    // Show default tooltip
    dataTooltip = dataPage.find(x => x.isLatest)
    showTooltip()
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
    // const formattedTime = timeFormat(period === 'hours' ? '%-I%p' : '%-I:%M%p')(new Date(d)).toLocaleLowerCase()
    const formattedTime = timeFormat('%-I%p')(new Date(d)).toLocaleLowerCase()
    const formattedDate = timeFormat('%-e %b')(new Date(d))
    element.append('tspan').text(formattedTime)
    element.append('tspan').attr('x', 0).attr('dy', '15').text(formattedDate)
  }

  const initChart = (err, response) => {
    if (err) {
      console.log('Error: ' + err)
    } else {
      dataCache = response
      // Show controls
      controlsContainer.style.display = dataCache.telemetryMinutes.length > 1 ? 'block' : 'none'
      // Move into existing or new methods
      getDataPage(pageStart, pageEnd)
      // Render bars and chart
      renderChart()
      hideTooltip()
      // Show default tooltip
      dataTooltip = dataPage.find(x => x.isLatest)
      showTooltip()
    }
  }

  //
  // Setup
  //

  const container = document.querySelector(`#${containerId}`)
  const chart = document.getElementById(containerId)

  // Add controls container
  const controlsContainer = document.createElement('div')
  controlsContainer.style.display = 'none'
  controlsContainer.className = 'defra-chart-controls'
  container.parentNode.insertBefore(controlsContainer, container)

  // Set initial page dates
  let pageStart = new Date()
  let pageEnd = new Date()
  pageStart.setHours(pageStart.getHours() - 120)
  pageStart = pageStart.toISOString().replace(/.\d+Z$/g, 'Z')
  pageEnd = pageEnd.toISOString().replace(/.\d+Z$/g, 'Z')
  let pageStartMinutes = new Date()
  pageStartMinutes.setHours(pageStartMinutes.getHours() - 24)
  pageStartMinutes = pageStartMinutes.toISOString().replace(/.\d+Z$/g, 'Z')

  // Add time scale buttons
  const segmentedControl = document.createElement('div')
  segmentedControl.className = 'defra-chart-segmented-control'
  segmentedControl.innerHTML = `
  <div class="defra-chart-segmented-control__segment">
    <input class="defra-chart-segmented-control__input" name="time" type="radio" id="timeHours" data-period="hours" data-start="${pageStart}" data-end="${pageEnd}" aria-controls="bar-chart"/>
    <label for="timeHours">Hourly</label>
  </div>
  <div class="defra-chart-segmented-control__segment">
    <input class="defra-chart-segmented-control__input" name="time" type="radio" id="timeMinutes" data-period="minutes" data-start="${pageStartMinutes}" data-end="${pageEnd}" aria-controls="bar-chart"/>
    <label for="timeMinutes">15 minutes</label>
  </div>`
  // container.parentNode.insertBefore(segmentedControl, container)
  controlsContainer.appendChild(segmentedControl)

  // Add paging buttons
  const pagingControl = document.createElement('div')
  pagingControl.style.display = 'none'
  pagingControl.className = 'defra-chart-paging-control'
  const pageBack = document.createElement('button')
  pageBack.className = 'defra-chart-paging-control__button defra-chart-paging-control__button--back'
  pageBack.setAttribute('data-direction', 'back')
  pageBack.innerHTML = '<span>Back</span>'
  pageBack.setAttribute('aria-controls', 'bar-chart')
  const pageForward = document.createElement('button')
  pageForward.className = 'defra-chart-paging-control__button defra-chart-paging-control__button--forward'
  pageForward.setAttribute('data-direction', 'forward')
  pageForward.innerHTML = '<span>Forward</span>'
  pageForward.setAttribute('aria-controls', 'bar-chart')
  pagingControl.appendChild(pageBack)
  pagingControl.appendChild(pageForward)
  // container.parentNode.insertBefore(pagingControl, container)
  controlsContainer.appendChild(pagingControl)

  // Create chart container elements
  const svg = select(`#${containerId}`).append('svg')
  svg.attr('aria-hidden', true)
  svg.append('g').attr('class', 'y grid')
  svg.append('g').attr('class', 'x axis')
  svg.append('g').attr('class', 'y axis')
  const clip = svg.append('defs').append('clipPath').attr('id', 'clip').append('rect').attr('x', 0).attr('y', 0)
  const clipInner = svg.append('g').attr('clip-path', 'url(#clip)')

  // Add locator
  const locator = clipInner.append('g').attr('class', 'locator')
  const locatorBackground = locator.append('rect').attr('class', 'locator__background')
  const locatorLine = locator.append('line').attr('class', 'locator__line')

  // Add tooltip container
  const tooltip = svg.append('g').attr('class', 'tooltip')
  const tooltipPath = tooltip.append('path').attr('class', 'tooltip-bg')
  const tooltipText = tooltip.append('text').attr('class', 'tooltip-text')
  const tooltipValue = tooltipText.append('tspan').attr('class', 'tooltip-text__strong')
  const tooltipDescription = tooltipText.append('tspan').attr('class', 'tooltip-text__small')

  // Screen reader descriptions
  const chartDescription = document.createElement('div')
  chartDescription.className = 'govuk-visually-hidden'
  chartDescription.setAttribute('aria-live', 'assertive')
  container.appendChild(chartDescription)

  // Get width and height
  const margin = { top: 0, bottom: 45, left: 0, right: 26 }
  const containerBoundingRect = select('#' + containerId).node().getBoundingClientRect()
  let width = Math.floor(containerBoundingRect.width) - margin.right - margin.left
  let height = Math.floor(containerBoundingRect.height) - margin.bottom - margin.top
  telemetryId = /[^/]*$/.exec(telemetryId)[0]

  // Set defaults
  let xScale, yScale, dataCache, dataPage, dataTooltip, period, direction
  // let isMobile

  // Get mobile media query list
  // const mobileMediaQuery = window.matchMedia('(max-width: 640px)')

  // XMLHttpRequest
  const cacheStart = pageStart // This is effectively the cache date start
  const cacheEnd = pageEnd // This is effectively the cache date end
  xhr(`/service/telemetry/rainfall/${telemetryId}/${cacheStart}/${cacheEnd}`, initChart, 'json')

  //
  // Events
  //

  // mobileMediaQuery.addEventListener('change', renderChart)

  window.addEventListener('resize', () => {
    const containerBoundingRect = select('#' + containerId).node().getBoundingClientRect()
    width = Math.floor(containerBoundingRect.width) - margin.right - margin.left
    height = Math.floor(containerBoundingRect.height) - margin.bottom - margin.top
    renderChart()
    showTooltip()
  })

  document.addEventListener('click', (e) => {
    if (e.target.getAttribute('aria-disabled') === 'true') return
    const classNames = ['defra-chart-segmented-control__input', 'defra-chart-paging-control__button']
    if (classNames.some(className => e.target.classList.contains(className))) {
      changePage(e)
    }
  })

  container.addEventListener('keyup', (e) => {
    if (e.key !== 'Tab') return
    const dataItemIndex = direction === 'back' ? 0 : dataPage.length - 1
    dataTooltip = dataTooltip || dataPage.find(x => x.isLatest) || dataPage[dataItemIndex]
    locatorBackground.classed('locator__background--visible', true)
    showTooltip()
  })

  container.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    locatorBackground.classed('locator__background--visible', true)
    getNextDataTooltip(e.key === 'ArrowRight', e.shiftKey)
    showTooltip()
  })

  container.addEventListener('blur', () => {
    dataTooltip = dataPage.find(x => x.isLatest)
    if (dataTooltip) {
      showTooltip()
    } else {
      dataTooltip = null
      hideTooltip()
    }
    locatorBackground.classed('locator__background--visible', false)
  })

  svg.on('mousemove', (e) => {
    if (!xScale) return
    const mouseDateTime = scaleBandInvert(xScale)(pointer(e)[0])
    dataTooltip = dataPage.find(x => x.dateTime === mouseDateTime)
    locatorBackground.classed('locator__background--visible', false)
    showTooltip(pointer(e)[1])
  })

  svg.on('mouseleave', (e) => {
    if (dataPage) {
      dataTooltip = dataPage.find(x => x.isLatest)
      dataTooltip ? showTooltip() : hideTooltip()
    }
  })

  this.chart = chart
}

window.flood.charts = {
  createBarChart: (containerId, telemetryId) => {
    return new BarChart(containerId, telemetryId)
  }
}
