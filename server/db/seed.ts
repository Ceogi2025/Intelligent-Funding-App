import bcrypt from 'bcryptjs'
import { getDb } from './database.js'

const VERIFIED_DATE = '2026-06-19'

const pilot10 = [
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
      {
        name: 'Power Cash Rewards Visa Signature',
        type: 'Unsecured Card',
        bureau_pulled: 'Experian',
        reports_to: 'Not verified — contact institution to confirm',
        inquiry_reuse_eligible: 'Yes',
        preapproval_available: 'Yes',
        minimum_credit_score: 700,
        deposit_amount: 'N/A',
        annual_fee: 'None',
        graduation_potential: 'N/A',
        graduation_timeline: 'N/A',
        existing_customer_required: 'No',
        strategy_notes: 'Flagship rewards card. Pulls Experian. Inquiry reuse confirmed — multiple PenFed products on one pull.',
      },
      {
        name: 'Platinum Rewards Visa Signature',
        type: 'Unsecured Card',
        bureau_pulled: 'Experian',
        reports_to: 'Not verified — contact institution to confirm',
        inquiry_reuse_eligible: 'Yes',
        preapproval_available: 'Yes',
        minimum_credit_score: 680,
        deposit_amount: 'N/A',
        annual_fee: 'None',
        graduation_potential: 'N/A',
        graduation_timeline: 'N/A',
        existing_customer_required: 'No',
        strategy_notes: 'Lower minimum score than Power Cash. Good second product on same inquiry.',
      },
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
      {
        name: 'Alliant Cashback Visa Signature',
        type: 'Unsecured Card',
        bureau_pulled: 'TransUnion',
        reports_to: 'Not verified — contact institution to confirm',
        inquiry_reuse_eligible: 'Yes',
        preapproval_available: 'No',
        minimum_credit_score: 690,
        deposit_amount: 'N/A',
        annual_fee: 'None',
        graduation_potential: 'N/A',
        graduation_timeline: 'N/A',
        existing_customer_required: 'No',
        strategy_notes: 'Pulls TransUnion. Inquiry reuse confirmed within 30 days.',
      },
    ],
  },
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
      {
        name: 'Platinum Visa',
        type: 'Unsecured Card',
        bureau_pulled: 'TransUnion',
        reports_to: 'Not verified — contact institution to confirm',
        inquiry_reuse_eligible: 'Yes',
        preapproval_available: 'No',
        minimum_credit_score: 660,
        deposit_amount: 'N/A',
        annual_fee: 'None',
        graduation_potential: 'N/A',
        graduation_timeline: 'N/A',
        existing_customer_required: 'No',
        strategy_notes: 'Pulls TransUnion. ACC membership satisfies membership requirement. Inquiry reuse confirmed within 30 days.',
      },
    ],
  },
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
      {
        name: 'Choice Rewards World Mastercard',
        type: 'Unsecured Card',
        bureau_pulled: 'Equifax',
        reports_to: 'Not verified — contact institution to confirm',
        inquiry_reuse_eligible: 'Yes',
        preapproval_available: 'No',
        minimum_credit_score: 680,
        deposit_amount: 'N/A',
        annual_fee: 'None',
        graduation_potential: 'N/A',
        graduation_timeline: 'N/A',
        existing_customer_required: 'No',
        strategy_notes: 'Pulls Equifax. Strong Equifax target. Inquiry reuse within 30 days.',
      },
      {
        name: 'Personal Line of Credit',
        type: 'Line of Credit',
        bureau_pulled: 'Equifax',
        reports_to: 'Not verified — contact institution to confirm',
        inquiry_reuse_eligible: 'Yes',
        preapproval_available: 'No',
        minimum_credit_score: 660,
        deposit_amount: 'N/A',
        annual_fee: 'None',
        graduation_potential: 'N/A',
        graduation_timeline: 'N/A',
        existing_customer_required: 'No',
        strategy_notes: 'Line of credit on same Equifax pull as credit card — max value from one inquiry.',
      },
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
      {
        name: 'Visa Platinum',
        type: 'Unsecured Card',
        bureau_pulled: 'Equifax',
        reports_to: 'Not verified — contact institution to confirm',
        inquiry_reuse_eligible: 'Yes',
        preapproval_available: 'No',
        minimum_credit_score: 650,
        deposit_amount: 'N/A',
        annual_fee: 'None',
        graduation_potential: 'N/A',
        graduation_timeline: 'N/A',
        existing_customer_required: 'No',
        strategy_notes: 'Pulls Equifax. Lower minimum score. ACC membership accepted.',
      },
    ],
  },
  {
    name: 'Capital One',
    type: 'Bank',
    inquiry_reuse: 'No',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.capitalone.com',
    path: 'Credit Builder',
    products: [
      {
        name: 'Secured Mastercard',
        type: 'Secured Card',
        bureau_pulled: 'All 3',
        reports_to: 'All 3',
        inquiry_reuse_eligible: 'No',
        preapproval_available: 'Yes',
        minimum_credit_score: null,
        deposit_amount: '$49–$200',
        annual_fee: 'None',
        graduation_potential: 'Yes',
        graduation_timeline: '6–12 months',
        existing_customer_required: 'No',
        strategy_notes: 'Entry-level secured card. Reports to all 3 bureaus. Graduation path confirmed.',
      },
      {
        name: 'Platinum Secured Credit Card',
        type: 'Secured Card',
        bureau_pulled: 'All 3',
        reports_to: 'All 3',
        inquiry_reuse_eligible: 'No',
        preapproval_available: 'Yes',
        minimum_credit_score: null,
        deposit_amount: '$49–$200',
        annual_fee: 'None',
        graduation_potential: 'Yes',
        graduation_timeline: '6–12 months',
        existing_customer_required: 'No',
        strategy_notes: 'Companion secured card. Same graduation path. Soft pull preapproval available.',
      },
    ],
  },
  {
    name: 'Self Financial',
    type: 'Fintech',
    inquiry_reuse: 'No',
    inquiry_reuse_window: 'Not Found',
    preapproval_available: 'No',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Nationwide',
    application_url: 'https://www.self.inc',
    path: 'Credit Builder',
    products: [
      {
        name: 'Self Credit Builder Account',
        type: 'Credit Builder Loan',
        bureau_pulled: 'All 3',
        reports_to: 'All 3',
        inquiry_reuse_eligible: 'No',
        preapproval_available: 'No',
        minimum_credit_score: null,
        deposit_amount: 'Not required upfront',
        annual_fee: 'None',
        graduation_potential: 'No',
        graduation_timeline: 'N/A',
        existing_customer_required: 'No',
        strategy_notes: 'Installment loan that builds payment history. No upfront deposit. Reports to all 3 bureaus.',
      },
    ],
  },
  {
    name: 'Navy Federal Credit Union',
    type: 'Credit Union',
    inquiry_reuse: 'Yes',
    inquiry_reuse_window: 'Same Day',
    preapproval_available: 'Yes',
    soft_pull_available: 'Yes',
    geographic_restrictions: 'Military and family only',
    application_url: 'https://www.navyfederal.org',
    path: 'Both',
    products: [
      {
        name: 'cashRewards Credit Card',
        type: 'Unsecured Card',
        bureau_pulled: 'TransUnion',
        reports_to: 'Not verified — contact institution to confirm',
        inquiry_reuse_eligible: 'Yes',
        preapproval_available: 'Yes',
        minimum_credit_score: 620,
        deposit_amount: 'N/A',
        annual_fee: 'None',
        graduation_potential: 'N/A',
        graduation_timeline: 'N/A',
        existing_customer_required: 'No',
        strategy_notes: 'Lowest minimum score in pilot set at 620. Pulls TransUnion. Inquiry reuse same day. Preapproval available.',
      },
      {
        name: 'Secured Credit Card',
        type: 'Secured Card',
        bureau_pulled: 'TransUnion',
        reports_to: 'Not verified — contact institution to confirm',
        inquiry_reuse_eligible: 'No',
        preapproval_available: 'No',
        minimum_credit_score: null,
        deposit_amount: '$200–$5,000',
        annual_fee: 'None',
        graduation_potential: 'Yes',
        graduation_timeline: '3 months',
        existing_customer_required: 'No',
        strategy_notes: 'Fastest graduation path at 3 months. Requires Navy Federal membership.',
      },
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
      {
        name: 'Visa Classic',
        type: 'Unsecured Card',
        bureau_pulled: 'Equifax',
        reports_to: 'Not verified — contact institution to confirm',
        inquiry_reuse_eligible: 'Yes',
        preapproval_available: 'No',
        minimum_credit_score: 640,
        deposit_amount: 'N/A',
        annual_fee: 'None',
        graduation_potential: 'N/A',
        graduation_timeline: 'N/A',
        existing_customer_required: 'No',
        strategy_notes: 'Pulls Equifax. ACC membership accepted. Inquiry reuse within 30 days.',
      },
    ],
  },
]

