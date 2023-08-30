'use strict'

class Config {
  static _breakpoints = { // Max width
    mobile: '640px',
    tablet: '834px'
  }

  static maxQueue = 2
  static availabilityEndPoint = '/webchat-availability'
  static timeout = -1 // 20 minutes
  static countdown = -1 // Seconds
  static poll = -1 // Seconds

  static getBreakpoint (device) {
    return this._breakpoints[device]
  }
}

export default Config