import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Printer, RefreshCw, Clock, CheckCircle2, Circle, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import SideMenu from '../components/SideMenu'
import { parseSteps, parseDone } from '../lib/blueprint'
import type { SavedBlueprint, BlueprintStep } from '../lib/blueprint'

// ─── My Blueprint ────────────────────────────────────────────────────────────
// The plan the Strategy Engine produced, saved and workable. Steps check off,
// progress persists, and the whole thing prints for a sit-down conversation.
// This is "work the plan", the step that was missing between getting a plan
// and logging what happened.

function daysSince(iso: string): number | null {
  if (!iso) return null
  // SQLite hands back "YYYY-MM-DD HH:MM:SS" in UTC with no timezone marker, so
  // a naive parse reads it as local time and can land in the future.
  const norm = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(iso)
    ? iso.replace(' ', 'T').replace(/(\.\d+)?$/, '') + 'Z'
    : iso
  const d = new Date(norm)
  if (isNaN(d.getTime())) return null
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000))
}

export default function Blueprint() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [list, setList] = useState<SavedBlueprint[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { document.title = 'My Blueprint | Intelligent Funding' }, [])

  const load = useCallback(() => {
    fetch('/api/my/blueprints', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((d: SavedBlueprint[]) => {
        if (Array.isArray(d)) {
          setList(d)
          setActiveId(prev => (prev != null && d.some(b => b.id === prev) ? prev : d[0]?.id ?? null))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])
  useEffect(() => { load() }, [load])

  const active = useMemo(() => list.find(b => b.id === activeId) || null, [list, activeId])
  const steps: BlueprintStep[] = useMemo(() => (active ? parseSteps(active.steps) : []), [active])

  // Completion is held in its own state with a ref mirror. Deriving it from
  // `list` meant two quick clicks both read the same stale value and one got
  // dropped. The ref always holds the latest, so rapid taps can't stomp.
  const [done, setDone] = useState<number[]>([])
  const doneRef = useRef<number[]>([])
  useEffect(() => {
    const d = active ? parseDone(active.done) : []
    doneRef.current = d
    setDone(d)
  }, [active])
  const actionable = steps.filter(s => s.kind !== 'wait')
  const doneCount = actionable.filter(s => done.includes(s.n)).length
  const pct = actionable.length ? Math.round((doneCount / actionable.length) * 100) : 0
  const nextStep = steps.find(s => s.kind !== 'wait' && !done.includes(s.n))
  const age = active ? daysSince(active.created_at) : null

  // Saves are debounced. Firing one request per click meant several concurrent
  // PATCHes landing out of order, and whichever finished last won — so checking
  // a few boxes quickly could silently lose progress. One request, final state.
  const saveTimer = useRef<number | null>(null)
  const flush = useCallback((id: number) => {
    fetch(`/api/my/blueprints/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ done: doneRef.current }),
      keepalive: true,
    }).catch(() => {})
  }, [token])

  function toggle(n: number) {
    if (!active) return
    const cur = doneRef.current
    const next = cur.includes(n) ? cur.filter(x => x !== n) : [...cur, n]
    doneRef.current = next
    setDone(next)
    setList(prev => prev.map(b => (b.id === active.id ? { ...b, done: JSON.stringify(next) } : b)))
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => flush(active.id), 500)
  }

  // Don't lose an in-flight change if they navigate or close the tab.
  useEffect(() => {
    const id = active?.id
    return () => {
      if (saveTimer.current && id != null) {
        window.clearTimeout(saveTimer.current)
        flush(id)
      }
    }
  }, [active?.id, flush])

  async function remove(id: number) {
    if (!confirm('Delete this blueprint? Your logged accounts are not affected.')) return
    await fetch(`/api/my/blueprints/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setActiveId(null)
    load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .guide { max-width: 100% !important; }
          .bp-step { break-inside: avoid; }
          body { background: #fff !important; }
        }
      `}</style>
      <div className="no-print"><Header onMenuOpen={() => setMenuOpen(true)} /></div>
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="guide">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 6px' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={24} />
          </div>
          <h1 className="guide__title" style={{ margin: 0 }}>My Blueprint</h1>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
        ) : !active ? (
          <>
            <p className="guide__subtitle">
              Your saved funding plan lives here: numbered steps, in order, with the timing on each one.
              Check them off as you go and the plan tracks itself.
            </p>
            <div style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: 30, textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                You haven't saved a blueprint yet. Run the Strategy Engine and hit “Save as my blueprint.”
              </p>
              <button className="btn btn--primary btn--lg" onClick={() => navigate('/strategy')}>
                Run the Strategy Engine →
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="guide__subtitle" style={{ marginBottom: 14 }}>
              {active.title}
              {age != null && <> · saved {age === 0 ? 'today' : `${age} day${age === 1 ? '' : 's'} ago`}</>}
            </p>

            {/* Progress */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{doneCount} of {actionable.length} steps complete</span>
                <span style={{ fontWeight: 800, color: 'var(--teal)' }}>{pct}%</span>
              </div>
              <div style={{ height: 10, borderRadius: 999, background: 'var(--badge-gray-bg)', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--navy), var(--teal))', transition: 'width .3s' }} />
              </div>
            </div>

            {/* Next up */}
            {nextStep && (
              <div style={{ background: 'linear-gradient(100deg, var(--navy), #164e63)', color: '#fff', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 18, boxShadow: 'var(--shadow-md)' }}>
                <div style={{ fontSize: '0.7rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#67e8f9', fontWeight: 800 }}>Next up · step {nextStep.n}</div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: 3 }}>{nextStep.title}</div>
                <div style={{ fontSize: '0.83rem', opacity: 0.88, marginTop: 3 }}>{nextStep.timing}</div>
              </div>
            )}

            {/* Actions */}
            <div className="no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              <button className="btn btn--secondary" onClick={() => window.print()} style={{ display: 'inline-flex', gap: 6 }}>
                <Printer size={15} /> Print / save as PDF
              </button>
              <button className="btn btn--ghost" onClick={() => navigate('/strategy')} style={{ display: 'inline-flex', gap: 6 }}>
                <RefreshCw size={15} /> Re-run the engine
              </button>
              <button className="btn btn--ghost" onClick={() => navigate('/map')} style={{ display: 'inline-flex', gap: 6 }}>
                Log a result →
              </button>
            </div>

            {age != null && age >= 90 && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: 14, marginBottom: 18, fontSize: '0.87rem', color: '#92400e' }}>
                <b>This blueprint is {age} days old.</b> Your accounts, inquiries, and utilization have moved since then.
                Re-run the engine and see what opened up.
              </div>
            )}

            {/* The steps */}
            {steps.map(s => {
              const isDone = done.includes(s.n)
              const isWait = s.kind === 'wait'
              return (
                <div
                  key={s.n}
                  className="bp-step"
                  style={{
                    display: 'flex', gap: 12, padding: '14px 16px', marginBottom: 10,
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                    borderLeft: `4px solid ${isWait ? '#cbd5e1' : isDone ? '#15803d' : 'var(--navy)'}`,
                    background: isWait ? 'var(--badge-gray-bg)' : '#fff',
                    opacity: isDone ? 0.62 : 1,
                  }}
                >
                  {isWait ? (
                    <Clock size={20} style={{ flexShrink: 0, color: 'var(--text-secondary)', marginTop: 2 }} />
                  ) : (
                    <button
                      onClick={() => toggle(s.n)}
                      className="no-print"
                      title={isDone ? 'Mark as not done' : 'Mark complete'}
                      style={{ background: 'none', flexShrink: 0, padding: 0, marginTop: 1, color: isDone ? '#15803d' : 'var(--border)' }}
                    >
                      {isDone ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                    </button>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, color: 'var(--teal)', fontSize: '0.82rem' }}>
                        {isWait ? 'WAIT' : `STEP ${s.n}`}
                      </span>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{s.timing}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.98rem', margin: '3px 0 4px', textDecoration: isDone ? 'line-through' : 'none' }}>
                      {s.title}
                    </div>
                    <p style={{ fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>{s.why}</p>
                    {s.instId != null && (
                      <button
                        className="no-print"
                        onClick={() => navigate(`/institution/${s.instId}`)}
                        style={{ background: 'none', padding: 0, marginTop: 6, color: 'var(--teal)', fontWeight: 700, fontSize: '0.82rem' }}
                      >
                        See the full details →
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* History */}
            {list.length > 1 && (
              <div className="guide__section no-print">
                <h2 className="guide__section-title">Earlier blueprints</h2>
                {list.filter(b => b.id !== active.id).map(b => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{b.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {parseDone(b.done).length} steps completed
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn--ghost btn--sm" onClick={() => setActiveId(b.id)}>Open</button>
                      <button onClick={() => remove(b.id)} style={{ background: 'none', color: '#cbd5e1' }} title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="guide__disclaimer">
              This blueprint is an educational plan built from your answers and our verified directory. It is not
              financial advice, and no approval is ever guaranteed. Institution terms and bureau behavior change,
              so confirm details directly with any institution before you apply.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
