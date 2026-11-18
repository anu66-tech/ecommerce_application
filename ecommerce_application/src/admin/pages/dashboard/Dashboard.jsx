import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../../../shared/store/store.js'
import { money } from '../../../shared/utils/format.js'
import PageHeading from '../../../shared/components/PageHeading.jsx'

export function Dashboard({ products: propProducts, orders: propOrders }) {
  const navigate = useNavigate()
  const storeProducts = useStore('products') || []
  const storeOrders = useStore('orders') || []
  const products = propProducts || storeProducts
  const orders = propOrders || storeOrders

  const revenue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0)
  const lowStock = products.filter((product) => product.stock > 0 && product.stock <= 10).length
  const metrics = [
    { label: 'Total revenue', value: money(revenue), note: 'All-time order total', to: null, icon: '💰' },
    { label: 'Orders', value: orders.length.toString(), note: 'Placed in this store', to: '/admin/orders', icon: '↗' },
    { label: 'Products', value: products.length.toString(), note: 'Across your collection', to: '/admin/products', icon: '▦' },
    { label: 'Needs a restock', value: lowStock.toString(), note: '10 items or fewer', to: '/admin/inventory', icon: '▥' },
  ]

  return (
    <>
      <PageHeading
        eyebrow="YOUR LITTLE CORNER OF THE INTERNET"
        title="Good morning, studio."
        action={<Link className="button button-dark" to="/admin/products">Manage products </Link>}
      />
      <div className="metric-grid">
        {metrics.map(({ label, value, note, to, icon }) => (
          to ? (
            <Link
              key={label}
              to={to}
              className="metric-card metric-card-interactive"
              title={`Go to ${label} page`}
            >
              <span className={`metric-icon ${label === 'Needs a restock' ? 'metric-alert' : ''}`}>{icon}</span>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                {label}
                <span className="metric-link-indicator" aria-hidden="true">→</span>
              </span>
              <b>{value}</b>
              <small>{note}</small>
            </Link>
          ) : (
            <article key={label} className="metric-card">
              <span className="metric-icon">{icon}</span>
              <span>{label}</span>
              <b>{value}</b>
              <small>{note}</small>
            </article>
          )
        ))}
      </div>
      <div className="admin-overview-grid">
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div><span className="eyebrow">THE LATEST</span><h2><Link to="/admin/orders" className="overview-title-link">Recent orders</Link></h2></div>
            <Link to="/admin/orders">All orders →</Link>
          </div>
          {orders.length ? (
            <div className="admin-table-wrap"><table>
              <thead><tr><th>ORDER</th><th>CUSTOMER</th><th>DATE</th><th>STATUS</th><th>TOTAL</th></tr></thead>
              <tbody>{orders.slice(0, 5).map((order) => (
                <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/orders')} title="Click to view in Orders">
                  <td><Link to="/admin/orders" style={{ color: 'inherit', fontWeight: 'bold' }}>#{order.id.slice(-8)}</Link></td>
                  <td>{order.customer?.name || 'Guest'}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td><span className={`status-pill status-${(order.status || '').toLowerCase()}`}>{order.status}</span></td>
                  <td><b>{money(order.total)}</b></td>
                </tr>
              ))}</tbody>
            </table></div>
          ) : (
            <div className="admin-blank"><p>Your first order is just around the corner.</p><Link to="/admin/products">Make sure your products are ready </Link></div>
          )}
        </section>
        <section className="admin-panel popular-panel">
          <div className="admin-panel-head">
            <div><span className="eyebrow">YOUR COLLECTION</span><h2><Link to="/admin/products" className="overview-title-link">Popular products</Link></h2></div>
            <Link to="/admin/products">View all →</Link>
          </div>
          {[...products].sort((a, b) => (b.reviews || 0) - (a.reviews || 0)).slice(0, 4).map((product, index) => (
            <Link to="/admin/products" className="popular-row" key={product.id} style={{ textDecoration: 'none', color: 'inherit' }} title="View in Products catalog">
              <span className="popular-rank">0{index + 1}</span>{product.image ? <img src={product.image} alt="" /> : <span className="admin-image-placeholder" aria-label="No product image">No image</span>}
              <span><b>{product.name}</b><small>{product.category}</small></span><strong>{money(product.price)}</strong>
            </Link>
          ))}
        </section>
      </div>
    </>
  )
}

export default Dashboard
