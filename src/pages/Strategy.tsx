import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, RefreshCw, Phone, ShieldCheck, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import SideMenu from '../components/SideMenu'
import type { Institution, Product } from '../types'

// ─── The Strategy Engine v1 ──────────────────────────────────────────────────
// Rule-based, deterministic, and 100% powered by OUR verified database — no
// black box. The member answers a few banded questions; the engine reads the
// live institution/product data and produces a per-bureau hit list (or an
// honest "build first" plan). Educational output only, never personalized
// financial advice — it teaches the Economic Algorithm sequence.

type ScoreBand = 'under580' | '580-639' | '640-699' | '700-749' | '750plus'
type Util = 'under10' | '10-30' | '30-50' | 'over50'
type Lates = 'none' | '1-2' | '3plus'
type Age = 'none' | 'under1' | '1-3' | '3plus'
type Inq = '0-2' | '3-5' | '6plus'
type Cards24 = '0-1' | '2-4' | '5plus'
type Bureau = 'Experian' | 'Equifax' | 'TransUnion'
type CleanBureau = Bureau | 'notsure'

const SCORE_FLOOR: Record<ScoreBand, number> = {
  under580: 500, '580-639': 580, '640-699': 640, '700-749': 700, '750plus': 750,
}

type Answers = {
  score: ScoreBand | null
  util: Util | null
  lates: Lates | null
  age: Age | null
  inq: Inq | null
  cards24: Cards24 | null
  clean: CleanBureau | null
}

// ─── The strategy brain: issuer rules ────────────────────────────────────────
// Widely reported community knowledge (5/24 and friends), not official bank
// policy. The engine uses these to SEQUENCE, and always says why. Matched by
// institution-name substring.
type IssuerRule = {
  match: string
  under: { boost: number; why: string } | null   // applied when cards24 is NOT 5plus
  over: { penalty: number; caution: string } | null // applied when cards24 IS 5plus
  always?: string // annotation regardless of profile
}
const ISSUER_RULES: IssuerRule[] = [
  {
    match: 'chase',
    under: { boost: 2, why: '5/24 window open: Chase auto-denies once you hit 5 new cards in 24 months, so Chase goes FIRST in any sequence' },
    over: { penalty: 5, caution: 'Over 5/24: Chase denies most applications regardless of score. Come back when you are under 5 new cards in 24 months' },
  },
  {
    match: 'bank of america',
    under: null,
    over: null,
    always: 'BofA 2/3/4 velocity rule (reported): max 2 new BofA cards per 2 months, 3 per 12, 4 per 24. Pace your BofA applications',
  },
  {
    match: 'citi',
    under: null,
    over: null,
    always: 'Citi velocity rule (reported): 1 card per 8 days, max 2 per 65 days. Space your Citi applications',
  },
  {
    match: 'american express',
    under: null,
    over: null,
    always: 'Amex often soft-pulls existing customers, and welcome bonuses are once per lifetime per card. Choose your first Amex deliberately',
  },
]

function issuerAnnotate(instName: string, cards24: Cards24 | null): { boost: number; why: string[]; caution: string[] } {
  const n = instName.toLowerCase()
  let boost = 0
  const why: string[] = []
  const caution: string[] = []
  for (const r of ISSUER_RULES) {
    if (!n.includes(r.match)) continue
    if (cards24 === '5plus' && r.over) { boost -= r.over.penalty; caution.push(r.over.caution) }
    else if (cards24 !== '5plus' && r.under) { boost += r.under.boost; why.push(r.under.why) }
    if (r.always) why.push(r.always)
  }
  return { boost, why, caution }
}

