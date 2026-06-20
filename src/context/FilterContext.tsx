import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { FilterState } from '../types'

interface FilterContextType {
  filters: FilterState
  setFilters: (filters: FilterState) => void
  resetFilters: () => void
}

const defaultFilters: FilterState = {
  bureau: null,
  inquiryReuse: null,
  preapproval: null,
  productType: null,
  path: null,
}

const FilterContext = createContext<FilterContextType | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)

  function resetFilters() {
    setFilters(defaultFilters)
  }

  return (
    <FilterContext.Provider value={{ filters, setFilters, resetFilters }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilters must be used within FilterProvider')
  return ctx
}
