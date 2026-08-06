import { afterEach, describe, expect, it, vi } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  afterEach(() => vi.restoreAllMocks())

  it('renders the application shell', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('A calmer way through Melbourne.')
    expect(wrapper.text()).toContain('Checking connection')
  })

  it('shows when the API is connected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'ok', message: 'The web API is running.' }),
      }),
    )

    const wrapper = mount(App)
    await vi.waitFor(() => expect(wrapper.text()).toContain('Frontend and API connected'))
    expect(wrapper.text()).toContain('The web API is running.')
  })
})