// ─── The strategy brain: situational plays ───────────────────────────────────
// Named moves, triggered by the member's situation, each explained in plain
// English. This is what makes the output a strategy, not a list.
type Play = { title: string; body: string }
function buildPlays(a: Answers, mode: 'build' | 'borderline' | 'ready'): Play[] {
  const plays: Play[] = []
  if (mode !== 'build' && (a.util === 'over50' || a.util === '30-50')) {
    plays.push({
      title: 'The Balance-Transfer Play',
      body: 'Your utilization is your biggest score drag right now, and there is a move for that: a 0% intro APR balance-transfer card. You move existing balances onto it (typical fee 3–5%), pay zero interest for the intro period, and your utilization spreads across more available credit, which can lift your score in 1–2 cycles. The engine has boosted cards with 0% or balance-transfer offers in your lanes below. Run the numbers: the transfer fee is usually far less than months of 25%+ interest.',
    })
  }
  if (mode !== 'build' && a.cards24 !== '5plus') {
    plays.push({
      title: 'The 5/24 Sequence',
      body: 'Chase counts every card you opened in the last 24 months, across ALL banks, and auto-denies at 5. Most other issuers do not count this way. So the sequence rule is simple: if you want a Chase card, get it FIRST, while your count is low, then work the other issuers. Going the other direction locks Chase out for up to two years.',
    })
  }
  if (mode !== 'build' && a.cards24 === '5plus') {
    plays.push({
      title: 'Over the 5/24 Line: Work Around It',
      body: 'You are over 5 new cards in 24 months, so Chase is off the table for now, no matter your score. The move: work issuers that do not enforce 5/24 (most credit unions and regional banks in your lanes), and let your oldest new-card dates age past the 24-month line. The engine has already pushed Chase down and 5/24-agnostic lenders up in your lanes.',
    })
  }
  if (mode !== 'build') {
    plays.push({
      title: 'The Inquiry-Reuse Double-Dip',
      body: 'Some institutions let one hard pull cover multiple applications made the same day, a card AND a line of credit off a single inquiry. That is two tradelines for the price of one pull. Lenders that allow this are ranked at the top of your lanes. Apply for both products the same day, always confirm the reuse window with the institution first.',
    })
  }
  if (mode === 'borderline' || a.inq === '6plus') {
    plays.push({
      title: 'The Preapproval Sweep',
      body: 'Before spending a single hard pull, sweep every preapproval and soft-pull check in your lanes. Each one shows your real odds with zero score damage. Collect your yes-list first, then execute the hard applications in one tight window so the inquiries land together and age together.',
    })
  }
  if (mode === 'build') {
    plays.push({
      title: 'The Graduation Track',
      body: 'Not every secured card is equal. The ones that matter GRADUATE: your deposit comes back and the card converts to unsecured, keeping the account age you built. The engine has already prioritized graduating cards that report to all three bureaus. Open one or two, run small charges, pay in full, and let the file build itself.',
    })
  }
  return plays
}

type Rec = {
  inst: Institution
  product: Product
  points: number
  why: string[]
  caution: string[]
}

const CAPITAL_TYPES = ['Unsecured Card', 'Line of Credit', 'Personal Loan']
const BUILDER_TYPES = ['Secured Card', 'Credit Builder Loan', 'Alternative Tradeline']

function rankCapital(institutions: Institution[], bureau: Bureau, a: Answers): Rec[] {
  const floor = a.score ? SCORE_FLOOR[a.score] : 0
  const heavyInq = a.inq === '6plus'
  const recs: Rec[] = []
  for (const inst of institutions) {
    for (const p of inst.products) {
      if (!CAPITAL_TYPES.includes(p.type)) continue
      if (p.bureau_pulled !== bureau && p.bureau_pulled !== 'All 3') continue
      let points = 0
      const why: string[] = []
      const caution: string[] = []
      if (inst.inquiry_reuse === 'Yes') { points += heavyInq ? 5 : 3; why.push('Inquiry reuse: one pull can cover multiple products') }
      if (p.inquiry_reuse_eligible === 'Yes') { points += 1 }
      if (p.preapproval_available === 'Yes' || inst.soft_pull_available === 'Yes') { points += 2; why.push('Preapproval / soft-pull first, see your odds before a hard pull') }
      if (p.minimum_credit_score != null) {
        if (floor >= p.minimum_credit_score) { points += 2; why.push(`Score fit, needs ~${p.minimum_credit_score}+`) }
        else { points -= 3; caution.push(`Published minimum ~${p.minimum_credit_score} is above your band`) }
      }
      if (p.bureau_pulled === 'All 3') { points -= 1; caution.push('Pulls all three bureaus, spend this one wisely') }
      if (p.existing_customer_required === 'Yes') { points -= 1; caution.push('Existing-customer relationship required first') }
      // Situational: high utilization boosts 0% / balance-transfer offers (the play)
      if ((a.util === 'over50' || a.util === '30-50') && /0%|balance transfer|intro apr/i.test(p.strategy_notes || '')) {
        points += 2; why.push('0% / balance-transfer offer noted, fits your utilization play')
      }
      // Issuer rules: 5/24 sequencing and friends
      const issuer = issuerAnnotate(inst.name, a.cards24)
      points += issuer.boost
      why.push(...issuer.why)
      caution.push(...issuer.caution)
      if (points > 0) recs.push({ inst, product: p, points, why, caution })
    }
  }
  return recs.sort((x, y) => y.points - x.points).slice(0, 4)
}

