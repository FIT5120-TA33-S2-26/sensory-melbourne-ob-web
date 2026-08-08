import { beforeEach, describe, expect, it } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import App from '../App.vue'
import HomeView from '../views/HomeView.vue'
import LandingView from '../views/LandingView.vue'
import NavigationView from '../views/NavigationView.vue'
import RoutesView from '../views/RoutesView.vue'

const routes = [
  { path: '/', component: LandingView },
  { path: '/home', component: HomeView },
  { path: '/routes', component: RoutesView },
  { path: '/navigation', component: NavigationView },
]

async function mountAt(path) {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  await router.isReady()
  return mount(App, { global: { plugins: [router, createPinia()] } })
}

describe('Sensory Melbourne screens', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('renders the landing screen', async () => {
    const wrapper = await mountAt('/')
    expect(wrapper.text()).toContain('Navigate Melbourne with confidence')
    expect(wrapper.text()).toContain('Get started')
  })

  it('renders the home route search', async () => {
    const wrapper = await mountAt('/home')
    expect(wrapper.text()).toContain('Melbourne Central')
    expect(wrapper.text()).toContain('Where would you like to go?')
  })

  it('renders three candidate route options', async () => {
    const wrapper = await mountAt('/routes')
    expect(wrapper.findAll('.route-card')).toHaveLength(3)
    expect(wrapper.text()).toContain('Calmest')
    expect(wrapper.text()).toContain('Fastest')
  })

  it('renders written navigation instructions', async () => {
    const wrapper = await mountAt('/navigation')
    expect(wrapper.text()).toContain('Next instruction')
    expect(wrapper.text()).toContain('Head east towards Swanston Street')
  })
})
