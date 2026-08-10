<script setup>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

// RouteMap is deliberately presentation-only: it draws route data supplied by
// its parent and reports route selections. Route generation and sensory-score
// calculation belong to the Flask/OpenRouteService integration.
const props = defineProps({
  // Each route requires an id, label, duration, colour, and a Leaflet-compatible
  // geometry array in [latitude, longitude] order.
  routes: { type: Array, required: true },
  selectedRouteId: { type: String, required: true },
})
const emit = defineEmits(['select'])

// Leaflet objects are intentionally kept outside Vue's reactive system. Vue
// only needs a reference to the DOM element in which Leaflet creates the map.
let map
let routeLayer
const mapElement = ref(null)

function drawRoutes() {
  // A prop watcher may run before Leaflet has finished initialising.
  if (!map) return

  // Rebuild one feature group on each update so old polylines, markers, and
  // event listeners do not remain on the map after a route selection changes.
  routeLayer?.remove()
  routeLayer = L.featureGroup().addTo(map)

  // Draw the selected route last so its solid, wider line appears above the
  // muted candidate routes where their geometries overlap.
  const orderedRoutes = [...props.routes].sort((route) =>
    route.id === props.selectedRouteId ? 1 : -1,
  )
  orderedRoutes.forEach((route) => {
    const selected = route.id === props.selectedRouteId
    L.polyline(route.geometry, {
      color: selected && !route.segments?.length ? route.color : '#809190',
      weight: selected ? 8 : 5,
      opacity: selected ? (route.segments?.length ? 0.35 : 1) : 0.48,
      dashArray: selected ? undefined : '9 8',
    })
      .addTo(routeLayer)
      .bindTooltip(`${route.label}: ${route.duration} min`)
      // The parent/store remains the single source of truth for selection.
      .on('click', () => emit('select', route.id))

    // The selected ORS route can carry consecutive pieces coloured by their
    // absolute sensory band. Keep the full line underneath so the small gaps
    // between 25 m sample midpoints never break the visible journey.
    if (selected && route.segments?.length) {
      route.segments.forEach((segment) => {
        if (!segment.geometry?.length) return
        L.polyline(segment.geometry, {
          color: segment.color,
          weight: 8,
          opacity: 1,
          lineCap: 'round',
        })
          .addTo(routeLayer)
          .bindTooltip(
            // "unknown stress" would read as a claim about the street. It is a
            // claim about our coverage, so that case gets its own wording.
            segment.band === 'unknown'
              ? `No sensor coverage · ${Math.round(segment.distance)} m`
              : `${segment.band} stress · ${Math.round(segment.distance)} m`,
          )
      })
    }
  })

  // Fall back to the first route when an obsolete or unavailable route id is
  // supplied. This also lets the component display one-route ORS responses.
  const selected =
    props.routes.find((route) => route.id === props.selectedRouteId) ?? props.routes[0]
  if (selected) {
    // The dark marker represents the origin and the red marker the destination.
    L.circleMarker(selected.geometry[0], {
      radius: 7,
      color: '#fff',
      weight: 3,
      fillColor: '#142526',
      fillOpacity: 1,
    }).addTo(routeLayer)
    L.circleMarker(selected.geometry.at(-1), {
      radius: 8,
      color: '#fff',
      weight: 3,
      fillColor: '#ef4d3e',
      fillOpacity: 1,
    }).addTo(routeLayer)

    // Keep the complete selected journey visible after every selection.
    map.fitBounds(L.latLngBounds(selected.geometry), { padding: [35, 35] })
  }
}

onMounted(() => {
  // Melbourne CBD is only the initial view; drawRoutes immediately replaces it
  // with bounds derived from the selected route.
  map = L.map(mapElement.value, { zoomControl: true }).setView([-37.809, 144.9645], 16)

  // Leaflet renders the interface and overlays; OpenStreetMap supplies the
  // background tiles and must retain visible attribution.
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)
  drawRoutes()
})

// Deep watching also redraws if a future API response replaces route geometry
// without replacing the containing array object.
watch(() => [props.routes, props.selectedRouteId], drawRoutes, { deep: true })

// Leaflet registers DOM and map event listeners, so remove the map when Vue
// unmounts this component to avoid duplicate containers and memory leaks.
onBeforeUnmount(() => map?.remove())
</script>

<template>
  <div ref="mapElement" class="route-map" aria-label="Map showing candidate walking routes"></div>
</template>

<style scoped>
.route-map {
  z-index: 0;
  width: 100%;
  height: 100%;
  min-height: 420px;
  background: #e8efed;
}
:deep(.leaflet-control-attribution) {
  font-size: 10px;
}
</style>
