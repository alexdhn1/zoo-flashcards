/**
 * parser.js
 * Parse le texte brut des flashcards en objets structurés
 * 
 * Formats acceptés :
 * - Avec ou sans séparateurs ---
 * - "FLASHCARD 1\nQ :" (retour à la ligne)
 * - "FLASHCARD 1 Q :" (espace)  
 * - "FLASHCARD 1Q :" (collé)
 * - Q/A ou Q/R (anglais ou français)
 * - Catégorie/Category + Espèce/Species sur même ligne ou séparées
 */
import { TAXONOMY_FALLBACK_GROUP, TAXONOMY_FALLBACK_ORDER } from './taxonomy'

export function parseFlashcards(text) {
  const cards = []

  // Pré-traitement : injecter un saut de ligne entre "FLASHCARD N" et "Q :"
  // quand ils sont collés (ex: "FLASHCARD 1Q :")
  const normalized = text.replace(
    /FLASHCARD\s*(\d+)\s*(?=Q\s*[:：])/gi,
    'FLASHCARD $1\n'
  )

  // Découper par "FLASHCARD N"
  const blocks = normalized.split(/(?=FLASHCARD\s*\d+)/i).filter(b => b.trim())

  for (const block of blocks) {
    const cleaned = block
      .replace(/^---+\s*/gm, '')
      .replace(/^FLASHCARD\s*\d+\s*/i, '')
      .trim()
    if (!cleaned) continue

    let question = '', answer = '', category = '', species = ''

    // Extraire Q :
    const qMatch = cleaned.match(/^Q\s*[:：]\s*([\s\S]*?)(?=\n?\s*[RA]\s*[:：])/im)
    if (qMatch) question = qMatch[1].replace(/\s+/g, ' ').trim()

    // Extraire R/A :
    const aMatch = cleaned.match(/^[RA]\s*[:：]\s*([\s\S]*?)(?=\n?\s*Cat[ée]gor|$)/im)
    if (aMatch) answer = aMatch[1].replace(/\s+/g, ' ').trim()

    // Extraire Catégorie/Category
    const catMatch = cleaned.match(/Cat[ée]gor[yi]e?\s*[:：]\s*(.+)/i)
    if (catMatch) category = catMatch[1].trim()

    // Extraire Espèce/Species
    const spMatch = cleaned.match(/(Species|Esp[èe]ce)\s*[:：]\s*(.+)/i)
    if (spMatch) species = spMatch[2].trim()

    // Nettoyage croisé
    if (category) category = category.replace(/(Species|Esp[èe]ce)\s*[:：].*/i, '').trim()
    if (answer) {
      answer = answer.replace(/Cat[ée]gor[yi]e?\s*[:：].*/i, '').trim()
      answer = answer.replace(/(Species|Esp[èe]ce)\s*[:：].*/i, '').trim()
    }

    if (question && answer) {
      cards.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        question: question.trim(),
        answer: answer.trim(),
        category,
        species,
        speciesLabel: species,
        taxonomyGroup: TAXONOMY_FALLBACK_GROUP,
        taxonomyOrder: TAXONOMY_FALLBACK_ORDER,
        addedAt: new Date().toISOString(),
      })
    }
  }
  return cards
}
