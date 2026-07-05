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
      { name: 'Blue Cash Everyday Card', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'Yes', minimum_credit_score: 670, deposit_amount: 'N/A', annual_fee: 'None', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Pulls Experian primary. Soft pull preapproval via CardMatch before hard pull. No inquiry reuse — apply for one AmEx product at a time.' },
      { name: 'Blue Cash Preferred Card', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'Yes', minimum_credit_score: 700, deposit_amount: 'N/A', annual_fee: '$95', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Higher-tier grocery/streaming cash back. Pulls Experian. Check CardMatch preapproval before applying.' },
      { name: 'American Express Gold Card', type: 'Unsecured Card', bureau_pulled: 'Experian', reports_to: 'All 3', inquiry_reuse_eligible: 'No', preapproval_available: 'Yes', minimum_credit_score: 720, deposit_amount: 'N/A', annual_fee: '$250', graduation_potential: 'N/A', graduation_timeline: 'N/A', existing_customer_required: 'No', strategy_notes: 'Premium dining/travel card. Pulls Experian. Best timed after Experian profile is established.' },
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

  // ── CATALOG TIER (Grams' policy 7/5: strong products, bureau honestly flagged Not Verified;
  //    appear in Browse All + product searches, excluded from bureau-filtered results) ──

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
