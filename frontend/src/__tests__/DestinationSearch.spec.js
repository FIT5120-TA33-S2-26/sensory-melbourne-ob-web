import { afterEach, describe, expect, it, vi } from 'vitest'

import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'

import DestinationSearch from '../components/DestinationSearch.vue'

describe('DestinationSearch', () => {
  afterEach(() => vi.useRealTimers())

  it('does not search again when a suggestion sets the input label', async () => {
    vi.useFakeTimers()
    const Host = defineComponent({
      components: { DestinationSearch },
      setup() {
        const query = ref('State Library')
        const suggestions = [
          { label: 'State Library Victoria, Melbourne', lat: -37.8098, lon: 144.9652 },
        ]
        const searches = ref(0)
        function choose(result) {
          query.value = result.label
        }
        return { query, suggestions, searches, choose }
      },
      template: `
        <DestinationSearch
          v-model="query"
          :suggestions="suggestions"
          @search="searches += 1"
          @select="choose"
        />`,
    })
    const wrapper = mount(Host)

    await wrapper.get('input').trigger('focus')
    await wrapper.get('[role="option"]').trigger('click')
    await vi.advanceTimersByTimeAsync(400)

    expect(wrapper.vm.query).toBe('State Library Victoria, Melbourne')
    expect(wrapper.vm.searches).toBe(0)
  })
})
