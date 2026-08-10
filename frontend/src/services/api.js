export async function getHealth(signal) {
  const response = await fetch('/api/health', { signal })

  if (!response.ok) {
    throw new Error(`The API returned HTTP ${response.status}.`)
  }

  return response.json()
}

async function jsonOrError(response, fallback) {
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(body.error || `${fallback} (HTTP ${response.status}).`)
    error.code = body.code
    error.status = response.status
    throw error
  }
  return body
}

export async function searchDestinations(query, focus, signal) {
  const params = new URLSearchParams({ q: query })
  if (focus) {
    params.set('lat', focus.lat)
    params.set('lon', focus.lon)
  }
  const response = await fetch(`/api/geocode/search?${params}`, { signal })
  return jsonOrError(response, 'Destination search is unavailable')
}

export async function reverseGeocode(point, signal) {
  const params = new URLSearchParams({ lat: point.lat, lon: point.lon })
  const response = await fetch(`/api/geocode/reverse?${params}`, { signal })
  return jsonOrError(response, 'Location name is unavailable')
}

export async function getNearbyQuietSpaces(point, signal) {
  const params = new URLSearchParams({ lat: point.lat, lon: point.lon })
  const response = await fetch(`/api/quiet-spaces?${params}`, { signal })
  return jsonOrError(response, 'Nearby quiet spaces are unavailable')
}

/**
 * Request normalised walking alternatives from our Flask API.
 * Flask owns the OpenRouteService key and enriches each result with sensory metrics.
 */
export async function getWalkingRoutes({ origin, destination, preference = 'low' }, signal) {
  const response = await fetch('/api/routes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin, destination, preference }),
    signal,
  })

  return jsonOrError(response, 'Routes are unavailable')
}
