import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, RefreshCw, Phone, ShieldCheck, TrendingUp, AlertTriangle, Lightbulb, Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import SideMenu from '../components/SideMenu'
import type { Institution, Product } from '../types'
import { track } from '../lib/track'
import type { BlueprintStep } from '../lib/blueprint'

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
// Open accounts drive the thin-file rule. Target is 7-8 reporting accounts.
type Accounts = '0-2' | '3-5' | '6-8' | '9plus'
// Hard blockers: these stop the funding path regardless of score.
type Derog = 'none' | 'collections' | 'chargeoff' | 'bk2yr'
// Which lane the member has been burning inquiries on (more answerable than
// "which report is cleanest", and it drives the same lane ordering).
type InqFocus = Bureau | 'even' | 'notsure'

const SCORE_FLOOR: Record<ScoreBand, number> = {
  under580: 500, '580-639': 580, '640-699': 640, '700-749': 700, '750plus': 750,
}

type Answers = {
  goal: Goal | null
  score: ScoreBand | null
  accounts: Accounts | null
  util: Util | null
  lates: Lates | null
  derog: Derog | null
  age: Age | null
  inq: Inq | null
  inqFocus: InqFocus | null
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

  // ── Hard blockers get addressed first, and strictly educationally. We never
  // assess whether a specific item is disputable and never promise removal.
  if (a.derog === 'collections' || a.derog === 'chargeoff' || a.derog === 'bk2yr') {
    plays.push({
      title: 'Clear the blocker before you spend a single inquiry',
      body: 'A collection, charge-off, or recent bankruptcy outranks everything else on your file, so applying now mostly buys denials. Three things worth knowing. One, you have a federal right to dispute anything INACCURATE, and the CFPB publishes free sample dispute letters on its own site (see Resources). We do not assess whether your specific item is inaccurate and nobody honest can promise a removal. Two, if the debt is accurate, time and payment behavior are what move it, a paid or settled collection still ages off, and newer scoring models weigh paid collections less. Three, if any of it is unfamiliar or you suspect an error, talk to a qualified professional. Meanwhile the build steps below are not dead time, they run in parallel.',
    })
  }

  // ── Utilization: FREE moves first. Most people sitting at high utilization
  // have no cash for a deposit, so never lead with a product that costs money.
  if (a.util === 'over50' || a.util === '30-50') {
    plays.push({
      title: 'Utilization: the free moves first',
      body: 'Every one of these costs zero dollars. (1) Pay before the STATEMENT date, not the due date. Your balance is photographed when the statement cuts, so paying it down before that day is what reports, and you can use the card again right after. You are not giving up the money, you are changing when the picture is taken. (2) Ask for a credit limit increase. Most issuers process these as a soft pull after about six months on the account, so a bigger limit against the same balance drops your utilization instantly with no new account and no inquiry. (3) Look at each card individually, not just the total. One card near its limit hurts even when your overall number looks fine, so move balances around or pay that one down first. Only after these do deposits and new accounts make sense.',
    })
  }

  // ── Payment history: goodwill first, and it is free.
  if (a.lates === '1-2' || a.lates === '3plus') {
    plays.push({
      title: 'Late payments: make the free call first',
      body: 'Before anything else, call the lender and ask for a goodwill adjustment. It costs nothing, takes about ten minutes, and it works often enough on a first late with an otherwise clean record to be worth every attempt. Ask politely, explain what happened, and ask if they will remove the late as a courtesy. Outcomes vary and nobody can promise one. Two things that matter more than the call: do not miss another payment, because a single late aging out is manageable while a second one restarts the clock, and remember lateness only reports at 30 days past due, so a few days late costs a fee, not a credit hit. Set autopay for the minimum on everything today.',
    })
  }

  // ── Age: the one-sentence rule that saves people years.
  if (a.age === 'under1' || a.age === '1-3' || a.age === 'none') {
    plays.push({
      title: 'Age: protect what you already have',
      body: 'Never close your oldest account. People tidy up their credit by closing old cards and destroy years of history doing it, and it is the one thing you cannot buy back. Keep it open with a small recurring charge and autopay. Beyond that, age is mostly time, so the honest move is to put your effort into the factors you can actually move and let this one run. The one exception that adds age retroactively: becoming an authorized user on a seasoned account belonging to someone who trusts you, with perfect payment history and low utilization. Family or a close friend only, never a stranger or a paid service.',
    })
  }
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
  if (mode !== 'build' && a.goal === 'everything') {
    plays.push({
      title: 'Revolving First (the capital hierarchy)',
      body: 'Not all funding is equal. Cards and lines of credit are money SITTING: they cost nothing until you draw, you reuse them forever, and the limits grow with you. A loan is money RENTED: repayment starts the day it funds, and once you pay it back, the access is gone. So the hierarchy is revolving first, installment second, and your lanes below are ranked exactly that way. Loans still have their place, consolidating expensive balances or funding a specific move with a known payoff, but you build the standing access first.',
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
  if (a.accounts === '0-2' || a.accounts === '3-5') {
    plays.push({
      title: 'Thin file: build to 7 or 8 accounts, in this order',
      body: 'Underwriters want to see a handful of accounts paying on time, and the target is roughly seven to eight. Here is the order that works. Open two secured cards at two DIFFERENT institutions, because two banks reporting looks materially different from one. Add an installment account so your file has a mix, and a share-secured loan from a credit union is worth more than a fintech builder product because it reports as a normal bank loan rather than something an underwriter can spot as a credit-building product. On any secured loan, do not rush it closed. Pay the bulk down early, then stretch the rest in small payments over about twelve months, since an open installment account with on-time history scores better than a closed one. Two critical rules: stagger your openings, two accounts, wait 60 to 90 days, then two more, because opening six at once collapses your average age and reads as a spree. And pick institutions you will want funding from later, so the secured card doubles as a foot in the door. The list below is already sorted that way.',
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
      // 'Varies by state' products belong in EVERY lane, because the member's
      // lane depends on where they live. They carry a call-first caution.
      if (p.bureau_pulled !== bureau && p.bureau_pulled !== 'All 3' && p.bureau_pulled !== 'Varies by state') continue
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
      if (p.bureau_pulled === 'Varies by state') { pts -= 1; caution.push('Bureau varies by state, call and ask before you apply') }
      if (p.existing_customer_required === 'Yes') { pts -= 1; caution.push('Existing-customer relationship required first') }
      // Situational: high utilization boosts 0% / balance-transfer offers (the play)
      if ((a.util === 'over50' || a.util === '30-50') && /0%|balance transfer|intro apr/i.test(p.strategy_notes || '')) {
        pts += 2; why.push('0% / balance-transfer offer noted, fits your utilization play')
      }
      // Tapped-out pivot: heavy inquiries favor soft-prequal loans hard
      if (heavyInq && p.type === 'Personal Loan' && (p.preapproval_available === 'Yes' || inst.soft_pull_available === 'Yes')) {
        pts += 2; why.push('Soft prequalification: check your rate without touching your loaded report')
      }
      // Capital hierarchy (Grams doctrine): revolving beats installment.
      // A card or line is money sitting on standby that costs nothing until
      // drawn and reuses forever; a loan starts costing the day it funds. In
      // maximum-access mode, revolving products outrank loans.
      if (a.goal === 'everything' && (p.type === 'Unsecured Card' || p.type === 'Line of Credit')) {
        pts += 2
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
    // Who can actually open an account here
    const acc = accessInfo(inst)
    points -= acc.penalty
    if (acc.tier === 'military' || acc.tier === 'regional') caution.push(acc.label)
    else if (acc.tier === 'joinable') why.push(acc.label)
    // Issuer rules, annotation-level, subordinate to the access math
    const issuer = issuerAnnotate(inst.name, a.cards24)
    points += issuer.boost
    why.push(...issuer.why)
    caution.push(...issuer.caution)
    if (points > 0) recs.push({ inst, products: top.map(s => s.p), points, why: [...new Set(why)], caution: [...new Set(caution)] })
  }
  return ensureOpenAccess(recs.sort((x, y) => y.points - x.points).slice(0, 3))
}

function rankBuilders(institutions: Institution[]): Rec[] {
  const recs: Rec[] = []
  for (const inst of institutions) {
    // THE RELATIONSHIP PLAY: building at a place that ALSO funds you later means
    // the secured card doubles as a foot in the door. Ranked accordingly.
    const fundingLater = inst.products.filter(p => CAPITAL_TYPES.includes(p.type)).length
    for (const p of inst.products) {
      if (!BUILDER_TYPES.includes(p.type)) continue
      let points = 1
      const why: string[] = []
      const caution: string[] = []
      if (p.graduation_potential === 'Yes') { points += 3; why.push(`Graduates to unsecured${p.graduation_timeline && p.graduation_timeline !== 'Not Verified' ? ` (${p.graduation_timeline})` : ''}`) }
      const rep = (p.reports_to || '').toLowerCase()
      if (rep.includes('all') || (rep.includes('experian') && rep.includes('equifax') && rep.includes('transunion'))) { points += 2; why.push('Reports to all three bureaus') }
      if (p.bureau_pulled === 'None') { points += 2; why.push('No credit check to open') }
      if (fundingLater > 0) {
        points += Math.min(3, fundingLater)
        why.push(`Relationship play: ${fundingLater} funding product${fundingLater > 1 ? 's' : ''} here once you qualify`)
      }
      if (inst.inquiry_reuse === 'Yes') { points += 1; why.push('Allows inquiry reuse later') }
      if (p.existing_customer_required === 'Yes') { points -= 1; caution.push('Existing-customer relationship required first') }
      const acc = accessInfo(inst)
      points -= acc.penalty
      if (acc.tier === 'military' || acc.tier === 'regional') caution.push(acc.label)
      else if (acc.tier === 'joinable') why.push(acc.label)
      recs.push({ inst, products: [p], points, why, caution })
    }
  }
  // One product per institution, so the plan spreads across issuers instead of
  // stacking five cards at one bank.
  const seen = new Set<number>()
  const ranked = recs.sort((x, y) => y.points - x.points).filter(r => {
    if (seen.has(r.inst.id)) return false
    seen.add(r.inst.id); return true
  }).slice(0, 5)
  return ensureOpenAccess(ranked)
}

// ─── Who can actually open this? ─────────────────────────────────────────────
// A plan full of military-only credit unions is useless to a civilian. The
// engine ranks OPEN access first, labels every gate honestly, and never lets
// the top of a list be entirely gated. Gated institutions are still shown,
// because they're excellent if you happen to qualify.
type AccessTier = 'open' | 'joinable' | 'regional' | 'military'
function accessInfo(inst: Institution): { tier: AccessTier; label: string; penalty: number } {
  const g = (inst.geographic_restrictions || '').toLowerCase()
  if (/military|veteran|\bdod\b|armed forces/.test(g) && !/not military-only|anyone can apply/.test(g)) {
    return { tier: 'military', label: 'Military / family only', penalty: 4 }
  }
  // Nationwide but you join something first (ACC, a community charter, a state
  // association). Still open to anyone, so barely penalised — and we say how.
  if (/acc |american consumer council|community charter|online membership|membership via|association/.test(g)) {
    return { tier: 'joinable', label: 'Open to anyone (join to qualify)', penalty: 0 }
  }
  if (/nationwide|anyone/.test(g)) {
    // A BANK saying "nationwide" is open. A CREDIT UNION saying it without
    // naming the route is an unverified claim — every credit union has a field
    // of membership, and auditing found real cases where "Nationwide" actually
    // meant employer- or state-gated. Say "confirm you qualify" rather than
    // sending someone to a door that may not open.
    if (inst.type === 'Credit Union' && !/acc |american consumer council|charter|donation|association|membership via|online membership|everyone is eligible|anyone can apply|foundation|genuinely open|american consumer council|financial fitness/.test(g)) {
      return { tier: 'joinable', label: 'Confirm you qualify to join (credit union)', penalty: 1 }
    }
    return { tier: 'open', label: 'Open to anyone', penalty: 0 }
  }
  return { tier: 'regional', label: `Regional: ${inst.geographic_restrictions}`, penalty: 2 }
}

// Guarantee the top of a list isn't all gated. If the first two entries are
// both restricted, pull the best open option up into second place.
function ensureOpenAccess(recs: Rec[]): Rec[] {
  const gated = (r: Rec) => ['military', 'regional'].includes(accessInfo(r.inst).tier)
  if (recs.length < 2 || !recs.slice(0, 2).every(gated)) return recs
  const i = recs.findIndex(r => !gated(r))
  if (i < 2) return recs
  const [open] = recs.splice(i, 1)
  recs.splice(1, 0, open)
  return recs
}

// ─── The intake, as data ─────────────────────────────────────────────────────
// One question per screen. Declared here rather than repeated in markup so the
// order is obvious, every question is guaranteed to feed a rule, and the review
// screen can render itself. `short` is the label used on the review summary.
type QDef = {
  key: keyof Answers
  label: string
  short: string
  help?: string
  optional?: boolean
  options: { v: string; t: string }[]
}
const QUESTIONS: QDef[] = [
  {
    key: 'goal', short: 'Looking for', label: 'What are you hunting for?',
    options: [
      { v: 'everything', t: 'Maximum access (everything)' }, { v: 'cards', t: 'Credit cards + lines of credit' },
      { v: 'loans', t: 'Loans' }, { v: 'business', t: 'Business funding' },
    ],
  },
  {
    key: 'score', short: 'Credit score', label: 'Where does your credit score land?',
    help: 'If your credit card app shows a free FICO score, use that number. Free apps like Credit Karma show a different score that often runs higher than what card issuers actually pull. Between two bands? Pick the lower one.',
    options: [
      { v: 'under580', t: 'Under 580' }, { v: '580-639', t: '580 to 639' }, { v: '640-699', t: '640 to 699' },
      { v: '700-749', t: '700 to 749' }, { v: '750plus', t: '750 or higher' },
    ],
  },
  {
    key: 'accounts', short: 'Open accounts', label: 'How many open credit accounts report on your file?',
    help: 'Credit cards, loans, anything that shows up on your credit report. Lenders want to see roughly seven or eight.',
    options: [
      { v: '0-2', t: '0 to 2' }, { v: '3-5', t: '3 to 5' }, { v: '6-8', t: '6 to 8' }, { v: '9plus', t: '9 or more' },
    ],
  },
  {
    key: 'util', short: 'Utilization', label: 'How much of your credit limits are you using?',
    help: 'Add up your card balances, divide by your total limits. A rough guess is fine.',
    options: [
      { v: 'under10', t: 'Under 10%' }, { v: '10-30', t: '10 to 30%' },
      { v: '30-50', t: '30 to 50%' }, { v: 'over50', t: 'Over 50%' },
    ],
  },
  {
    key: 'lates', short: 'Late payments', label: 'Any late payments in the last 24 months?',
    help: 'Only counts if it reached 30 days past due. A few days late costs a fee, not a credit hit.',
    options: [{ v: 'none', t: 'None' }, { v: '1-2', t: '1 or 2' }, { v: '3plus', t: '3 or more' }],
  },
  {
    key: 'derog', short: 'On your report', label: 'Any of these on your report right now?',
    help: 'Pick the most serious one that applies.',
    options: [
      { v: 'none', t: 'None of these' }, { v: 'collections', t: 'A collection account' },
      { v: 'chargeoff', t: 'A charge-off, repo, or judgment' }, { v: 'bk2yr', t: 'Bankruptcy in the last 2 years' },
    ],
  },
  {
    key: 'age', short: 'Oldest account', label: 'How old is your oldest account?',
    options: [
      { v: 'none', t: 'No credit history yet' }, { v: 'under1', t: 'Under 1 year' },
      { v: '1-3', t: '1 to 3 years' }, { v: '3plus', t: '3 years or more' },
    ],
  },
  {
    key: 'inq', short: 'Recent inquiries', label: 'How many hard inquiries in the last 6 months?',
    help: 'Every credit application creates one, approved or denied.',
    options: [{ v: '0-2', t: '0 to 2' }, { v: '3-5', t: '3 to 5' }, { v: '6plus', t: '6 or more' }],
  },
  {
    key: 'inqFocus', short: 'Inquiries land on', label: 'Are those inquiries concentrated on one bureau?',
    help: 'If you have been applying at the same few places, they often pile onto one report. Not sure is a fine answer.',
    options: [
      { v: 'notsure', t: 'Not sure' }, { v: 'even', t: 'Spread evenly' }, { v: 'Experian', t: 'Mostly Experian' },
      { v: 'Equifax', t: 'Mostly Equifax' }, { v: 'TransUnion', t: 'Mostly TransUnion' },
    ],
  },
  {
    key: 'cards24', short: 'New cards (24 mo)', label: 'How many new credit cards have you opened in the last 24 months?',
    help: 'All banks combined. Chase auto-denies at five, so this one decides whether that door is open.',
    options: [{ v: '0-1', t: '0 or 1' }, { v: '2-4', t: '2 to 4' }, { v: '5plus', t: '5 or more' }],
  },
  {
    key: 'clean', short: 'Cleanest report', label: 'Which credit report is your cleanest?', optional: true,
    help: 'Skip this if you do not know. It only fine-tunes which lane we start you in.',
    options: [
      { v: 'notsure', t: 'Not sure, skip this' }, { v: 'Experian', t: 'Experian' },
      { v: 'Equifax', t: 'Equifax' }, { v: 'TransUnion', t: 'TransUnion' },
    ],
  },
]

// ─── The Funding Bridge ──────────────────────────────────────────────────────
// What's open to you now, and what unlocks at each rung above you. Turns the
// score from a number into a door you can watch getting closer. Built only
// from products with a VERIFIED score floor, and it says so.
function fundingBridge(institutions: Institution[], a: Answers) {
  const floor = a.score ? SCORE_FLOOR[a.score] : 0
  const scored = institutions.flatMap(i => i.products)
    .filter(p => CAPITAL_TYPES.includes(p.type) && p.minimum_credit_score != null)
  const nowOpen = scored.filter(p => (p.minimum_credit_score as number) <= floor).length
  const TIERS = [580, 620, 660, 700, 740]
  const rungs = TIERS.filter(t => t > floor).map(tier => ({
    tier,
    opens: scored.filter(p => {
      const m = p.minimum_credit_score as number
      return m > floor && m <= tier
    }).length,
  })).filter(r => r.opens > 0)
  return { nowOpen, rungs, scoredTotal: scored.length }
}

// ─── Turn the plan into a numbered, timed sequence ───────────────────────────
// A list of recommendations is not a plan. This converts the engine's output
// into ordered steps with waits between them, which is what a member actually
// works and what Grams hands a client.
type PlanShape = {
  mode: 'build' | 'borderline' | 'ready'
  hardBlocker: string | null
  thinFile: boolean
  buildingFile: boolean
  builders: Rec[]
  lanes: { bureau: Bureau; recs: Rec[]; hold: string | null }[]
  payDownFirst: boolean
}

function buildSteps(plan: PlanShape, a: Answers): BlueprintStep[] {
  const steps: BlueprintStep[] = []
  const push = (s: Omit<BlueprintStep, 'n'>) => steps.push({ ...s, n: steps.length + 1 })

  if (plan.mode === 'build') {
    if (plan.hardBlocker) {
      push({
        kind: 'action', timing: 'Start now, runs alongside everything else',
        title: `Deal with ${plan.hardBlocker}`,
        why: 'This outranks your score, so it comes first. If anything on your report is inaccurate, you have a federal right to dispute it and the CFPB publishes free sample letters (see Resources). If it is accurate, time and payment behavior are what move it. Nobody can promise a removal.',
      })
    }
    if (plan.payDownFirst) {
      push({
        kind: 'action', timing: 'This week, costs nothing',
        title: 'Run the free utilization moves',
        why: 'Pay before the statement date rather than the due date, ask for a credit limit increase (usually a soft pull after about six months on an account), and check each card individually, not just your total.',
      })
    }
    if (a.lates === '1-2' || a.lates === '3plus') {
      push({
        kind: 'action', timing: 'This week, about 10 minutes per call',
        title: 'Call for a goodwill adjustment on the late payments',
        why: 'Free, and it works often enough on a first late with an otherwise clean record to be worth every attempt. Then set autopay for the minimum on everything so it never happens again.',
      })
    }
    const first = plan.builders.slice(0, 2)
    first.forEach(r => {
      const p = r.products[0]
      push({
        kind: 'action', timing: 'Weeks 1 to 2', instId: r.inst.id,
        title: `Open the ${p.name} at ${r.inst.name}`,
        why: [
          p.graduation_potential === 'Yes' && p.graduation_timeline && p.graduation_timeline !== 'Not Verified' ? `Graduates to unsecured in ${p.graduation_timeline}.` : '',
          `Pulls ${p.bureau_pulled}.`,
          r.why.find(w => w.startsWith('Relationship play')) ? r.why.find(w => w.startsWith('Relationship play')) + ', so this account doubles as a foot in the door.' : '',
        ].filter(Boolean).join(' '),
      })
    })
    push({
      kind: 'wait', timing: 'Months 1 to 3',
      title: 'Pay on time, every time. No new applications.',
      why: 'Keep every balance under 10% of the limit when the statement cuts. Clean recency is what moves a file, and new pulls during this window undo the work.',
    })
    const next = plan.builders.slice(2, 4)
    next.forEach(r => {
      const p = r.products[0]
      push({
        kind: 'action', timing: 'Around month 3', instId: r.inst.id,
        title: `Add the ${p.name} at ${r.inst.name}`,
        why: `Second wave, staggered on purpose. Opening everything at once collapses your average account age and reads as a spree. Pulls ${p.bureau_pulled}.`,
      })
    })
    push({
      kind: 'wait', timing: 'Months 3 to 6',
      title: 'Season the file',
      why: 'No new accounts, no new pulls. You are letting the accounts age and the on-time history stack up. This is the part most people skip and it is the part that works.',
    })
    push({
      kind: 'action', timing: 'Month 6',
      title: 'Re-run the Strategy Engine',
      why: 'Your answers will have changed, which means the verdict changes. This is when the capital lanes typically open.',
    })
    return steps
  }

  // READY / BORDERLINE
  push({
    kind: 'action', timing: 'Before you apply for anything',
    title: 'Protect the profile you are about to spend',
    why: 'Pull your free reports at AnnualCreditReport.com and check for surprises. Nothing goes 30 days late, no balance spikes before a statement cuts, and no unplanned new accounts. People lose approvals in the two weeks before applying more often than they think.',
  })
  push({
    kind: 'action', timing: 'Day 1, spends nothing',
    title: 'Sweep every soft-pull preapproval first',
    why: 'Preapprovals and prequalification checks show your real odds without touching your report. Collect your yes-list before you spend a single hard inquiry.',
  })
  const openLanes = plan.lanes.filter(l => !l.hold && l.recs.length > 0)
  openLanes.forEach((lane, li) => {
    lane.recs.slice(0, 3).forEach(r => {
      const dd = r.products.length >= 2 && r.inst.inquiry_reuse === 'Yes'
      push({
        kind: 'action', instId: r.inst.id,
        timing: li === 0 ? 'Week 1' : `Month ${li + 1}`,
        title: dd
          ? `${r.inst.name}: apply for BOTH ${r.products.map(p => p.name).join(' and ')} the same day`
          : `${r.inst.name}: apply for the ${r.products[0].name}`,
        why: dd
          ? `One hard pull on ${r.products[0].bureau_pulled} covers both products here, so you get two tradelines for the price of one inquiry. Same day matters. Confirm the reuse window when you call.`
          : `Pulls ${r.products[0].bureau_pulled}. ${r.why.slice(0, 2).join('. ')}`,
      })
    })
    if (li < openLanes.length - 1) {
      push({
        kind: 'wait', timing: '30 to 45 days',
        title: `Let the ${lane.bureau} approvals report before you open the next lane`,
        why: 'New accounts need to post before the next issuer looks at your file. Moving too fast makes the whole run read as a spree.',
      })
    }
  })
  const held = plan.lanes.filter(l => l.hold)
  held.forEach(l => {
    push({
      kind: 'wait', timing: 'Hold until the inquiries age',
      title: `${l.bureau} stays on hold`,
      why: `${l.hold} Inquiries lose most of their weight around 12 months and fall off at 24, so this lane reopens on a clock.`,
    })
  })
  push({
    kind: 'habit', timing: 'Ongoing',
    title: 'Log every result in My Funding Map',
    why: 'Approvals and denials both. The map tracks your total access, your 0% runways, your inquiry lanes, and when each card\'s limit-increase window opens.',
  })
  push({
    kind: 'action', timing: '90 days from today',
    title: 'Re-run the Strategy Engine',
    why: 'Your inquiry lanes, account count, and utilization will all have moved. The plan should move with them.',
  })
  return steps
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

function RecCard({ rec, rank, maxPts }: { rec: Rec; rank: number; maxPts?: number }) {
  const navigate = useNavigate()
  const doubleDip = rec.products.length >= 2 && rec.inst.inquiry_reuse === 'Yes'
  // Relative fit: strongest match in this member's results ≈ 95, floor 50.
  const fit = maxPts ? Math.round(50 + 45 * (rec.points / maxPts)) : null
  return (
    <div className="institution-card" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => navigate(`/institution/${rec.inst.id}`)}>
      {fit != null && (
        <span
          title="Fit is relative to your own results: how strongly this option matches your profile versus the rest of your map."
          style={{ position: 'absolute', top: 14, right: 14, fontWeight: 800, fontSize: '0.9rem', color: 'var(--teal)' }}
        >
          {fit}% fit
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontWeight: 800, color: 'var(--teal)', fontSize: '0.9rem' }}>{rank}.</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingRight: 64 }}>
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

export default function Strategy() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [answers, setAnswers] = useState<Answers>({ goal: null, score: null, accounts: null, util: null, lates: null, derog: null, age: null, inq: null, inqFocus: null, cards24: null, clean: null })
  const [built, setBuilt] = useState(false)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<number | null>(null)

  useEffect(() => { document.title = 'Strategy Engine | Intelligent Funding' }, [])
  useEffect(() => {
    fetch('/api/institutions?path=all', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((data: Institution[]) => { if (Array.isArray(data)) setInstitutions(data) })
      .catch(() => {})
  }, [token])

  const complete = answers.goal && answers.score && answers.accounts && answers.util && answers.lates
    && answers.derog && answers.age && answers.inq && answers.inqFocus && answers.cards24

  const plan = useMemo(() => {
    if (!built || !complete) return null
    const a = answers

    // ── HARD BLOCKERS ────────────────────────────────────────────────────────
    // These stop the funding path regardless of everything else. Named, so the
    // plan can say exactly what is in the way instead of a vague "not ready".
    const hardBlocker =
      a.derog === 'bk2yr' ? 'a bankruptcy in the last 2 years'
      : a.derog === 'collections' ? 'an open collection account'
      : a.derog === 'chargeoff' ? 'a charge-off, repossession, or judgment'
      : a.util === 'over50' ? 'utilization above 50%'
      : a.age === 'none' ? 'no credit history reporting yet'
      : a.score === 'under580' ? 'a score under 580'
      : null

    // ── THIN FILE ────────────────────────────────────────────────────────────
    // Not a blocker, but it routes to build-first. Target is 7-8 accounts.
    // This is the rule that stops us telling a 4-account file to run a spread.
    const thinFile = a.accounts === '0-2'
    const buildingFile = a.accounts === '3-5'

    const notReady = !!hardBlocker || thinFile || a.lates === '3plus'
      || (buildingFile && a.lates === '1-2')
    const borderline = !notReady && (a.score === '580-639' || a.util === '30-50'
      || a.lates === '1-2' || buildingFile)

    // Lane order: the bureau you've been burning goes LAST, your cleanest first.
    const bureaus: Bureau[] = ['Experian', 'Equifax', 'TransUnion']
    let ordered = [...bureaus]
    if (a.clean && a.clean !== 'notsure') {
      ordered = [a.clean as Bureau, ...ordered.filter(b => b !== a.clean)]
    }
    if (a.inqFocus && a.inqFocus !== 'notsure' && a.inqFocus !== 'even') {
      ordered = [...ordered.filter(b => b !== a.inqFocus), a.inqFocus as Bureau]
    }

    // ── STOP CONDITIONS ──────────────────────────────────────────────────────
    // The engine must be able to say "hold this lane" instead of always selling.
    const burnedLane = (b: Bureau): string | null => {
      if (a.inq === '6plus') return 'You are at 6+ inquiries in 6 months. Every lane needs to rest.'
      if (a.inqFocus === b && a.inq === '3-5') return `Your recent inquiries are concentrated here. Work the other lanes first and let this one age.`
      return null
    }

    const mode = notReady ? 'build' as const : borderline ? 'borderline' as const : 'ready' as const
    const builders = rankBuilders(institutions)
    // Gated institutions are excellent IF you qualify, so we offer them
    // separately rather than letting them crowd out options everyone can open.
    const openIds = new Set(builders.map(b => b.inst.id))
    const gatedBuilders = rankBuilders(
      institutions.filter(i => !openIds.has(i.id) && ['military', 'regional'].includes(accessInfo(i).tier))
    ).slice(0, 3)
    const lanes = ordered.map(b => ({ bureau: b, recs: rankCapital(institutions, b, a), hold: burnedLane(b) }))
    // Fit % is RELATIVE to the strongest match in this member's own results —
    // derived from the same points the ranking already uses, never invented.
    const allRecs = [...builders, ...lanes.flatMap(l => l.recs)]
    const maxPts = Math.max(1, ...allRecs.map(r => r.points))
    return {
      mode,
      hardBlocker,
      thinFile,
      buildingFile,
      builders,
      gatedBuilders,
      lanes,
      maxPts,
      plays: buildPlays(a, mode),
      bridge: fundingBridge(institutions, a),
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

        {!plan && (() => {
          const q = QUESTIONS[step]
          const onLast = step >= QUESTIONS.length
          if (onLast) {
            return (
              <div className="guide__section">
                <div style={{ fontSize: '0.74rem', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 10 }}>
                  That's everything
                </div>
                <h2 style={{ fontSize: '1.25rem', marginBottom: 14 }}>Ready to build your plan</h2>
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 18 }}>
                  {QUESTIONS.map((qq, i) => {
                    const val = answers[qq.key] as string | null
                    const opt = qq.options.find(o => o.v === val)
                    return (
                      <div key={qq.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: i < QUESTIONS.length - 1 ? '1px dashed var(--border)' : 'none' }}>
                        <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>{qq.short}</span>
                        <button
                          onClick={() => setStep(i)}
                          style={{ background: 'none', padding: 0, fontWeight: 700, fontSize: '0.86rem', color: 'var(--navy)', textAlign: 'right' }}
                          title="Change this answer"
                        >
                          {opt ? opt.t : 'not set'}
                        </button>
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn--ghost" onClick={() => setStep(QUESTIONS.length - 1)}>← Back</button>
                  <button
                    className="btn btn--primary btn--lg"
                    disabled={!complete}
                    onClick={() => { track('engine_run'); setBuilt(true) }}
                    style={{ opacity: complete ? 1 : 0.5 }}
                  >
                    Build My Strategy →
                  </button>
                </div>
              </div>
            )
          }
          return (
            <div className="guide__section">
              {/* Progress */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    Question {step + 1} of {QUESTIONS.length}
                  </span>
                  {q.optional && <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>optional</span>}
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'var(--badge-gray-bg)', overflow: 'hidden' }}>
                  <div style={{ width: `${(step / QUESTIONS.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--navy), var(--teal))', transition: 'width .25s' }} />
                </div>
              </div>

              <h2 style={{ fontSize: '1.3rem', lineHeight: 1.3, marginBottom: q.help ? 8 : 18 }}>{q.label}</h2>
              {q.help && (
                <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 18 }}>{q.help}</p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {q.options.map(o => {
                  const selected = answers[q.key] === o.v
                  return (
                    <button
                      key={o.v}
                      onClick={() => {
                        setAnswers(prev => ({ ...prev, [q.key]: o.v }))
                        window.setTimeout(() => setStep(s => s + 1), 130)
                      }}
                      style={{
                        textAlign: 'left', padding: '15px 18px', borderRadius: 'var(--radius-lg)', fontSize: '1rem', fontWeight: 600,
                        border: `2px solid ${selected ? 'var(--teal)' : 'var(--border)'}`,
                        background: selected ? 'var(--badge-teal-bg)' : '#fff',
                        color: selected ? 'var(--teal)' : 'var(--text-primary)',
                        transition: 'all .15s',
                      }}
                    >
                      {o.t}
                    </button>
                  )
                })}
              </div>

              {step > 0 && (
                <button className="btn btn--ghost" onClick={() => setStep(s => Math.max(0, s - 1))}>← Back</button>
              )}
            </div>
          )
        })()}


        {plan && (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              <button className="btn btn--ghost" onClick={() => { setBuilt(false); setSavedId(null); setStep(0) }} style={{ display: 'inline-flex', gap: 6 }}>
                <RefreshCw size={14} /> Change my answers
              </button>
              <button
                className="btn btn--primary"
                disabled={saving || savedId != null}
                style={{ display: 'inline-flex', gap: 6, opacity: saving || savedId != null ? 0.6 : 1 }}
                onClick={async () => {
                  if (saving || savedId != null) return
                  setSaving(true)
                  try {
                    const steps = buildSteps(plan, answers)
                    const res = await fetch('/api/my/blueprints', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({
                        title: `Funding blueprint · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
                        mode: plan.mode, answers, steps,
                      }),
                    })
                    const d = await res.json()
                    if (d.id) setSavedId(d.id)
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                <Save size={14} /> {savedId != null ? 'Saved to My Blueprint' : saving ? 'Saving…' : 'Save as my blueprint'}
              </button>
              {savedId != null && (
                <button className="btn btn--teal" onClick={() => navigate('/blueprint')} style={{ display: 'inline-flex', gap: 6 }}>
                  Open My Blueprint →
                </button>
              )}
            </div>

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

            {/* The Funding Bridge: the road ahead, in doors not points */}
            {plan.bridge.rungs.length > 0 && (
              <div className="guide__section">
                <h2 className="guide__section-title"><TrendingUp size={16} style={{ verticalAlign: -3 }} /> The road ahead</h2>
                <div className="guide__body" style={{ marginBottom: 12 }}>
                  <p>
                    {plan.bridge.nowOpen > 0
                      ? <><b>{plan.bridge.nowOpen} products</b> in our directory list a score floor at or below your band right now.</>
                      : <>Nothing in our directory lists a score floor at your band yet.</>}
                    {' '}Here's what opens as it climbs.
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                  {plan.bridge.rungs.map(r => (
                    <div key={r.tier} className="institution-card" style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>at {r.tier}+</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--teal)' }}>+{r.opens}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>more products open</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 10 }}>
                  Counted from the {plan.bridge.scoredTotal} products where an institution publishes a score floor.
                  Plenty of lenders don't publish one, so treat this as the floor of what's out there, not the ceiling.
                </p>
              </div>
            )}

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
                    {plan.hardBlocker
                      ? <>Straight talk: <b>{plan.hardBlocker}</b> is what's standing in the way right now, and it outranks your score. Applying before it's handled mostly buys denials.</>
                      : plan.thinFile
                      ? <>Straight talk: with <b>only a couple of accounts reporting</b>, lenders have almost nothing to underwrite. Applying now would burn pulls on denials no matter how good the rest looks.</>
                      : plan.buildingFile
                      ? <>Straight talk: you have <b>a few accounts and a recent late</b>. That combination gets declined more often than it gets approved, so we build a few months of clean history first instead of spending inquiries to find out.</>
                      : <>Straight talk: hitting unsecured lenders today would burn hard pulls on likely denials.</>}
                    {' '}That's not a no, it's a sequence. Run this build phase, then come back and re-run the engine. The capital lanes will open.
                  </p>
                  <ul>
                    <li>Work the plays above in order. The free moves come before anything that costs money.</li>
                    <li>Open the builder products below, two at a time, then wait 60 to 90 days before the next two.</li>
                    <li>Pay everything on time for 6 straight months. Nothing moves a file like clean recency.</li>
                    {plan.payDownFirst && <li>Get utilization under 30%, then under 10%. It's the fastest lever you control.</li>}
                    <li>No new hard pulls while you build.</li>
                    <li>Re-run this engine in 90 days. The verdict changes as the file changes.</li>
                  </ul>
                </div>
                {plan.builders.map((r, i) => <RecCard key={`${r.inst.id}-${r.products[0].id}`} rec={r} rank={i + 1} maxPts={plan.maxPts} />)}

                {plan.gatedBuilders.length > 0 && (
                  <div style={{ marginTop: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, background: 'var(--badge-gray-bg)' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', marginBottom: 6 }}>If you qualify, these are worth a look too</div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
                      Everything above is open to anyone. These have a membership or regional requirement, so they
                      are not in your main plan, but they are strong products if you happen to be eligible.
                    </p>
                    {plan.gatedBuilders.map(r => (
                      <div key={r.inst.id} style={{ fontSize: '0.86rem', marginBottom: 6 }}>
                        <b>{r.inst.name}</b> · {r.products[0].name}
                        <span style={{ color: 'var(--text-secondary)' }}> — {accessInfo(r.inst).label}</span>
                      </div>
                    ))}
                  </div>
                )}
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
                      {lane.hold ? ', on hold' : plan.lanes[0].bureau === lane.bureau && !plan.lanes[0].hold ? ', start here' : ''}
                    </h2>
                    {/* STOP CONDITION: the engine has to be able to say hold, not always sell. */}
                    {lane.hold ? (
                      <div style={{ border: '1px solid #fde68a', background: '#fffbeb', borderRadius: 'var(--radius-lg)', padding: 16 }}>
                        <div style={{ fontWeight: 800, color: '#b45309', marginBottom: 5 }}>Hold this lane</div>
                        <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                          {lane.hold} Inquiries lose most of their weight around 12 months and fall off at 24,
                          so this lane reopens on a clock. Spend your applications in the lanes above instead.
                        </p>
                      </div>
                    ) : lane.recs.length > 0 ? (
                      lane.recs.map((r, i) => <RecCard key={`${r.inst.id}-${r.products[0].id}`} rec={r} rank={i + 1} maxPts={plan.maxPts} />)
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
                      <li><b>Log every result in <span style={{ color: 'var(--teal)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/map')}>My Funding Map</span>.</b> Approvals AND denials. The map tracks your total access, your 0% runways, and your 5/24 clock, and tells you when your next window opens.</li>
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
