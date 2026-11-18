import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchOrdersApi } from '../../../api/backend.js'
import { money } from '../../../shared/utils/format.js'
import Icon from '../../../shared/components/Icon.jsx'

export function OrdersPage({ orders: storeOrders }) {
  const [apiOrders, setApiOrders] = useState(null)

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    fetchOrdersApi({}, { signal: controller.signal })
      .then((res) => {
        if (!active || controller.signal.aborted) return
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : null
        if (items) setApiOrders(items)
      })
      .catch((err) => {
        if (err.name !== "AbortError" && !controller.signal.aborted) {
          console.error("Orders API fetch failed:", err)
        }
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [])

  const orders = apiOrders || storeOrders || []

  return (
    <section className="cart-page orders-page">
      <div className="page-title">
        <span className="eyebrow">A HISTORY OF GOOD THINGS</span>
        <h1>
          Your orders<span>.</span>
        </h1>
        <Link className="text-link" to="/products">
          Back to the shop <Icon name="arrow" size={16} />
        </Link>
      </div>
      {orders.length ? (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-head">
                <div>
                  <span className="eyebrow">ORDER PLACED</span>
                  <b>{new Date(order.createdAt).toLocaleDateString()}</b>
                </div>
                <div>
                  <span className="eyebrow">ORDER NUMBER</span>
                  <b>{order.id}</b>
                </div>
                <div>
                  <span className="eyebrow">TOTAL</span>
                  <b>{money(order.total)}</b>
                </div>
                <span
                  className={`status-pill status-${(order.status || '').toLowerCase()}`}
                >
                  {order.status}
                </span>
              </div>
              <div className="order-products">
                {(order.items || []).map((item, index) => (
                  <div key={`${item.productId}-${index}`}>
                    <img src={item.image} alt={item.name} />
                    <span>
                      {item.name} <small>Qty {item.quantity}</small>
                    </span>
                    <b>{money(item.price * item.quantity)}</b>
                  </div>
                ))}
              </div>
              <div className="order-delivery">
                Shipping to {order.customer?.name} · {order.customer?.city},{" "}
                {order.customer?.country}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">✳</span>
          <h3>No orders yet — but there's always a first.</h3>
          <p>Find something lovely to bring home.</p>
          <Link className="button button-dark" to="/products">
            Explore the shop
          </Link>
        </div>
      )}
    </section>
  )
}

export { OrdersPage as Orders }
export default OrdersPage
