'use strict'

class Config {
  static _breakpoints = { // Max width
    mobile: '640px',
    tablet: '834px'
  }

  static timeout = 600 // 10 minutes

  static countdown = 60 // Seconds

  static getBreakpoint (device) {
    return this._breakpoints[device]
  }
}

export default Config