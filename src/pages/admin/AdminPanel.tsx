import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface AdminInstitution {
  id: number
  name: string
  type: string
  path: string
  inquiry_reuse: string
  preapproval_available: string
  product_count: number
  last_verified_date: string
}

interface AdminUser {
  id: number
  email: string
  role: string
  subscription_status: string
  subscription_end_date: string | null
  created_at: string
}

interface AdminSubmission {
  id: number
  institution_name: string
  product_name: string | null
  bureau_pulled: string | null
  approved: string | null
  credit_score_band: string | null
  credit_limit: string | null
  state: string | null
  notes: string | null
  status: string
}

interface AdminMessage {
  id: number
  display_name: string | null
  body: string
  status: string
  flagged_count: number
  created_at: string
}

export default function AdminPanel() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'institutions' | 'users' | 'wins' | 'chat'>('institutions')
  const [institutions, setInstitutions] = useState<AdminInstitution[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([])
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [loading, setLoading] = useState(true)

  async function apiFetch(path: string, options?: RequestInit) {
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options?.headers || {}),
      },
    })
    if (res.status === 401 || res.status === 403) { logout(); navigate('/admin/login'); return null }
    return res
  }

  async function loadInstitutions() {
    const res = await apiFetch('/api/admin/institutions')
    if (res?.ok) setInstitutions(await res.json())
  }

  async function loadUsers() {
    const res = await apiFetch('/api/admin/users')
    if (res?.ok) setUsers(await res.json())
  }

  async function loadSubmissions() {
    const res = await apiFetch('/api/admin/submissions')
    if (res?.ok) setSubmissions(await res.json())
  }

  async function loadMessages() {
    const res = await apiFetch('/api/admin/messages')
    if (res?.ok) setMessages(await res.json())
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([loadInstitutions(), loadUsers(), loadSubmissions(), loadMessages()]).finally(() => setLoading(false))
  }, [])

  async function handleDeleteInstitution(id: number, name: string) {
    if (!confirm(`Delete "${name}" and all its products? This cannot be undone.`)) return
    const res = await apiFetch(`/api/admin/institutions/${id}`, { method: 'DELETE' })
    if (res?.ok) setInstitutions(prev => prev.filter(i => i.id !== id))
  }

  async function setSubmissionStatus(id: number, status: string) {
    const res = await apiFetch(`/api/admin/submissions/${id}`, { method: 'PUT', body: JSON.stringify({ status }) })
    if (res?.ok) setSubmissions(prev => prev.map(s => (s.id === id ? { ...s, status } : s)))
  }

  async function deleteSubmission(id: number) {
    if (!confirm('Delete this datapoint permanently?')) return
    const res = await apiFetch(`/api/admin/submissions/${id}`, { method: 'DELETE' })
    if (res?.ok) setSubmissions(prev => prev.filter(s => s.id !== id))
  }

  async function setMessageStatus(id: number, status: string) {
    const res = await apiFetch(`/api/admin/messages/${id}`, { method: 'PUT', body: JSON.stringify({ status }) })
    if (res?.ok) setMessages(prev => prev.map(m => (m.id === id ? { ...m, status } : m)))
  }

  async function deleteMessage(id: number) {
    if (!confirm('Delete this message permanently?')) return
    const res = await apiFetch(`/api/admin/messages/${id}`, { method: 'DELETE' })
    if (res?.ok) setMessages(prev => prev.filter(m => m.id !== id))
  }

  const pendingWins = submissions.filter(s => s.status === 'pending').length
  const heldChat = messages.filter(m => m.status === 'held').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header className="header">
        <div className="header__inner">
          <div style={{ fontWeight: 700 }}>
            <span>INTELLIGENT</span>
            <span style={{ color: 'var(--navy)', marginLeft: 4 }}>FUNDING</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ADMIN PANEL</span>
            <button className="btn btn--ghost btn--sm" onClick={() => { logout(); navigate('/') }}>Sign Out</button>
          </div>
        </div>
      </header>

      <div className="page" style={{ maxWidth: 1100 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {(['institutions', 'users', 'wins', 'chat'] as const).map(t => {
            const labels: Record<typeof t, string> = { institutions: 'Institutions', users: 'Users', wins: 'Wins Queue', chat: 'Chat Queue' }
            const counts: Record<typeof t, number> = { institutions: institutions.length, users: users.length, wins: pendingWins, chat: heldChat }
            const queue = (t === 'wins' && pendingWins > 0) || (t === 'chat' && heldChat > 0)
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '10px 20px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: tab === t ? '2px solid var(--navy)' : '2px solid transparent',
                  color: tab === t ? 'var(--navy)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {labels[t]}{' '}
                <span style={{ color: queue ? 'var(--amber, #b45309)' : 'inherit', fontWeight: queue ? 800 : 600 }}>
                  ({counts[t]})
                </span>
              </button>
            )
          })}
        </div>

        {loading && <div className="loading-page"><div className="spinner" /></div>}

        {/* Institutions table */}
        {!loading && tab === 'institutions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2>Institutions</h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                To add/edit institutions, use the API or database directly. Full CRUD UI coming in Phase 2.
              </p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Path</th>
                    <th>Inquiry Reuse</th>
                    <th>Preapproval</th>
                    <th>Products</th>
                    <th>Last Verified</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.map(inst => (
                    <tr key={inst.id}>
                      <td style={{ color: 'var(--text-secondary)' }}>{inst.id}</td>
                      <td style={{ fontWeight: 600 }}>{inst.name}</td>
                      <td>{inst.type}</td>
                      <td>
                        <span className={`badge badge--${inst.path === 'Both' ? 'green' : inst.path === 'Capital Access' ? 'navy' : 'teal'}`}>
                          {inst.path}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge--${inst.inquiry_reuse === 'Yes' ? 'green' : 'gray'}`}>
                          {inst.inquiry_reuse}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge--${inst.preapproval_available === 'Yes' ? 'teal' : 'gray'}`}>
                          {inst.preapproval_available}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>{inst.product_count}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{inst.last_verified_date}</td>
                      <td>
                        <button
                          className="btn btn--danger btn--sm"
                          onClick={() => handleDeleteInstitution(inst.id, inst.name)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users table */}
        {!loading && tab === 'users' && (
          <div>
            <h2 style={{ marginBottom: 16 }}>Users ({users.length})</h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Subscription</th>
                    <th>Expires</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.id}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge badge--${u.role === 'admin' ? 'navy' : 'gray'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge--${u.subscription_status === 'active' ? 'green' : u.subscription_status === 'trial' ? 'teal' : 'gray'}`}>
                          {u.subscription_status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {u.subscription_end_date ? new Date(u.subscription_end_date).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Wins queue, datapoint moderation */}
        {!loading && tab === 'wins' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2>Wins Queue</h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                Approve a datapoint to publish it on the public Wins Wall. Nothing shows until you approve it.
              </p>
            </div>
            {submissions.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No submissions yet.</p>}
            {submissions.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Institution</th><th>Product</th><th>Bureau</th><th>Score</th><th>Limit</th><th>State</th><th>Notes</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.institution_name}</td>
                        <td>{s.product_name || '—'}</td>
                        <td>{s.bureau_pulled || '—'}</td>
                        <td>{s.credit_score_band || '—'}</td>
                        <td>{s.credit_limit || '—'}</td>
                        <td>{s.state || '—'}</td>
                        <td style={{ maxWidth: 240, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.notes || '—'}</td>
                        <td>
                          <span className={`badge badge--${s.status === 'approved' ? 'green' : s.status === 'rejected' ? 'gray' : 'teal'}`}>{s.status}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {s.status !== 'approved' && <button className="btn btn--primary btn--sm" onClick={() => setSubmissionStatus(s.id, 'approved')}>Approve</button>}
                            {s.status !== 'rejected' && <button className="btn btn--ghost btn--sm" onClick={() => setSubmissionStatus(s.id, 'rejected')}>Reject</button>}
                            <button className="btn btn--danger btn--sm" onClick={() => deleteSubmission(s.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Chat queue, message moderation */}
        {!loading && tab === 'chat' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2>Chat Queue</h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                Held messages were auto-flagged by the filter or by member reports. Approve to make visible, or Remove to keep it hidden.
              </p>
            </div>
            {messages.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No messages yet.</p>}
            {messages.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Member</th><th>Message</th><th>Flags</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map(m => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{m.display_name || '—'}</td>
                        <td style={{ maxWidth: 360 }}>{m.body}</td>
                        <td style={{ textAlign: 'center' }}>{m.flagged_count > 0 ? m.flagged_count : '—'}</td>
                        <td>
                          <span className={`badge badge--${m.status === 'visible' ? 'green' : m.status === 'removed' ? 'gray' : 'teal'}`}>{m.status}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {m.status !== 'visible' && <button className="btn btn--primary btn--sm" onClick={() => setMessageStatus(m.id, 'visible')}>Approve</button>}
                            {m.status !== 'removed' && <button className="btn btn--ghost btn--sm" onClick={() => setMessageStatus(m.id, 'removed')}>Remove</button>}
                            <button className="btn btn--danger btn--sm" onClick={() => deleteMessage(m.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
