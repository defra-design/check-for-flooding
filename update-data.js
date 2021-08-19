const axios = require('axios')
const db = require('./service/db')

const type = process.argv[2]

const updateStations = async () => {
  const uri = 'https://environment.data.gov.uk/flood-monitoring/id/stations'
  const response = await axios.get(uri).then((response) => { return response })
  if (response.status === 200) {
    const json = JSON.stringify(response.data.items)
    try {
      const request = await db.query(`
      WITH stations_json (doc) AS (VALUES($1::json))
      INSERT INTO stations_new (@id, label, catchment, river_name, grid_reference, status, rloi_id)
      SELECT p.* FROM stations_json l CROSS JOIN lateral
      json_populate_recordset(NULL::stations_new, doc) AS p ON conflict (id)
      do UPDATE SET name = excluded.name, active = excluded.active;
      `, [`${json}`])
      // response.data.items.forEach(item => {
      //   item.id = item['@id'].split('/').slice(-2).join('/').split('-')[0]
      //   delete item['@id']
      //   delete item.measure
      // })
    } catch (e) {
      console.log(e)
    }
  } else {
    console.log(`Error ${response.status}: Getting levels`)
  }
}

if (type === '-levels') {
  updateStations()
} else {
  console.log('Add type')
}
