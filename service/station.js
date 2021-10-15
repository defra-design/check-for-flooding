const db = require('./db')

module.exports = {
  // Used on list page
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

  // Used on list page
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
  },

  // Used on detail page
  getStation: async (id) => {
    const response = await db.query(`
    SELECT
    station.id,
    CASE
    WHEN station.type = 'm' THEN true
    ELSE false
    END AS is_multi,
    station.type_name AS type,
    river.display AS river,
    station.river AS river_name_wiski,
    station.name,
    station.state,
    station.status,
    station.percentile_95 AS range_bottom,
    station.percentile_5 AS range_top,
    station.value AS height,
    station.value_downstream AS height_downstream,
    station.value_1hr AS rainfall_1hr,
    station.value_6hr AS rainfall_6hr,
    station.value_24hr AS rainfall_24hr,
    station.value_date AS date,
    station.value_status AS value_status,
    station.up AS upstream_id,
    station.down AS downstream_id,
    CONCAT(station.lon,',',station.lat) AS centroid,
    station.is_wales
    FROM station
    LEFT JOIN river_station ON river_station.station_id = station.id
    LEFT JOIN river ON river.slug = river_station.slug
    WHERE station.id = $1
    `, [id])
    return response.rows[0]
  }
}
