
// NPM dependencies
const browserSync = require('browser-sync')
// const fs = require('fs')
// const https = require('https')

// Local dependencies
const server = require('./server.js')
// const app = require('./server.js')
const config = require('./app/config.js')
const utils = require('./lib/utils.js')

// Use https on localhost
// const key = fs.readFileSync('./localhost-key.pem')
// const cert = fs.readFileSync('./localhost.pem')
// const server = https.createServer({ key: key, cert: cert }, app)

// Set up configuration variables
var useBrowserSync = config.useBrowserSync.toLowerCase()
var env = (process.env.NODE_ENV || 'development').toLowerCase()

utils.findAvailablePort(server, function (port) {
  console.log('Listening on port ' + port + '   url: http://localhost:' + port)
  if (env === 'production' || useBrowserSync === 'false') {
    server.listen(port)
  } else {
    server.listen(port - 50, function () {
      browserSync({
        proxy: 'localhost:' + (port - 50),
        port: port,
        ui: false,
        files: ['public/**/*.*', 'app/views/**/*.*'],
        ghostMode: false,
        open: false,
        notify: false,
        logLevel: 'error'
      })
    })
  }
})
