import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, RefreshCw, Phone, ShieldCheck, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import SideMenu from '../components/SideMenu'
import type { Institution, Product } from '../types'
import { track } from '../lib/track'

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
type Goal = 'cards' | 'loans' | 'business' | 'everything'
type Bureau = 'Experian' | 'Equifax' | 'TransUnion'
type CleanBureau = Bureau | 'notsure'

const SCORE_FLOOR: Record<ScoreBand, number> = {
  under580: 500, '580-639': 580, '640-699': 640, '700-749': 700, '750plus': 750,
}

type Answers = {
  goal: Goal | null
  score: ScoreBand | null
  util: Util | null
  lates: Lates | null
  age: Age | null
  inq: Inq | null
  cards24: Cards24 | null
  clean: CleanBureau | null
}

// What the member is hunting for decides which product types the lanes carry.
// The engine serves EVERY profile: the fresh file, the mid-stack, and the
// tapped-out stacker pivoting to loans / business / soft-pull capital.
const GOAL_TYPES: Record<Goal, string[]> = {
  cards: ['Unsecured Card', 'Line of Credit'],
  loans: ['Personal Loan'],
  business: [],
  everything: ['Unsecured Card', 'Line of Credit', 'Personal Loan'],
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
    under: { boost: 1, why: '5/24 note: if a Chase card is on your wishlist, slot it early, Chase auto-denies at 5 new cards in 24 months' },
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
  if (a.inq === '6plus' && mode !== 'build') {
    plays.push({
      title: 'The Tapped-Out Pivot (you already ran the stack, here is round two)',
      body: 'Heavy inquiries do not mean you are done, they mean you change weapons. Three moves: (1) Soft-prequalification loans, most personal-loan lenders show your rate with NO hard pull, so your loaded report costs you nothing to shop. The engine has boosted these in your lanes. (2) Business credit: business cards and lines mostly do not report to your personal bureaus, so your personal file stays clean while you keep building access. Run the Business Funding path. (3) Mission lenders (CDFIs) underwrite your story and your plan, not your inquiry count, find them on the Business path and in Resources. Meanwhile, your inquiries lose scoring weight around 12 months and fall off entirely at 24. The stack reopens on a clock.',
    })
  }
  if (a.goal === 'business') {
    plays.push({
      title: 'The Business Route',
      body: 'You said business funding, so your map lives on the Business Funding path: verified business cards, lines, and loans with filters for no-doc, new-LLC, EIN-only (no personal guarantee), and 0% intro offers. Two things first: a business checking account with real deposit activity is the passport (no-doc lenders read deposits, not tax returns), and the Business Setup Toolkit on Resources gets your foundation right in an afternoon. Your personal profile still matters wherever a personal guarantee applies, so keep it clean while you build the business side.',
    })
  }
  if (mode !== 'build' && a.goal !== 'business') {
    plays.push({
      title: 'The 3×3 Spread (the master play)',
      body: 'Maximum access is not one marquee card, it is the spread: up to three institutions on EACH bureau, and at inquiry-reuse institutions, two products riding a single pull. Run it right and roughly three pulls per bureau can turn into six or more accounts per bureau, eighteen-plus tradelines across the board, while someone chasing one famous card spent the same inquiries on three approvals. The lanes below are built exactly this way. Work them top to bottom, one lane at a time. Access is leverage. Leverage is opportunity.',
    })
  }
  if (mode !== 'build' && (a.util === 'over50' || a.util === '30-50')) {
    plays.push({
      title: 'The Balance-Transfer Play',
      body: 'Your utilization is your biggest score drag right now, and there is a move for that: a 0% intro APR balance-transfer card. You move existing balances onto it (typical fee 3–5%), pay zero interest for the intro period, and your utilization spreads across more available credit, which can lift your score in 1–2 cycles. The engine has boosted cards with 0% or balance-transfer offers in your lanes below. Run the numbers: the transfer fee is usually far less than months of 25%+ interest.',
    })
  }
  if (mode !== 'build' && a.cards24 !== '5plus') {
    plays.push({
      title: 'The 5/24 Timing Note',
      body: 'Only relevant if a Chase card is on your wishlist: Chase counts every card you opened in the last 24 months, across ALL banks, and auto-denies at 5. So if you want one, slot it at the very start of your spread, while your count is low. But do not confuse one famous card with the goal. The spread is what maximizes total access; Chase is one seat at that table, not the table.',
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
  products: Product[]
  points: number
  why: string[]
  caution: string[]
}

const CAPITAL_TYPES = ['Unsecured Card', 'Line of Credit', 'Personal Loan']
const BUILDER_TYPES = ['Secured Card', 'Credit Builder Loan', 'Alternative Tradeline']

// The objective function: MAXIMUM TOTAL ACCESS PER INQUIRY. We rank
// institutions (not lone products) per bureau lane, because the unit of
// strategy is the pull: a reuse-friendly institution where two products ride
// one inquiry beats a marquee name that costs a pull per product. 3 per lane,
// 3 lanes: the 3×3 spread.
function rankCapital(institutions: Institution[], bureau: Bureau, a: Answers): Rec[] {
  const floor = a.score ? SCORE_FLOOR[a.score] : 0
  const heavyInq = a.inq === '6plus'
  const laneTypes = a.goal ? GOAL_TYPES[a.goal] : CAPITAL_TYPES
  const recs: Rec[] = []
  for (const inst of institutions) {
    // Score every eligible product at this institution for this lane
    const scored: { p: Product; pts: number; why: string[]; caution: string[] }[] = []
    for (const p of inst.products) {
      if (!laneTypes.includes(p.type)) continue
      if (p.bureau_pulled !== bureau && p.bureau_pulled !== 'All 3') continue
      let pts = 0
      const why: string[] = []
      const caution: string[] = []
      if (inst.inquiry_reuse === 'Yes') { pts += heavyInq ? 5 : 3 }
      if (p.inquiry_reuse_eligible === 'Yes') { pts += 1 }
      if (p.preapproval_available === 'Yes' || inst.soft_pull_available === 'Yes') { pts += 2; why.push('Preapproval / soft-pull first, see your odds before a hard pull') }
      if (p.minimum_credit_score != null) {
        if (floor >= p.minimum_credit_score) { pts += 2; why.push(`Score fit, needs ~${p.minimum_credit_score}+`) }
        else { pts -= 3; caution.push(`Published minimum ~${p.minimum_credit_score} is above your band`) }
      }
      if (p.bureau_pulled === 'All 3') { pts -= 1; caution.push('Pulls all three bureaus, spend this one wisely') }
      if (p.existing_customer_required === 'Yes') { pts -= 1; caution.push('Existing-customer relationship required first') }
      // Situational: high utilization boosts 0% / balance-transfer offers (the play)
      if ((a.util === 'over50' || a.util === '30-50') && /0%|balance transfer|intro apr/i.test(p.strategy_notes || '')) {
        pts += 2; why.push('0% / balance-transfer offer noted, fits your utilization play')
      }
      // Tapped-out pivot: heavy inquiries favor soft-prequal loans hard
      if (heavyInq && p.type === 'Personal Loan' && (p.preapproval_available === 'Yes' || inst.soft_pull_available === 'Yes')) {
        pts += 2; why.push('Soft prequalification: check your rate without touching your loaded report')
      }
      if (pts > 0) scored.push({ p, pts, why, caution })
    }
    if (scored.length === 0) continue
    scored.sort((x, y) => y.pts - x.pts)
    const top = scored.slice(0, 2)
    let points = top[0].pts
    const why: string[] = []
    const caution: string[] = []
    // THE core play: reuse + 2 eligible products = two tradelines, one pull
    if (inst.inquiry_reuse === 'Yes' && top.length >= 2) {
      points += 3
      why.push('Double-dip: take BOTH products below on ONE pull (apply same day)')
    } else if (inst.inquiry_reuse === 'Yes') {
      why.push('Inquiry reuse: one pull can cover multiple products here')
    }
    for (const s of top) { why.push(...s.why); caution.push(...s.caution) }
    // Issuer rules, annotation-level, subordinate to the access math
    const issuer = issuerAnnotate(inst.name, a.cards24)
    points += issuer.boost
    why.push(...issuer.why)
    caution.push(...issuer.caution)
    if (points > 0) recs.push({ inst, products: top.map(s => s.p), points, why: [...new Set(why)], caution: [...new Set(caution)] })
  }
  return recs.sort((x, y) => y.points - x.points).slice(0, 3)
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
      recs.push({ inst, products: [p], points, why, caution })
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
  const doubleDip = rec.products.length >= 2 && rec.inst.inquiry_reuse === 'Yes'
  return (
    <div className="institution-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/institution/${rec.inst.id}`)}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontWeight: 800, color: 'var(--teal)', fontSize: '0.9rem' }}>{rank}.</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700, fontSize: '1.02rem' }}>{rec.inst.name}</div>
            {doubleDip && (
              <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 9px', borderRadius: 999, background: 'var(--navy)', color: '#fff' }}>
                {rec.products.length} products · 1 pull
              </span>
            )}
          </div>
          {rec.products.map(p => (
            <div key={p.id} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{p.name} · {p.type}</div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        <Chip label={`Pulls: ${rec.products[0].bureau_pulled}`} tone={rec.products[0].bureau_pulled === 'Not Verified' ? 'gray' : 'navy'} />
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
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [answers, setAnswers] = useState<Answers>({ goal: null, score: null, util: null, lates: null, age: null, inq: null, cards24: null, clean: null })
  const [built, setBuilt] = useState(false)

  useEffect(() => { document.title = 'Strategy Engine | Intelligent Funding' }, [])
  useEffect(() => {
    fetch('/api/institutions?path=all', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((data: Institution[]) => { if (Array.isArray(data)) setInstitutions(data) })
      .catch(() => {})
  }, [token])

  const complete = answers.goal && answers.score && answers.util && answers.lates && answers.age && answers.inq && answers.cards24

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
              label="What are you hunting for?"
              value={answers.goal}
              onPick={v => setAnswers(prev => ({ ...prev, goal: v as Goal }))}
              options={[
                { v: 'everything', t: 'Maximum access (everything)' }, { v: 'cards', t: 'Credit cards + lines' },
                { v: 'loans', t: 'Loans' }, { v: 'business', t: 'Business funding' },
              ]}
            />
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
              onClick={() => { track('engine_run'); setBuilt(true) }}
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

            {/* The funding map: the whole spread, quantified up front */}
            {plan.mode !== 'build' && (() => {
              const instCount = plan.lanes.reduce((n, l) => n + l.recs.length, 0)
              const prodCount = plan.lanes.reduce((n, l) => n + l.recs.reduce((m, r) => m + r.products.length, 0), 0)
              if (instCount === 0) return null
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(100deg, var(--navy) 0%, #164e63 100%)', color: '#fff', marginBottom: 20, boxShadow: 'var(--shadow-md)' }}>
                  <TrendingUp size={26} style={{ flexShrink: 0, color: '#67e8f9' }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>
                      Your funding map: {instCount} institutions across 3 bureaus · up to {prodCount} products
                    </div>
                    <div style={{ fontSize: '0.83rem', opacity: 0.85 }}>
                      Run the reuse plays and that's roughly one pull per institution. Maximum access, minimum inquiries.
                    </div>
                  </div>
                </div>
              )
            })()}

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
                {plan.builders.map((r, i) => <RecCard key={`${r.inst.id}-${r.products[0].id}`} rec={r} rank={i + 1} />)}
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

                {answers.goal === 'business' && (
                  <div className="guide__section">
                    <button
                      className="btn btn--primary btn--lg"
                      onClick={() => navigate('/business')}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      Open the Business Funding path →
                    </button>
                  </div>
                )}

                {answers.goal !== 'business' && plan.lanes.map(lane => (
                  <div className="guide__section" key={lane.bureau}>
                    <h2 className="guide__section-title">
                      <TrendingUp size={16} style={{ verticalAlign: -3 }} /> {lane.bureau} lane
                      {plan.lanes[0].bureau === lane.bureau && answers.clean && answers.clean !== 'notsure' ? ', start here (your cleanest report)' : ''}
                    </h2>
                    {lane.recs.length > 0 ? (
                      lane.recs.map((r, i) => <RecCard key={`${r.inst.id}-${r.products[0].id}`} rec={r} rank={i + 1} />)
                    ) : (
                      <div className="guide__body"><p>No strong verified matches in this lane for your profile yet. As the database grows, this lane fills in, check back.</p></div>
                    )}
                  </div>
                ))}

                {answers.goal !== 'business' && (
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
                )}
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
