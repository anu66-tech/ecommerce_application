import { Link, NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useStore } from '../../pages/customer/store'
import './Sidebar.css'

const storefrontLinks = [
  ['/', 'Home', '⌂'],
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
  const cart = useSelector((state) => state.cart.items)
  const wishlist = useSelector((state) => state.wishlist.items)
  const orders = useStore('orders')
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const processingOrders = orders.filter((order) => order.status === 'Processing').length

  return (
    <aside className="main-sidebar" aria-label="Main navigation">
      <Link className="main-sidebar-brand brand" to="/">goodthings<span>.</span></Link>

      <nav className="main-sidebar-nav">
        <span className="main-sidebar-heading">STOREFRONT</span>
        {storefrontLinks.map(([to, label, icon]) => (
          <SidebarLink
            key={to}
            to={to}
            label={label}
            icon={icon}
            exact={to === '/'}
            count={to === '/cart' ? cartCount : to === '/wishlist' ? wishlist.length : 0}
          />
        ))}

        <span className="main-sidebar-heading admin-nav-heading">ADMIN PANEL</span>
        {adminLinks.map(([to, label, icon]) => (
          <SidebarLink key={to} to={to} label={label} icon={icon} exact={to === '/admin'} count={to === '/admin/orders' ? processingOrders : 0} />
        ))}
      </nav>

    </aside>
  )
}
