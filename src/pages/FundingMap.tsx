import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Map, Plus, Trash2, Timer, Gauge, CalendarClock, TrendingUp, Activity } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import SideMenu from '../components/SideMenu'

// ─── My Funding Map ──────────────────────────────────────────────────────────
// The retention core, four features off one ledger:
//   1. Application Log      — every app: bureau, outcome, limit (the record)
//   2. Total Access Unlocked — the running $ scoreboard
//   3. 0% Runway            — promo-APR expirations with a countdown
//   4. Velocity Clock       — 5/24 count + inquiry aging, per bureau
//   5. CLI Calendar         — soft-pull credit-limit-increase windows
// Educational tracking of the member's own records. Never advice.

type Acct = {
  id: number
  institution: string
  product: string
  ptype: 'card' | 'line' | 'loan'
  bureau: string
  applied_date: string
  outcome: 'approved' | 'denied' | 'pending'
  limit_amount: number
  promo_end: string
  notes: string
}

const BLANK = { institution: '', product: '', ptype: 'card', bureau: '', applied_date: '', outcome: 'approved', limit_amount: '', promo_end: '', notes: '' }

function money(n: number): string { return '$' + (n || 0).toLocaleString('en-US') }
function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return null
  return Math.ceil((d.getTime() - Date.now()) / 86400000)
}
function addMonths(dateStr: string, months: number): Date | null {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return null
  d.setMonth(d.getMonth() + months)
  return d
}
function addDays(dateStr: string, days: number): Date | null {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return null
  d.setDate(d.getDate() + days)
  return d
}
function fmt(d: Date | null): string {
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="guide__section">
      <h2 className="guide__section-title">{icon} {title}</h2>
      {children}
    </div>
  )
}

