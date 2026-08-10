import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import LandingView from '../views/LandingView.vue'
import NavigationView from '../views/NavigationView.vue'
import QuietSpacesView from '../views/QuietSpacesView.vue'
import RoutesView from '../views/RoutesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'landing', component: LandingView },
    { path: '/home', name: 'home', component: HomeView },
    { path: '/routes', name: 'routes', component: RoutesView },
    { path: '/navigation', name: 'navigation', component: NavigationView },
    { path: '/quiet-spaces', name: 'quiet-spaces', component: QuietSpacesView },
  ],
})

export default router
