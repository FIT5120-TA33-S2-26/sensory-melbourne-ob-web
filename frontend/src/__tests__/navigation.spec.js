import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createPinia, setActivePinia } from 'pinia'

import { getWalkingRoutes, reverseGeocode, searchDestinations } from '../services/api'
import { getCurrentLocation } from '../services/location'
import { useNavigationStore } from '../stores/navigation'

vi.mock('../services/api', () => ({
  getWalkingRoutes: vi.fn(),
  reverseGeocode: vi.fn(),
  searchDestinations: vi.fn(),
}))

vi.mock('../services/location', () => ({ getCurrentLocation: vi.fn() }))

const route = {
  id: 'calmest',
  recommended: true,
  instructions: [{ text: 'Head north', distance: '50 m' }],
}

describe('navigation store live data flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('locates the user and reverse geocodes the display label', async () => {
    getCurrentLocation.mockResolvedValue({ lat: -37.8136, lon: 144.9631 })
    reverseGeocode.mockResolvedValue({ location: { label: '260 Elizabeth Street' } })
    const store = useNavigationStore()

    await store.locateUser()

    expect(store.origin).toEqual({ lat: -37.8136, lon: 144.9631 })
    expect(store.originLabel).toBe('260 Elizabeth Street')
  })

  it('searches with the current location and stores a selected destination', async () => {
    searchDestinations.mockResolvedValue({
      results: [{ label: 'State Library Victoria', lat: -37.8098, lon: 144.9652 }],
    })
    const store = useNavigationStore()
    store.origin = { lat: -37.8136, lon: 144.9631 }

    await store.findDestinations('State Library')
    store.chooseDestination(store.suggestions[0])

    expect(searchDestinations).toHaveBeenCalledWith(
      'State Library',
      store.origin,
      expect.any(AbortSignal),
    )
    expect(store.destinationPoint).toEqual({ lat: -37.8098, lon: 144.9652 })
  })

  it('loads scored routes and derives instructions from the selected route', async () => {
    getWalkingRoutes.mockResolvedValue({
      routes: [route],
      attribution: 'ORS',
      data_as_of: '2026-08-09T00:00:00+10:00',
    })
    const store = useNavigationStore()
    store.origin = { lat: -37.8136, lon: 144.9631 }
    store.destinationPoint = { lat: -37.8098, lon: 144.9652 }

    const loaded = await store.loadRoutes()

    expect(loaded).toBe(true)
    expect(store.selectedRouteId).toBe('calmest')
    expect(store.instructions[0].text).toBe('Head north')
    expect(store.routeStatus).toBe('success')
  })

  it('does not call the route API without a selected autocomplete result', async () => {
    const store = useNavigationStore()
    store.origin = { lat: -37.8136, lon: 144.9631 }

    expect(await store.loadRoutes()).toBe(false)
    expect(getWalkingRoutes).not.toHaveBeenCalled()
    expect(store.routeError).toContain('Select a destination')
  })
})

describe('choosing a starting point', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('does not prefill the origin box, so page load fires no geocode search', async () => {
    // Regression: locateUser() used to write the reverse-geocoded label into
    // originQuery. That field is bound to the search input, whose change
    // watcher then issued a geocode search for the user's own address on every
    // page load.
    getCurrentLocation.mockResolvedValue({ lat: -37.8136, lon: 144.9631 })
    reverseGeocode.mockResolvedValue({ location: { label: 'Flinders Street' } })
    const store = useNavigationStore()

    await store.locateUser()

    expect(store.originLabel).toBe('Flinders Street')
    expect(store.originQuery).toBe('')
    expect(searchDestinations).not.toHaveBeenCalled()
  })

  it('lets the user override the origin, and drops routes from the old one', async () => {
    getCurrentLocation.mockResolvedValue({ lat: -37.8136, lon: 144.9631 })
    reverseGeocode.mockResolvedValue({ location: { label: 'Flinders Street' } })
    const store = useNavigationStore()
    await store.locateUser()
    store.routes = [route]

    store.chooseOrigin({ label: 'Queen Victoria Market', lat: -37.8076, lon: 144.9568 })

    expect(store.origin).toEqual({ lat: -37.8076, lon: 144.9568 })
    expect(store.originLabel).toBe('Queen Victoria Market')
    expect(store.originIsCurrentLocation).toBe(false)
    expect(store.routes).toEqual([])
  })

  it('searches for origins without clobbering the destination search', async () => {
    searchDestinations.mockResolvedValue({ results: [{ label: 'Southern Cross' }] })
    const store = useNavigationStore()

    await store.findOrigins('Southern')

    expect(store.originSuggestions).toEqual([{ label: 'Southern Cross' }])
    expect(store.suggestions).toEqual([])
  })
})
