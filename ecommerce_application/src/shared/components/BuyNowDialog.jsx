import { useState } from 'react'
import { money } from '../utils/format.js'

export function BuyNowDialog({ product, initialQuantity = 1, onCancel, onConfirm }) {
  const availableStock = Math.max(0, product.stock || 0)
  const [quantity, setQuantity] = useState(() =>
    Math.max(1, Math.min(Number(initialQuantity) || 1, availableStock || 1))
  )

  return (
    <div
      className="confirmation-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <section
        className="confirmation-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="buy-now-title"
        aria-describedby="buy-now-desc"
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel()
        }}
        style={{ width: "min(460px, 100%)" }}
      >
        <span className="eyebrow">EXPRESS CHECKOUT</span>
        <h2 id="buy-now-title">Buy Now?</h2>
        <p id="buy-now-desc" style={{ marginBottom: "1rem" }}>
          Please confirm you would like to proceed directly to checkout with this item.
        </p>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            padding: "0.85rem",
            background: "#f9f8f4",
            borderRadius: "6px",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          {product.image && (
            <img
              src={product.image}
              alt=""
              style={{
                width: "70px",
                height: "70px",
                objectFit: "cover",
                borderRadius: "4px",
                border: "1px solid #e7e5dc",
              }}
            />
          )}
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: "0 0 0.2rem", fontSize: "1rem", color: "#252b22" }}>
              {product.name}
            </h3>
            <span style={{ fontSize: "0.8rem", color: "#777", display: "block" }}>
              {product.brand} · {product.category}
            </span>
            <strong style={{ fontSize: "0.95rem", color: "#384633" }}>
              {money(product.price)}
            </strong>
          </div>
        </div>

        {availableStock > 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.25rem",
              padding: "0.5rem 0.85rem",
              border: "1px solid #e7e5dc",
              borderRadius: "4px",
            }}
          >
            <div>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, display: "block" }}>Quantity</span>
              <small style={{ color: availableStock <= 5 ? "#b83232" : "#2e6f40", fontSize: "0.75rem" }}>
                {availableStock} available in stock
              </small>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                type="button"
                className="button button-light"
                style={{ minHeight: "32px", padding: "0 10px", fontSize: "14px" }}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span style={{ minWidth: "24px", textAlign: "center", fontWeight: 600, fontSize: "0.95rem" }}>
                {quantity}
              </span>
              <button
                type="button"
                className="button button-light"
                style={{ minHeight: "32px", padding: "0 10px", fontSize: "14px" }}
                onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                disabled={quantity >= availableStock}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <div style={{ textAlign: "right" }}>
              <small style={{ display: "block", color: "#777", fontSize: "0.75rem" }}>Total</small>
              <strong style={{ fontSize: "0.95rem", color: "#384633" }}>
                {money(product.price * quantity)}
              </strong>
            </div>
          </div>
        ) : (
          <p style={{ color: "#b83232", fontSize: "0.85rem", margin: "1rem 0" }}>
            This product is currently out of stock.
          </p>
        )}

        <div className="confirmation-dialog-actions">
          <button
            type="button"
            className="button button-light"
            autoFocus
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button-dark"
            disabled={availableStock <= 0}
            onClick={() => onConfirm(quantity)}
          >
            Confirm & Checkout · {money(product.price * Math.min(quantity, availableStock || 1))}
          </button>
        </div>
      </section>
    </div>
  )
}

export default BuyNowDialog
