const amqp = require('amqp-connection-manager')
const update = require('./service/bin/update')

const AMQP_URL = process.env.CLOUDAMQP_URL || 'amqp://localhost'
if (!AMQP_URL) process.exit(1)

const WORKER_QUEUE = 'worker-queue'

// Create a new connection manager from AMQP
const connection = amqp.connect([AMQP_URL])
console.log('[AMQP] - Connecting....')

connection.on('connect', function () {
  process.once('SIGINT', function () { // Close conn on exit
    connection.close()
  })
  return console.log('[AMQP] - Connected!')
})

connection.on('disconnect', function (params) {
  return console.error('[AMQP] - Disconnected.', params.err.stack)
})

// ---------- To receive the execution task messages
const channelWrapper = connection.createChannel({
  json: true,
  setup: function (channel) {
    return Promise.all([
      channel.assertQueue(WORKER_QUEUE, { autoDelete: false, durable: true }),
      channel.prefetch(1),
      channel.consume(WORKER_QUEUE, onMessage)
    ])
  }
})

channelWrapper.waitForConnect()
  .then(function () {
    console.log('[AMQP] - Listening for messages on queue => ' + WORKER_QUEUE)
  })
  .catch(function (err) {
    console.error('[AMQP] - Error! ', err)
  })

// Process message from AMQP
function onMessage (data) {
  let message
  try {
    message = JSON.parse(data.content.toString())
  } catch (e) {
    console.error('[AMQP] - Error parsing message... ', data)
  }

  console.log('[AMQP] - Message incoming... ', message)
  channelWrapper.ack(data)
  if (!message) {
    return
  }

  if (message.taskName === 'update') {
    console.log('In here...')
    console.log(update())
    update()
  } else {
    console.error('No task was found with name => ' + message.taskName)
  }
}
