import { useState, useEffect } from 'react'
import type { Institution, FilterState } from '../types'
import { useAuth } from '../context/AuthContext'

export function useInstitutions(filters: FilterState) {
  const { token } = useAuth()
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!filters.path) return

    const params = new URLSearchParams()
    params.set('path', filters.path)

    if (filters.path === 'capital-access' && filters.bureau) {
      params.set('bureau', filters.bureau.toLowerCase().replace('transunion', 'transunion'))
      if (filters.inquiryReuse) params.set('inquiryReuse', filters.inquiryReuse)
      if (filters.preapproval) params.set('preapproval', filters.preapproval)
    }

    if (filters.path === 'credit-builder' && filters.productType) {
      params.set('productType', filters.productType)
    }

    setLoading(true)
    setError(null)

    fetch(`/api/institutions?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.status === 402) throw new Error('subscription_required')
        if (!res.ok) throw new Error('Failed to load institutions')
        return res.json()
      })
      .then(data => setInstitutions(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [filters, token])

  return { institutions, loading, error }
}

export function useInstitution(id: number | null) {
  const { token } = useAuth()
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)

    fetch(`/api/institutions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Institution not found')
        return res.json()
      })
      .then(data => setInstitution(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, token])

  return { institution, loading, error }
}
