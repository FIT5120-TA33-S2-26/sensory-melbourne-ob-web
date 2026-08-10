import { beforeEach, describe, expect, it } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import App from '../App.vue'
import HomeView from '../views/HomeView.vue'
import LandingView from '../views/LandingView.vue'
import NavigationView from '../views/NavigationView.vue'
import QuietSpacesView from '../views/QuietSpacesView.vue'
import RoutesView from '../views/RoutesView.vue'
import { useNavigationStore } from '../stores/navigation'

const routes = [
  { path: '/', component: LandingView },
  { path: '/home', component: HomeView },
  { path: '/routes', component: RoutesView },
  { path: '/navigation', component: NavigationView },
  { path: '/quiet-spaces', component: QuietSpacesView },
]

const testRoutes = [
  {
    id: 'calmest', label: 'Calmest', description: 'Low sensory load', duration: 8,
    distance: 620, stress: 22, crowd: 'Low', color: '#168f86', coveragePct: 41,
    confidence: 'partial', recommended: true,
    geometry: [[-37.81, 144.96], [-37.80, 144.97]],
    instructions: [{ text: 'Head east towards Swanston Street', distance: '120 m', stress: 22, color: '#168f86' }],
  },
  {
    id: 'balanced', label: 'Balanced', description: 'Moderate sensory load', duration: 7,
    distance: 540, stress: 44, crowd: 'Medium', color: '#5b6fe5', coveragePct: 100,
    geometry: [[-37.81, 144.96], [-37.80, 144.97]], instructions: [],
  },
  {
    id: 'fastest', label: 'Fastest', description: 'High sensory load', duration: 6,
    distance: 480, stress: 75, crowd: 'High', color: '#ef8354', coveragePct: 100,
    geometry: [[-37.81, 144.96], [-37.80, 144.97]], instructions: [],
  },
]

async function mountAt(path, { withRoutes = false } = {}) {
  const router = createRouter({ history: createMemoryHistory(), routes })
  const pinia = createPinia()
  setActivePinia(pinia)
  if (withRoutes) {
    const navigation = useNavigationStore()
    navigation.destination = 'State Library Victoria'
    navigation.routes = testRoutes
    navigation.selectedRouteId = 'calmest'
    navigation.routeStatus = 'success'
  }
  await router.push(path)
  await router.isReady()
  return mount(App, { global: { plugins: [router, pinia] } })
}

describe('Eazy Streetzz screens', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('renders the landing screen', async () => {
    const wrapper = await mountAt('/')
    expect(wrapper.text()).toContain('Navigate Melbourne with confidence')
    expect(wrapper.text()).toContain('Get started')
  })

  it('renders the home route search', async () => {
    const wrapper = await mountAt('/home')
    expect(wrapper.text()).toContain('Current location')
    expect(wrapper.text()).toContain('Where would you like to go?')
  })

  it('renders three candidate route options', async () => {
    const wrapper = await mountAt('/routes', { withRoutes: true })
    expect(wrapper.findAll('.route-card')).toHaveLength(3)
    expect(wrapper.text()).toContain('Calmest')
    expect(wrapper.text()).toContain('Fastest')
    expect(wrapper.text()).toContain('part. stress')
  })

  it('renders written navigation instructions', async () => {
    const wrapper = await mountAt('/navigation', { withRoutes: true })
    expect(wrapper.text()).toContain('Next instruction')
    expect(wrapper.text()).toContain('Head east towards Swanston Street')
    expect(wrapper.text()).toContain('Partial score · 41% coverage')
  })

  it('renders the nearby quiet spaces screen', async () => {
    const wrapper = await mountAt('/quiet-spaces')

    expect(wrapper.text()).toContain('Nearby quiet spaces')
    expect(wrapper.text()).toContain('Within 1.6 km of you')
  })
})
