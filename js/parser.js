/* ══════════════════════════════════════════════
   PARSER — extraction des flashcards depuis le texte brut
   
   Formats acceptés :
   - Avec ou sans séparateurs ---
   - "FLASHCARD 1\nQ : ..." (retour à la ligne)
   - "FLASHCARD 1 Q : ..."  (tout sur une ligne)
   - "FLASHCARD 1Q : ..."   (collé sans espace)
   - Q/A ou Q/R (anglais ou français)
   - Catégorie/Category + Espèce/Species sur lignes séparées ou collés
   ══════════════════════════════════════════════ */

function parseFlashcards(text) {
  const cards = [];

  // Étape 0 : normaliser le texte
  // Insérer un retour à la ligne avant chaque "FLASHCARD N" pour faciliter le split
  // Gère aussi le cas "FLASHCARD 1Q :" → "FLASHCARD 1\nQ :"
  let normalized = text
    // Séparer "FLASHCARD N" du reste s'ils sont collés
    .replace(/FLASHCARD\s*(\d+)\s*Q\s*[:：]/gi, 'FLASHCARD $1\nQ :')
    // S'assurer qu'il y a un saut de ligne avant chaque FLASHCARD
    .replace(/([^\n])(?=FLASHCARD\s*\d+)/gi, '$1\n');

  // Étape 1 : découper par "FLASHCARD N"
  const blocks = normalized.split(/(?=FLASHCARD\s*\d+)/i).filter(b => b.trim());

  for (const block of blocks) {
    // Nettoyer les --- et le header FLASHCARD N
    const cleaned = block
      .replace(/^---+\s*/gm, '')
      .replace(/^FLASHCARD\s*\d+\s*/i, '')
      .trim();
    if (!cleaned) continue;

    let question = '', answer = '', category = '', species = '';

    // ── Extraire Q : ──
    // Tout entre "Q :" et le prochain "R :" ou "A :"
    const qMatch = cleaned.match(/Q\s*[:：]\s*([\s\S]*?)(?=\n?\s*[RA]\s*[:：])/i);
    if (qMatch) question = qMatch[1].replace(/\s+/g, ' ').trim();

    // ── Extraire R : ou A : ──
    // Tout entre "R/A :" et le prochain "Catégor" ou fin de bloc
    const aMatch = cleaned.match(/[RA]\s*[:：]\s*([\s\S]*?)(?=\n?\s*Cat[ée]gor|$)/i);
    if (aMatch) answer = aMatch[1].replace(/\s+/g, ' ').trim();

    // ── Extraire Catégorie/Category ──
    const catMatch = cleaned.match(/Cat[ée]gor[yi]e?\s*[:：]\s*(.+)/i);
    if (catMatch) category = catMatch[1].trim();

    // ── Extraire Espèce/Species ──
    const spMatch = cleaned.match(/(Species|Esp[èe]ce)\s*[:：]\s*(.+)/i);
    if (spMatch) species = spMatch[2].trim();

    // ── Nettoyage croisé (quand les champs sont collés sur la même ligne) ──
    if (category) {
      category = category.replace(/(Species|Esp[èe]ce)\s*[:：].*/i, '').trim();
    }
    if (answer) {
      answer = answer.replace(/Cat[ée]gor[yi]e?\s*[:：].*/i, '').trim();
      answer = answer.replace(/(Species|Esp[èe]ce)\s*[:：].*/i, '').trim();
    }

    // ── Créer la carte si Q + A présentes ──
    if (question && answer) {
      cards.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        question: question.trim(),
        answer: answer.trim(),
        category,
        species,
        addedAt: new Date().toISOString(),
      });
    }
  }

  return cards;
}
