import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { getWalkingRoutes, reverseGeocode, searchDestinations } from '../services/api'
import { getCurrentLocation } from '../services/location'

export const useNavigationStore = defineStore('navigation', () => {
  const origin = ref(null)
  const originLabel = ref('Finding your location…')
  const locationError = ref('')
  const destination = ref('')
  const destinationPoint = ref(null)
  const suggestions = ref([])
  const searchStatus = ref('idle')
  const searchError = ref('')
  const routes = ref([])
  const selectedRouteId = ref('')
  const routeStatus = ref('idle')
  const routeError = ref('')
  const attribution = ref('')
  const dataAsOf = ref(null)
  let searchController

  const selectedRoute = computed(
    () =>
      routes.value.find((route) => route.id === selectedRouteId.value) ?? routes.value[0] ?? null,
  )
  const instructions = computed(() => selectedRoute.value?.instructions ?? [])

  async function locateUser() {
    locationError.value = ''
    originLabel.value = 'Finding your location…'
    try {
      origin.value = await getCurrentLocation()
      originLabel.value = 'Current location'
      try {
        const response = await reverseGeocode(origin.value)
        originLabel.value = response.location?.label || 'Current location'
      } catch {
        // Coordinates are sufficient for routing; a failed label lookup is cosmetic.
      }
    } catch (error) {
      locationError.value = error.message
      originLabel.value = 'Location unavailable'
    }
  }

  async function findDestinations(query) {
    destination.value = query
    destinationPoint.value = null
    if (query.trim().length < 2) {
      suggestions.value = []
      searchStatus.value = 'idle'
      return
    }
    searchController?.abort()
    searchController = new AbortController()
    searchStatus.value = 'loading'
    searchError.value = ''
    try {
      const response = await searchDestinations(query, origin.value, searchController.signal)
      suggestions.value = response.results
      searchStatus.value = 'success'
    } catch (error) {
      if (error.name === 'AbortError') return
      suggestions.value = []
      searchError.value = error.message
      searchStatus.value = 'error'
    }
  }

  function chooseDestination(result) {
    destination.value = result.label
    destinationPoint.value = { lat: result.lat, lon: result.lon }
    suggestions.value = []
    searchStatus.value = 'idle'
    routeError.value = ''
  }

  function clearDestinationSelection() {
    destinationPoint.value = null
    routeError.value = ''
  }

  async function loadRoutes() {
    if (!origin.value) {
      routeError.value = 'Your current location is required before finding routes.'
      routeStatus.value = 'error'
      return false
    }
    if (!destinationPoint.value) {
      routeError.value = 'Select a destination from the suggestions first.'
      routeStatus.value = 'error'
      return false
    }
    routeStatus.value = 'loading'
    routeError.value = ''
    try {
      const response = await getWalkingRoutes({
        origin: origin.value,
        destination: destinationPoint.value,
      })
      routes.value = response.routes ?? []
      attribution.value = response.attribution ?? ''
      dataAsOf.value = response.data_as_of
      selectedRouteId.value =
        routes.value.find((route) => route.recommended)?.id ?? routes.value[0]?.id ?? ''
      routeStatus.value = routes.value.length ? 'success' : 'empty'
      return routes.value.length > 0
    } catch (error) {
      routes.value = []
      selectedRouteId.value = ''
      routeError.value = error.message
      routeStatus.value = 'error'
      return false
    }
  }

  function selectRoute(id) {
    selectedRouteId.value = id
  }

  return {
    origin,
    originLabel,
    locationError,
    destination,
    destinationPoint,
    suggestions,
    searchStatus,
    searchError,
    routes,
    selectedRouteId,
    selectedRoute,
    instructions,
    routeStatus,
    routeError,
    attribution,
    dataAsOf,
    locateUser,
    findDestinations,
    chooseDestination,
    clearDestinationSelection,
    loadRoutes,
    selectRoute,
  }
})
