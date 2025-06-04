const db = require('./db')
const SphericalMercator = require('@mapbox/sphericalmercator')
const mercator = new SphericalMercator({ size: 256 })
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
    SELECT * FROM (
    SELECT warning.id, ST_AsGeoJSON(ST_Centroid(geom))::JSONB AS geometry, concat(CASE WHEN warning.severity = 1 THEN 'Severe flood warning' WHEN warning.severity = 2 THEN 'Flood warning' ELSE 'Flood warning removed' END, ' for ', warning.name) AS name, warning.raised_date AT TIME ZONE '+00' AS raised_date, CASE WHEN warning.severity = 1 THEN 'severe' WHEN warning.severity = 2 THEN 'warning' ELSE 'removed' END AS state
    FROM warning JOIN flood_warning_areas ON LOWER(flood_warning_areas.fws_tacode) = LOWER(warning.id)
    UNION
    SELECT warning.id, ST_AsGeoJSON(ST_Centroid(geom))::JSONB AS geometry, concat(CASE WHEN warning.severity = 3 THEN 'Flood alert' ELSE 'Flood warning removed' END, ' for ', warning.name) AS name, warning.raised_date AT TIME ZONE '+00' AS raised_date, CASE WHEN warning.severity = 3 THEN 'alert' ELSE 'removed' END AS state
    FROM warning JOIN flood_alert_areas ON LOWER(flood_alert_areas.fws_tacode) = LOWER(warning.id)) u
    ORDER BY CASE state WHEN 'severe' THEN 1 WHEN 'warning' THEN 2 WHEN 'alert' THEN 3 ELSE 4 END DESC;
    `)
    const features = []
    response.forEach(item => {
      features.push({
        type: 'Feature',
        geometry: item.geometry,
        properties: {
          id: item.id.toLowerCase(),
          name: item.name,
          state: item.state,
          date: item.raised_date
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
    SELECT
    CASE
    WHEN type = 'rainfall' THEN concat('r', station_id) ELSE rloi_id END AS id,
    lon, lat,
    CASE
    WHEN type = 'tide' AND river_id IS NOT NULL THEN 'river' WHEN type = 'tide' THEN 'sea' ELSE type END AS type,
    CASE
    WHEN type = 'river' AND status != 'active' AND status != 'ukcmf' THEN 'error'
    WHEN type = 'river' AND latest_state = 'high' THEN 'high'
    WHEN type = 'river' OR (type = 'tide' AND river_id IS NOT NULL) THEN 'normal'
    WHEN type = 'groundwater' AND status != 'active' THEN 'error'
    WHEN type = 'groundwater' AND latest_state = 'high' THEN 'high'
    WHEN type = 'groundwater' THEN 'normal'
    WHEN type = 'tide' AND status != 'active' THEN 'error'
    WHEN type = 'tide' THEN 'normal'
    WHEN type = 'rainfall' AND rainfall_1hr > 0 THEN 'wet'
    WHEN type = 'rainfall' THEN 'dry' END AS state,
    is_wales, initcap(latest_state) AS latest_state, initcap(latest_trend) AS latest_trend, latest_height, rainfall_1hr, rainfall_6hr, rainfall_24hr, latest_datetime AT TIME ZONE '+00' AS latest_datetime, level_high, level_low, station_up, station_down,
    CASE WHEN measure_type = 'downstage' THEN true ELSE false END AS is_downstage,
    CASE WHEN is_multi_stage AND measure_type != 'downstage' THEN true ELSE false END AS is_upstage
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
          id: item.id,
          name: 'Test name',
          category: item.type,
          state: item.state
        }
      })
    })
    const geoJSON = {
      type: 'FeatureCollection',
      features: features
    }
    return geoJSON
  },
  getTargetAreasGeoJSON: async (bbox) => {
    const [xmin, ymin, xmax, ymax] = bbox
    const response = await db.query(`
      WITH bbox AS (
        SELECT ST_MakeEnvelope($1, $2, $3, $4, 4326) AS geom
      )

      SELECT *
      FROM (
        -- Flood warning areas
        SELECT
          w.id,
          ST_AsGeoJSON(wfa.geom)::JSONB AS geometry,
          CONCAT(
            CASE
              WHEN w.severity = 1 THEN 'Severe flood warning'
              WHEN w.severity = 2 THEN 'Flood warning'
              ELSE 'Flood warning removed'
            END,
            ' for ', w.name
          ) AS name,
          w.raised_date AT TIME ZONE '+00' AS raised_date,
          CASE
            WHEN w.severity = 1 THEN 'severe'
            WHEN w.severity = 2 THEN 'warning'
            ELSE 'removed'
          END AS state
        FROM flood_warning_areas wfa
        JOIN bbox ON ST_Intersects(wfa.geom, bbox.geom)
        JOIN warning w ON wfa.fws_tacode = w.id

        UNION ALL

        -- Flood alert areas
        SELECT
          w.id,
          ST_AsGeoJSON(faa.geom)::JSONB AS geometry,
          CONCAT(
            CASE
              WHEN w.severity = 3 THEN 'Flood alert'
              ELSE 'Flood warning removed'
            END,
            ' for ', w.name
          ) AS name,
          w.raised_date AT TIME ZONE '+00' AS raised_date,
          CASE
            WHEN w.severity = 3 THEN 'alert'
            ELSE 'removed'
          END AS state
        FROM flood_alert_areas faa
        JOIN bbox ON ST_Intersects(faa.geom, bbox.geom)
        JOIN warning w ON faa.fws_tacode = w.id
      ) u

      ORDER BY
        CASE state
          WHEN 'severe' THEN 1
          WHEN 'warning' THEN 2
          WHEN 'alert' THEN 3
          ELSE 4
        END DESC
  `, [xmin, ymin, xmax, ymax])
    const features = []
    response.forEach(item => {
      features.push({
        type: 'Feature',
        geometry: item.geometry,
        properties: {
          id: item.id.toLowerCase(),
          name: item.name,
          state: item.state,
          date: item.raised_date
        }
      })
    })
    const geoJSON = {
      type: 'FeatureCollection',
      features: features
    }
    return geoJSON
  },
  getSurfaceWaterWarningsGeoJSON: async () => {
    const response = await db.query(`
      SELECT id, 'SW' AS type, ST_AsGeoJSON(geom)::JSONB AS geometry, ST_AsGeoJSON(ST_Centroid(geom))::JSONB AS centroid, name, severity, raised_date AT TIME ZONE '+00' AS raised_date
      FROM warning_surface_water
    `)
    const features = []
    response.forEach(item => {
      features.push({
        type: 'Feature',
        id: item.id.toLowerCase(),
        // geometry: item.geometry,
        geometry: {
          type: 'GeometryCollection',
          geometries: [
            item.centroid,
            item.geometry
          ]
        },
        properties: {
          id: item.id.toLowerCase(),
          name: item.name,
          severity: Number(item.severity),
          issuedDate: item.raised_date,
          severityChangedDate: item.raised_date,
          type: 'SW'
        }
      })
    })
    const geoJSON = {
      type: 'FeatureCollection',
      features: features
    }
    return geoJSON
  },
  getVectorTile: async (x, y, z) => {
    const bbox = mercator.bbox(x, y, z, false)
    const response = await db.query(`
      (SELECT ST_AsMVT(q, 'targetareas', 4096, 'geom') FROM (
        (SELECT 
          lower(fws_tacode) AS id,
          ST_AsMVTGeom(
            ST_Force2D(geom),
            ST_MakeEnvelope(${bbox[0]}, ${bbox[1]}, ${bbox[2]}, ${bbox[3]}, 4326),
            4096,
            256,
            true
          ) geom FROM flood_warning_areas)
          UNION
          (SELECT 
            lower(fws_tacode) AS id,
            ST_AsMVTGeom(
              ST_Force2D(geom),
              ST_MakeEnvelope(${bbox[0]}, ${bbox[1]}, ${bbox[2]}, ${bbox[3]}, 4326),
              4096,
              256,
              true
            ) geom FROM flood_alert_areas)
        )
      q) UNION 
      (SELECT ST_AsMVT(q, 'rivers', 4096, 'geom') FROM (
        SELECT 
          river_id, name1, form,
          ST_AsMVTGeom(
            ST_Force2D(wkb_geometry),
            ST_MakeEnvelope(${bbox[0]}, ${bbox[1]}, ${bbox[2]}, ${bbox[3]}, 4326),
            4096,
            256,
            true
          ) geom FROM river_line
        )
      q)
    `)
    return response
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
