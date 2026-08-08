import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { demoInstructions, demoRoutes } from '../data/demoRoutes'

export const useNavigationStore = defineStore('navigation', () => {
  const destination = ref('State Library of Victoria')
  const routes = ref(demoRoutes)
  const selectedRouteId = ref('calmest')
  const instructions = ref(demoInstructions)
  const selectedRoute = computed(() => routes.value.find((route) => route.id === selectedRouteId.value) ?? routes.value[0])

  function selectRoute(id) {
    selectedRouteId.value = id
  }

  return { destination, routes, selectedRouteId, selectedRoute, instructions, selectRoute }
})
