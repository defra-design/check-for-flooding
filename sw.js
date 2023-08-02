self.addEventListener('install', function (event) {
  event.waitUntil(preLoad())
})

var preLoad = function () {
  console.log('Installing web app')
  return caches.open('offline').then(function (cache) {
    console.log('caching index and important routes')
    return cache.addAll(['/offline.html'])
  })
}

self.addEventListener('fetch', function (event) {
  event.respondWith(checkResponse(event.request).catch(function () {
    return returnFromCache(event.request)
  }))
  event.waitUntil(addToCache(event.request))
})

var checkResponse = function (request) {
  return new Promise((resolve, reject) => {
    fetch(request).then(function (response) {
      if (response.status !== 404) {
        resolve(response)
      } else {
        reject(response)
      }
    }, reject)
  })
}

var addToCache = (request) => caches.open('offline').then(function (cache) {
  return fetch(request).then(function (response) {
    console.log(response.url + ' was cached')
    return cache.put(request, response)
  })
})

var returnFromCache = function (request) {
  return caches.open('offline').then(function (cache) {
    return cache.match(request).then(function (matching) {
      if (!matching || matching.status === 404) {
        return cache.match('offline.html')
      } else {
        return matching
      }
    })
  })
}