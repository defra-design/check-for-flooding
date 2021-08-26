const db = require('./db')

module.exports = {
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
  },

  // Used with maps
  getStationsGeoJSON: async (type) => {
    const response = await db.query(`
    SELECT id, lon, lat, upper(type) AS type, is_wales, initcap(status) AS status, state, name, river, value, value_1hr, value_6hr, value_24hr, value_date, percentile_5, percentile_95, up, down
    FROM station
    WHERE $1 LIKE '%' || type || '%';
    `, [`${type}`])
    const features = []
    response.rows.forEach(row => {
      features.push({
        type: 'Feature',
        id: `stations.${row.id.replace(/\s/g, '')}`,
        geometry: {
          type: 'Point',
          coordinates: [row.lon, row.lat]
        },
        properties: {
          type: row.type,
          iswales: row.is_wales,
          status: row.status,
          atrisk: !!(row.state === 'high'),
          name: row.name,
          river: row.river,
          value: row.value,
          valueDate: row.value_date,
          value1hr: row.value_1hr,
          value6hr: row.value_6hr,
          value24hr: row.value_24hr,
          percentile5: row.percentile_5,
          percentile95: row.percentile_95,
          up: row.up,
          down: row.down
        }
      })
    })
    const geoJSON = {
      type: 'FeatureCollection',
      features: features
    }
    return geoJSON
  }
}
