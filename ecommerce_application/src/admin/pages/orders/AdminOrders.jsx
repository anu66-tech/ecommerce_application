import { useState, useEffect } from 'react'
import { fetchOrdersApi, updateOrderStatusApi } from '../../../api/backend.js'
import { useStore, updateStore } from '../../../shared/store/store.js'
import { money } from '../../../shared/utils/format.js'
import { downloadCsv } from '../../../utils/csvExport.js'
import PageHeading from '../../../shared/components/PageHeading.jsx'

export function AdminOrders({ orders: propOrders }) {
  const storeOrders = useStore('orders') || []
  const [liveOrders, setLiveOrders] = useState(propOrders || storeOrders)

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    fetchOrdersApi({}, { signal: controller.signal })
      .then((res) => {
        if (!active || controller.signal.aborted) return
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : null
        if (items) setLiveOrders(items)
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !controller.signal.aborted) {
          console.error('Orders API fetch error:', err)
        }
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [])

  const orders = liveOrders.length ? liveOrders : (propOrders || storeOrders)

  const changeStatus = async (id, status) => {
    try {
      await updateOrderStatusApi(id, status)
    } catch (err) {
      console.error('Order status API update error:', err)
    }
    setLiveOrders((all) => all.map((order) => order.id === id ? { ...order, status } : order))
    updateStore('orders', (all) => (all || []).map((order) => order.id === id ? { ...order, status } : order))
  }

  const [pendingStatus, setPendingStatus] = useState(null)
  const requestStatusChange = (order, status) => {
    if (status !== order.status) setPendingStatus({ orderId: order.id, status })
  }
  const confirmStatusChange = () => {
    if (!pendingStatus) return
    changeStatus(pendingStatus.orderId, pendingStatus.status)
    setPendingStatus(null)
  }
  const exportOrders = () => downloadCsv(
    'orders.csv',
    ['Order ID', 'Customer', 'Order Date', 'Total', 'Payment', 'Status'],
    orders.map((order) => [
      order.id,
      order.customer?.name || 'Guest',
      order.createdAt ? new Date(order.createdAt).toISOString() : '',
      order.total,
      order.payment === 'paypal' ? 'PayPal' : order.payment === 'card' ? 'Card' : order.payment ?? '',
      order.status,
    ]),
  )

  return (
    <>
      <PageHeading
        eyebrow="EVERY GOOD THING, ON ITS WAY"
        title="Orders"
        action={<div className="admin-toolbar-actions"><span className="orders-total">{orders.length} total orders</span><button type="button" className="csv-export-button" onClick={exportOrders}>Export CSV</button></div>}
      />
      {orders.length ? (
        <section className="admin-panel admin-data-panel">
          <div className="admin-table-wrap">
            <table>
              <thead><tr><th>ORDER</th><th>CUSTOMER</th><th>DATE</th><th>ITEMS</th><th>TOTAL</th><th>STATUS</th></tr></thead>
              <tbody>{orders.map((order) => (
                <tr key={order.id}>
                  <td><b>#{order.id.slice(-8)}</b><small className="table-sub">{order.customer?.email || ''}</small></td>
                  <td>{order.customer?.name || 'Guest'}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>{(order.items || []).reduce((sum, item) => sum + item.quantity, 0)}</td>
                  <td><b>{money(order.total)}</b></td>
                  <td>
                    <select
                      className={`status-select status-${(order.status || '').toLowerCase()}`}
                      value={order.status}
                      onChange={(event) => requestStatusChange(order, event.target.value)}
                      aria-label={`Update status for order ${order.id}`}
                    >
                      <option>Processing</option><option>Packed</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="admin-panel admin-blank"><span>✓</span><h2>Nothing on the books just yet.</h2><p>When your first order comes in, it’ll be here waiting.</p></section>
      )}
      {pendingStatus && (
        <div className="admin-order-confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingStatus(null) }}>
          <section className="admin-order-confirm" role="alertdialog" aria-modal="true" aria-labelledby="order-status-confirm-title" aria-describedby="order-status-confirm-description" onKeyDown={(event) => { if (event.key === 'Escape') setPendingStatus(null) }}>
            <span className="eyebrow">CONFIRM ORDER UPDATE</span>
            <h2 id="order-status-confirm-title">Change this order’s status?</h2>
            <p id="order-status-confirm-description">Update order #{pendingStatus.orderId.slice(-8)} to {pendingStatus.status}?</p>
            <div className="admin-order-confirm-actions">
              <button type="button" className="button button-light" autoFocus onClick={() => setPendingStatus(null)}>Keep current status</button>
              <button type="button" className="button button-dark" onClick={confirmStatusChange}>Confirm update</button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

export default AdminOrders