function rankBuilders(institutions: Institution[]): Rec[] {
  const recs: Rec[] = []
  for (const inst of institutions) {
    for (const p of inst.products) {
      if (!BUILDER_TYPES.includes(p.type)) continue
      let points = 1
      const why: string[] = []
      const caution: string[] = []
      if (p.graduation_potential === 'Yes') { points += 3; why.push(`Graduates to unsecured${p.graduation_timeline && p.graduation_timeline !== 'Not Verified' ? ` (${p.graduation_timeline})` : ''}`) }
      const rep = (p.reports_to || '').toLowerCase()
      if (rep.includes('all') || (rep.includes('experian') && rep.includes('equifax') && rep.includes('transunion'))) { points += 2; why.push('Reports to all three bureaus') }
      if (p.bureau_pulled === 'None') { points += 2; why.push('No credit check to open') }
      if (p.existing_customer_required === 'Yes') { points -= 1; caution.push('Existing-customer relationship required first') }
      recs.push({ inst, product: p, points, why, caution })
    }
  }
  return recs.sort((x, y) => y.points - x.points).slice(0, 5)
}

function Chip({ label, tone }: { label: string; tone: 'navy' | 'green' | 'teal' | 'gray' | 'amber' }) {
  const tones = {
    navy: { bg: '#eff6ff', fg: 'var(--navy)', bd: '#bfdbfe' },
    green: { bg: '#f0fdf4', fg: '#15803d', bd: '#bbf7d0' },
    teal: { bg: 'var(--badge-teal-bg)', fg: 'var(--teal)', bd: '#a5f3fc' },
    gray: { bg: 'var(--badge-gray-bg)', fg: 'var(--text-secondary)', bd: 'var(--border)' },
    amber: { bg: '#fffbeb', fg: '#b45309', bd: '#fde68a' },
  }[tone]
  return (
    <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: tones.bg, color: tones.fg, border: `1px solid ${tones.bd}` }}>
      {label}
    </span>
  )
}

function RecCard({ rec, rank }: { rec: Rec; rank: number }) {
  const navigate = useNavigate()
  const p = rec.product
  return (
    <div className="institution-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/institution/${rec.inst.id}`)}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontWeight: 800, color: 'var(--teal)', fontSize: '0.9rem' }}>{rank}.</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.02rem' }}>{rec.inst.name}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{p.name} · {p.type}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        <Chip label={`Pulls: ${p.bureau_pulled}`} tone={p.bureau_pulled === 'Not Verified' ? 'gray' : 'navy'} />
        {rec.why.map(w => <Chip key={w} label={w} tone="green" />)}
        {rec.caution.map(c => <Chip key={c} label={c} tone="amber" />)}
      </div>
    </div>
  )
}

