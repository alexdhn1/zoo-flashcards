import React, { useMemo, useState, useRef, useCallback } from 'react'
import { catIcons, catColors, catNames, getCatNum, getCatIcon, getCatColor } from './categories'
import { parseCSV } from './csvParser'
import { filterTaxonomyGroups } from './taxonomy.js'

/* ── Google SVG icon ── */
export function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

/* ── Toast ── */
export function Toast({ message, visible }) {
  return <div className={`toast ${visible ? 'show' : ''}`}>{message}</div>
}

/* ── Modal de confirmation ── */
export function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, color: '#292524', marginBottom: 20, lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn-danger" style={{ padding: '8px 18px', fontSize: 12 }} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}

/* ── Sélection par catégorie ── */
export function CategorySelectionControls({
  allCards,
  selectedCategories,
  onToggleCategory,
  selectionMode,
  onSelectionModeChange,
}) {
  const cats = useMemo(() => {
    const m = {}
    allCards.forEach(c => {
      const n = getCatNum(c.category)
      if (!m[n]) m[n] = { count: 0 }
      m[n].count++
    })
    return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0]))
  }, [allCards])

  return (
    <div className="selection-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#78716c', marginBottom: 4, letterSpacing: 0.5 }}>
            Category selection
          </div>
          <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color: '#44403c' }}>
            Leave empty to study all categories.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`selection-mode-btn ${selectionMode === 'AND' ? 'active' : ''}`}
            onClick={() => onSelectionModeChange('AND')}
            type="button"
          >
            AND
          </button>
          <button
            className={`selection-mode-btn ${selectionMode === 'OR' ? 'active' : ''}`}
            onClick={() => onSelectionModeChange('OR')}
            type="button"
          >
            OR
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {cats.map(([num, { count }]) => {
          const col = catColors[num] || { bg: '#f3f4f6', border: '#9ca3af', text: '#374151' }
          const active = selectedCategories.includes(num)
          return (
            <button key={num} className={`filter-chip ${active ? '' : 'inactive'}`}
              onClick={() => onToggleCategory(num)}
              style={{ borderColor: col.border, background: active ? col.bg : 'transparent', color: col.text }}>
              {catIcons[num] || '📋'} {catNames[num] || `Cat ${num}`} ({count})
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function TaxonomySelection({
  taxonomyGroups,
  selectedGroupId,
  selectedOrderId,
  searchQuery,
  onSearchChange,
  onSelectGroup,
  onSelectOrder,
  onResetSelection,
}) {
  const visibleGroups = useMemo(
    () => filterTaxonomyGroups(taxonomyGroups, searchQuery),
    [taxonomyGroups, searchQuery]
  )

  const currentSelectionLabel = selectedOrderId || selectedGroupId || 'Tous'

  return (
    <details className="selection-panel" open>
      <summary style={{ cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#78716c', marginBottom: 4, letterSpacing: 0.5 }}>
            Taxonomy selection
          </div>
          <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, color: '#44403c' }}>
            Current selection: {currentSelectionLabel}
          </div>
        </div>
        <button className="btn" type="button" onClick={e => { e.preventDefault(); onResetSelection() }}>
          Tous
        </button>
      </summary>
      <div style={{ marginTop: 14 }}>
        <input
          className="taxonomy-search-input"
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search groups or orders"
        />
        <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          {visibleGroups.map(group => {
            const groupActive = selectedGroupId === group.id && !selectedOrderId
            return (
              <section key={group.id} className="taxonomy-group-block">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, color: '#292524', fontWeight: 600 }}>
                    {group.label}
                  </h3>
                  <button
                    className={`group-selection-btn ${groupActive ? 'active' : ''}`}
                    type="button"
                    onClick={() => onSelectGroup(group.id)}
                  >
                    Select group
                  </button>
                </div>
                {group.orders.length === 0 ? (
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#a8a29e', marginTop: 8 }}>
                    No orders configured yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                    {group.orders.map(order => {
                      const orderActive = selectedOrderId === order.id
                      return (
                        <button
                          key={order.id}
                          className={`taxonomy-order-chip ${orderActive ? 'active' : ''}`}
                          type="button"
                          onClick={() => onSelectOrder(group.id, order.id)}
                        >
                          {order.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>
            )
          })}
          {visibleGroups.length === 0 && (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#78716c' }}>
              No taxonomy options match this search.
            </div>
          )}
        </div>
      </div>
    </details>
  )
}

/* ── Carte avec flip ── */
export function FlashCard({ card, index, total, onNext, onPrev, onFlip, flipped, onDelete }) {
  const c = getCatColor(card.category)
  const icon = getCatIcon(card.category)
  const speciesLabel = card.speciesLabel || card.species

  return (
    <div className="flip-container card-in" key={card.id}>
      <div className={`flip-card ${flipped ? 'flipped' : ''}`} onClick={onFlip}>
        {/* Face question */}
        <div className="flip-face" style={{
          border: `2px solid ${c.border}`,
          background: `linear-gradient(135deg, #fff 0%, ${c.bg} 100%)`,
          boxShadow: `0 8px 32px ${c.border}33, 0 2px 8px rgba(0,0,0,0.06)`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.text, opacity: 0.7 }}>
              {icon} {card.category}
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#94a3b8', background: '#f1f5f9', padding: '3px 10px', borderRadius: 20 }}>
              {index + 1} / {total}
            </span>
          </div>
          {speciesLabel && (
            <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 13, fontStyle: 'italic', color: c.text, opacity: 0.6, marginBottom: 16 }}>
              {speciesLabel}
            </div>
          )}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 19, lineHeight: 1.55, color: '#1e293b', textAlign: 'center' }}>
              {card.question}
            </p>
          </div>
          <div style={{ textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#94a3b8', marginTop: 12 }}>
            tap to reveal answer
          </div>
        </div>

        {/* Face réponse */}
        <div className="flip-face flip-back" style={{
          border: `2px solid ${c.border}`,
          background: `linear-gradient(135deg, ${c.bg} 0%, #fff 100%)`,
          boxShadow: `0 8px 32px ${c.border}33, 0 2px 8px rgba(0,0,0,0.06)`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: c.text, background: `${c.border}22`, padding: '4px 12px', borderRadius: 20 }}>
              Answer
            </span>
            <button className="btn-danger" onClick={e => { e.stopPropagation(); onDelete(card.id) }} title="Delete this card">🗑</button>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, lineHeight: 1.6, color: c.text, textAlign: 'center' }}>
              {card.answer}
            </p>
          </div>
          <div style={{ textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#94a3b8', marginTop: 12 }}>
            tap to see question
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
        <button className="btn-nav" onClick={e => { e.stopPropagation(); onPrev() }} disabled={index === 0}>← prev</button>
        <button className="btn-nav" onClick={e => { e.stopPropagation(); onNext() }} disabled={index === total - 1}>next →</button>
      </div>
    </div>
  )
}

/* ── Dots de progression ── */
export function ProgressDots({ cards, currentIndex, onJump }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 500, margin: '0 auto' }}>
      {cards.map((card, i) => {
        const c = getCatColor(card.category)
        return (
          <button key={card.id} className="dot" onClick={() => onJump(i)}
            title={`Card ${i + 1}`}
            style={{ width: i === currentIndex ? 28 : 10, background: i === currentIndex ? c.border : `${c.border}44` }}
          />
        )
      })}
    </div>
  )
}

/* ── CSV preview list ── */
export function CsvPreviewList({ cards, skipped }) {
  return (
    <div>
      {skipped > 0 && (
        <div className="csv-skip-warning">
          ⚠️ {skipped} row{skipped > 1 ? 's' : ''} skipped — missing question or answer
        </div>
      )}
      <ol className="csv-preview-list">
        {cards.map((card, i) => (
          <li key={card.id} style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#78716c', marginBottom: 2 }}>
              Q{i + 1}
            </div>
            <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: '#292524', marginBottom: 2 }}>
              {card.question}
            </div>
            <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 13, color: '#78716c', fontStyle: 'italic' }}>
              → {card.answer}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

/* ── CSV drag-and-drop import zone ── */
export function CsvImportZone({ onImport, disabled }) {
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState(null)
  const [skipped, setSkipped] = useState(0)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const reset = useCallback(() => {
    setPreview(null)
    setSkipped(0)
    setError(null)
    setDragOver(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const processFile = useCallback((file) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please drop a CSV file (.csv)')
      setPreview(null)
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = parseCSV(ev.target.result)
      if (result.error === 'EMPTY_FILE') {
        setError('The file contains no flashcards')
        setPreview(null)
      } else if (result.error === 'FORMAT_ERROR') {
        setError('Format not recognized — expected two columns: question and answer')
        setPreview(null)
      } else {
        setError(null)
        setPreview(result.cards)
        setSkipped(result.skipped)
      }
    }
    reader.readAsText(file, 'utf-8')
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    processFile(file)
  }, [processFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragOver(false), [])

  const handleFileChange = useCallback((e) => {
    processFile(e.target.files[0])
    e.target.value = ''
  }, [processFile])

  const handleConfirm = useCallback(() => {
    if (preview) onImport(preview)
  }, [preview, onImport])

  return (
    <div style={{ marginTop: 20 }}>
      {!preview ? (
        <div
          className={`csv-drop-zone${dragOver ? ' dragover' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div style={{ fontSize: 24, marginBottom: 8 }}>📄</div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#78716c', margin: 0 }}>
            Drop a NotebookLM CSV
          </p>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#a8a29e', marginTop: 4 }}>
            or click to browse
          </p>
        </div>
      ) : (
        <div style={{ border: '1px solid #e7e0d5', borderRadius: 12, padding: '16px 20px', background: '#fafaf9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#292524', fontWeight: 600 }}>
              {preview.length} card{preview.length !== 1 ? 's' : ''} ready to import
            </span>
            <button className="btn" style={{ fontSize: 11 }} onClick={reset}>✕ cancel</button>
          </div>
          <CsvPreviewList cards={preview} skipped={skipped} />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <button
              className="btn-primary"
              onClick={handleConfirm}
              disabled={disabled}
            >
              {disabled ? 'Saving...' : `Add ${preview.length} cards to deck →`}
            </button>
          </div>
        </div>
      )}
      {error && (
        <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  )
}

/* ── Écran de login ── */
export function LoginScreen({ onLogin, error, loading }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="fade-up" style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🦎</div>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 32, color: '#292524', marginBottom: 8, letterSpacing: -0.5 }}>
          Zoo Board Flashcards
        </h1>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#78716c', letterSpacing: 0.5, marginBottom: 36 }}>
          European Board of Veterinary Zoological Medicine
        </p>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <span className="spinner" style={{ width: 24, height: 24 }}></span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#78716c' }}>Signing in...</span>
          </div>
        ) : (
          <button className="btn-google" onClick={onLogin}>
            <GoogleIcon /> Sign in with Google
          </button>
        )}
        {error && (
          <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontFamily: "'DM Mono', monospace", fontSize: 12, textAlign: 'center' }}>
            {error}
          </div>
        )}
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#a8a29e', marginTop: 32 }}>
          Access restricted to authorized accounts only
        </p>
      </div>
    </div>
  )
}
