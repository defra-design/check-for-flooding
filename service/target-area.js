// route
const db = require('./db')
const SphericalMercator = require('@mapbox/sphericalmercator')
const mercator = new SphericalMercator({ size: 256 })

module.exports = {
  // Used on list pages
  getTargetAreaMVT: async (x, y, z) => {
    const bbox = mercator.bbox(x, y, z, false)
    const query = `
    SELECT ST_AsMVT(q, 'flood_warning_areas', 4096, 'geom') FROM (
      SELECT 
        fws_tacode AS id,
        ta_name,
        ST_AsMVTGeom(
          geom,
          ST_MakeEnvelope(${bbox[0]}, ${bbox[1]}, ${bbox[2]}, ${bbox[3]}),
          4096,
          256,
          true
        ) AS geom
        FROM flood_warning_areas
      ) q
      `
    try {
      const tiles = await db.query(query)
      return tiles.rows[0]
    } catch (err) {
      return { isError: true, error: err }
    }
  }
}
