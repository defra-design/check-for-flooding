const db = require('./db')
const places = require('./data/places.json')
const outlookServices = require('./outlook')
const OutlookGeoJSON = require('./models/outlook')

module.exports = {
  getPlacesGeoJSON: async () => {
    return places
  },
  getOutlookGeoJSON: async () => {
    const outlook = await outlookServices.getOutlook()
    return new OutlookGeoJSON(outlook)
  },
  getWarningsGeoJSON: async () => {
    const response = await db.query(`
    SELECT * FROM (SELECT warning.id, ST_AsGeoJSON(ST_Centroid(geom), 6)::JSONB AS geometry, warning.name, warning.severity,
    CASE WHEN warning.severity = 1 THEN 'severe' WHEN warning.severity = 2 THEN 'warning' WHEN warning.severity = 3 THEN 'alert' ELSE 'removed' END AS state,
    warning.raised_date AT TIME ZONE '+00' AS raised_date, warning.severity_changed_date AT TIME ZONE '+00' AS severity_changed_date
    FROM warning JOIN flood_warning_areas ON flood_warning_areas.fws_tacode = warning.id UNION
    SELECT warning.id, ST_AsGeoJSON(ST_Centroid(geom), 6)::JSONB AS geometry, warning.name, warning.severity,
    CASE WHEN warning.severity = 1 THEN 'severe' WHEN warning.severity = 2 THEN 'warning' WHEN warning.severity = 3 THEN 'alert' ELSE 'removed' END AS state,
    warning.raised_date AT TIME ZONE '+00' AS raised_date, warning.severity_changed_date AT TIME ZONE '+00' AS severity_changed_date
    FROM warning JOIN flood_alert_areas ON flood_alert_areas.fws_tacode = warning.id) q ORDER BY q.severity DESC;
    `)
    const features = []
    response.forEach(item => {
      features.push({
        type: 'Feature',
        id: item.id.toUpperCase(),
        geometry: item.geometry,
        properties: {
          id: item.id,
          type: 'targetarea',
          name: item.name,
          state: item.state,
          issuedDate: item.raised_date,
          severityChangedDate: item.severity_changed_date
        }
      })
    })
    const geoJSON = {
      type: 'FeatureCollection',
      features: features
    }
    return geoJSON
  },
  getStationsGeoJSON: async () => {
    const response = await db.query(`
    SELECT station_id,
    CASE WHEN type = 'tide' AND river_id IS NOT NULL THEN 'river' WHEN type = 'tide' AND river_id IS NULL THEN 'sea' WHEN type = 'rainfall' THEN 'rain' ELSE type END AS type,
    rloi_id, lon, lat, is_multi_stage, measure_type, is_wales, latest_state,
    CASE
    WHEN latest_state = 'high' THEN 'withrisk'
    WHEN type = 'rainfall' AND rainfall_24hr = 0 THEN 'norisk'
    WHEN status != 'active' THEN 'error'
    ELSE 'default' END AS state,
    name, river_id, river_name, hydrological_catchment_id, hydrological_catchment_name, latest_trend, latest_height, rainfall_1hr, rainfall_6hr, rainfall_24hr, latest_datetime AT TIME ZONE '+00' AS latest_datetime, level_high, level_low, station_up, station_down
    FROM measure_with_latest
    ORDER BY array_position(array[null,'low','normal','high'], measure_with_latest.latest_state);
    `)
    // Build GeoJSON
    const features = []
    response.forEach(item => {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [item.lon, item.lat]
        },
        properties: {
          id: item.type === 'rain' ? `r${item.station_id}` : `s${item.rloi_id}`,
          type: item.type,
          name: item.name,
          riverId: item.river_id,
          riverName: item.river_name,
          state: item.state,
          status: item.status,
          value1hr: item.rainfall_1hr,
          value6hr: item.rainfall_6hr,
          value24hr: item.rainfall_24hr,
          latestHeight: item.latest_height ? Math.round(Number(item.latest_height) * 100) / 100 : null,
          latestTrend: item.latest_trend,
          latestState: item.latest_state,
          latestDate: item.latest_datetime,
          stationUp: item.station_up,
          stationDown: item.station_down,
          isMultiStage: item.is_multi_stage,
          isDownstage: item.measure_type === 'downstage',
          isWales: item.is_wales
        }
      })
    })
    const geoJSON = {
      type: 'FeatureCollection',
      features: features
    }
    return geoJSON
  },
  getTargetAreasGeoJSON: async () => {
    const response = await db.query(`
    SELECT 5000 + id AS id, ST_AsGeoJSON(geom)::JSONB AS geometry, fws_tacode
    FROM flood_alert_areas
    UNION ALL
    SELECT id, ST_AsGeoJSON(geom)::JSONB AS geometry, fws_tacode
    FROM flood_warning_areas
    `)
    const features = []
    response.forEach(item => {
      features.push({
        type: 'Feature',
        id: item.id.toUpperCase(),
        geometry: item.geometry,
        properties: {
          fws_tacode: item.fws_tacode.toUpperCase()
        }
      })
    })
    const geoJSON = {
      type: 'FeatureCollection',
      features: features
    }
    return geoJSON
  },

  //
  // Test
  //

  getRiverGeoJSON: async (id) => {
    const response = await db.query(`
    WITH start AS (
      SELECT DISTINCT ON (river_station.river_id)
      river_station.station_id AS intersect_station_id,
      river.id AS river_id,
      river.local_name AS ea_name,
      river.other_names,
      river.os_line_ids,
      CASE WHEN river.exclude_os_line_ids IS NULL THEN '--' ELSE river.exclude_os_line_ids END AS exclude_os_line_ids,
      os_open_rivers.ogc_fid AS ogc_fid
      FROM station
      LEFT JOIN river_station ON station.rloi_id = river_station.station_id
      LEFT JOIN river ON river.id = river_station.river_id
      LEFT JOIN os_open_rivers ON ST_Intersects(ST_Buffer(station.geom, 0.001), os_open_rivers.wkb_geometry)
      OR river.os_line_ids LIKE '%' || os_open_rivers.identifier || '%'
      WHERE
      (river.local_name = os_open_rivers.name1 OR river.local_name = os_open_rivers.name2 OR
      river.os_line_ids LIKE '%' || os_open_rivers.identifier || '%' OR
      river.other_names LIKE '%' || os_open_rivers.name1 || '%' OR
      river.other_names LIKE '%' || os_open_rivers.name2 || '%')
      AND river_station.river_id = $1::integer
    ),
    lines AS (
      SELECT
      os_open_rivers.ogc_fid,
      os_open_rivers.startnode,
      os_open_rivers.endnode,
      os_open_rivers.name1,
      os_open_rivers.name2,
      os_open_rivers.form,
      os_open_rivers.wkb_geometry
      FROM os_open_rivers
      LEFT JOIN start ON os_open_rivers.name1 = start.ea_name OR os_open_rivers.name2 = start.ea_name
      WHERE
      (name1 = start.ea_name OR name2 = start.ea_name)
      OR (SELECT os_line_ids FROM start) LIKE '%' || os_open_rivers.identifier || '%'
      OR (SELECT other_names FROM start) LIKE '%' || os_open_rivers.name1 || '%'
      OR (SELECT other_names FROM start) LIKE '%' || os_open_rivers.name2 || '%'
      AND form != 'canal'
    ),
    lines_inc_patch AS (
      SELECT
      ogc_fid, identifier, startnode, endnode, name1, name2, form, wkb_geometry
      FROM os_open_rivers
      WHERE ogc_fid IN (SELECT ogc_fid FROM lines) OR (
      startnode IN (SELECT endnode FROM lines) AND
      endnode IN (SELECT startnode FROM lines))
    ),
    clusters AS (
      SELECT
      start.ogc_fid AS start_ogc_fid,
      ST_ClusterDBSCAN(lines_inc_patch.wkb_geometry, eps := 0.001, minpoints := 1) OVER() AS c_id,
      lines_inc_patch.ogc_fid,
      lines_inc_patch.identifier,
      lines_inc_patch.startnode,
      lines_inc_patch.endnode,
      lines_inc_patch.name1,
      lines_inc_patch.name2,
      lines_inc_patch.form,
      lines_inc_patch.wkb_geometry
      FROM lines_inc_patch
      LEFT JOIN start ON lines_inc_patch.ogc_fid = start.ogc_fid
    )
    SELECT
    ogc_fid,
    (SELECT river_id FROM start) AS river_id,
    identifier,
    startnode,
    endnode,
    name1,
    name2,
    form,
    ST_AsGeoJSON(wkb_geometry)::JSONB AS geometry
    FROM clusters WHERE
    c_id = (SELECT c_id FROM clusters WHERE start_ogc_fid IS NOT NULL)
    AND identifier NOT LIKE '%' || (SELECT exclude_os_line_ids FROM start) || '%';
    `, [id])
    const features = []
    response.forEach(item => {
      features.push({
        type: 'Feature',
        id: item.ogc_fid,
        geometry: item.geometry,
        properties: {
          riverId: item.river_id,
          identifier: item.identifier,
          startnode: item.startnode,
          endnode: item.endnode,
          name1: item.name1,
          name2: item.name2,
          form: item.form
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
