import { useEffect, useState } from 'react'

// Live counts from the free public endpoint, floored to the nearest 10 for
// evergreen "N+" copy, pages using this can never go stale as the directory grows.
export function useLiveCounts() {
  const [counts, setCounts] = useState<{ inst: number; prod: number } | null>(null)
  useEffect(() => {
    // Combined consumer + business counts
    fetch('/api/public/stats')
      .then(r => r.json())
      .then(d => {
        if (d && typeof d.inst === 'number' && d.inst > 0) {
          setCounts({ inst: d.inst, prod: d.prod })
        }
      })
      .catch(() => {})
  }, [])
  const instFloor = counts ? `${Math.floor(counts.inst / 10) * 10}+` : '90+'
  const prodFloor = counts ? `${Math.floor(counts.prod / 10) * 10}+` : '220+'
  return { counts, instFloor, prodFloor }
}
