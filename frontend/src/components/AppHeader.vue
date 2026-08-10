<script setup>
import AppIcon from './AppIcon.vue'
</script>

<template>
  <header class="app-header">
    <div class="header-inner">
      <button class="menu-button" type="button" aria-label="Open menu"><AppIcon name="menu" :size="29" /></button>
      <RouterLink class="wordmark" to="/home">Sensory Melbourne</RouterLink>
      <nav aria-label="Primary navigation">
        <RouterLink to="/home" aria-label="Home"><AppIcon name="home" :size="29" /></RouterLink>
        <RouterLink to="/routes" aria-label="Plan a route"><AppIcon name="map" :size="30" /></RouterLink>
        <RouterLink to="/navigation" aria-label="Current navigation"><AppIcon name="navigate" :size="29" /></RouterLink>
        <RouterLink to="/quiet-spaces" aria-label="Nearby quiet spaces"><AppIcon name="leaf" :size="29" /></RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.app-header { position: relative; z-index: 1000; color: white; background: var(--teal-600); }
.header-inner { display: flex; width: min(1120px, 100%); min-height: 76px; align-items: center; margin: 0 auto; padding: 0 24px; }
.menu-button { display: none; border: 0; color: inherit; background: transparent; cursor: pointer; }
.wordmark { color: white; font-size: 1.15rem; font-weight: 900; font-style: italic; text-decoration: none; }
nav { display: flex; gap: 10px; margin-left: auto; }
nav a { display: grid; width: 48px; height: 48px; place-items: center; border-radius: 50%; color: white; }
nav a:hover, nav a.router-link-active { background: rgba(255,255,255,.18); }
@media (max-width: 600px) {
  .header-inner { min-height: 68px; padding: 0 14px; }
  .menu-button { display: grid; width: 44px; height: 44px; place-items: center; padding: 0; }
  .wordmark { display: none; }
  nav { flex: 1; justify-content: space-evenly; margin-left: 8px; }
  nav a { width: 44px; height: 44px; }
}
</style>
