// Funnel tick marks. Fire-and-forget, no PII, never blocks the UI.
export function track(name: 'landing_view' | 'landing_cta' | 'signup_submit' | 'engine_run' | 'checkout_start'): void {
  try {
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