export default function FundingMap() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [accts, setAccts] = useState<Acct[]>([])
  const [form, setForm] = useState<Record<string, string>>(BLANK)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { document.title = 'My Funding Map | Intelligent Funding' }, [])
  const load = useCallback(() => {
    fetch('/api/my/accounts', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((data: Acct[]) => { if (Array.isArray(data)) setAccts(data) })
      .catch(() => {})
  }, [token])
  useEffect(() => { load() }, [load])

  async function saveEntry() {
    if (!form.institution.trim() || saving) return
    setSaving(true)
    try {
      await fetch('/api/my/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, limit_amount: Number(form.limit_amount) || 0 }),
      })
      setForm(BLANK)
      setAdding(false)
      load()
    } finally {
      setSaving(false)
    }
  }
  async function remove(id: number) {
    if (!confirm('Remove this entry?')) return
    await fetch(`/api/my/accounts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  const stats = useMemo(() => {
    const approved = accts.filter(a => a.outcome === 'approved')
    const revolving = approved.filter(a => a.ptype !== 'loan').reduce((s, a) => s + (a.limit_amount || 0), 0)
    const loans = approved.filter(a => a.ptype === 'loan').reduce((s, a) => s + (a.limit_amount || 0), 0)

    // 0% Runway: promo expirations, soonest first
    const runway = accts
      .filter(a => a.outcome === 'approved' && a.promo_end)
      .map(a => ({ a, days: daysUntil(a.promo_end) }))
      .filter(x => x.days !== null)
      .sort((x, y) => (x.days as number) - (y.days as number))
    const zeroCapital = runway.filter(x => (x.days as number) > 0).reduce((s, x) => s + (x.a.limit_amount || 0), 0)

    // Velocity Clock: cards opened in the last 24 months (5/24), inquiry aging
    const now = Date.now()
    const cards24 = accts.filter(a => {
      if (a.ptype !== 'card' || a.outcome !== 'approved' || !a.applied_date) return false
      const d = new Date(a.applied_date + 'T00:00:00')
      return !isNaN(d.getTime()) && (now - d.getTime()) < 24 * 30.44 * 86400000
    }).sort((x, y) => x.applied_date.localeCompare(y.applied_date))
    const dropDate = cards24.length > 0 ? addMonths(cards24[0].applied_date, 24) : null

    // Bureau Inquiry Tracker: every logged application is a hard pull on its
    // bureau (approved OR denied — denials burn inquiries too). Soft pulls
    // ('None') don't count. 'All 3' counts against all three lanes.
    const BUREAUS = ['Experian', 'Equifax', 'TransUnion'] as const
    type BStat = { inq12: number; aging: number; nextRelief: Date | null }
    const bureauStats: Record<string, BStat> = {}
    let unknownPulls = 0
    for (const b of BUREAUS) bureauStats[b] = { inq12: 0, aging: 0, nextRelief: null }
    for (const a of accts) {
      if (!a.applied_date || a.bureau === 'None') continue
      const d = new Date(a.applied_date + 'T00:00:00')
      if (isNaN(d.getTime())) continue
      const ageMs = now - d.getTime()
      if (ageMs >= 24 * 30.44 * 86400000) continue // fully off
      const hit = a.bureau === 'All 3' ? [...BUREAUS] : BUREAUS.includes(a.bureau as typeof BUREAUS[number]) ? [a.bureau] : []
      if (hit.length === 0) { if (ageMs < 12 * 30.44 * 86400000) unknownPulls++; continue }
      const within12 = ageMs < 12 * 30.44 * 86400000
      // next relief: when this pull crosses 12mo (weight drops) or 24mo (falls off)
      const relief = addMonths(a.applied_date, within12 ? 12 : 24)
      for (const b of hit) {
        const st = bureauStats[b]
        if (within12) st.inq12++; else st.aging++
        if (relief && (!st.nextRelief || relief < st.nextRelief)) st.nextRelief = relief
      }
    }
    const anyPulls = BUREAUS.some(b => bureauStats[b].inq12 + bureauStats[b].aging > 0)
    const lightest = anyPulls
      ? [...BUREAUS].sort((x, y) => (bureauStats[x].inq12 - bureauStats[y].inq12) || (bureauStats[x].aging - bureauStats[y].aging))[0]
      : null
    const perBureau: Record<string, number> = {}
    for (const b of BUREAUS) if (bureauStats[b].inq12 > 0) perBureau[b] = bureauStats[b].inq12

    // CLI Calendar: approved cards, soft-pull CLI window commonly opens ~91 days in
    const cli = accts
      .filter(a => a.ptype === 'card' && a.outcome === 'approved' && a.applied_date)
      .map(a => ({ a, early: addDays(a.applied_date, 91), late: addDays(a.applied_date, 181) }))
      .sort((x, y) => (x.early?.getTime() || 0) - (y.early?.getTime() || 0))

    return { revolving, loans, approvedCount: approved.length, runway, zeroCapital, cards24, dropDate, perBureau, bureauStats, unknownPulls, anyPulls, lightest, cli }
  }, [accts])

  const inputStyle = { width: '100%', padding: '9px 11px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.88rem' } as const
  const labelStyle = { display: 'block', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: 4 } as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onMenuOpen={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="guide">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 6px' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Map size={24} />
          </div>
          <h1 className="guide__title" style={{ margin: 0 }}>My Funding Map</h1>
        </div>
        <p className="guide__subtitle">
          Log every application and the map keeps score: your total access, your 0% runway, your
          velocity clocks, and when each card's increase window opens. Your record, working for you.
        </p>

        {/* Scoreboard */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div className="institution-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy)' }}>{money(stats.revolving)}</div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Total Access Unlocked</div>
          </div>
          <div className="institution-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--teal)' }}>{money(stats.zeroCapital)}</div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Capital on 0% runway</div>
          </div>
          <div className="institution-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: stats.cards24.length >= 5 ? '#b91c1c' : 'var(--navy)' }}>{stats.cards24.length}</div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>New cards, last 24 months</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>every lender watches this velocity{stats.cards24.length >= 5 ? '. Chase locked (auto-denies at 5)' : ''}</div>
          </div>
          <div className="institution-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy)' }}>{stats.approvedCount}</div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Approved accounts</div>
          </div>
        </div>

        {/* Application Log */}
        <Section icon={<TrendingUp size={16} style={{ verticalAlign: -3 }} />} title="Application Log">
          {!adding && (
            <button className="btn btn--primary" style={{ marginBottom: 14 }} onClick={() => setAdding(true)}>
              <Plus size={16} /> Log an application
            </button>
          )}
          {adding && (
            <div className="institution-card" style={{ marginBottom: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                <div><label style={labelStyle}>Institution *</label><input style={inputStyle} value={form.institution} onChange={e => setForm({ ...form, institution: e.target.value })} placeholder="Navy Federal" /></div>
                <div><label style={labelStyle}>Product</label><input style={inputStyle} value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} placeholder="Flagship Visa" /></div>
                <div><label style={labelStyle}>Type</label>
                  <select style={inputStyle} value={form.ptype} onChange={e => setForm({ ...form, ptype: e.target.value })}>
                    <option value="card">Card</option><option value="line">Line of credit</option><option value="loan">Loan</option>
                  </select></div>
                <div><label style={labelStyle}>Bureau pulled</label>
                  <select style={inputStyle} value={form.bureau} onChange={e => setForm({ ...form, bureau: e.target.value })}>
                    <option value="">Not sure</option><option>Experian</option><option>Equifax</option><option>TransUnion</option><option value="All 3">All 3</option><option value="None">None (soft pull)</option>
                  </select></div>
                <div><label style={labelStyle}>Date applied</label><input type="date" style={inputStyle} value={form.applied_date} onChange={e => setForm({ ...form, applied_date: e.target.value })} /></div>
                <div><label style={labelStyle}>Outcome</label>
                  <select style={inputStyle} value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })}>
                    <option value="approved">Approved</option><option value="pending">Pending</option><option value="denied">Denied</option>
                  </select></div>
                <div><label style={labelStyle}>Limit / amount ($)</label><input type="number" style={inputStyle} value={form.limit_amount} onChange={e => setForm({ ...form, limit_amount: e.target.value })} placeholder="15000" /></div>
                <div><label style={labelStyle}>0% promo ends (if any)</label><input type="date" style={inputStyle} value={form.promo_end} onChange={e => setForm({ ...form, promo_end: e.target.value })} /></div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn--primary" disabled={saving} onClick={saveEntry}>{saving ? 'Saving…' : 'Save'}</button>
                <button className="btn btn--secondary" onClick={() => { setAdding(false); setForm(BLANK) }}>Cancel</button>
              </div>
            </div>
          )}
          {accts.length === 0 && !adding && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Nothing logged yet. Run <span style={{ color: 'var(--teal)', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/strategy')}>the Strategy Engine</span>,
              apply, then log the result here, approved or denied, every datapoint sharpens your map.
            </p>
          )}
          {accts.map(a => (
            <div key={a.id} className="institution-card" style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{a.institution}{a.product ? ` · ${a.product}` : ''}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                    {a.ptype} · {a.applied_date || 'no date'} {a.bureau ? `· pulled ${a.bureau}` : ''} {a.limit_amount ? `· ${money(a.limit_amount)}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: 999,
                    background: a.outcome === 'approved' ? '#f0fdf4' : a.outcome === 'denied' ? '#fef2f2' : '#fffbeb',
                    color: a.outcome === 'approved' ? '#15803d' : a.outcome === 'denied' ? '#b91c1c' : '#b45309' }}>
                    {a.outcome}
                  </span>
                  <button onClick={() => remove(a.id)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }} title="Remove"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </Section>

        {/* 0% Runway */}
        {stats.runway.length > 0 && (
          <Section icon={<Timer size={16} style={{ verticalAlign: -3 }} />} title="0% Runway">
            {stats.runway.map(({ a, days }) => {
              const d = days as number
              const tone = d <= 30 ? ['#fef2f2', '#b91c1c'] : d <= 90 ? ['#fffbeb', '#b45309'] : ['#f0fdf4', '#15803d']
              return (
                <div key={a.id} className="institution-card" style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{a.institution}{a.product ? ` · ${a.product}` : ''}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{money(a.limit_amount)} · promo ends {a.promo_end}</div>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, padding: '5px 12px', borderRadius: 999, background: tone[0], color: tone[1], whiteSpace: 'nowrap' }}>
                    {d > 0 ? `${d} days left` : 'EXPIRED'}
                  </span>
                </div>
              )
            })}
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Before a runway ends: pay it down, or check the balance-transfer options in the Strategy Engine. Interest starts the day the promo dies.
            </p>
          </Section>
        )}

        {/* Velocity Clock */}
        {accts.length > 0 && (
          <Section icon={<Gauge size={16} style={{ verticalAlign: -3 }} />} title="Velocity Clock">
            <div className="guide__body">
              <ul>
                <li><b>New-account velocity: {stats.cards24.length} new cards in 24 months.</b> Every lender watches this number, too many too fast makes any underwriter nervous.{' '}
                  {stats.cards24.length > 0 ? `It next drops on ${fmt(stats.dropDate)}.` : 'Clean slate.'}
                </li>
                <li><b>Issuer rules this touches:</b> Chase is the one hard cutoff, they auto-deny at 5 new cards (any bank), so you're {stats.cards24.length >= 5 ? `locked out of Chase until ${fmt(stats.dropDate)}` : `at ${stats.cards24.length} of 5 with the Chase door open`}. Spacing rules at other banks (BofA's 2/3/4, Citi's 8/65) only matter while you're applying there, and the Strategy Engine flags them right on those recommendations.
                </li>
              </ul>
            </div>
          </Section>
        )}

        {/* Bureau Inquiry Tracker */}
        {accts.length > 0 && (
          <Section icon={<Activity size={16} style={{ verticalAlign: -3 }} />} title="Bureau Inquiry Tracker">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
              {(['Experian', 'Equifax', 'TransUnion'] as const).map(b => {
                const st = stats.bureauStats[b]
                const isLight = stats.lightest === b
                return (
                  <div key={b} className="institution-card" style={{ textAlign: 'center', borderTop: `3px solid ${b === 'Experian' ? '#1d4ed8' : b === 'Equifax' ? '#15803d' : '#7e22ce'}`, position: 'relative', paddingTop: isLight ? 30 : undefined }}>
                    {isLight && (
                      <span style={{ position: 'absolute', top: 10, right: 10, fontSize: '0.64rem', fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#f0fdf4', color: '#15803d' }}>
                        LIGHTEST LANE
                      </span>
                    )}
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: 4 }}>{b}</div>
                    <div style={{ fontSize: '1.7rem', fontWeight: 800, color: st.inq12 === 0 ? '#15803d' : st.inq12 >= 3 ? '#b45309' : 'var(--navy)' }}>{st.inq12}</div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>hard pulls, last 12 mo</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                      {st.aging > 0 ? `${st.aging} aging off (12–24 mo)` : 'none aging'}
                      {st.nextRelief ? ` · next relief ${fmt(st.nextRelief)}` : ''}
                    </div>
                  </div>
                )
              })}
            </div>
            {stats.unknownPulls > 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--amber, #b45309)', marginBottom: 8 }}>
                {stats.unknownPulls} logged pull{stats.unknownPulls > 1 ? 's' : ''} with no bureau recorded. Call the lender, ask which bureau they pulled, and update the entry, every unknown weakens your map.
              </p>
            )}
            <div className="guide__body">
              <p>
                Every application costs a hard pull on a bureau, approved or denied. The lane math: pulls lose most
                of their scoring weight around 12 months and fall off entirely at 24. {stats.lightest ? `Your lightest lane right now is ${stats.lightest}, which is where the Strategy Engine would point your next round.` : ''} Soft pulls (logged as "None") never count against you.
              </p>
            </div>
          </Section>
        )}

        {/* CLI Calendar */}
        {stats.cli.length > 0 && (
          <Section icon={<CalendarClock size={16} style={{ verticalAlign: -3 }} />} title="CLI Calendar (credit limit increases)">
            {stats.cli.map(({ a, early, late }) => {
              const open = early && early.getTime() <= Date.now()
              return (
                <div key={a.id} className="institution-card" style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{a.institution}{a.product ? ` · ${a.product}` : ''}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>typical window: {fmt(early)} to {fmt(late)}</div>
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, padding: '5px 12px', borderRadius: 999, whiteSpace: 'nowrap',
                    background: open ? '#f0fdf4' : 'var(--badge-gray-bg)', color: open ? '#15803d' : 'var(--text-secondary)' }}>
                    {open ? 'Window likely OPEN' : 'Not yet'}
                  </span>
                </div>
              )
            })}
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Many issuers allow a soft-pull credit-limit increase request roughly 91 to 181 days after opening. More limit with no new inquiry.
              Policies vary by issuer, ask whether a CLI request is a soft or hard pull before you submit it.
            </p>
          </Section>
        )}

        <div className="guide__disclaimer">
          My Funding Map is a personal record-keeping and educational tool. Dates and windows (including 5/24
          and CLI timing) are based on widely reported issuer patterns, not official policy, and can change.
          Nothing here is financial advice, and no approval or increase is ever guaranteed.
        </div>
      </div>
    </div>
  )
}
