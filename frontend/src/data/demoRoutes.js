export const demoRoutes = [
  {
    id: 'calmest',
    label: 'Calmest',
    description: 'Lowest sensory load',
    duration: 8,
    distance: 620,
    stress: 22,
    crowd: 'Low',
    dataSource: 'Demo data',
    color: '#168f86',
    geometry: [
      [-37.81018, 144.9628], [-37.8097, 144.9632], [-37.80925, 144.964],
      [-37.8087, 144.9648], [-37.8081, 144.9654], [-37.8075, 144.9658],
    ],
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'A calm, direct option',
    duration: 7,
    distance: 540,
    stress: 34,
    crowd: 'Medium',
    dataSource: 'Demo data',
    color: '#5b6fe5',
    geometry: [
      [-37.81018, 144.9628], [-37.8095, 144.9636], [-37.8089, 144.9645],
      [-37.8082, 144.965], [-37.8075, 144.9658],
    ],
  },
  {
    id: 'fastest',
    label: 'Fastest',
    description: 'Shortest walking time',
    duration: 6,
    distance: 480,
    stress: 51,
    crowd: 'Medium',
    dataSource: 'Demo data',
    color: '#ef8354',
    geometry: [
      [-37.81018, 144.9628], [-37.8098, 144.964], [-37.809, 144.9652],
      [-37.8082, 144.9656], [-37.8075, 144.9658],
    ],
  },
]

export const demoInstructions = [
  { text: 'Head east towards Swanston Street', distance: '120 m' },
  { text: 'Turn left onto Swanston Street', distance: '250 m' },
  { text: 'Continue straight past La Trobe Street', distance: '180 m' },
  { text: 'The State Library is on your right', distance: '70 m' },
]