export function seedDatabase(): void {
  const db = getDb()

  const existing = (db.prepare('SELECT COUNT(*) as count FROM institutions').get() as { count: number }).count
  if (existing > 0) {
    console.log(`Database already has ${existing} institutions. Skipping seed.`)
    return
  }

  const insertInstitution = db.prepare(`
    INSERT INTO institutions (name, type, inquiry_reuse, inquiry_reuse_window, preapproval_available,
      soft_pull_available, geographic_restrictions, application_url, path, last_verified_date)
    VALUES (@name, @type, @inquiry_reuse, @inquiry_reuse_window, @preapproval_available,
      @soft_pull_available, @geographic_restrictions, @application_url, @path, @last_verified_date)
  `)

  const insertProduct = db.prepare(`
    INSERT INTO products (institution_id, name, type, bureau_pulled, reports_to, inquiry_reuse_eligible,
      preapproval_available, minimum_credit_score, deposit_amount, annual_fee, graduation_potential,
      graduation_timeline, existing_customer_required, last_verified_date, strategy_notes)
    VALUES (@institution_id, @name, @type, @bureau_pulled, @reports_to, @inquiry_reuse_eligible,
      @preapproval_available, @minimum_credit_score, @deposit_amount, @annual_fee, @graduation_potential,
      @graduation_timeline, @existing_customer_required, @last_verified_date, @strategy_notes)
  `)

  const seedAll = db.transaction(() => {
    for (const institution of pilot10) {
      const result = insertInstitution.run({ ...institution, last_verified_date: VERIFIED_DATE })
      const institutionId = result.lastInsertRowid as number
      for (const product of institution.products) {
        insertProduct.run({ ...product, institution_id: institutionId, last_verified_date: VERIFIED_DATE })
      }
    }
  })

  seedAll()
  console.log(`Seeded ${pilot10.length} pilot institutions.`)
}

export async function seedAdmin(): Promise<void> {
  const db = getDb()
  const existing = db.prepare("SELECT id FROM users WHERE role = 'admin'").get()
  if (existing) return

  const hash = await bcrypt.hash('admin123', 10)
  db.prepare(`
    INSERT INTO users (email, password_hash, role, subscription_status)
    VALUES (?, ?, 'admin', 'active')
  `).run('admin@intelligentfunding.org', hash)

  console.log('Admin created: admin@intelligentfunding.org / admin123')
}
