export async function getHealth(signal) {
  const response = await fetch('/api/health', { signal })

  if (!response.ok) {
    throw new Error(`The API returned HTTP ${response.status}.`)
  }

  return response.json()
}