function Question({ label, options, value, onPick }: {
  label: string
  options: { v: string; t: string }[]
  value: string | null
  onPick: (v: string) => void
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map(o => (
          <button
            key={o.v}
            className="modal__option-btn"
            onClick={() => onPick(o.v)}
            style={{
              flex: '0 1 auto', minWidth: 90, padding: '10px 14px', fontSize: '0.85rem',
              ...(value === o.v ? { borderColor: 'var(--teal)', background: 'var(--badge-teal-bg)', color: 'var(--teal)' } : {}),
            }}
          >
            {o.t}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Strategy() {
  const { token } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [answers, setAnswers] = useState<Answers>({ score: null, util: null, lates: null, age: null, inq: null, cards24: null, clean: null })
  const [built, setBuilt] = useState(false)

  useEffect(() => { document.title = 'Strategy Engine | Intelligent Funding' }, [])
  useEffect(() => {
    fetch('/api/institutions?path=all', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((data: Institution[]) => { if (Array.isArray(data)) setInstitutions(data) })
      .catch(() => {})
  }, [token])

  const complete = answers.score && answers.util && answers.lates && answers.age && answers.inq && answers.cards24

  const plan = useMemo(() => {
    if (!built || !complete) return null
    const a = answers
    // Readiness: honest gate. Not a judgment — a sequence.
    const notReady = a.age === 'none' || a.score === 'under580' || a.lates === '3plus'
    const borderline = !notReady && (a.score === '580-639' || (a.lates === '1-2' && a.util === 'over50'))
    const bureaus: Bureau[] = ['Experian', 'Equifax', 'TransUnion']
    const ordered = a.clean && a.clean !== 'notsure'
      ? [a.clean as Bureau, ...bureaus.filter(b => b !== a.clean)]
      : bureaus
    const mode = notReady ? 'build' as const : borderline ? 'borderline' as const : 'ready' as const
    return {
      mode,
      builders: rankBuilders(institutions),
      lanes: ordered.map(b => ({ bureau: b, recs: rankCapital(institutions, b, a) })),
      plays: buildPlays(a, mode),
      payDownFirst: a.util === 'over50' || a.util === '30-50',
      heavyInq: a.inq === '6plus',
    }
  }, [built, complete, answers, institutions])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onMenuOpen={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="guide">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 6px' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target size={24} />
          </div>
          <h1 className="guide__title" style={{ margin: 0 }}>The Strategy Engine</h1>
        </div>
        <p className="guide__subtitle">
          Answer a few quick questions. The Economic Algorithm reads our verified database and hands you
          the plays for your exact situation plus a sequence: which bureau lane, which institutions, in
          what order. No guessing, no cookie-cutter lists.
        </p>

        {!plan && (
          <div className="guide__section">
            <Question
              label="Where does your credit score land?"
              value={answers.score}
              onPick={v => setAnswers(prev => ({ ...prev, score: v as ScoreBand }))}
              options={[
                { v: 'under580', t: 'Under 580' }, { v: '580-639', t: '580–639' },
                { v: '640-699', t: '640–699' }, { v: '700-749', t: '700–749' }, { v: '750plus', t: '750+' },
              ]}
            />
            <Question
              label="Credit card utilization right now?"
              value={answers.util}
              onPick={v => setAnswers(prev => ({ ...prev, util: v as Util }))}
              options={[
                { v: 'under10', t: 'Under 10%' }, { v: '10-30', t: '10–30%' },
                { v: '30-50', t: '30–50%' }, { v: 'over50', t: 'Over 50%' },
              ]}
            />
            <Question
              label="Late payments in the last 24 months?"
              value={answers.lates}
              onPick={v => setAnswers(prev => ({ ...prev, lates: v as Lates }))}
              options={[{ v: 'none', t: 'None' }, { v: '1-2', t: '1–2' }, { v: '3plus', t: '3 or more' }]}
            />
            <Question
              label="Age of your oldest account?"
              value={answers.age}
              onPick={v => setAnswers(prev => ({ ...prev, age: v as Age }))}
              options={[
                { v: 'none', t: 'No credit yet' }, { v: 'under1', t: 'Under 1 year' },
                { v: '1-3', t: '1–3 years' }, { v: '3plus', t: '3+ years' },
              ]}
            />
            <Question
              label="Hard inquiries in the last 6 months?"
              value={answers.inq}
              onPick={v => setAnswers(prev => ({ ...prev, inq: v as Inq }))}
              options={[{ v: '0-2', t: '0–2' }, { v: '3-5', t: '3–5' }, { v: '6plus', t: '6 or more' }]}
            />
            <Question
              label="New cards opened in the last 24 months? (all banks combined)"
              value={answers.cards24}
              onPick={v => setAnswers(prev => ({ ...prev, cards24: v as Cards24 }))}
              options={[{ v: '0-1', t: '0–1' }, { v: '2-4', t: '2–4' }, { v: '5plus', t: '5 or more' }]}
            />
            <Question
              label="Which credit report is your cleanest? (optional, skip if unsure)"
              value={answers.clean}
              onPick={v => setAnswers(prev => ({ ...prev, clean: v as CleanBureau }))}
              options={[
                { v: 'Experian', t: 'Experian' }, { v: 'Equifax', t: 'Equifax' },
                { v: 'TransUnion', t: 'TransUnion' }, { v: 'notsure', t: 'Not sure' },
              ]}
            />
            <button
              className="btn btn--primary btn--lg"
              disabled={!complete}
              onClick={() => setBuilt(true)}
              style={{ marginTop: 6, opacity: complete ? 1 : 0.5 }}
            >
              Build My Strategy →
            </button>
          </div>
        )}

        {plan && (
          <>
            <button
              className="btn btn--ghost"
              onClick={() => setBuilt(false)}
              style={{ marginBottom: 18, display: 'inline-flex', gap: 6 }}
            >
              <RefreshCw size={14} /> Change my answers
            </button>

            {/* Your Plays: the named moves for this exact situation */}
            {plan.plays.length > 0 && (
              <div className="guide__section">
                <h2 className="guide__section-title"><Lightbulb size={16} style={{ verticalAlign: -3 }} /> Your plays, for your exact situation</h2>
                {plan.plays.map(p => (
                  <div key={p.title} style={{ border: '1px solid var(--border)', borderLeft: '3px solid var(--navy)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 10 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy)', marginBottom: 5 }}>{p.title}</div>
                    <p style={{ fontSize: '0.87rem', lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0 }}>{p.body}</p>
                  </div>
                ))}
              </div>
            )}

            {plan.mode === 'build' && (
              <div className="guide__section">
                <h2 className="guide__section-title"><ShieldCheck size={16} style={{ verticalAlign: -3 }} /> Your move right now: build first</h2>
                <div className="guide__body" style={{ marginBottom: 14 }}>
                  <p>
                    Straight talk: hitting unsecured lenders today would burn hard pulls on likely denials.
                    That's not a no, it's a sequence. Run this build phase, then come back and re-run the
                    engine. The capital lanes will open.
                  </p>
                  <ul>
                    <li>Open 1–2 of the builder products below. Graduation and all-three-bureau reporting are already prioritized for you.</li>
                    <li>Pay everything on time for 6 straight months. Nothing moves a file like clean recency.</li>
                    {plan.payDownFirst && <li>Get utilization under 30%, then under 10%. It's the fastest lever you control.</li>}
                    <li>No new hard pulls while you build.</li>
                  </ul>
                </div>
                {plan.builders.map((r, i) => <RecCard key={r.product.id} rec={r} rank={i + 1} />)}
              </div>
            )}

            {plan.mode !== 'build' && (
              <>
                {(plan.payDownFirst || plan.heavyInq || plan.mode === 'borderline') && (
                  <div className="guide__section">
                    <h2 className="guide__section-title"><AlertTriangle size={16} style={{ verticalAlign: -3 }} /> Before you apply</h2>
                    <div className="guide__body">
                      <ul>
                        {plan.payDownFirst && <li><b>Pay utilization down first.</b> Getting under 30% (ideally under 10%) before you apply can move your score in one statement cycle, and better scores mean better limits.</li>}
                        {plan.heavyInq && <li><b>Your inquiry count is heavy.</b> Your lanes below are ranked to favor inquiry-reuse and soft-pull lenders. Work those first and let the older inquiries age off.</li>}
                        {plan.mode === 'borderline' && <li><b>You're on the edge of the approval zone.</b> Lead with the preapproval / soft-pull options in each lane to test the water without spending hard pulls.</li>}
                      </ul>
                    </div>
                  </div>
                )}

                {plan.lanes.map(lane => (
                  <div className="guide__section" key={lane.bureau}>
                    <h2 className="guide__section-title">
                      <TrendingUp size={16} style={{ verticalAlign: -3 }} /> {lane.bureau} lane
                      {plan.lanes[0].bureau === lane.bureau && answers.clean && answers.clean !== 'notsure' ? ', start here (your cleanest report)' : ''}
                    </h2>
                    {lane.recs.length > 0 ? (
                      lane.recs.map((r, i) => <RecCard key={r.product.id} rec={r} rank={i + 1} />)
                    ) : (
                      <div className="guide__body"><p>No strong verified matches in this lane for your profile yet. As the database grows, this lane fills in, check back.</p></div>
                    )}
                  </div>
                ))}

                <div className="guide__section">
                  <h2 className="guide__section-title">How to run the sequence</h2>
                  <div className="guide__body">
                    <ul>
                      <li>Work ONE lane at a time, starting at the top. Same-day applications inside an inquiry-reuse institution can share a single pull.</li>
                      <li>Space lanes out, let approvals post before you open the next lane.</li>
                      <li><b><Phone size={13} style={{ verticalAlign: -2 }} /> Always call first.</b> Ask one question: "Which credit bureau do you pull?" Get the answer, hang up, then apply knowing where the pull lands.</li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            <div className="guide__disclaimer">
              The Strategy Engine is an educational tool that sequences verified data from our directory.
              It is not financial advice, and no approval is ever guaranteed. Bureau pulls can differ by
              state and change over time; confirm directly with any institution before applying. Issuer
              rules like 5/24 are widely reported community knowledge, not official bank policy, and can
              change without notice.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
