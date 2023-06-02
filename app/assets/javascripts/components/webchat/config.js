'use strict'

class Config {
  static _breakpoints = { // Max width
    mobile: '640px',
    tablet: '834px'
  }

  static timeout = 5 // Seconds

  static getBreakpoint (device) {
    return this._breakpoints[device]
  }
}

export default Config