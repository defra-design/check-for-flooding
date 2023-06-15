'use strict'

class Transcript {
  constructor (messages) {
    const text = 'This is some test text for the transcript'
    this.data = `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`
  }
}

export default Transcript
