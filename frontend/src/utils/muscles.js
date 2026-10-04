const IGNORED = ['head', 'knees']

// Map a raw click from react-body-highlighter to an API slug, or null to ignore
export function normalizeMuscle(raw) {
  if (IGNORED.includes(raw)) return null
  return raw === 'neck' ? 'trapezius' : raw
}

export function formatMuscle(slug) {
  return slug.replaceAll('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export function toMapMuscles(slugs) {
  return slugs.flatMap(s => (s === 'trapezius' ? ['trapezius', 'neck'] : [s]))
}