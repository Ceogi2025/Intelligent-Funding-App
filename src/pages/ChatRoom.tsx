import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Lock, Flag, ShieldAlert, MessagesSquare } from 'lucide-react'
import Header from '../components/Header'
import SideMenu from '../components/SideMenu'
import { useAuth } from '../context/AuthContext'

type Message = {
  id: number
  display_name: string
  body: string
  created_at: string
}

const POLL_MS = 4000

function msgTime(s: string): string {
  if (!s) return ''
  const iso = s.includes('T') ? s : s.replace(' ', 'T') + 'Z'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function ChatRoom() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const [loaded, setLoaded] = useState(false)
  const [locked, setLocked] = useState<boolean | null>(null)
  const [bubbles, setBubbles] = useState<{ len: number }[]>([])
  const [activeCount, setActiveCount] = useState(0)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')

  const lastIdRef = useRef(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  const authHeaders = useCallback(
    () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
    [token]
  )

  const fetchChat = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat?since=${lastIdRef.current}`, { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      if (data.locked) {
        setLocked(true)
        setBubbles(Array.isArray(data.bubbles) ? data.bubbles : [])
        setActiveCount(data.activeCount || 0)
      } else {
        setLocked(false)
        const incoming: Message[] = Array.isArray(data.messages) ? data.messages : []
        if (incoming.length > 0) {
          lastIdRef.current = incoming[incoming.length - 1].id
          setMessages(prev => {
            const seen = new Set(prev.map(m => m.id))
            return [...prev, ...incoming.filter(m => !seen.has(m.id))]
          })
        }
      }
    } catch {
      /* transient, next poll retries */
    } finally {
      setLoaded(true)
    }
  }, [authHeaders])

  useEffect(() => {
    fetchChat()
    const t = setInterval(fetchChat, POLL_MS)
    return () => clearInterval(t)
  }, [fetchChat])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const body = input.trim()
    if (!body || sending) return
    setSending(true)
    setNotice('')
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ body }) })
      const data = await res.json()
      if (res.status === 429) { setNotice(data.error || 'Slow down a moment.'); return }
      if (!res.ok) { setNotice(data.error || 'Message failed, try again.'); return }
      setInput('')
      if (data.held) {
        setNotice('Your post is being reviewed by a moderator before it goes live.')
      } else {
        fetchChat()
      }
    } catch {
      setNotice('Connection error, try again.')
    } finally {
      setSending(false)
    }
  }

  async function report(id: number) {
    try {
      await fetch(`/api/chat/${id}/report`, { method: 'POST', headers: authHeaders() })
      setNotice('Thanks, reported to the moderators.')
    } catch { /* ignore */ }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onMenuOpen={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="page" style={{ flex: 1, maxWidth: 760, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--badge-teal-bg)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessagesSquare size={20} />
          </div>
          <h1>The Community Room</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 16, flexWrap: 'wrap' }}>
          <ShieldAlert size={13} /> Member discussion, educational only, not financial advice. Share what you know; no selling or soliciting.
          <a href="/community-guidelines" style={{ color: 'var(--teal)', fontWeight: 600 }}>Community Guidelines →</a>
        </div>

        {!loaded && <p style={{ color: 'var(--text-secondary)' }}>Opening the room…</p>}

        {/* ── LOCKED (trial), blurred teaser ─────────────────────────── */}
        {loaded && locked && (
          <div style={{ position: 'relative', border: '1px solid var(--border, #e5e7eb)', borderRadius: 14, overflow: 'hidden', minHeight: 420 }}>
            <div style={{ padding: 18, filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none' }} aria-hidden="true">
              {(bubbles.length ? bubbles : Array.from({ length: 8 }, () => ({ len: 60 }))).map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: i % 3 === 0 ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
                  <div style={{ maxWidth: '78%' }}>
                    <div style={{ height: 10, width: 70, background: 'var(--surface-2, #e2e8f0)', borderRadius: 6, marginBottom: 6 }} />
                    <div style={{ height: 14, width: Math.min(360, 90 + b.len * 3), background: 'var(--surface-2, #eef2f7)', borderRadius: 8 }} />
                    <div style={{ height: 14, width: Math.min(300, 60 + b.len * 2), background: 'var(--surface-2, #eef2f7)', borderRadius: 8, marginTop: 4 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'rgba(255,255,255,0.55)', padding: 24 }}>
              <div style={{ width: 54, height: 54, borderRadius: 14, background: 'var(--navy, #1e40af)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Lock size={24} />
              </div>
              <h2 style={{ marginBottom: 8 }}>The room is live right now</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 420, lineHeight: 1.6, marginBottom: 18 }}>
                {activeCount > 0
                  ? `${activeCount} messages from members, real approvals, real strategy, in real time.`
                  : 'Members are sharing real approvals and strategy in real time.'}
                {' '}Subscribe to read the conversation and join in.
              </p>
              <button className="btn btn--primary" onClick={() => navigate('/account')}>
                Unlock the room, go full member
              </button>
            </div>
          </div>
        )}

        {/* ── UNLOCKED (paid), the real room ─────────────────────────── */}
        {loaded && locked === false && (
          <>
            <div style={{ flex: 1, minHeight: 340, maxHeight: '58vh', overflowY: 'auto', border: '1px solid var(--border, #e5e7eb)', borderRadius: 14, padding: 16, background: 'var(--card, #fff)' }}>
              {messages.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: 40 }}>
                  No messages yet, be the first to say what you're working on.
                </p>
              )}
              {messages.map(m => (
                <div key={m.id} className="chat-msg" style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                    <strong style={{ fontSize: '0.86rem', color: 'var(--navy, #1e40af)' }}>{m.display_name}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{msgTime(m.created_at)}</span>
                    <button
                      onClick={() => report(m.id)}
                      title="Report this message"
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', opacity: 0.5 }}
                    >
                      <Flag size={13} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.94rem', lineHeight: 1.5, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.body}</div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {notice && (
              <div style={{ marginTop: 10, fontSize: '0.82rem', color: 'var(--teal)', background: 'var(--badge-teal-bg)', padding: '8px 12px', borderRadius: 8 }}>
                {notice}
              </div>
            )}

            <form onSubmit={send} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input
                className="form-input"
                style={{ flex: 1 }}
                placeholder="Share a win, ask a question, drop a strategy…"
                value={input}
                maxLength={800}
                onChange={e => setInput(e.target.value)}
              />
              <button type="submit" className="btn btn--primary" style={{ gap: 6 }} disabled={sending || !input.trim()}>
                <Send size={16} /> Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
