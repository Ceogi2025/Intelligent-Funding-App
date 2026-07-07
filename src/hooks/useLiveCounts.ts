import { useEffect, useState } from 'react'

// Live counts from the free public endpoint, floored to the nearest 10 for
// evergreen "N+" copy, pages using this can never go stale as the directory grows.
export function useLiveCounts() {
  const [counts, setCounts] = useState<{ inst: number; prod: number } | null>(null)
  useEffect(() => {
    fetch('/api/public/institutions')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d) && d.length > 0) {
          setCounts({ inst: d.length, prod: d.reduce((s, i) => s + (i.product_count || 0), 0) })
        }
      })
      .catch(() => {})
  }, [])
  const instFloor = counts ? `${Math.floor(counts.inst / 10) * 10}+` : '50+'
  const prodFloor = counts ? `${Math.floor(counts.prod / 10) * 10}+` : '80+'
  return { counts, instFloor, prodFloor }
}
