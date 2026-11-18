import { Link, Outlet, useLocation } from 'react-router-dom'
import { setStore, useStore } from '../../shared/store/store.js'
import { logoutApi } from '../../api/backend.js'
import Sidebar from '../../shared/components/Sidebar.jsx'

export default function AdminLayout() {
  const currentAdmin = useStore('currentAdmin')
  const location = useLocation()
  const isLoginPage = location.pathname === '/admin/login'

  const handleAdminLogout = async () => {
    try {
      await logoutApi('admin')
    } catch (err) {
      console.warn('Admin logout API err:', err)
    }
    setStore('currentAdmin', null)
  }

  return (
    <div className="app-shell admin-layout">
      <Sidebar />
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="eyebrow">STUDIO MANAGEMENT</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#374334' }}>Admin Control Center</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {currentAdmin ? (
              <>
                <Link
                  to="/admin/account"
                  style={{ fontSize: '12px', color: '#374334', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="View admin account details"
                >
                  🛡️ {currentAdmin.name || 'Studio Admin'} <span style={{ fontSize: '10px', color: '#6d7568' }}>(Account)</span>
                </Link>
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  className="table-action delete-action"
                  style={{ fontSize: '11px', textDecoration: 'underline' }}
                >
                  Admin Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/admin/login"
                style={{ fontSize: '11px', color: '#374334', textDecoration: 'underline' }}
              >
                Admin Sign In →
              </Link>
            )}
            <span className="admin-online"><i /> Online</span>
          </div>
        </header>
        {!currentAdmin && !isLoginPage ? (
          <div style={{ padding: '40px 20px', maxWidth: '520px', margin: '40px auto' }}>
            <div className="admin-panel" style={{ padding: '36px 28px', textAlign: 'center' }}>
              <span className="eyebrow">RESTRICTED ACCESS</span>
              <h2 style={{ margin: '8px 0 12px' }}>Admin Authentication Required</h2>
              <p style={{ color: '#7a7e75', fontSize: '13px', marginBottom: '24px' }}>
                Please sign in with your administrator credentials to access inventory, orders, and products.
              </p>
              <Link to="/admin/login" className="button button-dark" style={{ justifyContent: 'center' }}>
                Sign in to Admin Panel
              </Link>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  )
}
