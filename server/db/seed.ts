import bcrypt from 'bcryptjs'
import { getPool } from './database.js'

const VERIFIED_DATE = '2026-06-21'

type ProductRow = {
  name: string
  type: 'Unsecured Card' | 'Line of Credit' | 'Personal Loan' | 'Secured Card' | 'Credit Builder Loan' | 'Alternative Tradeline'
  bureau_pulled: 'Experian' | 'Equifax' | 'TransUnion' | 'All 3' | 'None' | 'Not Verified'
  reports_to: string
  inquiry_reuse_eligible: 'Yes' | 'No' | 'Not Verified'
  preapproval_available: 'Yes' | 'No' | 'Not Found'
  minimum_credit_score: number | null
  deposit_amount: string
  annual_fee: string
  graduation_potential: 'Yes' | 'No' | 'N/A' | 'Not Verified'
  graduation_timeline: string
  existing_customer_required: 'Yes' | 'No'
  strategy_notes: string
}

type InstitutionRow = {
  name: string
  type: 'Bank' | 'Credit Union' | 'Fintech'
  inquiry_reuse: 'Yes' | 'No' | 'Partial' | 'Not Verified'
  inquiry_reuse_window: string
  preapproval_available: 'Yes' | 'No' | 'Not Found' | 'Not Verified'
  soft_pull_available: 'Yes' | 'No' | 'Not Found' | 'Not Verified'
  geographic_restrictions: string
  application_url: string
  path: 'Capital Access' | 'Credit Builder' | 'Both'
  verified_date?: string // per-institution verification date; falls back to VERIFIED_DATE
  products: ProductRow[]
}

