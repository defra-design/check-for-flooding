'use strict'

class Notification {
  constructor () {
    console.log('Init audio')
    const data = 'data:audio/mpeg;base64,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'
    this.sound = new Audio(data)
    
    // const url = '/public/sounds/notification.mp3'
    // window.AudioContext = window.AudioContext || window.webkitAudioContext
    // const context = new AudioContext()

    // console.log('Audio context: ', context.state)

    // const source = context.createBufferSource()
    // source.connect(context.destination)
    // const request = new XMLHttpRequest()
    // request.open('GET', url, true);
    // request.responseType = 'arraybuffer'
    // console.log('1. In here: ', url)
    // request.onload = function() {
    //   context.decodeAudioData(request.response, response => {
    //     source.buffer = response
    //     console.log('2. In here')
    //     console.log(source)
    //     source.start(0)
    //     source.loop = true
    //   }, () => {
    //     console.error('The request failed.')
    //   })
    // }
    // request.send()

    // // Events
    // document.body.addEventListener('touchstart', this._unlock.bind(this), false)
    // document.body.addEventListener('touchend', this._unlock.bind(this), false)
  }

  // unlock () {
  //   this.context.resume().then(() => {
  //     document.body.removeEventListener('touchstart', this._unlock)
  //     document.body.removeEventListener('touchend', this._unlock)
  //   })
  // }

  playSound (volume) {
    const sound = this.sound
    sound.volume = volume || 0.1
    sound.play()
  }
}

export default Notification
