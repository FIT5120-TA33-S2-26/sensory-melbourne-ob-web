import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { getWalkingRoutes, reverseGeocode, searchDestinations } from '../services/api'
import { getCurrentLocation } from '../services/location'

export const useNavigationStore = defineStore('navigation', () => {
  const origin = ref(null)
  const originLabel = ref('Finding your location…')
  const locationError = ref('')
  // Origin search. Browser geolocation is a starting point, not a constraint:
  // outside the CBD it produces long routes with little sensor coverage, and
  // there was previously no way to say "start me somewhere else".
  const originQuery = ref('')
  const originSuggestions = ref([])
  const originSearchStatus = ref('idle')
  const originSearchError = ref('')
  const originIsCurrentLocation = ref(true)
  let originController
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
      originIsCurrentLocation.value = true
      originLabel.value = 'Current location'
      try {
        const response = await reverseGeocode(origin.value)
        originLabel.value = response.location?.label || 'Current location'
      } catch {
        // Coordinates are sufficient for routing; a failed label lookup is cosmetic.
      }
      // Deliberately NOT prefilled into originQuery. The search box is bound to
      // it, and writing a label in programmatically trips the component's
      // change watcher — which fired a geocode search for the user's own
      // address on every page load. An empty box reading "Search starting
      // point" also says the right thing: the origin is your location until
      // you type something else. The active origin is shown above the field.
      originQuery.value = ''
    } catch (error) {
      locationError.value = error.message
      originLabel.value = 'Location unavailable'
    }
  }

  async function findOrigins(query) {
    originQuery.value = query
    if (query.trim().length < 2) {
      originSuggestions.value = []
      originSearchStatus.value = 'idle'
      return
    }
    originController?.abort()
    originController = new AbortController()
    originSearchStatus.value = 'loading'
    originSearchError.value = ''
    try {
      // Bias results toward wherever the origin currently is, same as the
      // destination search does.
      const response = await searchDestinations(query, origin.value, originController.signal)
      originSuggestions.value = response.results
      originSearchStatus.value = 'success'
    } catch (error) {
      if (error.name === 'AbortError') return
      originSuggestions.value = []
      originSearchError.value = error.message
      originSearchStatus.value = 'error'
    }
  }

  function chooseOrigin(result) {
    origin.value = { lat: result.lat, lon: result.lon }
    originLabel.value = result.label
    originQuery.value = result.label
    originIsCurrentLocation.value = false
    originSuggestions.value = []
    originSearchStatus.value = 'idle'
    locationError.value = ''
    // Any routes on screen were computed from the previous origin.
    routes.value = []
    routeStatus.value = 'idle'
    routeError.value = ''
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
    originQuery,
    originSuggestions,
    originSearchStatus,
    originSearchError,
    originIsCurrentLocation,
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
    findOrigins,
    chooseOrigin,
    findDestinations,
    chooseDestination,
    clearDestinationSelection,
    loadRoutes,
    selectRoute,
  }
})
