import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { setStore, useStore } from '../store/store.js'
import { clearAuthToken, logoutApi } from '../../api/backend.js'
import './Sidebar.css'

const storefrontLinks = [
  ['/home', 'Home', '⌂'],
  ['/products', 'Products', '▦'],
  ['/wishlist', 'Wishlist', '♡'],
  ['/cart', 'Cart', '▤'],
  ['/orders', 'My orders', '↗'],
]

const adminLinks = [
  ['/admin', 'Dashboard', '▧'],
  ['/admin/products', 'Products', '▦'],
  ['/admin/categories', 'Categories', '◫'],
  ['/admin/inventory', 'Inventory', '▥'],
  ['/admin/orders', 'Orders', '↗'],
  ['/admin/account', 'Admin Account', '🛡️'],
]

function SidebarLink({ to, label, icon, exact = false, count }) {
  return (
    <NavLink to={to} end={exact} className={({ isActive }) => `main-sidebar-link${isActive ? ' active' : ''}`}>
      <span className="main-sidebar-icon" aria-hidden="true">{icon}</span>
      <span>{label}</span>
      {count > 0 && <span className="main-sidebar-count">{count}</span>}
    </NavLink>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()
  const cart = useSelector((state) => state.cart.items)
  const wishlist = useSelector((state) => state.wishlist.items)
  const orders = useStore('orders')
  const currentUser = useStore('currentUser')
  const currentAdmin = useStore('currentAdmin')
  const cartCount = cart.reduce((total, item) => total + (item.quantity || 1), 0)
  const processingOrders = (orders || []).filter((order) => order.status === 'Processing').length

  const isCustomer = currentUser?.role === 'customer' && !currentAdmin
  const isAdmin = currentAdmin?.role === 'admin' && !currentUser

  const handleLogout = async () => {
    clearAuthToken()
    try {
      if (isCustomer) await logoutApi('customer')
      if (isAdmin) await logoutApi('admin')
    } catch (err) {
      console.warn('Sidebar logout call:', err)
    }
    setStore('currentUser', null)
    setStore('currentAdmin', null)
    navigate('/login', { replace: true })
  }

  return (
    <aside className="main-sidebar" aria-label="Main navigation">
      <Link
        className="main-sidebar-brand brand"
        to={isAdmin ? '/admin' : isCustomer ? '/home' : '/login'}
      >
        goodthings<span>.</span>
      </Link>

      <nav className="main-sidebar-nav">
        {isAdmin && (
          <>
            <span className="main-sidebar-heading">ADMIN PANEL</span>
            {adminLinks.map(([to, label, icon]) => (
              <SidebarLink
                key={to}
                to={to}
                label={label}
                icon={icon}
                exact={to === '/admin'}
                count={to === '/admin/orders' ? processingOrders : 0}
              />
            ))}
          </>
        )}

        {isCustomer && (
          <>
            <span className="main-sidebar-heading">STOREFRONT</span>
            {storefrontLinks.map(([to, label, icon]) => (
              <SidebarLink
                key={to}
                to={to}
                label={label}
                icon={icon}
                exact={to === '/home'}
                count={to === '/cart' ? cartCount : to === '/wishlist' ? (wishlist || []).length : 0}
              />
            ))}

            <SidebarLink
              to="/account"
              label={`Account (${(currentUser.name || 'User').split(' ')[0]})`}
              icon="👤"
              exact={false}
            />
          </>
        )}

        {!isAdmin && !isCustomer && (
          <SidebarLink
            to="/login"
            label="Sign In"
            icon="👤"
            exact={false}
          />
        )}
      </nav>

      {(isCustomer || isAdmin) && (
        <div className="main-sidebar-footer">
          <div
            className="main-sidebar-user-info"
            onClick={() => navigate(isAdmin ? '/admin/account' : '/account')}
            style={{ cursor: 'pointer' }}
            title="Click to view full account details"
          >
            <span className="main-sidebar-avatar">{isAdmin ? '🛡️' : '👤'}</span>
            <div className="main-sidebar-user-meta">
              <span className="main-sidebar-user-name">
                {isAdmin ? (currentAdmin.name || 'Admin Manager') : currentUser.name}
              </span>
              <span className="main-sidebar-user-role">
                {isAdmin ? 'Admin Account ↗' : 'My Account ↗'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="main-sidebar-logout-btn"
            onClick={handleLogout}
            title={isAdmin ? "Admin Sign Out" : "Sign Out of account"}
          >
            <span className="main-sidebar-icon">⎋</span>
            <span>{isAdmin ? 'Admin Sign Out' : 'Sign Out'}</span>
          </button>
        </div>
      )}
    </aside>
  )
}
