export const PROJECT_ICONS = [
  "🚀", "💼", "🎨", "📚", "🌐", "💪", "🏠", "✈️",
  "💰", "🎵", "📸", "🎮", "🏋️", "🧠", "🌱", "⭐",
] as const

export const PROJECT_TILE_COLORS = [
  "#0066cc", "#34c759", "#ff9f0a", "#af52de",
  "#3fd0c9", "#ff375f", "#2b8bf7", "#ff3b30",
] as const

export function defaultProjectIcon(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return PROJECT_ICONS[hash % PROJECT_ICONS.length]
}

export function defaultProjectColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return PROJECT_TILE_COLORS[hash % PROJECT_TILE_COLORS.length]
}
