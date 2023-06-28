'use strict'

class Config {
  static _breakpoints = { // Max width
    mobile: '640px',
    tablet: '834px'
  }

  static availabilityEndPoint = '/webchat-availability'
  static timeout = 10 // 20 minutes
  static countdown = 10 // Seconds
  static poll = 15 // Seconds
  static isAudioNotifications = true
  static isMobileSendOnEnter = false
  static isDesktopSendOnEnter = true

  static getBreakpoint (device) {
    return this._breakpoints[device]
  }
}

export default Config