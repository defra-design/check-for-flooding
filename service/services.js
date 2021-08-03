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
    `, [slug])
    return response.rows[0] || {}
  },

  getRiversLikeSlug: async (slug) => {
    const response = await db.query(`
    SELECT * FROM river
    WHERE slug LIKE $1 OR slug LIKE $2 OR slug = $3
    `, [`%-${slug}%`, `%${slug}-%`, slug])
    return response.rows
  },

  // Used on list pages
  getRiverDetailBySlug: async (slug) => {
    const response = await db.query(`
    (SELECT river.display AS name, river.slug AS id, null AS state, null AS type, null AS value, null AS value_date,
    replace(substring(left(ST_Extent(station.geom) :: text, -1), 5),' ',',') AS bbox
    FROM river
    INNER JOIN river_station ON river_station.slug = river.slug
    INNER JOIN station ON river_station.station_id = station.id
    WHERE river.slug = 'river-eden-cumbria'
    GROUP BY river.display, river.slug)
    UNION ALL
    (SELECT station.name AS name, CAST(station.id AS text) AS id,
    CASE WHEN station.value <= station.percentile_95 THEN 'low'
    WHEN station.value >= station.percentile_5 THEN 'high'
    ELSE 'normal'
    END as state,
    CASE WHEN station.type = 'c' THEN 'tide'
    WHEN station.type = 'g' THEN 'groundwater'
    ELSE 'river'
    END AS type,
    round(station.value, 2), station.value_date, null AS bbox
    FROM station
    INNER JOIN river_station ON river_station.station_id = station.id
    WHERE river_station.slug = $1
    ORDER BY river_station.order)
    `, [slug])
    return response.rows || {}
  },

  // Used on list pages
  getStationsWithinBbox: async (bbox) => {
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
  }
}
