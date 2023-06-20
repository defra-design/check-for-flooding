'use strict'

class Config {
  static _breakpoints = { // Max width
    mobile: '640px',
    tablet: '834px'
  }

  static timeout = 1200 // 20 minutes
  static countdown = 60 // Seconds
  static poll = 20 // Seconds
  static isAudioNotifications = true
  static isMobileSendOnEnter = false
  static isDesktopSendOnEnter = true

  static getBreakpoint (device) {
    return this._breakpoints[device]
  }
}

export default Config