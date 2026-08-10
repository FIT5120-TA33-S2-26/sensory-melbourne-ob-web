import { defineStore } from 'pinia'
import { ref } from 'vue'

import { getNearbyQuietSpaces } from '../services/api'
import { getCurrentLocation } from '../services/location'

export const useQuietSpacesStore = defineStore('quietSpaces', () => {
  const location = ref(null)
  const places = ref([])
  const status = ref('idle')
  const error = ref('')
  const radius = ref(1600)
  const dataAsOf = ref(null)
  const attribution = ref('')

  async function load() {
    status.value = 'locating'
    error.value = ''
    places.value = []
    try {
      location.value = await getCurrentLocation()
      status.value = 'loading'
      const response = await getNearbyQuietSpaces(location.value)
      places.value = response.places ?? []
      radius.value = response.radius ?? 1600
      dataAsOf.value = response.data_as_of ?? null
      attribution.value = response.attribution ?? ''
      status.value = places.value.length ? 'success' : 'empty'
    } catch (loadError) {
      status.value = 'error'
      error.value = loadError.message
    }
  }

  return { location, places, status, error, radius, dataAsOf, attribution, load }
})
