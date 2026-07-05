export interface Product {
  id: number
  institution_id: number
  name: string
  type: 'Unsecured Card' | 'Line of Credit' | 'Personal Loan' | 'Secured Card' | 'Credit Builder Loan'
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
  last_verified_date: string
  strategy_notes: string | null
}

export interface Institution {
  id: number
  name: string
  type: 'Bank' | 'Credit Union' | 'Fintech'
  inquiry_reuse: 'Yes' | 'No' | 'Partial' | 'Not Verified'
  inquiry_reuse_window: string
  preapproval_available: 'Yes' | 'No' | 'Not Found' | 'Not Verified'
  soft_pull_available: 'Yes' | 'No' | 'Not Found' | 'Not Verified'
  geographic_restrictions: string
  application_url: string | null
  path: 'Capital Access' | 'Credit Builder' | 'Both'
  last_verified_date: string
  products: Product[]
}

export interface User {
  id: number
  email: string
  role: 'customer' | 'admin'
  subscription_status: 'inactive' | 'trial' | 'active'
  subscription_end_date?: string | null
}

export interface FilterState {
  bureau: 'Experian' | 'Equifax' | 'TransUnion' | null
  inquiryReuse: 'yes' | 'no' | null
  preapproval: 'yes' | 'no' | null
  productType: 'card' | 'loan' | 'other' | null
  path: 'capital-access' | 'credit-builder' | null
}
