// Icônes, couleurs, noms des 8 catégories d'application clinique

export const catIcons = {
  '1': '🔍', '2': '💊', '3': '📈', '4': '🛡️',
  '5': '😴', '6': '🧬', '7': '🩺', '8': '✂️',
}

export const catColors = {
  '1': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  '2': { bg: '#dbeafe', border: '#3b82f6', text: '#1e3a5f' },
  '3': { bg: '#d1fae5', border: '#10b981', text: '#064e3b' },
  '4': { bg: '#ede9fe', border: '#8b5cf6', text: '#4c1d95' },
  '5': { bg: '#fce7f3', border: '#ec4899', text: '#831843' },
  '6': { bg: '#ffedd5', border: '#f97316', text: '#7c2d12' },
  '7': { bg: '#e0f2fe', border: '#0ea5e9', text: '#0c4a6e' },
  '8': { bg: '#fde2e2', border: '#ef4444', text: '#7f1d1d' },
}

export const catNames = {
  '1': 'Diagnosis', '2': 'Therapeutics', '3': 'Prognosis', '4': 'Prevention',
  '5': 'Anesthesia', '6': 'Species specifics', '7': 'Diagnostic proc.', '8': 'Therapeutic proc.',
}

const defaultColor = { bg: '#f3f4f6', border: '#9ca3af', text: '#374151' }

/** Extraire le numéro de catégorie depuis le texte */
export function getCatNum(cat) {
  for (const k of Object.keys(catIcons)) {
    if (cat.includes(k)) return k
  }
  return '0'
}

export function getCatIcon(cat) { return catIcons[getCatNum(cat)] || '📋' }
export function getCatColor(cat) { return catColors[getCatNum(cat)] || defaultColor }
