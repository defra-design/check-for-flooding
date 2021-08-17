const axios = require('axios')
const db = require('./db')

module.exports = {
  // Used in search
  getRivers: async () => {
    const response = await db.query('SELECT * FROM river')
    return response.rows
  },

  getRiverBySlug: async (slug) => {
    const response = await db.query(`
    SELECT * FROM river
    WHERE slug = $1
    ORDER BY display
    `, [slug])
    return response.rows[0] || {}
  },

  getRiversLikeSlug: async (slug) => {
    const response = await db.query(`
    SELECT * FROM river
    WHERE slug LIKE $1 OR slug LIKE $2 OR slug = $3
    ORDER BY display
    `, [`%-${slug}%`, `%${slug}-%`, slug])
    return response.rows
  },

  // Used on list pages
  getRiverDetailBySlug: async (slug) => {
    const response = await db.query(`
    SELECT river.display AS name, river.slug,
    replace(substring(left(ST_Extent(station.geom) :: text, -1), 5),' ',',') AS bbox
    FROM river
    LEFT JOIN river_station ON river_station.slug = river.slug
    LEFT JOIN station ON river_station.station_id = station.id
    WHERE river.slug LIKE $1 OR river.slug LIKE $2 OR river.slug LIKE $3
    GROUP BY river.display, river.slug
    `, [`%-${slug}%`, `%${slug}-%`, slug])
    // Address this in SQL/Materialised view
    if (response.rows && [...new Set(response.rows.map(item => item.river_slug))].length > 1) {
      response.rows = []
    }
    return response.rows.length ? response.rows[0] : {}
  },

  // Used on list pages
  getStationsWithinBbox: async (bbox) => {
    // Convert type names to chars
    const response = await db.query(`
    SELECT station.name,
    CAST(station.id AS text) AS id,
    CASE WHEN station.value <= station.percentile_95 THEN 'low'
    WHEN station.value >= station.percentile_5 THEN 'high'
    ELSE 'normal'
    END as state,
    round(station.value, 2) AS value, station.value_date,
    CASE WHEN station.type = 'c' THEN 'tide'
    WHEN station.type = 'g' THEN 'groundwater'
    ELSE 'river'
    END AS type,
    CASE WHEN river.display is NOT NULL THEN river.display
    ELSE station.name
    END AS group_name,
    CASE WHEN river.display is NOT NULL THEN river.slug
    ELSE NULL
    END AS river_slug
    FROM river
    RIGHT JOIN river_station ON river_station.slug = river.slug
    RIGHT JOIN station ON river_station.station_id = station.id
    WHERE ST_Contains(ST_MakeEnvelope($1,$2,$3,$4,4326),station.geom)
    ORDER BY group_name, river_station.order  
    `, bbox)
    return response.rows || {}
  },

  // Used on list pages
  getStationsByRiverSlug: async (slug) => {
    // Convert type names to chars
    const response = await db.query(`
    SELECT station.name,
    CAST(station.id AS text) AS id,
    CASE WHEN station.value <= station.percentile_95 THEN 'low'
    WHEN station.value >= station.percentile_5 THEN 'high'
    ELSE 'normal'
    END as state,
    round(station.value, 2) AS value, station.value_date,
    CASE WHEN station.type = 'c' THEN 'tide'
    WHEN station.type = 'g' THEN 'groundwater'
    ELSE 'river'
    END AS type,
    CASE WHEN river.display is NOT NULL THEN river.display
    ELSE station.name
    END AS group_name,
    CASE WHEN river.display is NOT NULL THEN river.slug
    ELSE NULL
    END AS river_slug
    FROM river
    RIGHT JOIN river_station ON river_station.slug = river.slug
    RIGHT JOIN station ON river_station.station_id = station.id
    WHERE river.slug LIKE $1 OR river.slug LIKE $2 OR river.slug LIKE $3
    ORDER BY group_name, river_station.order 
    `, [`%-${slug}%`, `%${slug}-%`, slug])
    // Address this in SQL/Materialised view
    if (response.rows && [...new Set(response.rows.map(item => item.river_slug))].length > 1) {
      response.rows = []
    }
    return response.rows || []
  },

  // Get latest station values
  getStationsLatest: async () => {
    const uri = 'https://environment.data.gov.uk/flood-monitoring/data/readings?latest'
    const response = await axios.get(uri).then((response) => { return response })
    if (response.status === 200) {
      response.data.items.forEach(item => {
        item.id = item['@id'].split('/').slice(-2).join('/').split('-')[0]
        delete item['@id']
        delete item.measure
      })
      return response.data.items
    }
  }
}
