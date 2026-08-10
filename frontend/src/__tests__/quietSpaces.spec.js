import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createPinia, setActivePinia } from 'pinia'

import { getNearbyQuietSpaces } from '../services/api'
import { getCurrentLocation } from '../services/location'
import { useQuietSpacesStore } from '../stores/quietSpaces'

vi.mock('../services/api', () => ({ getNearbyQuietSpaces: vi.fn() }))
vi.mock('../services/location', () => ({ getCurrentLocation: vi.fn() }))

describe('quiet spaces store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loads nearby places from the current device location', async () => {
    const location = { lat: -37.8136, lon: 144.9631 }
    getCurrentLocation.mockResolvedValue(location)
    getNearbyQuietSpaces.mockResolvedValue({
      places: [
        { id: 1, name: 'State Library Victoria', category: 'library', distance: 420 },
      ],
      radius: 1600,
      attribution: 'City of Melbourne Open Data (modified)',
    })
    const store = useQuietSpacesStore()

    await store.load()

    expect(getNearbyQuietSpaces).toHaveBeenCalledWith(location)
    expect(store.status).toBe('success')
    expect(store.places[0].category).toBe('library')
    expect(store.radius).toBe(1600)
  })

  it('surfaces location permission errors without calling the API', async () => {
    getCurrentLocation.mockRejectedValue(new Error('Location permission was denied.'))
    const store = useQuietSpacesStore()

    await store.load()

    expect(store.status).toBe('error')
    expect(store.error).toContain('permission was denied')
    expect(getNearbyQuietSpaces).not.toHaveBeenCalled()
  })
})