const allInstitutions: InstitutionRow[] = [

  // ── EXPERIAN BUCKET ──────────────────────────────────────────────────────────

  {
    name: 'American Express',
    type: 'Bank',
    inquiry_reuse: 'No',
    inquiry_reuse_window: 'N/A',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.americanexpress.com',
    path: 'Capital Access',
    products: [
      { name: 'Blue Cash Everyday Card', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'Yes', minimum_credit_score: 670, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian primary. Soft pull preapproval via CardMatch before hard pull. EXISTING AMEX CARDHOLDERS (Community Verified, 5+ independent myFICO/Reddit sources): additional card applications typically reuse your last SOFT pull — only your first-ever Amex application usually gets a hard pull. Not guaranteed, but a well-documented pattern.' },
      { name: 'Blue Cash Preferred Card', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'Yes', minimum_credit_score: 700, deposit_amount: 'N/A', annual_fee: '$95', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Higher-tier grocery/streaming cash back. Pulls Experian. Check CardMatch preapproval before applying. Existing Amex cardholders: additional cards typically reuse your last soft pull rather than a fresh hard inquiry (Community Verified, 5+ sources).' },
      { name: 'American Express Gold Card', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'Yes', minimum_credit_score: 720, deposit_amount: 'N/A', annual_fee: '$250', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Premium dining/travel card. Pulls Experian. Best timed after Experian profile is established. Existing Amex cardholders: additional cards typically reuse your last soft pull rather than a fresh hard inquiry (Community Verified, 5+ sources) — the strategic reason to open your FIRST Amex card early and add more later.' },
    ],
  },

  {
    name: 'Bank of America',
    type: 'Bank',
    inquiry_reuse: 'Yes',
    inquiry_reuse_window: '30 Days',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.bankofamerica.com',
    path: 'Capital Access',
    products: [
      { name: 'Bank of America Customized Cash Rewards', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Yes', minimum_credit_score: 670, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian. Preapproval available online. Inquiry reuse within 30 days — stack multiple BofA cards on one Experian pull. VELOCITY RULES (BofA): 3/12 — three or more new cards anywhere in 12 months = denial, relaxed to 7/12 if you hold a BofA checking or savings account. Plus 2/3/4 on BofA cards themselves: max 2 in 2 months, 3 in 12 months, 4 in 24 months. Open the deposit account BEFORE you stack.' },
      { name: 'Bank of America Unlimited Cash Rewards', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Yes', minimum_credit_score: 670, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Flat 1.5% unlimited cash back. Pulls Experian. Stack with Customized Cash on same 30-day inquiry window. VELOCITY RULES (BofA): 3/12 — three or more new cards anywhere in 12 months = denial, relaxed to 7/12 if you hold a BofA checking or savings account. Plus 2/3/4 on BofA cards themselves: max 2 in 2 months, 3 in 12 months, 4 in 24 months. Open the deposit account BEFORE you stack.' },
      { name: 'Bank of America Premium Rewards', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Yes', minimum_credit_score: 700, deposit_amount: 'N/A', annual_fee: '$95', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Travel rewards. Pulls Experian. Preferred Rewards members get elevated odds. Third card to stack on Experian. VELOCITY RULES (BofA): 3/12 — three or more new cards anywhere in 12 months = denial, relaxed to 7/12 if you hold a BofA checking or savings account. Plus 2/3/4 on BofA cards themselves: max 2 in 2 months, 3 in 12 months, 4 in 24 months. Open the deposit account BEFORE you stack.' },
    ],
  },

  {
    name: 'Chase',
    type: 'Bank',
    inquiry_reuse: 'Yes',
    inquiry_reuse_window: '30 Days',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.chase.com',
    path: 'Capital Access',
    products: [
      { name: 'Chase Freedom Unlimited', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Yes', minimum_credit_score: 670, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian primary. Preapproval via Chase site. 5/24 rule applies. Inquiry reuse within 30 days for multiple Chase cards. VELOCITY RULE (Chase 5/24): 5 or more personal cards opened across ANY bank in the last 24 months = automatic denial. Hit Chase FIRST in your stacking sequence, before the count builds.' },
      { name: 'Chase Freedom Flex', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Yes', minimum_credit_score: 670, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Rotating 5% categories. Pulls Experian. Stack with Freedom Unlimited on same inquiry window. 5/24 rule applies. VELOCITY RULE (Chase 5/24): 5 or more personal cards opened across ANY bank in the last 24 months = automatic denial. Hit Chase FIRST in your stacking sequence, before the count builds.' },
      { name: 'Chase Sapphire Preferred', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Yes', minimum_credit_score: 700, deposit_amount: 'N/A', annual_fee: '$95', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Premium travel card. Pulls Experian. Apply early in strategy — 5/24 rule locks out once you hit 5 new accounts. VELOCITY RULE (Chase 5/24): 5 or more personal cards opened across ANY bank in the last 24 months = automatic denial. Hit Chase FIRST in your stacking sequence, before the count builds.' },
    ],
  },

  {
    name: 'Wells Fargo',
    type: 'Bank',
    inquiry_reuse: 'Yes',
    inquiry_reuse_window: '30 Days',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.wellsfargo.com',
    path: 'Capital Access',
    products: [
      { name: 'Wells Fargo Active Cash Card', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Yes', minimum_credit_score: 670, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Flat 2% unlimited cash back. Pulls Experian. Preapproval available online. Inquiry reuse within 30 days.' },
      { name: 'Wells Fargo Autograph Card', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Yes', minimum_credit_score: 670, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: '3x on travel, dining, streaming. Pulls Experian. Stack with Active Cash on same 30-day inquiry for dual Wells Fargo Experian strategy.' },
    ],
  },

  {
    name: 'TD Bank',
    type: 'Bank',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'No',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Primarily East Coast (ME to FL)',
    application_url: 'https://www.td.com/us',
    path: 'Capital Access',
    products: [
      { name: 'TD Cash Credit Card', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: 660, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian. East Coast regional bank. Pairs well with other Experian-pull institutions for East Coast residents.' },
      { name: 'TD Double Up Credit Card', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: 670, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: '2% cash back on all purchases. Pulls Experian. Good Experian filler for East Coast residents.' },
    ],
  },

  {
    name: 'Fifth Third Bank',
    type: 'Bank',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'No',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Midwest and Southeast',
    application_url: 'https://www.53.com',
    path: 'Capital Access',
    products: [
      { name: 'Fifth Third 1% Cash/Back Card', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: 650, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian. Midwest/Southeast regional bank. Good Experian stacking option for members in served states.' },
    ],
  },

  {
    name: 'Regions Bank',
    type: 'Bank',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'No',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'South and Midwest',
    application_url: 'https://www.regions.com',
    path: 'Capital Access',
    products: [
      { name: 'Regions Prestige Visa Signature', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: 700, deposit_amount: 'N/A', annual_fee: '$79', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Premium Regions card. Pulls Experian. South/Midwest focus.' },
      { name: 'Regions Life Visa Credit Card', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: 650, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Entry-level Regions card. Pulls Experian. Lower minimum score. Both Regions cards pull Experian for stacking in served states.' },
    ],
  },

  {
    name: 'KeyBank',
    type: 'Bank',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'No',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Northeast and Pacific Northwest',
    application_url: 'https://www.key.com',
    path: 'Capital Access',
    products: [
      { name: 'Key Cashback Credit Card', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: 660, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian. Regional bank serving Northeast/Pacific Northwest. KeyBank relationship may unlock rate discounts on other products.' },
    ],
  },

  {
    name: 'FNBO',
    type: 'Bank',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'No',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.fnbo.com',
    path: 'Capital Access',
    products: [
      { name: 'FNBO Evergreen Visa', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: 660, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Flat 2% cash back. Pulls Experian. Less competitive than Chase/BofA but solid Experian-bucket filler with no annual fee.' },
      { name: 'FNBO Platinum Edition Visa', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: 650, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Low-rate option from FNBO. Pulls Experian. Good second product in Experian stacking sequence.' },
    ],
  },

  {
    name: 'Citi',
    type: 'Bank',
    inquiry_reuse: 'Yes',
    inquiry_reuse_window: '30 Days',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.citi.com',
    path: 'Capital Access',
    products: [
      { name: 'Citi Double Cash Card', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Yes', minimum_credit_score: 670, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: '2% cash back (1% earn + 1% pay). Pulls Experian primary. Preapproval available. Inquiry reuse within 30 days for multiple Citi products. VELOCITY RULE (Citi speed limit): only 1 card application per 8 days, max 2 cards per rolling 65 days. With Citi it is timing, not count — space the applications.' },
      { name: 'Citi Custom Cash Card', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Yes', minimum_credit_score: 670, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: '5% on top spend category. Pulls Experian. Stack with Double Cash on same inquiry for dual-Citi Experian setup. VELOCITY RULE (Citi speed limit): only 1 card application per 8 days, max 2 cards per rolling 65 days. With Citi it is timing, not count — space the applications.' },
    ],
  },

  {
    name: 'Patelco Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Yes',
    inquiry_reuse_window: '30 Days',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Nationwide (community charter)',
    application_url: 'https://www.patelco.org',
    path: 'Capital Access',
    products: [
      { name: 'Patelco Visa Classic', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: 640, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian. Nationwide community charter. Inquiry reuse within 30 days. Lower minimum score — accessible Experian entry point.' },
      { name: 'Patelco Visa Signature', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: 670, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Premium Patelco card. Pulls Experian. Stack with Classic on same inquiry for dual-line Experian strategy.' },
    ],
  },

  {
    name: 'BCU',
    type: 'Credit Union',
    inquiry_reuse: 'Yes',
    inquiry_reuse_window: '30 Days',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Nationwide (community charter)',
    application_url: 'https://www.bcu.org',
    path: 'Capital Access',
    products: [
      { name: 'BCU Platinum Visa', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: 650, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian — confirmed Session 8 (resolved from conflict). Nationwide open charter. Inquiry reuse within 30 days.' },
    ],
  },

  {
    name: 'PSECU',
    type: 'Credit Union',
    inquiry_reuse: 'Yes',
    inquiry_reuse_window: '30 Days',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Nationwide (online membership via PA)',
    application_url: 'https://www.psecu.com',
    path: 'Capital Access',
    products: [
      { name: 'PSECU Visa', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: 640, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian — confirmed Session 8. PA-based, open membership online. Low minimum score. Inquiry reuse within 30 days.' },
    ],
  },

  {
    name: 'Affinity Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Nationwide (community membership via NJ)',
    application_url: 'https://www.affinityfcu.com',
    path: 'Capital Access',
    products: [
      { name: 'Affinity Platinum Visa', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: 640, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian — confirmed Session 8 (was HELD in earlier research). NJ-based open membership. Inquiry reuse not yet confirmed.' },
    ],
  },

  {
    name: 'American Heritage Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Greater Philadelphia area',
    application_url: 'https://www.americanheritagecu.org',
    path: 'Capital Access',
    products: [
      { name: 'American Heritage Visa Platinum', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: 640, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian — confirmed Session 8. Philadelphia-area CU. Good EX option for PA/NJ Experian stacking.' },
    ],
  },

  {
    name: 'Service Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Yes',
    inquiry_reuse_window: '30 Days',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Nationwide (military/DOD + community)',
    application_url: 'https://www.servicecu.org',
    path: 'Capital Access',
    products: [
      { name: 'Service CU Visa Classic', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: 630, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian. Military/DOD-affiliated with open community membership. Low score minimum — good Experian entry point. Inquiry reuse within 30 days.' },
      { name: 'Service CU Visa Platinum', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: 660, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Higher-tier Service CU card. Pulls Experian. Stack both Service CU products on one inquiry for dual-line Experian strategy.' },
    ],
  },

  {
    name: 'America First Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Yes',
    inquiry_reuse_window: '30 Days',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Utah, Nevada, Idaho, Arizona',
    application_url: 'https://www.americafirst.com',
    path: 'Capital Access',
    products: [
      { name: 'America First Visa Signature', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: 660, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian. UT/NV/ID/AZ members only. Inquiry reuse within 30 days. Strong Experian stacking option for members in served states.' },
      { name: 'America First Platinum Visa', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: 640, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Lower-tier America First card. Same Experian pull. Stack both products on one inquiry for dual-line strategy.' },
    ],
  },

  {
    name: 'PenFed Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Yes',
    inquiry_reuse_window: 'Same Day',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.penfed.org',
    path: 'Both',
    products: [
      { name: 'PenFed Power Cash Rewards Visa Signature', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Yes', minimum_credit_score: 700, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Flagship card. Pulls Equifax — corrected from prior EX data, confirmed Session 8. Same-day inquiry reuse. Stack with Platinum Rewards on one Equifax pull.' },
      { name: 'PenFed Platinum Rewards Visa Signature', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Yes', minimum_credit_score: 680, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Lower minimum than Power Cash. Pulls Equifax. Good second product for same-day inquiry reuse.' },
      { name: 'PenFed Personal Expense Loan', type: 'Personal Loan', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: 680, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Split bureau — personal loan pulls Experian while cards pull Equifax. Stack loan with Experian card strategy simultaneously.' },
    ],
  },

  {
    name: 'Alliant Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Yes',
    inquiry_reuse_window: '30 Days',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.alliantcreditunion.org',
    path: 'Capital Access',
    products: [
      { name: 'Alliant Cashback Visa Signature', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: 690, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian — corrected from prior TU data, confirmed Session 8. Inquiry reuse within 30 days. Nationwide open charter.' },
      { name: 'Alliant Visa Platinum', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Lower-tier Alliant card. Same Experian pull. Stack with Cashback Visa on same inquiry for lower-qualified profiles.' },
    ],
  },

  // ── EQUIFAX BUCKET ───────────────────────────────────────────────────────────

  {
    name: 'First Tech Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Yes',
    inquiry_reuse_window: '30 Days',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.firsttechfed.com',
    path: 'Capital Access',
    products: [
      { name: 'First Tech Choice Rewards World Mastercard', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: 680, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Flagship First Tech card. Pulls Equifax. Inquiry reuse within 30 days. Nationwide via Computer History Museum membership.' },
      { name: 'First Tech Personal Line of Credit', type: 'Line of Credit', bureau_pulled: 'Equifax', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: 660, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Revolving credit line on same Equifax pull as the card. Stack card + LOC on one inquiry for maximum Equifax utilization.' },
      { name: 'DCU Visa Platinum (via First Tech)', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: 660, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: '10.50% fixed APR — best low-rate card in the database. DCU merged into First Tech in 2026; product now offered at firsttechfed.com. Pulls Equifax.' },
    ],
  },

  {
    name: 'Andrews Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Yes',
    inquiry_reuse_window: '30 Days',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Nationwide (ACC membership accepted)',
    application_url: 'https://www.andrewsfcu.org',
    path: 'Capital Access',
    products: [
      { name: 'Andrews FCU Visa Classic', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: 640, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax — confirmed via myFICO community data and DAILY-OPS. ACC membership satisfies requirement nationwide. Inquiry reuse within 30 days.' },
    ],
  },

  {
    name: 'Truist Bank',
    type: 'Bank',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Southeast and Mid-Atlantic',
    application_url: 'https://www.truist.com',
    path: 'Capital Access',
    products: [
      { name: 'Truist Enjoy Cash Credit Card', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Yes', minimum_credit_score: 660, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax — confirmed via Truist application form disclosure (Session 8). Preapproval available online. SE/Mid-Atlantic focus.' },
      { name: 'Truist Enjoy Beyond Credit Card', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Yes', minimum_credit_score: 700, deposit_amount: 'N/A', annual_fee: '$95', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Premium Truist travel card. Pulls Equifax. Good EQ target for higher-credit profiles in served states.' },
    ],
  },

  {
    name: 'State Department Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Yes',
    inquiry_reuse_window: '30 Days',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Nationwide (ACC membership accepted)',
    application_url: 'https://www.sdfcu.org',
    path: 'Capital Access',
    products: [
      { name: 'SDFCU Visa Platinum', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: 650, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax. ACC membership accepted nationwide. Inquiry reuse within 30 days. Good Equifax entry point.' },
    ],
  },

  {
    name: 'Langley Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Virginia (community membership)',
    application_url: 'https://www.langleyfcu.org',
    path: 'Capital Access',
    products: [
      { name: 'Langley FCU Visa Platinum', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: 640, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax. Virginia-based CU. Bureau confirmed via community research. Good EQ stacking option for VA members.' },
    ],
  },

  {
    name: 'NIH Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'MD/DC/VA (NIH community + open membership)',
    application_url: 'https://www.nihfcu.org',
    path: 'Capital Access',
    products: [
      { name: 'NIHFCU Visa Platinum', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: 640, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax — confirmed Session 8. MD/DC/VA focused. Good Equifax stacking option in served area.' },
    ],
  },

  {
    name: 'SECU Credit Union (Maryland)',
    type: 'Credit Union',
    inquiry_reuse: 'Yes',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Maryland-based; membership open beyond MD via association (not state-employee-only)',
    application_url: 'https://www.secumd.org',
    path: 'Both',
    verified_date: '2026-07-04',
    products: [
      { name: 'SECU FirstRate Visa', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: 670, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax (Community Verified, 4 sources). Lowest-rate SECU card — APR from 13.49%. 0% intro APR 12 months on purchases and balance transfers. No annual, cash advance, or foreign transaction fees. Community reports ~670 Equifax FICO 5 floor for unsecured approvals.' },
      { name: 'SECU Rewards Visa', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: 670, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax. APR from 15.49%, 1 point per $1, 0% intro APR 12 months. Community reports of multiple SECU approvals on one hard pull — call to confirm before stacking.' },
      { name: 'SECU Cash Back Visa', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: 670, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax. 2% cash back on gas/groceries, 5% bonus first 90 days (up to $250), 0% intro APR 12 months, no annual fee.' },
      { name: 'SECU Visa Signature', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: 670, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax. 3x points dining/travel/Amazon, 25,000 bonus points ($2k spend in 90 days), 0% intro APR 12 months, no annual fee.' },
      { name: 'SECU UMD Affinity Visa', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: 670, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax. 3x points gas/groceries/streaming, 25,000 bonus points, 0% intro APR 12 months, no annual fee.' },
      { name: 'SECU Starter Visa', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax. Unsecured starter card for building credit history — earns 1 point per $1, no annual fee. Rare: a credit-building card that still earns rewards.' },
      { name: 'SECU Student Visa', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax. Student card for establishing credit — earns points, no annual fee.' },
      { name: 'SECU Secured Visa', type: 'Secured Card', bureau_pulled: 'Equifax', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'Funded savings account (opened after approval)', annual_fee: 'None', graduation_potential: 'Not Verified', graduation_timeline: 'Not Found', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax. Secured card that still earns 1 point per $1 — unusual for a builder card. Deposit funds a savings account opened after approval. No annual fee.' },
    ],
  },

  {
    name: 'Interior Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Dept. of the Interior employees + affiliated organizations (general-public path not verified)',
    application_url: 'https://www.interiorfederal.org',
    path: 'Capital Access',
    verified_date: '2026-07-04',
    products: [
      { name: 'Interior Federal Visa Platinum', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax (Community Verified, 3 sources). APR as low as 11.35% — one of the lowest unsecured card rates in this database. Limits $250–$20,000. No annual, balance transfer, or foreign transaction fees. 2.90% intro APR 6 months on balance transfers.' },
      { name: 'Interior Federal Visa Platinum Rewards', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax. 1 point per $1, APR as low as 13.35%, limits $250–$20,000, no annual fee. Community datapoint: $17.5k limit approved at 701 Equifax.' },
    ],
  },

  {
    name: 'Justice Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Justice/law-enforcement community + eligible member associations (general-public path not verified)',
    application_url: 'https://www.jfcu.org',
    path: 'Both',
    verified_date: '2026-07-04',
    products: [
      { name: 'Justice FCU VISA Platinum Rewards', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax (Community Verified, 2 sources). 11.90% NON-variable APR after 0% intro 12 months — a fixed rate this low is rare. 2% intro APR on balance transfers AND cash advances for 12 months. $0 annual fee. Nine affinity versions (FBINAA, C.O.P.S., NSA, Blue Knights, etc.) carry identical terms.' },
      { name: 'Justice FCU VISA Signature', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax. 1.5% cash back on every purchase, 13.65%–18.00% variable APR, $0 annual fee, no foreign transaction fees, 24/7 concierge.' },
      { name: 'Justice FCU Student VISA', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax. Student rewards card, 16.90% non-variable after 0% intro 12 months, $0 annual fee. Under 21 needs cosigner or proof of income.' },
      { name: 'Justice FCU Share Secured VISA', type: 'Secured Card', bureau_pulled: 'Equifax', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'Not publicly displayed', annual_fee: 'None', graduation_potential: 'Not Verified', graduation_timeline: 'Not Found', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax. Share-secured builder card confirmed in JFCU\'s own card disclosures (not eligible for the intro-rate offer). Deposit terms not publicly displayed — contact institution.' },
    ],
  },

  {
    name: 'AOD Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Select Employer Groups (SEG-based) + community membership',
    application_url: 'https://www.aodfcu.com',
    path: 'Both',
    verified_date: '2026-07-05',
    products: [
      { name: 'AOD Signature Visa', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax (Community Verified, 2 sources incl. myFICO pattern thread noting EQ-5 scoring). Prime + 9.50% APR, credit line from $5,000, 3% cash back first $1,500/cycle then 1%, no annual fee. Membership itself is a hard pull and DTI-sensitive.' },
      { name: 'AOD Visa Platinum', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax. As low as 8.49% APR, credit line from $300, 1% cash back all purchases plus 1% extra on gas/restaurants, no annual fee — one of the lowest-barrier unsecured lines in this database.' },
      { name: 'AOD Share Secured Visa Platinum', type: 'Secured Card', bureau_pulled: 'Equifax', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'From $300 (credit line = deposit)', annual_fee: 'None', graduation_potential: 'Not Verified', graduation_timeline: 'Not Found', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax. FIXED 7.20% APR — unusually low for a secured card — plus cash back on all purchases. No annual fee. Great for limited credit history per official site.' },
    ],
  },

  {
    name: 'Northwest Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Broad employer/community partner network (600+ orgs nationwide incl. federal agencies) + family of existing members',
    application_url: 'https://www.nwfcu.org',
    path: 'Capital Access',
    verified_date: '2026-07-05',
    products: [
      { name: 'NWFCU NOW Plus Rewards Visa', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax (Community Verified, 2 independent myFICO threads 2 years apart — same bureau confirmed for both cards and car loans). Variable 13.74%-18.00% APR, 2 points per $1, 50,000 bonus points ($5k spend/120 days), no annual fee.' },
      { name: 'NWFCU Visa Platinum', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax. Their lowest-rate card — variable 12.74%-18.00% APR, no annual fee.' },
      { name: 'NWFCU FirstCard Platinum Visa', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax. Rare unsecured starter card — no deposit required, credit limit up to $1,000, non-variable 15.90% APR, no annual fee. For members 18+ building credit history.' },
    ],
  },

  {
    name: 'Signal Financial Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Not yet researched — membership path to be confirmed next pass',
    application_url: 'https://www.signalfinancialfcu.org',
    path: 'Both',
    verified_date: '2026-07-05',
    products: [
      { name: 'Signal Signature Visa', type: 'Unsecured Card', bureau_pulled: 'TransUnion', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls TransUnion (Community Verified, 2 sources — myFICO direct reply + Doctor of Credit; resolves a prior sourcing conflict where an unverified roster claimed Equifax). Variable 14.25%-18.00% APR, 0% intro 12 months, $5,000-$40,000 limit, no annual fee, 3%/2%/1% cash back tiers, $100 bonus ($1k spend/90 days).' },
      { name: 'Signal Platinum Visa', type: 'Unsecured Card', bureau_pulled: 'TransUnion', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls TransUnion. Variable 13.25%-18.00% APR, 0% intro 12 months, $500-$40,000 limit, no annual fee, 3x/2x/1x points, 10,000 bonus points.' },
      { name: 'Signal Direct Visa', type: 'Unsecured Card', bureau_pulled: 'TransUnion', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: '$25 (waived first year + waived if $1k+ transactions/year)', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls TransUnion. Their lowest-rate card — variable 12.25%-18.00% APR, 0% intro 12 months.' },
      { name: 'Signal Secured Visa', type: 'Secured Card', bureau_pulled: 'TransUnion', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: '$500-$1,000 (deposit = credit limit)', annual_fee: '$25 (waived first year + waived if $1k+ transactions/year)', graduation_potential: 'Not Verified', graduation_timeline: 'Not Found', existing_customer_required: 'No', strategy_notes: 'Pulls TransUnion. Fixed 18.00% APR secured builder card.' },
    ],
  },

  {
    name: 'Arvest Bank',
    type: 'Bank',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Arkansas, Kansas, Missouri, Oklahoma',
    application_url: 'https://www.arvest.com',
    path: 'Capital Access',
    verified_date: '2026-07-05',
    products: [
      { name: 'Arvest Cobalt Visa Signature', type: 'Unsecured Card', bureau_pulled: 'TransUnion', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls TransUnion (Community Verified, 3 first-hand myFICO datapoints incl. auto loan approval confirming same bureau across products). 0% intro APR 15 billing cycles then 18.24%-24.99%, no annual fee, no foreign transaction fee, 3x dining/2x gas-groceries-streaming, 20,000 point bonus ($1k spend/93 days), TSA PreCheck/Global Entry credit up to $120.' },
      { name: 'Arvest Cash Back', type: 'Unsecured Card', bureau_pulled: 'TransUnion', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls TransUnion. 0% intro APR 18 billing cycles then 18.24%-24.99%, no annual fee, no foreign transaction fee, 1.5% flat cash back, $200 bonus ($1k spend/93 days).' },
      { name: 'Arvest True Rate', type: 'Unsecured Card', bureau_pulled: 'TransUnion', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls TransUnion. Their lowest-rate card — 0% intro 12 cycles purchases/18 cycles balance transfers, then 15.74%-24.99%, no annual fee. Unlike its siblings, carries a 3% foreign transaction fee.' },
    ],
  },

  {
    name: 'Prosper',
    type: 'Fintech',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.prosper.com',
    path: 'Capital Access',
    verified_date: '2026-07-05',
    products: [
      { name: 'Prosper Personal Loan', type: 'Personal Loan', bureau_pulled: 'TransUnion', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Yes', minimum_credit_score: 640, deposit_amount: 'N/A', annual_fee: 'None (origination fee 1%-9.99%)', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls TransUnion (OFFICIAL — Prosper\'s own help center states this explicitly, rare to find in writing). $2,000-$50,000, 8.99%-35.99% fixed APR, 2-6 year terms. Soft-pull rate check official, no credit impact. Funded by WebBank. Min score 640.' },
    ],
  },

  {
    name: 'M&T Bank',
    type: 'Bank',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'East Coast footprint',
    application_url: 'https://www.mtb.com',
    path: 'Both',
    verified_date: '2026-07-05',
    products: [
      { name: 'M&T Visa Signature', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian primarily (Community Verified, 2 sources) but will occasionally pull TransUnion — flagged honestly. Unlimited 1.5% cash back, no foreign transaction fee, 0% intro APR 12 billing cycles (4% BT fee), 17.74%-21.74% after, no annual fee, 10,000 point bonus ($500 spend/90 days).' },
      { name: 'M&T Visa with Rewards', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian primarily (occasionally TransUnion). 1% cash back, 0% intro APR 12 cycles, 14.74%-21.74% after, no annual fee, 10,000 point bonus.' },
      { name: 'M&T Visa', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian primarily (occasionally TransUnion). 0% intro APR 12 cycles, 13.74%-20.74% after, no annual fee.' },
      { name: 'M&T Secured Credit Card', type: 'Secured Card', bureau_pulled: 'Experian', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'From $250 (deposit = credit limit)', annual_fee: 'None', graduation_potential: 'Yes', graduation_timeline: 'Periodic account review (timeline not published)', existing_customer_required: 'No', strategy_notes: 'Pulls Experian. Free FICO score on statement (official), periodic review to graduate to unsecured, no annual fee.' },
    ],
  },

  {
    name: 'USAA',
    type: 'Bank',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Membership restricted: current/former military + spouses + children of USAA members only',
    application_url: 'https://www.usaa.com',
    path: 'Both',
    verified_date: '2026-07-05',
    products: [
      { name: 'USAA Rate Advantage Visa Platinum', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian, "Bankcard Score 3" model (Community Verified, 4 independent myFICO datapoints). USAA\'s lowest-rate card, 10.40%-24.40% APR, no annual fee. Membership restricted to military community.' },
      { name: 'USAA Eagle Adapt', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian. 3% cash back first $3k combined gas/groceries/dining etc., 1% else, 16.40%-26.40% APR, no annual fee.' },
      { name: 'USAA Cashback Rewards Plus Amex', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian. 5% gas + 3% groceries (first $3k each)/1% else, plus 5% on military base purchases, 15.40%-27.40% APR, no annual fee.' },
      { name: 'USAA Preferred Cash Rewards Visa Signature', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian. Flat 1.5% cash back, no category restrictions, 15.40%-27.40% APR, no annual fee.' },
      { name: 'USAA Eagle Navigator Visa Signature', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: '$95', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian. Travel rewards — 3x travel/2x else, $120 TSA PreCheck/Global Entry credit every 4 years. Only USAA card with an annual fee.' },
      { name: 'USAA Eagle Ascend Amex', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian. Build-credit-focused unsecured card — credit limit increase review as early as 6 months, automatic late fee waiver every 12 months, 2%/1% cash back, 27.40% APR, no annual fee.' },
      { name: 'USAA Secured American Express', type: 'Secured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: '$250-$5,000 (deposit = credit limit)', annual_fee: 'None', graduation_potential: 'Yes', graduation_timeline: 'Not published — responsible use reviewed for upgrade', existing_customer_required: 'No', strategy_notes: 'Pulls Experian. Reports to all 3 bureaus (OFFICIAL — rare to confirm this explicitly). Graduates to unsecured USAA card with responsible use, no annual fee.' },
    ],
  },

  // ── CATALOG TIER (Grams' policy 7/5: strong products, bureau honestly flagged Not Verified;
  //    appear in Browse All + product searches, excluded from bureau-filtered results) ──

  {
    name: 'Tilt',
    type: 'Fintech',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.tilt.com',
    path: 'Credit Builder',
    verified_date: '2026-07-05',
    products: [
      { name: 'Tilt Essentials', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Yes', minimum_credit_score: null, deposit_amount: 'N/A (no deposit required)', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified — brand new (rebranded from Empower Finance June 2026). Soft-pull prequalification OFFICIALLY confirmed, no impact to credit score. No security deposit, no credit history required. 29.99% variable APR, no annual fee, no foreign transaction fee, 1% cash back all purchases + 3% gas/groceries with AutoPay, automatic limit increase after 6 on-time payments.' },
      { name: 'Tilt Motion', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Yes', minimum_credit_score: null, deposit_amount: 'N/A (no deposit required)', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified. No deposit, 29.24%-34.24% variable APR, no annual fee, same cash back structure minus AutoPay boost.' },
      { name: 'Tilt Engage', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Yes', minimum_credit_score: null, deposit_amount: 'N/A (no deposit required)', annual_fee: '$59', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified. No deposit, 29.24%-34.24% variable APR, $59 annual fee — the only Tilt card with a fee.' },
    ],
  },

  {
    name: 'AgFed Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'USDA employees + select employer groups + community',
    application_url: 'https://www.agfed.org',
    path: 'Both',
    verified_date: '2026-07-05',
    products: [
      { name: 'AgFed Visa Classic', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified — one community datapoint points to Equifax but under our 2-source bar it stays "Not Verified" until confirmed. No annual fee. Decision within 24 hours per official FAQ.' },
      { name: 'AgFed Visa Platinum with Rewards', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: '$25', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified (community signal: Equifax). Rewards card, $25 annual fee, credit line up to $30,000.' },
      { name: 'AgFed Visa Platinum without Rewards', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: '$15', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified (community signal: Equifax). Lower $15 annual fee, credit line up to $30,000.' },
      { name: 'AgFed Secured Visa', type: 'Secured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'Not publicly displayed', annual_fee: 'None', graduation_potential: 'Not Verified', graduation_timeline: 'Not Found', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified (community signal: Equifax). Secured builder card, no annual fee.' },
      { name: 'AgFed LifeLine of Credit', type: 'Line of Credit', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified. Personal line of credit at 12.75% APR (Prime + 6.00%).' },
      { name: 'AgFed Pathway Loan', type: 'Credit Builder Loan', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified. Credit-builder loan for members establishing or rebuilding credit history.' },
    ],
  },

  {
    name: 'Credit One Bank',
    type: 'Bank',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.creditonebank.com',
    path: 'Capital Access',
    verified_date: '2026-07-06',
    products: [
      { name: 'Credit One Platinum Visa for Rebuilding Credit', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Yes', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: '$75 first year, then $99/yr (billed $8.25/mo)', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified. Targets rebuilding credit. 29.74% variable APR. Official soft-pull prequalification, no credit impact.' },
      { name: 'Credit One Platinum Visa', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Yes', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: '$39', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified. 29.74% variable APR. Official soft-pull prequalification.' },
      { name: 'Credit One Premier American Express Card', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Yes', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified. Unlimited 1% cash back, no annual fee — a rare $0-AF option in the rebuilder-card space, on the Amex network. Official soft-pull prequalification.' },
      { name: 'Credit One Omni Rewards American Express Card', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Yes', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified. Unlimited 2% cash back, no annual fee, targets "Excellent Credit" tier — a step-up card for graduated Credit One members. Official soft-pull prequalification.' },
      { name: 'Credit One Wander American Express Card', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Yes', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'Not publicly displayed', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified. Travel card — 10% back on hotels/car rentals via Credit One\'s travel partner, 5% on a secondary tier. Official soft-pull prequalification.' },
    ],
  },

  {
    name: 'Huntington Bank',
    type: 'Bank',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Midwest footprint',
    application_url: 'https://www.huntington.com',
    path: 'Both',
    verified_date: '2026-07-06',
    products: [
      { name: 'Huntington Cashback Credit Card', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer — sources conflict between TransUnion and Equifax (one insider claim of "Equifax and Transunion primarily", another names Equifax for the Voice card specifically). Unlimited 1.5% cash back, no foreign transaction fee, 15.49%-27.49% APR.' },
      { name: 'Huntington Voice Rewards Credit Card (3X)', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (TU vs EQ conflict — see Cashback card note). Choose a category for 3x rewards up to $2,000/quarter, 1x elsewhere, 15.49%-27.49% APR. +25% bonus points with a linked Huntington Platinum Perks checking account.' },
      { name: 'Huntington Voice Credit Card (Lower Rate)', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (TU vs EQ conflict). No rewards, but their lowest rate: 13.49%-25.49% APR.' },
      { name: 'Huntington Secured Credit Card', type: 'Secured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'Not publicly displayed', annual_fee: 'None', graduation_potential: 'Not Verified', graduation_timeline: 'Not Found', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (TU vs EQ conflict). 1% cash back, 26.49% APR, free FICO score on statement (official).' },
    ],
  },

  {
    name: 'PNC Bank',
    type: 'Bank',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Nationwide (bureau pull is state-dependent — see product notes)',
    application_url: 'https://www.pnc.com',
    path: 'Both',
    verified_date: '2026-07-06',
    products: [
      { name: 'PNC Cash Rewards', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau varies by state (Experian in NY/FL, Equifax in TX/OH per prior research) — flagged honestly as Not Verified rather than picking one. 4% gas/3% restaurants/2% groceries, $200 bonus ($1k spend/3mo), 13.49%-23.49% APR.' },
      { name: 'PNC Cash Unlimited', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau varies by state (see Cash Rewards note). Flat 2% cash back, 0% intro APR 15 months on balance transfers, 18.49%-28.49% after.' },
      { name: 'PNC Spend Wise', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau varies by state (see Cash Rewards note). 0% intro APR 18 months on purchases + balance transfers, 19.49%-27.49% after, includes a purchase-APR reduction program.' },
      { name: 'PNC Secured', type: 'Secured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'Refundable security deposit (amount not published)', annual_fee: 'None', graduation_potential: 'Not Verified', graduation_timeline: 'Not Found', existing_customer_required: 'No', strategy_notes: 'Bureau varies by state (see Cash Rewards note). 18.49%-28.49% APR, refundable deposit.' },
    ],
  },

  {
    name: 'Discover',
    type: 'Bank',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.discover.com',
    path: 'Capital Access',
    verified_date: '2026-07-06',
    products: [
      { name: 'Discover it Cash Back', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Yes', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not re-confirmed this pass. 5% cash back on rotating quarterly categories (activation required) + 1% elsewhere, unlimited Cashback Match at the end of year 1, 0% intro APR 15 months. Official soft-pull preapproval, no credit impact.' },
      { name: 'Discover it Miles', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Yes', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not re-confirmed this pass. Flat 1.5x miles on every purchase, unlimited Discover Match year 1, 0% intro APR 15 months.' },
      { name: 'Discover it Chrome', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Yes', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not re-confirmed this pass. 2% cash back on gas + restaurants (first $1,000/quarter combined) + 1% elsewhere, 0% intro APR 15 months.' },
      { name: 'Discover it Student Cash Back', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Yes', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not re-confirmed this pass. Student version of Cash Back — same 5% rotating categories, 0% intro APR 6 months.' },
      { name: 'Discover it Student Chrome', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Yes', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not re-confirmed this pass. Student version of Chrome, 0% intro APR 6 months.' },
      { name: 'NHL Discover it', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Yes', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not re-confirmed this pass. Team-branded version of Cash Back, same terms, cards for all 32 NHL teams.' },
    ],
  },

  {
    name: 'Wings Financial Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Minnesota-based, national field of membership via association',
    application_url: 'https://www.wingscu.com',
    path: 'Capital Access',
    verified_date: '2026-07-06',
    products: [
      { name: 'Wings Member Rewards Visa Signature', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer — sources conflict between Experian and Equifax. Points redeemable for gift cards, merchandise, travel. 17.70%-18.00% variable APR.' },
      { name: 'Wings Member Cash Rewards Visa Signature', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (EX vs EQ conflict). Cash back rewards, 17.70%-18.00% variable APR.' },
      { name: 'Wings Visa Platinum', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (EX vs EQ conflict). Their lowest rate: 11.65%-18.00% variable APR.' },
    ],
  },

  {
    name: 'Liberty Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Not yet researched',
    application_url: 'https://www.libertyfcu.org',
    path: 'Capital Access',
    verified_date: '2026-07-06',
    products: [
      { name: 'Liberty Platinum Credit Rewards', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer — sources conflict between Experian and TransUnion. 3x points travel/entertainment (rotating), 2x gas/groceries, 1x else. 11.75% APR.' },
      { name: 'Liberty Platinum Prime Plus', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (EX vs TU conflict). Their lowest rate, no rewards: 9.75% APR.' },
    ],
  },

  {
    name: 'Security Service Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Texas, Colorado, Utah',
    application_url: 'https://www.ssfcu.org',
    path: 'Capital Access',
    verified_date: '2026-07-06',
    products: [
      { name: 'SSFCU Power Credit Card', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer — sources conflict between TransUnion and Experian. 0% intro APR 12 months on balance transfers, 10.99% APR after.' },
      { name: 'SSFCU Power Travel Rewards', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (TU vs EX conflict). 3x gas/travel/dining, 20,000 bonus points ($1,200 spend/90 days), 0% intro APR 6 billing cycles.' },
      { name: 'SSFCU Power Cash Back', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (TU vs EX conflict). Unlimited 1.5% cash back, $100 bonus ($500 spend/90 days).' },
      { name: 'SSFCU Power Rewards', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (TU vs EX conflict). 1 point per $1 spent.' },
    ],
  },

  {
    name: 'VyStar Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Florida-based',
    application_url: 'https://vystarcu.org',
    path: 'Both',
    verified_date: '2026-07-06',
    products: [
      { name: 'VyStar Platinum Visa', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer — sources conflict between TransUnion and Equifax. Their lowest rate: as low as 13.60% APR.' },
      { name: 'VyStar Visa Signature Cash Back', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (TU vs EQ conflict). 3% gas/2% groceries/1% else, $150 bonus ($1,500 spend/90 days). 16.00% APR.' },
      { name: 'VyStar Visa Signature Rewards', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (TU vs EQ conflict). 16.00% APR.' },
      { name: 'VyStar Savings Secured Visa', type: 'Secured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'Not publicly displayed', annual_fee: 'None', graduation_potential: 'Not Verified', graduation_timeline: 'Not Found', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (TU vs EQ conflict). Secured, 18.00% APR.' },
    ],
  },

  {
    name: 'Apple Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Northern Virginia-based',
    application_url: 'https://www.applefcu.org',
    path: 'Capital Access',
    verified_date: '2026-07-06',
    products: [
      { name: 'Apple FCU Signature Rewards', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer — sources conflict between TransUnion and Experian. 25-day grace period, free Visa Concierge. 12.99%-18.00% APR.' },
      { name: 'Apple FCU MyRewards', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (TU vs EX conflict). 12.99%-18.00% APR.' },
      { name: 'Apple FCU Platinum', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (TU vs EX conflict). Their standard lowest rate: 11.49%-18.00% APR.' },
      { name: 'Apple FCU Educator', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (TU vs EX conflict). Restricted to educators. 3.99% intro APR then 11.49%-18.00%, skip payments Jul/Aug/Sep.' },
      { name: 'Apple FCU Student', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (TU vs EX conflict). 9.90% APR.' },
      { name: 'Apple FCU Credit Builder', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (TU vs EX conflict). Unsecured builder-focused card, 18.00% APR.' },
    ],
  },

  {
    name: 'TruMark Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Philadelphia, PA area',
    application_url: 'https://www.trumark.com',
    path: 'Both',
    verified_date: '2026-07-06',
    products: [
      { name: 'TruMark Everyday Elite', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer — sources conflict between TransUnion and Experian. Up to 4% cash back (4% gas/EV charging, 3% restaurants/food delivery, 2% groceries, 1% else) — the richest cash-back tier in this recovery batch. 17.99% APR.' },
      { name: 'TruMark Everyday Rewards', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (TU vs EX conflict). 1 point per $1. 12.49% APR.' },
      { name: 'TruMark Everyday Simplified', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (TU vs EX conflict). Their lowest rate, no rewards: 9.49% APR.' },
      { name: 'TruMark Secured Everyday Rewards', type: 'Secured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'Not publicly displayed', annual_fee: 'None', graduation_potential: 'Not Verified', graduation_timeline: 'Not Found', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (TU vs EX conflict). Secured, 1 point per $1, 16.49% APR.' },
    ],
  },

  {
    name: 'Redstone Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Alabama-based',
    application_url: 'https://www.redfcu.org',
    path: 'Capital Access',
    verified_date: '2026-07-06',
    products: [
      { name: 'Redstone Visa Signature', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer — the worst conflict in the whole registry: 3 sources disagree (TransUnion / Equifax / Experian). 5% cash back rotating quarterly categories + 2% gas/groceries + 1.5% else, $150 bonus ($3,000 spend/90 days). 15.50%-18.00% APR.' },
      { name: 'Redstone Visa Traditional', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (3-way TU/EQ/EX conflict — see Visa Signature note). 0% intro APR 6 months purchases+BT, then 10.50%-18.00% variable or 18.00% fixed.' },
    ],
  },

  {
    name: 'Alero Financial (formerly Corporate America Family CU)',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Membership open to anyone via "The Hope Group" association',
    application_url: 'https://www.alerofinancial.org',
    path: 'Both',
    verified_date: '2026-07-06',
    products: [
      { name: 'Alero Visa Platinum Advantage', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer — one myFICO thread says TU-only, another says TU-for-entry/EQ-for-cards. Institution rebranded from Corporate America Family CU to Alero Financial (discovered 7/6) — re-verify fresh under the new name. 1% cash back, uChoose Rewards, $250k travel accident insurance. 15.15%-19.15% APR.' },
      { name: 'Alero Visa Advantage', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (see Platinum Advantage note). 1% cash back, uChoose Rewards, $100k travel accident insurance. 17.15%-25.15% APR.' },
      { name: 'Alero Share Secured Visa', type: 'Secured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'Secured by funds in a Share Account', annual_fee: 'None', graduation_potential: 'Not Verified', graduation_timeline: 'Not Found', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer (see Platinum Advantage note). Low fixed rate for a secured card: 9.90% APR. 1% cash back, uChoose Rewards.' },
    ],
  },

  {
    name: 'Chevron Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Not yet researched',
    application_url: 'https://www.chevronfcu.org',
    path: 'Both',
    verified_date: '2026-07-06',
    products: [
      { name: 'Chevron FCU Personal Loan', type: 'Personal Loan', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified. In-house product — NOTE: Chevron\'s credit CARDS are issued by Elan Financial Services and excluded for that reason (bureau varies by applicant region, no honest single answer); this loan is Chevron\'s own product, not Elan\'s. 9.39%-9.99% APR, 12-60 month terms.' },
      { name: 'Chevron FCU Personal Line of Credit', type: 'Line of Credit', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified. In-house revolving line, 11.99% APR.' },
      { name: 'Chevron FCU Share Secured Loan', type: 'Credit Builder Loan', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'Secured by share/certificate balance', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified. Certificate or Share Rate + 2.00% APR, up to 60 months — a classic credit-builder loan.' },
    ],
  },

  {
    name: 'Spectra Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Northern Virginia, Western Maryland, DC area',
    application_url: 'https://www.spectracu.com',
    path: 'Both',
    verified_date: '2026-07-06',
    products: [
      { name: 'Spectra CU Personal Loan', type: 'Personal Loan', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified. In-house product — NOTE: Spectra\'s credit CARDS are issued by Elan Financial Services and excluded for that reason (bureau varies by applicant region); this loan is Spectra\'s own product, not Elan\'s. As low as 10.00% APR, up to 72 months.' },
      { name: 'Spectra CU Line of Credit', type: 'Line of Credit', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified. In-house revolving line, as low as 12.25% APR.' },
      { name: 'Spectra CU Share & Certificate Secured Loan', type: 'Credit Builder Loan', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'Secured by share certificate balance', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified. Rate not published this pass — secured by a share certificate, term cannot exceed the certificate term.' },
    ],
  },

  {
    name: 'LightStream (Truist)',
    type: 'Fintech',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.lightstream.com',
    path: 'Capital Access',
    verified_date: '2026-07-05',
    products: [
      { name: 'LightStream Personal Loan', type: 'Personal Loan', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer — official FAQ states the hard inquiry hits "TransUnion or Equifax" with no published rule for which. Requires Good Credit. No prequalification directly on lightstream.com (only via third-party marketplaces). No early payoff penalty. Used for auto, home improvement, debt consolidation, and more.' },
    ],
  },

  {
    name: 'OneMain Financial',
    type: 'Fintech',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.onemainfinancial.com',
    path: 'Capital Access',
    verified_date: '2026-07-05',
    products: [
      { name: 'OneMain Personal Loan', type: 'Personal Loan', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Yes', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not a single answer — Community Verified (2 myFICO sources) that the hard pull hits BOTH TransUnion and Experian after a soft-pull prequalification. Secured and unsecured options available.' },
    ],
  },

  {
    name: 'Upstart',
    type: 'Fintech',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.upstart.com',
    path: 'Capital Access',
    verified_date: '2026-07-05',
    products: [
      { name: 'Upstart Personal Loan', type: 'Personal Loan', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Yes', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Genuinely multi-bureau, not a single answer — an adverse action notice on myFICO showed Upstart pulling TransUnion FICO 8, TransUnion VantageScore, AND Equifax VantageScore in one application. Soft-pull rate check is OFFICIAL and repeatedly confirmed, no credit impact. Uses AI/alternative-data underwriting (income, education) alongside credit history.' },
    ],
  },

  {
    name: 'SoFi',
    type: 'Fintech',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.sofi.com',
    path: 'Capital Access',
    verified_date: '2026-07-05',
    products: [
      { name: 'SoFi Personal Loan', type: 'Personal Loan', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Yes', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None (no origination/late/prepayment fees)', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified. OFFICIAL soft-pull rate check confirmed repeatedly, no credit impact; hard pull only if you continue the application. $5,000-$100,000, 6.99%-35.49% fixed APR, same-day funding possible.' },
      { name: 'SoFi Credit Card', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'Not Verified', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified. Community report: hard pull occurs only upon approval; a declined application results in only a soft pull.' },
    ],
  },

  {
    name: 'SkyPoint Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Not Found',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'MD/DC area (membership path for other states not verified)',
    application_url: 'https://www.skypointfcu.com',
    path: 'Both',
    verified_date: '2026-07-04',
    products: [
      { name: 'SkyPoint The ONE Card', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified — confirm with SkyPoint before applying. Cash back on gas/grocery/everyday, $200 cash bonus ($1k spend in 90 days), 9.99% intro APR 12 months then 14.49%–18.00%. A $200-bonus card at a small credit union is rare.' },
      { name: 'SkyPoint Visa Platinum Rewards', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified. 1 point per $1, 10,000 bonus points ($3k spend in 3 months), low rate.' },
      { name: 'SkyPoint Visa Platinum', type: 'Unsecured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified. Low variable rate, no balance transfer fee, no annual fee.' },
      { name: 'SkyPoint Visa Platinum Secured', type: 'Secured Card', bureau_pulled: 'Not Verified', reports_to: 'Not Verified', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: 'Not publicly displayed', annual_fee: 'None', graduation_potential: 'Not Verified', graduation_timeline: 'Not Found', existing_customer_required: 'No', strategy_notes: 'Bureau not yet verified. Secured builder card, no balance transfer fee. Deposit terms not publicly displayed — contact institution.' },
    ],
  },

  {
    name: 'TDECU',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Texas',
    application_url: 'https://www.tdecu.org',
    path: 'Capital Access',
    products: [
      { name: 'TDECU Visa Platinum', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: 640, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax. Texas-based CU. Good Equifax option for TX members building bureau-specific strategy.' },
    ],
  },

  {
    name: 'PenAir Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Florida Panhandle and Alabama (community membership)',
    application_url: 'https://www.penair.org',
    path: 'Capital Access',
    products: [
      { name: 'PenAir FCU Visa Platinum', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: 630, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax. FL Panhandle/AL focused. Lower minimum score. Good EQ option for members in served area.' },
    ],
  },

  {
    name: 'Woodforest National Bank',
    type: 'Bank',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'No',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Primarily South and Midwest',
    application_url: 'https://www.woodforest.com',
    path: 'Capital Access',
    products: [
      { name: 'Woodforest Visa Platinum', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: 620, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax. South/Midwest community bank — often located inside Walmart stores. Lower minimum score. Accessible EQ option.' },
    ],
  },

  {
    name: 'Chartway Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Virginia, Utah, Texas (community membership)',
    application_url: 'https://www.chartway.com',
    path: 'Capital Access',
    products: [
      { name: 'Chartway Visa Platinum', type: 'Unsecured Card', bureau_pulled: 'Equifax', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: 640, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Equifax. VA/UT/TX focused. Solid Equifax addition for members in served states.' },
    ],
  },

  // ── TRANSUNION BUCKET ────────────────────────────────────────────────────────

  {
    name: 'NASA Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Yes',
    inquiry_reuse_window: '30 Days',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Nationwide (ACC membership accepted)',
    application_url: 'https://www.nasafcu.com',
    path: 'Capital Access',
    products: [
      { name: 'NASA FCU Platinum Visa', type: 'Unsecured Card', bureau_pulled: 'TransUnion', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: 660, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls TransUnion — confirmed community research (PILOT file). ACC membership accepted nationwide. Inquiry reuse within 30 days. Key TU stacking institution.' },
    ],
  },

  {
    name: 'Navy Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Yes',
    inquiry_reuse_window: 'Same Day',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Military, veterans, and family only',
    application_url: 'https://www.navyfederal.org',
    path: 'Both',
    products: [
      { name: 'Navy Federal cashRewards Credit Card', type: 'Unsecured Card', bureau_pulled: 'TransUnion', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Yes', minimum_credit_score: 620, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Lowest minimum score in database at 620. Pulls TransUnion. Same-day inquiry reuse. Preapproval available. Military/family membership required.' },
      { name: 'Navy Federal More Rewards American Express', type: 'Unsecured Card', bureau_pulled: 'TransUnion', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Yes', minimum_credit_score: 650, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Everyday rewards card. Pulls TransUnion. Stack with cashRewards on same-day inquiry for dual-line TU setup.' },
      { name: 'Navy Federal Secured Credit Card', type: 'Secured Card', bureau_pulled: 'TransUnion', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'Not Found', minimum_credit_score: null, deposit_amount: '$200–$5,000', annual_fee: 'None', graduation_potential: 'Yes', graduation_timeline: '3 months', existing_customer_required: 'No', strategy_notes: 'Fastest graduation path in database at 3 months. Pulls TransUnion. Military/family membership required.' },
    ],
  },

  {
    name: 'U.S. Bank',
    type: 'Bank',
    inquiry_reuse: 'Yes',
    inquiry_reuse_window: '30 Days',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.usbank.com',
    path: 'Capital Access',
    products: [
      { name: 'U.S. Bank Altitude Go Visa Signature', type: 'Unsecured Card', bureau_pulled: 'TransUnion', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Yes', minimum_credit_score: 660, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Dining/streaming rewards. Pulls TransUnion. Preapproval available online. Inquiry reuse within 30 days.' },
      { name: 'U.S. Bank Cash+ Visa Signature', type: 'Unsecured Card', bureau_pulled: 'TransUnion', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Yes', minimum_credit_score: 670, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: '5% on two chosen categories. Pulls TransUnion. Stack with Altitude Go on same inquiry for dual-card TU setup.' },
    ],
  },

  {
    name: 'Barclays',
    type: 'Bank',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'No',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.barclays.us',
    path: 'Capital Access',
    products: [
      { name: 'Barclays View Mastercard', type: 'Unsecured Card', bureau_pulled: 'TransUnion', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: 660, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls TransUnion. Barclays also issues co-branded cards (Wyndham, JetBlue) — all typically TU. Good TransUnion addition.' },
    ],
  },

  {
    name: 'Randolph-Brooks Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Texas',
    application_url: 'https://www.rbfcu.org',
    path: 'Capital Access',
    products: [
      { name: 'RBFCU Visa Platinum', type: 'Unsecured Card', bureau_pulled: 'TransUnion', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: 640, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls TransUnion. Large Texas CU. Good TU option for TX residents pairing with NASA FCU or U.S. Bank.' },
    ],
  },

  {
    name: 'Apple Card',
    type: 'Fintech',
    inquiry_reuse: 'No',
    inquiry_reuse_window: 'N/A',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide (requires iPhone)',
    application_url: 'https://www.apple.com/apple-card',
    path: 'Capital Access',
    products: [
      { name: 'Apple Card', type: 'Unsecured Card', bureau_pulled: 'TransUnion', reports_to: 'TransUnion', inquiry_reuse_eligible: 'No', preapproval_available: 'Yes', minimum_credit_score: 650, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Issued by Goldman Sachs. Pulls TransUnion — confirmed via Apple support page (Session 8). Soft pull preapproval in-app before hard pull. Requires iPhone. No inquiry reuse.' },
    ],
  },

  {
    name: 'Tower Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Maryland and DC area (community membership)',
    application_url: 'https://www.towerfcu.org',
    path: 'Capital Access',
    products: [
      { name: 'Tower FCU Visa Platinum', type: 'Unsecured Card', bureau_pulled: 'TransUnion', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: 640, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls TransUnion. MD/DC-area CU. Good TU stacking option for members in served area.' },
    ],
  },

  {
    name: 'BMO Harris Bank',
    type: 'Bank',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'No',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Midwest and West',
    application_url: 'https://www.bmo.com/en-us',
    path: 'Capital Access',
    products: [
      { name: 'BMO Cash Back Mastercard', type: 'Unsecured Card', bureau_pulled: 'TransUnion', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: 650, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls TransUnion. Midwest/West regional bank. Good TU addition for members in served states.' },
    ],
  },

  {
    name: 'Citizens Bank',
    type: 'Bank',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'No',
    soft_pull_available: 'Not Found',
    geographic_restrictions: 'Northeast and Midwest',
    application_url: 'https://www.citizensbank.com',
    path: 'Capital Access',
    products: [
      { name: 'Citizens Cash Back Plus World Mastercard', type: 'Unsecured Card', bureau_pulled: 'TransUnion', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: 660, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls TransUnion. Northeast/Midwest regional bank. Good TU option for members in served states.' },
    ],
  },

  {
    name: 'LendingClub',
    type: 'Fintech',
    inquiry_reuse: 'No',
    inquiry_reuse_window: 'N/A',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.lendingclub.com',
    path: 'Capital Access',
    products: [
      { name: 'LendingClub Personal Loan', type: 'Personal Loan', bureau_pulled: 'TransUnion', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'Yes', minimum_credit_score: 600, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls TransUnion. Soft pull pre-check before hard pull. Low minimum score at 600. Installment loan adds payment history diversity to TU profile.' },
    ],
  },

  {
    name: 'Connexus Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Yes',
    inquiry_reuse_window: '30 Days',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Nationwide (community membership)',
    application_url: 'https://www.connexuscu.org',
    path: 'Capital Access',
    products: [
      { name: 'Connexus Visa Platinum', type: 'Unsecured Card', bureau_pulled: 'TransUnion', reports_to: 'All 3', inquiry_reuse_eligible: 'Yes', preapproval_available: 'Not Found', minimum_credit_score: 640, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls TransUnion. Nationwide open membership. Inquiry reuse within 30 days. Good TU stacking option.' },
    ],
  },

  {
    name: 'Upgrade',
    type: 'Fintech',
    inquiry_reuse: 'No',
    inquiry_reuse_window: 'N/A',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.upgrade.com',
    path: 'Capital Access',
    products: [
      { name: 'Upgrade Card', type: 'Unsecured Card', bureau_pulled: 'TransUnion', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'Yes', minimum_credit_score: 580, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls TransUnion — confirmed via Upgrade website (Session 8). Soft pull pre-check before hard pull. Lowest approval threshold in TU card bucket at 580.' },
      { name: 'Upgrade Personal Loan', type: 'Personal Loan', bureau_pulled: 'TransUnion', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'Yes', minimum_credit_score: 560, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Lowest minimum score in TU personal loan category at 560. Preapproval before hard pull. Good for rebuilding + adding installment history.' },
    ],
  },

  {
    name: 'Lake Michigan Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Michigan and Florida',
    application_url: 'https://www.lmcu.org',
    path: 'Capital Access',
    products: [
      { name: 'LMCU Prime Platinum Visa', type: 'Unsecured Card', bureau_pulled: 'TransUnion', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Not Found', minimum_credit_score: 640, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls TransUnion — Session 8 tracker confirms TU, overrides PILOT Session 6 EQ entry. MI and FL members only.' },
    ],
  },

  // ── ALL 3 BUREAUS ────────────────────────────────────────────────────────────

  {
    name: 'Capital One',
    type: 'Bank',
    inquiry_reuse: 'No',
    inquiry_reuse_window: 'N/A',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.capitalone.com',
    path: 'Both',
    products: [
      { name: 'Capital One Quicksilver Cash Rewards', type: 'Unsecured Card', bureau_pulled: 'All 3', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'Yes', minimum_credit_score: 660, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls all 3 bureaus. Soft pull preapproval before hard pull. No inquiry reuse — best positioned standalone or after bureau-targeted stack is complete.' },
      { name: 'Capital One Venture Rewards', type: 'Unsecured Card', bureau_pulled: 'All 3', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'Yes', minimum_credit_score: 700, deposit_amount: 'N/A', annual_fee: '$95', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Premium travel rewards. Pulls all 3 bureaus. Time application after bureau strategy is complete to minimize triple-inquiry impact.' },
      { name: 'Capital One Secured Mastercard', type: 'Secured Card', bureau_pulled: 'All 3', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'Yes', minimum_credit_score: null, deposit_amount: '$49–$200', annual_fee: 'None', graduation_potential: 'Yes', graduation_timeline: '6–12 months', existing_customer_required: 'No', strategy_notes: 'Entry secured card. Reports to all 3 bureaus. Graduation path confirmed. Soft pull preapproval before hard pull.' },
    ],
  },

  {
    name: 'Synchrony Bank',
    type: 'Bank',
    inquiry_reuse: 'Not Verified',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.synchrony.com',
    path: 'Capital Access',
    products: [
      { name: 'Synchrony Premier World Mastercard', type: 'Unsecured Card', bureau_pulled: 'All 3', reports_to: 'All 3', inquiry_reuse_eligible: 'Not Verified', preapproval_available: 'Yes', minimum_credit_score: 660, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Synchrony general-purpose card. Pulls all 3 bureaus — vary by state. Preapproval available. Best used after bureau-targeted stack is complete.' },
    ],
  },

  // ── CREDIT BUILDER ───────────────────────────────────────────────────────────

  {
    name: 'Self Financial',
    type: 'Fintech',
    inquiry_reuse: 'No',
    inquiry_reuse_window: 'N/A',
    preapproval_available: 'No',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.self.inc',
    path: 'Credit Builder',
    products: [
      { name: 'Self Credit Builder Account', type: 'Credit Builder Loan', bureau_pulled: 'None', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'No', minimum_credit_score: null, deposit_amount: 'No upfront deposit required', annual_fee: 'None', graduation_potential: 'No', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'No hard pull — soft pull only. Reports installment payment history to all 3 bureaus. Start here if no credit history. Funds held in CD, released at end of term.' },
      { name: 'Self Visa Credit Card', type: 'Secured Card', bureau_pulled: 'None', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'No', minimum_credit_score: null, deposit_amount: 'Unlocked from Credit Builder savings', annual_fee: '$25', graduation_potential: 'No', graduation_timeline: 'N/A', existing_customer_required: 'Yes', strategy_notes: 'Secured card unlocked after 3+ months on-time Credit Builder payments. Adds revolving history alongside installment line. Requires existing Self account.' },
    ],
  },

  {
    name: 'Credit Strong',
    type: 'Fintech',
    inquiry_reuse: 'No',
    inquiry_reuse_window: 'N/A',
    preapproval_available: 'No',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.creditstrong.com',
    path: 'Credit Builder',
    products: [
      { name: 'Credit Strong Revolv', type: 'Credit Builder Loan', bureau_pulled: 'None', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'No', minimum_credit_score: null, deposit_amount: 'No upfront deposit required', annual_fee: 'None', graduation_potential: 'No', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'No hard pull. Reports installment history to all 3 bureaus. Alternative to Self with similar mechanics. Stack with Self for dual installment tradelines.' },
      { name: 'Credit Strong Build', type: 'Credit Builder Loan', bureau_pulled: 'None', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'No', minimum_credit_score: null, deposit_amount: 'No upfront deposit required', annual_fee: 'None', graduation_potential: 'No', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Larger loan amount option. Reports to all 3. Good for building deeper credit history faster with higher reported balance.' },
    ],
  },

  {
    name: 'SeedFi',
    type: 'Fintech',
    inquiry_reuse: 'No',
    inquiry_reuse_window: 'N/A',
    preapproval_available: 'No',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.seedfi.com',
    path: 'Credit Builder',
    products: [
      { name: 'SeedFi Borrow & Grow Plan', type: 'Credit Builder Loan', bureau_pulled: 'None', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'No', minimum_credit_score: null, deposit_amount: 'No upfront deposit required', annual_fee: 'None', graduation_potential: 'No', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Unique structure: portion of loan available immediately, rest held in savings. No hard pull. Reports to all 3 bureaus. Good for users who need small access to funds while building credit.' },
    ],
  },

  // ── Batch: builder fintechs, verified 2026-07-04 (all facts from official sites) ──

  {
    name: 'OpenSky (Capital Bank)',
    type: 'Fintech',
    inquiry_reuse: 'No',
    inquiry_reuse_window: 'N/A',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.openskycc.com',
    path: 'Credit Builder',
    verified_date: '2026-07-04',
    products: [
      { name: 'OpenSky Secured Visa', type: 'Secured Card', bureau_pulled: 'None', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'No', minimum_credit_score: null, deposit_amount: '$200 minimum (sets your limit)', annual_fee: '$35', graduation_potential: 'Yes', graduation_timeline: '6–12 months (limit increases / better products)', existing_customer_required: 'No', strategy_notes: 'NO credit check at all — approval does not touch your reports. Reports to all 3 bureaus. One of the few true zero-inquiry entry points. Verified on OpenSky official site 7/2026.' },
      { name: 'OpenSky Plus Secured Visa', type: 'Secured Card', bureau_pulled: 'None', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'No', minimum_credit_score: null, deposit_amount: '$300 minimum (sets your limit)', annual_fee: 'None', graduation_potential: 'Yes', graduation_timeline: '6–12 months (limit increases / better products)', existing_customer_required: 'No', strategy_notes: 'No annual fee version — $300 minimum deposit instead of $200. Same zero-credit-check approval, same all-3 reporting. Verified on OpenSky official site 7/2026.' },
    ],
  },

  {
    name: 'Chime',
    type: 'Fintech',
    inquiry_reuse: 'No',
    inquiry_reuse_window: 'N/A',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.chime.com/credit-builder/',
    path: 'Credit Builder',
    verified_date: '2026-07-04',
    products: [
      { name: 'Secured Chime Visa (Credit Builder)', type: 'Secured Card', bureau_pulled: 'None', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'No', minimum_credit_score: null, deposit_amount: 'No minimum — funded from your Chime account', annual_fee: 'None', graduation_potential: 'No', graduation_timeline: 'N/A', existing_customer_required: 'Yes', strategy_notes: 'No credit check, no annual fee, no interest. Requires a Chime account first. Reports to all 3 bureaus. Verified on Chime official site 7/2026.' },
    ],
  },

  {
    name: 'Armed Forces Bank',
    type: 'Bank',
    inquiry_reuse: 'No',
    inquiry_reuse_window: 'N/A',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Nationwide (anyone can apply — not military-only)',
    application_url: 'https://www.afbank.com/personal/credit-builder',
    path: 'Credit Builder',
    verified_date: '2026-07-04',
    products: [
      { name: 'Credit Builder Secured Visa', type: 'Secured Card', bureau_pulled: 'None', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'No', minimum_credit_score: null, deposit_amount: '$300–$3,000 (equals your limit)', annual_fee: 'None ($5/quarter unless enrolled in eStatements)', graduation_potential: 'Yes', graduation_timeline: 'Upgrade to unsecured with good performance', existing_customer_required: 'No', strategy_notes: 'NO credit check per official site, and despite the name anyone can apply. 25.99% fixed APR. Reports to all 3. Enroll in eStatements to avoid the $5 quarterly fee. Verified on AFB official site 7/2026.' },
    ],
  },

  {
    name: 'Arro (Community Federal Savings Bank)',
    type: 'Fintech',
    inquiry_reuse: 'No',
    inquiry_reuse_window: 'N/A',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.arrofinance.com',
    path: 'Credit Builder',
    verified_date: '2026-07-04',
    products: [
      { name: 'Arro Card', type: 'Secured Card', bureau_pulled: 'None', reports_to: 'Experian and Equifax ONLY (no TransUnion)', inquiry_reuse_eligible: 'No', preapproval_available: 'No', minimum_credit_score: null, deposit_amount: 'None', annual_fee: 'None published', graduation_potential: 'N/A', graduation_timeline: 'Limit grows in-app (starts ~$300)', existing_customer_required: 'No', strategy_notes: 'No hard check, no deposit, starts around $300 and grows with on-time payment + in-app financial lessons. IMPORTANT: reports to Experian and Equifax only — will NOT build your TransUnion file. Verified on Arro official site 7/2026.' },
    ],
  },

  {
    name: 'Current',
    type: 'Fintech',
    inquiry_reuse: 'No',
    inquiry_reuse_window: 'N/A',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://current.com',
    path: 'Credit Builder',
    verified_date: '2026-07-04',
    products: [
      { name: 'Build Card', type: 'Secured Card', bureau_pulled: 'None', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'No', minimum_credit_score: null, deposit_amount: 'None — backed by your Current spending balance', annual_fee: 'None', graduation_potential: 'No', graduation_timeline: 'N/A', existing_customer_required: 'Yes', strategy_notes: 'No credit check. Spending balance secures the card — no separate deposit to lock up. Requires a funded Current account. Reports to all 3 bureaus. Verified via Current official support docs 7/2026.' },
    ],
  },

  // ── Alternative tradelines (rent reporting + subscription builders), verified 2026-07-04 ──

  {
    name: 'RentReporters',
    type: 'Fintech',
    inquiry_reuse: 'No',
    inquiry_reuse_window: 'N/A',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.rentreporters.com',
    path: 'Credit Builder',
    verified_date: '2026-07-04',
    products: [
      { name: 'Rent Reporting Service', type: 'Alternative Tradeline', bureau_pulled: 'None', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'No', minimum_credit_score: null, deposit_amount: 'N/A', annual_fee: '$10.95/month + $94.95 setup', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Turns the rent you ALREADY pay into a primary tradeline — no new debt, no credit check, no landlord signup needed. The big move: reports up to 4 YEARS of past rent, instantly adding an AGED account to your file (age of history is a top scoring factor). Verified on RentReporters official site 7/2026.' },
    ],
  },

  {
    name: 'Grow Credit',
    type: 'Fintech',
    inquiry_reuse: 'No',
    inquiry_reuse_window: 'N/A',
    preapproval_available: 'No',
    soft_pull_available: 'No',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://growcredit.com',
    path: 'Credit Builder',
    verified_date: '2026-07-04',
    products: [
      { name: 'Grow Credit Mastercard (subscription builder)', type: 'Alternative Tradeline', bureau_pulled: 'None', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'No', minimum_credit_score: null, deposit_amount: 'None', annual_fee: 'Plans from $3.99–$12.99/month (limits $17–$150/mo)', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'A limited Mastercard that only pays your subscriptions (Netflix, Spotify, phone bill) and reports the payments to all 3 bureaus. No credit check, no deposit. Easy extra primary tradeline from bills you already pay. Verified on Grow Credit official site 7/2026.' },
    ],
  },
]

export async function seedDatabase(): Promise<void> {
  const pool = getPool()
  const { rows } = await pool.query('SELECT COUNT(*)::int as count FROM institutions')
  const existing = Number(rows[0].count)
  if (existing > 0) {
    // SEED_MODE=replace lets an already-seeded database (e.g. production with old
    // pilot data) sync to the current seed. Set it for ONE deploy, then remove it.
    if (process.env.SEED_MODE === 'replace') {
      console.log(`SEED_MODE=replace — clearing ${existing} institutions and reseeding.`)
      await pool.query('DELETE FROM products')
      await pool.query('DELETE FROM institutions')
    } else {
      console.log(`Database already has ${existing} institutions. Skipping seed.`)
      return
    }
  }

  for (const inst of allInstitutions) {
    const instDate = inst.verified_date ?? VERIFIED_DATE
    const { rows: instRows } = await pool.query(`
      INSERT INTO institutions (name, type, inquiry_reuse, inquiry_reuse_window, preapproval_available,
        soft_pull_available, geographic_restrictions, application_url, path, last_verified_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id
    `, [
      inst.name, inst.type, inst.inquiry_reuse, inst.inquiry_reuse_window,
      inst.preapproval_available, inst.soft_pull_available, inst.geographic_restrictions,
      inst.application_url, inst.path, instDate,
    ])
    const institutionId = instRows[0].id

    for (const p of inst.products) {
      await pool.query(`
        INSERT INTO products (institution_id, name, type, bureau_pulled, reports_to, inquiry_reuse_eligible,
          preapproval_available, minimum_credit_score, deposit_amount, annual_fee, graduation_potential,
          graduation_timeline, existing_customer_required, last_verified_date, strategy_notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      `, [
        institutionId, p.name, p.type, p.bureau_pulled, p.reports_to,
        p.inquiry_reuse_eligible, p.preapproval_available, p.minimum_credit_score,
        p.deposit_amount, p.annual_fee, p.graduation_potential, p.graduation_timeline,
        p.existing_customer_required, instDate, p.strategy_notes,
      ])
    }
  }
  console.log(`Seeded ${allInstitutions.length} institutions.`)
}

export async function seedProductUpdates(): Promise<void> {
  // No-op: superseded by full re-seed via allInstitutions array above.
}

export async function seedAdmin(): Promise<void> {
  const pool = getPool()
  const { rows } = await pool.query("SELECT id FROM users WHERE role = 'admin'")
  if (rows.length > 0) return

  const password = process.env.ADMIN_PASSWORD || 'admin123'
  if (!process.env.ADMIN_PASSWORD) {
    console.warn('WARNING: ADMIN_PASSWORD not set — using insecure dev default. Set ADMIN_PASSWORD before deploying.')
  }
  const hash = await bcrypt.hash(password, 10)
  await pool.query(`
    INSERT INTO users (email, password_hash, role, subscription_status)
    VALUES ($1, $2, 'admin', 'active')
  `, ['admin@intelligentfunding.org', hash])

  console.log('Admin created: admin@intelligentfunding.org (password: ADMIN_PASSWORD env, or dev default)')
}

// ── Wins Wall seed ────────────────────────────────────────────────────────────
// Real, anonymized approval datapoints sourced from our research logs (myFICO /
// community reports gathered during the institution build). These make the wall
// look alive on day one; real member submissions join them as they're approved.
// Tagged with SEED_WIN_TAG so a reseed only ever touches the seeded set — never a
// real user's submission. Bureau is left null where our data is unverified (honest).
const SEED_WIN_TAG = 'seed@intelligentfunding.org'

type WinRow = {
  institution_name: string
  product_name: string | null
  bureau_pulled: string | null
  credit_score_band: string | null
  credit_limit: string | null
  state: string | null
  inquiry_reuse_observed: string | null
  notes: string
  reported: string  // report/verification date (YYYY-MM-DD) — shown on the card so nobody trusts a stale datapoint
}

const communityWins: WinRow[] = [
  { institution_name: 'Arvest Bank', product_name: 'True Rate Card', bureau_pulled: 'TransUnion', credit_score_band: '660–699', credit_limit: null, state: 'KS', inquiry_reuse_observed: null, notes: 'Approved for the True Rate card. They pulled TransUnion, score was right around 680.', reported: '2026-06-28' },
  { institution_name: 'USAA', product_name: 'Rate Advantage Visa', bureau_pulled: 'Experian', credit_score_band: null, credit_limit: null, state: null, inquiry_reuse_observed: null, notes: 'Approved. USAA pulled Experian (their Bankcard Score 3). Military-family membership.', reported: '2026-07-01' },
  { institution_name: 'SECU (Maryland)', product_name: 'Visa Signature', bureau_pulled: 'Equifax', credit_score_band: '660–699', credit_limit: null, state: 'MD', inquiry_reuse_observed: 'Yes', notes: 'Approved on Equifax. Went back for a second card and they reused the same pull — two tradelines, one inquiry.', reported: '2026-06-15' },
  { institution_name: 'Interior Federal Credit Union', product_name: 'Visa Platinum Rewards', bureau_pulled: 'Equifax', credit_score_band: '700–739', credit_limit: '$17,500', state: null, inquiry_reuse_observed: null, notes: 'Rewards card approval on Equifax, score 701. Generous starting limit.', reported: '2026-05-22' },
  { institution_name: 'AOD Federal Credit Union', product_name: 'Signature Visa', bureau_pulled: 'Equifax', credit_score_band: null, credit_limit: null, state: 'AL', inquiry_reuse_observed: null, notes: 'Approved on Equifax FICO 5 — the "unicorn card" everybody on the forums talks about.', reported: '2026-06-30' },
  { institution_name: 'Signal Financial FCU', product_name: 'Signature Visa', bureau_pulled: 'TransUnion', credit_score_band: null, credit_limit: null, state: null, inquiry_reuse_observed: null, notes: 'Credit product approval — they pull TransUnion for membership and cards.', reported: '2026-06-19' },
  { institution_name: 'Northwest Federal Credit Union', product_name: 'NOW Plus Rewards Visa', bureau_pulled: 'Equifax', credit_score_band: null, credit_limit: null, state: 'VA', inquiry_reuse_observed: null, notes: 'Card approval on Equifax. They use EQ for cards and auto both.', reported: '2026-05-30' },
  { institution_name: 'Justice Federal Credit Union', product_name: 'Visa Platinum Rewards', bureau_pulled: 'Equifax', credit_score_band: null, credit_limit: null, state: null, inquiry_reuse_observed: null, notes: 'Platinum Rewards approved, Equifax pull. 11.90% fixed rate — hard to beat.', reported: '2026-06-24' },
  { institution_name: 'M&T Bank', product_name: 'Visa Signature', bureau_pulled: 'Experian', credit_score_band: '700–739', credit_limit: null, state: null, inquiry_reuse_observed: null, notes: 'Approved, Experian pull. They occasionally hit TransUnion but mine was EX.', reported: '2026-07-03' },
  { institution_name: 'Prosper', product_name: 'Personal Loan', bureau_pulled: 'TransUnion', credit_score_band: null, credit_limit: '$15,000', state: null, inquiry_reuse_observed: null, notes: 'Personal loan funded. Soft-pull rate check first, then TransUnion for the real application.', reported: '2026-06-11' },
  { institution_name: 'Discover', product_name: 'Discover it Cash Back', bureau_pulled: null, credit_score_band: '660–699', credit_limit: null, state: 'TX', inquiry_reuse_observed: null, notes: 'Pre-approved offer, soft pull, no ding. First-year cashback match sealed it.', reported: '2026-07-04' },
  { institution_name: 'Apple Federal Credit Union', product_name: 'Visa Platinum', bureau_pulled: null, credit_score_band: null, credit_limit: null, state: 'VA', inquiry_reuse_observed: null, notes: 'Platinum card approved — solid low rate for a starter card.', reported: '2026-06-26' },
  { institution_name: 'Credit One Bank', product_name: 'Platinum Visa', bureau_pulled: null, credit_score_band: '580–619', credit_limit: null, state: null, inquiry_reuse_observed: null, notes: 'Rebuild approval. Prequalified with no credit impact first, then approved.', reported: '2026-06-08' },
  { institution_name: 'AgFed Credit Union', product_name: 'Visa Platinum', bureau_pulled: 'Equifax', credit_score_band: null, credit_limit: null, state: null, inquiry_reuse_observed: null, notes: 'Equifax credit union. Approved and building from here.', reported: '2026-07-02' },
]

export async function seedWins(): Promise<void> {
  const pool = getPool()
  // Only ever manage the seeded set — never touch a real user's submission.
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int as count FROM submissions WHERE email = $1', [SEED_WIN_TAG]
  )
  const existing = Number(rows[0].count)
  if (existing > 0) {
    if (process.env.SEED_MODE === 'replace') {
      await pool.query('DELETE FROM submissions WHERE email = $1', [SEED_WIN_TAG])
    } else {
      return
    }
  }
  for (const w of communityWins) {
    await pool.query(`
      INSERT INTO submissions (institution_name, product_name, bureau_pulled, approved,
        credit_score_band, credit_limit, state, inquiry_reuse_observed, notes, email, status, created_at)
      VALUES ($1,$2,$3,'Yes',$4,$5,$6,$7,$8,$9,'approved',$10)
    `, [
      w.institution_name, w.product_name, w.bureau_pulled, w.credit_score_band,
      w.credit_limit, w.state, w.inquiry_reuse_observed, w.notes, SEED_WIN_TAG, w.reported,
    ])
  }
  console.log(`Seeded ${communityWins.length} community wins.`)
}

// ── Business funding seed (the third path) ────────────────────────────────────
// Institution → products, mirroring the consumer model. All criteria verified
// against each institution's OWN official site 2026-07-11 (BUSINESS-VERIFIED-TIER-A.md
// + BANKS-TO-CHECK-2026-07.md). "Not published" = the lender does not state it.
type BizProductRow = {
  name: string; product_type: string
  docs_required?: string; personal_guarantee?: string; time_in_business?: string
  min_fico?: string; credit_pull?: string; reports_to?: string
  funding_amount?: string; revenue_required?: string; notes?: string
}
type BizInstitutionRow = {
  name: string; type: string; access: string; geographic_restrictions: string
  application_url: string; strategy_notes?: string; products: BizProductRow[]
}

const businessInstitutions: BizInstitutionRow[] = [
  {
    name: 'Bluevine', type: 'Fintech', access: 'Open apply', geographic_restrictions: 'US except NV, ND, SD',
    application_url: 'https://app.bluevine.com/signup/',
    strategy_notes: 'LOC issued by Celtic Bank; banking by Coastal Community Bank. For established businesses, not brand-new LLCs.',
    products: [
      { name: 'Business Line of Credit', product_type: 'Line of Credit', docs_required: 'Low-doc (3 months bank statements or bank connection)', personal_guarantee: 'PG required', time_in_business: '12+ months', min_fico: '625+', credit_pull: 'Soft at application (hard only if you accept an offer)', reports_to: 'Experian (business)', funding_amount: 'Up to $250,000', revenue_required: '$10,000/month' },
    ],
  },
  {
    name: 'Novo', type: 'Fintech', access: 'Existing Novo checking customers (account active 6+ months)', geographic_restrictions: 'US',
    application_url: 'https://app.novo.co/login',
    strategy_notes: 'Funding eligibility is earned through Novo checking activity, open the account first and run your deposits through it.',
    products: [
      { name: 'Novo Business Funding', product_type: 'Merchant Cash Advance', docs_required: 'None (based on Novo account activity)', time_in_business: 'Novo account held 6+ months', funding_amount: 'Based on account activity', notes: 'CAUTION: this is a Merchant Cash Advance repaid within ~6 months, so cost of capital runs high. Know the terms before you draw.' },
      { name: 'Novo Business Credit Card', product_type: 'Business Credit Card', credit_pull: 'Soft / no-impact eligibility check', funding_amount: 'Limit set at approval', notes: 'Up to 2% cash back, $0 annual fee Mastercard.' },
    ],
  },
  {
    name: 'Grasshopper Bank', type: 'Bank', access: 'Existing Grasshopper clients (open an account, season it 6 months)', geographic_restrictions: 'Nationwide',
    application_url: 'https://start.grasshopper.bank/product/innovatorTermLoan',
    strategy_notes: 'A true relationship-lending play: open the business checking now, feed it deposits, and the loan pre-fills from your account data.',
    products: [
      { name: 'Innovator Term Loan', product_type: 'Term Loan', docs_required: 'No/low-doc (pre-filled from your deposit account)', personal_guarantee: 'PG required', time_in_business: '1+ year AND a Grasshopper account held 6+ months', credit_pull: 'Soft pull', funding_amount: '$10,000 to $200,000', notes: 'Fixed 36-month term, no prepayment penalty, 1% origination.' },
    ],
  },
  {
    name: 'Backd', type: 'Fintech', access: 'Open apply', geographic_restrictions: 'US',
    application_url: 'https://www.backd.com/',
    strategy_notes: 'Fast (about 1 business day) but higher cost of capital. Term loan originated by FinWise Bank.',
    products: [
      { name: 'Business Line of Credit', product_type: 'Line of Credit', docs_required: 'Low-doc (bank-statement model)', time_in_business: '2 years (per Backd)', credit_pull: 'Soft pull (no impact)', funding_amount: '$50,000 to $1,000,000' },
      { name: 'Business Term Loan', product_type: 'Term Loan', docs_required: 'Low-doc (bank-statement model)', credit_pull: 'Soft pull (no impact)', funding_amount: '$50,000 to $2,000,000', notes: 'Terms up to 24 months.' },
    ],
  },
  {
    name: 'Highbeam', type: 'Fintech', access: 'Open apply (ecommerce / DTC brands)', geographic_restrictions: 'US',
    application_url: 'https://www.highbeam.com/capital',
    strategy_notes: 'Built for ecommerce brands. The standout: business credit with NO personal guarantee and no hard pull, sized from your store payout revenue.',
    products: [
      { name: 'Revolving Line of Credit', product_type: 'Line of Credit', docs_required: 'Low-doc (connect your online stores)', personal_guarantee: 'EIN-only (NO personal guarantee)', credit_pull: 'No hard credit pull', funding_amount: 'Sized from ecommerce payout revenue', notes: 'Flat daily-calculated APR, no prepayment penalty.' },
      { name: 'Highbeam Advance', product_type: 'Cash Advance', docs_required: 'Low-doc (connect your online stores)', personal_guarantee: 'EIN-only (NO personal guarantee)', credit_pull: 'No hard credit pull', funding_amount: 'Flexible draws against payouts' },
    ],
  },
  {
    name: 'Loot', type: 'Fintech', access: 'Open apply (~5 minutes)', geographic_restrictions: 'US',
    application_url: 'https://app.getloot.com/sign-up',
    strategy_notes: 'Reads your business cash flow through a connected bank account. On-time repayment earns rewards and a 50% early-payoff fee discount.',
    products: [
      { name: 'Business Line of Credit', product_type: 'Line of Credit', docs_required: 'Low-doc (connect your bank account)', time_in_business: '1 year', min_fico: 'None', credit_pull: 'Soft pull (no impact)', funding_amount: 'Up to $100,000', revenue_required: '$200,000/year' },
    ],
  },
  {
    name: 'Jumpstart Finance', type: 'Fintech', access: 'Submit a deal for review', geographic_restrictions: 'US',
    application_url: 'https://www.jumpstartfinance.com/submit-deal',
    strategy_notes: 'Finances buying an existing business or launching a franchise, not a revolving line. Lender of record: Little Horn State Bank. Underwrites around the operator and the target business.',
    products: [
      { name: 'SMB Acquisition Loan', product_type: 'Acquisition Loan', personal_guarantee: 'Not published (primarily unsecured)', funding_amount: '$50,000 to $500,000 (to $2M structured)', notes: 'For purchasing existing cash-flowing businesses. Non-SBA.' },
      { name: 'SMB Startup Loan', product_type: 'Startup Loan', time_in_business: 'Pre-revenue friendly (startups)', funding_amount: '$50,000 to $500,000', notes: 'Franchises and new business launches.' },
    ],
  },
  {
    name: 'QuickBooks Capital', type: 'Fintech', access: 'Active QuickBooks users (apply inside QuickBooks)', geographic_restrictions: 'US',
    application_url: 'https://quickbooks.intuit.com/business-banking/loans/',
    strategy_notes: 'Loans issued by WebBank, underwritten from your QuickBooks data. No origination, prepayment, or late fees. No bankruptcies in the last 2 years.',
    products: [
      { name: 'QuickBooks Term Loan', product_type: 'Term Loan', docs_required: 'Low/no-doc (uses your QuickBooks data)', credit_pull: 'Soft pull (personal)' },
      { name: 'QuickBooks Line of Credit', product_type: 'Line of Credit', docs_required: 'Low/no-doc (uses your QuickBooks data)', credit_pull: 'Soft pull (personal)', notes: 'Can also advance against eligible outstanding invoices ($258+, sent through QuickBooks).' },
    ],
  },
  {
    name: 'South End Capital', type: 'Bank', access: 'Open apply / prequalify online', geographic_restrictions: 'Nationwide (all 50 states + DC)',
    application_url: 'https://southendcapital.com/',
    strategy_notes: 'A division of Stearns Bank. Six programs, each with its own rules, the Revolving Credit Line and Fast Capital are the accessible doors (no FICO minimum).',
    products: [
      { name: 'Revolving Business Credit Line', product_type: 'Line of Credit', docs_required: 'Low-doc (tax returns usually not required)', time_in_business: '6+ months', min_fico: 'No minimum', credit_pull: 'Prequalify available (pull type not stated)', funding_amount: '$1,000 to $500,000+', revenue_required: '$14,000/month' },
      { name: 'Fast Capital (Working Capital)', product_type: 'Working Capital', time_in_business: '6+ months', min_fico: 'No minimum', funding_amount: '$1,000 to $500,000+', revenue_required: '$14,000/month' },
      { name: 'Business Term Loan', product_type: 'Term Loan', docs_required: 'Low-doc', time_in_business: '2+ years', min_fico: '660', funding_amount: '$20,000 to $500,000', revenue_required: '$20,000/month', notes: 'Fixed 12-year term, not SBA.' },
      { name: 'Equipment Financing', product_type: 'Equipment Financing', min_fico: 'No set minimum', funding_amount: '$30,000 to $5,000,000', notes: 'App-only up to $350K; 0%/100% financing options; startups OK with 3 months bank statements.' },
      { name: 'No/Low-Doc Commercial Real Estate', product_type: 'Commercial Real Estate', docs_required: 'No income doc', min_fico: '690', funding_amount: '$50,000 to $1,000,000', notes: '50% max LTV; app-only up to $500K; investment property only.' },
      { name: 'SBA 7(a)', product_type: 'SBA Loan', docs_required: 'Full-doc (personal + business tax returns)', min_fico: '680', funding_amount: '$150,000 to $5,000,000', notes: 'Startup financing available.' },
    ],
  },
  {
    name: 'Fundbox', type: 'Fintech', access: 'Open apply (~3 minutes)', geographic_restrictions: 'US',
    application_url: 'https://fundbox.com/signup',
    strategy_notes: 'One of the most accessible doors on this list: 3 months in business, no published FICO minimum, soft pull. Needs a business checking account. Integrates with Stripe, QuickBooks, FreshBooks, Nav.',
    products: [
      { name: 'Business Line of Credit', product_type: 'Line of Credit', docs_required: 'Low/no-doc (connect your business bank account)', time_in_business: '3+ months', min_fico: 'None published', credit_pull: 'Soft pull (no impact)', funding_amount: 'Up to $250,000', revenue_required: '$30,000+/year' },
    ],
  },
  {
    name: 'Ascendus', type: 'CDFI', access: 'Open apply (connect with a local partner first)', geographic_restrictions: 'Nationwide except Vermont (49 states)',
    application_url: 'https://www.ascendus.org/apply/',
    strategy_notes: 'Nonprofit CDFI, mission-aligned (formerly Accion East). Files a UCC lien on the LOC. The Get Ready line is a Special Purpose Credit Program built for startups and credit-building.',
    products: [
      { name: 'Business Line of Credit', product_type: 'Line of Credit', docs_required: 'Low-doc (minimum paperwork)', time_in_business: '1+ year', min_fico: '575+', funding_amount: 'Up to $50,000', notes: '9.99% to 15.99%. Debt conditions: under $3,000 past-due, bankruptcy discharged 1-2+ years, no repo/foreclosure in 2 years.' },
      { name: 'Business Term Loan', product_type: 'Term Loan', docs_required: 'Low-doc', min_fico: '575+', funding_amount: 'Up to $100,000', notes: 'Nationwide except Vermont.' },
      { name: 'Get Ready Line of Credit', product_type: 'Credit Builder', time_in_business: 'Startups OK (6 months of consistent revenue)', min_fico: 'None (no FICO minimum)', funding_amount: 'Starts at $500, grows to $5,000', notes: 'Special Purpose Credit Program: builds business credit with on-time repayment plus a credit action plan.' },
    ],
  },
  {
    name: 'Community Bank NA', type: 'Bank', access: 'Open apply (online)', geographic_restrictions: 'Bank footprint NY/PA/VT/NH; card applications online',
    application_url: 'https://cbna.com/business/credit-cards',
    strategy_notes: 'Business Edition cards are FNBO-issued. The secured card is a rare business credit-BUILDER, deposit-backed like a consumer secured card, but for your LLC.',
    products: [
      { name: 'Business Edition Mastercard with Absolute Rewards', product_type: 'Business Credit Card', funding_amount: 'Limit set at approval', notes: '0% intro APR for 12 billing cycles, 1.5x points per $1, no annual fee.' },
      { name: 'Business Edition Mastercard (Ultra-Low Intro)', product_type: 'Business Credit Card', funding_amount: 'Limit set at approval', notes: '0% intro APR for 18 BILLING CYCLES, no annual fee. The longest 0% runway we have verified on a business card.' },
      { name: 'Business Edition Secured Mastercard', product_type: 'Credit Builder', funding_amount: 'Deposit $2,000 to $10,000 sets the limit', notes: 'Secured business credit-builder card, 1x points, no annual fee.' },
    ],
  },
  {
    name: 'Verity Credit Union', type: 'Credit Union', access: 'Membership: live/work/worship in Washington state; WA-formed business', geographic_restrictions: 'Washington state only',
    application_url: 'https://www.veritycu.com/business-credit-cards',
    products: [
      { name: 'Visa Business Signature Rewards', product_type: 'Business Credit Card', funding_amount: 'Limit set at approval', notes: '0% intro APR for 12 months, then 13.99% to 17.99%. No annual fee, 1.5 points per dollar, 10,000 bonus points ($1,000 spend in 90 days).' },
    ],
  },
  {
    name: 'Fulton Bank', type: 'Bank', access: 'Open apply', geographic_restrictions: 'PA/NJ/MD/DE/VA regional footprint',
    application_url: 'https://www.fultonbank.com/Small-Business/Banking/Small-Business-Credit-Cards',
    strategy_notes: 'Card suite is issued through the Elan agent-card program. Intro-rate lengths are not published on the site, confirm the current offer before applying.',
    products: [
      { name: 'Visa Business Cash Preferred', product_type: 'Business Credit Card', notes: '3% cash back on gas, EV charging, cell service, office supplies, and dining; 1% everything else. $25 cash back after first purchase; $100 annual software credit. Low intro rate advertised (length not published).' },
      { name: 'Visa Business Zero+ Card', product_type: 'Business Credit Card', notes: '"Great low introductory rate for an extended time" (exact 0% length not published, confirm before applying). 5% cash back on travel booked in the Rewards Center.' },
      { name: 'Smart Business Rewards Visa', product_type: 'Business Credit Card', notes: '2x points in your top two spend categories, 20,000 bonus points ($500 spend in 90 days).' },
      { name: 'Visa Business Real Rewards', product_type: 'Business Credit Card', notes: '1.5x points per $1, no caps, 2,500 bonus points after first purchase.' },
      { name: 'Visa Business Card', product_type: 'Business Credit Card', funding_amount: 'Credit limits $1,000 to $500,000', notes: 'The straightforward card: company-level limit controls, online program management.' },
    ],
  },
  // ── Batch 1 from our own consumer catalog (verified 2026-07-12, BUSINESS-FROM-OUR-85.md) ──
  {
    name: 'U.S. Bank', type: 'Bank', access: 'Open apply (online)', geographic_restrictions: 'Nationwide',
    application_url: 'https://www.usbank.com/business-banking/business-credit-cards.html',
    strategy_notes: 'The strongest 0% business-card lineup we have verified: two $0-fee cards with 0% on purchases AND balance transfers for 12 billing cycles.',
    products: [
      { name: 'Business Triple Cash Rewards Visa', product_type: 'Business Credit Card', funding_amount: 'Limit set at approval', notes: '0% intro APR on purchases and balance transfers for 12 billing cycles, then 17.24% to 26.24%. No annual fee. 3% cash back on gas/EV, office supplies, cell service, restaurants; $750 bonus ($6,000 in 180 days); $100 annual software credit.' },
      { name: 'Business Shield Visa', product_type: 'Business Credit Card', funding_amount: 'Limit set at approval', notes: '0% intro APR on purchases and balance transfers for 12 billing cycles, then 16.24% to 25.24%. No annual fee. 5% back on Travel Center bookings, purchase security coverage.' },
      { name: 'Business Altitude Connect Visa Signature', product_type: 'Business Credit Card', notes: '$0 intro annual fee first year (then $95). 4X on travel and gas up to $150k/yr, 2X dining and cell; 75,000-point bonus ($6,000 in 180 days).' },
      { name: 'Business Leverage Visa Signature', product_type: 'Business Credit Card', notes: '$0 first year (then $95). 2X points automatically in your top two spend categories; 60,000-point bonus ($6,000 in 120 days).' },
      { name: 'Business Altitude Power Visa Signature', product_type: 'Business Credit Card', notes: '$195 annual fee. 2X on everything, 2.5X mobile wallet, 6X Travel Center hotels/cars; 75,000-point bonus ($10,000 in 120 days).' },
    ],
  },
  {
    name: 'M&T Bank', type: 'Bank', access: 'Open apply', geographic_restrictions: 'East Coast footprint',
    application_url: 'https://www.mtb.com/business/business-financing/business-credit-card-options',
    strategy_notes: 'Lowest post-intro APR floor we have verified on a business card (13.74%). Also offers SBA loans, business LOCs, term loans, and equipment financing.',
    products: [
      { name: 'M&T Business Credit Card', product_type: 'Business Credit Card', notes: '0% intro APR for 12 billing cycles, then 13.74% to 20.74% variable. No annual fee, no rewards, employee cards. The low-rate workhorse.' },
      { name: 'M&T Business Rewards Credit Card', product_type: 'Business Credit Card', notes: '0% intro APR for 9 billing cycles, then 16.74% to 23.74%. No annual fee, unlimited 1.5% cash back plus $250 bonus.' },
    ],
  },
  {
    name: 'PNC Bank', type: 'Bank', access: 'Open apply (online for Cash Rewards)', geographic_restrictions: 'Nationwide',
    application_url: 'https://www.pnc.com/en/small-business/borrowing/business-credit-cards.html',
    strategy_notes: 'Also offers business LOCs, business loans, SBA, vehicle finance, and commercial real estate (details pending a deeper pass).',
    products: [
      { name: 'PNC Cash Rewards Visa Signature Business', product_type: 'Business Credit Card', notes: '0% intro APR on purchases for 9 billing cycles. No annual fee, unlimited 1.5% cash back, $400 statement credit after only $3,000 in the first 3 cycles. Free employee cards.' },
      { name: 'PNC BusinessOptions Visa Signature', product_type: 'Business Credit Card', notes: 'Revolving or pay-in-full options, 3 rewards choices, no program fees. $800 statement credit after $15,000 in the first 3 cycles. Contact-based application.' },
    ],
  },
  {
    name: 'Huntington Bank', type: 'Bank', access: 'Branch / business banker application (no online apply)', geographic_restrictions: 'Midwest footprint',
    application_url: 'https://www.huntington.com/SmallBusiness/voice-business-credit-card',
    products: [
      { name: 'Voice Business Credit Card', product_type: 'Business Credit Card', notes: '4% cash back in one category you choose (from 10) on the first $7,000/quarter, 1% after. No annual fee, no foreign transaction fees, Late Fee Grace, free employee cards with spend controls.' },
    ],
  },
  {
    name: 'Arvest Bank', type: 'Bank', access: 'Open apply', geographic_restrictions: 'AR / KS / MO / OK',
    application_url: 'https://www.arvest.com/business/borrow/credit-cards/disclosure',
    products: [
      { name: 'Arvest Business Visa (Elite / Premier)', product_type: 'Business Credit Card', notes: '0% intro APR for 6 billing cycles on purchases AND balance transfers with $0 balance-transfer fee, then 13.74% (Elite) or 17.74% (Premier), Prime-based. No annual fee, no penalty APR.' },
    ],
  },
  {
    name: 'Navy Federal Credit Union', type: 'Credit Union', access: 'Membership: military/veterans/DoD + family; business membership required first', geographic_restrictions: 'Nationwide (membership-gated)',
    application_url: 'https://www.navyfederal.org/services/business/credit-cards.html',
    products: [
      { name: 'GO BIZ Rewards Card (Visa or Mastercard)', product_type: 'Business Credit Card', personal_guarantee: 'Owner/guarantor income and credit reviewed (PG terms verify)', notes: 'No annual fee, unusually tight 16.65% to 18.00% APR range (a real ceiling), 1X points unlimited, no foreign transaction fees. Single owner applies online; multi-owner is a paper form with 7-10 day decision.' },
    ],
  },
  {
    name: 'SECU Maryland', type: 'Credit Union', access: 'Membership (open beyond MD via association); business banker application', geographic_restrictions: 'Maryland-based',
    application_url: 'https://www.secumd.org/business/business-lending/business-credit/',
    products: [
      { name: 'Business Cash Back Visa', product_type: 'Business Credit Card', notes: 'No annual fee, 3% cash back on gas and office supplies, 2% restaurants, 1% everything else, cash back never expires. NO cash advance, balance transfer, or foreign transaction fees.' },
      { name: 'Business Line of Credit', product_type: 'Line of Credit', notes: 'Revolving, open-ended access to a predetermined amount. Terms not published.' },
      { name: 'Business Term Loans', product_type: 'Term Loan', docs_required: 'Full-doc (2 years business AND personal tax returns)', personal_guarantee: 'PG required from all 20%+ owners', time_in_business: '24+ consecutive months under current ownership', notes: 'Secured or unsecured, fixed or variable.' },
    ],
  },
  {
    name: 'Andrews Federal Credit Union', type: 'Credit Union', access: 'Business address within 50 miles of an Andrews location (stricter than their consumer path)', geographic_restrictions: 'DC / MD / VA / NJ areas',
    application_url: 'https://www.andrewsfcu.org/credit-cards/visa-business-credit-card',
    products: [
      { name: 'Business Visa Credit Card', product_type: 'Business Credit Card', funding_amount: 'Unsecured line up to $50,000', notes: '$99 annual fee WAIVED the first year, low intro rate for the first 12 months, employee authorized-user cards.' },
      { name: 'Business Line of Credit', product_type: 'Line of Credit', funding_amount: 'Unsecured up to $75,000 (secured also available)', notes: 'One of the larger unsecured business LOCs we have seen at a credit union.' },
    ],
  },
  {
    name: 'NIH Federal Credit Union', type: 'Credit Union', access: 'Membership required (healthcare/biomedical focus; business lending nationwide)', geographic_restrictions: 'Nationwide (membership-gated)',
    application_url: 'https://www.nihfcu.org/business/loans/',
    strategy_notes: 'Minimum business loan is $100,000. Inquiry form includes a "None" option for years of tax returns, a signal that startups are considered.',
    products: [
      { name: 'Business Visa Rewards Card', product_type: 'Business Credit Card', notes: 'Positioned for continuous credit needs of $25,000 or lower; low variable APR and rewards points. Full terms pending.' },
      { name: 'Working Capital Line', product_type: 'Line of Credit', funding_amount: '$100,000 to $500,000', notes: 'No prepayment penalties, no annual rest period requirement.' },
      { name: 'SBA Loans', product_type: 'SBA Loan', funding_amount: '$100,000 to $5,000,000', notes: 'Terms up to 25 years, fully amortized, low down payment. Authorized SBA lender.' },
      { name: 'Growth & Expansion Loans', product_type: 'Term Loan', funding_amount: '$100,000 to $350,000', notes: '5 to 10 year terms, fully amortized.' },
    ],
  },
  {
    name: 'AOD Federal Credit Union', type: 'Credit Union', access: 'Membership (SEG + community); contact the member business lender', geographic_restrictions: 'Alabama',
    application_url: 'https://www.aodfcu.com/business-loans/',
    products: [
      { name: 'Visa Business Credit Card', product_type: 'Business Credit Card', notes: 'Offered; terms via their member business lender (256-241-8228).' },
      { name: 'Business Line of Credit', product_type: 'Line of Credit', notes: 'Offered; terms not published.' },
    ],
  },
  {
    name: 'Signal Financial FCU', type: 'Credit Union', access: 'Membership; commercial department application', geographic_restrictions: 'DC / MD / VA area',
    application_url: 'https://www.signalfinancialfcu.org/credit-union-business-loan',
    products: [
      { name: 'Working Capital Credit Line', product_type: 'Line of Credit', docs_required: 'Full-doc (3 years business + personal financials)', notes: 'Revolving 12-month term, interest-only payments, secured by receivables/inventory/assets. Rate discount if Signal business checking is your primary operating account (relationship lending in action).' },
      { name: 'Business Installment Loans', product_type: 'Term Loan', notes: 'Fully amortized up to 5 years, for equipment, vehicles, and capex. No prepayment penalties.' },
    ],
  },
  {
    name: 'Northwest Federal Credit Union', type: 'Credit Union', access: 'Membership via 600+ partner organizations nationwide', geographic_restrictions: 'Nationwide (membership-gated)',
    application_url: 'https://www.nwfcu.org/business/business-solutions/business-loans/',
    products: [
      { name: 'Visa Business Credit Card', product_type: 'Business Credit Card', notes: 'Offered with online application via the member portal; rates pending.' },
      { name: 'Business Lines of Credit', product_type: 'Line of Credit', notes: 'Revolving and closed-end programs; terms via the lending department.' },
      { name: 'SBA 504 Loans', product_type: 'SBA Loan', funding_amount: 'Up to $5,000,000', notes: 'SBA 504 program with origination support.' },
    ],
  },
  {
    name: 'Apple Federal Credit Union', type: 'Credit Union', access: 'Business membership; Rapid Request 15-minute application', geographic_restrictions: 'VA / MD / DC / PA / WV / DE',
    application_url: 'https://www.applefcu.org/commercial-banking/small-business-loans',
    strategy_notes: 'Rapid Request is the standout: bank statements instead of tax returns, 48-hour decisions. The published bar is real (2 years in business, 680+), but the doc burden is the lightest we have seen at a credit union.',
    products: [
      { name: 'Rapid Request Small Business Lending', product_type: 'Line of Credit', docs_required: 'Low-doc (12 months of business bank statements, no tax returns for this track)', time_in_business: '2+ years', min_fico: '680+', funding_amount: 'Up to $100,000', notes: 'Covers term loans, lines of credit, vehicles, and the business credit card. Decision in 48 hours or less, no prepayment penalty.' },
      { name: 'Visa Business Rewards Credit Card', product_type: 'Business Credit Card', notes: 'Applied for through Rapid Request; card-specific rates pending.' },
    ],
  },
  {
    name: 'VyStar Credit Union', type: 'Credit Union', access: 'Membership; in-branch/appointment application', geographic_restrictions: 'Florida-based',
    application_url: 'https://vystarcu.org/business/borrow/business-credit-cards',
    products: [
      { name: 'Business Platinum Rewards Visa', product_type: 'Business Credit Card', personal_guarantee: 'FULL personal guarantee from ALL owners (published)', time_in_business: '1 year (nonprofits: 3 years + financials)', funding_amount: 'Limits up to $50,000', notes: 'No annual fee, no foreign transaction fees, 1.5 points per $1, $500 bonus after $5,000 spend in 60 days. VyStar publishes its PG requirement plainly, credit where due.' },
    ],
  },
  {
    name: 'Security Service FCU', type: 'Credit Union', access: 'Membership', geographic_restrictions: 'Texas / Colorado / Utah',
    application_url: 'https://www.ssfcu.org/business/credit-cards/services',
    products: [
      { name: 'Power Business Mastercard', product_type: 'Business Credit Card', notes: 'Low-interest positioning, no annual fee; APR pending.' },
      { name: 'Power Business Cash Back Mastercard', product_type: 'Business Credit Card', notes: 'Cash back; rate pending.' },
      { name: 'Business Travel Rewards Mastercard', product_type: 'Business Credit Card', notes: 'Travel points; all three cards include ID theft resolution, zero liability, extended warranty.' },
    ],
  },
  {
    name: 'Redstone Federal Credit Union', type: 'Credit Union', access: 'Membership + business share account; branch visit to complete setup', geographic_restrictions: 'Alabama / Tennessee valley',
    application_url: 'https://www.redfcu.org/business/loans/',
    strategy_notes: 'The Business Assistance Microloans are the rare TRUE startup option: capital for brand-new businesses through The Catalyst Center and the North Alabama Revolving Loan Fund partnership.',
    products: [
      { name: 'Business Assistance Microloans', product_type: 'Startup Loan', time_in_business: 'Startup capital (no time-in-business bar published)', notes: 'Partnership-funded startup microloans, the only true no-TIB program found in this batch.' },
      { name: 'Business Line of Credit', product_type: 'Line of Credit', notes: 'Revolving, borrow as needed; terms pending.' },
      { name: 'Business Term Loans', product_type: 'Term Loan', notes: 'Tailored repayment, no prepayment penalties.' },
    ],
  },
  {
    name: 'TruMark Financial', type: 'Credit Union', access: 'Qualifying TruMark business account; PDF application', geographic_restrictions: 'Philadelphia area',
    application_url: 'https://www.trumarkonline.org/business-loans/',
    products: [
      { name: 'Business Credit Cards', product_type: 'Business Credit Card', notes: 'Rewards, spending controls, detailed reporting; rates pending.' },
      { name: 'Business Line of Credit', product_type: 'Line of Credit', notes: 'Draw as needed, interest only on what you use. Low origination fees, local decisioning.' },
      { name: 'Equipment & Term Loans', product_type: 'Term Loan', notes: 'Repayment structured to your cash flow; no prepayment penalties on select loans.' },
    ],
  },
  {
    name: 'Liberty Federal Credit Union', type: 'Credit Union', access: 'Membership; contact-us application', geographic_restrictions: 'Evansville IN-based, multi-state',
    application_url: 'https://www.libertyfcu.org/business/credit',
    products: [
      { name: 'Platinum Business Rewards Card', product_type: 'Business Credit Card', notes: 'Rewards in travel, gift cards, and cash back; APR pending.' },
      { name: 'Platinum Business Prime Plus Card', product_type: 'Business Credit Card', notes: 'Lowest-rate positioning (Prime-plus pricing), no rewards, no annual fee.' },
    ],
  },
  {
    name: 'Langley Federal Credit Union', type: 'Credit Union', access: 'Community membership; business card applied for in branch', geographic_restrictions: 'Virginia (Hampton Roads)',
    application_url: 'https://www.langleyfcu.org/business-credit-cards',
    products: [
      { name: 'Langley Platinum Visa Business', product_type: 'Business Credit Card', notes: 'Per-employee card limits, online monitoring; savings via the Visa SavingsEdge merchant network. APR at langleyfcu.org/rates.' },
      { name: 'Small Business Line of Credit', product_type: 'Line of Credit', notes: 'APR scales with loan amount and credit history up to 18.00%; minimum payment 2% of balance.' },
      { name: 'SBA Loans', product_type: 'SBA Loan', notes: 'Offered; details pending.' },
    ],
  },
  {
    name: 'America First Credit Union', type: 'Credit Union', access: 'Membership; online application', geographic_restrictions: 'Utah / Nevada / Idaho / Arizona',
    application_url: 'https://www.americafirst.com/business/business-loans.html',
    strategy_notes: 'A top-ranked SBA-lending credit union. The Unsecured Capital Loans are notable for our audience: built for when collateral is not available.',
    products: [
      { name: 'Unsecured Capital Loans', product_type: 'Term Loan', notes: 'Explicitly for businesses without collateral, a genuine low-barrier door. Terms pending.' },
      { name: 'Business Line of Credit', product_type: 'Line of Credit', notes: 'Attached to AFCU business checking; payments as low as $25 or 3.5% of balance.' },
      { name: 'SBA Loans', product_type: 'SBA Loan', notes: 'Top-ranked SBA lending credit union, online application.' },
    ],
  },
]

export async function seedBusinessLenders(): Promise<void> {
  const pool = getPool()
  const { rows } = await pool.query('SELECT COUNT(*)::int as count FROM business_institutions')
  const existing = Number(rows[0].count)
  if (existing > 0) {
    if (process.env.SEED_MODE === 'replace') {
      await pool.query('DELETE FROM business_products')
      await pool.query('DELETE FROM business_institutions')
    } else {
      return
    }
  }
  const vdate = '2026-07-11'
  let productCount = 0
  for (const inst of businessInstitutions) {
    const { rows: instRows } = await pool.query(`
      INSERT INTO business_institutions (name, type, access, geographic_restrictions, application_url, strategy_notes, source, verified_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id
    `, [inst.name, inst.type, inst.access, inst.geographic_restrictions, inst.application_url, inst.strategy_notes || null, 'Official site, verified', vdate])
    const instId = instRows[0].id
    for (const p of inst.products) {
      await pool.query(`
        INSERT INTO business_products (institution_id, name, product_type, docs_required, personal_guarantee,
          time_in_business, min_fico, credit_pull, reports_to, funding_amount, revenue_required, notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      `, [
        instId, p.name, p.product_type,
        p.docs_required || 'Not published', p.personal_guarantee || 'Not published',
        p.time_in_business || 'Not published', p.min_fico || 'Not published',
        p.credit_pull || 'Not published', p.reports_to || 'Not published',
        p.funding_amount || null, p.revenue_required || 'Not published', p.notes || null,
      ])
      productCount++
    }
  }
  console.log(`Seeded ${businessInstitutions.length} business institutions / ${productCount} products.`)
}
