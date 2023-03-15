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
      river_id,
      river_name,
      river_display,
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
      CASE WHEN is_multi_stage AND measure_type != 'downstage' THEN true ELSE false END AS is_upstage,
      CASE WHEN measure_id LIKE '%mAOD%' THEN true ELSE false END AS is_aod,
      is_wales,
      is_forecast,
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
  getStationsByRiver: async (name) => {
    const response = await db.query(`
      SELECT 
      CASE WHEN type = 'rainfall' THEN station_id ELSE rloi_id END AS id,
      name,
      status,
      type,
      CASE WHEN type = 'tide' AND river_id IS NOT NULL THEN 'river' WHEN type = 'tide' AND river_id IS NULL THEN 'sea' ELSE type END AS group_type,
      river_id,
      river_name,
      river_display,
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
      CASE WHEN is_multi_stage AND measure_type != 'downstage' THEN true ELSE false END AS is_upstage,
      CASE WHEN measure_id LIKE '%mAOD%' THEN true ELSE false END AS is_aod,
      is_wales,
      is_forecast,
      CASE WHEN measure_id IS NOT NULL THEN true ELSE false END AS has_detail,
      lon,
      lat
      FROM measure_with_latest
      WHERE lower(river_display) = lower($1)
      ORDER BY river_order, is_downstage;
    `, name)
    return response
  },

  // Used on list page
  getStationsByTargetAreaTrigger: async (id) => {
    const response = await db.query(`
      SELECT
      a.targetarea_id,
      b.rloi_id AS id,
      b.name,
      b.status,
      b.type,
      CASE WHEN b.type = 'tide' AND b.river_id IS NOT NULL THEN 'river' WHEN b.type = 'tide' AND b.river_id IS NULL THEN 'sea' ELSE b.type END AS group_type,
      b.river_id,
      b.river_name,
      b.river_display,
      b.river_order,
      b.latest_height,
      b.latest_state,
      b.latest_datetime AT TIME ZONE '+00' AS latest_datetime,
      b.latest_status,
      b.is_multi_stage,
      CASE WHEN b.measure_type = 'downstage' THEN true ELSE false END AS is_downstage,
      CASE WHEN b.is_multi_stage AND b.measure_type != 'downstage' THEN true ELSE false END AS is_upstage,
      CASE WHEN b.measure_id LIKE '%mAOD%' THEN true ELSE false END AS is_aod,
      b.is_wales,
      b.is_forecast,
      CASE WHEN b.measure_id IS NOT NULL THEN true ELSE false END AS has_detail,
      b.lon,
      b.lat
      FROM targetarea_trigger a
      LEFT JOIN measure_with_latest b ON a.trigger_id = b.rloi_id 
      WHERE lower(a.targetarea_id) = $1
      ORDER BY river_order, is_downstage;
    `, id)
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
      CASE WHEN type = 'tide' AND river_id IS NOT NULL THEN 'river' WHEN type = 'tide' AND river_id IS NULL THEN 'sea' ELSE type END AS group_type,
      measure_type,
      CONCAT(lon,',',lat) AS centroid,
      station_up,
      station_down,
      river_id,
      river_name,
      river_display,
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
      CASE WHEN is_multi_stage AND measure_type != 'downstage' THEN true ELSE false END AS is_upstage,
      CASE WHEN measure_id LIKE '%mAOD%' THEN true ELSE false END AS is_aod,
      is_wales,
      is_forecast,
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
