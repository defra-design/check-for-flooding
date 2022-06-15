const db = require('./db')

module.exports = {
  // Used on list page
  getStationsWithinBbox: async (bbox) => {
    const response = await db.query(`
      SELECT 
      CASE WHEN type = 'rainfall' THEN station_id ELSE rloi_id END AS id,
      name,
      status,
      type,
      CASE WHEN type = 'tide' AND measure_with_latest.river_slug IS NOT NULL THEN 'river' WHEN type = 'tide' AND measure_with_latest.river_slug IS NULL THEN 'sea' ELSE measure_with_latest.type END AS group_type,
      ROUND (ST_Distance(ST_Centroid(ST_MakeEnvelope($1, $2, $3, $4, 4326))::geography, geom::geography)) AS distance,
      river_name,
      river_display,
      river_slug,
      river_order,
      rainfall_1hr,
      rainfall_6hr,
      rainfall_24hr,
      latest_trend,
      latest_height,
      latest_state,
      latest_datetime AT TIME ZONE '+00' AS latest_datetime,
      latest_status,
      is_multi_stage,
      CASE WHEN measure_type = 'downstage' THEN true ELSE false END AS is_downstage,
      is_wales,
      CASE WHEN measure_id IS NOT NULL THEN true ELSE false END AS has_detail,
      lon,
      lat
      FROM measure_with_latest
      WHERE ST_Contains(ST_MakeEnvelope($1, $2, $3, $4,4326),geom)
      ORDER BY distance, is_downstage;   
    `, bbox)
    return response || {}
  },

  // Used on list page
  getStationsByRiverSlug: async (slug) => {
    const response = await db.query(`
      SELECT 
      CASE WHEN type = 'rainfall' THEN measure_with_latest.station_id ELSE measure_with_latest.rloi_id END AS id,
      measure_with_latest.name,
      measure_with_latest.hydrological_catchment_id,
      measure_with_latest.status,
      measure_with_latest.type,
      CASE WHEN type = 'tide' AND measure_with_latest.river_slug IS NOT NULL THEN 'river' WHEN type = 'tide' AND measure_with_latest.river_slug IS NULL THEN 'sea' ELSE measure_with_latest.type END AS group_type,
      measure_with_latest.river_name,
      measure_with_latest.river_display,
      measure_with_latest.river_slug,
      measure_with_latest.river_order,
      measure_with_latest.rainfall_1hr,
      measure_with_latest.rainfall_6hr,
      measure_with_latest.rainfall_24hr,
      measure_with_latest.latest_trend,
      measure_with_latest.latest_height,
      measure_with_latest.latest_state,
      measure_with_latest.latest_datetime AT TIME ZONE '+00' AS latest_datetime,
      measure_with_latest.latest_status,
      measure_with_latest.is_multi_stage,
      CASE WHEN measure_with_latest.measure_type = 'downstage' THEN true ELSE false END AS is_downstage,
      measure_with_latest.is_wales,
      CASE WHEN measure_with_latest.measure_id IS NOT NULL THEN true ELSE false END AS has_detail,
      measure_with_latest.lon,
      measure_with_latest.lat,
      river_catchment_station.distance
      FROM river_catchment_station
      LEFT JOIN measure_with_latest ON measure_with_latest.station_id = river_catchment_station.station_id
      WHERE river_catchment_station.river_slug = $1
      ORDER BY river_order, is_downstage, distance;
    `, slug)
    return response
  },

  // Used on list page
  getStationsByCatchmentQuery: async (query) => {
    const response = await db.query(`
      SELECT 
      CASE WHEN type = 'rainfall' THEN station_id ELSE rloi_id END AS id,
      name,
      hydrological_catchment_id,
      status,
      type,
      CASE WHEN type = 'tide' AND river_slug IS NOT NULL THEN 'river' WHEN type = 'tide' AND river_slug IS NULL THEN 'sea' ELSE type END AS group_type,
      river_name,
      river_display,
      river_slug,
      river_order,
      rainfall_1hr,
      rainfall_6hr,
      rainfall_24hr,
      latest_trend,
      latest_height,
      latest_state,
      latest_datetime AT TIME ZONE '+00' AS latest_datetime,
      latest_status,
      is_multi_stage,
      CASE WHEN measure_type = 'downstage' THEN true ELSE false END AS is_downstage,
      is_wales,
      CASE WHEN measure_id IS NOT NULL THEN true ELSE false END AS has_detail,
      lon,
      lat
      FROM measure_with_latest
      WHERE lower(concat(hydrological_catchment_name, ' catchment')) = lower($1)
      ORDER BY river_name, river_order, is_downstage;
    `, query)
    return response
  },

  // Used on detail page
  getStation: async (id) => {
    const response = await db.query(`
      SELECT
      station_id,
      rloi_id,
      name,
      status,
      type,
      CASE WHEN type = 'tide' AND river_slug IS NOT NULL THEN 'river' WHEN type = 'tide' AND river_slug IS NULL THEN 'sea' ELSE type END AS group_type,
      measure_type,
      CONCAT(lon,',',lat) AS centroid,
      station_up,
      station_down,
      river_name,
      river_display,
      river_slug,
      river_order,
      level_max,
      level_max_datetime,
      level_high,
      level_low,
      latest_trend,
      latest_height,
      latest_state,
      latest_datetime AT TIME ZONE '+00' AS latest_datetime,
      latest_status,
      is_multi_stage,
      CASE WHEN measure_type = 'downstage' THEN true ELSE false END AS is_downstage,
      is_wales,
      measure_id
      FROM measure_with_latest
      WHERE lower(rloi_id) = lower($1)
    `, [id])
    return response[0]
  },

  // Used on detail page
  getStationRain: async (id) => {
    const response = await db.query(`
      SELECT
      station_id,
      name,
      type,
      'rainfall' AS group_type,
      rainfall_1hr,
      rainfall_6hr,
      rainfall_24hr,
      latest_datetime AT TIME ZONE '+00' AS latest_datetime,
      CONCAT(lon,',',lat) AS centroid,
      measure_id
      FROM measure_with_latest
      WHERE lower(station_id) = lower($1)
    `, [id])
    return response[0]
  }
}
