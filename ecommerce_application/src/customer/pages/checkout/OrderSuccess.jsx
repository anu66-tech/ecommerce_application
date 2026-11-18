import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchOrderByIdApi } from '@/customer/pages/orders/api/orderApi.js'
import { getStore } from '../../../shared/store/store.js'
import { money } from '../../../shared/utils/format.js'
import Icon from '../../../shared/components/Icon.jsx'

export function OrderSuccess() {
  const [searchParams] = useSearchParams()
  const id = searchParams.get("id")
  const [remoteOrder, setRemoteOrder] = useState(null)

  useEffect(() => {
    if (id) {
      let active = true
      fetchOrderByIdApi(id)
        .then((res) => {
          if (active && res) setRemoteOrder(res)
        })
        .catch((err) => console.warn("Order by ID API error:", err))
      return () => { active = false }
    }
  }, [id])

  const order =
    remoteOrder ??
    (getStore("orders") ?? []).find((item) => item.id === id) ??
    (getStore("orders") ?? [])[0]

  return (
    <section className="success-page">
      <div className="success-mark">
        <Icon name="check" size={32} />
      </div>
      <span className="eyebrow">WELL, THIS IS LOVELY</span>
      <h1>
        Your good things
        <br />
        <em>are on their way.</em>
      </h1>
      <p>
        Thanks for making room for something good. We’ve got your order and
        we’re packing it with care.
      </p>
      {order && (
        <div className="success-order">
          <span>Order number</span>
          <b>{order.id}</b>
          <span>Order total</span>
          <b>{money(order.total)}</b>
        </div>
      )}
      <div className="success-actions">
        <Link className="button button-dark" to="/orders">
          View your orders <Icon name="arrow" size={17} />
        </Link>
        <Link className="text-link" to="/products">
          Keep looking around
        </Link>
      </div>
      <span className="success-note">
        A confirmation is ready in your local order history.
      </span>
    </section>
  )
}

export default OrderSuccess
