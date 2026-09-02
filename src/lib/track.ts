// Funnel tick marks. Fire-and-forget, no PII, never blocks the UI.
//
// The intake steps matter more than they look. Knowing someone ran the engine
// tells us almost nothing; knowing that half the people who start quit on the
// utilization question tells us exactly what to fix. Each step fires once per
// session (see `seen` below) so a member clicking Back doesn't inflate counts.
export type TrackEvent =
  | 'landing_view'
  | 'landing_cta'
  | 'signup_submit'
  | 'engine_start'
  | 'engine_q1' | 'engine_q2' | 'engine_q3' | 'engine_q4' | 'engine_q5'
  | 'engine_q6' | 'engine_q7' | 'engine_q8' | 'engine_q9'
  | 'engine_review'
  | 'engine_run'
  | 'blueprint_saved'
  | 'blueprint_step_checked'
  | 'checkout_start'

const seen = new Set<string>()

export function track(name: TrackEvent, once = false): void {
  try {
    if (once) {
      if (seen.has(name)) return
      seen.add(name)
    }
    fetch('/api/public/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // never let counting break the app
  }
}
