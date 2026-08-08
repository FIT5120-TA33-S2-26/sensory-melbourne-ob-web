<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 24 },
})
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <template v-if="name === 'menu'"><path d="M4 6h16M4 12h16M4 18h16" /></template>
    <template v-else-if="name === 'home'"><path d="m3 10 9-7 9 7v10H7V10" /><path d="M10 20v-6h4v6" /></template>
    <template v-else-if="name === 'map'"><path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3z" /><path d="M8 3v15M16 6v15" /></template>
    <template v-else-if="name === 'navigate'"><path d="m21 3-7.5 18-3.3-7.2L3 10.5z" /></template>
    <template v-else-if="name === 'search'"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></template>
    <template v-else-if="name === 'location'"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></template>
    <template v-else-if="name === 'arrow'"><path d="m9 18 6-6-6-6" /></template>
    <template v-else-if="name === 'clock'"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></template>
    <template v-else-if="name === 'walk'"><circle cx="13" cy="4" r="2" /><path d="m10 22 2-7-3-3 2-5 5 3 3 1M6 22l3-6M15 22l-3-7" /></template>
    <template v-else><circle cx="12" cy="12" r="9" /></template>
  </svg>
</template>
