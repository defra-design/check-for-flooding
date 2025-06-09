const db = require('./db')

module.exports = {
  // Used on natioanl and location page
  getOutlook: async () => {
    // const response = await db.query(`
    // SELECT * FROM outlook
    // `)
    
  // Mocking the file content instead of pulling from the service
    const outlook = require('../models/5df.json')
    // console.log('Mocked Outlook object:', outlook);
    return Promise.resolve(outlook)
  },
}
