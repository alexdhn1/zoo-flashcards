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

  // Pré-traitement : ajouter des sauts de ligne stratégiques
  // Séparer FLASHCARD# des éléments qui suivent immédiatement sans espace
  let normalized = text
    .replace(/FLASHCARD\s*(\d+)\s*(?=Q\s*[:：])/gi, 'FLASHCARD $1\n')  // FLASHCARD#Q: -> FLASHCARD#\nQ:
    .replace(/(?<=:)\s*FLASHCARD\s*(\d+)/gi, '\n\nFLASHCARD $1') // Ajouter saut avant FLASHCARD quand collé à fin de champ

  // Découper par "FLASHCARD N"
  const flashcardPattern = /FLASHCARD\s*(\d+)/gi
  let match
  const positions = []
  
  while ((match = flashcardPattern.exec(normalized)) !== null) {
    positions.push({
      index: match.index,
      number: parseInt(match[1]),
    })
  }

  for (let i = 0; i < positions.length; i++) {
    const startIdx = positions[i].index
    const endIdx = i + 1 < positions.length ? positions[i + 1].index : normalized.length
    const blockText = normalized.substring(startIdx, endIdx)
    
    // Nettoyer et extraire les champs
    const cleaned = blockText
      .replace(/^---+\s*/gm, '')
      .replace(/^FLASHCARD\s*\d+\s*/i, '')
      .trim()

    if (!cleaned) continue

    let question = '', answer = '', category = '', species = '', taxonomyOrder = '', taxonomyGroup = ''

    // Extraire Q : - chercher jusqu'au prochain marqueur de champ
    const qMatch = cleaned.match(/Q\s*[:：]\s*([\s\S]*?)(?=(?:[RA]|Cat|Species|TaxonomyOrder|TaxonomyGroup)\s*[:：]|$)/im)
    if (qMatch) {
      question = qMatch[1]
        .replace(/[\n\r]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    // Extraire R/A : - chercher jusqu'au prochain marqueur de champ
    const aMatch = cleaned.match(/[RA]\s*[:：]\s*([\s\S]*?)(?=(?:[QRA]|Cat|Species|TaxonomyOrder|TaxonomyGroup)\s*[:：]|$)/im)
    if (aMatch) {
      answer = aMatch[1]
        .replace(/[\n\r]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    // Extraire Catégorie/Category - jusqu'au prochain marqueur
    const catMatch = cleaned.match(/Cat[ée]gor[yi]e?\s*[:：]\s*([\s\S]*?)(?=(?:Species|TaxonomyOrder|TaxonomyGroup)\s*[:：]|$)/i)
    if (catMatch) {
      category = catMatch[1]
        .replace(/[\n\r]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    // Extraire Espèce/Species - jusqu'au prochain marqueur
    const spMatch = cleaned.match(/(Species|Esp[èe]ce)\s*[:：]\s*([\s\S]*?)(?=(?:TaxonomyOrder|TaxonomyGroup)\s*[:：]|$)/i)
    if (spMatch) {
      species = spMatch[2]
        .replace(/[\n\r]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    // Extraire TaxonomyOrder - jusqu'au prochain marqueur
    const toMatch = cleaned.match(/TaxonomyOrder\s*[:：]\s*([\s\S]*?)(?=TaxonomyGroup\s*[:：]|$)/i)
    if (toMatch) {
      taxonomyOrder = toMatch[1]
        .replace(/[\n\r]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    // Extraire TaxonomyGroup - jusqu'à la fin ou prochain FLASHCARD
    const tgMatch = cleaned.match(/TaxonomyGroup\s*[:：]\s*([\s\S]*?)$/i)
    if (tgMatch) {
      taxonomyGroup = tgMatch[1]
        .replace(/[\n\r]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    if (question && answer) {
      cards.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        question: question.trim(),
        answer: answer.trim(),
        category: category.trim(),
        species: species.trim(),
        speciesLabel: species.trim(),
        taxonomyGroup: taxonomyGroup.trim() || TAXONOMY_FALLBACK_GROUP,
        taxonomyOrder: taxonomyOrder.trim() || TAXONOMY_FALLBACK_ORDER,
        addedAt: new Date().toISOString(),
      })
    }
  }

  return cards
}
