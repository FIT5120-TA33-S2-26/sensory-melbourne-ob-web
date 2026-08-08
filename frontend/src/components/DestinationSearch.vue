<script setup>
import AppIcon from './AppIcon.vue'

const model = defineModel({ type: String, default: '' })
defineEmits(['submit'])
</script>

<template>
  <form class="destination-search" role="search" @submit.prevent="$emit('submit')">
    <label class="sr-only" for="destination">Search destination</label>
    <input id="destination" v-model="model" type="search" placeholder="Search destination" autocomplete="street-address" />
    <button type="submit" aria-label="Search"><AppIcon name="search" :size="24" /></button>
  </form>
</template>

<style scoped>
.destination-search { display: flex; min-height: 54px; align-items: center; overflow: hidden; border: 3px solid var(--teal-600); border-radius: 999px; background: white; }
input { min-width: 0; flex: 1; padding: 0 12px 0 24px; border: 0; outline: 0; color: var(--ink); background: transparent; font-size: 1rem; }
button { display: grid; width: 48px; height: 48px; flex: 0 0 auto; place-items: center; margin-right: 2px; border: 0; border-radius: 50%; color: var(--teal-700); background: transparent; cursor: pointer; }
</style>
