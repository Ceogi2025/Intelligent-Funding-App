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

export default function AdminPanel() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'institutions' | 'users'>('institutions')
  const [institutions, setInstitutions] = useState<AdminInstitution[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
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

  useEffect(() => {
    setLoading(true)
    Promise.all([loadInstitutions(), loadUsers()]).finally(() => setLoading(false))
  }, [])

  async function handleDeleteInstitution(id: number, name: string) {
    if (!confirm(`Delete "${name}" and all its products? This cannot be undone.`)) return
    const res = await apiFetch(`/api/admin/institutions/${id}`, { method: 'DELETE' })
    if (res?.ok) setInstitutions(prev => prev.filter(i => i.id !== id))
  }

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
          {(['institutions', 'users'] as const).map(t => (
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
                textTransform: 'capitalize',
              }}
            >
              {t} {t === 'institutions' ? `(${institutions.length})` : `(${users.length})`}
            </button>
          ))}
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
      </div>
    </div>
  )
}
