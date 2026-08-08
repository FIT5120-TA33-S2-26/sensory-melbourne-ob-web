export async function getHealth(signal) {
  const response = await fetch('/api/health', { signal })

  if (!response.ok) {
    throw new Error(`The API returned HTTP ${response.status}.`)
  }

  return response.json()
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

  if (!response.ok) {
    throw new Error(`Routes are unavailable (HTTP ${response.status}).`)
  }

  return response.json()
}
