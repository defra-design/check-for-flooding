export const createLiveMap = (mapId, options = {}) => {
  const fm = new defra.FloodMap(mapId, {
    behaviour: 'hybrid', // 'buttonFirst | inline',
    place: 'Carlisle',
    zoom: 14,
    minZoom: 6,
    maxZoom: 18,
    center: [-2.938769, 54.893806],
    maxBounds: [-5.719993, 49.955638, 1.794689, 55.825973],
    styles: [{
      name: 'default',
      attribution: `Contains OS data ${String.fromCharCode(169)} Crown copyright and database rights ${(new Date()).getFullYear()}`,
      url: process.env.DEFAULT_URL
    }, {
      name: 'dark',
      attribution: 'Test',
      url: process.env.DARK_URL
    },{
      name: 'aerial',
      url: process.env.AERIAL_URL,
      logo: null
    },{
      name: 'deuteranopia',
      attribution: 'Test',
      url: process.env.DEUTERANOPIA_URL
    },{
      name: 'tritanopia',
      attribution: 'Test',
      url: process.env.TRITANOPIA_URL
    }],
  })
}

export const createOutlookMap = (mapId, options = {}) => {
  console.log('Creating outlook map')
}
