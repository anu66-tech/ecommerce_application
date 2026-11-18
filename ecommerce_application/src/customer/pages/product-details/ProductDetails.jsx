import { Link } from 'react-router-dom'
import Icon from '../../../shared/components/Icon.jsx'
import { money } from '../../../shared/utils/format.js'
import { FREE_SHIPPING_THRESHOLD } from '../../../shared/utils/constants.js'

export function ProductDetail({ product, wishlist = [], onWish, onAdd, onBuyNow }) {
  if (!product) {
    return (
      <div className="empty-state page-empty">
        <h2>That good thing went missing.</h2>
        <Link className="button button-dark" to="/products">
          Back to the shop
        </Link>
      </div>
    )
  }

  return (
    <section className="detail-page">
      <div className={`detail-photo photo-${product.color}`}>
        {product.image ? (
          <img src={product.image} alt={product.name} />
        ) : (
          <span className="product-image-placeholder">
            Image added by admin
          </span>
        )}
      </div>
      <div className="detail-copy">
        <div className="breadcrumbs">
          <Link to="/home">Home</Link>
          <span>/</span>
          <Link to="/products">Products</Link>
          <span>/</span>
          {product.category}
        </div>
        <span className="eyebrow">
          {(product.category || '').toUpperCase()} · {product.brand || "INDEPENDENT"}
        </span>
        <h1>{product.name}</h1>
        <div className="detail-rating">
          <span>★★★★★</span> {product.rating}{" "}
          <a href="#reviews">({product.reviews} reviews)</a>
        </div>
        <div className="detail-price">
          {money(product.price)}{" "}
          {product.oldPrice && <del>{money(product.oldPrice)}</del>}
        </div>
        <p className="detail-description">{product.description}</p>
        <p className="stock-message">
          <span>✳</span>{" "}
          {product.stock > 0
            ? `${product.stock} in stock — ready to make your day`
            : "Currently out of stock"}
        </p>
        <div className="detail-actions">
          <button
            disabled={!product.stock}
            className="button button-dark"
            onClick={() => onAdd(product.id)}
          >
            Add to bag — {money(product.price)} <Icon name="arrow" size={17} />
          </button>
          <button
            disabled={!product.stock}
            className="button button-light"
            onClick={() => onBuyNow(product.id)}
          >
            Buy now
          </button>
          <button
            className={`detail-wish ${wishlist.includes(product.id) ? "is-wished" : ""}`}
            onClick={() => onWish(product.id)}
            aria-label="Toggle wishlist"
          >
            <Icon name="heart" />
          </button>
        </div>
        <div className="detail-perks">
          <span>↗ Free shipping over {money(FREE_SHIPPING_THRESHOLD)}</span>
          <span>↺ 30-day easy returns</span>
          <span>♡ Thoughtfully made</span>
        </div>
        <div className="detail-accordion" id="reviews">
          <details>
            <summary>Details & materials</summary>
            <p>
              Designed to bring a little joy to the everyday. Thoughtfully
              selected materials, made to last, and packed with care.
            </p>
          </details>
          <details>
            <summary>Shipping & returns</summary>
            <p>
              Free shipping on orders over {money(FREE_SHIPPING_THRESHOLD)}. Not
              quite right? Send it back within 30 days for an easy return.
            </p>
          </details>
          <details>
            <summary>Customer reviews ({product.reviews})</summary>
            <p>
              Customers love this piece — rated {product.rating} out of 5 stars.
            </p>
          </details>
        </div>
      </div>
    </section>
  )
}

export { ProductDetail as ProductDetails }
export default ProductDetail
