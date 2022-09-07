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
      CASE WHEN type = 'tide' AND measure_with_latest.river_id IS NOT NULL THEN 'river' WHEN type = 'tide' AND measure_with_latest.river_id IS NULL THEN 'sea' ELSE measure_with_latest.type END AS group_type,
      ROUND (ST_Distance(ST_Centroid(ST_MakeEnvelope($1, $2, $3, $4, 4326))::geography, geom::geography)) AS distance,
      river_name,
      river_display,
      river_order,
      rainfall_1hr,
      rainfall_6hr,
      rainfall_24hr,
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
  getStationsByRiverDisplay: async (display) => {
    const response = await db.query(`
      SELECT 
      CASE WHEN type = 'rainfall' THEN station_id ELSE rloi_id END AS id,
      name,
      status,
      type,
      CASE WHEN type = 'tide' AND measure_with_latest.river_id IS NOT NULL THEN 'river' WHEN type = 'tide' AND measure_with_latest.river_id IS NULL THEN 'sea' ELSE measure_with_latest.type END AS group_type,
      river_name,
      river_display,
      river_order,
      rainfall_1hr,
      rainfall_6hr,
      rainfall_24hr,
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
      WHERE river_display SIMILAR TO $1
      ORDER BY river_order, is_downstage;
    `, [`%(-${display}|${display}-|${display})%`])
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
      measure_type,
      CONCAT(lon,',',lat) AS centroid,
      station_up,
      station_down,
      river_name,
      river_display,
      river_order,
      level_max,
      level_max_datetime,
      level_high,
      level_low,
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
