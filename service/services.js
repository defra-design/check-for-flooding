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
    (SELECT station.name,
    station.id,
    station.state,
    station.value,
    station.value_downstream,
    station.value_1hr,
    station.value_6hr,
    station.value_24hr,
    station.value_date,
    station.type_name AS type,
    CASE WHEN station.type = 'm' THEN 1 ELSE 0 END AS is_multi,
    CASE WHEN river.display is NOT NULL THEN river.display ELSE station.name END AS group_name,
    CASE WHEN river.display is NOT NULL THEN river.slug ELSE NULL END AS river_slug,
    river_station.order AS station_order,
    0 AS is_downstream
    FROM river
    RIGHT JOIN river_station ON river_station.slug = river.slug
    RIGHT JOIN station ON river_station.station_id = station.id
    WHERE ST_Contains(ST_MakeEnvelope($1,$2,$3,$4,4326),station.geom))
    UNION ALL
    (SELECT station.name,
    station.id,
    station.state,
    station.value,
    station.value_downstream,
    station.value_1hr,
    station.value_6hr,
    station.value_24hr,
    station.value_date,
    station.type_name AS type,
    CASE WHEN station.type = 'm' THEN 1 ELSE 0 END AS is_multi,
    CASE WHEN river.display is NOT NULL THEN river.display ELSE station.name END AS group_name,
    CASE WHEN river.display is NOT NULL THEN river.slug ELSE NULL END AS river_slug,
    river_station.order AS station_order,
    1 AS is_downstream
    FROM river
    RIGHT JOIN river_station ON river_station.slug = river.slug
    RIGHT JOIN station ON river_station.station_id = station.id
    WHERE (ST_Contains(ST_MakeEnvelope($1,$2,$3,$4,4326),station.geom)) AND station.type = 'm')
    ORDER BY group_name, station_order, is_downstream  
    `, bbox)
    return response.rows || {}
  },

  // Used on list pages
  getStationsByRiverSlug: async (slug) => {
    // Convert type names to chars
    const response = await db.query(`
    (SELECT station.name,
    station.id,
    station.state,
    station.value,
    station.value_downstream,
    station.value_1hr,
    station.value_6hr,
    station.value_24hr,
    station.value_date,
    station.type_name AS type,
    CASE WHEN river.display is NOT NULL THEN river.display ELSE station.name END AS group_name,
    CASE WHEN river.display is NOT NULL THEN river.slug ELSE NULL END AS river_slug,
    river_station.order AS station_order,
    0 AS is_downstream
    FROM river
    RIGHT JOIN river_station ON river_station.slug = river.slug
    RIGHT JOIN station ON river_station.station_id = station.id
    WHERE river.slug LIKE $1 OR river.slug LIKE $2 OR river.slug LIKE $3)
    UNION ALL
    (SELECT station.name,
    station.id,
    station.state,
    station.value,
    station.value_downstream,
    station.value_1hr,
    station.value_6hr,
    station.value_24hr,
    station.value_date,
    station.type_name AS type,
    CASE WHEN river.display is NOT NULL THEN river.display ELSE station.name END AS group_name,
    CASE WHEN river.display is NOT NULL THEN river.slug ELSE NULL END AS river_slug,
    river_station.order AS station_order,
    1 AS is_downstream
    FROM river
    RIGHT JOIN river_station ON river_station.slug = river.slug
    RIGHT JOIN station ON river_station.station_id = station.id
    WHERE (river.slug LIKE $1 OR river.slug LIKE $2 OR river.slug LIKE $3) AND station.type = 'm')
    ORDER BY group_name, station_order, is_downstream
    `, [`%-${slug}%`, `%${slug}-%`, slug])
    // Address this in SQL/Materialised view
    if (response.rows && [...new Set(response.rows.map(item => item.river_slug))].length > 1) {
      response.rows = []
    }
    return response.rows || []
  }
}
