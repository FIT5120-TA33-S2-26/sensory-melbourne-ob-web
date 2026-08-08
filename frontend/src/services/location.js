export function getCurrentLocation(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location services are not supported by this browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lon: coords.longitude }),
      (error) => {
        const messages = {
          1: 'Location permission was denied. Enable it to use your current position.',
          2: 'Your current location could not be determined.',
          3: 'Finding your current location timed out.',
        }
        reject(new Error(messages[error.code] || 'Your current location is unavailable.'))
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000, ...options },
    )
  })
}
