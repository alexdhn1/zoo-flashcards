import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider, ALLOWED_EMAILS } from './firebase-config'
import { loadCardsFromFirestore, addCardsToFirestore, deleteCardFromFirestore, clearAllCardsFirestore } from './firestore'
import { parseFlashcards } from './parser'
import {
  applyCombinedSelection,
  getSafeSelectedIndex,
  getTaxonomyGroups,
  normalizeCardTaxonomy,
} from './taxonomy.js'
import {
  Toast,
  ConfirmModal,
  CategorySelectionControls,
  FlashCard,
  ProgressDots,
  LoginScreen,
  CsvImportZone,
  TaxonomySelection,
} from './components'

/* ── Export JSON (téléchargement fichier) ── */
function exportJSON(cards) {
  const b = new Blob([JSON.stringify(cards, null, 2)], { type: 'application/json' })
  const u = URL.createObjectURL(b)
  const a = document.createElement('a')
  a.href = u
  a.download = `zoo-flashcards-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(u)
}

export default function App() {
  /* ── Auth state ── */
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  /* ── App state ── */
  const [allCards, setAllCards] = useState([])
  const [view, setView] = useState('input')
  const [rawText, setRawText] = useState('')
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [shuffleOrder, setShuffleOrder] = useState(null)
  const [parseError, setParseError] = useState('')
  const [toast, setToast] = useState({ message: '', visible: false })
  const [confirmDel, setConfirmDel] = useState(null)
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectionMode, setSelectionMode] = useState('AND')
  const [selectedTaxonomyGroupId, setSelectedTaxonomyGroupId] = useState(null)
  const [selectedTaxonomyOrderId, setSelectedTaxonomyOrderId] = useState(null)
  const [taxonomySearchQuery, setTaxonomySearchQuery] = useState('')
  const [syncStatus, setSyncStatus] = useState('ok')
  const [dataLoaded, setDataLoaded] = useState(false)
  const fileRef = useRef(null)
  const taxonomyGroups = useMemo(() => getTaxonomyGroups(), [])

  const showToast = msg => {
    setToast({ message: msg, visible: true })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500)
  }

  /* ══════════════════════════════════════
     AUTH
     ══════════════════════════════════════ */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (u && ALLOWED_EMAILS.includes(u.email?.toLowerCase())) {
        setUser(u)
      } else if (u) {
        signOut(auth)
        setUser(null)
        setAuthError(`Access denied for ${u.email}. This app is restricted.`)
      } else {
        setUser(null)
      }
      setAuthLoading(false)
    })
    return () => unsub()
  }, [])

  const handleLogin = useCallback(async () => {
    setLoginLoading(true)
    setAuthError('')
    try { await signInWithPopup(auth, googleProvider) }
    catch (err) { setAuthError('Sign-in failed. Please try again.') }
    setLoginLoading(false)
  }, [])

  const handleLogout = useCallback(async () => {
    await signOut(auth)
    setAllCards([])
    setView('input')
    setSelectedCategories([])
    setSelectedTaxonomyGroupId(null)
    setSelectedTaxonomyOrderId(null)
    setTaxonomySearchQuery('')
  }, [])

  /* ══════════════════════════════════════
     FIRESTORE SYNC
     ══════════════════════════════════════ */
  useEffect(() => {
    if (!user) { setAllCards([]); setDataLoaded(false); return }
    setDataLoaded(false)
    loadCardsFromFirestore(user.uid)
      .then(cards => {
        setAllCards(cards.map(normalizeCardTaxonomy))
        setDataLoaded(true)
        if (cards.length > 0) setView('cards')
      })
      .catch(err => {
        console.error('Firestore load error:', err)
        setSyncStatus('error')
        setDataLoaded(true)
      })
  }, [user])

  /* ══════════════════════════════════════
     SÉLECTIONS
     ══════════════════════════════════════ */
  const selectedCards = useMemo(() => {
    let nextCards = applyCombinedSelection(
      allCards,
      {
        selectedGroupId: selectedTaxonomyGroupId,
        selectedOrderId: selectedTaxonomyOrderId,
      },
      {
        selectedCategoryIds: selectedCategories,
        mode: selectionMode,
      },
      selectionMode
    )

    if (shuffleOrder) {
      const order = new Map(shuffleOrder.map((id, i) => [id, i]))
      nextCards = [...nextCards].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999))
    }
    return nextCards
  }, [allCards, selectedTaxonomyGroupId, selectedTaxonomyOrderId, selectedCategories, selectionMode, shuffleOrder])

  useEffect(() => {
    setIdx(currentIndex => getSafeSelectedIndex(currentIndex, selectedCards.length))
    if (selectedCards.length === 0) {
      setFlipped(false)
    }
  }, [selectedCards.length])

  const toggleCategorySelection = useCallback(categoryId => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
    setIdx(0)
    setFlipped(false)
    setShuffleOrder(null)
  }, [])

  const handleSelectTaxonomyGroup = useCallback(groupId => {
    setSelectedTaxonomyGroupId(groupId)
    setSelectedTaxonomyOrderId(null)
    setIdx(0)
    setFlipped(false)
    setShuffleOrder(null)
  }, [])

  const handleSelectTaxonomyOrder = useCallback((groupId, orderId) => {
    setSelectedTaxonomyGroupId(groupId)
    setSelectedTaxonomyOrderId(orderId)
    setIdx(0)
    setFlipped(false)
    setShuffleOrder(null)
  }, [])

  const handleResetTaxonomySelection = useCallback(() => {
    setSelectedTaxonomyGroupId(null)
    setSelectedTaxonomyOrderId(null)
    setTaxonomySearchQuery('')
    setIdx(0)
    setFlipped(false)
    setShuffleOrder(null)
  }, [])

  /* ══════════════════════════════════════
     ACTIONS
     ══════════════════════════════════════ */
  const handleParse = useCallback(async () => {
    setParseError('')
    const parsed = parseFlashcards(rawText).map(normalizeCardTaxonomy)
    if (parsed.length > 0) {
      setSyncStatus('saving')
      try {
        await addCardsToFirestore(user.uid, parsed)
        setAllCards(prev => [...prev, ...parsed])
        setIdx(0); setFlipped(false); setRawText(''); setView('cards'); setShuffleOrder(null)
        setSyncStatus('ok')
        showToast(`✅ ${parsed.length} cards added — synced to cloud`)
      } catch (err) {
        console.error('Save error:', err)
        setSyncStatus('error')
        showToast('❌ Failed to save to cloud')
      }
    } else {
      setParseError('No flashcards detected. Each card needs "FLASHCARD N" with Q: and A: (or R:) fields.')
    }
  }, [rawText, user])

  const handleDelete = useCallback(id => setConfirmDel(id), [])
  const doDelete = useCallback(async () => {
    setSyncStatus('saving')
    try {
      await deleteCardFromFirestore(user.uid, confirmDel)
      setAllCards(prev => prev.filter(c => c.id !== confirmDel))
      setConfirmDel(null); setFlipped(false)
      setIdx(i => getSafeSelectedIndex(i, selectedCards.filter(c => c.id !== confirmDel).length))
      setSyncStatus('ok')
      showToast('🗑 Card deleted')
    } catch (err) {
      setSyncStatus('error'); showToast('❌ Failed to delete'); setConfirmDel(null)
    }
  }, [confirmDel, user, selectedCards])

  const handleClearAll = useCallback(async () => {
    setSyncStatus('saving')
    try {
      await clearAllCardsFirestore(user.uid)
      setAllCards([])
      setSelectedCategories([])
      setSelectedTaxonomyGroupId(null)
      setSelectedTaxonomyOrderId(null)
      setTaxonomySearchQuery('')
      setIdx(0)
      setView('input')
      setShuffleOrder(null)
      setSyncStatus('ok'); showToast('🗑 All cards cleared')
    } catch (err) { setSyncStatus('error'); showToast('❌ Failed to clear') }
  }, [user])

  const handleShuffle = useCallback(() => {
    const ids = selectedCards.map(c => c.id).sort(() => Math.random() - 0.5)
    setShuffleOrder(ids); setIdx(0); setFlipped(false)
  }, [selectedCards])

  const handleImport = useCallback(async (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const imp = JSON.parse(ev.target.result)
        if (Array.isArray(imp) && imp.length > 0) {
          const wi = imp.map(c => ({
            ...normalizeCardTaxonomy(c),
            id: c.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            addedAt: c.addedAt || new Date().toISOString(),
          }))
          setSyncStatus('saving')
          await addCardsToFirestore(user.uid, wi)
          setAllCards(prev => [...prev, ...wi])
          setView('cards'); setSyncStatus('ok')
          showToast(`📥 ${wi.length} cards imported & synced`)
        }
      } catch (err) { showToast('❌ Invalid JSON file') }
    }
    reader.readAsText(file); e.target.value = ''
  }, [user])

  const handleCsvImport = useCallback(async (cards) => {
    const normalizedCards = cards.map(normalizeCardTaxonomy)
    setSyncStatus('saving')
    try {
      await addCardsToFirestore(user.uid, normalizedCards)
      setAllCards(prev => [...prev, ...normalizedCards])
      setView('cards'); setSyncStatus('ok')
      showToast(`📥 ${normalizedCards.length} cards imported & synced`)
    } catch (err) {
      console.error('CSV import error:', err)
      setSyncStatus('error')
      showToast('❌ Failed to save to cloud')
    }
  }, [user])

  /* ══════════════════════════════════════
     RACCOURCIS CLAVIER
     ══════════════════════════════════════ */
  useEffect(() => {
    if (view !== 'cards') return
    const h = e => {
      if (e.key === 'ArrowRight' || e.key === 'd') { setIdx(i => Math.min(i + 1, selectedCards.length - 1)); setFlipped(false) }
      else if (e.key === 'ArrowLeft' || e.key === 'a') { setIdx(i => Math.max(i - 1, 0)); setFlipped(false) }
      else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped(f => !f) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [view, selectedCards.length])

  /* ══════════════════════════════════════
     RENDER
     ══════════════════════════════════════ */
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="spinner" style={{ width: 36, height: 36, borderWidth: 4 }}></span>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#78716c', marginTop: 16 }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return <LoginScreen onLogin={handleLogin} error={authError} loading={loginLoading} />

  if (!dataLoaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="spinner" style={{ width: 36, height: 36, borderWidth: 4 }}></span>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#78716c', marginTop: 16 }}>Loading your cards...</p>
        </div>
      </div>
    )
  }

  // Header bar
  const headerBar = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', marginBottom: 8, borderBottom: '1px solid #e7e0d5' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src={user.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #e2e0db' }} referrerPolicy="no-referrer" />
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#78716c' }}>{user.displayName?.split(' ')[0]}</span>
        <span className={`sync-dot ${syncStatus}`} title={syncStatus === 'ok' ? 'Synced' : syncStatus === 'saving' ? 'Saving...' : 'Sync error'}></span>
      </div>
      <button className="btn" style={{ fontSize: 11, padding: '5px 12px' }} onClick={handleLogout}>sign out</button>
    </div>
  )

  /* ── VUE INPUT ── */
  if (view === 'input') {
    return (
      <div style={{ padding: '24px 20px', maxWidth: 640, margin: '0 auto' }}>
        {headerBar}
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: 32, marginTop: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🦎</div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 26, color: '#292524', marginBottom: 8, letterSpacing: -0.5 }}>Zoo Board Flashcards</h1>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#78716c', letterSpacing: 0.5 }}>
            {allCards.length > 0 ? `${allCards.length} cards in your deck — paste more below` : 'Paste your Claude output to create your deck'}
          </p>
          {allCards.length > 0 && <button className="btn" style={{ marginTop: 12 }} onClick={() => setView('cards')}>← back to deck</button>}
        </div>
        <div className="fade-up" style={{ animationDelay: '0.1s' }}>
          <textarea className="paste-area" value={rawText} onChange={e => setRawText(e.target.value)}
            placeholder={`Paste flashcards output from Claude here...\n\nFLASHCARD 1\nQ: Your question...\nR: Your answer...\nCategory: 1 — Diagnosis\nSpecies: ...`} />
        </div>
        <div className="fade-up" style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'center', flexWrap: 'wrap', animationDelay: '0.2s' }}>
          <button className="btn-primary" onClick={handleParse} disabled={!rawText.trim() || syncStatus === 'saving'}>
            {syncStatus === 'saving' ? 'Saving...' : allCards.length > 0 ? 'Add to deck →' : 'Generate cards →'}
          </button>
        </div>
        {parseError && <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontFamily: "'DM Mono', monospace", fontSize: 12, textAlign: 'center' }}>⚠️ {parseError}</div>}
        <div className="fade-up" style={{ marginTop: 24, animationDelay: '0.25s' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#a8a29e', textAlign: 'center', marginBottom: 8, letterSpacing: 0.5 }}>
            — or import from NotebookLM —
          </div>
          <CsvImportZone onImport={handleCsvImport} disabled={syncStatus === 'saving'} />
        </div>
        <div className="fade-up" style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'center', flexWrap: 'wrap', animationDelay: '0.3s' }}>
          <button className="btn" onClick={() => fileRef.current?.click()}>📥 import JSON</button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          {allCards.length > 0 && <>
            <button className="btn" onClick={() => exportJSON(allCards)}>📤 export ({allCards.length})</button>
            <button className="btn-danger" style={{ padding: '8px 16px' }} onClick={handleClearAll}>🗑 clear all</button>
          </>}
        </div>
        <Toast message={toast.message} visible={toast.visible} />
      </div>
    )
  }

  /* ── VUE CARDS ── */
  const card = selectedCards[idx]
  return (
    <div style={{ padding: '24px 20px', maxWidth: 680, margin: '0 auto' }}>
      {headerBar}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
        <button className="btn" onClick={() => setView('input')}>+ add cards</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🦎</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#78716c' }}>{selectedCards.length} / {allCards.length} cards</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => exportJSON(allCards)} title="Export JSON">📤</button>
          <button className="btn" onClick={handleShuffle} title="Shuffle">🔀</button>
        </div>
      </div>
      {selectedCards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#78716c', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>No cards match the current selection</div>
      ) : (
        <>
          <div style={{ marginBottom: 24 }}><ProgressDots cards={selectedCards} currentIndex={idx} onJump={i => { setIdx(i); setFlipped(false) }} /></div>
          {card && <FlashCard card={card} index={idx} total={selectedCards.length} flipped={flipped}
            onFlip={() => setFlipped(f => !f)}
            onNext={() => { setIdx(i => Math.min(i + 1, selectedCards.length - 1)); setFlipped(false) }}
            onPrev={() => { setIdx(i => Math.max(i - 1, 0)); setFlipped(false) }}
            onDelete={handleDelete} />}
          <div style={{ textAlign: 'center', marginTop: 32, fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#a8a29e' }}>
            <span className="kbd">← →</span> navigate <span style={{ margin: '0 12px' }}>·</span> <span className="kbd">space</span> flip
          </div>
        </>
      )}
      <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
        <TaxonomySelection
          taxonomyGroups={taxonomyGroups}
          selectedGroupId={selectedTaxonomyGroupId}
          selectedOrderId={selectedTaxonomyOrderId}
          searchQuery={taxonomySearchQuery}
          onSearchChange={setTaxonomySearchQuery}
          onSelectGroup={handleSelectTaxonomyGroup}
          onSelectOrder={handleSelectTaxonomyOrder}
          onResetSelection={handleResetTaxonomySelection}
        />
        <CategorySelectionControls
          allCards={allCards}
          selectedCategories={selectedCategories}
          onToggleCategory={toggleCategorySelection}
          selectionMode={selectionMode}
          onSelectionModeChange={setSelectionMode}
        />
      </div>
      {confirmDel && <ConfirmModal message="Delete this flashcard? This cannot be undone." onConfirm={doDelete} onCancel={() => setConfirmDel(null)} />}
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}
