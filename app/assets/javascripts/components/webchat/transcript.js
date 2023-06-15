'use strict'

class Transcript {
  constructor (messages) {
    console.log(messages)
    const text = this._buildString(messages)
    console.log(text)
    this.data = `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`
  }

  _buildString (messages) {
    const dateNow = this._formatDate(new Date())
    let string = `Floodline webchat transcript at ${dateNow}\n\n`
    for (let i = 0; i < messages.length; i++) {
      const author = messages[i].direction === 'inbound' ? messages[i].user : `${messages[i].assignee} (Floodline adviser)`
      const date = this._formatDate(messages[i].createdAt)
      string += `${author} at ${date}\n${messages[i].text}\n\n`
    }
    return string
  }

  _formatDate (datetime) {
      let hours = datetime.getHours()
      let minutes = datetime.getMinutes()
      minutes = `${minutes < 10 ? '0' : ''}${minutes}`
      const ampm = hours >= 12 ? 'pm' : 'am'
      hours %= 12
      hours = hours || 12
      const time = `${hours}:${minutes}${ampm}`
      const date = datetime.toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      return `${time}, ${date}`
  }
}

export default Transcript
