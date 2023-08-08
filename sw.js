self.addEventListener('install', event => {
  event.waitUntil(preLoad())
})

const preLoad = () => {
  console.log('Installing web app')
  return caches.open('offline').then(cache => {
    console.log('caching index and important routes')
    return cache.addAll(['/offline.html'])
  })
}

self.addEventListener('fetch', event => {
  event.respondWith(checkResponse(event.request).catch(() => {
    return returnFromCache(event.request)
  }))
  event.waitUntil(addToCache(event.request))
})

const checkResponse = request => {
  return new Promise((resolve, reject) => {
    fetch(request).then(response => {
      if (response.status !== 404) {
        resolve(response)
      } else {
        reject(response)
      }
    }, reject)
  })
}

const addToCache = (request) => caches.open('offline').then(cache => {
  return fetch(request).then(response => {
    console.log(response.url + ' was cached')
    return cache.put(request, response)
  })
})

const returnFromCache = request => {
  return caches.open('offline').then(cache => {
    return cache.match(request).then(matching => {
      if (!matching || matching.status === 404) {
        return cache.match('offline.html')
      } else {
        return matching
      }
    })
  })
}