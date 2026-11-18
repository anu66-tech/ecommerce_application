import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { money } from '../utils/format.js'

export function ProductCard({ product, wished, onWish, onAdd, onBuyNow }) {
  return (
    <article className="product-card">
      <div className={`product-photo photo-${product.color}`}>
        <Link
          to={`/products/${product.id}`}
          aria-label={`View ${product.name}`}
        >
          {product.image ? (
            <img src={product.image} alt={product.name} loading="lazy" />
          ) : (
            <span className="product-image-placeholder">
              Image added by admin
            </span>
          )}
        </Link>
        {product.badge && (
          <span className="product-badge">{product.badge}</span>
        )}
        <button
          className={`wish-button ${wished ? "is-wished" : ""}`}
          onClick={() => onWish(product.id)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Icon name="heart" size={18} />
        </button>
      </div>
      <div className="product-meta">
        <span>{product.brand || product.category}</span>
        <span className="product-rating">
          ★ {(product.rating ?? 0).toFixed(1)}
        </span>
      </div>
      <Link className="product-name" to={`/products/${product.id}`}>
        {product.name}
      </Link>
      <div className="product-price">
        {money(product.price)}
        {product.oldPrice && <del>{money(product.oldPrice)}</del>}
      </div>
      <div className="product-card-actions">
        <Link to={`/products/${product.id}`}>View</Link>
        <button disabled={!product.stock} onClick={() => onAdd(product.id)}>
          Add to bag <span>+</span>
        </button>
      </div>
      <button
        className="product-buy-now"
        type="button"
        disabled={!product.stock}
        onClick={() => onBuyNow(product.id)}
      >
        Buy now
      </button>
    </article>
  )
}

export default ProductCard
