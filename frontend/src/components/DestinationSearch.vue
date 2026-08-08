<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'

import AppIcon from './AppIcon.vue'

const model = defineModel({ type: String, default: '' })
const props = defineProps({
  suggestions: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
const emit = defineEmits(['search', 'select', 'submit'])
const open = ref(false)
let debounceTimer
let selectingSuggestion = false

watch(model, (value) => {
  if (selectingSuggestion) {
    selectingSuggestion = false
    return
  }
  clearTimeout(debounceTimer)
  open.value = true
  debounceTimer = setTimeout(() => emit('search', value), 350)
})

watch(
  () => props.suggestions,
  (results) => {
    open.value = results.length > 0
  },
)

function select(result) {
  selectingSuggestion = true
  open.value = false
  emit('select', result)
}

function submit() {
  open.value = false
  emit('submit')
}

onBeforeUnmount(() => clearTimeout(debounceTimer))
</script>

<template>
  <div class="search-wrap">
    <form class="destination-search" role="search" @submit.prevent="submit">
      <label class="sr-only" for="destination">Search destination</label>
      <input
        id="destination"
        v-model="model"
        type="search"
        placeholder="Search destination"
        autocomplete="off"
        aria-autocomplete="list"
        :aria-expanded="open"
        aria-controls="destination-results"
        @focus="open = suggestions.length > 0"
      />
      <span v-if="loading" class="searching" aria-label="Searching"></span>
      <button type="submit" aria-label="Search"><AppIcon name="search" :size="24" /></button>
    </form>
    <ul
      v-if="open && suggestions.length"
      id="destination-results"
      class="suggestions"
      role="listbox"
    >
      <li v-for="result in suggestions" :key="`${result.lat},${result.lon},${result.label}`">
        <button type="button" role="option" @click="select(result)">
          <AppIcon name="location" :size="18" />
          <span
            ><strong>{{ result.name || result.label }}</strong
            ><small>{{ result.label }}</small></span
          >
        </button>
      </li>
    </ul>
    <p v-if="error" class="search-error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.search-wrap {
  position: relative;
}
.destination-search {
  display: flex;
  min-height: 54px;
  align-items: center;
  overflow: hidden;
  border: 3px solid var(--teal-600);
  border-radius: 999px;
  background: white;
}
input {
  min-width: 0;
  flex: 1;
  padding: 0 12px 0 24px;
  border: 0;
  outline: 0;
  color: var(--ink);
  background: transparent;
  font-size: 1rem;
}
button {
  display: grid;
  width: 48px;
  height: 48px;
  flex: 0 0 auto;
  place-items: center;
  margin-right: 2px;
  border: 0;
  border-radius: 50%;
  color: var(--teal-700);
  background: transparent;
  cursor: pointer;
}
.searching {
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
  border: 2px solid var(--border);
  border-top-color: var(--teal-700);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.suggestions {
  position: absolute;
  z-index: 1001;
  top: calc(100% + 7px);
  right: 0;
  left: 0;
  overflow: hidden;
  margin: 0;
  padding: 6px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: white;
  box-shadow: var(--shadow);
  list-style: none;
}
.suggestions button {
  display: flex;
  width: 100%;
  height: auto;
  min-height: 54px;
  gap: 10px;
  align-items: center;
  justify-content: flex-start;
  margin: 0;
  padding: 10px 12px;
  border-radius: 11px;
  text-align: left;
}
.suggestions button:hover,
.suggestions button:focus-visible {
  background: var(--teal-100);
}
.suggestions span {
  min-width: 0;
}
.suggestions strong,
.suggestions small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.suggestions strong {
  color: var(--ink);
  font-size: 0.9rem;
}
.suggestions small {
  margin-top: 2px;
  color: var(--muted);
  font-size: 0.72rem;
}
.search-error {
  margin: 7px 12px 0;
  color: #a43a32;
  font-size: 0.8rem;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
